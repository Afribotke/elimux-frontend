'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient, hasValidSessionMarkers } from '@/lib/supabase/client';
import { User } from '@/types';
import type { Session } from '@supabase/supabase-js';

// Must share the same client every other auth-aware page uses
// (src/lib/supabase/client.ts is a memoized singleton). This provider wraps
// every page from the root layout and previously used the separate plain
// @supabase/supabase-js client from '@/lib/supabase' - two independent
// GoTrueClients both reading/writing the same localStorage auth-token key
// caused exactly the "Multiple GoTrueClient instances" conflict: verified
// in production that it made supabase.auth.getSession() on other pages
// intermittently miss a perfectly valid, non-expired session.
const supabase = createClient();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email: string | undefined) => {
    // There is no 'profiles' table - student_profiles.user_id is the FK to
    // the auth user (student_profiles.id is that row's own PK, a separate
    // value). Keep `id` on the returned object as the auth user id, not
    // the profile row id, since refreshUser() below re-fetches by user.id.
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // A failed profile lookup (missing row for a user who hasn't finished
      // onboarding, a transient network/RLS hiccup, etc.) used to return
      // null here, which the caller then set as `user` - collapsing a
      // perfectly valid, still-authenticated session into what every
      // consumer (DesktopNav, MobileNav) reads as "logged out", since they
      // branch on `user` truthiness, not `session`/`isAuthenticated`.
      // Falling back to a minimal user built from the session itself keeps
      // auth state correct even when the richer profile row isn't
      // available - full_name/etc. are just absent, not "not logged in".
      console.error('Failed to fetch profile:', error);
      return { id: userId, email: email ?? '', role: 'student' } as User;
    }
    return { ...data, id: userId, role: 'student' } as User;
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !hasValidSessionMarkers()) {
          // A Supabase session cookie can outlive elimux_active (browser
          // fully closed, "remember me" wasn't checked) - don't let a
          // stale-but-technically-valid cookie re-establish the app's
          // logged-in state.
          if (mounted) { setSession(null); setUser(null); }
          return;
        }
        if (mounted) setSession(session);
        if (session?.user && mounted) {
          const profile = await fetchProfile(session.user.id, session.user.email);
          if (mounted) setUser(profile);
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };

    const initAuth = async () => {
      await checkSession();
      if (mounted) setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && !hasValidSessionMarkers()) {
          // Same guard as initAuth() above - without it, a background
          // TOKEN_REFRESHED event would silently re-establish user/session
          // and undo the browser-close logout initAuth() just enforced.
          if (mounted) { setSession(null); setUser(null); }
          return;
        }
        if (mounted) setSession(session);
        if (session?.user && mounted) {
          const profile = await fetchProfile(session.user.id, session.user.email);
          if (mounted) setUser(profile);
        } else if (mounted) {
          setUser(null);
        }
      }
    );

    // Login re-checks after setSessionMarkers() so this doesn't race
    // onAuthStateChange (which can fire, and fail the hasValidSessionMarkers()
    // guard above, before the markers are actually written) - see
    // src/app/auth/login/page.tsx.
    window.addEventListener('elimux:auth:changed', checkSession);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('elimux:auth:changed', checkSession);
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    if (user?.id) {
      const profile = await fetchProfile(user.id, user.email);
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
