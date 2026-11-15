import React, { useState, useEffect } from 'react';
import {
  PetRecord,
  DailyCheckIn,
  PetEvent,
  MedicationSchedule,
  DoseLog,
  CareCircleMember,
  CognitiveAssessmentLog,
  QoLAssessmentLog,
  UserRole,
  WeeklyChangeBrief,
  CorrelationEvent,
  EvaluatedCorrelationAlert,
  VetBriefRecord,
} from './types';
import { localDb } from './services/db';
import { generateWeeklyChangeBrief } from './services/briefGenerator';
import { resolveSpeciesPathway } from './services/speciesPathway';
import { computeFirstScreenDueAt, evaluateCognitiveSchedule } from './services/cognitiveScheduler';
import { evaluateCorrelations } from './services/correlationEngine';
import { Navigation, NavTab } from './components/Navigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { QuickEventModal } from './components/QuickEventModal';
import { MedicationTracker } from './components/MedicationTracker';
import { WeeklyBriefCard } from './components/WeeklyBriefCard';
import { BaselineTrendsView } from './components/BaselineTrendsView';
import { CognitiveScreeningView } from './components/CognitiveScreeningView';
import { QualityOfLifeView } from './components/QualityOfLifeView';
import { VetExportModal } from './components/VetExportModal';
import { CareCircleManager } from './components/CareCircleManager';
import { PaywallModal } from './components/PaywallModal';
import { NewPetModal } from './components/NewPetModal';
import {
  Calendar,
  PlusCircle,
  Camera,
  Volume2,
} from 'lucide-react';

