/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRICING CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file contains ALL pricing strategy settings for sales proposals.
 * Adjust these values to change how the app calculates pricing recommendations.
 *
 * Last updated: 2025-01-19
 * Version: 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * QUICK START GUIDE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Common adjustments:
 *
 * 1. Price at 90% of market rate:
 *    → Set FAIR_MARKET_VALUE_MULTIPLIER to 0.9
 *
 * 2. Increase hourly rates:
 *    → Edit HOURLY_RATES.HIGH_COMPLEXITY.default
 *
 * 3. Change when 3 phases vs 2 phases:
 *    → Edit FIXED_PRICE_PHASES.THREE_PHASE_THRESHOLD
 *
 * 4. Adjust phase split (e.g., 40/40/20 instead of 30/50/20):
 *    → Edit FIXED_PRICE_PHASES.THREE_PHASE percentages
 *
 * 5. Change deliverables in phases:
 *    → Edit FIXED_PRICE_PHASES deliverables arrays
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const PRICING_CONFIG_VERSION = '1.0.0';
export const PRICING_CONFIG_LAST_UPDATED = '2025-01-19';

export const PRICING_CONFIG = {

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL PRICING STRATEGY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fair Market Value Multiplier
   *
   * Set your pricing relative to the calculated fair market value.
   * - 1.0 = Price at 100% of fair market value (match market rate)
   * - 0.9 = Price at 90% of fair market value (10% discount)
   * - 1.1 = Price at 110% of fair market value (10% premium)
   *
   * Examples:
   * - Fair market value: $10,000
   * - With 0.9 multiplier: $9,000
   * - With 1.0 multiplier: $10,000
   * - With 1.1 multiplier: $11,000
   */
  FAIR_MARKET_VALUE_MULTIPLIER: 0.9,


  // ═══════════════════════════════════════════════════════════════════════════
  // HOURLY RATE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Hourly rate ranges based on project complexity
   * Adjust these to change your hourly pricing tiers
   */
  HOURLY_RATES: {
    LOW_COMPLEXITY: {
      min: 40,        // Minimum rate for simple projects
      max: 55,        // Maximum rate for simple projects
      default: 45,    // Default rate to show for simple projects
    },
    MEDIUM_COMPLEXITY: {
      min: 55,        // Minimum rate for moderate projects
      max: 75,        // Maximum rate for moderate projects
      default: 60,    // Default rate to show for moderate projects
    },
    HIGH_COMPLEXITY: {
      min: 70,        // Minimum rate for complex projects
      max: 90,        // Maximum rate for complex projects
      default: 75,    // Default rate to show for complex projects
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLEXITY DETERMINATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Thresholds for determining project complexity
   * These determine which hourly rate tier to use
   */
  COMPLEXITY_THRESHOLDS: {
    /**
     * Job score thresholds
     * Score is calculated 0-100 based on job quality
     */
    SCORE: {
      LOW_TO_MEDIUM: 70,     // Score < 70 = Low complexity
      MEDIUM_TO_HIGH: 85,    // Score >= 85 = High complexity
      // Score 70-84 = Medium complexity
    },

    /**
     * Additional complexity signals
     * Adjust weights to fine-tune complexity calculation
     */
    SIGNALS: {
      PERFECT_CLARITY_BONUS: 10,        // +10 points if job clarity = 15/15
      HIGH_EHR_BONUS: 5,                // +5 points if EHR potential >= 13/15
      EXPERT_LEVEL_BONUS: 5,            // +5 points if expert level required
      TEAM_LANGUAGE_BONUS: 5,           // +5 points if professional team language
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // FIXED-PRICE PHASE BREAKDOWN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Milestone/phase breakdown for fixed-price projects
   */
  FIXED_PRICE_PHASES: {
    /**
     * Threshold for 2-phase vs 3-phase breakdown
     * Projects below this use 2 phases, above use 3 phases
     */
    THREE_PHASE_THRESHOLD: 10000,  // $10,000

    /**
     * 2-Phase breakdown (for projects < $10,000)
     * Percentages must add up to 100
     */
    TWO_PHASE: {
      PHASE_1: {
        percentage: 50,
        name: 'Discovery & Development Setup',
        deliverables: [
          'Requirements gathering and analysis',
          'UX/UI design and mockups',
          'Technical architecture planning',
          'Development environment setup',
        ],
      },
      PHASE_2: {
        percentage: 50,
        name: 'Implementation & Deployment',
        deliverables: [
          'Full feature implementation',
          'Testing and QA',
          'Bug fixes and refinement',
          'Production deployment and launch',
        ],
      },
    },

    /**
     * 3-Phase breakdown (for projects >= $10,000)
     * Percentages must add up to 100
     */
    THREE_PHASE: {
      PHASE_1: {
        percentage: 30,
        name: 'Discovery, Design & Architecture',
        deliverables: [
          'Requirements gathering and analysis',
          'UX/UI design and prototypes',
          'Technical architecture document',
          'Project timeline and milestones',
        ],
      },
      PHASE_2: {
        percentage: 50,
        name: 'Core Development & Features',
        deliverables: [
          'Database design and setup',
          'Backend API development',
          'Frontend implementation',
          'Third-party integrations',
          'Core feature development',
        ],
      },
      PHASE_3: {
        percentage: 20,
        name: 'Testing, Refinement & Launch',
        deliverables: [
          'Comprehensive QA testing',
          'Bug fixes and optimization',
          'Performance tuning',
          'Production deployment',
          'Post-launch support (2 weeks)',
        ],
      },
    },
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // MINIMUM THRESHOLDS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Minimum acceptable values
   * Used to flag jobs that are below your standards
   */
  MINIMUMS: {
    HOURLY_RATE: 45,           // Don't accept jobs below $45/hour
    FIXED_PRICE: 500,          // Don't accept fixed jobs below $500
    ESTIMATED_HOURS: 5,        // Don't accept jobs under 5 hours
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // DISPLAY SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * How pricing recommendations are displayed to sales person
   */
  DISPLAY: {
    SHOW_REASONING: true,              // Show why this rate was chosen
    SHOW_COMPLEXITY_BREAKDOWN: true,   // Show complexity calculation details
    SHOW_ALTERNATIVE_RATES: true,      // Show min/max range in addition to recommended
    ROUND_TO_NEAREST: 5,               // Round prices to nearest $5 (e.g., $47 → $45, $53 → $55)
    CURRENCY_SYMBOL: '$',              // Currency to display
  },
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Get hourly rate for complexity tier
 */
export function getHourlyRateForComplexity(complexity: 'low' | 'medium' | 'high'): {
  min: number;
  max: number;
  default: number;
} {
  const key = `${complexity.toUpperCase()}_COMPLEXITY` as keyof typeof PRICING_CONFIG.HOURLY_RATES;
  return PRICING_CONFIG.HOURLY_RATES[key];
}

/**
 * Apply fair market value multiplier
 */
export function applyFairMarketMultiplier(fairMarketValue: number): number {
  return Math.round(fairMarketValue * PRICING_CONFIG.FAIR_MARKET_VALUE_MULTIPLIER);
}

/**
 * Round price based on display settings
 */
export function roundPrice(price: number): number {
  const roundTo = PRICING_CONFIG.DISPLAY.ROUND_TO_NEAREST;
  return Math.round(price / roundTo) * roundTo;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  const symbol = PRICING_CONFIG.DISPLAY.CURRENCY_SYMBOL;
  return `${symbol}${amount.toLocaleString()}`;
}
