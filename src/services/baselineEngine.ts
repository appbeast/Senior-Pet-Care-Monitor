import { DailyCheckIn, MetricBaseline, SpeciesPathway } from '../types';
import { getSpeciesPathwayCopy } from './speciesPathway';

export interface MetricDefinition {
  key: keyof Pick<DailyCheckIn, 'appetite' | 'waterIntake' | 'energyActivity' | 'mobilityStiffness' | 'comfortPain' | 'restingBreathingRate'>;
  label: string;
  unit?: string;
  higherIsBetter: boolean;
  normalRangeText: string;
}

export function getMonitoredMetricsForSpecies(pathway: SpeciesPathway): MetricDefinition[] {
  const copy = getSpeciesPathwayCopy(pathway);
  return [
    { key: 'mobilityStiffness', label: copy.baselineLabels.mobilityStiffness, higherIsBetter: true, normalRangeText: '3.5 - 4.5 out of 5' },
    { key: 'comfortPain', label: copy.baselineLabels.comfortPain, higherIsBetter: true, normalRangeText: '3.5 - 5.0 out of 5' },
    { key: 'appetite', label: copy.baselineLabels.appetite, higherIsBetter: true, normalRangeText: '3.8 - 4.5 out of 5' },
    { key: 'waterIntake', label: copy.baselineLabels.waterIntake, higherIsBetter: false, normalRangeText: '2.8 - 3.2 (3 = normal)' },
    { key: 'energyActivity', label: copy.baselineLabels.energyActivity, higherIsBetter: true, normalRangeText: '3.0 - 4.5 out of 5' },
    { key: 'restingBreathingRate', label: copy.baselineLabels.restingBreathingRate, unit: 'br/min', higherIsBetter: false, normalRangeText: '16 - 28 breaths/min' },
  ];
}

export const MONITORED_METRICS: MetricDefinition[] = getMonitoredMetricsForSpecies('dog');

export function calculateBaselines(
  checkIns: DailyCheckIn[],
  pathway: SpeciesPathway = 'dog'
): MetricBaseline[] {
  const sorted = [...checkIns].sort((a, b) => b.timestamp - a.timestamp);
  const now = Date.now();
  const dayMs = 86400000;

  const past7Days = sorted.filter((c) => now - c.timestamp <= 7 * dayMs);
  const past30Days = sorted.filter((c) => now - c.timestamp <= 30 * dayMs);

  const startDate30 = new Date(now - 29 * dayMs).toISOString().split('T')[0];
  const endDate30 = new Date(now).toISOString().split('T')[0];
  const dateRangeLabel = `${startDate30} to ${endDate30}`;

  const metrics = getMonitoredMetricsForSpecies(pathway);

  return metrics.map((def) => {
    const samples30 = past30Days
      .map((c) => c[def.key])
      .filter((val): val is number => typeof val === 'number' && !isNaN(val));

    const samples7 = past7Days
      .map((c) => c[def.key])
      .filter((val): val is number => typeof val === 'number' && !isNaN(val));

    const sampleCount = samples30.length;

    // Hard Constraint: Never show a deviation against a baseline built from fewer than 5 data points
    if (sampleCount < 5 || samples7.length === 0) {
      return {
        metricKey: def.key,
        metricLabel: def.label,
        sampleCount,
        hasSufficientBaseline: false,
        mean7d: samples7.length > 0 ? round1(average(samples7)) : 0,
        mean30d: samples30.length > 0 ? round1(average(samples30)) : 0,
        percentDeviation: 0,
        status: 'learning',
        trendDirection: 'stable',
        interpretation: `Still learning your pet's normal (${sampleCount}/5 check-ins recorded).`,
        dateRangeLabel,
      };
    }

    const mean7d = average(samples7);
    const mean30d = average(samples30);

    const rawDelta = mean7d - mean30d;
    const percentDeviation = mean30d !== 0 ? Math.round((rawDelta / mean30d) * 100) : 0;

    let trendDirection: 'stable' | 'increasing' | 'decreasing' = 'stable';
    if (percentDeviation > 6) trendDirection = 'increasing';
    else if (percentDeviation < -6) trendDirection = 'decreasing';

    if (def.key === 'restingBreathingRate' && mean7d > 30) {
      return {
        metricKey: def.key,
        metricLabel: def.label,
        sampleCount,
        hasSufficientBaseline: true,
        mean7d: round1(mean7d),
        mean30d: round1(mean30d),
        percentDeviation,
        status: 'critical',
        trendDirection,
        interpretation: `Resting breathing rate averaged ${round1(mean7d)} breaths/min this week (>30 breaths/min threshold). Recount while asleep and contact your vet.`,
        dateRangeLabel,
      };
    }

    const isWorsening = def.higherIsBetter ? percentDeviation < 0 : percentDeviation > 0;
    const absDeviation = Math.abs(percentDeviation);

    let status: 'normal' | 'watch' | 'discuss_vet' = 'normal';
    let interpretation = `Stable with 30-day baseline (${mean30d.toFixed(1)}).`;

    if (absDeviation >= 25 && isWorsening) {
      status = 'discuss_vet';
      const directionWord = percentDeviation > 0 ? 'up' : 'down';
      interpretation = `${def.label} is ${directionWord} ${absDeviation}% compared to the 30-day baseline. Note this for your next veterinary visit.`;
    } else if (absDeviation >= 12 && isWorsening) {
      status = 'watch';
      const directionWord = percentDeviation > 0 ? 'up' : 'down';
      interpretation = `Slight change: ${directionWord} ${absDeviation}% from 30-day baseline. Keep observing.`;
    } else if (absDeviation >= 15 && !isWorsening) {
      status = 'normal';
      interpretation = `Positive trend: improved ${absDeviation}% relative to baseline.`;
    }

    return {
      metricKey: def.key,
      metricLabel: def.label,
      sampleCount,
      hasSufficientBaseline: true,
      mean7d: round1(mean7d),
      mean30d: round1(mean30d),
      percentDeviation,
      status,
      trendDirection,
      interpretation,
      dateRangeLabel,
    };
  });
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((acc, v) => acc + v, 0) / arr.length;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}
