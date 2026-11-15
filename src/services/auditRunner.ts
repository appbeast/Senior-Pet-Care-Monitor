import { ClinicalReviewTag } from '../types';
import { CLINICAL_THRESHOLDS } from '../data/clinicalGovernance';
import { getEventCategoriesForSpecies, getEventTaxonomyForSpecies } from '../data/eventTaxonomy';
import {
  CANINE_QOL_QUESTIONS,
  DISHAA_DOG_QUESTIONS,
  FELINE_QOL_QUESTIONS,
  VISHDAAL_CAT_QUESTIONS,
} from './assessmentQuestions';
import { COGNITIVE_AGE_TRIGGER_CONFIG } from './cognitiveScheduler';
import { CORRELATION_RULE_SPECS, evaluateCorrelations } from './correlationEngine';
import { QOL_BAND_GOVERNANCE, QOL_FREQUENCY_DISCLAIMER, computeQoLPatternSummary } from './qolPatternService';
import {
  CAT_PATHWAY_COPY,
  DOG_PATHWAY_COPY,
  FORBIDDEN_IN_CAT_PATHWAY,
  FORBIDDEN_IN_DOG_PATHWAY,
} from './speciesPathway';
import { generateWeeklyChangeBrief } from './briefGenerator';
import {
  STARTER_CAT_MEDICATIONS,
  STARTER_CAT_PET,
  STARTER_PET,
  generateStarterCatHistory,
  generateStarterHistory,
} from '../data/starterData';

export interface AuditItemFinding {
  scope: string;
  passed: boolean;
  details: string;
}

export interface FullAuditReport {
  passed: boolean;
  clinicalReviewItemsChecked: number;
  clinicalReviewFailures: string[];
  catForbiddenTokensChecked: number;
  dogForbiddenTokensChecked: number;
  catStringLeaks: string[];
  dogStringLeaks: string[];
  findings: AuditItemFinding[];
}

function validateClinicalTag(label: string, tag: ClinicalReviewTag | undefined, failures: string[]): number {
  if (!tag) {
    failures.push(`${label}: missing clinicalReview tag`);
    return 1;
  }
  if (tag.requires_vet_review !== true) {
    failures.push(`${label}: requires_vet_review is not true`);
  }
  if (!tag.review_notice || !tag.review_notice.toLowerCase().includes('requires licensed veterinarian review')) {
    failures.push(`${label}: missing mandatory review_notice`);
  }
  if (!tag.reviewer_name || tag.reviewer_name.trim().length < 3) {
    failures.push(`${label}: missing reviewer_name`);
  }
  if (!tag.review_date || !/^\d{4}-\d{2}-\d{2}$/.test(tag.review_date)) {
    failures.push(`${label}: missing or invalid YYYY-MM-DD review_date`);
  }
  return 1;
}

function flattenStrings(obj: unknown): string[] {
  if (typeof obj === 'string') return [obj];
  if (Array.isArray(obj)) return obj.flatMap(flattenStrings);
  if (obj && typeof obj === 'object') {
    return Object.values(obj).flatMap(flattenStrings);
  }
  return [];
}

function findTokenLeaks(texts: { source: string; text: string }[], forbiddenTokens: string[]): string[] {
  const leaks: string[] = [];
  for (const { source, text } of texts) {
    if (!text) continue;
    const lower = text.toLowerCase();
    for (const token of forbiddenTokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lower)) {
        leaks.push(`[${source}] matched forbidden token "${token}" in: "${text}"`);
      }
    }
  }
  return leaks;
}

