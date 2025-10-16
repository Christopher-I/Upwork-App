import { compareTwoStrings } from 'string-similarity';
import { Job } from '../types/job';

/**
 * Deduplicate jobs by Upwork ID
 */
export function deduplicateByUpworkId(jobs: Partial<Job>[]): Partial<Job>[] {
  const seen = new Set<string>();
  const unique: Partial<Job>[] = [];

  for (const job of jobs) {
    if (job.upworkId && !seen.has(job.upworkId)) {
      seen.add(job.upworkId);
      unique.push(job);
    }
  }

  console.log(`Deduplicated: ${jobs.length} → ${unique.length} jobs`);
  return unique;
}

/**
 * Detect reposts (90%+ similar description)
 */
export function detectReposts(
  newJobs: Partial<Job>[],
  existingJobs: Partial<Job>[]
): {
  unique: Partial<Job>[];
  duplicates: Partial<Job>[];
} {
  const unique: Partial<Job>[] = [];
  const duplicates: Partial<Job>[] = [];

  for (const newJob of newJobs) {
    let isRepost = false;

    // Check against existing jobs
    for (const existing of existingJobs) {
      if (!newJob.description || !existing.description) continue;

      const similarity = compareTwoStrings(
        newJob.description.toLowerCase(),
        existing.description.toLowerCase()
      );

      if (similarity >= 0.9) {
        // 90%+ similar = repost
        (newJob as any).isRepost = true;
        (newJob as any).repostOfId = existing.id;
        (newJob as any).exclusionReason = 'Repost detected (90%+ similar)';
        isRepost = true;
        duplicates.push(newJob);
        break;
      }
    }

    if (!isRepost) {
      unique.push(newJob);
    }
  }

  console.log(
    `Repost detection: ${newJobs.length} → ${unique.length} unique, ${duplicates.length} reposts`
  );

  return { unique, duplicates };
}

/**
 * Combined deduplication and repost detection
 */
export async function processJobs(
  fetchedJobs: Partial<Job>[],
  existingJobs: Partial<Job>[]
): Promise<{
  toProcess: Partial<Job>[];
  duplicates: Partial<Job>[];
  reposts: Partial<Job>[];
}> {
  // Step 1: Deduplicate by ID
  const uniqueById = deduplicateByUpworkId(fetchedJobs);

  // Step 2: Detect reposts
  const { unique, duplicates: reposts } = detectReposts(uniqueById, existingJobs);

  // Step 3: Mark exact duplicates
  const duplicates: Partial<Job>[] = [];
  for (const job of uniqueById) {
    const isDupe = existingJobs.some((e) => e.upworkId === job.upworkId);
    if (isDupe) {
      (job as any).isDuplicate = true;
      (job as any).exclusionReason = 'Duplicate job ID';
      duplicates.push(job);
    }
  }

  return {
    toProcess: unique,
    duplicates,
    reposts,
  };
}
