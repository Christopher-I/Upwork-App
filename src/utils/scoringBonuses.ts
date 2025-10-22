/**
 * Scoring Bonuses Utilities
 *
 * Modular bonus calculation for different job features.
 * Each bonus function is independent and returns a consistent structure.
 */

import { Job } from '../types/job';
import * as detection from './jobDetection';

export interface BonusResult {
  points: number;
  label: string;
  tier?: number;
  metadata?: Record<string, any>;
}

// ============================================
// CUSTOM APPLICATION BONUS
// ============================================

export function calculateCustomBonus(
  job: Partial<Job>,
  detectionResult: ReturnType<typeof detection.detectCustomApplication>
): BonusResult {
  if (!detectionResult.isDetected) {
    return { points: 0, label: '' };
  }

  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // Context signals
  const hasOpenBudget = !job.budget || job.budget === 0 || job.budgetType === 'negotiable';
  const skillKeywords = [
    'web app', 'application', 'portal', 'dashboard', 'platform', 'saas',
    'system', 'software', 'database', 'api', 'backend', 'frontend',
    'full-stack', 'full stack'
  ];
  const hasSkillMatch = skillKeywords.some(kw => text.includes(kw));
  const hasHighValue = (job.estimatedPrice || 0) >= 5000;

  const isHighConfidence = detectionResult.confidence === 'high';

  let points = 0;
  let tier = 4;
  let tierLabel = '';

  // Tier 1: Maximum bonus
  if (isHighConfidence && hasOpenBudget && hasSkillMatch) {
    points = 12;
    tier = 1;
    tierLabel = 'High-confidence + Open budget + Skills match';
  }
  // Tier 2: Strong bonus
  else if (isHighConfidence && (hasOpenBudget || hasSkillMatch)) {
    points = 8;
    tier = 2;
    tierLabel = hasOpenBudget ?
      'High-confidence + Open budget' :
      'High-confidence + Skills match';
  }
  // Tier 3: Moderate bonus
  else if (detectionResult.confidence === 'medium' &&
           (hasOpenBudget || hasSkillMatch || hasHighValue)) {
    points = 5;
    tier = 3;
    tierLabel = 'Medium-confidence + Positive signals';
  }
  // Tier 4: Basic bonus
  else {
    points = 3;
    tier = 4;
    tierLabel = 'Custom mentioned';
  }

  return {
    points,
    label: '✨ CUSTOM APPLICATION (YOUR #1 SPECIALTY - HIGHEST VALUE)',
    tier,
    metadata: {
      confidenceLevel: detectionResult.confidence,
      hasOpenBudget,
      hasSkillMatch,
      tierLabel,
    },
  };
}

// ============================================
// US-BASED BONUS (NEW)
// ============================================

export function calculateUSBasedBonus(
  job: Partial<Job>,
  detectionResult: ReturnType<typeof detection.detectUSBased>
): BonusResult {
  if (!detectionResult.isDetected) {
    return { points: 0, label: '' };
  }

  // Base bonus by tier
  const isHighConfidence = detectionResult.confidence === 'high';
  const baseBonus = isHighConfidence ? 6 : 4;

  // Amplifier bonus (always +5 for ANY US-based detection)
  const amplifierBonus = 5;

  // Total bonus
  const totalBonus = baseBonus + amplifierBonus;
  const tier = isHighConfidence ? 1 : 2;

  return {
    points: totalBonus,
    label: '🇺🇸 US-BASED FREELANCER (HUGE COMPETITIVE ADVANTAGE)',
    tier,
    metadata: {
      baseBonus,
      amplifierBonus,
      timeZone: detectionResult.timeZone,
      timeZoneMentioned: detectionResult.timeZoneMentioned,
    },
  };
}

// ============================================
// DASHBOARD BONUS (NEW)
// ============================================

export function calculateDashboardBonus(
  job: Partial<Job>,
  detectionResult: ReturnType<typeof detection.detectDashboard>
): BonusResult {
  if (!detectionResult.isDetected) {
    return { points: 0, label: '' };
  }

  return {
    points: 7,
    label: '📊 DASHBOARD (YOUR SPECIALTY - HIGH-VALUE CLIENTS)',
    metadata: {
      patterns: detectionResult.patterns,
    },
  };
}

// ============================================
// WEBFLOW BONUS (EXISTING - REFACTORED)
// ============================================

export function calculateWebflowBonus(
  job: Partial<Job>,
  detectionResult: ReturnType<typeof detection.detectWebflow>
): BonusResult {
  if (!detectionResult.isDetected) {
    return { points: 0, label: '' };
  }

  return {
    points: 8,
    label: '✨ WEBFLOW (YOUR #2 SPECIALTY)',
  };
}

// ============================================
// PORTAL BONUS (EXISTING - REFACTORED)
// ============================================

export function calculatePortalBonus(
  job: Partial<Job>,
  detectionResult: ReturnType<typeof detection.detectPortal>
): BonusResult {
  if (!detectionResult.isDetected) {
    return { points: 0, label: '' };
  }

  return {
    points: 5,
    label: '✨ PORTAL (YOUR #3 SPECIALTY)',
  };
}

// ============================================
// PERFECT JOB MULTIPLIER (NEW)
// ============================================

export interface PerfectJobResult {
  isPerfectJob: boolean;
  multiplier: number;
  criteria: {
    hasCustom: boolean;
    hasUSBased: boolean;
    hasOpenBudget: boolean;
  };
}

export function calculatePerfectJobMultiplier(
  job: Partial<Job>,
  customDetected: boolean,
  usBasedDetected: boolean
): PerfectJobResult {
  const hasOpenBudget = !job.budget || job.budget === 0 || job.budgetType === 'negotiable';

  const isPerfectJob = customDetected && usBasedDetected && hasOpenBudget;

  return {
    isPerfectJob,
    multiplier: isPerfectJob ? 1.15 : 1.0,
    criteria: {
      hasCustom: customDetected,
      hasUSBased: usBasedDetected,
      hasOpenBudget,
    },
  };
}
