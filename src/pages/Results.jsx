import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Sparkles, ArrowLeft, Lightbulb, ImageDown, ImageOff, CircleAlert, X, Loader2, Type } from 'lucide-react';
import { backend, invokeFunction } from '@/api/supabaseClient';
import ScoreRing from '@/components/ScoreRing';
import TitleList from '@/components/results/TitleList';
import Improvements from '@/components/results/Improvements';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { getAnalysisReferenceImage } from '@/lib/videoFrames';
import { waitForManusTask } from '@/lib/manusTasks';
import PolicyLinks from '@/components/PolicyLinks';

async function downloadImage(url, filename) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error('thumbnail_download_failed');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('invalid_thumbnail');
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `${filename || 'cliplens-thumbnail'}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
}

function sectionFailureText(reason, t, fallbackKey) {
  if (reason === 'manus_api_not_configured') return t('results.manusNotConfigured');
  if (reason === 'manus_status_not_configured') return t('results.manusBackendNotConfigured');
  if (reason === 'manus_unauthorized' || reason === 'manus_unauthenticated' || reason === 'manus_invalid_api_key') return t('results.manusAuthFailed');
  if (typeof reason === 'string' && reason.startsWith('manus_rate_limited')) return t('results.manusRateLimited');
  if (typeof reason === 'string' && reason.startsWith('manus_')) return t('results.manusRequestFailed');
  if (reason === 'edge_function_unreachable') return t('results.edgeFunctionUnreachable');
  if (reason === 'analysis_request_failed') return t('results.failure.analysis');
  if (reason === 'analysis_result_incomplete' || reason === 'invalid_ai_response' || reason === 'empty_ai_response') {
    return t('results.failure.incomplete');
  }
  if (reason === 'thumbnail_storage_not_configured' || reason === 'thumbnail_storage_upload_failed') {
    return t('results.failure.thumbnailSave');
  }
  if (reason === 'thumbnail_unavailable') return t('results.failure.thumbnailReference');
  if (typeof reason === 'string' && reason.startsWith('thumbnail_')) return t('results.failure.thumbnailImage');
  return t(fallbackKey);
}

function SectionFailure({ reason, fallbackKey, t }) {
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-muted-foreground" role="status">
      <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <span><strong className="font-semibold text-foreground">{t('results.sectionFailed')}:</strong> {sectionFailureText(reason, t, fallbackKey)}</span>
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useI18n();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadError, setDownloadError] = useState(false);
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState('');
  const automaticThumbnailAttempt = useRef('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rec = await backend.data.Analysis.get(id);
        if (!active) return;
        setThumbnailPrompt(typeof rec.youtube_stats?.thumbnail_image_prompt === 'string'
          ? rec.youtube_stats.thumbnail_image_prompt
          : rec.source_type === 'upload'
            ? ''
            : rec.youtube_stats?.video_title || rec.source_label || '');
        if (!['completed', 'failed'].includes(rec.status)) {
          if (['completed', 'failed'].includes(location.state?.analysisRecord?.status)) {
            setRecord(location.state.analysisRecord);
            return;
          }
          navigate(`/progress/${id}`, { replace: true });
          return;
        }
        setRecord(rec);
      } catch {
        if (active && location.state?.analysisRecord) setRecord(location.state.analysisRecord);
        else if (active) navigate('/', { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, navigate, location.state]);

  const stats = record?.youtube_stats;
  const sections = stats?.analysis_sections || {};
  const generateThumbnail = useCallback(async () => {
    if (!record || generatingThumbnail) return;
    setGeneratingThumbnail(true);
    setThumbnailError('');
    try {
      const referenceImage = await getAnalysisReferenceImage(id).catch((referenceError) => {
        console.warn('Could not prepare local video reference frames:', referenceError);
        return null;
      });
      const response = await invokeFunction('generateThumbnail', {
        analysisId: id,
        prompt: thumbnailPrompt.trim().slice(0, 2400),
        ...(referenceImage ? { referenceImage } : {}),
      });
      if (typeof response?.data?.taskId !== 'string') throw new Error('manus_thumbnail_task_create_failed');
      const completion = await waitForManusTask(id, 'thumbnail');
      const generatedUrl = typeof completion?.url === 'string' ? completion.url : '';
      if (!generatedUrl) throw new Error('manus_thumbnail_image_missing');
      const nextStats = {
        ...(record.youtube_stats || {}),
        generated_thumbnail_url: generatedUrl,
        manus_thumbnail_task_id: response.data.taskId,
        manus_thumbnail_task_signature: response.data.taskSignature,
        manus_thumbnail_result_task_id: response.data.taskId,
        thumbnail_generation_error: null,
        analysis_sections: {
          ...sections,
          thumbnailImage: { status: 'ready', reason: '' },
        },
      };
      setRecord((current) => ({ ...current, youtube_stats: nextStats }));
    } catch (error) {
      let code = '';
      if (error?.context instanceof Response) {
        try {
          const payload = await error.context.clone().json();
          if (typeof payload?.error === 'string') code = payload.error;
        } catch {
          // Present a safe generic message if the function did not return JSON.
        }
      }
      if (!code && typeof error?.message === 'string') code = error.message;
      setThumbnailError(code);
      const nextStats = {
        ...(record.youtube_stats || {}),
        thumbnail_generation_error: code || 'manus_thumbnail_generation_failed',
        analysis_sections: {
          ...sections,
          thumbnailImage: { status: 'failed', reason: code || 'manus_thumbnail_generation_failed' },
        },
      };
      try {
        await backend.data.Analysis.update(id, { youtube_stats: nextStats });
      } catch (saveError) {
        console.warn('Could not save the thumbnail generation failure:', saveError);
      } finally {
        setRecord((current) => current ? { ...current, youtube_stats: nextStats } : current);
      }
    } finally {
      setGeneratingThumbnail(false);
    }
  }, [generatingThumbnail, id, record, sections, thumbnailPrompt]);

  useEffect(() => {
    if (
      !record ||
      record.status !== 'completed' ||
      record.youtube_stats?.analysis_sections?.thumbnailImage?.status !== 'pending' ||
      record.youtube_stats?.generated_thumbnail_url ||
      automaticThumbnailAttempt.current === record.id
    ) return;

    // A pending image means the report was saved but thumbnail generation did not
    // finish before navigation. Resume it once when the result page opens.
    automaticThumbnailAttempt.current = record.id;
    void generateThumbnail();
  }, [record, generateThumbnail]);

  if (loading || !record) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  const titles = record.title_suggestions || [];
  const improvements = record.improvements || [];
  const failures = Object.entries(sections).filter(([, value]) => value?.status === 'failed');
  const hasAnyFailure = record.status === 'failed' || failures.length > 0;
  const score = typeof record.score === 'number' ? record.score : null;
  const uploadContentScore = record.source_type === 'upload';
  const meaning = score >= 80 ? t('results.score.strong') : score >= 60 ? t('results.score.good') : t('results.score.needs');
  const meaningCls = score >= 80 ? 'bg-emerald-500/15 text-emerald-500' : score >= 60 ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500';
  const locale = lang === 'ar' ? 'ar' : 'en-US';
  const hasGeneratedThumbnail = typeof stats?.generated_thumbnail_url === 'string' && !!stats.generated_thumbnail_url;
  const thumbnailFailure = sections.thumbnailImage?.reason || stats?.thumbnail_generation_error || '';
  const thumbnailFailed = sections.thumbnailImage?.status === 'failed' || !!thumbnailFailure;
  const suggestedThumbnail = hasGeneratedThumbnail ? stats.generated_thumbnail_url : thumbnailFailed ? '' : record.thumbnail_url;
  const thumbnailDescription = hasGeneratedThumbnail
    ? t(uploadContentScore ? 'results.thumbnailDesc.upload' : 'results.thumbnailDesc')
    : thumbnailFailed
      ? sectionFailureText(thumbnailFailure, t, 'results.failure.thumbnailImage')
      : t('results.referenceThumbnailDesc');
  const hasSummary = typeof record.summary === 'string' && !!record.summary.trim();
  const hasScore = score !== null;
  const summaryFailed = sections.summary?.status === 'failed' || !hasSummary;
  const scoreFailed = sections.score?.status === 'failed' || !hasScore;
  const conceptFailed = sections.thumbnailConcept?.status === 'failed' || (!stats?.thumbnail_concept && hasAnyFailure);
  const fmtNum = (n) => typeof n === 'number' ? new Intl.NumberFormat(locale).format(n) : String(n);
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  const withUnit = (value, unit) => value === 'NA' ? value : `${value}${unit}`;
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:pb-14 lg:pt-12">
      <header className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('common.back')}
          </button>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${hasAnyFailure ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${hasAnyFailure ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {t(hasAnyFailure ? 'results.analysisPartial' : 'progress.done')}
          </span>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">ClipLens · {t('results.title')}</p>
          <h1 className="mt-2 max-w-4xl truncate font-display text-2xl font-extrabold tracking-tight sm:text-4xl">{record.source_label || t('results.title')}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <span>{record.source_type === 'youtube' ? t('recent.type.youtube') : t('recent.type.upload')}</span>
            {record.created_date && <><span aria-hidden="true">·</span><span>{new Date(record.created_date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span></>}
          </p>
        </motion.div>
        {hasAnyFailure && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-300" role="status">
            <CircleAlert className="h-4 w-4 shrink-0" />{t(record.status === 'failed' ? 'results.analysisFailed' : 'results.analysisPartial')}
          </div>
        )}
      </header>

      {record.source_type === 'youtube' && stats && (stats.views != null || stats.ctr != null || stats.impressions != null || stats.avg_view_duration != null) && (
        <section className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t('results.stats')}>
          {[
            stats.views != null && [t('results.views'), fmtNum(stats.views)],
            stats.ctr != null && [t('results.ctr'), withUnit(typeof stats.ctr === 'number' ? stats.ctr.toFixed(1) : stats.ctr, '%')],
            stats.impressions != null && [t('results.impressions'), fmtNum(stats.impressions)],
            stats.avg_view_duration != null && [t('results.avgView'), typeof stats.avg_view_duration === 'number' ? fmtDur(stats.avg_view_duration) : stats.avg_view_duration],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border/70 bg-card/65 px-3.5 py-3 shadow-sm backdrop-blur-xl sm:px-4">
              <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">{label}</p>
              <p className="mt-1 text-sm font-bold tabular-nums sm:text-base">{value}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        {/* Score + summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="order-2 lg:order-1"
        >
          <div className="glass-panel h-full rounded-3xl border border-border/70 p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-1 sm:pt-3">
              {hasScore ? <ScoreRing score={score} size={112} stroke={9} label={t(uploadContentScore ? 'results.scoreLabel.upload' : 'results.scoreLabel')} /> : (
                <div className="grid h-[112px] w-[112px] place-items-center rounded-full border-2 border-dashed border-border text-muted-foreground"><CircleAlert className="h-7 w-7" /></div>
              )}
              <div className="min-w-0 sm:text-center">
                {hasScore && <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${meaningCls}`}>{meaning}</span>}
                <h2 className="mt-2 font-display text-base font-bold sm:text-lg">{t(uploadContentScore ? 'results.scoreTitle.upload' : 'results.scoreTitle')}</h2>
              </div>
            </div>
            {scoreFailed && <SectionFailure reason={sections.score?.reason} fallbackKey="results.failure.score" t={t} />}
            {hasSummary && (
              <div className="mt-5 border-t border-border/60 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('results.summary')}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{record.summary}</p>
              </div>
            )}
            {summaryFailed && <SectionFailure reason={sections.summary?.reason} fallbackKey="results.failure.summary" t={t} />}
          </div>
        </motion.div>

        {/* Thumbnail */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="order-1 lg:order-2"
        >
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/75 shadow-[0_22px_70px_-42px_rgba(0,0,0,.72)] backdrop-blur-2xl">
            <div className="relative aspect-video bg-muted/50">
              {suggestedThumbnail ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      aria-label={t('results.thumbnailTitle')}
                      className="group absolute inset-0 h-full w-full cursor-zoom-in overflow-hidden"
                    >
                      <img
                        src={suggestedThumbnail}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[96vw] border-border/70 bg-background/95 p-2 sm:max-w-[92vw]">
                    <DialogTitle className="sr-only">{t('results.thumbnailTitle')}</DialogTitle>
                    <img
                      src={suggestedThumbnail}
                      alt={t('results.thumbnailTitle')}
                      className="mx-auto max-h-[86vh] max-w-full rounded-lg object-contain"
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="grid h-full w-full place-items-center bg-muted/60 px-6 text-center text-sm text-muted-foreground">
                  <div className="flex max-w-md flex-col items-center gap-2.5">
                    {generatingThumbnail
                      ? <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      : thumbnailFailed
                        ? <ImageOff className="h-8 w-8 text-destructive/80" />
                        : <ImageOff className="h-8 w-8 text-muted-foreground/70" />}
                    <span>{generatingThumbnail ? t('results.thumbnailGenerating') : thumbnailFailed ? t('results.failure.thumbnailImage') : thumbnailDescription}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-bold sm:text-lg">{t(hasGeneratedThumbnail ? 'results.thumbnailTitle' : 'results.referenceThumbnailTitle')}</h2>
                <span className="rounded-full border border-border/70 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">16:9</span>
              </div>
              {thumbnailFailed && <p className="mt-2 text-xs text-destructive">{thumbnailDescription}</p>}
              {stats?.thumbnail_text && (
                <p className="mt-2 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm">
                  <span className="text-xs text-muted-foreground">{t('results.thumbnailHookLabel')}:</span>
                  <span className="font-bold text-foreground" dir={stats.video_language === 'ar' ? 'rtl' : 'auto'}>{stats.thumbnail_text}</span>
                </p>
              )}
              {conceptFailed ? <SectionFailure reason={sections.thumbnailConcept?.reason} fallbackKey="results.failure.thumbnailConcept" t={t} /> : (!stats?.thumbnail_concept && !hasGeneratedThumbnail ? <SectionFailure reason="analysis_result_incomplete" fallbackKey="results.failure.thumbnailConcept" t={t} /> : null)}
              <details className="mt-3 rounded-2xl border border-border/60 bg-background/25 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground">{t('results.thumbnailPrompt')}</summary>
                <textarea
                  id="thumbnail-prompt"
                  value={thumbnailPrompt}
                  onChange={(event) => setThumbnailPrompt(event.target.value.slice(0, 2400))}
                  rows={3}
                  maxLength={2400}
                  className="mt-3 w-full resize-y rounded-xl border border-border bg-background/70 px-3.5 py-3 text-sm leading-relaxed outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                  aria-describedby="thumbnail-prompt-hint"
                />
                <p id="thumbnail-prompt-hint" className="text-xs text-muted-foreground">{t('results.thumbnailPromptHint')}</p>
              </details>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={generateThumbnail}
                  disabled={generatingThumbnail}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-110 active:scale-95 disabled:cursor-wait disabled:opacity-70 sm:text-sm"
                >
                  {generatingThumbnail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generatingThumbnail
                    ? t('results.thumbnailGenerating')
                    : t(hasGeneratedThumbnail ? 'results.regenerateThumb' : 'results.generateThumb')}
                </button>
                {hasGeneratedThumbnail && (
                  <button
                    onClick={async () => {
                      setDownloadError(false);
                      try {
                        await downloadImage(suggestedThumbnail, 'cliplens-thumbnail');
                      } catch (error) {
                        console.error('Thumbnail download failed:', error);
                        setDownloadError(true);
                      }
                    }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background/40 px-4 py-2 text-xs font-semibold transition-all hover:bg-secondary active:scale-95 sm:text-sm"
                  >
                    <Download className="h-4 w-4" />
                    {t('results.downloadThumb')}
                  </button>
                )}
              </div>
              {thumbnailError && <p role="alert" className="mt-3 text-sm text-destructive">
                {sectionFailureText(thumbnailError, t, 'results.thumbnailGenerationError')}
              </p>}
              {downloadError && <p role="alert" className="mt-3 text-sm text-destructive">{t('results.thumbnailDownloadError')}</p>}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-3xl border border-border/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Type className="h-4 w-4" /></span>
            <h2 className="font-display text-base font-bold">{t('results.titlesTitle')}</h2>
          </div>
          {titles.length ? <TitleList titles={titles} /> : <SectionFailure reason={sections.titles?.reason} fallbackKey="results.failure.titles" t={t} />}
        </section>
        <section className="glass-panel rounded-3xl border border-border/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Lightbulb className="h-4 w-4" /></span>
            <h2 className="font-display text-base font-bold">{t('results.improveTitle')}</h2>
          </div>
          {improvements.length ? <Improvements items={improvements} /> : <SectionFailure reason={sections.improvements?.reason} fallbackKey="results.failure.improvements" t={t} />}
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        {record.status === 'failed' && (
          <Link to={`/progress/${id}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold transition-all hover:bg-secondary active:scale-95">
            <Sparkles className="h-4 w-4" />{t('results.retryAnalysis')}
          </Link>
        )}
        <Link
          to="/analyze"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-110 active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          {t('results.another')}
        </Link>
        <Link
          to="/history"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold transition-all hover:bg-secondary active:scale-95 sm:text-sm"
        >
          <ImageDown className="h-4 w-4" />
          {t('nav.history')}
        </Link>
      </div>
      <PolicyLinks className="mt-6 border-t border-border/50 pt-4" />
    </main>
  );
}
