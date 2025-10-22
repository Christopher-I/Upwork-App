import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types/job';

/**
 * Hook to fetch and listen to jobs in real-time
 */
export function useJobs(filter?: 'recommended' | 'applied' | 'all' | 'archived') {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Build query based on filter
      let q = query(collection(db, 'jobs'));

      if (filter === 'archived') {
        // Archived jobs tab - only show archived jobs
        q = query(
          collection(db, 'jobs'),
          where('archived', '==', true),
          orderBy('archivedAt', 'desc')
        );
      } else if (filter === 'recommended') {
        // Original query - filter archived jobs client-side
        q = query(
          collection(db, 'jobs'),
          where('finalClassification', '==', 'recommended'),
          where('applied', '==', false),
          orderBy('score', 'desc')
        );
      } else if (filter === 'applied') {
        // Original query - filter archived jobs client-side
        q = query(
          collection(db, 'jobs'),
          where('applied', '==', true),
          orderBy('appliedAt', 'desc')
        );
      } else {
        // All jobs (excluding applied) - filter archived jobs client-side
        q = query(
          collection(db, 'jobs'),
          where('applied', '==', false),
          orderBy('score', 'desc')
        );
      }

      // Listen to real-time updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          let jobsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamps to Date objects
            postedAt: doc.data().postedAt?.toDate(),
            fetchedAt: doc.data().fetchedAt?.toDate(),
            scoredAt: doc.data().scoredAt?.toDate(),
            appliedAt: doc.data().appliedAt?.toDate(),
            archivedAt: doc.data().archivedAt?.toDate(),
            wonAt: doc.data().wonAt?.toDate(),
          })) as Job[];

          // Client-side filter: exclude archived jobs from non-archived tabs
          if (filter !== 'archived') {
            jobsData = jobsData.filter(job => !job.archived);
          }

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
 * Applies same filters as Dashboard (US-only, hired jobs, archived jobs)
 */
export function useJobCounts(clientCountry: 'us_only' | 'all' = 'us_only') {
  const [counts, setCounts] = useState({
    recommended: 0,
    applied: 0,
    archived: 0,
    total: 0,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      let recommended = 0;
      let applied = 0;
      let archived = 0;
      let total = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Apply US-only filter
        if (clientCountry === 'us_only') {
          const location = data.client?.location;
          const country = typeof location === 'string' ? location : location?.country;
          if (country !== 'United States' && country !== 'US' && country !== 'USA') {
            return; // Skip non-US jobs
          }
        }

        // Exclude hired jobs
        if (data.freelancersToHire !== undefined && data.totalFreelancersToHire !== undefined) {
          const freelancersToHire = data.freelancersToHire || 0;
          const totalFreelancersToHire = data.totalFreelancersToHire || 1;

          if (totalFreelancersToHire > 0 && freelancersToHire === 0) {
            return; // Skip hired jobs
          }
        }

        // Count archived jobs separately
        if (data.archived === true) {
          archived++;
          return; // Don't count archived jobs in other categories
        }

        // Count after filters
        // Only count non-applied jobs for recommended and total
        if (data.applied !== true) {
          total++;
          if (data.finalClassification === 'recommended') recommended++;
        }
        // Always count applied jobs for applied tab
        if (data.applied === true) applied++;
      });

      setCounts({
        recommended,
        applied,
        archived,
        total,
      });
    });

    return () => unsubscribe();
  }, [clientCountry]);

  return counts;
}
