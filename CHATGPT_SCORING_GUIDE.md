# ChatGPT Scoring System - Prompt Engineering Guide

## Overview

This document explains how ChatGPT is used to score 3 key dimensions: **EHR Potential**, **Job Clarity**, and **Business Impact**.

The other 3 dimensions (Client Quality, Keywords Match, Professional Signals) are scored using deterministic algorithms.

---

## 🎯 Why Use ChatGPT for These 3 Dimensions?

### **EHR Potential** (Estimation)
- Requires understanding project scope and complexity
- Needs context about typical project pricing
- Must estimate hours based on deliverables mentioned
- **AI is better at:** Inferring scope from vague descriptions

### **Job Clarity** (Pattern Recognition)
- Needs to identify technical and clarity signals
- Must count specific indicators across varied language
- Requires semantic understanding (e.g., "8-10 pages" = clarity signal)
- **AI is better at:** Recognizing patterns in natural language

### **Business Impact** (Semantic Analysis)
- Must distinguish business outcomes from technical requirements
- Needs to detect subtle language cues ("need developer" vs "build system to achieve X")
- Requires understanding of business context
- **AI is better at:** Understanding intent and business value

---

## 📐 Prompt Engineering Strategy

### **Key Principles:**
1. **Structured Output (JSON)** - Forces consistent format
2. **Low Temperature (0.3)** - Reduces randomness, increases consistency
3. **Explicit Scoring Rules** - Clear guidelines for each point value
4. **Concrete Examples** - Show what to look for
5. **Validation** - Request reasoning to check work

---

## 🤖 System Prompt

The system prompt defines the AI's role and constraints:

```
You are an expert Upwork job evaluator specializing in web development projects.

CRITICAL RULES:
1. Always respond with valid JSON
2. Be objective and consistent
3. Base scores on concrete evidence
4. Explain your reasoning

OUTPUT FORMAT: (strict JSON structure)
```

**Why this works:**
- Sets clear role (expert evaluator)
- Establishes constraints (JSON only, objective)
- Emphasizes consistency (same input = same output)

---

## 📊 Dimension 1: EHR Potential (15 points)

### **Prompt Strategy:**

```
Goal: Estimate realistic price, hours, and EHR

Scoring Guidelines:
- 15 pts: $100+/hr
- 13 pts: $80-99/hr
- 10 pts: $60-79/hr
- 7 pts: $40-59/hr
- 3 pts: Below $40/hr

Estimation Rules:
1. If budget specified: Use as baseline
2. If not specified: Estimate based on complexity
3. Complexity guidelines:
   - Simple landing: 15-25 hrs
   - Multi-page site: 30-50 hrs
   - Portal/dashboard: 40-80 hrs
   - Complex system: 80-150 hrs
```

### **Why This Works:**

✅ **Clear Guidelines:** Explicit point values for each EHR range
✅ **Fallback Logic:** What to do if budget not specified
✅ **Reference Points:** Typical hour ranges for common projects
✅ **Formula Provided:** EHR = price / hours (forces calculation)

### **Expected Consistency:**

**Test Case:** "Build a client portal with dashboard and file sharing. Budget not specified."

**Expected Output (should be consistent):**
```json
{
  "score": 13,
  "estimatedPrice": 3500,
  "estimatedHours": 40,
  "estimatedEHR": 88,
  "reasoning": "Client portal with dashboard typically requires 35-45 hours. Estimated at $3,500 based on complexity, resulting in $88/hr EHR."
}
```

**Consistency Check:** Re-running same prompt should give ±$5/hr variance

---

## 📦 Dimension 2: Job Clarity (15 points)

### **Prompt Strategy:**

```
Goal: Count how many "boxes" are ticked

Technical Signals (tools/deliverables):
- Platforms: webflow, shopify, wordpress
- Features: portal, dashboard, landing page, cms, blog
- Services: page speed, seo, optimization

Clarity Signals (planning indicators):
- Quantities: "5 pages", "10 sections"
- Timeline: "3 weeks", "by January"
- Quality: "professional", "modern", "clean"
- Requirements: "mobile responsive", "forms"

Scoring:
- 15 pts: 6+ matches
- 14 pts: 4-5 matches
- 13 pts: 3 matches
- 10 pts: 2 matches
- 7 pts: 1 match
- 3 pts: 0 matches
```

