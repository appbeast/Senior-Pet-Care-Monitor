import React, { useState } from 'react';
import { X, Check, Sun, Moon } from 'lucide-react';
import { DailyCheckIn, SpeciesPathway, UserRole } from '../types';
import { getSpeciesPathwayCopy } from '../services/speciesPathway';

interface DailyCheckInModalProps {
  petId: string;
  petName: string;
  speciesPathway: SpeciesPathway;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRole;
  yesterdayNeedsBackfill: boolean;
  yesterdayDateStr: string;
  onSave: (checkIn: DailyCheckIn) => Promise<void>;
  onClose: () => void;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  petId,
  petName,
  speciesPathway,
  currentUserId,
  currentUserName,
  currentUserRole,
  yesterdayNeedsBackfill,
  yesterdayDateStr,
  onSave,
  onClose,
}) => {
  const copy = getSpeciesPathwayCopy(speciesPathway);
  const todayStr = new Date().toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState<string>(todayStr);

  const [appetite, setAppetite] = useState<number>(4);
  const [waterIntake, setWaterIntake] = useState<number>(3);
  const [energyActivity, setEnergyActivity] = useState<number>(3);
  const [mobilityStiffness, setMobilityStiffness] = useState<number>(3);
  const [comfortPain, setComfortPain] = useState<number>(4);
  const [stoolQuality, setStoolQuality] = useState<number>(4);
  const [isGoodDay, setIsGoodDay] = useState<boolean>(true);
  const [quickNote, setQuickNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const checkIn: DailyCheckIn = {
        id: `checkin_${petId}_${targetDate}_${Date.now()}`,
        petId,
        date: targetDate,
        timestamp: targetDate === todayStr ? Date.now() : new Date(`${targetDate}T12:00:00`).getTime(),
        loggedByUserId: currentUserId,
        loggedByUserName: currentUserName,
        userRole: currentUserRole,
        appetite,
        waterIntake,
        energyActivity,
        mobilityStiffness,
        comfortPain,
        stoolQuality,
        isGoodDay,
        quickNote: quickNote.trim() || undefined,
      };
      await onSave(checkIn);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl border border-[#E5E0D4] shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 bg-[#FDFBF7]/95 backdrop-blur-xs px-5 py-4 border-b border-[#E5E0D4] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                20-Second {copy.speciesLabel} Check-In
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-600 font-medium">{petName}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {targetDate === todayStr ? 'Today’s Log' : `Backfill ${yesterdayDateStr}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {yesterdayNeedsBackfill && targetDate === todayStr && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-[#F5F2EB] border border-[#E5E0D4] flex items-center justify-between text-xs">
            <span className="text-slate-700">Missed yesterday? Backfill it with one tap.</span>
            <button
              type="button"
              onClick={() => setTargetDate(yesterdayDateStr)}
              className="px-2.5 py-1 font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors min-h-[36px]"
            >
              Log Yesterday
            </button>
          </div>
        )}

        {targetDate !== todayStr && (
          <div className="mx-5 mt-3 flex items-center justify-between text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <span>Logging for {targetDate}</span>
            <button
              type="button"
              onClick={() => setTargetDate(todayStr)}
              className="font-bold underline min-h-[32px] flex items-center"
            >
              Switch back to Today
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 flex-1">
          {/* Day Verdict Toggle */}
          <div className="p-1.5 bg-[#F5F2EB] rounded-2xl border border-[#E5E0D4] flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGoodDay(true)}
              className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all min-h-[48px] ${
                isGoodDay
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Good Day</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGoodDay(false)}
              className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all min-h-[48px] ${
                !isGoodDay
                  ? 'bg-amber-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Harder Day</span>
            </button>
          </div>

          {/* 1. Species-specific Mobility */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm font-semibold text-slate-800">{copy.dailyCheckIn.mobilityLabel}</label>
              <span className="text-xs text-slate-600 font-medium">
                {mobilityStiffness <= 2
                  ? copy.dailyCheckIn.mobilityLow
                  : mobilityStiffness === 3
                  ? copy.dailyCheckIn.mobilityMid
                  : copy.dailyCheckIn.mobilityHigh}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMobilityStiffness(val)}
                  className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                    mobilityStiffness === val
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-[#F5F2EB] text-slate-700 hover:bg-[#EAE5D9]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 px-1">
              <span>{copy.dailyCheckIn.mobilityScaleLeft}</span>
              <span>{copy.dailyCheckIn.mobilityScaleRight}</span>
            </div>
          </div>

          {/* 2. Appetite */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm font-semibold text-slate-800">Appetite</label>
              <span className="text-xs text-slate-600 font-medium">
                {appetite === 1 ? 'Refused meal' : appetite === 2 ? 'Ate < half' : appetite === 3 ? 'Ate most' : 'Finished eagerly'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAppetite(val)}
                  className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                    appetite === val
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-[#F5F2EB] text-slate-700 hover:bg-[#EAE5D9]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Water Intake */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm font-semibold text-slate-800">{copy.dailyCheckIn.hydrationLabel}</label>
              <span className="text-xs text-slate-600 font-medium">
                {waterIntake === 1
                  ? 'Barely drank'
                  : waterIntake === 3
                  ? copy.dailyCheckIn.hydrationNormal
                  : waterIntake >= 4
                  ? 'Drinking noticeably more'
                  : 'Low'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setWaterIntake(val)}
                  className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                    waterIntake === val
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-[#F5F2EB] text-slate-700 hover:bg-[#EAE5D9]'
                  }`}
                >
                  {val === 3 ? '3 (Normal)' : val}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Species-specific Energy & Activity */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm font-semibold text-slate-800">{copy.dailyCheckIn.activityLabel}</label>
              <span className="text-xs text-slate-600 font-medium">
                {energyActivity <= 2
                  ? copy.dailyCheckIn.activityLow
                  : energyActivity === 3
                  ? copy.dailyCheckIn.activityMid
                  : copy.dailyCheckIn.activityHigh}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEnergyActivity(val)}
                  className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                    energyActivity === val
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-[#F5F2EB] text-slate-700 hover:bg-[#EAE5D9]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Comfort & Pain */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-sm font-semibold text-slate-800">Comfort / Pain Level</label>
              <span className="text-xs text-slate-600 font-medium">
                {comfortPain <= 2 ? 'Signs of pain' : comfortPain === 3 ? 'Mild discomfort' : 'Comfortable & settled'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setComfortPain(val)}
                  className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                    comfortPain === val
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-[#F5F2EB] text-slate-700 hover:bg-[#EAE5D9]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Stool Quality */}
          <div className="pt-2 border-t border-[#E5E0D4]">
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Stool Quality ({copy.dailyCheckIn.stoolPlaceholderHint})
              </label>
              <span className="text-xs text-slate-500">
                {stoolQuality < 3 ? 'Hard / dry' : stoolQuality <= 4 ? 'Ideal form (4)' : stoolQuality < 7 ? 'Loose stool' : 'Watery diarrhea'}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStoolQuality(s)}
                  className={`h-10 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    stoolQuality === s
                      ? 'bg-amber-900 text-white font-bold'
                      : 'bg-[#F5F2EB] text-slate-600 hover:bg-[#EAE5D9]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Note */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Quick Note (Optional — never required)
            </label>
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder={copy.dailyCheckIn.notePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C4] bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="sticky bottom-0 bg-[#FDFBF7] pt-2 pb-safe">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Check className="w-5 h-5 text-emerald-400" />
              <span>{isSaving ? 'Saving...' : 'Save Daily Check-In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
