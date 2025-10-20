/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROPOSAL SERVICES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Centralized location for all proposal-related functionality:
 * - Proposal generation (Claude and OpenAI implementations)
 * - Question answering for client screening questions
 *
 * This barrel export makes it easy to import proposal services and
 * switch between AI providers if needed.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { AI_PROVIDER } from '../../config/ai';

// Export question answerer (used in JobDetailModal)
export { answerClientQuestion } from './questionAnswerer';

// Export both generators
export { generateProposalWithClaude } from './claude.generator';
export { generateProposal } from './openai.generator';

// Export the active generator based on AI_PROVIDER config
export const generateProposalWithActiveProvider =
  AI_PROVIDER === 'claude'
    ? require('./claude.generator').generateProposalWithClaude
    : require('./openai.generator').generateProposal;
