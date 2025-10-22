import { Job, ScoreBreakdown } from '../types/job';
import { Settings } from '../types/settings';
import { scoreJobWithChatGPT } from '../lib/openai';
import { scoreJobWithClaude } from '../lib/claude';
import { AI_PROVIDER } from '../config/ai';
import { detectJobTags } from './tagDetection';
import * as detection from './jobDetection';
import * as bonuses from './scoringBonuses';

// Import recommendation filter logic from dedicated file
export { applyRecommendationFilters as applyHardFilters, checkStarCriteria } from './recommendationFilters';

/**
 * Calculate complete job score (0-100 points)
 * Uses hybrid approach: Rules for deterministic dimensions, ChatGPT for judgment-based
 */
export async function calculateJobScore(
  job: Partial<Job>,
  settings: Settings,
  useAI: boolean = true
): Promise<{ total: number; breakdown: ScoreBreakdown }> {
  let aiScores = null;

  // Try to get AI scores for 3 dimensions if enabled
  if (useAI) {
    try {
      if (AI_PROVIDER === 'claude') {
        aiScores = await scoreJobWithClaude(
          job.title || '',
          job.description || '',
          job.budget || 0,
          job.budgetType || 'negotiable',
          job.hourlyBudgetMin,
          job.hourlyBudgetMax
        );
        console.log('✅ Claude scoring successful');
      } else {
        aiScores = await scoreJobWithChatGPT(
          job.title || '',
          job.description || '',
          job.budget || 0,
          job.budgetType || 'negotiable',
          job.hourlyBudgetMin,
          job.hourlyBudgetMax
        );
        console.log('✅ ChatGPT scoring successful');
      }
    } catch (error) {
      console.warn(`⚠️ ${AI_PROVIDER === 'claude' ? 'Claude' : 'ChatGPT'} scoring failed, using rule-based fallback:`, error);
    }
  }

  const breakdown: ScoreBreakdown = {
    // Rule-based (always)
    clientQuality: scoreClientQuality(job),
    keywordsMatch: scoreKeywordsMatch(job, settings),
    professionalSignals: scoreProfessionalSignals(job),

    // AI-based with fallback
    businessImpact: aiScores?.businessImpact.score ?? scoreBusinessImpact(job),
    jobClarity: aiScores?.jobClarity.score ?? scoreJobClarity(job),
    ehrPotential: aiScores?.ehrPotential.score ?? scoreEHRPotential(job, settings),

    redFlags: scoreRedFlags(job),
  };

  // If AI scoring succeeded, store additional data
  if (aiScores) {
    (job as any).estimatedPrice = aiScores.ehrPotential.estimatedPrice;
    (job as any).estimatedHours = aiScores.ehrPotential.estimatedHours;
    (job as any).estimatedEHR = aiScores.ehrPotential.estimatedEHR;

    (job as any).jobClarity = {
      technicalMatches: aiScores.jobClarity.technicalMatches,
      clarityMatches: aiScores.jobClarity.clarityMatches,
      total: aiScores.jobClarity.totalMatches,
    };

    (job as any).detectedOutcomes = aiScores.businessImpact.detectedOutcomes;
    (job as any).isTechnicalOnly = aiScores.businessImpact.isTechnicalOnly;
  }

  // Detect and assign tags
  const tags = detectJobTags(job);
  (job as any).tags = tags;
  console.log(`🏷️  Detected ${tags.length} tags: ${tags.slice(0, 5).join(', ')}${tags.length > 5 ? '...' : ''}`);

  let total =
    breakdown.clientQuality.subtotal +
    breakdown.keywordsMatch +
    breakdown.professionalSignals.subtotal +
    breakdown.businessImpact +
    breakdown.jobClarity +
    breakdown.ehrPotential +
    breakdown.redFlags;

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFECT JOB MULTIPLIER - Boost scores for ideal job combinations
  // ═══════════════════════════════════════════════════════════════════════════
  const perfectJobResult = bonuses.calculatePerfectJobMultiplier(
    job as Job,
    !!(job as any).customAnalysis?.isCustomWork,
    !!(job as any).usBasedAnalysis?.isUSBased
  );

  if (perfectJobResult.isPerfectJob) {
    const multipliedScore = total * perfectJobResult.multiplier;
    console.log(`   🎯 PERFECT JOB MULTIPLIER: ${total} × ${perfectJobResult.multiplier} = ${multipliedScore.toFixed(1)}`);

    // Store internal score for ranking (uncapped)
    (job as any).internalScore = multipliedScore;

    // Store perfect job flag
    (job as any).isPerfectJob = true;

    // Cap display score at 100
    total = Math.min(multipliedScore, 100);
  } else {
    // Non-perfect jobs use regular score
    (job as any).internalScore = total;
    (job as any).isPerfectJob = false;
  }

  return {
    total: Math.max(0, Math.min(100, total)), // Clamp between 0-100
    breakdown,
  };
}

