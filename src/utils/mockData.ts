import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateJobScore, applyHardFilters } from './scoring';
import { DEFAULT_SETTINGS } from '../types/settings';

/**
 * Add mock jobs to Firestore for testing
 */
export async function addMockJobs() {
  const mockJobs = [
    {
      upworkId: '~01mock123',
      title: 'Client Portal for Video Production Company',
      description:
        'We are a video production company looking to streamline our client communications. We need a secure client portal where our clients can view project status, download files, and submit feedback. Our team handles 20+ active projects and email is becoming unmanageable. Need secure login, file sharing, and a clean dashboard. Looking for an expert who can help us launch this.',
      url: 'https://www.upwork.com/jobs/~01mock123',
      postedAt: new Date(Date.now() - 3600000 * 6), // 6 hours ago
      fetchedAt: new Date(),
      budget: 0,
      budgetType: 'negotiable' as const,
      budgetIsPlaceholder: false,
      client: {
        id: '~client001',
        name: 'VideoWorks LLC',
        paymentVerified: true,
        totalSpent: 12000,
        totalHires: 15,
        location: 'United States',
        rating: 4.8,
        reviewCount: 12,
      },
      proposalsCount: 3,
      category: 'Web Development',
      experienceLevel: 'expert',
      status: 'fetched' as const,
      applied: false,
      won: false,
      isDuplicate: false,
      isRepost: false,
    },
    {
      upworkId: '~01mock124',
      title: 'Webflow Site Redesign for SaaS Startup',
      description:
        'Our startup needs a professional Webflow site redesign to generate more leads. We have funding and are ready to move. Need 8-10 pages, blog, CMS setup, conversion rate optimization, and page speed improvements. Timeline: 3-4 weeks. We want to improve our customer conversions.',
      url: 'https://www.upwork.com/jobs/~01mock124',
      postedAt: new Date(Date.now() - 3600000 * 12), // 12 hours ago
      fetchedAt: new Date(),
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
      status: 'fetched' as const,
      applied: false,
      won: false,
      isDuplicate: false,
      isRepost: false,
    },
    {
      upworkId: '~01mock125',
      title: 'Need Quick WordPress Fix',
      description:
        'I need someone to fix a bug on my WordPress site. Quick job, should take 1-2 hours max. My budget is tight so looking for cheap.',
      url: 'https://www.upwork.com/jobs/~01mock125',
      postedAt: new Date(Date.now() - 3600000 * 24), // 24 hours ago
      fetchedAt: new Date(),
      budget: 50,
      budgetType: 'fixed' as const,
      budgetIsPlaceholder: false,
      client: {
        id: '~client003',
        name: 'John D.',
        paymentVerified: false,
        totalSpent: 0,
        totalHires: 0,
        location: 'Unknown',
        rating: 0,
        reviewCount: 0,
      },
      proposalsCount: 25,
      category: 'Web Development',
      experienceLevel: 'entry',
      status: 'fetched' as const,
      applied: false,
      won: false,
      isDuplicate: false,
      isRepost: false,
    },
    {
      upworkId: '~01mock126',
      title: 'Landing Page for New Real Estate Company',
      description:
        'We are launching a new real estate company and need a professional landing page to generate leads. Our team wants something clean and modern with lead capture forms. We need page speed optimization and mobile responsiveness. Budget is open - we value quality over price. Timeline is flexible.',
      url: 'https://www.upwork.com/jobs/~01mock126',
      postedAt: new Date(Date.now() - 3600000 * 8), // 8 hours ago
      fetchedAt: new Date(),
      budget: 0,
      budgetType: 'negotiable' as const,
      budgetIsPlaceholder: false,
      client: {
        id: '~client004',
        name: 'Skyline Realty Group',
        paymentVerified: true,
        totalSpent: 0, // NEW CLIENT - no history yet!
        totalHires: 0,
        location: 'United States',
        rating: 0,
        reviewCount: 0,
      },
      proposalsCount: 2,
      category: 'Web Development',
      experienceLevel: 'expert',
      status: 'fetched' as const,
      applied: false,
      won: false,
      isDuplicate: false,
      isRepost: false,
    },
  ];

  console.log('🔄 Adding mock jobs to Firestore with ChatGPT scoring...\n');

  for (const mockJob of mockJobs) {
    console.log(`\n📝 Processing: ${mockJob.title}`);
    console.log(`   Budget: ${mockJob.budget > 0 ? `$${mockJob.budget}` : 'Not specified'}`);

    try {
      // Calculate score with ChatGPT (will fallback to rules if API fails)
      const { total, breakdown } = await calculateJobScore(mockJob, DEFAULT_SETTINGS, true);

      const jobWithScore = {
        ...mockJob,
        score: total,
        scoreBreakdown: breakdown,
      };

      // Apply hard filters
      const classification = applyHardFilters(
        jobWithScore as any,
        DEFAULT_SETTINGS
      );

      const finalJob = {
        ...jobWithScore,
        autoClassification: classification,
        finalClassification: classification,
        scoredAt: Timestamp.now(),
        postedAt: Timestamp.fromDate(jobWithScore.postedAt),
        fetchedAt: Timestamp.fromDate(jobWithScore.fetchedAt),
        status: 'scored',
      };

      await addDoc(collection(db, 'jobs'), finalJob);
      console.log(`   ✅ Score: ${total}/100 (${classification})`);

      // Show AI-powered dimensions
      if (jobWithScore.estimatedEHR) {
        console.log(`   💰 EHR: $${jobWithScore.estimatedEHR}/hr (${breakdown.ehrPotential}/15)`);
      }
      if (jobWithScore.jobClarity) {
        console.log(`   📦 Clarity: ${jobWithScore.jobClarity.total} boxes (${breakdown.jobClarity}/15)`);
      }
      if (jobWithScore.detectedOutcomes) {
        console.log(`   🎯 Impact: ${jobWithScore.detectedOutcomes.length} outcomes (${breakdown.businessImpact}/15)`);
      }

    } catch (error) {
      console.error(`   ❌ Error processing ${mockJob.title}:`, error);
      throw error;
    }
  }

  console.log('\n✅ Mock data added successfully with ChatGPT scoring!');
}
