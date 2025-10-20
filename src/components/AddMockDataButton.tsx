import { useState, useEffect } from 'react';
import { clearAllJobs } from '../utils/clearJobs';
import { transformUpworkJob } from '../lib/upwork';
import { calculateJobScore, applyHardFilters } from '../utils/scoring';
import { useSettings } from '../hooks/useSettings';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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

/**
 * Format time difference in a human-readable way
 */
function formatTimeDifference(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Calculate time until next refresh (1 hour after last fetch)
 */
function getTimeUntilRefresh(lastFetch: Date): { ready: boolean; message: string } {
  const now = new Date();
  const oneHourLater = new Date(lastFetch.getTime() + 1 * 60 * 60 * 1000);
  const diffMs = oneHourLater.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { ready: true, message: 'Ready to refresh' };
  }

  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursLeft > 0) {
    return { ready: false, message: `Next ${hoursLeft}h ${minutesLeft}m` };
  } else if (minutesLeft > 0) {
    return { ready: false, message: `Next ${minutesLeft}m` };
  } else {
    return { ready: true, message: '' };
  }
}

export function AddMockDataButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const { settings } = useSettings();

  // Update current time every minute for live refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Load last fetch time from localStorage and Firestore
  useEffect(() => {
    const loadLastFetchTime = async () => {
      // Try localStorage first for immediate display
      const savedTime = localStorage.getItem('lastFetchTime');
      if (savedTime) {
        setLastFetchTime(new Date(savedTime));
      }

      // Also check Firestore for most recent job
      try {
        const jobsQuery = query(
          collection(db, 'jobs'),
          orderBy('fetchedAt', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(jobsQuery);
        if (!snapshot.empty) {
          const mostRecentJob = snapshot.docs[0].data();
          const fetchedAt = mostRecentJob.fetchedAt?.toDate?.() || new Date(mostRecentJob.fetchedAt);
          setLastFetchTime(fetchedAt);
          localStorage.setItem('lastFetchTime', fetchedAt.toISOString());
        }
      } catch (error) {
        console.error('Error loading last fetch time:', error);
      }
    };

    loadLastFetchTime();
  }, []);

  const handleFetchClick = () => {
    setShowFetchModal(true);
  };

  const handleFetchConfirm = async () => {
    setShowFetchModal(false);
    setLoading(true);
    setProgress(0);
    setEstimatedTimeLeft(null);
    setStartTime(Date.now());

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

          // Calculate estimated time remaining
          if (startTime && currentProgress > 0 && currentProgress < 100) {
            const elapsedMs = Date.now() - startTime;
            const estimatedTotalMs = (elapsedMs / currentProgress) * 100;
            const remainingMs = estimatedTotalMs - elapsedMs;

            const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
            const remainingHours = Math.floor(remainingMinutes / 60);
            const minutesLeft = remainingMinutes % 60;

            if (remainingHours > 0) {
              setEstimatedTimeLeft(`${remainingHours}h ${minutesLeft}m`);
            } else if (minutesLeft > 0) {
              setEstimatedTimeLeft(`${minutesLeft}m`);
            } else {
              setEstimatedTimeLeft('< 1m');
            }
          }
        }
      }

      console.log(`\n✅ Saved ${savedCount} new jobs to Firestore`);
      if (skippedCount > 0) {
        console.log(`⏭️  Skipped ${skippedCount} duplicate jobs`);
      }

      // Update last fetch time
      const now = new Date();
      setLastFetchTime(now);
      localStorage.setItem('lastFetchTime', now.toISOString());

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
      <div className="flex gap-1 sm:gap-2">
        <button
          onClick={handleClearClick}
          disabled={clearing}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
            clearing
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-danger-600 text-white hover:bg-danger-700 border border-danger-700'
          }`}
        >
          <span className="hidden sm:inline">{clearing ? 'Clearing...' : 'Clear All'}</span>
          <span className="sm:hidden">🗑️</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleFetchClick}
            disabled={loading}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              success
                ? 'bg-success-600 text-white'
                : loading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {loading ? (
              <span className="hidden sm:inline">Fetching...</span>
            ) : success ? (
              'Done!'
            ) : (
              <>
                <span className="hidden md:inline">Fetch from Upwork</span>
                <span className="hidden sm:inline md:hidden">Fetch Jobs</span>
                <span className="sm:hidden">↻</span>
              </>
            )}
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
              {estimatedTimeLeft && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600 min-w-[4rem]">
                    {estimatedTimeLeft} left
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Last Fetch Info */}
      {lastFetchTime && !loading && (
        <div className="mt-2 text-xs sm:text-sm text-gray-600">
          {(() => {
            const refreshInfo = getTimeUntilRefresh(lastFetchTime);
            return (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {/* Mobile: Just show the time value */}
                <span className="whitespace-nowrap sm:hidden">
                  <span className="font-medium text-gray-900">{formatTimeDifference(lastFetchTime)}</span>
                </span>
                {/* Desktop: Show full text */}
                <span className="whitespace-nowrap hidden sm:inline">
                  last: <span className="font-medium text-gray-900">{formatTimeDifference(lastFetchTime)}</span>
                </span>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span className={`whitespace-nowrap hidden sm:inline ${refreshInfo.ready ? 'text-success-600 font-medium' : 'text-gray-600'}`}>
                  {refreshInfo.message}
                </span>
              </div>
            );
          })()}
        </div>
      )}

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
