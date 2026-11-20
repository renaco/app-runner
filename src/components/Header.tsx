interface HeaderProps {
  isAuthenticated: boolean;
  authLoading: boolean;
  onPrimaryAction: () => void;
  onNavigateMyRuns: () => void;
}

export function Header({
  isAuthenticated,
  authLoading,
  onPrimaryAction,
  onNavigateMyRuns,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F8F6]/95 backdrop-blur-sm border-b border-[#E5E5E0]">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="#top"
          className="font-display text-2xl font-bold tracking-tight text-[#111315] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9411E]"
        >
          Meridian Run Club
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A5058]"
        >
          <a
            href="#schedule"
            className="hover:text-[#111315] hover:underline underline-offset-4 decoration-[#D9411E] transition-colors whitespace-nowrap shrink-0"
          >
            Schedule
          </a>
          <a
            href="#pace-groups"
            className="hover:text-[#111315] hover:underline underline-offset-4 decoration-[#D9411E] transition-colors whitespace-nowrap shrink-0"
          >
            Pace Groups
          </a>
          <a
            href="#routes"
            className="hover:text-[#111315] hover:underline underline-offset-4 decoration-[#D9411E] transition-colors whitespace-nowrap shrink-0"
          >
            Routes
          </a>
          <button
            type="button"
            onClick={onNavigateMyRuns}
            className="hover:text-[#111315] hover:underline underline-offset-4 decoration-[#D9411E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            My Runs
          </button>
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="shrink-0">
          <button
            type="button"
            disabled={authLoading}
            onClick={onPrimaryAction}
            className="px-4 py-2 min-h-[40px] bg-[#D9411E] hover:bg-[#BF3516] disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111315]"
          >
            {isAuthenticated ? 'Post a Run' : 'Sign In'}
          </button>
        </div>
      </div>
    </header>
  );
}
