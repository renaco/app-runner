import { Check, MapPin, Plus, Search, Users } from 'lucide-react';
import { RouteImage } from './RouteImage.tsx';
import {
  PACE_TIER_META,
  TERRAIN_META,
  formatDistance,
  formatRunDate,
  formatStartTime,
} from '../lib/formatters.ts';
import type { ClubRun, MemberProfile, PaceTier, RunScope, TerrainType } from '../types/club.ts';

interface RunBoardSectionProps {
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  profile: MemberProfile | null;
  runs: ClubRun[];
  loading: boolean;
  error: string | null;
  scope: RunScope;
  terrain: 'all' | TerrainType;
  paceTier: 'all' | PaceTier;
  search: string;
  rsvpBusyId: number | null;
  onScopeChange: (scope: RunScope) => void;
  onTerrainChange: (terrain: 'all' | TerrainType) => void;
  onPaceTierChange: (paceTier: 'all' | PaceTier) => void;
  onSearchChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenProfile: () => void;
  onOpenPostModal: () => void;
  onSelectRun: (run: ClubRun) => void;
  onToggleRsvp: (run: ClubRun) => void;
  onRetryLoad: () => void;
}

const SCOPE_OPTIONS: { value: RunScope; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'going', label: 'Going' },
  { value: 'mine', label: 'Hosted by Me' },
  { value: 'all', label: 'All Runs' },
];

const TERRAIN_OPTIONS: { value: 'all' | TerrainType; label: string }[] = [
  { value: 'all', label: 'All Terrains' },
  { value: 'road', label: 'Road' },
  { value: 'track', label: 'Track' },
  { value: 'trail', label: 'Trail' },
];

