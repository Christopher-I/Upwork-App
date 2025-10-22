const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'upwork-monitor-app-firebase-adminsdk.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('❌ Service account key not found at:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkTokens() {
  console.log('📋 Checking Upwork tokens in Firestore...\n');
  
  const tokenDoc = await db.collection('config').doc('upwork_tokens').get();
  
  if (!tokenDoc.exists) {
    console.log('❌ NO TOKENS FOUND in Firestore');
    console.log('   Document: config/upwork_tokens does not exist\n');
    console.log('👉 You need to run: node setup-upwork-auth.js\n');
    process.exit(1);
  }
  
  const data = tokenDoc.data();
  console.log('✅ Tokens document EXISTS in Firestore\n');
  console.log('Token fields:');
  console.log('  - access_token:', data.access_token ? data.access_token.substring(0, 20) + '...' : 'MISSING');
  console.log('  - refresh_token:', data.refresh_token ? data.refresh_token.substring(0, 20) + '...' : 'MISSING');
  console.log('  - expires_in:', data.expires_in || 'MISSING');
  console.log('  - expires_at:', data.expires_at || 'MISSING');
  console.log('  - updated_at:', data.updated_at ? (data.updated_at.toDate ? data.updated_at.toDate() : new Date(data.updated_at)) : 'MISSING');

  if (data.expires_at) {
    // Handle both Firestore Timestamp and string ISO dates
    const expiresAt = data.expires_at.toDate ? data.expires_at.toDate() : new Date(data.expires_at);
    const now = new Date();
    const isExpired = expiresAt < now;
    const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
    
    console.log('\n⏰ Token Status:');
    console.log('  - Expires at:', expiresAt.toISOString());
    console.log('  - Current time:', now.toISOString());
    console.log('  - Is expired?', isExpired ? '❌ YES' : '✅ NO');
    
    if (!isExpired) {
      console.log('  - Time until expiry:', hoursUntilExpiry.toFixed(1), 'hours');
    } else {
      console.log('  - Expired:', Math.abs(hoursUntilExpiry).toFixed(1), 'hours ago');
    }
  }
  
  console.log('\n');
  process.exit(0);
}

checkTokens().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
