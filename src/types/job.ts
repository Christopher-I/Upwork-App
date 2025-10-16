export interface Job {
  id: string;
  upworkId: string;
  title: string;
  description: string;
  url: string;

  // Timestamps
  postedAt: Date;
  fetchedAt: Date;
  scoredAt?: Date;

  // Budget
  budget: number;
  budgetType: 'fixed' | 'hourly' | 'negotiable';
  budgetIsPlaceholder: boolean;

  // Client info
  client: {
    id: string;
    name: string;
    paymentVerified: boolean;
    totalSpent: number;
    totalHires: number;
    location: string;
    rating: number;
    reviewCount: number;
  };

  // Job details
  proposalsCount: number;
  category: string;
  experienceLevel: string;

  // Scoring
  score: number;
  scoreBreakdown: ScoreBreakdown;

  // Language analysis
  languageAnalysis: {
    weCount: number;
    ourCount: number;
    usCount: number;
    teamMentions: number;
    iCount: number;
    myCount: number;
    meMentions: number;
    hasCompanyKeywords: boolean;
    companyKeywordsFound: string[];
    isProfessional: boolean;
  };

  // Classification
  autoClassification: 'recommended' | 'not_recommended';
  manualOverride?: {
    forceRecommended: boolean;
    overriddenAt: Date;
  };
  finalClassification: 'recommended' | 'not_recommended';

  // EHR
  estimatedPrice: number;
  estimatedHours: number;
  estimatedEHR: number;

  // Scope clarity analysis
  scopeClarity: {
    technicalMatches: number;
    scopeMatches: number;
    total: number;
  };

  // Duplicate detection
  isDuplicate: boolean;
  isRepost: boolean;

  // Keywords & outcomes
  matchedKeywords: string[];
  detectedOutcomes: string[];
  detectedRedFlags?: string[];

  // AI proposal
  proposal?: {
    template: 'range-first' | 'no-price-first' | 'audit-first';
    content: string;
    quickWins: string[];
    packageRecommended: string;
    priceRange: string;
    generatedAt: Date;
    edited: boolean;
  };

  // Status
  status: 'fetched' | 'scored' | 'ai_processing' | 'ready' | 'applied';

  // Application tracking
  applied: boolean;
  appliedAt?: Date;
  appliedProposal?: string;

  // Outcome
  won: boolean;
  wonAt?: Date;
  actualProjectValue?: number;

  // Exclusion reason
  exclusionReason?: string;
}

export interface ScoreBreakdown {
  clientQuality: {
    paymentVerified: number;
    spendHistory: number;
    recencyAndCompetition: number;
    subtotal: number;
  };
  keywordsMatch: number;
  professionalSignals: {
    openBudget: number;
    weLanguage: number;
    subtotal: number;
  };
  outcomeClarity: number;
  scopeFit: number;
  ehrPotential: number;
  redFlags: number;
}
