import {
  ClinicalReviewTag,
  CognitiveAssessmentLog,
  CorrelationEvent,
  CorrelationRuleId,
  DailyCheckIn,
  DoseLog,
  EvaluatedCorrelationAlert,
  MedicationSchedule,
  PetEvent,
  PetRecord,
} from '../types';
import { PROVISIONAL_CLINICAL_REVIEW } from '../data/clinicalGovernance';
import { resolveSpeciesPathway } from './speciesPathway';

export interface CorrelationRuleSpec {
  ruleId: CorrelationRuleId;
  name: string;
  windowDays: number;
  adherenceThresholdPct?: number;
  clinicalReview: ClinicalReviewTag;
}

export const CORRELATION_RULE_SPECS: CorrelationRuleSpec[] = [
  {
    ruleId: 'pain_med_adherence_pain_rise',
    name: 'Pain Medication Adherence Drop + Pain Increase',
    windowDays: 14,
    adherenceThresholdPct: 85,
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    ruleId: 'pain_cognition_move_together',
    name: 'Pain & Cognitive Scores Moving Together (14-Day Window)',
    windowDays: 14,
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    ruleId: 'anxiety_nocturnal_combined',
    name: 'Anxiety + Night Vocalisation (Cats) / Disorientation (Dogs)',
    windowDays: 14,
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    ruleId: 'new_med_cognitive_timing',
    name: 'New Medication Started Within 14 Days of Cognitive Change',
    windowDays: 14,
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
];

function isPainOrAnxietyMedication(med: MedicationSchedule): boolean {
  if (med.targetCategory === 'pain' || med.targetCategory === 'anxiety') return true;
  const hay = `${med.name} ${med.instructions || ''}`.toLowerCase();
  return (
    hay.includes('pain') ||
    hay.includes('carprofen') ||
    hay.includes('rimadyl') ||
    hay.includes('gabapentin') ||
    hay.includes('meloxicam') ||
    hay.includes('solensia') ||
    hay.includes('librela') ||
    hay.includes('galliprant') ||
    hay.includes('trazodone') ||
    hay.includes('arthritis') ||
    hay.includes('joint') ||
    hay.includes('comfort')
  );
}

export function evaluateCorrelations(params: {
  pet: PetRecord;
  checkIns: DailyCheckIn[];
  events: PetEvent[];
  medications: MedicationSchedule[];
  doses: DoseLog[];
  cognitiveLogs: CognitiveAssessmentLog[];
  storedCorrelationEvents: CorrelationEvent[];
}): EvaluatedCorrelationAlert[] {
  const { pet, checkIns, events, medications, doses, cognitiveLogs, storedCorrelationEvents } = params;
  const pathway = resolveSpeciesPathway(pet);
  const now = Date.now();
  const dayMs = 86400000;
  const window14Start = now - 14 * dayMs;
  const prior30Start = now - 30 * dayMs;

  const recent14CheckIns = checkIns.filter((c) => c.timestamp >= window14Start);
  const priorCheckIns = checkIns.filter((c) => c.timestamp >= prior30Start && c.timestamp < window14Start);
  const recent14Events = events.filter((e) => e.timestamp >= window14Start);
  const priorEvents = events.filter((e) => e.timestamp >= prior30Start && e.timestamp < window14Start);

  // 1. Pain signal in last 14 days
  const avgComfort14 =
    recent14CheckIns.length > 0
      ? recent14CheckIns.reduce((s, c) => s + c.comfortPain, 0) / recent14CheckIns.length
      : null;
  const avgComfortPrior =
    priorCheckIns.length > 0
      ? priorCheckIns.reduce((s, c) => s + c.comfortPain, 0) / priorCheckIns.length
      : null;

  const comfortDropPct =
    avgComfort14 !== null && avgComfortPrior !== null && avgComfortPrior > 0
      ? Math.round(((avgComfortPrior - avgComfort14) / avgComfortPrior) * 100)
      : 0;

  const painEvents14 = recent14Events.filter(
    (e) =>
      e.category === 'pain_vitals' ||
      e.eventTypeId.startsWith('pain_') ||
      e.eventTypeId.startsWith('mob_')
  );
  const priorPainEvents = priorEvents.filter(
    (e) =>
      e.category === 'pain_vitals' ||
      e.eventTypeId.startsWith('pain_') ||
      e.eventTypeId.startsWith('mob_')
  );

  const painSignalRose =
    comfortDropPct >= 10 ||
    (painEvents14.length >= 2 && painEvents14.length > priorPainEvents.length) ||
    (avgComfort14 !== null && avgComfort14 <= 3.1 && recent14CheckIns.length >= 4);

  // 2. Pain medication adherence in last 14 days
  const painMedIds = new Set(medications.filter(isPainOrAnxietyMedication).map((m) => m.id));
  const painDoses14 = doses.filter((d) => d.timestamp >= window14Start && painMedIds.has(d.medicationId));
  const painAdherence14 =
    painDoses14.length > 0
      ? Math.round((painDoses14.filter((d) => d.status === 'given').length / painDoses14.length) * 100)
      : 100;
  const adherenceDropped = painDoses14.length >= 4 && painAdherence14 < 85;

  // 3. Cognitive signal in last 14 days
  const sortedCog = [...cognitiveLogs].sort((a, b) => b.timestamp - a.timestamp);
  const latestCog = sortedCog[0];
  const prevCog = sortedCog[1];
  const cogScreenWorsenedIn14d =
    !!latestCog &&
    latestCog.timestamp >= window14Start &&
    !!prevCog &&
    latestCog.totalScore - prevCog.totalScore >= 4;

  const cogEvents14 = recent14Events.filter((e) => e.category === 'cognitive');
  const priorCogEvents = priorEvents.filter((e) => e.category === 'cognitive');
  const cogEventsIncreasedIn14d = cogEvents14.length >= 2 && cogEvents14.length >= priorCogEvents.length;

  const cognitiveWorsenedIn14d = cogScreenWorsenedIn14d || cogEventsIncreasedIn14d;

  // 4. Anxiety & species-specific nocturnal/disorientation events in last 14 days
  const anxietyEvents14 = recent14Events.filter(
    (e) =>
      e.eventTypeId === 'cog_anxiety' ||
      e.eventTypeId === 'pain_restless' ||
      e.eventName.toLowerCase().includes('anxiety') ||
      e.eventName.toLowerCase().includes('cling')
  );
  const priorAnxietyEvents = priorEvents.filter(
    (e) =>
      e.eventTypeId === 'cog_anxiety' ||
      e.eventTypeId === 'pain_restless' ||
      e.eventName.toLowerCase().includes('anxiety') ||
      e.eventName.toLowerCase().includes('cling')
  );
  const anxietyIncreased = anxietyEvents14.length >= 1 && anxietyEvents14.length > priorAnxietyEvents.length;

  const headlineCog14 = recent14Events.filter((e) =>
    pathway === 'cat'
      ? e.eventTypeId === 'cog_cat_night_vocal' || e.eventName.toLowerCase().includes('vocal')
      : e.eventTypeId === 'cog_dog_disorient' || e.eventName.toLowerCase().includes('disorient')
  );
  const priorHeadlineCog = priorEvents.filter((e) =>
    pathway === 'cat'
      ? e.eventTypeId === 'cog_cat_night_vocal' || e.eventName.toLowerCase().includes('vocal')
      : e.eventTypeId === 'cog_dog_disorient' || e.eventName.toLowerCase().includes('disorient')
  );
  const headlineSignIncreased =
    headlineCog14.length >= 1 && headlineCog14.length >= priorHeadlineCog.length;

  // 5. New medication started within 14 days of a cognitive change
  const recentStartedMeds = medications.filter((m) => {
    if (!m.startDate) return false;
    const startMs = new Date(m.startDate).getTime();
    return Math.abs(now - startMs) <= 14 * dayMs || (latestCog && Math.abs(latestCog.timestamp - startMs) <= 14 * dayMs);
  });

  // Helper to check snooze status independently per ruleId
  const checkSnoozed = (ruleId: CorrelationRuleId): { isSnoozed: boolean; snoozedUntil: string | null } => {
    const matches = storedCorrelationEvents
      .filter((c) => c.pet_id === pet.id && c.rule_id === ruleId && c.snoozed_until)
      .sort((a, b) => new Date(b.snoozed_until!).getTime() - new Date(a.snoozed_until!).getTime());

    const latestSnooze = matches[0];
    if (latestSnooze && latestSnooze.snoozed_until) {
      const snoozeMs = new Date(latestSnooze.snoozed_until).getTime();
      if (snoozeMs > now) {
        return { isSnoozed: true, snoozedUntil: latestSnooze.snoozed_until };
      }
    }
    return { isSnoozed: false, snoozedUntil: null };
  };

  const alerts: EvaluatedCorrelationAlert[] = [];

  // Rule A: Adherence dropped + Pain rose -> Adherence prompt FIRST, correlation prompt SECOND
  if (adherenceDropped && painSignalRose) {
    const snooze = checkSnoozed('pain_med_adherence_pain_rise');
    alerts.push({
      ruleId: 'pain_med_adherence_pain_rise',
      priority: 1,
      title: 'Pain Medication Adherence & Comfort Pattern',
      adherencePromptFirst: `Pain/comfort medication adherence was ${painAdherence14}% over the past 14 days while comfort ratings dipped. Check whether doses were missed or harder to give before adjusting anything.`,
      promptText:
        'Comfort scores moved down in the same 14-day window as missed or delayed pain medication doses. Mention to your vet whether dosing timing or administration needs adjusting.',
      evidenceSummary: `14d pain med adherence: ${painAdherence14}% (<85%); comfort shift: ${comfortDropPct > 0 ? `-${comfortDropPct}%` : `${painEvents14.length} comfort/mobility events`}.`,
      evidenceData: {
        windowDays: 14,
        painAdherence14,
        comfortDropPct,
        painEvents14Count: painEvents14.length,
      },
      ...snooze,
      clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
    });
  }

  // Rule B: Pain + Cognition moved together in same 14-day window
  if (painSignalRose && cognitiveWorsenedIn14d) {
    const snooze = checkSnoozed('pain_cognition_move_together');
    alerts.push({
      ruleId: 'pain_cognition_move_together',
      priority: 2,
      title: 'Pain & Cognitive Patterns Moved Together',
      promptText:
        'Pain and cognitive scores moved together recently. Ask your vet whether pain management should be reviewed before assuming cognitive decline.',
      evidenceSummary: `14-day window: ${painEvents14.length} pain/mobility observations (${comfortDropPct >= 10 ? `comfort -${comfortDropPct}%` : 'lower comfort'}) alongside ${
        cogScreenWorsenedIn14d
          ? `${latestCog!.instrument} score +${latestCog!.totalScore - prevCog!.totalScore} pts`
          : `${cogEvents14.length} cognitive observations`
      }.`,
      evidenceData: {
        windowDays: 14,
        comfortDropPct,
        painEvents14Count: painEvents14.length,
        cogScreenWorsenedIn14d,
        cogEvents14Count: cogEvents14.length,
      },
      ...snooze,
      clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
    });
  }

  // Rule C: Anxiety + Night Vocalisation (Cats) OR Disorientation (Dogs)
  if (anxietyIncreased && headlineSignIncreased) {
    const snooze = checkSnoozed('anxiety_nocturnal_combined');
    const promptText =
      pathway === 'cat'
        ? 'Anxiety observations and night vocalisation both increased within the same 14-day window. Ask your vet about evening comfort, sensory changes, or nighttime support.'
        : 'Anxiety observations and disorientation both increased within the same 14-day window. Ask your vet whether evening discomfort, sensory loss, or cognitive support should be reviewed.';

    alerts.push({
      ruleId: 'anxiety_nocturnal_combined',
      priority: 3,
      title:
        pathway === 'cat'
          ? 'Anxiety & Night Vocalisation Pattern'
          : 'Anxiety & Disorientation Pattern',
      promptText,
      evidenceSummary: `14-day window: ${anxietyEvents14.length} anxiety observation(s) and ${headlineCog14.length} ${
        pathway === 'cat' ? 'night vocalisation' : 'disorientation'
      } observation(s).`,
      evidenceData: {
        windowDays: 14,
        pathway,
        anxietyEvents14Count: anxietyEvents14.length,
        headlineCog14Count: headlineCog14.length,
      },
      ...snooze,
      clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
    });
  }

  // Rule D: New medication started within 14 days of cognitive change
  if (recentStartedMeds.length > 0 && cognitiveWorsenedIn14d) {
    const snooze = checkSnoozed('new_med_cognitive_timing');
    alerts.push({
      ruleId: 'new_med_cognitive_timing',
      priority: 4,
      title: 'New Medication & Cognitive Timing',
      promptText: 'A new medication started recently. Mention this timing to your vet.',
      evidenceSummary: `Medication started within 14 days (${recentStartedMeds.map((m) => `${m.name} on ${m.startDate}`).join(', ')}) alongside recent cognitive observations.`,
      evidenceData: {
        windowDays: 14,
        newMedications: recentStartedMeds.map((m) => ({ name: m.name, startDate: m.startDate })),
        cognitiveWorsenedIn14d,
      },
      ...snooze,
      clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority);
}

// Compute Pain & Anxiety 30-day summary for Vet Brief Section 4
export function computePainAndAnxietySummary(params: {
  pet: PetRecord;
  checkIns: DailyCheckIn[];
  events: PetEvent[];
  medications: MedicationSchedule[];
  doses: DoseLog[];
}): {
  comfortMean7d: number | null;
  comfortMean30d: number | null;
  comfortTrendText: string;
  painEventCount30d: number;
  anxietyEventCount30d: number;
  painAnxietyMeds: { name: string; dosage: string; adherence30d: number }[];
} {
  const { checkIns, events, medications, doses } = params;
  const now = Date.now();
  const dayMs = 86400000;
  const c7 = checkIns.filter((c) => now - c.timestamp <= 7 * dayMs);
  const c30 = checkIns.filter((c) => now - c.timestamp <= 30 * dayMs);

  const comfortMean7d =
    c7.length > 0 ? Math.round((c7.reduce((s, c) => s + c.comfortPain, 0) / c7.length) * 10) / 10 : null;
  const comfortMean30d =
    c30.length > 0 ? Math.round((c30.reduce((s, c) => s + c.comfortPain, 0) / c30.length) * 10) / 10 : null;

  let comfortTrendText = 'Gathering comfort baseline (< 7 days).';
  if (comfortMean7d !== null && comfortMean30d !== null) {
    const delta = Math.round((comfortMean7d - comfortMean30d) * 10) / 10;
    if (delta <= -0.3) comfortTrendText = `Lower comfort this week (${comfortMean7d}/5 vs ${comfortMean30d}/5 30d avg)`;
    else if (delta >= 0.3) comfortTrendText = `Improved comfort this week (${comfortMean7d}/5 vs ${comfortMean30d}/5 30d avg)`;
    else comfortTrendText = `Steady comfort (${comfortMean7d}/5 vs ${comfortMean30d}/5 30d avg)`;
  }

  const events30 = events.filter((e) => now - e.timestamp <= 30 * dayMs);
  const painEventCount30d = events30.filter(
    (e) => e.category === 'pain_vitals' || e.category === 'mobility'
  ).length;
  const anxietyEventCount30d = events30.filter(
    (e) => e.eventTypeId === 'cog_anxiety' || e.eventTypeId === 'pain_restless'
  ).length;

  const painAnxietyMeds = medications
    .filter(isPainOrAnxietyMedication)
    .map((m) => {
      const mDoses = doses.filter((d) => d.medicationId === m.id && now - d.timestamp <= 30 * dayMs);
      const adherence30d =
        mDoses.length > 0
          ? Math.round((mDoses.filter((d) => d.status === 'given').length / mDoses.length) * 100)
          : 100;
      return { name: m.name, dosage: m.dosage, adherence30d };
    });

  return {
    comfortMean7d,
    comfortMean30d,
    comfortTrendText,
    painEventCount30d,
    anxietyEventCount30d,
    painAnxietyMeds,
  };
}
