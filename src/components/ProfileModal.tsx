import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { MemberProfile } from '../types/club.ts';

interface ProfileModalProps {
  open: boolean;
  profile: MemberProfile | null;
  onClose: () => void;
  onSave: (data: { displayName: string; pacePreference: string }) => Promise<void>;
}

export function ProfileModal({ open, profile, onClose, onSave }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [pacePreference, setPacePreference] = useState('5:30 /km');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !profile) return;
    setDisplayName(profile.displayName);
    setPacePreference(profile.pacePreference);
    setError(null);
  }, [open, profile]);

  if (!open || !profile) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave({
        displayName: displayName.trim(),
        pacePreference: pacePreference.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="bg-white border border-[#E5E5E0] rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-[#E5E5E0] flex items-center justify-between gap-4">
          <h2
            id="profile-modal-title"
            className="font-display text-3xl font-bold tracking-tight text-[#111315]"
          >
            Runner Profile
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Close profile dialog"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md text-[#525860] hover:text-[#111315] hover:bg-[#F1F2EE] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
            >
              {error}
            </div>
          )}

          <div>
            <p className="text-xs text-[#525860]">Account email</p>
            <p className="mt-0.5 text-sm font-medium text-[#111315]">{profile.email}</p>
          </div>

          <div>
            <label
              htmlFor="member-name"
              className="block text-sm font-medium text-[#111315] mb-1.5"
            >
              Club display name
            </label>
            <input
              id="member-name"
              type="text"
              required
              minLength={2}
              maxLength={60}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm text-[#111315] focus:outline-none focus:border-[#111315]"
            />
          </div>

          <div>
            <label
              htmlFor="member-pace"
              className="block text-sm font-medium text-[#111315] mb-1.5"
            >
              Usual cruising pace
            </label>
            <input
              id="member-pace"
              type="text"
              required
              minLength={2}
              maxLength={30}
              value={pacePreference}
              onChange={(e) => setPacePreference(e.target.value)}
              placeholder="e.g., 5:20 /km"
              className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm font-mono tabular-nums text-[#111315] focus:outline-none focus:border-[#111315]"
            />
          </div>

          <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 min-h-[40px] border border-[#DCDCD5] hover:border-[#111315] text-sm font-semibold text-[#111315] rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 min-h-[40px] bg-[#111315] hover:bg-[#262A30] disabled:opacity-60 text-white text-sm font-semibold rounded-md cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
