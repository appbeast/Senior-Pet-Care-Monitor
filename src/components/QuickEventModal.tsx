import React, { useState, useRef } from 'react';
import { X, Mic, Square, Camera, Check, Play, Pause, Trash2 } from 'lucide-react';
import { PetEvent, EventSeverity, EventCategory, UserRole, SpeciesPathway } from '../types';
import {
  getEventCategoriesForSpecies,
  getEventTaxonomyForSpecies,
  getTopLevelEventsForSpecies,
} from '../data/eventTaxonomy';
import { VoiceNoteRecorder } from '../services/audioRecorder';

interface QuickEventModalProps {
  petId: string;
  petName: string;
  speciesPathway: SpeciesPathway;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRole;
  onSave: (event: PetEvent) => Promise<void>;
  onClose: () => void;
}

export const QuickEventModal: React.FC<QuickEventModalProps> = ({
  petId,
  petName,
  speciesPathway,
  currentUserId,
  currentUserName,
  currentUserRole,
  onSave,
  onClose,
}) => {
  const categories = getEventCategoriesForSpecies(speciesPathway);
  const taxonomy = getEventTaxonomyForSpecies(speciesPathway);
  const topLevelEvents = getTopLevelEventsForSpecies(speciesPathway);

  const defaultCategory: EventCategory = 'cognitive';
  const defaultEvent = topLevelEvents[0] || taxonomy.find((e) => e.category === defaultCategory) || taxonomy[0];

  const [selectedCategory, setSelectedCategory] = useState<EventCategory>(defaultEvent.category);
  const [selectedEventId, setSelectedEventId] = useState<string>(defaultEvent.id);
  const [severity, setSeverity] = useState<EventSeverity>(defaultEvent.defaultSeverity);
  const [notes, setNotes] = useState<string>('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<VoiceNoteRecorder>(new VoiceNoteRecorder());
  const timerIntervalRef = useRef<number | null>(null);

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentCategoryEvents = taxonomy.filter((e) => e.category === selectedCategory);
  const currentEvent = taxonomy.find((e) => e.id === selectedEventId) || currentCategoryEvents[0];

  const handleCategorySelect = (cat: EventCategory) => {
    setSelectedCategory(cat);
    const firstInCat = taxonomy.find((e) => e.category === cat);
    if (firstInCat) {
      setSelectedEventId(firstInCat.id);
      setSeverity(firstInCat.defaultSeverity);
    }
  };

  const handleEventSelect = (id: string) => {
    setSelectedEventId(id);
    const ev = taxonomy.find((e) => e.id === id);
    if (ev) {
      setSelectedCategory(ev.category);
      setSeverity(ev.defaultSeverity);
    }
  };

  const startVoiceRecording = async () => {
    const success = await recorderRef.current.startRecording(10, async () => {
      stopVoiceRecording();
    });

    if (success) {
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => Math.min(10, prev + 1));
      }, 1000);
    }
  };

  const stopVoiceRecording = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
    const result = await recorderRef.current.stopRecording();
    if (result) {
      setRecordedAudioUrl(result.audioUrl);
      setRecordedAudioDuration(result.durationSeconds);
    }
  };

  const removeVoiceNote = () => {
    setRecordedAudioUrl(null);
    setRecordedAudioDuration(0);
    setIsPlayingAudio(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current || !recordedAudioUrl) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    setIsSaving(true);
    try {
      const newEvent: PetEvent = {
        id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        petId,
        timestamp: Date.now(),
        eventTypeId: currentEvent.id,
        eventName: currentEvent.name,
        category: currentEvent.category,
        severity,
        notes: notes.trim() || undefined,
        photoDataUrl: photoDataUrl || undefined,
        voiceNoteAudioUrl: recordedAudioUrl || undefined,
        voiceNoteDurationSeconds: recordedAudioDuration || undefined,
        loggedByUserId: currentUserId,
        loggedByUserName: currentUserName,
        userRole: currentUserRole,
        syncState: 'synced',
      };
      await onSave(newEvent);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl border border-[#E5E0D4] shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 bg-[#FDFBF7]/95 backdrop-blur-xs px-5 py-4 border-b border-[#E5E0D4] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                {speciesPathway === 'cat' ? 'Feline Senior Observation' : 'Canine Senior Observation'}
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-600 font-medium">{petName}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">Log Senior Event</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 flex-1">
          {/* Top-Level Species Quick Picks (Night Vocalisation first for cats; Disorientation first for dogs) */}
          {topLevelEvents.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2">
                Top {speciesPathway === 'cat' ? 'Cat' : 'Dog'} Senior Signs (1-Tap)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {topLevelEvents.map((topEv) => (
                  <button
                    key={topEv.id}
                    type="button"
                    onClick={() => handleEventSelect(topEv.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all min-h-[46px] ${
                      selectedEventId === topEv.id
                        ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                        : 'bg-amber-50/70 text-amber-950 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {topEv.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Selector Grid (2x2 rows on mobile) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Clinical Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-center leading-snug transition-all min-h-[48px] flex items-center justify-center ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-[#F5F2EB] text-slate-800 hover:bg-[#EAE5D9] border border-[#E5E0D4]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Event Items in Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              2. Specific Observation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {currentCategoryEvents.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleEventSelect(item.id)}
                  className={`p-3.5 rounded-xl text-left border transition-all text-sm sm:text-xs flex flex-col justify-between min-h-[60px] ${
                    selectedEventId === item.id
                      ? 'border-amber-700 bg-amber-50/70 text-slate-900 font-semibold shadow-xs'
                      : 'border-[#E5E0D4] bg-white text-slate-700 hover:bg-[#F5F2EB]'
                  }`}
                >
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <span className="text-xs sm:text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.plainLanguageTitle}</span>
                </button>
              ))}
            </div>
          </div>

          {currentEvent && (
            <div className="p-3.5 rounded-2xl bg-[#F5F2EB] border border-[#E5E0D4] text-xs space-y-1">
              <p className="text-slate-800 font-medium">{currentEvent.observationPrompt}</p>
              <p className="text-slate-500 text-[11px] italic">{currentEvent.clinicalNote}</p>
              {currentEvent.suggestedAction && (
                <p className="text-amber-900 font-medium pt-1 text-[11px]">
                  Advisory note: {currentEvent.suggestedAction}
                </p>
              )}
            </div>
          )}

          {/* Severity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              3. Severity / Prominence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['mild', 'moderate', 'severe'] as EventSeverity[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all min-h-[44px] ${
                    severity === sev
                      ? sev === 'severe'
                        ? 'bg-amber-900 text-white'
                        : sev === 'moderate'
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-white'
                      : 'bg-[#F5F2EB] text-slate-700 hover:bg-[#EAE5D9]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              4. Notes & Context (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                speciesPathway === 'cat'
                  ? 'e.g. Loud meowing outside bedroom around 2:30am...'
                  : 'e.g. Stood confused near back door after nap...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C4] bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Voice Memo & Photo */}
          <div className="pt-2 border-t border-[#E5E0D4] space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              5. Voice Memo & Photo (Offline Stored)
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {!recordedAudioUrl ? (
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-[#F5F2EB] text-slate-800 border border-[#D5D0C4] hover:bg-[#EAE5D9]'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>Stop ({recordingSeconds}s / 10s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-amber-700" />
                      <span>Record 10s Voice Memo</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[#F5F2EB] px-3 py-1.5 rounded-xl border border-[#E5E0D4] text-xs">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900"
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-slate-700 font-medium">Voice note ({recordedAudioDuration}s)</span>
                  <button
                    type="button"
                    onClick={removeVoiceNote}
                    className="p-1 text-slate-400 hover:text-red-700"
                    title="Delete voice note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <audio
                    ref={audioPlayerRef}
                    src={recordedAudioUrl}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />

              {!photoDataUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F5F2EB] text-slate-800 border border-[#D5D0C4] hover:bg-[#EAE5D9] transition-all min-h-[44px]"
                >
                  <Camera className="w-4 h-4 text-amber-700" />
                  <span>Attach Photo</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[#F5F2EB] px-3 py-1.5 rounded-xl border border-[#E5E0D4] text-xs">
                  <img src={photoDataUrl} alt="Attached event preview" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="text-slate-700 font-medium">Photo attached</span>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="p-1 text-slate-400 hover:text-red-700"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Logging as: <strong className="text-slate-700 font-semibold">{currentUserName}</strong> ({currentUserRole})</span>
            <span>Local & Offline Safe</span>
          </div>

          <div className="sticky bottom-0 bg-[#FDFBF7] pt-2 pb-safe">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Check className="w-5 h-5 text-emerald-400" />
              <span>{isSaving ? 'Saving...' : 'Save Observation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
