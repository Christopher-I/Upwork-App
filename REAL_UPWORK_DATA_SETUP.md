# Real Upwork Data Setup - COMPLETE GUIDE

## Current Status

✅ **Cloud Function Created**: The backend code is written and ready in `functions/src/index.ts`
✅ **Frontend Updated**: The app now calls the Cloud Function instead of mock data
❌ **Not Deployed**: Cloud Functions require Firebase Blaze (pay-as-you-go) plan

## What You Need to Do

### Option 1: Use Firebase Cloud Functions (Recommended - Requires Paid Plan)

**Cost**: Firebase Blaze plan is pay-as-you-go. Cloud Functions have a generous free tier:
- 2 million invocations/month free
- 400,000 GB-seconds free
- Only pay for what you use beyond that
- Typically costs $0-5/month for small apps

**Steps:**

1. **Upgrade to Blaze Plan**:
   ```bash
   # Visit this URL to upgrade:
   https://console.firebase.google.com/project/upwork-monitor-app/usage/details
   ```

2. **Configure Upwork API Key**:
   ```bash
   firebase functions:config:set upwork.api_key="YOUR_UPWORK_API_KEY"
   ```

3. **Deploy the Function**:
   ```bash
   firebase deploy --only functions
   ```

4. **Done!** Click "Fetch from Upwork" button in the app

### Option 2: Use Render.com Free Backend (No Credit Card Required)

Render.com offers a free tier for web services (no credit card needed).

**Steps:**

1. **Create `backend` directory**:
   ```bash
   mkdir backend
   cd backend
   npm init -y
   npm install express cors graphql-request dotenv
   ```

2. **Create `backend/server.js`**:
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const { GraphQLClient } = require('graphql-request');

   const app = express();
   app.use(cors());
   app.use(express.json());

   const PORT = process.env.PORT || 3001;
   const UPWORK_API_KEY = process.env.UPWORK_API_KEY;

   app.post('/api/fetch-jobs', async (req, res) => {
     try {
       const { keywords, filters } = req.body;

       const client = new GraphQLClient('https://api.upwork.com/graphql', {
         headers: {
           'X-Upwork-API-Key': UPWORK_API_KEY,
         },
       });

       // [Copy the query building and fetching logic from functions/src/index.ts]

       res.json({ jobs: results, count: results.length });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });

   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

3. **Deploy to Render.com**:
   - Go to https://render.com
   - Click "New +" > "Web Service"
   - Connect your GitHub repo
   - Set Environment Variables:
     - `UPWORK_API_KEY` = your key
   - Deploy

4. **Update frontend** (src/components/AddMockDataButton.tsx):
   ```typescript
   // Replace Cloud Function call with:
   const response = await fetch('https://your-app.onrender.com/api/fetch-jobs', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ keywords: settings.keywords, filters: {...} })
   });
   const data = await response.json();
   ```

### Option 3: Keep Using Mock Data for Now

The app works perfectly with mock data for development and testing. You can:
- Test all features
- Refine the UI/UX
- Test proposal generation
- Test scoring algorithm

Then deploy the backend later when ready for production.

## Getting Upwork API Key

⚠️ **Important**: The Upwork API requires approval and may need OAuth 2.0 (not just an API key).

1. Visit https://www.upwork.com/developer/
2. Create a new app
3. Get your API credentials
4. **Note**: You may need to implement OAuth 2.0 flow (see UPWORK_API_BACKEND_SETUP.md)

## Current App Behavior

When you click "Fetch from Upwork":
1. ✅ Calls Cloud Function `fetchUpworkJobs`
2. ❌ Function not deployed yet (needs Blaze plan)
3. ✅ Falls back to mock data with informative error message

## Next Steps (Recommended Order)

1. **Test with mock data** - Make sure everything works ✅
2. **Decide on backend option**:
   - Firebase Cloud Functions (easiest, $0-5/month)
   - Render.com (free, more setup)
   - Other hosting (Railway, Fly.io, etc.)
3. **Get Upwork API credentials**
4. **Deploy backend**
5. **Configure API key**
6. **Test with real data** 🎉

## Files Already Created

✅ `functions/src/index.ts` - Cloud Function code (ready to deploy)
✅ `functions/package.json` - Dependencies
✅ `functions/tsconfig.json` - TypeScript config
✅ `firebase.json` - Updated with functions config
✅ `src/components/AddMockDataButton.tsx` - Frontend updated to call Cloud Function

## Questions?

- Cloud Functions cost too much? → Use Render.com free tier
- Don't have Upwork API key? → Keep using mock data for now
- Want to test immediately? → Mock data works perfectly

The app is **fully functional** with mock data. Real API integration is optional and can be added anytime!
