import fs from 'node:fs';
import path from 'node:path';
import { runAllGovernanceAndStringAudits } from '../src/services/auditRunner';
import { CLINICAL_THRESHOLDS, PROVISIONAL_CLINICAL_REVIEW } from '../src/data/clinicalGovernance';
import {
  CANINE_QOL_QUESTIONS,
  DISHAA_DOG_QUESTIONS,
  FELINE_QOL_QUESTIONS,
  VISHDAAL_CAT_QUESTIONS,
} from '../src/services/assessmentQuestions';
import { CORRELATION_RULE_SPECS, evaluateCorrelations } from '../src/services/correlationEngine';
import {
  FORBIDDEN_IN_CAT_PATHWAY,
  FORBIDDEN_IN_DOG_PATHWAY,
} from '../src/services/speciesPathway';
import {
  STARTER_CAT_MEDICATIONS,
  STARTER_CAT_PET,
  STARTER_MEDICATIONS,
  STARTER_PET,
  generateStarterCatHistory,
  generateStarterHistory,
} from '../src/data/starterData';
import { generateWeeklyChangeBrief } from '../src/services/briefGenerator';
import { buildPreVisitBriefPdfDoc } from '../src/services/pdfReportGenerator';

const ROOT = process.cwd();

function buildChecklistMarkdown(): string {
  const lines: string[] = [
    '# Clinical Review & Veterinary Governance Checklist',
    '',
    '> **Regulatory & Safety Notice:** Every clinical questionnaire item, quantitative threshold, and correlation rule below is flagged `requires_vet_review: true` (`"Requires licensed veterinarian review before release."`). Commercial release must not occur without formal licensed veterinarian sign-off below.',
    '',
    '## Provisional Build Tag (For Engineering Verification Only)',
    `- **Provisional Reviewer Field:** ${PROVISIONAL_CLINICAL_REVIEW.reviewer_name}`,
    `- **Provisional Tag Date:** ${PROVISIONAL_CLINICAL_REVIEW.review_date}`,
    '',
    '## 1. Cognitive Screening Questions — Canine (DISHAA, Age >= 7, Every 6 Months)',
    '| ID | Dimension | Owner Question & Plain Example | Vet Review Status |',
    '|---|---|---|---|',
    ...DISHAA_DOG_QUESTIONS.map(
      (q) =>
        `| \`${q.id}\` | ${q.dimensionLabel} | ${q.question} _(${q.plainExample})_ | [ ] Approved / [ ] Revise |`
    ),
    '',
    '## 2. Cognitive Screening Questions — Feline (VISHDAAL, Age >= 10, Every 6 Months)',
    '| ID | Dimension | Owner Question & Plain Example | Vet Review Status |',
    '|---|---|---|---|',
    ...VISHDAAL_CAT_QUESTIONS.map(
      (q) =>
        `| \`${q.id}\` | ${q.dimensionLabel} | ${q.question} _(${q.plainExample})_ | [ ] Approved / [ ] Revise |`
    ),
    '',
    '## 3. Quality of Life Questions — Canine (HHHHHMM Adapted)',
    '| ID | Category | Prompt | Vet Review Status |',
    '|---|---|---|---|',
    ...CANINE_QOL_QUESTIONS.map(
      (q) => `| \`${q.id}\` | ${q.title} | ${q.prompt} | [ ] Approved / [ ] Revise |`
    ),
    '',
    '## 4. Quality of Life Questions — Feline (HHHHHMM Adapted)',
    '| ID | Category | Prompt | Vet Review Status |',
    '|---|---|---|---|',
    ...FELINE_QOL_QUESTIONS.map(
      (q) => `| \`${q.id}\` | ${q.title} | ${q.prompt} | [ ] Approved / [ ] Revise |`
    ),
    '',
    '## 5. Quantitative Clinical Thresholds & Frequency Bands',
    '| ID | Name | Threshold Value | Rationale | Vet Review Status |',
    '|---|---|---|---|---|',
    ...CLINICAL_THRESHOLDS.map(
      (t) =>
        `| \`${t.id}\` | ${t.name} | ${t.thresholdValue} | ${t.rationale} | [ ] Approved / [ ] Revise |`
    ),
    '',
    '## 6. Pain / Anxiety / Cognition Correlation Rules (14-Day Window)',
    '| Rule ID | Rule Name | Window | Non-Diagnostic Guardrail | Vet Review Status |',
    '|---|---|---|---|---|',
    ...CORRELATION_RULE_SPECS.map(
      (r) =>
        `| \`${r.ruleId}\` | ${r.name} | ${r.windowDays} days | Prompt must ask owner to discuss with vet; zero diagnosis | [ ] Approved / [ ] Revise |`
    ),
    '',
    '---',
    '',
    '## Licensed Veterinarian Formal Sign-Off (Required Prior to Release)',
    '',
    '- **Reviewing Veterinarian Full Name & Credentials (DVM / VMD / BVSc):** __________________________________________',
    '- **Veterinary License Number & Issuing State / Jurisdiction:** __________________________________________',
    '- **Date of Clinical Review:** __________________________________________',
    '- **Reviewer Signature:** __________________________________________',
    '- **Clinical Notes / Requested Revisions:**',
    '',
    '```',
    '(Enter any required question wording edits, threshold adjustments, or approval notes here)',
    '```',
    '',
  ];
  return lines.join('\n');
}

