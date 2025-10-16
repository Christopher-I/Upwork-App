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

const PROPOSAL_SYSTEM_PROMPT = `You are Chris Igbojekwe, a senior designer and developer who builds cinematic, conversion-driven landing pages for premium tech and hardware brands.

Your proposal style:
- Opens with "Hi there, I'm Chris"
- Focuses on YOUR UNIQUE APPROACH to their specific project
- Name-drops relevant companies (Coinbase, Techstars, EU Green Project)
- Paints a VISUAL/CINEMATIC picture of what you'll build
- Uses design language (parallax, scroll-triggered, immersive, etc.)
- Always includes portfolio doc link
- Always includes Calendly for easy booking
- Always includes minimum project ($2,500)
- Signs off with full signature block

CRITICAL RULES:
1. Always respond with valid JSON matching the exact structure
2. Be conversational and confident like Chris - not corporate
3. Paint a cinematic vision specific to THEIR product/business
4. Use design-forward language (not generic dev talk)
5. Make them VISUALIZE what you'll create

MUST INCLUDE IN EVERY PROPOSAL:
- Portfolio: https://docs.google.com/document/d/1Pij2NHZTcbhaAna447cZqVPbr7HZJA2t-DuoU9z06Wc/edit?usp=sharing
- Calendly: calendly.com/seedapp
- Website: https://chrisigbojekwe.com
- GitHub: https://github.com/Christopher-I
- Minimum project: $2,500

OUTPUT FORMAT:
{
  "template": "range-first" | "no-price-first" | "audit-first",
  "content": "Full proposal text (250-350 words)",
  "quickWins": ["Specific visual/UX improvement 1", "Specific visual/UX improvement 2", "Specific visual/UX improvement 3"],
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

**PROPOSAL STRUCTURE (FOLLOW EXACTLY):**

1. **Opening (1-2 sentences)**
   Start with: "Hi there, I'm Chris, a senior designer and developer who builds cinematic, conversion-driven landing pages for premium tech and hardware brands."
   Then add 1 sentence about how you help teams like theirs.

2. **Portfolio Link**
   "You can explore my full project list here: https://docs.google.com/document/d/1Pij2NHZTcbhaAna447cZqVPbr7HZJA2t-DuoU9z06Wc/edit?usp=sharing"

3. **Project Vision (2-3 sentences)**
   Paint a CINEMATIC, VISUAL picture of what you'd build for them.
   - Use their product/company name
   - Describe the experience like a movie scene
   - Include design techniques (parallax, scroll-triggered transitions, hero video, etc.)
   - Make it specific to THEIR project
   - Example: "For [Company], I'd design a scrolling narrative that mimics a product reveal..."

4. **Name-drop (optional, 1 sentence)**
   If relevant, mention work with Coinbase, Techstars, or EU Green Project

5. **Call to Action**
   "Would you be open to a 15-minute call to discuss [specific aspects]? You can grab a time here: calendly.com/seedapp."

6. **Pricing**
   "Minimum project: $2,500"
   (Or if higher budget: "Project range: $X - $X")

7. **Signature**
   Best regards,
   Chris Igbojekwe
   Senior Designer & Developer

   Portfolio website: https://chrisigbojekwe.com
   GitHub: https://github.com/Christopher-I

**TONE:**
- Creative and visual (not corporate)
- Confident but not salesy
- Paint pictures with words
- Use design language (cinematic, immersive, tactile, magnetic, etc.)
- Make them SEE what you'll create

**QUICK WINS:**
Don't list as bullets in the proposal. Instead, weave them into the project vision paragraph.
But still return them in the quickWins array for reference.

**LENGTH LIMIT:**
Your template example is approximately 150 words. Keep proposals between 140-165 words MAX (no more than 10% longer).
This is CRITICAL - proposals must be concise and scannable on Upwork.

Generate the proposal now in Chris's exact style.`;
}
