import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/StatusBadge';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n';

export default function RecentAnalyses() {
  const { t } = useI18n();
  const [items, setItems] = useState(null); // null = loading, [] = empty

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const page = await base44.entities.Analysis.filter(
          {},
          { sort: '-created_date', limit: 4, fields: ['source_type', 'source_label', 'status', 'score', 'thumbnail_url', 'created_date'] }
        );
        if (active) setItems(page.items || []);
      } catch {
        if (active) setItems([]);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:snap-start lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="fly-3d font-display text-2xl font-bold tracking-tight sm:text-3xl">{t('recent.title')}</h2>
          <p className="mt-2 text-muted-foreground">{t('recent.subtitle')}</p>
        </div>
        {items && items.length > 0 && (
          <Link
            to="/history"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            {t('recent.viewAll')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        )}
      </div>

      {items === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <Clock className="h-7 w-7" />
          </span>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t('recent.empty')}</p>
          <Link
            to="/analyze"
            className="btn-3d mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            <Sparkles className="h-4 w-4" />
            {t('recent.emptyCta')}
          </Link>
        </motion.div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                to={a.status === 'completed' ? `/results/${a.id}` : `/progress/${a.id}`}
                className="hover-3d group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
              >
                <div className="relative aspect-video bg-muted">
                  {a.thumbnail_url ? (
                    <Image src={a.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute end-2 top-2">
                    <StatusBadge status={a.status} />
                  </div>
                  {a.score != null && a.status === 'completed' && (
                    <div className="absolute bottom-2 start-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
                      {t('recent.score')} {a.score}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    {a.source_type === 'youtube' ? t('recent.type.youtube') : t('recent.type.upload')}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm font-semibold">{a.source_label || '—'}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}