import Anthropic from '@anthropic-ai/sdk';
import { Job } from '../types/job';
import { Settings } from '../types/settings';

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

interface ProposalResult {
  template: 'range-first' | 'no-price-first' | 'audit-first' | 'platform-mismatch';
  content: string;
  quickWins: string[];
  packageRecommended: string;
  priceRange: string;
}

/**
 * Generate a customized proposal for a job using Claude
 */
export async function generateProposalWithClaude(
  job: Job,
  settings: Settings
): Promise<ProposalResult> {
  const systemPrompt = buildProposalSystemPrompt();
  const userPrompt = buildProposalPrompt(job, settings);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219', // Latest Sonnet model (Feb 2025)
      max_tokens: 2048,
      temperature: 0.7, // Higher temperature for creative proposals
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text from Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    console.log('Raw Claude response:', responseText);

    // Claude should return JSON wrapped in <response> tags or plain JSON
    let jsonText = responseText;

    // Try to extract JSON from <response> tags if present
    const responseMatch = responseText.match(/<response>([\s\S]*?)<\/response>/);
    if (responseMatch) {
      jsonText = responseMatch[1].trim();
      console.log('Extracted from <response> tags');
    }

    // Also try to extract from ```json code blocks
    const codeBlockMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
      console.log('Extracted from code block');
    }

    console.log('JSON text before cleaning:', jsonText.substring(0, 200));

    // Fix: Claude returns JSON with literal newlines in strings, which breaks JSON.parse()
    // We need to properly escape them, but only within string values (not the JSON structure)
    // Use a more robust approach: parse it manually by fixing string content

    try {
      // First attempt: try parsing as-is
      const result = JSON.parse(jsonText);
      console.log('✅ Parsed successfully without cleaning');
      return result as ProposalResult;
    } catch (firstError) {
      console.log('First parse failed, attempting to fix newlines in strings...');

      // Second attempt: Use eval with proper string escaping
      // This is safe because we control the source (Claude's response)
      try {
        // Replace literal newlines within string values with \n
        // This regex finds quoted strings and escapes their contents
        const fixedJson = jsonText.replace(
          /"content":\s*"([^"]*)"/gs,
          (match, content) => {
            // Escape newlines, tabs, and carriage returns in the content field
            const escapedContent = content
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            return `"content": "${escapedContent}"`;
          }
        );

        console.log('Fixed JSON (first 200 chars):', fixedJson.substring(0, 200));
        const result = JSON.parse(fixedJson);
        console.log('✅ Parsed successfully after fixing newlines');
        return result as ProposalResult;
      } catch (secondError) {
        console.error('Both parse attempts failed');
        console.error('Original error:', firstError);
        console.error('Fixed parse error:', secondError);
        throw firstError; // Throw original error
      }
    }
  } catch (error) {
    console.error('Proposal generation error:', error);
    throw error;
  }
}

