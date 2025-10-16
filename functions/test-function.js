/**
 * Test script to simulate calling the fetchUpworkJobs Cloud Function
 * This helps us test without clicking the button in the browser
 */

const https = require('https');

const functionUrl = 'https://us-central1-upwork-monitor-app.cloudfunctions.net/fetchUpworkJobs';

const testData = {
  data: {
    keywords: {
      wideNet: ['React OR Node.js OR Vue OR Angular'],
      webflow: ['Webflow OR web design'],
      portals: [],
      ecommerce: [],
      speedSEO: [],
      automation: [],
      vertical: []
    },
    filters: {
      posted: 'last_7_days',
      maxProposals: 50,
      experienceLevel: ['intermediate', 'expert'],
      paymentVerified: true
    }
  }
};

console.log('Testing fetchUpworkJobs Cloud Function...\n');
console.log('Request payload:', JSON.stringify(testData, null, 2));
console.log('\nMaking request...\n');

const postData = JSON.stringify(testData);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(functionUrl, options, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('\n');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));

      if (parsed.result && parsed.result.jobs) {
        console.log(`\n✅ SUCCESS! Fetched ${parsed.result.jobs.length} jobs`);
        console.log('\nFirst job:');
        console.log(JSON.stringify(parsed.result.jobs[0], null, 2));
      } else if (parsed.error) {
        console.log('\n❌ ERROR:', parsed.error.message);
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

req.write(postData);
req.end();
