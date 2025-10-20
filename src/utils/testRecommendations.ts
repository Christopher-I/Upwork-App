import { applyRecommendationFilters } from './recommendationFilters';
import { DEFAULT_SETTINGS } from '../types/settings';

/**
 * Test recommendation filters with sample jobs
 * Run with: npx tsx src/utils/testRecommendations.ts
 */

// Test Case 1: Clappia-like job (should be RECOMMENDED)
const clappiaJob = {
  title: 'Client Portal with Dashboard and Highlights',
  description: 'Build a client portal dashboard with highlights and reporting features',
  score: 67,
  estimatedEHR: 100,
  client: {
    paymentVerified: false,
    rating: 0,
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
      paymentVerified: 0,
      spendHistory: 0,
      recencyAndCompetition: 1,
      subtotal: 1,
    },
    keywordsMatch: 15,
    businessImpact: 13,
    redFlags: 0,
  },
  isDuplicate: false,
  isRepost: false,
  estimatedPrice: 12000,
};

// Test Case 2: Lead gen job (should be REJECTED)
const leadGenJob = {
  title: 'Lead Generation Team for SaaS Company',
  description: 'We need an experienced lead generation team to run LinkedIn + email outreach campaigns',
  score: 80,
  estimatedEHR: 100,
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
    keywordsMatch: 15,
    businessImpact: 13,
    redFlags: 0,
  },
  isDuplicate: false,
  isRepost: false,
  estimatedPrice: 15000,
};

// Test Case 3: Actual GHL job (should be REJECTED)
const ghlJob = {
  title: 'GHL Expert Needed for Automation',
  description: 'We need a GHL expert to set up automations in GoHighLevel',
  score: 75,
  estimatedEHR: 90,
  client: {
    paymentVerified: true,
    rating: 4.5,
  },
  scoreBreakdown: {
    jobClarity: 12,
    ehrPotential: 11,
    professionalSignals: {
      weLanguage: 5,
      openBudget: 0,
      subtotal: 5,
    },
    clientQuality: {
      paymentVerified: 10,
      spendHistory: 10,
      recencyAndCompetition: 5,
      subtotal: 25,
    },
    keywordsMatch: 10,
    businessImpact: 10,
    redFlags: 0,
  },
  isDuplicate: false,
  isRepost: false,
  estimatedPrice: 8000,
};

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTING RECOMMENDATION FILTERS');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('TEST 1: Clappia-like job (high scores, "highlights" not "GHL")');
console.log('Expected: RECOMMENDED (via High-Quality Exception)');
const result1 = applyRecommendationFilters(clappiaJob as any, DEFAULT_SETTINGS);
console.log(`Result: ${result1}\n`);
console.log('---\n');

console.log('TEST 2: Lead generation job');
console.log('Expected: NOT RECOMMENDED (Hard Exclusion - non-dev job)');
const result2 = applyRecommendationFilters(leadGenJob as any, DEFAULT_SETTINGS);
console.log(`Result: ${result2}\n`);
console.log('---\n');

console.log('TEST 3: Actual GHL job');
console.log('Expected: NOT RECOMMENDED (Soft Exclusion - excluded platform)');
const result3 = applyRecommendationFilters(ghlJob as any, DEFAULT_SETTINGS);
console.log(`Result: ${result3}\n`);
console.log('---\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('SUMMARY:');
console.log(`Clappia job: ${result1 === 'recommended' ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Lead gen job: ${result2 === 'not_recommended' ? '✅ PASS' : '❌ FAIL'}`);
console.log(`GHL job: ${result3 === 'not_recommended' ? '✅ PASS' : '❌ FAIL'}`);
console.log('═══════════════════════════════════════════════════════════════');
