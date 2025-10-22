export interface Settings {
  keywords: {
    wideNet: string[];
    webflow: string[];
    portals: string[];
    ecommerce: string[];
    speedSEO: string[];
    automation: string[];
    vertical: string[];
    appDevelopment: string[];
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
    minFixedPrice: number;
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
    // CRITICAL: Using simple keywords without OR operators
    // Upwork's titleExpression_eq uses EXACT MATCH, not OR logic
    // Each search term is run separately and results are combined
    wideNet: [
      'website',
      'web development',
      'landing page',
      'web app',
      'React',
      'Vue',
      'Next.js',
    ],
    webflow: [
      'webflow',
      'web flow',
    ],
    portals: [
      'client portal',
      'customer portal',
      'member portal',
      'membership site',
      'dashboard',
    ],
    ecommerce: [
      'checkout optimization',
      'conversion optimization',
      'online booking',
    ],
    speedSEO: [
      'page speed',
      'site speed',
      'conversion rate optimization',
    ],
    automation: [
      'zapier',
      'make',
      'crm integration',
    ],
    vertical: [
      'video portal',
      'clinic portal',
      'patient portal',
    ],
    appDevelopment: [
      'app development',
      'custom app',
      'mobile app',
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
      'shopify',
      'gohighlevel',
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
    minFixedPrice: 2500,
    sortBy: 'newest',
  },

  minScore: 80,
  minEHR: 60,

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
      min: 2250,
      max: 3750,
      hoursMin: 30,
      hoursMax: 50,
    },
    growth: {
      min: 4500,
      max: 7500,
      hoursMin: 60,
      hoursMax: 100,
    },
    portalLite: {
      min: 6000,
      max: 12000,
      hoursMin: 80,
      hoursMax: 160,
    },
  },

  userProfile: {
    name: 'Chris',
    website: 'chrisigbojekwe.com',
    portfolio: 'dribbble.com/chris-i',
    github: 'github.com/Christopher-I',
    bio: 'I specialize in Webflow sites, client portals, page speed optimization, and simple automations with Zapier/Make.',
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
