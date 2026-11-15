import { DailyCheckIn, FrequencyBandKey, QoLPatternSummary } from '../types';
import { PROVISIONAL_CLINICAL_REVIEW } from '../data/clinicalGovernance';

export const QOL_FREQUENCY_DISCLAIMER = 'This is a frequency description, not a diagnosis or a stage.' as const;

export const QOL_BAND_GOVERNANCE = {
  thresholds: {
    minimumLoggedDays: 5,
    occasionalMaxExclusivePct: 20,
    frequentMaxInclusivePct: 49,
    mostDaysMinPct: 50,
  },
  clinicalReview: PROVISIONAL_CLINICAL_REVIEW,
};

export function computeQoLPatternSummary(
  checkIns: DailyCheckIn[],
  windowDays: 30 | 90 = 30
): QoLPatternSummary {
  const now = new Date();
  const dateSet = new Set<string>();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dateSet.add(d.toISOString().split('T')[0]);
  }

  // Deduplicate by date keeping latest entry for each calendar day
  const byDate = new Map<string, DailyCheckIn>();
  for (const ci of checkIns) {
    if (dateSet.has(ci.date)) {
      const existing = byDate.get(ci.date);
      if (!existing || ci.timestamp > existing.timestamp) {
        byDate.set(ci.date, ci);
      }
    }
  }

  let goodDays = 0;
  let badDays = 0;
  byDate.forEach((ci) => {
    if (ci.isGoodDay) goodDays += 1;
    else badDays += 1;
  });

  const loggedDays = goodDays + badDays;
  const unloggedDays = Math.max(0, windowDays - loggedDays);

  if (loggedDays < QOL_BAND_GOVERNANCE.thresholds.minimumLoggedDays) {
    return {
      windowDays,
      goodDays,
      badDays,
      loggedDays,
      unloggedDays,
      badDayPercentage: loggedDays > 0 ? Math.round((badDays / loggedDays) * 100) : null,
      band: 'insufficient',
      bandLabel: 'Gathering logged days',
      proportionText:
        loggedDays === 0
          ? `0 of ${windowDays} days logged (${unloggedDays} unlogged days).`
          : `${badDays} of ${loggedDays} logged days were bad days (${unloggedDays} days unlogged).`,
      clinicalTranslation: `At least 5 logged days in the ${windowDays}-day window are needed before summarizing a frequency band. Unlogged days are never counted as good days.`,
      disclaimer: QOL_FREQUENCY_DISCLAIMER,
    };
  }

  const badDayPercentage = Math.round((badDays / loggedDays) * 100);
  let band: FrequencyBandKey = 'occasional';
  let bandLabel = 'Occasional';
  let clinicalTranslation =
    'This pattern is similar in frequency to what vets describe as occasional difficult days. Bring this to your vet.';

  if (badDayPercentage >= QOL_BAND_GOVERNANCE.thresholds.mostDaysMinPct) {
    band = 'most_days';
    bandLabel = 'Most days';
    clinicalTranslation =
      'This pattern is similar in frequency to what vets describe when discussing frequent daily impact. Bring this to your vet.';
  } else if (badDayPercentage >= QOL_BAND_GOVERNANCE.thresholds.occasionalMaxExclusivePct) {
    band = 'frequent';
    bandLabel = 'Frequent';
    clinicalTranslation =
      'This pattern is similar in frequency to what vets describe when discussing moderate impact. Bring this to your vet.';
  }

  const proportionText = `${badDays} of ${loggedDays} logged days were bad days (${badDayPercentage}% — ${bandLabel}).`;

  return {
    windowDays,
    goodDays,
    badDays,
    loggedDays,
    unloggedDays,
    badDayPercentage,
    band,
    bandLabel,
    proportionText,
    clinicalTranslation,
    disclaimer: QOL_FREQUENCY_DISCLAIMER,
  };
}

export function comparePersistence30vs90(
  summary30: QoLPatternSummary,
  summary90: QoLPatternSummary
): string {
  if (summary30.badDayPercentage === null || summary90.badDayPercentage === null) {
    return 'Continue logging daily good/hard day ratings to compare short-term shifts against the 90-day pattern.';
  }
  const diff = summary30.badDayPercentage - summary90.badDayPercentage;
  if (diff >= 10) {
    return `Recent 30-day bad-day proportion (${summary30.badDayPercentage}%) is higher than the 90-day proportion (${summary90.badDayPercentage}%), suggesting a newer shift rather than a long-standing baseline.`;
  }
  if (diff <= -10) {
    return `Recent 30-day bad-day proportion (${summary30.badDayPercentage}%) is lower than the 90-day proportion (${summary90.badDayPercentage}%), suggesting fewer bad days recently.`;
  }
  return `30-day (${summary30.badDayPercentage}%) and 90-day (${summary90.badDayPercentage}%) proportions are similar, showing a steady multi-month pattern.`;
}

export function computeWeeklyQoLChangeLine(checkIns: DailyCheckIn[]): string | null {
  const now = new Date();
  const thisWeekDates = new Set<string>();
  const lastWeekDates = new Set<string>();

  for (let i = 0; i < 7; i++) {
    const d1 = new Date(now);
    d1.setDate(d1.getDate() - i);
    thisWeekDates.add(d1.toISOString().split('T')[0]);

    const d2 = new Date(now);
    d2.setDate(d2.getDate() - (i + 7));
    lastWeekDates.add(d2.toISOString().split('T')[0]);
  }

  const thisWeek = checkIns.filter((c) => thisWeekDates.has(c.date));
  const lastWeek = checkIns.filter((c) => lastWeekDates.has(c.date));

  if (thisWeek.length < 3 || lastWeek.length < 3) return null;

  const thisBad = thisWeek.filter((c) => !c.isGoodDay).length;
  const lastBad = lastWeek.filter((c) => !c.isGoodDay).length;
  const thisPct = Math.round((thisBad / thisWeek.length) * 100);
  const lastPct = Math.round((lastBad / lastWeek.length) * 100);

  if (Math.abs(thisPct - lastPct) < 12) return null;

  const summary30 = computeQoLPatternSummary(checkIns, 30);
  const direction = thisPct > lastPct ? 'rose' : 'eased';

  return `Bad-day frequency ${direction} week over week (${thisBad} of ${thisWeek.length} logged days this week vs ${lastBad} of ${lastWeek.length} last week; 30-day pattern: ${summary30.bandLabel.toLowerCase()} at ${summary30.badDayPercentage ?? 0}%). ${QOL_FREQUENCY_DISCLAIMER}`;
}
