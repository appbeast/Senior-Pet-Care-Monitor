import {
  CognitiveAssessmentLog,
  CognitiveInstrument,
  FrequencyScaleValue,
  PetRecord,
  SpeciesPathway,
} from '../types';
import {
  frequencyLabel,
  getCognitiveQuestionsForSpecies,
  getInstrumentForSpecies,
} from './assessmentQuestions';
import { resolveSpeciesPathway } from './speciesPathway';
import { PROVISIONAL_CLINICAL_REVIEW } from '../data/clinicalGovernance';

export const COGNITIVE_AGE_TRIGGER_CONFIG = {
  dogStartAgeYears: 7, // Aligned with late-2025 JAVMA canine consensus guidance
  catStartAgeYears: 10,
  recurrenceMonths: 6,
  clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
};

export interface ScreeningScheduleStatus {
  pathway: SpeciesPathway;
  instrument: CognitiveInstrument;
  startAgeYears: number;
  status: 'needs_age_estimate' | 'below_threshold' | 'due_now' | 'scheduled';
  isDueNow: boolean;
  nextDueDateStr: string;
  firstScreenDueAt: string;
  daysUntilDue: number | null;
  completedCount: number;
  headlineMessage: string;
  subMessage: string;
}

export function addMonthsIso(fromDate: Date, months: number): string {
  const d = new Date(fromDate.getTime());
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export function computeFirstScreenDueAt(pet: Pick<PetRecord, 'species' | 'species_pathway' | 'birthDate' | 'ageYears'>): string {
  const pathway = resolveSpeciesPathway(pet);
  const startAge =
    pathway === 'cat'
      ? COGNITIVE_AGE_TRIGGER_CONFIG.catStartAgeYears
      : COGNITIVE_AGE_TRIGGER_CONFIG.dogStartAgeYears;

  if (pet.ageYears >= startAge) {
    return new Date().toISOString().split('T')[0];
  }

  const birthYear = parseInt((pet.birthDate || '').slice(0, 4), 10) || new Date().getFullYear() - pet.ageYears;
  const dueYear = birthYear + startAge;
  return `${dueYear}-01-01`;
}

export function evaluateCognitiveSchedule(
  pet: PetRecord,
  cognitiveLogs: CognitiveAssessmentLog[]
): ScreeningScheduleStatus {
  const pathway = resolveSpeciesPathway(pet);
  const instrument = getInstrumentForSpecies(pathway);
  const startAgeYears =
    pathway === 'cat'
      ? COGNITIVE_AGE_TRIGGER_CONFIG.catStartAgeYears
      : COGNITIVE_AGE_TRIGGER_CONFIG.dogStartAgeYears;

  const sortedLogs = [...cognitiveLogs].sort((a, b) => b.timestamp - a.timestamp);
  const latestLog = sortedLogs[0];
  const now = Date.now();
  const dayMs = 86400000;

  if (pet.age_unknown || !pet.ageYears || pet.ageYears <= 0) {
    return {
      pathway,
      instrument,
      startAgeYears,
      status: 'needs_age_estimate',
      isDueNow: false,
      nextDueDateStr: new Date().toISOString().split('T')[0],
      firstScreenDueAt: new Date().toISOString().split('T')[0],
      daysUntilDue: null,
      completedCount: sortedLogs.length,
      headlineMessage: `Estimate ${pet.name}'s age to activate automatic 6-month ${instrument} checks`,
      subMessage: `Screening automatically starts at age ${startAgeYears} for ${pathway === 'cat' ? 'cats' : 'dogs'} and repeats every 6 months.`,
    };
  }

  const firstScreenDueAt = pet.first_screen_due_at || computeFirstScreenDueAt(pet);

  if (pet.ageYears < startAgeYears && sortedLogs.length === 0) {
    const dueMs = new Date(firstScreenDueAt).getTime();
    const daysUntilDue = Math.max(1, Math.ceil((dueMs - now) / dayMs));
    return {
      pathway,
      instrument,
      startAgeYears,
      status: 'below_threshold',
      isDueNow: false,
      nextDueDateStr: firstScreenDueAt.split('T')[0],
      firstScreenDueAt,
      daysUntilDue,
      completedCount: 0,
      headlineMessage: `Scheduled ${instrument} screening begins at age ${startAgeYears}`,
      subMessage: `${pet.name} is ${pet.ageYears} yrs old. Automatic semi-annual reminders begin ${firstScreenDueAt.split('T')[0]}. You can still run a baseline screen manually anytime.`,
    };
  }

  // Age >= threshold and NO screens completed yet -> immediately due!
  if (!latestLog) {
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      pathway,
      instrument,
      startAgeYears,
      status: 'due_now',
      isDueNow: true,
      nextDueDateStr: todayStr,
      firstScreenDueAt,
      daysUntilDue: 0,
      completedCount: 0,
      headlineMessage: `Automatic ${instrument} cognitive check is due now`,
      subMessage: `At age ${pet.ageYears} (${pet.age_estimated ? 'estimated' : 'recorded'}), veterinary guidance recommends ${instrument} screening starting at age ${startAgeYears} and repeating every 6 months.`,
    };
  }

  // Has prior screen -> check next_due_at (6 months after latest completed_at)
  const nextDueIso =
    latestLog.next_due_at || addMonthsIso(new Date(latestLog.completed_at || latestLog.timestamp), COGNITIVE_AGE_TRIGGER_CONFIG.recurrenceMonths);
  const nextDueMs = new Date(nextDueIso).getTime();
  const nextDueDateStr = nextDueIso.split('T')[0];
  const daysUntilDue = Math.ceil((nextDueMs - now) / dayMs);

  if (now >= nextDueMs) {
    return {
      pathway,
      instrument,
      startAgeYears,
      status: 'due_now',
      isDueNow: true,
      nextDueDateStr,
      firstScreenDueAt,
      daysUntilDue: 0,
      completedCount: sortedLogs.length,
      headlineMessage: `6-Month Scheduled ${instrument} Check Due`,
      subMessage: `It has been 6+ months since ${pet.name}'s last ${instrument} screen (${latestLog.date}). Complete a 2-minute check to update dimension trends.`,
    };
  }

  return {
    pathway,
    instrument,
    startAgeYears,
    status: 'scheduled',
    isDueNow: false,
    nextDueDateStr,
    firstScreenDueAt,
    daysUntilDue,
    completedCount: sortedLogs.length,
    headlineMessage: `Next automatic ${instrument} screen scheduled for ${nextDueDateStr}`,
    subMessage: `Every-6-month cadence active automatically for age ${pet.ageYears} (${daysUntilDue} days remaining).`,
  };
}

