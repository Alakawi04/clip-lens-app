import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Sparkles, Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const YT_RE = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{6,}/i;

export default function LinkTab({ onStart }) {
  const { t } = useI18n();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const valid = YT_RE.test(url.trim());

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
    onStart({ sourceType: 'youtube', sourceLabel: `YouTube · ${label}`, sourceUrl: url.trim() });
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