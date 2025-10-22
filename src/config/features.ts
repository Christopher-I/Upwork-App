/**
 * Feature Toggle Configuration
 *
 * Enable/disable features without modifying core logic.
 * Useful for testing and gradual rollout.
 */

export const FEATURE_FLAGS = {
  // Specialty bonuses
  CUSTOM_APPLICATION_BONUS: true,
  US_BASED_BONUS: true,
  DASHBOARD_BONUS: true,
  WEBFLOW_BONUS: true,
  PORTAL_BONUS: true,

  // Multipliers
  PERFECT_JOB_MULTIPLIER: true,

  // UI features
  PERFECT_JOB_STYLING: true,      // Green background for perfect jobs
  US_BASED_BADGE: true,           // Show 📍 badge
  CUSTOM_BADGE: true,             // Show ✨ badge

  // Scoring adjustments
  USE_INTERNAL_SCORE_RANKING: true, // Use uncapped score for sorting
};

/**
 * Check if a feature is enabled
 *
 * @param feature - Feature flag name
 * @returns true if feature is enabled, false otherwise
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature];
}

/**
 * Get all enabled features
 *
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}

/**
 * Get all disabled features
 *
 * @returns Array of disabled feature names
 */
export function getDisabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => !enabled)
    .map(([name]) => name);
}
