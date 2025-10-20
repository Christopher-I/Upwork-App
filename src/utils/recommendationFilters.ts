import { Job, ScoreBreakdown } from '../types/job';
import { Settings } from '../types/settings';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RECOMMENDATION FILTERS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file contains ALL logic for determining which jobs appear in the
 * "Recommended" tab.
 *
 * Jobs can be recommended through 3 pathways:
 *
 * 1. STAR CRITERIA (ALL 4 must be true)
 *    ✓ No price set (open budget)
 *    ✓ Uses "we" language instead of "I"
 *    ✓ Market rate ≥ $5,000
 *    ✓ Client rating not terrible (≥4 stars OR new client)
 *
 * 2. EXCEPTIONAL JOB QUALITY (Bypass payment verification only)
 *    ✓ Perfect job clarity (15/15) AND
 *    ✓ High EHR potential (13+/15) AND
 *    ✓ Professional team language (5/5) AND
 *    ✓ Score ≥ 60 AND
 *    ✓ EHR ≥ minimum threshold AND
 *    ✓ Not duplicate/repost
 *    NOTE: Payment verification NOT required - exceptional metrics prove legitimacy
 *
 * 3. NORMAL FILTERS (ALL must pass)
 *    ✓ Score ≥ minimum threshold
 *    ✓ EHR ≥ minimum threshold
 *    ✓ Payment verified
 *    ✓ Not a duplicate
 *    ✓ Not a repost
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Apply recommendation filters to determine if job should be recommended
 *
 * @param job - Job with score and estimatedEHR calculated
 * @param settings - User settings with minScore and minEHR thresholds
 * @returns 'recommended' or 'not_recommended'
 */