### **Why This Works:**

✅ **Explicit Lists:** Shows exactly what to count
✅ **Two Categories:** Technical + Clarity = Total
✅ **Clear Math:** Count matches, assign points
✅ **Graduated Scale:** Smooth progression from vague to clear

### **Expected Consistency:**

**Test Case:** "Need Webflow site with 8 pages, blog, CMS, and mobile responsive design. Timeline: 3 weeks."

**Expected Output (should be consistent):**
```json
{
  "score": 15,
  "technicalMatches": 4,
  "clarityMatches": 4,
  "totalMatches": 8,
  "reasoning": "Technical: webflow, blog, cms, mobile. Clarity: 8 pages (quantity), 3 weeks (timeline), responsive (requirement), design (feature). Total: 8 boxes ticked."
}
```

**Consistency Check:** Should always identify same 8 signals

---

## 💼 Dimension 3: Business Impact (15 points)

### **Prompt Strategy:**

```
Goal: Business problem vs technical task?

Business Outcomes (look for):
1. Revenue: leads, sales, conversions, bookings
2. Efficiency: save time, automate, streamline
3. Growth: scale, grow, improve, expand
4. Metrics: tracking, analytics, reporting

Business Context (bonus):
- "our business", "our clients", "our team"

Technical-Only Red Flags:
- "need developer", "looking for developer"
- "must know [tech]", "experience in [tech]"

Scoring:
- 15 pts: Multiple categories + context
- 12 pts: 2-3 categories
- 8 pts: 1 category
- 0 pts: Technical-only (red flags + no outcomes)

SPECIAL RULE: Technical flags + zero outcomes = 0 points
```

### **Why This Works:**

✅ **Clear Categories:** 4 outcome types to check
✅ **Red Flag Detection:** Explicit technical-only patterns
✅ **Binary Rule:** Technical-only = automatic zero
✅ **Context Bonus:** Rewards business language

### **Expected Consistency:**

**Test Case 1:** "Build portal to streamline our client communications and reduce email overload."

**Expected Output:**
```json
{
  "score": 15,
  "detectedOutcomes": ["streamline", "reduce", "our client", "communications"],
  "isTechnicalOnly": false,
  "reasoning": "Strong business focus: efficiency (streamline, reduce), business context (our client). No technical-only flags."
}
```

**Test Case 2:** "Need React developer with 5 years experience. Must know JavaScript and Node.js."

**Expected Output:**
```json
{
  "score": 0,
  "detectedOutcomes": ["⚠️ technical-only (no business context)"],
  "isTechnicalOnly": true,
  "reasoning": "Technical-only job. Red flags: 'need developer', 'must know'. No business outcomes detected."
}
```

**Consistency Check:** Should consistently catch technical-only pattern

---

## 🧪 Testing Strategy

### **Run Tests Before Production:**

```bash
npm install
npm run dev
```

Then in browser console:
```javascript
import { testChatGPTScoring } from './utils/testChatGPTScoring';
await testChatGPTScoring();
```

### **Test Cases Included:**

1. **High Quality Job** (Client Portal)
   - Expected: High scores across all 3 dimensions

2. **Medium Quality Job** (Landing Page)
   - Expected: Good scores, some room for improvement

3. **Technical-Only Job** (React Developer)
   - Expected: 0 business impact, lower clarity

4. **Low Quality Job** (Quick Fix)
   - Expected: Low EHR, low clarity, low impact

### **What to Check:**

✅ **Scores are in range** (0-15 for each)
✅ **Math is correct** (EHR = price / hours)
✅ **JSON is valid** (no parsing errors)
✅ **Consistency** (same input → same output)
✅ **Reasoning makes sense** (explains the score)

---

## ⚙️ Configuration

### **Model Selection:**

```typescript
model: 'gpt-4o-mini'
```

**Why gpt-4o-mini?**
- Fast (< 2 seconds response)
- Cost-effective ($0.15 per 1M tokens)
- Sufficient for structured scoring tasks
- Good balance of speed and accuracy

**Alternative:** `gpt-4o` for higher accuracy (slower, more expensive)

### **Temperature:**

