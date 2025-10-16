# Deploying to Vercel

## Important: Understanding Firebase Keys

**Good News:** Your Firebase API keys DO NOT expire! They are safe to use in production.

- `VITE_FIREBASE_API_KEY` - Web API key (public, never expires)
- Firebase automatically handles authentication and security rules
- Your Cloud Functions use service accounts (managed by Firebase, never expire)

## Step-by-Step Deployment

### 1. Push to GitHub (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables** (click "Environment Variables"):

```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENAI_API_KEY=sk-your_openai_key
```

6. Click **"Deploy"**

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
# When asked about environment variables, add them from your .env file
```

### 3. Configure Firebase Cloud Functions

Your Cloud Functions are already deployed to Firebase. They will work with your Vercel frontend automatically because:

1. Cloud Functions are hosted on Firebase (separate from Vercel)
2. Your frontend calls them via HTTPS endpoints
3. CORS is already configured in your Cloud Functions

**No additional configuration needed!**

### 4. Verify Deployment

After deployment, test these features:

- ✅ Dashboard loads
- ✅ Settings panel works
- ✅ "Fetch from Upwork" button triggers Cloud Function
- ✅ Jobs display correctly
- ✅ Firestore data syncs

## Important Notes

### What NEVER Expires:
- ✅ Firebase Web API keys
- ✅ Firebase Service Account (used by Cloud Functions)
- ✅ OpenAI API keys (unless you manually revoke them)
- ✅ Vercel deployments (unless you delete them)

### What DOES Expire:
- ⚠️ **Upwork OAuth Access Tokens** (24 hours)
  - Solution: Use refresh tokens to get new access tokens
  - Your Cloud Function should handle this automatically
  - Check `/functions/src/index.ts` for OAuth refresh logic

### Security Best Practices:

1. **Never commit `.env` files** (already in `.gitignore` ✅)
2. **Use Vercel Environment Variables** for all secrets
3. **Configure Firestore Security Rules** to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated users (if you add auth)
    // Or restrict by IP/domain for now
    match /{document=**} {
      allow read, write: if true; // UPDATE THIS for production!
    }
  }
}
```

4. **Set up Firebase App Check** for additional security

## Updating Your Deployment

Vercel automatically redeploys when you push to your main branch:

```bash
git add .
git commit -m "Your changes"
git push
```

Or manually trigger a deployment:

```bash
vercel --prod
```

## Troubleshooting

### Issue: "Firebase not defined"
- **Solution**: Check that all `VITE_FIREBASE_*` variables are set in Vercel

### Issue: "Cloud Function not found"
- **Solution**: Make sure Cloud Functions are deployed to Firebase:
  ```bash
  cd functions
  npm run build
  cd ..
  firebase deploy --only functions
  ```

### Issue: "CORS error"
- **Solution**: Cloud Functions should already have CORS configured. Check `/functions/src/index.ts`

### Issue: Upwork data not fetching
- **Solution**: Check that your Upwork OAuth credentials are valid
- Upwork access tokens expire every 24 hours
- Make sure your Cloud Function refreshes the token automatically

## Monitoring

### Vercel Dashboard:
- View deployment logs
- Monitor build times
- Check environment variables

### Firebase Console:
- Monitor Cloud Function invocations
- Check Firestore usage
- View function logs

### Cost Optimization:

1. **Firebase**: Free tier includes:
   - 50K reads/day
   - 20K writes/day
   - 125K invocations/month for Cloud Functions

2. **Vercel**: Free tier includes:
   - Unlimited deployments
   - 100GB bandwidth/month
   - Automatic HTTPS

3. **OpenAI**: Monitor usage at platform.openai.com

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Vite Docs: https://vitejs.dev/guide/

---

**Summary**: Your Firebase keys are permanent! Just add them as environment variables in Vercel, and your app will work indefinitely. The only thing that expires is the Upwork OAuth token, which should be automatically refreshed by your Cloud Function.
