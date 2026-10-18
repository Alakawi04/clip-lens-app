import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Sparkles, Eye, BarChart3, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const YT_RE = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{6,}/i;

function parseNum(v) {
  if (v == null || String(v).trim() === '') return null;
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// "2:10" → 130 seconds; a plain number is treated as seconds.
function parseTime(v) {
  if (v == null || String(v).trim() === '') return null;
  const s = String(v).trim();
  if (s.includes(':')) {
    const [mm, ss] = s.split(':');
    const m = Number(mm);
    if (!Number.isFinite(m)) return null;
    const sec = Number(ss);
    return Math.round(m * 60 + (Number.isFinite(sec) ? sec : 0));
  }
  const n = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function StudioField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        dir="ltr"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
    </div>
  );
}

export default function LinkTab({ onStart }) {
  const { t } = useI18n();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [studio, setStudio] = useState({ impressions: '', ctr: '', views: '', avgView: '', duration: '' });

  const valid = YT_RE.test(url.trim());
  const setField = (k) => (e) => setStudio((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = () => {
    setTouched(true);
    if (!valid) {
      setError(t('add.link.invalid'));
      return;
    }
    setError('');
    let label = url.trim();
    try {
      const u = new URL(url.trim());
      label = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || u.hostname + u.pathname;
    } catch {
      // keep raw
    }
    const studioStats = showStudio
      ? {
          impressions: parseNum(studio.impressions),
          ctr: parseNum(studio.ctr),
          views: parseNum(studio.views),
          avgView: parseTime(studio.avgView),
          duration: parseTime(studio.duration),
        }
      : null;
    onStart({
      sourceType: 'youtube',
      sourceLabel: `YouTube · ${label}`,
      sourceUrl: url.trim(),
      studioStats,
    });
  };

  return (
    <div>
      <div className="rounded-3xl border border-border bg-card/40 p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
            <Link2 className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">{t('add.link.title')}</p>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="yt-url" className="sr-only">{t('add.link.title')}</label>
          <div className={`flex items-center gap-2 rounded-2xl border bg-card px-3.5 py-1 transition-all ${
            touched && !valid ? 'border-red-500/60 ring-1 ring-red-500/30' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40'
          }`}>
            <input
              id="yt-url"
              type="url"
              inputMode="url"
              dir="ltr"
              value={url}
              onChange={(e) => { setUrl(e.target.value); if (touched) setError(valid ? '' : t('add.link.invalid')); }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={t('add.link.placeholder')}
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Optional YouTube Studio stats */}
        <button
          type="button"
          onClick={() => setShowStudio((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-start transition-colors hover:bg-secondary/70"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" />
            {t('add.link.studio.title')}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showStudio ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {showStudio && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-2xl border border-border bg-card/60 p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">{t('add.link.studio.desc')}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <StudioField label={t('add.link.studio.impressions')} placeholder="125,000" value={studio.impressions} onChange={setField('impressions')} />
                  <StudioField label={t('add.link.studio.ctr')} placeholder="4.2" value={studio.ctr} onChange={setField('ctr')} />
                  <StudioField label={t('add.link.studio.views')} placeholder="8,500" value={studio.views} onChange={setField('views')} />
                  <StudioField label={t('add.link.studio.avgView')} placeholder="2:10" value={studio.avgView} onChange={setField('avgView')} />
                  <div className="col-span-2">
                    <StudioField label={t('add.link.studio.duration')} placeholder="12:30" value={studio.duration} onChange={setField('duration')} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={submit}
          disabled={!url.trim()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all enabled:hover:brightness-110 enabled:hover:shadow-float enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {t('add.link.analyze')}
        </button>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
        <Eye className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">{t('add.link.privacyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('add.link.privacy')}</p>
        </div>
      </div>
    </div>
  );
}