import { useState, useMemo } from 'react';
import { useJobs, useJobCounts } from '../hooks/useJobs';
import { useSettings } from '../hooks/useSettings';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { AddMockDataButton } from './AddMockDataButton';
import { SettingsPanel } from './SettingsPanel';
import { JobFilters, FilterOptions } from './JobFilters';
import { Job } from '../types/job';
import { filterAndSortJobs } from '../utils/jobFilters';
import JobAnalyzerPage from './JobAnalyzer/JobAnalyzerPage';
import { ReevaluateJobsButton } from './Admin/ReevaluateJobsButton';

type TabType = 'recommended' | 'applied' | 'all' | 'archived' | 'analyzer';

export function Dashboard() {
  // Persist active tab in localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('activeTab');
    return (saved as TabType) || 'recommended';
  });

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * View Mode Toggle
   *
   * - Admin View (default): Shows all metrics, scores, analytics
   * - Sales View: Simplified interface for proposal submission
   *
   * What's hidden in Sales View:
   * - Pipeline value calculations
   * - Score breakdowns (client quality, keywords, etc.)
   * - EHR metrics and fair market value
   * - Detailed client history (total spent/hires)
   *
   * What's visible in Sales View:
   * - Daily stats (recommended/applied/total)
   * - Pricing recommendations
   * - Job descriptions
   * - Proposal generator
   * - Essential client info (payment verified, rating)
   */
  const [viewMode, setViewMode] = useState<'admin' | 'sales'>(() => {
    const saved = localStorage.getItem('viewMode');
    return (saved as 'admin' | 'sales') || 'admin'; // Default to admin
  });

  // Get default filter options
  const getDefaultFilters = (): FilterOptions => ({
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
  });

  // Persist filters independently for each tab in localStorage
  const [recommendedFilters, setRecommendedFilters] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('recommendedFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // If parsing fails, use defaults
      }
    }
    return getDefaultFilters();
  });

  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('appliedFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // If parsing fails, use defaults
      }
    }
    return getDefaultFilters();
  });

  const [allFilters, setAllFilters] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('allFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // If parsing fails, use defaults
      }
    }
    return getDefaultFilters();
  });

  const [archivedFilters, setArchivedFilters] = useState<FilterOptions>(() => {
    const saved = localStorage.getItem('archivedFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // If parsing fails, use defaults
      }
    }
    return getDefaultFilters();
  });

  // Get current filters based on active tab
  const filters = useMemo(() => {
    switch (activeTab) {
      case 'recommended':
        return recommendedFilters;
      case 'applied':
        return appliedFilters;
      case 'all':
        return allFilters;
      case 'archived':
        return archivedFilters;
      default:
        return recommendedFilters;
    }
  }, [activeTab, recommendedFilters, appliedFilters, allFilters, archivedFilters]);

  // Save active tab to localStorage when it changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
  };

  // Save view mode to localStorage when it changes
  const handleViewModeChange = (mode: 'admin' | 'sales') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  // Save filters to localStorage when they change (for the active tab)
  const handleFilterChange = (newFilters: FilterOptions) => {
    switch (activeTab) {
      case 'recommended':
        setRecommendedFilters(newFilters);
        localStorage.setItem('recommendedFilters', JSON.stringify(newFilters));
        break;
      case 'applied':
        setAppliedFilters(newFilters);
        localStorage.setItem('appliedFilters', JSON.stringify(newFilters));
        break;
      case 'all':
        setAllFilters(newFilters);
        localStorage.setItem('allFilters', JSON.stringify(newFilters));
        break;
      case 'archived':
        setArchivedFilters(newFilters);
        localStorage.setItem('archivedFilters', JSON.stringify(newFilters));
        break;
    }
  };

  const { settings, updateSettings } = useSettings();

  const { jobs: rawJobs, loading } = useJobs(activeTab === 'analyzer' ? 'all' : activeTab);
  const counts = useJobCounts(filters.clientCountry);

  // Apply filters and sorting (delegated to utility function)
  const jobs = useMemo(() => {
    return filterAndSortJobs(rawJobs, filters);
  }, [rawJobs, filters]);

  // Wrapper to handle full settings save
  const handleSaveSettings = async (newSettings: any) => {
    await updateSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <header className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="hidden sm:block">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Upwork Job Assistant
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                AI-powered job recommendations with proposals ready to send
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">⚙️</span>
              </button>
              <AddMockDataButton />
            </div>
          </div>
        </header>

        {/* Stats - Simplified single line */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 sm:px-6 py-3 sm:py-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto">
            <span className="text-gray-500 font-medium text-xs sm:text-sm whitespace-nowrap">Today:</span>
            <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
              <span className="font-bold text-gray-900 text-xl sm:text-2xl">{counts.recommended}</span>
              <span className="text-gray-500 text-xs sm:text-sm">recommended</span>
            </div>
            <span className="text-gray-300 text-lg hidden sm:inline">•</span>
            <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
              <span className="font-bold text-gray-900 text-xl sm:text-2xl">{counts.applied}</span>
              <span className="text-gray-500 text-xs sm:text-sm">applied</span>
            </div>
            <span className="text-gray-300 text-lg hidden sm:inline">•</span>
            <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
              <span className="font-bold text-gray-900 text-xl sm:text-2xl">{counts.total}</span>
              <span className="text-gray-500 text-xs sm:text-sm">total</span>
            </div>
          </div>
        </div>

        {/* Admin Tools - Only visible in Admin mode */}
        {viewMode === 'admin' && (
          <div className="mb-6">
            <ReevaluateJobsButton />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 sm:gap-6 md:gap-8 mb-6 border-b border-gray-200 overflow-x-auto">
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
          <TabButton
            active={activeTab === 'archived'}
            onClick={() => handleTabChange('archived')}
            count={counts.archived}
          >
            Archived
          </TabButton>
          <TabButton
            active={activeTab === 'analyzer'}
            onClick={() => handleTabChange('analyzer')}
          >
            Job Analyzer
          </TabButton>
        </div>

        {/* Show Job Analyzer when analyzer tab is active */}
        {activeTab === 'analyzer' ? (
          <JobAnalyzerPage settings={settings} />
        ) : (
          <>
            {/* Total Market Value - Show on recommended and all jobs tabs (Admin View Only) */}
            {viewMode === 'admin' && (activeTab === 'recommended' || activeTab === 'all') && (
              <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-lg px-6 py-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-success-700 font-medium mb-1">Total Pipeline Value</p>
                    <p className="text-2xl sm:text-3xl font-bold text-success-900">
                      ${jobs.reduce((sum, job) => sum + (job.estimatedPrice || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-success-700 font-medium mb-1">Avg Fair Market Value</p>
                    <p className="text-xl sm:text-2xl font-bold text-success-900">
                      ${jobs.length > 0 ? Math.round(jobs.reduce((sum, job) => sum + (job.estimatedPrice || 0), 0) / jobs.length).toLocaleString() : 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters - Show on all tabs with independent settings */}
            <JobFilters filters={filters} onFilterChange={handleFilterChange} />

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
                  {activeTab === 'archived' &&
                    "No archived jobs. Archive jobs that are already hired or not relevant."}
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
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Job Detail Modal */}
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            viewMode={viewMode}
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

function ViewModeToggle({
  viewMode,
  onChange,
}: {
  viewMode: 'admin' | 'sales';
  onChange: (mode: 'admin' | 'sales') => void;
}) {
  return (
    <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={() => onChange('admin')}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
          viewMode === 'admin'
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span className="hidden sm:inline">Admin</span>
        <span className="sm:hidden">📊</span>
      </button>
      <button
        onClick={() => onChange('sales')}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
          viewMode === 'sales'
            ? 'bg-success-600 text-white'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span className="hidden sm:inline">Sales</span>
        <span className="sm:hidden">💼</span>
      </button>
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
