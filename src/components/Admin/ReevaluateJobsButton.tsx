import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { analyzePricing } from '../../services/jobAnalyzer';
import { Job } from '../../types/job';
import { ConfirmModal, AlertModal } from '../Modal';

type Status = 'idle' | 'processing' | 'complete' | 'error';

interface Progress {
  current: number;
  total: number;
}

export function ReevaluateJobsButton() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0 });
  const [cancelled, setCancelled] = useState(false);
  const [summary, setSummary] = useState({ updated: 0, failed: 0 });

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getAllJobs = async (): Promise<Job[]> => {
    const jobsRef = collection(db, 'jobs');
    const snapshot = await getDocs(jobsRef);
    const allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));

    // Filter to only US jobs (matching default UI filter)
    const usJobs = allJobs.filter(job => job.client.location === 'United States');
    console.log(`📊 Found ${allJobs.length} total jobs, ${usJobs.length} US jobs`);

    return usJobs;
  };

  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      ...updates,
      lastUpdated: new Date(),
    });
  };

  const startReevaluation = () => {
    setStatus('processing');
    setCancelled(false);
    setSummary({ updated: 0, failed: 0 });
    performReevaluation();
  };

  const performReevaluation = async () => {

    try {
      // Fetch all jobs
      console.log('📋 Fetching all jobs...');
      const jobs = await getAllJobs();
      setProgress({ current: 0, total: jobs.length });
      console.log(`Found ${jobs.length} jobs to re-evaluate`);

      let updated = 0;
      let failed = 0;

      for (let i = 0; i < jobs.length; i++) {
        // Check if cancelled
        if (cancelled) {
          console.log('⛔ Re-evaluation cancelled by user');
          setStatus('idle');
          return;
        }

        const job = jobs[i];

        try {
          console.log(`\n[${i + 1}/${jobs.length}] Re-evaluating: ${job.title}`);

          // Re-run AI pricing analysis
          const pricingResult = await analyzePricing({
            description: job.description,
            budgetType: job.budgetType === 'negotiable' ? 'fixed' : job.budgetType,
            budgetMin: job.budget || 0,
          });

          // Update Firestore with new pricing values
          await updateJob(job.id, {
            estimatedPrice: pricingResult.recommendedPrice || job.estimatedPrice,
            estimatedHours: pricingResult.estimatedHours || job.estimatedHours,
            estimatedEHR: pricingResult.recommendedRate || job.estimatedEHR,
          });

          updated++;
          console.log(`✅ Updated (Price: $${pricingResult.recommendedPrice}, Hours: ${pricingResult.estimatedHours})`);

        } catch (error) {
          failed++;
          console.error(`❌ Failed to update job ${job.id}:`, error);
        }

        // Update progress
        setProgress({ current: i + 1, total: jobs.length });
        setSummary({ updated, failed });

        // Rate limiting: 500ms delay between API calls
        await sleep(500);
      }

      setStatus('complete');
      setShowCompleteModal(true);

    } catch (error) {
      console.error('💥 Re-evaluation error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setShowErrorModal(true);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready';
      case 'processing':
        return `Processing ${progress.current}/${progress.total} jobs (${Math.round((progress.current / progress.total) * 100)}%)`;
      case 'complete':
        return `Complete! Updated ${summary.updated}, Failed ${summary.failed}`;
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'text-gray-600';
      case 'processing':
        return 'text-blue-600';
      case 'complete':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Admin Tools</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={status === 'processing'}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                status === 'processing'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {status === 'processing' ? 'Re-evaluating...' : 'Re-evaluate US Jobs'}
            </button>

            {status === 'processing' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

        <div className="space-y-1">
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            Status: {getStatusText()}
          </div>

          {status === 'processing' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p>• Re-runs pricing logic on US jobs only (United States clients)</p>
          <p>• Updates: estimatedPrice, estimatedHours, estimatedEHR</p>
          <p>• Does not regenerate proposals or re-score jobs</p>
          <p>• Takes ~500ms per job (API rate limiting)</p>
        </div>
      </div>
    </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={startReevaluation}
        title="Re-evaluate US Jobs?"
        message={`Re-evaluate all US jobs with current pricing logic?\n\nThis will process jobs from United States clients only.\n\nThis will take several minutes and use API credits.\n\nAre you sure you want to proceed?`}
        confirmText="Start Re-evaluation"
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700 text-white"
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => setCancelled(true)}
        title="Cancel Re-evaluation?"
        message="Cancel re-evaluation? Current progress will be saved."
        confirmText="Yes, Cancel"
        cancelText="Continue Processing"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />

      {/* Complete Modal */}
      <AlertModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Re-evaluation Complete"
        message={`Re-evaluation finished successfully!\n\nUpdated: ${summary.updated} jobs\nFailed: ${summary.failed} jobs\n\nCheck console for detailed logs.`}
        type="success"
      />

      {/* Error Modal */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Re-evaluation Error"
        message={`An error occurred during re-evaluation:\n\n${errorMessage}`}
        type="error"
      />
    </>
  );
}
