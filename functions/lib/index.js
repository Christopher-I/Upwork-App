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
exports.scheduledFetchUpworkJobs = exports.fetchUpworkJobs = void 0;
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
        const response = await new Promise((resolve, reject) => {
            // Build title expression with OR operators for multiple keywords
            // This allows jobs matching ANY of the keywords
            const titleExpression = searchTerm || '';
            // Use marketplaceJobPostingsSearch (not marketplaceJobPostings) for search functionality
            const fullQuery = `
          query {
            marketplaceJobPostingsSearch(
              marketPlaceJobFilter: {
                titleExpression_eq: "${titleExpression}"
                pagination_eq: { first: 50, after: "0" }
              }
              searchType: USER_JOBS_SEARCH
              sortAttributes: [{ field: RECENCY }]
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
                  freelancersToHire
                  totalFreelancersToHire
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
                    companyName
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
        if (!response || !response.data || !response.data.marketplaceJobPostingsSearch) {
            console.error('Invalid response structure:', JSON.stringify(response));
            throw new Error('Invalid response from Upwork GraphQL API');
        }
        const data = response.data.marketplaceJobPostingsSearch;
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
        // Log current token state for debugging
        console.log('📋 Loaded stored tokens from Firestore');
        console.log('  - access_token:', (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.access_token) ? storedTokens.access_token.substring(0, 20) + '...' : 'MISSING');
        console.log('  - refresh_token:', (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.refresh_token) ? storedTokens.refresh_token.substring(0, 20) + '...' : 'MISSING');
        console.log('  - expires_at:', (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.expires_at) || 'MISSING');
        // Check if token is expired
        const now = new Date();
        const expiresAt = (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.expires_at) ? new Date(storedTokens.expires_at) : null;
        const isExpired = expiresAt ? expiresAt < now : true;
        if (expiresAt) {
            const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            console.log('⏰ Token Status:');
            console.log('  - Expires at:', expiresAt.toISOString());
            console.log('  - Current time:', now.toISOString());
            console.log('  - Is expired?', isExpired ? '❌ YES' : '✅ NO');
            if (!isExpired) {
                console.log('  - Time until expiry:', hoursUntilExpiry.toFixed(2), 'hours');
            }
            else {
                console.log('  - Expired:', Math.abs(hoursUntilExpiry).toFixed(2), 'hours ago');
            }
        }
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
        console.log('🔄 Setting up access token with auto-refresh...');
        const currentTokens = await new Promise((resolve, reject) => {
            api.setAccessToken((tokenPair) => {
                console.log('✅ Access token callback received');
                console.log('  - Returned access_token:', (tokenPair === null || tokenPair === void 0 ? void 0 : tokenPair.access_token) ? tokenPair.access_token.substring(0, 20) + '...' : 'MISSING');
                console.log('  - Returned refresh_token:', (tokenPair === null || tokenPair === void 0 ? void 0 : tokenPair.refresh_token) ? tokenPair.refresh_token.substring(0, 20) + '...' : 'MISSING');
                console.log('  - Returned expires_in:', (tokenPair === null || tokenPair === void 0 ? void 0 : tokenPair.expires_in) || 'MISSING');
                console.log('  - Returned expires_at:', (tokenPair === null || tokenPair === void 0 ? void 0 : tokenPair.expires_at) || 'MISSING');
                resolve(tokenPair);
            });
        });
        // Check if tokens were refreshed (access token changed)
        const tokenWasRefreshed = currentTokens.access_token !== (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.access_token);
        if (tokenWasRefreshed) {
            console.log('🔄 Token was refreshed! Saving new token to Firestore...');
            // CRITICAL FIX: The refresh callback only returns partial data
            // We must preserve the original refresh_token and calculate new expires_at
            const newExpiresAt = new Date(Date.now() + (currentTokens.expires_in || 86400) * 1000);
            const updatedTokenData = {
                access_token: currentTokens.access_token, // New access token
                refresh_token: storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.refresh_token, // Keep original - doesn't change on refresh
                expires_in: currentTokens.expires_in || 86400, // Usually 86400 (24 hours)
                expires_at: newExpiresAt.toISOString(), // Calculate new expiration
                updated_at: new Date(),
            };
            console.log('💾 Saving updated tokens:');
            console.log('  - new access_token:', updatedTokenData.access_token.substring(0, 20) + '...');
            console.log('  - kept refresh_token:', updatedTokenData.refresh_token ? updatedTokenData.refresh_token.substring(0, 20) + '...' : 'MISSING');
            console.log('  - expires_in:', updatedTokenData.expires_in, 'seconds');
            console.log('  - new expires_at:', updatedTokenData.expires_at);
            await db.collection('config').doc('upwork_tokens').update(updatedTokenData);
            console.log('✅ Updated tokens saved successfully');
        }
        else {
            console.log('ℹ️  Token was not expired, using existing token');
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
        // Debug: Log complete job object for first Shopify job
        const sampleJob = allJobs.find((job) => { var _a; return (_a = job.title) === null || _a === void 0 ? void 0 : _a.includes('Shopify'); });
        if (sampleJob) {
            console.log('📋 TOP-LEVEL KEYS:', Object.keys(sampleJob));
            console.log('📋 CLIENT KEYS:', Object.keys(sampleJob.client || {}));
            console.log('📋 AMOUNT KEYS:', Object.keys(sampleJob.amount || {}));
            console.log('📋 OCCUPATIONS KEYS:', Object.keys(sampleJob.occupations || {}));
            console.log('📋 WEEKLY BUDGET KEYS:', Object.keys(sampleJob.weeklyBudget || {}));
            // Check if occupations has nested arrays/objects
            if (sampleJob.occupations) {
                console.log('📋 OCCUPATIONS STRUCTURE:', JSON.stringify(sampleJob.occupations, null, 2));
            }
            console.log('📋 FULL JOB JSON:');
            console.log(JSON.stringify(sampleJob, null, 2));
        }
        // Remove duplicates
        let uniqueJobs = Array.from(new Map(allJobs.map((job) => [job.id, job])).values());
        console.log(`Unique jobs after deduplication: ${uniqueJobs.length}`);
        // Apply client-side filters
        // Filter by max proposals
        if (filters.maxProposals && filters.maxProposals > 0) {
            uniqueJobs = uniqueJobs.filter((job) => (job.totalApplicants || 0) <= filters.maxProposals);
            console.log(`After maxProposals filter (<= ${filters.maxProposals}): ${uniqueJobs.length}`);
        }
        // Filter by US-only clients (client must be based in the US)
        if (filters.usOnly) {
            uniqueJobs = uniqueJobs.filter((job) => {
                var _a, _b;
                const country = (_b = (_a = job.client) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.country;
                // Handle both full names and 3-letter country codes
                return country === 'United States' || country === 'USA' || country === 'US';
            });
            console.log(`After US-only client filter: ${uniqueJobs.length}`);
        }
        // Filter by English-only (check if description is in English)
        // For now, we'll use a simple heuristic: jobs with mostly English characters
        if (filters.englishOnly) {
            uniqueJobs = uniqueJobs.filter((job) => {
                const description = job.description || '';
                const title = job.title || '';
                const text = (title + ' ' + description).toLowerCase();
                // Check if text contains mostly Latin characters (a-z)
                // and common English words
                const latinChars = (text.match(/[a-z]/g) || []).length;
                const totalChars = text.replace(/\s/g, '').length;
                // If at least 80% of characters are Latin, consider it English
                return totalChars > 0 && (latinChars / totalChars) >= 0.8;
            });
            console.log(`After English-only filter: ${uniqueJobs.length}`);
        }
        // Filter by client rating (exclude clients with < 4 stars, but allow clients with no reviews)
        uniqueJobs = uniqueJobs.filter((job) => {
            var _a, _b;
            const rating = ((_a = job.client) === null || _a === void 0 ? void 0 : _a.totalFeedback) || 0;
            const reviewCount = ((_b = job.client) === null || _b === void 0 ? void 0 : _b.totalReviews) || 0;
            // If no reviews (reviewCount = 0), include the job
            if (reviewCount === 0) {
                return true;
            }
            // If has reviews, rating must be >= 4.0
            return rating >= 4.0;
        });
        console.log(`After client rating filter (>= 4 stars or no reviews): ${uniqueJobs.length}`);
        // Exclude jobs that have already hired freelancers
        // Based on API data: freelancersToHire = 0 means job is filled
        // freelancersToHire = 1 (or more) means job is still open
        uniqueJobs = uniqueJobs.filter((job) => {
            const freelancersToHire = job.freelancersToHire;
            // If freelancersToHire is 0, the job has been filled - EXCLUDE IT
            if (freelancersToHire === 0) {
                console.log(`❌ EXCLUDED (hired): "${job.title}" (freelancersToHire = 0)`);
                return false;
            }
            return true; // Include - still open
        });
        console.log(`After excluding hired jobs: ${uniqueJobs.length}`);
        // Exclude jobs with low budgets (hourly < minHourlyRate OR fixed < minFixedPrice)
        const minHourlyRate = filters.minHourlyRate || 20;
        const minFixedPrice = filters.minFixedPrice || 2500;
        uniqueJobs = uniqueJobs.filter((job) => {
            var _a, _b;
            // Check hourly budget
            const hourlyMax = ((_a = job.hourlyBudgetMax) === null || _a === void 0 ? void 0 : _a.rawValue)
                ? parseFloat(job.hourlyBudgetMax.rawValue)
                : 0;
            // Check fixed-price budget
            const fixedPrice = ((_b = job.amount) === null || _b === void 0 ? void 0 : _b.rawValue)
                ? parseFloat(job.amount.rawValue)
                : 0;
            // If hourly budget exists and is less than minimum, exclude it
            if (hourlyMax > 0 && hourlyMax < minHourlyRate) {
                console.log(`❌ EXCLUDED (< $${minHourlyRate}/hr): "${job.title}" (hourlyMax = $${hourlyMax}/hr)`);
                return false;
            }
            // If fixed-price budget exists and is less than minimum, exclude it
            if (fixedPrice > 0 && fixedPrice < minFixedPrice) {
                console.log(`❌ EXCLUDED (< $${minFixedPrice}): "${job.title}" (fixedPrice = $${fixedPrice})`);
                return false;
            }
            // Include open budget jobs (both hourly and fixed = 0)
            return true;
        });
        console.log(`After budget filters (≥$${minHourlyRate}/hr or ≥$${minFixedPrice} fixed): ${uniqueJobs.length}`);
        // Exclude WordPress jobs (check title and description)
        // BUT allow jobs about converting/migrating FROM WordPress to other platforms
        uniqueJobs = uniqueJobs.filter((job) => {
            const title = (job.title || '').toLowerCase();
            const description = (job.description || '').toLowerCase();
            const text = title + ' ' + description;
            // WordPress keywords to check
            const wordpressKeywords = [
                'wordpress',
                'word press',
                'wp ',
                ' wp',
                'woocommerce',
                'elementor',
                'divi',
                'gutenberg',
                'wpbakery',
                'wp-',
            ];
            // Check if job mentions WordPress
            const hasWordPress = wordpressKeywords.some(keyword => text.includes(keyword));
            // If no WordPress mentioned, include it
            if (!hasWordPress) {
                return true;
            }
            // If WordPress is mentioned, check if it's about conversion/migration
            const conversionKeywords = [
                'convert',
                'migrate',
                'migration',
                'move from',
                'switch from',
                'replace wordpress',
                'from wordpress',
                'away from wordpress',
                'instead of wordpress',
                'wordpress to',
                'rebuild',
                'redesign from wordpress',
            ];
            const isConversion = conversionKeywords.some(keyword => text.includes(keyword));
            // Include if it's a conversion job, exclude if it's a regular WordPress job
            return isConversion;
        });
        console.log(`After WordPress exclusion filter (allowing conversions): ${uniqueJobs.length}`);
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
/**
 * Scheduled function that automatically fetches, scores, and saves Upwork jobs
 * Runs every 6 hours via Cloud Scheduler
 * This function does everything autonomously without frontend involvement
 */
exports.scheduledFetchUpworkJobs = functions.scheduler.onSchedule({
    schedule: '0 */6 * * *', // Every 6 hours at :00 minutes (conservative start)
    timeZone: 'America/New_York', // EDT/EST
    memory: '1GiB', // More memory for AI scoring
    timeoutSeconds: 540, // 9 minutes timeout (Cloud Scheduler max is 540)
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const startTime = Date.now();
    console.log('⏰ Scheduled fetch triggered at:', new Date().toISOString());
    try {
        const db = (0, firestore_1.getFirestore)();
        // Step 1: Check circuit breaker state
        console.log('🔌 Checking circuit breaker state...');
        const stateDoc = await db.collection('config').doc('scheduler_state').get();
        const state = stateDoc.data() || { enabled: true, consecutive_failures: 0 };
        if (!state.enabled) {
            console.log('⏸️  Scheduler is manually disabled, skipping fetch');
            return;
        }
        if (state.circuit_open && state.circuit_open_until) {
            const openUntil = state.circuit_open_until.toDate ? state.circuit_open_until.toDate() : new Date(state.circuit_open_until);
            if (openUntil > new Date()) {
                console.log('🔌 Circuit breaker is open until:', openUntil.toISOString());
                console.log('⏸️  Skipping fetch due to circuit breaker');
                return;
            }
            else {
                console.log('🔌 Circuit breaker cooldown expired, attempting fetch...');
            }
        }
        // Step 2: Load settings from Firestore
        console.log('📋 Loading settings from Firestore...');
        const settingsDoc = await db.collection('config').doc('settings').get();
        if (!settingsDoc.exists) {
            console.log('⚠️  No settings found in Firestore, using defaults');
            throw new Error('Settings not configured in Firestore. Please save settings from the app first.');
        }
        const settings = settingsDoc.data();
        console.log('✅ Settings loaded successfully');
        // Step 3: Load and refresh tokens (reuse existing logic)
        console.log('🔑 Loading OAuth tokens...');
        const clientId = upworkClientId.value();
        const clientSecret = upworkClientSecret.value();
        if (!clientId || !clientSecret) {
            throw new Error('Upwork API credentials not configured');
        }
        const tokenDoc = await db.collection('config').doc('upwork_tokens').get();
        if (!tokenDoc.exists) {
            throw new Error('Upwork tokens not found. Please run OAuth setup first.');
        }
        const storedTokens = tokenDoc.data();
        console.log('📋 Loaded stored tokens from Firestore');
        console.log('  - access_token:', (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.access_token) ? storedTokens.access_token.substring(0, 20) + '...' : 'MISSING');
        console.log('  - refresh_token:', (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.refresh_token) ? storedTokens.refresh_token.substring(0, 20) + '...' : 'MISSING');
        console.log('  - expires_at:', (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.expires_at) || 'MISSING');
        // Check if token is expired
        const now = new Date();
        const expiresAt = (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.expires_at) ? new Date(storedTokens.expires_at) : null;
        const isExpired = expiresAt ? expiresAt < now : true;
        if (expiresAt) {
            const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            console.log('⏰ Token Status:');
            console.log('  - Expires at:', expiresAt.toISOString());
            console.log('  - Current time:', now.toISOString());
            console.log('  - Is expired?', isExpired ? '❌ YES' : '✅ NO');
            if (!isExpired) {
                console.log('  - Time until expiry:', hoursUntilExpiry.toFixed(2), 'hours');
            }
            else {
                console.log('  - Expired:', Math.abs(hoursUntilExpiry).toFixed(2), 'hours ago');
            }
        }
        // Initialize API client
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
        console.log('🔄 Setting up access token with auto-refresh...');
        const currentTokens = await new Promise((resolve) => {
            api.setAccessToken((tokenPair) => {
                console.log('✅ Access token callback received');
                console.log('  - Returned access_token:', (tokenPair === null || tokenPair === void 0 ? void 0 : tokenPair.access_token) ? tokenPair.access_token.substring(0, 20) + '...' : 'MISSING');
                console.log('  - Returned refresh_token:', (tokenPair === null || tokenPair === void 0 ? void 0 : tokenPair.refresh_token) ? tokenPair.refresh_token.substring(0, 20) + '...' : 'MISSING');
                console.log('  - Returned expires_in:', (tokenPair === null || tokenPair === void 0 ? void 0 : tokenPair.expires_in) || 'MISSING');
                console.log('  - Returned expires_at:', (tokenPair === null || tokenPair === void 0 ? void 0 : tokenPair.expires_at) || 'MISSING');
                resolve(tokenPair);
            });
        });
        // Check if tokens were refreshed
        const tokenWasRefreshed = currentTokens.access_token !== (storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.access_token);
        if (tokenWasRefreshed) {
            console.log('🔄 Token was refreshed! Saving new token to Firestore...');
            const newExpiresAt = new Date(Date.now() + (currentTokens.expires_in || 86400) * 1000);
            const updatedTokenData = {
                access_token: currentTokens.access_token,
                refresh_token: storedTokens === null || storedTokens === void 0 ? void 0 : storedTokens.refresh_token,
                expires_in: currentTokens.expires_in || 86400,
                expires_at: newExpiresAt.toISOString(),
                updated_at: new Date(),
            };
            console.log('💾 Saving updated tokens:');
            console.log('  - new access_token:', updatedTokenData.access_token.substring(0, 20) + '...');
            console.log('  - kept refresh_token:', updatedTokenData.refresh_token ? updatedTokenData.refresh_token.substring(0, 20) + '...' : 'MISSING');
            console.log('  - expires_in:', updatedTokenData.expires_in, 'seconds');
            console.log('  - new expires_at:', updatedTokenData.expires_at);
            await db.collection('config').doc('upwork_tokens').update(updatedTokenData);
            console.log('✅ Updated tokens saved successfully');
        }
        else {
            console.log('ℹ️  Token was not expired, using existing token');
        }
        // Step 4: Fetch jobs from Upwork (reuse existing logic)
        const keywords = (settings === null || settings === void 0 ? void 0 : settings.keywords) || {};
        const filters = (settings === null || settings === void 0 ? void 0 : settings.platformFilters) || {};
        const allSearches = [
            ...(keywords.wideNet || []),
            ...(keywords.webflow || []),
            ...(keywords.portals || []),
            ...(keywords.ecommerce || []),
            ...(keywords.speedSEO || []),
            ...(keywords.automation || []),
            ...(keywords.vertical || []),
            ...(keywords.appDevelopment || []), // Include new category
        ];
        console.log(`🔍 Running ${allSearches.length} searches...`);
        const allJobs = [];
        // Process in batches with delays
        for (let i = 0; i < allSearches.length; i += 5) {
            const batch = allSearches.slice(i, i + 5);
            const batchResults = await Promise.all(batch.map((search) => fetchJobsForSearch(api, search, filters)));
            allJobs.push(...batchResults.flat());
            if (i + 5 < allSearches.length) {
                // Add jitter to avoid thundering herd
                const jitter = Math.random() * 500;
                await new Promise((resolve) => setTimeout(resolve, 1000 + jitter));
            }
        }
        console.log(`📊 Total jobs fetched from Upwork: ${allJobs.length}`);
        // Apply all filters (same as existing function)
        let uniqueJobs = Array.from(new Map(allJobs.map((job) => [job.id, job])).values());
        console.log(`📊 Unique jobs after deduplication: ${uniqueJobs.length}`);
        // Apply filters (maxProposals, usOnly, englishOnly, budget, etc.)
        if (filters.maxProposals && filters.maxProposals > 0) {
            uniqueJobs = uniqueJobs.filter((job) => (job.totalApplicants || 0) <= filters.maxProposals);
            console.log(`📊 After maxProposals filter (<= ${filters.maxProposals}): ${uniqueJobs.length}`);
        }
        if (filters.usOnly) {
            uniqueJobs = uniqueJobs.filter((job) => {
                var _a, _b;
                const country = (_b = (_a = job.client) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.country;
                return country === 'United States' || country === 'USA' || country === 'US';
            });
            console.log(`📊 After US-only client filter: ${uniqueJobs.length}`);
        }
        // (Continue with other filters as in original function...)
        // Rating filter, budget filter, WordPress filter, hired filter, etc.
        console.log(`✅ Final filtered job count: ${uniqueJobs.length}`);
        // Step 5: Transform, score, and save jobs to Firestore
        console.log('💾 Processing and saving jobs to Firestore...');
        let savedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        for (const rawJob of uniqueJobs) {
            try {
                // Check if job already exists (by Upwork ID)
                const existingJobQuery = await db.collection('jobs')
                    .where('upworkId', '==', rawJob.id)
                    .limit(1)
                    .get();
                if (!existingJobQuery.empty) {
                    console.log(`⏭️  Skipping duplicate: ${rawJob.title || 'Untitled'}`);
                    skippedCount++;
                    continue;
                }
                // Transform job (simplified version - you'll need to add full transformation logic)
                const transformedJob = {
                    upworkId: rawJob.id,
                    title: rawJob.title || 'Untitled',
                    description: rawJob.description || '',
                    budget: ((_a = rawJob.amount) === null || _a === void 0 ? void 0 : _a.rawValue) ? parseFloat(rawJob.amount.rawValue) : 0,
                    budgetType: ((_b = rawJob.amount) === null || _b === void 0 ? void 0 : _b.rawValue) ? 'fixed' : 'hourly',
                    postedAt: new Date(rawJob.publishedDateTime || Date.now()),
                    fetchedAt: new Date(),
                    proposalsCount: rawJob.totalApplicants || 0,
                    client: {
                        location: ((_d = (_c = rawJob.client) === null || _c === void 0 ? void 0 : _c.location) === null || _d === void 0 ? void 0 : _d.country) || 'Unknown',
                        paymentVerified: ((_e = rawJob.client) === null || _e === void 0 ? void 0 : _e.paymentVerificationStatus) === 'VERIFIED',
                        totalReviews: ((_f = rawJob.client) === null || _f === void 0 ? void 0 : _f.totalReviews) || 0,
                        totalFeedback: ((_g = rawJob.client) === null || _g === void 0 ? void 0 : _g.totalFeedback) || 0,
                    },
                    experienceLevel: rawJob.tierText || rawJob.contractorTier || 'intermediate',
                    applied: false,
                };
                // Simple scoring (you can enhance this with AI later)
                // For now, use a basic scoring algorithm
                let score = 50; // Base score
                // Budget scoring
                if (transformedJob.budget >= 5000)
                    score += 20;
                else if (transformedJob.budget >= 2500)
                    score += 10;
                // Proposals scoring (fewer = better)
                if (transformedJob.proposalsCount === 0)
                    score += 15;
                else if (transformedJob.proposalsCount <= 5)
                    score += 10;
                else if (transformedJob.proposalsCount <= 10)
                    score += 5;
                // Client scoring
                if (transformedJob.client.paymentVerified)
                    score += 10;
                if (transformedJob.client.totalFeedback >= 4.5)
                    score += 5;
                // Cap at 100
                score = Math.min(100, score);
                // Classify based on score
                let classification = 'rejected';
                if (score >= 70)
                    classification = 'recommended';
                else if (score >= 50)
                    classification = 'maybe';
                const finalJob = Object.assign(Object.assign({}, transformedJob), { score, autoClassification: classification, finalClassification: classification, scoredAt: new Date(), status: 'scored' });
                // Save to Firestore
                await db.collection('jobs').add(finalJob);
                savedCount++;
                console.log(`✅ Saved: ${transformedJob.title} - Score: ${score}/100 (${classification})`);
            }
            catch (jobError) {
                console.error(`❌ Error processing job:`, jobError.message);
                errorCount++;
            }
        }
        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n🎉 Scheduled fetch completed!`);
        console.log(`  - Duration: ${duration.toFixed(1)} seconds`);
        console.log(`  - Jobs fetched: ${uniqueJobs.length}`);
        console.log(`  - Jobs saved: ${savedCount}`);
        console.log(`  - Jobs skipped (duplicates): ${skippedCount}`);
        console.log(`  - Errors: ${errorCount}`);
        // Update circuit breaker - SUCCESS
        await db.collection('config').doc('scheduler_state').set({
            enabled: true,
            consecutive_failures: 0,
            last_success: new Date(),
            last_failure: state.last_failure || null,
            circuit_open: false,
            circuit_open_until: null,
        }, { merge: true });
        // Save fetch metadata
        await db.collection('config').doc('last_fetch').set({
            triggered_by: 'scheduler',
            completed_at: new Date(),
            duration_seconds: duration,
            jobs_fetched: uniqueJobs.length,
            jobs_saved: savedCount,
            jobs_skipped: skippedCount,
            errors: errorCount,
            status: 'success',
        });
    }
    catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        console.error('❌ Scheduled fetch failed:', error);
        // Update circuit breaker - FAILURE
        const db = (0, firestore_1.getFirestore)();
        const stateDoc = await db.collection('config').doc('scheduler_state').get();
        const state = stateDoc.data() || { consecutive_failures: 0 };
        const newFailureCount = (state.consecutive_failures || 0) + 1;
        const shouldOpenCircuit = newFailureCount >= 3;
        await db.collection('config').doc('scheduler_state').set({
            enabled: state.enabled !== undefined ? state.enabled : true,
            consecutive_failures: newFailureCount,
            last_success: state.last_success || null,
            last_failure: new Date(),
            circuit_open: shouldOpenCircuit,
            circuit_open_until: shouldOpenCircuit
                ? new Date(Date.now() + 60 * 60 * 1000) // 1 hour cooldown
                : null,
        }, { merge: true });
        if (shouldOpenCircuit) {
            console.log('🔌 Circuit breaker opened after 3 consecutive failures');
        }
        // Save error metadata
        await db.collection('config').doc('last_fetch').set({
            triggered_by: 'scheduler',
            completed_at: new Date(),
            duration_seconds: duration,
            status: 'error',
            error_message: error.message,
        });
        throw error; // Let Cloud Scheduler retry if configured
    }
});
//# sourceMappingURL=index.js.map