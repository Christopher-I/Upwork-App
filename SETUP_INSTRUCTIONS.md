# Upwork API Setup Instructions

## Problem Identified

Your Upwork API key does NOT support `client_credentials` grant. This grant type requires an **Enterprise account**, which you don't have.

## Solution

Use **Authorization Code Grant** with stored tokens that auto-refresh.

## Setup Steps

### 1. Download Firebase Service Account Key

1. Go to: https://console.firebase.google.com/project/upwork-monitor-app/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Save the file as `upwork-monitor-app-firebase-adminsdk.json` in the project root directory

### 2. Run the Setup Script

```bash
cd /Users/chris_mac_air/work/upworkApp/functions
node setup-upwork-auth.js
```

### 3. Follow the Prompts

The script will:
1. Show you a URL to visit
2. You'll log into Upwork and authorize the app
3. You'll copy the authorization code from the redirected URL
4. Paste it into the script
5. The script will exchange it for tokens and store them in Firestore

### 4. Deploy the Cloud Function

```bash
firebase deploy --only functions
```

### 5. Test

Click "Fetch from Upwork" in your app - it should work!

## How It Works

- **One-time authorization**: You authorize once manually
- **Stored tokens**: Tokens are saved in Firestore (`config/upwork_tokens`)
- **Auto-refresh**: When tokens expire, they're automatically refreshed
- **No re-authorization needed**: As long as you don't revoke access, it works forever

## Security

- Service account key is only used locally for setup
- Tokens are stored securely in Firestore
- Cloud Function reads/updates tokens as needed
- Add `upwork-monitor-app-firebase-adminsdk.json` to `.gitignore`

## Troubleshooting

If you get "Upwork tokens not found" error:
- Run the setup script again
- Make sure Firestore has the document at `config/upwork_tokens`

If authorization fails:
- Make sure you're logged into the correct Upwork account
- Check that your API credentials are correct in `.env`
