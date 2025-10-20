import 'dotenv/config';
import { generateProposalWithClaude } from '../../lib/proposalGeneratorClaude';
import { DEFAULT_SETTINGS } from '../../types/settings';

/**
 * Test with a COMPLEX technical job (Blockchain/Solana)
 * This was the job that previously scored 4/10
 */

const complexJob = {
  upworkId: '~01blockchain',
  title: 'Solana Trading Bot with Helius Integration',
  description: `I'm looking for an experienced blockchain developer to build a Solana trading bot that monitors new token launches on Pump.fun and executes trades automatically.

Requirements:
- Real-time monitoring of Pump.fun smart contract events via Helius RPC
- Automated buy/sell execution based on configurable parameters
- MEV protection and slippage management
- Dashboard for monitoring bot performance, P&L tracking, and configuration
- Support for multiple wallets
- Error handling and logging

Tech Stack:
- Solana/Web3.js for blockchain interactions
- Helius RPC for reliable Websocket connections
- Python or Node.js for execution engine
- React for dashboard

Timeline: 4-6 weeks
Budget: Open for the right developer

This is a sophisticated project requiring deep knowledge of Solana blockchain, DeFi protocols, and trading bot architecture. Please only apply if you have proven experience in this space.`,
  url: 'https://www.upwork.com/jobs/~01blockchain',
  budget: 0,
  budgetType: 'negotiable' as const,
  budgetIsPlaceholder: false,
  client: {
    id: '~client_blockchain',
    name: 'DeFi Ventures',
    paymentVerified: true,
    totalSpent: 50000,
    totalHires: 12,
    location: 'United States',
    rating: 4.9,
    reviewCount: 10,
  },
  proposalsCount: 8,
  category: 'Web Development',
  experienceLevel: 'expert',
  postedAt: new Date(Date.now() - 3600000 * 6),
  fetchedAt: new Date(),
  status: 'fetched' as const,
  applied: false,
  won: false,
  isDuplicate: false,
  isRepost: false,
  scoreBreakdown: {
    ehrPotential: 15,
    jobClarity: 15,
    businessImpact: 10,
    skillsMatch: 10,
    clientQuality: 15,
    clientFit: 10,
  },
  estimatedEHR: 150,
};

/**
 * Assess complex technical proposal
 */
