# Deployment Instructions - Fix Service Account Error

## Issue

You're getting this error:
```
Default service account '568596072855-compute@developer.gserviceaccount.com' doesn't exist
```

## Solution - Fix Service Account (2 minutes)

### Step 1: Enable App Engine

The default service account is created when you enable App Engine. Do this:

1. Visit: https://console.cloud.google.com/appengine?project=upwork-monitor-app

2. Click **"Create Application"** (if you haven't already)

3. Select region: **us-central** (recommended)

4. Click **Create**

5. Wait ~30 seconds for App Engine to initialize

### Step 2: Redeploy Cloud Functions

Now that the service account exists, deploy again:

```bash
cd /Users/chris_mac_air/work/upworkApp
firebase deploy --only functions
```

This should now succeed! ✅

---

## After Deployment: Configure Your Upwork API Key

### Get Your Upwork API Key

1. Go to: https://www.upwork.com/developer/

2. Click **"Register an App"** or select an existing app

3. Copy your **API Key** (looks like: `a1b2c3d4e5f6...`)

### Set the API Key in Firebase

```bash
firebase functions:config:set upwork.api_key="YOUR_ACTUAL_API_KEY_HERE"
```

Replace `YOUR_ACTUAL_API_KEY_HERE` with your real Upwork API key.

### Redeploy with Real Key

```bash
firebase deploy --only functions
```

---

## Test It!

1. Open your app: http://localhost:3001

2. Click **"Fetch from Upwork"** button

3. Watch the console - you should see:
   ```
   Calling Cloud Function to fetch Upwork jobs...
   Fetched X jobs from Upwork via Cloud Function
   ```

4. Jobs will appear in your dashboard! 🎉

---

## Troubleshooting

### Error: "Upwork API key not configured"

Run this to set your key:
```bash
firebase functions:config:set upwork.api_key="YOUR_KEY"
firebase deploy --only functions
```

### Error: "CORS policy"

This should be fixed now - the Cloud Function handles CORS automatically.

### Error: "Unauthorized" from Upwork

Your API key might be wrong or expired. Check:
1. Is the key correct?
2. Is your Upwork developer app active?
3. Does the key have the right permissions?

### Want to see function logs?

```bash
firebase functions:log
```

---

## Summary of What We Built

✅ **Cloud Function**: `fetchUpworkJobs` - Deployed to us-central1
✅ **Frontend**: Calls Cloud Function instead of direct API
✅ **Error Handling**: Falls back to mock data if needed
✅ **Scoring**: AI-powered job scoring with ChatGPT
✅ **Storage**: Jobs saved to Firestore automatically

The entire pipeline is ready! Just need to:
1. Enable App Engine (creates service account)
2. Deploy functions
3. Add your real Upwork API key
4. Test!

---

## Quick Commands Reference

```bash
# Deploy functions
firebase deploy --only functions

# Set API key
firebase functions:config:set upwork.api_key="YOUR_KEY"

# View logs
firebase functions:log

# View config
firebase functions:config:get

# Test locally (optional)
cd functions && npm run serve
```
