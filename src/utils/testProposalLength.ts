/**
 * Test script to verify proposal word length is 80 words or less
 * Run with: npx tsx src/utils/testProposalLength.ts
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import { generateProposalWithClaude } from '../services/proposals/claude.generator';

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

async function testProposalLength() {
  console.log('\n=== TESTING PROPOSAL LENGTH ===\n');

  const testJob: any = {
    id: 'test-1',
    title: 'Client Portal for Video Production Company',
    description: `We are a video production company looking to streamline our client communications. We need a secure portal where our clients can view project status, download files, and submit feedback. Our team handles 20+ active projects and email is becoming unmanageable.

Requirements:
- Secure login for clients
- Project status dashboard
- File upload/download
- Feedback system
- Mobile responsive

We're looking for someone with experience building client portals and can start immediately.`,
    budgetType: 'fixed',
    budget: 5000,
    estimatedPrice: 8000,
    estimatedHours: 80,
    score: 85,
    client: {
      id: 'client-1',
      name: 'VideoWorks LLC',
      paymentVerified: true,
      totalSpent: 12000,
      totalHires: 15,
      location: 'United States',
      rating: 4.8,
      reviewCount: 12,
    },
    proposalsCount: 5,
    category: 'Web Development',
    experienceLevel: 'expert',
    tags: ['React', 'Node.js', 'Custom Portal'],
  };

  const settings = {
    profile: {
      name: 'Chris',
      coreSkills: ['React', 'Node.js', 'TypeScript', 'Webflow'],
      flaggedPlatforms: ['Webflow', 'Custom Development'],
      yearsExperience: 10,
      timezone: 'EST',
    },
    userProfile: {
      name: 'Chris',
      website: 'https://example.com',
      bio: 'Full-stack developer specializing in custom web applications',
    },
    proposals: {
      maxLength: 80,
      tone: 'professional',
    },
    pricingBands: {
      launch: { min: 1500, max: 2500, hoursMin: 15, hoursMax: 25 },
      growth: { min: 2500, max: 5000, hoursMin: 25, hoursMax: 50 },
      portalLite: { min: 5000, max: 15000, hoursMin: 50, hoursMax: 150 },
    },
  };

  console.log('Test Job:', testJob.title);
  console.log('Generating proposal...\n');

  try {
    const result = await generateProposalWithClaude(
      testJob,
      settings as any
    );

    const proposal = result.content;

    const wordCount = countWords(proposal);
    const pass = wordCount <= 80;

    console.log('Generated Proposal:');
    console.log('─'.repeat(80));
    console.log(proposal);
    console.log('─'.repeat(80));
    console.log(`\nWord Count: ${wordCount}`);
    console.log(`Target: 80 words or less`);
    console.log(`\n${pass ? '✅ PASS' : '❌ FAIL'}: ${wordCount} ${pass ? '<=' : '>'} 80 words\n`);

    if (!pass) {
      console.log('⚠️  Proposal exceeds 80-word limit by', wordCount - 80, 'words\n');
    }

    return pass;
  } catch (error) {
    console.error('❌ Error generating proposal:', error);
    return false;
  }
}

testProposalLength().catch(console.error);
