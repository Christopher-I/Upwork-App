# Quick Start - Get Upwork Integration Working

## TL;DR

Your Upwork account doesn't support `client_credentials` (Enterprise-only). I've fixed it to use the proper auth flow. Just run these commands:

```bash
# 1. Download service account key from Firebase Console
#    https://console.firebase.google.com/project/upwork-monitor-app/settings/serviceaccounts/adminsdk
#    Save as: upwork-monitor-app-firebase-adminsdk.json

# 2. Run setup script
cd functions
node setup-upwork-auth.js

# 3. Follow prompts:
#    - Visit the URL shown
#    - Log into Upwork and click "Allow"
#    - Copy the code from redirected URL
#    - Paste it when prompted

# 4. Done! Test the app
```

## What to Expect

The setup script will:
1. Show you a URL
2. Ask you to visit it and authorize
3. Ask you to paste the authorization code
4. Store the tokens in Firestore
5. Print "Setup complete!"

Then just click "Fetch from Upwork" in your browser - it will work!

## Full Details

See `SOLUTION_SUMMARY.md` for complete technical explanation.
See `SETUP_INSTRUCTIONS.md` for detailed step-by-step guide.

---

**Status**: ✅ Everything deployed and ready. Just need your one-time authorization!
