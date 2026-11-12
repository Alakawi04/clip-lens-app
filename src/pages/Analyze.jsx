import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowLeft, BarChart3, Check, Coins, Eye, Image as ImageIcon,
  Loader2, Sparkles, Type, Youtube,
} from 'lucide-react';
import { backend, invokeFunction } from '@/api/supabaseClient';
import LinkTab from '@/components/analyze/LinkTab';
import YouTubeToolForm from '@/components/analyze/YouTubeToolForm';
import { useI18n } from '@/lib/i18n';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useCredits } from '@/lib/CreditContext';
import { useAuth } from '@/lib/AuthContext';
import { saveAnalysisFrames } from '@/lib/videoFrames';

const TOOL_KEYS = ['review', 'titles', 'thumbnail'];

function getYouTubeVideoId(value) {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) return '';
    const id = url.hostname === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.pathname === '/watch'
        ? url.searchParams.get('v')
        : url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})\/?$/)?.[1];
    return /^[\w-]{11}$/.test(id || '') ? id : '';
  } catch {
    return '';
  }
}

function canonicalYouTubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function SideCard({ icon: Icon, title, intro, children }) {
  return (
    <section className="tool-side-card">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-display text-sm font-bold">{title}</h3>
      </div>
      {intro && <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{intro}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

export default function Analyze() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const { spendTool } = useCredits();
  const { user } = useAuth();
  const route = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const requestedTool = route.tool || params.get('tool') || (params.get('mode') === 'review' ? 'review' : 'review');
  const tool = TOOL_KEYS.includes(requestedTool) ? requestedTool : 'review';
  const referenceId = params.get('analysisId') || '';
  const switcherRef = useRef(null);
  const [initialRecord, setInitialRecord] = useState(null);
  const [loadingReference, setLoadingReference] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creditError, setCreditError] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    setInitialRecord(null);
    if (!referenceId) {
      setLoadingReference(false);
      return undefined;
    }
    let active = true;
    setLoadingReference(true);
    backend.data.Analysis.get(referenceId).then((record) => {
      if (active && record.source_type === 'youtube') setInitialRecord(record);
    }).catch(() => {}).finally(() => {
      if (active) setLoadingReference(false);
    });
    return () => { active = false; };
  }, [referenceId]);

  useEffect(() => {
    const box = switcherRef.current;
    const active = box?.querySelector('.is-active');
    if (!box || !active || box.scrollWidth <= box.clientWidth) return;
    const timer = window.setTimeout(() => {
      box.scrollLeft += active.getBoundingClientRect().left - box.getBoundingClientRect().left - 16;
    }, 150);
    return () => window.clearTimeout(timer);
  }, [tool]);

  const findExistingVideo = async (videoId) => {
    if (!user?.id) return null;
    const page = await backend.data.Analysis.filter(
      { user_id: user.id, source_type: 'youtube', source_url: { $regex: videoId } },
      { sort: '-updated_date', limit: 1000 }
    );
    return (page.items || []).find((item) => getYouTubeVideoId(item.source_url || '') === videoId) || null;
  };

  const handleStart = async (payload) => {
    setCreditError(false);
    setSubmitError(false);
    setSubmitting(true);
    let record = null;
    let created = false;
    let creditCharged = false;
    const toolMode = payload.toolMode || 'review';
    const videoId = getYouTubeVideoId(payload.sourceUrl || '');
    if (!videoId) {
      setSubmitError(true);
      setSubmitting(false);
      return;
    }
    const requestId = crypto.randomUUID();
    try {
      const sourceUrl = canonicalYouTubeUrl(videoId);
      record = (referenceId && initialRecord && getYouTubeVideoId(initialRecord.source_url || '') === videoId)
        ? initialRecord
        : await findExistingVideo(videoId);
      const existingStats = record?.youtube_stats || {};
      let publicVideo = null;
      if (!record || !existingStats.video_title || !existingStats.video_description || !record.thumbnail_url) {
        try {
          const response = await invokeFunction('fetchYouTubeStats', { url: sourceUrl });
          if (response?.data && !response.data.error) publicVideo = response.data;
        } catch (metadataError) {
          console.warn('Could not fetch public YouTube metadata:', metadataError);
        }
      }
      const submittedStats = payload.studioStats || {};
      const nextStats = {
        ...existingStats,
        ...(publicVideo ? {
          video_title: publicVideo.title || existingStats.video_title || '',
          video_description: publicVideo.description || existingStats.video_description || '',
          views: publicVideo.views ?? existingStats.views ?? null,
          likes: publicVideo.likes ?? existingStats.likes ?? null,
          comments: publicVideo.comments ?? existingStats.comments ?? null,
          channel: publicVideo.channel || existingStats.channel || '',
          published_at: publicVideo.published_at || existingStats.published_at || '',
        } : {}),
        ...submittedStats,
        ...(typeof submittedStats.avgView === 'number' ? { avg_view_duration: submittedStats.avgView } : {}),
        ...(typeof submittedStats.duration === 'number' ? { video_duration: submittedStats.duration } : {}),
        ...(typeof submittedStats.duration === 'number' ? {} : publicVideo?.duration_seconds ? { video_duration: publicVideo.duration_seconds } : {}),
        impressions: submittedStats.impressions ?? existingStats.impressions ?? null,
        ctr: submittedStats.ctr ?? existingStats.ctr ?? null,
        views: submittedStats.views ?? publicVideo?.views ?? existingStats.views ?? null,
        avg_view_duration: submittedStats.avgView ?? existingStats.avg_view_duration ?? null,
        traffic_sources: submittedStats.traffic_sources ?? existingStats.traffic_sources ?? [],
        video_age_days: submittedStats.video_age_days ?? existingStats.video_age_days ?? null,
        content_type: submittedStats.content_type ?? existingStats.content_type ?? '',
        target_audience: submittedStats.target_audience ?? existingStats.target_audience ?? '',
        retention_percentage: submittedStats.retention_percentage ?? existingStats.retention_percentage ?? null,
        previous_views: submittedStats.previous_views ?? existingStats.previous_views ?? null,
        previous_ctr: submittedStats.previous_ctr ?? existingStats.previous_ctr ?? null,
        video_context: payload.videoContext || existingStats.video_context || '',
        creator_problem: payload.creatorProblem || existingStats.creator_problem || '',
        video_language: submittedStats.video_language || existingStats.video_language || 'auto',
        video_language_mode: submittedStats.video_language_mode || existingStats.video_language_mode || 'auto',
        has_reference_images: Array.isArray(payload.referenceFrames) && payload.referenceFrames.length > 0
          ? true
          : existingStats.has_reference_images || false,
        tool_mode: toolMode,
        tool_request_id: requestId,
        thumbnail_request_id: toolMode === 'thumbnail' ? requestId : existingStats.thumbnail_request_id || null,
        manus_analysis_task_id: toolMode === 'thumbnail' ? existingStats.manus_analysis_task_id : null,
        manus_analysis_task_signature: toolMode === 'thumbnail' ? existingStats.manus_analysis_task_signature : null,
      };
      const videoTitle = publicVideo?.title || existingStats.video_title || payload.sourceLabel;
      const videoThumb = publicVideo?.thumbnail_url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');
      const initialStatus = toolMode === 'thumbnail' ? 'completed' : 'uploading';

      if (!record) {
        record = await backend.data.Analysis.create({
          source_type: 'youtube',
          source_label: videoTitle,
          source_url: sourceUrl,
          status: initialStatus,
          progress: toolMode === 'thumbnail' ? 100 : 0,
          thumbnail_url: videoThumb,
          duration_seconds: publicVideo?.duration_seconds || null,
          youtube_stats: nextStats,
        });
        created = true;
      }

      const billing = await spendTool(record.id, toolMode, requestId);
      if (!billing || billing.ok === false) {
        if (created) await backend.data.Analysis.delete(record.id);
        setCreditError(true);
        setSubmitting(false);
        return;
      }
      creditCharged = true;

      if (!created) {
        const updates = {
          source_label: videoTitle,
          source_url: sourceUrl,
          thumbnail_url: videoThumb || record.thumbnail_url,
          duration_seconds: publicVideo?.duration_seconds || record.duration_seconds || null,
          youtube_stats: nextStats,
          status: initialStatus,
          progress: toolMode === 'thumbnail' ? 100 : 0,
          error_message: '',
        };
        if (toolMode === 'thumbnail') {
          updates.youtube_stats = {
            ...nextStats,
            analysis_sections: {
              ...(existingStats.analysis_sections || {}),
              thumbnailImage: { status: 'pending', reason: '' },
            },
            generated_thumbnail_url: null,
            thumbnail_generation_error: null,
          };
        }
        record = await backend.data.Analysis.update(record.id, updates);
      } else if (toolMode === 'thumbnail') {
        record = await backend.data.Analysis.update(record.id, {
          youtube_stats: {
            ...nextStats,
            analysis_sections: { thumbnailImage: { status: 'pending', reason: '' } },
          },
        });
      }

      if (Array.isArray(payload.referenceFrames) && payload.referenceFrames.length) {
        await saveAnalysisFrames(record.id, payload.referenceFrames);
      }

      if (toolMode === 'thumbnail') {
        navigate(`/results/${record.id}`, { state: { analysisRecord: record } });
      } else {
        navigate(`/progress/${record.id}`);
      }
    } catch (error) {
      console.error('Could not start the YouTube tool:', error);
      if (creditCharged && record?.id) {
        try {
          await invokeFunction('refundToolCredit', { analysisId: record.id, requestId });
        } catch (refundError) {
          console.warn('Could not refund the unused tool credit:', refundError);
        }
      }
      if (created && record?.id) {
        try { await backend.data.Analysis.delete(record.id); } catch { /* keep a partially saved result for recovery */ }
      }
      setSubmitError(true);
      setSubmitting(false);
    }
  };

  const toolPage = {
    review: { key: 'review', title: t('tools.review.title'), description: t('tools.review.desc'), icon: BarChart3, index: '01' },
    titles: { key: 'titles', title: t('tools.titles.title'), description: t('tools.titles.desc'), icon: Type, index: '02' },
    thumbnail: { key: 'thumbnail', title: t('tools.thumbnail.title'), description: t('tools.thumbnail.desc'), icon: ImageIcon, index: '03' },
  }[tool];
  const creditCost = creditCostFor(tool, settings);
  const tools = [
    { key: 'review', to: '/analyze/review', icon: BarChart3, title: t('tools.review.title'), index: '01' },
    { key: 'titles', to: '/analyze/titles', icon: Type, title: t('tools.titles.title'), index: '02' },
    { key: 'thumbnail', to: '/analyze/thumbnail', icon: ImageIcon, title: t('tools.thumbnail.title'), index: '03' },
  ];
  const initialUrl = initialRecord?.source_url || '';

  const toolForm = tool === 'review'
    ? <LinkTab onStart={(payload) => handleStart({ ...payload, toolMode: 'review' })} initialUrl={initialUrl} initialStats={initialRecord?.youtube_stats} disabled={submitting} submitError={submitError} creditCost={settings?.credits_enabled ? Number(creditCost) : undefined} />
    : <YouTubeToolForm key={tool} tool={tool} initialUrl={initialUrl} initialStats={initialRecord?.youtube_stats} onStart={handleStart} disabled={submitting} submitError={submitError} creditCost={settings?.credits_enabled ? Number(creditCost) : undefined} />;

  const savedMetric = (value) => {
    if (value == null || value === '') return '—';
    const numeric = Number(value);
    return Number.isFinite(numeric) ? new Intl.NumberFormat().format(numeric) : String(value);
  };

  return (
    <main className={`tool-studio tool-studio--${tool} relative isolate min-h-[calc(100svh-8rem)] overflow-hidden`}>
      <div className="relative mx-auto max-w-[78rem] px-4 pb-12 pt-5 sm:px-6 lg:px-8 lg:pb-16 lg:pt-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-3.5 py-2 text-sm font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('common.back')}
          </button>
          <span className="tool-crumb"><span className="tool-crumb-dot" aria-hidden="true" />ClipLens Studio <i>/</i> {t('tools.pageTitle')}</span>
        </div>

        <header className={`tool-hub-header ${initialRecord ? 'tool-hub-header--saved' : ''}`}>
          <div className="min-w-0">
            <p className="tool-kicker"><Sparkles className="h-3.5 w-3.5" />{t('tools.pageTitle')}</p>
            <h1>{toolPage.title}</h1>
            <p className="tool-hub-lede">{toolPage.description}</p>
          </div>

          {initialRecord && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tool-saved-card">
              <div className="tool-saved-thumb">
                {initialRecord.thumbnail_url
                  ? <img src={initialRecord.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  : <Youtube className="h-5 w-5 text-primary" />}
              </div>
              <div className="min-w-0">
                <p className="tool-saved-label">{t('tools.studio.saved')}</p>
                <p className="mt-1 truncate text-sm font-semibold">{initialRecord.source_label || t('progress.videoContext')}</p>
              </div>
            </motion.div>
          )}
        </header>

        <nav ref={switcherRef} className="tool-switcher" aria-label={t('tools.pageTitle')}>
          {tools.map((item) => {
            const Icon = item.icon;
            const active = item.key === tool;
            const cost = creditCostFor(item.key, settings);
            return (
              <Link
                key={item.key}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`tool-switch ${active ? 'is-active' : ''}`}
              >
                <span className="tool-switch-top">
                  <span className="tool-switch-index">{item.index}</span>
                  <span className="tool-switch-icon"><Icon className="h-4 w-4" /></span>
                </span>
                <span className="tool-switch-body">
                  <span className="tool-switch-name">{item.title}</span>
                  <span className="tool-switch-meta">
                    {active
                      ? <span className="tool-switch-state">{t('tools.studio.current')}</span>
                      : <span>{t('tools.studio.switch')}</span>}
                    {settings?.credits_enabled && Number(cost) > 0 && (
                      <span className="tool-switch-cost"><Coins className="h-3 w-3" />{cost}</span>
                    )}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <section className={`tool-workbench tool-workbench--${tool}`}>
          <div className="tool-workbench-head">
            <div className="tool-form-section-heading">
              <span>{toolPage.index}</span>
              <div>
                <h2>{t('tools.studio.step')} · {t('tools.studio.formTitle')}</h2>
              </div>
            </div>
            <div className="tool-workbench-badges">
              {settings?.credits_enabled && Number(creditCost) > 0 && (
                <span className="tool-cost-pill"><Coins className="h-3.5 w-3.5" />{creditCost} {Number(creditCost) === 1 ? t('pricing.credit') : t('pricing.credits')}</span>
              )}
            </div>
          </div>

          {creditError && (
            <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/35 bg-primary/[0.06] px-4 py-3 sm:mx-5">
              <div>
                <p className="text-sm font-semibold">{t('analyze.credits.title')}</p>
                <p className="text-xs text-muted-foreground">{t('analyze.credits.desc')}</p>
              </div>
              <Link to="/" onClick={() => setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 150)} className="text-sm font-semibold text-primary hover:underline">{t('analyze.credits.cta')}</Link>
            </div>
          )}
          {submitError && <p role="alert" className="mx-4 mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:mx-5">{t('analyze.submitError')}</p>}

          {loadingReference ? (
            <div className="grid min-h-80 place-items-center p-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-primary" />{t('tools.form.working')}</span>
            </div>
          ) : (
            <div className="tool-workbench-grid">
              <div className="tool-workbench-form">
                {toolForm}
              </div>

              <aside className="tool-workbench-side">
                {tool === 'review' && (
                  <>
                    <SideCard icon={Activity} title={t('tools.review.signalsTitle')}>
                      <div className="space-y-2">
                        {[t('tools.review.signalHook'), t('tools.review.signalValue'), t('tools.review.signalPacing'), t('tools.review.signalMetrics')].map((signal) => (
                          <div key={signal} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/35 px-3 py-2.5 text-xs font-medium">
                            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />{signal}
                          </div>
                        ))}
                      </div>
                    </SideCard>
                    <SideCard icon={Eye} title={t('tools.review.signalPreview')}>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          [t('tools.review.metric.impressions'), initialRecord?.youtube_stats?.impressions],
                          [t('tools.review.metric.ctr'), initialRecord?.youtube_stats?.ctr],
                          [t('tools.review.metric.views'), initialRecord?.youtube_stats?.views],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl border border-border/60 bg-background/40 px-2.5 py-2.5">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                            <p className="mt-1 font-display text-sm font-bold tabular-nums">{savedMetric(value)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex h-12 items-end gap-1.5" aria-hidden="true">
                        {[35, 58, 44, 76, 53, 88, 64, 96, 71, 82, 54, 72].map((height, index) => (
                          <i key={index} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/20 to-primary/80" style={{ height: `${height}%` }} />
                        ))}
                      </div>
                    </SideCard>
                  </>
                )}

                {tool === 'titles' && (
                  <>
                    <SideCard icon={Type} title={t('tools.titles.checklistTitle')}>
                      <div className="space-y-3">
                        {[t('tools.titles.checkAccuracy'), t('tools.titles.checkAudience'), t('tools.titles.checkDescription')].map((title, index) => (
                          <div key={title} className="flex items-center gap-3 text-xs font-semibold">
                            <span className="tool-flow-index">{index + 1}</span>
                            <span className="min-w-0">{title}</span>
                          </div>
                        ))}
                      </div>
                    </SideCard>
                    <SideCard icon={Sparkles} title={t('tools.titles.previewRefined')}>
                      <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary">{t('tools.titles.previewBadge')}</p>
                        <p className="mt-1.5 font-display text-sm font-extrabold leading-snug">{t('tools.titles.previewNew')}</p>
                      </div>
                    </SideCard>
                  </>
                )}

                {tool === 'thumbnail' && (
                  <>
                    <SideCard icon={ImageIcon} title={t('tools.thumbnail.canvasLabel')}>
                      <div className="tool-mini-poster">
                        <span className="tool-mini-poster-glow" aria-hidden="true" />
                        <span className="tool-mini-poster-subject" aria-hidden="true" />
                        <strong dir="auto">{t('tools.thumbnail.canvasWords')}</strong>
                        <span className="tool-mini-poster-stamp">16:9</span>
                      </div>
                    </SideCard>
                    <SideCard icon={Eye} title={t('tools.thumbnail.tipsTitle')}>
                      <div className="space-y-2">
                        {[t('tools.thumbnail.tipFocus'), t('tools.thumbnail.tipContrast'), t('tools.thumbnail.tipCopy')].map((tip, index) => (
                          <div key={tip} className="flex gap-3 rounded-xl border border-border/60 bg-background/35 p-3">
                            <span className="tool-flow-index">{index + 1}</span>
                            <p className="text-xs leading-relaxed text-muted-foreground">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </SideCard>
                  </>
                )}
              </aside>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

function creditCostFor(tool, settings) {
  if (!settings?.credits_enabled) return 0;
  if (tool === 'review') return Number(settings.credits_review_cost ?? 2);
  if (tool === 'titles') return Number(settings.credits_titles_cost ?? 1);
  return Number(settings.credits_thumbnail_cost ?? 3);
}
