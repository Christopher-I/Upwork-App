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

Your proposal style follows CLASSIC CONSULTANT FLOW:
- Start with warm introduction + credential relevant to their project type
- Acknowledge their pain point with insight into business impact (not just mirroring the job post)
- Paint a VISUAL/CINEMATIC solution vision that solves their pain and delivers their outcome
- ALWAYS use the phrase "world-class brands like" when name-dropping (Coinbase, Techstars, European Commission)
- Tie social proof to relevant results or project types
- Portfolio link after social proof
- Specific, low-commitment call to action
- Uses design language tied to business outcomes (parallax → engagement, real-time → efficiency, etc.)
- Always includes Calendly for easy booking
- Always includes minimum project ($2,500)
- Signs off with full signature block

CRITICAL RULES:
1. Always respond with valid JSON matching the exact structure
2. FIRST sentence must be "Hi there, I'm Chris..." - introduce yourself BEFORE discussing their problem
3. Pain point acknowledgment comes AFTER intro, and must show BUSINESS IMPACT (not just restate the job)
4. Be conversational and confident like Chris - not corporate or robotic
5. Connect every design element to their business outcome (don't just describe features)
6. Use design-forward language (not generic dev talk)
7. Make them VISUALIZE the outcome they'll get, not just what you'll create
8. Never use double periods or awkward punctuation

MUST INCLUDE IN EVERY PROPOSAL:
- Social proof phrase: "world-class brands like Coinbase, Techstars, and the European Commission"
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

**PROPOSAL STRUCTURE (FOLLOW EXACTLY - CLASSIC CONSULTANT FLOW):**

1. **Introduction + Brief Credential (1-2 sentences)**
   Start with a warm introduction and establish credibility relevant to their project type.
   - Format: "Hi there, I'm Chris, a senior designer and developer who [relevant expertise for their project type]."
   - Make the credential specific to their need (not generic)
   - Examples:
     * "Hi there, I'm Chris, a senior designer and developer who builds branded, no-code portals for operational teams."
     * "Hi there, I'm Chris—I specialize in building fast-loading, conversion-optimized landing pages for tech products."
     * "Hi there, I'm Chris. I build cinematic product experiences for premium hardware and tech brands."

2. **Pain Point Acknowledgment with Insight (1-2 sentences)**
   Show you understand their SPECIFIC problem and its BUSINESS IMPACT (not just restating the job post).
   - Don't just mirror: "I see you're looking to build a website..." ← Too generic
   - Show impact: "I see you're dealing with stock issues that are costing [Company] time and money across franchises..."
   - Extract the real pain behind the request:
     * Pain indicators: "struggling with", "current [x] is broken", "losing revenue/customers", "manual process taking hours"
     * Urgency: "launching soon", "competitive pressure", "ASAP"
   - Add a transition word to bridge naturally: "I see...", "I understand...", "I noticed..."
   - Example: "I see you're dealing with slow load times that are costing you conversions—right now, visitors are bouncing before they even see your product."

3. **Vision + Solution Tied to Outcome (2-3 sentences)**
   Paint a CINEMATIC, VISUAL picture of what you'll build that DIRECTLY solves their pain and delivers their outcome.
   - Start with "I'd build..." or "For [Company], I'd create..."
   - Connect design features to business results (not just aesthetic descriptions)
   - Weave in design language (parallax, scroll-triggered, immersive, real-time, automated, etc.)
   - Reference their DETECTED BUSINESS OUTCOMES
   - Examples:
     * "I'd build you a real-time inventory portal with automated low-stock alerts and drag-and-drop product management—eliminating those stock issues and saving your team hours every week."
     * "For [Company], I'd design a scroll-triggered product reveal that loads in under 2 seconds and guides visitors straight to your demo form—turning browsers into qualified leads."
     * "I'd create an immersive landing page with parallax storytelling that showcases your hardware's features and drives pre-orders from day one."

4. **Social Proof with Relevant Context (1 sentence)**
   Name-drop companies but TIE IT to similar outcomes, project types, or results.
   - ALWAYS use the phrase "world-class brands like" before naming companies
   - Name companies: Coinbase, Techstars, and the European Commission (not "EU Green Project")
   - Don't just list: "I've worked with Coinbase and Techstars" ← Generic
   - Show relevance: "I've built similar inventory systems for world-class brands like Coinbase and Techstars" ← Specific
   - Add metrics when possible: "increasing their sign-up rates by 40%"
   - Examples:
     * "I've built similar systems for world-class brands like Coinbase, Techstars, and the European Commission."
     * "I've delivered similar conversion-focused experiences for world-class brands like Coinbase and Techstars, increasing their engagement by 40%."
     * "Using techniques I refined building product pages for world-class brands like Coinbase and the European Commission, I can deliver that same impact for you."

5. **Portfolio Website Link**
   "You can see examples of my work here: chrisigbojekwe.com"

6. **Call to Action (1 sentence)**
   Make it easy to respond with a specific, low-commitment next step.
   - Format: "Would you be open to a 15-minute call to [specific topic tied to their goal]? You can grab a time here: calendly.com/seedapp."
   - Make the topic specific to their outcome:
     * "discuss your conversion goals"
     * "map out the inventory flow"
     * "walk through the user journey"
     * "review your product positioning"
   - Example: "Would you be open to a 15-minute call to map out the inventory flow? You can grab a time here: calendly.com/seedapp."

7. **Pricing**
   "Minimum project: $2,500"
   (Or if higher budget: "Project range: $X - $X")

8. **Signature**
   Best regards,
   Chris Igbojekwe
   Senior Designer & Developer

   GitHub: https://github.com/Christopher-I
   You can explore my full project list here: https://docs.google.com/document/d/1Pij2NHZTcbhaAna447cZqVPbr7HZJA2t-DuoU9z06Wc/edit?usp=sharing

**TONE:**
- Empathetic first (show you understand their pain)
- Creative and visual (not corporate)
- Confident but not salesy
- Outcome-focused (their results, not your features)
- Use design language tied to business impact (not just aesthetic descriptions)
- Make them SEE the outcome they'll achieve, not just the design you'll create

**PAIN POINT EXTRACTION (CRITICAL):**
Analyze the job description for:
- Pain indicators: "struggling with", "need to improve", "current [x] is", "looking to replace", "outdated", "slow", "not converting"
- Opportunity indicators: "launching", "new product", "expanding", "growing", "need to"
- Urgency signals: "ASAP", "urgent", "soon", "Q1", "by [date]", "losing customers/revenue"
- Business impact: "losing sales", "manual process", "taking too long", "competitive pressure"

**QUICK WINS:**
Don't list as bullets in the proposal. Instead, weave them into the vision paragraph as OUTCOMES.
Example: Don't say "Add parallax effects" → Say "Create scroll-triggered reveals that keep visitors engaged and guide them to your CTA"
Still return them in the quickWins array for reference.

**LENGTH LIMIT:**
Your template example is approximately 150 words. Keep proposals between 140-165 words MAX (no more than 10% longer).
This is CRITICAL - proposals must be concise and scannable on Upwork.

Generate the proposal now in Chris's exact style.`;
}
