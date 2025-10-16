import { GraphQLClient } from 'graphql-request';
import { rateLimiter } from '../utils/rateLimiter';
import { Job } from '../types/job';

const UPWORK_GRAPHQL_ENDPOINT = 'https://api.upwork.com/graphql';

// Initialize GraphQL client
const client = new GraphQLClient(UPWORK_GRAPHQL_ENDPOINT, {
  headers: {
    'X-Upwork-API-Key': import.meta.env.VITE_UPWORK_API_KEY || '',
  },
});

/**
 * Build GraphQL query for job search with dynamic filters
 * Note: Time window setting helps control ChatGPT API usage
 */
function buildJobSearchQuery(
  posted: string,
  maxProposals: number,
  experienceLevel: string[],
  paymentVerified: boolean
): string {
  // Map settings format to Upwork API format
  const postedMap: Record<string, string> = {
    last_24h: 'LAST_24_HOURS',
    last_48h: 'LAST_24_48_HOURS',
    last_7_days: 'LAST_7_DAYS',
    last_14_days: 'LAST_14_DAYS',
    last_30_days: 'LAST_30_DAYS',
  };

  const experienceLevelMap: Record<string, string> = {
    entry: 'ENTRY',
    intermediate: 'INTERMEDIATE',
    expert: 'EXPERT',
  };

  const mappedPosted = postedMap[posted] || 'LAST_7_DAYS';
  const mappedExperience = experienceLevel.map((level) => experienceLevelMap[level] || level.toUpperCase());

  return `
  query JobSearch($query: String!, $first: Int!, $after: String) {
    marketplaceJobPostings(
      search: { query: $query }
      pagination: { first: $first, after: $after }
      sort: { field: CREATE_TIME, sortOrder: DESC }
      filters: {
        paymentVerified: ${paymentVerified}
        clientHistory: HAS_HIRES_OR_SPEND
        experienceLevel: [${mappedExperience.join(', ')}]
        proposalsLessThan: ${maxProposals}
        posted: ${mappedPosted}
        location: ["United States"]
      }
    ) {
      edges {
        node {
          id
          title
          description
          url
          budget {
            amount
            currency
            type
          }
          createdAt
          proposals {
            total
          }
          client {
            id
            companyName
            paymentVerified
            totalSpent
            totalHires
            location {
              country
            }
            avgFeedback
            totalFeedback
            memberSince
          }
          category {
            name
          }
          subcategory {
            name
          }
          experienceLevel
          projectType
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;
}

/**
 * Fetch jobs for a specific search term
 */
export async function fetchJobsForSearch(
  searchTerm: string,
  filters?: {
    posted: string;
    maxProposals: number;
    experienceLevel: string[];
    paymentVerified: boolean;
  }
): Promise<any[]> {
  const jobs: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  let pageCount = 0;
  const MAX_PAGES = 2; // Fetch max 2 pages (200 jobs) per search

  // Use default filters if not provided
  const defaultFilters = {
    posted: 'last_7_days',
    maxProposals: 5,
    experienceLevel: ['intermediate', 'expert'],
    paymentVerified: true,
  };
  const activeFilters = filters || defaultFilters;

  // Build query with current filters
  const query = buildJobSearchQuery(
    activeFilters.posted,
    activeFilters.maxProposals,
    activeFilters.experienceLevel,
    activeFilters.paymentVerified
  );

  try {
    while (hasNextPage && pageCount < MAX_PAGES) {
      const response = await rateLimiter.throttle(async () => {
        return await client.request(query, {
          query: searchTerm,
          first: 100,
          after: cursor,
        });
      });

      const data = response.marketplaceJobPostings;
      jobs.push(...data.edges.map((edge: any) => edge.node));

      hasNextPage = data.pageInfo.hasNextPage;
      cursor = data.pageInfo.endCursor;
      pageCount++;
    }

    console.log(`Fetched ${jobs.length} jobs for search: "${searchTerm}"`);
    return jobs;
  } catch (error) {
    console.error(`Failed to fetch jobs for "${searchTerm}":`, error);
    throw error;
  }
}

/**
 * Fetch jobs from all saved searches
 */
export async function fetchAllJobs(
  keywords: {
    wideNet: string[];
    webflow: string[];
    portals: string[];
    ecommerce: string[];
    speedSEO: string[];
    automation: string[];
    vertical: string[];
  },
  filters?: {
    posted: string;
    maxProposals: number;
    experienceLevel: string[];
    paymentVerified: boolean;
  }
): Promise<any[]> {
  const allSearches = [
    ...keywords.wideNet,
    ...keywords.webflow,
    ...keywords.portals,
    ...keywords.ecommerce,
    ...keywords.speedSEO,
    ...keywords.automation,
    ...keywords.vertical,
  ];

  console.log(`Running ${allSearches.length} searches...`);

  const allJobs: any[] = [];

  // Batch 1: First 5 searches
  const batch1 = allSearches.slice(0, 5);
  const results1 = await Promise.all(
    batch1.map((search) => fetchJobsForSearch(search, filters))
  );
  allJobs.push(...results1.flat());

  // Small delay between batches
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Batch 2: Next 5 searches
  if (allSearches.length > 5) {
    const batch2 = allSearches.slice(5, 10);
    const results2 = await Promise.all(
      batch2.map((search) => fetchJobsForSearch(search, filters))
    );
    allJobs.push(...results2.flat());
  }

  // Batch 3: Remaining searches
  if (allSearches.length > 10) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const batch3 = allSearches.slice(10);
    const results3 = await Promise.all(
      batch3.map((search) => fetchJobsForSearch(search, filters))
    );
    allJobs.push(...results3.flat());
  }

  console.log(`Total jobs fetched: ${allJobs.length}`);
  console.log('API Usage:', rateLimiter.getUsageStats());

  return allJobs;
}

/**
 * Transform Upwork API response to our Job type
 */
export function transformUpworkJob(upworkJob: any): Partial<Job> {
  // Handle both API formats: createdAt (old) and createdDateTime (new from Cloud Function)
  const createdDate = upworkJob.createdDateTime || upworkJob.createdAt || upworkJob.publishedDateTime;

  // Parse budget from different formats
  let budget = 0;
  let budgetType: 'fixed' | 'hourly' | 'negotiable' = 'negotiable';
  let budgetIsPlaceholder = false;

  if (upworkJob.amount && upworkJob.amount.rawValue && parseFloat(upworkJob.amount.rawValue) > 0) {
    budget = parseFloat(upworkJob.amount.rawValue);
    budgetType = 'fixed';
  } else if (upworkJob.hourlyBudgetMax && upworkJob.hourlyBudgetMax.rawValue && parseFloat(upworkJob.hourlyBudgetMax.rawValue) > 0) {
    budget = parseFloat(upworkJob.hourlyBudgetMax.rawValue);
    budgetType = 'hourly';
  } else if (upworkJob.budget?.amount && upworkJob.budget.amount > 0) {
    budget = upworkJob.budget.amount;
    budgetType = upworkJob.budget.type?.toLowerCase() || 'negotiable';
  } else {
    // No budget set - this is an "open budget" job
    budgetIsPlaceholder = true;
  }

  // Build URL from ciphertext or id
  const jobUrl = upworkJob.url ||
                 (upworkJob.ciphertext ? `https://www.upwork.com/jobs/${upworkJob.ciphertext}` :
                  `https://www.upwork.com/jobs/~${upworkJob.id}`);

  return {
    upworkId: upworkJob.id,
    title: upworkJob.title,
    description: upworkJob.description,
    url: jobUrl,

    postedAt: new Date(createdDate),
    fetchedAt: new Date(),

    budget,
    budgetType,
    budgetIsPlaceholder,

    client: {
      id: upworkJob.client?.id || 'unknown',
      name: upworkJob.client?.companyName || 'Anonymous',
      paymentVerified: upworkJob.client?.paymentVerified || upworkJob.client?.verificationStatus === 'VERIFIED',
      totalSpent: upworkJob.client?.totalSpent?.rawValue
        ? parseFloat(upworkJob.client.totalSpent.rawValue)
        : (upworkJob.client?.totalSpent || 0),
      totalHires: upworkJob.client?.totalHires || 0,
      location: upworkJob.client?.location?.country || 'Unknown',
      rating: upworkJob.client?.totalFeedback || upworkJob.client?.avgFeedback || 0,
      reviewCount: upworkJob.client?.totalReviews || 0,
    },

    proposalsCount: upworkJob.totalApplicants || upworkJob.proposals?.total || 0,
    category: upworkJob.category || upworkJob.category?.name || 'Unknown',
    experienceLevel: (upworkJob.experienceLevel || 'intermediate').toLowerCase(),
    freelancersToHire: upworkJob.freelancersToHire,
    totalFreelancersToHire: upworkJob.totalFreelancersToHire,

    status: 'fetched',
    applied: false,
    won: false,
    isDuplicate: false,
    isRepost: false,
  };
}

/**
 * Mock function for development/testing
 * Returns sample jobs when Upwork API is not available
 */
export function getMockJobs(): Partial<Job>[] {
  return [
    {
      upworkId: '~01mock123',
      title: 'Client Portal for Video Production Company',
      description: 'We are a video production company looking to streamline our client communications. We need a secure portal where our clients can view project status, download files, and submit feedback. Our team handles 20+ active projects and email is becoming unmanageable.',
      url: 'https://www.upwork.com/jobs/~01mock123',
      postedAt: new Date(Date.now() - 3600000 * 6), // 6 hours ago
      fetchedAt: new Date(),
      budget: 0,
      budgetType: 'negotiable',
      budgetIsPlaceholder: false,
      client: {
        id: '~client001',
        name: 'VideoWorks LLC',
        paymentVerified: true,
        totalSpent: 12000,
        totalHires: 15,
        location: 'United States',
        rating: 4.8,
        reviewCount: 12,
      },
      proposalsCount: 3,
      category: 'Web Development',
      experienceLevel: 'expert',
      status: 'fetched',
      applied: false,
      won: false,
      isDuplicate: false,
      isRepost: false,
    },
    // Add more mock jobs here for testing
  ];
}
