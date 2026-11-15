import { PetRecord, Species, SpeciesPathway } from '../types';

export function resolveSpeciesPathway(pet?: Pick<PetRecord, 'species' | 'species_pathway'> | null): SpeciesPathway {
  if (!pet) return 'dog';
  if (pet.species_pathway === 'cat' || pet.species === 'feline') return 'cat';
  return 'dog';
}

export function speciesFromPathway(pathway: SpeciesPathway): Species {
  return pathway === 'cat' ? 'feline' : 'canine';
}

export interface SpeciesPathwayCopy {
  pathway: SpeciesPathway;
  speciesLabel: string;
  cognitiveInstrument: 'DISHAA' | 'VISHDAAL';
  headlineCognitiveSignLabel: string;
  dailyCheckIn: {
    mobilityLabel: string;
    mobilityLow: string;
    mobilityMid: string;
    mobilityHigh: string;
    mobilityScaleLeft: string;
    mobilityScaleRight: string;
    activityLabel: string;
    activityLow: string;
    activityMid: string;
    activityHigh: string;
    hydrationLabel: string;
    hydrationNormal: string;
    notePlaceholder: string;
    stoolPlaceholderHint: string;
  };
  baselineLabels: {
    mobilityStiffness: string;
    comfortPain: string;
    appetite: string;
    waterIntake: string;
    energyActivity: string;
    restingBreathingRate: string;
  };
  qolHeaderNote: string;
  onboardingDefaults: {
    breedPlaceholder: string;
    defaultBreed: string;
    defaultConditions: string;
    defaultDiet: string;
    defaultGoalsOfCare: string;
  };
  vetBriefLabels: {
    cognitiveSectionTitle: string;
    eliminationLabel: string;
    headlineSignLabel: string;
  };
}

export const DOG_PATHWAY_COPY: SpeciesPathwayCopy = {
  pathway: 'dog',
  speciesLabel: 'Dog',
  cognitiveInstrument: 'DISHAA',
  headlineCognitiveSignLabel: 'Disorientation',
  dailyCheckIn: {
    mobilityLabel: 'Mobility, Rising & Stairs',
    mobilityLow: 'Stiff / hesitant on stairs',
    mobilityMid: 'Mild stiffness on rising',
    mobilityHigh: 'Comfortable & fluid',
    mobilityScaleLeft: 'Stiff / slow',
    mobilityScaleRight: 'Smooth stride',
    activityLabel: 'Daily Energy & Outdoor Engagement',
    activityLow: 'Quiet / tires quickly',
    activityMid: 'Steady senior pace',
    activityHigh: 'Alert & eager',
    hydrationLabel: 'Water Bowl Intake',
    hydrationNormal: 'Normal bowl visits',
    notePlaceholder: 'e.g. Coughed twice after backyard stroll or stiff rising from bed',
    stoolPlaceholderHint: 'Observed on grass or yard',
  },
  baselineLabels: {
    mobilityStiffness: 'Mobility & Rising Ease',
    comfortPain: 'Comfort & Restfulness',
    appetite: 'Meal Appetite',
    waterIntake: 'Water Bowl Visits',
    energyActivity: 'Daily Energy & Stamina',
    restingBreathingRate: 'Sleeping Breathing Rate',
  },
  qolHeaderNote: 'Tracks canine comfort, outdoor mobility, and daily joy.',
  onboardingDefaults: {
    breedPlaceholder: 'e.g. Golden Retriever, Labrador Mix',
    defaultBreed: 'Mixed Breed Dog',
    defaultConditions: 'Osteoarthritis, Senior Dental',
    defaultDiet: 'Senior joint-support formula',
    defaultGoalsOfCare:
      'Comfortable rising after naps, pain-free outdoor movement, and enjoying meals and family greetings.',
  },
  vetBriefLabels: {
    cognitiveSectionTitle: 'Cognitive Trend Summary (DISHAA — Canine)',
    eliminationLabel: 'House-soiling & Urinary Changes',
    headlineSignLabel: 'Disorientation & Night Pacing',
  },
};

export const CAT_PATHWAY_COPY: SpeciesPathwayCopy = {
  pathway: 'cat',
  speciesLabel: 'Cat',
  cognitiveInstrument: 'VISHDAAL',
  headlineCognitiveSignLabel: 'Night Vocalisation',
  dailyCheckIn: {
    mobilityLabel: 'Jumping, Climbing & Grooming Reach',
    mobilityLow: 'Hesitates to jump / avoids perches',
    mobilityMid: 'Uses intermediate step to reach bed',
    mobilityHigh: 'Jumps to favorite windowsill easily',
    mobilityScaleLeft: 'Hesitant to jump',
    mobilityScaleRight: 'Fluid jumping',
    activityLabel: 'Daily Activity (Jumping, Grooming & Box Visits)',
    activityLow: 'Hidden / minimal perching',
    activityMid: 'Normal senior lounging & grooming',
    activityHigh: 'Playful, climbs perches & grooms well',
    hydrationLabel: 'Water Bowl & Fountain Intake',
    hydrationNormal: 'Normal fountain / bowl visits',
    notePlaceholder: 'e.g. Needed footstool to reach sunny windowsill; quiet night',
    stoolPlaceholderHint: 'Observed in litter box',
  },
  baselineLabels: {
    mobilityStiffness: 'Jumping & Grooming Mobility',
    comfortPain: 'Comfort & Relaxed Resting',
    appetite: 'Meal & Treat Appetite',
    waterIntake: 'Water Fountain / Bowl Visits',
    energyActivity: 'Daily Climbing, Play & Grooming',
    restingBreathingRate: 'Sleeping Breathing Rate',
  },
  qolHeaderNote: 'Tracks feline jumping confidence, grooming comfort, litter box ease, and feeding engagement.',
  onboardingDefaults: {
    breedPlaceholder: 'e.g. Domestic Shorthair, Maine Coon, Siamese',
    defaultBreed: 'Domestic Shorthair',
    defaultConditions: 'Feline Osteoarthritis, Chronic Kidney Disease (CKD)',
    defaultDiet: 'Senior wet food + renal-support diet',
    defaultGoalsOfCare:
      'Still jumping onto the sunny windowsill, grooming comfortably, enjoying feeding time, and resting peacefully through the night.',
  },
  vetBriefLabels: {
    cognitiveSectionTitle: 'Cognitive Trend Summary (VISHDAAL — Feline)',
    eliminationLabel: 'Litter Box Changes & Elimination',
    headlineSignLabel: 'Night Vocalisation Frequency',
  },
};

export function getSpeciesPathwayCopy(pathway: SpeciesPathway): SpeciesPathwayCopy {
  return pathway === 'cat' ? CAT_PATHWAY_COPY : DOG_PATHWAY_COPY;
}

// Strict Species Separation Rules for Automated String Audit
export const FORBIDDEN_IN_CAT_PATHWAY: string[] = [
  'walk',
  'walks',
  'walking',
  'leash',
  'tail wag',
  'wagging',
  'bark',
  'barking',
  'howl',
  'howling',
  'dishaa',
  'canine',
  'yard',
  'porch',
  'dog',
];

export const FORBIDDEN_IN_DOG_PATHWAY: string[] = [
  'litter box',
  'litterbox',
  'vishdaal',
  'feline',
  'meow',
  'meowing',
  'yowl',
  'yowling',
  'purr',
  'windowsill',
  'scratching post',
  'cat',
];
