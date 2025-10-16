import { useState } from 'react';
import { Settings } from '../types/settings';

interface SettingsPanelProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsPanel({ settings, onSave, onClose }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [activeTab, setActiveTab] = useState<'fetching' | 'scoring' | 'filters'>('fetching');

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('fetching')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'fetching'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fetching & Filters
            </button>
            <button
              onClick={() => setActiveTab('scoring')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'scoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scoring Weights
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'filters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Thresholds
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'fetching' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Fetching</h3>

                {/* Time Window */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Window (Fetch jobs posted in:)
                  </label>
                  <select
                    value={localSettings.platformFilters.posted}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        platformFilters: {
                          ...localSettings.platformFilters,
                          posted: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="last_24h">Last 24 hours</option>
                    <option value="last_48h">Last 48 hours</option>
                    <option value="last_7_days">Last 7 days (recommended)</option>
                    <option value="last_14_days">Last 14 days</option>
                    <option value="last_30_days">Last 30 days</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Shorter windows = fewer ChatGPT API calls. 7 days is a good balance.
                  </p>
                </div>

                {/* Max Proposals */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Proposals (Only show jobs with fewer than:)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={localSettings.platformFilters.maxProposals}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        platformFilters: {
                          ...localSettings.platformFilters,
                          maxProposals: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Lower = less competition. 5 proposals is recommended.
                  </p>
                </div>

                {/* Payment Verified */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localSettings.platformFilters.paymentVerified}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          platformFilters: {
                            ...localSettings.platformFilters,
                            paymentVerified: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Only payment verified clients
                    </span>
                  </label>
                </div>

                {/* Experience Levels */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Levels
                  </label>
                  <div className="space-y-2">
                    {['entry', 'intermediate', 'expert'].map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.platformFilters.experienceLevel.includes(level)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...localSettings.platformFilters.experienceLevel, level]
                              : localSettings.platformFilters.experienceLevel.filter((l) => l !== level);
                            setLocalSettings({
                              ...localSettings,
                              platformFilters: {
                                ...localSettings.platformFilters,
                                experienceLevel: updated,
                              },
                            });
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Scoring Weights</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Adjust how much each dimension contributes to the total score (max 100 points).
                </p>

                {/* Client Quality */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Client Quality</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {localSettings.scoringWeights.clientQuality} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={localSettings.scoringWeights.clientQuality}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        scoringWeights: {
                          ...localSettings.scoringWeights,
                          clientQuality: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Payment verified, spend history, recent activity
                  </p>
                </div>

                {/* Keywords Match */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Keywords Match</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {localSettings.scoringWeights.keywordsMatch} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={localSettings.scoringWeights.keywordsMatch}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        scoringWeights: {
                          ...localSettings.scoringWeights,
                          keywordsMatch: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    How well job matches your keyword searches
                  </p>
                </div>

                {/* Professional Signals */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Professional Signals</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {localSettings.scoringWeights.professionalSignals} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={localSettings.scoringWeights.professionalSignals}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        scoringWeights: {
                          ...localSettings.scoringWeights,
                          professionalSignals: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Open budget, team language ("we" vs "I")
                  </p>
                </div>

                {/* Business Impact */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Business Impact</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {localSettings.scoringWeights.businessImpact} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={localSettings.scoringWeights.businessImpact}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        scoringWeights: {
                          ...localSettings.scoringWeights,
                          businessImpact: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Solving business problem vs hiring a developer (ChatGPT)
                  </p>
                </div>

                {/* Job Clarity */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Job Clarity</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {localSettings.scoringWeights.jobClarity} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={localSettings.scoringWeights.jobClarity}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        scoringWeights: {
                          ...localSettings.scoringWeights,
                          jobClarity: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    How many boxes ticked (clarity signals) (ChatGPT)
                  </p>
                </div>

                {/* EHR Potential */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">EHR Potential</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {localSettings.scoringWeights.ehrPotential} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={localSettings.scoringWeights.ehrPotential}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        scoringWeights: {
                          ...localSettings.scoringWeights,
                          ehrPotential: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Estimated hourly rate potential (ChatGPT)
                  </p>
                </div>

                {/* Red Flag Penalty */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Red Flag Penalty</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {localSettings.scoringWeights.redFlagPenalty} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={localSettings.scoringWeights.redFlagPenalty}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        scoringWeights: {
                          ...localSettings.scoringWeights,
                          redFlagPenalty: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Negative keywords detected (cheap, quick, fix, etc.)
                  </p>
                </div>

                {/* Total */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">
                      Total Points Available:
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {Object.values(localSettings.scoringWeights).reduce((a, b) => a + b, 0)} / 100
                    </span>
                  </div>
                  {Object.values(localSettings.scoringWeights).reduce((a, b) => a + b, 0) !== 95 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Note: Total should equal 95 (excluding red flag penalty of -10)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Thresholds</h3>

                {/* Min Score */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Score to Recommend
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={localSettings.minScore}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          minScore: parseInt(e.target.value),
                        })
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-lg font-semibold text-gray-900 w-12 text-right">
                      {localSettings.minScore}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Jobs below this score will be marked "Not Recommended"
                  </p>
                </div>

                {/* Min EHR */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum EHR ($/hr)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="30"
                      max="150"
                      step="10"
                      value={localSettings.minEHR}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          minEHR: parseInt(e.target.value),
                        })
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-lg font-semibold text-gray-900 w-16 text-right">
                      ${localSettings.minEHR}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Jobs below this estimated hourly rate will be filtered out
                  </p>
                </div>

                {/* Daily Goals */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Goals</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposals Target per Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={localSettings.dailyGoals.proposalsTarget}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          dailyGoals: {
                            ...localSettings.dailyGoals,
                            proposalsTarget: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Win Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={localSettings.dailyGoals.targetWinRate * 100}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          dailyGoals: {
                            ...localSettings.dailyGoals,
                            targetWinRate: parseInt(e.target.value) / 100,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
