import { scoreJobWithChatGPT } from '../lib/openai';

/**
 * Test ChatGPT scoring with sample job posts
 * Run this to validate prompt engineering before production use
 */
export async function testChatGPTScoring() {
  console.log('🧪 Testing ChatGPT Scoring Prompts...\n');

  const testCases = [
    {
      name: 'High Quality Job (Client Portal)',
      title: 'Client Portal for Video Production Company',
      description: `We are a video production company looking to streamline our client communications.
We need a secure client portal where our clients can view project status, download files, and submit feedback.
Our team handles 20+ active projects and email is becoming unmanageable.
Need secure login, file sharing, and a clean dashboard. Looking for an expert who can help us launch this.`,
      budget: 0,
      budgetType: 'negotiable' as const,
      expectedScores: {
        ehrPotential: '12-15 (should estimate $3000-4000 for 30-40 hours = $80-100/hr)',
        jobClarity: '14-15 (portal, dashboard, login, file sharing, clean = 5+ signals)',
        businessImpact: '15 (streamline, team, clients, communications = strong business focus)',
      },
    },
    {
      name: 'Medium Quality Job (Landing Page)',
      title: 'Landing Page for New Real Estate Company',
      description: `We are launching a new real estate company and need a professional landing page to generate leads.
Our team wants something clean and modern with lead capture forms.
We need page speed optimization and mobile responsiveness. Budget is open - we value quality over price.`,
      budget: 0,
      budgetType: 'negotiable' as const,
      expectedScores: {
        ehrPotential: '12-15 (should estimate $2000-3000 for 20-25 hours = $80-100/hr)',
        jobClarity: '14-15 (landing page, forms, page speed, mobile, responsive, clean, modern, professional = 8 signals)',
        businessImpact: '12-13 (generate leads, our team = revenue focus)',
      },
    },
    {
      name: 'Technical-Only Job (Developer Search)',
      title: 'Need React Developer',
      description: `Looking for React developer with 5+ years experience. Must know JavaScript ES6, Node.js, and REST APIs.
Need someone proficient in modern web development. Experience with TypeScript is a plus.`,
      budget: 3000,
      budgetType: 'fixed' as const,
      expectedScores: {
        ehrPotential: '7-10 (fixed $3000, but unclear hours, probably 40-60 hrs = $50-75/hr)',
        jobClarity: '7-10 (mentions some tech but vague on actual deliverables)',
        businessImpact: '0 (technical-only flags: "need developer", "looking for", "must know", no business context)',
      },
    },
    {
      name: 'Low Quality Job (Quick Fix)',
      title: 'Need Quick WordPress Fix',
      description: `I need someone to fix a bug on my WordPress site. Quick job, should take 1-2 hours max.
My budget is tight so looking for cheap.`,
      budget: 50,
      budgetType: 'fixed' as const,
      expectedScores: {
        ehrPotential: '3 ($50 / 2 hours = $25/hr - very low)',
        jobClarity: '3-7 (mentions WordPress but very vague)',
        businessImpact: '0 (no business outcomes, just "fix bug")',
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 TEST: ${testCase.name}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Title: ${testCase.title}`);
    console.log(`Budget: ${testCase.budget > 0 ? `$${testCase.budget} (${testCase.budgetType})` : 'Not specified'}`);
    console.log(`\nDescription Preview: ${testCase.description.substring(0, 100)}...`);

    console.log(`\n📊 EXPECTED SCORES:`);
    console.log(`  EHR Potential: ${testCase.expectedScores.ehrPotential}`);
    console.log(`  Job Clarity: ${testCase.expectedScores.jobClarity}`);
    console.log(`  Business Impact: ${testCase.expectedScores.businessImpact}`);

    try {
      console.log(`\n⏳ Calling ChatGPT...`);
      const result = await scoreJobWithChatGPT(
        testCase.title,
        testCase.description,
        testCase.budget,
        testCase.budgetType
      );

      console.log(`\n✅ ACTUAL SCORES:`);

      console.log(`\n1️⃣ EHR POTENTIAL: ${result.ehrPotential.score}/15`);
      console.log(`   Price: $${result.ehrPotential.estimatedPrice}`);
      console.log(`   Hours: ${result.ehrPotential.estimatedHours}`);
      console.log(`   EHR: $${result.ehrPotential.estimatedEHR}/hr`);
      console.log(`   Reasoning: ${result.ehrPotential.reasoning}`);

      console.log(`\n2️⃣ JOB CLARITY: ${result.jobClarity.score}/15`);
      console.log(`   Technical: ${result.jobClarity.technicalMatches}`);
      console.log(`   Clarity: ${result.jobClarity.clarityMatches}`);
      console.log(`   Total: ${result.jobClarity.totalMatches} boxes ticked`);
      console.log(`   Reasoning: ${result.jobClarity.reasoning}`);

      console.log(`\n3️⃣ BUSINESS IMPACT: ${result.businessImpact.score}/15`);
      console.log(`   Outcomes: ${result.businessImpact.detectedOutcomes.join(', ')}`);
      console.log(`   Technical-Only: ${result.businessImpact.isTechnicalOnly ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   Reasoning: ${result.businessImpact.reasoning}`);

      console.log(`\n💯 TOTAL SCORE (these 3 dimensions): ${result.ehrPotential.score + result.jobClarity.score + result.businessImpact.score}/45`);

    } catch (error) {
      console.error(`\n❌ ERROR:`, error);
    }

    // Wait 1 second between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ Testing Complete!`);
  console.log(`${'='.repeat(80)}\n`);
}

/**
 * Quick single job test
 */
export async function testSingleJob(
  title: string,
  description: string,
  budget: number = 0,
  budgetType: 'fixed' | 'hourly' | 'negotiable' = 'negotiable'
) {
  console.log('🧪 Testing Single Job...\n');
  console.log(`Title: ${title}`);
  console.log(`Budget: ${budget > 0 ? `$${budget} (${budgetType})` : 'Not specified'}\n`);

  try {
    const result = await scoreJobWithChatGPT(title, description, budget, budgetType);

    console.log(`✅ RESULTS:\n`);
    console.log(`EHR Potential: ${result.ehrPotential.score}/15 ($${result.ehrPotential.estimatedEHR}/hr)`);
    console.log(`Job Clarity: ${result.jobClarity.score}/15 (${result.jobClarity.totalMatches} boxes)`);
    console.log(`Business Impact: ${result.businessImpact.score}/15`);
    console.log(`\nTotal: ${result.ehrPotential.score + result.jobClarity.score + result.businessImpact.score}/45\n`);

    return result;
  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  }
}
