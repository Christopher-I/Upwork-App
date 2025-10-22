/**
 * PricingAnalysis Component
 * Displays pricing recommendations and analysis results
 */

import React from 'react';
import { JobPricingRecommendation } from '../../types/jobAnalyzer';

interface PricingAnalysisProps {
  recommendation: JobPricingRecommendation;
}

export default function PricingAnalysis({ recommendation }: PricingAnalysisProps) {
  const {
    budgetType,
    recommendedRate,
    recommendedPrice,
    minRate,
    maxRate,
    estimatedHours,
    reasoning,
    confidenceLevel,
    factors,
  } = recommendation;

  // Confidence level colors
  const confidenceColors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    medium: 'bg-blue-100 text-blue-800 border-blue-300',
    high: 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Pricing Analysis</h2>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${confidenceColors[confidenceLevel]}`}>
          {confidenceLevel.toUpperCase()} CONFIDENCE
        </div>
      </div>

      {/* Main Recommendation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="text-sm text-gray-600 mb-2">Recommended {budgetType === 'hourly' ? 'Rate' : 'Price'}</div>
        <div className="text-4xl font-bold text-gray-900 mb-4">
          ${budgetType === 'hourly' ? recommendedRate : recommendedPrice?.toLocaleString()}
          {budgetType === 'hourly' && <span className="text-lg text-gray-600">/hour</span>}
        </div>

        {/* Rate Range */}
        {minRate && maxRate && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">Suggested Range:</span>
            <span>
              ${minRate}/hr - ${maxRate}/hr
            </span>
          </div>
        )}

        {/* Estimated Hours for Fixed Price */}
        {budgetType === 'fixed' && estimatedHours && (
          <div className="mt-2 text-sm text-gray-700">
            <span className="font-medium">Estimated Hours:</span> {estimatedHours}h
            {minRate && (
              <span className="ml-2 text-gray-600">
                (${minRate}-${maxRate}/hr equivalent)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Analysis Factors */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Analysis Factors</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Complexity */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Complexity</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${(factors.complexity / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900">{factors.complexity}/10</span>
            </div>
          </div>

          {/* Scope Clarity */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Scope Clarity</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(factors.scopeClarity / 10) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900">{factors.scopeClarity}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Skills */}
      {factors.technicalSkills.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Detected Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {factors.technicalSkills.slice(0, 10).map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-300"
              >
                {skill}
              </span>
            ))}
            {factors.technicalSkills.length > 10 && (
              <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs">
                +{factors.technicalSkills.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Duration */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Estimated Duration</h3>
        <p className="text-sm text-gray-600">{factors.estimatedDuration}</p>
      </div>

      {/* Reasoning */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Pricing Rationale</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{reasoning}</p>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-gray-700">
            <div className="font-semibold mb-1">Pricing Tips</div>
            <ul className="space-y-1 text-xs">
              {confidenceLevel === 'low' && (
                <li>• Low confidence - consider asking clarifying questions before pricing</li>
              )}
              <li>• Adjust based on your experience level and portfolio strength</li>
              <li>• Factor in client budget and competition on the job posting</li>
              <li>• Consider offering a small discount for long-term contracts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
