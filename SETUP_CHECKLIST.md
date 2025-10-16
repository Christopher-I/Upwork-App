# Setup Checklist

Complete these steps before starting development:

## ✅ Completed
- [x] Project structure created
- [x] Dependencies installed
- [x] Git ignore configured
- [x] TypeScript + Tailwind configured

## ⏳ Your Action Required

### 1. Create Firebase Project (15 minutes)

1. **Go to:** https://console.firebase.google.com/
2. **Click:** "Add project"
3. **Name:** `upwork-job-assistant`
4. **Disable Google Analytics** (optional, simpler for now)
5. **Click:** "Create project"

### 2. Enable Firestore (5 minutes)

1. In Firebase Console, click **"Firestore Database"**
2. Click **"Create database"**
3. **Mode:** Start in **test mode** (we'll secure it later)
4. **Location:** `us-central` (or your nearest region)
5. Click **"Enable"**

### 3. Upgrade to Blaze Plan (2 minutes)

**Why:** Cloud Functions require Blaze (pay-as-you-go)
**Cost:** ~$1-2/month for this app

1. Click **"Upgrade"** in Firebase Console
2. Select **"Blaze"** plan
3. Set budget alert: **$10/month** (for safety)
4. Confirm

### 4. Get Firebase Config (5 minutes)

1. In Firebase Console, click **gear icon** → **Project settings**
2. Scroll to **"Your apps"**
3. Click **"Web app"** button (`</>` icon)
4. **Register app:** Name it "Upwork Job Assistant"
5. **Copy the config** (you'll paste this in `.env.local`)

### 5. Get NEW API Keys (10 minutes)

**Upwork API:**
1. Go to: https://www.upwork.com/developer/
2. Click **"Get API Keys"**
3. Create new app (NOT the old one you exposed)
4. Name: "Job Assistant v2"
5. Copy: API Key + Secret

**OpenAI API:**
1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Name: "Upwork Job Assistant v2"
4. Copy key immediately (can't view again)
5. Add $10-20 credits to your account

### 6. Create .env.local File (5 minutes)

```bash
# In terminal, from project root:
cp .env.example .env.local
```

Then open `.env.local` and fill in YOUR actual values:

```bash
# Firebase Config (from step 4)
VITE_FIREBASE_API_KEY=AIza...  # Your actual key
VITE_FIREBASE_AUTH_DOMAIN=upwork-job-assistant.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=upwork-job-assistant
VITE_FIREBASE_STORAGE_BUCKET=upwork-job-assistant.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123...
VITE_FIREBASE_APP_ID=1:123...

# Upwork API (from step 5)
VITE_UPWORK_API_KEY=df88...  # YOUR NEW KEY
VITE_UPWORK_API_SECRET=abc...

# OpenAI API (from step 5)
VITE_OPENAI_API_KEY=sk-proj-...  # YOUR NEW KEY
```

### 7. Verify Setup (2 minutes)

```bash
# Test the dev server
npm run dev
```

**Expected:** Browser opens to http://localhost:3000
**You should see:** "Upwork Job Assistant" page with "Project setup complete!"

---

## ✅ Setup Complete!

Once you see the app running, you're ready to build Phase 1!

**Next step:** Tell me when you're done, and I'll start building the Firebase integration and Upwork API client.

---

## 🆘 Troubleshooting

**Issue: npm install fails**
- Solution: Try `npm install --legacy-peer-deps`

**Issue: Can't find .env.local**
- Solution: Make sure you ran `cp .env.example .env.local`

**Issue: Firebase config not found**
- Solution: Double-check you copied ALL the values from Firebase Console

**Issue: Port 3000 already in use**
- Solution: Kill other apps on port 3000, or change port in `vite.config.ts`

---

## 🔐 Security Reminder

- ✅ `.env.local` is in `.gitignore` (safe)
- ❌ NEVER commit this file
- ❌ NEVER share API keys in chat
- ✅ Keys are ONLY in `.env.local` on your machine
