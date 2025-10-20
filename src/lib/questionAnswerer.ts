import Anthropic from '@anthropic-ai/sdk';
import { Job } from '../types/job';

// Support both browser (Vite) and Node (testing) environments
const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_ANTHROPIC_API_KEY;
  }
  return process.env.VITE_ANTHROPIC_API_KEY;
};

const anthropic = new Anthropic({
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true, // Only for development/testing
});

/**
 * Generate a humanized answer to a client's question using Claude
 *
 * Requirements:
 * - Less than 75 words
 * - Humanized and conversational
 * - Shows 15+ years of experience
 * - Highly relevant to client's problem
 * - No fluff, very clear and direct
 */
export async function answerClientQuestion(
  question: string,
  job: Job
): Promise<string> {
  const systemPrompt = `You are Chris, a senior web developer with over 15 years of experience specializing in Webflow sites, client portals, page speed optimization, and simple automations with Zapier/Make.

You are answering a client's question from their Upwork job posting. Your goal is to provide a clear, direct, and highly relevant answer that demonstrates deep expertise.

CRITICAL RULES:
1. Maximum 75 words - be concise
2. Write naturally and conversationally (like a human, not a bot)
3. Reference the client's specific problem from their job description when relevant
4. Show confidence from 15+ years of experience without saying "I have 15 years of experience"
5. Be direct - no fluff, no generic statements
6. Focus on solving their specific problem
7. Use "I" statements (e.g., "I typically...", "I've found...", "I recommend...")
8. Avoid buzzwords and corporate speak

OUTPUT FORMAT:
Return ONLY the answer text - no intro, no conclusion, just the direct answer to their question.`;

  const userPrompt = `CLIENT'S JOB DESCRIPTION:
${job.description}

CLIENT'S QUESTION:
${question}

Provide a clear, direct answer that shows your expertise and addresses their specific needs.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 200, // ~75 words with some buffer
      temperature: 0.7, // Natural, conversational tone
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text from Claude's response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return textContent.text.trim();
  } catch (error) {
    console.error('Failed to generate answer:', error);
    throw new Error('Failed to generate answer. Please try again.');
  }
}
