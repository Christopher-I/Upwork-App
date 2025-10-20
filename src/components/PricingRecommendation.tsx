import { useState } from 'react';
import { Job } from '../types/job';
import { PricingRecommendation as PricingRecommendationType } from '../types/pricing';
import { calculatePricingRecommendation, formatPricingAsText } from '../utils/pricingCalculator';
import { PRICING_CONFIG } from '../config/pricingConfig';

interface PricingRecommendationProps {
  job: Job;
}

export function PricingRecommendation({ job }: PricingRecommendationProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded on desktop

  // Calculate pricing recommendation
  const recommendation = calculatePricingRecommendation(job);

  // Handle copy to clipboard
  const handleCopy = async () => {
    const text = formatPricingAsText(recommendation, job);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Error state
  if (recommendation.type === 'error') {
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-danger-900 text-sm sm:text-base">Unable to Calculate Pricing</h3>
            <p className="text-danger-700 text-xs sm:text-sm mt-1">{recommendation.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-300 rounded-lg mb-4 sm:mb-6 overflow-hidden">
      {/* Header - Always visible */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-bold text-base sm:text-lg">Pricing Recommendation</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden p-1 hover:bg-primary-700 rounded transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content - Collapsible on mobile, always visible on desktop */}
      <div className={`${isExpanded ? 'block' : 'hidden'} sm:block`}>
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          {/* Hourly Pricing */}
          {recommendation.type === 'hourly' && (
            <HourlyPricingView data={recommendation.data} />
          )}

          {/* Fixed-Price Pricing */}
          {recommendation.type === 'fixed' && (
            <FixedPricingView data={recommendation.data} />
          )}

          {/* Copy Button */}
          <div className="mt-4 pt-4 border-t border-primary-200">
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Pricing Text
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hourly pricing view component
function HourlyPricingView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Main pricing info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-primary-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Hourly Rate</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary-900">${data.recommendedRate}</p>
          {PRICING_CONFIG.DISPLAY.SHOW_ALTERNATIVE_RATES && (
            <p className="text-xs text-gray-500 mt-1">Range: ${data.rateRange.min}-${data.rateRange.max}</p>
          )}
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-primary-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Estimated Hours</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary-900">{data.estimatedHours}</p>
          <p className="text-xs text-gray-500 mt-1">Based on fair market value</p>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-primary-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Estimate</p>
          <p className="text-2xl sm:text-3xl font-bold text-success-900">${data.totalEstimate.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{data.complexity} complexity</p>
        </div>
      </div>

      {/* Reasoning */}
      {PRICING_CONFIG.DISPLAY.SHOW_REASONING && data.reasoning.length > 0 && (
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-primary-200">
          <p className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Why ${data.recommendedRate}/hour?</p>
          <ul className="space-y-1.5">
            {data.reasoning.map((reason: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                <svg className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Fixed-price pricing view component
function FixedPricingView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Total price */}
      <div className="bg-white rounded-lg p-4 sm:p-5 border border-primary-200 text-center">
        <p className="text-sm text-gray-600 mb-1">Total Project Value</p>
        <p className="text-3xl sm:text-4xl font-bold text-success-900">${data.totalPrice.toLocaleString()}</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">Payment Schedule: {data.paymentSchedule}</p>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {data.phases.map((phase: any) => (
          <div key={phase.number} className="bg-white rounded-lg p-3 sm:p-4 border border-primary-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                  Phase {phase.number}: {phase.name}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {phase.percentage}% • ${phase.price.toLocaleString()}
                </p>
              </div>
            </div>
            <ul className="space-y-1 mt-2">
              {phase.deliverables.map((deliverable: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                  <svg className="w-3.5 h-3.5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
