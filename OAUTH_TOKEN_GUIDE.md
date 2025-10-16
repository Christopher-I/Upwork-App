# Upwork OAuth Token Management Guide

## TL;DR - You're Already Set Up! ✅

**Good news:** Your app automatically refreshes expired Upwork tokens. Once you've authorized once, it will run indefinitely on Vercel without any manual intervention.

## How It Works

### Token Types:

1. **Access Token**
   - Expires: Every 24 hours
   - Used for: Making API requests to Upwork
   - **Automatically refreshed** by your Cloud Function

2. **Refresh Token**
   - Expires: Years (or until manually revoked)
   - Used for: Getting new access tokens
   - Stored in: Firestore (`config/upwork_tokens`)

### Automatic Refresh Flow:

```
User clicks "Fetch from Upwork"
    ↓
Cloud Function loads tokens from Firestore
    ↓
Checks if access token is expired
    ↓
If expired: Uses refresh token to get new access token
    ↓
Saves new tokens back to Firestore
    ↓
Makes API request with valid access token
    ↓
Returns jobs to frontend
```

## Initial Setup (One-Time Only)

You only need to do this once, before deploying to Vercel:

### Step 1: Get Upwork API Credentials

1. Go to https://www.upwork.com/developer/
2. Create a new app
3. Get your `Client ID` and `Client Secret`
4. Set redirect URI to: `https://seedapp.io` (or your domain)

### Step 2: Add Credentials to Firebase

Create a `.env` file in the `/functions` directory:

```bash
cd functions
cat > .env << EOF
UPWORK_CLIENT_ID=your_client_id_here
UPWORK_CLIENT_SECRET=your_client_secret_here
EOF
```

### Step 3: Run the Setup Script

This opens a browser to authorize your Upwork app and saves the tokens to Firestore:

```bash
node setup-upwork-auth.js
```

**What it does:**
1. Opens your browser to Upwork OAuth page
2. You click "Authorize"
3. Script receives the tokens
4. Saves tokens to Firestore: `config/upwork_tokens`

You're done! You never need to do this again unless you:
- Revoke access in Upwork settings
- Delete the Firestore document
- Switch to a different Upwork account

## Verifying Token Storage

Check that tokens are stored in Firestore:

```bash
# View the tokens document
firebase firestore:read config/upwork_tokens
```

You should see:
```json
{
  "access_token": "oauth2v2_...",
  "refresh_token": "oauth2v2_...",
  "expires_in": 86400,
  "expires_at": "2024-10-17T12:00:00.000Z",
  "updated_at": "..."
}
```

## Deployment Checklist

### Before Deploying to Vercel:

- [x] Run `setup-upwork-auth.js` (one-time)
- [x] Verify tokens in Firestore
- [x] Deploy Cloud Functions: `firebase deploy --only functions`
- [x] Test locally: Click "Fetch from Upwork"
- [x] Deploy frontend to Vercel

### Environment Variables Needed in Vercel:

**Frontend only** (Cloud Function credentials are in Firestore):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_OPENAI_API_KEY=...
```

**Note:** Upwork credentials are NOT needed in Vercel because they're:
1. Stored in Firestore (secure)
2. Only accessed by Cloud Functions (server-side)
3. Never exposed to the frontend

## Monitoring Token Health

### Check Token Expiration:

```bash
# View current token info
firebase firestore:read config/upwork_tokens
```

Look at `expires_at` - if it's in the past, the next API call will automatically refresh it.

### Check Cloud Function Logs:

```bash
firebase functions:log
```

Look for:
- ✅ "Access token ready (refreshed if needed)"
- ✅ "Tokens were refreshed, saving to Firestore..."

## Troubleshooting

### Issue: "Upwork tokens not found"

**Cause:** Setup script hasn't been run
**Solution:**
```bash
cd functions
node setup-upwork-auth.js
```

### Issue: "Invalid refresh token"

**Cause:** Refresh token was revoked or expired
**Solution:**
1. Go to Upwork.com → Settings → Apps
2. Remove authorization for your app
3. Run `node setup-upwork-auth.js` again

### Issue: Function works locally but not in production

**Cause:** Firestore might have different data in production
**Solution:**
```bash
# Check production Firestore
firebase firestore:read config/upwork_tokens --project your-project-id
```

### Issue: "Token expired and refresh failed"

**Cause:** Network issue or Upwork API down
**Solution:**
- Check Upwork API status
- Wait a few minutes and try again
- Function will auto-retry on next user request

## Security Best Practices

### ✅ DO:
- Store tokens in Firestore (server-side)
- Use Firebase security rules to restrict access
- Keep `UPWORK_CLIENT_SECRET` in Firebase environment (never in frontend)
- Regularly check Firestore security rules

### ❌ DON'T:
- Commit tokens to Git
- Expose Upwork credentials in frontend code
- Share refresh tokens publicly
- Store tokens in localStorage/sessionStorage

## Token Lifecycle

```
Day 1: Run setup-upwork-auth.js
  ↓
Tokens saved to Firestore
  ↓
Day 2: Access token expires (24 hours)
  ↓
Cloud Function auto-refreshes using refresh token
  ↓
New tokens saved to Firestore
  ↓
Day 3: Process repeats...
  ↓
Years later: Still working! (until refresh token is revoked)
```

## FAQ

### Q: How long will my app work without intervention?
**A:** Indefinitely! As long as:
- You don't revoke access in Upwork
- Firebase project stays active
- Vercel deployment stays active

### Q: What happens if the refresh token expires?
**A:** Refresh tokens typically last for years. If it does expire:
1. Users will see an error when fetching jobs
2. You'll need to run `setup-upwork-auth.js` again
3. It's a one-time 2-minute fix

### Q: Can multiple users use my app?
**A:** Yes! The tokens are stored in Firestore and shared across all users. All users benefit from the same Upwork authorization.

### Q: What if I want to switch Upwork accounts?
**A:**
1. Revoke access in current Upwork account
2. Delete `config/upwork_tokens` from Firestore
3. Run `setup-upwork-auth.js` with new account

### Q: How do I know if tokens are being refreshed?
**A:** Check Cloud Function logs:
```bash
firebase functions:log | grep "refresh"
```

You'll see "Tokens were refreshed, saving to Firestore..." each time.

## Summary

✅ **Setup once** - Run `setup-upwork-auth.js`
✅ **Deploy and forget** - Tokens auto-refresh forever
✅ **No maintenance** - Works indefinitely on Vercel
✅ **Secure** - Tokens stored server-side in Firestore

Your app is production-ready! 🚀
