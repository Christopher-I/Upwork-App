import { useState } from 'react';
import { addMockJobs } from '../utils/mockData';
import { clearAllJobs } from '../utils/clearJobs';

export function AddMockDataButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await addMockJobs();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding mock data:', error);
      alert('Error adding mock data. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Delete all jobs from database?')) return;

    setClearing(true);
    try {
      await clearAllJobs();
      alert('All jobs cleared!');
    } catch (error) {
      console.error('Error clearing jobs:', error);
      alert('Error clearing jobs. Check console.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleClear}
        disabled={clearing}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          clearing
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-danger-600 text-white hover:bg-danger-700 border border-danger-700'
        }`}
      >
        {clearing ? 'Clearing...' : 'Clear All'}
      </button>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          success
            ? 'bg-success-600 text-white'
            : loading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {loading ? 'Adding...' : success ? 'Added!' : 'Add Mock Data'}
      </button>
    </div>
  );
}
