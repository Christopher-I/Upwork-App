import 'dotenv/config';
import { calculateJobScore } from '../utils/scoring';
import { DEFAULT_SETTINGS } from '../types/settings';

/**
 * Test pricing estimation for various job types
 * This verifies that:
 * 1. Claude AI provides accurate market-based pricing
 * 2. Fallback pricing uses realistic market values
 */

const testJobs = [
  {
    name: 'Simple Landing Page',
    job: {
      title: 'Simple Landing Page for Startup',
      description: 'Need a simple landing page with contact form. Just 1-2 pages.',
      budget: 0,
      budgetType: 'negotiable' as const,
    },
    expectedPrice: { min: 1500, max: 3000 },
    expectedHours: { min: 15, max: 30 },
  },
  {
    name: 'Small Business Website',
    job: {
      title: 'Website Redesign for Local Business',
      description: 'We need a 5-10 page website redesign with blog and CMS. Responsive design required.',
      budget: 0,
      budgetType: 'negotiable' as const,
    },
    expectedPrice: { min: 3000, max: 8000 },
    expectedHours: { min: 30, max: 60 },
  },
  {
    name: 'E-commerce Site',
    job: {
      title: 'Shopify E-commerce Store Setup',
      description: 'Need an ecommerce site built on Shopify with custom theme, 50+ products, and payment integration.',
      budget: 0,
      budgetType: 'negotiable' as const,
    },
    expectedPrice: { min: 5000, max: 15000 },
    expectedHours: { min: 60, max: 120 },
  },
  {
    name: 'Custom Portal',
    job: {
      title: 'Client Portal with Dashboard',
      description: 'Build a custom portal with user authentication, dashboard, admin panel, and integration with our CRM.',
      budget: 0,
      budgetType: 'negotiable' as const,
    },
    expectedPrice: { min: 8000, max: 25000 },
    expectedHours: { min: 80, max: 200 },
  },
  {
    name: 'Complex Platform',
    job: {
      title: 'SaaS Platform with Multiple Integrations',
      description: 'Building a multi-tenant SaaS platform with API integrations, payment processing, real-time features, authentication system, and admin dashboard.',
      budget: 0,
      budgetType: 'negotiable' as const,
    },
    expectedPrice: { min: 15000, max: 50000 },
    expectedHours: { min: 200, max: 400 },
  },
  {
    name: 'Sales Infrastructure (User Example)',
    job: {
      title: 'Sales Infrastructure with Automation',
      description: 'We are seeking a developer to build our sales infrastructure including CRM integration, automation workflows, and custom dashboard for tracking sales performance.',
      budget: 0,
      budgetType: 'negotiable' as const,
    },
    expectedPrice: { min: 8000, max: 20000 },
    expectedHours: { min: 80, max: 150 },
  },
];

async function runPricingTests() {
  console.log('\n🧪 PRICING ESTIMATION TEST\n');
  console.log('═'.repeat(80));
  console.log('\nTesting both AI-based pricing (Claude) and fallback pricing\n');
  console.log('Expected ranges based on Fair Market Value guidelines:\n');

  for (const test of testJobs) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`\n📋 ${test.name.toUpperCase()}`);
    console.log(`   Job: ${test.job.title}`);
    console.log(`   Expected Price: $${test.expectedPrice.min.toLocaleString()} - $${test.expectedPrice.max.toLocaleString()}`);
    console.log(`   Expected Hours: ${test.expectedHours.min} - ${test.expectedHours.max} hours`);

    try {
      // Test WITH AI (Claude)
      console.log('\n   🤖 Testing with Claude AI:');
      const resultWithAI = await calculateJobScore(test.job as any, DEFAULT_SETTINGS, true);
      const jobWithAI = test.job as any;

      if (jobWithAI.estimatedPrice && jobWithAI.estimatedHours) {
        const priceInRange = jobWithAI.estimatedPrice >= test.expectedPrice.min && jobWithAI.estimatedPrice <= test.expectedPrice.max;
        const hoursInRange = jobWithAI.estimatedHours >= test.expectedHours.min && jobWithAI.estimatedHours <= test.expectedHours.max;

        console.log(`      Price: $${jobWithAI.estimatedPrice.toLocaleString()} ${priceInRange ? '✅' : '⚠️'}`);
        console.log(`      Hours: ${jobWithAI.estimatedHours} hours ${hoursInRange ? '✅' : '⚠️'}`);
        console.log(`      EHR: $${Math.round(jobWithAI.estimatedEHR)}/hr`);
      } else {
        console.log('      ❌ AI pricing failed, using fallback');
      }

      // Test WITHOUT AI (Fallback)
      console.log('\n   🔧 Testing fallback pricing (no AI):');
      const resultWithoutAI = await calculateJobScore({ ...test.job } as any, DEFAULT_SETTINGS, false);
      const jobWithoutAI = { ...test.job } as any;

      if (jobWithoutAI.estimatedPrice && jobWithoutAI.estimatedHours) {
        const priceInRange = jobWithoutAI.estimatedPrice >= test.expectedPrice.min && jobWithoutAI.estimatedPrice <= test.expectedPrice.max;
        const hoursInRange = jobWithoutAI.estimatedHours >= test.expectedHours.min && jobWithoutAI.estimatedHours <= test.expectedHours.max;

        console.log(`      Price: $${jobWithoutAI.estimatedPrice.toLocaleString()} ${priceInRange ? '✅' : '⚠️'}`);
        console.log(`      Hours: ${jobWithoutAI.estimatedHours} hours ${hoursInRange ? '✅' : '⚠️'}`);
        console.log(`      EHR: $${Math.round(jobWithoutAI.estimatedEHR)}/hr`);
      }

    } catch (error) {
      console.error(`      ❌ Error testing ${test.name}:`, error);
    }
  }

  console.log(`\n${'═'.repeat(80)}\n`);
  console.log('✅ Testing complete!\n');
  console.log('📊 Summary:');
  console.log('   - Claude AI should provide the most accurate pricing');
  console.log('   - Fallback pricing now uses market-standard values');
  console.log('   - Both methods should fall within expected ranges\n');
}

runPricingTests().catch(console.error);
