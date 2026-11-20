import { ArrowRight } from 'lucide-react';
import { RouteImage } from './RouteImage.tsx';
import {
  HERO_PACK_IMAGE,
  formatDistance,
  formatRunDate,
  formatStartTime,
} from '../lib/formatters.ts';
import type { ClubRun } from '../types/club.ts';

interface HeroSectionProps {
  isAuthenticated: boolean;
  authLoading: boolean;
  nextRun: ClubRun | null;
  totalUpcoming: number;
  onPrimaryAction: () => void;
  onInspectNextRun: (run: ClubRun) => void;
}

export function HeroSection({
  isAuthenticated,
  authLoading,
  nextRun,
  totalUpcoming,
  onPrimaryAction,
  onInspectNextRun,
}: HeroSectionProps) {
  return (
    <section id="top" className="border-b border-[#E5E5E0] bg-white">
      <div className="max-w-[1280px] mx-auto px-6 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left column: Focal editorial statement */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="text-xs font-medium text-[#525860] tracking-wide">
                Waterfront &amp; City Pack · Open to All Paces
              </p>

              <h1 className="font-display font-bold text-[#111315] tracking-tight leading-[0.98] text-[clamp(2.5rem,4.4vw,4.1rem)]">
                Show up at dawn. Run with the pack.
              </h1>

              <p className="text-base text-[#4A5058] leading-relaxed max-w-[44ch]">
                Meridian Run Club is a member-led schedule for road progressions, Tuesday track
                intervals, and weekend coastal trails. Browse upcoming routes, confirm your spot,
                or post a session for the club.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <button
                type="button"
                disabled={authLoading}
                onClick={onPrimaryAction}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-[#111315] hover:bg-[#262A30] disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9411E]"
              >
                <span>{isAuthenticated ? 'Post an Upcoming Run' : 'Sign in with Google'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <a
                href="#schedule"
                className="text-sm font-semibold text-[#111315] hover:text-[#D9411E] underline underline-offset-4 decoration-[#C8C8C0] hover:decoration-[#D9411E] transition-colors whitespace-nowrap shrink-0 py-2"
              >
                View run schedule
              </a>
            </div>
          </div>

          {/* Right column: Full-height editorial hero photography */}
          <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] lg:min-h-[440px] rounded-xl overflow-hidden bg-[#14171A]">
            <RouteImage
              src={HERO_PACK_IMAGE}
              alt="Meridian Run Club members running across a waterfront bridge at sunrise"
              terrain="road"
              label="Meridian Waterfront Pack"
              className="w-full h-full lg:h-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
              aria-hidden="true"
            />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              {nextRun ? (
                <>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-white/80 tracking-wide">
                      Next on the board · {formatRunDate(nextRun.runDate)} ·{' '}
                      <span className="font-mono tabular-nums">
                        {formatStartTime(nextRun.startTime)}
                      </span>
                    </p>
                    <p className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                      {nextRun.title}
                    </p>
                    <p className="text-sm text-white/85">
                      {nextRun.meetingPoint} ·{' '}
                      <span className="font-mono tabular-nums">
                        {formatDistance(nextRun.distanceKm)}
                      </span>{' '}
                      · <span className="font-mono tabular-nums">{nextRun.paceTarget}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInspectNextRun(nextRun)}
                    className="self-start sm:self-end px-4 py-2 min-h-[40px] bg-white hover:bg-[#F1F2EE] text-[#111315] text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Open Route
                  </button>
                </>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-white/80">
                    Dawn Bridge Pack · Tuesday Track · Weekend Trails
                  </p>
                  <p className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                    Member-Posted Weekly Runs
                  </p>
                  <p className="text-sm text-white/85">
                    Sign in to view the live club roster, RSVP to sessions, and publish new routes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-width 4-column club metrics strip */}
        <div className="mt-10 pt-8 border-t border-[#E5E5E0] grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-[#525860]">Weekly Schedule</p>
            <p className="mt-1 font-mono text-lg font-medium text-[#111315] tabular-nums">
              {isAuthenticated ? `${totalUpcoming} upcoming` : '5+ runs / week'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#525860]">Pace Range</p>
            <p className="mt-1 font-mono text-lg font-medium text-[#111315] tabular-nums">
              4:15 – 6:30 /km
            </p>
          </div>
          <div>
            <p className="text-xs text-[#525860]">Terrains</p>
            <p className="mt-1 text-lg font-semibold text-[#111315]">Road · Track · Trail</p>
          </div>
          <div>
            <p className="text-xs text-[#525860]">Club Policy</p>
            <p className="mt-1 text-lg font-semibold text-[#111315]">Member-Led · No Drop</p>
          </div>
        </div>
      </div>
    </section>
  );
}
