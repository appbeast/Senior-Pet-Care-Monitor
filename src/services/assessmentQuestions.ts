import {
  CognitiveAnswerValue,
  CognitiveInstrument,
  CognitiveQuestion,
  FrequencyScaleValue,
  QoLQuestion,
  SpeciesPathway,
} from '../types';
import { PROVISIONAL_CLINICAL_REVIEW } from '../data/clinicalGovernance';

export const FREQUENCY_SCALE_OPTIONS: { value: FrequencyScaleValue; label: string; shortLabel: string }[] = [
  { value: 0, label: 'Never', shortLabel: 'Never' },
  { value: 1, label: 'Rarely', shortLabel: 'Rarely' },
  { value: 2, label: 'Sometimes', shortLabel: 'Sometimes' },
  { value: 3, label: 'Often', shortLabel: 'Often' },
  { value: 4, label: 'Always', shortLabel: 'Always' },
];

export const DISHAA_DOG_QUESTIONS: CognitiveQuestion[] = [
  {
    id: 'dishaa_disorientation',
    instrument: 'DISHAA',
    speciesPathway: 'dog',
    dimensionKey: 'disorientation',
    dimensionLabel: 'Disorientation',
    question: 'Gets confused in familiar rooms, stares blankly at walls, or gets stuck behind doors?',
    plainExample: 'Example: Walks behind an open bedroom door and stands there waiting instead of backing out.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dishaa_interaction',
    instrument: 'DISHAA',
    speciesPathway: 'dog',
    dimensionKey: 'social_interaction',
    dimensionLabel: 'Social Interactions',
    question: 'Shows noticeable changes in greeting family members or seeking affection?',
    plainExample: 'Example: Seems indifferent when you return home, or becomes unusually clingy and shadows you.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dishaa_sleep',
    instrument: 'DISHAA',
    speciesPathway: 'dog',
    dimensionKey: 'sleep_wake',
    dimensionLabel: 'Sleep-Wake Cycle',
    question: 'Wakes, paces, or becomes restless overnight while sleeping more heavily during the day?',
    plainExample: 'Example: Paces the hallway between midnight and 5am even after going outside before bed.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dishaa_house',
    instrument: 'DISHAA',
    speciesPathway: 'dog',
    dimensionKey: 'house_soiling',
    dimensionLabel: 'House Soiling',
    question: 'Has indoor urine or stool accidents without asking at the door as they used to?',
    plainExample: 'Example: Has an accident indoors 15 minutes after coming inside without signaling.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dishaa_learning',
    instrument: 'DISHAA',
    speciesPathway: 'dog',
    dimensionKey: 'learning_memory',
    dimensionLabel: 'Learning & Memory',
    question: 'Seems to forget familiar house routines, cues, or where bowls and doors open?',
    plainExample: 'Example: Waits at the hinge side of the back door or forgets the cue for mealtime.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dishaa_activity',
    instrument: 'DISHAA',
    speciesPathway: 'dog',
    dimensionKey: 'activity',
    dimensionLabel: 'Activity',
    question: 'Shows aimless repetitive wandering or noticeable drop in interest during play and walks?',
    plainExample: 'Example: Paces in slow circles around the kitchen island or stops engaging with favorite toys.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dishaa_anxiety',
    instrument: 'DISHAA',
    speciesPathway: 'dog',
    dimensionKey: 'anxiety',
    dimensionLabel: 'Anxiety',
    question: 'Appears newly anxious, trembles, or frets when left briefly in another room?',
    plainExample: 'Example: Whines or trembles as soon as a family member steps out of sight.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
];

export const VISHDAAL_CAT_QUESTIONS: CognitiveQuestion[] = [
  {
    id: 'vishdaal_vocalisation',
    instrument: 'VISHDAAL',
    speciesPathway: 'cat',
    dimensionKey: 'vocalization',
    dimensionLabel: 'Vocalisation',
    question: 'Vocalises loudly (meowing or yowling) without an obvious trigger, especially at night?',
    plainExample: 'Example: Sits in the hallway at 2am crying loudly even though food and litter box are clean.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'vishdaal_interactions',
    instrument: 'VISHDAAL',
    speciesPathway: 'cat',
    dimensionKey: 'interactions',
    dimensionLabel: 'Interactions',
    question: 'Changes how they interact with family or other household pets (clingy, irritable, or withdrawn)?',
    plainExample: 'Example: Hides under the bed for long stretches, or suddenly demands constant lap contact.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'vishdaal_sleep',
    instrument: 'VISHDAAL',
    speciesPathway: 'cat',
    dimensionKey: 'sleep_wake',
    dimensionLabel: 'Sleep-Wake Cycle',
    question: 'Sleeps deeply through usual household routines by day and roams restlessly overnight?',
    plainExample: 'Example: Sleeps through dinner prep all afternoon, then roams rooms repeatedly overnight.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'vishdaal_house',
    instrument: 'VISHDAAL',
    speciesPathway: 'cat',
    dimensionKey: 'house_soiling',
    dimensionLabel: 'House Soiling',
    question: 'Urinates or defecates outside the litter box in familiar areas?',
    plainExample: 'Example: Uses a bedroom rug or mat next to the litter box even when the box is clean.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'vishdaal_activity',
    instrument: 'VISHDAAL',
    speciesPathway: 'cat',
    dimensionKey: 'activity',
    dimensionLabel: 'Activity',
    question: 'Shows altered daily activity such as less jumping, less grooming, or aimless pacing?',
    plainExample: 'Example: Stops jumping onto the sunny windowsill, ignores the scratching post, or grooms less.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'vishdaal_anxiety',
    instrument: 'VISHDAAL',
    speciesPathway: 'cat',
    dimensionKey: 'anxiety',
    dimensionLabel: 'Anxiety',
    question: 'Appears more startled, jumpy, or unsettled by minor routine or household changes?',
    plainExample: 'Example: Flinches sharply at soft footsteps or hides whenever groceries or visitors arrive.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'vishdaal_learning',
    instrument: 'VISHDAAL',
    speciesPathway: 'cat',
    dimensionKey: 'learning_memory',
    dimensionLabel: 'Learning & Memory',
    question: 'Seems disoriented in familiar rooms or forgets where bowls and litter boxes are kept?',
    plainExample: 'Example: Stands in a doorway staring blankly or forgets which room holds the water fountain.',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
];

export function getCognitiveQuestionsForSpecies(pathway: SpeciesPathway): CognitiveQuestion[] {
  return pathway === 'cat' ? VISHDAAL_CAT_QUESTIONS : DISHAA_DOG_QUESTIONS;
}

export function getInstrumentForSpecies(pathway: SpeciesPathway): CognitiveInstrument {
  return pathway === 'cat' ? 'VISHDAAL' : 'DISHAA';
}

export const CANINE_QOL_QUESTIONS: QoLQuestion[] = [
  {
    id: 'dog_hurt',
    speciesPathway: 'dog',
    category: 'hurt',
    title: 'Hurt & Pain Control',
    prompt: 'Is comfort well supported? Can your dog breathe easily and settle on their bed without whimpering or resting panting?',
    minLabel: 'Visible discomfort / restless',
    maxLabel: 'Settled & comfortable',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dog_hunger',
    speciesPathway: 'dog',
    category: 'hunger',
    title: 'Hunger & Appetite',
    prompt: 'Is your dog eating meals voluntarily and showing interest in favorite food or chew treats?',
    minLabel: 'Refusing meals',
    maxLabel: 'Eats eagerly',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dog_hydration',
    speciesPathway: 'dog',
    category: 'hydration',
    title: 'Hydration & Fluid Balance',
    prompt: 'Is water drinking balanced without obvious dehydration or constant trips to empty the water bowl?',
    minLabel: 'Imbalanced / struggling',
    maxLabel: 'Steady & balanced',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dog_hygiene',
    speciesPathway: 'dog',
    category: 'hygiene',
    title: 'Hygiene & Coat Comfort',
    prompt: 'Does your dog stay clean, dry, and free from urine scald or coat tangles after resting?',
    minLabel: 'Soiled / uncomfortable',
    maxLabel: 'Clean & comfortable',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dog_happiness',
    speciesPathway: 'dog',
    category: 'happiness',
    title: 'Happiness & Family Connection',
    prompt: 'Does your dog still show joy — greeting you at the door, wagging their tail, or enjoying sunny naps near family?',
    minLabel: 'Withdrawn / detached',
    maxLabel: 'Engaged & content',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dog_mobility',
    speciesPathway: 'dog',
    category: 'mobility',
    title: 'Mobility & Outdoor Routine',
    prompt: 'Can your dog rise after naps, go outside to eliminate, and enjoy short walks without slipping or stumbling?',
    minLabel: 'Unable to stand / move safely',
    maxLabel: 'Moves steadily with ease',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'dog_more_good_days',
    speciesPathway: 'dog',
    category: 'more_good_days',
    title: 'Good Days vs Harder Days',
    prompt: 'Across the past week, how clearly have peaceful, comfortable days outnumbered difficult days?',
    minLabel: 'Mostly harder days',
    maxLabel: 'Mostly peaceful good days',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
];

export const FELINE_QOL_QUESTIONS: QoLQuestion[] = [
  {
    id: 'cat_hurt',
    speciesPathway: 'cat',
    category: 'hurt',
    title: 'Comfort & Relaxed Resting',
    prompt: 'Does your cat curl up loosely in favorite resting spots without hunching tightly, guarding, or hiding in discomfort?',
    minLabel: 'Hunched / tense / hiding',
    maxLabel: 'Softly curled & relaxed',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'cat_hunger',
    speciesPathway: 'cat',
    category: 'hunger',
    title: 'Appetite & Feeding Greeting',
    prompt: 'Does your cat still interact warmly at feeding time and eat meals voluntarily without lip-smacking or turning away?',
    minLabel: 'Refusing meals / nauseous',
    maxLabel: 'Eager at feeding time',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'cat_hydration',
    speciesPathway: 'cat',
    category: 'hydration',
    title: 'Hydration & Litter Clumps',
    prompt: 'Are drinking and litter box urine clump sizes steady and comfortable for your cat?',
    minLabel: 'Dehydrated / strained',
    maxLabel: 'Balanced hydration',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'cat_hygiene',
    speciesPathway: 'cat',
    category: 'hygiene',
    title: 'Grooming & Litter Box Cleanliness',
    prompt: 'Does your cat still groom their coat cleanly and step in and out of the litter box without messy accidents?',
    minLabel: 'Matted / avoiding grooming',
    maxLabel: 'Grooms comfortably & clean',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'cat_happiness',
    speciesPathway: 'cat',
    category: 'happiness',
    title: 'Contentment & Social Interest',
    prompt: 'Does your cat purr when stroked, seek sunny patches, watch windows, or interact gently with family?',
    minLabel: 'Isolated / unresponsive',
    maxLabel: 'Purrs & enjoys surroundings',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'cat_mobility',
    speciesPathway: 'cat',
    category: 'mobility',
    title: 'Jumping & Perch Confidence',
    prompt: 'Does your cat still jump comfortably to favorite spots (windowsill, sofa, bed) or use pet steps smoothly without hesitation?',
    minLabel: 'Stopped jumping / stiff',
    maxLabel: 'Jumps & climbs smoothly',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
  {
    id: 'cat_more_good_days',
    speciesPathway: 'cat',
    category: 'more_good_days',
    title: 'Good Days vs Harder Days',
    prompt: 'Looking across the past week, how clearly have calm, comfortable days outnumbered harder days?',
    minLabel: 'Mostly harder days',
    maxLabel: 'Mostly calm good days',
    clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
  },
];

export function getQoLQuestionsForSpecies(pathway: SpeciesPathway): QoLQuestion[] {
  return pathway === 'cat' ? FELINE_QOL_QUESTIONS : CANINE_QOL_QUESTIONS;
}

export function frequencyLabel(val: FrequencyScaleValue | null | undefined): string {
  if (val === null || val === undefined) return 'Not sure';
  const match = FREQUENCY_SCALE_OPTIONS.find((o) => o.value === val);
  return match ? match.label.toLowerCase() : 'unknown';
}

export function calculateCognitiveScreenResult(
  pathway: SpeciesPathway,
  rawAnswers: Record<string, CognitiveAnswerValue>
): {
  instrument: CognitiveInstrument;
  per_dimension_scores: Record<string, FrequencyScaleValue | null>;
  not_sure_flags: Record<string, boolean>;
  totalScore: number;
  answeredDimensionCount: number;
  frequencySummary: string;
} {
  const questions = getCognitiveQuestionsForSpecies(pathway);
  const instrument = getInstrumentForSpecies(pathway);

  const per_dimension_scores: Record<string, FrequencyScaleValue | null> = {};
  const not_sure_flags: Record<string, boolean> = {};

  let scoreSum = 0;
  let answeredDimensionCount = 0;
  let highFrequencyLabels: string[] = [];

  for (const q of questions) {
    const ans = rawAnswers[q.dimensionKey] ?? rawAnswers[q.id];
    if (ans === 'not_sure' || ans === undefined) {
      // Excluded from scoring rather than counted as zero
      per_dimension_scores[q.dimensionKey] = null;
      not_sure_flags[q.dimensionKey] = true;
    } else {
      per_dimension_scores[q.dimensionKey] = ans;
      not_sure_flags[q.dimensionKey] = false;
      scoreSum += ans;
      answeredDimensionCount += 1;
      if (ans >= 3) {
        highFrequencyLabels.push(`${q.dimensionLabel} (${frequencyLabel(ans)})`);
      }
    }
  }

  const maxPossible = answeredDimensionCount * 4;
  const totalScore = maxPossible > 0 ? Math.round((scoreSum / maxPossible) * 100) : 0;

  let frequencySummary = `All ${answeredDimensionCount} rated dimensions reported never or rarely.`;
  if (answeredDimensionCount === 0) {
    frequencySummary = 'All dimensions marked "not sure" (excluded from score).';
  } else if (highFrequencyLabels.length > 0) {
    frequencySummary = `Higher frequency ("often" or "always") reported in: ${highFrequencyLabels.join(', ')}.`;
  } else {
    const sometimesCount = Object.values(per_dimension_scores).filter((v) => v === 2).length;
    if (sometimesCount > 0) {
      frequencySummary = `${sometimesCount} of ${answeredDimensionCount} rated dimensions reported "sometimes"; none reported "often" or "always".`;
    }
  }

  return {
    instrument,
    per_dimension_scores,
    not_sure_flags,
    totalScore,
    answeredDimensionCount,
    frequencySummary,
  };
}

export function calculateQoLScore(scores: Record<string, number>): number {
  const values = Object.values(scores);
  return values.reduce((a, b) => a + b, 0);
}
