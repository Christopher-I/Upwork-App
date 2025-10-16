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

**Estimation Rules:**
1. If budget specified: Use it as baseline
2. If budget not specified: Estimate based on scope/complexity
3. Consider project complexity to estimate hours:
   - Simple landing page: 15-25 hours
   - Multi-page website: 30-50 hours
   - Portal/dashboard: 40-80 hours
   - Complex system: 80-150 hours
4. Calculate EHR = estimatedPrice / estimatedHours
5. Round EHR to nearest whole number

**Output Required:**
- score: 0-15
- estimatedPrice: Your best estimate in USD
- estimatedHours: Your best estimate
- estimatedEHR: Calculated rate (rounded)
- reasoning: 1-2 sentences explaining your estimates

---

## DIMENSION 2: JOB CLARITY (15 points max)

**Goal:** How well-defined is the job? How many "boxes" are ticked?

**Count These Signals:**

**Technical Signals** (specific tools/deliverables mentioned):
- Platforms: webflow, shopify, wordpress, etc.
- Features: portal, dashboard, landing page, cms, blog, forms, etc.
- Services: page speed, seo, optimization, integration, automation, etc.

**Clarity Signals** (shows planning):
- Specific quantities: "5 pages", "10 sections"
- Timeline: "3 weeks", "by January"
- Quality descriptors: "professional", "modern", "clean"
- Requirements: "mobile responsive", "forms", "responsive"
- Features list: enumerates specific features

**Scoring Guidelines:**
- 15 pts: 6+ total matches (very clear)
- 14 pts: 4-5 matches (clear)
- 13 pts: 3 matches (good)
- 10 pts: 2 matches (some clarity)
- 7 pts: 1 match (minimal)
- 3 pts: 0 matches (vague)

**Output Required:**
- score: 0-15
- technicalMatches: Count of technical signals found
- clarityMatches: Count of clarity signals found
- totalMatches: Sum of both
- reasoning: List the actual signals you found

---

## DIMENSION 3: BUSINESS IMPACT (15 points max)

**Goal:** Does this solve a business problem or just hire a coder?

**Look For Business Outcomes:**
1. **Revenue outcomes:** leads, sales, conversions, customers, bookings, revenue, generate
2. **Efficiency outcomes:** save time, automate, streamline, reduce, faster, organize, manage
3. **Growth outcomes:** scale, grow, expand, increase, improve, boost, enhance
4. **Metrics outcomes:** track, analytics, reporting, KPI, measure

**Look For Business Context:**
- Phrases like: "our business", "our company", "our team", "our clients", "help us"

**Red Flags (Technical-Only):**
- "need developer", "need programmer", "looking for developer"
- "must know [technology]", "experience in [technology]"
- Focus on tech stack instead of outcomes

**Scoring Guidelines:**
- 15 pts: Multiple categories + business context
- 12 pts: 2-3 outcome categories
- 8 pts: 1 outcome category
- 5 pts: Vague outcomes
- 0 pts: Technical-only (no business context)

**Special Rule:** If technical-only flags detected AND no business outcomes → score = 0

**Output Required:**
- score: 0-15
- detectedOutcomes: Array of outcome keywords found
- isTechnicalOnly: true if technical-only job detected
- reasoning: Explain what outcomes were found or why it's technical-only

---

**RESPOND WITH JSON ONLY. NO ADDITIONAL TEXT.**`;
}
