import React, { useState } from 'react';
import {
  Brain,
  Calendar,
  AlertCircle,
  Plus,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  CognitiveAnswerValue,
  CognitiveAssessmentLog,
  PetRecord,
} from '../types';
import {
  calculateCognitiveScreenResult,
  FREQUENCY_SCALE_OPTIONS,
  frequencyLabel,
  getCognitiveQuestionsForSpecies,
  getInstrumentForSpecies,
} from '../services/assessmentQuestions';
import {
  addMonthsIso,
  analyzeCognitiveTrends,
  COGNITIVE_AGE_TRIGGER_CONFIG,
  evaluateCognitiveSchedule,
} from '../services/cognitiveScheduler';
import { resolveSpeciesPathway } from '../services/speciesPathway';
import { PROVISIONAL_CLINICAL_REVIEW } from '../data/clinicalGovernance';

interface CognitiveScreeningViewProps {
  pet: PetRecord;
  cognitiveLogs: CognitiveAssessmentLog[];
  currentUserName: string;
  onSaveAssessment: (log: CognitiveAssessmentLog) => Promise<void>;
  onUpdatePetAge: (ageYears: number, isEstimated: boolean) => Promise<void>;
  onOpenVetExport: () => void;
}

const DIMENSION_COLORS = [
  '#B45309', // amber-700
  '#047857', // emerald-700
  '#1D4ED8', // blue-700
  '#7C3AED', // violet-600
  '#BE123C', // rose-700
  '#0F766E', // teal-700
  '#334155', // slate-700
];

