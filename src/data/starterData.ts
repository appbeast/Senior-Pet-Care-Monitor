import {
  PetRecord,
  DailyCheckIn,
  MedicationSchedule,
  DoseLog,
  PetEvent,
  CareCircleMember,
  CognitiveAssessmentLog,
  QoLAssessmentLog,
} from '../types';

export const STARTER_PET: PetRecord = {
  id: 'pet_barnaby_01',
  name: 'Barnaby',
  species: 'canine',
  species_pathway: 'dog',
  breed: 'Golden Retriever Mix',
  birthDate: '2014-04-12',
  ageYears: 12,
  age_estimated: false,
  first_screen_due_at: '2021-04-12',
  neuterStatus: 'neutered',
  currentWeightKg: 28.4,
  weightHistory: [
    { id: 'w1', date: '2026-08-15', weightKg: 29.5, notes: 'Annual wellness weigh-in' },
    { id: 'w2', date: '2026-09-18', weightKg: 28.9, notes: 'Follow-up' },
    { id: 'w3', date: '2026-10-14', weightKg: 28.4, notes: 'Current baseline' },
  ],
  knownConditions: ['Osteoarthritis (Bilateral Hips & Stifles)', 'Nocturnal Restlessness', 'Mild Nuclear Sclerosis'],
  currentDiet: 'Hill’s Prescription Diet j/d Joint Care Dry + 1 tbsp warm bone broth',
  dietNotes: 'Prefers food slightly warmed; morning meal fed at 8am, evening at 6pm.',
  profilePhotoUrl: '',
  goalsOfCareNote:
    'What matters most to Barnaby is greeting family gently at the front door, enjoying his morning backyard sun-soak, and sleeping comfortably on his orthopedic bed without waking up whimpering. We want to avoid invasive emergency hospitalizations and ensure his good days consistently outnumber hard days.',
  goalsUpdatedAt: '2026-09-20',
  createdAt: '2026-09-01T08:00:00Z',
};

export const STARTER_CAT_PET: PetRecord = {
  id: 'pet_miso_02',
  name: 'Miso',
  species: 'feline',
  species_pathway: 'cat',
  breed: 'Domestic Shorthair (Tortoiseshell)',
  birthDate: '2012-06-01',
  ageYears: 14,
  age_estimated: true,
  first_screen_due_at: '2022-06-01',
  neuterStatus: 'neutered',
  currentWeightKg: 4.1,
  weightHistory: [
    { id: 'mw1', date: '2026-08-18', weightKg: 4.3, notes: 'Renal check weigh-in' },
    { id: 'mw2', date: '2026-09-22', weightKg: 4.2, notes: 'Home scale check' },
    { id: 'mw3', date: '2026-10-20', weightKg: 4.1, notes: 'Current weight' },
  ],
  knownConditions: ['Chronic Kidney Disease (CKD)', 'Feline Hip Osteoarthritis', 'Night Vocalisation'],
  currentDiet: 'Royal Canin Renal Support Loaf (wet) warmed + extra hydration fountain',
  dietNotes: 'Small frequent wet meals; thrives with low step stool beside favorite sunny windowsill.',
  profilePhotoUrl: '',
  goalsOfCareNote:
    'What matters most to Miso is reaching her sunny living-room windowsill easily, grooming comfortably, purring during evening brushing, and resting calmly overnight.',
  goalsUpdatedAt: '2026-10-05',
  createdAt: '2026-09-05T08:00:00Z',
};

export const STARTER_CARE_CIRCLE: CareCircleMember[] = [
  {
    id: 'user_sarah',
    petId: 'pet_barnaby_01',
    name: 'Sarah Miller',
    email: 'sarah.m@home.org',
    role: 'owner',
    joinedAt: '2026-09-01',
    isCurrentDeviceUser: true,
  },
  {
    id: 'user_david',
    petId: 'pet_barnaby_01',
    name: 'David Miller',
    email: 'david.m@work.net',
    role: 'caregiver',
    joinedAt: '2026-09-02',
    isCurrentDeviceUser: false,
  },
  {
    id: 'user_dr_elena',
    petId: 'pet_barnaby_01',
    name: 'Dr. Elena Rostova, DVM',
    email: 'dr.rostova@oakcreekvet.com',
    role: 'viewer',
    joinedAt: '2026-09-10',
    isCurrentDeviceUser: false,
  },
];

