import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { backend, invokeFunction } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

const CreditContext = createContext(null);

// Per-user credit balance and analysis charging.
export function CreditProvider({ children }) {
  const { settings } = useSiteSettings();
  const { user, isAuthenticated } = useAuth();
  const enabled = !!settings.credits_enabled;
  const [account, setAccount] = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !isAuthenticated || !user?.id) {
      setAccount(null);
      return;
    }
    try {
      const page = await backend.data.CreditAccount.filter({ user_id: user.id }, { limit: 1 });
      setAccount(page.items?.[0] || null);
    } catch (error) {
      console.error('Failed to load credit balance:', error);
      setAccount(null);
    }
  }, [enabled, isAuthenticated, user?.id]);

  useEffect(() => { load(); }, [load]);

  // Keep the balance fresh when it changes server-side (spend / admin grant).
  useEffect(() => {
    if (!enabled || !isAuthenticated) return undefined;
    const unsubscribe = backend.data.CreditAccount.subscribe(() => { load(); });
    return unsubscribe;
  }, [enabled, isAuthenticated, load]);

  // Spends one analysis' worth of credits (backend function, service role).
  // Returns { ok, balance } or { ok: false, reason: 'insufficient', balance }.
  const spend = useCallback(async (analysisId, claimApi = false) => {
    const res = await invokeFunction('consumeCredit', { analysisId, claimApi });
    await load();
    return res?.data;
  }, [load]);

  const value = useMemo(
    () => ({ enabled, account, balance: account?.balance ?? 0, plan: account?.plan || 'free', load, spend }),
    [enabled, account, load, spend]
  );

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>;
}

export function useCredits() {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error('useCredits must be used within a CreditProvider');
  return ctx;
}