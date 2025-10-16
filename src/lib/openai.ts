import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for development/testing
});

export interface ChatGPTScoringResult {
  ehrPotential: {
    score: number;
    estimatedPrice: number;
    estimatedHours: number;
    estimatedEHR: number;
    reasoning: string;
  };
  jobClarity: {
    score: number;
    technicalMatches: number;
    clarityMatches: number;
    totalMatches: number;
    reasoning: string;
  };
  businessImpact: {
    score: number;
    detectedOutcomes: string[];
    isTechnicalOnly: boolean;
    reasoning: string;
  };
}

/**
 * Use ChatGPT to score 3 dimensions: EHR Potential, Job Clarity, Business Impact
 * Uses structured JSON output for reliability
 */
export async function scoreJobWithChatGPT(
  jobTitle: string,
  jobDescription: string,
  budget: number,
  budgetType: 'fixed' | 'hourly' | 'negotiable'
): Promise<ChatGPTScoringResult> {
  const prompt = buildScoringPrompt(jobTitle, jobDescription, budget, budgetType);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for consistency
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result as ChatGPTScoringResult;
  } catch (error) {
    console.error('ChatGPT scoring error:', error);
    throw error;
  }
}

// System prompt that defines the AI's role and constraints
const SYSTEM_PROMPT = `You are an expert Upwork job evaluator specializing in web development projects. Your role is to analyze job postings and provide objective, numerical scores for 3 specific dimensions.

**CRITICAL RULES:**
1. Always respond with valid JSON matching the exact structure provided
2. Be objective and consistent - same job description should always get same scores
3. Base scores on concrete evidence in the text, not assumptions
4. Explain your reasoning briefly but clearly

**YOUR EXPERTISE:**
- Web development (Webflow, landing pages, portals, dashboards, e-commerce)
- Project scoping and estimation
- Business outcome identification
- Technical requirement clarity assessment

**OUTPUT FORMAT:**
Always return valid JSON with this exact structure:
{
  "ehrPotential": {
    "score": 0-15,
    "estimatedPrice": number,
    "estimatedHours": number,
    "estimatedEHR": number,
    "reasoning": "string"
  },
  "jobClarity": {
    "score": 0-15,
    "technicalMatches": number,
    "clarityMatches": number,
    "totalMatches": number,
    "reasoning": "string"
  },
  "businessImpact": {
    "score": 0-15,
    "detectedOutcomes": ["array", "of", "strings"],
    "isTechnicalOnly": boolean,
    "reasoning": "string"
  }
}`;