export function applyRecommendationFilters(
  job: Partial<Job> & { score: number; estimatedEHR: number; scoreBreakdown?: ScoreBreakdown },
  settings: Settings
): 'recommended' | 'not_recommended' {

  // ═══════════════════════════════════════════════════════════════════════════
  // HARD EXCLUSIONS (ALWAYS REJECT, NO EXCEPTIONS)
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. NON-DEVELOPMENT JOBS
  // These are fundamentally not development jobs - lead gen, marketing, sales, recruiting
  const nonDevCheck = checkNonDevelopmentJob(job);
  if (nonDevCheck.isNonDevJob) {
    console.log(`🚫 [NON-DEV JOB] Rejecting (no exceptions): ${job.title}`);
    console.log(`   - Found pattern: ${nonDevCheck.foundPattern}`);
    return 'not_recommended';
  }

  // 2. EXCLUDED PLATFORMS
  // We don't work with these platforms (Shopify, Bubble, GHL, etc.)
  const excludedPlatforms = checkExcludedPlatforms(job);
  if (excludedPlatforms.hasExcludedPlatform) {
    console.log(`🚫 [EXCLUDED PLATFORM] Rejecting (no exceptions): ${job.title}`);
    console.log(`   - Found platform: ${excludedPlatforms.foundPlatform}`);
    return 'not_recommended';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATHWAY 1: STAR CRITERIA (ALL 4 MUST BE TRUE)
  // ═══════════════════════════════════════════════════════════════════════════
  // These are the "sweet spot" jobs - professional clients with serious budgets
  // who are ready to invest in quality work

  // Criterion 1: No price set (open budget) - signals confidence/trust
  const hasOpenBudget = (job.scoreBreakdown?.professionalSignals?.openBudget || 0) > 0;

  // Criterion 2: Uses "we" language - signals company/team vs individual
  const hasTeamLanguage = (job.scoreBreakdown?.professionalSignals?.weLanguage || 0) > 0;

  // Criterion 3: Market rate ≥ $5,000 - ensures meaningful revenue potential
  const hasHighMarketRate = (job.estimatedPrice || 0) >= 5000;

  // Criterion 4: Client rating not terrible - ≥4 stars OR new client with no reviews
  const clientRating = job.client?.rating || 0;
  const clientNotTerrible = clientRating === 0 || clientRating >= 4;

  const hasStarCriteria = hasOpenBudget && hasTeamLanguage && hasHighMarketRate && clientNotTerrible;

  if (hasStarCriteria) {
    console.log(`⭐ [STAR CRITERIA] Auto-recommending: ${job.title}`);
    console.log(`   - Open budget: ${hasOpenBudget ? '✓' : '✗'}`);
    console.log(`   - Team language: ${hasTeamLanguage ? '✓' : '✗'}`);
    console.log(`   - Market rate ≥ $5K: ${hasHighMarketRate ? '✓' : '✗'} ($${job.estimatedPrice?.toLocaleString()})`);
    console.log(`   - Client rating OK: ${clientNotTerrible ? '✓' : '✗'} (${clientRating || 'new client'})`);
    return 'recommended';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATHWAY 2: EXCEPTIONAL JOB QUALITY (Bypass payment verification only)
  // ═══════════════════════════════════════════════════════════════════════════
  // For jobs with perfect metrics that prove legitimacy even without payment verification
  //
  // These jobs are so well-defined and professional that they're clearly legitimate,
  // even if the client hasn't verified payment yet (often because they're new to Upwork)

  const hasExceptionalClarity = (job.scoreBreakdown?.jobClarity || 0) === 15;
  const hasHighEHRScore = (job.scoreBreakdown?.ehrPotential || 0) >= 13;
  const hasProfessionalLanguage = (job.scoreBreakdown?.professionalSignals?.weLanguage || 0) === 5;
  const hasMinimumScore = job.score >= 60; // Lower than normal 80, but still substantial
  const meetsEHRThreshold = job.estimatedEHR >= settings.minEHR;
  const notDuplicateOrRepost = !job.isDuplicate && !job.isRepost;

  const hasExceptionalQuality =
    hasExceptionalClarity &&
    hasHighEHRScore &&
    hasProfessionalLanguage &&
    hasMinimumScore &&
    meetsEHRThreshold &&
    notDuplicateOrRepost;

  if (hasExceptionalQuality) {
    console.log(`✨ [EXCEPTIONAL QUALITY] Auto-recommending (bypassing payment verification): ${job.title}`);
    console.log(`   - Job Clarity: 15/15 ✓ (perfect)`);
    console.log(`   - EHR Potential: ${job.scoreBreakdown?.ehrPotential}/15 ✓ (high)`);
    console.log(`   - Team Language: 5/5 ✓ (professional)`);
    console.log(`   - Score: ${job.score}/100 ✓ (≥60)`);
    console.log(`   - EHR: $${job.estimatedEHR}/hr ✓ (≥$${settings.minEHR})`);
    console.log(`   - Not duplicate/repost: ✓`);
    console.log(`   - Payment verified: ${job.client?.paymentVerified ? '✓' : '✗ (bypassed)'}`);
    return 'recommended';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATHWAY 3: NORMAL FILTERS (ALL MUST PASS)
  // ═══════════════════════════════════════════════════════════════════════════
  // If job doesn't meet Star Criteria or Exceptional Quality, it must pass ALL standard filters

  const passes =
    job.score >= settings.minScore &&
    job.estimatedEHR >= settings.minEHR &&
    job.client?.paymentVerified === true &&
    !job.isDuplicate &&
    !job.isRepost;

  if (passes) {
    console.log(`✓ [NORMAL FILTERS] Recommending: ${job.title}`);
    console.log(`   - Score: ${job.score}/${settings.minScore}`);
    console.log(`   - EHR: $${job.estimatedEHR}/$${settings.minEHR}`);
    return 'recommended';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOT RECOMMENDED
  // ═══════════════════════════════════════════════════════════════════════════

  console.log(`✗ [NOT RECOMMENDED] Rejecting: ${job.title}`);
  console.log(`   - Score: ${job.score}/${settings.minScore} ${job.score >= settings.minScore ? '✓' : '✗'}`);
  console.log(`   - EHR: $${job.estimatedEHR}/$${settings.minEHR} ${job.estimatedEHR >= settings.minEHR ? '✓' : '✗'}`);
  console.log(`   - Payment verified: ${job.client?.paymentVerified ? '✓' : '✗'}`);
  console.log(`   - Not duplicate: ${!job.isDuplicate ? '✓' : '✗'}`);
  console.log(`   - Not repost: ${!job.isRepost ? '✓' : '✗'}`);

  return 'not_recommended';
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIGURATION CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Adjust these thresholds to tune the recommendation algorithm:
 */

export const RECOMMENDATION_THRESHOLDS = {
  // Star Criteria
  STAR_CRITERIA_MIN_MARKET_RATE: 5000, // $5,000+
  STAR_CRITERIA_MIN_CLIENT_RATING: 4.0, // 4 stars or higher

  // These are calculated in scoring.ts but documented here for reference:
  // - hasOpenBudget: Checks professionalSignals.openBudget score > 0
  // - hasTeamLanguage: Checks professionalSignals.weLanguage score > 0
};

/**
 * Helper function to check if job meets "Star Criteria"
 * Useful for debugging and analytics
 */
export function checkStarCriteria(job: Partial<Job> & { scoreBreakdown?: ScoreBreakdown }): {
  meetsStarCriteria: boolean;
  criteria: {
    hasOpenBudget: boolean;
    hasTeamLanguage: boolean;
    hasHighMarketRate: boolean;
    clientNotTerrible: boolean;
  };
} {
  const hasOpenBudget = (job.scoreBreakdown?.professionalSignals?.openBudget || 0) > 0;
  const hasTeamLanguage = (job.scoreBreakdown?.professionalSignals?.weLanguage || 0) > 0;
  const hasHighMarketRate = (job.estimatedPrice || 0) >= RECOMMENDATION_THRESHOLDS.STAR_CRITERIA_MIN_MARKET_RATE;
  const clientRating = job.client?.rating || 0;
  const clientNotTerrible = clientRating === 0 || clientRating >= RECOMMENDATION_THRESHOLDS.STAR_CRITERIA_MIN_CLIENT_RATING;

  return {
    meetsStarCriteria: hasOpenBudget && hasTeamLanguage && hasHighMarketRate && clientNotTerrible,
    criteria: {
      hasOpenBudget,
      hasTeamLanguage,
      hasHighMarketRate,
      clientNotTerrible,
    },
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXCLUDED PLATFORMS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * These platforms are automatically excluded from recommendations because
 * they don't align with our tech stack or service offerings.
 *
 * Add new platforms here as needed.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const EXCLUDED_PLATFORMS = [
  // Go High Level (CRM/Marketing automation platform)
  'go high level',
  'gohighlevel',
  'go highlevel',
  'ghl', // Word boundary checking prevents matching "highlights"

  // Shopify (E-commerce platform)
  'shopify',
  'shopify plus',
  'shopify store',

  // Bubble.io (No-code platform)
  'bubble.io',
  'bubble io',
  'bubble app',
  'bubble',
];

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NON-DEVELOPMENT JOB PATTERNS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * These keywords indicate non-development jobs (marketing, lead gen, sales, etc.)
 * that should be excluded from recommendations.
 *
 * We focus on web/mobile development work only.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const NON_DEV_JOB_PATTERNS = [
  // Marketing & Lead Generation SERVICES (not development)
  'lead generation team',
  'lead generation agency',
  'lead gen team',
  'lead gen agency',
  'linkedin outreach',
  'email outreach',
  'cold email',
  'cold outreach',
  'email campaign management',
  'run marketing campaigns',
  'marketing agency',
  'social media marketing',
  'social media manager',

  // Sales SERVICES (not development)
  'sales development',
  'business development representative',
  'appointment setting',
  'cold calling',
  'outbound sales team',
  'sales team',

  // Recruiting & HR
  'recruiting',
  'recruitment',
  'headhunter',
  'talent acquisition',
  'hr services',

  // IT Outstaffing/Outsourcing (not actual dev work)
  'outstaffing',
  'staff augmentation',
  'it outsourcing',
  'offshore development team', // Looking to hire team, not build product

  // Writing & Content
  'content writing',
  'copywriting',
  'blog writing',
  'article writing',
  'technical writing only', // "only" indicates no dev work
];

/**
 * Check if job mentions any excluded platforms
 *
 * @param job - Job to check
 * @returns Object with hasExcludedPlatform flag and foundPlatform name
 */
export function checkExcludedPlatforms(job: Partial<Job>): {
  hasExcludedPlatform: boolean;
  foundPlatform: string | null;
} {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // Helper function to check if a keyword exists as a standalone word (with word boundaries)
  const hasStandaloneWord = (text: string, keyword: string): boolean => {
    // For multi-word phrases, use includes
    if (keyword.includes(' ')) {
      return text.includes(keyword);
    }

    // For single words, use word boundary regex to avoid matching within words
    // e.g., 'ghl' should match "ghl" or "GHL" but NOT "highlights"
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(text);
  };

  // Special case: If job mentions BOTH GHL AND Webflow, allow it
  // (e.g., "migrate from GHL to Webflow")
  const hasGHL = hasStandaloneWord(text, 'ghl') ||
                 text.includes('go high level') ||
                 text.includes('gohighlevel');
  const hasWebflow = text.includes('webflow');

  if (hasGHL && hasWebflow) {
    console.log(`✅ [GHL+WEBFLOW] Allowing job with both platforms: ${job.title}`);
    // Skip GHL exclusion check - continue checking other platforms
    for (const platform of EXCLUDED_PLATFORMS) {
      const platformLower = platform.toLowerCase();
      // Skip GHL-related checks
      if (platformLower.includes('ghl') || platformLower.includes('go high level')) {
        continue;
      }

      if (hasStandaloneWord(text, platformLower)) {
        return {
          hasExcludedPlatform: true,
          foundPlatform: platform,
        };
      }
    }
    return {
      hasExcludedPlatform: false,
      foundPlatform: null,
    };
  }

  // Normal platform exclusion check
  for (const platform of EXCLUDED_PLATFORMS) {
    const platformLower = platform.toLowerCase();

    if (hasStandaloneWord(text, platformLower)) {
      return {
        hasExcludedPlatform: true,
        foundPlatform: platform,
      };
    }
  }

  return {
    hasExcludedPlatform: false,
    foundPlatform: null,
  };
}

/**
 * Check if job is a non-development job (marketing, sales, recruiting, etc.)
 *
 * @param job - Job to check
 * @returns Object with isNonDevJob flag and foundPattern
 */
export function checkNonDevelopmentJob(job: Partial<Job>): {
  isNonDevJob: boolean;
  foundPattern: string | null;
} {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // Check for non-dev patterns
  for (const pattern of NON_DEV_JOB_PATTERNS) {
    if (text.includes(pattern.toLowerCase())) {
      return {
        isNonDevJob: true,
        foundPattern: pattern,
      };
    }
  }

  return {
    isNonDevJob: false,
    foundPattern: null,
  };
}
