/**
 * Daily statistics for tracking performance
 */
export interface DailyStats {
  id: string; // Format: YYYY-MM-DD
  date: Date;

  // Proposals
  proposalsSent: number;
  proposalsGenerated: number;

  // Applications
  jobsApplied: number;
  jobsWon: number;

  // Revenue
  totalRevenue: number;
  averageEHR: number;
  averageProjectValue: number;

  // Win rate
  winRate: number; // jobsWon / jobsApplied

  // Timestamps
  lastUpdated: Date;
}

/**
 * Aggregated stats across all time
 */
export interface AggregatedStats {
  totalProposalsSent: number;
  totalJobsWon: number;
  totalRevenue: number;
  overallWinRate: number;
  averageEHR: number;

  // Last 7 days
  last7Days: {
    proposalsSent: number;
    jobsWon: number;
    revenue: number;
  };

  // Last 30 days
  last30Days: {
    proposalsSent: number;
    jobsWon: number;
    revenue: number;
  };
}
