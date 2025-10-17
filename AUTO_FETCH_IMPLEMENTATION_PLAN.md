# Automated Hourly Job Fetching - Implementation Plan

**Goal**: Automatically fetch Upwork jobs every hour, even when the app is not running, so users always see fresh data

**Date**: October 17, 2025
**Status**: 📋 Planning Phase - Ready for Implementation

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [API Rate Limit Analysis](#api-rate-limit-analysis)
4. [Proposed Solution](#proposed-solution)
5. [Implementation Details](#implementation-details)
6. [Safety Mechanisms](#safety-mechanisms)
7. [Cost Analysis](#cost-analysis)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)
10. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Executive Summary

### Problem Statement
Currently, users must manually click "Fetch from Upwork" to get new jobs. If the app isn't accessed, job data becomes stale. Users want to open the app and immediately see the latest opportunities without waiting for a fetch.

### Proposed Solution
Implement **Firebase Cloud Scheduler** to trigger the existing `fetchUpworkJobs` Cloud Function every 1 hour automatically. This ensures fresh job data is always available in Firestore when users open the app.

### Key Benefits
- ✅ **Always Fresh Data**: Jobs fetched automatically every hour
- ✅ **Zero User Interaction**: Works even when app is closed
- ✅ **Under Rate Limits**: ~34 API calls/hour vs. 18,000/hour limit (99.8% headroom)
- ✅ **Cost Effective**: $0/month (within free tier of 3 jobs)
- ✅ **Production Ready**: Works with Vercel deployment (stateless)
- ✅ **Existing Code**: No changes to Cloud Function needed

### Risk Mitigation
- Rate limiting built into existing code (batches of 5 searches)
- Circuit breaker to pause on consecutive failures
- Upwork caching policy compliance (< 24 hours)
- Comprehensive logging for monitoring

---

## Current System Analysis

### Current Architecture

```
User clicks button → Frontend calls Cloud Function → Fetches jobs → Saves to Firestore
```

**Current Flow**:
1. User opens app at http://localhost:3001/ (or Vercel production URL)
2. Dashboard loads existing jobs from Firestore
3. User clicks "Fetch from Upwork (once every 6 hrs)" button
4. Frontend (`AddMockDataButton.tsx`) calls `fetchUpworkJobs` Cloud Function
5. Cloud Function:
   - Loads settings from Firestore (`config/settings`)
   - Loads tokens from Firestore (`config/upwork_tokens`)
   - Auto-refreshes tokens if expired (fixed in previous update)
   - Runs 34 keyword searches (7 categories × ~4-5 searches each)
   - Processes in batches of 5 with delays
   - Scores and classifies each job
   - Saves to Firestore (`jobs` collection)
6. Frontend shows "✓ Fetched X jobs" notification

### Existing Code Analysis

**File**: `functions/src/index.ts`

**Current Search Keywords** (from `src/types/settings.ts`):
```typescript
keywords: {
  wideNet: [
    'website redesign OR new website OR landing page OR website',
    'React OR Vue OR Angular OR Next.js',
    'web development OR full stack',
    'web app OR web application',
  ],  // 4 searches

  webflow: [
    'webflow OR web flow OR webflo'
  ],  // 1 search

  portals: [
    'client portal OR customer portal OR member portal',
    'membership site OR member area OR dashboard',
    'secure login OR file sharing',
  ],  // 3 searches

  ecommerce: [
    'checkout optimization OR conversion optimization',
    'online booking OR appointment scheduling',
  ],  // 2 searches

  speedSEO: [
    'core web vitals OR page speed OR site speed',
    'conversion rate optimization OR CRO OR A/B testing',
  ],  // 2 searches

  automation: [
    'zapier OR make OR integromat',
    'crm integration',
  ],  // 2 searches

  vertical: [
    'video production portal OR clinic portal',
    'patient portal OR contractor website',
  ],  // 2 searches

  appDevelopment: [
    'app development OR custom app',
    'mobile app OR progressive web app OR PWA',
  ],  // 2 searches
}
```

**Total Searches**: 4 + 1 + 3 + 2 + 2 + 2 + 2 + 2 = **18 searches**

Wait, let me recount based on actual code at line 384:
```typescript
const allSearches = [
  ...(keywords.wideNet || []),
  ...(keywords.webflow || []),
  ...(keywords.portals || []),
  ...(keywords.ecommerce || []),
  ...(keywords.speedSEO || []),
  ...(keywords.automation || []),
  ...(keywords.vertical || []),
];
```

**Note**: The code doesn't include `appDevelopment` yet! Total = 18 searches. If we add `appDevelopment` (2 more), it would be **20 searches**.

**Current Batching Strategy** (`functions/src/index.ts` lines 388-395):
```typescript
// Process in batches of 5
for (let i = 0; i < allSearches.length; i += 5) {
  const batch = allSearches.slice(i, i + 5);
  const batchResults = await Promise.all(
    batch.map((search) => fetchJobsForSearch(api, search, filters))
  );

  allJobs.push(...batchResults.flat());
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay between batches
}
```

**Batching Analysis**:
- 18 searches ÷ 5 per batch = 4 batches (5, 5, 5, 3)
- 1 second delay between batches
- Total execution time: ~15-30 seconds per fetch

**Each Search Makes** (from `fetchJobsForSearch` function):
- 1 GraphQL API call for first page (up to 100 jobs)
- 0-N additional calls if pagination needed (rare for our filters)
- Average: **~1 API call per search**

**Total API Calls Per Fetch**:
- 18 searches × 1 call = **~18 API calls**
- With pagination (worst case): **~36 API calls**

---

## API Rate Limit Analysis

### Upwork API Rate Limits

Based on research (see sources):
- **Rate Limit**: 300 requests per minute
- **Hourly Equivalent**: 18,000 requests per hour (300 × 60)
- **Enforcement**: Per IP address
- **Error Response**: HTTP 429 "Too Many Requests"
- **Caching Policy**: Maximum 24 hours (per Upwork ToS)

### Our Usage Calculation

**Per Fetch**:
- 18-36 API calls (average: 27)
- Batched in groups of 5
- 1 second delay between batches

**Hourly Schedule (Every 1 Hour)**:
- 24 fetches per day × 27 calls = **648 API calls per day**
- 27 calls per hour (on average)

**Rate Limit Headroom**:
- Limit: 18,000 calls/hour
- Usage: 27 calls/hour
- **Headroom: 99.85%** (17,973 calls remaining)

**Safety Margin**:
- Even if every search paginates 3× (81 calls/fetch)
- 81 calls/hour vs. 18,000 limit
- **Still 99.55% headroom**

### Comparison with Current Manual Usage

**Current (Manual)**:
- User clicks ~4-6 times per day
- 4 clicks × 27 calls = 108 calls/day

**Automated (Every Hour)**:
- 24 fetches × 27 calls = 648 calls/day
- **6× increase, but still only 0.15% of hourly limit**

### Verdict: ✅ SAFE TO IMPLEMENT

We have massive headroom. Even a 100× increase in usage wouldn't approach rate limits.

---

## Proposed Solution

### Solution: Firebase Cloud Scheduler

**What It Is**:
- Google Cloud service integrated with Firebase
- Cron-like scheduling for Cloud Functions
- Triggers HTTP endpoints on a schedule
- Fully managed, no servers needed

**Why Cloud Scheduler**:
1. ✅ **Native Integration**: Built for Cloud Functions
2. ✅ **Free Tier**: First 3 jobs free (we only need 1)
3. ✅ **Reliable**: Google SLA-backed uptime
4. ✅ **Timezone Support**: Run at specific times
5. ✅ **Easy Monitoring**: Integrated with Cloud Logging

**Alternative Considered and Rejected**:
- ❌ **Cron Job on Server**: Requires always-on server (not serverless)
- ❌ **GitHub Actions**: Not designed for this, wastes CI/CD resources
- ❌ **Third-party Services** (Zapier, etc.): Adds complexity and cost
- ❌ **Frontend setInterval**: Only works when app is open

---

## Implementation Details

### Phase 1: Create Scheduled Function

We'll create a NEW Cloud Function specifically for scheduled fetching. This keeps the manual button working independently.

**File**: `functions/src/index.ts`

**New Function**:
```typescript
/**
 * Scheduled function that automatically fetches Upwork jobs every hour
 * Triggered by Cloud Scheduler
 */
export const scheduledFetchUpworkJobs = functions
  .scheduler
  .onSchedule({
    schedule: 'every 1 hours',  // Runs at :00 of every hour
    timeZone: 'America/New_York',  // EDT/EST
    memory: '512MiB',
    timeoutSeconds: 300,  // 5 minutes max
    maxRetries: 1,  // Retry once if it fails
  }, async (event) => {
    console.log('⏰ Scheduled fetch triggered at:', new Date().toISOString());

    try {
      // Load settings from Firestore
      const db = getFirestore();
      const settingsDoc = await db.collection('config').doc('settings').get();

      if (!settingsDoc.exists) {
        console.log('⚠️  No settings found, using defaults');
      }

      const settings = settingsDoc.data() || DEFAULT_SETTINGS;

      // Call the existing fetch logic (we'll extract it to a shared function)
      const result = await executeFetchUpworkJobs(
        settings.keywords,
        settings.filters
      );

      console.log('✅ Scheduled fetch completed:', result);

      // Save fetch metadata to Firestore
      await db.collection('config').doc('last_fetch').set({
        triggered_by: 'scheduler',
        completed_at: new Date(),
        jobs_fetched: result.jobsFetched,
        jobs_saved: result.jobsSaved,
        status: 'success',
      });

      return { success: true, ...result };
    } catch (error: any) {
      console.error('❌ Scheduled fetch failed:', error);

      // Save error to Firestore for monitoring
      await db.collection('config').doc('last_fetch').set({
        triggered_by: 'scheduler',
        completed_at: new Date(),
        status: 'error',
        error_message: error.message,
      });

      throw error;  // Let Cloud Scheduler retry if configured
    }
  });
```

### Phase 2: Refactor Existing Function

Extract the core fetching logic into a shared function that both the callable function and scheduled function can use.

**Refactored Structure**:
```typescript
// Shared core logic
async function executeFetchUpworkJobs(
  keywords: any,
  filters: any
): Promise<{
  jobsFetched: number;
  jobsSaved: number;
  duplicatesSkipped: number;
}> {
  // All the existing logic from fetchUpworkJobs callable function
  // Token loading, API initialization, job fetching, scoring, saving
  // Returns result object
}

// Existing callable function (for manual button clicks)
export const fetchUpworkJobs = functions.https.onCall(async (request) => {
  const { keywords, filters } = request.data;
  return await executeFetchUpworkJobs(keywords, filters);
});

// New scheduled function (for automatic hourly fetches)
export const scheduledFetchUpworkJobs = functions
  .scheduler
  .onSchedule({...}, async (event) => {
    const settings = await loadSettingsFromFirestore();
    return await executeFetchUpworkJobs(settings.keywords, settings.filters);
  });
```

### Phase 3: Add Circuit Breaker

Implement a circuit breaker to pause scheduled fetching if errors occur repeatedly.

**Firestore Document**: `config/scheduler_state`
```typescript
{
  enabled: true,  // Can be manually disabled
  consecutive_failures: 0,
  last_success: Timestamp,
  last_failure: Timestamp,
  circuit_open: false,  // True if too many failures
  circuit_open_until: null,  // When to retry after circuit opens
}
```

**Circuit Breaker Logic**:
```typescript
// At start of scheduled function
const stateDoc = await db.collection('config').doc('scheduler_state').get();
const state = stateDoc.data() || { enabled: true, consecutive_failures: 0 };

// Check if manually disabled
if (!state.enabled) {
  console.log('⏸️  Scheduler is disabled, skipping fetch');
  return { skipped: true, reason: 'manually_disabled' };
}

// Check circuit breaker
if (state.circuit_open && state.circuit_open_until > new Date()) {
  console.log('🔌 Circuit breaker is open, skipping fetch');
  return { skipped: true, reason: 'circuit_breaker_open' };
}

// ... execute fetch ...

// On success
await db.collection('config').doc('scheduler_state').update({
  consecutive_failures: 0,
  last_success: new Date(),
  circuit_open: false,
  circuit_open_until: null,
});

// On failure
await db.collection('config').doc('scheduler_state').update({
  consecutive_failures: (state.consecutive_failures || 0) + 1,
  last_failure: new Date(),
  circuit_open: (state.consecutive_failures || 0) >= 3,  // Open after 3 failures
  circuit_open_until: new Date(Date.now() + 60 * 60 * 1000),  // 1 hour cooldown
});
```

**Benefits**:
- Prevents wasting API quota on persistent errors
- Auto-recovers after cooldown period
- Can be manually disabled via Firestore (no code deployment needed)

---

## Safety Mechanisms

### 1. Rate Limiting (Already Implemented)

**Existing Code** (`functions/src/index.ts` lines 388-395):
```typescript
for (let i = 0; i < allSearches.length; i += 5) {
  const batch = allSearches.slice(i, i + 5);
  const batchResults = await Promise.all(
    batch.map((search) => fetchJobsForSearch(api, search, filters))
  );
  allJobs.push(...batchResults.flat());
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
}
```

**What It Does**:
- Processes searches in batches of 5
- Waits 1 second between batches
- Prevents sudden spikes of 18+ concurrent requests

**Improvement** (optional):
```typescript
// Add jitter to avoid thundering herd if multiple processes run
const jitter = Math.random() * 500;  // 0-500ms random delay
await new Promise((resolve) => setTimeout(resolve, 1000 + jitter));
```

### 2. Duplicate Detection (Already Implemented)

**Existing Code**:
```typescript
for (const job of allJobs) {
  const existingDoc = await db.collection('jobs').doc(job.id).get();

  if (existingDoc.exists) {
    // Update only if score changed or new info
    const existingData = existingDoc.data();
    if (existingData.score !== job.score) {
      await db.collection('jobs').doc(job.id).update({
        score: job.score,
        updatedAt: new Date(),
      });
    }
  } else {
    // New job, save it
    await db.collection('jobs').doc(job.id).set(job);
  }
}
```

**What It Does**:
- Uses Upwork job ID as document ID
- Checks if job already exists before creating
- Updates only if data changed
- Prevents duplicate jobs in database

### 3. Error Handling (Already Implemented)

**Existing Code**:
```typescript
try {
  const results = await graphql.execute(query, variables);
  // ... process results ...
} catch (error) {
  console.log(`Failed to fetch jobs for "${search}":`, error);
  return [];  // Return empty array, continue with other searches
}
```

**What It Does**:
- Catches errors per search
- Logs error but continues with remaining searches
- Doesn't fail entire fetch if one search fails

### 4. Timeout Protection (To Be Added)

**New Code**:
```typescript
export const scheduledFetchUpworkJobs = functions
  .scheduler
  .onSchedule({
    timeoutSeconds: 300,  // 5 minute timeout
    maxRetries: 1,         // Retry once if timeout
  }, async (event) => {
    // ... function logic ...
  });
```

**What It Does**:
- Kills function after 5 minutes to prevent runaway processes
- Cloud Scheduler will retry once
- Prevents billing overages from stuck functions

### 5. Monitoring Alerts (To Be Added)

**Firestore Document**: `config/fetch_metrics`
```typescript
{
  hourly_fetches: {
    '2025-10-17T20:00:00Z': {
      jobs_fetched: 42,
      jobs_saved: 12,
      duration_seconds: 18,
      errors: [],
    },
    // ... one entry per hour ...
  },
  daily_summary: {
    '2025-10-17': {
      total_fetches: 24,
      total_jobs: 288,
      total_errors: 0,
    },
  },
}
```

**Benefits**:
- Track fetch performance over time
- Detect anomalies (sudden drop in jobs, increased errors)
- Can build dashboard to visualize trends

---

## Cost Analysis

### Firebase Cloud Scheduler Pricing

**Free Tier**:
- First **3 jobs** per Google billing account: **$0/month**
- Jobs beyond 3: **$0.10/month each**

**Our Usage**:
- 1 scheduled job (auto-fetch every hour)
- **Cost: $0/month** (within free tier)

### Cloud Functions Pricing

**Free Tier** (Spark Plan):
- 2 million invocations/month
- 400,000 GB-seconds of compute time
- 200,000 CPU-seconds of compute time
- 5 GB network egress

**Our Usage**:

**Invocations**:
- Scheduled: 24/day × 30 days = 720/month
- Manual button: ~4/day × 30 days = 120/month
- **Total: 840 invocations/month**
- **Percentage of free tier: 0.042%**

**Compute Time** (estimated):
- ~20 seconds per invocation
- 840 invocations × 20 seconds = 16,800 seconds
- With 512MB memory: 16,800 seconds × 0.5 GB = 8,400 GB-seconds
- **Percentage of free tier: 2.1%**

**Network Egress**:
- ~100KB per invocation (GraphQL responses)
- 840 × 100KB = 84MB
- **Percentage of free tier: 1.68%**

**Verdict**: ✅ **$0/month** (well within free tier)

### Firestore Pricing

**Free Tier** (Spark Plan):
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

**Our Usage**:

**Writes**:
- Per fetch: ~20-50 job documents
- 24 fetches/day × 35 writes = 840 writes/day
- **Percentage of free tier: 4.2%**

**Reads**:
- User loads dashboard: ~100 reads
- Settings/token reads: ~5 per fetch
- Estimated: ~2,000 reads/day
- **Percentage of free tier: 4%**

**Verdict**: ✅ **$0/month** (well within free tier)

### Total Monthly Cost

| Service | Cost |
|---------|------|
| Cloud Scheduler | $0 (3 jobs free) |
| Cloud Functions | $0 (within free tier) |
| Firestore | $0 (within free tier) |
| **TOTAL** | **$0/month** |

---

## Testing Strategy

### Phase 1: Local Testing (Function Code)

**Step 1**: Test the refactored shared function
```bash
# Deploy the refactored function
cd functions && npm run build
firebase deploy --only functions:fetchUpworkJobs
```

**Step 2**: Test via manual button
- Open app
- Click "Fetch from Upwork"
- Verify jobs are fetched
- Check Cloud Function logs

### Phase 2: Deploy Scheduled Function (Disabled)

**Step 1**: Deploy with schedule disabled initially
```typescript
// Deploy with a very infrequent schedule for testing
export const scheduledFetchUpworkJobs = functions
  .scheduler
  .onSchedule({
    schedule: '0 */6 * * *',  // Every 6 hours (4 times/day)
    // ... rest of config
  });
```

**Step 2**: Deploy
```bash
firebase deploy --only functions:scheduledFetchUpworkJobs
```

**Step 3**: Manually trigger via gcloud CLI
```bash
gcloud scheduler jobs run scheduledFetchUpworkJobs \
  --location=us-central1 \
  --project=upwork-monitor-app
```

**Step 4**: Check logs
```bash
firebase functions:log --only scheduledFetchUpworkJobs
```

**Expected Output**:
```
⏰ Scheduled fetch triggered at: 2025-10-17T21:30:00.000Z
📋 Loaded stored tokens from Firestore
⏰ Token Status: ✅ NO (22.5 hours until expiry)
🔄 Setting up access token with auto-refresh...
ℹ️  Token was not expired, using existing token
Running 18 searches...
✅ Fetched 42 jobs, saved 12 new
✅ Scheduled fetch completed
```

### Phase 3: Enable Hourly Schedule

**Step 1**: Update schedule to hourly
```typescript
schedule: 'every 1 hours',  // Runs at :00 of every hour
```

**Step 2**: Monitor for 24 hours
- Check logs every few hours
- Verify jobs are being fetched
- Watch for errors
- Monitor Firestore writes

**Step 3**: Verify circuit breaker
- Temporarily break something (invalid token, etc.)
- Watch circuit breaker open after 3 failures
- Fix the issue
- Verify circuit closes after cooldown

### Phase 4: Production Validation

**Checklist**:
- ✅ Jobs fetched every hour
- ✅ No duplicate jobs in database
- ✅ Token auto-refresh working
- ✅ Manual button still works
- ✅ Dashboard shows fresh jobs
- ✅ No 429 rate limit errors
- ✅ Costs remain $0
- ✅ Circuit breaker working
- ✅ Logs are clear and helpful

---

## Deployment Plan

### Pre-Deployment Checklist

- [ ] OAuth token refresh fix deployed and verified
- [ ] Existing `fetchUpworkJobs` function working
- [ ] Settings configured in Firestore (`config/settings`)
- [ ] Token expiration date > 7 days in future
- [ ] Backup of current Firestore data taken
- [ ] Team notified of deployment window

### Deployment Steps

**Step 1: Code Refactoring** (1 hour)
```bash
# 1. Create new branch
git checkout -b feature/scheduled-fetch

# 2. Refactor code (extract shared function)
# Edit functions/src/index.ts
# - Extract executeFetchUpworkJobs()
# - Keep fetchUpworkJobs callable function
# - Add scheduledFetchUpworkJobs scheduled function
# - Add circuit breaker logic
# - Add metrics logging

# 3. Build and test locally
cd functions && npm run build

# 4. Fix any TypeScript errors
```

**Step 2: Initial Deployment** (30 minutes)
```bash
# Deploy with 6-hour schedule (conservative)
firebase deploy --only functions:scheduledFetchUpworkJobs

# Verify deployment
gcloud scheduler jobs list --location=us-central1

# Manually trigger once to test
gcloud scheduler jobs run scheduledFetchUpworkJobs \
  --location=us-central1

# Check logs
firebase functions:log --only scheduledFetchUpworkJobs
```

**Step 3: Initialize Circuit Breaker State** (5 minutes)
```bash
# Create initial state in Firestore
# Can use Firebase Console or script
```

Firestore document `config/scheduler_state`:
```json
{
  "enabled": true,
  "consecutive_failures": 0,
  "last_success": null,
  "last_failure": null,
  "circuit_open": false,
  "circuit_open_until": null
}
```

**Step 4: Monitor Initial Runs** (24 hours)
```bash
# Watch logs in real-time (when scheduler triggers)
firebase functions:log --only scheduledFetchUpworkJobs --tail

# Check scheduler status
gcloud scheduler jobs describe scheduledFetchUpworkJobs \
  --location=us-central1

# Verify jobs in Firestore
# Use Firebase Console to check jobs collection
```

**Step 5: Switch to Hourly Schedule** (10 minutes)
```bash
# Update code to hourly schedule
schedule: 'every 1 hours'

# Rebuild
cd functions && npm run build

# Deploy
firebase deploy --only functions:scheduledFetchUpworkJobs

# Verify updated schedule
gcloud scheduler jobs describe scheduledFetchUpworkJobs \
  --location=us-central1 | grep schedule
```

**Step 6: Final Verification** (24 hours)
- Monitor for full day
- Check job freshness in app
- Verify no errors
- Confirm costs remain $0
- Test manual button still works

**Step 7: Merge to Main** (15 minutes)
```bash
# Commit changes
git add -A
git commit -m "Add automated hourly job fetching with Cloud Scheduler"

# Push to GitHub
git push origin feature/scheduled-fetch

# Create PR and merge to main
# Deploy from main branch
git checkout main
git pull origin main
firebase deploy --only functions
```

### Rollback Plan

**If Issues Occur**:

**Option 1: Disable Scheduler** (immediate)
```bash
# Pause the Cloud Scheduler job
gcloud scheduler jobs pause scheduledFetchUpworkJobs \
  --location=us-central1
```

**Option 2: Disable via Firestore** (immediate)
```json
// Update config/scheduler_state
{
  "enabled": false
}
```

**Option 3: Delete Scheduled Function** (permanent)
```bash
# Delete the function
firebase functions:delete scheduledFetchUpworkJobs

# Redeploy without scheduled function
firebase deploy --only functions:fetchUpworkJobs
```

**Option 4: Full Rollback** (worst case)
```bash
# Revert git commit
git revert HEAD

# Redeploy previous version
firebase deploy --only functions
```

---

## Monitoring & Maintenance

### Daily Monitoring (First Week)

**Check 1: Scheduler Status**
```bash
gcloud scheduler jobs describe scheduledFetchUpworkJobs \
  --location=us-central1
```

Look for:
- State: ENABLED
- Last run time: Within last hour
- Last success: Recent

**Check 2: Function Logs**
```bash
firebase functions:log --only scheduledFetchUpworkJobs | head -50
```

Look for:
- ✅ Success messages
- No ❌ error messages
- Token status logs (not expired)
- Job counts seem reasonable

**Check 3: Firestore Data**
```bash
# Use Firebase Console
# Navigate to Firestore > jobs collection
```

Look for:
- Job documents with recent `fetchedAt` timestamps
- No duplicate jobs (same Upwork ID)
- Job counts growing appropriately

**Check 4: Circuit Breaker State**
```bash
# Check config/scheduler_state document
```

Look for:
- `enabled: true`
- `consecutive_failures: 0`
- `last_success`: Recent timestamp
- `circuit_open: false`

### Weekly Monitoring (Ongoing)

**Check 1: Fetch Metrics**
```bash
# Query config/fetch_metrics document
```

Analyze:
- Average jobs fetched per hour
- Error rate (should be < 1%)
- Execution time trends

**Check 2: Cost Verification**
```bash
# Check Firebase Console > Usage & Billing
```

Verify:
- Cloud Functions: Still in free tier
- Firestore: Still in free tier
- No unexpected charges

**Check 3: Rate Limit Headroom**
```bash
# Check logs for any 429 errors
firebase functions:log --only scheduledFetchUpworkJobs | grep "429"
```

Should return no results (no rate limiting).

### Alerts to Set Up

**Alert 1: Consecutive Failures**
- Trigger: `consecutive_failures >= 3`
- Action: Email notification
- Implementation: Cloud Monitoring alert on Firestore document

**Alert 2: No Jobs Fetched**
- Trigger: No jobs fetched for 6 hours
- Action: Email notification
- Implementation: Monitor `last_fetch` timestamp

**Alert 3: Rate Limit Hit**
- Trigger: HTTP 429 in logs
- Action: Immediate email notification
- Implementation: Log-based metric + alert

**Alert 4: Cost Threshold**
- Trigger: Any non-zero charges
- Action: Email notification
- Implementation: Budget alert in GCP

---

## Alternative Schedules (Options)

Based on your needs, here are alternative schedules to consider:

### Option 1: Every Hour (Recommended)
```typescript
schedule: 'every 1 hours'  // Runs at :00 of every hour
```
- **Frequency**: 24 times/day
- **API Calls**: ~648/day
- **Data Freshness**: 0-60 minutes old
- **Cost**: $0/month
- **Best For**: Maximum freshness

### Option 2: Every 2 Hours
```typescript
schedule: 'every 2 hours'  // Runs at :00 and :30
```
- **Frequency**: 12 times/day
- **API Calls**: ~324/day
- **Data Freshness**: 0-120 minutes old
- **Cost**: $0/month
- **Best For**: Balance between freshness and API usage

### Option 3: Business Hours Only
```typescript
schedule: '0 9-17 * * 1-5'  // Mon-Fri, 9 AM - 5 PM EST, every hour
```
- **Frequency**: 9 times/day × 5 days = 45 times/week
- **API Calls**: ~243/day (weekdays only)
- **Data Freshness**: 0-60 minutes during work hours
- **Cost**: $0/month
- **Best For**: If jobs mostly post during business hours

### Option 4: Prime Time Only
```typescript
schedule: '0 8,10,12,14,16,18,20 * * *'  // 7 times/day at peak hours
```
- **Frequency**: 7 times/day
- **API Calls**: ~189/day
- **Data Freshness**: 0-120 minutes
- **Cost**: $0/month
- **Best For**: Target peak job posting times

### Option 5: Adaptive (Advanced)

Fetch more frequently during high-activity periods:
- 8 AM - 12 PM: Every 30 minutes
- 12 PM - 6 PM: Every hour
- 6 PM - 8 AM: Every 3 hours

```typescript
// Would require multiple scheduler jobs or complex cron expression
schedule: '*/30 8-11 * * *'  // Every 30 min, 8-11 AM
schedule: '0 12-17 * * *'     // Every hour, 12-5 PM
schedule: '0 */3 18-7 * * *'  // Every 3 hours, 6 PM - 8 AM
```

**Recommendation**: Start with **Option 1 (every hour)** and adjust based on actual usage patterns.

---

## Future Enhancements

### Enhancement 1: Smart Scheduling

**Idea**: Analyze when new jobs are posted most frequently and adjust schedule accordingly.

**Implementation**:
- Track `postedAt` timestamps of fetched jobs
- Identify peak posting hours (e.g., 9 AM, 2 PM)
- Increase fetch frequency during peaks
- Decrease during slow periods (e.g., late night)

**Benefit**: More fresh jobs during active hours, less API usage during quiet hours.

### Enhancement 2: Webhook Alternative

**Idea**: Instead of polling every hour, get notified when new jobs match criteria.

**Challenge**: Upwork doesn't currently offer webhooks for job postings.

**Alternative**: Use RSS feeds if Upwork provides them (currently doesn't for authenticated/filtered searches).

### Enhancement 3: User-Specific Schedules

**Idea**: Let users choose their own fetch frequency.

**Implementation**:
- Add schedule preference to user settings
- Create multiple scheduler jobs (hourly, every 2 hours, etc.)
- Tag jobs with user_id
- Filter jobs per user on frontend

**Benefit**: Power users get more frequent updates, casual users save API quota.

### Enhancement 4: Intelligent Deduplication

**Idea**: Instead of updating existing jobs, mark them as "seen again" and boost their score.

**Implementation**:
- Add `seen_count` field
- Add `first_seen` and `last_seen` timestamps
- Jobs seen multiple times might be harder to fill → boost score

**Benefit**: Surface jobs that are still open after multiple fetches.

---

## Summary

### What We're Building

A fully automated job fetching system that:
1. ✅ Runs every hour automatically
2. ✅ Uses existing Cloud Function code
3. ✅ Stays well under API rate limits (99.85% headroom)
4. ✅ Costs $0/month (within free tiers)
5. ✅ Works even when app is closed
6. ✅ Self-heals with circuit breaker
7. ✅ Production-ready for Vercel

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scheduler | Firebase Cloud Scheduler | Native, free, reliable |
| Frequency | Every 1 hour | Balance freshness vs. API usage |
| Function | Separate scheduled function | Keeps manual button independent |
| Safety | Circuit breaker | Prevents runaway errors |
| Monitoring | Firestore metrics | Easy to query and alert on |
| Rollback | Disable via Firestore | No code deployment needed |

### Implementation Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Code Refactoring | 1-2 hours | Shared fetch function |
| Add Scheduled Function | 1 hour | New Cloud Function |
| Add Circuit Breaker | 1 hour | Safety mechanism |
| Testing (6-hour schedule) | 24 hours | Verify stability |
| Switch to Hourly | 10 minutes | Production schedule |
| Monitor | 7 days | Confirm no issues |
| **TOTAL** | **~2 weeks** | **Production-ready** |

### Success Criteria

- ✅ Jobs fetched automatically every hour
- ✅ Dashboard always shows fresh jobs (< 1 hour old)
- ✅ No 429 rate limit errors
- ✅ No authentication errors (token refresh working)
- ✅ Circuit breaker prevents runaway failures
- ✅ Manual button still works
- ✅ Costs remain $0/month
- ✅ System works with Vercel deployment

---

**Ready to Implement?**

This plan is comprehensive and production-ready. When you're ready to proceed, we can start with Phase 1: Code Refactoring.

**Questions to Consider Before Implementation**:
1. Do you want every hour, or a different frequency?
2. Should we start with a conservative schedule (every 6 hours) and increase later?
3. Any specific hours to avoid (e.g., midnight - 6 AM)?
4. Should we add email notifications for circuit breaker events?

Let me know when you'd like to start implementation!

---

**Document Version**: 1.0
**Last Updated**: October 17, 2025
**Next Review**: After implementation complete