export default function App() {
  const [pets, setPets] = useState<PetRecord[]>([]);
  const [activePet, setActivePet] = useState<PetRecord | null>(null);

  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [medications, setMedications] = useState<MedicationSchedule[]>([]);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>([]);
  const [cognitiveLogs, setCognitiveLogs] = useState<CognitiveAssessmentLog[]>([]);
  const [qolLogs, setQolLogs] = useState<QoLAssessmentLog[]>([]);
  const [correlationEvents, setCorrelationEvents] = useState<CorrelationEvent[]>([]);

  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [currentUserId, setCurrentUserId] = useState<string>('user_sarah');
  const [currentUserName, setCurrentUserName] = useState<string>('Sarah Miller');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('owner');
  const [appTier, setAppTier] = useState<'free' | 'paid'>('paid');

  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showQuickEventModal, setShowQuickEventModal] = useState(false);
  const [showVetExportModal, setShowVetExportModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showNewPetModal, setShowNewPetModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const loadPetData = async (pet: PetRecord) => {
    const pathway = resolveSpeciesPathway(pet);
    const [cIns, evs, meds, dLogs, cCircle, cogLogs, qLogs, corrEvents] = await Promise.all([
      localDb.getCheckIns(pet.id),
      localDb.getEvents(pet.id),
      localDb.getMedications(pet.id),
      localDb.getDoses(pet.id),
      localDb.getCareCircle(pet.id),
      localDb.getCognitiveLogs(pet.id, pathway),
      localDb.getQoLLogs(pet.id),
      localDb.getCorrelationEvents(pet.id),
    ]);

    setCheckIns(cIns);
    setEvents(evs);
    setMedications(meds);
    setDoses(dLogs);
    setCareCircle(cCircle);
    setCognitiveLogs(cogLogs);
    setQolLogs(qLogs);
    setCorrelationEvents(corrEvents);
  };

  const loadAppState = async () => {
    try {
      const allPets = await localDb.getPets();
      setPets(allPets);

      let petId = await localDb.getSetting<string>('activePetId', allPets[0]?.id || '');
      if (!petId && allPets.length > 0) petId = allPets[0].id;

      const targetPet = allPets.find((p) => p.id === petId) || allPets[0];
      setActivePet(targetPet || null);

      const role = await localDb.getSetting<UserRole>('currentUserRole', 'owner');
      setCurrentUserRole(role);

      const tier = await localDb.getSetting<'free' | 'paid'>('appTier', 'paid');
      setAppTier(tier);

      if (targetPet) {
        await loadPetData(targetPet);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppState();
  }, []);

  const handleSelectPet = async (petId: string) => {
    await localDb.saveSetting('activePetId', petId);
    const p = pets.find((pet) => pet.id === petId);
    if (p) {
      setActivePet(p);
      await loadPetData(p);
    }
  };

  const handleSwitchUser = async (userId: string, role: UserRole) => {
    setCurrentUserId(userId);
    setCurrentUserRole(role);
    const member = careCircle.find((m) => m.id === userId);
    if (member) setCurrentUserName(member.name);
    await localDb.saveSetting('currentUserRole', role);
  };

  const handleSaveCheckIn = async (checkIn: DailyCheckIn) => {
    await localDb.saveCheckIn(checkIn);
    if (activePet) await loadPetData(activePet);
  };

  const handleSaveEvent = async (event: PetEvent) => {
    await localDb.saveEvent(event);
    if (activePet) await loadPetData(activePet);
  };

  const handleRecordDose = async (dose: DoseLog) => {
    await localDb.saveDose(dose);
    if (activePet) await loadPetData(activePet);
  };

  const handleAddMedication = async (med: MedicationSchedule) => {
    await localDb.saveMedication(med);
    if (activePet) await loadPetData(activePet);
  };

  const handleSaveCognitiveAssessment = async (log: CognitiveAssessmentLog) => {
    await localDb.saveCognitiveLog(log);
    if (activePet) await loadPetData(activePet);
  };

  const handleSaveQoLAssessment = async (log: QoLAssessmentLog) => {
    await localDb.saveQoLLog(log);
    if (activePet) await loadPetData(activePet);
  };

  const handleUpdateGoalsOfCare = async (goals: string) => {
    if (!activePet) return;
    const updated: PetRecord = {
      ...activePet,
      goalsOfCareNote: goals,
      goalsUpdatedAt: new Date().toISOString().split('T')[0],
    };
    await localDb.savePet(updated);
    setActivePet(updated);
    setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleUpdatePetAge = async (ageYears: number, isEstimated: boolean) => {
    if (!activePet) return;
    const approxBirthYear = new Date().getFullYear() - Math.floor(ageYears);
    const draftPet: PetRecord = {
      ...activePet,
      ageYears,
      age_estimated: isEstimated,
      age_unknown: false,
      birthDate: activePet.birthDate || `${approxBirthYear}-01-01`,
    };
    draftPet.first_screen_due_at = computeFirstScreenDueAt(draftPet);
    await localDb.savePet(draftPet);
    setActivePet(draftPet);
    setPets((prev) => prev.map((p) => (p.id === draftPet.id ? draftPet : p)));
  };

  const handleSnoozeCorrelation = async (alert: EvaluatedCorrelationAlert) => {
    if (!activePet) return;
    const snoozedUntil = new Date(Date.now() + 14 * 86400000).toISOString();
    const record: CorrelationEvent = {
      id: `corr_${activePet.id}_${alert.ruleId}`,
      pet_id: activePet.id,
      rule_id: alert.ruleId,
      fired_at: new Date().toISOString(),
      snoozed_until: snoozedUntil,
      evidence_json: JSON.stringify(alert.evidenceData),
    };
    await localDb.saveCorrelationEvent(record);
    await loadPetData(activePet);
  };

  const handleSaveVetBrief = async (record: VetBriefRecord) => {
    await localDb.saveVetBrief(record);
  };

  const handleCreatePet = async (newPet: PetRecord) => {
    await localDb.savePet(newPet);
    const updatedPets = [...pets, newPet];
    setPets(updatedPets);
    await localDb.saveSetting('activePetId', newPet.id);
    setActivePet(newPet);
    await loadPetData(newPet);
  };

  const handleUpdateTier = async (newTier: 'free' | 'paid') => {
    setAppTier(newTier);
    await localDb.saveSetting('appTier', newTier);
  };

  const handleRecordSleepingBreathingRate = async (rate: number) => {
    if (!activePet) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckIn = checkIns.find((c) => c.date === todayStr);

    if (todayCheckIn) {
      const updated: DailyCheckIn = {
        ...todayCheckIn,
        restingBreathingRate: rate,
      };
      await localDb.saveCheckIn(updated);
    } else {
      const newCheckIn: DailyCheckIn = {
        id: `checkin_${activePet.id}_${todayStr}_${Date.now()}`,
        petId: activePet.id,
        date: todayStr,
        timestamp: Date.now(),
        loggedByUserId: currentUserId,
        loggedByUserName: currentUserName,
        userRole: currentUserRole,
        appetite: 4,
        waterIntake: 3,
        energyActivity: 3,
        mobilityStiffness: 3,
        comfortPain: 4,
        stoolQuality: 4,
        restingBreathingRate: rate,
        isGoodDay: true,
      };
      await localDb.saveCheckIn(newCheckIn);
    }
    await loadPetData(activePet);
  };

  if (isLoading || !activePet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-amber-800 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Loading offline pet records...</span>
        </div>
      </div>
    );
  }

  const speciesPathway = resolveSpeciesPathway(activePet);
  const cognitiveSchedule = evaluateCognitiveSchedule(activePet, cognitiveLogs);
  const evaluatedCorrelations = evaluateCorrelations({
    pet: activePet,
    checkIns,
    events,
    medications,
    doses,
    cognitiveLogs,
    storedCorrelationEvents: correlationEvents,
  });
  const activeCorrelation = evaluatedCorrelations.find((c) => !c.isSnoozed) || null;

  const changeBrief: WeeklyChangeBrief = generateWeeklyChangeBrief(
    activePet.id,
    activePet.name,
    checkIns,
    events,
    speciesPathway
  );

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateStr = yesterday.toISOString().split('T')[0];
  const yesterdayCheckIn = checkIns.find((c) => c.date === yesterdayDateStr);
  const yesterdayNeedsBackfill = !yesterdayCheckIn;

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find((c) => c.date === todayDateStr);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1F2421]">
      <OfflineIndicator />

      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activePet={activePet}
        allPets={pets}
        onSelectPet={handleSelectPet}
        onOpenNewPet={() => setShowNewPetModal(true)}
        onOpenCheckIn={() => setShowCheckInModal(true)}
        onOpenQuickEvent={() => setShowQuickEventModal(true)}
        onOpenVetExport={() => setShowVetExportModal(true)}
        onOpenPaywall={() => setShowPaywallModal(true)}
        userRole={currentUserRole}
        tier={appTier}
        cognitiveDue={cognitiveSchedule.isDueNow}
      />

      <main className={`flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-12 ${showVetExportModal ? 'no-print' : ''}`}>
        {currentTab === 'overview' && (
          <div className="space-y-4 sm:space-y-5">
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D4] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-amber-800">
                  {speciesPathway === 'cat' ? 'Cat' : 'Dog'} · {activePet.breed} ·{' '}
                  {activePet.age_unknown
                    ? 'Age unknown'
                    : `${activePet.ageYears} yrs${activePet.age_estimated ? ' (est.)' : ''}`}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {activePet.name}
                </h1>
                <p className="text-sm sm:text-xs text-slate-600">
                  {todayCheckIn ? (
                    <span className="text-emerald-800 font-semibold">
                      ✓ Today logged ({todayCheckIn.isGoodDay ? 'Good Day' : 'Harder Day'})
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold">
                      Today’s 20-second check-in is open
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setShowCheckInModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all min-h-[48px]"
                >
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{todayCheckIn ? 'Today’s Log' : 'Daily Check-In'}</span>
                </button>

                <button
                  onClick={() => setShowQuickEventModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F5F2EB] hover:bg-[#EAE5D9] text-slate-800 font-bold text-xs border border-[#D5D0C4] transition-all min-h-[48px]"
                >
                  <PlusCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Log Event</span>
                </button>
              </div>
            </div>

            <WeeklyBriefCard
              brief={changeBrief}
              petName={activePet.name}
              speciesPathway={speciesPathway}
              cognitiveSchedule={cognitiveSchedule}
              activeCorrelation={activeCorrelation}
              onStartCognitiveScreen={() => setCurrentTab('cognitive')}
              onSnoozeCorrelation={handleSnoozeCorrelation}
              onOpenVetExport={() => setShowVetExportModal(true)}
            />

            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D4] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-bold uppercase tracking-wider text-slate-800">Past 7 Days Pattern</h3>
                <span className="text-slate-500">Tap date to inspect</span>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const dStr = d.toISOString().split('T')[0];
                  const cIn = checkIns.find((c) => c.date === dStr);
                  const isToday = i === 6;

                  return (
                    <button
                      key={dStr}
                      onClick={() => setShowCheckInModal(true)}
                      className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[68px] ${
                        cIn?.isGoodDay === true
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-bold'
                          : cIn?.isGoodDay === false
                          ? 'border-amber-300 bg-amber-50 text-amber-950 font-bold'
                          : 'border-dashed border-[#D5D0C4] bg-[#FDFBF7] text-slate-400'
                      }`}
                    >
                      <span className="text-[11px] sm:text-[10px] uppercase font-semibold text-slate-500">
                        {d.toLocaleDateString([], { weekday: 'narrow' })}
                      </span>
                      <span className="text-sm sm:text-xs font-mono font-bold mt-0.5">{d.getDate()}</span>
                      <span className="text-[10px] sm:text-[9px] mt-0.5">
                        {cIn ? (cIn.isGoodDay ? 'Good' : 'Hard') : isToday ? 'Today' : 'Missed'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E0D4] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Recent Structured Observations ({events.length} logged)
                </h3>
                <button
                  onClick={() => setShowQuickEventModal(true)}
                  className="text-xs font-semibold text-amber-900 hover:underline min-h-[36px] flex items-center"
                >
                  + Add Observation
                </button>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No observations logged yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {events.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4] text-sm sm:text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">{ev.eventName}</span>
                          <span className="text-slate-400">·</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] sm:text-[10px] font-bold uppercase ${
                            ev.severity === 'severe'
                              ? 'bg-amber-100 text-amber-900'
                              : ev.severity === 'moderate'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {ev.severity}
                          </span>
                        </div>
                        {ev.notes && <p className="text-slate-600 leading-snug">"{ev.notes}"</p>}
                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-[11px] text-slate-400">
                          <span>Logged by {ev.loggedByUserName} ({ev.userRole})</span>
                          {ev.voiceNoteAudioUrl && (
                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                              <Volume2 className="w-3.5 h-3.5 text-amber-800" />
                              <span>Voice memo ({ev.voiceNoteDurationSeconds}s)</span>
                            </span>
                          )}
                          {ev.photoDataUrl && (
                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                              <Camera className="w-3.5 h-3.5 text-amber-800" />
                              <span>Photo attached</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs sm:text-[11px] font-mono text-slate-500 shrink-0">
                        {new Date(ev.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'trends' && (
          <BaselineTrendsView
            pet={activePet}
            checkIns={checkIns}
            onRecordBreathingRate={handleRecordSleepingBreathingRate}
          />
        )}

        {currentTab === 'meds' && (
          <MedicationTracker
            petId={activePet.id}
            petName={activePet.name}
            medications={medications}
            doses={doses}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
            onRecordDose={handleRecordDose}
            onAddMedication={handleAddMedication}
          />
        )}

        {currentTab === 'cognitive' && (
          <CognitiveScreeningView
            pet={activePet}
            cognitiveLogs={cognitiveLogs}
            currentUserName={currentUserName}
            onSaveAssessment={handleSaveCognitiveAssessment}
            onUpdatePetAge={handleUpdatePetAge}
            onOpenVetExport={() => setShowVetExportModal(true)}
          />
        )}

        {currentTab === 'qol' && (
          <QualityOfLifeView
            pet={activePet}
            qolLogs={qolLogs}
            checkIns={checkIns}
            currentUserName={currentUserName}
            onSaveAssessment={handleSaveQoLAssessment}
            onUpdateGoalsOfCare={handleUpdateGoalsOfCare}
          />
        )}

        {currentTab === 'circle' && (
          <CareCircleManager
            petId={activePet.id}
            petName={activePet.name}
            careCircle={careCircle}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            events={events}
            checkIns={checkIns}
            doses={doses}
            onSwitchUser={handleSwitchUser}
            onInviteMember={async (m) => {
              await localDb.saveCareCircleMember(m);
              setCareCircle((prev) => [...prev, m]);
            }}
          />
        )}
      </main>

      {showCheckInModal && (
        <DailyCheckInModal
          petId={activePet.id}
          petName={activePet.name}
          speciesPathway={speciesPathway}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
          yesterdayNeedsBackfill={yesterdayNeedsBackfill}
          yesterdayDateStr={yesterdayDateStr}
          onSave={handleSaveCheckIn}
          onClose={() => setShowCheckInModal(false)}
        />
      )}

      {showQuickEventModal && (
        <QuickEventModal
          petId={activePet.id}
          petName={activePet.name}
          speciesPathway={speciesPathway}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
          onSave={handleSaveEvent}
          onClose={() => setShowQuickEventModal(false)}
        />
      )}

      {showVetExportModal && (
        <VetExportModal
          pet={activePet}
          checkIns={checkIns}
          events={events}
          medications={medications}
          doses={doses}
          cognitiveLogs={cognitiveLogs}
          qolLogs={qolLogs}
          brief={changeBrief}
          correlations={evaluatedCorrelations}
          careCircle={careCircle}
          onSaveVetBrief={handleSaveVetBrief}
          onClose={() => setShowVetExportModal(false)}
        />
      )}

      {showPaywallModal && (
        <PaywallModal
          currentTier={appTier}
          onUpdateTier={handleUpdateTier}
          onClose={() => setShowPaywallModal(false)}
        />
      )}

      {showNewPetModal && (
        <NewPetModal
          onSave={handleCreatePet}
          onClose={() => setShowNewPetModal(false)}
        />
      )}
    </div>
  );
}
