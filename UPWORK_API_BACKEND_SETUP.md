# Upwork API Backend Setup Guide

## Why a Backend is Required

The Upwork API **cannot** be called directly from the browser because:

1. **CORS Restrictions**: Upwork's API doesn't allow browser requests (Cross-Origin Resource Sharing is blocked)
2. **OAuth 2.0 Authentication**: Requires server-side OAuth flow with client secrets
3. **Security**: API credentials should never be exposed in browser code

## Current State

✅ **Mock Data**: The app currently uses mock/test data for development
❌ **Real API**: Requires backend implementation (not yet set up)

## Implementation Options

### Option 1: Firebase Cloud Functions (Recommended)

**Pros:**
- Already using Firebase for database
- Serverless (no infrastructure management)
- Free tier available
- Easy to deploy

**Steps:**

1. **Install Firebase CLI and initialize Functions:**
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

2. **Create Cloud Function** (`functions/src/index.ts`):
```typescript
import * as functions from 'firebase-functions';
import { GraphQLClient } from 'graphql-request';

// Store credentials in Firebase Functions config
// firebase functions:config:set upwork.client_id="your_id" upwork.client_secret="your_secret"

export const fetchUpworkJobs = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { keywords, filters } = data;

  // Get OAuth token (implement OAuth flow)
  const accessToken = await getUpworkAccessToken();

  // Call Upwork API
  const client = new GraphQLClient('https://api.upwork.com/graphql', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const query = buildJobSearchQuery(filters);
  const results = await client.request(query, { query: keywords });

  return results;
});

async function getUpworkAccessToken(): Promise<string> {
  // Implement OAuth 2.0 flow
  // 1. Exchange client_id + client_secret for access token
  // 2. Cache token (store in Firestore with expiration)
  // 3. Refresh when expired

  // See: https://developers.upwork.com/api-documentation/v3/authentication.html

  throw new Error('OAuth not implemented yet');
}
```

3. **Update frontend** (`src/lib/upwork.ts`):
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const fetchUpworkJobsFunction = httpsCallable(functions, 'fetchUpworkJobs');

export async function fetchAllJobs(keywords, filters) {
  const result = await fetchUpworkJobsFunction({ keywords, filters });
  return result.data;
}
```

4. **Deploy:**
```bash
firebase deploy --only functions
```

### Option 2: Node.js/Express Backend

**Pros:**
- Full control
- Can host anywhere (Heroku, Railway, Vercel, etc.)

**Cons:**
- More setup
- Need to manage server

**Steps:**

1. **Create Express server** (`backend/server.js`):
```javascript
const express = require('express');
const cors = require('cors');
const { GraphQLClient } = require('graphql-request');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/fetch-jobs', async (req, res) => {
  try {
    const { keywords, filters } = req.body;

    // Get OAuth token
    const accessToken = await getUpworkAccessToken();

    // Call Upwork API
    const client = new GraphQLClient('https://api.upwork.com/graphql', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const results = await client.request(query, { query: keywords });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Backend running on port 3001');
});
```

2. **Update frontend** to call `http://localhost:3001/api/fetch-jobs`

3. **Deploy** to hosting platform

## Upwork OAuth 2.0 Setup

1. **Register your app** at https://www.upwork.com/developer/apps/new
2. **Get credentials:**
   - Client ID
   - Client Secret
   - Redirect URI (e.g., `https://your-app.com/oauth/callback`)

3. **Implement OAuth flow:**
   - User clicks "Connect Upwork"
   - Redirect to Upwork authorization URL
   - User approves
   - Upwork redirects back with authorization code
   - Exchange code for access token
   - Store token securely (encrypted in Firestore)
   - Refresh token when expired

4. **Store tokens securely:**
```typescript
// Example token storage in Firestore
await db.collection('upworkTokens').doc(userId).set({
  accessToken: encrypt(token.access_token),
  refreshToken: encrypt(token.refresh_token),
  expiresAt: Date.now() + token.expires_in * 1000,
});
```

## Resources

- **Upwork API Docs**: https://developers.upwork.com/
- **OAuth 2.0 Guide**: https://developers.upwork.com/api-documentation/v3/authentication.html
- **GraphQL API**: https://developers.upwork.com/api-documentation/v3/graphql.html
- **Firebase Cloud Functions**: https://firebase.google.com/docs/functions

## Current Workaround

For development and testing, the app uses **mock data** that simulates real Upwork jobs. This allows you to:
- Test the scoring algorithm
- Test proposal generation
- Test the UI/UX
- Develop features without API access

To add mock data:
1. Click "Add Test Data" button
2. Mock jobs will be scored and added to Firestore
3. View them in the dashboard

## Next Steps

1. **Phase 1** (Current): Use mock data for development ✅
2. **Phase 2**: Implement Firebase Cloud Functions backend
3. **Phase 3**: Set up OAuth 2.0 authentication
4. **Phase 4**: Connect to real Upwork API
5. **Phase 5**: Add scheduled job fetching (cron job)

## Estimated Implementation Time

- Firebase Functions setup: 2-3 hours
- OAuth 2.0 implementation: 4-6 hours
- Upwork API integration: 2-3 hours
- Testing and debugging: 2-3 hours
- **Total**: ~10-15 hours

## Security Considerations

⚠️ **Never expose API credentials in frontend code**
✅ Always use environment variables on the backend
✅ Encrypt access tokens in database
✅ Implement rate limiting
✅ Validate all user inputs
✅ Use Firebase Auth to restrict function access