export function runAllGovernanceAndStringAudits(): FullAuditReport {
  const clinicalReviewFailures: string[] = [];
  let clinicalReviewItemsChecked = 0;

  DISHAA_DOG_QUESTIONS.forEach((q) => {
    clinicalReviewItemsChecked += validateClinicalTag(`DISHAA:${q.id}`, q.clinicalReview, clinicalReviewFailures);
  });
  VISHDAAL_CAT_QUESTIONS.forEach((q) => {
    clinicalReviewItemsChecked += validateClinicalTag(`VISHDAAL:${q.id}`, q.clinicalReview, clinicalReviewFailures);
  });
  CANINE_QOL_QUESTIONS.forEach((q) => {
    clinicalReviewItemsChecked += validateClinicalTag(`CanineQoL:${q.id}`, q.clinicalReview, clinicalReviewFailures);
  });
  FELINE_QOL_QUESTIONS.forEach((q) => {
    clinicalReviewItemsChecked += validateClinicalTag(`FelineQoL:${q.id}`, q.clinicalReview, clinicalReviewFailures);
  });
  CLINICAL_THRESHOLDS.forEach((t) => {
    clinicalReviewItemsChecked += validateClinicalTag(`Threshold:${t.id}`, t.clinicalReview, clinicalReviewFailures);
  });
  CORRELATION_RULE_SPECS.forEach((r) => {
    clinicalReviewItemsChecked += validateClinicalTag(`CorrelationRule:${r.ruleId}`, r.clinicalReview, clinicalReviewFailures);
  });
  clinicalReviewItemsChecked += validateClinicalTag(
    'CognitiveAgeTriggerConfig',
    COGNITIVE_AGE_TRIGGER_CONFIG.clinicalReview,
    clinicalReviewFailures
  );
  clinicalReviewItemsChecked += validateClinicalTag(
    'QoLBandGovernance',
    QOL_BAND_GOVERNANCE.clinicalReview,
    clinicalReviewFailures
  );

  // Species String Separation Audit
  const dogHistory = generateStarterHistory();
  const catHistory = generateStarterCatHistory();
  const dogBrief = generateWeeklyChangeBrief(STARTER_PET.id, STARTER_PET.name, dogHistory.checkIns, dogHistory.events, 'dog');
  const catBrief = generateWeeklyChangeBrief(STARTER_CAT_PET.id, STARTER_CAT_PET.name, catHistory.checkIns, catHistory.events, 'cat');

  const catTexts: { source: string; text: string }[] = [
    ...flattenStrings(CAT_PATHWAY_COPY).map((t) => ({ source: 'CAT_PATHWAY_COPY', text: t })),
    ...getEventCategoriesForSpecies('cat').flatMap((c) => [
      { source: `CatCategory:${c.id}:name`, text: c.name },
      { source: `CatCategory:${c.id}:desc`, text: c.description },
    ]),
    ...getEventTaxonomyForSpecies('cat').flatMap((ev) => [
      { source: `CatEvent:${ev.id}:name`, text: ev.name },
      { source: `CatEvent:${ev.id}:title`, text: ev.plainLanguageTitle },
      { source: `CatEvent:${ev.id}:prompt`, text: ev.observationPrompt },
      { source: `CatEvent:${ev.id}:note`, text: ev.clinicalNote },
    ]),
    ...VISHDAAL_CAT_QUESTIONS.flatMap((q) => [
      { source: `VISHDAAL:${q.id}:q`, text: q.question },
      { source: `VISHDAAL:${q.id}:ex`, text: q.plainExample },
    ]),
    ...FELINE_QOL_QUESTIONS.flatMap((q) => [
      { source: `FelineQoL:${q.id}:title`, text: q.title },
      { source: `FelineQoL:${q.id}:prompt`, text: q.prompt },
      { source: `FelineQoL:${q.id}:min`, text: q.minLabel },
      { source: `FelineQoL:${q.id}:max`, text: q.maxLabel },
    ]),
    ...flattenStrings(catBrief).map((t) => ({ source: 'CatWeeklyBrief', text: t })),
  ];

  const dogTexts: { source: string; text: string }[] = [
    ...flattenStrings(DOG_PATHWAY_COPY).map((t) => ({ source: 'DOG_PATHWAY_COPY', text: t })),
    ...getEventCategoriesForSpecies('dog').flatMap((c) => [
      { source: `DogCategory:${c.id}:name`, text: c.name },
      { source: `DogCategory:${c.id}:desc`, text: c.description },
    ]),
    ...getEventTaxonomyForSpecies('dog').flatMap((ev) => [
      { source: `DogEvent:${ev.id}:name`, text: ev.name },
      { source: `DogEvent:${ev.id}:title`, text: ev.plainLanguageTitle },
      { source: `DogEvent:${ev.id}:prompt`, text: ev.observationPrompt },
      { source: `DogEvent:${ev.id}:note`, text: ev.clinicalNote },
    ]),
    ...DISHAA_DOG_QUESTIONS.flatMap((q) => [
      { source: `DISHAA:${q.id}:q`, text: q.question },
      { source: `DISHAA:${q.id}:ex`, text: q.plainExample },
    ]),
    ...CANINE_QOL_QUESTIONS.flatMap((q) => [
      { source: `CanineQoL:${q.id}:title`, text: q.title },
      { source: `CanineQoL:${q.id}:prompt`, text: q.prompt },
      { source: `CanineQoL:${q.id}:min`, text: q.minLabel },
      { source: `CanineQoL:${q.id}:max`, text: q.maxLabel },
    ]),
    ...flattenStrings(dogBrief).map((t) => ({ source: 'DogWeeklyBrief', text: t })),
  ];

  const catStringLeaks = findTokenLeaks(catTexts, FORBIDDEN_IN_CAT_PATHWAY);
  const dogStringLeaks = findTokenLeaks(dogTexts, FORBIDDEN_IN_DOG_PATHWAY);

  // Additional functional guardrail checks
  const catCorrelations = evaluateCorrelations({
    pet: STARTER_CAT_PET,
    checkIns: catHistory.checkIns,
    events: catHistory.events,
    medications: STARTER_CAT_MEDICATIONS,
    doses: catHistory.doses,
    cognitiveLogs: catHistory.cognitiveLogs,
    storedCorrelationEvents: [],
  });
  const correlationLanguagePass =
    catCorrelations.length > 0 &&
    catCorrelations.every((c) => {
      const lower = c.promptText.toLowerCase();
      return (
        (lower.includes('ask your vet') ||
          lower.includes('mention to your vet') ||
          lower.includes('mention this timing to your vet')) &&
        !lower.includes('diagnos') &&
        !lower.includes('prescrib')
      );
    });

  const qolCheck = computeQoLPatternSummary([], 30);
  const qolUnloggedPass =
    qolCheck.goodDays === 0 &&
    qolCheck.unloggedDays === 30 &&
    qolCheck.disclaimer === QOL_FREQUENCY_DISCLAIMER;

  const findings: AuditItemFinding[] = [
    {
      scope: 'Clinical Review Metadata Governance',
      passed: clinicalReviewFailures.length === 0,
      details: `${clinicalReviewItemsChecked} clinical items/thresholds checked; ${clinicalReviewFailures.length} failures.`,
    },
    {
      scope: 'Cat Pathway Zero Dog-Word Audit',
      passed: catStringLeaks.length === 0,
      details: `${catTexts.length} cat pathway strings scanned against ${FORBIDDEN_IN_CAT_PATHWAY.length} dog tokens; ${catStringLeaks.length} leaks.`,
    },
    {
      scope: 'Dog Pathway Zero Cat-Word Audit',
      passed: dogStringLeaks.length === 0,
      details: `${dogTexts.length} dog pathway strings scanned against ${FORBIDDEN_IN_DOG_PATHWAY.length} cat tokens; ${dogStringLeaks.length} leaks.`,
    },
    {
      scope: 'Correlation Non-Diagnostic Language & Vet Prompt',
      passed: correlationLanguagePass,
      details: `${catCorrelations.length} active cat correlations verified to include vet-discussion framing and zero diagnostic claims.`,
    },
    {
      scope: 'QoL Unlogged Day Separation & Disclaimer',
      passed: qolUnloggedPass,
      details: 'Empty 30-day history yields 0 good days, 30 unlogged days, and mandatory disclaimer.',
    },
  ];

  const passed = findings.every((f) => f.passed);

  return {
    passed,
    clinicalReviewItemsChecked,
    clinicalReviewFailures,
    catForbiddenTokensChecked: FORBIDDEN_IN_CAT_PATHWAY.length,
    dogForbiddenTokensChecked: FORBIDDEN_IN_DOG_PATHWAY.length,
    catStringLeaks,
    dogStringLeaks,
    findings,
  };
}
