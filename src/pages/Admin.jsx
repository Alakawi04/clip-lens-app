import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Image as ImageIcon, Palette, Type, Coins, Save, Loader2, Check } from 'lucide-react';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminContent from '@/components/admin/AdminContent';
import AdminAppearance from '@/components/admin/AdminAppearance';
import AdminTexts from '@/components/admin/AdminTexts';
import AdminBilling from '@/components/admin/AdminBilling';
import ExportCodeButton from '@/components/admin/ExportCodeButton';

export default function Admin() {
  const { t } = useI18n();
  const { settings, save, loading } = useSiteSettings();
  const [tab, setTab] = useState('overview');
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { setDraft(settings); }, [settings]);

  const set = (patch) => {
    setDraft((draftValue) => ({ ...draftValue, ...patch }));
    setSaveError('');
  };
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const onSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await save(draft);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
    } catch (error) {
      console.error('Failed to save site settings:', error);
      const code = error?.code;
      const message = `${error?.message || ''} ${error?.details || ''}`;
      if (code === '23514' && /site_settings_particle_(count|size|style)_check/i.test(message)) {
        setSaveError(t('admin.saveError.particleLimits'));
      } else if (code === '42501' || Number(error?.status) === 401 || Number(error?.status) === 403) {
        setSaveError(t('admin.saveError.permissions'));
      } else if (code === '42703' || code === 'PGRST204') {
        setSaveError(t('admin.saveError.migrations'));
      } else {
        setSaveError(`${t('admin.saveError')}${code ? ` (${code})` : ''}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: t('admin.tab.overview'), icon: LayoutDashboard },
    { id: 'content', label: t('admin.tab.content'), icon: ImageIcon },
    { id: 'texts', label: t('admin.tab.texts'), icon: Type },
    { id: 'appearance', label: t('admin.tab.appearance'), icon: Palette },
    { id: 'billing', label: t('admin.tab.billing'), icon: Coins },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('admin.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('admin.subtitle')}</p>
        </div>
        <Button onClick={onSave} disabled={!dirty || saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : justSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? t('admin.saving') : justSaved ? t('admin.saved') : t('admin.save')}
        </Button>
      </motion.div>
      {saveError && <p role="alert" className="mt-3 text-end text-sm text-destructive">{saveError}</p>}

      <div className="mt-7 inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-card/60 p-1 backdrop-blur">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                active ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tb.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl border border-border bg-muted/30" />
            ))}
          </div>
        ) : tab === 'overview' ? (
          <AdminOverview />
        ) : tab === 'content' ? (
          <AdminContent draft={draft} set={set} />
        ) : tab === 'texts' ? (
          <AdminTexts draft={draft} set={set} />
        ) : tab === 'billing' ? (
          <AdminBilling draft={draft} set={set} />
        ) : (
          <AdminAppearance draft={draft} set={set} />
        )}
      </div>

      {/* quiet corner link — download the code & run the site locally */}
      <div className="mt-10 flex justify-center">
        <ExportCodeButton />
      </div>
    </div>
  );
}
