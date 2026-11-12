import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, BrainCircuit, Check, Circle, Clock3, FileCheck2, Image as ImageIcon,
  Loader2, RefreshCw, ScanSearch, Sparkles, Type, Video, X,
} from 'lucide-react';
import { backend, invokeFunction } from '@/api/supabaseClient';
import { useI18n } from '@/lib/i18n';
import { useCredits } from '@/lib/CreditContext';
import { copyAnalysisFrames, deleteAnalysisFrames, getAnalysisFrames, getInlineAnalysisFrames } from '@/lib/videoFrames';
import { waitForManusTask } from '@/lib/manusTasks';
import { createPerformanceFallback } from '@/lib/performanceFallback';
import PolicyLinks from '@/components/PolicyLinks';

const REVIEW_STAGES = [
  { key: 'context', icon: Video },
  { key: 'analysis', icon: ScanSearch },
  { key: 'report', icon: FileCheck2 },
];

const TITLE_STAGES = [
  { key: 'context', icon: Video },
  { key: 'titles', icon: Type },
  { key: 'report', icon: FileCheck2 },
];

const PREPARATION_ESTIMATE_SECONDS = 10;
const THUMBNAIL_ESTIMATE_SECONDS = 65;
const REPORT_SAVE_ESTIMATE_SECONDS = 8;
const YOUTUBE_ANALYSIS_ESTIMATE_SECONDS = 120;
const UPLOAD_ANALYSIS_ESTIMATE_SECONDS = 165;

function appendTaskActivity(current, updates) {
  if (!Array.isArray(updates)) return current;
  const safeUpdates = updates.filter((item) => (
    item && typeof item.text === 'string' && item.text.trim() &&
    !/\b(manus|claude|anthropic|openai|gemini|chatgpt|gpt(?:-[\w.]+)?|api|endpoint|provider|external service|third.party service)\b/i.test(item.text)
  ));
  const byId = new Map(current.map((item) => [item.id || item.text, item]));
  for (const item of safeUpdates) {
    const id = typeof item.id === 'string' ? item.id : item.text;
    byId.set(id, { id, text: item.text.trim().slice(0, 280) });
  }
  return [...byId.values()].slice(-4);
}

function inferScriptLanguage(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const arabic = text.match(/\p{Script=Arabic}/gu)?.length || 0;
  const latin = text.match(/[A-Za-z]/g)?.length || 0;
  return arabic >= 3 && arabic > latin ? 'ar' : null;
}

function formatEstimatedTime(seconds, lang) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  const numberLocale = lang === 'ar' ? 'ar-JO' : 'en-US';
  const number = (value) => new Intl.NumberFormat(numberLocale).format(value);
  const paddedRemainder = new Intl.NumberFormat(numberLocale, { minimumIntegerDigits: 2, useGrouping: false }).format(remainder);
  return `${number(minutes)}:${paddedRemainder}`;
}

function getAnalysisEstimate(sourceType) {
  return sourceType === 'upload' ? UPLOAD_ANALYSIS_ESTIMATE_SECONDS : YOUTUBE_ANALYSIS_ESTIMATE_SECONDS;
}

function getEstimatedProgress(phase, elapsedSeconds, sourceType) {
  const elapsed = Math.max(0, elapsedSeconds);
  const analysisEstimate = getAnalysisEstimate(sourceType);
  const remainingIn = (estimate, pace = 0.85, floor = 8) => Math.max(floor, estimate - elapsed * pace);
  const overrun = (expected) => elapsed > expected * 1.3;

  if (phase === 'complete') return { percent: 100, seconds: 0 };
  if (phase === 'preparing') {
    return {
      percent: Math.min(13, 5 + (elapsed / PREPARATION_ESTIMATE_SECONDS) * 8),
      seconds: overrun(PREPARATION_ESTIMATE_SECONDS)
        ? null
        : remainingIn(PREPARATION_ESTIMATE_SECONDS) + analysisEstimate + REPORT_SAVE_ESTIMATE_SECONDS,
    };
  }
  if (phase === 'analyzing') {
    return {
      percent: Math.min(63, 15 + (elapsed / analysisEstimate) * 48),
      seconds: overrun(analysisEstimate)
        ? null
        : remainingIn(analysisEstimate) + REPORT_SAVE_ESTIMATE_SECONDS,
    };
  }
  if (phase === 'thumbnail') {
    return {
      percent: Math.min(94, 70 + (elapsed / THUMBNAIL_ESTIMATE_SECONDS) * 24),
      seconds: overrun(THUMBNAIL_ESTIMATE_SECONDS)
        ? null
        : remainingIn(THUMBNAIL_ESTIMATE_SECONDS, 0.8) + REPORT_SAVE_ESTIMATE_SECONDS,
    };
  }
  if (phase === 'saving') {
    return {
      percent: Math.min(99, 97 + (elapsed / REPORT_SAVE_ESTIMATE_SECONDS) * 2),
      seconds: overrun(REPORT_SAVE_ESTIMATE_SECONDS)
        ? null
        : remainingIn(REPORT_SAVE_ESTIMATE_SECONDS, 0.7, 3),
    };
  }
  return { percent: 0, seconds: PREPARATION_ESTIMATE_SECONDS + analysisEstimate + REPORT_SAVE_ESTIMATE_SECONDS };
}

