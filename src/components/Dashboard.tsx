import { useState } from 'react';
import { useJobs, useJobCounts } from '../hooks/useJobs';
import { useSettings } from '../hooks/useSettings';
import { JobCard } from './JobCard';
import { JobDetailModal } from './JobDetailModal';
import { AddMockDataButton } from './AddMockDataButton';
import { SettingsPanel } from './SettingsPanel';
import { Job } from '../types/job';

type TabType = 'recommended' | 'applied' | 'all';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('recommended');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { settings, updateSettings } = useSettings();

  const { jobs, loading } = useJobs(activeTab);
  const counts = useJobCounts();

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

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <TabButton
            active={activeTab === 'recommended'}
            onClick={() => setActiveTab('recommended')}
            count={counts.recommended}
          >
            Recommended
          </TabButton>
          <TabButton
            active={activeTab === 'applied'}
            onClick={() => setActiveTab('applied')}
            count={counts.applied}
          >
            Applied
          </TabButton>
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            count={counts.total}
          >
            All Jobs
          </TabButton>
        </div>

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
