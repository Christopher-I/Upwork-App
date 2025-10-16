import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Clear all jobs from Firestore (for testing)
 */
export async function clearAllJobs() {
  console.log('Clearing all jobs from Firestore...');

  const jobsSnapshot = await getDocs(collection(db, 'jobs'));

  let deletedCount = 0;
  for (const doc of jobsSnapshot.docs) {
    await deleteDoc(doc.ref);
    deletedCount++;
  }

  console.log(`✅ Deleted ${deletedCount} jobs`);
}
