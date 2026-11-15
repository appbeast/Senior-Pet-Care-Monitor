export type Species = 'canine' | 'feline';
export type SpeciesPathway = 'dog' | 'cat';
export type NeuterStatus = 'neutered' | 'intact' | 'unknown';
export type UserRole = 'owner' | 'caregiver' | 'viewer';
export type EventSeverity = 'mild' | 'moderate' | 'severe' | 'routine' | 'notice';
export type DoseStatus = 'given' | 'skipped' | 'pending';

export interface ClinicalReviewTag {
  requires_vet_review: true;
  review_notice: 'Requires licensed veterinarian review before release.';
  reviewer_name: string;
  review_date: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
}

export interface PetRecord {
  id: string;
  name: string;
  species: Species;
  species_pathway: SpeciesPathway;
  breed: string;
  birthDate: string; // YYYY-MM-DD or estimated
  ageYears: number;
  age_estimated: boolean;
  age_unknown?: boolean;
  first_screen_due_at?: string; // ISO date string
  neuterStatus: NeuterStatus;
  currentWeightKg: number;
  weightHistory: WeightEntry[];
  knownConditions: string[];
  currentDiet: string;
  dietNotes?: string;
  profilePhotoUrl?: string;
  goalsOfCareNote?: string;
  goalsUpdatedAt?: string;
  createdAt: string;
}

export interface DailyCheckIn {
  id: string;
  petId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  loggedByUserId: string;
  loggedByUserName: string;
  userRole: UserRole;
  // Core 1-5 scales (or discrete)
  appetite: number; // 1 (refused) to 5 (hearty)
  waterIntake: number; // 1 (low), 3 (normal), 5 (excessive)
  energyActivity: number; // 1 (lethargic) to 5 (spry/energetic)
  mobilityStiffness: number; // 1 (severe stiffness) to 5 (fluid/normal)
  comfortPain: number; // 1 (visible pain/distress) to 5 (fully comfortable/peaceful)
  stoolQuality: number; // 1 (hard pellets) to 4 (ideal) to 7 (watery)
  restingBreathingRate?: number; // breaths per minute if measured
  isGoodDay: boolean; // Flag for QoL calendar
  quickNote?: string;
}

export type EventCategory =
  | 'cognitive'
  | 'mobility'
  | 'appetite'
  | 'gi'
  | 'urinary'
  | 'pain_vitals'
  | 'sensory_skin'
  | 'care_treatment'
  | 'daily_rating';

export interface TaxonomyEventItem {
  id: string;
  category: EventCategory;
  speciesSupport: 'both' | 'dog' | 'cat';
  isTopLevelCat?: boolean;
  isTopLevelDog?: boolean;
  name: string;
  plainLanguageTitle: string;
  clinicalNote: string;
  defaultSeverity: EventSeverity;
  observationPrompt: string;
  suggestedAction?: string;
}

export interface PetEvent {
  id: string;
  petId: string;
  timestamp: number;
  eventTypeId: string;
  eventName: string;
  category: EventCategory;
  severity: EventSeverity;
  notes?: string;
  photoDataUrl?: string;
  voiceNoteAudioUrl?: string; // base64 or blob URL
  voiceNoteDurationSeconds?: number;
  loggedByUserId: string;
  loggedByUserName: string;
  userRole: UserRole;
  syncState: 'synced' | 'pending';
}

export type MedicationRoute = 'oral' | 'transdermal' | 'subcutaneous' | 'eye_drop' | 'ear_drop' | 'injection';
export type MedicationTarget = 'pain' | 'anxiety' | 'cognitive' | 'renal_hydration' | 'joint_support' | 'other';

export interface MedicationSchedule {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  route: MedicationRoute;
  frequency: string; // e.g. "Every 12 hours", "Once daily in evening"
  scheduledTimes: string[]; // ["08:00", "20:00"]
  instructions?: string;
  targetCategory?: MedicationTarget;
  isSubQFluid?: boolean;
  fluidVolumeMl?: number;
  fluidNeedleGauge?: string;
  isActive: boolean;
  startDate: string;
}

export interface DoseLog {
  id: string;
  petId: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string; // HH:mm
  date: string; // YYYY-MM-DD
  timestamp: number;
  status: DoseStatus;
  administeredByUserId: string;
  administeredByName: string;
  administeredByRole: UserRole;
  skipReason?: string;
  siteNote?: string; // for fluids rotation
  notes?: string;
}

export interface CareCircleMember {
  id: string;
  petId: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
  isCurrentDeviceUser?: boolean;
}

export interface MetricBaseline {
  metricKey: string;
  metricLabel: string;
  sampleCount: number;
  hasSufficientBaseline: boolean; // sampleCount >= 5
  mean7d: number;
  mean30d: number;
  percentDeviation: number; // ((7d - 30d) / 30d) * 100
  status: 'learning' | 'normal' | 'watch' | 'discuss_vet' | 'critical';
  trendDirection: 'stable' | 'increasing' | 'decreasing';
  interpretation: string;
  dateRangeLabel?: string;
}

