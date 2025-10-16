import { useState } from 'react';
import { clearAllJobs } from '../utils/clearJobs';
import { transformUpworkJob } from '../lib/upwork';
import { calculateJobScore, applyHardFilters } from '../utils/scoring';
import { useSettings } from '../hooks/useSettings';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ConfirmModal } from './ConfirmModal';

/**
 * Recursively remove undefined values from an object
 * Firestore doesn't allow undefined values
 */
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }

  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }

  return obj;
}

export function AddMockDataButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const { settings } = useSettings();

  const handleFetchClick = () => {
    setShowFetchModal(true);
  };

  const handleFetchConfirm = async () => {
    setShowFetchModal(false);
    setLoading(true);
    setProgress(0);

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
          minHourlyRate: settings.platformFilters.minHourlyRate,
          minFixedPrice: settings.platformFilters.minFixedPrice,
        },
      });

      const data = result.data as { jobs: any[]; count: number };
      console.log(`✅ Fetched ${data.count} jobs from Upwork via Cloud Function`);

      setTotalJobs(data.jobs.length);

      // Transform and score each job
      let savedCount = 0;
      let skippedCount = 0;
      for (let i = 0; i < data.jobs.length; i++) {
        const upworkJob = data.jobs[i];
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

          // Remove undefined fields recursively (Firestore doesn't allow undefined)
          const cleanedJob = removeUndefined(finalJob);

          await addDoc(collection(db, 'jobs'), cleanedJob);
          savedCount++;

          console.log(`✅ ${transformedJob.title} - Score: ${total}/100 (${classification})`);
        } catch (jobError) {
          console.error(`❌ Error processing job:`, jobError);
          // Continue with next job
        } finally {
          // Update progress after each job (whether success or error)
          const currentProgress = Math.round(((i + 1) / data.jobs.length) * 100);
          setProgress(currentProgress);
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
    } finally {
      setLoading(false);
    }
  };

  const handleClearClick = () => {
    setShowClearModal(true);
  };

  const handleClearConfirm = async () => {
    setShowClearModal(false);
    setClearing(true);
    try {
      await clearAllJobs();
    } catch (error) {
      console.error('Error clearing jobs:', error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleClearClick}
          disabled={clearing}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            clearing
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-danger-600 text-white hover:bg-danger-700 border border-danger-700'
          }`}
        >
          {clearing ? 'Clearing...' : 'Clear All'}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFetchClick}
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

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                {progress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearConfirm}
        title="Clear All Jobs"
        message="Are you sure you want to delete all jobs from the database? This action cannot be undone."
        confirmText="Delete All"
        confirmStyle="danger"
      />

      {/* Fetch from Upwork Confirmation Modal */}
      <ConfirmModal
        isOpen={showFetchModal}
        onClose={() => setShowFetchModal(false)}
        onConfirm={handleFetchConfirm}
        title="Fetch Jobs from Upwork"
        message="This will fetch new jobs from Upwork based on your current settings. Jobs already in the database will be skipped."
        confirmText="Fetch Jobs"
        confirmStyle="primary"
      />
    </>
  );
}
