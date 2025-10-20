import { applyRecommendationFilters } from '../utils/recommendationFilters';
import { DEFAULT_SETTINGS } from '../types/settings';

/**
 * Final comprehensive test of all filter logic
 */

const testJobs = [
  {
    name: 'Job with "highlights" (NOT GHL)',
    job: {
      title: 'Client Portal with Dashboard Highlights',
      description: 'Build a client portal with highlights and reporting features',
      score: 85,
      estimatedEHR: 100,
      client: { paymentVerified: true, rating: 5 },
      scoreBreakdown: {
        jobClarity: 15,
        ehrPotential: 13,
        professionalSignals: { weLanguage: 5, openBudget: 3, subtotal: 8 },
        clientQuality: { paymentVerified: 10, spendHistory: 10, recencyAndCompetition: 5, subtotal: 25 },
        keywordsMatch: 15,
        businessImpact: 13,
        redFlags: 0,
      },
      isDuplicate: false,
      isRepost: false,
      estimatedPrice: 12000,
    },
    expected: 'recommended',
    reason: 'Star Criteria (has highlights, not GHL)',
  },
  {
    name: 'Actual GHL job',
    job: {
      title: 'GHL Expert Needed',
      description: 'We need a GHL expert to set up automations',
      score: 85,
      estimatedEHR: 100,
      client: { paymentVerified: true, rating: 5 },
      scoreBreakdown: {
        jobClarity: 15,
        ehrPotential: 13,
        professionalSignals: { weLanguage: 5, openBudget: 3, subtotal: 8 },
        clientQuality: { paymentVerified: 10, spendHistory: 10, recencyAndCompetition: 5, subtotal: 25 },
        keywordsMatch: 12,
        businessImpact: 10,
        redFlags: 0,
      },
      isDuplicate: false,
      isRepost: false,
      estimatedPrice: 8000,
    },
    expected: 'not_recommended',
    reason: 'Excluded platform (GHL)',
  },
  {
    name: 'Shopify job',
    job: {
      title: 'Shopify Expert',
      description: 'Build Shopify store',
      score: 85,
      estimatedEHR: 100,
      client: { paymentVerified: true, rating: 5 },
      scoreBreakdown: {
        jobClarity: 15,
        ehrPotential: 13,
        professionalSignals: { weLanguage: 5, openBudget: 3, subtotal: 8 },
        clientQuality: { paymentVerified: 10, spendHistory: 10, recencyAndCompetition: 5, subtotal: 25 },
        keywordsMatch: 12,
        businessImpact: 10,
        redFlags: 0,
      },
      isDuplicate: false,
      isRepost: false,
      estimatedPrice: 8000,
    },
    expected: 'not_recommended',
    reason: 'Excluded platform (Shopify)',
  },
  {
    name: 'Lead gen job',
    job: {
      title: 'Lead Generation Team Needed',
      description: 'We need a lead generation team for outreach',
      score: 85,
      estimatedEHR: 100,
      client: { paymentVerified: true, rating: 5 },
      scoreBreakdown: {
        jobClarity: 15,
        ehrPotential: 13,
        professionalSignals: { weLanguage: 5, openBudget: 3, subtotal: 8 },
        clientQuality: { paymentVerified: 10, spendHistory: 10, recencyAndCompetition: 5, subtotal: 25 },
        keywordsMatch: 12,
        businessImpact: 10,
        redFlags: 0,
      },
      isDuplicate: false,
      isRepost: false,
      estimatedPrice: 10000,
    },
    expected: 'not_recommended',
    reason: 'Non-development job',
  },
  {
    name: 'Custom web app (good client)',
    job: {
      title: 'Custom Web Application',
      description: 'Build custom web application for our business',
      score: 85,
      estimatedEHR: 100,
      client: { paymentVerified: true, rating: 5 },
      scoreBreakdown: {
        jobClarity: 15,
        ehrPotential: 13,
        professionalSignals: { weLanguage: 5, openBudget: 3, subtotal: 8 },
        clientQuality: { paymentVerified: 10, spendHistory: 10, recencyAndCompetition: 5, subtotal: 25 },
        keywordsMatch: 15,
        businessImpact: 13,
        redFlags: 0,
      },
      isDuplicate: false,
      isRepost: false,
      estimatedPrice: 15000,
    },
    expected: 'recommended',
    reason: 'Star Criteria + Normal Filters',
  },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('FINAL COMPREHENSIVE FILTER TEST');
console.log('═══════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

for (const test of testJobs) {
  console.log(`TEST: ${test.name}`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Reason: ${test.reason}`);

  const result = applyRecommendationFilters(test.job as any, DEFAULT_SETTINGS);

  const passed = result === test.expected;
  if (passed) {
    passCount++;
    console.log(`✅ PASS: Got ${result}\n`);
  } else {
    failCount++;
    console.log(`❌ FAIL: Expected ${test.expected}, got ${result}\n`);
  }
  console.log('---\n');
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('SUMMARY:');
console.log(`Total tests: ${testJobs.length}`);
console.log(`Passed: ${passCount} ✅`);
console.log(`Failed: ${failCount} ${failCount > 0 ? '❌' : ''}`);
console.log(`Success rate: ${Math.round((passCount / testJobs.length) * 100)}%`);
console.log('═══════════════════════════════════════════════════════════════');