// This is copied from proposalGenerator.ts - the full system prompt
const buildProposalSystemPrompt = () => `You are a world-class proposal writer creating highly customized, technical proposals that demonstrate deep expertise in whatever domain the job requires.

**GOLDEN RULE: ZERO GENERIC LANGUAGE**
Every proposal must be so specific to the job that it couldn't possibly apply to any other project. Use their exact technical terms, reference their specific requirements, and show expertise through details.

**PROPOSAL PHILOSOPHY:**
Your goal is to write a 9/10+ proposal that makes the client say "I MUST interview this person." Quality and specificity trump everything else.

**CORE STRATEGY:**
1. **Extract & Mirror Technical Stack** - Use EVERY technology, platform, tool, and technical term they mention (100% extraction is mandatory)
2. **Show Methodology** - Describe HOW you'll build it step-by-step with implementation details, not just WHAT you'll build
3. **List Specific Deliverables** - Pull exact requirements from their job description (use numbered lists for clarity)
4. **Technical Depth** - Every sentence must demonstrate expertise with concrete details
5. **Appropriate Complexity** - Match word count and depth to job complexity (150-350 words)

**STRUCTURE (EXACT ORDER - DO NOT DEVIATE):**

**EXAMPLE SHOWING CORRECT PARAGRAPH ORDER:**

PARAGRAPH 1: Hi, I specialize in Webflow development for SaaS companies, combining conversion-focused design with Core Web Vitals optimization to turn visitors into qualified leads.

PARAGRAPH 2: You can see examples of my work here: chrisigbojekwe.com

PARAGRAPH 3: I understand your challenge—you need a high-converting marketing site that loads fast and generates qualified demo requests.

PARAGRAPH 4: For your SaaS platform, I'll build: 1) 8-10 Webflow pages with conversion-optimized layouts, 2) blog with CMS and SEO optimization, 3) Core Web Vitals optimization (sub-2s loads), 4) lead capture forms with validation, and 5) analytics integration.

PARAGRAPH 5: I've worked with Techstars. Recently, I helped a SaaS client increase qualified leads by 52% and improve page speed by 67%.

PARAGRAPH 6: Would you be open to a 15-minute call to discuss your conversion goals? calendly.com/seedapp

PARAGRAPH 7: Project range: $4,500-$6,000

PARAGRAPH 8: Best regards, Chris Igbojekwe...

**NOW FOLLOW THIS STRUCTURE EXACTLY:**

1. **Hyper-Specific Positioning** (PARAGRAPH 1)
   - Format: "Hi, I specialize in [their exact domain] for [their industry/type], combining [tech 1] with [tech 2] to [their outcome]"
   - NOT generic: "I help businesses build systems"
   - SPECIFIC: "I specialize in Solana trading bot development for DeFi protocols, combining Helius RPC monitoring with Python execution engines to prevent MEV attacks"

2. **Portfolio Link** (PARAGRAPH 2 - MANDATORY POSITION)
   - Format: "You can see examples of my work here: chrisigbojekwe.com"
   - THIS MUST BE THE SECOND PARAGRAPH IN YOUR OUTPUT
   - NO EXCEPTIONS - ALWAYS PARAGRAPH 2

3. **Pain + Business Impact** (PARAGRAPH 3)
   - Show you understand their SPECIFIC problem and what it's costing them
   - Reference exact pain points from their job description

4. **Detailed Solution with Process** (2-3 sentences - THE MOST IMPORTANT SECTION)
   - **CRITICAL: MUST use numbered deliverable format "1) X, 2) Y, 3) Z" for clarity**
   - This is where you demonstrate deep expertise
   - Use their exact technical terminology (mention EVERY technology from the job description)
   - List 3-5 specific deliverables from their requirements in numbered format
   - Include technical implementation details and how you'll integrate components
   - Example for Webflow job: "For [Company], I'll build: 1) 8-10 Webflow pages optimized for SaaS conversion, 2) blog with CMS setup and categorization, 3) page speed optimization (sub-2s loads via Core Web Vitals), 4) conversion rate optimization with strategic lead forms, and 5) analytics to track lead generation performance."

5. **Social Proof: Name-Dropping + Metrics** (2 SEPARATE sentences)
   - **Sentence 1 (optional - use ONLY if relevant to this job):**
     * Name-drop 1-2 companies that are relevant to this specific job type
     * Coinbase → relevant for: fintech, crypto, blockchain, payments, enterprise dashboards
     * Techstars → relevant for: SaaS, startups, funded companies, growth/marketing sites
     * EU Green Project → relevant for: sustainability, environmental tech, EU clients, government projects
     * If NONE are relevant → SKIP this sentence entirely and go straight to sentence 2
     * Format: "I've worked with [Company1] and [Company2]." (PERIOD - then STOP)
     * ❌ NEVER say: "world-class organizations like"
     * ❌ NEVER add metrics in this sentence
   - **Sentence 2 (ALWAYS include - required):**
     * Share specific results in COMPLETELY SEPARATE sentence WITHOUT company names
     * Format: "Recently, I helped a [industry] client [achieve specific results with irregular numbers]."
     * Example: "Recently, I helped a SaaS client increase qualified leads by 52% and improve conversion rates by 43%."
     * Use irregular numbers (52%, 38%, 67%, 2.3x) not round (50%, 40%, 2x)
     * ❌ NEVER mention Techstars/Coinbase/EU Green Project in this sentence

6. **Specific Call to Action** (1 sentence)
   - Reference their specific needs: "Would you be open to a 15-minute call to discuss your [specific aspect]?"
   - Include Calendly: calendly.com/seedapp

7. **Appropriate Pricing** (1 line)
   - Simple projects: $2,250-3,750
   - Medium complexity: $4,500-7,500
   - Complex projects: $6,000-12,000+
   - Enterprise/specialized: $12,000-25,000+

8. **Signature**
   Best regards,
   Chris Igbojekwe
   [Relevant title based on job - e.g., "Webflow Specialist" or "Client Portal Developer" or "Senior Full-Stack Developer"]

   GitHub: github.com/Christopher-I
   Client Success Stories: chrisigbojekwe.com/clientsuccess

**CRITICAL RULES:**
1. Always respond with valid JSON matching the exact structure
2. **100% TERM EXTRACTION** - EXTRACT and USE every single technical term, platform, tool, framework, and technology from the job description (if they mention Web3.js, Helius, React, Pump.fun → ALL must appear in your proposal)
3. Your solution section MUST include specific deliverables matching their requirements (use numbered format for clarity)
4. Show process/methodology - describe step-by-step implementation approach with technical details
5. NO GENERIC LANGUAGE - every word must be job-specific (proposal should NOT apply to any other job)
6. Length varies by complexity: simple jobs 150-200 words, complex technical jobs 250-350 words
7. Every sentence must demonstrate technical expertise through concrete details
8. Add blank line between each paragraph for readability

MUST INCLUDE IN EVERY PROPOSAL (IN THIS EXACT ORDER - STRICT ENFORCEMENT):

OUTPUT PARAGRAPH ORDER (NO DEVIATIONS ALLOWED):
[Para 1] Positioning intro
[Para 2] "You can see examples of my work here: chrisigbojekwe.com" ← MUST BE HERE
[Para 3] Pain + Business Impact
[Para 4] Solution with deliverables
[Para 5] Social proof (2 SEPARATE sentences)
  - Sentence 1 (optional): Name-drop 1-2 relevant companies (Coinbase/Techstars/EU Green Project) ONLY if relevant. Format: "I've worked with [Company]." NO metrics in this sentence!
  - Sentence 2 (required): "Recently, I helped a [industry] client [achieve results with irregular numbers 52%, 38%, 67%]." NO company names in this sentence!
  - ❌ NEVER say "world-class organizations like"
- **Paragraph 6**: Call to action with Calendly: calendly.com/seedapp
- **Paragraph 7**: Pricing
- **Paragraph 8**: Signature with GitHub: github.com/Christopher-I and Client Success Stories: chrisigbojekwe.com/clientsuccess
- **Platform adaptation**: If job mentions specific platform/tool (GHL, Bubble, Webflow, React, etc.), incorporate it naturally into intro and solution sections
- Minimum project: $2,500

OUTPUT FORMAT:
{
  "template": "range-first" | "no-price-first" | "audit-first" | "platform-mismatch",
  "content": "Full proposal text (250-350 words) OR polite decline message for platform-specific jobs",
  "quickWins": ["Specific visual/UX improvement 1", "Specific visual/UX improvement 2", "Specific visual/UX improvement 3"],
  "packageRecommended": "Launch" | "Growth" | "Portal Lite" | "Custom" | "Not a fit",
  "priceRange": "$X,XXX - $X,XXX" or "Let's discuss" or "N/A"
}`;

