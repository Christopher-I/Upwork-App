/**
 * JobAnalyzerPage Component
 * Main container for the Job Analyzer feature
 * Two-column layout: Input (left) and Analysis Results (right)
 */

import React, { useState } from 'react';
import { JobAnalysisInput, JobPricingRecommendation } from '../../types/jobAnalyzer';
import { Settings } from '../../types/settings';
import { analyzePricing } from '../../services/jobAnalyzer';
import JobDescriptionInput from './JobDescriptionInput';
import PricingAnalysis from './PricingAnalysis';
import ProposalSection from './ProposalSection';

interface JobAnalyzerPageProps {
  settings: Settings;
}

export default function JobAnalyzerPage({ settings }: JobAnalyzerPageProps) {
  const [currentInput, setCurrentInput] = useState<JobAnalysisInput | null>(null);
  const [currentPricing, setCurrentPricing] = useState<JobPricingRecommendation | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async (input: JobAnalysisInput) => {
    setAnalyzing(true);
    try {
      // Run pricing analysis (now calls AI)
      const pricing = await analyzePricing(input);

      // Update state
      setCurrentInput(input);
      setCurrentPricing(pricing);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze job. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Job Analyzer</h1>
        <p className="mt-2 text-sm text-gray-600">
          Paste any job description to get AI-powered pricing recommendations, generate proposals, and answer screening questions.
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Input */}
        <div className="space-y-6">
          <JobDescriptionInput onAnalyze={handleAnalyze} loading={analyzing} />
        </div>

        {/* RIGHT COLUMN: Analysis Results */}
        <div className="space-y-6">
          {currentPricing ? (
            <>
              {/* Pricing Analysis */}
              <PricingAnalysis recommendation={currentPricing} />

              {/* Proposal & Question Answering */}
              {currentInput && (
                <ProposalSection
                  input={currentInput}
                  pricing={currentPricing}
                  settings={settings}
                />
              )}
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">No job analyzed yet</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                Paste a job description on the left and click "Analyze Job & Get Pricing" to see results here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
