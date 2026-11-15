import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  Eye,
  Copy,
  Check,
  FileText,
  Brain,
  BellOff,
  AlertTriangle,
  CalendarHeart,
} from 'lucide-react';
import {
  EvaluatedCorrelationAlert,
  SpeciesPathway,
  WeeklyChangeBrief,
} from '../types';
import { ScreeningScheduleStatus } from '../services/cognitiveScheduler';
import { QOL_FREQUENCY_DISCLAIMER } from '../services/qolPatternService';

interface WeeklyBriefCardProps {
  brief: WeeklyChangeBrief;
  petName: string;
  speciesPathway?: SpeciesPathway;
  cognitiveSchedule?: ScreeningScheduleStatus;
  activeCorrelation?: EvaluatedCorrelationAlert | null;
  onStartCognitiveScreen?: () => void;
  onSnoozeCorrelation?: (alert: EvaluatedCorrelationAlert) => Promise<void>;
  onOpenVetExport: () => void;
}

export const WeeklyBriefCard: React.FC<WeeklyBriefCardProps> = ({
  brief,
  petName,
  cognitiveSchedule,
  activeCorrelation,
  onStartCognitiveScreen,
  onSnoozeCorrelation,
  onOpenVetExport,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSnoozing, setIsSnoozing] = useState(false);

  const handleCopyText = async () => {
    let text = `Weekly Change Brief for ${petName} (Week Ending ${brief.weekEndingDate})\n\n`;
    text += `WHAT CHANGED THIS WEEK:\n`;
    brief.bullets.forEach((b) => {
      text += `• ${b.summary} [${b.dataLink}]\n`;
    });
    if (brief.qolPatternLine) {
      text += `\nGOOD-DAY / BAD-DAY FREQUENCY SHIFT:\n• ${brief.qolPatternLine}\n`;
    }
    if (activeCorrelation) {
      text += `\nPATTERNS NOTICED (NOT A DIAGNOSIS):\n`;
      if (activeCorrelation.adherencePromptFirst) {
        text += `• ${activeCorrelation.adherencePromptFirst}\n`;
      }
      text += `• ${activeCorrelation.promptText}\n`;
    }
    text += `\nQUESTION FOR YOUR VET:\n`;
    text += `• ${brief.vetQuestion}\n`;
    text += `\nWATCH NEXT WEEK:\n`;
    text += `• ${brief.watchItem.metric}: ${brief.watchItem.thresholdDescription}\n`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSnooze = async () => {
    if (!activeCorrelation || !onSnoozeCorrelation) return;
    setIsSnoozing(true);
    try {
      await onSnoozeCorrelation(activeCorrelation);
    } finally {
      setIsSnoozing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#F5F2EB] border border-[#E5E0D4] shadow-xs space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Weekly Synthesis · Ending {brief.weekEndingDate}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {petName}&apos;s Change Brief
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#D5D0C4] hover:bg-[#FDFBF7] text-slate-800 text-xs font-semibold transition-colors min-h-[44px]"
            title="Copy brief as plain text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenVetExport}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Pre-Visit Brief</span>
          </button>
        </div>
      </div>

      {/* Scheduled Cognitive Check Prompt (Enhancement 1) */}
      {cognitiveSchedule && (cognitiveSchedule.isDueNow || cognitiveSchedule.status === 'needs_age_estimate') && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Brain className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                {cognitiveSchedule.status === 'needs_age_estimate'
                  ? 'Cognitive Check Setup'
                  : `6-Month Scheduled ${cognitiveSchedule.instrument} Check Due`}
              </div>
              <p className="text-xs text-slate-800 mt-0.5 leading-relaxed">
                {cognitiveSchedule.headlineMessage}. {cognitiveSchedule.subMessage}
              </p>
            </div>
          </div>
          {onStartCognitiveScreen && (
            <button
              type="button"
              onClick={onStartCognitiveScreen}
              className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-slate-900 text-white text-xs font-bold shrink-0 min-h-[42px]"
            >
              {cognitiveSchedule.status === 'needs_age_estimate'
                ? 'Estimate Age'
                : `Start ${cognitiveSchedule.instrument} Check`}
            </button>
          )}
        </div>
      )}

      {/* Active Non-Snoozed Correlation Alert (Enhancement 3) */}
      {activeCorrelation && (
        <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
              <span>Patterns Noticed (Not a Diagnosis)</span>
            </div>
            {onSnoozeCorrelation && (
              <button
                type="button"
                onClick={handleSnooze}
                disabled={isSnoozing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D5D0C4] hover:bg-[#F5F2EB] text-[11px] font-semibold text-slate-700 min-h-[34px]"
              >
                <BellOff className="w-3.5 h-3.5 text-slate-500" />
                <span>{isSnoozing ? 'Snoozing...' : 'Not now (Snooze 14 days)'}</span>
              </button>
            )}
          </div>

          <div className="text-sm font-bold text-slate-900">{activeCorrelation.title}</div>

          {activeCorrelation.adherencePromptFirst && (
            <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-slate-900 font-medium leading-relaxed">
              {activeCorrelation.adherencePromptFirst}
            </div>
          )}

          <p className="text-sm text-slate-800 leading-relaxed">{activeCorrelation.promptText}</p>

          <p className="text-[11px] text-slate-500 font-mono">
            Observed over 14 days: {activeCorrelation.evidenceSummary}
          </p>
        </div>
      )}

      {/* Section 1: Three Baseline Bullets - What Changed This Week */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
          <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
          <span>What Changed This Week (Baseline-Relative)</span>
        </div>

        <div className="space-y-2.5">
          {brief.bullets.map((bullet, idx) => (
            <div
              key={bullet.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-1.5 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-sm sm:text-xs">
                <span className="font-bold text-slate-900">
                  {idx + 1}. {bullet.metricLabel}
                </span>
                <span className="text-xs sm:text-[11px] font-mono text-slate-500 tabular-nums">
                  {bullet.dataLink}
                </span>
              </div>
              <p className="text-[15px] sm:text-sm text-slate-700 leading-relaxed font-normal">
                {bullet.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Good-Day / Bad-Day Material Week-Over-Week Change (Enhancement 5) */}
      {brief.qolPatternLine && (
        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
            <CalendarHeart className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Good-Day / Bad-Day Pattern Shift</span>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">{brief.qolPatternLine}</p>
          {!brief.qolPatternLine.includes(QOL_FREQUENCY_DISCLAIMER) && (
            <p className="text-[11px] font-semibold text-amber-900">{QOL_FREQUENCY_DISCLAIMER}</p>
          )}
        </div>
      )}

      {/* Section 2: Exactly One Question For Your Vet */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
          <HelpCircle className="w-4 h-4 text-amber-800 shrink-0" />
          <span>One Question to Ask Your Vet</span>
        </div>
        <p className="text-[15px] sm:text-sm font-semibold text-slate-900 leading-snug">
          "{brief.vetQuestion}"
        </p>
        <p className="text-xs sm:text-[11px] text-amber-800/90 pt-0.5">
          Derived from the strongest rolling deviation observed across daily check-ins.
        </p>
      </div>

      {/* Section 3: Exactly One Thing to Watch Next Week */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
          <Eye className="w-4 h-4 text-slate-700 shrink-0" />
          <span>One Thing to Watch Next Week</span>
        </div>
        <div className="text-[15px] sm:text-sm font-semibold text-slate-900">
          {brief.watchItem.metric}
        </div>
        <p className="text-sm sm:text-xs text-slate-600 leading-relaxed">
          {brief.watchItem.thresholdDescription}
        </p>
      </div>
    </div>
  );
};
