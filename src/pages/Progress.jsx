import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Loader2, X, Sparkles, ArrowRight, Film, Scissors, Type, Wand2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ANALYSIS_STAGES, generateMockResult } from '@/lib/mockAnalysis';
import { useI18n } from '@/lib/i18n';

const STAGE_ICONS = { uploading: Film, scenes: Scissors, titles: Type, preparing: Wand2 };

function stageForProgress(p) {
  if (p < 25) return 'uploading';
  if (p < 55) return 'scenes';
  if (p < 85) return 'titles';
  return 'preparing';
}

export default function Progress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [record, setRecord] = useState(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const lastStageRef = useRef(null);

  // load record
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rec = await base44.entities.Analysis.get(id);
        if (!active) return;
        if (rec.status === 'completed') {
          navigate(`/results/${id}`, { replace: true });
          return;
        }
        if (rec.status === 'failed') {
          setRecord(rec);
          setFailed(true);
          return;
        }
        setRecord(rec);
        setProgress(rec.progress || 0);
        lastStageRef.current = rec.status;
      } catch {
        if (active) setNotFound(true);
      }
    })();
    return () => { active = false; };
  }, [id, navigate]);

  // run the staged simulation
  useEffect(() => {
    if (!record || done || notFound || failed) return;
    let p = progress;
    const iv = setInterval(async () => {
      p = Math.min(100, p + (reduce ? 12 : Math.random() * 7 + 3));
      setProgress(p);
      const stage = stageForProgress(p);

      if (stage !== lastStageRef.current) {
        lastStageRef.current = stage;
        try {
          await base44.entities.Analysis.update(id, { status: stage, progress: Math.round(p) });
        } catch {
          /* non-blocking */
        }
      }

      if (p >= 100) {
        clearInterval(iv);
        const result = generateMockResult({ sourceType: record.source_type, sourceLabel: record.source_label });
        try {
          await base44.entities.Analysis.update(id, {
            status: 'completed',
            progress: 100,
            score: result.score,
            summary: result.summary,
            thumbnail_url: result.thumbnail_url,
            title_suggestions: result.title_suggestions,
            improvements: result.improvements,
          });
        } catch {
          /* non-blocking */
        }
        setDone(true);
      }
    }, reduce ? 250 : 420);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, done, notFound, failed]);

  const cancel = async () => {
    try { await base44.entities.Analysis.delete(id); } catch { /* ignore */ }
    navigate('/');
  };

  const retry = () => {
    setFailed(false);
    setProgress(0);
    lastStageRef.current = 'uploading';
    try {
      base44.entities.Analysis.update(id, { status: 'uploading', progress: 0, error_message: '' }).catch(() => {});
    } catch { /* non-blocking */ }
    setRecord((r) => ({ ...r, status: 'uploading', progress: 0 }));
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm font-semibold text-primary hover:underline">
          {t('results.backHome')}
        </button>
      </div>
    );
  }

  const currentStage = stageForProgress(progress);
  const stageIndex = ANALYSIS_STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="flex flex-col items-center text-center">
        {/* Animated lens */}
        <div className="relative mb-8 grid h-44 w-44 place-items-center">
          <motion.div
            animate={reduce ? {} : { rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30"
          />
          <motion.div
            animate={reduce ? {} : { rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-3 rounded-full border border-primary/20"
          />
          <div className="absolute inset-6 rounded-full bg-primary/10 blur-xl" />
          <motion.div
            animate={done ? { scale: [1, 1.15, 1] } : reduce ? {} : { scale: [1, 1.06, 1] }}
            transition={{ duration: done ? 0.6 : 2.4, repeat: done ? 0 : Infinity, ease: 'easeInOut' }}
            className={`relative grid h-20 w-20 place-items-center rounded-full text-white shadow-float ${failed ? 'bg-red-500' : 'brand-gradient'}`}
          >
            {done ? <Check className="h-9 w-9" /> : failed ? <X className="h-9 w-9" /> : <Loader2 className="h-9 w-9 animate-spin" />}
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {failed ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="font-display text-3xl font-extrabold tracking-tight">{t('progress.failed')}</h1>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                {record?.error_message || t('progress.failedDesc')}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={retry}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-float transition-all hover:brightness-110 active:scale-95"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('progress.retry')}
                </button>
                <button
                  onClick={cancel}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold transition-all hover:bg-secondary active:scale-95"
                >
                  <X className="h-4 w-4" />
                  {t('progress.cancel')}
                </button>
              </div>
            </motion.div>
          ) : done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="font-display text-3xl font-extrabold tracking-tight">{t('progress.done')}</h1>
              <p className="mt-2 text-muted-foreground">{t('results.subtitle')}</p>
              <button
                onClick={() => navigate(`/results/${id}`)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-float transition-all hover:brightness-110 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                {t('progress.viewResults')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-display text-3xl font-extrabold tracking-tight">{t('progress.title')}</h1>
              <p className="mt-2 text-muted-foreground">{t('progress.subtitle')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!done && !failed && (
        <>
          {/* Progress bar */}
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-primary">
                {t(ANALYSIS_STAGES[stageIndex].labelKey)}
              </span>
              <span className="font-mono font-semibold tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full brand-gradient"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
          </div>

          {/* Stage timeline */}
          <div className="mt-8 space-y-2">
            {ANALYSIS_STAGES.map((s, i) => {
              const Icon = STAGE_ICONS[s.key];
              const state = i < stageIndex ? 'done' : i === stageIndex ? 'current' : 'upcoming';
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-colors ${
                    state === 'current'
                      ? 'border-primary/40 bg-primary/5'
                      : state === 'done'
                      ? 'border-border bg-card/60'
                      : 'border-border bg-card/30 opacity-60'
                  }`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    state === 'done' ? 'bg-emerald-500/15 text-emerald-500'
                    : state === 'current' ? 'brand-gradient text-white'
                    : 'bg-secondary text-muted-foreground'
                  }`}>
                    {state === 'done' ? <Check className="h-5 w-5" /> : state === 'current' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${state === 'upcoming' ? 'text-muted-foreground' : ''}`}>{t(s.labelKey)}</p>
                    <p className="truncate text-xs text-muted-foreground">{t(s.descKey)}</p>
                  </div>
                  {state === 'current' && (
                    <span className="text-xs font-semibold text-primary">{t('progress.holdOn')}</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <button
            onClick={cancel}
            className="mx-auto mt-8 flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
            {t('progress.cancel')}
          </button>
        </>
      )}
    </div>
  );
}