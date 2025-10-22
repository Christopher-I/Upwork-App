/**
 * Types for Job Analyzer feature
 * Standalone job analysis without database dependency
 */

export interface JobAnalysisInput {
  description: string;
  budgetType: 'hourly' | 'fixed';
  budgetMin?: number;
  budgetMax?: number;
  duration?: string;
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  clientName?: string;
  questions?: string[];
}

export interface JobPricingRecommendation {
  budgetType: 'hourly' | 'fixed';
  recommendedRate?: number;          // For hourly jobs
  recommendedPrice?: number;         // For fixed-price jobs
  minRate?: number;                  // Hourly range minimum
  maxRate?: number;                  // Hourly range maximum
  estimatedHours?: number;           // Estimated hours for project
  reasoning: string;                 // Human-readable explanation
  confidenceLevel: 'low' | 'medium' | 'high';
  factors: {
    complexity: number;              // 1-10 scale
    scopeClarity: number;            // 1-10 scale (how well-defined)
    technicalSkills: string[];       // Detected skills/technologies
    estimatedDuration: string;       // Parsed from description
  };
}

export interface JobAnalysis {
  id: string;
  input: JobAnalysisInput;
  pricing: JobPricingRecommendation;
  proposal?: string;
  questionAnswers?: Array<{
    question: string;
    answer: string;
  }>;
  analyzedAt: Date;
}
