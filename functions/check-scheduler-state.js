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

async function checkSchedulerState() {
  console.log('🔌 Checking scheduler state in Firestore...\n');

  const stateDoc = await db.collection('config').doc('scheduler_state').get();

  if (!stateDoc.exists) {
    console.log('⚠️  NO scheduler_state document found');
    console.log('   This means scheduler has NOT run yet or config is missing\n');
    console.log('💡 Possible reasons:');
    console.log('   1. Cloud Scheduler job not created/enabled');
    console.log('   2. Scheduler never triggered');
    console.log('   3. Permissions issue\n');
    process.exit(0);
  }

  const state = stateDoc.data();
  console.log('✅ Scheduler state document EXISTS\n');
  console.log('Configuration:');
  console.log('  - enabled:', state.enabled);
  console.log('  - consecutive_failures:', state.consecutive_failures || 0);
  console.log('  - circuit_open:', state.circuit_open || false);

  if (state.circuit_open_until) {
    const openUntil = state.circuit_open_until.toDate ? state.circuit_open_until.toDate() : new Date(state.circuit_open_until);
    console.log('  - circuit_open_until:', openUntil.toISOString());
  }

  if (state.last_run) {
    const lastRun = state.last_run.toDate ? state.last_run.toDate() : new Date(state.last_run);
    console.log('  - last_run:', lastRun.toISOString());
  } else {
    console.log('  - last_run: NEVER');
  }

  if (state.last_success) {
    const lastSuccess = state.last_success.toDate ? state.last_success.toDate() : new Date(state.last_success);
    console.log('  - last_success:', lastSuccess.toISOString());
  } else {
    console.log('  - last_success: NEVER');
  }

  console.log('  - last_error:', state.last_error || 'None');

  console.log('\n');

  if (!state.enabled) {
    console.log('⚠️  SCHEDULER IS MANUALLY DISABLED');
    console.log('   To enable: Update scheduler_state.enabled = true in Firestore');
  } else if (state.circuit_open) {
    console.log('⚠️  CIRCUIT BREAKER IS OPEN (scheduler paused due to failures)');
    console.log('   Will auto-resume after cooldown period');
  } else {
    console.log('✅ Scheduler is ENABLED and running normally');
  }

  console.log('\n');
  process.exit(0);
}

checkSchedulerState().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