```typescript
temperature: 0.3
```

**Why 0.3?**
- Low enough for consistency
- High enough to handle varied language
- **Don't use 0.0:** Too rigid, might miss nuances
- **Don't use > 0.5:** Too creative, less consistent

### **Response Format:**

```typescript
response_format: { type: 'json_object' }
```

**Why JSON mode?**
- Guarantees valid JSON output
- Forces structured responses
- Reduces parsing errors
- Makes validation easy

---

## 🚨 Error Handling

### **Common Issues:**

**1. API Key Missing**
```typescript
if (!import.meta.env.VITE_OPENAI_API_KEY) {
  throw new Error('OpenAI API key not configured');
}
```

**2. Rate Limits**
```typescript
// Add retry logic with exponential backoff
await new Promise(resolve => setTimeout(resolve, 1000));
```

**3. Invalid JSON**
```typescript
try {
  const result = JSON.parse(response);
} catch (error) {
  console.error('Invalid JSON response:', response);
  // Fall back to rule-based scoring
}
```

**4. Missing Fields**
```typescript
// Validate structure
if (!result.ehrPotential || !result.jobClarity || !result.businessImpact) {
  throw new Error('Incomplete scoring result');
}
```

---

## 💡 Optimization Tips

### **Batch Processing:**

Instead of calling ChatGPT 3 times per job, we call once for all 3 dimensions:

```typescript
// ✅ GOOD: Single call for 3 scores
const result = await scoreJobWithChatGPT(title, description, budget);

// ❌ BAD: 3 separate calls
const ehr = await scoreEHR(job);
const clarity = await scoreClarity(job);
const impact = await scoreImpact(job);
```

**Savings:** ~66% reduction in API calls and cost

### **Caching:**

```typescript
// Cache results by job hash
const jobHash = hashJob(title, description, budget);
if (cache.has(jobHash)) {
  return cache.get(jobHash);
}
```

### **Fallback to Rules:**

If ChatGPT fails, fall back to rule-based scoring:

```typescript
try {
  return await scoreJobWithChatGPT(job);
} catch (error) {
  console.warn('ChatGPT failed, using rule-based scoring');
  return scoreJobWithRules(job);
}
```

---

## 📈 Expected Performance

### **Accuracy:**

- **EHR Estimation:** ±10% variance from manual estimates
- **Job Clarity:** 90%+ agreement with human raters
- **Business Impact:** 95%+ accuracy on technical-only detection

### **Speed:**

- **Single job:** 1-2 seconds
- **Batch of 20 jobs:** 20-40 seconds (with rate limiting)

### **Cost:**

- **Per job:** ~$0.001-0.002 (0.1-0.2 cents)
- **Per 1000 jobs:** ~$1-2
- **Monthly (5000 jobs):** ~$5-10

---

## 🎯 Integration with Main Scoring

### **Current Flow:**

```
1. Fetch job from Upwork
2. Score Client Quality (rules) ← 25 pts
3. Score Keywords Match (rules) ← 15 pts
4. Score Professional Signals (rules) ← 10 pts
5. Call ChatGPT for 3 dimensions:
   - EHR Potential ← 15 pts
   - Job Clarity ← 15 pts
   - Business Impact ← 15 pts
6. Score Red Flags (rules) ← -10 pts
7. Calculate total (0-100)
8. Apply hard filters
9. Store in Firestore
```

### **Benefits:**

✅ **Hybrid Approach:** Rules for what's deterministic, AI for what requires judgment
✅ **Fast:** Only 1 AI call per job
✅ **Reliable:** Fallback to rules if AI fails
✅ **Cost-Effective:** Minimal API usage

---

## 📚 Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add OpenAI API key to `.env.local`:**
   ```
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```

3. **Run tests:**
   ```javascript
   import { testChatGPTScoring } from './utils/testChatGPTScoring';
   await testChatGPTScoring();
   ```

4. **Review results and adjust prompts if needed**

5. **Integrate into main scoring flow:**
   - Update `scoring.ts` to call ChatGPT
   - Add error handling and fallbacks
   - Test with real Upwork jobs

---

**The prompt engineering is designed for reliability and consistency. The key is explicit instructions, structured output, and low temperature for deterministic results.** 🎯
