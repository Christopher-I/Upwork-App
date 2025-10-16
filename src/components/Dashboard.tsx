import { useState, useMemo } from 'react';
import { useJobs, useJobCounts } from '../hooks/useJobs';
import { useSettings } from '../hooks/useSettings';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { AddMockDataButton } from './AddMockDataButton';
import { SettingsPanel } from './SettingsPanel';
import { JobFilters, FilterOptions } from './JobFilters';
import { Job } from '../types/job';

type TabType = 'recommended' | 'applied' | 'all';

export function Dashboard() {
  // Persist active tab in localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('activeTab');
    return (saved as TabType) || 'recommended';
  });

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Persist filters in localStorage
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('jobFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // If parsing fails, use defaults
      }
    }
    return {
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
    };
  });

  // Save active tab to localStorage when it changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
  };

  // Save filters to localStorage when they change
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    localStorage.setItem('jobFilters', JSON.stringify(newFilters));
  };

  const { settings, updateSettings } = useSettings();

  const { jobs: rawJobs, loading } = useJobs(activeTab);
  const counts = useJobCounts(filters.clientCountry);

  // Apply filters and sorting
  const jobs = useMemo(() => {
    let filtered = [...rawJobs];

    // Apply country filter (applies to all tabs)
    if (filters.clientCountry === 'us_only') {
      filtered = filtered.filter((job) => {
        const location = job.client?.location;
        // Handle both string format and object format
        const country = typeof location === 'string' ? location : location?.country;
        return country === 'United States' || country === 'US' || country === 'USA';
      });
    }

    // ALWAYS exclude hired jobs (applies to all tabs)
    filtered = filtered.filter((job) => {
      // If job has hiring info, check if positions are still available
      if (job.freelancersToHire !== undefined && job.totalFreelancersToHire !== undefined) {
        const freelancersToHire = job.freelancersToHire || 0;
        const totalFreelancersToHire = job.totalFreelancersToHire || 1;

        // If all positions filled (freelancersToHire = 0 and totalFreelancersToHire > 0), exclude
        if (totalFreelancersToHire > 0 && freelancersToHire === 0) {
          return false;
        }
      }
      return true;
    });

    // Only apply additional filters on "all" tab
    if (activeTab !== 'all') return filtered;

    // Budget type filter
    if (filters.budgetType !== 'all') {
      if (filters.budgetType === 'open') {
        // Open budget means no price set (budget = 0 or budgetIsPlaceholder = true)
        filtered = filtered.filter(
          (job) => job.budget === 0 || job.budgetIsPlaceholder === true
        );
      } else {
        filtered = filtered.filter((job) => job.budgetType === filters.budgetType);
      }
    }

    // Budget range filter
    if (filters.minBudget > 0) {
      filtered = filtered.filter((job) => job.budget >= filters.minBudget);
    }
    if (filters.maxBudget > 0) {
      filtered = filtered.filter((job) => job.budget <= filters.maxBudget);
    }

    // Proposals range filter
    if (filters.minProposals > 0) {
      filtered = filtered.filter(
        (job) => job.proposalsCount >= filters.minProposals
      );
    }
    if (filters.maxProposals > 0) {
      filtered = filtered.filter(
        (job) => job.proposalsCount <= filters.maxProposals
      );
    }

    // Market rate range filter
    if (filters.minMarketRate > 0) {
      filtered = filtered.filter(
        (job) => (job.estimatedPrice || 0) >= filters.minMarketRate
      );
    }
    if (filters.maxMarketRate > 0) {
      filtered = filtered.filter(
        (job) => (job.estimatedPrice || 0) <= filters.maxMarketRate
      );
    }

    // Team language filter
    if (filters.teamLanguage === 'team') {
      filtered = filtered.filter(
        (job) =>
          job.languageAnalysis &&
          (job.languageAnalysis.weCount > 0 ||
            job.languageAnalysis.ourCount > 0 ||
            job.languageAnalysis.teamMentions > 0)
      );
    } else if (filters.teamLanguage === 'solo') {
      filtered = filtered.filter(
        (job) =>
          job.languageAnalysis &&
          (job.languageAnalysis.iCount > 0 ||
            job.languageAnalysis.myCount > 0 ||
            job.languageAnalysis.meMentions > 0)
      );
    }

    // Experience level filter
    if (filters.experienceLevel !== 'all') {
      filtered = filtered.filter(
        (job) => job.experienceLevel === filters.experienceLevel
      );
    }

    // Payment verified filter
    if (filters.paymentVerified === 'yes') {
      filtered = filtered.filter((job) => job.client.paymentVerified);
    } else if (filters.paymentVerified === 'no') {
      filtered = filtered.filter((job) => !job.client.paymentVerified);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.budget - b.budget);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.budget - a.budget);
        break;
      case 'score_high':
        filtered.sort((a, b) => b.score - a.score);
        break;
      case 'market_rate_high':
        filtered.sort((a, b) => (b.estimatedPrice || 0) - (a.estimatedPrice || 0));
        break;
      case 'proposals_low':
        filtered.sort((a, b) => a.proposalsCount - b.proposalsCount);
        break;
      case 'newest':
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        );
        break;
    }

    return filtered;
  }, [rawJobs, filters, activeTab]);

  // Wrapper to handle full settings save
  const handleSaveSettings = async (newSettings: any) => {
    await updateSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Upwork Job Assistant
              </h1>
              <p className="text-gray-500 mt-1 text-base">
                AI-powered job recommendations with proposals ready to send
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Settings
              </button>
              <AddMockDataButton />
            </div>
          </div>
        </header>

        {/* Stats - Simplified single line */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mb-6">
          <div className="flex items-center gap-6">
            <span className="text-gray-500 font-medium text-sm">Today:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-2xl">{counts.recommended}</span>
              <span className="text-gray-500 text-sm">recommended</span>
            </div>
            <span className="text-gray-300 text-lg">•</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-2xl">{counts.applied}</span>
              <span className="text-gray-500 text-sm">applied</span>
            </div>
            <span className="text-gray-300 text-lg">•</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-2xl">{counts.total}</span>
              <span className="text-gray-500 text-sm">total</span>
            </div>
          </div>
        </div>

        {/* Country Filter - Shows on all tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Client Location:</label>
              <select
                value={filters.clientCountry}
                onChange={(e) => handleFilterChange({ ...filters, clientCountry: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="us_only">US Clients Only</option>
                <option value="all">All Countries</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{jobs.length}</span> jobs
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <TabButton
            active={activeTab === 'recommended'}
            onClick={() => handleTabChange('recommended')}
            count={counts.recommended}
          >
            Recommended
          </TabButton>
          <TabButton
            active={activeTab === 'applied'}
            onClick={() => handleTabChange('applied')}
            count={counts.applied}
          >
            Applied
          </TabButton>
          <TabButton
            active={activeTab === 'all'}
            onClick={() => handleTabChange('all')}
            count={counts.total}
          >
            All Jobs
          </TabButton>
        </div>

        {/* Filters - Only show on All Jobs tab */}
        {activeTab === 'all' && (
          <JobFilters filters={filters} onFilterChange={handleFilterChange} />
        )}

        {/* Jobs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-500 mt-4">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-base">
              {activeTab === 'recommended' &&
                'No recommended jobs yet. Click refresh to fetch jobs from Upwork.'}
              {activeTab === 'applied' &&
                "You haven't applied to any jobs yet."}
              {activeTab === 'all' &&
                'No jobs in database. Click refresh to fetch jobs.'}
            </p>
            {activeTab === 'recommended' && (
              <button className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors">
                Refresh Jobs
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => setSelectedJob(job)}
              />
            ))}
          </div>
        )}

        {/* Job Detail Modal */}
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
          />
        )}

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}


function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${
        active
          ? 'border-primary-600 text-gray-900'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`ml-2 text-xs ${active ? 'text-gray-600' : 'text-gray-400'}`}>
          ({count})
        </span>
      )}
    </button>
  );
}
