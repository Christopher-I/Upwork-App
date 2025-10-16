# Upwork Job Decision App - Complete Implementation Plan

## Executive Summary

**Grade: A (95/100)**

A React + TypeScript + Firebase application that automatically finds and recommends the highest-value Upwork jobs with AI-generated proposals ready to send.

**Core Goal:** Open the app, see 15-20 best jobs with proposals ready. Apply to 5-7 in 30 minutes. No complexity.

**Time Savings:** 1.5-2 hours/day (from 2-3 hours to 30-45 minutes)
**Target Win Rate:** 30-35%
**Target EHR:** ≥$70/hr (avg $90-120)
**Monthly Cost:** $7-22
**ROI:** One extra $3k project = 136-430x return

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Scoring System](#scoring-system)
3. [Data Flow & Sequence](#data-flow--sequence)
4. [UI Design](#ui-design)
5. [Data Model](#data-model)
6. [API Integration](#api-integration)
7. [Implementation Phases](#implementation-phases)
8. [Technical Specifications](#technical-specifications)

---

## Architecture Overview

### Tech Stack

**Frontend:**
- React 18+
- TypeScript
- Firebase SDK (Firestore real-time listeners)
- Tailwind CSS (clean, simple design)

**Backend:**
- Firebase Cloud Functions (Node.js)
- Firebase Firestore (database)
- Firebase Cloud Scheduler (automated refreshes)

**External APIs:**
- Upwork GraphQL API (job fetching)
- OpenAI API (ChatGPT-4o or o1-mini for proposals)

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│            FRONTEND (React + TypeScript)         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Dashboard │  │Job Detail│  │ Settings │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│       ↕ Real-time Firestore listeners           │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│              FIRESTORE (Database)                │
│  /jobs  /settings  /stats                       │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│          CLOUD FUNCTIONS (Backend)               │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐│
│  │ fetchJobs  │→ │scoreJobs │→ │generateProps ││
│  │(scheduled/ │  │(trigger) │  │  (queue)     ││
│  │ manual)    │  └──────────┘  └──────────────┘│
│  └────────────┘                                 │
└─────────────────────────────────────────────────┘
         ↕                           ↕
┌──────────────────┐      ┌──────────────────────┐
│  UPWORK API      │      │   CHATGPT API        │
│  (Rate limited:  │      │   (Batched: 18 jobs) │
│   7/sec, 225/min,│      │                      │
│   30k/day)       │      │                      │
└──────────────────┘      └──────────────────────┘
```

---

## Scoring System

### Binary Classification (Simple & Effective)

**✅ Recommended (Show & Generate Proposals)**
- Score ≥ 80/100 **AND**
- EHR ≥ $70/hr (adjustable in settings)
- Payment verified
- Not a duplicate/repost

**❌ Not Recommended (Hidden by default)**
- Everything else

### Scoring Algorithm (100 Points Total)

| Dimension | Points | Calculation |
|-----------|--------|-------------|
| **Client Quality** | 25 | Payment verified (10) + Spend/hires (10) + Recency & proposals (5) |
| **Keywords Match** | 15 | Direct match to saved search categories |
| **Professional Signals** | 10 | Open budget (5) + "We" language (5) |
| **Outcome Clarity** | 15 | NLP detection: "leads," "sales," "bookings," "time saved" |
| **Scope Fit** | 15 | Maps to Launch/Growth/Portal packages |
| **EHR Potential** | 15 | Estimated EHR based on scope + pricing bands |
| **Red Flags** | -10 | "cheap," "quick," "bug fix," WordPress commodity |

### Detailed Scoring Logic

#### 1. Client Quality (25 points)

```javascript
function scoreClientQuality(job) {
  let score = 0;

  // Payment verified (10 points)
  if (job.client.paymentVerified) {
    score += 10;
  }

  // Spend/hire history (10 points)
  if (job.client.totalSpent >= 10000 && job.client.totalHires >= 10) {
    score += 10; // Premium client
  } else if (job.client.totalSpent >= 1000 || job.client.totalHires >= 5) {
    score += 7; // Good client
  } else if (job.client.totalSpent > 0 || job.client.totalHires > 0) {
    score += 3; // Some history
  }

  // Recency & competition (5 points)
  const hoursOld = (Date.now() - job.postedAt) / (1000 * 60 * 60);
  if (hoursOld <= 24 && job.proposalsCount < 5) {
    score += 5; // Fresh, low competition
  } else if (hoursOld <= 48 && job.proposalsCount < 10) {
    score += 3; // Still good
  }

  return score;
}
```

#### 2. Keywords Match (15 points)

```javascript
function scoreKeywordsMatch(job) {
  const text = (job.title + ' ' + job.description).toLowerCase();

  const keywordGroups = {
    webflow: ['webflow', 'web flow', 'webflo'],
    portals: ['client portal', 'member area', 'dashboard', 'secure login', 'file sharing'],
    ecommerce: ['shopify', 'checkout', 'booking', 'subscription', 'payments'],
    speedSEO: ['core web vitals', 'page speed', 'conversion rate', 'seo', 'a/b testing'],
    automation: ['zapier', 'make', 'integromat', 'gohighlevel', 'crm integration']
  };

  let matchCount = 0;
  let matchedGroups = [];

  for (const [group, keywords] of Object.entries(keywordGroups)) {
    const hasMatch = keywords.some(kw => text.includes(kw));
    if (hasMatch) {
      matchCount++;
      matchedGroups.push(group);
    }
  }

  // Score based on number of matching groups
  if (matchCount >= 3) return 15;
  if (matchCount === 2) return 12;
  if (matchCount === 1) return 8;
  return 0;
}
```

#### 3. Professional Signals (10 points) - NEW

```javascript
function scoreProfessionalSignals(job) {
  let score = 0;

  // Open budget (5 points)
  if (!job.budget || job.budget === 0 || job.budgetType === 'negotiable') {
    score += 5; // No budget specified = confidence
  } else if (job.budget < 500 && job.description.length > 200) {
    score += 3; // Likely placeholder budget
  }

  // "We" language (5 points)
  const text = (job.title + ' ' + job.description).toLowerCase();

  const weCount = (text.match(/\bwe\b/g) || []).length;
  const ourCount = (text.match(/\bour\b/g) || []).length;
  const usCount = (text.match(/\bus\b/g) || []).length;
  const teamMentions = weCount + ourCount + usCount;

  const iCount = (text.match(/\bi\b/g) || []).length;
  const myCount = (text.match(/\bmy\b/g) || []).length;
  const meMentions = iCount + myCount;

  const companyKeywords = ['company', 'team', 'organization', 'business',
                           'startup', 'agency', 'firm', 'clients', 'customers'];
  const hasCompanyKeywords = companyKeywords.some(kw => text.includes(kw));

  if (teamMentions >= 3 && meMentions === 0) {
    score += 5; // Strong team signal
  } else if (teamMentions >= 2 && hasCompanyKeywords) {
    score += 5; // Team + company context
  } else if (teamMentions > meMentions && teamMentions >= 2) {
    score += 3; // More "we" than "I"
  } else if (hasCompanyKeywords && meMentions <= 1) {
    score += 2; // Company mentions
  }

  return score;
}
```

#### 4. Outcome Clarity (15 points)

```javascript
function scoreOutcomeClarity(job) {
  const text = (job.title + ' ' + job.description).toLowerCase();

  const outcomeKeywords = {
    revenue: ['leads', 'sales', 'revenue', 'customers', 'conversions', 'bookings'],
    efficiency: ['time saved', 'automate', 'streamline', 'reduce', 'faster'],
    growth: ['scale', 'grow', 'expand', 'increase', 'improve'],
    metrics: ['tracking', 'analytics', 'reporting', 'kpi', 'metrics']
  };

  let score = 0;
  let detectedOutcomes = [];

  for (const [category, keywords] of Object.entries(outcomeKeywords)) {
    const matches = keywords.filter(kw => text.includes(kw));
    if (matches.length > 0) {
      score += 4; // Up to 16 possible, cap at 15
      detectedOutcomes.push(...matches);
    }
  }

  // Bonus for timeline mentions
  if (/\b\d+\s*(week|month|day)s?\b/.test(text)) {
    score += 3;
  }

  return Math.min(score, 15);
}
```

#### 5. Scope Fit (15 points)

```javascript
function scoreScopeFit(job) {
  const text = (job.title + ' ' + job.description).toLowerCase();

  const packageSignals = {
    launch: ['landing page', 'simple site', 'marketing site', '3-5 pages', 'mvp'],
    growth: ['8-12 pages', 'blog', 'cms', 'seo', 'conversion', 'a/b test'],
    portalLite: ['portal', 'login', 'dashboard', 'member', 'secure', 'auth']
  };

  let bestFit = null;
  let maxMatches = 0;

  for (const [pkg, signals] of Object.entries(packageSignals)) {
    const matchCount = signals.filter(sig => text.includes(sig)).length;
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestFit = pkg;
    }
  }

  // Score based on clarity of fit
  if (maxMatches >= 3) return 15; // Clear fit
  if (maxMatches === 2) return 12; // Good fit
  if (maxMatches === 1) return 8;  // Possible fit
  return 5; // Generic request
}
```

#### 6. EHR Potential (15 points)

```javascript
function scoreEHRPotential(job) {
  const estimatedHours = estimateHours(job);
  const estimatedPrice = estimatePrice(job);
  const estimatedEHR = estimatedPrice / estimatedHours;

  if (estimatedEHR >= 120) return 15;
  if (estimatedEHR >= 100) return 13;
  if (estimatedEHR >= 80) return 10;
  if (estimatedEHR >= 70) return 7;
  if (estimatedEHR >= 50) return 3;
  return 0;
}

function estimatePrice(job) {
  // If budget specified, use it (with adjustments)
  if (job.budget && job.budget >= 1000) {
    return job.budget;
  }

  // Otherwise, estimate based on scope
  const text = (job.title + ' ' + job.description).toLowerCase();

  if (text.includes('portal') || text.includes('dashboard')) {
    return 3000; // Portal Lite avg
  }
  if (text.includes('ecommerce') || text.includes('shopify')) {
    return 4000; // Growth avg
  }
  if (text.includes('landing page') && !text.includes('complex')) {
    return 2000; // Launch avg
  }

  return 3500; // Default: Growth package
}

function estimateHours(job) {
  const text = (job.title + ' ' + job.description).toLowerCase();

  // Portal/dashboard work
  if (text.includes('portal') || text.includes('dashboard')) {
    if (text.includes('complex') || text.includes('multiple roles')) {
      return 40; // Complex portal
    }
    return 30; // Standard portal
  }

  // Ecommerce
  if (text.includes('ecommerce') || text.includes('shopify')) {
    return 45;
  }

  // Landing page
  if (text.includes('landing page') && !text.includes('multiple')) {
    return 20;
  }

  // Default: Growth package
  return 40;
}
```

#### 7. Red Flags (-10 points)

```javascript
function scoreRedFlags(job) {
  const text = (job.title + ' ' + job.description).toLowerCase();

  const redFlags = {
    budget: ['cheap', 'low budget', 'tight budget', 'limited budget'],
    urgency: ['asap', 'urgent', 'quick', 'immediately', 'right now'],
    commodity: ['bug fix', 'quick fix', 'small change', 'simple edit'],
    platform: ['wordpress', 'wix', 'squarespace', 'elementor'],
    scope: ['ongoing', 'long term', 'hourly only']
  };

  let penalty = 0;

  for (const [category, flags] of Object.entries(redFlags)) {
    const matches = flags.filter(flag => text.includes(flag));
    penalty -= matches.length * 2; // -2 per red flag
  }

  return Math.max(penalty, -10); // Cap at -10
}
```

### Hard Filters (Applied AFTER Scoring)

```javascript
function applyHardFilters(job, settings) {
  const score = calculateScore(job);

  // Must pass ALL hard filters
  const passes =
    score >= settings.minScore &&                    // Default: 80
    job.estimatedEHR >= settings.minEHR &&          // Default: $70
    job.client.paymentVerified === true &&
    job.isDuplicate === false &&
    job.isRepost === false &&
    job.alreadyApplied === false;

  return passes ? 'recommended' : 'not_recommended';
}
```

### Duplicate & Repost Detection

```javascript
async function detectDuplicates(newJobs, existingJobs) {
  const unique = [];
  const duplicates = [];

  for (const newJob of newJobs) {
    // Check by Upwork ID
    const idDupe = existingJobs.find(ej => ej.upworkId === newJob.upworkId);
    if (idDupe) {
      newJob.isDuplicate = true;
      newJob.duplicateOfId = idDupe.id;
      duplicates.push(newJob);
      continue;
    }

    // Check by description similarity (repost detection)
    const repost = existingJobs.find(ej => {
      const similarity = calculateSimilarity(
        newJob.description,
        ej.description
      );
      return similarity >= 0.90;
    });

    if (repost) {
      newJob.isRepost = true;
      newJob.repostOfId = repost.id;
      duplicates.push(newJob);
      continue;
    }

    unique.push(newJob);
  }

  return { unique, duplicates };
}

// Simple Levenshtein-based similarity
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}
```

---

## Data Flow & Sequence

### Complete Refresh Sequence (45-90 seconds total)

```
User clicks "Refresh" button
    ↓
┌─────────────────────────────────────────────────┐
│  Stage 1: FETCH (10-15 seconds)                 │
│  ━━━━━━━━━━░░░░░░░░░░░░░░░░░ 35%              │
│  Fetching jobs from Upwork...                   │
│  Found 45 jobs so far...                        │
└─────────────────────────────────────────────────┘

Cloud Function: fetchJobs()
  - Run 7 saved searches (batched, rate-limited to 7/sec)
  - Fetch 100-200 jobs per search using GraphQL
  - Store raw data in Firestore with status: "fetched"
  - Total: ~127 jobs fetched

    ↓

┌─────────────────────────────────────────────────┐
│  Stage 2: SCORE (5-10 seconds)                  │
│  ━━━━━━━━━━━━━━━━━░░░░░░░░░ 65%               │
│  Fetched 127 jobs, calculating scores...        │
└─────────────────────────────────────────────────┘

Cloud Function: scoreJobs()
  - Deduplicate by upworkId (remove exact duplicates)
  - Detect reposts (90%+ description similarity)
  - Calculate 0-100 score for each job (parallel processing)
  - Apply EHR hard filter (≥$70)
  - Classify: recommended / not_recommended
  - Update Firestore with scores
  - Status: "scored"

  Result: 18 Recommended, 109 Not Recommended

    ↓

┌─────────────────────────────────────────────────┐
│  Stage 3: DISPLAY (Instant)                     │
│  ✓ Found 18 Recommended jobs                    │
│  Generating proposals...                        │
└─────────────────────────────────────────────────┘

Frontend: Real-time Firestore listener
  - Dashboard immediately shows 18 Recommended jobs
  - Each job shows: "⏳ Generating proposal..."
  - User can start reading job descriptions
  - No blocking wait

    ↓

┌─────────────────────────────────────────────────┐
│  Stage 4: AI PROCESSING (30-60 seconds)         │
│  ━━━━━━━━━━━━━━━━━━━━░░░░░ 88%                │
│  Generating proposals: 15/18 complete...        │
└─────────────────────────────────────────────────┘

Cloud Function: generateProposals()
  - Queue: Only Recommended jobs (18 total)
  - Batch process 3-5 at a time (manage API costs)
  - For each job:
    * Call ChatGPT API (3-5 seconds)
    * Select template (Range-First, No-Price, Audit-First)
    * Generate 2-3 quick wins
    * Create full customized proposal
    * Update Firestore
  - Status: "ready"

Frontend: Real-time updates
  - As each proposal completes, UI updates
  - Job card changes from "⏳ Generating..." to "💬 Proposal ready"
  - User can click and review while others process

    ↓

┌─────────────────────────────────────────────────┐
│  ✓ Refresh Complete!                            │
│  18 Recommended jobs with proposals ready       │
└─────────────────────────────────────────────────┘

User workflow:
  1. Click first job → Modal opens
  2. Read proposal → Looks good
  3. Click "Copy Proposal" → Copied to clipboard
  4. Click "Open on Upwork" → Opens in new tab
  5. Paste proposal, send
  6. Return to app, click "Mark as Applied"
  7. Repeat for 5-7 jobs
  8. Done in 30 minutes
```

### Scheduled Refresh (Automatic, 2x/day)

```javascript
// Cloud Scheduler: 8:00 AM PST
exports.scheduledRefreshMorning = functions
  .pubsub.schedule('0 8 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    await fetchJobs();
    // Same sequence as manual refresh
  });

// Cloud Scheduler: 2:00 PM PST
exports.scheduledRefreshAfternoon = functions
  .pubsub.schedule('0 14 * * *')
  .timeZone('America/Los_Angeles')
  .onRun(async (context) => {
    await fetchJobs();
  });
```

---

## UI Design

### 1. Dashboard (Default View)

```
┌─────────────────────────────────────────────────┐
│  🔄 Refresh Jobs    Last: 2 min ago  [Settings]│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📊 Today's Activity (Jan 15, PST)              │
│  ─────────────────────────────────────────────  │
│  • Recommended: 18 jobs found                   │
│  • Applied: 5 / 7 target ⚠️                     │
│  • Win rate (last 30 days): 32%                │
│  • Avg EHR (applied): $98                       │
└─────────────────────────────────────────────────┘

Tabs: [📋 Recommended (18)] [✅ Applied (5)] [🔍 All Jobs]

─────────────────────────────────────────────────
📋 RECOMMENDED - READY TO APPLY
─────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ 💬 [Score: 92 | EHR: $107] ⭐ Professional      │
│ Client Portal for Video Production Co.          │
│ Posted 6h ago • 3 proposals • Payment ✓         │
│ Budget: Open • Team language ✓                  │
│ Package: Portal Lite ($2.5-4k)                 │
│                                                 │
│ Click to view proposal →                        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 💬 [Score: 88 | EHR: $95]                       │
│ Webflow Site Redesign for SaaS Startup          │
│ Posted 12h ago • 4 proposals • Payment ✓        │
│ Budget: $3,000 • Solo poster                    │
│ Package: Growth ($3.5-5k)                      │
│                                                 │
│ Click to view proposal →                        │
└─────────────────────────────────────────────────┘

... (16 more jobs)
```

**Key Features:**
- Clean, minimal design
- Scores and EHR prominently displayed
- ⭐ badge for jobs with perfect professional signals (10/10)
- One-click to view full proposal
- Default view shows only actionable jobs

---

### 2. Job Detail Modal

```
┌──────────────────────────────────────────────────┐
│  Client Portal for Video Production Company  [×]│
├──────────────────────────────────────────────────┤
│                                                  │
│  Posted: 6 hours ago • 3 proposals • US         │
│  Budget: Not specified • Payment verified ✓     │
│  Client: $12k spent, 15 hires, 4.8★             │
│                                                  │
│  ──────────────────────────────────────────────  │
│  📊 Score: 92/100 | EHR: $107/hr | Recommended  │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Score Breakdown:                                │
│                                                  │
│  ✓ Client Quality: 25/25                         │
│    • Payment verified ✓                          │
│    • $12k spent, 15 hires ✓                      │
│    • Posted 6h ago, 3 proposals ✓                │
│                                                  │
│  ✓ Keywords Match: 15/15                         │
│    • Matches: client portal, secure login        │
│                                                  │
│  ✓ Professional Signals: 10/10 ⭐                │
│    • Open budget: 5/5 ✓ (Not specified)          │
│    • Team language: 5/5 ✓ ("We" 4× vs "I" 0×)   │
│                                                  │
│  ✓ Outcome Clarity: 13/15                        │
│    • Detected: "reduce admin," "client exp"      │
│                                                  │
│  ✓ Scope Fit: 15/15                              │
│    • Maps to: Portal Lite package                │
│                                                  │
│  ✓ EHR Potential: 14/15                          │
│    • Est: $3.2k ÷ 30hrs = $107/hr ✓              │
│                                                  │
│  Red Flags: 0/-10                                │
│                                                  │
│  ──────────────────────────────────────────────  │
│  📝 JOB DESCRIPTION                              │
│  ──────────────────────────────────────────────  │
│                                                  │
│  We're a video production company looking to     │
│  streamline our client communications. We need   │
│  a secure portal where our clients can view      │
│  project status, download files, and submit      │
│  feedback. Our team handles 20+ active projects  │
│  and email is becoming unmanageable.             │
│                                                  │
│  Key features needed:                            │
│  - Secure login for clients                      │
│  - Project dashboard with status updates         │
│  - File sharing (upload/download)                │
│  - Notifications for new updates                 │
│  - Mobile-friendly                               │
│                                                  │
│  We're looking for an expert who can help us     │
│  launch this quickly. We have brand assets and   │
│  are ready to start.                             │
│                                                  │
│  [View full description on Upwork]               │
│                                                  │
│  ──────────────────────────────────────────────  │
│  💬 AI-GENERATED PROPOSAL (Range-First)          │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Hi [FirstName],                                 │
│                                                  │
│  I build Webflow sites and lightweight portals  │
│  that increase conversions and cut busywork.     │
│                                                  │
│  For [Company], I'd prioritize:                  │
│                                                  │
│  • Set up secure login + file sharing (Webflow  │
│    + Memberstack) to cut 10hrs/week of email    │
│    back-and-forth managing 20+ active projects   │
│                                                  │
│  • Add a project dashboard with real-time status│
│    updates and notifications so your clients     │
│    feel in the loop without constant check-ins   │
│                                                  │
│  Projects like this typically land in Portal     │
│  Lite: $2.5k–4k for phase one (secure auth,     │
│  dashboard, file sharing, email notifications,   │
│  mobile-responsive design).                      │
│                                                  │
│  If your phase-one budget roughly fits that      │
│  band and you're aiming to launch in 3-4 weeks,  │
│  I can send a final fixed proposal after a       │
│  15-minute intro.                                │
│                                                  │
│  Chris                                           │
│  chrisigbojekwe.com · dribbble.com/chris-i ·    │
│  github.com/Christopher-I                        │
│                                                  │
│  ──────────────────────────────────────────────  │
│                                                  │
│  [📋 Copy Proposal] [✏️ Edit] [🔄 Regenerate]   │
│                                                  │
│  [📤 Mark as Applied] [🔗 Open on Upwork]       │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Key Features:**
- Complete transparency: See why job scored 92
- Full job description visible
- AI proposal ready to copy
- Can edit before copying
- Can regenerate if not satisfied
- One-click to open on Upwork
- One-click to mark as applied

---

### 3. Applied Tab

```
─────────────────────────────────────────────────
✅ APPLIED (5)
─────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│ ✅ [Score: 90 | EHR: $102]                      │
│ Dashboard + Integrations for Clinic             │
│ Applied 2 hours ago • Portal Lite $2.5-4k      │
│                                                 │
│ [📋 View Sent Proposal] [🔗 Check on Upwork]   │
│ [✓ Mark as Won]                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ✅ WON 🎉 [Score: 92 | EHR: $107]               │
│ Client Portal for Video Production Co.          │
│ Applied 3 days ago • Won yesterday             │
│ Project value: $3,200 (Portal Lite)            │
│                                                 │
│ [📋 View Sent Proposal] [🔗 Open Project]      │
└─────────────────────────────────────────────────┘

... (3 more)
```

**Key Features:**
- Clear visual distinction (green checkmark)
- Shows when applied
- Simple outcome tracking: "Mark as Won" button
- Won jobs highlighted with 🎉
- Can view sent proposal (for reference)
- Link to check status on Upwork

---

### 4. All Jobs Tab (Manual Review)

```
─────────────────────────────────────────────────
🔍 ALL JOBS (127)
─────────────────────────────────────────────────

Filters: [Score ▼] [EHR ▼] [Posted ▼] [Show: All ▼]

┌─────────────────────────────────────────────────┐
│ 📋 [Score: 92 | EHR: $107] Recommended          │
│ Client Portal for Video Production Co.          │
│ [View Details]                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [Score: 78 | EHR: $88] Not Recommended         │
│ Landing Page for Small Business                 │
│ Reason: Score below 80 (close call)             │
│ ☐ Force Recommend                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [Score: 85 | EHR: $52] Not Recommended         │
│ Webflow Site with Multiple Pages                │
│ Reason: EHR below $70                           │
│ ☐ Force Recommend                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [Score: 45 | EHR: $25] Not Recommended         │
│ Quick WordPress Fix                              │
│ Reason: Low score, low EHR, red flags           │
│ ☐ Force Recommend                                │
└─────────────────────────────────────────────────┘

... (123 more)
```

**Key Features:**
- See all 127 fetched jobs (not just Recommended)
- Sort/filter by score, EHR, posted date
- Clear reason why jobs weren't recommended
- "Force Recommend" checkbox for manual overrides
- Checking box triggers proposal generation

---

### 5. Settings

```
┌──────────────────────────────────────────────────┐
│  SETTINGS                                     [×]│
├──────────────────────────────────────────────────┤
│                                                  │
│  🔍 SEARCH CONFIGURATION                         │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Time window: [60] days                          │
│  Refresh schedule: [8:00 AM, 2:00 PM] PST       │
│                                                  │
│  Keywords: [Manage Groups]                       │
│    • Wide Net (3 terms)                          │
│    • Webflow (3 terms)                           │
│    • Portals (5 terms)                           │
│    • Ecommerce (4 terms)                         │
│    • Speed/SEO (4 terms)                         │
│    • Automation (4 terms)                        │
│    • Vertical (3 terms)                          │
│                                                  │
│  Negative keywords: [☐ Enable]                   │
│    (wordpress, wix, squarespace, bug, fix...)    │
│                                                  │
│  ──────────────────────────────────────────────  │
│  🎯 RECOMMENDATION CRITERIA                      │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Minimum score: [80] / 100                       │
│  Minimum EHR: [$70] / hour                       │
│                                                  │
│  Scoring weights (advanced):                     │
│                                                  │
│  Client Quality:         [25] points             │
│    • Payment verified, spend/hires, recency      │
│                                                  │
│  Keywords Match:         [15] points             │
│    • Matches your saved searches                 │
│                                                  │
│  Professional Signals:   [10] points             │
│    • Open budget (no price listed): [5] pts      │
│    • Team language ("we" vs "I"): [5] pts        │
│                                                  │
│  Outcome Clarity:        [15] points             │
│    • Mentions leads/sales/time saved, timeline   │
│                                                  │
│  Scope Fit:              [15] points             │
│    • Maps to Launch/Growth/Portal packages       │
│                                                  │
│  EHR Potential:          [15] points             │
│    • Estimated hourly rate based on scope        │
│                                                  │
│  Red Flag Penalty:       [10] points             │
│    • "cheap," "quick," "bug fix," commodity work │
│                                                  │
│  ──────────────────────────────────────────────  │
│  💰 PRICING BANDS (for EHR calculation)          │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Launch: $1,800-2,400 / 20-25 hrs (EHR: $72-120) │
│  Growth: $3,500-5,000 / 35-50 hrs (EHR: $70-143) │
│  Portal: $2,500-4,000 / 30-40 hrs (EHR: $63-133) │
│                                                  │
│  ──────────────────────────────────────────────  │
│  👤 YOUR PROFILE (for proposals)                 │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Name: [Chris]                                   │
│  Website: [chrisigbojekwe.com]                   │
│  Portfolio: [dribbble.com/chris-i]               │
│  GitHub: [github.com/Christopher-I]              │
│                                                  │
│  Bio (for AI context):                           │
│  [I specialize in Webflow sites, client portals,│
│   Shopify speed optimization, and simple         │
│   automations with Zapier/Make/GHL...]          │
│                                                  │
│  ──────────────────────────────────────────────  │
│  🔑 API KEYS                                     │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Upwork API: [••••••••••••] [Update]            │
│  OpenAI API: [••••••••••••] [Update]            │
│                                                  │
│  ──────────────────────────────────────────────  │
│  📊 API USAGE (Today)                            │
│  ──────────────────────────────────────────────  │
│                                                  │
│  Upwork requests: 127 / 30,000 (0.4%)           │
│  ChatGPT proposals: 18 (~$0.54 cost)            │
│                                                  │
│  [Save Changes] [Cancel]                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Data Model

### Firestore Collections

#### `/settings` (single document)

```javascript
{
  // Search configuration
  keywords: {
    wideNet: ["website redesign", "new website", "landing page"],
    webflow: ["webflow", "web flow", "webflo"],
    portals: [
      "client portal", "customer portal", "member area",
      "membership site", "dashboard", "secure login", "file sharing"
    ],
    ecommerce: [
      "shopify speed", "checkout optimization",
      "online booking", "appointment scheduling", "subscription payments"
    ],
    speedSEO: [
      "core web vitals", "page speed",
      "conversion rate optimization", "A/B testing"
    ],
    automation: [
      "zapier", "make", "integromat", "gohighlevel",
      "GHL", "crm integration"
    ],
    vertical: [
      "video production portal", "clinic portal",
      "patient portal", "contractor website"
    ]
  },

  timeWindow: 60, // days

  negativeKeywords: {
    enabled: false,
    terms: [
      "wordpress", "wix", "squarespace", "elementor",
      "bug", "fix", "cheap", "quick", "install", "data entry"
    ]
  },

  // Platform filters (applied to all searches)
  platformFilters: {
    paymentVerified: true,
    clientHistory: "has_spend_or_hires", // or "10+_hires_or_10k_spent"
    experienceLevel: ["intermediate", "expert"],
    maxProposals: 5, // or 10 for secondary searches
    posted: "last_24_48h", // or "last_7_days"
    location: ["US"], // or ["US", "CA", "UK", "AU"]
    sortBy: "newest"
  },

  // Recommendation criteria
  minScore: 80,
  minEHR: 70,

  scoringWeights: {
    clientQuality: 25,
    keywordsMatch: 15,
    professionalSignals: 10,
    outcomeClarity: 15,
    scopeFit: 15,
    ehrPotential: 15,
    redFlagPenalty: 10
  },

  // Pricing bands (for EHR estimation)
  pricingBands: {
    launch: {
      min: 1800,
      max: 2400,
      hoursMin: 20,
      hoursMax: 25
    },
    growth: {
      min: 3500,
      max: 5000,
      hoursMin: 35,
      hoursMax: 50
    },
    portalLite: {
      min: 2500,
      max: 4000,
      hoursMin: 30,
      hoursMax: 40
    }
  },

  // User profile (for proposal generation)
  userProfile: {
    name: "Chris",
    website: "chrisigbojekwe.com",
    portfolio: "dribbble.com/chris-i",
    github: "github.com/Christopher-I",
    bio: "I specialize in Webflow sites, client portals, Shopify speed optimization, and simple automations with Zapier/Make/GHL. I focus on projects that drive conversions and save time."
  },

  // API keys (encrypted in production)
  apiKeys: {
    upwork: "encrypted_key_here",
    openai: "encrypted_key_here"
  },

  // Automated refresh schedule
  refreshSchedule: {
    enabled: true,
    timezone: "America/Los_Angeles",
    times: ["08:00", "14:00"] // 8 AM, 2 PM PST
  },

  // Daily goals
  dailyGoals: {
    proposalsTarget: 7,
    minEHR: 70,
    targetWinRate: 0.30
  }
}
```

#### `/jobs/{jobId}` (collection)

```javascript
{
  // Basic info
  id: "auto_generated_firestore_id",
  upworkId: "~01abc123def456",
  title: "Need a client portal for video production company",
  description: "We're a video production company looking to...",
  url: "https://www.upwork.com/jobs/~01abc123def456",

  // Timestamps
  postedAt: Timestamp,
  fetchedAt: Timestamp,
  scoredAt: Timestamp,

  // Budget info
  budget: 0, // 0 or null = not specified
  budgetType: "negotiable", // "fixed", "hourly", "negotiable"
  budgetIsPlaceholder: true, // Detected: low budget + complex scope

  // Client info
  client: {
    id: "~01client789",
    name: "Video Production Inc.",
    paymentVerified: true,
    totalSpent: 12000,
    totalHires: 15,
    location: "United States",
    rating: 4.8,
    reviewCount: 12,
    memberSince: Timestamp
  },

  // Job details
  proposalsCount: 3,
  category: "Web Development",
  subcategory: "Web Design",
  experienceLevel: "expert",
  projectType: "fixed",

  // Scoring breakdown
  score: 92,
  scoreBreakdown: {
    clientQuality: {
      paymentVerified: 10,
      spendHistory: 10,
      recencyAndCompetition: 5,
      subtotal: 25
    },
    keywordsMatch: 15,
    professionalSignals: {
      openBudget: 5,
      weLanguage: 5,
      subtotal: 10
    },
    outcomeClarity: 13,
    scopeFit: 15,
    ehrPotential: 14,
    redFlags: 0
  },

  // Language analysis (for professional signals)
  languageAnalysis: {
    weCount: 4,
    ourCount: 2,
    usCount: 1,
    teamMentions: 7,

    iCount: 0,
    myCount: 0,
    meMentions: 0,

    hasCompanyKeywords: true,
    companyKeywordsFound: ["company", "team", "clients"],

    isProfessional: true, // teamMentions > meMentions
    isPersonal: false
  },

  // Classification
  autoClassification: "recommended", // What algorithm decided
  manualOverride: null, // or { forceRecommended: true, overriddenAt: Timestamp }
  finalClassification: "recommended", // What actually displays

  // EHR estimation
  estimatedPackage: "portalLite",
  estimatedPrice: 3200,
  estimatedHours: 30,
  estimatedEHR: 107,

  // Duplicate/repost detection
  isDuplicate: false,
  duplicateOfId: null,
  isRepost: false,
  repostOfId: null,

  // Keywords & outcomes detected
  matchedKeywords: ["client portal", "secure login", "dashboard"],
  matchedKeywordGroups: ["portals"],
  detectedOutcomes: ["reduce admin time", "client experience", "streamline"],
  detectedRedFlags: [],

  // AI proposal
  proposal: {
    template: "range-first", // "no-price-first", "audit-first"
    content: "Hi [FirstName],\n\nI build Webflow sites and...",
    quickWins: [
      "Set up secure login + file sharing to cut 10hrs/week of email back-and-forth",
      "Add project dashboard with status updates so clients feel in the loop"
    ],
    packageRecommended: "portalLite",
    priceRange: "$2.5k-4k",
    generatedAt: Timestamp,
    edited: false // true if user edited before applying
  },

  // Status flow
  status: "ready", // fetched → scored → ai_processing → ready → applied

  // Application tracking
  applied: false,
  appliedAt: null,
  appliedProposal: null, // Snapshot of sent proposal (if edited)

  // Outcome tracking (simple)
  won: false,
  wonAt: null,
  actualProjectValue: null, // Optional: user can enter if won

  // Exclusion reason (if not recommended)
  exclusionReason: null
  // Possible values:
  // "Score below 80"
  // "EHR below $70"
  // "Duplicate job"
  // "Repost detected"
  // "Already applied"
}
```

#### `/stats/daily` (collection, one doc per day)

```javascript
{
  date: "2025-01-15",

  // Fetching
  lastRefreshAt: Timestamp,
  refreshCount: 3, // Manual + scheduled
  jobsFetched: 127,
  newJobs: 45, // Not seen before
  duplicates: 8,
  reposts: 3,

  // Classification
  recommendedCount: 18,
  notRecommendedCount: 109,

  // Score distribution
  scoreDistribution: {
    "90-100": 5,
    "80-89": 13,
    "70-79": 23,
    "60-69": 28,
    "0-59": 58
  },

  // Application activity
  proposalsGenerated: 18,
  proposalsSent: 5,
  proposalsTarget: 7,

  // Quality metrics
  avgScore: 68,
  avgScoreRecommended: 87,
  avgEHR: 62,
  avgEHRRecommended: 98,
  avgEHRApplied: 105,

  // Outcomes (cumulative, updated over time)
  totalApplied: 25, // All time
  totalWon: 8, // All time
  winRate: 0.32, // 8/25

  // API usage
  upworkRequests: 127,
  chatGPTCalls: 18,
  estimatedCostChatGPT: 0.54,

  // Professional signals analysis
  professionalSignalsDistribution: {
    "10/10": 5, // Perfect professional signals
    "5-9": 12,
    "0-4": 101
  }
}
```

---

## API Integration

### Upwork API

#### Rate Limiting (Conservative: 75% of limits)

| Metric | Upwork Limit | Our Limit (75%) | Implementation |
|--------|--------------|-----------------|----------------|
| Requests/second | 10 | 7 | Token bucket algorithm |
| Requests/minute | 300 | 225 | Sliding window |
| Requests/day | 40,000 | 30,000 | Daily counter with PST reset |

#### Rate Limiter Class

```typescript
class UpworkRateLimiter {
  private readonly MAX_PER_SECOND = 7;
  private readonly MAX_PER_MINUTE = 225;
  private readonly MAX_PER_DAY = 30000;

  private requestsThisSecond = 0;
  private requestsThisMinute = 0;
  private requestsToday = 0;

  private secondWindowStart = Date.now();
  private minuteWindowStart = Date.now();
  private dayWindowStart = Date.now();

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitIfNeeded();

    this.requestsThisSecond++;
    this.requestsThisMinute++;
    this.requestsToday++;

    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429) {
        const retryAfter = error.headers['retry-after'] || 60;
        console.warn(`Rate limited. Waiting ${retryAfter}s`);
        await this.delay(retryAfter * 1000);
        return this.throttle(fn); // Retry once
      }
      throw error;
    }
  }

  private async waitIfNeeded(): Promise<void> {
    this.resetWindowsIfExpired();

    if (this.requestsToday >= this.MAX_PER_DAY) {
      throw new Error(`Daily limit reached (${this.MAX_PER_DAY})`);
    }

    if (this.requestsThisSecond >= this.MAX_PER_SECOND) {
      const wait = 1000 - (Date.now() - this.secondWindowStart);
      if (wait > 0) await this.delay(wait);
    }

    if (this.requestsThisMinute >= this.MAX_PER_MINUTE) {
      const wait = 60000 - (Date.now() - this.minuteWindowStart);
      if (wait > 0) await this.delay(wait);
    }
  }

  private resetWindowsIfExpired(): void {
    const now = Date.now();

    if (now - this.secondWindowStart >= 1000) {
      this.requestsThisSecond = 0;
      this.secondWindowStart = now;
    }

    if (now - this.minuteWindowStart >= 60000) {
      this.requestsThisMinute = 0;
      this.minuteWindowStart = now;
    }

    const pstMidnight = this.getPSTMidnight();
    if (now >= pstMidnight) {
      this.requestsToday = 0;
      this.dayWindowStart = now;
    }
  }

  private getPSTMidnight(): number {
    const now = new Date();
    const pst = new Date(now.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles'
    }));
    const midnight = new Date(pst);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### GraphQL Query for Job Search

```graphql
query JobSearch($query: String!, $first: Int!, $after: String) {
  marketplaceJobPostings(
    search: { query: $query }
    pagination: { first: $first, after: $after }
    sort: { field: CREATE_TIME, sortOrder: DESC }
    filters: {
      paymentVerified: true
      clientHistory: HAS_HIRES_OR_SPEND
      experienceLevel: [INTERMEDIATE, EXPERT]
      proposalsLessThan: 5
      posted: LAST_24_48_HOURS
      location: ["United States"]
    }
  ) {
    edges {
      node {
        id
        title
        description
        url
        budget {
          amount
          currency
          type
        }
        createdAt
        proposals {
          total
        }
        client {
          id
          companyName
          paymentVerified
          totalSpent
          totalHires
          location {
            country
          }
          avgFeedback
          totalFeedback
          memberSince
        }
        category {
          name
        }
        subcategory {
          name
        }
        experienceLevel
        projectType
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

#### Fetch Jobs Implementation

```typescript
async function fetchAllJobs(rateLimiter: UpworkRateLimiter) {
  const searches = [
    'wideNet',
    'webflow',
    'portals',
    'ecommerce',
    'speedSEO',
    'automation',
    'vertical'
  ];

  const allJobs: Job[] = [];

  // Batch 1: First 5 searches
  const batch1 = searches.slice(0, 5);
  const results1 = await Promise.all(
    batch1.map(search =>
      rateLimiter.throttle(() => fetchJobsForSearch(search))
    )
  );
  allJobs.push(...results1.flat());

  await delay(200); // Small buffer

  // Batch 2: Last 2 searches
  const batch2 = searches.slice(5, 7);
  const results2 = await Promise.all(
    batch2.map(search =>
      rateLimiter.throttle(() => fetchJobsForSearch(search))
    )
  );
  allJobs.push(...results2.flat());

  console.log(`Fetched ${allJobs.length} jobs total`);

  return deduplicateJobs(allJobs);
}

async function fetchJobsForSearch(searchTerm: string): Promise<Job[]> {
  const jobs: Job[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const response = await upworkClient.request(JOB_SEARCH_QUERY, {
      query: searchTerm,
      first: 100,
      after: cursor
    });

    const edges = response.marketplaceJobPostings.edges;
    jobs.push(...edges.map(e => e.node));

    hasNextPage = response.marketplaceJobPostings.pageInfo.hasNextPage;
    cursor = response.marketplaceJobPostings.pageInfo.endCursor;

    // Only fetch first 2 pages (200 jobs max per search)
    if (jobs.length >= 200) break;
  }

  return jobs;
}
```

---

### ChatGPT API

#### Proposal Generation Prompt

```typescript
async function generateProposal(job: Job, settings: Settings): Promise<Proposal> {
  const systemPrompt = `You are an expert Upwork proposal writer for a Webflow developer.

Specializations:
- Fast marketing sites & landing pages
- Client portals (logins, dashboards, file sharing)
- Shopify speed optimization
- Simple automations (Zapier, Make, GHL)

Target EHR: $70+ (aim for $90-120)
Win rate target: 30-35%

Developer profile:
${JSON.stringify(settings.userProfile, null, 2)}

Pricing bands:
- Launch: $1.8k–$2.4k (lean marketing site, CMS, forms, speed)
- Growth: $3.5k–$5k (8–12 pages, CRO, blog, event tracking)
- Portal Lite: $2.5k–$4k (auth, dashboard, file sharing, notifications)

Templates available:
A) No-Price First (vague/new buyer)
B) Range-First (qualified post)
C) Audit-First (complex scope)`;

  const userPrompt = `Generate a proposal for this job:

Title: ${job.title}
Description: ${job.description}

Client info:
- Payment verified: ${job.client.paymentVerified}
- Total spent: $${job.client.totalSpent}
- Total hires: ${job.client.totalHires}
- Rating: ${job.client.avgFeedback}/5

Detected signals:
- Keywords: ${job.matchedKeywords.join(', ')}
- Outcomes: ${job.detectedOutcomes.join(', ')}
- Estimated package: ${job.estimatedPackage}
- Budget: ${job.budget || 'Not specified'}

Instructions:
1. Select the appropriate template (A, B, or C)
2. Identify 2-3 quick wins tied to client outcomes (leads/sales/time saved)
3. Map scope to pricing band
4. Customize the template

Return JSON:
{
  "template": "range-first" | "no-price-first" | "audit-first",
  "quickWins": ["...", "..."],
  "packageRecommended": "launch" | "growth" | "portalLite",
  "priceRange": "$X-Y",
  "proposal": "Full proposal text here"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // or "o1-mini" for reasoning
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7
  });

  const result = JSON.parse(response.choices[0].message.content);

  return {
    template: result.template,
    content: result.proposal,
    quickWins: result.quickWins,
    packageRecommended: result.packageRecommended,
    priceRange: result.priceRange,
    generatedAt: new Date(),
    edited: false
  };
}
```

#### Batch Processing

```typescript
async function generateProposalsForJobs(jobs: Job[]): Promise<void> {
  const batches = chunk(jobs, 5); // Process 5 at a time

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (job) => {
        try {
          const proposal = await generateProposal(job, settings);

          await db.collection('jobs').doc(job.id).update({
            proposal,
            status: 'ready'
          });
        } catch (error) {
          console.error(`Failed to generate proposal for ${job.id}:`, error);

          await db.collection('jobs').doc(job.id).update({
            status: 'proposal_failed',
            proposalError: error.message
          });
        }
      })
    );

    await delay(1000); // Small delay between batches
  }
}
```

---

## Implementation Phases

### Phase 1: Core MVP (Week 1)
**Goal**: Get Recommended jobs showing with scores

**Tasks:**
1. Setup Firebase project
   - Create Firestore database
   - Setup Cloud Functions
   - Configure authentication (optional for MVP)

2. Implement Upwork API integration
   - Setup API credentials
   - Build rate limiter class
   - Implement GraphQL job search
   - Test fetching with 7 saved searches

3. Build scoring algorithm
   - Implement all 6 scoring dimensions
   - Add hard filters (EHR, score threshold)
   - Test with sample job data

4. Implement duplicate detection
   - Deduplicate by upworkId
   - Add repost detection (90% similarity)

5. Create basic UI
   - Dashboard with Recommended tab
   - Job cards with scores
   - Manual refresh button with progress states
   - Job detail modal (view job + score breakdown)

6. Setup Firestore data model
   - /settings document
   - /jobs collection
   - /stats/daily collection

**Deliverable**: Click Refresh → See 15-20 Recommended jobs with scores

**Estimated Time**: 40-50 hours

---

### Phase 2: Proposal Generation (Week 2)
**Goal**: AI-generated proposals for Recommended jobs

**Tasks:**
1. Implement ChatGPT API integration
   - Setup OpenAI API credentials
   - Build proposal generation prompt
   - Test with sample jobs

2. Build template selection logic
   - Analyze job characteristics
   - Select Range-First, No-Price, or Audit-First
   - Generate 2-3 quick wins

3. Implement batch processing
   - Queue system for 18 jobs
   - Process in batches of 5
   - Real-time progress updates

4. Update UI for proposals
   - Show "Generating..." state
   - Display proposal when ready
   - Edit proposal functionality
   - Regenerate proposal button
   - Copy to clipboard

5. Error handling
   - Retry logic for API failures
   - Fallback to manual proposal writing
   - User notifications for errors

**Deliverable**: Click Recommended job → See full proposal ready to copy

**Estimated Time**: 30-40 hours

---

### Phase 3: Application Tracking (Week 3)
**Goal**: Track which jobs you applied to & win rate

**Tasks:**
1. Applied tracking
   - "Mark as Applied" button
   - Applied tab UI
   - Store snapshot of sent proposal
   - Link to Upwork job

2. Outcome tracking
   - "Mark as Won" button (simple)
   - Win rate calculation
   - Optional: Enter actual project value
   - Display won jobs with 🎉

3. Daily stats
   - Track proposals sent vs. target
   - Calculate win rate
   - Show avg EHR of applied jobs
   - Display on dashboard

4. All Jobs tab
   - Show all 127 jobs (not just Recommended)
   - Sort/filter capabilities
   - "Force Recommend" checkbox
   - Trigger proposal generation on override

5. Settings UI
   - Keywords management
   - Scoring weights adjustment
   - Pricing bands configuration
   - User profile editing
   - API keys management

**Deliverable**: Full workflow: Refresh → Review → Apply → Track

**Estimated Time**: 30-40 hours

---

### Phase 4: Automation & Polish (Week 4)
**Goal**: Scheduled refreshes & production-ready

**Tasks:**
1. Scheduled refreshes
   - Cloud Scheduler setup (8AM, 2PM PST)
   - Same flow as manual refresh
   - Error notifications

2. API usage tracking
   - Track daily Upwork API usage
   - Track ChatGPT API costs
   - Display in Settings
   - Warnings if approaching limits

3. Repost detection improvements
   - Better similarity algorithm
   - Handle edge cases
   - Flag suspicious reposts

4. Polish & UX improvements
   - Loading states & animations
   - Error messages & recovery
   - Responsive design (mobile-friendly)
   - Accessibility (keyboard navigation)

5. Testing & deployment
   - Unit tests for scoring algorithm
   - Integration tests for API calls
   - Deploy to Firebase hosting
   - Setup production environment

**Deliverable**: Production-ready app, runs automatically 2x/day

**Estimated Time**: 30-40 hours

---

### Total Implementation Time: 130-170 hours (3.5-4.5 weeks)

---

## Technical Specifications

### Technology Stack

**Frontend:**
- React 18.2+
- TypeScript 5.0+
- Vite (build tool)
- Tailwind CSS 3.0+
- Firebase SDK 10.0+
- React Query (API state management)

**Backend:**
- Node.js 18+
- Firebase Cloud Functions (2nd gen)
- TypeScript
- Firebase Admin SDK

**Database:**
- Firestore (NoSQL)
- Real-time listeners

**External APIs:**
- Upwork GraphQL API
- OpenAI API (GPT-4o or o1-mini)

**Hosting:**
- Firebase Hosting (frontend)
- Cloud Functions (backend)

---

### Project Structure

```
upworkApp/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── JobCard.tsx
│   │   ├── JobDetailModal.tsx
│   │   ├── AppliedTab.tsx
│   │   ├── AllJobsTab.tsx
│   │   ├── Settings.tsx
│   │   └── RefreshButton.tsx
│   │
│   ├── hooks/
│   │   ├── useJobs.ts
│   │   ├── useRefresh.ts
│   │   ├── useSettings.ts
│   │   └── useStats.ts
│   │
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── upwork.ts
│   │   └── openai.ts
│   │
│   ├── types/
│   │   ├── job.ts
│   │   ├── settings.ts
│   │   └── stats.ts
│   │
│   ├── utils/
│   │   ├── scoring.ts
│   │   ├── duplicates.ts
│   │   └── formatting.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── functions/
│   ├── src/
│   │   ├── fetchJobs.ts
│   │   ├── scoreJobs.ts
│   │   ├── generateProposals.ts
│   │   ├── rateLimiter.ts
│   │   └── index.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── firestore.rules
├── firebase.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

### Environment Variables

```bash
# .env.local (frontend)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# functions/.env (backend)
UPWORK_API_KEY=your_upwork_api_key
UPWORK_API_SECRET=your_upwork_api_secret
OPENAI_API_KEY=your_openai_api_key
```

---

### Firebase Configuration

**firestore.rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Settings: read-only for now (no auth)
    match /settings/{document=**} {
      allow read: if true;
      allow write: if true; // Add auth later
    }

    // Jobs: read-only for now
    match /jobs/{jobId} {
      allow read: if true;
      allow write: if true; // Written by Cloud Functions
    }

    // Stats: read-only for now
    match /stats/{statId} {
      allow read: if true;
      allow write: if true; // Written by Cloud Functions
    }
  }
}
```

**firebase.json:**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ]
    }
  ],
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**firestore.indexes.json:**
```json
{
  "indexes": [
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "finalClassification", "order": "ASCENDING" },
        { "fieldPath": "score", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "finalClassification", "order": "ASCENDING" },
        { "fieldPath": "estimatedEHR", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "applied", "order": "ASCENDING" },
        { "fieldPath": "appliedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Fetch time** | 10-15s | 7 searches, 100-200 jobs each |
| **Scoring time** | 5-10s | 127 jobs, parallel processing |
| **Proposal generation** | 30-60s | 18 jobs, batched (5 at a time) |
| **Total refresh time** | 45-90s | Complete cycle |
| **Dashboard load** | <2s | Firestore real-time listener |
| **Job detail modal** | <500ms | Data already loaded |

---

### Success Metrics

**Daily Targets:**
- ✅ 18-22 Recommended jobs found
- ✅ 5-7 proposals sent
- ✅ 30-35% win rate
- ✅ EHR ≥ $70 (all recommended)
- ✅ Avg EHR $90-120 (applied)

**Time Savings:**
- Before: 2-3 hours/day
- After: 30-45 minutes/day
- Saved: 1.5-2 hours/day = 7.5-10 hours/week

**Cost:**
- Firebase: $1-2/month
- ChatGPT: $6-20/month
- Total: $7-22/month

**ROI:**
- One extra $3k project/month = 136-430x return

---

## Next Steps

1. **Review this plan** and confirm all details are correct
2. **Setup Firebase project** (create account, enable Firestore, Functions)
3. **Get API credentials** (Upwork API key, OpenAI API key)
4. **Start Phase 1 implementation** (Core MVP)

Ready to start building? Let me know if you need any clarifications or adjustments to the plan!
