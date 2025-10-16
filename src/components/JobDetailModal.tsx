import { useEffect } from 'react';
import { Job } from '../types/job';

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
}

export function JobDetailModal({ job, onClose }: JobDetailModalProps) {
  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const copyProposal = () => {
    if (job.proposal) {
      navigator.clipboard.writeText(job.proposal.content);
      alert('✅ Proposal copied to clipboard!');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal if clicking the backdrop (not the modal content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {job.title}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>Posted {getTimeAgo(job.postedAt)}</span>
                <span>•</span>
                <span>{job.proposalsCount} proposals</span>
                <span>•</span>
                <span>{job.client.location}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none ml-4 w-8 h-8 flex items-center justify-center"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Client Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-base">Client Info</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Company:</span>{' '}
                <span className="font-medium text-gray-900">{job.client.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Payment:</span>{' '}
                {job.client.paymentVerified ? (
                  <span className="text-success-600 font-medium">✓ Verified</span>
                ) : (
                  <span className="text-danger-600">Not verified</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">Total Spent:</span>{' '}
                <span className="font-medium text-gray-900">
                  ${job.client.totalSpent.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Total Hires:</span>{' '}
                <span className="font-medium text-gray-900">{job.client.totalHires}</span>
              </div>
              <div>
                <span className="text-gray-500">Rating:</span>{' '}
                <span className="font-medium text-gray-900">
                  {job.client.rating}/5 ({job.client.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-xl">
                Score: {job.score}/100
              </h3>
              <span
                className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                  job.score >= 90
                    ? 'bg-success-50 text-success-700 border-success-200'
                    : job.score >= 80
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {job.finalClassification === 'recommended'
                  ? 'Recommended'
                  : 'Not Recommended'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <ScoreItem
                label="Client Quality"
                score={job.scoreBreakdown?.clientQuality?.subtotal || 0}
                max={25}
                details={[
                  `Payment verified: ${
                    job.scoreBreakdown?.clientQuality?.paymentVerified || 0
                  }/15`,
                  `Spend history: ${
                    job.scoreBreakdown?.clientQuality?.spendHistory || 0
                  }/5`,
                  `Recency: ${
                    job.scoreBreakdown?.clientQuality?.recencyAndCompetition ||
                    0
                  }/5`,
                ]}
              />
              <ScoreItem
                label="Keywords Match"
                score={job.scoreBreakdown?.keywordsMatch || 0}
                max={15}
                details={[
                  `Matched: ${job.matchedKeywords?.join(', ') || 'none'}`,
                ]}
              />
              <ScoreItem
                label="Professional Signals ⭐"
                score={job.scoreBreakdown?.professionalSignals?.subtotal || 0}
                max={10}
                details={[
                  `Open budget: ${
                    job.scoreBreakdown?.professionalSignals?.openBudget || 0
                  }/5 ${job.budget === 0 ? '(not specified)' : ''}`,
                  `Team language: ${
                    job.scoreBreakdown?.professionalSignals?.weLanguage || 0
                  }/5 (${job.languageAnalysis?.teamMentions || 0} "we" vs ${
                    job.languageAnalysis?.meMentions || 0
                  } "I")`,
                ]}
              />
              <ScoreItem
                label="Business Impact"
                score={job.scoreBreakdown?.businessImpact || 0}
                max={15}
                details={[
                  `Detected: ${job.detectedOutcomes?.join(', ') || 'none'}`,
                  job.isTechnicalOnly ? '⚠️ Technical-only job (avoid)' : '',
                ].filter(Boolean)}
              />
              <ScoreItem
                label="Job Clarity"
                score={job.scoreBreakdown?.jobClarity || 0}
                max={15}
                details={[
                  `Technical signals: ${job.jobClarity?.technicalMatches || 0}`,
                  `Clarity signals: ${job.jobClarity?.clarityMatches || 0}`,
                  `Total boxes ticked: ${job.jobClarity?.total || 0}`,
                ]}
              />
              <ScoreItem
                label="EHR Potential"
                score={job.scoreBreakdown?.ehrPotential || 0}
                max={15}
                details={[
                  `Est: $${job.estimatedPrice} ÷ ${job.estimatedHours}hrs = $${Math.round(job.estimatedEHR)}/hr`,
                ]}
              />
              {job.scoreBreakdown?.redFlags !== 0 && (
                <ScoreItem
                  label="Red Flags"
                  score={job.scoreBreakdown?.redFlags || 0}
                  max={0}
                  isNegative
                  details={['Found negative keywords']}
                />
              )}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-base">
              Job Description
            </h3>
            <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Proposal */}
          {job.proposal && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-base">
                AI-Generated Proposal ({job.proposal.template})
              </h3>
              <div className="bg-primary-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap mb-4 border border-primary-100">
                {job.proposal.content}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyProposal}
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
                >
                  Copy Proposal
                </button>
                <button
                  onClick={() =>
                    window.open(job.url, '_blank', 'noopener,noreferrer')
                  }
                  className="px-5 py-2.5 bg-success-600 text-white rounded-lg hover:bg-success-700 font-medium text-sm transition-colors"
                >
                  Open on Upwork
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 flex gap-3 flex-wrap">
            {!job.applied && (
              <button className="px-5 py-2.5 bg-success-600 text-white rounded-lg hover:bg-success-700 font-medium text-sm transition-colors">
                Mark as Applied
              </button>
            )}
            {job.applied && !job.won && (
              <button className="px-5 py-2.5 bg-success-600 text-white rounded-lg hover:bg-success-700 font-medium text-sm transition-colors">
                Mark as Won
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors border border-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreItem({
  label,
  score,
  max,
  isNegative = false,
  details,
}: {
  label: string;
  score: number;
  max: number;
  isNegative?: boolean;
  details: string[];
}) {
  const percentage = max > 0 ? (score / max) * 100 : 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-gray-700 text-sm">{label}</span>
        <span
          className={`text-sm font-semibold ${
            isNegative
              ? 'text-danger-600'
              : 'text-gray-900'
          }`}
        >
          {score}/{max}
        </span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isNegative
              ? 'bg-danger-500'
              : percentage >= 80
              ? 'bg-success-500'
              : percentage >= 60
              ? 'bg-primary-500'
              : 'bg-warning-500'
          }`}
          style={{ width: `${Math.abs(percentage)}%` }}
        />
      </div>
      <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
        {details.map((detail, i) => (
          <div key={i}>• {detail}</div>
        ))}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