export const STARTER_CAT_CARE_CIRCLE: CareCircleMember[] = [
  {
    id: 'user_sarah_cat',
    petId: 'pet_miso_02',
    name: 'Sarah Miller',
    email: 'sarah.m@home.org',
    role: 'owner',
    joinedAt: '2026-09-05',
    isCurrentDeviceUser: true,
  },
  {
    id: 'user_david_cat',
    petId: 'pet_miso_02',
    name: 'David Miller',
    email: 'david.m@work.net',
    role: 'caregiver',
    joinedAt: '2026-09-05',
    isCurrentDeviceUser: false,
  },
];

export const STARTER_MEDICATIONS: MedicationSchedule[] = [
  {
    id: 'med_carprofen',
    petId: 'pet_barnaby_01',
    name: 'Carprofen (Rimadyl)',
    dosage: '75 mg chewable tablet',
    route: 'oral',
    frequency: 'Twice daily with meals',
    scheduledTimes: ['08:00', '20:00'],
    instructions: 'Always administer with food. For chronic joint pain and hip osteoarthritis.',
    targetCategory: 'pain',
    isActive: true,
    startDate: '2026-08-15',
  },
  {
    id: 'med_gabapentin',
    petId: 'pet_barnaby_01',
    name: 'Gabapentin',
    dosage: '100 mg capsule',
    route: 'oral',
    frequency: 'Every evening before bedtime',
    scheduledTimes: ['21:00'],
    instructions: 'Neuropathic pain relief and nocturnal settling for hip stiffness.',
    targetCategory: 'pain',
    isActive: true,
    startDate: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
  },
  {
    id: 'med_dasuquin',
    petId: 'pet_barnaby_01',
    name: 'Dasuquin Advanced with MSM',
    dosage: '1 soft chew',
    route: 'oral',
    frequency: 'Once daily in morning',
    scheduledTimes: ['08:30'],
    instructions: 'Glucosamine, chondroitin & ASU joint cartilage support.',
    targetCategory: 'joint_support',
    isActive: true,
    startDate: '2026-07-01',
  },
];

export const STARTER_CAT_MEDICATIONS: MedicationSchedule[] = [
  {
    id: 'med_miso_solensia',
    petId: 'pet_miso_02',
    name: 'Gabapentin Oral Suspension (Pain & Settling)',
    dosage: '25 mg liquid with evening meal',
    route: 'oral',
    frequency: 'Every evening',
    scheduledTimes: ['19:30'],
    instructions: 'Supports hip comfort and overnight relaxation.',
    targetCategory: 'pain',
    isActive: true,
    startDate: '2026-09-01',
  },
  {
    id: 'med_miso_fluids',
    petId: 'pet_miso_02',
    name: 'Lactated Ringer’s Sub-Q Fluids',
    dosage: '75 ml every other evening',
    route: 'subcutaneous',
    frequency: 'Every 48 hours',
    scheduledTimes: ['18:30'],
    instructions: 'Rotate left and right scruff/dorsal flank sites.',
    targetCategory: 'renal_hydration',
    isSubQFluid: true,
    fluidVolumeMl: 75,
    fluidNeedleGauge: '20G Terumo',
    isActive: true,
    startDate: '2026-08-20',
  },
];

