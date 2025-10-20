/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRICING CALCULATOR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file contains the calculation logic for pricing recommendations.
 *
 * IMPORTANT: Do NOT hardcode pricing values here!
 * All pricing settings come from src/config/pricingConfig.ts
 *
 * To adjust pricing strategy, edit pricingConfig.ts, not this file.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  PRICING_CONFIG,
  applyFairMarketMultiplier,
  getHourlyRateForComplexity,
  roundPrice,
} from '../config/pricingConfig';
import { Job } from '../types/job';
import {
  ComplexityTier,
  HourlyPricing,
  FixedPricePricing,
  PricingRecommendation,
  ProjectPhase,
} from '../types/pricing';

/**
 * Determine project complexity based on job characteristics
 * Returns: 'low' | 'medium' | 'high'
 */
export function determineComplexity(job: Job): ComplexityTier {
  let complexityScore = job.score;

  // Add bonus points for complexity signals (from config)
  const signals = PRICING_CONFIG.COMPLEXITY_THRESHOLDS.SIGNALS;

  if (job.scoreBreakdown?.jobClarity === 15) {
    complexityScore += signals.PERFECT_CLARITY_BONUS;
  }

  if ((job.scoreBreakdown?.ehrPotential || 0) >= 13) {
    complexityScore += signals.HIGH_EHR_BONUS;
  }

  if (job.experienceLevel === 'expert') {
    complexityScore += signals.EXPERT_LEVEL_BONUS;
  }

  if ((job.scoreBreakdown?.professionalSignals?.weLanguage || 0) > 0) {
    complexityScore += signals.TEAM_LANGUAGE_BONUS;
  }

  // Determine tier based on thresholds (from config)
  const thresholds = PRICING_CONFIG.COMPLEXITY_THRESHOLDS.SCORE;

  if (complexityScore >= thresholds.MEDIUM_TO_HIGH) {
    return 'high';
  } else if (complexityScore >= thresholds.LOW_TO_MEDIUM) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate reasoning for why a specific rate was chosen
 */
function generateHourlyReasoning(job: Job, complexity: ComplexityTier): string[] {
  const reasons: string[] = [];

  // Complexity tier
  reasons.push(`${complexity.charAt(0).toUpperCase() + complexity.slice(1)} complexity project`);

  // Job clarity
  if (job.scoreBreakdown?.jobClarity === 15) {
    reasons.push('Perfect job clarity (15/15) - well-defined requirements');
  } else if ((job.scoreBreakdown?.jobClarity || 0) >= 12) {
    reasons.push('High job clarity - clear requirements');
  }

  // Experience level
  if (job.experienceLevel === 'expert') {
    reasons.push('Expert-level expertise required');
  } else if (job.experienceLevel === 'intermediate') {
    reasons.push('Intermediate-level expertise required');
  }

  // Professional signals
  if ((job.scoreBreakdown?.professionalSignals?.weLanguage || 0) > 0) {
    reasons.push('Professional client (team/company language)');
  }

  // Job score
  if (job.score >= 85) {
    reasons.push(`High quality job (Score: ${job.score}/100)`);
  } else if (job.score >= 70) {
    reasons.push(`Good quality job (Score: ${job.score}/100)`);
  }

  return reasons;
}

/**
 * Calculate hourly pricing recommendation
 */
export function calculateHourlyRecommendation(job: Job): HourlyPricing {
  // Determine complexity
  const complexity = determineComplexity(job);

  // Get rate range for this complexity
  const rateInfo = getHourlyRateForComplexity(complexity);

  // Use default rate for this complexity tier
  let recommendedRate = rateInfo.default;

  // Apply fair market multiplier if needed
  const fairMarketValue = applyFairMarketMultiplier(job.estimatedPrice || 0);

  // Calculate estimated hours based on fair market value and recommended rate
  let estimatedHours = fairMarketValue > 0 ? Math.round(fairMarketValue / recommendedRate) : 0;

  // Ensure minimum hours
  if (estimatedHours < PRICING_CONFIG.MINIMUMS.ESTIMATED_HOURS && estimatedHours > 0) {
    estimatedHours = PRICING_CONFIG.MINIMUMS.ESTIMATED_HOURS;
  }

  // Calculate total estimate
  const totalEstimate = roundPrice(estimatedHours * recommendedRate);

  // Generate reasoning
  const reasoning = generateHourlyReasoning(job, complexity);

  return {
    recommendedRate,
    estimatedHours,
    totalEstimate,
    complexity,
    reasoning,
    rateRange: {
      min: rateInfo.min,
      max: rateInfo.max,
    },
  };
}

/**
 * Calculate fixed-price phase breakdown
 */
export function calculateFixedPricePhases(job: Job): FixedPricePricing {
  // Apply fair market multiplier
  const totalPrice = applyFairMarketMultiplier(job.estimatedPrice || 0);

  // Determine if 2-phase or 3-phase based on price
  const useThreePhases = totalPrice >= PRICING_CONFIG.FIXED_PRICE_PHASES.THREE_PHASE_THRESHOLD;

  const phaseConfig = useThreePhases
    ? PRICING_CONFIG.FIXED_PRICE_PHASES.THREE_PHASE
    : PRICING_CONFIG.FIXED_PRICE_PHASES.TWO_PHASE;

  // Build phases array
  const phases: ProjectPhase[] = [];
  const phaseKeys = Object.keys(phaseConfig) as Array<keyof typeof phaseConfig>;

  phaseKeys.forEach((key, index) => {
    const phaseData = phaseConfig[key];
    const phasePrice = roundPrice((totalPrice * phaseData.percentage) / 100);

    phases.push({
      number: index + 1,
      name: phaseData.name,
      description: phaseData.name,
      price: phasePrice,
      percentage: phaseData.percentage,
      deliverables: phaseData.deliverables,
    });
  });

  // Generate payment schedule string
  const paymentSchedule = phases.map((p) => `${p.percentage}%`).join(' / ');

  return {
    totalPrice,
    phases,
    paymentSchedule,
  };
}

/**
 * Main entry point: Calculate pricing recommendation based on job type
 */
export function calculatePricingRecommendation(job: Job): PricingRecommendation {
  try {
    // Check if we have the data we need
    if (!job.estimatedPrice || job.estimatedPrice === 0) {
      return {
        type: 'error',
        message: 'Unable to calculate pricing - no fair market value available',
      };
    }

    // Check minimum thresholds
    if (job.budgetType === 'fixed' && job.estimatedPrice < PRICING_CONFIG.MINIMUMS.FIXED_PRICE) {
      return {
        type: 'error',
        message: `Project value ($${job.estimatedPrice}) is below minimum threshold ($${PRICING_CONFIG.MINIMUMS.FIXED_PRICE})`,
      };
    }

    // Calculate based on budget type
    if (job.budgetType === 'hourly') {
      const hourlyData = calculateHourlyRecommendation(job);

      // Check if hourly rate is below minimum
      if (hourlyData.recommendedRate < PRICING_CONFIG.MINIMUMS.HOURLY_RATE) {
        return {
          type: 'error',
          message: `Recommended rate ($${hourlyData.recommendedRate}/hr) is below minimum ($${PRICING_CONFIG.MINIMUMS.HOURLY_RATE}/hr)`,
        };
      }

      return {
        type: 'hourly',
        data: hourlyData,
      };
    } else if (job.budgetType === 'fixed') {
      const fixedData = calculateFixedPricePhases(job);

      return {
        type: 'fixed',
        data: fixedData,
      };
    } else {
      // Unknown budget type, default to fixed
      const fixedData = calculateFixedPricePhases(job);

      return {
        type: 'fixed',
        data: fixedData,
      };
    }
  } catch (error) {
    console.error('Error calculating pricing recommendation:', error);
    return {
      type: 'error',
      message: 'An error occurred while calculating pricing',
    };
  }
}

/**
 * Format pricing recommendation as plain text for copying to clipboard
 */
export function formatPricingAsText(recommendation: PricingRecommendation, job: Job): string {
  if (recommendation.type === 'error') {
    return recommendation.message;
  }

  if (recommendation.type === 'hourly') {
    const { data } = recommendation;
    let text = '';

    text += `Hourly Rate: $${data.recommendedRate}/hour\n`;
    text += `Estimated Time: ${data.estimatedHours} hours\n`;
    text += `Total Estimate: $${data.totalEstimate.toLocaleString()}\n`;
    text += `\n`;

    if (PRICING_CONFIG.DISPLAY.SHOW_REASONING) {
      text += `Why $${data.recommendedRate}/hour?\n`;
      data.reasoning.forEach((reason) => {
        text += `• ${reason}\n`;
      });
    }

    return text;
  }

  if (recommendation.type === 'fixed') {
    const { data } = recommendation;
    let text = '';

    text += `Total Project: $${data.totalPrice.toLocaleString()}\n`;
    text += `Payment Schedule: ${data.paymentSchedule}\n`;
    text += `\n`;

    data.phases.forEach((phase) => {
      text += `Phase ${phase.number} (${phase.percentage}% - $${phase.price.toLocaleString()}): ${phase.name}\n`;
      phase.deliverables.forEach((deliverable) => {
        text += `• ${deliverable}\n`;
      });
      text += `\n`;
    });

    return text;
  }

  return '';
}
