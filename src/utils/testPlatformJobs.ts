import { applyRecommendationFilters } from './recommendationFilters';
import { DEFAULT_SETTINGS } from '../types/settings';

/**
 * Test platform-specific jobs (Shopify, Bubble, etc.)
 * These should be REJECTED
 */

// Shopify job (should be REJECTED)
const shopifyJob = {
  title: 'Shopify Expert Needed for Store Setup',
  description: 'We need a Shopify expert to set up our online store with custom theme',
  score: 75,
  estimatedEHR: 90,
  client: {
    paymentVerified: true,
    rating: 4.5,
  },
  scoreBreakdown: {
    jobClarity: 15,
    ehrPotential: 13,
    professionalSignals: {
      weLanguage: 5,
      openBudget: 3,
      subtotal: 8,
    },
    clientQuality: {
      paymentVerified: 10,
      spendHistory: 10,
      recencyAndCompetition: 5,
      subtotal: 25,
    },
    keywordsMatch: 12,
    businessImpact: 10,
    redFlags: 0,
  },
  isDuplicate: false,
  isRepost: false,
  estimatedPrice: 8000,
};

// Bubble.io job (should be REJECTED)
const bubbleJob = {
  title: 'Bubble.io Developer for SaaS Platform',
  description: 'Build a SaaS platform using Bubble.io with user authentication and payments',
  score: 80,
  estimatedEHR: 95,
  client: {
    paymentVerified: true,
    rating: 5,
  },
  scoreBreakdown: {
    jobClarity: 15,
    ehrPotential: 13,
    professionalSignals: {
      weLanguage: 5,
      openBudget: 3,
      subtotal: 8,
    },
    clientQuality: {
      paymentVerified: 10,
      spendHistory: 10,
      recencyAndCompetition: 5,
      subtotal: 25,
    },
    keywordsMatch: 13,
    businessImpact: 12,
    redFlags: 0,
  },
  isDuplicate: false,
  isRepost: false,
  estimatedPrice: 10000,
};

// Clappia job (EDGE CASE - should this be accepted?)
const clappiaJob = {
  title: 'Clappia Expert for Workflow Automation',
  description: 'Build workflow automation using Clappia platform',
  score: 75,
  estimatedEHR: 90,
  client: {
    paymentVerified: true,
    rating: 4.5,
  },
  scoreBreakdown: {
    jobClarity: 15,
    ehrPotential: 13,
    professionalSignals: {
      weLanguage: 5,
      openBudget: 3,
      subtotal: 8,
    },
    clientQuality: {
      paymentVerified: 10,
      spendHistory: 10,
      recencyAndCompetition: 5,
      subtotal: 25,
    },
    keywordsMatch: 12,
    businessImpact: 10,
    redFlags: 0,
  },
  isDuplicate: false,
  isRepost: false,
  estimatedPrice: 8000,
};

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTING PLATFORM-SPECIFIC JOBS');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('TEST 1: Shopify job');
console.log('Expected: NOT RECOMMENDED');
const result1 = applyRecommendationFilters(shopifyJob as any, DEFAULT_SETTINGS);
console.log(`Result: ${result1}\n`);
console.log('---\n');

console.log('TEST 2: Bubble.io job');
console.log('Expected: NOT RECOMMENDED');
const result2 = applyRecommendationFilters(bubbleJob as any, DEFAULT_SETTINGS);
console.log(`Result: ${result2}\n`);
console.log('---\n');

console.log('TEST 3: Clappia job');
console.log('Expected: NOT RECOMMENDED (or discuss if we want to accept these)');
const result3 = applyRecommendationFilters(clappiaJob as any, DEFAULT_SETTINGS);
console.log(`Result: ${result3}\n`);
console.log('---\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('SUMMARY:');
console.log(`Shopify job: ${result1 === 'not_recommended' ? '✅ PASS (rejected)' : '❌ FAIL (should reject)'}`);
console.log(`Bubble job: ${result2 === 'not_recommended' ? '✅ PASS (rejected)' : '❌ FAIL (should reject)'}`);
console.log(`Clappia job: ${result3 === 'not_recommended' ? '✅ PASS (rejected)' : '⚠️  ACCEPTED (discuss)'}`);
console.log('═══════════════════════════════════════════════════════════════');
