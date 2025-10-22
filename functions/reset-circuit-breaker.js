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

async function resetCircuitBreaker() {
  console.log('🔧 Resetting circuit breaker...\n');

  const stateDoc = await db.collection('config').doc('scheduler_state').get();

  if (!stateDoc.exists) {
    console.log('⚠️  NO scheduler_state document found');
    console.log('   Creating new scheduler_state document with enabled state...\n');

    await db.collection('config').doc('scheduler_state').set({
      enabled: true,
      consecutive_failures: 0,
      circuit_open: false,
      last_run: null,
      last_success: null,
      last_error: null,
      updated_at: new Date(),
    });

    console.log('✅ Created new scheduler_state document\n');
    process.exit(0);
  }

  const currentState = stateDoc.data();

  console.log('Current state:');
  console.log('  - enabled:', currentState.enabled);
  console.log('  - consecutive_failures:', currentState.consecutive_failures);
  console.log('  - circuit_open:', currentState.circuit_open);
  console.log('');

  // Reset circuit breaker
  await db.collection('config').doc('scheduler_state').update({
    enabled: true,
    consecutive_failures: 0,
    circuit_open: false,
    circuit_open_until: null,
    last_error: null,
    updated_at: new Date(),
  });

  console.log('✅ Circuit breaker RESET successfully!\n');
  console.log('New state:');
  console.log('  - enabled: true');
  console.log('  - consecutive_failures: 0');
  console.log('  - circuit_open: false');
  console.log('  - circuit_open_until: null');
  console.log('');
  console.log('🎉 Scheduler is now ENABLED and ready to run at the next scheduled time\n');

  process.exit(0);
}

resetCircuitBreaker().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
