# Upwork Job Assistant

AI-powered app to find and recommend the best Upwork jobs with proposals ready to send.

## 🎯 Goal

Open the app, see 15-20 best jobs with AI-generated proposals. Apply to 5-7 in 30 minutes.

## 📋 Current Status

✅ Project structure created
⏳ Firebase setup (you need to do this)
⏳ API keys configuration (you need to do this)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Firebase (REQUIRED)

Go to https://console.firebase.google.com/ and:

1. Click "Add project"
2. Name it: `upwork-job-assistant`
3. Disable Google Analytics (optional)
4. Click "Create project"

**Enable services:**
- **Firestore Database**: Click "Create database" → Test mode → us-central1
- **Cloud Functions**: Upgrade to Blaze plan (pay-as-you-go, ~$1-2/month)

### 3. Get Your Firebase Config

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" (</> icon)
4. Register app: "Upwork Job Assistant"
5. Copy the config values

### 4. Create .env.local File

```bash
# Copy the example file
cp .env.example .env.local

# Then edit .env.local with your actual values
```

**IMPORTANT:** Never commit `.env.local` to git! It's already in `.gitignore`.

### 5. Add Your API Keys to .env.local

Open `.env.local` and fill in:

```bash
# Firebase (from step 3)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=upwork-job-assistant.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=upwork-job-assistant
VITE_FIREBASE_STORAGE_BUCKET=upwork-job-assistant.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123...
VITE_FIREBASE_APP_ID=1:123...

# Upwork API (from https://www.upwork.com/developer/)
VITE_UPWORK_API_KEY=your_new_upwork_key
VITE_UPWORK_API_SECRET=your_upwork_secret

# OpenAI API (from https://platform.openai.com/api-keys)
VITE_OPENAI_API_KEY=sk-your_new_openai_key
```

### 6. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 - you should see the app!

## 📁 Project Structure

```
upworkApp/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Firebase, Upwork, OpenAI clients
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
│
├── functions/          # Firebase Cloud Functions (coming next)
│
├── IMPLEMENTATION_PLAN.md    # Detailed technical plan
├── EXECUTION_ROADMAP.md      # Step-by-step guide
└── README.md                 # This file
```

## 📊 Implementation Progress

### ✅ Phase 0: Setup (DONE)
- [x] Project structure
- [x] Package.json
- [x] TypeScript config
- [x] Tailwind CSS
- [x] Basic React app

### ⏳ Phase 1: Core MVP (IN PROGRESS)
- [ ] Firebase integration
- [ ] Upwork API client
- [ ] Scoring algorithm
- [ ] Cloud Functions
- [ ] Dashboard UI

### ⏳ Phase 2: Proposals
- [ ] ChatGPT integration
- [ ] Proposal generation
- [ ] Batch processing

### ⏳ Phase 3: Tracking
- [ ] Applied tracking
- [ ] Win rate calculation
- [ ] Settings UI

### ⏳ Phase 4: Polish
- [ ] Scheduled refreshes
- [ ] Error handling
- [ ] Mobile responsive
- [ ] Production deployment

## 🔐 Security Reminders

- ❌ NEVER commit `.env.local` or any `.env` files
- ❌ NEVER share API keys in chat, email, or public repos
- ✅ DO store API keys in `.env.local` (already in `.gitignore`)
- ✅ DO use environment variables for sensitive data

## 📚 Documentation

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Technical details, architecture, data models
- [Execution Roadmap](./EXECUTION_ROADMAP.md) - Day-by-day implementation guide

## 🆘 Need Help?

Check the Execution Roadmap for step-by-step instructions!

## ⏭️ Next Steps

1. Complete Firebase setup (above)
2. Add your API keys to `.env.local`
3. Run `npm install`
4. Run `npm run dev`
5. Follow the Execution Roadmap to build Phase 1

---

**Current Phase:** Setup & Configuration
**Next Milestone:** See 18 jobs with scores after clicking Refresh
# Upwork-App
