const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBMC2bHe7YQLB5lmz9cS0Pr6SN5AoG6bKg",
  authDomain: "upwork-monitor-app.firebaseapp.com",
  projectId: "upwork-monitor-app",
  storageBucket: "upwork-monitor-app.firebasestorage.app",
  messagingSenderId: "930823671773",
  appId: "1:930823671773:web:55db85823e86d4bfaa94ed"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initCircuitBreaker() {
  console.log('🔌 Initializing circuit breaker state in Firestore...\n');

  try {
    await setDoc(doc(db, 'config', 'scheduler_state'), {
      enabled: true,
      consecutive_failures: 0,
      last_success: null,
      last_failure: null,
      circuit_open: false,
      circuit_open_until: null,
    });

    console.log('✅ Circuit breaker state initialized successfully!');
    console.log('\nInitial state:');
    console.log('  - enabled: true');
    console.log('  - consecutive_failures: 0');
    console.log('  - circuit_open: false');
    console.log('\nThe scheduled function is ready to run automatically every 6 hours.');
    console.log('\nNext scheduled runs (EST):');
    const now = new Date();
    const hour = now.getHours();
    const nextRuns = [0, 6, 12, 18].filter(h => h > hour || (h === 0 && hour >= 18));
    if (nextRuns.length === 0) nextRuns.push(0); // Next day midnight

    nextRuns.slice(0, 3).forEach(h => {
      const time = h === 0 && hour >= 18 ? 'tomorrow' : 'today';
      console.log(`  - ${time} at ${h === 0 ? 12 : h > 12 ? h - 12 : h}:00 ${h < 12 ? 'AM' : 'PM'} EST`);
    });

    console.log('\n💡 Tip: To manually disable the scheduler, update Firestore:');
    console.log('   config/scheduler_state -> enabled: false');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing circuit breaker:', error);
    process.exit(1);
  }
}

initCircuitBreaker();
