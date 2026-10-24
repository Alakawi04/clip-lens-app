import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadUser = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (error) throw error;
    setUser({ ...authUser, role: profile?.role || 'user' });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthError('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to connect this app.');
      setIsLoadingAuth(false);
      return undefined;
    }

    let active = true;
    const initialize = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) await loadUser(data.session?.user || null);
      } catch (error) {
        if (active) setAuthError(error.message || 'Unable to connect to authentication.');
      } finally {
        if (active) setIsLoadingAuth(false);
      }
    };
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthError('');
      queueMicrotask(async () => {
        try {
          await loadUser(session?.user || null);
        } catch (error) {
          if (active) setAuthError(error.message || 'Unable to load your account.');
        }
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const logout = useCallback(async (shouldRedirect = true) => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (shouldRedirect) window.location.assign('/');
  }, []);

  const navigateToLogin = useCallback(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, []);

  const checkUserAuth = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    await loadUser(data.user);
    return data.user;
  }, [loadUser]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authError,
    authChecked: !isLoadingAuth,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState: checkUserAuth,
  }), [user, isLoadingAuth, authError, logout, navigateToLogin, checkUserAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
