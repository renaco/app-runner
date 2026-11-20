import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import {
  createClubRunApi,
  deleteClubRunApi,
  fetchClubRuns,
  joinClubRunApi,
  leaveClubRunApi,
  updateClubRunApi,
} from './lib/api.ts';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { RunBoardSection } from './components/RunBoardSection.tsx';
import { PostRunModal } from './components/PostRunModal.tsx';
import { RunDetailDrawer } from './components/RunDetailDrawer.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { ClubInfoSections } from './components/ClubInfoSections.tsx';
import type { ClubRun, PaceTier, RunPayload, RunScope, TerrainType } from './types/club.ts';

function RunningClubApp() {
  const {
    user,
    profile,
    authLoading,
    authError,
    signInWithGoogle,
    signOutMember,
    getToken,
    refreshProfile,
    updateProfile,
  } = useAuth();

  const [runs, setRuns] = useState<ClubRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);

  const [scope, setScope] = useState<RunScope>('upcoming');
  const [terrain, setTerrain] = useState<'all' | TerrainType>('all');
  const [paceTier, setPaceTier] = useState<'all' | PaceTier>('all');
  const [search, setSearch] = useState('');

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingRun, setEditingRun] = useState<ClubRun | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [rsvpBusyId, setRsvpBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isAuthenticated = Boolean(user);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadRuns = useCallback(async () => {
    if (!user) {
      setRuns([]);
      setRunsError(null);
      return;
    }
    setRunsLoading(true);
    setRunsError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await fetchClubRuns(token, {
        scope,
        terrain,
        paceTier,
        search,
      });
      setRuns(data.runs);
    } catch (err) {
      setRunsError(err instanceof Error ? err.message : 'Unable to load club runs.');
    } finally {
      setRunsLoading(false);
    }
  }, [user, getToken, scope, terrain, paceTier, search]);

  useEffect(() => {
    const debounce = window.setTimeout(() => {
      void loadRuns();
    }, search ? 200 : 0);
    return () => window.clearTimeout(debounce);
  }, [loadRuns, search]);

  const selectedRun = useMemo(
    () => (selectedRunId === null ? null : runs.find((r) => r.id === selectedRunId) ?? null),
    [runs, selectedRunId]
  );

  const nextUpcomingRun = useMemo(() => {
    if (runs.length === 0) return null;
    const todayIso = new Date().toISOString().slice(0, 10);
    return runs.find((r) => r.runDate >= todayIso) ?? runs[0];
  }, [runs]);

  const scrollToSchedule = () => {
    document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrimaryAction = () => {
    if (!isAuthenticated) {
      void signInWithGoogle();
      return;
    }
    setEditingRun(null);
    setPostModalOpen(true);
  };

  const handleNavigateMyRuns = () => {
    if (!isAuthenticated) {
      scrollToSchedule();
      return;
    }
    setScope('going');
    scrollToSchedule();
  };

  const handleSaveRun = async (payload: RunPayload, editingRunId: number | null) => {
    const token = await getToken();
    if (!token) throw new Error('Please sign in again.');

    if (editingRunId) {
      const { run } = await updateClubRunApi(token, editingRunId, payload);
      setRuns((prev) => prev.map((r) => (r.id === run.id ? run : r)));
      showToast('Run details updated.');
    } else {
      const { run } = await createClubRunApi(token, payload);
      setScope('upcoming');
      setTerrain('all');
      setPaceTier('all');
      setSearch('');
      setRuns((prev) =>
        [...prev.filter((r) => r.id !== run.id), run].sort((a, b) =>
          `${a.runDate} ${a.startTime}`.localeCompare(`${b.runDate} ${b.startTime}`)
        )
      );
      setSelectedRunId(run.id);
      showToast('Your run is live on the club schedule.');
    }
    await refreshProfile();
  };

  const handleToggleQuickRsvp = async (run: ClubRun) => {
    const token = await getToken();
    if (!token) return;

    setRsvpBusyId(run.id);
    try {
      const response = run.isGoing
        ? await leaveClubRunApi(token, run.id)
        : await joinClubRunApi(token, run.id, null);
      setRuns((prev) => prev.map((item) => (item.id === run.id ? response.run : item)));
      await refreshProfile();
      showToast(run.isGoing ? `Removed RSVP for ${run.title}.` : `Spot confirmed for ${run.title}.`);
    } catch (err) {
      setRunsError(err instanceof Error ? err.message : 'Unable to update RSVP.');
    } finally {
      setRsvpBusyId(null);
    }
  };

  const handleJoinWithNote = async (runId: number, note: string | null) => {
    const token = await getToken();
    if (!token) throw new Error('Please sign in again.');

    setRsvpBusyId(runId);
    try {
      const { run } = await joinClubRunApi(token, runId, note);
      setRuns((prev) => prev.map((item) => (item.id === runId ? run : item)));
      await refreshProfile();
      showToast('RSVP saved to the roster.');
    } finally {
      setRsvpBusyId(null);
    }
  };

  const handleLeaveRun = async (runId: number) => {
    const token = await getToken();
    if (!token) throw new Error('Please sign in again.');

    setRsvpBusyId(runId);
    try {
      const { run } = await leaveClubRunApi(token, runId);
      setRuns((prev) => prev.map((item) => (item.id === runId ? run : item)));
      await refreshProfile();
      showToast('You have left this run.');
    } finally {
      setRsvpBusyId(null);
    }
  };

  const handleDeleteRun = async (runId: number) => {
    const token = await getToken();
    if (!token) throw new Error('Please sign in again.');

    setRsvpBusyId(runId);
    try {
      await deleteClubRunApi(token, runId);
      setRuns((prev) => prev.filter((item) => item.id !== runId));
      setSelectedRunId(null);
      await refreshProfile();
      showToast('Run canceled and removed from the schedule.');
    } finally {
      setRsvpBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#111315] flex flex-col">
      <Header
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        onPrimaryAction={handlePrimaryAction}
        onNavigateMyRuns={handleNavigateMyRuns}
      />

      <main className="flex-1">
        <HeroSection
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          nextRun={nextUpcomingRun}
          totalUpcoming={runs.length}
          onPrimaryAction={handlePrimaryAction}
          onInspectNextRun={(run) => setSelectedRunId(run.id)}
        />

        <RunBoardSection
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          authError={authError}
          profile={profile}
          runs={runs}
          loading={runsLoading}
          error={runsError}
          scope={scope}
          terrain={terrain}
          paceTier={paceTier}
          search={search}
          rsvpBusyId={rsvpBusyId}
          onScopeChange={setScope}
          onTerrainChange={setTerrain}
          onPaceTierChange={setPaceTier}
          onSearchChange={setSearch}
          onSignIn={() => void signInWithGoogle()}
          onSignOut={() => {
            setSelectedRunId(null);
            void signOutMember();
          }}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenPostModal={() => {
            setEditingRun(null);
            setPostModalOpen(true);
          }}
          onSelectRun={(run) => setSelectedRunId(run.id)}
          onToggleRsvp={(run) => void handleToggleQuickRsvp(run)}
          onRetryLoad={() => void loadRuns()}
        />

        <ClubInfoSections
          onSelectTerrainFilter={(nextTerrain) => {
            setTerrain(nextTerrain);
            setScope('upcoming');
            scrollToSchedule();
          }}
          onSelectPaceFilter={(nextTier) => {
            setPaceTier(nextTier);
            setScope('upcoming');
            scrollToSchedule();
          }}
        />
      </main>

      <PostRunModal
        open={postModalOpen}
        editingRun={editingRun}
        onClose={() => {
          setPostModalOpen(false);
          setEditingRun(null);
        }}
        onSubmit={handleSaveRun}
      />

      <RunDetailDrawer
        run={selectedRun}
        busy={selectedRun !== null && rsvpBusyId === selectedRun.id}
        onClose={() => setSelectedRunId(null)}
        onJoinWithNote={handleJoinWithNote}
        onLeaveRun={handleLeaveRun}
        onEditRun={(run) => {
          setSelectedRunId(null);
          setEditingRun(run);
          setPostModalOpen(true);
        }}
        onDeleteRun={handleDeleteRun}
      />

      <ProfileModal
        open={profileModalOpen}
        profile={profile}
        onClose={() => setProfileModalOpen(false)}
        onSave={async (data) => {
          await updateProfile(data);
          await loadRuns();
          showToast('Runner profile updated.');
        }}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-[#111315] text-white text-sm font-medium rounded-lg shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RunningClubApp />
    </AuthProvider>
  );
}
