import { Job } from '../types/job';

interface JobCardProps {
  job: Job;
  onClick: () => void;
  viewMode: 'admin' | 'sales';
}

export function JobCard({ job, onClick, viewMode }: JobCardProps) {
  // Show star only if ALL three conditions are met:
  // 1. Has open budget
  // 2. Has team language ("we/our")
  // 3. Fair Market Value estimate is $5,000 or above
  const hasOpenBudget = (job.scoreBreakdown?.professionalSignals?.openBudget || 0) > 0;
  const hasTeamLanguage = (job.scoreBreakdown?.professionalSignals?.weLanguage || 0) > 0;
  const hasHighMarketRate = (job.estimatedPrice || 0) >= 5000;
  const isProfessional = hasOpenBudget && hasTeamLanguage && hasHighMarketRate;

  const scoreColor = job.score >= 90 ? 'success' : job.score >= 80 ? 'primary' : 'gray';
  const scoreColorClass =
    scoreColor === 'success' ? 'bg-success-50 text-success-700 border-success-200' :
    scoreColor === 'primary' ? 'bg-primary-50 text-primary-700 border-primary-200' :
    'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 border border-gray-200 hover:border-gray-300 hover:-translate-y-0.5"
    >
      {/* Job Title - HERO element */}
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-lg leading-snug">
        {job.title}
      </h3>

      {/* Posted time & proposals - Small meta */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span>Posted {getTimeAgo(job.postedAt)}</span>
        <span>•</span>
        <span>{job.proposalsCount} proposals</span>
      </div>

      {/* Client info with verified badge */}
      {job.client.name !== 'Anonymous' && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">{job.client.name}</span>
          {job.client.paymentVerified && (
            <span className="text-success-600 text-xs">✓ Verified</span>
          )}
        </div>
      )}

      {/* Inline badges - Score, Fair Market Value, EHR (Admin View Only) */}
      {viewMode === 'admin' && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${scoreColorClass}`}>
            {job.score}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-success-50 text-success-700 border border-success-200">
            ${job.estimatedPrice?.toLocaleString() || 'TBD'}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            ${Math.round(job.estimatedEHR)}/hr
          </span>
        </div>
      )}

      {/* Description preview (2 lines max) */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {job.description}
      </p>

      {/* Tags - Show top 5 most important tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {job.tags.slice(0, 5).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 5 && (
            <span className="text-xs text-gray-400">
              +{job.tags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Professional signals - Show if has open budget AND team language AND $5k+ Fair Market Value */}
      {isProfessional && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <span>⭐</span>
          <span>Open budget • Team language • High value</span>
        </div>
      )}

      {/* Status badges (if applicable) */}
      {(job.proposal || job.applied || job.won) && (
        <div className="pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          {job.proposal && (
            <span className="text-xs text-success-600 font-medium">
              Proposal ready
            </span>
          )}
          {job.applied && (
            <span className="text-xs text-primary-600 font-medium">
              Applied {job.appliedAt && `• ${getTimeAgo(job.appliedAt)}`}
            </span>
          )}
          {job.won && (
            <span className="text-xs text-success-700 font-semibold">
              Won {job.wonAt && `• ${getTimeAgo(job.wonAt)}`}
            </span>
          )}
        </div>
      )}

      {/* Subtle hint at bottom */}
      <div className="mt-3 text-xs text-gray-300">
        Click for details →
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
