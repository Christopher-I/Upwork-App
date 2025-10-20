import { applyRecommendationFilters } from './recommendationFilters';
import { DEFAULT_SETTINGS } from '../types/settings';

/**
 * Test the actual Clappia job from Upwork
 * Run with: npx tsx src/utils/testClappiaJob.ts
 */

const actualClappiaJob = {
  title: 'Clappia client portal',
  description: `Clappia Expert – HOA/Condo Loan Client Portal (Stage-Gated Checklists, RBAC)

Goal
Build a production-ready client portal in Clappia for community association loan + construction projects. The portal must enforce stage gating (can't advance until required documents are uploaded), support file checklists per stage, and provide admin dashboards + audit logs.

Scope (what you'll build)

Master Project Data (backbone)
Unique project_id (PRJ-#####), association, contacts, property & mailing addresses, EIN, parcel/folio, unit counts & fees, loan amount.
Status machine: Pre-Approval → Underwriting → Legal → Funding Scheduled → Construction → Final Review → Project Completed (plus Rejected).
Stage flags, attachments, bylaws fields (bylaws_file, has_bylaws, version/timestamp).

Client Intake (Pre-Approval)
Forms for association details, board members (repeatable), attorney, optional bylaws upload.
Workflow: create Master record, send client/admin emails.

Admin Review (Underwriting controller)
Actions: Approve / Reject / Request Info.
Gate rule: Bylaws optional in Pre-Approval but required to approve Underwriting (admin can upload or bypass with reason; all logged).
Emails and audit entry per action.

Reusable Stage Checklist app
Single app reused for Underwriting, Legal, Funding, Construction.
Drives a document checklist from a Checklist Catalog (stage, item name, required flag, uploader role, min files).
Shows per-row status + uploaded files; blocks submit until all required items present.
On success: sets stage flag and advances current_status.

Construction Draw Requests
Repeatable draw items (invoice, photos, notes) with admin approve/reject and Draw History.

Dashboards, Reports, Permissions
Admin dashboard: counts by stage, loan portfolio sum, "missing documents" report.
Client view: "My Projects" (scoped by logged-in email).
Role-based access (Admin vs Client).
Audit Logs for status changes, messages, document actions.`,
  score: 67,
  estimatedEHR: 100,
  client: {
    paymentVerified: false,
    rating: 0,
  },
  scoreBreakdown: {
    jobClarity: 15,
    ehrPotential: 13,
    professionalSignals: {
      weLanguage: 5,
      openBudget: 3,
      subtotal: 8,
    },
    clientQuality: {
      paymentVerified: 0,
      spendHistory: 0,
      recencyAndCompetition: 1,
      subtotal: 1,
    },
    keywordsMatch: 15,
    businessImpact: 13,
    redFlags: 0,
  },
  isDuplicate: false,
  isRepost: false,
  estimatedPrice: 12000,
};

console.log('═══════════════════════════════════════════════════════════════');
console.log('TESTING ACTUAL CLAPPIA JOB FROM UPWORK');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Job Title:', actualClappiaJob.title);
console.log('Score:', actualClappiaJob.score);
console.log('Estimated EHR:', actualClappiaJob.estimatedEHR);
console.log('\nMetrics:');
console.log('  - Job Clarity: 15/15 (perfect)');
console.log('  - EHR Potential: 13/15 (high)');
console.log('  - Team Language: 5/5 (professional)');
console.log('  - Open Budget: 3/5');
console.log('  - Client Quality: 1/25 (unverified)');
console.log('\nChecking if "Clappia" triggers exclusion filters...\n');

const result = applyRecommendationFilters(actualClappiaJob as any, DEFAULT_SETTINGS);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('RESULT:', result);
console.log(`Status: ${result === 'recommended' ? '✅ RECOMMENDED' : '❌ NOT RECOMMENDED'}`);
console.log('═══════════════════════════════════════════════════════════════');

// Check if "Clappia" is being detected as an excluded platform or non-dev pattern
if (actualClappiaJob.description.toLowerCase().includes('clappia')) {
  console.log('\nNote: Job mentions "Clappia" (a no-code platform)');
  console.log('This is a job to BUILD on Clappia, not avoid it.');
  console.log('Should be treated as a web development job.');
}