export function generateStarterHistory(): {
  checkIns: DailyCheckIn[];
  doses: DoseLog[];
  events: PetEvent[];
  cognitiveLogs: CognitiveAssessmentLog[];
  qolLogs: QoLAssessmentLog[];
} {
  const checkIns: DailyCheckIn[] = [];
  const doses: DoseLog[] = [];
  const events: PetEvent[] = [];
  const cognitiveLogs: CognitiveAssessmentLog[] = [];
  const qolLogs: QoLAssessmentLog[] = [];

  const now = new Date();
  const dayMs = 86400000;

  for (let i = 34; i >= 0; i--) {
    const d = new Date(now.getTime() - i * dayMs);
    const dateStr = d.toISOString().split('T')[0];
    const timestamp = d.getTime();

    const isRecent = i < 7;
    const isRecent14 = i < 14;
    const mobility = isRecent
      ? Math.max(2, Math.round((2.6 + Math.sin(i) * 0.35) * 10) / 10)
      : Math.round((3.7 + Math.cos(i) * 0.3) * 10) / 10;
    const appetite = i === 2 || i === 4 ? 3.0 : 4.0;
    const water = isRecent ? 3.5 : 3.0;
    const energy = isRecent ? 2.8 : 3.5;
    const comfort = isRecent14 ? (isRecent ? 2.8 : 3.1) : 3.9;
    const stool = 4;
    const isGoodDay = isRecent && (i === 1 || i === 3 || i === 5) ? false : !isRecent && i === 12 ? false : true;

    checkIns.push({
      id: `checkin_${dateStr}`,
      petId: 'pet_barnaby_01',
      date: dateStr,
      timestamp,
      loggedByUserId: i % 2 === 0 ? 'user_sarah' : 'user_david',
      loggedByUserName: i % 2 === 0 ? 'Sarah Miller' : 'David Miller',
      userRole: i % 2 === 0 ? 'owner' : 'caregiver',
      appetite,
      waterIntake: water,
      energyActivity: energy,
      mobilityStiffness: mobility,
      comfortPain: comfort,
      stoolQuality: stool,
      restingBreathingRate: i % 5 === 0 ? 22 + Math.floor(Math.sin(i) * 3) : undefined,
      isGoodDay,
      quickNote: isRecent && !isGoodDay ? 'Stiff getting up after nap, hesitated at porch step.' : undefined,
    });

    doses.push({
      id: `dose_carp_am_${dateStr}`,
      petId: 'pet_barnaby_01',
      medicationId: 'med_carprofen',
      medicationName: 'Carprofen (Rimadyl)',
      scheduledTime: '08:00',
      date: dateStr,
      timestamp: new Date(`${dateStr}T08:05:00`).getTime(),
      status: 'given',
      administeredByUserId: 'user_sarah',
      administeredByName: 'Sarah Miller',
      administeredByRole: 'owner',
    });

    doses.push({
      id: `dose_dasu_${dateStr}`,
      petId: 'pet_barnaby_01',
      medicationId: 'med_dasuquin',
      medicationName: 'Dasuquin Advanced with MSM',
      scheduledTime: '08:30',
      date: dateStr,
      timestamp: new Date(`${dateStr}T08:32:00`).getTime(),
      status: 'given',
      administeredByUserId: 'user_sarah',
      administeredByName: 'Sarah Miller',
      administeredByRole: 'owner',
    });

    doses.push({
      id: `dose_carp_pm_${dateStr}`,
      petId: 'pet_barnaby_01',
      medicationId: 'med_carprofen',
      medicationName: 'Carprofen (Rimadyl)',
      scheduledTime: '20:00',
      date: dateStr,
      timestamp: new Date(`${dateStr}T20:10:00`).getTime(),
      status: i === 6 ? 'skipped' : 'given',
      skipReason: i === 6 ? 'Late dinner; held to avoid upset stomach' : undefined,
      administeredByUserId: 'user_david',
      administeredByName: 'David Miller',
      administeredByRole: 'caregiver',
    });

    if (i < 9) {
      doses.push({
        id: `dose_gaba_${dateStr}`,
        petId: 'pet_barnaby_01',
        medicationId: 'med_gabapentin',
        medicationName: 'Gabapentin',
        scheduledTime: '21:00',
        date: dateStr,
        timestamp: new Date(`${dateStr}T21:15:00`).getTime(),
        status: 'given',
        administeredByUserId: 'user_david',
        administeredByName: 'David Miller',
        administeredByRole: 'caregiver',
      });
    }
  }

  events.push(
    {
      id: 'event_01',
      petId: 'pet_barnaby_01',
      timestamp: now.getTime() - 2 * dayMs,
      eventTypeId: 'mob_dog_rising',
      eventName: 'Stiffness on Rising',
      category: 'mobility',
      severity: 'moderate',
      notes: 'Took 15 seconds to rise after 2-hour rug nap. Rear left leg slightly tentative for first 6 steps.',
      loggedByUserId: 'user_sarah',
      loggedByUserName: 'Sarah Miller',
      userRole: 'owner',
      syncState: 'synced',
    },
    {
      id: 'event_02',
      petId: 'pet_barnaby_01',
      timestamp: now.getTime() - 3 * dayMs,
      eventTypeId: 'mob_dog_stairs',
      eventName: 'Hesitation at Stairs',
      category: 'mobility',
      severity: 'mild',
      notes: 'Paused at top of 3 steps, waited for David to guide him gently before stepping down.',
      loggedByUserId: 'user_david',
      loggedByUserName: 'David Miller',
      userRole: 'caregiver',
      syncState: 'synced',
    },
    {
      id: 'event_03',
      petId: 'pet_barnaby_01',
      timestamp: now.getTime() - 4 * dayMs,
      eventTypeId: 'cog_dog_disorient',
      eventName: 'Disorientation',
      category: 'cognitive',
      severity: 'moderate',
      notes: 'Stood staring quietly at laundry door for 45 seconds around 9:30pm before settling on his bed.',
      loggedByUserId: 'user_sarah',
      loggedByUserName: 'Sarah Miller',
      userRole: 'owner',
      syncState: 'synced',
    },
    {
      id: 'event_03b',
      petId: 'pet_barnaby_01',
      timestamp: now.getTime() - 6 * dayMs,
      eventTypeId: 'cog_anxiety',
      eventName: 'Heightened Anxiety / Shadowing',
      category: 'cognitive',
      severity: 'mild',
      notes: 'Followed Sarah closely from room to room in the evening and seemed unsettled when lights dimmed.',
      loggedByUserId: 'user_sarah',
      loggedByUserName: 'Sarah Miller',
      userRole: 'owner',
      syncState: 'synced',
    },
    {
      id: 'event_04',
      petId: 'pet_barnaby_01',
      timestamp: now.getTime() - 14 * dayMs,
      eventTypeId: 'care_vet_visit',
      eventName: 'Veterinary Clinic Visit',
      category: 'care_treatment',
      severity: 'routine',
      notes: 'Oak Creek Animal Clinic. Dr. Rostova noted steady lab values and recommended tracking evening comfort closely.',
      loggedByUserId: 'user_sarah',
      loggedByUserName: 'Sarah Miller',
      userRole: 'owner',
      syncState: 'synced',
    },
    {
      id: 'event_05',
      petId: 'pet_barnaby_01',
      timestamp: now.getTime() - 20 * dayMs,
      eventTypeId: 'care_grooming',
      eventName: 'Nail Trim / Hygiene Brush',
      category: 'care_treatment',
      severity: 'routine',
      notes: 'Rear nails trimmed back to reduce clicking and sliding on hardwood floors.',
      loggedByUserId: 'user_david',
      loggedByUserName: 'David Miller',
      userRole: 'caregiver',
      syncState: 'synced',
    }
  );

  // Two historical DISHAA screens so the trend chart renders immediately with "more screens needed for a reliable trend"
  // and latest screen was 190 days ago -> 6-month automatic scheduled check is DUE NOW!
  const screen1Ts = now.getTime() - 375 * dayMs;
  const screen2Ts = now.getTime() - 190 * dayMs;

  cognitiveLogs.push(
    {
      id: 'dishaa_screen_01',
      petId: 'pet_barnaby_01',
      instrument: 'DISHAA',
      date: new Date(screen1Ts).toISOString().split('T')[0],
      completed_at: new Date(screen1Ts).toISOString(),
      timestamp: screen1Ts,
      triggered_by: 'scheduled',
      next_due_at: new Date(screen2Ts).toISOString(),
      per_dimension_scores: {
        disorientation: 1,
        social_interaction: 0,
        sleep_wake: 1,
        house_soiling: 0,
        learning_memory: 0,
        activity: 1,
        anxiety: 1,
      },
      not_sure_flags: {
        disorientation: false,
        social_interaction: false,
        sleep_wake: false,
        house_soiling: false,
        learning_memory: false,
        activity: false,
        anxiety: false,
      },
      totalScore: 14,
      answeredDimensionCount: 7,
      frequencySummary: 'All 7 rated dimensions reported never or rarely.',
      newlyEmergedSigns: ['Occasional hesitation at hallway door after dusk'],
      notes: 'Initial 6-month DISHAA baseline.',
      loggedByName: 'Sarah Miller',
    },
    {
      id: 'dishaa_screen_02',
      petId: 'pet_barnaby_01',
      instrument: 'DISHAA',
      date: new Date(screen2Ts).toISOString().split('T')[0],
      completed_at: new Date(screen2Ts).toISOString(),
      timestamp: screen2Ts,
      triggered_by: 'scheduled',
      next_due_at: new Date(screen2Ts + 183 * dayMs).toISOString(),
      per_dimension_scores: {
        disorientation: 2,
        social_interaction: 0,
        sleep_wake: 2,
        house_soiling: 1,
        learning_memory: 0,
        activity: 1,
        anxiety: 2,
      },
      not_sure_flags: {
        disorientation: false,
        social_interaction: false,
        sleep_wake: false,
        house_soiling: false,
        learning_memory: false,
        activity: false,
        anxiety: false,
      },
      totalScore: 29,
      answeredDimensionCount: 7,
      frequencySummary: '3 of 7 rated dimensions reported "sometimes"; none reported "often" or "always".',
      newlyEmergedSigns: ['Increased evening pacing between 10pm and midnight'],
      notes: '6-month scheduled follow-up.',
      loggedByName: 'Sarah Miller',
    }
  );

  for (let w = 4; w >= 0; w--) {
    const qolDate = new Date(now.getTime() - w * 7 * dayMs);
    qolLogs.push({
      id: `qol_week_${w}`,
      petId: 'pet_barnaby_01',
      date: qolDate.toISOString().split('T')[0],
      timestamp: qolDate.getTime(),
      scores: {
        hurt: 7 - (w === 0 ? 1 : 0),
        hunger: 8,
        hydration: 8,
        hygiene: 9,
        happiness: 8 - (w === 0 ? 1 : 0),
        mobility: 6 - (w <= 1 ? 1 : 0),
        more_good_days: 8,
      },
      totalScore: 54 - w,
      goodDaysPast30Count: 26,
      badDaysPast30Count: 4,
      loggedByName: 'Sarah Miller',
      notes: w === 0 ? 'Slightly stiffer after naps in cooler mornings, but still enthusiastic for meals.' : undefined,
    });
  }

  return { checkIns, doses, events, cognitiveLogs, qolLogs };
}

