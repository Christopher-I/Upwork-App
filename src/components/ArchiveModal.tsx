import { useState } from 'react';
import { Modal } from './Modal';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArchive: (reason: 'position_filled' | 'job_irrelevant') => void;
  jobTitle: string;
}

export function ArchiveModal({ isOpen, onClose, onArchive, jobTitle }: ArchiveModalProps) {
  const [selectedReason, setSelectedReason] = useState<'position_filled' | 'job_irrelevant'>('position_filled');

  const handleArchive = () => {
    onArchive(selectedReason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Archive Job"
      size="sm"
      actions={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Archive Job
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Archive "<span className="font-medium">{jobTitle}</span>"?
        </p>
        <p className="text-sm text-gray-600">
          Archived jobs won't appear in your main job list or count toward totals. You can unarchive them later if needed.
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">Why are you archiving this job?</p>

          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="archiveReason"
              value="position_filled"
              checked={selectedReason === 'position_filled'}
              onChange={(e) => setSelectedReason(e.target.value as 'position_filled')}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Position already filled</div>
              <div className="text-xs text-gray-500">The client has already hired someone</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="archiveReason"
              value="job_irrelevant"
              checked={selectedReason === 'job_irrelevant'}
              onChange={(e) => setSelectedReason(e.target.value as 'job_irrelevant')}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Job irrelevant</div>
              <div className="text-xs text-gray-500">Non-development/design work or not a good fit</div>
            </div>
          </label>
        </div>
      </div>
    </Modal>
  );
}