function buildStringAuditMarkdown(report: ReturnType<typeof runAllGovernanceAndStringAudits>): string {
  const lines: string[] = [
    '# Species Pathway String Audit & Governance Verification Report',
    '',
    `- **Overall Audit Status:** ${report.passed ? 'PASS' : 'FAIL'}`,
    `- **Generated At:** ${new Date().toISOString()}`,
    `- **Clinical Items Tagged & Verified:** ${report.clinicalReviewItemsChecked}`,
    `- **Forbidden Dog Words Audited in Cat Pathway (${report.catForbiddenTokensChecked} tokens):** \`${FORBIDDEN_IN_CAT_PATHWAY.join('`, `')}\``,
    `- **Forbidden Cat Words Audited in Dog Pathway (${report.dogForbiddenTokensChecked} tokens):** \`${FORBIDDEN_IN_DOG_PATHWAY.join('`, `')}\``,
    '',
    '## Audit Findings',
    '| Scope | Status | Details |',
    '|---|---|---|',
    ...report.findings.map((f) => `| ${f.scope} | ${f.passed ? 'PASS' : 'FAIL'} | ${f.details} |`),
    '',
    '## Cat Pathway Leaks Found',
    report.catStringLeaks.length === 0 ? '- None (0 leaks detected).' : report.catStringLeaks.map((l) => `- ${l}`).join('\n'),
    '',
    '## Dog Pathway Leaks Found',
    report.dogStringLeaks.length === 0 ? '- None (0 leaks detected).' : report.dogStringLeaks.map((l) => `- ${l}`).join('\n'),
    '',
  ];
  return lines.join('\n');
}

