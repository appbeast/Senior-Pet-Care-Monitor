import React, { useState } from 'react';
import { X, Check, ShieldCheck, Heart, Sparkles, Download } from 'lucide-react';

interface PaywallModalProps {
  currentTier: 'free' | 'paid';
  onUpdateTier: (tier: 'free' | 'paid') => Promise<void>;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  currentTier,
  onUpdateTier,
  onClose,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleTier = async () => {
    setIsUpdating(true);
    try {
      const nextTier = currentTier === 'paid' ? 'free' : 'paid';
      await onUpdateTier(nextTier);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Transparent Pricing</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-600 font-medium">No Dark Patterns</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Senior Pet Care Membership</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              One simple annual plan. Exporting and logging data are always 100% free.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-[#F5F2EB]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Tier */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E0D4] space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Free Forever</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">$0</div>
              <p className="text-[11px] text-slate-500">Core data logging & export</p>
            </div>
            <ul className="text-xs space-y-2 text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited daily check-ins</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited 75+ event logging</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Full history & raw CSV export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1 pet & 2 care circle members</span>
              </li>
            </ul>
          </div>

          {/* Paid Annual Tier */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-600 space-y-3 relative">
            <div>
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Senior Care Annual</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                $24 <span className="text-xs font-normal text-slate-600">/ year</span>
              </div>
              <p className="text-[11px] text-amber-900/80">Billed annually · No weekly tricks</p>
            </div>
            <ul className="text-xs space-y-2 text-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Unlimited senior pets</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Unlimited Care Circle team</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Weekly Flagship Change Briefs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-700 shrink-0" />
                <span>4-Week Cognitive & QoL trends</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Single-page printable Vet Export</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Guarantees */}
        <div className="p-3.5 rounded-2xl bg-[#F5F2EB] border border-[#E5E0D4] text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Zero Lock-in & Portability Guarantee</span>
          </div>
          <p className="leading-relaxed">
            Your observations belong to you. We never gate your ability to export full records, download CSVs, or delete your account. Cancel anytime with a single tap.
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleToggleTier}
            disabled={isUpdating}
            className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <span>Updating Membership...</span>
            ) : currentTier === 'paid' ? (
              <span>Downgrade to Free Tier (Active: Annual Paid)</span>
            ) : (
              <span>Upgrade to Annual Membership ($24/year)</span>
            )}
          </button>
          <p className="text-[11px] text-center text-slate-400">
            Current Tier: <strong className="text-slate-700 capitalize">{currentTier}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
