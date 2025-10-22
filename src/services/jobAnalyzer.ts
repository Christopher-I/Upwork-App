/**
 * Job Analyzer Service
 * Analyzes job descriptions and provides pricing recommendations
 */

import { JobAnalysisInput, JobPricingRecommendation } from '../types/jobAnalyzer';
import { detectJobTags } from '../utils/tagDetection';
import { calculatePricingRecommendation } from '../utils/pricingCalculator';

/**
 * Detect project duration from description
 */
function detectDuration(description: string): string {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.match(/3.6 months|6 months/i)) return '3-6 months';
  if (lowerDesc.match(/1.3 months|3 months/i)) return '1-3 months';
  if (lowerDesc.match(/less than 1 month|under 1 month|1 month/i)) return 'Less than 1 month';
  if (lowerDesc.match(/ongoing|long.term|maintenance/i)) return 'Ongoing';

  return 'Not specified';
}

/**
 * Detect experience level from description
 */
function detectExperienceLevel(description: string): 'entry' | 'intermediate' | 'expert' {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.match(/expert|senior|advanced|lead/i)) return 'expert';
  if (lowerDesc.match(/junior|entry.level|beginner/i)) return 'entry';

  return 'intermediate';
}

/**
 * Extract metadata from job description
 */
export function extractJobMetadata(description: string) {
  return {
    tags: detectJobTags({ description }),
    duration: detectDuration(description),
    experienceLevel: detectExperienceLevel(description),
    complexity: estimateComplexity(description),
    scopeClarity: estimateScopeClarity(description),
  };
}

/**
 * Estimate job complexity on a 1-10 scale
 */
