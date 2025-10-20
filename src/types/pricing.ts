/**
 * TypeScript types for pricing recommendations
 */

export type ComplexityTier = 'low' | 'medium' | 'high';

export interface HourlyPricing {
  recommendedRate: number;
  estimatedHours: number;
  totalEstimate: number;
  complexity: ComplexityTier;
  reasoning: string[];
  rateRange: {
    min: number;
    max: number;
  };
}

export interface ProjectPhase {
  number: number;
  name: string;
  description: string;
  price: number;
  percentage: number;
  deliverables: string[];
}

export interface FixedPricePricing {
  totalPrice: number;
  phases: ProjectPhase[];
  paymentSchedule: string;
}

export type PricingRecommendation =
  | {
      type: 'hourly';
      data: HourlyPricing;
    }
  | {
      type: 'fixed';
      data: FixedPricePricing;
    }
  | {
      type: 'error';
      message: string;
    };
