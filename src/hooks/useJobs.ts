import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types/job';

/**
 * Hook to fetch and listen to jobs in real-time
 */
export function useJobs(filter?: 'recommended' | 'applied' | 'all') {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Build query based on filter
      let q = query(collection(db, 'jobs'));

      if (filter === 'recommended') {
        q = query(
          collection(db, 'jobs'),
          where('finalClassification', '==', 'recommended'),
          orderBy('score', 'desc')
        );
      } else if (filter === 'applied') {
        q = query(
          collection(db, 'jobs'),
          where('applied', '==', true),
          orderBy('appliedAt', 'desc')
        );
      } else {
        // All jobs, sorted by score
        q = query(collection(db, 'jobs'), orderBy('score', 'desc'));
      }

      // Listen to real-time updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const jobsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamps to Date objects
            postedAt: doc.data().postedAt?.toDate(),
            fetchedAt: doc.data().fetchedAt?.toDate(),
            scoredAt: doc.data().scoredAt?.toDate(),
            appliedAt: doc.data().appliedAt?.toDate(),
            wonAt: doc.data().wonAt?.toDate(),
          })) as Job[];

          setJobs(jobsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching jobs:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup subscription
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up jobs listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [filter]);

  return { jobs, loading, error };
}

/**
 * Hook to get job counts by classification
 */
export function useJobCounts() {
  const [counts, setCounts] = useState({
    recommended: 0,
    applied: 0,
    total: 0,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      let recommended = 0;
      let applied = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.finalClassification === 'recommended') recommended++;
        if (data.applied === true) applied++;
      });

      setCounts({
        recommended,
        applied,
        total: snapshot.size,
      });
    });

    return () => unsubscribe();
  }, []);

  return counts;
}
