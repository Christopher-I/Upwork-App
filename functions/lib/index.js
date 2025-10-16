"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUpworkJobs = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const API = require('@upwork/node-upwork-oauth2');
const Graphql = require('@upwork/node-upwork-oauth2/lib/routers/graphql').Graphql;
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const upworkClientId = (0, params_1.defineString)('UPWORK_CLIENT_ID');
const upworkClientSecret = (0, params_1.defineString)('UPWORK_CLIENT_SECRET');
/**
 * Build GraphQL query for job search with dynamic filters
 * Note: Not currently used - queries are built inline for simplicity
 */
/* function buildJobSearchQuery(
  posted: string,
  maxProposals: number,
  experienceLevel: string[],
  paymentVerified: boolean
): string {
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
  const mappedExperience = experienceLevel.map(
    (level) => experienceLevelMap[level] || level.toUpperCase()
  );

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
} */
/**
 * Fetch jobs for a specific search term using Upwork OAuth2
 */
async function fetchJobsForSearch(apiClient, searchTerm, filters) {
    const jobs = [];
    const graphql = new Graphql(apiClient);
    try {
        // Make GraphQL request using Upwork OAuth2 client's Graphql router
        // Note: searchTerm is not used in this query - Upwork's GraphQL doesn't support keyword search
        const response = await new Promise((resolve, reject) => {
            // Use the correct Upwork GraphQL schema based on introspection
            // Note: Upwork's GraphQL doesn't support keyword search or advanced filtering
            // We get all recent jobs and filter client-side
            const fullQuery = `
          query {
            marketplaceJobPostings(
              searchType: USER_JOBS_SEARCH
              sortAttributes: { field: RECENCY }
            ) {
              edges {
                node {
                  id
                  title
                  description
                  createdDateTime
                  publishedDateTime
                  ciphertext
                  duration
                  durationLabel
                  engagement
                  amount {
                    rawValue
                    currency
                    displayValue
                  }
                  experienceLevel
                  category
                  subcategory
                  totalApplicants
                  hourlyBudgetMin {
                    rawValue
                    currency
                    displayValue
                  }
                  hourlyBudgetMax {
                    rawValue
                    currency
                    displayValue
                  }
                  weeklyBudget {
                    rawValue
                    currency
                    displayValue
                  }
                  client {
                    totalHires
                    totalPostedJobs
                    totalSpent {
                      rawValue
                      currency
                      displayValue
                    }
                    verificationStatus
                    totalReviews
                    totalFeedback
                    location {
                      country
                      city
                      state
                      timezone
                    }
                  }
                  occupations {
                    category {
                      id
                      prefLabel
                    }
                    subCategories {
                      id
                      prefLabel
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `;
            const params = {
                query: fullQuery,
            };
            graphql.execute(params, (error, httpStatus, data) => {
                console.log('GraphQL response - error:', error);
                console.log('GraphQL response - httpStatus:', httpStatus);
                console.log('GraphQL response - data:', JSON.stringify(data));
                if (error) {
                    reject(error);
                }
                else if (!data || !data.data) {
                    reject(new Error(`Invalid GraphQL response: ${JSON.stringify(data)}`));
                }
                else {
                    resolve(data);
                }
            });
        });
        if (!response || !response.data || !response.data.marketplaceJobPostings) {
            console.error('Invalid response structure:', JSON.stringify(response));
            throw new Error('Invalid response from Upwork GraphQL API');
        }
        const data = response.data.marketplaceJobPostings;
        jobs.push(...data.edges.map((edge) => edge.node));
        console.log(`Fetched ${jobs.length} jobs`);
        return jobs;
    }
    catch (error) {
        console.error(`Failed to fetch jobs for "${searchTerm}":`, error);
        throw error;
    }
}
/**
 * Cloud Function to fetch Upwork jobs using OAuth2
 */
exports.fetchUpworkJobs = functions.https.onCall({ cors: true }, async (request) => {
    const { keywords, filters } = request.data;
    if (!keywords || !filters) {
        throw new functions.https.HttpsError('invalid-argument', 'keywords and filters are required');
    }
    try {
        const clientId = upworkClientId.value();
        const clientSecret = upworkClientSecret.value();
        if (!clientId || !clientSecret) {
            throw new functions.https.HttpsError('failed-precondition', 'Upwork API credentials not configured');
        }
        console.log('Initializing Upwork OAuth2 client...');
        // Load stored tokens from Firestore
        const db = (0, firestore_1.getFirestore)();
        const tokenDoc = await db.collection('config').doc('upwork_tokens').get();
        if (!tokenDoc.exists) {
            throw new functions.https.HttpsError('failed-precondition', 'Upwork tokens not found. Please run the setup script first: node functions/setup-upwork-auth.js');
        }
        const storedTokens = tokenDoc.data();
        console.log('Loaded stored tokens from Firestore');
        // Initialize Upwork API client with stored tokens
        const config = {
            clientId,
            clientSecret,
            redirectUri: 'https://seedapp.io',
            accessToken: storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.access_token,
            refreshToken: storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.refresh_token,
            expiresIn: storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.expires_in,
            expiresAt: storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.expires_at,
        };
        const api = new API(config);
        // Set access token (will auto-refresh if expired)
        console.log('Setting up access token with auto-refresh...');
        const currentTokens = await new Promise((resolve) => {
            api.setAccessToken((tokenPair) => {
                console.log('Access token ready (refreshed if needed)');
                resolve(tokenPair);
            });
        });
        // If tokens were refreshed, save them back to Firestore
        if (currentTokens.access_token !== (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.access_token)) {
            console.log('Tokens were refreshed, saving to Firestore...');
            await db.collection('config').doc('upwork_tokens').update({
                access_token: currentTokens.access_token,
                refresh_token: currentTokens.refresh_token,
                expires_in: currentTokens.expires_in,
                expires_at: currentTokens.expires_at,
                updated_at: new Date(),
            });
            console.log('Updated tokens saved');
        }
        const allSearches = [
            ...(keywords.wideNet || []),
            ...(keywords.webflow || []),
            ...(keywords.portals || []),
            ...(keywords.ecommerce || []),
            ...(keywords.speedSEO || []),
            ...(keywords.automation || []),
            ...(keywords.vertical || []),
        ];
        console.log(`Running ${allSearches.length} searches...`);
        const allJobs = [];
        // Process in batches
        for (let i = 0; i < allSearches.length; i += 5) {
            const batch = allSearches.slice(i, i + 5);
            const batchResults = await Promise.all(batch.map((search) => fetchJobsForSearch(api, search, filters)));
            allJobs.push(...batchResults.flat());
            if (i + 5 < allSearches.length) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        console.log(`Total jobs fetched: ${allJobs.length}`);
        // Remove duplicates
        const uniqueJobs = Array.from(new Map(allJobs.map((job) => [job.id, job])).values());
        console.log(`Unique jobs after deduplication: ${uniqueJobs.length}`);
        return {
            jobs: uniqueJobs,
            count: uniqueJobs.length,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Error fetching Upwork jobs:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to fetch jobs from Upwork');
    }
});
//# sourceMappingURL=index.js.map