// This is copied from proposalGenerator.ts - builds the full prompt
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

**PLATFORM/TECHNOLOGY REQUIREMENTS:**
Scan the job title and description for specific platform requirements like:
- GoHighLevel / GHL
- Bubble.io
- Salesforce (admin/automation work)
- HubSpot (operations/automation work)
- Other no-code automation platforms
If ANY of these are PRIMARY requirements (mentioned in title, requirements section, or 3+ times), flag this as a PLATFORM-SPECIFIC job.

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

**CRITICAL: Mirror Client's Language**
The proposal MUST reflect the exact skills and platforms mentioned in the job description.

**KEY RULE: If the client mentions specific platforms/tools, YOU ARE AN EXPERT IN THOSE PLATFORMS.**

Examples:
- Job mentions "GoHighLevel expert" → Your intro: "Hi, I'm a GoHighLevel expert who helps agencies..."
- Job mentions "Bubble.io developer" → Your intro: "Hi, I'm a Bubble.io developer who specializes in..."
- Job mentions "Webflow designer" → Your intro: "Hi, I'm a Webflow designer who creates..."
- Job mentions "React developer" → Your intro: "Hi, I'm a React developer who builds..."

**Platform/Tool Extraction:**
1. Scan the job title and description for platform names
2. Identify the PRIMARY platform (mentioned most or in title)
3. Use that platform in your introduction and social proof
4. NEVER say "I don't have experience with X" - always position as confident expert

