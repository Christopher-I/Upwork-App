/**
 * Test script to verify pricing estimates for high-value jobs
 * Run with: npx tsx src/utils/testPricingEstimates.ts
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import { analyzePricing } from '../services/jobAnalyzer';
import { JobAnalysisInput } from '../types/jobAnalyzer';

async function testPricing() {
  console.log('\n=== TESTING PRICING ESTIMATES ===\n');

  // Test 1: Caribbean Government Job (Expected: $50K+)
  const caribbeanJob: JobAnalysisInput = {
    description: `Interactive online platform to track climate change resilience metrics for Caribbean government.

Features Required:
- Content Management System (CMS)
- Visual scorecard display
- Interactive database
- Decision-making tool
- Analytics and reporting

Requirements:
- Must have degree in relevant field
- Years of professional experience required
- Previous government client experience
- Ability to work with multiple stakeholders (investors + government officials)

Technical Requirements:
- Scalable architecture
- Secure infrastructure
- Open source technologies preferred
- Multi-stakeholder coordination capabilities

Project involves complex feature set including CMS, visual scorecard, interactive database, and analytics platform. Must be able to handle sensitive government data and meet compliance requirements.`,
    budgetType: 'fixed',
    budgetMin: 0, // No budget stated
  };

  console.log('🏛️  Test 1: Caribbean Government Platform');
  console.log('Expected: $50,000+');
  console.log('Analyzing...\n');

  const result1 = await analyzePricing(caribbeanJob);

  console.log('Results:');
  console.log(`  Recommended Price: $${result1.recommendedPrice?.toLocaleString() || 'N/A'}`);
  console.log(`  Estimated Hours: ${result1.estimatedHours}`);
  console.log(`  Hourly Rate Range: $${result1.minRate} - $${result1.maxRate}`);
  console.log(`  Confidence: ${result1.confidenceLevel}`);
  console.log(`  Complexity: ${result1.factors.complexity}/10`);
  console.log(`  Scope Clarity: ${result1.factors.scopeClarity}/10`);
  console.log(`\n  Reasoning: ${result1.reasoning}`);

  const pass1 = result1.recommendedPrice && result1.recommendedPrice >= 50000;
  console.log(`\n  ✅ PASS: $${result1.recommendedPrice?.toLocaleString()} >= $50,000` || '❌ FAIL: Below $50,000');

  // Test 2: Webflow LMS Agency Job (Expected: $70K+)
  const webflowLmsJob: JobAnalysisInput = {
    description: `My team and I have a client that needs custom learning management system site.

Background:
- Already have mockups and tons of content prepared
- Client has invested significantly in planning phase
- Looking to transform Webflow LMS template but with extensive customizations

Custom Requirements:
- Beyond standard template functionality
- Additional features we want to implement
- Custom integrations needed

Requirements:
- US-based developer only
- Must have experience with similar educational/training platforms
- Agency will provide ongoing support, need reliable partner

This is for our client, so quality and professionalism are critical. Budget is flexible for the right developer.`,
    budgetType: 'fixed',
    budgetMin: 0,
  };

  console.log('\n\n📚 Test 2: Agency Custom LMS Platform');
  console.log('Expected: $70,000+');
  console.log('Analyzing...\n');

  const result2 = await analyzePricing(webflowLmsJob);

  console.log('Results:');
  console.log(`  Recommended Price: $${result2.recommendedPrice?.toLocaleString() || 'N/A'}`);
  console.log(`  Estimated Hours: ${result2.estimatedHours}`);
  console.log(`  Hourly Rate Range: $${result2.minRate} - $${result2.maxRate}`);
  console.log(`  Confidence: ${result2.confidenceLevel}`);
  console.log(`  Complexity: ${result2.factors.complexity}/10`);
  console.log(`  Scope Clarity: ${result2.factors.scopeClarity}/10`);
  console.log(`\n  Reasoning: ${result2.reasoning}`);

  const pass2 = result2.recommendedPrice && result2.recommendedPrice >= 70000;
  console.log(`\n  ${pass2 ? '✅ PASS' : '❌ FAIL'}: $${result2.recommendedPrice?.toLocaleString()} ${pass2 ? '>=' : '<'} $70,000`);

  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log(`Caribbean Government Job: ${pass1 ? '✅ PASS' : '❌ FAIL'} ($${result1.recommendedPrice?.toLocaleString()})`);
  console.log(`Webflow LMS Agency Job: ${pass2 ? '✅ PASS' : '❌ FAIL'} ($${result2.recommendedPrice?.toLocaleString()})`);
  console.log('\n');
}

testPricing().catch(console.error);
