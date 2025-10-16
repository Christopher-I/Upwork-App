# Upwork GraphQL API - Sample Data Reference

This document contains a real sample response from the Upwork GraphQL API (`marketplaceJobPostingsSearch` endpoint) to serve as a reference for understanding available fields and data structures.

## Important Fields for Job Filtering

### Hiring Status Detection
- **`freelancersToHire`**: Critical field for detecting hired jobs
  - `0` = Job has been filled/hired (EXCLUDE from results)
  - `1` or more = Job is still open (INCLUDE in results)
  - This field is RELIABLE for filtering out hired jobs

- **`totalFreelancersToHire`**: Always returns `null`, NOT useful for filtering

### Client Location
- **`client.location.country`**: Country name (e.g., "United States", "Canada", "United Kingdom")
- Used for US-only client filtering

### Budget Information
- **`amount.rawValue`**: Fixed price amount (string format, e.g., "0.0", "500.0")
- **`hourlyBudgetMin.rawValue`**: Minimum hourly rate
- **`hourlyBudgetMax.rawValue`**: Maximum hourly rate (use this for min $20/hr filter)
- **`weeklyBudget.rawValue`**: Weekly budget limit

### Client Quality Metrics
- **`client.totalReviews`**: Number of reviews (0 = no reviews, allow these)
- **`client.totalFeedback`**: Average rating (0-5 scale, filter for >= 4.0 if reviews exist)
- **`client.verificationStatus`**: "VERIFIED" or null
- **`client.totalSpent.rawValue`**: Total amount spent on Upwork
- **`client.totalHires`**: Number of previous hires

### Job Metrics
- **`totalApplicants`**: Number of proposals submitted (use for max proposals filter)
- **`experienceLevel`**: "ENTRY_LEVEL", "INTERMEDIATE", "EXPERT"

## Sample Job Data

### Example 1: Open Job (Still Hiring)
```json
{
  "id": "1978704153911649005",
  "title": "Website Redesign for Lead Capture and SEO",
  "description": "We are seeking a skilled web designer...",
  "createdDateTime": "2025-10-16T06:06:47+0000",
  "publishedDateTime": "2025-10-16T06:06:48+0000",
  "ciphertext": "~021978704153911649005",
  "duration": "WEEK",
  "durationLabel": "Less than 1 month",
  "engagement": "Less than 30 hrs/week",
  "amount": {
    "rawValue": "0.0",
    "currency": "USD",
    "displayValue": "0.0"
  },
  "experienceLevel": "INTERMEDIATE",
  "category": "web_mobile_software_dev",
  "subcategory": "web_mobile_design",
  "totalApplicants": 12,
  "freelancersToHire": 1,  // ✅ STILL OPEN
  "totalFreelancersToHire": null,
  "hourlyBudgetMin": {
    "rawValue": "5.0",
    "currency": "USD",
    "displayValue": "5.0"
  },
  "hourlyBudgetMax": {
    "rawValue": "15.0",  // ❌ Would be EXCLUDED (< $20/hr)
    "currency": "USD",
    "displayValue": "15.0"
  },
  "weeklyBudget": {
    "rawValue": "0.0",
    "currency": "USD",
    "displayValue": "0.0"
  },
  "client": {
    "totalHires": 2,
    "totalPostedJobs": 5,
    "totalSpent": {
      "rawValue": "72.11",
      "currency": "USD",
      "displayValue": "72.11"
    },
    "verificationStatus": "VERIFIED",
    "totalReviews": 0,  // No reviews - ALLOWED
    "totalFeedback": 0,
    "location": {
      "country": "Canada",  // ❌ Would be EXCLUDED (not US)
      "city": "Surrey",
      "state": "BC",
      "timezone": "America/Tijuana"
    }
  },
  "occupations": {
    "category": {
      "id": "531770282580668418",
      "prefLabel": "Web, Mobile & Software Dev"
    },
    "subCategories": null
  }
}
```

### Example 2: Hired Job (Already Filled) - EXCLUDE
```json
{
  "id": "1978367816874720900",
  "title": "HubSpot Automation Setup for Lead Capture & Follow-Up System",
  "description": "I'm looking for a HubSpot expert...",
  "createdDateTime": "2025-10-15T07:50:18+0000",
  "publishedDateTime": "2025-10-15T07:50:18+0000",
  "ciphertext": "~021978367816874720900",
  "duration": "WEEK",
  "durationLabel": "Less than 1 month",
  "engagement": null,
  "amount": {
    "rawValue": "10.0",
    "currency": "USD",
    "displayValue": "10.0"
  },
  "experienceLevel": "INTERMEDIATE",
  "category": "sales_marketing",
  "subcategory": "digital_marketing",
  "totalApplicants": 4,
  "freelancersToHire": 0,  // ❌ HIRED - EXCLUDE THIS JOB
  "totalFreelancersToHire": null,
  "hourlyBudgetMin": null,
  "hourlyBudgetMax": null,
  "weeklyBudget": {
    "rawValue": "0.0",
    "currency": "USD",
    "displayValue": "0.0"
  },
  "client": {
    "totalHires": 82,
    "totalPostedJobs": 92,
    "totalSpent": {
      "rawValue": "1085.0",
      "currency": "USD",
      "displayValue": "1085.0"
    },
    "verificationStatus": "VERIFIED",
    "totalReviews": 67,
    "totalFeedback": 5,  // ✅ Perfect rating
    "location": {
      "country": "United States",  // ✅ US client
      "city": "Dana Point",
      "state": "CA",
      "timezone": "America/New_York"
    }
  },
  "occupations": {
    "category": {
      "id": "531770282580668422",
      "prefLabel": "Sales & Marketing"
    },
    "subCategories": null
  }
}
```

