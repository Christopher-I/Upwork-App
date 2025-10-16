import { useState } from 'react';

export interface FilterOptions {
  budgetType: 'all' | 'fixed' | 'hourly' | 'open';
  minBudget: number;
  maxBudget: number;
  minMarketRate: number;
  maxMarketRate: number;
  minProposals: number;
  maxProposals: number;
  teamLanguage: 'all' | 'team' | 'solo';
  experienceLevel: 'all' | 'entry' | 'intermediate' | 'expert';
  paymentVerified: 'all' | 'yes' | 'no';
  clientCountry: 'us_only' | 'all';
  sortBy: 'newest' | 'price_low' | 'price_high' | 'score_high' | 'proposals_low' | 'market_rate_high';
}

interface JobFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof FilterOptions, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Filter Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="font-medium text-gray-900">Filters</span>
          {getActiveFilterCount(filters) > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {getActiveFilterCount(filters)} active
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Budget Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Type
              </label>
              <select
                value={filters.budgetType}
                onChange={(e) =>
                  handleChange('budgetType', e.target.value as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly</option>
                <option value="open">Open Budget (No Price Set)</option>
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Budget ($)
              </label>
              <input
                type="number"
                value={filters.minBudget}
                onChange={(e) =>
                  handleChange('minBudget', parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Budget ($)
              </label>
              <input
                type="number"
                value={filters.maxBudget || ''}
                onChange={(e) =>
                  handleChange('maxBudget', parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="No limit"
                min="0"
              />
            </div>

            {/* Market Rate Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Market Rate ($)
              </label>
              <input
                type="number"
                value={filters.minMarketRate || ''}
                onChange={(e) =>
                  handleChange('minMarketRate', parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Market Rate ($)
              </label>
              <input
                type="number"
                value={filters.maxMarketRate || ''}
                onChange={(e) =>
                  handleChange('maxMarketRate', parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="No limit"
                min="0"
                step="1000"
              />
            </div>

            {/* Team Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Language
              </label>
              <select
                value={filters.teamLanguage}
                onChange={(e) =>
                  handleChange('teamLanguage', e.target.value as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="team">Team Language (We/Our)</option>
                <option value="solo">Solo Language (I/My)</option>
              </select>
            </div>

            {/* Proposals Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Proposals
              </label>
              <input
                type="number"
                value={filters.minProposals}
                onChange={(e) =>
                  handleChange('minProposals', parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Proposals
              </label>
              <input
                type="number"
                value={filters.maxProposals || ''}
                onChange={(e) =>
                  handleChange('maxProposals', parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="No limit"
                min="0"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={filters.experienceLevel}
                onChange={(e) =>
                  handleChange('experienceLevel', e.target.value as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Payment Verified */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Verified
              </label>
              <select
                value={filters.paymentVerified}
                onChange={(e) =>
                  handleChange('paymentVerified', e.target.value as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Clients</option>
                <option value="yes">Verified Only</option>
                <option value="no">Unverified Only</option>
              </select>
            </div>

            {/* Client Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Location
              </label>
              <select
                value={filters.clientCountry}
                onChange={(e) =>
                  handleChange('clientCountry', e.target.value as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="us_only">US Clients Only</option>
                <option value="all">All Countries</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  handleChange('sortBy', e.target.value as any)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="score_high">Score: High to Low</option>
                <option value="market_rate_high">Market Rate: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="proposals_low">Proposals: Low to High</option>
              </select>
            </div>
          </div>

          {/* Reset Button */}
          {getActiveFilterCount(filters) > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() =>
                  onFilterChange({
                    budgetType: 'all',
                    minBudget: 0,
                    maxBudget: 0,
                    minMarketRate: 0,
                    maxMarketRate: 0,
                    minProposals: 0,
                    maxProposals: 0,
                    teamLanguage: 'all',
                    experienceLevel: 'all',
                    paymentVerified: 'all',
                    clientCountry: 'us_only',
                    sortBy: 'score_high',
                  })
                }
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getActiveFilterCount(filters: FilterOptions): number {
  let count = 0;
  if (filters.budgetType !== 'all') count++;
  if (filters.minBudget > 0) count++;
  if (filters.maxBudget > 0) count++;
  if (filters.minProposals > 0) count++;
  if (filters.maxProposals > 0) count++;
  if (filters.teamLanguage !== 'all') count++;
  if (filters.experienceLevel !== 'all') count++;
  if (filters.paymentVerified !== 'all') count++;
  // Don't count clientCountry as 'us_only' is the default
  if (filters.clientCountry !== 'us_only') count++;
  return count;
}
