/**
 * Fix corrupted tokens by running auth flow and saving to Firestore
 * This uses Firebase CLI's authentication, no service account needed
 */

const readline = require('readline');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const API = require('@upwork/node-upwork-oauth2');
require('dotenv').config();

// Firebase config (from your app)
const firebaseConfig = {
  apiKey: "AIzaSyBMC2bHe7YQLB5lmz9cS0Pr6SN5AoG6bKg",
  authDomain: "upwork-monitor-app.firebaseapp.com",
  projectId: "upwork-monitor-app",
  storageBucket: "upwork-monitor-app.firebasestorage.app",
  messagingSenderId: "568596072855",
  appId: "1:568596072855:web:3cfde9c80da74de71c8c39"
};

// Initialize Firebase (client SDK)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Upwork API configuration
const config = {
  clientId: process.env.UPWORK_CLIENT_ID || 'df88a3a8224d980f27d9fd04bc50e903',
  clientSecret: process.env.UPWORK_CLIENT_SECRET || 'a0e2db88d2f328cd',
  redirectUri: 'https://seedapp.io',
};

const api = new API(config);

async function setupAuth() {
  console.log('\n🔧 === Upwork Token Refresh Setup ===\n');

  // Step 1: Get authorization URL
  const authUrl = api.getAuthorizationUrl();
  console.log('1️⃣  Visit this URL in your browser:');
  console.log('\n   ' + authUrl + '\n');
  console.log('2️⃣  Log in to your Upwork account');
  console.log('3️⃣  Click "Allow" to authorize the application');
  console.log('4️⃣  Copy the "code" parameter from the redirect URL');
  console.log('   (Example: https://seedapp.io?code=XXXXXXXX)\n');

  // Step 2: Get authorization code from user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const authCode = await new Promise((resolve) => {
    rl.question('📝 Paste the authorization code here: ', (code) => {
      rl.close();
      resolve(code.trim());
    });
  });

  if (!authCode) {
    console.error('❌ No authorization code provided');
    process.exit(1);
  }

  console.log('\n🔄 Exchanging code for tokens...');

  // Step 3: Exchange code for tokens
  const tokens = await new Promise((resolve, reject) => {
    api.getToken(authCode, (error, token) => {
      if (error) {
        console.error('❌ Error getting token:', error);
        reject(error);
      } else {
        resolve(token);
      }
    });
  });

  console.log('\n✅ Tokens received successfully!');
  console.log('   Access Token:', tokens.token.access_token.substring(0, 20) + '...');
  console.log('   Refresh Token:', tokens.token.refresh_token.substring(0, 20) + '...');
  console.log('   Expires in:', tokens.token.expires_in, 'seconds');

  // Step 4: Calculate expires_at
  const expiresAt = new Date(Date.now() + tokens.token.expires_in * 1000);

  // Step 5: Save to Firestore
  console.log('\n💾 Saving tokens to Firestore...');

  const tokenData = {
    access_token: tokens.token.access_token,
    refresh_token: tokens.token.refresh_token,
    token_type: tokens.token.token_type,
    expires_in: tokens.token.expires_in,
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  };

  await setDoc(doc(db, 'config', 'upwork_tokens'), tokenData);

  console.log('✅ Tokens saved to Firestore!');
  console.log('   Expires at:', expiresAt.toISOString());
  console.log('\n🎉 Setup complete! Your Cloud Function will now auto-refresh tokens.\n');

  process.exit(0);
}

setupAuth().catch((error) => {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
});