async function getFunctionError(error) {
  const response = error?.context;
  if (response instanceof Response) {
    try {
      const payload = await response.clone().json();
      return {
        code: typeof payload?.error === 'string' ? payload.error : '',
        videoTitle: typeof payload?.video_title === 'string' ? payload.video_title : '',
        originalThumbnailUrl: typeof payload?.original_thumbnail_url === 'string'
          ? payload.original_thumbnail_url
          : '',
      };
    } catch {
      // Fall through to a safe local error code when the function response is not JSON.
    }
  }
  const code = typeof error?.code === 'string' && /^[a-z][a-z0-9_]{1,79}$/i.test(error.code)
    ? error.code
    : typeof error?.message === 'string' && /^[a-z][a-z0-9_]{1,79}$/i.test(error.message)
      ? error.message
      : error?.name === 'FunctionsFetchError'
        ? 'edge_function_unreachable'
        : '';
  return { code };
}

function analysisErrorMessage(error, details, translate) {
  const errorCode = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';
  if (errorCode === 'insufficient_credits') return translate('analyze.credits.desc');
  if (errorCode === 'video_frames_missing') return translate('progress.videoFramesMissing');
  if (details.code === 'insufficient_credits') return translate('analyze.credits.desc');
  if (details.code === 'analysis_already_used') return translate('progress.analysisAlreadyUsed');
  if (details.code === 'credit_service_unavailable') return translate('progress.aiError');
  if (details.code === 'manus_api_not_configured') return translate('progress.manusNotConfigured');
  if (details.code === 'manus_status_not_configured') return translate('progress.manusBackendNotConfigured');
  if (details.code === 'manus_unauthorized' || details.code === 'manus_unauthenticated' || details.code === 'manus_invalid_api_key') {
    return translate('progress.manusAuthFailed');
  }
  if (details.code?.startsWith('manus_rate_limited')) return translate('progress.manusRateLimited');
  if (details.code?.startsWith('manus_')) return translate('progress.manusRequestFailed');
  if (details.code === 'invalid_video_language') return translate('progress.invalidVideoLanguage');
  if (details.code === 'video_frames_missing') return translate('progress.videoFramesMissing');
  if (details.code === 'edge_function_unreachable') return translate('progress.edgeFunctionUnreachable');
  return translate('progress.aiError');
}

function safeSavedError(message, translate) {
  if (typeof message !== 'string' || /^[a-z][a-z0-9_]{1,79}$/i.test(message) || /(?:sk-[a-z0-9_-]{12,}|api[\s_-]*key\s*[:=]|\b(manus|claude|anthropic|openai|gemini|chatgpt|provider|endpoint)\b)/i.test(message)) {
    return translate('progress.failedDesc');
  }
  return message;
}