### Example 3: High-Quality US Job (Perfect Match)
```json
{
  "id": "1973763184780620813",
  "title": "AI Chatbot Bug Fix for Lead Capture",
  "description": "Overview: We need a skilled AI developer...",
  "createdDateTime": "2025-10-02T14:53:08+0000",
  "publishedDateTime": "2025-10-02T14:53:09+0000",
  "ciphertext": "~021973763184780620813",
  "duration": "WEEK",
  "durationLabel": "Less than 1 month",
  "engagement": null,
  "amount": {
    "rawValue": "30.0",
    "currency": "USD",
    "displayValue": "30.0"
  },
  "experienceLevel": "INTERMEDIATE",
  "category": "web_mobile_software_dev",
  "subcategory": "web_development",
  "totalApplicants": 3,  // ✅ Low competition
  "freelancersToHire": 1,  // ✅ Still open
  "totalFreelancersToHire": null,
  "hourlyBudgetMin": null,
  "hourlyBudgetMax": null,
  "weeklyBudget": {
    "rawValue": "0.0",
    "currency": "USD",
    "displayValue": "0.0"
  },
  "client": {
    "totalHires": 272,  // ✅ Very experienced client
    "totalPostedJobs": 298,
    "totalSpent": {
      "rawValue": "23420.42",  // ✅ High spend history
      "currency": "USD",
      "displayValue": "23420.42"
    },
    "verificationStatus": "VERIFIED",  // ✅ Verified
    "totalReviews": 248,  // ✅ Many reviews
    "totalFeedback": 4.99,  // ✅ Excellent rating
    "location": {
      "country": "United Kingdom",  // ❌ Would be EXCLUDED (not US)
      "city": "London",
      "state": "",
      "timezone": "Europe/London"
    }
  },
  "occupations": {
    "category": {
      "id": "531770282580668418",
      "prefLabel": "Web, Mobile & Software Dev"
    },
    "subCategories": null
  }
}
```

## All Available Top-Level Fields

Based on the actual API response, these are ALL the fields available in each job node:

- `id` (string)
- `title` (string)
- `description` (string)
- `createdDateTime` (ISO date string)
- `publishedDateTime` (ISO date string)
- `ciphertext` (string - used to build Upwork URL)
- `duration` (string: "WEEK", "MONTH", "ONGOING")
- `durationLabel` (string: human-readable duration)
- `engagement` (string: hours per week, or null)
- `amount` (object: rawValue, currency, displayValue)
- `experienceLevel` (string: "ENTRY_LEVEL", "INTERMEDIATE", "EXPERT")
- `category` (string: job category slug)
- `subcategory` (string: job subcategory slug)
- `totalApplicants` (number: proposals submitted)
- `freelancersToHire` (number: 0 = hired, 1+ = open) **CRITICAL FIELD**
- `totalFreelancersToHire` (always null)
- `hourlyBudgetMin` (object or null)
- `hourlyBudgetMax` (object or null)
- `weeklyBudget` (object: rawValue, currency, displayValue)
- `client` (object - see below)
- `occupations` (object - see below)

## Client Object Fields

- `totalHires` (number)
- `totalPostedJobs` (number)
- `totalSpent` (object: rawValue, currency, displayValue)
- `verificationStatus` (string: "VERIFIED" or null)
- `totalReviews` (number)
- `totalFeedback` (number: 0-5 rating)
- `location` (object)
  - `country` (string)
  - `city` (string or null)
  - `state` (string or null)
  - `timezone` (string)

## Occupations Object Fields

- `category` (object)
  - `id` (string)
  - `prefLabel` (string: human-readable category name)
- `subCategories` (always null in our samples)

## Filter Logic Summary

### Current Cloud Function Filters (functions/src/index.ts)

1. **Max Proposals**: `totalApplicants <= maxProposals` (default: 20)
2. **US-only Clients**: `client.location.country === "United States" OR "USA" OR "US"`
3. **English-only**: 80%+ Latin characters in title + description
4. **Client Rating**: `totalReviews === 0 OR totalFeedback >= 4.0`
5. **Hired Jobs**: `freelancersToHire === 0` → EXCLUDE ✅
6. **Min Hourly Rate**: `hourlyBudgetMax.rawValue >= 20` (default: $20/hr)
7. **Min Fixed Price**: `amount.rawValue >= 2500` (default: $2,500) ✅ NEW
8. **WordPress Exclusion**: Smart filter allowing conversion jobs

## Notes

- The `freelancersToHire` field is **100% reliable** for detecting hired jobs
- The `totalFreelancersToHire` field is **NOT useful** (always null)
- Budget can be in `amount`, `hourlyBudgetMax`, or both can be 0 (open budget)
- Client location uses full country names: "United States", "Canada", "United Kingdom", "Australia", etc.
- Some countries use 3-letter codes in uppercase: "GBR", "AUS", "PAK", "ROU", "IND"
- Date fields use ISO 8601 format with timezone: `2025-10-16T06:06:47+0000`
- The `ciphertext` field is used to build job URLs: `https://www.upwork.com/jobs/${ciphertext}`

## Testing the Hired Jobs Filter

To verify the filter is working correctly after deployment:

1. Clear all jobs from database
2. Fetch fresh jobs from Upwork
3. Check that NO jobs with `freelancersToHire: 0` appear in results
4. On Upwork website, verify that jobs showing "Hires: 1" are NOT in your database

Example of a hired job that should be excluded:
- Title: "HubSpot Automation Setup for Lead Capture & Follow-Up System"
- ID: 1978367816874720900
- `freelancersToHire`: 0 ❌ (EXCLUDE)