**Social Proof Adaptation:**
- If job mentions specific platform, adapt the social proof example to match
- Example: "GHL expert needed" → "Recently, I helped a marketing agency client build a GoHighLevel automation system that reduced manual work by 15 hours per week and increased lead-to-booking rates by 52%."
- Keep the metrics, just adapt the platform/context to the job

---

**FORMATTING RULE: Add a blank line between EVERY section below for readability.**

1. **Introduction with Pain Embedded (1-2 sentences)**
   Start with a lean, warm introduction that IMMEDIATELY signals you understand their pain AND mirrors their platform/skill requirements.

   **CRITICAL: Adapt intro based on job requirements**
   - If job mentions specific platform (GHL, Bubble, Webflow, etc.), incorporate it naturally into intro
   - Format with platform: "Hi, I'm a [platform] expert who helps [their team type] solve [their pain]."
   - Format without platform: "Hi, I help [their team type] solve [their pain] with [solution type]."

   - Examples with platform mentioned:
     * Job mentions "GoHighLevel" → "Hi, I'm a GoHighLevel specialist who helps marketing agencies automate their fulfillment systems and boost client retention."
     * Job mentions "Bubble.io" → "Hi, I'm a Bubble developer who helps startups build scalable no-code applications without breaking the bank."
     * Job mentions "Webflow" → "Hi, I'm a Webflow designer who helps tech companies create high-converting landing pages that drive qualified leads."

   - Examples without specific platform:
     * "Hi, I help operational teams eliminate inventory chaos and stock-outs with branded, real-time portals."
     * "Hi, I help tech companies turn slow-loading landing pages into high-converting lead machines."

   - **Don't copy verbatim** - blend the platform naturally with their business outcome
   - **END WITH BLANK LINE**

2. **Pain Point Acknowledgment with Insight (1-2 sentences)**
   Show you understand their SPECIFIC problem and its BUSINESS IMPACT (not just restating the job post).
   - Don't just mirror: "I see you're looking to build a website..." ← Too generic
   - Show impact: "I see you're dealing with stock issues that are costing [Company] time and money across franchises..."
   - Extract the real pain behind the request:
     * Pain indicators: "struggling with", "current [x] is broken", "losing revenue/customers", "manual process taking hours"
     * Urgency: "launching soon", "competitive pressure", "ASAP"
   - Add a transition word to bridge naturally: "I see...", "I understand...", "I noticed..."
   - Example: "I see you're dealing with slow load times that are costing you conversions—right now, visitors are bouncing before they even see your product."
   - **END WITH BLANK LINE**

