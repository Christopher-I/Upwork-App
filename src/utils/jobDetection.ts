/**
 * Job Detection Utilities
 *
 * Modular pattern detection for job classification.
 * Each detection function is independent and can be enabled/disabled.
 */

export interface DetectionResult {
  isDetected: boolean;
  confidence: 'high' | 'medium' | 'low';
  patterns: string[];
  metadata?: Record<string, any>;
}

// ============================================
// CUSTOM APPLICATION DETECTION (EXISTING - REFACTORED)
// ============================================

export function detectCustomApplication(text: string): DetectionResult & {
  hasOpenBudget?: boolean;
  hasSkillMatch?: boolean;
  tier?: number;
} {
  const lowerText = text.toLowerCase();

  // High confidence patterns
  const highConfidence = [
    'custom application', 'custom app', 'custom platform',
    'custom software', 'custom solution', 'custom web app',
    'custom system', 'build from scratch', 'built from scratch',
    'from scratch', 'custom-built', 'fully custom',
    'completely custom', 'bespoke application', 'bespoke platform'
  ];

  // Medium confidence patterns
  const mediumConfidence = [
    'custom website', 'custom development', 'bespoke'
  ];

  const hasHigh = highConfidence.some(pattern => lowerText.includes(pattern));
  const hasMedium = mediumConfidence.some(pattern => lowerText.includes(pattern));

  // False positive prevention
  const isNotCustom = lowerText.includes('customer') &&
                      !lowerText.includes('custom ') &&
                      !lowerText.includes('custom-');
  const isCustomization = (lowerText.includes('customize existing') ||
                           lowerText.includes('customization of')) && !hasHigh;

  const isDetected = (hasHigh || hasMedium) && !isNotCustom && !isCustomization;

  if (!isDetected) {
    return { isDetected: false, confidence: 'low', patterns: [] };
  }

  const matchedPatterns: string[] = [];
  if (hasHigh) matchedPatterns.push(...highConfidence.filter(p => lowerText.includes(p)));
  if (hasMedium) matchedPatterns.push(...mediumConfidence.filter(p => lowerText.includes(p)));

  return {
    isDetected: true,
    confidence: hasHigh ? 'high' : 'medium',
    patterns: matchedPatterns,
  };
}

// ============================================
// US-BASED FREELANCER DETECTION (NEW)
// ============================================

export function detectUSBased(text: string): DetectionResult & {
  timeZone?: string;
  timeZoneMentioned?: boolean;
} {
  const lowerText = text.toLowerCase();

  // High confidence patterns (Tier 1)
  const highConfidencePatterns = [
    'us based', 'us-based', 'usa based', 'usa-based',
    'located in the us', 'located in usa', 'located in the united states',
    'united states based', 'united states only', 'us only',
    'us freelancer', 'usa freelancer', 'american freelancer',
    'american developer', 'american designer',
  ];

  // Time zone patterns (also Tier 1)
  const timeZonePatterns = [
    'us time zone', 'usa time zone', 'work in us time',
    'eastern time', 'pacific time', 'central time', 'mountain time',
    'est', 'pst', 'cst', 'mst', 'edt', 'pdt', 'cdt', 'mdt'
  ];

  // Medium confidence - standalone US/USA with word boundaries (Tier 2)
  const usStandaloneRegex = /\b(US|USA)\b/g;

  // False positive prevention
  const falsePositives = [
    'usability', 'discuss', 'focus', 'bonus', 'usada',
    'customer', 'consensus', 'status', 'versus', 'jesus'
  ];

  // Check high confidence
  const hasHighConfidence = highConfidencePatterns.some(pattern =>
    lowerText.includes(pattern)
  );

  // Check time zones
  const detectedTimeZones: string[] = [];
  timeZonePatterns.forEach(tz => {
    if (lowerText.includes(tz)) {
      detectedTimeZones.push(tz.toUpperCase());
    }
  });
  const hasTimeZone = detectedTimeZones.length > 0;

  // Check standalone US/USA (only if no false positives)
  let hasStandaloneUS = false;
  const standaloneMatches = text.match(usStandaloneRegex);
  if (standaloneMatches) {
    // Verify it's not part of a false positive word
    hasStandaloneUS = !falsePositives.some(fp => {
      const fpLower = fp.toLowerCase();
      return lowerText.includes(fpLower) &&
        standaloneMatches.some(match => {
          const index = text.indexOf(match);
          const context = text.substring(Math.max(0, index - 5), index + match.length + 5).toLowerCase();
          return context.includes(fpLower);
        });
    });
  }

  // Determine detection result
  const isDetected = hasHighConfidence || hasTimeZone || hasStandaloneUS;

  if (!isDetected) {
    return {
      isDetected: false,
      confidence: 'low',
      patterns: [],
      timeZoneMentioned: false
    };
  }

  // Determine confidence level
  const confidence: 'high' | 'medium' = (hasHighConfidence || hasTimeZone) ? 'high' : 'medium';

  // Collect matched patterns
  const matchedPatterns: string[] = [];
  if (hasHighConfidence) {
    matchedPatterns.push(...highConfidencePatterns.filter(p => lowerText.includes(p)));
  }
  if (hasTimeZone) {
    matchedPatterns.push(...detectedTimeZones);
  }
  if (hasStandaloneUS && standaloneMatches) {
    matchedPatterns.push(...standaloneMatches);
  }

  return {
    isDetected: true,
    confidence,
    patterns: matchedPatterns,
    timeZone: detectedTimeZones[0] || undefined,
    timeZoneMentioned: hasTimeZone,
  };
}

// ============================================
// DASHBOARD SPECIALTY DETECTION (NEW)
// ============================================

export function detectDashboard(text: string): DetectionResult {
  const lowerText = text.toLowerCase();

  const dashboardPatterns = [
    'dashboard', 'dashboards', 'admin panel', 'admin dashboard',
    'analytics dashboard', 'reporting dashboard', 'data visualization',
    'metrics dashboard', 'kpi dashboard', 'business intelligence',
    'bi dashboard', 'data dashboard'
  ];

  const hasMatch = dashboardPatterns.some(pattern => lowerText.includes(pattern));

  if (!hasMatch) {
    return { isDetected: false, confidence: 'low', patterns: [] };
  }

  const matchedPatterns = dashboardPatterns.filter(p => lowerText.includes(p));

  return {
    isDetected: true,
    confidence: 'high',
    patterns: matchedPatterns,
  };
}

// ============================================
// WEBFLOW DETECTION (EXISTING - MOVED HERE)
// ============================================

export function detectWebflow(text: string): DetectionResult {
  const lowerText = text.toLowerCase();
  const patterns = ['webflow', 'web flow'];
  const hasMatch = patterns.some(pattern => lowerText.includes(pattern));

  if (!hasMatch) {
    return { isDetected: false, confidence: 'low', patterns: [] };
  }

  return {
    isDetected: true,
    confidence: 'high',
    patterns: patterns.filter(p => lowerText.includes(p)),
  };
}

// ============================================
// PORTAL DETECTION (EXISTING - MOVED HERE)
// ============================================

export function detectPortal(text: string): DetectionResult {
  const lowerText = text.toLowerCase();

  const portalPatterns = [
    'portal', 'member area', 'membership', 'member site'
  ];

  const hasMatch = portalPatterns.some(pattern => lowerText.includes(pattern));

  if (!hasMatch) {
    return { isDetected: false, confidence: 'low', patterns: [] };
  }

  return {
    isDetected: true,
    confidence: 'high',
    patterns: portalPatterns.filter(p => lowerText.includes(p)),
  };
}