export interface WeeklyChangeBullet {
  id: string;
  metricLabel: string;
  summary: string;
  dataLink: string;
  severity: 'neutral' | 'watch' | 'discuss_vet';
}

export interface WeeklyChangeBrief {
  id: string;
  petId: string;
  weekEndingDate: string;
  bullets: WeeklyChangeBullet[]; // 3 baseline bullets
  qolPatternLine?: string; // Enhancement 5 line when week-over-week change is material
  vetQuestion: string; // 1 derived question
  watchItem: {
    metric: string;
    thresholdDescription: string;
  };
  generatedAt: string;
}

// =========================================================================
// ENHANCEMENT 1: SCHEDULED COGNITIVE SCREENING (DISHAA | VISHDAAL)
// =========================================================================
export type CognitiveInstrument = 'DISHAA' | 'VISHDAAL';
export type FrequencyScaleValue = 0 | 1 | 2 | 3 | 4; // never | rarely | sometimes | often | always
export type CognitiveAnswerValue = FrequencyScaleValue | 'not_sure';

export interface CognitiveQuestion {
  id: string;
  instrument: CognitiveInstrument;
  speciesPathway: SpeciesPathway;
  dimensionKey: string;
  dimensionLabel: string;
  question: string;
  plainExample: string;
  clinicalReview: ClinicalReviewTag;
}

export interface CognitiveAssessmentLog {
  id: string;
  petId: string;
  instrument: CognitiveInstrument;
  date: string; // YYYY-MM-DD
  completed_at: string; // ISO timestamp
  timestamp: number;
  triggered_by: 'scheduled' | 'manual';
  next_due_at: string; // ISO timestamp (6 months after completed_at)
  per_dimension_scores: Record<string, FrequencyScaleValue | null>;
  not_sure_flags: Record<string, boolean>;
  totalScore: number; // 0 to 100 normalized over answered dimensions (excludes "not sure")
  answeredDimensionCount: number;
  frequencySummary: string; // Descriptive frequency & direction only (never a stage/diagnosis)
  newlyEmergedSigns: string[];
  notes?: string;
  loggedByName: string;
}

// =========================================================================
// ENHANCEMENT 5: GOOD-DAY / BAD-DAY PATTERN TO CLINICAL LANGUAGE
// =========================================================================
export type FrequencyBandKey = 'occasional' | 'frequent' | 'most_days' | 'insufficient';

export interface QoLPatternSummary {
  windowDays: 30 | 90;
  goodDays: number;
  badDays: number;
  loggedDays: number;
  unloggedDays: number;
  badDayPercentage: number | null;
  band: FrequencyBandKey;
  bandLabel: string;
  proportionText: string; // e.g., "12 of 30 logged days were bad days (40%)."
  clinicalTranslation: string; // Non-diagnostic comparative frequency wording
  disclaimer: 'This is a frequency description, not a diagnosis or a stage.';
}

export interface QoLQuestion {
  id: string;
  speciesPathway: SpeciesPathway;
  category: 'hurt' | 'hunger' | 'hydration' | 'hygiene' | 'happiness' | 'mobility' | 'more_good_days';
  title: string;
  prompt: string;
  minLabel: string;
  maxLabel: string;
  clinicalReview: ClinicalReviewTag;
}

export interface QoLAssessmentLog {
  id: string;
  petId: string;
  date: string;
  timestamp: number;
  scores: Record<string, number>; // 0 to 10 per category
  totalScore: number; // out of 70
  goodDaysPast30Count: number;
  badDaysPast30Count: number;
  loggedByName: string;
  notes?: string;
}

// =========================================================================
// ENHANCEMENT 3: PAIN / ANXIETY / COGNITION CORRELATION ENGINE
// =========================================================================
export type CorrelationRuleId =
  | 'pain_med_adherence_pain_rise'
  | 'pain_cognition_move_together'
  | 'anxiety_nocturnal_combined'
  | 'new_med_cognitive_timing';

export interface CorrelationEvent {
  id: string;
  pet_id: string;
  rule_id: CorrelationRuleId;
  fired_at: string; // ISO
  snoozed_until: string | null; // ISO or null
  evidence_json: string;
}

export interface EvaluatedCorrelationAlert {
  ruleId: CorrelationRuleId;
  priority: number;
  title: string;
  adherencePromptFirst?: string;
  promptText: string; // Must contain "ask your vet" or "mention to your vet", zero diagnostic claims
  evidenceSummary: string;
  evidenceData: Record<string, unknown>;
  isSnoozed: boolean;
  snoozedUntil: string | null;
  clinicalReview: ClinicalReviewTag;
}

// =========================================================================
// ENHANCEMENT 4: PRE-VISIT VET BRIEF DATA MODEL
// =========================================================================
export interface VetBriefRecord {
  id: string;
  pet_id: string;
  generated_at: string; // ISO
  owner_questions: [string, string, string];
  included_sections: string[];
  include_full_log_page_two: boolean;
  share_link_token: string;
  share_link_url: string;
  share_link_expires_at: string; // ISO
}

export interface ExpiringShareLink {
  token: string;
  petId: string;
  createdAt: number;
  expiresAt: number;
  url: string;
}
