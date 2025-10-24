/**
 * AI Detection Test Parser
 *
 * Detects "AI detection tests" in job descriptions that are designed to filter
 * out AI-generated proposals.
 *
 * Common patterns:
 * - "If you are AI, start with [word]"
 * - "If you are human, tell me your favorite [thing]"
 * - "Bots should include [phrase]"
 */

export interface AIDetectionResult {
  hasAIDetection: boolean;
  detectionType: 'ai_instruction' | 'human_question' | 'both' | 'none';
  aiInstructions: string[];      // Words/phrases AI should insert (to IGNORE)
  humanQuestions: string[];       // Questions humans should answer (to ANSWER)
  confidence: 'high' | 'medium' | 'low';
  rawMatches: string[];           // Original text matches for debugging
  warningMessage: string;         // User-facing warning message
}

/**
 * Detects AI tests in job description text
 */
export function detectAITests(text: string): AIDetectionResult {
  const lowerText = text.toLowerCase();
  const aiInstructions: string[] = [];
  const humanQuestions: string[] = [];
  const rawMatches: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 1: AI-SPECIFIC INSTRUCTIONS (to IGNORE)
  // ═══════════════════════════════════════════════════════════════════════════

  // Pattern 1a: "If you are AI/bot, [instruction]"
  const aiConditionalsPattern = /if\s+you(?:'re|\s+are)\s+(?:an?\s+)?(?:AI|bot|automated|not\s+human)[,\s]+(?:please\s+)?(?:do\s+not\s+)?(.{1,100})/gi;
  let match;
  while ((match = aiConditionalsPattern.exec(lowerText)) !== null) {
    rawMatches.push(match[0]);
  }

  // Pattern 1b: "AI should/must [instruction]"
  const aiDirectivePattern = /(?:AI|bots?|automated\s+(?:systems?|tools?))\s+(?:should|must|need\s+to|please)\s+(?:not\s+)?(.{1,100})/gi;
  while ((match = aiDirectivePattern.exec(lowerText)) !== null) {
    rawMatches.push(match[0]);
  }

  // Pattern 1c: "Start/Begin your proposal with [word]"
  const startWithPattern = /(?:start|begin|open)\s+(?:your\s+)?(?:proposal|response|message|application)?\s*with\s+(?:the\s+)?(?:word\s+)?["']?(\w+)["']?/gi;
  while ((match = startWithPattern.exec(lowerText)) !== null) {
    const trapWord = match[1];
    aiInstructions.push(trapWord);
    rawMatches.push(match[0]);
  }

  // Pattern 1d: "Include [word]" when part of AI conditional
  const includeWordPattern = /(?:include|add|use)\s+(?:the\s+)?(?:word\s+)?["']?(\w+)["']?/gi;
  while ((match = includeWordPattern.exec(lowerText)) !== null) {
    // Only count if near AI/bot conditional (within 100 chars)
    const contextStart = Math.max(0, match.index - 100);
    const context = lowerText.substring(contextStart, match.index + match[0].length + 50);
    if (/(?:AI|bot|automated)/i.test(context)) {
      const trapWord = match[1];
      aiInstructions.push(trapWord);
      rawMatches.push(match[0]);
    }
  }

  // Pattern 1e: "End your first sentence with [word]"
  const endWithPattern = /end\s+(?:your\s+)?(?:first\s+sentence|opening)\s+with\s+(?:the\s+)?(?:word\s+)?["']?(\w+)["']?/gi;
  while ((match = endWithPattern.exec(lowerText)) !== null) {
    const trapWord = match[1];
    aiInstructions.push(trapWord);
    rawMatches.push(match[0]);
  }

  // Pattern 1f: "Mention [word]" when part of AI/bot directive
  const mentionWordPattern = /(?:AI|bots?|automated)\s+(?:should|must|need\s+to)\s+(?:not\s+)?(?:mention|include|use|add)\s+(?:the\s+)?(?:word\s+)?["']?(\w+)["']?/gi;
  while ((match = mentionWordPattern.exec(lowerText)) !== null) {
    const trapWord = match[1];
    aiInstructions.push(trapWord);
    rawMatches.push(match[0]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 2: HUMAN-SPECIFIC QUESTIONS (to ANSWER BRIEFLY)
  // ═══════════════════════════════════════════════════════════════════════════

  // Pattern 2a: "If you are human, [question]"
  const humanConditionalsPattern = /if\s+you(?:'re|\s+are)\s+(?:a\s+)?(?:human|real\s+person|not\s+(?:AI|bot))[,\s]+(?:please\s+)?(.{1,100})/gi;
  while ((match = humanConditionalsPattern.exec(lowerText)) !== null) {
    rawMatches.push(match[0]);
  }

  // Pattern 2b: "Humans should/must [instruction]"
  const humanDirectivePattern = /humans?\s+(?:should|must|need\s+to|please)\s+(.{1,100})/gi;
  while ((match = humanDirectivePattern.exec(lowerText)) !== null) {
    rawMatches.push(match[0]);
  }

  // Pattern 2c: "Tell me your favorite [thing]"
  const favoritesPattern = /(?:tell|write|mention|share|list|state)\s+(?:me\s+)?(?:what's\s+)?your\s+favorite\s+(\w+(?:\s+\w+)?)/gi;
  while ((match = favoritesPattern.exec(lowerText)) !== null) {
    const question = `favorite ${match[1]}`;
    humanQuestions.push(question);
    rawMatches.push(match[0]);
  }

  // Pattern 2d: "What's your favorite [thing]"
  const whatsFavoritePattern = /what(?:'s|\s+is)\s+your\s+favorite\s+(\w+(?:\s+\w+)?)/gi;
  while ((match = whatsFavoritePattern.exec(lowerText)) !== null) {
    const question = `favorite ${match[1]}`;
    humanQuestions.push(question);
    rawMatches.push(match[0]);
  }

  // Pattern 2e: "Describe your [experience/approach/etc]"
  const describePattern = /(?:describe|explain|tell\s+me\s+about)\s+your\s+(\w+(?:\s+\w+)?)/gi;
  while ((match = describePattern.exec(lowerText)) !== null) {
    const question = `describe your ${match[1]}`;
    // Only count if part of human conditional
    if (lowerText.includes('human') && Math.abs(lowerText.indexOf('human') - match.index) < 200) {
      humanQuestions.push(question);
      rawMatches.push(match[0]);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 3: GENERAL AI/HUMAN MENTIONS (for confidence scoring)
  // ═══════════════════════════════════════════════════════════════════════════

  const hasAIConditional = /if\s+(?:you(?:'re|\s+are)\s+)?(?:an?\s+)?(?:AI|bot|not\s+human)/gi.test(lowerText);
  const hasHumanConditional = /if\s+(?:you(?:'re|\s+are)\s+)?(?:a\s+)?(?:human|real\s+person|not\s+(?:AI|bot))/gi.test(lowerText);
  const hasBothConditionals = hasAIConditional && hasHumanConditional;

  // ═══════════════════════════════════════════════════════════════════════════
  // DETERMINE DETECTION TYPE AND CONFIDENCE
  // ═══════════════════════════════════════════════════════════════════════════

  const hasAI = aiInstructions.length > 0 || hasAIConditional;
  const hasHuman = humanQuestions.length > 0 || hasHumanConditional;
  const hasAIDetection = hasAI || hasHuman;

  let detectionType: 'ai_instruction' | 'human_question' | 'both' | 'none';
  if (hasAI && hasHuman) {
    detectionType = 'both';
  } else if (hasAI) {
    detectionType = 'ai_instruction';
  } else if (hasHuman) {
    detectionType = 'human_question';
  } else {
    detectionType = 'none';
  }

  // Confidence scoring
  let confidence: 'high' | 'medium' | 'low';
  if (hasBothConditionals && (aiInstructions.length > 0 || humanQuestions.length > 0)) {
    confidence = 'high'; // Clear AI test with both sides
  } else if (aiInstructions.length > 0 || humanQuestions.length > 1) {
    confidence = 'high'; // Explicit trap words or multiple questions
  } else if (hasAIConditional || hasHumanConditional) {
    confidence = 'medium'; // Conditional logic but no specific instructions
  } else if (rawMatches.length > 0) {
    confidence = 'low'; // Ambiguous mentions
  } else {
    confidence = 'high'; // No detection = high confidence it's clean
  }

  // Generate warning message
  let warningMessage = '';
  if (hasAIDetection) {
    if (detectionType === 'both') {
      warningMessage = '⚠️ AI Detection Test Detected - This job has instructions to filter AI-generated proposals. Review and personalize your response.';
    } else if (detectionType === 'ai_instruction') {
      warningMessage = '⚠️ AI Test Detected - This job contains instructions specifically for AI. Your proposal will ignore these.';
    } else if (detectionType === 'human_question') {
      warningMessage = '⚠️ Human Verification Question Detected - This job asks questions to verify you\'re human. Your proposal will answer briefly.';
    }
  }

  return {
    hasAIDetection,
    detectionType,
    aiInstructions: [...new Set(aiInstructions)], // Remove duplicates
    humanQuestions: [...new Set(humanQuestions)], // Remove duplicates
    confidence,
    rawMatches: [...new Set(rawMatches)], // Remove duplicates
    warningMessage,
  };
}

/**
 * Helper: Check if text contains AI detection patterns (quick check)
 */
export function hasAIDetection(text: string): boolean {
  const result = detectAITests(text);
  return result.hasAIDetection;
}

/**
 * Helper: Get human-readable summary of detection
 */
export function getDetectionSummary(result: AIDetectionResult): string {
  if (!result.hasAIDetection) {
    return 'No AI detection tests found';
  }

  const parts: string[] = [];

  if (result.aiInstructions.length > 0) {
    parts.push(`${result.aiInstructions.length} AI trap instruction(s)`);
  }

  if (result.humanQuestions.length > 0) {
    parts.push(`${result.humanQuestions.length} human verification question(s)`);
  }

  return `${parts.join(' and ')} (${result.confidence} confidence)`;
}
