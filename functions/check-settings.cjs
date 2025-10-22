const admin = require('firebase-admin');
const serviceAccount = require('../upwork-monitor-app-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkSettings() {
  try {
    console.log('📋 Fetching current settings from Firestore...\n');

    const settingsDoc = await db.collection('config').doc('settings').get();

    if (!settingsDoc.exists) {
      console.log('❌ No settings found in Firestore');
      return;
    }

    const settings = settingsDoc.data();

    console.log('🔍 CURRENT KEYWORDS CONFIGURATION:');
    console.log('=====================================\n');

    console.log('📌 Wide Net Keywords:');
    if (settings.keywords?.wideNet) {
      settings.keywords.wideNet.forEach((keyword, i) => {
        console.log(`   ${i + 1}. "${keyword}"`);
      });
    } else {
      console.log('   ❌ Not set');
    }

    console.log('\n📌 Webflow Keywords:');
    if (settings.keywords?.webflow) {
      settings.keywords.webflow.forEach((keyword, i) => {
        console.log(`   ${i + 1}. "${keyword}"`);
      });
    } else {
      console.log('   ❌ Not set');
    }

    console.log('\n📌 Portals Keywords:');
    if (settings.keywords?.portals) {
      settings.keywords.portals.forEach((keyword, i) => {
        console.log(`   ${i + 1}. "${keyword}"`);
      });
    } else {
      console.log('   ❌ Not set');
    }

    console.log('\n📌 E-commerce Keywords:');
    if (settings.keywords?.ecommerce) {
      settings.keywords.ecommerce.forEach((keyword, i) => {
        console.log(`   ${i + 1}. "${keyword}"`);
      });
    } else {
      console.log('   ❌ Not set');
    }

    console.log('\n📌 Speed/SEO Keywords:');
    if (settings.keywords?.speedSEO) {
      settings.keywords.speedSEO.forEach((keyword, i) => {
        console.log(`   ${i + 1}. "${keyword}"`);
      });
    } else {
      console.log('   ❌ Not set');
    }

    console.log('\n📌 Automation Keywords:');
    if (settings.keywords?.automation) {
      settings.keywords.automation.forEach((keyword, i) => {
        console.log(`   ${i + 1}. "${keyword}"`);
      });
    } else {
      console.log('   ❌ Not set');
    }

    console.log('\n📌 Vertical Keywords:');
    if (settings.keywords?.vertical) {
      settings.keywords.vertical.forEach((keyword, i) => {
        console.log(`   ${i + 1}. "${keyword}"`);
      });
    } else {
      console.log('   ❌ Not set');
    }

    console.log('\n📌 App Development Keywords:');
    if (settings.keywords?.appDevelopment) {
      settings.keywords.appDevelopment.forEach((keyword, i) => {
        console.log(`   ${i + 1}. "${keyword}"`);
      });
    } else {
      console.log('   ❌ Not set');
    }

    // Count total searches
    const allKeywords = [
      ...(settings.keywords?.wideNet || []),
      ...(settings.keywords?.webflow || []),
      ...(settings.keywords?.portals || []),
      ...(settings.keywords?.ecommerce || []),
      ...(settings.keywords?.speedSEO || []),
      ...(settings.keywords?.automation || []),
      ...(settings.keywords?.vertical || []),
      ...(settings.keywords?.appDevelopment || []),
    ];

    console.log('\n=====================================');
    console.log(`📊 TOTAL SEARCH QUERIES: ${allKeywords.length}`);
    console.log('=====================================\n');

    // Show platform filters
    console.log('⚙️  PLATFORM FILTERS:');
    console.log('   Max Proposals:', settings.platformFilters?.maxProposals || 'not set');
    console.log('   US Only:', settings.platformFilters?.usOnly ? 'YES' : 'NO');
    console.log('   English Only:', settings.platformFilters?.englishOnly ? 'YES' : 'NO');
    console.log('   Min Hourly Rate: $' + (settings.platformFilters?.minHourlyRate || 'not set'));
    console.log('   Min Fixed Price: $' + (settings.platformFilters?.minFixedPrice || 'not set'));

    console.log('\n✅ Settings check complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSettings();
