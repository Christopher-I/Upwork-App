import 'dotenv/config';
import { generateProposalWithClaude } from '../lib/proposalGeneratorClaude';
import { DEFAULT_SETTINGS } from '../types/settings';

/**
 * Test proposal generation quality
 * Generate proposal and assess on 0-10 scale
 */

// Test job: Webflow Site Redesign for SaaS Startup
const testJob = {
  upworkId: '~01mock124',
  title: 'Webflow Site Redesign for SaaS Startup',
  description:
    'Our startup needs a professional Webflow site redesign to generate more leads. We have funding and are ready to move. Need 8-10 pages, blog, CMS setup, conversion rate optimization, and page speed improvements. Timeline: 3-4 weeks. We want to improve our customer conversions.',
  url: 'https://www.upwork.com/jobs/~01mock124',
  budget: 4000,
  budgetType: 'fixed' as const,
  budgetIsPlaceholder: false,
  client: {
    id: '~client002',
    name: 'TechFlow SaaS',
    paymentVerified: true,
    totalSpent: 8000,
    totalHires: 8,
    location: 'United States',
    rating: 4.9,
    reviewCount: 7,
  },
  proposalsCount: 4,
  category: 'Web Development',
  experienceLevel: 'expert',
  postedAt: new Date(Date.now() - 3600000 * 12),
  fetchedAt: new Date(),
  status: 'fetched' as const,
  applied: false,
  won: false,
  isDuplicate: false,
  isRepost: false,
  // Scores (pre-calculated for testing)
  scoreBreakdown: {
    ehrPotential: 13,
    jobClarity: 14,
    businessImpact: 13,
    skillsMatch: 15,
    clientQuality: 12,
    clientFit: 8,
  },
  estimatedEHR: 85,
};

/**
 * Assess proposal quality on 0-10 scale
 *
 * Criteria:
 * 1. Hyper-Specific Positioning (0-2 pts)
 *    - Uses exact domain/industry from job
 *    - Mentions specific tech stack
 *    - No generic "I help businesses" language
 *
 * 2. Technical Depth (0-3 pts)
 *    - Extracts ALL technical terms from job
 *    - Shows expertise through details
 *    - No surface-level mentions
 *
 * 3. Methodology/Process (0-2 pts)
 *    - Describes HOW, not just WHAT
 *    - Step-by-step approach
 *    - Implementation details
 *
 * 4. Specific Deliverables (0-2 pts)
 *    - Lists 3-5 deliverables from job
 *    - Matches job requirements exactly
 *    - Not generic "I will build X"
 *
 * 5. No Generic Language (0-1 pt)
 *    - Every sentence job-specific
 *    - Could NOT apply to other jobs
 *    - Zero template language
 */