/**
 * Synchronous version for when AI is not available
 */
export function calculateJobScoreSync(
  job: Partial<Job>,
  settings: Settings
): { total: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    clientQuality: scoreClientQuality(job),
    keywordsMatch: scoreKeywordsMatch(job, settings),
    professionalSignals: scoreProfessionalSignals(job),
    businessImpact: scoreBusinessImpact(job),
    jobClarity: scoreJobClarity(job),
    ehrPotential: scoreEHRPotential(job, settings),
    redFlags: scoreRedFlags(job),
  };

  // Detect and assign tags
  const tags = detectJobTags(job);
  (job as any).tags = tags;

  const total =
    breakdown.clientQuality.subtotal +
    breakdown.keywordsMatch +
    breakdown.professionalSignals.subtotal +
    breakdown.businessImpact +
    breakdown.jobClarity +
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
  let score = Math.min(matchCount * 5, 15);

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIALTY BONUSES (MODULAR) - Prioritize jobs matching our core expertise
  // Ordered by earning potential: Custom Apps > US-Based > Webflow > Dashboard > Portals
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Custom Application Bonus (+12 max - YOUR #1 HIGHEST-VALUE WORK)
  const customDetection = detection.detectCustomApplication(text);
  const customBonus = bonuses.calculateCustomBonus(job, customDetection);
  if (customBonus.points > 0) {
    score = Math.min(score + customBonus.points, 15);
    matchedKeywords.push(customBonus.label);
    console.log(`   +${customBonus.points} points: ${customBonus.label} (Tier ${customBonus.tier}: ${customBonus.metadata?.tierLabel})`);

    // Store analysis for badge display
    (job as any).customAnalysis = {
      isCustomWork: true,
      ...customBonus.metadata,
      bonusAwarded: customBonus.points,
      tier: customBonus.tier,
    };
  }

  // 2. US-Based Bonus (+11 max - HUGE COMPETITIVE ADVANTAGE)
  const usBasedDetection = detection.detectUSBased(text);
  const usBasedBonus = bonuses.calculateUSBasedBonus(job, usBasedDetection);
  if (usBasedBonus.points > 0) {
    score = Math.min(score + usBasedBonus.points, 15);
    matchedKeywords.push(usBasedBonus.label);
    console.log(`   +${usBasedBonus.metadata?.baseBonus} points: US-based (Tier ${usBasedBonus.tier})`);
    console.log(`   +${usBasedBonus.metadata?.amplifierBonus} points: US-based AMPLIFIER (huge competitive advantage)`);
    if (usBasedBonus.metadata?.timeZoneMentioned) {
      console.log(`   ⏰ Time zone mentioned: ${usBasedBonus.metadata?.timeZone}`);
    }

    // Store analysis for badge display
    (job as any).usBasedAnalysis = {
      isUSBased: true,
      confidenceLevel: usBasedDetection.confidence,
      detectedPatterns: usBasedDetection.patterns,
      timeZoneMentioned: usBasedBonus.metadata?.timeZoneMentioned,
      timeZone: usBasedBonus.metadata?.timeZone,
      bonusAwarded: usBasedBonus.points,
      tier: usBasedBonus.tier,
    };
  }

  // 3. Dashboard Bonus (+7 - HIGH-VALUE CLIENTS)
  const dashboardDetection = detection.detectDashboard(text);
  const dashboardBonus = bonuses.calculateDashboardBonus(job, dashboardDetection);
  if (dashboardBonus.points > 0) {
    score = Math.min(score + dashboardBonus.points, 15);
    matchedKeywords.push(dashboardBonus.label);
    console.log(`   +${dashboardBonus.points} points: ${dashboardBonus.label}`);
  }

  // 4. Webflow Bonus (+8 - YOUR #2 SPECIALTY)
  const webflowDetection = detection.detectWebflow(text);
  const webflowBonus = bonuses.calculateWebflowBonus(job, webflowDetection);
  if (webflowBonus.points > 0) {
    score = Math.min(score + webflowBonus.points, 15);
    matchedKeywords.push(webflowBonus.label);
    console.log(`   +${webflowBonus.points} points: ${webflowBonus.label}`);
  }

  // 5. Portal Bonus (+5 - YOUR #3 SPECIALTY)
  const portalDetection = detection.detectPortal(text);
  const portalBonus = bonuses.calculatePortalBonus(job, portalDetection);
  if (portalBonus.points > 0) {
    score = Math.min(score + portalBonus.points, 15);
    matchedKeywords.push(portalBonus.label);
    console.log(`   +${portalBonus.points} points: ${portalBonus.label}`);
  }

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
 * 4. Business Impact (15 points)
 * Measures if job solves a business problem vs just being a technical task
 * Goal: Avoid "need a React developer" jobs, prefer "build X to achieve Y" jobs
 */
export function scoreBusinessImpact(job: Partial<Job>): number {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // Business outcome keywords (what impact they want)
  const businessOutcomes = {
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
      'generate',
    ],
    efficiency: [
      'save time',
      'time saved',
      'automate',
      'streamline',
      'reduce',
      'faster',
      'efficient',
      'simplify',
      'organize',
      'manage',
    ],
    growth: ['scale', 'grow', 'expand', 'increase', 'improve', 'boost', 'enhance'],
    metrics: ['track', 'tracking', 'analytics', 'reporting', 'kpi', 'metrics', 'measure'],
  };

  // Technical-only red flags (no business context)
  const technicalOnlyFlags = [
    'need developer',
    'need programmer',
    'need coder',
    'looking for developer',
    'seeking developer',
    'hire developer',
    'react developer',
    'javascript developer',
    'node developer',
    'must know',
    'experience in',
    'proficient in',
    'expert in',
    'skilled in',
  ];

  let score = 0;
  const detectedOutcomes: string[] = [];
  let hasTechnicalOnlyFlag = false;

  // Check for business outcomes
  for (const [category, keywords] of Object.entries(businessOutcomes)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 5; // 5 points per category (4 categories = up to 20)
        detectedOutcomes.push(keyword);
        break; // Only count each category once
      }
    }
  }

  // Check for business context indicators
  const businessContext = [
    'our business',
    'our company',
    'our team',
    'our clients',
    'our customers',
    'help us',
    'we need',
  ];

  const hasBusinessContext = businessContext.some(phrase => text.includes(phrase));
  if (hasBusinessContext) {
    score += 2;
    detectedOutcomes.push('business context');
  }

  // Bonus for timeline mentions (shows planning)
  if (/\b\d+\s*(week|month|day)s?\b/.test(text) || text.includes('timeline')) {
    score += 1;
    detectedOutcomes.push('timeline');
  }

  // Check for technical-only red flags
  for (const flag of technicalOnlyFlags) {
    if (text.includes(flag)) {
      hasTechnicalOnlyFlag = true;
      break;
    }
  }

  // PENALTY: If technical-only job with no business outcomes
  if (hasTechnicalOnlyFlag && detectedOutcomes.length === 0) {
    score = 0; // Zero points for pure "need a developer" posts
    detectedOutcomes.push('⚠️ technical-only (no business context)');
  }

  // Store detected outcomes
  (job as any).detectedOutcomes = detectedOutcomes;
  (job as any).isTechnicalOnly = hasTechnicalOnlyFlag && detectedOutcomes.length <= 1;

  return Math.min(score, 15); // Cap at 15
}

