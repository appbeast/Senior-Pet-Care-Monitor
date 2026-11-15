import { ClinicalReviewTag } from '../types';

export const PROVISIONAL_CLINICAL_REVIEW: ClinicalReviewTag = {
  requires_vet_review: true,
  review_notice: 'Requires licensed veterinarian review before release.',
  reviewer_name: 'Dr. Elena Rostova, DVM (Provisional Clinical Draft — Pending Commercial Sign-Off)',
  review_date: '2026-11-14',
};

export interface ClinicalThresholdSpec {
  id: string;
  name: string;
  category: 'cognitive_trigger' | 'baseline_deviation' | 'respiratory' | 'qol_frequency' | 'adherence_correlation';
  thresholdValue: string;
  rationale: string;
  clinicalReview: ClinicalReviewTag;
}

export const CLINICAL_THRESHOLDS: ClinicalThresholdSpec[] = [
  {
    id: 'thresh_dog_cog_age',
    name: 'Canine Cognitive Screening Age Trigger',
    category: 'cognitive_trigger',
    thresholdValue: 'Age >= 7 years, repeating every 6 months',
    rationale: 'Aligned with late-2025 JAVMA canine cognitive dysfunction consensus guidance for early detection starting at age 7 with semi-annual follow-up.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'thresh_cat_cog_age',
    name: 'Feline Cognitive Screening Age Trigger',
    category: 'cognitive_trigger',
    thresholdValue: 'Age >= 10 years, repeating every 6 months',
    rationale: 'Targets feline senior life stage onset where VISHDAAL signs such as night vocalisation become prevalent.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'thresh_baseline_min_points',
    name: 'Minimum Baseline Sample Count',
    category: 'baseline_deviation',
    thresholdValue: '>= 5 logged data points in rolling 30-day window',
    rationale: 'Prevents premature deviation alerts until an individual normal baseline is established.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'thresh_baseline_watch',
    name: 'Baseline Deviation Watch Threshold',
    category: 'baseline_deviation',
    thresholdValue: '>= 12% worsening from 30-day mean',
    rationale: 'Neutral prompt encouraging caregiver observation without alarm.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'thresh_baseline_discuss_vet',
    name: 'Baseline Deviation Discuss-at-Visit Threshold',
    category: 'baseline_deviation',
    thresholdValue: '>= 25% worsening from 30-day mean',
    rationale: 'Highlights sustained negative shift for the next veterinary consultation.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'thresh_sleeping_resp_rate',
    name: 'Sleeping Respiratory Rate Alert Threshold',
    category: 'respiratory',
    thresholdValue: '> 30 breaths/minute',
    rationale: 'Standard at-home sleeping respiratory rate threshold warranting prompt veterinary contact.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'thresh_qol_bands',
    name: 'Good-Day / Bad-Day Frequency Bands (Logged Days Only)',
    category: 'qol_frequency',
    thresholdValue: 'Occasional (<20%), Frequent (20-49%), Most Days (>=50%); min 5 logged days',
    rationale: 'Descriptive frequency grouping excluding unlogged days; never represents a clinical stage.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'thresh_corr_window_adherence',
    name: 'Correlation Lookback & Pain Medication Adherence Threshold',
    category: 'adherence_correlation',
    thresholdValue: '14-day rolling correlation window; adherence < 85%; snooze 14 days',
    rationale: 'Detects co-occurring pain, anxiety, adherence gaps, and cognitive changes to prompt veterinary discussion.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
];
