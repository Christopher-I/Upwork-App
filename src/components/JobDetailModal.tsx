import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types/job';
import { generateProposal } from '../lib/proposalGenerator';
import { generateProposalWithClaude } from '../lib/proposalGeneratorClaude';
import { answerClientQuestion } from '../lib/questionAnswerer';
import { AI_PROVIDER } from '../config/ai';
import { useSettings } from '../hooks/useSettings';
import { PricingRecommendation } from './PricingRecommendation';

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  viewMode: 'admin' | 'sales';
}

export function JobDetailModal({ job, onClose, viewMode }: JobDetailModalProps) {
  const { settings } = useSettings();
  const [currentJob, setCurrentJob] = useState<Job>(job);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState('');

  // Question answering state
  const [clientQuestion, setClientQuestion] = useState('');
  const [generatedAnswer, setGeneratedAnswer] = useState('');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);

  // Real-time listener for job updates
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'jobs', job.id),
      (snapshot) => {
        if (snapshot.exists()) {
          setCurrentJob({ id: snapshot.id, ...snapshot.data() } as Job);
        }
      }
    );

    return () => unsubscribe();
  }, [job.id]);

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
    if (currentJob.proposal) {
      navigator.clipboard.writeText(currentJob.proposal.content);
      alert('✅ Proposal copied to clipboard!');
    }
  };

  const handleGenerateProposal = async () => {
    setIsGenerating(true);

    try {
      const proposal = AI_PROVIDER === 'claude'
        ? await generateProposalWithClaude(currentJob, settings)
        : await generateProposal(currentJob, settings);

      await updateDoc(doc(db, 'jobs', currentJob.id), {
        proposal: {
          ...proposal,
          generatedAt: new Date(),
          edited: false,
        },
        status: 'ready',
      });
    } catch (error) {
      console.error('Failed to generate proposal:', error);
      alert('❌ Failed to generate proposal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditProposal = () => {
    setIsEditing(true);
    setEditedProposal(currentJob.proposal?.content || '');
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(doc(db, 'jobs', currentJob.id), {
        'proposal.content': editedProposal,
        'proposal.edited': true,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert('❌ Failed to save changes.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProposal('');
  };

  const handleMarkAsApplied = async () => {
    try {
      await updateDoc(doc(db, 'jobs', currentJob.id), {
        applied: true,
        appliedAt: new Date(),
        appliedProposal: currentJob.proposal?.content || '',
        status: 'applied',
      });
      alert('✅ Marked as applied!');
    } catch (error) {
      console.error('Failed to mark as applied:', error);
      alert('❌ Failed to mark as applied.');
    }
  };

  const handleMarkAsWon = async () => {
    const projectValue = prompt('Enter project value (optional):');

    try {
      await updateDoc(doc(db, 'jobs', currentJob.id), {
        won: true,
        wonAt: new Date(),
        actualProjectValue: projectValue ? parseFloat(projectValue) : null,
      });
      alert('🎉 Congratulations on winning the job!');
    } catch (error) {
      console.error('Failed to mark as won:', error);
      alert('❌ Failed to mark as won.');
    }
  };

  const handleGenerateAnswer = async () => {
    if (!clientQuestion.trim()) {
      alert('⚠️ Please enter a question first.');
      return;
    }

    setIsGeneratingAnswer(true);
    setGeneratedAnswer('');

    try {
      const answer = await answerClientQuestion(clientQuestion, currentJob);
      setGeneratedAnswer(answer);
    } catch (error) {
      console.error('Failed to generate answer:', error);
      alert('❌ Failed to generate answer. Please try again.');
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleCopyAnswer = () => {
    if (generatedAnswer) {
      navigator.clipboard.writeText(generatedAnswer);
      alert('✅ Answer copied to clipboard!');
    }
  };

  const handleToggleRecommendation = async () => {
    try {
      const newClassification = currentJob.finalClassification === 'recommended'
        ? 'not_recommended'
        : 'recommended';

      await updateDoc(doc(db, 'jobs', currentJob.id), {
        finalClassification: newClassification,
        manualOverride: {
          forceRecommended: newClassification === 'recommended',
          overriddenAt: new Date(),
        },
      });

      const action = newClassification === 'recommended' ? 'added to' : 'removed from';
      alert(`✅ Job ${action} Recommended!`);
    } catch (error) {
      console.error('Failed to toggle recommendation:', error);
      alert('❌ Failed to update job status.');
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
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                {job.title}
              </h2>
              <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mt-2">
                <span className="whitespace-nowrap">Posted {getTimeAgo(job.postedAt)}</span>
                <span>•</span>
                <span className="whitespace-nowrap">{job.proposalsCount} proposals</span>
                <span>•</span>
                <span className="whitespace-nowrap truncate">{job.client.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <a
                href={currentJob.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap"
              >
                <span className="hidden sm:inline">View on Upwork</span>
                <span className="sm:hidden">View</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl leading-none w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Pricing Recommendation */}
          <PricingRecommendation job={currentJob} />

          {/* Client Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-base">Client Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {job.client.name !== 'Anonymous' && (
                <div>
                  <span className="text-gray-500">Company:</span>{' '}
                  <span className="font-medium text-gray-900">{job.client.name}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Payment:</span>{' '}
                {job.client.paymentVerified ? (
                  <span className="text-success-600 font-medium">✓ Verified</span>
                ) : (
                  <span className="text-danger-600">Not verified</span>
                )}
              </div>
              {viewMode === 'admin' && (
                <>
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
                </>
              )}
              <div>
                <span className="text-gray-500">Rating:</span>{' '}
                <span className="font-medium text-gray-900">
                  {job.client.rating}/5 ({job.client.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Analysis (Admin View Only) */}
          {viewMode === 'admin' && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-base">Pricing Analysis</h3>
            <div className="space-y-3 text-sm">
              {/* Client's Offer */}
              <div className="flex items-center justify-between pb-3 border-b border-success-100">
                <span className="text-gray-600">Client's Budget:</span>
                <span className="font-semibold text-gray-900">
                  {currentJob.budgetType === 'hourly' && currentJob.hourlyBudgetMin && currentJob.hourlyBudgetMax ? (
                    `$${currentJob.hourlyBudgetMin}-$${currentJob.hourlyBudgetMax}/hr`
                  ) : currentJob.budgetType === 'hourly' && currentJob.hourlyBudgetMax ? (
                    `Up to $${currentJob.hourlyBudgetMax}/hr`
                  ) : currentJob.budgetType === 'fixed' && currentJob.budget > 0 ? (
                    `$${currentJob.budget.toLocaleString()} (fixed)`
                  ) : (
                    'Not specified (open budget)'
                  )}
                </span>
              </div>

              {/* Fair Market Value Estimate */}
              <div className="flex items-center justify-between pb-3 border-b border-success-100">
                <span className="text-gray-600">Fair Market Value:</span>
                <span className="font-bold text-success-700 text-lg">
                  ${currentJob.estimatedPrice?.toLocaleString() || 'TBD'}
                </span>
              </div>

              {/* Estimated Hours */}
              <div className="flex items-center justify-between pb-3 border-b border-success-100">
                <span className="text-gray-600">Estimated Hours:</span>
                <span className="font-semibold text-gray-900">
                  ~{currentJob.estimatedHours} hours
                </span>
              </div>

              {/* Market EHR */}
              <div className="flex items-center justify-between pb-3 border-b border-success-100">
                <span className="text-gray-600">Market EHR:</span>
                <span className="font-bold text-success-700">
                  ${Math.round(currentJob.estimatedEHR)}/hr
                </span>
              </div>

              {/* Client's Effective Rate (if hourly) */}
              {currentJob.budgetType === 'hourly' && currentJob.hourlyBudgetMax && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Client's Max Rate:</span>
                  <span className="font-medium text-gray-700">
                    ${currentJob.hourlyBudgetMax}/hr
                  </span>
                </div>
              )}
            </div>
            </div>
          )}

          {/* Score Breakdown (Admin View Only) */}
          {viewMode === 'admin' && (
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
          )}

          {/* Job Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-base">
              Job Description
            </h3>
            <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words overflow-x-auto">
              {job.description}
            </div>
          </div>

          {/* AI Question Answerer */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-base">
              Answer Client Questions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter any question the client asked in their job description, and get a concise, expert answer ready to paste into Upwork.
            </p>

            <div className="space-y-4">
              {/* Question Input */}
              <div>
                <label htmlFor="client-question" className="block text-sm font-medium text-gray-700 mb-2">
                  Client's Question
                </label>
                <textarea
                  id="client-question"
                  value={clientQuestion}
                  onChange={(e) => setClientQuestion(e.target.value)}
                  placeholder="e.g., Can you integrate with our existing CRM system?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                  rows={3}
                  disabled={isGeneratingAnswer}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAnswer}
                disabled={isGeneratingAnswer || !clientQuestion.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isGeneratingAnswer ? 'Generating Answer...' : 'Generate Answer'}
              </button>

              {/* Generating State */}
              {isGeneratingAnswer && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    <p className="text-gray-700 text-sm">Crafting your expert answer...</p>
                  </div>
                </div>
              )}

              {/* Generated Answer */}
              {generatedAnswer && !isGeneratingAnswer && (
                <div className="bg-success-50 rounded-lg p-4 border border-success-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">Your Answer:</h4>
                    <button
                      onClick={handleCopyAnswer}
                      className="px-3 py-1.5 bg-success-600 text-white rounded-md hover:bg-success-700 font-medium text-xs transition-colors"
                    >
                      Copy Answer
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {generatedAnswer}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {generatedAnswer.split(' ').length} words
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Proposal */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-base">
              AI-Generated Proposal
            </h3>

            {/* No proposal yet */}
            {!currentJob.proposal && !isGenerating && (
              <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                <p className="text-gray-600 mb-4">
                  No proposal generated yet. Click below to generate a customized proposal.
                </p>
                <button
                  onClick={handleGenerateProposal}
                  className="px-3 py-2 sm:px-5 sm:py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
                >
                  Generate Proposal
                </button>
              </div>
            )}

            {/* Generating */}
            {isGenerating && (
              <div className="bg-blue-50 rounded-lg p-6 text-center border border-blue-200">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
                <p className="text-gray-700 font-medium">Generating your proposal...</p>
                <p className="text-gray-500 text-sm mt-1">This takes about 5-10 seconds</p>
              </div>
            )}

            {/* Proposal ready */}
            {currentJob.proposal && !isEditing && (
              <div>
                {/* Quick Wins */}
                {currentJob.proposal.quickWins && currentJob.proposal.quickWins.length > 0 && (
                  <div className="mb-4 bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Quick Wins Included:</h4>
                    <ul className="space-y-1">
                      {currentJob.proposal.quickWins.map((win, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Proposal Content */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap mb-4 border border-gray-200">
                  {currentJob.proposal.content}
                </div>

                {/* Proposal Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>Template: {currentJob.proposal.template}</span>
                  {currentJob.proposal.packageRecommended && (
                    <>
                      <span>•</span>
                      <span>Package: {currentJob.proposal.packageRecommended}</span>
                    </>
                  )}
                  {currentJob.proposal.priceRange && (
                    <>
                      <span>•</span>
                      <span>Range: {currentJob.proposal.priceRange}</span>
                    </>
                  )}
                  {currentJob.proposal.edited && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600">✏️ Edited</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={copyProposal}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
                  >
                    Copy Proposal
                  </button>
                  <button
                    onClick={handleEditProposal}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors border border-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleGenerateProposal}
                    disabled={isGenerating}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors border border-gray-200 disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() =>
                      window.open(currentJob.url, '_blank', 'noopener,noreferrer')
                    }
                    className="px-3 py-2 sm:px-5 sm:py-2.5 bg-success-600 text-white rounded-lg hover:bg-success-700 font-medium text-sm transition-colors"
                  >
                    Open on Upwork
                  </button>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {isEditing && (
              <div>
                <textarea
                  value={editedProposal}
                  onChange={(e) => setEditedProposal(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                  placeholder="Edit your proposal..."
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 flex gap-3 flex-wrap">
            {/* Toggle Recommendation Button */}
            <button
              onClick={handleToggleRecommendation}
              className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium text-sm transition-colors ${
                currentJob.finalClassification === 'recommended'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {currentJob.finalClassification === 'recommended'
                ? 'Remove from Recommended'
                : 'Add to Recommended'}
            </button>

            {!currentJob.applied && (
              <button
                onClick={handleMarkAsApplied}
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-success-600 text-white rounded-lg hover:bg-success-700 font-medium text-sm transition-colors"
              >
                Mark as Applied
              </button>
            )}
            {currentJob.applied && !currentJob.won && (
              <button
                onClick={handleMarkAsWon}
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-success-600 text-white rounded-lg hover:bg-success-700 font-medium text-sm transition-colors"
              >
                Mark as Won
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors border border-gray-200"
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