3. **Vision + Solution Tied to Outcome (2-3 sentences)**
   Paint a CINEMATIC, VISUAL picture of what you'll build that DIRECTLY solves their pain and delivers their outcome.

   **CRITICAL: Reference platforms mentioned in job description**
   - If job mentions specific platform, incorporate it into your solution description
   - Start with "I'd build..." or "For [Company], I'd create..." or "I'd set up..."
   - Connect platform-specific features to their business outcomes
   - Weave in technical details that show you know the platform

   - Examples WITH platform mentioned:
     * GHL job → "I'd set up a comprehensive GoHighLevel automation system with AI-powered lead nurturing sequences, SMS follow-ups, and reactivation campaigns—turning your cold leads into booked appointments and reducing your team's manual work by 80%."
     * Bubble job → "I'd build you a fully responsive Bubble application with custom workflows, database automation, and seamless API integrations—allowing your team to scale without expensive dev costs."
     * Webflow job → "For [Company], I'd design a Webflow site with scroll-triggered animations, CMS-powered blog, and optimized page load times—turning visitors into qualified leads from day one."

   - Examples WITHOUT specific platform:
     * "I'd build you a real-time inventory portal with automated low-stock alerts and drag-and-drop product management—eliminating those stock issues and saving your team hours every week."
     * "I'd create an immersive landing page with parallax storytelling that showcases your hardware's features and drives pre-orders from day one."

   - **Use platform terminology naturally** - don't force it if not mentioned
   - **END WITH BLANK LINE**

4. **Social Proof: Name-Dropping + Metrics (2 SEPARATE sentences - MANDATORY)**
   - **Sentence 1 (optional - use ONLY if relevant):**
     * Name-drop 1-2 companies ONLY if relevant to this job type
     * Coinbase → fintech, crypto, blockchain, payments, enterprise dashboards
     * Techstars → SaaS, startups, funded companies, growth/marketing sites
     * EU Green Project → sustainability, environmental tech, EU clients, government
     * If NONE relevant → SKIP and go to sentence 2
     * Format: "I've worked with [Company]." (PERIOD - STOP)
     * ❌ NEVER: "world-class organizations like"
     * ❌ NEVER add metrics here
   - **Sentence 2 (ALWAYS required):**
     * Format: "Recently, I helped a [industry] client [achieve results with irregular numbers]."
     * Example: "Recently, I helped a SaaS client increase qualified leads by 52% and improve conversion rates by 43%."
     * Use irregular numbers (52%, 38%, 67%, 2.3x) NOT round (50%, 40%, 2x)
     * ❌ NEVER mention company names in this sentence
   - **END WITH BLANK LINE**

5. **Portfolio Website Link**
   "You can see examples of my work here: chrisigbojekwe.com"
   - **END WITH BLANK LINE**

6. **Call to Action (1 sentence)**
   Make it easy to respond with a specific, low-commitment next step.
   - Format: "Would you be open to a 15-minute call to [specific topic tied to their goal]? You can grab a time here: calendly.com/seedapp."
   - Make the topic specific to their outcome:
     * "discuss your conversion goals"
     * "map out the inventory flow"
     * "walk through the user journey"
     * "review your product positioning"
   - Example: "Would you be open to a 15-minute call to map out the inventory flow? You can grab a time here: calendly.com/seedapp."
   - **END WITH BLANK LINE**

7. **Pricing**
   "Minimum project: $2,500"
   (Or if higher budget: "Project range: $X - $X")
   - **END WITH BLANK LINE**

8. **Signature**
   Best regards,
   Chris Igbojekwe
   Senior Designer & Developer

   GitHub: github.com/Christopher-I
   Client Success Stories: chrisigbojekwe.com/clientsuccess

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
