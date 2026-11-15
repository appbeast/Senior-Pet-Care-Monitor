import React, { useState } from 'react';
import {
  X,
  Printer,
  Link2,
  Download,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import {
  PetRecord,
  DailyCheckIn,
  PetEvent,
  MedicationSchedule,
  DoseLog,
  CognitiveAssessmentLog,
  QoLAssessmentLog,
  WeeklyChangeBrief,
  CareCircleMember,
  EvaluatedCorrelationAlert,
  VetBriefRecord,
} from '../types';
import { calculateBaselines } from '../services/baselineEngine';
import {
  calculateMedicationAdherence,
  generateExpiringShareLink,
  downloadRawCsv,
} from '../services/exportService';
import { generateAndDownloadVetPdf } from '../services/pdfReportGenerator';
import { VetReportCharts } from './VetReportCharts';
import { resolveSpeciesPathway, getSpeciesPathwayCopy } from '../services/speciesPathway';
import { analyzeCognitiveTrends } from '../services/cognitiveScheduler';
import {
  computeQoLPatternSummary,
  comparePersistence30vs90,
  QOL_FREQUENCY_DISCLAIMER,
} from '../services/qolPatternService';
import { computePainAndAnxietySummary } from '../services/correlationEngine';

interface VetExportModalProps {
  pet: PetRecord;
  checkIns: DailyCheckIn[];
  events: PetEvent[];
  medications: MedicationSchedule[];
  doses: DoseLog[];
  cognitiveLogs: CognitiveAssessmentLog[];
  qolLogs: QoLAssessmentLog[];
  brief: WeeklyChangeBrief;
  correlations?: EvaluatedCorrelationAlert[];
  careCircle?: CareCircleMember[];
  onSaveVetBrief?: (record: VetBriefRecord) => Promise<void>;
  onClose: () => void;
}

export const VetExportModal: React.FC<VetExportModalProps> = ({
  pet,
  checkIns,
  events,
  medications,
  doses,
  cognitiveLogs,
  qolLogs,
  brief,
  correlations = [],
  careCircle,
  onSaveVetBrief,
  onClose,
}) => {
  // Default is strictly 1-Page Pre-Visit Vet Brief per Enhancement 4
  const [reportMode, setReportMode] = useState<'single_page' | 'extended'>('single_page');
  const [questions, setQuestions] = useState<[string, string, string]>([
    brief.vetQuestion || '',
    '',
    '',
  ]);
  const [showQuestionGatePrompt, setShowQuestionGatePrompt] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloadedName, setPdfDownloadedName] = useState<string | null>(null);
  const [shareLinkInfo] = useState(() => generateExpiringShareLink(pet.id));

  const pathway = resolveSpeciesPathway(pet);
  const copy = getSpeciesPathwayCopy(pathway);

  const adherence30d = calculateMedicationAdherence(doses, 30);
  const baselines = calculateBaselines(checkIns, pathway);

  const top3Changes = [...baselines]
    .filter((b) => b.hasSufficientBaseline)
    .sort((a, b) => Math.abs(b.percentDeviation) - Math.abs(a.percentDeviation))
    .slice(0, 3);

  const cogTrend = analyzeCognitiveTrends(pathway, cognitiveLogs);
  const last3Cog = [...cognitiveLogs].sort((a, b) => a.timestamp - b.timestamp).slice(-3);
  const painAnxiety = computePainAndAnxietySummary({ pet, checkIns, events, medications, doses });

  const summary30 = computeQoLPatternSummary(checkIns, 30);
  const summary90 = computeQoLPatternSummary(checkIns, 90);
  const persistenceNote = comparePersistence30vs90(summary30, summary90);

  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const sortedWeights = [...(pet.weightHistory || [])].sort((a, b) => a.date.localeCompare(b.date));
  const hasAtLeastOneQuestion = questions.some((q) => q.trim().length > 0);

  const updateQuestion = (index: 0 | 1 | 2, val: string) => {
    setQuestions((prev) => {
      const next: [string, string, string] = [...prev] as [string, string, string];
      next[index] = val;
      return next;
    });
    if (showQuestionGatePrompt) setShowQuestionGatePrompt(false);
  };

  const executePdfExport = async (skipQuestionsCheck = false) => {
    if (!skipQuestionsCheck && !hasAtLeastOneQuestion) {
      setShowQuestionGatePrompt(true);
      return;
    }

    setShowQuestionGatePrompt(false);
    setIsGeneratingPdf(true);
    try {
      const includeExtendedLog = reportMode === 'extended';
      const filename = await generateAndDownloadVetPdf({
        pet,
        checkIns,
        events,
        medications,
        doses,
        cognitiveLogs,
        qolLogs,
        brief,
        careCircle,
        ownerQuestions: questions,
        correlations,
        includeExtendedLog,
      });

      if (onSaveVetBrief) {
        const record: VetBriefRecord = {
          id: `vbrief_${Date.now()}`,
          pet_id: pet.id,
          generated_at: new Date().toISOString(),
          owner_questions: questions,
          included_sections: [
            '1_pet_snapshot',
            '2_top_3_changes',
            '3_cognitive_trend',
            '4_pain_anxiety_summary',
            '5_owner_reported_correlations',
            '6_owner_three_questions',
            '7_qol_good_bad_day_pattern',
          ],
          include_full_log_page_two: includeExtendedLog,
          share_link_token: shareLinkInfo.token,
          share_link_url: shareLinkInfo.url,
          share_link_expires_at: new Date(shareLinkInfo.expiresAt).toISOString(),
        };
        await onSaveVetBrief(record);
      }

      setPdfDownloadedName(filename);
      setTimeout(() => setPdfDownloadedName(null), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLinkInfo.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadCsv = () => {
    downloadRawCsv(pet, checkIns, events, doses);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print-modal-backdrop">
      <div className="w-full max-w-4xl max-h-[94vh] overflow-y-auto bg-white rounded-3xl border border-[#E5E0D4] shadow-2xl flex flex-col my-auto print-modal-sheet">
        {/* Modal Controls */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs px-4 sm:px-6 py-4 border-b border-[#E5E0D4] flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-800">
                Pre-Visit Consultation Agenda ({copy.speciesLabel})
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">Free Export · Always Available</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Pre-Visit Vet Brief for {pet.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => executePdfExport(false)}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all min-h-[40px] whitespace-nowrap shrink-0 shadow-sm disabled:opacity-60"
            >
              {pdfDownloadedName ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>PDF Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>
                    {isGeneratingPdf
                      ? 'Generating PDF...'
                      : reportMode === 'single_page'
                      ? 'Download 1-Page Brief PDF'
                      : 'Download 2-Page + Log PDF'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D5D0C4] hover:bg-[#F5F2EB] text-slate-800 text-xs font-semibold min-h-[40px]"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D5D0C4] hover:bg-[#F5F2EB] text-slate-700 text-xs font-semibold min-h-[40px]"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close export modal"
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher & Pre-Visit Question Prompt */}
        <div className="px-4 sm:px-6 pt-4 space-y-4 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-[#F5F2EB] rounded-xl border border-[#E5E0D4]">
              <button
                type="button"
                onClick={() => setReportMode('single_page')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  reportMode === 'single_page'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1-Page Pre-Visit Brief (Default)
              </button>
              <button
                type="button"
                onClick={() => setReportMode('extended')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  reportMode === 'extended'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2-Page Version (+ Full Event Log & Charts)
              </button>
            </div>

            {pdfDownloadedName && (
              <span className="text-xs font-medium text-emerald-800">
                Saved <span className="font-mono">{pdfDownloadedName}</span>
              </span>
            )}
          </div>

          {/* Mandatory Pre-PDF Question Prompt */}
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-amber-300 space-y-3">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  What are the three things you most want to ask your vet?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Printed as Section 6 on Page 1 so your vet sees your top priorities in the first 30 seconds.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {([0, 1, 2] as const).map((idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 w-5 text-right shrink-0">
                    {idx + 1}.
                  </span>
                  <input
                    id={`vet-q-${idx}`}
                    type="text"
                    value={questions[idx]}
                    onChange={(e) => updateQuestion(idx, e.target.value)}
                    placeholder={
                      idx === 0
                        ? 'e.g. Should we review evening comfort support?'
                        : idx === 1
                        ? 'e.g. Is the recent change in sleep/vocalisation related to comfort?'
                        : 'e.g. Any lab checks needed before our next refill?'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              ))}
            </div>

            {/* Gate Blocker if user clicks Download with all 3 blank */}
            {showQuestionGatePrompt && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2 text-xs text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <span>
                    Adding even one question helps focus a short vet appointment. Would you like to add your questions first, or skip for now?
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionGatePrompt(false);
                      document.getElementById('vet-q-0')?.focus();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-slate-900"
                  >
                    Write My Questions
                  </button>
                  <button
                    type="button"
                    onClick={() => executePdfExport(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
                  >
                    Skip for Now &amp; Generate PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Expiring Share Link Card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Link2 className="w-4 h-4 text-amber-800 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-slate-900">7-Day Secure Share Link:</span>
                <span className="font-mono text-[11px] text-slate-600 ml-1 truncate">
                  {shareLinkInfo.url}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-bold text-xs shrink-0 hover:bg-amber-900 transition-colors"
            >
              {copiedLink ? 'Copied Link' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Printable Document Preview — Exact 7 Ordered Sections */}
        <div className="p-6 sm:p-8 space-y-5 text-slate-900 print:p-0 print:space-y-4">
          {/* Header */}
          <div className="pb-3 border-b-2 border-slate-800 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {pet.name} — Pre-Visit Veterinary Brief ({copy.speciesLabel})
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                {pet.breed} · {pet.age_unknown ? 'Age unknown' : `${pet.ageYears} yrs${pet.age_estimated ? ' (estimated)' : ''}`} · {pet.neuterStatus} · Current Weight: {pet.currentWeightKg} kg
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono tabular-nums">
              <div>Report Date: {new Date().toISOString().split('T')[0]}</div>
              <div className="text-[10px]">Format: {reportMode === 'single_page' ? '1-Page Brief' : 'Extended + Full Log'}</div>
            </div>
          </div>

          {/* SECTION 1: Pet Snapshot */}
          <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1.5 text-xs">
            <h3 className="font-black uppercase tracking-wider text-slate-800">
              1. Pet Snapshot &amp; 30-Day Medication Adherence ({adherence30d}%)
            </h3>
            <p className="text-slate-700">
              <strong>Weight Trend:</strong>{' '}
              {sortedWeights.length >= 2
                ? `${sortedWeights[0].weightKg} kg (${sortedWeights[0].date}) → ${pet.currentWeightKg} kg`
                : `${pet.currentWeightKg} kg`}{' '}
              · <strong>Known Conditions:</strong> {pet.knownConditions.join(', ') || 'None noted'}
            </p>
            <p className="text-slate-700">
              <strong>Active Medications:</strong>{' '}
              {medications.length > 0
                ? medications.map((m) => `${m.name} (${m.dosage}, ${m.frequency})`).join('; ')
                : 'None active'}
            </p>
          </div>

          {/* SECTION 2: Top 3 Changes in Last 30 Days */}
          <div className="space-y-1.5 text-xs">
            <h3 className="font-black uppercase tracking-wider text-slate-800">
              2. Top Three Changes in Last 30 Days
            </h3>
            {top3Changes.length === 0 ? (
              <p className="text-slate-500 italic">Still learning {pet.name}'s baseline (&lt;5 check-ins).</p>
            ) : (
              <div className="space-y-1.5">
                {top3Changes.map((dev, idx) => (
                  <div key={dev.metricKey} className="p-2.5 rounded-lg border border-slate-300 flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900">{idx + 1}. {dev.metricLabel}</span>{' '}
                      <span className="text-slate-500">({dev.dateRangeLabel || '30d'})</span>: {dev.interpretation}
                    </div>
                    <span className="font-mono font-bold text-slate-800 shrink-0 tabular-nums">
                      7d: {dev.mean7d} vs 30d: {dev.mean30d} ({dev.percentDeviation > 0 ? `+${dev.percentDeviation}%` : `${dev.percentDeviation}%`})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: Cognitive Trend Summary (DISHAA vs VISHDAAL) */}
          <div className="space-y-2 text-xs">
            <h3 className="font-black uppercase tracking-wider text-slate-800">
              3. {copy.vetBriefLabels.cognitiveSectionTitle}
            </h3>
            <p className="text-slate-700 font-medium">
              {cogTrend.overallPlainSummary}{' '}
              {!cogTrend.hasReliableTrend && (
                <span className="text-amber-900 font-bold">(More screens needed for a reliable trend)</span>
              )}
            </p>
            {last3Cog.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-300">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="px-2.5 py-1.5 border-b border-slate-300">Dimension ({copy.cognitiveInstrument})</th>
                      {last3Cog.map((sc) => (
                        <th key={sc.id} className="px-2.5 py-1.5 border-b border-slate-300">{sc.date}</th>
                      ))}
                      <th className="px-2.5 py-1.5 border-b border-slate-300">Direction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cogTrend.dimensionTrends.map((dim) => (
                      <tr key={dim.dimensionKey}>
                        <td className="px-2.5 py-1.5 font-semibold text-slate-900">{dim.dimensionLabel}</td>
                        {last3Cog.map((sc) => {
                          const val = sc.per_dimension_scores?.[dim.dimensionKey];
                          return (
                            <td key={sc.id} className="px-2.5 py-1.5 capitalize">
                              {val === null || val === undefined ? 'Not sure' : `${val}/4`}
                            </td>
                          );
                        })}
                        <td className="px-2.5 py-1.5 font-semibold capitalize">{dim.direction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 4: Pain & Anxiety Summary */}
          <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1 text-xs">
            <h3 className="font-black uppercase tracking-wider text-slate-800">
              4. Pain &amp; Anxiety Summary (Last 30 Days)
            </h3>
            <p className="text-slate-700">
              {painAnxiety.comfortTrendText}. 30d Pain/Mobility Events: <strong>{painAnxiety.painEventCount30d}</strong> · Anxiety/Restless Events: <strong>{painAnxiety.anxietyEventCount30d}</strong>.
            </p>
            <p className="text-slate-700">
              <strong>Pain &amp; Anxiety Med Adherence:</strong>{' '}
              {painAnxiety.painAnxietyMeds.length > 0
                ? painAnxiety.painAnxietyMeds.map((m) => `${m.name} (${m.adherence30d}%)`).join(' · ')
                : 'None listed'}
            </p>
          </div>

          {/* SECTION 5: Owner-Reported Correlations (ONLY appears here) */}
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/40 space-y-1.5 text-xs">
            <h3 className="font-black uppercase tracking-wider text-amber-950">
              5. Patterns the Owner Noticed (Non-Diagnostic Correlations)
            </h3>
            {correlations.length === 0 ? (
              <p className="text-slate-600 italic">No co-occurring 14-day patterns flagged in this period.</p>
            ) : (
              correlations.map((c) => (
                <div key={c.ruleId} className="text-slate-800 space-y-0.5">
                  <div className="font-bold">{c.title}</div>
                  {c.adherencePromptFirst && <p>{c.adherencePromptFirst}</p>}
                  <p>{c.promptText}</p>
                  <p className="text-[10px] font-mono text-slate-500">{c.evidenceSummary}</p>
                </div>
              ))
            )}
          </div>

          {/* SECTION 6: Owner's Three Questions */}
          <div className="p-3.5 rounded-xl border border-slate-300 space-y-1.5 text-xs">
            <h3 className="font-black uppercase tracking-wider text-slate-800">
              6. Owner&apos;s Three Questions for Your Vet
            </h3>
            {hasAtLeastOneQuestion ? (
              <ol className="list-decimal list-inside space-y-1 font-medium text-slate-900">
                {questions
                  .map((q) => q.trim())
                  .filter(Boolean)
                  .map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
              </ol>
            ) : (
              <p className="text-slate-600 italic">
                Skipped custom questions — system suggestion: &quot;{brief.vetQuestion}&quot;
              </p>
            )}
          </div>

          {/* SECTION 7: QoL & Good-Day / Bad-Day Pattern Summary */}
          <div className="p-3.5 rounded-xl border border-slate-300 space-y-1 text-xs">
            <h3 className="font-black uppercase tracking-wider text-slate-800">
              7. Quality of Life &amp; Good-Day / Bad-Day Pattern
            </h3>
            <p className="text-slate-700">
              <strong>30-Day:</strong> {summary30.goodDays} Good, {summary30.badDays} Harder/Bad ({summary30.unloggedDays} unlogged excluded) — {summary30.proportionText}
            </p>
            <p className="text-slate-700">
              <strong>90-Day:</strong> {summary90.goodDays} Good, {summary90.badDays} Harder/Bad ({summary90.unloggedDays} unlogged excluded) — Band: <strong>{summary90.bandLabel}</strong>. {persistenceNote}
            </p>
            <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{QOL_FREQUENCY_DISCLAIMER}</span>
            </p>
          </div>

          {/* EXTENDED VERSION ONLY (Page 2+ Preview) */}
          {reportMode === 'extended' && (
            <div className="pt-3 space-y-4 border-t border-slate-300">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Extended Appendix: Trend Charts &amp; Recent Structured Events ({sortedEvents.length})
              </h3>
              <VetReportCharts
                pet={pet}
                checkIns={checkIns}
                cognitiveLogs={cognitiveLogs}
                qolLogs={qolLogs}
              />
              <div className="space-y-1.5 text-xs">
                {sortedEvents.slice(0, 15).map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{ev.eventName}</span>{' '}
                      <span className="text-slate-500">({ev.category} · {ev.severity})</span>
                      {ev.notes && <span className="text-slate-700 block italic">"{ev.notes}"</span>}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">
                      {new Date(ev.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