function assessProposal(proposal: string, jobDescription: string): { score: number; feedback: string } {
  let score = 0;
  const feedback: string[] = [];

  // Extract job requirements for matching
  const jobRequirements = {
    platform: 'Webflow',
    deliverables: ['8-10 pages', 'blog', 'CMS setup', 'conversion rate optimization', 'page speed improvements'],
    outcome: 'generate more leads',
    timeline: '3-4 weeks',
    industry: 'SaaS startup',
  };

  console.log('\n📊 PROPOSAL QUALITY ASSESSMENT\n');
  console.log('═'.repeat(60));
  console.log('\n📝 GENERATED PROPOSAL:\n');
  console.log(proposal);
  console.log('\n' + '═'.repeat(60) + '\n');

  // 1. Hyper-Specific Positioning (0-2 pts)
  let positioningScore = 0;
  if (proposal.includes('SaaS')) {
    positioningScore += 0.5;
    feedback.push('✅ Mentions SaaS industry');
  } else {
    feedback.push('❌ Missing "SaaS" industry mention');
  }
  if (proposal.includes('Webflow')) {
    positioningScore += 0.5;
    feedback.push('✅ Mentions Webflow platform');
  } else {
    feedback.push('❌ Missing "Webflow" platform mention');
  }
  if (proposal.includes('startup') || proposal.includes('funded')) {
    positioningScore += 0.5;
    feedback.push('✅ Acknowledges startup context');
  } else {
    feedback.push('❌ Missing startup/funded context');
  }
  if (!proposal.includes('I help businesses') && !proposal.includes('I help companies')) {
    positioningScore += 0.5;
    feedback.push('✅ No generic "I help businesses" language');
  } else {
    feedback.push('❌ Contains generic positioning language');
  }
  score += positioningScore;
  console.log(`1️⃣ Hyper-Specific Positioning: ${positioningScore.toFixed(1)}/2.0`);

  // 2. Technical Depth (0-3 pts)
  let technicalScore = 0;
  const technicalTerms = ['CMS', 'conversion', 'page speed', 'blog'];
  let termsFound = 0;
  technicalTerms.forEach(term => {
    if (proposal.toLowerCase().includes(term.toLowerCase())) {
      termsFound++;
    }
  });
  technicalScore += (termsFound / technicalTerms.length) * 1.5; // 1.5 pts for term coverage
  feedback.push(`✓ Found ${termsFound}/${technicalTerms.length} technical terms`);

  // Check for technical depth (not just mentions)
  if (proposal.match(/conversion.*optim|CRO|conversion rate/i)) {
    technicalScore += 0.5;
    feedback.push('✅ Shows conversion optimization expertise');
  } else {
    feedback.push('❌ Missing conversion optimization depth');
  }
  if (proposal.match(/page speed|performance|Core Web Vitals|loading/i)) {
    technicalScore += 0.5;
    feedback.push('✅ Shows page speed expertise');
  } else {
    feedback.push('❌ Missing page speed depth');
  }
  if (proposal.match(/CMS.*setup|Webflow.*CMS|dynamic.*content/i)) {
    technicalScore += 0.5;
    feedback.push('✅ Shows CMS expertise');
  } else {
    feedback.push('❌ Missing CMS implementation details');
  }
  score += Math.min(technicalScore, 3);
  console.log(`2️⃣ Technical Depth: ${Math.min(technicalScore, 3).toFixed(1)}/3.0`);

  // 3. Methodology/Process (0-2 pts)
  let methodologyScore = 0;

  // Check for numbered deliverables format (BEST indicator of clear process)
  if (proposal.match(/1\).*2\).*3\)/)) {
    methodologyScore += 1.5;
    feedback.push('✅ Shows clear process with numbered deliverables');
  } else {
    const processIndicators = [
      /first.*then|start.*by|begin.*with/i,
      /phase|step|stage|process/i,
      /implement|build|create|design/i,
    ];
    let processFound = 0;
    processIndicators.forEach(pattern => {
      if (proposal.match(pattern)) {
        processFound++;
      }
    });
    if (processFound >= 2) {
      methodologyScore += 1.0;
      feedback.push('✅ Shows clear process/methodology');
    } else {
      feedback.push('❌ Missing clear process description');
    }
  }

  // Check for references specific page count
  if (proposal.match(/\d+\s*pages?|\d+-\d+\s*pages?/i)) {
    methodologyScore += 0.5;
    feedback.push('✅ References specific page count');
  }
  score += Math.min(methodologyScore, 2);
  console.log(`3️⃣ Methodology/Process: ${Math.min(methodologyScore, 2).toFixed(1)}/2.0`);

  // 4. Specific Deliverables (0-2 pts)
  let deliverablesScore = 0;
  const deliverables = ['blog', 'CMS', '8-10 pages', 'conversion', 'page speed'];
  let deliverablesFound = 0;
  deliverables.forEach(item => {
    if (proposal.toLowerCase().includes(item.toLowerCase())) {
      deliverablesFound++;
    }
  });
  deliverablesScore = (deliverablesFound / deliverables.length) * 2;
  feedback.push(`✓ Found ${deliverablesFound}/${deliverables.length} deliverables from job`);
  if (deliverablesFound < 3) {
    feedback.push('❌ Missing key deliverables from job description');
  }
  score += deliverablesScore;
  console.log(`4️⃣ Specific Deliverables: ${deliverablesScore.toFixed(1)}/2.0`);

  // 5. No Generic Language (0-1 pt)
  let genericScore = 1.0;
  const genericPhrases = [
    /I help (businesses|companies|teams) (build|create|design)/i,
    /I can help you/i,
    /I would love to/i,
    /I'm excited to/i,
    /perfect fit/i,
    /ideal candidate/i,
  ];
  let genericFound = 0;
  genericPhrases.forEach(pattern => {
    if (proposal.match(pattern)) {
      genericFound++;
    }
  });
  if (genericFound > 0) {
    genericScore = Math.max(0, 1.0 - (genericFound * 0.3));
    feedback.push(`❌ Found ${genericFound} generic phrases`);
  } else {
    feedback.push('✅ No generic template language detected');
  }
  score += genericScore;
  console.log(`5️⃣ No Generic Language: ${genericScore.toFixed(1)}/1.0`);

  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 FINAL SCORE: ${score.toFixed(2)}/10.00\n`);
  console.log('📋 DETAILED FEEDBACK:\n');
  feedback.forEach(item => console.log(`   ${item}`));
  console.log('\n' + '═'.repeat(60) + '\n');

  return {
    score: parseFloat(score.toFixed(2)),
    feedback: feedback.join('\n'),
  };
}

async function runTest() {
  console.log('🧪 Testing Proposal Quality\n');
  console.log('Job Title:', testJob.title);
  console.log('Job Description:', testJob.description);
  console.log('\n🤖 Generating proposal with Claude...\n');

  try {
    const result = await generateProposalWithClaude(testJob as any, DEFAULT_SETTINGS);
    const proposal = result.content;

    const assessment = assessProposal(proposal, testJob.description);

    if (assessment.score >= 8.8) {
      console.log('✅ PASS: Proposal meets 8.8+ quality threshold');
    } else {
      console.log(`❌ FAIL: Proposal scored ${assessment.score}/10 (below 8.8 threshold)`);
      console.log('\n💡 IMPROVEMENT AREAS:');
      console.log(assessment.feedback);
    }

    return assessment;
  } catch (error) {
    console.error('❌ Error generating proposal:', error);
    throw error;
  }
}

runTest();
