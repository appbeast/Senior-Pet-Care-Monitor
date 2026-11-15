import {
  DailyCheckIn,
  PetEvent,
  SpeciesPathway,
  WeeklyChangeBrief,
  WeeklyChangeBullet,
} from '../types';
import { calculateBaselines } from './baselineEngine';
import { computeWeeklyQoLChangeLine } from './qolPatternService';

export function generateWeeklyChangeBrief(
  petId: string,
  petName: string,
  checkIns: DailyCheckIn[],
  events: PetEvent[],
  pathway: SpeciesPathway = 'dog'
): WeeklyChangeBrief {
  const baselines = calculateBaselines(checkIns, pathway);
  const now = Date.now();
  const weekEndingDate = new Date().toISOString().split('T')[0];

  const past7DaysEvents = events.filter((e) => now - e.timestamp <= 7 * 86400000);

  const sortedDeviations = [...baselines]
    .filter((b) => b.hasSufficientBaseline)
    .sort((a, b) => Math.abs(b.percentDeviation) - Math.abs(a.percentDeviation));

  const bullets: WeeklyChangeBullet[] = [];

  // Bullet 1: Primary deviation
  if (sortedDeviations.length > 0 && Math.abs(sortedDeviations[0].percentDeviation) >= 8) {
    const primary = sortedDeviations[0];
    const dir = primary.percentDeviation > 0 ? 'up' : 'down';
    bullets.push({
      id: 'bullet_1',
      metricLabel: primary.metricLabel,
      summary: `${primary.metricLabel} is ${dir} ${Math.abs(primary.percentDeviation)}% relative to ${petName}'s 30-day baseline (7-day mean: ${primary.mean7d} vs 30-day mean: ${primary.mean30d}).`,
      dataLink: `${primary.mean7d} / 5.0 (30d avg: ${primary.mean30d})`,
      severity: primary.status === 'discuss_vet' ? 'discuss_vet' : primary.status === 'watch' ? 'watch' : 'neutral',
    });
  } else {
    bullets.push({
      id: 'bullet_1',
      metricLabel: pathway === 'cat' ? 'Jumping & Grooming Mobility' : 'Mobility & Rising Ease',
      summary:
        pathway === 'cat'
          ? `Perch jumping and daily comfort remained steady within 5% of ${petName}'s 30-day baseline.`
          : `Morning rising mobility remained steady within 5% of ${petName}'s 30-day baseline.`,
      dataLink: 'Within normal range',
      severity: 'neutral',
    });
  }

  // Bullet 2: Good vs Hard days
  const past7DaysCheckIns = checkIns.filter((c) => now - c.timestamp <= 7 * 86400000);
  const goodDaysCount = past7DaysCheckIns.filter((c) => c.isGoodDay).length;
  const hardDaysCount = past7DaysCheckIns.length - goodDaysCount;

  if (hardDaysCount > 0) {
    bullets.push({
      id: 'bullet_2',
      metricLabel: 'Good Days vs Harder Days',
      summary:
        pathway === 'cat'
          ? `${petName} had ${goodDaysCount} good days and ${hardDaysCount} harder ${hardDaysCount === 1 ? 'day' : 'days'} out of ${past7DaysCheckIns.length} logged days this week, with lower jumping or nighttime restlessness noted.`
          : `${petName} had ${goodDaysCount} good days and ${hardDaysCount} harder ${hardDaysCount === 1 ? 'day' : 'days'} out of ${past7DaysCheckIns.length} logged days this week, primarily associated with morning rising stiffness.`,
      dataLink: `${goodDaysCount} of ${past7DaysCheckIns.length} logged days`,
      severity: hardDaysCount >= 3 ? 'discuss_vet' : 'watch',
    });
  } else if (sortedDeviations.length > 1 && Math.abs(sortedDeviations[1].percentDeviation) >= 6) {
    const sec = sortedDeviations[1];
    const dir = sec.percentDeviation > 0 ? 'higher' : 'lower';
    bullets.push({
      id: 'bullet_2',
      metricLabel: sec.metricLabel,
      summary: `${sec.metricLabel} was ${dir} by ${Math.abs(sec.percentDeviation)}% compared to normal (7-day mean: ${sec.mean7d}).`,
      dataLink: `Baseline: ${sec.mean30d}`,
      severity: sec.status === 'discuss_vet' ? 'discuss_vet' : 'neutral',
    });
  } else {
    bullets.push({
      id: 'bullet_2',
      metricLabel: 'Overall Well-being',
      summary: `${petName} recorded ${goodDaysCount} good days out of ${past7DaysCheckIns.length} logged days with steady appetite and calm evenings.`,
      dataLink: `${goodDaysCount}/${past7DaysCheckIns.length} good days logged`,
      severity: 'neutral',
    });
  }

  // Bullet 3: Species-aware recent observations
  const cogEvents = past7DaysEvents.filter((e) => e.category === 'cognitive');
  const nightVocalEvents = past7DaysEvents.filter((e) => e.eventTypeId === 'cog_cat_night_vocal');
  const stairEvents = past7DaysEvents.filter((e) => e.eventTypeId === 'mob_dog_stairs' || e.eventTypeId === 'mob_cat_stairs');

  if (pathway === 'cat' && nightVocalEvents.length > 0) {
    bullets.push({
      id: 'bullet_3',
      metricLabel: 'Night Vocalisation Frequency',
      summary: `${nightVocalEvents.length} night vocalisation ${nightVocalEvents.length === 1 ? 'episode was' : 'episodes were'} logged this week.`,
      dataLink: `${nightVocalEvents.length} logged events`,
      severity: 'watch',
    });
  } else if (cogEvents.length > 0) {
    bullets.push({
      id: 'bullet_3',
      metricLabel: 'Nocturnal Activity & Behavior',
      summary: `${cogEvents.length} nocturnal restlessness or cognitive ${cogEvents.length === 1 ? 'episode was' : 'episodes were'} logged this week.`,
      dataLink: `${cogEvents.length} logged events`,
      severity: 'watch',
    });
  } else if (stairEvents.length > 0) {
    bullets.push({
      id: 'bullet_3',
      metricLabel: 'Stair & Elevation Hesitation',
      summary: `Logged ${stairEvents.length} instances of hesitation at steps, showing discomfort on elevation changes.`,
      dataLink: `${stairEvents.length} events logged`,
      severity: 'watch',
    });
  } else if (past7DaysEvents.length > 0) {
    bullets.push({
      id: 'bullet_3',
      metricLabel: 'Observed Senior Events',
      summary: `A total of ${past7DaysEvents.length} structured observations were recorded this week across the care team.`,
      dataLink: `${past7DaysEvents.length} events logged`,
      severity: 'neutral',
    });
  } else {
    bullets.push({
      id: 'bullet_3',
      metricLabel: 'Routine Stability',
      summary: 'No unusual senior observations were flagged across the past 7 days.',
      dataLink: '0 notable events',
      severity: 'neutral',
    });
  }

  const finalBullets = bullets.slice(0, 3);

  // Derived vet question
  let vetQuestion =
    pathway === 'cat'
      ? `With recent changes in ${petName}'s jumping comfort and nighttime vocalisation, would adjusting evening comfort support or checking blood pressure be helpful?`
      : `Given the recent change in morning rising stiffness over the past two weeks, would adjusting the timing of ${petName}'s evening comfort plan or adding an adjunct therapy be appropriate?`;

  if (sortedDeviations.length > 0 && sortedDeviations[0].metricKey === 'waterIntake' && sortedDeviations[0].percentDeviation > 15) {
    vetQuestion = `${petName}'s water visits have increased by ${sortedDeviations[0].percentDeviation}% over baseline. Should we check a routine senior urine specific gravity or screening panel?`;
  } else if (sortedDeviations.length > 0 && sortedDeviations[0].metricKey === 'appetite' && sortedDeviations[0].percentDeviation < -15) {
    vetQuestion = `${petName}'s appetite has softened by ${Math.abs(sortedDeviations[0].percentDeviation)}% over the past 7 days. Would checking dental comfort or nausea support be helpful?`;
  }

  const watchItem =
    pathway === 'cat'
      ? {
          metric: sortedDeviations.length > 0 ? sortedDeviations[0].metricLabel : 'Jumping & Litter Box Comfort',
          thresholdDescription:
            'Watch whether hesitating before jumping onto low furniture persists, or if night vocalisation episodes occur more than twice in a week.',
        }
      : {
          metric: sortedDeviations.length > 0 ? sortedDeviations[0].metricLabel : 'Morning Rising Time',
          thresholdDescription:
            'Watch whether hesitation exceeds 30 seconds when getting up from resting, or if stairs are avoided entirely.',
        };

  const qolPatternLine = computeWeeklyQoLChangeLine(checkIns) || undefined;

  return {
    id: `brief_${weekEndingDate}`,
    petId,
    weekEndingDate,
    bullets: finalBullets,
    qolPatternLine,
    vetQuestion,
    watchItem,
    generatedAt: new Date().toISOString(),
  };
}