export const CognitiveScreeningView: React.FC<CognitiveScreeningViewProps> = ({
  pet,
  cognitiveLogs,
  currentUserName,
  onSaveAssessment,
  onUpdatePetAge,
  onOpenVetExport,
}) => {
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [modalTriggerType, setModalTriggerType] = useState<'scheduled' | 'manual'>('manual');
  const [estimatedAgeInput, setEstimatedAgeInput] = useState<string>(
    pet.ageYears > 0 ? String(pet.ageYears) : ''
  );
  const [isSavingAge, setIsSavingAge] = useState(false);

  const pathway = resolveSpeciesPathway(pet);
  const instrument = getInstrumentForSpecies(pathway);
  const questions = getCognitiveQuestionsForSpecies(pathway);
  const schedule = evaluateCognitiveSchedule(pet, cognitiveLogs);
  const trendAnalysis = analyzeCognitiveTrends(pathway, cognitiveLogs);

  const sortedDesc = [...cognitiveLogs].sort((a, b) => b.timestamp - a.timestamp);
  const chronological = [...cognitiveLogs].sort((a, b) => a.timestamp - b.timestamp);
  const latestLog = sortedDesc[0];

  const handleOpenScreen = (trigger: 'scheduled' | 'manual') => {
    setModalTriggerType(trigger);
    setShowSurveyModal(true);
  };

  const handleSaveEstimatedAge = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(estimatedAgeInput);
    if (isNaN(parsed) || parsed <= 0 || parsed > 30) return;
    setIsSavingAge(true);
    try {
      await onUpdatePetAge(Math.round(parsed * 10) / 10, true);
    } finally {
      setIsSavingAge(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Automatic Age-Triggered Screening Card */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#F5F2EB] border border-[#E5E0D4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Scheduled {instrument} Screening
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-600 font-medium">
                Starts Age {schedule.startAgeYears}+ · Every {COGNITIVE_AGE_TRIGGER_CONFIG.recurrenceMonths} Months
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {pathway === 'cat'
                ? 'Feline Cognitive Health Check (VISHDAAL)'
                : 'Canine Cognitive Health Check (DISHAA)'}
            </h2>
            <p className="text-sm sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
              {pathway === 'cat'
                ? 'Tracks seven feline cognitive dimensions (Vocalisation, Interactions, Sleep-Wake, House Soiling, Activity, Anxiety, Learning & Memory). Automatically scheduled every 6 months from age 10.'
                : 'Aligned with 2025 JAVMA canine cognitive guidance: automatic screening begins at age 7 and repeats every 6 months across all seven DISHAA dimensions.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenScreen(schedule.isDueNow ? 'scheduled' : 'manual')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-xs font-bold transition-colors shrink-0 min-h-[48px] sm:min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{schedule.isDueNow ? `Start Scheduled ${instrument} Check` : `Run ${instrument} Screen Anytime`}</span>
          </button>
        </div>

        {/* Schedule Status Banner */}
        <div
          className={`p-4 rounded-2xl border flex flex-col gap-3 ${
            schedule.isDueNow
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-[#E5E0D4]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              {schedule.isDueNow ? (
                <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-bold text-slate-900">{schedule.headlineMessage}</div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{schedule.subMessage}</p>
              </div>
            </div>

            {latestLog && (
              <button
                type="button"
                onClick={onOpenVetExport}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 underline shrink-0 min-h-[40px]"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Include in Pre-Visit Brief</span>
              </button>
            )}
          </div>

          {/* Unknown Age Prompt */}
          {schedule.status === 'needs_age_estimate' && (
            <form
              onSubmit={handleSaveEstimatedAge}
              className="pt-2 border-t border-[#E5E0D4] flex flex-wrap items-center gap-2"
            >
              <label className="text-xs font-semibold text-slate-800">
                Estimate {pet.name}'s age (years):
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="30"
                required
                value={estimatedAgeInput}
                onChange={(e) => setEstimatedAgeInput(e.target.value)}
                placeholder={pathway === 'cat' ? 'e.g. 12' : 'e.g. 9'}
                className="w-24 px-3 py-1.5 rounded-xl border border-[#D5D0C4] bg-[#FDFBF7] text-xs font-semibold text-slate-900"
              />
              <button
                type="submit"
                disabled={isSavingAge}
                className="px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold min-h-[38px]"
              >
                {isSavingAge ? 'Saving...' : 'Save Estimate & Set Reminder'}
              </button>
            </form>
          )}
        </div>

        {/* Clinical Review Governance Notice */}
        <div className="px-3.5 py-2.5 rounded-xl bg-white/80 border border-[#E5E0D4] flex items-center gap-2 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
          <span>
            <strong className="text-slate-800">{PROVISIONAL_CLINICAL_REVIEW.review_notice}</strong>{' '}
            Provisional tag: {PROVISIONAL_CLINICAL_REVIEW.reviewer_name} ({PROVISIONAL_CLINICAL_REVIEW.review_date}). Reports frequency patterns only — never a stage or diagnosis.
          </span>
        </div>
      </div>

      {/* Plain-Language "Which Dimensions Are Worsening" Summary */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Which Dimensions Are Changing
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">{trendAnalysis.reliabilityNotice}</p>
          </div>
          {latestLog && (
            <span className="text-xs font-mono font-semibold text-slate-700 bg-[#F5F2EB] px-3 py-1.5 rounded-xl border border-[#E5E0D4] self-start">
              Latest: {latestLog.date} · {latestLog.answeredDimensionCount}/7 rated
            </span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4] space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Plain-Language Pattern Summary
          </div>
          <p className="text-sm font-medium text-slate-900 leading-relaxed">
            {trendAnalysis.overallPlainSummary}
          </p>
          {trendAnalysis.worseningDimensionsSummary.length > 0 && (
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pt-1">
              {trendAnalysis.worseningDimensionsSummary.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Per-Dimension Trend Chart (Plots across completed screens starting at >=2; notice until >=3) */}
        {trendAnalysis.canPlotTrend ? (
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Per-Dimension Frequency Chart ({instrument})
              </div>
              {!trendAnalysis.hasReliableTrend && (
                <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  More screens needed for a reliable trend
                </span>
              )}
            </div>

            <PerDimensionTrendSvg
              chronologicalLogs={chronological}
              questions={questions}
            />

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-[11px] text-slate-700">
              {questions.map((q, idx) => (
                <span key={q.dimensionKey} className="inline-flex items-center gap-1.5 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: DIMENSION_COLORS[idx % DIMENSION_COLORS.length] }}
                  />
                  <span>{q.dimensionLabel}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-dashed border-[#D5D0C4] text-xs text-slate-600">
            Complete at least 2 {instrument} screens to plot per-dimension trends across time (3+ screens recommended for a reliable trend).
          </div>
        )}

        {/* Per-Dimension Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {trendAnalysis.dimensionTrends.map((dim, idx) => (
            <div
              key={dim.dimensionKey}
              className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4] flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DIMENSION_COLORS[idx % DIMENSION_COLORS.length] }}
                  />
                  <span className="text-xs font-bold text-slate-900">{dim.dimensionLabel}</span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">{dim.plainLanguageSentence}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold capitalize px-2 py-1 rounded-lg bg-white border border-[#E5E0D4]">
                {dim.direction === 'worsening' && (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-800" />
                    <span className="text-amber-900">{dim.latestLabel}</span>
                  </>
                )}
                {dim.direction === 'improving' && (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-800">{dim.latestLabel}</span>
                  </>
                )}
                {dim.direction === 'stable' && (
                  <>
                    <Minus className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-700">{dim.latestLabel}</span>
                  </>
                )}
                {dim.direction === 'not_sure' && (
                  <span className="text-slate-500">Not sure</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Screen List */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D4] space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-amber-800" />
          <h3 className="text-base font-bold text-slate-900">
            Completed {instrument} Screens ({sortedDesc.length})
          </h3>
        </div>

        {sortedDesc.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No screens recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedDesc.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-slate-900">{log.date}</span>
                    <span className="text-slate-400">·</span>
                    <span className="capitalize text-slate-600">{log.triggered_by} check</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">by {log.loggedByName}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    {log.instrument} · {log.answeredDimensionCount}/7 rated
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{log.frequencySummary}</p>

                {log.newlyEmergedSigns && log.newlyEmergedSigns.length > 0 && (
                  <div className="text-xs space-y-1 pt-1">
                    <span className="font-semibold text-slate-700">Observed Notes:</span>
                    <ul className="list-disc list-inside text-slate-600 pl-1 space-y-0.5">
                      {log.newlyEmergedSigns.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {log.notes && (
                  <p className="text-xs text-slate-500 italic pt-1 border-t border-[#F5F2EB]">
                    Caregiver note: {log.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guided Assessment Modal */}
      {showSurveyModal && (
        <GuidedCognitiveModal
          pet={pet}
          triggeredBy={modalTriggerType}
          currentUserName={currentUserName}
          onSave={async (log) => {
            await onSaveAssessment(log);
            setShowSurveyModal(false);
          }}
          onClose={() => setShowSurveyModal(false)}
        />
      )}
    </div>
  );
};

const PerDimensionTrendSvg: React.FC<{
  chronologicalLogs: CognitiveAssessmentLog[];
  questions: ReturnType<typeof getCognitiveQuestionsForSpecies>;
}> = ({ chronologicalLogs, questions }) => {
  const logs = chronologicalLogs.slice(-8);
  const w = 640;
  const h = 190;
  const pL = 62;
  const pR = 20;
  const pT = 16;
  const pB = 28;
  const plotW = w - pL - pR;
  const plotH = h - pT - pB;

  const yLabels = [
    { val: 0, label: 'Never' },
    { val: 1, label: 'Rarely' },
    { val: 2, label: 'Sometimes' },
    { val: 3, label: 'Often' },
    { val: 4, label: 'Always' },
  ];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto overflow-visible">
      {yLabels.map((yl) => {
        const y = pT + plotH - (yl.val / 4) * plotH;
        return (
          <g key={yl.val}>
            <line x1={pL} y1={y} x2={pL + plotW} y2={y} stroke="#E2E8F0" strokeWidth={1} />
            <text
              x={pL - 8}
              y={y + 3.5}
              textAnchor="end"
              className="fill-slate-500 text-[10px] font-sans"
            >
              {yl.label}
            </text>
          </g>
        );
      })}

      {logs.map((log, idx) => {
        const x = logs.length === 1 ? pL + plotW / 2 : pL + (idx / (logs.length - 1)) * plotW;
        return (
          <text
            key={log.id}
            x={x}
            y={h - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[10px] font-mono"
          >
            {log.date.slice(5)}
          </text>
        );
      })}

      {questions.map((q, qIdx) => {
        const color = DIMENSION_COLORS[qIdx % DIMENSION_COLORS.length];
        // Slight vertical jitter (+- 1.2px) so overlapping lines stay legible
        const jitter = ((qIdx % 3) - 1) * 1.4;
        const pts: { x: number; y: number }[] = [];

        logs.forEach((log, idx) => {
          const score = log.per_dimension_scores?.[q.dimensionKey];
          if (score === null || score === undefined) return; // Not sure excluded cleanly
          const x = logs.length === 1 ? pL + plotW / 2 : pL + (idx / (logs.length - 1)) * plotW;
          const y = pT + plotH - (score / 4) * plotH + jitter;
          pts.push({ x, y });
        });

        if (pts.length === 0) return null;

        return (
          <g key={q.dimensionKey}>
            {pts.length >= 2 && (
              <polyline
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
              />
            )}
            {pts.map((p, pIdx) => (
              <circle key={pIdx} cx={p.x} cy={p.y} r={3.2} fill={color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

const GuidedCognitiveModal: React.FC<{
  pet: PetRecord;
  triggeredBy: 'scheduled' | 'manual';
  currentUserName: string;
  onSave: (log: CognitiveAssessmentLog) => Promise<void>;
  onClose: () => void;
}> = ({ pet, triggeredBy, currentUserName, onSave, onClose }) => {
  const pathway = resolveSpeciesPathway(pet);
  const questions = getCognitiveQuestionsForSpecies(pathway);
  const instrument = getInstrumentForSpecies(pathway);

  const [answers, setAnswers] = useState<Record<string, CognitiveAnswerValue>>({});
  const [emergingNote, setEmergingNote] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectOption = (dimensionKey: string, val: CognitiveAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [dimensionKey]: val }));
  };

  const isComplete = questions.every((q) => answers[q.dimensionKey] !== undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;

    setIsSubmitting(true);
    try {
      const result = calculateCognitiveScreenResult(pathway, answers);
      const nowDate = new Date();
      const completedAt = nowDate.toISOString();
      const nextDueAt = addMonthsIso(nowDate, COGNITIVE_AGE_TRIGGER_CONFIG.recurrenceMonths);
      const emergingList = emergingNote
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const log: CognitiveAssessmentLog = {
        id: `cog_${Date.now()}`,
        petId: pet.id,
        instrument: result.instrument,
        date: completedAt.split('T')[0],
        completed_at: completedAt,
        timestamp: nowDate.getTime(),
        triggered_by: triggeredBy,
        next_due_at: nextDueAt,
        per_dimension_scores: result.per_dimension_scores,
        not_sure_flags: result.not_sure_flags,
        totalScore: result.totalScore,
        answeredDimensionCount: result.answeredDimensionCount,
        frequencySummary: result.frequencySummary,
        newlyEmergedSigns: emergingList,
        notes: notes.trim() || undefined,
        loggedByName: currentUserName,
      };

      await onSave(log);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl border border-[#E5E0D4] shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 bg-[#FDFBF7]/95 backdrop-blur-xs px-5 py-4 border-b border-[#E5E0D4] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              {triggeredBy === 'scheduled' ? '6-Month Scheduled Check' : 'Manual Cognitive Check'} · {instrument}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {instrument} Check for {pet.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1">
          <div className="text-xs text-slate-700 leading-relaxed bg-[#F5F2EB] p-3.5 rounded-xl border border-[#E5E0D4] space-y-1">
            <p>
              Rate how often you noticed each pattern over the past 4 weeks. Choose <strong>"Not sure"</strong> if you haven't observed enough to tell — it is excluded rather than counted as zero.
            </p>
            <p className="text-[11px] text-amber-900 font-semibold">
              {PROVISIONAL_CLINICAL_REVIEW.review_notice}
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 uppercase tracking-wider">
                    {q.dimensionLabel}
                  </span>
                  <span className="text-slate-500">
                    {idx + 1} of {questions.length}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.question}</h4>
                <p className="text-xs text-slate-600 bg-[#FDFBF7] px-3 py-2 rounded-xl border border-[#EFECE3]">
                  {q.plainExample}
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                  {FREQUENCY_SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(q.dimensionKey, opt.value)}
                      className={`py-2.5 px-2 rounded-xl text-xs text-center border transition-all min-h-[44px] ${
                        answers[q.dimensionKey] === opt.value
                          ? 'border-slate-900 bg-slate-900 text-white font-bold'
                          : 'border-[#E5E0D4] bg-[#FDFBF7] text-slate-700 hover:bg-[#F5F2EB]'
                      }`}
                    >
                      {opt.shortLabel}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectOption(q.dimensionKey, 'not_sure')}
                    className={`py-2.5 px-2 rounded-xl text-xs text-center border transition-all min-h-[44px] ${
                      answers[q.dimensionKey] === 'not_sure'
                        ? 'border-amber-800 bg-amber-800 text-white font-bold'
                        : 'border-dashed border-[#D5D0C4] bg-white text-slate-600 hover:bg-[#F5F2EB]'
                    }`}
                  >
                    Not sure
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Specific Examples Noticed (One per line, optional)
            </label>
            <textarea
              rows={2}
              value={emergingNote}
              onChange={(e) => setEmergingNote(e.target.value)}
              placeholder={
                pathway === 'cat'
                  ? 'e.g. Loud yowling at 2am twice this week...'
                  : 'e.g. Stood behind bedroom door twice this month...'
              }
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Note for Your Vet (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Share dimension frequency shifts at next checkup"
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-xs text-slate-900"
            />
          </div>

          <div className="sticky bottom-0 bg-[#FDFBF7] pt-2 pb-safe">
            <button
              type="submit"
              disabled={!isComplete || isSubmitting}
              className={`w-full h-12 rounded-2xl font-bold text-sm shadow-md transition-all ${
                isComplete && !isSubmitting
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting
                ? 'Saving Screen...'
                : isComplete
                ? `Save ${instrument} Screen & Set Next 6-Month Reminder`
                : 'Select a frequency (or Not sure) for all 7 dimensions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
