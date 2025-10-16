import OpenAI from 'openai';
import { Job } from '../types/job';
import { Settings } from '../types/settings';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for development/testing
});

interface ProposalResult {
  template: 'range-first' | 'no-price-first' | 'audit-first';
  content: string;
  quickWins: string[];
  packageRecommended: string;
  priceRange: string;
}

/**
 * Generate a customized proposal for a job using ChatGPT
 */
export async function generateProposal(
  job: Job,
  settings: Settings
): Promise<ProposalResult> {
  const prompt = buildProposalPrompt(job, settings);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages: [
        {
          role: 'system',
          content: PROPOSAL_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Higher temperature for more creative proposals
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result as ProposalResult;
  } catch (error) {
    console.error('Proposal generation error:', error);
    throw error;
  }
}

const PROPOSAL_SYSTEM_PROMPT = `You are an expert Upwork proposal writer specializing in web development projects.

Your proposals are known for:
- Being concise (250-350 words)
- Leading with value, not credentials
- Including 2-3 specific "quick wins" tailored to the job
- Building trust through relevant experience
- Clear next steps

CRITICAL RULES:
1. Always respond with valid JSON matching the exact structure
2. Be conversational and confident, not salesy
3. Focus on the client's business outcomes
4. Avoid generic statements like "I have X years experience"
5. Every quick win must be specific to THIS job

OUTPUT FORMAT:
{
  "template": "range-first" | "no-price-first" | "audit-first",
  "content": "Full proposal text (250-350 words)",
  "quickWins": ["Specific win 1", "Specific win 2", "Specific win 3"],
  "packageRecommended": "Launch" | "Growth" | "Portal Lite" | "Custom",
  "priceRange": "$X,XXX - $X,XXX" or "Let's discuss"
}`;

function buildProposalPrompt(job: Job, settings: Settings): string {
  // Determine best template based on job characteristics
  let templateGuidance = '';

  if (job.budget > 0 && job.budgetType === 'fixed') {
    templateGuidance = 'Use "range-first" template - client has stated budget.';
  } else if (job.estimatedEHR >= 100) {
    templateGuidance = 'Use "no-price-first" template - high-value project, focus on value first.';
  } else {
    templateGuidance = 'Use "audit-first" template - discovery-focused approach.';
  }

  // Get relevant pricing band
  let pricingGuidance = '';
  const estimatedPrice = job.estimatedPrice || (job.estimatedHours * job.estimatedEHR);

  if (estimatedPrice <= 2500) {
    pricingGuidance = `Recommend "Launch" package: $${settings.pricingBands.launch.min}-$${settings.pricingBands.launch.max} (${settings.pricingBands.launch.hoursMin}-${settings.pricingBands.launch.hoursMax} hours)`;
  } else if (estimatedPrice <= 5000) {
    pricingGuidance = `Recommend "Growth" package: $${settings.pricingBands.growth.min}-$${settings.pricingBands.growth.max} (${settings.pricingBands.growth.hoursMin}-${settings.pricingBands.growth.hoursMax} hours)`;
  } else {
    pricingGuidance = `Recommend "Portal Lite" package: $${settings.pricingBands.portalLite.min}-$${settings.pricingBands.portalLite.max} (${settings.pricingBands.portalLite.hoursMin}-${settings.pricingBands.portalLite.hoursMax} hours)`;
  }

  return `Generate a customized Upwork proposal for this job:

**JOB TITLE:** ${job.title}

**JOB DESCRIPTION:**
${job.description}

**CLIENT INFO:**
- Company: ${job.client.name}
- Payment Verified: ${job.client.paymentVerified ? 'Yes' : 'No'}
- Total Spent: $${job.client.totalSpent.toLocaleString()}
- Total Hires: ${job.client.totalHires}
- Location: ${job.client.location}

**BUDGET:**
${job.budget > 0 ? `$${job.budget} (${job.budgetType})` : 'Not specified'}

**MY PROFILE:**
- Name: ${settings.userProfile.name}
- Website: ${settings.userProfile.website}
- Bio: ${settings.userProfile.bio}

**DETECTED BUSINESS OUTCOMES:**
${job.detectedOutcomes?.join(', ') || 'None detected'}

**JOB CLARITY SIGNALS:**
- Technical signals: ${job.jobClarity?.technicalMatches || 0}
- Clarity signals: ${job.jobClarity?.clarityMatches || 0}

**ESTIMATED PROJECT:**
- Hours: ${job.estimatedHours}
- Price: $${estimatedPrice.toLocaleString()}
- EHR: $${job.estimatedEHR}/hr

---

**TEMPLATE SELECTION:**
${templateGuidance}

**PRICING GUIDANCE:**
${pricingGuidance}

**PROPOSAL STRUCTURE:**

1. **Opening Hook (1-2 sentences)**
   - Address their specific pain point or goal
   - Reference something from their description that shows you read it

2. **Quick Wins (2-3 bullets)**
   - Specific, actionable improvements you'll make
   - Tied to their business outcomes (not just technical features)
   - Use their language from the job description

3. **Relevant Experience (2-3 sentences)**
   - Mention similar projects (client portals, landing pages, etc.)
   - Focus on RESULTS, not just what you built
   - Keep it brief and relevant

4. **Next Steps (1-2 sentences)**
   - Suggest a quick call or questions to ask
   - Keep it casual and low-pressure

5. **Pricing (if applicable)**
   - Use the recommended package pricing range
   - If "no-price-first" template, mention pricing discussion for later

**TONE:**
- Conversational and confident
- Focus on their business, not your skills
- Use "you" and "your business" often
- Avoid: "I have X years", "I'm an expert", overly formal language

**LENGTH:** 250-350 words total

Generate the proposal now.`;
}