export function estimateComplexity(description: string): number {
  let score = 5; // Base complexity

  const lowerDesc = description.toLowerCase();

  // Keywords indicating higher complexity
  const complexKeywords = [
    'architecture', 'scalable', 'microservices', 'integration', 'api',
    'security', 'performance', 'optimization', 'custom', 'advanced',
    'complex', 'enterprise', 'migration', 'real-time', 'database design',
    'distributed', 'cloud', 'devops', 'ci/cd', 'testing framework'
  ];

  // Keywords indicating lower complexity
  const simpleKeywords = [
    'simple', 'basic', 'small', 'quick', 'easy', 'template',
    'modification', 'minor', 'straightforward', 'update', 'fix'
  ];

  // Count matches
  complexKeywords.forEach(keyword => {
    if (lowerDesc.includes(keyword)) score += 0.5;
  });

  simpleKeywords.forEach(keyword => {
    if (lowerDesc.includes(keyword)) score -= 0.5;
  });

  // Length also indicates complexity
  if (description.length > 1000) score += 1;
  if (description.length < 200) score -= 1;

  // Multiple technical requirements
  const techMentions = (description.match(/\b(react|vue|angular|node|python|java|aws|azure|docker)\b/gi) || []).length;
  score += Math.min(techMentions * 0.5, 2);

  // Cap between 1-10
  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Estimate how clearly the scope is defined (1-10)
 */
export function estimateScopeClarity(description: string): number {
  let score = 5;

  const lowerDesc = description.toLowerCase();

  // Well-defined scope indicators
  if (lowerDesc.match(/must have|requirements|deliverables|specifications/i)) score += 2;
  if (lowerDesc.match(/\d+\s+(pages?|features?|sections?|screens?)/i)) score += 1.5;
  if (lowerDesc.match(/wireframes?|mockups?|designs?|prototypes?/i)) score += 1;
  if (description.length > 500) score += 1; // Detailed description

  // List format indicates clarity
  if (description.match(/[-•*]\s/g)?.length && description.match(/[-•*]\s/g)!.length > 3) score += 1.5;

  // Unclear scope indicators
  if (lowerDesc.match(/flexible|open to suggestions|not sure|maybe|tbd|to be determined/i)) score -= 2;
  if (lowerDesc.match(/discuss|let's talk|we can figure out/i)) score -= 1;
  if (description.length < 200) score -= 1.5; // Brief description

  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Estimate hours required based on complexity and description
 */
export function estimateHours(description: string, complexity: number): number {
  // Base hours by complexity (10 hours per complexity point)
  let hours = complexity * 10;

  const lowerDesc = description.toLowerCase();

  // Adjust based on duration mentions
  if (lowerDesc.match(/urgent|asap|immediate|rush/i)) {
    hours *= 0.8; // Shorter timeline, fewer total hours
  }

  if (lowerDesc.match(/long.term|ongoing|maintenance|support/i)) {
    hours *= 2; // Longer engagement
  }

  // Small project indicators
  if (lowerDesc.match(/small|quick|simple|minor/i)) {
    hours *= 0.7;
  }

  // Large project indicators
  if (lowerDesc.match(/large|enterprise|complex|full.stack|end.to.end/i)) {
    hours *= 1.5;
  }

  // Specific hour mentions
  const hourMatch = description.match(/(\d+)\s*hours?/i);
  if (hourMatch) {
    const mentionedHours = parseInt(hourMatch[1]);
    if (mentionedHours > 0 && mentionedHours < 1000) {
      // Use mentioned hours if reasonable
      hours = mentionedHours;
    }
  }

  return Math.round(hours);
}

/**
 * Calculate confidence level in pricing recommendation
 */
export function calculateConfidence(
  input: JobAnalysisInput,
  metadata: { complexity: number; scopeClarity: number; tags: string[] }
): 'low' | 'medium' | 'high' {
  let score = 0;

  // Factors that increase confidence
  if (input.budgetMin && input.budgetMax) score += 2;
  if (metadata.scopeClarity >= 7) score += 2;
  if (metadata.tags.length >= 3) score += 1;
  if (input.duration) score += 1;
  if (input.description.length > 400) score += 1;

  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * Generate human-readable reasoning for pricing
 */
export function generatePricingReasoning(
  input: JobAnalysisInput,
  metadata: { complexity: number; scopeClarity: number; tags: string[]; duration: string },
  recommendation: number
): string {
  const parts: string[] = [];

  // Complexity assessment
  if (metadata.complexity >= 8) {
    parts.push('This appears to be a highly complex project requiring advanced expertise.');
  } else if (metadata.complexity >= 6) {
    parts.push('This is a moderately complex project with multiple technical requirements.');
  } else if (metadata.complexity >= 4) {
    parts.push('This is a standard complexity project.');
  } else {
    parts.push('This appears to be a relatively straightforward project.');
  }

  // Technical skills
  if (metadata.tags.length > 0) {
    const topSkills = metadata.tags.slice(0, 3).join(', ');
    parts.push(`Key technologies identified: ${topSkills}.`);
  }

  // Scope clarity
  if (metadata.scopeClarity >= 7) {
    parts.push('The scope is well-defined with clear deliverables.');
  } else if (metadata.scopeClarity < 4) {
    parts.push('The scope needs clarification - pricing may need adjustment after discussion.');
  }

  // Duration
  if (metadata.duration) {
    parts.push(`Estimated timeline: ${metadata.duration}.`);
  }

  // Final recommendation
  if (input.budgetType === 'hourly') {
    parts.push(`Based on these factors, a rate of $${recommendation}/hour is recommended.`);
  } else {
    parts.push(`Based on these factors, a fixed price of $${recommendation.toLocaleString()} is recommended.`);
  }

  return parts.join(' ');
}

/**
 * Main function: Analyze pricing for a job
 */
export function analyzePricing(input: JobAnalysisInput): JobPricingRecommendation {
  // Extract metadata from description
  const metadata = extractJobMetadata(input.description);

  // Create a pseudo-job object for the pricing calculator
  const pseudoJob = {
    id: 'analyzer-' + Date.now(),
    title: input.description.split('\n')[0].substring(0, 100),
    description: input.description,
    budgetType: input.budgetType,
    budget: input.budgetMin || 0,
    budgetMax: input.budgetMax,
    hourlyBudgetMax: input.budgetType === 'hourly' ? input.budgetMax : undefined,
    amount: input.budgetType === 'fixed' ? { rawValue: String(input.budgetMin || 0) } : undefined,
    experienceLevel: input.experienceLevel || metadata.experienceLevel || 'intermediate',
    duration: input.duration || metadata.duration,
    proposalsCount: 0,
    tags: metadata.tags,
    client: {
      name: input.clientName || 'Client',
      paymentVerified: true,
      totalSpent: 10000,
      totalHires: 5,
      location: 'United States',
    },
  } as any;

  // Use existing pricing calculator
  const pricingRec = calculatePricingRecommendation(pseudoJob);

  // Estimate hours
  const estimatedHours = estimateHours(input.description, metadata.complexity);

  // Build recommendation
  const recommendation: JobPricingRecommendation = {
    budgetType: input.budgetType,
    estimatedHours,
    confidenceLevel: calculateConfidence(input, metadata),
    factors: {
      complexity: metadata.complexity,
      scopeClarity: metadata.scopeClarity,
      technicalSkills: metadata.tags,
      estimatedDuration: metadata.duration || 'Not specified',
    },
    reasoning: '', // Will be filled below
  };

  // Set pricing based on budget type
  if (input.budgetType === 'hourly') {
    if (pricingRec.type === 'hourly') {
      recommendation.recommendedRate = pricingRec.data.recommendedRate;
      recommendation.minRate = pricingRec.data.rateRange.min;
      recommendation.maxRate = pricingRec.data.rateRange.max;
    } else {
      // Fallback defaults
      recommendation.recommendedRate = 75;
      recommendation.minRate = 60;
      recommendation.maxRate = 90;
    }
  } else {
    if (pricingRec.type === 'fixed') {
      recommendation.recommendedPrice = pricingRec.data.totalPrice;
      // For fixed price, calculate hourly equivalent
      if (estimatedHours > 0) {
        const rate = recommendation.recommendedPrice / estimatedHours;
        recommendation.minRate = Math.round(rate * 0.8);
        recommendation.maxRate = Math.round(rate * 1.2);
      }
    } else {
      // Fallback defaults
      recommendation.recommendedPrice = estimatedHours * 75;
      recommendation.minRate = 60;
      recommendation.maxRate = 90;
    }
  }

  // Generate reasoning
  recommendation.reasoning = generatePricingReasoning(
    input,
    metadata,
    recommendation.recommendedRate || recommendation.recommendedPrice || 0
  );

  return recommendation;
}
