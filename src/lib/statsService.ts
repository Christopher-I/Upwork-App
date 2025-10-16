import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { DailyStats, AggregatedStats } from '../types/stats';

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayKey(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Initialize today's stats document if it doesn't exist
 */
async function initializeTodayStats(): Promise<void> {
  const todayKey = getTodayKey();
  const statsRef = doc(db, 'dailyStats', todayKey);

  const statsSnap = await getDoc(statsRef);

  if (!statsSnap.exists()) {
    const initialStats: DailyStats = {
      id: todayKey,
      date: new Date(),
      proposalsSent: 0,
      proposalsGenerated: 0,
      jobsApplied: 0,
      jobsWon: 0,
      totalRevenue: 0,
      averageEHR: 0,
      averageProjectValue: 0,
      winRate: 0,
      lastUpdated: new Date(),
    };

    await setDoc(statsRef, initialStats);
  }
}

/**
 * Update stats when a proposal is generated
 */
export async function trackProposalGenerated(): Promise<void> {
  await initializeTodayStats();
  const todayKey = getTodayKey();
  const statsRef = doc(db, 'dailyStats', todayKey);

  await updateDoc(statsRef, {
    proposalsGenerated: increment(1),
    lastUpdated: new Date(),
  });
}

/**
 * Update stats when a job is marked as applied
 */
export async function trackJobApplied(): Promise<void> {
  await initializeTodayStats();
  const todayKey = getTodayKey();
  const statsRef = doc(db, 'dailyStats', todayKey);

  await updateDoc(statsRef, {
    jobsApplied: increment(1),
    proposalsSent: increment(1),
    lastUpdated: new Date(),
  });

  // Recalculate win rate
  await recalculateWinRate(todayKey);
}

/**
 * Update stats when a job is marked as won
 */
export async function trackJobWon(_projectValue?: number, _ehr?: number): Promise<void> {
  await initializeTodayStats();
  const todayKey = getTodayKey();
  const statsRef = doc(db, 'dailyStats', todayKey);

  const updates: any = {
    jobsWon: increment(1),
    lastUpdated: new Date(),
  };

  if (_projectValue) {
    updates.totalRevenue = increment(_projectValue);
  }

  await updateDoc(statsRef, updates);

  // Recalculate averages and win rate
  await recalculateWinRate(todayKey);
  await recalculateAverages(todayKey);
}

/**
 * Recalculate win rate for a given day
 */
async function recalculateWinRate(dateKey: string): Promise<void> {
  const statsRef = doc(db, 'dailyStats', dateKey);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    const data = statsSnap.data() as DailyStats;
    const winRate = data.jobsApplied > 0 ? (data.jobsWon / data.jobsApplied) * 100 : 0;

    await updateDoc(statsRef, {
      winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
    });
  }
}

/**
 * Recalculate averages for a given day
 */
async function recalculateAverages(dateKey: string): Promise<void> {
  const statsRef = doc(db, 'dailyStats', dateKey);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    // const data = statsSnap.data() as DailyStats;

    // Get all won jobs for today to calculate averages
    const today = new Date(dateKey);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const jobsQuery = query(
      collection(db, 'jobs'),
      where('won', '==', true),
      where('wonAt', '>=', today),
      where('wonAt', '<', tomorrow)
    );

    const jobsSnap = await getDocs(jobsQuery);

    if (jobsSnap.size > 0) {
      let totalEHR = 0;
      let totalValue = 0;
      let countWithEHR = 0;
      let countWithValue = 0;

      jobsSnap.docs.forEach((doc) => {
        const job = doc.data();

        if (job.estimatedEHR) {
          totalEHR += job.estimatedEHR;
          countWithEHR++;
        }

        if (job.actualProjectValue) {
          totalValue += job.actualProjectValue;
          countWithValue++;
        }
      });

      const updates: any = {};

      if (countWithEHR > 0) {
        updates.averageEHR = Math.round(totalEHR / countWithEHR);
      }

      if (countWithValue > 0) {
        updates.averageProjectValue = Math.round(totalValue / countWithValue);
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(statsRef, updates);
      }
    }
  }
}

/**
 * Get aggregated stats across all time and date ranges
 */
export async function getAggregatedStats(): Promise<AggregatedStats> {
  const statsQuery = query(collection(db, 'dailyStats'));
  const statsSnap = await getDocs(statsQuery);

  let totalProposalsSent = 0;
  let totalJobsWon = 0;
  let totalRevenue = 0;
  let totalApplied = 0;

  let last7DaysProposals = 0;
  let last7DaysWon = 0;
  let last7DaysRevenue = 0;

  let last30DaysProposals = 0;
  let last30DaysWon = 0;
  let last30DaysRevenue = 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  statsSnap.docs.forEach((doc) => {
    const data = doc.data() as DailyStats;
    const date = data.date instanceof Date ? data.date : new Date(data.date as any);

    // All time
    totalProposalsSent += data.proposalsSent || 0;
    totalJobsWon += data.jobsWon || 0;
    totalRevenue += data.totalRevenue || 0;
    totalApplied += data.jobsApplied || 0;

    // Last 7 days
    if (date >= sevenDaysAgo) {
      last7DaysProposals += data.proposalsSent || 0;
      last7DaysWon += data.jobsWon || 0;
      last7DaysRevenue += data.totalRevenue || 0;
    }

    // Last 30 days
    if (date >= thirtyDaysAgo) {
      last30DaysProposals += data.proposalsSent || 0;
      last30DaysWon += data.jobsWon || 0;
      last30DaysRevenue += data.totalRevenue || 0;
    }
  });

  const overallWinRate = totalApplied > 0 ? (totalJobsWon / totalApplied) * 100 : 0;

  return {
    totalProposalsSent,
    totalJobsWon,
    totalRevenue,
    overallWinRate: Math.round(overallWinRate * 100) / 100,
    averageEHR: 0, // Can be calculated from won jobs if needed

    last7Days: {
      proposalsSent: last7DaysProposals,
      jobsWon: last7DaysWon,
      revenue: last7DaysRevenue,
    },

    last30Days: {
      proposalsSent: last30DaysProposals,
      jobsWon: last30DaysWon,
      revenue: last30DaysRevenue,
    },
  };
}
