import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Pencil, Sparkles, ArrowLeft, Info, Lightbulb, ImageDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ScoreRing from '@/components/ScoreRing';
import TitleList from '@/components/results/TitleList';
import Improvements from '@/components/results/Improvements';
import { useI18n } from '@/lib/i18n';

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'cliplens-thumbnail.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch {
    window.open(url, '_blank');
  }
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rec = await base44.entities.Analysis.get(id);
        if (!active) return;
        if (rec.status !== 'completed') {
          navigate(`/progress/${id}`, { replace: true });
          return;
        }
        setRecord(rec);
      } catch {
        if (active) navigate('/', { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, navigate]);

  if (loading || !record) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  const titles = record.title_suggestions || [];
  const improvements = record.improvements || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <button
        onClick={() => navigate('/')}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('results.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('results.subtitle')}</p>
      </motion.div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* Score + summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1"
        >
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-col items-center text-center">
              <ScoreRing score={record.score || 0} size={140} stroke={12} label={t('results.scoreLabel')} />
              <h2 className="mt-4 font-display text-lg font-bold">{t('results.scoreTitle')}</h2>
            </div>
            <div className="mt-4 flex gap-2.5 rounded-2xl bg-secondary/50 p-3.5">
              <Info className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">{t('results.scoreDesc')}</p>
            </div>
            {record.summary && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('results.summary')}</p>
                <p className="mt-1.5 text-sm leading-relaxed">{record.summary}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Thumbnail */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="lg:col-span-2"
        >
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div className="relative aspect-video bg-muted">
              {record.thumbnail_url ? (
                <img src={record.thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full animate-pulse bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="p-5">
              <h2 className="font-display text-lg font-bold">{t('results.thumbnailTitle')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('results.thumbnailDesc')}</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  onClick={() => downloadImage(record.thumbnail_url, 'cliplens-thumbnail.jpg')}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-110 active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  {t('results.downloadThumb')}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-all hover:bg-secondary active:scale-95"
                >
                  <Pencil className="h-4 w-4" />
                  {t('results.editThumb')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Titles */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-bold">{t('results.titlesTitle')}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t('results.titlesSubtitle')}</p>
        <div className="mt-5">
          <TitleList titles={titles} />
        </div>
      </section>

      {/* Improvements */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">{t('results.improveTitle')}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t('results.improveSubtitle')}</p>
        <div className="mt-5">
          <Improvements items={improvements} />
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mt-8 flex gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
        <Info className="h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">{t('results.disclaimer')}</p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/analyze"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-110 active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          {t('results.another')}
        </Link>
        <Link
          to="/history"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold transition-all hover:bg-secondary active:scale-95"
        >
          <ImageDown className="h-4 w-4" />
          {t('nav.history')}
        </Link>
      </div>
    </div>
  );
}