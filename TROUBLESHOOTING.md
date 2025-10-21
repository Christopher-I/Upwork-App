# Troubleshooting Guide

## Common Issues and Solutions

---

## Issue: "Fetch New Jobs" Returns 500 Internal Server Error

### Symptoms
- Clicking "Fetch New Jobs" button results in error
- Browser console shows: `POST https://us-central1-upwork-monitor-app.cloudfunctions.net/fetchUpworkJobs 500 (Internal Server Error)`
- Error message: `Error fetching from Upwork: FirebaseError: internal`

### Root Cause
Upwork OAuth tokens have expired and the automatic refresh is failing.

### Diagnosis Steps

**1. Check Cloud Function Logs**
```bash
firebase functions:log
```

**2. Look for These Error Patterns**

```
⏰ Token Status:
  - Expires at: 2025-10-21T04:23:42.536Z
  - Current time: 2025-10-21T16:18:25.179Z
  - Is expired? ❌ YES
  - Expired: 11.91 hours ago

🔄 Setting up access token with auto-refresh...

Error: Response Error: 400 Bad Request
    at async AccessToken.refresh
```

**3. Understand the Error**

- **Access Token Expired**: Normal - happens every 24 hours
- **Refresh Token Failed (400 Bad Request)**: NOT normal - indicates:
  - Refresh token itself has expired (typically 30-90 days of inactivity)
  - OAuth app configuration changed
  - User revoked access on Upwork's side
  - Upwork API policy changes

### Solution

**Run the OAuth Setup Script**
```bash
node functions/setup-upwork-auth.js
```

This will:
1. Start an OAuth authorization flow
2. Open a browser window for you to authorize with Upwork
3. Exchange the authorization code for fresh tokens
4. Save the new tokens to Firestore (`config/upwork_tokens`)

**Expected Output:**
```
Starting Upwork OAuth2 setup...
Opening authorization URL in your browser...
[Browser opens]
After authorization, paste the full redirect URL here:
[You paste the URL]
✅ Tokens saved successfully to Firestore
```

### Prevention

The automatic token refresh SHOULD work if:
- The app is used regularly (tokens refreshed before refresh token expires)
- The scheduled function `scheduledFetchUpworkJobs` runs hourly (keeps tokens fresh)
- No changes to Upwork OAuth app configuration

**Check if Scheduled Function is Running:**
```bash
firebase functions:log --only scheduledFetchUpworkJobs
```

Look for hourly executions and successful token refreshes.

---

## Token Refresh Architecture

### How It Works

**Normal Flow (Automatic Refresh):**
1. Cloud Function detects access token is expired
2. Calls `api.setAccessToken()` which uses the refresh token
3. Upwork OAuth server returns new access token
4. Function saves new access token to Firestore
5. Refresh token is preserved (doesn't change)

**Code Location:** `functions/src/index.ts:329-372`

```typescript
// Set access token (will auto-refresh if expired)
const currentTokens = await new Promise((resolve, reject) => {
  api.setAccessToken((tokenPair) => {
    resolve(tokenPair);
  });
});

// Check if tokens were refreshed
const tokenWasRefreshed = currentTokens.access_token !== storedTokens?.access_token;

if (tokenWasRefreshed) {
  // Save new access token to Firestore
  await db.collection('config').doc('upwork_tokens').update({
    access_token: currentTokens.access_token,
    refresh_token: storedTokens?.refresh_token, // Preserved
    expires_in: currentTokens.expires_in || 86400,
    expires_at: newExpiresAt.toISOString(),
    updated_at: new Date(),
  });
}
```

### Token Lifespan

- **Access Token**: 24 hours (86400 seconds)
- **Refresh Token**: 30-90 days (estimated, Upwork doesn't document this clearly)

### When Manual Re-Auth is Required

- Refresh token expired due to prolonged inactivity
- OAuth app credentials changed
- Access manually revoked on Upwork
- Upwork API policy changes

---

## Other OAuth-Related Issues

### Issue: "Upwork tokens not found"

**Error Message:**
```
Upwork tokens not found. Please run the setup script first
```

**Solution:**
```bash
node functions/setup-upwork-auth.js
```

### Issue: "Upwork API credentials not configured"

**Symptoms:**
- Error: `failed-precondition: Upwork API credentials not configured`

**Solution:**
Check Firebase Functions environment variables:
```bash
firebase functions:config:get
```

Should show:
```json
{
  "upwork": {
    "client_id": "...",
    "client_secret": "..."
  }
}
```

If missing, set them:
```bash
firebase functions:config:set upwork.client_id="YOUR_CLIENT_ID"
firebase functions:config:set upwork.client_secret="YOUR_CLIENT_SECRET"
firebase deploy --only functions
```

---

## Monitoring Token Health

### Quick Token Status Check

**Option 1: Check via Firestore Console**
1. Open Firebase Console: https://console.firebase.google.com/project/upwork-monitor-app
2. Navigate to Firestore Database
3. Go to `config` collection → `upwork_tokens` document
4. Check `expires_at` field vs current time

**Option 2: Check via Logs**
```bash
firebase functions:log | grep "Token Status" -A 5
```

Look for:
- `Is expired? ✅ NO` = Good
- `Is expired? ❌ YES` = Will attempt auto-refresh
- `Error: Response Error: 400 Bad Request` after refresh attempt = Manual re-auth needed

---

## Historical Context

### 2025-10-21: Token Expiration Incident

**What Happened:**
- Access token expired at `2025-10-21T04:23:42.536Z`
- Discovered at `2025-10-21T16:18:25.179Z` (11.91 hours later)
- Automatic refresh failed with `400 Bad Request`
- Refresh token had likely expired due to inactivity

**Resolution:**
- Ran `node functions/setup-upwork-auth.js`
- Obtained fresh OAuth tokens
- Saved to Firestore
- Normal operation resumed

**Lessons Learned:**
- Refresh tokens can expire after extended periods of inactivity
- The scheduled function should run hourly to prevent this
- Need to monitor scheduled function execution

**Related Work:**
- Architecture refactoring completed same day (unrelated to this issue)
- ES module import fix in `src/services/proposals/index.ts` (unrelated)

---

## Related Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - Code structure and organization
- [Setup Checklist](./SETUP_CHECKLIST.md) - Initial setup steps
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Feature development guide

---

*Last updated: 2025-10-21*
*Documented after token expiration incident*
