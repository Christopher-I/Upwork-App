/**
 * Check Upwork OAuth token status in Firestore
 */
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./upwork-monitor-app-firebase-adminsdk-ht8f6-ee3f91ffd5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkTokens() {
  try {
    console.log('🔍 Checking Upwork OAuth tokens in Firestore...\n');

    const tokenDoc = await db.collection('config').doc('upwork_tokens').get();

    if (!tokenDoc.exists) {
      console.log('❌ No tokens found in Firestore!');
      console.log('   Path: config/upwork_tokens');
      console.log('   You need to run the OAuth setup script first.\n');
      process.exit(1);
    }

    const tokens = tokenDoc.data();

    console.log('✅ Tokens found in Firestore\n');
    console.log('📋 Token Details:');
    console.log('   Access Token:', tokens.access_token ? tokens.access_token.substring(0, 30) + '...' : '❌ MISSING');
    console.log('   Refresh Token:', tokens.refresh_token ? tokens.refresh_token.substring(0, 30) + '...' : '❌ MISSING');
    console.log('   Expires In:', tokens.expires_in || '❌ MISSING', 'seconds');
    console.log('   Expires At:', tokens.expires_at || '❌ MISSING');

    if (tokens.updated_at) {
      console.log('   Last Updated:', tokens.updated_at.toDate ? tokens.updated_at.toDate().toISOString() : tokens.updated_at);
    }

    // Check if expired
    if (tokens.expires_at) {
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const isExpired = expiresAt < now;

      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      console.log('\n⏰ Expiration Status:');
      console.log('   Current Time:', now.toISOString());
      console.log('   Expires At:', expiresAt.toISOString());
      console.log('   Is Expired?', isExpired ? '❌ YES' : '✅ NO');

      if (isExpired) {
        console.log('   Expired:', Math.abs(hoursUntilExpiry).toFixed(2), 'hours ago');
        console.log('\n⚠️  TOKEN IS EXPIRED! This is likely causing the 500 error.');
        console.log('   The Cloud Function should auto-refresh on next call.');
        console.log('   Try fetching jobs again - it should refresh automatically.');
      } else {
        console.log('   Time Until Expiry:', hoursUntilExpiry.toFixed(2), 'hours');
        console.log('\n✅ Token is still valid.');
      }
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tokens:', error);
    process.exit(1);
  }
}

checkTokens();
