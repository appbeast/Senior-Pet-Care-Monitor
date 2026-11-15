import React, { useState } from 'react';
import { Pill, Check, AlertTriangle, Clock, Plus, History, RotateCcw, Droplets } from 'lucide-react';
import { MedicationSchedule, DoseLog, UserRole } from '../types';
import { calculateMedicationAdherence } from '../services/exportService';

interface MedicationTrackerProps {
  petId: string;
  petName: string;
  medications: MedicationSchedule[];
  doses: DoseLog[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRole;
  onRecordDose: (dose: DoseLog) => Promise<void>;
  onAddMedication: (med: MedicationSchedule) => Promise<void>;
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({
  petId,
  petName,
  medications,
  doses,
  currentUserId,
  currentUserName,
  currentUserRole,
  onRecordDose,
  onAddMedication,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    medication: MedicationSchedule;
    conflictingDose: DoseLog;
    timeDiffMinutes: number;
  } | null>(null);

  const [skipPromptMed, setSkipPromptMed] = useState<MedicationSchedule | null>(null);
  const [skipReason, setSkipReason] = useState<string>('');

  const [fluidSiteModal, setFluidSiteModal] = useState<{
    medication: MedicationSchedule;
    volume: number;
  } | null>(null);
  const [selectedFluidSite, setSelectedFluidSite] = useState<string>('Left dorsal flank');

  // Adherence
  const adherence30d = calculateMedicationAdherence(doses, 30);
  const adherence7d = calculateMedicationAdherence(doses, 7);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDoses = doses.filter((d) => d.date === todayStr);

  const handleGivenClick = (med: MedicationSchedule) => {
    // If it's a subcutaneous fluid, prompt for volume & site rotation
    if (med.isSubQFluid) {
      setFluidSiteModal({
        medication: med,
        volume: med.fluidVolumeMl || 100,
      });
      return;
    }

    // Duplicate-dose safety check (within 90 minutes)
    const ninetyMinutesMs = 90 * 60 * 1000;
    const now = Date.now();
    const recentDose = doses.find(
      (d) =>
        d.medicationId === med.id &&
        d.status === 'given' &&
        now - d.timestamp < ninetyMinutesMs
    );

    if (recentDose) {
      const minutesAgo = Math.round((now - recentDose.timestamp) / 60000);
      setDuplicateWarning({
        medication: med,
        conflictingDose: recentDose,
        timeDiffMinutes: minutesAgo,
      });
      return;
    }

    executeDoseLogging(med, 'given');
  };

  const executeDoseLogging = async (
    med: MedicationSchedule,
    status: 'given' | 'skipped',
    reason?: string,
    siteNote?: string
  ) => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const scheduledTime = `${currentHours}:${currentMins}`;

    const dose: DoseLog = {
      id: `dose_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      petId,
      medicationId: med.id,
      medicationName: med.name,
      scheduledTime,
      date: todayStr,
      timestamp: Date.now(),
      status,
      administeredByUserId: currentUserId,
      administeredByName: currentUserName,
      administeredByRole: currentUserRole,
      skipReason: reason,
      siteNote,
    };

    await onRecordDose(dose);
    setDuplicateWarning(null);
    setSkipPromptMed(null);
    setSkipReason('');
    setFluidSiteModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Adherence Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F5F2EB] border border-[#E5E0D4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Care Circle Adherence</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-600 font-medium">Duplicate-Protected</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Medications & Fluids</h2>
          <p className="text-sm sm:text-xs text-slate-600 mt-0.5">
            Every dose records caregiver attribution to prevent double-dosing.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-3 sm:gap-4">
          <div className="p-3 bg-white rounded-2xl border border-[#E5E0D4] text-center min-w-[90px]">
            <div className="text-2xl font-black text-slate-900 tabular-nums">{adherence7d}%</div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">7-Day Rate</div>
          </div>
          <div className="p-3 bg-white rounded-2xl border border-[#E5E0D4] text-center min-w-[90px]">
            <div className="text-2xl font-black text-slate-900 tabular-nums">{adherence30d}%</div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">30-Day Rate</div>
          </div>
        </div>
      </div>

      {/* Medication List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Regimens</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medication</span>
          </button>
        </div>

        {medications.map((med) => {
          // Check today's dose logs for this medication
          const medTodayDoses = todayDoses.filter((d) => d.medicationId === med.id);
          const lastDose = medTodayDoses[0]; // most recent today

          return (
            <div
              key={med.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E0D4] shadow-xs hover:border-[#D5D0C4] transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-800">
                    {med.isSubQFluid ? <Droplets className="w-5 h-5 text-blue-600" /> : <Pill className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{med.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <strong className="font-semibold text-slate-800">{med.dosage}</strong> · {med.frequency} · {med.route}
                    </p>
                    {med.instructions && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">{med.instructions}</p>
                    )}
                  </div>
                </div>

                {/* Scheduled Times */}
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{med.scheduledTimes.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Today's Administration Status */}
              <div className="pt-3 border-t border-[#F5F2EB] flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs">
                  {lastDose ? (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                        lastDose.status === 'given' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lastDose.status === 'given' ? '✓ Given Today' : 'Skipped Today'}
                      </span>
                      <span className="text-slate-500">
                        at {lastDose.scheduledTime} by {lastDose.administeredByName}
                      </span>
                      {lastDose.siteNote && (
                        <span className="text-blue-700 font-medium">({lastDose.siteNote})</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-800 font-medium">Pending dose today</span>
                  )}
                </div>

                {/* One-Tap Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGivenClick(med)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors min-h-[44px]"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mark Given</span>
                  </button>
                  <button
                    onClick={() => setSkipPromptMed(med)}
                    className="px-2.5 py-2 rounded-xl border border-[#D5D0C4] hover:bg-[#F5F2EB] text-slate-600 text-xs font-semibold transition-colors min-h-[44px]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Duplicate Dose Warning Modal (Core Hard Requirement) */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FDFBF7] border-2 border-amber-500 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-800">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-800" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Duplicate Dose Warning</h3>
                <p className="text-xs text-amber-800 font-medium">Safety Protection Window Active</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-slate-800 space-y-1.5">
              <p>
                <strong className="font-semibold text-slate-900">{duplicateWarning.medication.name}</strong> was already logged as given{' '}
                <strong className="text-amber-900">{duplicateWarning.timeDiffMinutes} minutes ago</strong> by{' '}
                <strong className="font-semibold text-slate-900">{duplicateWarning.conflictingDose.administeredByName}</strong> (
                {duplicateWarning.conflictingDose.administeredByRole}).
              </p>
              <p className="text-slate-600">
                Are you certain another dose was administered, or was this a communication delay?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="flex-1 py-3 rounded-xl bg-[#F5F2EB] hover:bg-[#EAE5D9] text-slate-800 text-xs font-bold transition-colors min-h-[44px]"
              >
                Cancel (Keep Single Dose)
              </button>
              <button
                onClick={() => executeDoseLogging(duplicateWarning.medication, 'given')}
                className="flex-1 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-colors min-h-[44px]"
              >
                Confirm Second Dose
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Reason Prompt */}
      {skipPromptMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Skipped Dose</h3>
            <p className="text-xs text-slate-600">
              Why was {skipPromptMed.name} skipped? (Helps your vet monitor adherence)
            </p>
            <div className="space-y-1.5">
              {[
                'Pet spat out / refused pill',
                'Late meal or stomach upset',
                'Nauseous / held dose',
                'Ran out of medication',
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSkipReason(r)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs border transition-colors ${
                    skipReason === r
                      ? 'border-slate-800 bg-slate-900 text-white font-medium'
                      : 'border-[#E5E0D4] bg-white text-slate-700 hover:bg-[#F5F2EB]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSkipPromptMed(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#D5D0C4] text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDoseLogging(skipPromptMed, 'skipped', skipReason || 'Skipped')}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Record Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subcutaneous Fluids Site Rotation Prompt */}
      {fluidSiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Droplets className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Subcutaneous Fluids</h3>
            </div>
            <p className="text-xs text-slate-600">
              Record injection site to ensure proper skin rotation:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Left dorsal flank', 'Right dorsal flank', 'Left shoulder scruff', 'Right shoulder scruff'].map((site) => (
                <button
                  key={site}
                  type="button"
                  onClick={() => setSelectedFluidSite(site)}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    selectedFluidSite === site
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-[#E5E0D4] bg-white text-slate-700 hover:bg-[#F5F2EB]'
                  }`}
                >
                  {site}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setFluidSiteModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#D5D0C4] text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDoseLogging(fluidSiteModal.medication, 'given', undefined, selectedFluidSite)}
                className="flex-1 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold"
              >
                Record Infusion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <AddMedicationDialog
          petId={petId}
          onSave={async (newMed) => {
            await onAddMedication(newMed);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

// Internal Add Dialog
const AddMedicationDialog: React.FC<{
  petId: string;
  onSave: (med: MedicationSchedule) => Promise<void>;
  onClose: () => void;
}> = ({ petId, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState<'oral' | 'transdermal' | 'subcutaneous'>('oral');
  const [frequency, setFrequency] = useState('Twice daily');
  const [scheduledTimes, setScheduledTimes] = useState('08:00, 20:00');
  const [instructions, setInstructions] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const times = scheduledTimes.split(',').map((t) => t.trim()).filter(Boolean);
    const med: MedicationSchedule = {
      id: `med_${Date.now()}`,
      petId,
      name: name.trim(),
      dosage: dosage.trim() || 'Standard dose',
      route,
      frequency,
      scheduledTimes: times.length > 0 ? times : ['08:00'],
      instructions: instructions.trim() || undefined,
      isSubQFluid: route === 'subcutaneous',
      fluidVolumeMl: route === 'subcutaneous' ? 100 : undefined,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
    };

    await onSave(med);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-slate-900">Add New Prescription or Fluid</h3>
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Medication Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Galliprant, Gabapentin, Lactated Ringer's"
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dosage & Strength</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 60mg tablet once daily, 100ml fluid"
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Route</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
              >
                <option value="oral">Oral (tablet/liquid)</option>
                <option value="transdermal">Transdermal ear gel</option>
                <option value="subcutaneous">Sub-Q Fluids</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g. Twice daily with meals"
                className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scheduled Times (comma-separated 24h)</label>
            <input
              type="text"
              value={scheduledTimes}
              onChange={(e) => setScheduledTimes(e.target.value)}
              placeholder="08:00, 20:00"
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Instructions & Guidance</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Give with a small spoonful of food"
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#D5D0C4] font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
