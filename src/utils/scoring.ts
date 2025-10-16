import { Job, ScoreBreakdown } from '../types/job';
import { Settings } from '../types/settings';

/**
 * Calculate complete job score (0-100 points)
 */
export function calculateJobScore(
  job: Partial<Job>,
  settings: Settings
): { total: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    clientQuality: scoreClientQuality(job),
    keywordsMatch: scoreKeywordsMatch(job, settings),
    professionalSignals: scoreProfessionalSignals(job),
    outcomeClarity: scoreOutcomeClarity(job),
    scopeFit: scoreScopeFit(job),
    ehrPotential: scoreEHRPotential(job, settings),
    redFlags: scoreRedFlags(job),
  };

  const total =
    breakdown.clientQuality.subtotal +
    breakdown.keywordsMatch +
    breakdown.professionalSignals.subtotal +
    breakdown.outcomeClarity +
    breakdown.scopeFit +
    breakdown.ehrPotential +
    breakdown.redFlags;

  return {
    total: Math.max(0, Math.min(100, total)), // Clamp between 0-100
    breakdown,
  };
}

/**
 * 1. Client Quality (25 points)
 * Payment verification is most important, history is a bonus
 */
export function scoreClientQuality(job: Partial<Job>) {
  let paymentVerified = 0;
  let spendHistory = 0;
  let recencyAndCompetition = 0;

  // Payment verified (15 points) - MOST IMPORTANT
  if (job.client?.paymentVerified) {
    paymentVerified = 15;
  }

  // Spend/hire history (5 points) - Nice to have, but new clients can be great
  const totalSpent = job.client?.totalSpent || 0;
  const totalHires = job.client?.totalHires || 0;

  if (totalSpent >= 10000 && totalHires >= 10) {
    spendHistory = 5; // Premium client - bonus!
  } else if (totalSpent >= 5000 || totalHires >= 5) {
    spendHistory = 4; // Good history
  } else if (totalSpent >= 1000 || totalHires >= 2) {
    spendHistory = 3; // Some history
  } else if (totalSpent > 0 || totalHires > 0) {
    spendHistory = 2; // First few hires
  } else {
    spendHistory = 1; // New client - still worth pursuing if payment verified!
  }

  // Recency & competition (5 points)
  const hoursOld = job.postedAt
    ? (Date.now() - job.postedAt.getTime()) / (1000 * 60 * 60)
    : 999;
  const proposalsCount = job.proposalsCount || 999;

  if (hoursOld <= 24 && proposalsCount < 5) {
    recencyAndCompetition = 5; // Fresh, low competition
  } else if (hoursOld <= 48 && proposalsCount < 10) {
    recencyAndCompetition = 3; // Still good
  }

  return {
    paymentVerified,
    spendHistory,
    recencyAndCompetition,
    subtotal: paymentVerified + spendHistory + recencyAndCompetition,
  };
}

/**
 * 2. Keywords Match (15 points)
 * Proportional scoring: 5 points per keyword, max at 3+ keywords
 */
export function scoreKeywordsMatch(
  job: Partial<Job>,
  settings: Settings
): number {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  const allKeywords = [
    ...settings.keywords.wideNet,
    ...settings.keywords.webflow,
    ...settings.keywords.portals,
    ...settings.keywords.ecommerce,
    ...settings.keywords.speedSEO,
    ...settings.keywords.automation,
    ...settings.keywords.vertical,
  ];

  let matchCount = 0;
  const matchedKeywords: string[] = [];

  for (const keyword of allKeywords) {
    const keywordLower = keyword.toLowerCase();
    // Check for exact phrase match
    if (text.includes(keywordLower)) {
      matchCount++;
      matchedKeywords.push(keyword);
    } else {
      // For multi-word phrases, check if all individual words are present
      const words = keywordLower.split(' ');
      if (words.length > 1) {
        const allWordsPresent = words.every(word => text.includes(word));
        if (allWordsPresent) {
          matchCount += 0.5; // Half credit for partial match
          matchedKeywords.push(keyword + ' (partial)');
        }
      }
    }
  }

  // Store matched keywords
  (job as any).matchedKeywords = matchedKeywords;

  // Proportional scoring: 5 points per keyword, max 15 points at 3 keywords
  // 1 keyword = 5 points (33%)
  // 2 keywords = 10 points (67%)
  // 3+ keywords = 15 points (100%)
  const score = Math.min(matchCount * 5, 15);
  return Math.round(score);
}

/**
 * 3. Professional Signals (10 points)
 */
