import React, { useCallback, useEffect, useState } from 'react';
import { Coins, Check, Loader2, UserCheck, UserX } from 'lucide-react';
import { backend } from '@/api/supabaseClient';
import { useI18n } from '@/lib/i18n';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

// Credit settings and per-user credit account administration.
export default function AdminBilling({ draft, set }) {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const [requests, setRequests] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [busy, setBusy] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [edits, setEdits] = useState({});

  const load = useCallback(async () => {
    try {
      const [rp, ap] = await Promise.all([
        backend.data.UpgradeRequest.filter({ status: 'pending' }, { sort: '-created_date', limit: 50 }),
        backend.data.CreditAccount.filter({}, { sort: '-updated_date', limit: 50 }),
      ]);
      setRequests(rp.items || []);
      setAccounts(ap.items || []);
    } catch {
      setRequests([]);
      setAccounts([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const numField = (key, labelKey) => (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{t(labelKey)}</span>
      <input
        type="number"
        min="0"
        step={key === 'credits_pro_price' ? '0.01' : '1'}
        dir="ltr"
        value={draft[key] ?? 0}
        onChange={(e) => set({ [key]: Math.max(0, Number(e.target.value) || 0) })}
        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );

  const approve = async (req) => {
    setBusy(req.id);
    try {
      const amount = Number(settings.credits_pro_amount) || 0;
      const now = new Date().toISOString();
      const page = await backend.data.CreditAccount.filter({ user_id: req.user_id }, { limit: 1 });
      const acc = page.items?.[0];
      if (acc) {
        await backend.data.CreditAccount.update(acc.id, {
          plan: 'pro',
          balance: (acc.balance || 0) + amount,
          history: [...(acc.history || []), { change: amount, reason: 'pro_upgrade', date: now }],
        });
      } else {
        await backend.data.CreditAccount.create({
          user_id: req.user_id,
          plan: 'pro',
          balance: amount,
          history: [{ change: amount, reason: 'pro_upgrade', date: now }],
        });
      }
      await backend.data.UpgradeRequest.update(req.id, { status: 'approved' });
      await load();
    } finally {
      setBusy('');
    }
  };

  const reject = async (req) => {
    setBusy(req.id);
    try {
      await backend.data.UpgradeRequest.update(req.id, { status: 'rejected' });
      await load();
    } finally {
      setBusy('');
    }
  };

  const saveAccount = async (acc) => {
    setBusy(acc.id);
    try {
      const e = edits[acc.id] || {};
      await backend.data.CreditAccount.update(acc.id, {
        plan: e.plan ?? acc.plan,
        balance: typeof e.balance === 'number' ? e.balance : acc.balance,
      });
      setEdits((p) => {
        const next = { ...p };
        delete next[acc.id];
        return next;
      });
      setSavedId(acc.id);
      setTimeout(() => setSavedId(null), 1500);
      await load();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      {/* System settings */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
            <Coins className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">{t('admin.billing.title')}</h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{t('admin.billing.desc')}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3">
          <span className="text-sm font-semibold">{t('admin.billing.enable')}</span>
          <Switch
            checked={!!draft.credits_enabled}
            onCheckedChange={(v) => set({ credits_enabled: v })}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {numField('credits_cost', 'admin.billing.cost')}
          {numField('credits_upload_cost', 'admin.billing.uploadCost')}
          {numField('credits_signup', 'admin.billing.signup')}
          {numField('credits_pro_price', 'admin.billing.proPrice')}
          {numField('credits_pro_amount', 'admin.billing.proAmount')}
        </div>
      </div>

      {/* Pending Pro requests */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 shadow-soft">
        <h3 className="font-display text-lg font-bold">{t('admin.billing.requests')}</h3>
        {requests === null ? (
          <div className="mt-4 h-16 animate-pulse rounded-2xl bg-muted/30" />
        ) : requests.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t('admin.billing.requestsEmpty')}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{r.created_by || r.user_id}</p>
                  <p className="text-xs text-muted-foreground">{t('admin.billing.requestedBy')} · {t('admin.billing.plan.pro')}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approve(r)} disabled={busy === r.id} className="gap-1.5">
                    {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                    {t('admin.billing.approve')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject(r)} disabled={busy === r.id} className="gap-1.5">
                    <UserX className="h-3.5 w-3.5" />
                    {t('admin.billing.reject')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Credit accounts */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 shadow-soft">
        <h3 className="font-display text-lg font-bold">{t('admin.billing.accounts')}</h3>
        {accounts === null ? (
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-muted/30" />
        ) : accounts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t('admin.billing.accountsEmpty')}</p>
        ) : (
          <div className="mt-4 space-y-2">
            {accounts.map((acc) => {
              const e = edits[acc.id] || {};
              const plan = e.plan ?? acc.plan ?? 'free';
              const balance = typeof e.balance === 'number' ? e.balance : acc.balance ?? 0;
              const dirty = plan !== (acc.plan ?? 'free') || balance !== (acc.balance ?? 0);
              return (
                <div key={acc.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{acc.created_by || acc.user_id}</p>
                  <select
                    value={plan}
                    onChange={(ev) => setEdits((p) => ({ ...p, [acc.id]: { ...p[acc.id], plan: ev.target.value } }))}
                    className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="free">{t('admin.billing.plan.free')}</option>
                    <option value="pro">{t('admin.billing.plan.pro')}</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    dir="ltr"
                    value={balance}
                    onChange={(ev) => setEdits((p) => ({ ...p, [acc.id]: { ...p[acc.id], balance: Math.max(0, Number(ev.target.value) || 0) } }))}
                    className="w-24 rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                    title={t('admin.billing.balance')}
                  />
                  <Button size="sm" variant="outline" disabled={!dirty || busy === acc.id} onClick={() => saveAccount(acc)} className="gap-1.5">
                    {busy === acc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedId === acc.id ? <Check className="h-3.5 w-3.5" /> : null}
                    {savedId === acc.id ? t('admin.billing.saved') : t('admin.billing.save')}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}