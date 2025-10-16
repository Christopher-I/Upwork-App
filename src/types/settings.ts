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
    posted: string;
    location: string[];
    sortBy: string;
  };

  minScore: number;
  minEHR: number;

  scoringWeights: {
    clientQuality: number;
    keywordsMatch: number;
    professionalSignals: number;
    outcomeClarity: number;
    scopeFit: number;
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
    wideNet: ['website redesign', 'new website', 'landing page', 'lead generation', 'lead capture'],
    webflow: ['webflow', 'web flow', 'webflo'],
    portals: [
      'client portal',
      'customer portal',
      'member area',
      'membership site',
      'dashboard',
      'secure login',
      'file sharing',
    ],
    ecommerce: [
      'shopify speed',
      'checkout optimization',
      'online booking',
      'appointment scheduling',
      'subscription payments',
    ],
    speedSEO: [
      'core web vitals',
      'page speed',
      'conversion rate optimization',
      'A/B testing',
    ],
    automation: [
      'zapier',
      'make',
      'integromat',
      'gohighlevel',
      'GHL',
      'crm integration',
    ],
    vertical: [
      'video production portal',
      'clinic portal',
      'patient portal',
      'contractor website',
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
    maxProposals: 5,
    posted: 'last_24_48h',
    location: ['US'],
    sortBy: 'newest',
  },

  minScore: 80,
  minEHR: 70,

  scoringWeights: {
    clientQuality: 25,
    keywordsMatch: 15,
    professionalSignals: 10,
    outcomeClarity: 15,
    scopeFit: 15,
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
