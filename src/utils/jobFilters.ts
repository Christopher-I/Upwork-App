import { Job } from '../types/job';
import { FilterOptions } from '../components/JobFilters';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB FILTERING UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pure functions for filtering and sorting job lists.
 * Extracted from Dashboard component for better organization and testability.
 *
 * Main functions:
 * - filterByCountry()        - Filter jobs by client country
 * - excludeHiredJobs()       - Remove jobs with filled positions
 * - applyJobFilters()        - Apply all filter criteria
 * - sortJobs()               - Sort jobs by various criteria
 * - filterAndSortJobs()      - Complete pipeline (main entry point)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Filter jobs by client country
 *
 * @param jobs - Array of jobs to filter
 * @param country - Country filter ('us_only' or 'all')
 * @returns Filtered jobs array
 */
export function filterByCountry(
  jobs: Job[],
  country: 'us_only' | 'all'
): Job[] {
  if (country !== 'us_only') {
    return jobs;
  }

  return jobs.filter((job) => {
    const location = job.client?.location;
    // Handle both string format and object format
    const countryValue =
      typeof location === 'string' ? location : (location as any)?.country;
    return (
      countryValue === 'United States' ||
      countryValue === 'US' ||
      countryValue === 'USA'
    );
  });
}

/**
 * Exclude jobs where all positions have been filled
 *
 * @param jobs - Array of jobs to filter
 * @returns Jobs with available positions
 */
export function excludeHiredJobs(jobs: Job[]): Job[] {
  return jobs.filter((job) => {
    // If job has hiring info, check if positions are still available
    if (
      job.freelancersToHire !== undefined &&
      job.totalFreelancersToHire !== undefined
    ) {
      const freelancersToHire = job.freelancersToHire || 0;
      const totalFreelancersToHire = job.totalFreelancersToHire || 1;

      // If all positions filled (freelancersToHire = 0 and totalFreelancersToHire > 0), exclude
      if (totalFreelancersToHire > 0 && freelancersToHire === 0) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Apply all filter criteria to jobs array
 *
 * @param jobs - Array of jobs to filter
 * @param filters - Filter options from JobFilters component
 * @returns Filtered jobs array
 */
export function applyJobFilters(jobs: Job[], filters: FilterOptions): Job[] {
  let filtered = [...jobs];

  // Budget type filter
  if (filters.budgetType !== 'all') {
    if (filters.budgetType === 'open') {
      // Open budget means no price set (budget = 0 or budgetIsPlaceholder = true)
      filtered = filtered.filter(
        (job) => job.budget === 0 || job.budgetIsPlaceholder === true
      );
    } else {
      filtered = filtered.filter((job) => job.budgetType === filters.budgetType);
    }
  }

  // Budget range filter
  if (filters.minBudget > 0) {
    filtered = filtered.filter((job) => job.budget >= filters.minBudget);
  }
  if (filters.maxBudget > 0) {
    filtered = filtered.filter((job) => job.budget <= filters.maxBudget);
  }

  // Proposals range filter
  if (filters.minProposals > 0) {
    filtered = filtered.filter(
      (job) => job.proposalsCount >= filters.minProposals
    );
  }
  if (filters.maxProposals > 0) {
    filtered = filtered.filter(
      (job) => job.proposalsCount <= filters.maxProposals
    );
  }

  // Fair Market Value range filter
  if (filters.minMarketRate > 0) {
    filtered = filtered.filter(
      (job) => (job.estimatedPrice || 0) >= filters.minMarketRate
    );
  }
  if (filters.maxMarketRate > 0) {
    filtered = filtered.filter(
      (job) => (job.estimatedPrice || 0) <= filters.maxMarketRate
    );
  }

  // Team language filter
  if (filters.teamLanguage === 'team') {
    filtered = filtered.filter(
      (job) =>
        job.languageAnalysis &&
        (job.languageAnalysis.weCount > 0 ||
          job.languageAnalysis.ourCount > 0 ||
          job.languageAnalysis.teamMentions > 0)
    );
  } else if (filters.teamLanguage === 'solo') {
    filtered = filtered.filter(
      (job) =>
        job.languageAnalysis &&
        (job.languageAnalysis.iCount > 0 ||
          job.languageAnalysis.myCount > 0 ||
          job.languageAnalysis.meMentions > 0)
    );
  }

  // Experience level filter
  if (filters.experienceLevel !== 'all') {
    filtered = filtered.filter(
      (job) => job.experienceLevel === filters.experienceLevel
    );
  }

  // Payment verified filter
  if (filters.paymentVerified === 'yes') {
    filtered = filtered.filter((job) => job.client.paymentVerified);
  } else if (filters.paymentVerified === 'no') {
    filtered = filtered.filter((job) => !job.client.paymentVerified);
  }

  // Tag filter - only show jobs that have ALL selected tags
  if (filters.selectedTags && filters.selectedTags.length > 0) {
    filtered = filtered.filter((job) => {
      if (!job.tags || job.tags.length === 0) return false;
      return filters.selectedTags!.every((selectedTag) =>
        job.tags!.includes(selectedTag)
      );
    });
  }

  return filtered;
}

/**
 * Sort jobs by specified criteria
 *
 * @param jobs - Array of jobs to sort
 * @param sortBy - Sort criteria
 * @returns Sorted jobs array (mutates original array)
 */
export function sortJobs(
  jobs: Job[],
  sortBy: FilterOptions['sortBy']
): Job[] {
  switch (sortBy) {
    case 'price_low':
      jobs.sort((a, b) => a.budget - b.budget);
      break;
    case 'price_high':
      jobs.sort((a, b) => b.budget - a.budget);
      break;
    case 'score_high':
      // Use internalScore for perfect jobs, regular score otherwise
      jobs.sort((a, b) => {
        const scoreA = (a as any).internalScore || a.score;
        const scoreB = (b as any).internalScore || b.score;
        return scoreB - scoreA;
      });
      break;
    case 'market_rate_high':
      jobs.sort((a, b) => (b.estimatedPrice || 0) - (a.estimatedPrice || 0));
      break;
    case 'proposals_low':
      jobs.sort((a, b) => a.proposalsCount - b.proposalsCount);
      break;
    case 'newest':
    default:
      jobs.sort(
        (a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      );
      break;
  }

  return jobs;
}

/**
 * Complete filtering and sorting pipeline
 * Main entry point - use this in components
 *
 * @param jobs - Raw jobs array
 * @param filters - Filter options
 * @returns Filtered and sorted jobs array
 */
export function filterAndSortJobs(jobs: Job[], filters: FilterOptions): Job[] {
  // Step 1: Filter by country (if applicable)
  let result = filterByCountry(jobs, filters.clientCountry);

  // Step 2: Exclude hired jobs (always applied)
  result = excludeHiredJobs(result);

  // Step 3: Apply all filter criteria
  result = applyJobFilters(result, filters);

  // Step 4: Sort by specified criteria
  result = sortJobs(result, filters.sortBy);

  return result;
}
