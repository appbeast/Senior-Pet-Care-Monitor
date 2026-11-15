import React, { useState } from 'react';
import { Users, UserCheck, Shield, Eye, Plus, Copy, Check, MessageSquare, History, Sparkles } from 'lucide-react';
import { CareCircleMember, UserRole, PetEvent, DailyCheckIn, DoseLog } from '../types';

interface CareCircleManagerProps {
  petId: string;
  petName: string;
  careCircle: CareCircleMember[];
  currentUserRole: UserRole;
  currentUserId: string;
  events: PetEvent[];
  checkIns: DailyCheckIn[];
  doses: DoseLog[];
  onSwitchUser: (userId: string, role: UserRole) => void;
  onInviteMember: (member: CareCircleMember) => Promise<void>;
}

export const CareCircleManager: React.FC<CareCircleManagerProps> = ({
  petId,
  petName,
  careCircle,
  currentUserRole,
  currentUserId,
  events,
  checkIns,
  doses,
  onSwitchUser,
  onInviteMember,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [sitterLookbackDays, setSitterLookbackDays] = useState<number>(7);

  // Compute "What did I miss?" summary for a returning caregiver
  const now = Date.now();
  const lookbackCutoff = now - sitterLookbackDays * 86400000;
  const recentEvents = events.filter((e) => e.timestamp >= lookbackCutoff);
  const recentDoses = doses.filter((d) => d.timestamp >= lookbackCutoff);
  const skippedDoses = recentDoses.filter((d) => d.status === 'skipped');
  const recentCheckIns = checkIns.filter((c) => c.timestamp >= lookbackCutoff);
  const hardDays = recentCheckIns.filter((c) => !c.isGoodDay);

  const handleCopyInvite = async () => {
    const inviteLink = `${window.location.origin}/?invite_circle=${petName.toLowerCase()}_care_team`;
    await navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#F5F2EB] border border-[#E5E0D4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Shared Care Log</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-600 font-medium">Multi-Caregiver Coordination</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{petName}'s Care Circle</h2>
            <p className="text-sm sm:text-xs text-slate-600 mt-0.5">
              Prevent duplicate doses and keep partners, sitters, and veterinary clinicians in sync.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyInvite}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-[#D5D0C4] hover:bg-[#FDFBF7] text-slate-700 text-xs font-semibold min-h-[44px]"
            >
              {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copiedInvite ? 'Link Copied' : 'Invite Link'}</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Active Role Switcher (Simulates Care Circle switching) */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E0D4] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Active User Switcher (Simulator)
            </span>
            <span className="text-slate-500">
              Current: <strong className="text-slate-900 font-semibold">{currentUserRole.toUpperCase()}</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {careCircle.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onSwitchUser(member.id, member.role)}
                className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between min-h-[54px] ${
                  currentUserId === member.id
                    ? 'border-slate-800 bg-slate-900 text-white shadow-xs'
                    : 'border-[#E5E0D4] bg-[#FDFBF7] text-slate-700 hover:bg-[#F5F2EB]'
                }`}
              >
                <span className="font-bold truncate">{member.name}</span>
                <span className={`text-[10px] capitalize font-medium ${
                  currentUserId === member.id ? 'text-amber-300' : 'text-slate-500'
                }`}>
                  {member.role} {currentUserId === member.id ? '(Active)' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sitter Returning: "What Did I Miss?" Summary */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E0D4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">“What Did I Miss?” Sitter Brief</h3>
              <p className="text-xs text-slate-500">
                Key occurrences over the past {sitterLookbackDays} days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#F5F2EB] p-1 rounded-xl">
            {[3, 7, 14].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSitterLookbackDays(d)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors min-h-[34px] ${
                  sitterLookbackDays === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4]">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
              Observations Logged
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {recentEvents.length}
            </div>
            <span className="text-slate-600 text-[11px]">
              {recentEvents.filter((e) => e.severity === 'moderate' || e.severity === 'severe').length} notable
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4]">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
              Medication Skipped
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {skippedDoses.length}
            </div>
            <span className="text-slate-600 text-[11px]">
              {skippedDoses.length === 0 ? '100% adherence' : 'Doses held or refused'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#E5E0D4]">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold">
              Harder Days Recorded
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {hardDays.length}
            </div>
            <span className="text-slate-600 text-[11px]">
              Out of {recentCheckIns.length} logged check-ins
            </span>
          </div>
        </div>

        {/* Recent Notable Events Feed */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Timeline Feed (Past {sitterLookbackDays} Days)
          </h4>
          {recentEvents.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No events logged during this window.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-[#FDFBF7] border border-[#E5E0D4] text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{ev.eventName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="capitalize text-slate-500 text-[11px]">{ev.severity}</span>
                    </div>
                    {ev.notes && <p className="text-slate-600 italic">"{ev.notes}"</p>}
                    <span className="text-[10px] text-slate-400 block">
                      Logged by {ev.loggedByUserName} ({ev.userRole})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(ev.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          petId={petId}
          onSave={async (m) => {
            await onInviteMember(m);
            setShowInviteModal(false);
          }}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

const InviteMemberModal: React.FC<{
  petId: string;
  onSave: (member: CareCircleMember) => Promise<void>;
  onClose: () => void;
}> = ({ petId, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('caregiver');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMember: CareCircleMember = {
      id: `user_${Date.now()}`,
      petId,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@careteam.org`,
      role,
      joinedAt: new Date().toISOString().split('T')[0],
      isCurrentDeviceUser: false,
    };

    await onSave(newMember);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#FDFBF7] border border-[#E5E0D4] p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-slate-900">Invite Care Circle Member</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma Joan, Maya (Pet Sitter)"
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. joan@family.com"
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role & Permissions</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5D0C4] bg-white text-slate-900"
            >
              <option value="caregiver">Caregiver (can log meds, check-ins & events)</option>
              <option value="viewer">Viewer (read-only logs & vet summaries)</option>
              <option value="owner">Owner (full administrative & billing permissions)</option>
            </select>
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
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
