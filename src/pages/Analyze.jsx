import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Youtube, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { backend, invokeFunction } from '@/api/supabaseClient';
import UploadTab from '@/components/analyze/UploadTab';
import LinkTab from '@/components/analyze/LinkTab';
import { useI18n } from '@/lib/i18n';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useCredits } from '@/lib/CreditContext';
import { deleteAnalysisFrames, saveAnalysisFrames } from '@/lib/videoFrames';

function getYouTubeVideoId(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) return '';
    const id = url.hostname === 'youtu.be'
      ? url.pathname.slice(1)
      : url.pathname === '/watch'
        ? url.searchParams.get('v') || ''
        : url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1] || '';
    return /^[\w-]{11}$/.test(id) ? id : '';
  } catch {
    return '';
  }
}

export default function Analyze() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const { spend } = useCredits();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(params.get('mode') === 'review' ? 'link' : 'upload');
  const [submitting, setSubmitting] = useState(false);
  const [creditError, setCreditError] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    setTab(params.get('mode') === 'review' ? 'link' : 'upload');
  }, [params]);

  const switchTab = (next) => {
    setTab(next);
    setParams(next === 'link' ? { mode: 'review' } : {}, { replace: true });
  };

  const handleStart = async ({
    sourceType,
    sourceLabel,
    sourceUrl,
    studioStats,
    videoContext,
    spokenContent,
    targetLanguage,
    durationSeconds,
    frames,
    referenceFrames,
  }) => {
    setCreditError(false);
    setSubmitError(false);
    setSubmitting(true);
    let analysisId = null;
    try {
      let label = sourceLabel;
      let extra = {};
      if (sourceType === 'upload') {
        if (!Array.isArray(frames) || frames.length < 1) throw new Error('Video frames are missing.');
        extra = {
          duration_seconds: durationSeconds || null,
          youtube_stats: {
            video_context: typeof videoContext === 'string' ? videoContext.slice(0, 3000) : '',
            spoken_content: typeof spokenContent === 'string' ? spokenContent.slice(0, 8000) : '',
            video_language: targetLanguage || 'en',
          },
        };
      }
      // Retrieve public YouTube metadata and combine it with creator-entered
      // Studio numbers. Manus still receives the URL for the actual analysis.
      if (sourceType === 'youtube' && sourceUrl) {
        let publicVideo = null;
        try {
          const response = await invokeFunction('fetchYouTubeStats', { url: sourceUrl });
          const data = response?.data;
          if (data && !data.error) publicVideo = data;
        } catch (metadataError) {
          // Public metadata is helpful but must not block Manus from analyzing the URL.
          console.warn('Could not fetch public YouTube metadata:', metadataError);
        }
        const st = studioStats || {};
        if (publicVideo?.title) label = `YouTube · ${publicVideo.title}`;
        const videoId = getYouTubeVideoId(sourceUrl);
        extra = {
          thumbnail_url: publicVideo?.thumbnail_url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''),
          duration_seconds: typeof st.duration === 'number' ? st.duration : publicVideo?.duration_seconds || null,
          youtube_stats: {
            video_duration: st.duration ?? null,
            video_language: st.video_language || targetLanguage || 'en',
            has_reference_images: Array.isArray(referenceFrames) && referenceFrames.length > 0,
            video_context: typeof videoContext === 'string' ? videoContext.slice(0, 3000) : '',
            spoken_content: typeof spokenContent === 'string' ? spokenContent.slice(0, 8000) : '',
            views: st.views ?? publicVideo?.views ?? null,
            likes: publicVideo?.likes ?? null,
            comments: publicVideo?.comments ?? null,
            channel: publicVideo?.channel || '',
            published_at: publicVideo?.published_at || '',
            video_title: publicVideo?.title || '',
            video_description: publicVideo?.description || '',
            impressions: st.impressions ?? null,
            ctr: st.ctr ?? null,
            avg_view_duration: st.avgView ?? null,
            traffic_sources: Array.isArray(st.traffic_sources) ? st.traffic_sources : [],
            video_age_days: st.video_age_days ?? null,
            content_type: st.content_type || '',
            target_audience: st.target_audience || '',
            retention_percentage: st.retention_percentage ?? null,
            previous_views: st.previous_views ?? null,
            previous_ctr: st.previous_ctr ?? null,
          },
        };
      }
      const rec = await backend.data.Analysis.create({
        source_type: sourceType,
        source_label: label,
        source_url: sourceUrl || '',
        status: 'uploading',
        progress: 0,
        ...extra,
      });
      analysisId = rec.id;
      const localReferenceFrames = sourceType === 'upload' ? frames : referenceFrames;
      if (Array.isArray(localReferenceFrames) && localReferenceFrames.length) {
        await saveAnalysisFrames(rec.id, localReferenceFrames);
      }
      if (settings?.credits_enabled) {
        const creditResult = await spend(rec.id);
        if (!creditResult || creditResult.ok === false) {
          if (Array.isArray(localReferenceFrames) && localReferenceFrames.length) {
            try { await deleteAnalysisFrames(rec.id); } catch { /* local cleanup is best-effort */ }
          }
          await backend.data.Analysis.delete(rec.id);
          setCreditError(true);
          setSubmitting(false);
          return;
        }
      }
      navigate(`/progress/${rec.id}`);
    } catch (error) {
      console.error('Could not start video analysis:', error);
      if (analysisId) {
        try {
          await deleteAnalysisFrames(analysisId);
        } catch (cleanupError) {
          console.error('Could not remove local video frames:', cleanupError);
        }
        try {
          await backend.data.Analysis.delete(analysisId);
        } catch (cleanupError) {
          console.error('Could not remove the unstarted analysis record:', cleanupError);
        }
      }
      setSubmitError(true);
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: 'upload', label: t('add.tab.upload'), icon: Upload },
    { key: 'link', label: t('add.tab.link'), icon: Youtube },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
      <button
        onClick={() => navigate('/')}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('add.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('add.subtitle')}</p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
          {t('add.thumbnailUsageNotice')}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="mt-7 inline-flex w-full rounded-full border border-border bg-card/60 p-1 shadow-soft">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              type="button"
              onClick={() => switchTab(tb.key)}
              className={`relative inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 -z-10 rounded-full brand-gradient shadow-soft"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="h-4 w-4" />
              {tb.label}
            </button>
          );
        })}
      </div>

      {creditError && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-accent/60 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold">{t('analyze.credits.title')}</p>
            <p className="text-xs text-muted-foreground">{t('analyze.credits.desc')}</p>
          </div>
          <Link
            to="/"
            onClick={() => setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 150)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t('analyze.credits.cta')}
          </Link>
        </div>
      )}
      {submitError && tab !== 'link' && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t('analyze.submitError')}
        </p>
      )}

      <div className="mt-6">
        {tab === 'upload' ? (
          <UploadTab
            onStart={handleStart}
            disabled={submitting}
            creditCost={settings?.credits_enabled ? Number(settings.credits_upload_cost ?? 2) : undefined}
          />
        ) : (
          <LinkTab
            onStart={handleStart}
            disabled={submitting}
            submitError={submitError}
            creditCost={settings?.credits_enabled ? Number(settings.credits_cost ?? 1) : undefined}
          />
        )}
      </div>

      {submitting && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {tab === 'link' ? t('add.link.fetching') : t('common.loading')}
        </p>
      )}
    </div>
  );
}
