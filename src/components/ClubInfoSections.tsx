import { RouteImage } from './RouteImage.tsx';
import { PACE_TIER_META, TERRAIN_META } from '../lib/formatters.ts';
import type { PaceTier, TerrainType } from '../types/club.ts';

interface ClubInfoSectionsProps {
  onSelectTerrainFilter: (terrain: TerrainType) => void;
  onSelectPaceFilter: (tier: PaceTier) => void;
}

const ORDERED_TERRAINS: { key: TerrainType; index: string; title: string; cadence: string }[] = [
  {
    key: 'road',
    index: '01.',
    title: 'Waterfront & Park Road Loops',
    cadence: 'Saturdays, Sundays & Thursday evenings',
  },
  {
    key: 'track',
    index: '02.',
    title: 'Dawn Track Intervals',
    cadence: 'Tuesdays · 06:15 AM sharp',
  },
  {
    key: 'trail',
    index: '03.',
    title: 'Coastal Ridge Trails',
    cadence: 'Weekend long runs · 14–22 km',
  },
];

const ORDERED_PACE_TIERS: PaceTier[] = ['easy', 'steady', 'tempo', 'intervals'];

export function ClubInfoSections({
  onSelectTerrainFilter,
  onSelectPaceFilter,
}: ClubInfoSectionsProps) {
  return (
    <>
      {/* Pace Groups Reference Table */}
      <section id="pace-groups" className="border-t border-[#E5E5E0] bg-white">
        <div className="max-w-[1280px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4 space-y-3">
              <p className="text-xs font-medium text-[#525860]">Pacing Structure</p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-[#111315]">
                Four Effort Groups
              </h2>
              <p className="text-sm text-[#4A5058] leading-relaxed">
                Every run on the Meridian board declares a target pace and effort tier so members
                line up with the right pack from the first kilometer.
              </p>
            </div>

            <div className="lg:col-span-8 divide-y divide-[#E5E5E0] border-t border-b border-[#E5E5E0]">
              {ORDERED_PACE_TIERS.map((tier) => {
                const info = PACE_TIER_META[tier];
                return (
                  <div
                    key={tier}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                      <span className="font-display text-2xl font-bold text-[#111315] w-28 shrink-0">
                        {info.label}
                      </span>
                      <span className="font-mono text-sm font-medium text-[#D9411E] tabular-nums w-32 shrink-0">
                        {info.range}
                      </span>
                      <p className="text-sm text-[#4A5058]">{info.guidance}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectPaceFilter(tier)}
                      className="self-start sm:self-center text-xs font-semibold text-[#111315] hover:text-[#D9411E] underline underline-offset-4 decoration-[#C8C8C0] cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Filter runs
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Signature Club Terrains / Routes */}
      <section id="routes" className="border-t border-[#E5E5E0] bg-[#F8F8F6]">
        <div className="max-w-[1280px] mx-auto px-6 py-16 space-y-10">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-medium text-[#525860]">Where We Run</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[#111315]">
              Club Terrains &amp; Routes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ORDERED_TERRAINS.map((item) => {
              const media = TERRAIN_META[item.key];
              return (
                <article
                  key={item.key}
                  className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[#14171A] overflow-hidden">
                    <RouteImage
                      src={media.image}
                      alt={media.alt}
                      terrain={item.key}
                      label={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-[#525860]">{item.cadence}</p>
                      <h3 className="font-display text-2xl font-bold text-[#111315]">
                        {item.index} {item.title}
                      </h3>
                      <p className="text-sm text-[#4A5058] leading-relaxed">{media.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTerrainFilter(item.key)}
                      className="self-start text-sm font-semibold text-[#111315] hover:text-[#D9411E] underline underline-offset-4 decoration-[#C8C8C0] cursor-pointer whitespace-nowrap"
                    >
                      See {media.label.toLowerCase()} runs
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E5E5E0] bg-white">
        <div className="max-w-[1280px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-[#111315]">
              Meridian Run Club
            </p>
            <p className="text-xs text-[#525860] mt-1">
              Member-led group running schedule · Show up 10 minutes before start time.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6 text-xs text-[#525860]">
            <a href="#schedule" className="hover:text-[#111315] transition-colors">
              Schedule
            </a>
            <a href="#pace-groups" className="hover:text-[#111315] transition-colors">
              Pace Groups
            </a>
            <a href="#routes" className="hover:text-[#111315] transition-colors">
              Routes
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
