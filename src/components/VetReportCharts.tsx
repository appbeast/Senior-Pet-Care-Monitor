import React from 'react';
import {
  PetRecord,
  DailyCheckIn,
  CognitiveAssessmentLog,
  QoLAssessmentLog,
} from '../types';

interface VetReportChartsProps {
  pet: PetRecord;
  checkIns: DailyCheckIn[];
  cognitiveLogs: CognitiveAssessmentLog[];
  qolLogs: QoLAssessmentLog[];
}

function shortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}/${parts[2]}`;
}

export const VetReportCharts: React.FC<VetReportChartsProps> = ({
  pet,
  checkIns,
  cognitiveLogs,
  qolLogs,
}) => {
  const sortedCheckIns = [...checkIns]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-30);

  const sortedWeights = [...pet.weightHistory].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const sortedCog = [...cognitiveLogs]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-8);

  const sortedQol = [...qolLogs]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-8);

  const respSamples = [...checkIns]
    .filter((c) => typeof c.restingBreathingRate === 'number' && !isNaN(c.restingBreathingRate))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-15);

  // Chart 1 geometry (30-Day Daily Check-In Trends)
  const w1 = 680;
  const h1 = 210;
  const pL = 36;
  const pR = 16;
  const pT = 18;
  const pB = 28;
  const plotW1 = w1 - pL - pR;
  const plotH1 = h1 - pT - pB;

  const metricSeries = [
    { key: 'mobilityStiffness' as const, label: 'Mobility', color: '#B45309', strokeWidth: 2.6 },
    { key: 'comfortPain' as const, label: 'Comfort', color: '#047857', strokeWidth: 2 },
    { key: 'appetite' as const, label: 'Appetite', color: '#1D4ED8', strokeWidth: 2 },
    { key: 'energyActivity' as const, label: 'Energy', color: '#6D28D9', strokeWidth: 1.75 },
    { key: 'waterIntake' as const, label: 'Water Intake', color: '#0E7490', strokeWidth: 1.75 },
  ];

  // Chart 2: 30-day Good vs Harder Days Strip
  const now = Date.now();
  const dayMs = 86400000;
  const days30 = Array.from({ length: 30 }).map((_, idx) => {
    const d = new Date(now - (29 - idx) * dayMs);
    const dateStr = d.toISOString().split('T')[0];
    const ci = checkIns.find((c) => c.date === dateStr);
    return { date: dateStr, day: d.getDate(), isGood: ci ? ci.isGoodDay : null };
  });
  const goodDaysCount = days30.filter((d) => d.isGood === true).length;
  const hardDaysCount = days30.filter((d) => d.isGood === false).length;

  // Weight geometry
  const wVals = sortedWeights.map((w) => w.weightKg);
  const minW = wVals.length ? Math.floor(Math.min(...wVals) - 1) : 0;
  const maxW = wVals.length ? Math.ceil(Math.max(...wVals) + 1) : 10;
  const rangeW = Math.max(2, maxW - minW);

  // Resp geometry
  const respVals = respSamples.map((s) => s.restingBreathingRate!);
  const respMax = respVals.length ? Math.max(36, Math.ceil(Math.max(...respVals) + 4)) : 40;
  const respMin = 10;
  const respRange = respMax - respMin;

  return (
    <div className="space-y-4">
      {/* Chart 1: 30-Day Aggregated Well-Being Trends */}
      <div className="p-4 rounded-2xl border border-slate-300 bg-white break-inside-avoid">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              30-Day Daily Check-In Trends (Scale 1–5)
            </h4>
            <p className="text-[11px] text-slate-500">
              Aggregated daily ratings across mobility, comfort, appetite, energy, and water intake
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-700">
            {metricSeries.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5 font-medium">
                <span
                  className="w-3 h-1 rounded-full inline-block"
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.label}</span>
              </span>
            ))}
          </div>
        </div>

        {sortedCheckIns.length < 2 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Insufficient check-in history to chart 30-day trend (minimum 2 check-ins required).
          </div>
        ) : (
          <svg viewBox={`0 0 ${w1} ${h1}`} className="w-full h-auto overflow-visible">
            {/* Horizontal grid lines 1..5 */}
            {[1, 2, 3, 4, 5].map((val) => {
              const y = pT + plotH1 - ((val - 1) / 4) * plotH1;
              return (
                <g key={val}>
                  <line
                    x1={pL}
                    y1={y}
                    x2={pL + plotW1}
                    y2={y}
                    stroke={val === 3 ? '#CBD5E1' : '#E2E8F0'}
                    strokeWidth={val === 3 ? 1.2 : 0.8}
                  />
                  <text
                    x={pL - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X-axis date ticks */}
            {sortedCheckIns.map((c, idx) => {
              const step = Math.max(1, Math.floor(sortedCheckIns.length / 6));
              if (idx % step !== 0 && idx !== sortedCheckIns.length - 1) return null;
              const x = pL + (idx / (sortedCheckIns.length - 1)) * plotW1;
              return (
                <text
                  key={c.id}
                  x={x}
                  y={h1 - 6}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {shortDate(c.date)}
                </text>
              );
            })}

            {/* Data series lines */}
            {metricSeries.map((s) => {
              const points = sortedCheckIns
                .map((c, idx) => {
                  const val = Math.max(1, Math.min(5, c[s.key]));
                  const x = pL + (idx / (sortedCheckIns.length - 1)) * plotW1;
                  const y = pT + plotH1 - ((val - 1) / 4) * plotH1;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');

              const last = sortedCheckIns[sortedCheckIns.length - 1];
              const lastVal = Math.max(1, Math.min(5, last[s.key]));
              const lastX = pL + plotW1;
              const lastY = pT + plotH1 - ((lastVal - 1) / 4) * plotH1;

              return (
                <g key={s.key}>
                  <polyline
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                  <circle cx={lastX} cy={lastY} r={3.2} fill={s.color} />
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Chart 2 & 3 Row: Good vs Hard Days + Weight History */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 break-inside-avoid">
        {/* Good Days vs Harder Days Strip */}
        <div className="p-4 rounded-2xl border border-slate-300 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              30-Day Good vs. Harder Days
            </h4>
            <span className="text-[11px] font-mono font-semibold text-slate-700 tabular-nums">
              {goodDaysCount} Good · {hardDaysCount} Hard
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1.5">
            {days30.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.isGood === true ? 'Good Day' : d.isGood === false ? 'Harder Day' : 'Unlogged'}`}
                className={`h-7 rounded-md flex items-center justify-center text-[10px] font-mono border ${
                  d.isGood === true
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                    : d.isGood === false
                    ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[10px] text-slate-600 pt-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 border border-emerald-500 inline-block" />
              <span>Good Day</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-200 border border-amber-500 inline-block" />
              <span>Harder Day</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-300 inline-block" />
              <span>Unlogged</span>
            </span>
          </div>
        </div>

        {/* Weight Trajectory Chart */}
        <div className="p-4 rounded-2xl border border-slate-300 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Weight Trajectory (kg)
            </h4>
            <span className="text-[11px] font-mono font-semibold text-slate-700 tabular-nums">
              Current: {pet.currentWeightKg} kg
            </span>
          </div>

          {sortedWeights.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No weigh-ins recorded.</p>
          ) : (
            <svg viewBox="0 0 320 135" className="w-full h-auto overflow-visible">
              {[0, 0.5, 1].map((frac) => {
                const val = minW + frac * rangeW;
                const y = 105 - frac * 80;
                return (
                  <g key={frac}>
                    <line x1={38} y1={y} x2={300} y2={y} stroke="#E2E8F0" strokeWidth={0.8} />
                    <text x={32} y={y + 3} textAnchor="end" className="fill-slate-500 text-[9px] font-mono">
                      {val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {sortedWeights.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth={2.2}
                  points={sortedWeights
                    .map((w, idx) => {
                      const x = 52 + (idx / (sortedWeights.length - 1)) * 234;
                      const y = 105 - ((w.weightKg - minW) / rangeW) * 80;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                />
              )}

              {sortedWeights.map((w, idx) => {
                const x =
                  sortedWeights.length === 1
                    ? 169
                    : 52 + (idx / (sortedWeights.length - 1)) * 234;
                const y = 105 - ((w.weightKg - minW) / rangeW) * 80;
                return (
                  <g key={w.id}>
                    <circle cx={x} cy={y} r={4} fill="#D97706" />
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      className="fill-slate-900 text-[9px] font-bold font-mono"
                    >
                      {w.weightKg}kg
                    </text>
                    <text
                      x={x}
                      y={124}
                      textAnchor="middle"
                      className="fill-slate-500 text-[9px] font-mono"
                    >
                      {shortDate(w.date)}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Chart 4 & 5 Row: Quality of Life & Cognitive Progression */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 break-inside-avoid">
        {/* Quality of Life Trend */}
        <div className="p-4 rounded-2xl border border-slate-300 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quality of Life Index (/70)
            </h4>
            <span className="text-[11px] font-mono text-slate-600">
              {sortedQol.length} {sortedQol.length === 1 ? 'audit' : 'audits'}
            </span>
          </div>

          {sortedQol.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No QoL audits logged yet.</p>
          ) : (
            <svg viewBox="0 0 320 135" className="w-full h-auto">
              {[0, 35, 70].map((val) => {
                const y = 108 - (val / 70) * 84;
                return (
                  <g key={val}>
                    <line x1={32} y1={y} x2={305} y2={y} stroke="#E2E8F0" strokeWidth={0.8} />
                    <text x={27} y={y + 3} textAnchor="end" className="fill-slate-500 text-[9px] font-mono">
                      {val}
                    </text>
                  </g>
                );
              })}

              {sortedQol.map((q, idx) => {
                const barW = Math.min(28, 220 / Math.max(sortedQol.length * 1.6, 1));
                const cx =
                  sortedQol.length === 1
                    ? 168
                    : 58 + (idx / (sortedQol.length - 1)) * 220;
                const barH = (q.totalScore / 70) * 84;
                const y = 108 - barH;
                return (
                  <g key={q.id}>
                    <rect
                      x={cx - barW / 2}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={3}
                      fill="#047857"
                    />
                    <text
                      x={cx}
                      y={y - 5}
                      textAnchor="middle"
                      className="fill-slate-900 text-[9px] font-bold font-mono"
                    >
                      {q.totalScore}
                    </text>
                    <text
                      x={cx}
                      y={124}
                      textAnchor="middle"
                      className="fill-slate-500 text-[9px] font-mono"
                    >
                      {shortDate(q.date)}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Cognitive Progression */}
        <div className="p-4 rounded-2xl border border-slate-300 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cognitive Screen Score ({pet.species_pathway === 'cat' || pet.species === 'feline' ? 'VISHDAAL' : 'DISHAA'} / 100)
            </h4>
            <span className="text-[11px] font-mono text-slate-600">
              {sortedCog.length} {sortedCog.length === 1 ? 'screen' : 'screens'}
            </span>
          </div>

          {sortedCog.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No cognitive screens logged yet.</p>
          ) : (
            <svg viewBox="0 0 320 135" className="w-full h-auto">
              {[0, 50, 100].map((val) => {
                const y = 108 - (val / 100) * 84;
                return (
                  <g key={val}>
                    <line x1={32} y1={y} x2={305} y2={y} stroke="#E2E8F0" strokeWidth={0.8} />
                    <text x={27} y={y + 3} textAnchor="end" className="fill-slate-500 text-[9px] font-mono">
                      {val}
                    </text>
                  </g>
                );
              })}

              {sortedCog.map((c, idx) => {
                const barW = Math.min(34, 210 / Math.max(sortedCog.length * 1.8, 1));
                const cx =
                  sortedCog.length === 1
                    ? 168
                    : 85 + (idx / (sortedCog.length - 1)) * 165;
                const barH = (c.totalScore / 100) * 84;
                const y = 108 - barH;
                return (
                  <g key={c.id}>
                    <rect
                      x={cx - barW / 2}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={3}
                      fill={c.totalScore >= 40 ? '#B45309' : '#D97706'}
                    />
                    <text
                      x={cx}
                      y={y - 5}
                      textAnchor="middle"
                      className="fill-slate-900 text-[9px] font-bold font-mono"
                    >
                      {c.totalScore}
                    </text>
                    <text
                      x={cx}
                      y={124}
                      textAnchor="middle"
                      className="fill-slate-500 text-[9px] font-mono"
                    >
                      {shortDate(c.date)}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Chart 6: Sleeping Respiratory Rate (Conditional when samples exist) */}
      {respSamples.length > 0 && (
        <div className="p-4 rounded-2xl border border-slate-300 bg-white space-y-2 break-inside-avoid">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sleeping Respiratory Rate Trend (breaths/min)
            </h4>
            <span className="text-[11px] font-mono text-red-700 font-semibold">
              Alert Threshold: &gt; 30 br/min
            </span>
          </div>

          <svg viewBox="0 0 680 140" className="w-full h-auto overflow-visible">
            {[respMin, 20, 30, respMax].map((v) => {
              const y = 110 - ((v - respMin) / respRange) * 86;
              const isThresh = v === 30;
              return (
                <g key={v}>
                  <line
                    x1={38}
                    y1={y}
                    x2={660}
                    y2={y}
                    stroke={isThresh ? '#DC2626' : '#E2E8F0'}
                    strokeWidth={isThresh ? 1.5 : 0.8}
                    strokeDasharray={isThresh ? '5 3' : undefined}
                  />
                  <text
                    x={32}
                    y={y + 3}
                    textAnchor="end"
                    className={`text-[9px] font-mono ${isThresh ? 'fill-red-700 font-bold' : 'fill-slate-500'}`}
                  >
                    {v}
                  </text>
                </g>
              );
            })}

            {respSamples.length > 1 && (
              <polyline
                fill="none"
                stroke="#0F172A"
                strokeWidth={2}
                points={respSamples
                  .map((s, idx) => {
                    const x = 56 + (idx / (respSamples.length - 1)) * 586;
                    const y = 110 - ((s.restingBreathingRate! - respMin) / respRange) * 86;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ')}
              />
            )}

            {respSamples.map((s, idx) => {
              const x =
                respSamples.length === 1
                  ? 349
                  : 56 + (idx / (respSamples.length - 1)) * 586;
              const rate = s.restingBreathingRate!;
              const y = 110 - ((rate - respMin) / respRange) * 86;
              return (
                <g key={s.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill={rate > 30 ? '#DC2626' : '#047857'}
                  />
                  <text
                    x={x}
                    y={y - 7}
                    textAnchor="middle"
                    className="fill-slate-900 text-[9px] font-bold font-mono"
                  >
                    {rate}
                  </text>
                  <text
                    x={x}
                    y={128}
                    textAnchor="middle"
                    className="fill-slate-500 text-[9px] font-mono"
                  >
                    {shortDate(s.date)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
