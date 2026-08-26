import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  // WHAT: was `uuid` (Supabase auth.users.id). Firebase UIDs are 28-char
  // alphanumeric strings, NOT valid Postgres uuids — `profiles.id`'s column
  // type had to change from uuid -> text as part of this migration (see
  // FIREBASE_AUTH_MIGRATION.md's SQL). Same for business_id's owner.
  id: string;
  business_id: string | null;
  business_name: string | null;
  industry: string | null;
  brand_voice: string | null;
  languages: string[] | null;
  is_setup_complete: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile — never throws, returns null on any failure
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return data as UserProfile;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // WHAT: replaces Supabase's getSession()/onAuthStateChange() pair —
    // Firebase's onAuthStateChanged fires once immediately with whatever
    // session is currently persisted (equivalent to the old "bootstrap"
    // call) and again on every future login/logout/token refresh, so one
    // listener covers both cases Supabase needed two calls for.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        const p = await fetchProfile(firebaseUser.uid);
        if (cancelled) return;
        setProfile(p);

        // WHAT: every page in the app (ProtectedRoute, Dashboard,
        // ContentGenerator, WeeklyPlanner, content.ts, etc.) reads the
        // *current* business from `localStorage.getItem('business_id')`.
        // Kept from the Aug 18 Supabase-auth fix — still correct under
        // Firebase, just keyed off `firebaseUser.uid` -> profiles.id now.
        if (p?.business_id) {
          localStorage.setItem('business_id', p.business_id);
        }
      } else {
        setUser(null);
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.uid);
    setProfile(p);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    // Clear so a different account logging in on this same browser next
    // can't briefly inherit the previous account's business_id.
    localStorage.removeItem('business_id');
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
