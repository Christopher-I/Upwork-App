/**
 * ProposalSection Component
 * Generate proposals and answer questions for analyzed jobs
 */

import React, { useState } from 'react';
import { JobAnalysisInput, JobPricingRecommendation } from '../../types/jobAnalyzer';
import { generateProposalWithActiveProvider, answerClientQuestion } from '../../services/proposals';
import { Settings } from '../../types/settings';

interface ProposalSectionProps {
  input: JobAnalysisInput;
  pricing: JobPricingRecommendation;
  settings: Settings;
}

export default function ProposalSection({ input, pricing, settings }: ProposalSectionProps) {
  const [proposal, setProposal] = useState('');
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Array<{ question: string; answer: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answeringQuestion, setAnsweringQuestion] = useState(false);

  // Convert JobAnalysisInput to pseudo-Job object for proposal generation
  const createPseudoJob = () => ({
    id: 'analyzer-' + Date.now(),
    title: input.description.split('\n')[0].substring(0, 100), // Use first line as title
    description: input.description,
    budgetType: input.budgetType,
    budget: input.budgetMin || 0,
    budgetMax: input.budgetMax,
    hourlyBudgetMax: input.budgetType === 'hourly' ? input.budgetMax : undefined,
    amount: input.budgetType === 'fixed' ? { rawValue: String(input.budgetMin || 0) } : undefined,
    client: {
      name: input.clientName || 'Client',
      paymentVerified: true,
      totalSpent: 10000, // Default values
      totalHires: 5,
      location: 'United States',
    },
    estimatedHours: pricing.estimatedHours || 40,
    estimatedEHR: pricing.recommendedRate || 75,
    estimatedPrice: pricing.recommendedPrice || (pricing.estimatedHours || 40) * (pricing.recommendedRate || 75),
    detectedOutcomes: [],
    jobClarity: {
      technicalMatches: pricing.factors.technicalSkills.length,
      clarityMatches: pricing.factors.scopeClarity,
    },
  });

  const handleGenerateProposal = async () => {
    setGeneratingProposal(true);
    try {
      const pseudoJob = createPseudoJob();
      const result = await generateProposalWithActiveProvider(pseudoJob as any, settings);
      setProposal(result.content);
    } catch (error) {
      console.error('Error generating proposal:', error);
      alert('Failed to generate proposal. Please check your API key in settings.');
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleAnswerQuestion = async () => {
    if (!currentQuestion.trim()) {
      alert('Please enter a question');
      return;
    }

    setAnsweringQuestion(true);
    try {
      const pseudoJob = createPseudoJob();
      const answer = await answerClientQuestion(currentQuestion, pseudoJob as any);

      setQuestionAnswers([...questionAnswers, { question: currentQuestion, answer }]);
      setCurrentQuestion('');
    } catch (error) {
      console.error('Error answering question:', error);
      alert('Failed to answer question. Please check your API key in settings.');
    } finally {
      setAnsweringQuestion(false);
    }
  };

  const handleCopyProposal = () => {
    navigator.clipboard.writeText(proposal);
    alert('Proposal copied to clipboard!');
  };

  const handleCopyAnswer = (answer: string) => {
    navigator.clipboard.writeText(answer);
    alert('Answer copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Proposal Generation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Proposal Generator</h3>
          <button
            onClick={handleGenerateProposal}
            disabled={generatingProposal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {generatingProposal ? 'Generating...' : 'Generate Proposal'}
          </button>
        </div>

        {proposal && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Generated Proposal</label>
              <button
                onClick={handleCopyProposal}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded-md p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {proposal}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {proposal.split(/\s+/).length} words
            </div>
          </div>
        )}

        {!proposal && (
          <p className="text-sm text-gray-500">
            Click "Generate Proposal" to create a customized proposal based on the job description and pricing analysis.
          </p>
        )}
      </div>

      {/* Question Answering */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Answerer</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Client Screening Question
            </label>
            <div className="flex gap-2">
              <textarea
                id="question"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Paste a client question here..."
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={answeringQuestion}
              />
              <button
                onClick={handleAnswerQuestion}
                disabled={answeringQuestion || !currentQuestion.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-start"
              >
                {answeringQuestion ? 'Answering...' : 'Answer'}
              </button>
            </div>
          </div>

          {/* Question Answers */}
          {questionAnswers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Answered Questions</h4>
              {questionAnswers.map((qa, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">Q: {qa.question}</div>
                    <button
                      onClick={() => handleCopyAnswer(qa.answer)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-2 flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    <span className="font-medium">A:</span> {qa.answer}
                  </div>
                </div>
              ))}
            </div>
          )}

          {questionAnswers.length === 0 && (
            <p className="text-sm text-gray-500">
              No questions answered yet. Paste a client question above and click "Answer" to generate a response.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