async function main() {
  console.log('Running Senior Pet Care Monitor v2 build-time governance & string audits...');
  const report = runAllGovernanceAndStringAudits();

  for (const finding of report.findings) {
    console.log(`[${finding.passed ? 'PASS' : 'FAIL'}] ${finding.scope}: ${finding.details}`);
  }

  if (!report.passed) {
    console.error('Audit failed:');
    report.clinicalReviewFailures.forEach((e) => console.error('  -', e));
    report.catStringLeaks.forEach((e) => console.error('  -', e));
    report.dogStringLeaks.forEach((e) => console.error('  -', e));
    process.exit(1);
  }

  // Write CLINICAL_REVIEW_CHECKLIST.md and STRING_AUDIT_REPORT.md
  fs.writeFileSync(path.join(ROOT, 'CLINICAL_REVIEW_CHECKLIST.md'), buildChecklistMarkdown(), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'STRING_AUDIT_REPORT.md'), buildStringAuditMarkdown(report), 'utf8');

  // Generate Dog & Cat 1-Page Sample Pre-Visit Brief PDFs
  const samplesDir = path.join(ROOT, 'samples');
  fs.mkdirSync(samplesDir, { recursive: true });

  const dogHist = generateStarterHistory();
  const dogBrief = generateWeeklyChangeBrief(STARTER_PET.id, STARTER_PET.name, dogHist.checkIns, dogHist.events, 'dog');
  const dogCorrelations = evaluateCorrelations({
    pet: STARTER_PET,
    checkIns: dogHist.checkIns,
    events: dogHist.events,
    medications: STARTER_MEDICATIONS,
    doses: dogHist.doses,
    cognitiveLogs: dogHist.cognitiveLogs,
    storedCorrelationEvents: [],
  });
  const dogDoc = buildPreVisitBriefPdfDoc({
    pet: STARTER_PET,
    checkIns: dogHist.checkIns,
    events: dogHist.events,
    medications: STARTER_MEDICATIONS,
    doses: dogHist.doses,
    cognitiveLogs: dogHist.cognitiveLogs,
    qolLogs: dogHist.qolLogs,
    brief: dogBrief,
    correlations: dogCorrelations,
    ownerQuestions: [
      'Should we adjust Barnaby’s evening Carprofen timing for morning stiffness?',
      'Are his 2am pacing episodes linked to joint pain or DISHAA progression?',
      'Is any bloodwork needed before his next NSAID refill?',
    ],
    includeExtendedLog: false,
  });

  if (dogDoc.getNumberOfPages() !== 1) {
    throw new Error(`Expected Dog 1-Page Brief to be 1 page, got ${dogDoc.getNumberOfPages()}`);
  }
  const dogPdfPath = path.join(samplesDir, 'sample_dog_previsit_vet_brief.pdf');
  fs.writeFileSync(dogPdfPath, Buffer.from(dogDoc.output('arraybuffer')));

  const catHist = generateStarterCatHistory();
  const catBrief = generateWeeklyChangeBrief(STARTER_CAT_PET.id, STARTER_CAT_PET.name, catHist.checkIns, catHist.events, 'cat');
  const catCorrelations = evaluateCorrelations({
    pet: STARTER_CAT_PET,
    checkIns: catHist.checkIns,
    events: catHist.events,
    medications: STARTER_CAT_MEDICATIONS,
    doses: catHist.doses,
    cognitiveLogs: catHist.cognitiveLogs,
    storedCorrelationEvents: [],
  });
  const catDoc = buildPreVisitBriefPdfDoc({
    pet: STARTER_CAT_PET,
    checkIns: catHist.checkIns,
    events: catHist.events,
    medications: STARTER_CAT_MEDICATIONS,
    doses: catHist.doses,
    cognitiveLogs: catHist.cognitiveLogs,
    qolLogs: catHist.qolLogs,
    brief: catBrief,
    correlations: catCorrelations,
    ownerQuestions: [
      'Could Miso’s missed evening Gabapentin doses explain her louder 2am yowling?',
      'Should we review her CKD hydration support or blood pressure at this visit?',
      'Is a lower-entry litter box helpful alongside her arthritis care?',
    ],
    includeExtendedLog: false,
  });

  if (catDoc.getNumberOfPages() !== 1) {
    throw new Error(`Expected Cat 1-Page Brief to be 1 page, got ${catDoc.getNumberOfPages()}`);
  }
  const catPdfPath = path.join(samplesDir, 'sample_cat_previsit_vet_brief.pdf');
  fs.writeFileSync(catPdfPath, Buffer.from(catDoc.output('arraybuffer')));

  console.log(`Generated deliverables:`);
  console.log(`  - CLINICAL_REVIEW_CHECKLIST.md`);
  console.log(`  - STRING_AUDIT_REPORT.md`);
  console.log(`  - samples/sample_dog_previsit_vet_brief.pdf (${dogDoc.getNumberOfPages()} page)`);
  console.log(`  - samples/sample_cat_previsit_vet_brief.pdf (${catDoc.getNumberOfPages()} page)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
