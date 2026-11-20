import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { fetchMemberProfile, saveMemberProfile } from '../lib/api.ts';
import type { MemberProfile } from '../types/club.ts';

interface AuthContextValue {
  user: User | null;
  profile: MemberProfile | null;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutMember: () => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { displayName: string; pacePreference: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfileForUser = useCallback(async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const memberProfile = await fetchMemberProfile(token);
      setProfile(memberProfile);
      setAuthError(null);
    } catch (error) {
      console.error('Failed to synchronize member profile:', error);
      setAuthError(
        error instanceof Error ? error.message : 'Unable to sync member profile right now.'
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await loadProfileForUser(nextUser);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [loadProfileForUser]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      await loadProfileForUser(result.user);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      const code = (error as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Browser blocked the sign-in popup. Please allow popups for this site.');
      } else {
        setAuthError('Could not complete Google sign-in. Please try again.');
      }
    }
  }, [loadProfileForUser]);

  const signOutMember = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
    setProfile(null);
  }, []);

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    await loadProfileForUser(auth.currentUser);
  }, [loadProfileForUser]);

  const updateProfile = useCallback(
    async (data: { displayName: string; pacePreference: string }) => {
      if (!auth.currentUser) {
        throw new Error('Please sign in first.');
      }
      const token = await auth.currentUser.getIdToken();
      const updated = await saveMemberProfile(token, data);
      setProfile(updated);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authLoading,
        authError,
        signInWithGoogle,
        signOutMember,
        getToken,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
