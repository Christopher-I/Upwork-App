/**
 * One-time setup script to authorize Upwork API and store tokens
 *
 * Run this script once:
 * node setup-upwork-auth.js
 */

const readline = require('readline');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const API = require('@upwork/node-upwork-oauth2');

// Check if service account key exists
const serviceAccountPath = path.join(__dirname, '..', 'upwork-monitor-app-firebase-adminsdk.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n❌ ERROR: Firebase service account key not found!\n');
  console.log('Please download it first:');
  console.log('1. Go to: https://console.firebase.google.com/project/upwork-monitor-app/settings/serviceaccounts/adminsdk');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the file as: upwork-monitor-app-firebase-adminsdk.json');
  console.log('4. Put it in: /Users/chris_mac_air/work/upworkApp/\n');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Upwork API configuration
const config = {
  clientId: process.env.UPWORK_CLIENT_ID || 'df88a3a8224d980f27d9fd04bc50e903',
  clientSecret: process.env.UPWORK_CLIENT_SECRET || 'a0e2db88d2f328cd',
  redirectUri: 'https://seedapp.io', // Must match your Upwork API settings
};

const api = new API(config);

async function setupAuth() {
  console.log('\n=== Upwork API Authorization Setup ===\n');

  // Step 1: Get authorization URL
  const authUrl = api.getAuthorizationUrl();
  console.log('1. Visit this URL in your browser:');
  console.log('\n' + authUrl + '\n');
  console.log('2. Log in to your Upwork account');
  console.log('3. Click "Allow" to authorize the application');
  console.log('4. You will be redirected to a page');
  console.log('5. Copy the "code" parameter from the URL');
  console.log('   (It will look like: ?code=XXXXXXXXXXXXXXXX)');
  console.log('');

  // Step 2: Get authorization code from user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const authCode = await new Promise((resolve) => {
    rl.question('Paste the authorization code here: ', (code) => {
      rl.close();
      resolve(code.trim());
    });
  });

  if (!authCode) {
    console.error('Error: No authorization code provided');
    process.exit(1);
  }

  console.log('\nExchanging code for tokens...');

  // Step 3: Exchange code for tokens
  const tokens = await new Promise((resolve, reject) => {
    api.getToken(authCode, (error, token) => {
      if (error) {
        console.error('Error getting token:', error);
        reject(error);
      } else {
        resolve(token);
      }
    });
  });

  console.log('\n✓ Tokens received successfully!');
  console.log('Access Token:', tokens.token.access_token.substring(0, 20) + '...');
  console.log('Expires in:', tokens.token.expires_in, 'seconds');

  // Step 4: Store tokens in Firestore
  await db.collection('config').doc('upwork_tokens').set({
    access_token: tokens.token.access_token,
    refresh_token: tokens.token.refresh_token,
    token_type: tokens.token.token_type,
    expires_in: tokens.token.expires_in,
    expires_at: tokens.token.expires_at,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('\n✓ Tokens stored in Firestore!');
  console.log('\nSetup complete! You can now use the Cloud Function to fetch jobs from Upwork.');
  console.log('The tokens will be automatically refreshed when they expire.\n');

  process.exit(0);
}

setupAuth().catch((error) => {
  console.error('\nSetup failed:', error.message);
  process.exit(1);
});
