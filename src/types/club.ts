export type TerrainType = 'road' | 'track' | 'trail';
export type PaceTier = 'easy' | 'steady' | 'tempo' | 'intervals';
export type RunScope = 'upcoming' | 'going' | 'mine' | 'all';

export interface MemberProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  pacePreference: string;
  hostedCount: number;
  rsvpCount: number;
}

export interface RunAttendee {
  userId: number;
  displayName: string;
  photoUrl: string | null;
  pacePreference: string;
  note: string | null;
  joinedAt: string;
}

export interface ClubRun {
  id: number;
  title: string;
  description: string;
  runDate: string;
  startTime: string;
  meetingPoint: string;
  distanceKm: number;
  paceTarget: string;
  paceTier: PaceTier;
  terrain: TerrainType;
  maxRunners: number | null;
  createdAt: string;
  host: {
    id: number;
    displayName: string;
    photoUrl: string | null;
    pacePreference: string;
  };
  rsvpCount: number;
  isHost: boolean;
  isGoing: boolean;
  userNote: string | null;
  attendees: RunAttendee[];
}

export interface RunPayload {
  title: string;
  description: string;
  runDate: string;
  startTime: string;
  meetingPoint: string;
  distanceKm: number;
  paceTarget: string;
  paceTier: PaceTier;
  terrain: TerrainType;
  maxRunners: number | null;
}