export default function Progress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { enabled, spend, spendTool } = useCredits();
  const reduce = useReducedMotion();
  const [record, setRecord] = useState(null);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState('loading');
  const [failurePhase, setFailurePhase] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [clockNow, setClockNow] = useState(Date.now());
  const phaseStartedAtRef = useRef(Date.now());
  const runningAnalysisIds = useRef(new Set());
  const activeRunRef = useRef(null);
  // Keep the latest translations without restarting a run that is in flight.
  const tRef = useRef(t);
  tRef.current = t;
  const langRef = useRef(lang);
  langRef.current = lang;

  // load record
  useEffect(() => {
    let active = true;
    setRecord(null);
    setDone(false);
    setNotFound(false);
    setFailed(false);
    setPhase('loading');
    phaseStartedAtRef.current = Date.now();
    setFailurePhase(null);
    setAnalysisResult(null);
    setLiveUpdates([]);
    (async () => {
      try {
        const rec = await backend.data.Analysis.get(id);
        if (!active) return;
        if (rec.status === 'completed') {
          navigate(`/results/${id}`, { replace: true });
          return;
        }
        if (rec.status === 'failed') {
          setRecord(rec);
          setFailed(true);
          setPhase('failed');
          return;
        }
        setRecord(rec);
      } catch {
        if (active) setNotFound(true);
      }
    })();
    return () => { active = false; };
  }, [id, navigate]);

  // Run the actual model request once for each analysis record.
  useEffect(() => {
    if (!record || done || notFound || failed || record.status === 'completed' || record.status === 'failed') return;
    if (runningAnalysisIds.current.has(id)) return;
    runningAnalysisIds.current.add(id);

    const runAnalysis = async () => {
      const controller = new AbortController();
      activeRunRef.current = controller;
      let runningPhase = 'preparing';
      const changePhase = (next) => {
        runningPhase = next;
        phaseStartedAtRef.current = Date.now();
        setPhase(next);
      };
      const wasCancelled = () => controller.signal.aborted;
      const toolMode = record.source_type === 'youtube' && record.youtube_stats?.tool_mode === 'titles' ? 'titles' : 'review';
      const creditRequestId = record.source_type === 'youtube'
        ? record.youtube_stats?.tool_request_id || crypto.randomUUID()
        : '';
      try {
        if (record.source_type === 'youtube') {
          const credit = await spendTool(id, toolMode, creditRequestId);
          if (!credit?.ok) throw Object.assign(new Error('insufficient_credits'), { code: 'insufficient_credits' });
          if (record.youtube_stats?.tool_request_id !== creditRequestId) {
            const refreshedStats = { ...record.youtube_stats, tool_mode: toolMode, tool_request_id: creditRequestId };
            await backend.data.Analysis.update(id, { youtube_stats: refreshedStats });
          }
        }
        changePhase('preparing');
        await backend.data.Analysis.update(id, { status: 'preparing' });
        if (wasCancelled()) return;
        const input = {
          analysisId: id,
          sourceType: record.source_type,
          toolMode,
          creditRequestId,
          url: record.source_url,
          videoTitle: record.youtube_stats?.video_title || '',
          videoContext: record.youtube_stats?.video_context || '',
          spokenContent: record.source_type === 'upload' ? record.youtube_stats?.spoken_content || '' : '',
          creatorProblem: record.source_type === 'youtube' ? record.youtube_stats?.creator_problem || '' : '',
          thumbnailUrl: record.thumbnail_url,
          stats: record.youtube_stats || {},
          language: langRef.current,
          targetLanguage: record.source_type === 'youtube'
            ? record.youtube_stats?.video_language_mode === 'selected'
              ? record.youtube_stats?.video_language || langRef.current
              : 'auto'
            : record.youtube_stats?.video_language || langRef.current,
        };
        const requestedAutomaticVideoLanguage = input.targetLanguage === 'auto';
        if (record.source_type === 'upload') {
          const savedFrames = await getAnalysisFrames(id);
          if (!savedFrames?.length) {
            throw Object.assign(new Error('Video sample frames are no longer available.'), { code: 'video_frames_missing' });
          }
          input.frames = await getInlineAnalysisFrames(id);
          if (!input.frames?.length) {
            throw Object.assign(new Error('Video sample frames are no longer available.'), { code: 'video_frames_missing' });
          }
        } else if (record.source_type === 'youtube' && record.youtube_stats?.has_reference_images === true) {
          // Creator-provided reference images are optional and provide visual
          // direction only; they are not assumed to be frames from the linked video.
          try {
            const referenceFrames = await getInlineAnalysisFrames(id);
            if (referenceFrames?.length) input.referenceFrames = referenceFrames;
          } catch (referenceError) {
            // Optional local images must never stop a YouTube URL analysis.
            console.warn('Could not read optional YouTube reference images:', referenceError);
          }
        }
        if (wasCancelled()) return;
        changePhase('analyzing');
        let response;
        try {
          response = await invokeFunction('analyzeYouTubeVideo', input, { signal: controller.signal });
        } catch (requestError) {
          const requestDetails = await getFunctionError(requestError);
          if (input.targetLanguage !== 'auto' || requestDetails.code !== 'invalid_video_language') throw requestError;
          // Keep the local UI usable if the connected Edge Function has not yet
          // been updated to support automatic language detection.
          input.targetLanguage = langRef.current;
          response = await invokeFunction('analyzeYouTubeVideo', input, { signal: controller.signal });
        }
        if (wasCancelled()) return;
        const taskId = response?.data?.taskId;
        if (typeof taskId !== 'string' || !taskId) throw new Error('manus_task_create_failed');
        const completedTask = await waitForManusTask(id, 'analysis', {
          signal: controller.signal,
          onProgress: (status) => setLiveUpdates((current) => appendTaskActivity(current, status?.activity)),
        });
        if (wasCancelled()) return;
        const result = completedTask?.result && typeof completedTask.result === 'object' ? completedTask.result : {};
        const summary = typeof result.summary === 'string' ? result.summary.trim() : '';
        const videoTitle = typeof result.video_title === 'string' ? result.video_title.trim().slice(0, 500) : '';
        const videoDescription = typeof result.video_description === 'string' ? result.video_description.trim().slice(0, 4000) : '';
        const detectedLanguageFromText = inferScriptLanguage([
          record.youtube_stats?.video_title || '',
          record.youtube_stats?.video_description || '',
          videoTitle,
          videoDescription,
          JSON.stringify(result.title_suggestions || []),
        ].join(' '));
        const detectedLanguage = detectedLanguageFromText === 'ar'
          ? 'ar'
          : typeof result.detected_video_language === 'string'
            ? result.detected_video_language
            : detectedLanguageFromText;
        const resolvedVideoLanguage = requestedAutomaticVideoLanguage
          ? detectedLanguage || inferScriptLanguage(`${record.youtube_stats?.video_title || ''} ${record.youtube_stats?.video_description || ''}`) || input.targetLanguage
          : input.targetLanguage;
        const score = typeof result.score === 'number' && Number.isFinite(result.score)
          ? Math.max(0, Math.min(100, Math.round(result.score)))
          : null;
        const fallbackPerformance = record.source_type === 'youtube'
          ? createPerformanceFallback(record.youtube_stats || {}, lang)
          : null;
        const performanceScore = typeof result.performance_score === 'number' && Number.isFinite(result.performance_score)
          ? Math.max(0, Math.min(100, Math.round(result.performance_score)))
          : fallbackPerformance?.score ?? null;
        const performanceConfidence = ['high', 'medium', 'low'].includes(result.performance_confidence)
          ? result.performance_confidence
          : fallbackPerformance?.confidence || 'low';
        const performanceSummary = typeof result.performance_summary === 'string' && result.performance_summary.trim()
          ? result.performance_summary.trim().slice(0, 4000)
          : fallbackPerformance?.summary || '';
        const modelMetricAssessments = Array.isArray(result.metric_assessments)
          ? result.metric_assessments.filter((item) => typeof item?.metric === 'string' && typeof item?.assessment === 'string' && typeof item?.evidence === 'string').slice(0, 6)
          : [];
        const metricAssessments = modelMetricAssessments.length ? modelMetricAssessments : fallbackPerformance?.metrics || [];
        const modelViewDeclineCauses = Array.isArray(result.view_decline_causes)
          ? result.view_decline_causes.filter((item) => typeof item?.cause === 'string' && typeof item?.evidence === 'string').slice(0, 4)
          : [];
        const viewDeclineCauses = modelViewDeclineCauses.length ? modelViewDeclineCauses : fallbackPerformance?.causes || [];
        const titleThumbnailAnalysis = result.title_thumbnail_analysis && typeof result.title_thumbnail_analysis === 'object'
          ? {
            title_assessment: typeof result.title_thumbnail_analysis.title_assessment === 'string' ? result.title_thumbnail_analysis.title_assessment.slice(0, 1600) : '',
            thumbnail_assessment: typeof result.title_thumbnail_analysis.thumbnail_assessment === 'string' ? result.title_thumbnail_analysis.thumbnail_assessment.slice(0, 1600) : '',
            promise_match: typeof result.title_thumbnail_analysis.promise_match === 'string' ? result.title_thumbnail_analysis.promise_match.slice(0, 1600) : '',
          }
          : null;
        const creatorProblemResponse = typeof result.creator_problem_response === 'string' ? result.creator_problem_response.trim().slice(0, 4000) : '';
        const thumbnailConcept = typeof result.thumbnail_concept === 'string' ? result.thumbnail_concept.trim() : '';
        const thumbnailText = typeof result.thumbnail_text === 'string' ? result.thumbnail_text.trim().slice(0, 120) : '';
        const thumbnailImagePrompt = typeof result.thumbnail_image_prompt === 'string'
          ? result.thumbnail_image_prompt.trim().slice(0, 2400)
          : '';
        const titles = Array.isArray(result.title_suggestions)
          ? result.title_suggestions.filter((item) => typeof item?.title === 'string' && item.title.trim()).slice(0, 5)
          : [];
        const improvements = Array.isArray(result.improvements)
          ? result.improvements.filter((item) => typeof item?.title === 'string' && item.title.trim()).slice(0, 6)
          : [];
        const generatedThumbnailUrl = typeof result.generated_thumbnail_url === 'string' && result.generated_thumbnail_url.trim()
          ? result.generated_thumbnail_url
          : '';
        const sectionError = 'analysis_result_incomplete';
        const isTitlesTool = record.source_type === 'youtube' && record.youtube_stats?.tool_mode === 'titles';
        const analysisSections = isTitlesTool ? {
          ...(record.youtube_stats?.analysis_sections || {}),
          thumbnailImage: record.youtube_stats?.generated_thumbnail_url
            ? { status: 'ready', reason: '' }
            : { status: 'not_requested', reason: '' },
          titles: { status: titles.length ? 'ready' : 'failed', reason: titles.length ? '' : sectionError },
          titleDescription: { status: videoDescription ? 'ready' : 'failed', reason: videoDescription ? '' : sectionError },
        } : {
          summary: { status: summary ? 'ready' : 'failed', reason: summary ? '' : sectionError },
          score: { status: score !== null ? 'ready' : 'failed', reason: score !== null ? '' : sectionError },
          thumbnailConcept: { status: thumbnailConcept ? 'ready' : 'failed', reason: thumbnailConcept ? '' : sectionError },
          thumbnailText: { status: thumbnailText ? 'ready' : 'failed', reason: thumbnailText ? '' : sectionError },
          thumbnailImage: generatedThumbnailUrl
            ? { status: 'ready', reason: '' }
            : { status: 'not_requested', reason: '' },
          titles: { status: titles.length ? 'ready' : 'failed', reason: titles.length ? '' : sectionError },
          improvements: { status: improvements.length ? 'ready' : 'failed', reason: improvements.length ? '' : sectionError },
          ...(record.source_type === 'youtube' ? {
            performance: { status: performanceScore !== null ? 'ready' : 'failed', reason: performanceScore !== null ? '' : sectionError },
          } : {}),
        };
        const hasUsableResult = isTitlesTool
          ? titles.length > 0 || Boolean(videoDescription)
          : Object.values(analysisSections).some((section) => section.status === 'ready');
        const terminalStatus = hasUsableResult ? 'completed' : 'failed';
        changePhase('saving');
        const updatedStats = isTitlesTool ? {
          ...record.youtube_stats,
          tool_request_id: creditRequestId,
          ...(videoTitle ? { video_title: videoTitle } : {}),
          ...(videoDescription ? { generated_video_description: videoDescription } : {}),
          manus_analysis_task_id: taskId,
          ...(typeof response.data.taskSignature === 'string' ? { manus_analysis_task_signature: response.data.taskSignature } : {}),
          analysis_sections: analysisSections,
        } : {
          ...record.youtube_stats,
          ...(record.source_type === 'youtube' ? { tool_request_id: creditRequestId } : {}),
          video_language: resolvedVideoLanguage,
          ...(record.source_type === 'youtube'
            ? { video_language_mode: requestedAutomaticVideoLanguage ? 'auto' : 'selected' }
            : {}),
          ...(record.source_type === 'youtube' && detectedLanguage ? { detected_video_language: detectedLanguage } : {}),
          ...(videoTitle ? { video_title: videoTitle } : {}),
          ...(videoDescription ? { video_description: videoDescription } : {}),
          ...(taskId ? { manus_analysis_task_id: taskId } : {}),
          ...(typeof response.data.taskSignature === 'string' ? { manus_analysis_task_signature: response.data.taskSignature } : {}),
          ...(thumbnailConcept ? { thumbnail_concept: thumbnailConcept } : {}),
          ...(thumbnailText ? { thumbnail_text: thumbnailText } : {}),
          ...(thumbnailImagePrompt ? { thumbnail_image_prompt: thumbnailImagePrompt } : {}),
          ...(generatedThumbnailUrl ? { generated_thumbnail_url: generatedThumbnailUrl } : {}),
          ...(record.source_type === 'youtube' ? {
            performance_score: performanceScore,
            performance_confidence: performanceConfidence,
            performance_summary: performanceSummary,
            metric_assessments: metricAssessments,
            view_decline_causes: viewDeclineCauses,
            title_thumbnail_analysis: titleThumbnailAnalysis,
            creator_problem_response: creatorProblemResponse,
          } : {}),
          analysis_sections: analysisSections,
        };
        const finalRecord = {
          ...record,
          status: terminalStatus,
          progress: hasUsableResult ? 100 : 0,
          score: isTitlesTool ? record.score : score,
          summary: isTitlesTool ? record.summary : summary,
          source_label: record.source_type === 'youtube' ? videoTitle || record.source_label : record.source_label,
          thumbnail_url: response.data.originalThumbnailUrl || record.thumbnail_url || generatedThumbnailUrl || null,
          title_suggestions: titles,
          improvements: isTitlesTool ? record.improvements : improvements,
          ...(record.source_type === 'youtube' && !isTitlesTool ? {
            performance_score: performanceScore,
            performance_confidence: performanceConfidence,
            performance_summary: performanceSummary,
            metric_assessments: metricAssessments,
            view_decline_causes: viewDeclineCauses,
            title_thumbnail_analysis: titleThumbnailAnalysis,
            creator_problem_response: creatorProblemResponse,
          } : {}),
          youtube_stats: updatedStats,
          error_message: hasUsableResult ? '' : tRef.current('results.failure.analysis'),
        };
        let resultForPage = {
          ...result,
          summary,
          score,
          thumbnail_concept: thumbnailConcept,
          thumbnail_text: thumbnailText,
          thumbnail_image_prompt: thumbnailImagePrompt,
          generated_thumbnail_url: generatedThumbnailUrl,
          thumbnail_generation_error: '',
          title_suggestions: titles,
          improvements,
        };
        setAnalysisResult(resultForPage);
        try {
          await backend.data.Analysis.update(id, {
            status: finalRecord.status,
            progress: finalRecord.progress,
            score: finalRecord.score,
            summary: finalRecord.summary,
            source_label: finalRecord.source_label,
            thumbnail_url: finalRecord.thumbnail_url,
            title_suggestions: finalRecord.title_suggestions,
            improvements: finalRecord.improvements,
            youtube_stats: finalRecord.youtube_stats,
            error_message: finalRecord.error_message,
          });
        } catch (saveError) {
          console.error('Could not save the completed analysis report:', saveError);
        }
        if (wasCancelled()) return;

        if (wasCancelled()) return;
        changePhase('saving');
        finalRecord.progress = hasUsableResult ? 100 : 0;
        setRecord(finalRecord);
        if (terminalStatus === 'completed') {
          changePhase('complete');
          setDone(true);
        } else {
          setFailurePhase('analyzing');
          setPhase('failed');
          setFailed(true);
        }
        navigate(`/results/${id}`, { replace: true, state: { analysisRecord: finalRecord } });
      } catch (error) {
        if (wasCancelled() || error?.name === 'AbortError') return;
        console.error('Video analysis failed', error);
        setFailurePhase(runningPhase);
        setPhase('failed');
        const errorDetails = await getFunctionError(error);
        const message = analysisErrorMessage(error, errorDetails, tRef.current);
        if (record.source_type === 'youtube' && creditRequestId) {
          try {
            await invokeFunction('refundToolCredit', { analysisId: id, requestId: creditRequestId });
          } catch (refundError) {
            console.warn('Could not refund the failed tool credit:', refundError);
          }
        }
        const failureCode = /^[a-z][a-z0-9_]{1,79}$/i.test(errorDetails.code || '')
          ? errorDetails.code
          : 'analysis_request_failed';
        const failedSections = Object.fromEntries(
          ['summary', 'score', 'thumbnailConcept', 'thumbnailText', 'thumbnailImage', 'titles', 'improvements']
            .map((key) => [key, { status: 'failed', reason: failureCode }])
        );
        const failedStats = { ...(record.youtube_stats || {}), analysis_sections: failedSections };
        const failedRecord = {
          ...record,
          status: 'failed',
          error_message: message,
          youtube_stats: failedStats,
          title_suggestions: [],
          improvements: [],
          summary: '',
          score: null,
          ...(errorDetails.videoTitle ? { source_label: errorDetails.videoTitle } : {}),
          ...(errorDetails.originalThumbnailUrl ? { thumbnail_url: errorDetails.originalThumbnailUrl } : {}),
        };
        try {
          await backend.data.Analysis.update(id, {
            status: failedRecord.status,
            error_message: failedRecord.error_message,
            youtube_stats: failedRecord.youtube_stats,
            title_suggestions: failedRecord.title_suggestions,
            improvements: failedRecord.improvements,
            summary: failedRecord.summary,
            score: failedRecord.score,
            ...(errorDetails.videoTitle ? { source_label: failedRecord.source_label } : {}),
            ...(errorDetails.originalThumbnailUrl ? { thumbnail_url: failedRecord.thumbnail_url } : {}),
          });
        } catch (saveError) {
          console.error('Could not save failed analysis status', saveError);
        }
        setRecord(failedRecord);
        setFailed(true);
        navigate(`/results/${id}`, { replace: true, state: { analysisRecord: failedRecord } });
      } finally {
        if (activeRunRef.current === controller) activeRunRef.current = null;
      }
    };

    void runAnalysis();
    return () => {
      activeRunRef.current?.abort();
      activeRunRef.current = null;
    };
  }, [record, done, notFound, failed, id, navigate]);

  const cancel = async () => {
    activeRunRef.current?.abort();
    activeRunRef.current = null;
    const requestId = record?.source_type === 'youtube' ? record?.youtube_stats?.tool_request_id : '';
    if (requestId) {
      try {
        await invokeFunction('refundToolCredit', { analysisId: id, requestId });
      } catch (refundError) {
        console.warn('Could not refund the cancelled tool credit:', refundError);
      }
    }
    try { await deleteAnalysisFrames(id); } catch { /* local cleanup is best-effort */ }
    try { await backend.data.Analysis.delete(id); } catch { /* ignore */ }
    navigate('/');
  };

  useEffect(() => {
    if (done || failed || phase === 'loading' || phase === 'complete') return undefined;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [done, failed, phase]);

  const retry = async () => {
    setFailed(false);
    setFailurePhase(null);
    let retryId = null;
    let copiedFrames = false;
    let retryRequestId = '';
    let retryCharged = false;
    try {
      const retryToolMode = record.source_type === 'youtube' && record.youtube_stats?.tool_mode === 'titles' ? 'titles' : 'review';
      retryRequestId = record.source_type === 'youtube' ? crypto.randomUUID() : '';
      const retryStats = record.source_type === 'youtube'
        ? { ...(record.youtube_stats || {}), tool_mode: retryToolMode, tool_request_id: retryRequestId, manus_analysis_task_id: null, manus_analysis_task_signature: null }
        : record.youtube_stats || {};
      const retryRecord = await backend.data.Analysis.create({
        source_type: record.source_type,
        source_label: record.source_label,
        source_url: record.source_url || '',
        thumbnail_url: record.thumbnail_url || '',
        duration_seconds: record.duration_seconds || null,
        youtube_stats: retryStats,
        status: 'uploading',
        progress: 0,
      });
      retryId = retryRecord.id;
      copiedFrames = await copyAnalysisFrames(record.id, retryRecord.id);
      if (record.source_type === 'upload' && !copiedFrames) {
        await backend.data.Analysis.delete(retryRecord.id);
        setRecord((current) => ({
          ...current,
          error_message: t('progress.videoFramesMissing'),
        }));
        setFailed(true);
        return;
      }
      if (enabled) {
        const creditResult = record.source_type === 'youtube'
          ? await spendTool(retryRecord.id, retryToolMode, retryRequestId)
          : await spend(retryRecord.id);
        if (!creditResult || creditResult.ok === false) {
          if (copiedFrames) await deleteAnalysisFrames(retryRecord.id);
          await backend.data.Analysis.delete(retryRecord.id);
          setRecord((current) => ({
            ...current,
            error_message: t('analyze.credits.desc'),
          }));
          setFailed(true);
          return;
        }
        retryCharged = true;
      }
      navigate(`/progress/${retryRecord.id}`, { replace: true });
    } catch (error) {
      console.error('Could not restart analysis', error);
      if (retryCharged && retryId && retryRequestId) {
        try {
          await invokeFunction('refundToolCredit', { analysisId: retryId, requestId: retryRequestId });
        } catch (refundError) {
          console.warn('Could not refund the failed retry credit:', refundError);
        }
      }
      if (retryId) {
        if (copiedFrames) {
          try { await deleteAnalysisFrames(retryId); } catch { /* local cleanup is best-effort */ }
        }
        try { await backend.data.Analysis.delete(retryId); } catch { /* remove a partial retry record */ }
      }
      setRecord((current) => ({ ...current, error_message: t('progress.retryFailed') }));
      setFailed(true);
      return;
    }
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

  const isBusy = !done && !failed && phase !== 'loading';
  const isTitleTool = record?.source_type === 'youtube' && record.youtube_stats?.tool_mode === 'titles';
  const stages = isTitleTool ? TITLE_STAGES : REVIEW_STAGES;
  const modelStarted = ['analyzing', 'thumbnail', 'saving', 'complete'].includes(phase);
  const modelReturned = ['thumbnail', 'saving', 'complete'].includes(phase);
  const stageIsDone = (index) => {
    const requestStarted = modelStarted || ['analyzing', 'thumbnail', 'saving'].includes(failurePhase);
    const resultReturned = modelReturned || failurePhase === 'saving';
    if (index === 0) return requestStarted;
    if (!resultReturned || !analysisResult) return false;
    if (index === 1) return isTitleTool
      ? Boolean(analysisResult.title_suggestions?.some((item) => item?.title?.trim()) || analysisResult.video_description?.trim())
      : Boolean(analysisResult.summary?.trim() || Number.isFinite(analysisResult.score));
    if (index === 2) return phase === 'complete';
    return false;
  };
  const stageIsActive = (index) => {
    if (phase === 'loading' || phase === 'preparing') return index === 0;
    if (phase === 'analyzing') return index === 1;
    if (phase === 'thumbnail') return index === 1;
    if (phase === 'saving') return index === stages.length - 1;
    return false;
  };
  const stageHasFailed = (index) => (
    (failurePhase === 'preparing' && index === 0) ||
    (failurePhase === 'analyzing' && index === 1) ||
    (failurePhase === 'saving' && index === stages.length - 1)
  );
  const completedStageCount = stages.reduce((count, _stage, index) => count + Number(stageIsDone(index)), 0);
  const milestonePercent = Math.round((completedStageCount / stages.length) * 100);
  const elapsedPhaseSeconds = Math.max(0, (clockNow - phaseStartedAtRef.current) / 1000);
  const estimate = getEstimatedProgress(phase, elapsedPhaseSeconds, record?.source_type);
  const estimatedPercent = failed ? milestonePercent : Math.round(estimate.percent);
  const estimatedTime = estimate.seconds === null ? t('progress.estimateOverrun') : formatEstimatedTime(estimate.seconds, lang);
  const activityFallbackKey = phase === 'preparing'
    ? 'progress.pipelinePreparing'
    : phase === 'thumbnail'
      ? 'progress.pipelineThumbnail'
      : phase === 'saving'
        ? 'progress.pipelineSaving'
        : 'progress.pipelineWorking';
  const bestTitle = analysisResult?.title_suggestions?.find((item) => item.recommended)?.title
    || analysisResult?.title_suggestions?.[0]?.title;
  const previewThumbnail = analysisResult?.generated_thumbnail_url;
  const CurrentPhaseIcon = failed ? X : done ? Check : phase === 'saving' ? FileCheck2 : phase === 'thumbnail' ? ImageIcon : phase === 'preparing' || phase === 'loading' ? Video : BrainCircuit;
  const phaseTitleKey = failed
    ? 'progress.failed'
    : done
      ? 'progress.done'
      : phase === 'loading'
        ? 'progress.phaseLoading'
        : phase === 'preparing'
          ? 'progress.phasePreparing'
          : phase === 'thumbnail'
            ? 'progress.phaseThumbnail'
          : phase === 'saving'
            ? 'progress.phaseSaving'
            : 'progress.phaseWaiting';
  return (
    <motion.main
      className="analysis-page relative mx-auto min-h-[calc(100svh-9rem)] max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-black/50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-red-200/80 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-xl sm:text-xs">
            <span className={`analysis-live-dot ${failed ? 'analysis-live-dot--error' : done ? 'analysis-live-dot--done' : ''}`} />
            {t(done ? 'progress.engine.complete' : failed ? 'progress.engine.attention' : 'progress.engine.label')}
          </div>
          <button onClick={() => navigate('/')} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />{t('common.back')}
          </button>
        </header>

        <div className="analysis-workspace glass-panel grid gap-4 rounded-[1.8rem] border border-white/[0.09] p-4 sm:gap-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-7 lg:p-7">
          <section className={`analysis-current-stage flex flex-col justify-between rounded-[1.5rem] border p-4 sm:p-5 ${failed ? 'analysis-current-stage--error' : done ? 'analysis-current-stage--done' : ''}`} role="status" aria-live="polite">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground">{t('progress.currentStage')}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="analysis-current-stage-icon grid h-11 w-11 shrink-0 place-items-center rounded-2xl sm:h-12 sm:w-12">
                  <CurrentPhaseIcon className="h-5 w-5" />
                </span>
                <h1 className="font-display text-lg font-extrabold tracking-tight sm:text-xl">{t(phaseTitleKey)}</h1>
              </div>
              {failed && <p className="mt-4 rounded-xl border border-destructive/15 bg-destructive/[0.06] p-3 text-xs leading-relaxed text-muted-foreground">{safeSavedError(record?.error_message, t)}</p>}
            </div>
            {record && (
              <div className="analysis-current-source mt-5 flex min-w-0 items-center gap-3 rounded-2xl p-2.5">
                <div className="analysis-current-source-image grid h-12 w-[4.25rem] shrink-0 place-items-center overflow-hidden rounded-xl">
                  {record.thumbnail_url ? <img src={record.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Video className="h-5 w-5 text-red-200/65" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{t(record.source_type === 'upload' ? 'progress.sourceUpload' : 'progress.sourceYoutube')}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-foreground sm:text-sm">{record.source_label || t(record.source_type === 'upload' ? 'progress.uploadedVideo' : 'progress.videoContext')}</p>
                </div>
              </div>
            )}
            {isBusy && (
              <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />{t('progress.indeterminate')}
                <button onClick={cancel} className="ms-auto rounded-full border border-white/10 px-3 py-1.5 font-semibold transition hover:bg-white/[0.05] hover:text-foreground">{t('progress.cancel')}</button>
              </div>
            )}
          </section>

          <section className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold sm:text-lg">{t('progress.pipelineTitle')}</h2>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">{completedStageCount}/{stages.length}</span>
            </div>

            <div className="analysis-progress-summary mt-3 rounded-full p-1">
              <div className="mb-2 flex items-center justify-between gap-3 px-1 text-xs">
                <span className="text-muted-foreground">{t('progress.estimatedPercent')}</span>
                <strong className="font-display tabular-nums text-foreground">{estimatedPercent}%</strong>
              </div>
              <div className="analysis-progress-track h-2 overflow-hidden rounded-full" role="progressbar" aria-label={t('progress.estimatedPercent')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={estimatedPercent}>
                <motion.div className="analysis-progress-fill h-full rounded-full" initial={false} animate={{ width: `${estimatedPercent}%` }} transition={{ duration: reduce ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>

            {isBusy && (
              <div className="analysis-estimate-meta mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5 text-primary" />{t('progress.estimatedTime')}
                </span>
                <span className={`font-display text-sm font-bold ${estimate.seconds === null ? 'text-primary' : 'tabular-nums text-foreground'}`}>
                  {estimate.seconds === null ? estimatedTime : `~${estimatedTime}`}
                </span>
              </div>
            )}
            <p className="mt-2 px-1 text-[10px] leading-relaxed text-muted-foreground">{t('progress.estimateNotice')}</p>

            {isBusy && (
              <div className="analysis-activity mt-4 rounded-2xl border border-white/[0.08] p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-foreground">{t('progress.liveUpdates')}</h3>
                  <span className="analysis-activity-live inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-primary">
                    <span className="analysis-live-dot" />ClipLens
                  </span>
                </div>
                <ul className="mt-3 space-y-2" aria-live="polite" aria-relevant="additions text">
                  {liveUpdates.length ? liveUpdates.slice(-3).map((update, index) => (
                    <li key={update.id} className={`flex items-start gap-2.5 text-xs leading-relaxed ${index === liveUpdates.slice(-3).length - 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${index === liveUpdates.slice(-3).length - 1 ? 'bg-primary shadow-[0_0_10px_rgba(255,35,35,0.65)]' : 'bg-muted-foreground/50'}`} />
                      <span dir="auto">{update.text}</span>
                    </li>
                  )) : (
                    <li className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
                      <span>{t(activityFallbackKey)}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

          <ol className="analysis-timeline mt-3 space-y-1.5 sm:mt-4" aria-live="polite">
            {stages.map(({ key, icon: Icon }, index) => {
              const complete = stageIsDone(index);
              const active = stageIsActive(index);
              const hasError = stageHasFailed(index);
              return (
                <li key={key} className={`analysis-stage flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition-all duration-300 ${active ? 'analysis-stage--active' : ''} ${complete ? 'analysis-stage--complete' : ''} ${hasError ? 'analysis-stage--error' : ''}`}>
                  <span className="analysis-stage-marker grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-muted-foreground">
                    {complete ? <Check className="h-4 w-4" /> : hasError ? <X className="h-4 w-4" /> : active ? <Icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                  </span>
                  <span className={`min-w-0 flex-1 text-xs font-semibold sm:text-sm ${active || complete ? 'text-foreground' : 'text-muted-foreground'}`}>{t(`progress.stage.${key}`)}</span>
                  {active && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" aria-label={t('progress.indeterminate')} />}
                </li>
              );
            })}
          </ol>

          {failed && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button onClick={retry} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-float transition hover:brightness-110 active:scale-[0.98]">
                <RefreshCw className="h-4 w-4" />{t('progress.retry')}
              </button>
              <button onClick={cancel} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground active:scale-[0.98]">
                <X className="h-4 w-4" />{t('progress.cancel')}
              </button>
            </div>
          )}

          {done && (
            <button onClick={() => navigate(`/results/${id}`)} className="analysis-result-peek mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-300/15 bg-red-400/[0.035] p-3 text-start transition hover:bg-red-400/[0.07] sm:p-3.5">
              <div className="grid h-12 w-[4.25rem] shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/60">
                {previewThumbnail ? <img src={previewThumbnail} alt="" className="h-full w-full object-cover" /> : <Sparkles className="h-5 w-5 text-red-200" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">{t('progress.viewResults')}</p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">{bestTitle || record?.source_label || t('progress.reportReady')}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary rtl:rotate-180" />
            </button>
          )}

        </section>
      </div>
      <PolicyLinks className="mt-5 border-t border-white/10 pt-4" />
      </div>
    </motion.main>
  );
}
