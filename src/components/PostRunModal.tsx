import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { getDefaultNextRunDate } from '../lib/formatters.ts';
import type { ClubRun, PaceTier, RunPayload, TerrainType } from '../types/club.ts';

interface PostRunModalProps {
  open: boolean;
  editingRun: ClubRun | null;
  onClose: () => void;
  onSubmit: (payload: RunPayload, editingRunId: number | null) => Promise<void>;
}

const PACE_DEFAULTS: Record<PaceTier, string> = {
  easy: '6:10 /km',
  steady: '5:30 /km',
  tempo: '4:50 /km',
  intervals: '4:15 /km',
};

export function PostRunModal({ open, editingRun, onClose, onSubmit }: PostRunModalProps) {
  const [title, setTitle] = useState('');
  const [runDate, setRunDate] = useState(getDefaultNextRunDate());
  const [startTime, setStartTime] = useState('06:30');
  const [distanceKm, setDistanceKm] = useState('10');
  const [terrain, setTerrain] = useState<TerrainType>('road');
  const [paceTier, setPaceTier] = useState<PaceTier>('steady');
  const [paceTarget, setPaceTarget] = useState('5:30 /km');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [maxRunners, setMaxRunners] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingRun) {
      setTitle(editingRun.title);
      setRunDate(editingRun.runDate);
      setStartTime(editingRun.startTime);
      setDistanceKm(String(editingRun.distanceKm));
      setTerrain(editingRun.terrain);
      setPaceTier(editingRun.paceTier);
      setPaceTarget(editingRun.paceTarget);
      setMeetingPoint(editingRun.meetingPoint);
      setMaxRunners(editingRun.maxRunners ? String(editingRun.maxRunners) : '');
      setDescription(editingRun.description);
    } else {
      setTitle('');
      setRunDate(getDefaultNextRunDate());
      setStartTime('06:30');
      setDistanceKm('10');
      setTerrain('road');
      setPaceTier('steady');
      setPaceTarget(PACE_DEFAULTS.steady);
      setMeetingPoint('');
      setMaxRunners('');
      setDescription('');
    }
  }, [open, editingRun]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const handlePaceTierChange = (nextTier: PaceTier) => {
    setPaceTier(nextTier);
    if (!editingRun) {
      setPaceTarget(PACE_DEFAULTS[nextTier]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedDistance = Number.parseFloat(distanceKm);
    if (!Number.isFinite(parsedDistance) || parsedDistance < 1 || parsedDistance > 100) {
      setError('Enter a distance between 1 and 100 km.');
      return;
    }

    let parsedMax: number | null = null;
    if (maxRunners.trim() !== '') {
      const n = Number.parseInt(maxRunners, 10);
      if (!Number.isInteger(n) || n < 2 || n > 500) {
        setError('Max runners must be a whole number between 2 and 500.');
        return;
      }
      parsedMax = n;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          runDate,
          startTime,
          meetingPoint: meetingPoint.trim(),
          distanceKm: parsedDistance,
          paceTarget: paceTarget.trim(),
          paceTier,
          terrain,
          maxRunners: parsedMax,
        },
        editingRun ? editingRun.id : null
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save run. Please check your entries.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-run-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-white border border-[#E5E5E0] rounded-xl w-full max-w-2xl my-8 overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-[#E5E5E0] flex items-center justify-between gap-4">
          <div>
            <h2
              id="post-run-title"
              className="font-display text-3xl font-bold tracking-tight text-[#111315]"
            >
              {editingRun ? 'Edit Club Run' : 'Post an Upcoming Run'}
            </h2>
            <p className="text-xs text-[#525860] mt-0.5">
              Share route details, meeting spot, and target pace with club members.
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md text-[#525860] hover:text-[#111315] hover:bg-[#F1F2EE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="run-title" className="block text-sm font-medium text-[#111315] mb-1.5">
              Run title
            </label>
            <input
              id="run-title"
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Riverside Bridge 10K Tempo"
              className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm text-[#111315] placeholder:text-[#868D96] focus:outline-none focus:border-[#111315]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="run-date" className="block text-sm font-medium text-[#111315] mb-1.5">
                Date
              </label>
              <input
                id="run-date"
                type="date"
                required
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm font-mono tabular-nums text-[#111315] focus:outline-none focus:border-[#111315]"
              />
            </div>

            <div>
              <label htmlFor="run-time" className="block text-sm font-medium text-[#111315] mb-1.5">
                Start time
              </label>
              <input
                id="run-time"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm font-mono tabular-nums text-[#111315] focus:outline-none focus:border-[#111315]"
              />
            </div>

            <div>
              <label
                htmlFor="run-distance"
                className="block text-sm font-medium text-[#111315] mb-1.5"
              >
                Distance (km)
              </label>
              <input
                id="run-distance"
                type="number"
                step="0.5"
                min="1"
                max="100"
                required
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm font-mono tabular-nums text-[#111315] focus:outline-none focus:border-[#111315]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="run-terrain"
                className="block text-sm font-medium text-[#111315] mb-1.5"
              >
                Terrain
              </label>
              <select
                id="run-terrain"
                value={terrain}
                onChange={(e) => setTerrain(e.target.value as TerrainType)}
                className="w-full px-3 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm text-[#111315] focus:outline-none focus:border-[#111315]"
              >
                <option value="road">Road</option>
                <option value="track">Track</option>
                <option value="trail">Trail</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="run-pace-tier"
                className="block text-sm font-medium text-[#111315] mb-1.5"
              >
                Effort group
              </label>
              <select
                id="run-pace-tier"
                value={paceTier}
                onChange={(e) => handlePaceTierChange(e.target.value as PaceTier)}
                className="w-full px-3 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm text-[#111315] focus:outline-none focus:border-[#111315]"
              >
                <option value="easy">Easy</option>
                <option value="steady">Steady</option>
                <option value="tempo">Tempo</option>
                <option value="intervals">Intervals</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="run-pace-target"
                className="block text-sm font-medium text-[#111315] mb-1.5"
              >
                Target pace
              </label>
              <input
                id="run-pace-target"
                type="text"
                required
                maxLength={40}
                value={paceTarget}
                onChange={(e) => setPaceTarget(e.target.value)}
                placeholder="5:15 /km"
                className="w-full px-3 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm font-mono tabular-nums text-[#111315] focus:outline-none focus:border-[#111315]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="run-meeting"
                className="block text-sm font-medium text-[#111315] mb-1.5"
              >
                Meeting point
              </label>
              <input
                id="run-meeting"
                type="text"
                required
                minLength={3}
                maxLength={200}
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="e.g., Pier 15 Esplanade South Kiosk"
                className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm text-[#111315] placeholder:text-[#868D96] focus:outline-none focus:border-[#111315]"
              />
            </div>

            <div>
              <label htmlFor="run-max" className="block text-sm font-medium text-[#111315] mb-1.5">
                Max runners (optional)
              </label>
              <input
                id="run-max"
                type="number"
                min="2"
                max="500"
                value={maxRunners}
                onChange={(e) => setMaxRunners(e.target.value)}
                placeholder="Open"
                className="w-full px-3 py-2.5 min-h-[42px] bg-white border border-[#DCDCD5] rounded-md text-sm font-mono tabular-nums text-[#111315] placeholder:text-[#868D96] focus:outline-none focus:border-[#111315]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="run-description"
              className="block text-sm font-medium text-[#111315] mb-1.5"
            >
              Route notes &amp; workout plan
            </label>
            <textarea
              id="run-description"
              required
              minLength={5}
              maxLength={1000}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the route loop, elevation or regroup points, bag drop, or post-run coffee plans."
              className="w-full px-3.5 py-2.5 bg-white border border-[#DCDCD5] rounded-md text-sm text-[#111315] placeholder:text-[#868D96] focus:outline-none focus:border-[#111315] resize-y"
            />
          </div>

          <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 min-h-[40px] border border-[#DCDCD5] hover:border-[#111315] text-sm font-semibold text-[#111315] rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 min-h-[40px] bg-[#D9411E] hover:bg-[#BF3516] disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {submitting ? 'Saving...' : editingRun ? 'Save Changes' : 'Publish Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