export function scoreProfessionalSignals(job: Partial<Job>) {
  let openBudget = 0;
  let weLanguage = 0;

  // Open budget (5 points)
  if (!job.budget || job.budget === 0 || job.budgetType === 'negotiable') {
    openBudget = 5; // No budget specified = confidence
  } else if (job.budget < 500 && (job.description?.length || 0) > 200) {
    openBudget = 3; // Likely placeholder budget
    (job as any).budgetIsPlaceholder = true;
  }

  // "We" language (5 points)
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  const weCount = (text.match(/\bwe\b/g) || []).length;
  const ourCount = (text.match(/\bour\b/g) || []).length;
  const usCount = (text.match(/\bus\b/g) || []).length;
  const teamMentions = weCount + ourCount + usCount;

  const iCount = (text.match(/\bi\b/g) || []).length;
  const myCount = (text.match(/\bmy\b/g) || []).length;
  const meMentions = iCount + myCount;

  const companyKeywords = [
    'company',
    'team',
    'organization',
    'business',
    'startup',
    'agency',
    'firm',
    'clients',
    'customers',
  ];
  const hasCompanyKeywords = companyKeywords.some((kw) => text.includes(kw));
  const companyKeywordsFound = companyKeywords.filter((kw) =>
    text.includes(kw)
  );

  // Store language analysis
  (job as any).languageAnalysis = {
    weCount,
    ourCount,
    usCount,
    teamMentions,
    iCount,
    myCount,
    meMentions,
    hasCompanyKeywords,
    companyKeywordsFound,
    isProfessional: teamMentions > meMentions && teamMentions >= 2,
  };

  // Score language
  if (teamMentions >= 3 && meMentions === 0) {
    weLanguage = 5; // Strong team signal
  } else if (teamMentions >= 2 && hasCompanyKeywords) {
    weLanguage = 5; // Team + company context
  } else if (teamMentions > meMentions && teamMentions >= 2) {
    weLanguage = 3; // More "we" than "I"
  } else if (hasCompanyKeywords && meMentions <= 1) {
    weLanguage = 2; // Company mentions
  }

  return {
    openBudget,
    weLanguage,
    subtotal: openBudget + weLanguage,
  };
}

/**
 * 4. Outcome Clarity (15 points)
 */
export function scoreOutcomeClarity(job: Partial<Job>): number {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  const outcomeKeywords = {
    revenue: [
      'leads',
      'lead capture',
      'lead generation',
      'sales',
      'revenue',
      'customers',
      'conversions',
      'conversion rate',
      'bookings',
      'clients',
    ],
    efficiency: ['time saved', 'automate', 'streamline', 'reduce', 'faster', 'communications', 'communicate'],
    growth: ['scale', 'grow', 'expand', 'increase', 'improve'],
    metrics: ['tracking', 'analytics', 'reporting', 'kpi', 'metrics'],
  };

  let score = 0;
  const detectedOutcomes: string[] = [];

  for (const [category, keywords] of Object.entries(outcomeKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 5; // 5 points per category (4 categories = up to 20)
        detectedOutcomes.push(keyword);
        break; // Only count each category once
      }
    }
  }

  // Bonus for timeline mentions
  if (/\b\d+\s*(week|month|day)s?\b/.test(text) || text.includes('timeline') || text.includes('flexible')) {
    score += 2;
    detectedOutcomes.push('timeline mentioned');
  }

  // Store detected outcomes
  (job as any).detectedOutcomes = detectedOutcomes;

  return Math.min(score, 15); // Cap at 15
}

/**
 * 5. Scope Fit (15 points)
 * Evaluates if the project scope is well-defined and matches your skills
 */
export function scoreScopeFit(job: Partial<Job>): number {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // Look for specific technical requirements (indicates clarity)
  const technicalSignals = [
    'webflow',
    'shopify',
    'zapier',
    'make',
    'portal',
    'dashboard',
    'landing page',
    'website',
    'page speed',
    'seo',
    'cms',
    'blog',
    'ecommerce',
    'booking',
    'scheduling',
    'integration',
    'automation',
    'optimization',
  ];

  // Look for scope definition signals
  const scopeDefinitionSignals = [
    'pages', // e.g., "5 pages", "8-10 pages"
    'sections',
    'features',
    'timeline',
    'weeks',
    'month',
    'requirements',
    'specifications',
    'deliverables',
    'forms',
    'responsive',
    'mobile',
    'clean',
    'modern',
    'professional',
  ];

  let technicalMatches = 0;
  let scopeMatches = 0;

  for (const signal of technicalSignals) {
    if (text.includes(signal)) {
      technicalMatches++;
    }
  }

  for (const signal of scopeDefinitionSignals) {
    if (text.includes(signal)) {
      scopeMatches++;
    }
  }

  const totalMatches = technicalMatches + scopeMatches;

  // Store scope clarity info
  (job as any).scopeClarity = {
    technicalMatches,
    scopeMatches,
    total: totalMatches,
  };

  // Score based on scope clarity (more generous)
  if (totalMatches >= 6) return 15; // Very clear scope
  if (totalMatches >= 4) return 14; // Clear scope
  if (totalMatches >= 3) return 13; // Good scope definition
  if (totalMatches >= 2) return 10; // Some clarity
  if (totalMatches >= 1) return 7; // Minimal definition
  return 3; // Vague request
}