function assessComplexProposal(proposal: string): { score: number; feedback: string[] } {
  let score = 0;
  const feedback: string[] = [];

  console.log('\n📊 COMPLEX JOB PROPOSAL ASSESSMENT\n');
  console.log('═'.repeat(60));
  console.log('\n📝 GENERATED PROPOSAL:\n');
  console.log(proposal);
  console.log('\n' + '═'.repeat(60) + '\n');

  // 1. Technical Terms Extraction (0-2.5 pts)
  const technicalTerms = ['Solana', 'Helius', 'Pump.fun', 'MEV', 'Web3.js', 'RPC', 'DeFi', 'wallet'];
  let termsFound = 0;
  technicalTerms.forEach(term => {
    if (proposal.includes(term)) {
      termsFound++;
      feedback.push(`✅ Mentions ${term}`);
    } else {
      feedback.push(`❌ Missing ${term}`);
    }
  });
  const termScore = (termsFound / technicalTerms.length) * 2.5;
  score += termScore;
  console.log(`1️⃣ Technical Terms Coverage: ${termScore.toFixed(2)}/2.50 (${termsFound}/${technicalTerms.length} terms)`);

  // 2. Domain Expertise (0-2 pts)
  let expertiseScore = 0;
  if (proposal.match(/blockchain.*develop|Solana.*develop|Web3.*develop|DeFi.*develop/i)) {
    expertiseScore += 1.0;
    feedback.push('✅ Positions as blockchain/Web3 developer');
  } else {
    feedback.push('❌ Does NOT position as blockchain developer');
  }
  if (proposal.match(/trading.*bot|bot.*architect|automated.*trading/i)) {
    expertiseScore += 1.0;
    feedback.push('✅ Shows trading bot expertise');
  } else {
    feedback.push('❌ Missing trading bot positioning');
  }
  score += expertiseScore;
  console.log(`2️⃣ Domain Expertise: ${expertiseScore.toFixed(2)}/2.00`);

  // 3. Technical Methodology (0-2.5 pts)
  let methodologyScore = 0;
  const methodologyIndicators = [
    { pattern: /Helius.*WebSocket|WebSocket.*Helius|RPC.*connection/i, label: 'Helius WebSocket integration details' },
    { pattern: /MEV.*protect|slippage.*manag|frontrun/i, label: 'MEV protection implementation' },
    { pattern: /dashboard.*React|React.*dashboard|monitoring.*interface/i, label: 'Dashboard implementation' },
    { pattern: /execution.*engine|trading.*logic|buy.*sell.*logic/i, label: 'Trading execution logic' },
    { pattern: /multiple.*wallet|wallet.*management/i, label: 'Multi-wallet support' },
  ];

  methodologyIndicators.forEach(({ pattern, label }) => {
    if (proposal.match(pattern)) {
      methodologyScore += 0.5;
      feedback.push(`✅ Shows ${label}`);
    } else {
      feedback.push(`❌ Missing ${label}`);
    }
  });
  score += methodologyScore;
  console.log(`3️⃣ Technical Methodology: ${methodologyScore.toFixed(2)}/2.50`);

  // 4. Specific Deliverables (0-2 pts)
  const deliverables = ['Helius', 'dashboard', 'P&L', 'wallet', 'monitoring'];
  let deliverablesFound = 0;
  deliverables.forEach(item => {
    if (proposal.toLowerCase().includes(item.toLowerCase())) {
      deliverablesFound++;
    }
  });
  const deliverableScore = (deliverablesFound / deliverables.length) * 2.0;
  score += deliverableScore;
  feedback.push(`✓ Found ${deliverablesFound}/${deliverables.length} key deliverables`);
  console.log(`4️⃣ Specific Deliverables: ${deliverableScore.toFixed(2)}/2.00`);

  // 5. Pricing Appropriateness (0-1 pt)
  let pricingScore = 0;
  const priceMatch = proposal.match(/\$(\d+,?\d*)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1].replace(/,/g, ''));
    if (price >= 15000) {
      pricingScore = 1.0;
      feedback.push(`✅ Appropriate pricing ($${price.toLocaleString()}) for complex blockchain project`);
    } else {
      pricingScore = 0.3;
      feedback.push(`⚠️ Underpriced at $${price.toLocaleString()} (should be $15K-50K+)`);
    }
  } else {
    feedback.push('❌ No clear pricing provided');
  }
  score += pricingScore;
  console.log(`5️⃣ Pricing Appropriateness: ${pricingScore.toFixed(2)}/1.00`);

  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 FINAL SCORE: ${score.toFixed(2)}/10.00\n`);
  console.log('📋 DETAILED FEEDBACK:\n');
  feedback.forEach(item => console.log(`   ${item}`));
  console.log('\n' + '═'.repeat(60) + '\n');

  return { score: parseFloat(score.toFixed(2)), feedback };
}

async function runComplexTest() {
  console.log('🧪 Testing Complex Technical Job (Blockchain Trading Bot)\n');
  console.log('Job Title:', complexJob.title);
  console.log('\n🤖 Generating proposal with Claude...\n');

  try {
    const result = await generateProposalWithClaude(complexJob as any, DEFAULT_SETTINGS);
    const proposal = result.content;

    const assessment = assessComplexProposal(proposal);

    if (assessment.score >= 8.8) {
      console.log('✅ PASS: Complex proposal meets 8.8+ quality threshold');
      console.log(`\n🎯 This is a MAJOR improvement over the previous 4/10 score!`);
    } else {
      console.log(`❌ FAIL: Proposal scored ${assessment.score}/10 (below 8.8 threshold)`);
      console.log('\n💡 IMPROVEMENT AREAS IDENTIFIED');
    }

    return assessment;
  } catch (error) {
    console.error('❌ Error generating proposal:', error);
    throw error;
  }
}

runComplexTest();