function buildScoringPrompt(
  title: string,
  description: string,
  budget: number,
  budgetType: string
): string {
  return `Analyze this Upwork job posting and score 3 dimensions. Return ONLY valid JSON.

**JOB TITLE:** ${title}

**JOB DESCRIPTION:** ${description}

**BUDGET:** ${budget > 0 ? `$${budget} (${budgetType})` : 'Not specified (open/negotiable)'}

---

## DIMENSION 1: EHR POTENTIAL (15 points max)

**Goal:** Estimate realistic project price, hours, and resulting effective hourly rate (EHR).

**Scoring Guidelines:**
- 15 pts: EHR $100+/hr
- 13 pts: EHR $80-99/hr
- 10 pts: EHR $60-79/hr
- 7 pts: EHR $40-59/hr
- 3 pts: EHR below $40/hr

**CRITICAL: Estimation Rules (follow in order):**
1. **If budget IS specified in description or budget field:**
   - USE THAT EXACT BUDGET as estimatedPrice (don't guess higher/lower)
   - Look for phrases like "budget is $X", "$X budget", "looking for $X"
   - Estimate hours based on scope/complexity
   - Calculate EHR = budget / estimatedHours

2. **If budget NOT specified:**
   - Estimate price based on scope/complexity
   - Estimate hours based on deliverables

3. **Hour estimation guidelines by complexity:**
   - Quick fix/small task: 1-5 hours
   - Simple landing page (1-3 pages): 15-25 hours
   - Multi-page website (5-10 pages): 25-40 hours
   - Multi-page with CMS/blog: 30-45 hours
   - Portal/dashboard with features: 40-60 hours
   - Complex portal with integrations: 60-100 hours
   - Enterprise system: 100-150+ hours

**IMPORTANT:** Be conservative with hour estimates to favor higher EHR. If scope seems medium, estimate on the lower end of the range.

4. Calculate EHR = estimatedPrice / estimatedHours
5. Round EHR to nearest whole number

**IMPORTANT:** If description says "tight budget", "cheap", "low budget", or budget is very low for scope → trust that signal and score accordingly (likely 3-7 pts)

**Output Required:**
- score: 0-15
- estimatedPrice: Your best estimate in USD
- estimatedHours: Your best estimate
- estimatedEHR: Calculated rate (rounded)
- reasoning: 1-2 sentences explaining your estimates

---

## DIMENSION 2: JOB CLARITY (15 points max)

**Goal:** How well-defined is the job? How many "boxes" are ticked?

**IMPORTANT:** Focus on clarity and planning signals. Light platform mentions (Webflow, Shopify) are fine, but AVOID rewarding deeply technical requirements like bug fixes, PRs, technical specifications, or jobs that sound like they were written by/for developers.

**Count These Signals:**

**Platform Signals (LIGHT technical mentions only - max 2 points):**
- Platforms/tools: webflow, shopify, wordpress (these are good)
- High-level features: portal, dashboard, landing page, cms, blog
- DO NOT count: specific frameworks, version numbers, technical jargon, bug fixes, PRs

**Clarity Signals (PRIMARY - these show professional planning):**
- Specific quantities: "5 pages", "10 sections", "8-10 pages"
- Timeline: "3 weeks", "by January", "flexible timeline"
- Scope definition: clear deliverables, phases, milestones
- Quality descriptors: "professional", "modern", "clean", "high-quality"
- Requirements: "mobile responsive", "lead capture forms", "secure login"
- Context: describes current situation, why they need this

**Scoring Guidelines:**
- 15 pts: 7+ clarity signals + light platform mentions (highly professional)
- 14 pts: 5-6 clarity signals (well-planned)
- 13 pts: 3-4 clarity signals (decent planning)
- 10 pts: 2 clarity signals (some structure)
- 7 pts: 1 clarity signal (minimal)
- 3 pts: 0 clarity signals OR heavily technical (vague or tech-focused)

**PENALTY:** If job mentions bug fixes, pull requests, technical specs, or deep technical requirements → reduce score by 3-5 points (cap at 3 pts minimum)

**Output Required:**
- score: 0-15
- technicalMatches: Count of LIGHT platform mentions (webflow, shopify, etc.)
- clarityMatches: Count of planning/clarity signals found
- totalMatches: Sum of both (but clarity signals weighted higher)
- reasoning: List the actual clarity signals you found

---

## DIMENSION 3: BUSINESS IMPACT (15 points max)

**Goal:** Does this solve a business problem or just hire a coder?

**THIS IS THE MOST IMPORTANT DIMENSION - We prefer business outcomes over technical tasks.**

**Strong Business Outcomes (look for these FIRST):**
1. **Revenue outcomes:** leads, sales, conversions, customers, bookings, revenue, generate, acquire
2. **Efficiency outcomes:** save time, automate, streamline, reduce, faster, organize, manage, simplify
3. **Growth outcomes:** scale, grow, expand, increase, improve, boost, enhance, launch
4. **Metrics outcomes:** track, analytics, reporting, KPI, measure, insights
5. **Customer/Client impact:** improve experience, satisfy customers, serve clients better

**Business Context (strong positive signal):**
- "our business", "our company", "our team", "our clients", "help us", "we need"
- Describes current business pain point or goal
- Explains WHY they need this (not just WHAT they need)

**MAJOR Red Flags (Technical-Only - heavily penalize):**
- "need developer", "need programmer", "looking for developer/coder"
- "must know [technology]", "experience in [framework]", "skilled in [language]"
- Bug fixes, pull requests (PRs), technical specifications
- Focus on technical requirements instead of business outcomes
- Reads like a job description for a developer role
- Heavy technical jargon that sounds like it was written by/for developers

**Scoring Guidelines:**
- 15 pts: 3+ outcome categories + clear business context (strong business focus)
- 13 pts: 2-3 outcome categories + some context (good business focus)
- 10 pts: 1-2 outcome categories (some business awareness)
- 5 pts: Vague outcomes or mostly technical with minor business mention
- 0 pts: Technical-only job (hiring a developer, not solving a problem)

**Special Rule:** If ANY technical-only red flags detected (bug fixes, PRs, "need developer", heavy tech specs) AND no clear business outcomes → score = 0

**Output Required:**
- score: 0-15
- detectedOutcomes: Array of specific outcome phrases found (e.g., "generate leads", "streamline communications")
- isTechnicalOnly: true if this is a technical-task job (red flags present, no business context)
- reasoning: Explain what business outcomes were found OR why it's technical-only

---

**RESPOND WITH JSON ONLY. NO ADDITIONAL TEXT.**`;
}