export function RunBoardSection({
  isAuthenticated,
  authLoading,
  authError,
  profile,
  runs,
  loading,
  error,
  scope,
  terrain,
  paceTier,
  search,
  rsvpBusyId,
  onScopeChange,
  onTerrainChange,
  onPaceTierChange,
  onSearchChange,
  onSignIn,
  onSignOut,
  onOpenProfile,
  onOpenPostModal,
  onSelectRun,
  onToggleRsvp,
  onRetryLoad,
}: RunBoardSectionProps) {
  const hasActiveFilters = terrain !== 'all' || paceTier !== 'all' || search.trim().length > 0;

  return (
    <section id="schedule" className="max-w-[1280px] mx-auto px-6 py-14 lg:py-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E5E5E0]">
        <div>
          <p className="text-xs font-medium text-[#525860]">Club Run Board</p>
          <h2 className="mt-1 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#111315]">
            Upcoming Group Runs
          </h2>
        </div>

        {isAuthenticated && profile && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#4A5058]">
            <span>
              Signed in as <strong className="font-semibold text-[#111315]">{profile.displayName}</strong>
            </span>
            <span aria-hidden="true" className="text-[#C8C8C0]">
              ·
            </span>
            <span className="font-mono text-xs tabular-nums text-[#525860]">
              {profile.pacePreference} · {profile.hostedCount} hosted · {profile.rsvpCount} RSVPs
            </span>
            <span aria-hidden="true" className="text-[#C8C8C0]">
              ·
            </span>
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-sm font-medium text-[#111315] hover:text-[#D9411E] underline underline-offset-4 decoration-[#C8C8C0] cursor-pointer whitespace-nowrap shrink-0"
            >
              Profile
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="text-sm font-medium text-[#525860] hover:text-[#111315] cursor-pointer whitespace-nowrap shrink-0"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Auth Error Banner */}
      {authError && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
        >
          {authError}
        </div>
      )}

      {/* Unauthenticated Member Gate */}
      {!authLoading && !isAuthenticated ? (
        <div className="mt-10 bg-white border border-[#E5E5E0] rounded-xl p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <h3 className="font-display text-3xl font-bold text-[#111315]">
              Sign in to access the live club schedule
            </h3>
            <p className="text-base text-[#4A5058] leading-relaxed">
              Members use Google Sign-In to browse upcoming routes, see who is running in each pace
              group, confirm RSVPs, and publish new group runs to the board.
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={onSignIn}
              className="px-6 py-3 min-h-[44px] bg-[#D9411E] hover:bg-[#BF3516] text-white text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111315]"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Controls Toolbar */}
          <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Scope Segmented Tabs */}
            <div
              role="tablist"
              aria-label="Run schedule view"
              className="inline-flex items-center gap-1 p-1 bg-[#EFEFE9] rounded-lg overflow-x-auto max-w-full"
            >
              {SCOPE_OPTIONS.map((opt) => {
                const active = scope === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onScopeChange(opt.value)}
                    className={`px-3.5 py-2 min-h-[36px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-[#111315] shadow-xs'
                        : 'text-[#525860] hover:text-[#111315]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search
                  className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search routes, meeting points..."
                  aria-label="Search runs"
                  className="w-full pl-9 pr-3 py-2 min-h-[40px] bg-white border border-[#DCDCD5] rounded-md text-sm text-[#111315] placeholder:text-[#787F87] focus:outline-none focus:border-[#111315]"
                />
              </div>

              <div
                role="group"
                aria-label="Filter by terrain"
                className="inline-flex items-center gap-1 p-1 bg-[#EFEFE9] rounded-lg"
              >
                {TERRAIN_OPTIONS.map((opt) => {
                  const active = terrain === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onTerrainChange(opt.value)}
                      className={`px-3 py-1.5 min-h-[32px] text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-[#111315] shadow-xs'
                          : 'text-[#525860] hover:text-[#111315]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <select
                value={paceTier}
                onChange={(e) => onPaceTierChange(e.target.value as 'all' | PaceTier)}
                aria-label="Filter by effort level"
                className="px-3 py-2 min-h-[40px] bg-white border border-[#DCDCD5] rounded-md text-sm text-[#111315] focus:outline-none focus:border-[#111315] cursor-pointer"
              >
                <option value="all">All Paces</option>
                <option value="easy">Easy (6:00+ /km)</option>
                <option value="steady">Steady (5:15–5:59 /km)</option>
                <option value="tempo">Tempo (4:30–5:14 /km)</option>
                <option value="intervals">Intervals (4:00–4:45 /km)</option>
              </select>

              <button
                type="button"
                onClick={onOpenPostModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] bg-[#111315] hover:bg-[#262A30] text-white text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Post Run</span>
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div
              role="alert"
              className="mt-6 p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex flex-wrap items-center justify-between gap-4"
            >
              <p className="text-sm text-[#991B1B]">{error}</p>
              <button
                type="button"
                onClick={onRetryLoad}
                className="px-3 py-1.5 text-xs font-semibold text-[#991B1B] border border-[#FCA5A5] rounded-md hover:bg-[#FEE2E2] cursor-pointer whitespace-nowrap shrink-0"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading || authLoading ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="h-44 bg-[#EAEAE4]" />
                  <div className="p-6 space-y-3">
                    <div className="h-3.5 w-36 bg-[#EAEAE4] rounded" />
                    <div className="h-7 w-3/4 bg-[#E5E5E0] rounded" />
                    <div className="h-4 w-2/3 bg-[#EAEAE4] rounded" />
                    <div className="pt-4 border-t border-[#EFEFE9] flex justify-between">
                      <div className="h-4 w-28 bg-[#EAEAE4] rounded" />
                      <div className="h-9 w-24 bg-[#EAEAE4] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : runs.length === 0 ? (
            /* Empty State */
            <div className="mt-10 bg-white border border-[#E5E5E0] rounded-xl p-10 text-center space-y-4">
              <h3 className="font-display text-3xl font-bold text-[#111315]">
                {hasActiveFilters ? 'No runs match these filters' : 'No runs scheduled in this view'}
              </h3>
              <p className="text-sm text-[#525860] max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your terrain, effort level, or search query to see other club sessions.'
                  : scope === 'going'
                    ? 'You have not joined an upcoming run yet. Switch to Upcoming to claim a spot.'
                    : 'Be the first member to put a route on the calendar and invite the pack.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      onTerrainChange('all');
                      onPaceTierChange('all');
                      onSearchChange('');
                    }}
                    className="px-4 py-2 min-h-[40px] border border-[#DCDCD5] hover:border-[#111315] text-sm font-semibold text-[#111315] rounded-md transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                ) : scope === 'going' ? (
                  <button
                    type="button"
                    onClick={() => onScopeChange('upcoming')}
                    className="px-4 py-2 min-h-[40px] bg-[#111315] hover:bg-[#262A30] text-white text-sm font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Browse Upcoming Runs
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenPostModal}
                    className="px-5 py-2.5 min-h-[40px] bg-[#D9411E] hover:bg-[#BF3516] text-white text-sm font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Post First Run
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Populated Schedule Grid */
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {runs.map((run) => {
                const terrainInfo = TERRAIN_META[run.terrain] ?? TERRAIN_META.road;
                const paceInfo = PACE_TIER_META[run.paceTier] ?? PACE_TIER_META.steady;
                const isFull =
                  run.maxRunners !== null && run.rsvpCount >= run.maxRunners && !run.isGoing;
                const isBusy = rsvpBusyId === run.id;

                return (
                  <article
                    key={run.id}
                    className="bg-white border border-[#E5E5E0] hover:border-[#C7C7BE] rounded-xl overflow-hidden flex flex-col transition-colors duration-150"
                  >
                    {/* Terrain Editorial Thumbnail */}
                    <button
                      type="button"
                      onClick={() => onSelectRun(run)}
                      className="relative h-48 w-full overflow-hidden bg-[#14171A] text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#D9411E]"
                    >
                      <RouteImage
                        src={terrainInfo.image}
                        alt={`${run.title} — ${terrainInfo.alt}`}
                        terrain={run.terrain}
                        label={run.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
                        aria-hidden="true"
                      />
                      <div className="absolute bottom-3.5 left-5 right-5 flex items-baseline justify-between gap-4 text-white">
                        <span className="font-mono text-sm font-medium tabular-nums">
                          {formatRunDate(run.runDate)} · {formatStartTime(run.startTime)}
                        </span>
                        <span className="font-mono text-sm font-medium tabular-nums">
                          {formatDistance(run.distanceKm)}
                        </span>
                      </div>
                    </button>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        {/* Unboxed Metadata Kicker */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#525860]">
                          <span className="font-semibold text-[#111315]">{terrainInfo.label}</span>
                          <span aria-hidden="true">·</span>
                          <span>{paceInfo.label}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{run.paceTarget}</span>
                          {run.isHost && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#D9411E]">Hosted by you</span>
                            </>
                          )}
                        </div>

                        <h3 className="font-display text-2xl font-bold tracking-tight text-[#111315] leading-snug">
                          <button
                            type="button"
                            onClick={() => onSelectRun(run)}
                            className="text-left hover:text-[#D9411E] transition-colors cursor-pointer"
                          >
                            {run.title}
                          </button>
                        </h3>

                        <p className="text-sm text-[#4A5058] line-clamp-2 leading-relaxed">
                          {run.description}
                        </p>

                        <div className="pt-1 flex flex-col gap-1.5 text-sm text-[#4A5058]">
                          <div className="flex items-center gap-2">
                            <MapPin
                              className="w-4 h-4 text-[#6B7280] shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">{run.meetingPoint}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#525860]">
                            <Users
                              className="w-4 h-4 text-[#6B7280] shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-mono tabular-nums">
                              {run.rsvpCount}
                              {run.maxRunners ? ` / ${run.maxRunners}` : ''} runners
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Led by {run.host.displayName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-4 border-t border-[#EFEFE9] flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectRun(run)}
                          className="text-sm font-semibold text-[#111315] hover:text-[#D9411E] transition-colors py-2 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Details &amp; Roster
                        </button>

                        <button
                          type="button"
                          disabled={isBusy || isFull}
                          onClick={() => onToggleRsvp(run)}
                          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                            run.isGoing
                              ? 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#15803D] border border-[#BBF7D0]'
                              : isFull
                                ? 'bg-[#F1F2EE] text-[#6B7280]'
                                : 'bg-[#D9411E] hover:bg-[#BF3516] text-white'
                          }`}
                        >
                          {run.isGoing && <Check className="w-4 h-4" aria-hidden="true" />}
                          <span>
                            {isBusy
                              ? 'Updating...'
                              : run.isGoing
                                ? 'Going'
                                : isFull
                                  ? 'Full'
                                  : 'Join Run'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
