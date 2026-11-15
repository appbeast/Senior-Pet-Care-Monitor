import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Heart, AlertCircle, Clock } from 'lucide-react';
import { DailyCheckIn, PetRecord } from '../types';
import { calculateBaselines } from '../services/baselineEngine';
import { resolveSpeciesPathway } from '../services/speciesPathway';

interface BaselineTrendsViewProps {
  pet: PetRecord;
  checkIns: DailyCheckIn[];
  onRecordBreathingRate: (rate: number) => Promise<void>;
}

export const BaselineTrendsView: React.FC<BaselineTrendsViewProps> = ({
  pet,
  checkIns,
  onRecordBreathingRate,
}) => {
  const pathway = resolveSpeciesPathway(pet);
  const baselines = calculateBaselines(checkIns, pathway);

  // Respiratory Counter Tool
  const [isCounting, setIsCounting] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [measuredRate, setMeasuredRate] = useState<number | null>(null);

  useEffect(() => {
    let interval: number | null = null;
    if (isCounting && secondsRemaining > 0) {
      interval = window.setInterval(() => {
        setSecondsRemaining((s) => s - 1);
      }, 1000);
    } else if (isCounting && secondsRemaining === 0) {
      setIsCounting(false);
      // Measured over 30s -> multiply by 2 for breaths/minute
      const bpm = breathCount * 2;
      setMeasuredRate(bpm);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCounting, secondsRemaining, breathCount]);

  const startBreathingCounter = () => {
    setIsCounting(true);
    setBreathCount(0);
    setSecondsRemaining(30);
    setMeasuredRate(null);
  };

  const handleChestRiseTap = () => {
    if (isCounting) {
      setBreathCount((c) => c + 1);
    }
  };

  const handleSaveMeasuredRate = async () => {
    if (measuredRate !== null) {
      await onRecordBreathingRate(measuredRate);
      setMeasuredRate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F5F2EB] border border-[#E5E0D4] space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Baseline Relative Engine</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-600 font-medium">Rolling 7-Day vs 30-Day</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">What Changed From Baseline</h2>
        <p className="text-sm sm:text-xs text-slate-600 leading-relaxed">
          Isolated numbers cause anxiety. This view compares the last 7 days against {pet.name}'s established 30-day normal to surface genuine shifts rather than day-to-day noise.
        </p>
      </div>

      {/* Metrics Baseline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {baselines.map((metric) => (
          <div
            key={metric.metricKey}
            className="p-4 rounded-2xl bg-white border border-[#E5E0D4] shadow-2xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{metric.metricLabel}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {metric.hasSufficientBaseline ? (
                    <span>30-Day Mean: <strong className="text-slate-700">{metric.mean30d}</strong></span>
                  ) : (
                    <span>Samples: {metric.sampleCount} / 5</span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              {metric.hasSufficientBaseline ? (
                <div className="text-right">
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
                      metric.status === 'critical'
                        ? 'bg-red-100 text-red-900'
                        : metric.status === 'discuss_vet'
                        ? 'bg-amber-100 text-amber-900'
                        : metric.status === 'watch'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {metric.trendDirection === 'increasing' ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : metric.trendDirection === 'decreasing' ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {metric.percentDeviation > 0 ? `+${metric.percentDeviation}%` : `${metric.percentDeviation}%`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {metric.status === 'critical'
                      ? 'Contact Vet'
                      : metric.status === 'discuss_vet'
                      ? 'Discuss at Visit'
                      : metric.status === 'watch'
                      ? 'Watch Metric'
                      : 'Stable'}
                  </div>
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  Learning Normal
                </span>
              )}
            </div>

            {/* 7d vs 30d Visual Scale */}
            {metric.hasSufficientBaseline ? (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                  <span>7-Day: <strong>{metric.mean7d}</strong></span>
                  <span>30-Day: <strong>{metric.mean30d}</strong></span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F5F2EB] overflow-hidden flex">
                  <div
                    className={`h-full transition-all ${
                      metric.status === 'discuss_vet' || metric.status === 'critical'
                        ? 'bg-amber-600'
                        : 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.min(100, (metric.mean7d / 5) * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}

            <p className="text-xs text-slate-600 leading-snug pt-1">
              {metric.interpretation}
            </p>
          </div>
        ))}
      </div>

      {/* Sleeping Respiratory Rate Counter Tool (Cardiology / Congestive Heart Failure Shield) */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5E0D4] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sleeping Respiratory Rate Counter</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Measure while {pet.name} is deeply asleep. Normal senior rate is &lt; 30 breaths/min.
              </p>
            </div>
          </div>
        </div>

        {!isCounting && measuredRate === null && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F5F2EB]">
            <span className="text-xs text-slate-700">
              Wait until your pet is asleep, tap start, and tap the button each time the chest rises.
            </span>
            <button
              onClick={startBreathingCounter}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shrink-0 min-h-[44px]"
            >
              Start 30-Second Timer
            </button>
          </div>
        )}

        {isCounting && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-900">
              <Clock className="w-4 h-4" />
              <span>Time Remaining: {secondsRemaining}s</span>
            </div>

            <button
              onClick={handleChestRiseTap}
              className="w-full py-6 rounded-2xl bg-amber-800 hover:bg-amber-900 active:scale-[0.98] text-white font-bold text-lg shadow-md transition-all min-h-[72px]"
            >
              Tap on Chest Rise ({breathCount} counted)
            </button>

            <p className="text-[11px] text-amber-800">
              Tap once for each full breath in and out.
            </p>
          </div>
        )}

        {measuredRate !== null && (
          <div className="p-4 rounded-2xl bg-[#F5F2EB] border border-[#E5E0D4] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Calculated Sleeping Breathing Rate</span>
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                  {measuredRate} <span className="text-sm font-normal text-slate-600">breaths / minute</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                measuredRate > 30 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {measuredRate > 30 ? 'Elevated (>30 bpm)' : 'Normal (<30 bpm)'}
              </span>
            </div>

            {measuredRate > 30 && (
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                Breathing rate is above the 30 breaths/min threshold. Recount in 30 minutes while asleep. If it stays above 30, note it for your veterinary team.
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={startBreathingCounter}
                className="flex-1 py-2 rounded-xl border border-[#D5D0C4] text-xs font-semibold text-slate-700 min-h-[44px]"
              >
                Recount
              </button>
              <button
                onClick={handleSaveMeasuredRate}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold min-h-[44px]"
              >
                Save to Today’s Record
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Weight History Card */}
      <div className="p-5 rounded-3xl bg-white border border-[#E5E0D4] space-y-3">
        <h3 className="text-base font-bold text-slate-900">Weight Trend</h3>
        <div className="space-y-2">
          {pet.weightHistory.map((w) => (
            <div key={w.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#F5F2EB] last:border-0">
              <span className="text-slate-600">{w.date}</span>
              <span className="font-mono font-bold text-slate-900">{w.weightKg} kg ({Math.round(w.weightKg * 2.20462)} lbs)</span>
              <span className="text-slate-500 italic">{w.notes || 'Recorded weigh-in'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