/**
 * 6. EHR Potential (15 points)
 */
export function scoreEHRPotential(
  job: Partial<Job>,
  settings: Settings
): number {
  const estimatedHours = estimateHours(job, settings);
  const estimatedPrice = estimatePrice(job, settings);
  const estimatedEHR = estimatedPrice / estimatedHours;

  // Store estimates
  (job as any).estimatedHours = estimatedHours;
  (job as any).estimatedPrice = estimatedPrice;
  (job as any).estimatedEHR = estimatedEHR;

  // Score based on EHR
  if (estimatedEHR >= 120) return 15;
  if (estimatedEHR >= 100) return 13;
  if (estimatedEHR >= 80) return 10;
  if (estimatedEHR >= 70) return 7;
  if (estimatedEHR >= 50) return 3;
  return 0;
}

/**
 * Helper: Estimate project price based on complexity indicators
 */
function estimatePrice(job: Partial<Job>, settings: Settings): number {
  // If budget specified and reasonable, use it
  if (job.budget && job.budget >= 1000) {
    return job.budget;
  }

  // Estimate based on project complexity (not specific packages)
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // High complexity indicators
  const highComplexity = [
    'portal',
    'dashboard',
    'ecommerce',
    'multiple',
    'complex',
    'custom',
    'integration',
    'automation',
  ];

  // Medium complexity indicators
  const mediumComplexity = [
    'website',
    'redesign',
    'pages',
    'blog',
    'cms',
    'seo',
  ];

  // Simple indicators
  const simpleIndicators = [
    'landing page',
    'single page',
    'simple',
  ];

  let complexityScore = 0;

  for (const indicator of highComplexity) {
    if (text.includes(indicator)) complexityScore += 2;
  }

  for (const indicator of mediumComplexity) {
    if (text.includes(indicator)) complexityScore += 1;
  }

  for (const indicator of simpleIndicators) {
    if (text.includes(indicator)) complexityScore -= 1;
  }

  // Estimate price based on complexity
  if (complexityScore >= 4) return 4000; // High complexity
  if (complexityScore >= 2) return 3000; // Medium-high
  if (complexityScore >= 0) return 2500; // Medium
  return 2000; // Simple project
}

/**
 * Helper: Estimate project hours based on complexity
 */
function estimateHours(job: Partial<Job>, settings: Settings): number {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // High complexity projects
  const highComplexity = [
    'portal',
    'dashboard',
    'ecommerce',
    'multiple',
    'complex',
    'custom',
    'integration',
    'automation',
  ];

  // Medium complexity
  const mediumComplexity = [
    'website',
    'redesign',
    'pages',
    'blog',
    'cms',
  ];

  // Simple projects
  const simpleIndicators = [
    'landing page',
    'single page',
    'simple',
  ];

  let complexityScore = 0;

  for (const indicator of highComplexity) {
    if (text.includes(indicator)) complexityScore += 2;
  }

  for (const indicator of mediumComplexity) {
    if (text.includes(indicator)) complexityScore += 1;
  }

  for (const indicator of simpleIndicators) {
    if (text.includes(indicator)) complexityScore -= 1;
  }

  // Estimate hours based on complexity
  if (complexityScore >= 4) return 45; // High complexity
  if (complexityScore >= 2) return 35; // Medium-high
  if (complexityScore >= 0) return 30; // Medium
  return 20; // Simple project
}

/**
 * 7. Red Flags (-10 points)
 */
export function scoreRedFlags(job: Partial<Job>): number {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  const redFlags = {
    budget: ['cheap', 'low budget', 'tight budget', 'limited budget'],
    urgency: [' asap', 'urgent', ' quick ', 'immediately', 'right now'],
    commodity: ['bug fix', 'quick fix', 'small change', 'simple edit'],
    platform: ['wordpress', 'wix', 'squarespace', 'elementor'],
    scope: ['ongoing', 'long term', 'hourly only'],
  };

  let penalty = 0;
  const detectedFlags: string[] = [];

  for (const [category, flags] of Object.entries(redFlags)) {
    for (const flag of flags) {
      if (text.includes(flag)) {
        penalty -= 2; // -2 per red flag
        detectedFlags.push(flag.trim());
      }
    }
  }

  // Store detected flags for debugging
  (job as any).detectedRedFlags = detectedFlags;

  return Math.max(penalty, -10); // Cap at -10
}

/**
 * Apply hard filters after scoring
 */
export function applyHardFilters(
  job: Partial<Job> & { score: number; estimatedEHR: number },
  settings: Settings
): 'recommended' | 'not_recommended' {
  // Must pass ALL hard filters
  const passes =
    job.score >= settings.minScore &&
    job.estimatedEHR >= settings.minEHR &&
    job.client?.paymentVerified === true &&
    !job.isDuplicate &&
    !job.isRepost;

  return passes ? 'recommended' : 'not_recommended';
}
