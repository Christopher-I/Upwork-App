# Architecture Documentation

## Overview

This document describes the architecture of the Upwork Job Assistant application after the refactoring completed in January 2025. The application is built with React + TypeScript, Firebase, and integrates with Anthropic Claude and OpenAI APIs for AI-powered features.

## Directory Structure

```
src/
├── components/          # React UI components
│   ├── Dashboard.tsx           # Main dashboard with tabs and filters
│   ├── JobCard.tsx             # Job listing card component
│   ├── JobDetailModal.tsx      # Job details modal with proposal generation
│   ├── JobFilters.tsx          # Filter controls component
│   ├── SettingsPanel.tsx       # User settings panel
│   └── AddMockDataButton.tsx   # Testing utility component
│
├── hooks/              # Custom React hooks
│   ├── useJobs.ts              # Job data management hook
│   ├── useSettings.ts          # Settings management hook
│   └── index.ts                # Barrel export
│
├── services/           # Business logic layer
│   ├── jobService.ts           # Job CRUD operations
│   ├── proposals/              # Proposal generation services
│   │   ├── claude.generator.ts    # Claude-based proposal generation
│   │   ├── openai.generator.ts    # OpenAI-based proposal generation
│   │   ├── questionAnswerer.ts    # AI question answering
│   │   └── index.ts               # Barrel export
│   └── index.ts                # Barrel export
│
├── utils/              # Pure utility functions
│   ├── scoring.ts              # Job scoring algorithm
│   ├── recommendationFilters.ts # Job recommendation logic
│   ├── jobFilters.ts           # Dashboard filtering and sorting
│   ├── pricingCalculator.ts   # Fair market value calculations
│   ├── tagDetection.ts         # Keyword and tag detection
│   ├── rateLimiter.ts          # API rate limiting
│   ├── duplicates.ts           # Duplicate job detection
│   ├── clearJobs.ts            # Job cleanup utilities
│   └── index.ts                # Barrel export
│
├── types/              # TypeScript type definitions
│   ├── job.ts                  # Job-related types
│   ├── settings.ts             # Settings types
│   ├── stats.ts                # Statistics types
│   ├── pricing.ts              # Pricing types
│   └── index.ts                # Barrel export
│
├── lib/                # Third-party integrations
│   └── firebase.ts             # Firebase initialization
│
├── config/             # Application configuration
│   └── ai.ts                   # AI provider configuration
│
└── tests/              # Test files
    ├── scoring.test.ts         # Scoring algorithm tests
    ├── recommendations.test.ts # Recommendation tests
    ├── filters.test.ts         # Filter tests
    ├── pricing.test.ts         # Pricing calculation tests
    ├── proposals.test.ts       # Proposal quality tests
    ├── platformJobs.test.ts    # Platform job tests
    └── fixtures/               # Test data and fixtures
        ├── clappiaJob.ts          # Clappia job fixture
        ├── complexJob.ts          # Complex job fixture
        └── mockData.ts            # Mock data utilities
```

## Design Principles

### 1. Separation of Concerns

**Components** (`src/components/`)
- Responsible for UI rendering and user interaction
- Use hooks to access data and business logic
- Minimal business logic - delegate to services and utilities
- Example: `JobDetailModal.tsx` uses `jobService` for all job operations

**Services** (`src/services/`)
- Centralized business logic layer
- Handle Firebase operations and external API calls
- Provide high-level operations (e.g., `markJobAsApplied()`)
- Include error handling and side effects (e.g., stats tracking)

**Utilities** (`src/utils/`)
- Pure functions without side effects
- Testable and reusable calculations
- No direct Firebase or API calls
- Example: Scoring, filtering, pricing calculations

**Hooks** (`src/hooks/`)
- Custom React hooks for data management
- Bridge between components and services
- Handle React-specific concerns (state, effects, memoization)

### 2. Discoverability

Related code is grouped together:

- **Job scoring**: All in `utils/scoring.ts`
- **Recommendations**: All in `utils/recommendationFilters.ts`
- **Pricing**: All in `utils/pricingCalculator.ts`
- **Proposals**: All in `services/proposals/`
- **Job operations**: All in `services/jobService.ts`
- **Filtering**: All in `utils/jobFilters.ts`

### 3. Import Convenience

Barrel exports (`index.ts`) enable clean imports:

```typescript
// Before
import { calculateJobScore } from '../utils/scoring';
import { applyRecommendationFilters } from '../utils/recommendationFilters';
import { calculateFairMarketValue } from '../utils/pricingCalculator';

// After
import {
  calculateJobScore,
  applyRecommendationFilters,
  calculateFairMarketValue
} from '../utils';
```

### 4. Testability

- Test files organized in dedicated `src/tests/` directory
- Pure utility functions are easily testable
- Test fixtures separated in `tests/fixtures/`
- Service layer can be mocked for component testing

## Where to Find Things

### Job Operations

**Creating/Updating Jobs**: `src/services/jobService.ts`
- `markJobAsApplied()` - Mark a job as applied
- `markJobAsWon()` - Mark a job as won
- `toggleJobRecommendation()` - Override job recommendation
- `saveProposal()` - Save generated proposal
- `updateJobField()` - Generic field update

### Proposal Generation

**All proposal logic**: `src/services/proposals/`
- `generateProposalWithClaude()` - Claude-based proposals (claude.generator.ts)
- `generateProposal()` - OpenAI-based proposals (openai.generator.ts)
- `answerClientQuestion()` - AI question answering (questionAnswerer.ts)
- `generateProposalWithActiveProvider` - Uses configured AI provider (index.ts)

### Job Scoring & Recommendations

**Scoring Algorithm**: `src/utils/scoring.ts`
- `calculateJobScore()` - Main scoring function
- `applyHardFilters()` - Hard requirement filtering
- Score breakdown: client quality, keywords, experience, budget

**Recommendation Logic**: `src/utils/recommendationFilters.ts`
- `applyRecommendationFilters()` - Determine if job should be recommended
- Checks: score threshold, client quality, payment verification, etc.

### Pricing Calculations

**Fair Market Value**: `src/utils/pricingCalculator.ts`
- `calculateFairMarketValue()` - Calculate estimated fair price
- `calculateHourlyRate()` - Convert to hourly rate
- `calculatePriceByBudget()` - Price based on budget type

### Filtering & Sorting

**Dashboard Filters**: `src/utils/jobFilters.ts`
- `filterAndSortJobs()` - Main filtering function
- `applyJobFilters()` - Apply all filter criteria
- `sortJobs()` - Sort by various criteria
- `filterByCountry()` - Country-based filtering

### Tag Detection

**Keyword Detection**: `src/utils/tagDetection.ts`
- `detectTags()` - Detect technology keywords in job description
- `detectDuration()` - Parse project duration
- `detectExperienceLevel()` - Parse experience requirements

### Data Access

**Jobs Hook**: `src/hooks/useJobs.ts`
- `useJobs(tab)` - Subscribe to jobs by tab (recommended/applied/all)
- `useJobCounts(country)` - Get job counts by category
- Real-time Firebase listeners

**Settings Hook**: `src/hooks/useSettings.ts`
- `useSettings()` - Access user settings
- `updateSettings()` - Update user settings
- Persistent in Firebase

## Key Architectural Decisions

### 1. Service Layer Pattern

**Why**: Separate Firebase operations from React components

**Benefits**:
- Components stay focused on UI
- Consistent error handling
- Easier to add stats tracking, logging, etc.
- Testable without React

**Example**:
```typescript
// src/services/jobService.ts
export async function markJobAsApplied(
  jobId: string,
  proposalContent?: string
): Promise<void> {
  await updateDoc(doc(db, 'jobs', jobId), {
    applied: true,
    appliedAt: new Date(),
    appliedProposal: proposalContent || '',
    status: 'applied',
  });
  await trackJobApplied(); // Stats tracking integrated
}
```

### 2. Pure Utility Functions

