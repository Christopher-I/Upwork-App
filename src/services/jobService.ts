import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { trackJobApplied, trackJobWon } from '../lib/statsService';

// ProposalResult type - using generic Record for now since it's defined in proposal generators
type ProposalResult = Record<string, any>;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOB SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Centralized service for all job-related operations.
 * This keeps business logic out of components and makes operations reusable.
 *
 * Available operations:
 * - markJobAsApplied()     - Mark job as applied (tracks stats)
 * - markJobAsWon()         - Mark job as won (tracks stats, revenue)
 * - toggleRecommendation() - Manually override job recommendation
 * - saveProposal()         - Save generated proposal to job
 * - updateJobField()       - Generic field update utility
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Mark a job as applied
 *
 * @param jobId - Firestore document ID
 * @param proposalContent - Optional proposal content to save
 * @throws Error if update fails
 */
export async function markJobAsApplied(
  jobId: string,
  proposalContent?: string
): Promise<void> {
  try {
    console.log(`📝 Marking job ${jobId} as applied...`);

    await updateDoc(doc(db, 'jobs', jobId), {
      applied: true,
      appliedAt: new Date(),
      appliedProposal: proposalContent || '',
      status: 'applied',
    });

    // Track stats
    await trackJobApplied();

    console.log(`✅ Job ${jobId} marked as applied`);
  } catch (error) {
    console.error('Failed to mark job as applied:', error);
    throw new Error('Failed to mark job as applied');
  }
}

/**
 * Mark a job as won
 *
 * @param jobId - Firestore document ID
 * @param projectValue - Optional actual project value won
 * @throws Error if update fails
 */
export async function markJobAsWon(
  jobId: string,
  projectValue?: number
): Promise<void> {
  try {
    console.log(`🎉 Marking job ${jobId} as won...`);

    await updateDoc(doc(db, 'jobs', jobId), {
      won: true,
      wonAt: new Date(),
      actualProjectValue: projectValue || null,
    });

    // Track stats (revenue if provided)
    await trackJobWon(projectValue);

    console.log(`✅ Job ${jobId} marked as won`);
  } catch (error) {
    console.error('Failed to mark job as won:', error);
    throw new Error('Failed to mark job as won');
  }
}

/**
 * Toggle job recommendation status (manual override)
 *
 * @param jobId - Firestore document ID
 * @param currentClassification - Current classification ('recommended' | 'not_recommended')
 * @returns New classification after toggle
 * @throws Error if update fails
 */
export async function toggleJobRecommendation(
  jobId: string,
  currentClassification: 'recommended' | 'not_recommended'
): Promise<'recommended' | 'not_recommended'> {
  try {
    const newClassification =
      currentClassification === 'recommended'
        ? 'not_recommended'
        : 'recommended';

    console.log(
      `🔄 Toggling job ${jobId} recommendation: ${currentClassification} → ${newClassification}`
    );

    await updateDoc(doc(db, 'jobs', jobId), {
      finalClassification: newClassification,
      manualOverride: {
        forceRecommended: newClassification === 'recommended',
        overriddenAt: new Date(),
      },
    });

    console.log(`✅ Job ${jobId} classification updated to: ${newClassification}`);

    return newClassification;
  } catch (error) {
    console.error('Failed to toggle recommendation:', error);
    throw new Error('Failed to update job recommendation');
  }
}

/**
 * Save a generated proposal to a job
 *
 * @param jobId - Firestore document ID
 * @param proposal - Complete proposal object
 * @throws Error if save fails
 */
export async function saveProposal(
  jobId: string,
  proposal: ProposalResult
): Promise<void> {
  try {
    console.log(`💾 Saving proposal for job ${jobId}...`);

    await updateDoc(doc(db, 'jobs', jobId), {
      proposal: proposal,
      proposalGeneratedAt: new Date(),
    });

    console.log(`✅ Proposal saved for job ${jobId}`);
  } catch (error) {
    console.error('Failed to save proposal:', error);
    throw new Error('Failed to save proposal');
  }
}

/**
 * Generic utility to update any job field
 * Use this for one-off updates that don't fit other methods
 *
 * @param jobId - Firestore document ID
 * @param updates - Object with fields to update
 * @throws Error if update fails
 */
export async function updateJobField(
  jobId: string,
  updates: Record<string, any>
): Promise<void> {
  try {
    console.log(`🔧 Updating job ${jobId} fields:`, Object.keys(updates));

    await updateDoc(doc(db, 'jobs', jobId), updates);

    console.log(`✅ Job ${jobId} updated successfully`);
  } catch (error) {
    console.error('Failed to update job:', error);
    throw new Error('Failed to update job');
  }
}
