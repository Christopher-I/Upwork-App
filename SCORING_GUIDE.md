# Scoring Algorithm Guide

## Overview
Jobs are scored 0-100 points across 6 dimensions. Jobs scoring 80+ with EHR ≥$70 are recommended.

---

## Scoring Dimensions (100 points total)

### 1. Client Quality (25 points)
**Philosophy**: Payment verification matters most. New clients with verified payment are still great opportunities.

- **Payment Verified (15 points)** - MOST IMPORTANT
  - 15 pts: Payment method verified ✅
  - 0 pts: Not verified ❌

- **Spend/Hire History (5 points)** - Nice bonus, but not essential
  - 5 pts: Premium client ($10k+, 10+ hires)
  - 4 pts: Good history ($5k+, 5+ hires)
  - 3 pts: Some history ($1k+, 2+ hires)
  - 2 pts: First few hires (1-2 projects)
  - 1 pt: **Brand new client** (still worth pursuing!)

- **Recency & Competition (5 points)**
  - 5 pts: Posted <24h, <5 proposals
  - 3 pts: Posted <48h, <10 proposals
  - 0 pts: Older or high competition

---

### 2. Keywords Match (15 points)
**Philosophy**: Proportional scoring - each keyword adds value

- **Scoring Formula**: 5 points per keyword match
  - 1 keyword = 5 points (33%)
  - 2 keywords = 10 points (67%)
  - 3+ keywords = 15 points (100%)

- **Keyword Categories**:
  - Wide Net: "website redesign", "new website", "landing page"
  - Webflow: "webflow", "web flow", "webflo"
  - Portals: "client portal", "customer portal", "dashboard", "secure login", "file sharing"
  - Ecommerce: "shopify speed", "checkout optimization", "online booking"
  - Speed/SEO: "core web vitals", "page speed", "conversion rate optimization", "A/B testing"
  - Automation: "zapier", "make", "integromat", "gohighlevel", "crm integration"
  - Vertical: "video production portal", "clinic portal", "patient portal"

- **Partial Matching**: Multi-word phrases get 0.5 credit if all words present separately

---

### 3. Professional Signals (10 points)
**Philosophy**: Detect clients with resources and confidence

- **Open Budget (5 points)** - No price specified = confidence
  - 5 pts: Budget = $0 or "negotiable"
  - 3 pts: Suspiciously low budget (<$500) for long description (likely placeholder)
  - 0 pts: Specific budget amount

- **Team Language (5 points)** - "We" vs "I" indicates company vs individual
  - 5 pts: 3+ team mentions ("we", "our", "us") + no "I"/"my"
  - 5 pts: 2+ team mentions + company keywords
  - 3 pts: More "we" than "I" (2+ team mentions)
  - 2 pts: Company keywords present + minimal "I"
  - 0 pts: Heavy use of "I"/"my"/"me"

---

### 4. Outcome Clarity (15 points)
**Philosophy**: Clear outcomes = client knows what they want

- **Outcome Categories** (4 points each):
  - **Revenue**: leads, sales, revenue, customers, conversions, bookings, clients
  - **Efficiency**: automate, streamline, reduce, faster, communications
  - **Growth**: scale, grow, expand, increase, improve
  - **Metrics**: tracking, analytics, reporting, KPI, metrics

- **Timeline Bonus** (+3 points):
  - Mentions specific timeline (e.g., "3-4 weeks", "2 months")

- **Max**: 15 points (capped)

---

### 5. Scope Fit (15 points)
**Philosophy**: How well does the job map to our packages?

- **Package Detection**:
  - **Launch** ($1800-$2400): "landing page", "simple site", "marketing site", "mvp"
  - **Growth** ($3500-$5000): "8-12 pages", "blog", "cms", "seo", "conversion"
  - **Portal Lite** ($2500-$4000): "portal", "login", "dashboard", "member", "secure"

- **Scoring**:
  - 15 pts: 3+ signals matched (clear fit)
  - 12 pts: 2 signals matched (good fit)
  - 8 pts: 1 signal matched (possible fit)
  - 5 pts: No clear signals (generic request)

---

### 6. EHR Potential (15 points)
**Philosophy**: Effective hourly rate based on estimated package price & hours

- **Calculation**:
  ```
  estimatedPrice = detectPackage(job) or clientBudget
  estimatedHours = estimateHours(job)
  EHR = estimatedPrice / estimatedHours
  ```

- **Scoring**:
  - 15 pts: EHR ≥ $120/hr (premium)
  - 13 pts: EHR ≥ $100/hr (excellent)
  - 10 pts: EHR ≥ $85/hr (good)
  - 7 pts: EHR ≥ $70/hr (acceptable)
  - 3 pts: EHR ≥ $50/hr (low)
  - 0 pts: EHR < $50/hr (reject)

---

### 7. Red Flags (0 to -10 penalty)
**Philosophy**: Detect problematic jobs

- **Red Flag Categories** (-2 points each):
  - **Budget**: "cheap", "low budget", "tight budget", "limited budget"
  - **Urgency**: "asap", "urgent", "quick", "immediately", "right now"
  - **Commodity**: "bug fix", "quick fix", "small change", "simple edit"
  - **Platform**: "wordpress", "wix", "squarespace", "elementor"
  - **Scope**: "ongoing", "long term", "hourly only"

- **Max Penalty**: -10 points

---

## Hard Filters (Binary Pass/Fail)

Jobs must pass ALL hard filters to be recommended:

1. **Score ≥ 80** (out of 100)
2. **EHR ≥ $70/hr**
3. **Payment Verified = true**

If any filter fails → "Not Recommended"

---

## Example Score Breakdown

### Job: "Client Portal for Video Production Company"

```
Client Quality:       25/25  ✅ Perfect
  • Payment verified: 15/15 ✅
  • Spend history:    5/5   ($12k, 15 hires)
  • Recency:          5/5   (6h old, 3 proposals)

Keywords Match:       15/15  ✅ Perfect (5 points × 3 keywords)
  • Matched: "client portal", "secure login", "file sharing"

Professional Signals: 10/10  ⭐ Perfect
  • Open budget:      5/5   (not specified)
  • Team language:    5/5   (6 "we" vs 0 "I")

Outcome Clarity:      11/15  ✅ Good
  • Detected: "streamline", "clients", "communications"
  • No timeline mentioned

Scope Fit:            15/15  ✅ Perfect
  • Maps to: Portal Lite package
  • 4 signals matched: "portal", "secure", "login", "dashboard"

EHR Potential:        10/15  ✅ Good
  • Est: $3,250 ÷ 35hrs = $92.86/hr

Red Flags:            0/-10  ✅ None
───────────────────────────
TOTAL:                86/100 ✅ RECOMMENDED
```

---

## Key Philosophy Changes

1. **New clients are valuable** - Payment verification (15pts) > history (5pts)
2. **Proportional keywords** - Each keyword adds 5 points (max 15 at 3 keywords)
3. **Professional signals matter** - Open budget + team language = resources
4. **Clear outcomes valued** - Client knows what they want = better project
5. **Red flags use word boundaries** - "quickly" doesn't trigger "quick" flag

---

## Testing the Algorithm

**Mock Data Included:**

1. **Video Portal** (Premium client, open budget, team) → ~86-92 points ✅
2. **Webflow Redesign** (Good client, specified budget, team) → ~80-86 points ✅
3. **WordPress Fix** (No payment, "I" language, red flags) → ~15-20 points ❌
4. **Real Estate Landing** (NEW CLIENT, open budget, team) → ~82-85 points ✅

Job #4 proves new clients with good signals still score 80+!
