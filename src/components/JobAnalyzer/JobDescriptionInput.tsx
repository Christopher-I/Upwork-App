/**
 * JobDescriptionInput Component
 * Form for entering job description and basic metadata
 */

import React, { useState } from 'react';
import { JobAnalysisInput } from '../../types/jobAnalyzer';

interface JobDescriptionInputProps {
  onAnalyze: (input: JobAnalysisInput) => void;
  loading: boolean;
}

export default function JobDescriptionInput({ onAnalyze, loading }: JobDescriptionInputProps) {
  const [description, setDescription] = useState('');
  const [budgetType, setBudgetType] = useState<'hourly' | 'fixed'>('hourly');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [clientName, setClientName] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('Please enter a job description');
      return;
    }

    const input: JobAnalysisInput = {
      description: description.trim(),
      budgetType,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      clientName: clientName.trim() || undefined,
      duration: duration.trim() || undefined,
    };

    onAnalyze(input);
  };

  const handleClear = () => {
    setDescription('');
    setBudgetMin('');
    setBudgetMax('');
    setClientName('');
    setDuration('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Paste Job Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the complete job description here..."
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            disabled={loading}
          />
          <div className="mt-1 text-xs text-gray-500">
            {description.length} characters
          </div>
        </div>

        {/* Budget Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Type *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="hourly"
                checked={budgetType === 'hourly'}
                onChange={(e) => setBudgetType(e.target.value as 'hourly')}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">Hourly</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="fixed"
                checked={budgetType === 'fixed'}
                onChange={(e) => setBudgetType(e.target.value as 'fixed')}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">Fixed Price</span>
            </label>
          </div>
        </div>

        {/* Budget Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-700 mb-2">
              Budget Min {budgetType === 'hourly' ? '($/hr)' : '($)'}
            </label>
            <input
              type="number"
              id="budgetMin"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="Optional"
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-700 mb-2">
              Budget Max {budgetType === 'hourly' ? '($/hr)' : '($)'}
            </label>
            <input
              type="number"
              id="budgetMax"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="Optional"
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Client Name */}
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
            Client Name (Optional)
          </label>
          <input
            type="text"
            id="clientName"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g., John Smith"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Duration (Optional)
          </label>
          <input
            type="text"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g., 2-3 weeks, 1 month, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || !description.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-md font-medium text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Job & Get Pricing'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>
      </form>
    </div>
  );
}
