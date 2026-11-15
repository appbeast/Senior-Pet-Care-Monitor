import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PetRecord, NeuterStatus, SpeciesPathway } from '../types';
import { getSpeciesPathwayCopy, speciesFromPathway } from '../services/speciesPathway';
import { computeFirstScreenDueAt, COGNITIVE_AGE_TRIGGER_CONFIG } from '../services/cognitiveScheduler';

interface NewPetModalProps {
  onSave: (pet: PetRecord) => Promise<void>;
  onClose: () => void;
}

export const NewPetModal: React.FC<NewPetModalProps> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [pathway, setPathway] = useState<SpeciesPathway>('dog');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState<number>(10);
  const [ageUnknown, setAgeUnknown] = useState(false);
  const [ageEstimated, setAgeEstimated] = useState(false);
  const [neuterStatus] = useState<NeuterStatus>('neutered');
  const [weightKg, setWeightKg] = useState<number>(18);

  const initialCopy = getSpeciesPathwayCopy(pathway);
  const [knownConditions, setKnownConditions] = useState<string>(initialCopy.onboardingDefaults.defaultConditions);
  const [currentDiet, setCurrentDiet] = useState<string>(initialCopy.onboardingDefaults.defaultDiet);
  const [goalsOfCare, setGoalsOfCare] = useState<string>(initialCopy.onboardingDefaults.defaultGoalsOfCare);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = getSpeciesPathwayCopy(pathway);
  const cogStartAge =
    pathway === 'cat'
      ? COGNITIVE_AGE_TRIGGER_CONFIG.catStartAgeYears
      : COGNITIVE_AGE_TRIGGER_CONFIG.dogStartAgeYears;

  const handleSelectPathway = (nextPathway: SpeciesPathway) => {
    setPathway(nextPathway);
    const nextCopy = getSpeciesPathwayCopy(nextPathway);
    setWeightKg(nextPathway === 'cat' ? 4.5 : 18);
    setKnownConditions(nextCopy.onboardingDefaults.defaultConditions);
    setCurrentDiet(nextCopy.onboardingDefaults.defaultDiet);
    setGoalsOfCare(nextCopy.onboardingDefaults.defaultGoalsOfCare);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const conditionsList = knownConditions
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const resolvedAge = ageUnknown ? (pathway === 'cat' ? 10 : 8) : ageYears;
      const species = speciesFromPathway(pathway);
      const birthDate = `${new Date().getFullYear() - resolvedAge}-01-01`;
      const firstScreenDueAt = computeFirstScreenDueAt({
        species,
        species_pathway: pathway,
        birthDate,
        ageYears: resolvedAge,
      });

      const newPet: PetRecord = {
        id: `pet_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: name.trim(),
        species,
        species_pathway: pathway,
        breed: breed.trim() || copy.onboardingDefaults.defaultBreed,
        birthDate,
        ageYears: resolvedAge,
        age_estimated: ageEstimated || ageUnknown,
        age_unknown: ageUnknown,
        first_screen_due_at: firstScreenDueAt,
        neuterStatus,
        currentWeightKg: weightKg,
        weightHistory: [
          {
            id: `w_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            weightKg,
            notes: 'Initial profile weight',
          },
        ],
        knownConditions: conditionsList,
        currentDiet: currentDiet.trim() || copy.onboardingDefaults.defaultDiet,
        goalsOfCareNote: goalsOfCare.trim() || undefined,
        goalsUpdatedAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      await onSave(newPet);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">45-Second Setup · Species-First</span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">Add Senior {copy.speciesLabel} Profile</h3>
            <p className="text-xs text-slate-500">
              Species selection sets the {copy.cognitiveInstrument} cognitive screen, event vocabulary, and vet brief template automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pet Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={pathway === 'cat' ? 'e.g. Cleo, Milo, Willow' : 'e.g. Luna, Buster, Oliver'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C4] bg-white text-sm text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Species Pathway</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPathway('dog')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
                    pathway === 'dog'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-[#D5D0C4] text-slate-700'
                  }`}
                >
                  Dog
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPathway('cat')}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
                    pathway === 'cat'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-[#D5D0C4] text-slate-700'
                  }`}
                >
                  Cat
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age in Years</label>
              <input
                type="number"
                min="1"
                max="30"
                disabled={ageUnknown}
                value={ageYears}
                onChange={(e) => setAgeYears(parseInt(e.target.value, 10) || 10)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5D0C4] bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Age Unknown / Estimated Helpers */}
          <div className="p-3 rounded-2xl bg-[#F5F2EB] border border-[#E5E0D4] space-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={ageEstimated}
                  onChange={(e) => setAgeEstimated(e.target.checked)}
                  className="rounded border-[#D5D0C4] accent-slate-900 w-4 h-4"
                />
                <span>Age is estimated</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={ageUnknown}
                  onChange={(e) => setAgeUnknown(e.target.checked)}
                  className="rounded border-[#D5D0C4] accent-slate-900 w-4 h-4"
                />
                <span>Age unknown (set reminder)</span>
              </label>
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              {ageUnknown
                ? `We’ll prompt you to estimate ${name || 'your pet'}’s age and schedule a 6-month ${copy.cognitiveInstrument} reminder.`
                : ageYears >= cogStartAge
                ? `Automatic ${copy.cognitiveInstrument} cognitive screening will activate immediately (starts at age ${cogStartAge} for ${copy.speciesLabel.toLowerCase()}s, every 6 months).`
                : `Automatic ${copy.cognitiveInstrument} screening will be scheduled when ${name || 'your pet'} reaches age ${cogStartAge}.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Breed / Mix</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder={copy.onboardingDefaults.breedPlaceholder}
                className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || (pathway === 'cat' ? 4.5 : 15))}
                className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Known Conditions (Comma-separated)
            </label>
            <input
              type="text"
              value={knownConditions}
              onChange={(e) => setKnownConditions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Initial Goals of Care Note
            </label>
            <textarea
              rows={2}
              value={goalsOfCare}
              onChange={(e) => setGoalsOfCare(e.target.value)}
              placeholder={`What matters most to your senior ${copy.speciesLabel.toLowerCase()}?`}
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#D5D0C4] font-semibold text-slate-700 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold min-h-[44px]"
            >
              {isSubmitting ? 'Creating...' : `Create ${copy.speciesLabel} Profile`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
