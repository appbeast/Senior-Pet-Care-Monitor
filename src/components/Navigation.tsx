import React from 'react';
import { Home, Calendar, PlusCircle, Pill, Activity, Brain, Heart, FileText, Sparkles, ChevronDown } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { PetRecord, UserRole } from '../types';

export type NavTab = 'overview' | 'checkin' | 'events' | 'meds' | 'trends' | 'cognitive' | 'qol' | 'circle';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activePet: PetRecord;
  allPets: PetRecord[];
  onSelectPet: (petId: string) => void;
  onOpenNewPet: () => void;
  onOpenCheckIn: () => void;
  onOpenQuickEvent: () => void;
  onOpenVetExport: () => void;
  onOpenPaywall: () => void;
  userRole: UserRole;
  tier: 'free' | 'paid';
  cognitiveDue?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activePet,
  allPets,
  onSelectPet,
  onOpenNewPet,
  onOpenCheckIn,
  onOpenQuickEvent,
  onOpenVetExport,
  userRole,
  cognitiveDue = false,
}) => {
  const [showPetDropdown, setShowPetDropdown] = React.useState(false);

  return (
    <>
      {/* Top Application Bar - Minimalist 3-zone header */}
      <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E5E0D4] no-print">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3 lg:gap-4">
          {/* Zone 1: Minimalist Wordmark + Pet Switcher (shrink-0 prevents any overlap) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('overview');
              }}
              className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700 inline-block shrink-0" />
              <span>PetMonitor</span>
            </a>

            {/* Pet Switcher dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowPetDropdown(!showPetDropdown)}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-semibold text-slate-800 bg-[#F5F2EB] hover:bg-[#EAE5D9] rounded-lg transition-colors border border-[#E5E0D4] min-h-[36px] max-w-[105px] sm:max-w-[120px] xl:max-w-[150px]"
              >
                <span className="truncate">{activePet.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {showPetDropdown && (
                <div className="absolute left-0 mt-1 w-52 rounded-xl bg-white border border-[#E5E0D4] shadow-lg py-1.5 z-40">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Senior Pet
                  </div>
                  {allPets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPet(p.id);
                        setShowPetDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                        p.id === activePet.id ? 'bg-[#F5F2EB] text-slate-900 font-bold' : 'text-slate-700 hover:bg-[#FDFBF7]'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {p.species_pathway === 'cat' || p.species === 'feline' ? 'Cat' : 'Dog'}
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-[#E5E0D4] mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowPetDropdown(false);
                        onOpenNewPet();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                    >
                      + Add Another Pet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Minimalist Desktop Navigation (lg+ only so narrow computer windows never collide) */}
          <nav className="hidden lg:flex items-center justify-center gap-3.5 xl:gap-6 text-[13px] xl:text-sm font-medium text-slate-600 shrink-0">
            <button
              onClick={() => onSelectTab('overview')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'overview' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : ''
              }`}
            >
              Brief
            </button>
            <button
              onClick={() => onSelectTab('trends')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'trends' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : ''
              }`}
            >
              Baselines
            </button>
            <button
              onClick={() => onSelectTab('meds')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'meds' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : ''
              }`}
            >
              Meds
            </button>
            <button
              onClick={() => onSelectTab('cognitive')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 inline-flex items-center gap-1.5 ${
                currentTab === 'cognitive' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : ''
              }`}
            >
              <span>Cognitive</span>
              {cognitiveDue && (
                <span className="w-2 h-2 rounded-full bg-amber-700 inline-block" title="Scheduled cognitive check due" />
              )}
            </button>
            <button
              onClick={() => onSelectTab('qol')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'qol' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : ''
              }`}
            >
              Quality of Life
            </button>
            <button
              onClick={() => onSelectTab('circle')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === 'circle' ? 'text-slate-900 font-bold border-b-2 border-slate-900' : ''
              }`}
            >
              Care Circle
            </button>
          </nav>

          {/* Zone 3: Icon-only Install & Pre-Visit Brief on mobile; labeled on sm+ */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={onOpenVetExport}
              title="Pre-Visit Vet Brief"
              aria-label="Pre-Visit Vet Brief"
              className="inline-flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:px-3 sm:py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <FileText className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Pre-Visit Brief</span>
            </button>
          </div>
        </div>

        {/* Clean Section Switcher for mobile & narrow computer/tablet windows (< 1024px) */}
        <div className="lg:hidden border-t border-[#EFECE3] px-3 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-5 text-xs font-medium text-slate-500 min-w-max">
            {(
              [
                { id: 'overview', label: 'Brief' },
                { id: 'trends', label: 'Baselines' },
                { id: 'meds', label: 'Meds' },
                { id: 'cognitive', label: 'Cognitive', dot: cognitiveDue },
                { id: 'qol', label: 'Quality of Life' },
                { id: 'circle', label: 'Care Circle' },
              ] as { id: NavTab; label: string; dot?: boolean }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-2.5 inline-flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  currentTab === item.id
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-amber-700 inline-block" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Fixed Bottom Touch Navigation Bar (Mobile Ergonomics) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#E5E0D4] pb-safe no-print">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
          {/* Tab 1: Brief */}
          <button
            onClick={() => onSelectTab('overview')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              currentTab === 'overview' ? 'text-amber-900 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Brief</span>
          </button>

          {/* Tab 2: Daily Check-In Trigger */}
          <button
            onClick={onOpenCheckIn}
            className="flex flex-col items-center justify-center h-full min-h-[44px] text-emerald-800 font-bold"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-800" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Check-In</span>
          </button>

          {/* Tab 3: Structured Observation Event Trigger */}
          <button
            onClick={onOpenQuickEvent}
            className="flex flex-col items-center justify-center h-full min-h-[44px] text-amber-900 font-bold"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <PlusCircle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">+ Observation</span>
          </button>

          {/* Tab 4: Meds & Fluids */}
          <button
            onClick={() => onSelectTab('meds')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              currentTab === 'meds' ? 'text-amber-900 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Pill className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Meds</span>
          </button>

          {/* Tab 5: Health & Trends */}
          <button
            onClick={() => onSelectTab('trends')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              currentTab === 'trends' || currentTab === 'cognitive' || currentTab === 'qol'
                ? 'text-amber-900 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">Baselines</span>
          </button>
        </div>
      </nav>
    </>
  );
};