export function generateStarterCatHistory(): {
  checkIns: DailyCheckIn[];
  doses: DoseLog[];
  events: PetEvent[];
  cognitiveLogs: CognitiveAssessmentLog[];
  qolLogs: QoLAssessmentLog[];
} {
  const checkIns: DailyCheckIn[] = [];
  const doses: DoseLog[] = [];
  const events: PetEvent[] = [];
  const cognitiveLogs: CognitiveAssessmentLog[] = [];
  const qolLogs: QoLAssessmentLog[] = [];

  const now = new Date();
  const dayMs = 86400000;

  for (let i = 34; i >= 0; i--) {
    const d = new Date(now.getTime() - i * dayMs);
    const dateStr = d.toISOString().split('T')[0];
    const timestamp = d.getTime();
    const isRecent = i < 7;

    // 7 of 30 logged days marked as harder days (23% -> Frequent band)
    const isGoodDay =
      isRecent && (i === 1 || i === 3 || i === 5)
        ? false
        : !isRecent && (i === 10 || i === 14 || i === 19 || i === 24)
        ? false
        : true;

    checkIns.push({
      id: `miso_checkin_${dateStr}`,
      petId: 'pet_miso_02',
      date: dateStr,
      timestamp,
      loggedByUserId: 'user_sarah_cat',
      loggedByUserName: 'Sarah Miller',
      userRole: 'owner',
      appetite: isRecent ? 3.5 : 4.2,
      waterIntake: isRecent ? 3.9 : 3.2,
      energyActivity: isRecent ? 2.9 : 3.6,
      mobilityStiffness: isRecent ? 2.8 : 3.7,
      comfortPain: isRecent ? 3.0 : 4.0,
      stoolQuality: 3,
      restingBreathingRate: i % 6 === 0 ? 24 : undefined,
      isGoodDay,
      quickNote: !isGoodDay ? 'Needed footstool to reach windowsill; loud meowing around 3am.' : undefined,
    });

    // Pain med adherence: miss 3 doses in recent 10 days (~70% adherence < 85% -> triggers adherence-first prompt!)
    doses.push({
      id: `miso_gaba_${dateStr}`,
      petId: 'pet_miso_02',
      medicationId: 'med_miso_solensia',
      medicationName: 'Gabapentin Oral Suspension (Pain & Settling)',
      scheduledTime: '19:30',
      date: dateStr,
      timestamp: new Date(`${dateStr}T19:35:00`).getTime(),
      status: isRecent && (i === 2 || i === 4 || i === 6) ? 'skipped' : 'given',
      skipReason: isRecent && (i === 2 || i === 4 || i === 6) ? 'Refused medicated wet food portion' : undefined,
      administeredByUserId: 'user_sarah_cat',
      administeredByName: 'Sarah Miller',
      administeredByRole: 'owner',
    });

    if (i % 2 === 0) {
      doses.push({
        id: `miso_fluids_${dateStr}`,
        petId: 'pet_miso_02',
        medicationId: 'med_miso_fluids',
        medicationName: 'Lactated Ringer’s Sub-Q Fluids',
        scheduledTime: '18:30',
        date: dateStr,
        timestamp: new Date(`${dateStr}T18:35:00`).getTime(),
        status: 'given',
        siteNote: i % 4 === 0 ? 'Left dorsal flank' : 'Right dorsal flank',
        administeredByUserId: 'user_sarah_cat',
        administeredByName: 'Sarah Miller',
        administeredByRole: 'owner',
      });
    }
  }

  events.push(
    {
      id: 'miso_ev_01',
      petId: 'pet_miso_02',
      timestamp: now.getTime() - 1 * dayMs,
      eventTypeId: 'cog_cat_night_vocal',
      eventName: 'Night Vocalisation',
      category: 'cognitive',
      severity: 'moderate',
      notes: 'Loud meowing in hallway at 2:45am for ~10 minutes; settled after comforting.',
      loggedByUserId: 'user_sarah_cat',
      loggedByUserName: 'Sarah Miller',
      userRole: 'owner',
      syncState: 'synced',
    },
    {
      id: 'miso_ev_02',
      petId: 'pet_miso_02',
      timestamp: now.getTime() - 3 * dayMs,
      eventTypeId: 'mob_cat_jump_hesitate',
      eventName: 'Hesitating Before Jumping',
      category: 'mobility',
      severity: 'moderate',
      notes: 'Sized up bed edge twice and used pet footstool instead of direct jump.',
      loggedByUserId: 'user_david_cat',
      loggedByUserName: 'David Miller',
      userRole: 'caregiver',
      syncState: 'synced',
    },
    {
      id: 'miso_ev_03',
      petId: 'pet_miso_02',
      timestamp: now.getTime() - 5 * dayMs,
      eventTypeId: 'cog_anxiety',
      eventName: 'Heightened Anxiety / Shadowing',
      category: 'cognitive',
      severity: 'mild',
      notes: 'Startled easily by hallway noises and stayed tucked under bed until evening.',
      loggedByUserId: 'user_sarah_cat',
      loggedByUserName: 'Sarah Miller',
      userRole: 'owner',
      syncState: 'synced',
    },
    {
      id: 'miso_ev_04',
      petId: 'pet_miso_02',
      timestamp: now.getTime() - 9 * dayMs,
      eventTypeId: 'uri_cat_large_clumps',
      eventName: 'Larger / More Frequent Litter Clumps',
      category: 'urinary',
      severity: 'mild',
      notes: 'Morning litter box scoop had two noticeably larger urine clumps.',
      loggedByUserId: 'user_sarah_cat',
      loggedByUserName: 'Sarah Miller',
      userRole: 'owner',
      syncState: 'synced',
    }
  );

  // Two VISHDAAL screens for Miso (most recent 195 days ago -> due now, or wait: let's put screen 2 at 5 days ago OR 190 days ago so automatic 6-mo check works! Let's put screen 2 at 185 days ago so both Barnaby and Miso show automatic 6-month due prompt!).
  const mScreen1Ts = now.getTime() - 370 * dayMs;
  const mScreen2Ts = now.getTime() - 185 * dayMs;

  cognitiveLogs.push(
    {
      id: 'vishdaal_miso_01',
      petId: 'pet_miso_02',
      instrument: 'VISHDAAL',
      date: new Date(mScreen1Ts).toISOString().split('T')[0],
      completed_at: new Date(mScreen1Ts).toISOString(),
      timestamp: mScreen1Ts,
      triggered_by: 'scheduled',
      next_due_at: new Date(mScreen2Ts).toISOString(),
      per_dimension_scores: {
        vocalization: 1,
        interactions: 1,
        sleep_wake: 1,
        house_soiling: 0,
        activity: 1,
        anxiety: 1,
        learning_memory: 0,
      },
      not_sure_flags: {
        vocalization: false,
        interactions: false,
        sleep_wake: false,
        house_soiling: false,
        activity: false,
        anxiety: false,
        learning_memory: false,
      },
      totalScore: 18,
      answeredDimensionCount: 7,
      frequencySummary: 'All 7 rated dimensions reported never or rarely.',
      newlyEmergedSigns: ['Occasional meowing in hallway after midnight'],
      notes: 'Baseline VISHDAAL screen.',
      loggedByName: 'Sarah Miller',
    },
    {
      id: 'vishdaal_miso_02',
      petId: 'pet_miso_02',
      instrument: 'VISHDAAL',
      date: new Date(mScreen2Ts).toISOString().split('T')[0],
      completed_at: new Date(mScreen2Ts).toISOString(),
      timestamp: mScreen2Ts,
      triggered_by: 'scheduled',
      next_due_at: new Date(mScreen2Ts + 183 * dayMs).toISOString(),
      per_dimension_scores: {
        vocalization: 3,
        interactions: 1,
        sleep_wake: 2,
        house_soiling: 0,
        activity: 2,
        anxiety: 2,
        learning_memory: 0,
      },
      not_sure_flags: {
        vocalization: false,
        interactions: false,
        sleep_wake: false,
        house_soiling: false,
        activity: false,
        anxiety: false,
        learning_memory: false,
      },
      totalScore: 36,
      answeredDimensionCount: 7,
      frequencySummary: 'Higher frequency ("often" or "always") reported in: Vocalisation (often).',
      newlyEmergedSigns: ['Night vocalisation increased to several nights weekly'],
      notes: 'Follow-up VISHDAAL screen.',
      loggedByName: 'Sarah Miller',
    }
  );

  qolLogs.push({
    id: 'miso_qol_latest',
    petId: 'pet_miso_02',
    date: new Date(now.getTime() - 2 * dayMs).toISOString().split('T')[0],
    timestamp: now.getTime() - 2 * dayMs,
    scores: {
      hurt: 6,
      hunger: 8,
      hydration: 7,
      hygiene: 8,
      happiness: 8,
      mobility: 6,
      more_good_days: 7,
    },
    totalScore: 50,
    goodDaysPast30Count: 23,
    badDaysPast30Count: 7,
    loggedByName: 'Sarah Miller',
    notes: 'Purrs warmly at feeding time; uses pet steps to reach sunny windowsill.',
  });

  return { checkIns, doses, events, cognitiveLogs, qolLogs };
}