/**
 * 5. Job Clarity (15 points)
 * Evaluates how well-defined the job posting is
 * More boxes ticked = more professional and prepared client
 */
export function scoreJobClarity(job: Partial<Job>): number {
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

  // Look for clarity/definition signals (shows planning and preparation)
  const claritySignals = [
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
  let clarityMatches = 0;

  for (const signal of technicalSignals) {
    if (text.includes(signal)) {
      technicalMatches++;
    }
  }

  for (const signal of claritySignals) {
    if (text.includes(signal)) {
      clarityMatches++;
    }
  }

  const totalMatches = technicalMatches + clarityMatches;

  // Store job clarity info
  (job as any).jobClarity = {
    technicalMatches,
    clarityMatches,
    total: totalMatches,
  };

  // Score based on job clarity (how many boxes ticked?)
  if (totalMatches >= 6) return 15; // Very clear - client knows exactly what they want
  if (totalMatches >= 4) return 14; // Clear - well thought out
  if (totalMatches >= 3) return 13; // Good definition - decent clarity
  if (totalMatches >= 2) return 10; // Some clarity - basic idea
  if (totalMatches >= 1) return 7; // Minimal - vague request
  return 3; // Too vague - avoid
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
 * FALLBACK ONLY - Claude AI provides much more accurate market-based pricing
 *
 * These estimates align with Fair Market Value guidelines:
 * - Landing pages (1-3 pages): $1,500 - $3,000
 * - Small business websites (5-10 pages): $3,000 - $8,000
 * - E-commerce sites: $5,000 - $15,000
 * - Custom web apps/portals: $8,000 - $25,000
 * - Complex platforms with integrations: $15,000 - $50,000+
 */
function estimatePrice(job: Partial<Job>, settings: Settings): number {
  // If budget specified and reasonable, use it
  if (job.budget && job.budget >= 1000) {
    return job.budget;
  }

  // Estimate based on project complexity using market-standard values
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // Very high complexity indicators ($15K-$50K+)
  const veryHighComplexity = [
    'platform',
    'saas',
    'marketplace',
    'multi-tenant',
    'api integration',
    'payment processing',
    'authentication system',
    'real-time',
    'websocket',
    'microservices',
  ];

  // High complexity indicators ($8K-$25K)
  const highComplexity = [
    'portal',
    'dashboard',
    'custom web app',
    'crm',
    'automation',
    'integration',
    'admin panel',
    'user management',
    'database design',
  ];

  // Medium-high complexity indicators ($5K-$15K)
  const mediumHighComplexity = [
    'ecommerce',
    'shopify',
    'woocommerce',
    'multi-page',
    '10+ pages',
    'custom cms',
    'blog system',
    'search functionality',
  ];

  // Medium complexity indicators ($3K-$8K)
  const mediumComplexity = [
    'website',
    'redesign',
    '5-10 pages',
    'blog',
    'cms',
    'seo',
    'responsive',
    'contact forms',
  ];

  // Simple indicators ($1.5K-$3K)
  const simpleIndicators = [
    'landing page',
    'single page',
    'simple website',
    '1-3 pages',
    'basic site',
  ];

  let complexityScore = 0;

  // Very high complexity (add 4 points each)
  for (const indicator of veryHighComplexity) {
    if (text.includes(indicator)) complexityScore += 4;
  }

  // High complexity (add 3 points each)
  for (const indicator of highComplexity) {
    if (text.includes(indicator)) complexityScore += 3;
  }

  // Medium-high complexity (add 2 points each)
  for (const indicator of mediumHighComplexity) {
    if (text.includes(indicator)) complexityScore += 2;
  }

  // Medium complexity (add 1 point each)
  for (const indicator of mediumComplexity) {
    if (text.includes(indicator)) complexityScore += 1;
  }

  // Simple indicators (subtract 1 point)
  for (const indicator of simpleIndicators) {
    if (text.includes(indicator)) complexityScore -= 1;
  }

  // Estimate price based on complexity score using market-standard values
  if (complexityScore >= 12) return 35000; // Complex platform ($35K)
  if (complexityScore >= 8) return 20000;  // Custom web app ($20K)
  if (complexityScore >= 5) return 12000;  // E-commerce or advanced site ($12K)
  if (complexityScore >= 3) return 8000;   // Multi-page with features ($8K)
  if (complexityScore >= 1) return 5000;   // Small business website ($5K)
  if (complexityScore >= 0) return 3000;   // Basic website ($3K)
  return 2000; // Simple landing page ($2K)
}

/**
 * Helper: Estimate project hours based on complexity
 * FALLBACK ONLY - Claude AI provides much more accurate hour estimation
 *
 * These estimates align with market-standard hour guidelines:
 * - Landing pages: 15-25 hours
 * - Small business websites: 30-60 hours
 * - E-commerce sites: 60-120 hours
 * - Custom web apps: 80-200 hours
 * - Complex platforms: 200-400+ hours
 */
function estimateHours(job: Partial<Job>, settings: Settings): number {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

  // Very high complexity indicators (200-400+ hours)
  const veryHighComplexity = [
    'platform',
    'saas',
    'marketplace',
    'multi-tenant',
    'api integration',
    'payment processing',
    'authentication system',
    'real-time',
    'websocket',
    'microservices',
  ];

  // High complexity indicators (80-200 hours)
  const highComplexity = [
    'portal',
    'dashboard',
    'custom web app',
    'crm',
    'automation',
    'integration',
    'admin panel',
    'user management',
    'database design',
  ];

  // Medium-high complexity indicators (60-120 hours)
  const mediumHighComplexity = [
    'ecommerce',
    'shopify',
    'woocommerce',
    'multi-page',
    '10+ pages',
    'custom cms',
    'blog system',
    'search functionality',
  ];

  // Medium complexity indicators (30-60 hours)
  const mediumComplexity = [
    'website',
    'redesign',
    '5-10 pages',
    'blog',
    'cms',
    'seo',
    'responsive',
    'contact forms',
  ];

  // Simple indicators (15-25 hours)
  const simpleIndicators = [
    'landing page',
    'single page',
    'simple website',
    '1-3 pages',
    'basic site',
  ];

  let complexityScore = 0;

  // Very high complexity (add 4 points each)
  for (const indicator of veryHighComplexity) {
    if (text.includes(indicator)) complexityScore += 4;
  }

  // High complexity (add 3 points each)
  for (const indicator of highComplexity) {
    if (text.includes(indicator)) complexityScore += 3;
  }

  // Medium-high complexity (add 2 points each)
  for (const indicator of mediumHighComplexity) {
    if (text.includes(indicator)) complexityScore += 2;
  }

  // Medium complexity (add 1 point each)
  for (const indicator of mediumComplexity) {
    if (text.includes(indicator)) complexityScore += 1;
  }

  // Simple indicators (subtract 1 point)
  for (const indicator of simpleIndicators) {
    if (text.includes(indicator)) complexityScore -= 1;
  }

  // Estimate hours based on complexity score using market-standard values
  if (complexityScore >= 12) return 300; // Complex platform (300+ hours)
  if (complexityScore >= 8) return 150;  // Custom web app (150 hours)
  if (complexityScore >= 5) return 90;   // E-commerce or advanced site (90 hours)
  if (complexityScore >= 3) return 60;   // Multi-page with features (60 hours)
  if (complexityScore >= 1) return 45;   // Small business website (45 hours)
  if (complexityScore >= 0) return 30;   // Basic website (30 hours)
  return 20; // Simple landing page (20 hours)
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
 * ═══════════════════════════════════════════════════════════════════════════
 * RECOMMENDATION FILTERS MOVED TO: src/utils/recommendationFilters.ts
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The applyHardFilters function has been moved to a dedicated file for
 * easier maintenance and discovery.
 *
 * It is re-exported at the top of this file for backward compatibility.
 *
 * See: src/utils/recommendationFilters.ts for the full implementation
 * ═══════════════════════════════════════════════════════════════════════════
 */
