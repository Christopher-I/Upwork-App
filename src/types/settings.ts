export interface Settings {
  keywords: {
    wideNet: string[];
    webflow: string[];
    portals: string[];
    ecommerce: string[];
    speedSEO: string[];
    automation: string[];
    vertical: string[];
  };

  timeWindow: number;

  negativeKeywords: {
    enabled: boolean;
    terms: string[];
  };

  platformFilters: {
    paymentVerified: boolean;
    clientHistory: string;
    experienceLevel: string[];
    maxProposals: number;
    posted: 'last_24h' | 'last_48h' | 'last_7_days' | 'last_14_days' | 'last_30_days';
    location: string[];
    usOnly: boolean;
    englishOnly: boolean;
    excludeWordPress: boolean;
    excludeHiredJobs: boolean;
    minClientRating: number;
    minHourlyRate: number;
    sortBy: string;
  };

  minScore: number;
  minEHR: number;

  scoringWeights: {
    clientQuality: number;
    keywordsMatch: number;
    professionalSignals: number;
    businessImpact: number; // Was outcomeClarity
    jobClarity: number; // Was scopeFit
    ehrPotential: number;
    redFlagPenalty: number;
  };

  pricingBands: {
    launch: PricingBand;
    growth: PricingBand;
    portalLite: PricingBand;
  };

  userProfile: {
    name: string;
    website: string;
    portfolio: string;
    github: string;
    bio: string;
  };

  refreshSchedule: {
    enabled: boolean;
    timezone: string;
    times: string[];
  };

  dailyGoals: {
    proposalsTarget: number;
    minEHR: number;
    targetWinRate: number;
  };
}

export interface PricingBand {
  min: number;
  max: number;
  hoursMin: number;
  hoursMax: number;
}

export const DEFAULT_SETTINGS: Settings = {
  keywords: {
    wideNet: [
      'website redesign OR new website OR landing page',
      'React OR Vue OR Angular OR Next.js',
      'web development OR full stack',
    ],
    webflow: ['webflow OR web flow OR webflo'],
    portals: [
      'client portal OR customer portal OR member portal',
      'membership site OR member area OR dashboard',
      'secure login OR file sharing',
    ],
    ecommerce: [
      'shopify speed OR shopify optimization',
      'checkout optimization OR conversion optimization',
      'online booking OR appointment scheduling',
    ],
    speedSEO: [
      'core web vitals OR page speed OR site speed',
      'conversion rate optimization OR CRO OR A/B testing',
    ],
    automation: [
      'zapier OR make OR integromat',
      'gohighlevel OR GHL OR crm integration',
    ],
    vertical: [
      'video production portal OR clinic portal',
      'patient portal OR contractor website',
    ],
  },

  timeWindow: 60,

  negativeKeywords: {
    enabled: false,
    terms: [
      'wordpress',
      'wix',
      'squarespace',
      'elementor',
      'bug',
      'fix',
      'cheap',
      'quick',
      'install',
      'data entry',
    ],
  },

  platformFilters: {
    paymentVerified: true,
    clientHistory: 'has_spend_or_hires',
    experienceLevel: ['intermediate', 'expert'],
    maxProposals: 20,
    posted: 'last_7_days',
    location: ['US'],
    usOnly: true,
    englishOnly: true,
    excludeWordPress: true,
    excludeHiredJobs: true,
    minClientRating: 4,
    minHourlyRate: 20,
    sortBy: 'newest',
  },

  minScore: 80,
  minEHR: 70,

  scoringWeights: {
    clientQuality: 25,
    keywordsMatch: 15,
    professionalSignals: 10,
    businessImpact: 15, // Was outcomeClarity
    jobClarity: 15, // Was scopeFit
    ehrPotential: 15,
    redFlagPenalty: 10,
  },

  pricingBands: {
    launch: {
      min: 1800,
      max: 2400,
      hoursMin: 20,
      hoursMax: 25,
    },
    growth: {
      min: 3500,
      max: 5000,
      hoursMin: 35,
      hoursMax: 50,
    },
    portalLite: {
      min: 2500,
      max: 4000,
      hoursMin: 30,
      hoursMax: 40,
    },
  },

  userProfile: {
    name: 'Chris',
    website: 'chrisigbojekwe.com',
    portfolio: 'dribbble.com/chris-i',
    github: 'github.com/Christopher-I',
    bio: 'I specialize in Webflow sites, client portals, Shopify speed optimization, and simple automations with Zapier/Make/GHL.',
  },

  refreshSchedule: {
    enabled: true,
    timezone: 'America/Los_Angeles',
    times: ['08:00', '14:00'],
  },

  dailyGoals: {
    proposalsTarget: 7,
    minEHR: 70,
    targetWinRate: 0.3,
  },
};
