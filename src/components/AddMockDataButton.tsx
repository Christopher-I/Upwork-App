import { useState } from 'react';
import { clearAllJobs } from '../utils/clearJobs';
import { transformUpworkJob } from '../lib/upwork';
import { calculateJobScore, applyHardFilters } from '../utils/scoring';
import { useSettings } from '../hooks/useSettings';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

export function AddMockDataButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { settings } = useSettings();

  const handleClick = async () => {
    setLoading(true);

    try {
      // Call Cloud Function to fetch jobs from Upwork
      const functions = getFunctions();
      const fetchUpworkJobsFunction = httpsCallable(functions, 'fetchUpworkJobs');

      console.log('📡 Calling Cloud Function to fetch Upwork jobs...');

      const result = await fetchUpworkJobsFunction({
        keywords: settings.keywords,
        filters: {
          posted: settings.platformFilters.posted,
          maxProposals: settings.platformFilters.maxProposals,
          experienceLevel: settings.platformFilters.experienceLevel,
          paymentVerified: settings.platformFilters.paymentVerified,
          usOnly: settings.platformFilters.usOnly,
          englishOnly: settings.platformFilters.englishOnly,
        },
      });

      const data = result.data as { jobs: any[]; count: number };
      console.log(`✅ Fetched ${data.count} jobs from Upwork via Cloud Function`);

      // Transform and score each job
      let savedCount = 0;
      let skippedCount = 0;
      for (const upworkJob of data.jobs) {
        try {
          const transformedJob = transformUpworkJob(upworkJob);

          // Check if job already exists by upworkId
          const existingJobQuery = query(
            collection(db, 'jobs'),
            where('upworkId', '==', transformedJob.upworkId)
          );
          const existingJobs = await getDocs(existingJobQuery);

          if (!existingJobs.empty) {
            console.log(`⏭️  Skipping duplicate: ${transformedJob.title}`);
            skippedCount++;
            continue;
          }

          // Score the job using AI
          const { total, breakdown } = await calculateJobScore(transformedJob, settings, true);

          const jobWithScore = {
            ...transformedJob,
            score: total,
            scoreBreakdown: breakdown,
          };

          // Apply hard filters to classify
          const classification = applyHardFilters(jobWithScore as any, settings);

          const finalJob = {
            ...jobWithScore,
            autoClassification: classification,
            finalClassification: classification,
            scoredAt: Timestamp.now(),
            postedAt: Timestamp.fromDate(jobWithScore.postedAt!),
            fetchedAt: Timestamp.fromDate(jobWithScore.fetchedAt!),
            status: 'scored',
          };

          await addDoc(collection(db, 'jobs'), finalJob);
          savedCount++;

          console.log(`✅ ${transformedJob.title} - Score: ${total}/100 (${classification})`);
        } catch (jobError) {
          console.error(`❌ Error processing job:`, jobError);
          // Continue with next job
        }
      }

      console.log(`\n✅ Saved ${savedCount} new jobs to Firestore`);
      if (skippedCount > 0) {
        console.log(`⏭️  Skipped ${skippedCount} duplicate jobs`);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error fetching from Upwork:', error);
      alert(`Error: ${error.message || 'Failed to fetch jobs'}\n\nCheck console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Delete all jobs from database?')) return;

    setClearing(true);
    try {
      await clearAllJobs();
      alert('All jobs cleared!');
    } catch (error) {
      console.error('Error clearing jobs:', error);
      alert('Error clearing jobs. Check console.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleClear}
        disabled={clearing}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          clearing
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-danger-600 text-white hover:bg-danger-700 border border-danger-700'
        }`}
      >
        {clearing ? 'Clearing...' : 'Clear All'}
      </button>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          success
            ? 'bg-success-600 text-white'
            : loading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {loading ? 'Fetching...' : success ? 'Done!' : 'Fetch from Upwork'}
      </button>
    </div>
  );
}
