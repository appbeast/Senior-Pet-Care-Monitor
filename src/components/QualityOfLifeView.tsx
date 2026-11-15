import React, { useState } from 'react';
import { Edit3, ShieldAlert, Check, Plus, ShieldCheck } from 'lucide-react';
import { PetRecord, QoLAssessmentLog, DailyCheckIn } from '../types';
import { calculateQoLScore, getQoLQuestionsForSpecies } from '../services/assessmentQuestions';
import {
  comparePersistence30vs90,
  computeQoLPatternSummary,
  QOL_FREQUENCY_DISCLAIMER,
} from '../services/qolPatternService';
import { getSpeciesPathwayCopy, resolveSpeciesPathway } from '../services/speciesPathway';
import { PROVISIONAL_CLINICAL_REVIEW } from '../data/clinicalGovernance';

interface QualityOfLifeViewProps {
  pet: PetRecord;
  qolLogs: QoLAssessmentLog[];
  checkIns: DailyCheckIn[];
  currentUserName: string;
  onSaveAssessment: (log: QoLAssessmentLog) => Promise<void>;
  onUpdateGoalsOfCare: (goals: string) => Promise<void>;
}

export const QualityOfLifeView: React.FC<QualityOfLifeViewProps> = ({
  pet,
  qolLogs,
  checkIns,
  currentUserName,
  onSaveAssessment,
  onUpdateGoalsOfCare,
}) => {
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goalsDraft, setGoalsDraft] = useState(pet.goalsOfCareNote || '');
  const [calendarWindow, setCalendarWindow] = useState<30 | 90>(30);

  const pathway = resolveSpeciesPathway(pet);
  const copy = getSpeciesPathwayCopy(pathway);

  const summary30 = computeQoLPatternSummary(checkIns, 30);
  const summary90 = computeQoLPatternSummary(checkIns, 90);
  const activeSummary = calendarWindow === 30 ? summary30 : summary90;
  const persistenceComparison = comparePersistence30vs90(summary30, summary90);

  // Build calendar cells
  const now = Date.now();
  const dayMs = 86400000;
  const daysArray = Array.from({ length: calendarWindow }).map((_, idx) => {
    const d = new Date(now - (calendarWindow - 1 - idx) * dayMs);
    const dateStr = d.toISOString().split('T')[0];
    const checkIn = checkIns.find((c) => c.date === dateStr);
    return {
      date: dateStr,
      dayOfMonth: d.getDate(),
      checkIn,
      isGoodDay: checkIn ? checkIn.isGoodDay : null,
    };
  });

  const handleSaveGoals = async () => {
    await onUpdateGoalsOfCare(goalsDraft);
    setIsEditingGoals(false);
  };

  const latestQol = qolLogs[0];

  return (
    <div className="space-y-6">
      {/* Non-directive Clinical Disclaimer */}
      <div className="p-4 rounded-2xl bg-[#F5F2EB] border border-[#E5E0D4] flex items-start gap-3 text-xs text-slate-700">
        <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Decision Support & Reflection ({copy.speciesLabel} Pathway)
          </span>
          <p className="leading-relaxed">
            {copy.qolHeaderNote} This module provides structured reflection for you and your family before veterinary appointments. It never scores a pet as “ready for euthanasia” and never replaces veterinary counsel.
          </p>
        </div>
      </div>

      {/* Private Goals of Care Note */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D4] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Private Reflection</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-600 font-medium">Revisit Anytime</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Goals of Care</h3>
            <p className="text-xs text-slate-500">
              What matters most to {pet.name}, and what you hope to protect or avoid as they age.
            </p>
          </div>

          {!isEditingGoals ? (
            <button
              type="button"
              onClick={() => setIsEditingGoals(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5D0C4] hover:bg-[#F5F2EB] text-slate-700 text-xs font-semibold min-h-[40px]"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-800" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveGoals}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold min-h-[40px]"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save Note</span>
            </button>
          )}
        </div>

        {isEditingGoals ? (
          <textarea
            rows={4}
            value={goalsDraft}
            onChange={(e) => setGoalsDraft(e.target.value)}
            placeholder="What brings comfort every day, and what burdens do we want to avoid?"
            className="w-full p-3.5 rounded-2xl border border-[#D5D0C4] bg-[#FDFBF7] text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        ) : (
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4] text-sm text-slate-800 leading-relaxed italic">
            "{pet.goalsOfCareNote || 'No goals of care recorded yet. Tap edit to write what matters most.'}"
          </div>
        )}
      </div>

      {/* Good Days vs Harder Days Frequency Pattern (Enhancement 5) */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#F5F2EB] border border-[#E5E0D4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Good Days vs. Harder Days Pattern</h3>
            <p className="text-xs text-slate-600">
              Logged days only over the last {calendarWindow} days (unlogged days are counted separately, never as good days)
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#E5E0D4]">
            <button
              type="button"
              onClick={() => setCalendarWindow(30)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors min-h-[36px] ${
                calendarWindow === 30 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setCalendarWindow(90)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors min-h-[36px] ${
                calendarWindow === 90 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        {/* Three Separate Counts: Good, Harder, Unlogged */}
        <div className="grid grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-white border border-emerald-200">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 shrink-0" />
              <span>Good Days</span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
              {activeSummary.goodDays}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-amber-200">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-800 shrink-0" />
              <span>Harder Days</span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
              {activeSummary.badDays}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-[#E5E0D4]">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
              <span>Unlogged</span>
            </div>
            <div className="text-xl font-black text-slate-700 mt-1 tabular-nums">
              {activeSummary.unloggedDays}
            </div>
          </div>
        </div>

        {/* Frequency Band & Non-Diagnostic Clinical Translation */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              {calendarWindow}-Day Frequency Band: {activeSummary.bandLabel}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
              {activeSummary.loggedDays} of {calendarWindow} days logged
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900">{activeSummary.proportionText}</p>
          <p className="text-xs text-slate-700 leading-relaxed">{activeSummary.clinicalTranslation}</p>
          <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-[#F5F2EB]">
            <strong>30-Day vs 90-Day Comparison:</strong> {persistenceComparison}
          </p>
          <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{QOL_FREQUENCY_DISCLAIMER}</span>
          </div>
        </div>

        {/* Visual Calendar Grid */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D4] overflow-x-auto">
          <div className="grid grid-cols-10 sm:grid-cols-15 gap-2 min-w-[320px]">
            {daysArray.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${
                  d.isGoodDay === true ? 'Good Day' : d.isGoodDay === false ? 'Harder Day' : 'Unlogged'
                }`}
                className={`h-9 rounded-xl flex flex-col items-center justify-center text-[10px] font-mono ${
                  d.isGoodDay === true
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                    : d.isGoodDay === false
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                    : 'bg-[#F5F2EB] text-slate-400 border border-dashed border-[#D5D0C4]'
                }`}
              >
                <span>{d.dayOfMonth}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Quality of Life Assessment */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Weekly Structured QoL Audit ({copy.speciesLabel})
            </h3>
            <p className="text-sm sm:text-xs text-slate-600">
              Adapted from veterinary quality-of-life frameworks (HHHHHMM scale). {PROVISIONAL_CLINICAL_REVIEW.review_notice}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSurveyModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-xs font-bold transition-colors min-h-[48px] sm:min-h-[44px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Complete QoL Audit</span>
          </button>
        </div>

        {latestQol ? (
          <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Latest Review: {latestQol.date}</span>
              <span className="font-bold text-slate-900 tabular-nums">
                Index: {latestQol.totalScore} / 70
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(latestQol.scores).map(([k, score]) => (
                <div key={k} className="p-2.5 rounded-xl bg-white border border-[#E5E0D4]">
                  <span className="capitalize text-slate-500 text-[11px] block">{k.replace(/_/g, ' ')}</span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">{score} / 10</span>
                </div>
              ))}
            </div>

            {latestQol.notes && (
              <p className="text-xs text-slate-600 italic">"{latestQol.notes}"</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No structured QoL reviews logged yet.</p>
        )}
      </div>

      {/* Survey Modal */}
      {showSurveyModal && (
        <QoLModal
          pet={pet}
          goodDaysCount30={summary30.goodDays}
          badDaysCount30={summary30.badDays}
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

const QoLModal: React.FC<{
  pet: PetRecord;
  goodDaysCount30: number;
  badDaysCount30: number;
  currentUserName: string;
  onSave: (log: QoLAssessmentLog) => Promise<void>;
  onClose: () => void;
}> = ({ pet, goodDaysCount30, badDaysCount30, currentUserName, onSave, onClose }) => {
  const pathway = resolveSpeciesPathway(pet);
  const questions = getQoLQuestionsForSpecies(pathway);

  const [scores, setScores] = useState<Record<string, number>>({
    hurt: 7,
    hunger: 7,
    hydration: 8,
    hygiene: 8,
    happiness: 7,
    mobility: 6,
    more_good_days: 7,
  });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleScoreChange = (cat: string, val: number) => {
    setScores((prev) => ({ ...prev, [cat]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const totalScore = calculateQoLScore(scores);
      const log: QoLAssessmentLog = {
        id: `qol_${Date.now()}`,
        petId: pet.id,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        scores,
        totalScore,
        goodDaysPast30Count: goodDaysCount30,
        badDaysPast30Count: badDaysCount30,
        loggedByName: currentUserName,
        notes: notes.trim() || undefined,
      };
      await onSave(log);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl border border-[#E5E0D4] shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 bg-[#FDFBF7]/95 backdrop-blur-xs px-5 py-4 border-b border-[#E5E0D4] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Weekly Reflection ({pathway === 'cat' ? 'Cat' : 'Dog'})
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Quality of Life Review for {pet.name}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-6 flex-1">
          <div className="text-xs text-slate-600 bg-[#F5F2EB] p-3 rounded-xl border border-[#E5E0D4] leading-relaxed space-y-1">
            <p>
              Rate each area from 0 (severe burden/distress) to 10 (ideal comfort/well-being) across the past 7 days.
            </p>
            <p className="text-[11px] font-semibold text-amber-900">
              {PROVISIONAL_CLINICAL_REVIEW.review_notice}
            </p>
          </div>

          <div className="space-y-5">
            {questions.map((q) => (
              <div key={q.id} className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{q.title}</h4>
                  <span className="text-base font-black text-slate-900 tabular-nums">
                    {scores[q.category]} / 10
                  </span>
                </div>
                <p className="text-xs text-slate-500">{q.prompt}</p>

                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={scores[q.category]}
                  onChange={(e) => handleScoreChange(q.category, parseInt(e.target.value, 10))}
                  className="w-full accent-slate-900 cursor-pointer h-2 bg-[#F5F2EB] rounded-lg"
                />

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{q.minLabel}</span>
                  <span>{q.maxLabel}</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Personal Reflection Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                pathway === 'cat'
                  ? 'e.g. Curled up peacefully in the sunbeam; hesitated slightly stepping into litter box...'
                  : 'e.g. Enjoyed afternoon sunshine; struggled slightly rising after dinner...'
              }
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-xs text-slate-900"
            />
          </div>

          <div className="sticky bottom-0 bg-[#FDFBF7] pt-2 pb-safe">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all"
            >
              {isSaving ? 'Saving...' : 'Save Weekly Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
