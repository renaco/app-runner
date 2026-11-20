import type { PaceTier, TerrainType } from '../types/club.ts';

export const HERO_PACK_IMAGE = '/src/assets/images/hero_dawn_pack_1795209302659.jpg';

export const TERRAIN_META: Record<
  TerrainType,
  { label: string; image: string; alt: string; summary: string }
> = {
  road: {
    label: 'Road',
    image: '/src/assets/images/route_park_loop_1795209301472.jpg',
    alt: 'Runners moving along a sunlit paved park road loop',
    summary: 'Paved waterfront promenades, bridges, and tree-lined park loops.',
  },
  track: {
    label: 'Track',
    image: '/src/assets/images/route_track_intervals_1795209302609.jpg',
    alt: 'Outdoor red athletic running track lanes at early morning dawn',
    summary: 'Structured 400m repeats, thresholds, and cadence drills on the oval.',
  },
  trail: {
    label: 'Trail',
    image: '/src/assets/images/route_coastal_trail_1795209300085.jpg',
    alt: 'Dirt and gravel coastal ridge trail overlooking the ocean',
    summary: 'Rolling dirt singletrack, coastal bluffs, and steady vertical climbs.',
  },
};

export const PACE_TIER_META: Record<
  PaceTier,
  { label: string; range: string; guidance: string }
> = {
  easy: {
    label: 'Easy',
    range: '6:00+ /km',
    guidance: 'Conversational aerobic effort; no runner dropped.',
  },
  steady: {
    label: 'Steady',
    range: '5:15–5:59 /km',
    guidance: 'Rhythmic cruising pace for midweek miles and long loops.',
  },
  tempo: {
    label: 'Tempo',
    range: '4:30–5:14 /km',
    guidance: 'Sustained threshold blocks with warm-up and cool-down.',
  },
  intervals: {
    label: 'Intervals',
    range: '4:00–4:45 /km',
    guidance: 'Timed repeats with standing or jog recoveries.',
  },
};

export function formatRunDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatLongDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatStartTime(time24: string): string {
  const [hRaw, mRaw] = time24.split(':');
  const hour = Number.parseInt(hRaw, 10);
  const minute = Number.parseInt(mRaw, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time24;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function formatDistance(km: number): string {
  const rounded = Math.round(km * 10) / 10;
  return `${rounded.toFixed(rounded % 1 === 0 ? 0 : 1)} km`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'MR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getDefaultNextRunDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
