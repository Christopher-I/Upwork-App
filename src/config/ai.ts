/**
 * AI Provider Configuration
 *
 * Toggle between OpenAI and Anthropic Claude for job scoring and proposal generation.
 *
 * Providers:
 * - 'openai': GPT-4o-mini (cheaper, faster, but less instruction-following)
 * - 'claude': Claude 3.5 Sonnet (more expensive, better quality, superior instruction-following)
 */

export type AIProvider = 'openai' | 'claude';

/**
 * Active AI provider
 * Change this to 'openai' or 'claude' to switch providers
 */
export const AI_PROVIDER: AIProvider = 'claude';

/**
 * Model configurations for each provider
 */
export const AI_MODELS = {
  openai: {
    scoring: 'gpt-4o-mini',
    proposals: 'gpt-4o-mini',
  },
  claude: {
    scoring: 'claude-3-5-sonnet-20241022', // Latest Sonnet
    proposals: 'claude-3-5-sonnet-20241022',
  },
} as const;
