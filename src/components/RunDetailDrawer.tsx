import { useEffect, useState } from 'react';
import { Check, MapPin, Pencil, Trash2, Users, X } from 'lucide-react';
import { RouteImage } from './RouteImage.tsx';
import {
  PACE_TIER_META,
  TERRAIN_META,
  formatDistance,
  formatLongDate,
  formatStartTime,
  getInitials,
} from '../lib/formatters.ts';
import type { ClubRun } from '../types/club.ts';

interface RunDetailDrawerProps {
  run: ClubRun | null;
  busy: boolean;
  onClose: () => void;
  onJoinWithNote: (runId: number, note: string | null) => Promise<void>;
  onLeaveRun: (runId: number) => Promise<void>;
  onEditRun: (run: ClubRun) => void;
  onDeleteRun: (runId: number) => Promise<void>;
}

export function RunDetailDrawer({
  run,
  busy,
  onClose,
  onJoinWithNote,
  onLeaveRun,
  onEditRun,
  onDeleteRun,
}: RunDetailDrawerProps) {
  const [note, setNote] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!run) return;
    setNote(run.userNote ?? '');
    setConfirmingDelete(false);
    setLocalError(null);
  }, [run]);

  useEffect(() => {
    if (!run) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [run, busy, onClose]);

  if (!run) return null;

  const terrainInfo = TERRAIN_META[run.terrain] ?? TERRAIN_META.road;
  const paceInfo = PACE_TIER_META[run.paceTier] ?? PACE_TIER_META.steady;
  const isFull = run.maxRunners !== null && run.rsvpCount >= run.maxRunners && !run.isGoing;

  const handleConfirmRsvp = async () => {
    setLocalError(null);
    try {
      await onJoinWithNote(run.id, note.trim() ? note.trim() : null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to update RSVP.');
    }
  };

  const handleLeave = async () => {
    setLocalError(null);
    try {
      await onLeaveRun(run.id);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to withdraw RSVP.');
    }
  };

  const handleDelete = async () => {
    setLocalError(null);
    try {
      await onDeleteRun(run.id);
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to cancel run.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-run-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="bg-white w-full max-w-xl h-full overflow-y-auto border-l border-[#E5E5E0] flex flex-col">
        {/* Header image */}
        <div className="relative h-56 shrink-0 bg-[#14171A]">
          <RouteImage
            src={terrainInfo.image}
            alt={`${run.title} — ${terrainInfo.alt}`}
            terrain={run.terrain}
            label={run.title}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
            aria-hidden="true"
          />
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close run details"
            className="absolute top-4 right-4 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md bg-black/55 hover:bg-black/75 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white space-y-1">
            <p className="text-xs font-medium text-white/85">
              {terrainInfo.label} · {paceInfo.label} ·{' '}
              <span className="font-mono tabular-nums">{run.paceTarget}</span>
            </p>
            <h2
              id="drawer-run-title"
              className="font-display text-3xl font-bold tracking-tight leading-tight"
            >
              {run.title}
            </h2>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-7 flex-1">
          {localError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
            >
              {localError}
            </div>
          )}

          {/* Structured metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-6 border-b border-[#E5E5E0]">
            <div>
              <p className="text-xs text-[#525860]">Date</p>
              <p className="mt-1 text-sm font-semibold text-[#111315]">
                {formatLongDate(run.runDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#525860]">Start time</p>
              <p className="mt-1 font-mono text-sm font-medium text-[#111315] tabular-nums">
                {formatStartTime(run.startTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#525860]">Distance</p>
              <p className="mt-1 font-mono text-sm font-medium text-[#111315] tabular-nums">
                {formatDistance(run.distanceKm)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-[#525860]">Meeting point</p>
              <p className="mt-1 text-sm font-medium text-[#111315] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D9411E] shrink-0" aria-hidden="true" />
                <span>{run.meetingPoint}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[#525860]">Pack size</p>
              <p className="mt-1 font-mono text-sm font-medium text-[#111315] tabular-nums">
                {run.rsvpCount}
                {run.maxRunners ? ` / ${run.maxRunners}` : ' joined'}
              </p>
            </div>
          </div>

          {/* Route Notes */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#111315]">Route notes</h3>
            <p className="text-sm text-[#4A5058] leading-relaxed whitespace-pre-line">
              {run.description}
            </p>
            <p className="text-xs text-[#525860] pt-1">
              Posted by <strong className="font-semibold text-[#111315]">{run.host.displayName}</strong>{' '}
              · Typical pace <span className="font-mono tabular-nums">{run.host.pacePreference}</span>
            </p>
          </div>

          {/* RSVP Control Block */}
          <div className="pt-6 border-t border-[#E5E5E0] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111315]">Your RSVP</h3>
              {run.isGoing && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Confirmed on roster
                </span>
              )}
            </div>

            <div>
              <label htmlFor="rsvp-note" className="sr-only">
                Optional runner note
              </label>
              <input
                id="rsvp-note"
                type="text"
                maxLength={140}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (e.g., Running first 8 km, bringing extra water)"
                className="w-full px-3.5 py-2.5 min-h-[42px] bg-[#F8F8F6] border border-[#DCDCD5] rounded-md text-sm text-[#111315] placeholder:text-[#787F87] focus:outline-none focus:bg-white focus:border-[#111315]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy || isFull}
                onClick={handleConfirmRsvp}
                className="px-5 py-2.5 min-h-[42px] bg-[#D9411E] hover:bg-[#BF3516] disabled:opacity-50 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {busy
                  ? 'Updating...'
                  : run.isGoing
                    ? 'Save Check-In Note'
                    : isFull
                      ? 'Run is Full'
                      : 'Confirm Spot'}
              </button>

              {run.isGoing && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleLeave}
                  className="px-4 py-2.5 min-h-[42px] border border-[#DCDCD5] hover:border-[#111315] text-sm font-semibold text-[#4A5058] hover:text-[#111315] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Leave Run
                </button>
              )}
            </div>
          </div>

          {/* Live Attendee Roster */}
          <div className="pt-6 border-t border-[#E5E5E0] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111315] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#525860]" aria-hidden="true" />
                <span>Runner Roster</span>
              </h3>
              <span className="font-mono text-xs text-[#525860] tabular-nums">
                {run.attendees.length} confirmed
              </span>
            </div>

            {run.attendees.length === 0 ? (
              <p className="text-sm text-[#525860]">No runners have signed up yet.</p>
            ) : (
              <ul className="divide-y divide-[#EFEFE9]">
                {run.attendees.map((attendee) => (
                  <li
                    key={attendee.userId}
                    className="py-3 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#EFEFE9] text-[#111315] text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                        {attendee.photoUrl ? (
                          <img
                            src={attendee.photoUrl}
                            alt={attendee.displayName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(attendee.displayName)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111315] truncate">
                          {attendee.displayName}
                          {attendee.userId === run.host.id && (
                            <span className="ml-2 text-xs font-medium text-[#D9411E]">Host</span>
                          )}
                        </p>
                        {attendee.note && (
                          <p className="text-xs text-[#525860] mt-0.5 break-words">
                            {attendee.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[#525860] tabular-nums shrink-0 pt-0.5">
                      {attendee.pacePreference}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Host Controls */}
          {run.isHost && (
            <div className="pt-6 border-t border-[#E5E5E0] space-y-3">
              <p className="text-xs font-medium text-[#525860]">Host Controls</p>

              {!confirmingDelete ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onEditRun(run)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] border border-[#DCDCD5] hover:border-[#111315] text-sm font-semibold text-[#111315] rounded-md transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    <span>Edit Run</span>
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmingDelete(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] border border-[#FECACA] hover:bg-[#FEF2F2] text-sm font-semibold text-[#B91C1C] rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Cancel Run</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] space-y-3">
                  <p className="text-sm text-[#991B1B]">
                    Cancel this run and remove all {run.rsvpCount} RSVPs from the board?
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleDelete}
                      className="px-4 py-2 min-h-[38px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      {busy ? 'Canceling...' : 'Confirm Cancel Run'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmingDelete(false)}
                      className="px-3.5 py-2 min-h-[38px] bg-white border border-[#DCDCD5] text-xs font-semibold text-[#111315] rounded-md hover:border-[#111315] cursor-pointer"
                    >
                      Keep Run
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
