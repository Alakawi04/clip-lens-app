import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight, Clock, History as HistoryIcon, Sparkles, Search, X } from 'lucide-react';
import { backend } from '@/api/supabaseClient';
import StatusBadge from '@/components/StatusBadge';
import { useI18n } from '@/lib/i18n';
import { deleteAnalysisFrames } from '@/lib/videoFrames';

const FIELDS = ['source_type', 'source_label', 'status', 'score', 'thumbnail_url', 'created_date'];

export default function History() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch] = useState('');
  const locale = lang === 'ar' ? 'ar' : 'en-US';

  // Server-side search: every query is a new filter() call with a $regex
  // condition — never a local filter over a loaded page.
  const load = useCallback(async (term) => {
    try {
      const query = term ? { source_label: { $regex: term, $options: 'i' } } : {};
      const page = await backend.data.Analysis.filter(query, { sort: '-created_date', limit: 50, fields: FIELDS });
      setItems(page.items || []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search, load]);

  const remove = async (id) => {
    try { await deleteAnalysisFrames(id); } catch { /* local cleanup is best-effort */ }
    try { await backend.data.Analysis.delete(id); } catch { /* ignore */ }
    setConfirmId(null);
    setItems((prev) => (prev || []).filter((x) => x.id !== id));
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl brand-gradient text-white shadow-soft">
          <HistoryIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('history.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('history.subtitle')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mt-7 max-w-sm">
        <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('history.search')}
          aria-label={t('history.search')}
          className="h-11 w-full rounded-full border border-border bg-card ps-10 pe-10 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/40"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label={t('common.cancel')}
            className="absolute end-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {items === null ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 && search ? (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          {t('history.noResults')}
        </motion.p>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Clock className="h-7 w-7" />
          </span>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t('history.empty')}</p>
          <Link
            to="/analyze"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-110 active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            {t('history.emptyCta')}
          </Link>
        </motion.div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((a, i) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float"
            >
              <Link
                to={a.status === 'completed' ? `/results/${a.id}` : `/progress/${a.id}`}
                className="block"
              >
                <div className="relative aspect-video bg-muted">
                  {a.thumbnail_url ? (
                    <img src={a.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute end-2 top-2">
                    <StatusBadge status={a.status} />
                  </div>
                  {a.score != null && a.status === 'completed' && (
                    <div className="absolute bottom-2 start-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
                      {t('history.score')} {a.score}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-muted-foreground">
                    {a.source_type === 'youtube' ? t('recent.type.youtube') : t('recent.type.upload')}
                    {a.created_date && (
                      <>
                        <span aria-hidden="true">·</span>
                        {fmtDate(a.created_date)}
                      </>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 font-semibold">{a.source_label || '—'}</p>
                </div>
              </Link>

              <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                <button
                  onClick={() => setConfirmId(a.id)}
                  aria-label={t('history.delete')}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('history.delete')}
                </button>
                <Link
                  to={a.status === 'completed' ? `/results/${a.id}` : `/progress/${a.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {a.status === 'completed' ? t('history.open') : t('common.viewResults')}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              </div>

              <AnimatePresence>
                {confirmId === a.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 grid place-items-center bg-background/80 p-4 text-center backdrop-blur-sm"
                  >
                    <div>
                      <p className="text-sm font-medium">{t('history.confirmDelete')}</p>
                      <div className="mt-4 flex justify-center gap-2">
                        <button
                          onClick={() => remove(a.id)}
                          className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110"
                        >
                          {t('history.delete')}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