**Why**: Make business logic testable and reusable

**Benefits**:
- No side effects = easy to test
- No Firebase/API dependencies = fast tests
- Can be used in services, components, or other utilities

**Example**:
```typescript
// src/utils/scoring.ts
export function calculateJobScore(
  job: Job,
  settings: Settings
): number {
  // Pure function - no side effects
  // Can test with simple inputs/outputs
}
```

### 3. Barrel Exports

**Why**: Cleaner imports and easier refactoring

**Benefits**:
- Single import source per directory
- Easier to reorganize files
- Better developer experience

**Trade-offs**:
- Slightly larger initial bundle (mitigated by tree-shaking)

### 4. Test Organization

**Why**: Separate test files from production code

**Benefits**:
- Cleaner src directory
- Easier to exclude from production builds
- Dedicated fixtures directory

## Data Flow

### Job Display Flow

```
Firebase (jobs collection)
  ↓
useJobs hook (real-time listener)
  ↓
Dashboard component (applies filters)
  ↓
filterAndSortJobs() utility
  ↓
JobCard components (display)
```

### Proposal Generation Flow

```
User clicks "Generate Proposal"
  ↓
JobDetailModal component
  ↓
generateProposalWithActiveProvider() service
  ↓
Claude or OpenAI API call
  ↓
saveProposal() service
  ↓
Firebase (jobs collection)
```

### Job Application Flow

```
User clicks "Mark as Applied"
  ↓
JobDetailModal component
  ↓
markJobAsApplied() service
  ↓
Firebase update (job status)
  ↓
trackJobApplied() stats update
  ↓
useJobs hook (real-time update)
  ↓
Dashboard refreshes
```

## Conventions

### File Naming

- **Components**: PascalCase (e.g., `JobCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useJobs.ts`)
- **Services**: camelCase (e.g., `jobService.ts`)
- **Utilities**: camelCase (e.g., `pricingCalculator.ts`)
- **Types**: camelCase (e.g., `job.ts`)
- **Tests**: camelCase with `.test.ts` suffix (e.g., `scoring.test.ts`)

### Import Order

1. React and third-party libraries
2. Hooks (from `src/hooks`)
3. Services (from `src/services`)
4. Utils (from `src/utils`)
5. Types (from `src/types`)
6. Components (from `src/components`)
7. Local imports

Example:
```typescript
import { useState, useMemo } from 'react';
import { useJobs, useSettings } from '../hooks';
import { markJobAsApplied } from '../services';
import { calculateJobScore, filterAndSortJobs } from '../utils';
import { Job, Settings } from '../types';
import { JobCard } from './JobCard';
```

### Function Exports

- **Named exports** preferred over default exports
- Use barrel exports for public APIs
- Internal helper functions can be non-exported

### Error Handling

- Services throw errors with descriptive messages
- Components handle errors with user-friendly messages
- Use try-catch in async operations

### TypeScript

- Strict mode enabled
- Explicit return types on exported functions
- Avoid `any` - use `unknown` or specific types
- Interface for objects, type for unions/primitives

## Future Improvements

### Potential Enhancements

1. **Component Library**: Extract reusable UI components (Button, Card, Modal)
2. **API Layer**: Centralize all external API calls (Anthropic, OpenAI)
3. **State Management**: Consider Zustand/Redux if state complexity grows
4. **Testing**: Add unit tests for all services and utilities
5. **Error Logging**: Integrate error tracking (Sentry, LogRocket)
6. **Performance**: Add React.memo for expensive components

### Refactoring Considerations

- Keep services focused (single responsibility)
- Extract complex calculations to utilities
- Move Firebase queries to a data access layer if they grow
- Consider GraphQL/tRPC if API calls become complex

## Related Documentation

- [Scoring Guide](./SCORING_GUIDE.md) - Job scoring algorithm details
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Feature implementation guide
- [Setup Checklist](./SETUP_CHECKLIST.md) - Development setup

---

*Last updated: January 2025*
*Architecture grade: A- (Excellent separation of concerns and discoverability)*