export interface DimensionTrendItem {
  dimensionKey: string;
  dimensionLabel: string;
  latestScore: FrequencyScaleValue | null;
  previousScore: FrequencyScaleValue | null;
  latestLabel: string;
  previousLabel: string | null;
  direction: 'worsening' | 'improving' | 'stable' | 'not_sure';
  plainLanguageSentence: string;
}

export interface CognitiveTrendAnalysis {
  instrument: CognitiveInstrument;
  completedCount: number;
  hasReliableTrend: boolean; // >= 3 screens
  canPlotTrend: boolean; // >= 2 screens
  reliabilityNotice: string;
  dimensionTrends: DimensionTrendItem[];
  worseningDimensionsSummary: string[];
  overallPlainSummary: string;
}

export function analyzeCognitiveTrends(
  pathway: SpeciesPathway,
  cognitiveLogs: CognitiveAssessmentLog[]
): CognitiveTrendAnalysis {
  const questions = getCognitiveQuestionsForSpecies(pathway);
  const instrument = getInstrumentForSpecies(pathway);
  const chronological = [...cognitiveLogs].sort((a, b) => a.timestamp - b.timestamp);
  const completedCount = chronological.length;
  const canPlotTrend = completedCount >= 2;
  const hasReliableTrend = completedCount >= 3;

  const reliabilityNotice =
    completedCount === 0
      ? 'Complete your first screen to start tracking per-dimension frequencies.'
      : completedCount < 3
      ? `More screens needed for a reliable trend (${completedCount} of 3 screens completed). Showing observed frequency changes so far.`
      : `Based on ${completedCount} completed ${instrument} screens across 6-month intervals.`;

  const latest = chronological[chronological.length - 1];
  const previous = chronological.length >= 2 ? chronological[chronological.length - 2] : undefined;

  const dimensionTrends: DimensionTrendItem[] = questions.map((q) => {
    const latestVal = latest ? (latest.per_dimension_scores?.[q.dimensionKey] ?? null) : null;
    const prevVal = previous ? (previous.per_dimension_scores?.[q.dimensionKey] ?? null) : null;
    const latestLabel = frequencyLabel(latestVal);
    const prevLabel = previous ? frequencyLabel(prevVal) : null;

    let direction: DimensionTrendItem['direction'] = 'stable';
    let plainLanguageSentence = `${q.dimensionLabel}: no completed screen yet.`;

    if (!latest) {
      direction = 'not_sure';
    } else if (latestVal === null) {
      direction = 'not_sure';
      plainLanguageSentence = `${q.dimensionLabel} marked "not sure" on the latest screen (excluded from score).`;
    } else if (!previous || prevVal === null) {
      direction = 'stable';
      plainLanguageSentence = `${q.dimensionLabel} reported "${latestLabel}" on the latest screen.`;
    } else if (latestVal > prevVal) {
      direction = 'worsening';
      plainLanguageSentence = `${q.dimensionLabel} reported "${latestLabel}" on the most recent screen, previously "${prevLabel}".`;
    } else if (latestVal < prevVal) {
      direction = 'improving';
      plainLanguageSentence = `${q.dimensionLabel} reported "${latestLabel}" on the most recent screen, down from "${prevLabel}".`;
    } else {
      direction = 'stable';
      plainLanguageSentence = `${q.dimensionLabel} reported "${latestLabel}" for the last two screens (unchanged from "${prevLabel}").`;
    }

    return {
      dimensionKey: q.dimensionKey,
      dimensionLabel: q.dimensionLabel,
      latestScore: latestVal,
      previousScore: prevVal,
      latestLabel,
      previousLabel: prevLabel,
      direction,
      plainLanguageSentence,
    };
  });

  const worsening = dimensionTrends.filter((d) => d.direction === 'worsening');
  const worseningDimensionsSummary = worsening.map((d) => d.plainLanguageSentence);

  let overallPlainSummary = 'Complete at least one screen to record baseline frequencies.';
  if (completedCount === 1 && latest) {
    overallPlainSummary = latest.frequencySummary;
  } else if (completedCount >= 2) {
    if (worsening.length === 0) {
      overallPlainSummary = `None of the seven ${instrument} dimensions increased in frequency compared to the prior screen.`;
    } else {
      overallPlainSummary = `${worsening.length} ${worsening.length === 1 ? 'dimension' : 'dimensions'} increased in reported frequency since the prior screen: ${worsening.map((d) => d.dimensionLabel).join(', ')}.`;
    }
  }

  return {
    instrument,
    completedCount,
    hasReliableTrend,
    canPlotTrend,
    reliabilityNotice,
    dimensionTrends,
    worseningDimensionsSummary,
    overallPlainSummary,
  };
}
