import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { UploadCloud, FileVideo, X, ShieldCheck, Sparkles, Coins, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { extractVideoFrames, readVideoDuration } from '@/lib/videoFrames';

const MAX_SIZE = 500 * 1024 * 1024;
const MAX_DURATION = 30 * 60;
const VIDEO_LANGUAGES = ['ar', 'en', 'es', 'fr', 'de', 'pt', 'tr', 'hi', 'id', 'ja', 'ko'];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
}

export default function UploadTab({ onStart, creditCost, disabled }) {
  const { t, lang } = useI18n();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [videoContext, setVideoContext] = useState('');
  const [spokenContent, setSpokenContent] = useState('');
  const [targetLanguage, setTargetLanguage] = useState(lang);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [duration, setDuration] = useState(null);

  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    setError('');
    setDuration(null);
    setProgress(0);

    if (selectedFile.type !== 'video/mp4' && !selectedFile.name.toLowerCase().endsWith('.mp4')) {
      setFile(null);
      setError(t('add.upload.invalid'));
      return;
    }
    if (selectedFile.size > MAX_SIZE) {
      setFile(null);
      setError(t('add.upload.tooBig'));
      return;
    }

    setFile(selectedFile);
    setPreparing(true);
    try {
      const videoDuration = await readVideoDuration(selectedFile);
      setDuration(videoDuration);
      if (videoDuration > MAX_DURATION) setError(t('add.upload.tooLong'));
    } catch {
      setFile(null);
      setError(t('add.upload.unreadable'));
    } finally {
      setPreparing(false);
    }
  }, [t]);

  const startAnalysis = async () => {
    if (!file || preparing || extracting || disabled || error) return;
    setExtracting(true);
    setProgress(0);
    try {
      const frames = await extractVideoFrames(file, setProgress);
      await onStart({
        sourceType: 'upload',
        sourceLabel: file.name,
        videoContext: videoContext.trim(),
        spokenContent: spokenContent.trim(),
        targetLanguage,
        durationSeconds: duration,
        frames,
      });
    } catch (frameError) {
      const key = frameError?.message === 'video_unreadable' ? 'add.upload.unreadable' : 'add.upload.frameError';
      setError(t(key));
    } finally {
      setExtracting(false);
      setProgress(0);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  };

  const remove = () => {
    setFile(null);
    setVideoContext('');
    setSpokenContent('');
    setProgress(0);
    setError('');
    setDuration(null);
    setPreparing(false);
    setExtracting(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const ready = file && !error && !preparing && !extracting && !disabled;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,.mp4"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {!file ? (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && inputRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all ${
            dragging
              ? 'scale-[1.01] border-primary bg-primary/5'
              : 'border-border bg-card/40 hover:border-primary/50 hover:bg-card/70'
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        >
          <span className="relative grid h-20 w-20 place-items-center rounded-3xl brand-gradient text-white shadow-float transition-transform sm:group-hover:scale-105">
            <UploadCloud className="h-9 w-9" />
            <span className="absolute -inset-2 -z-10 rounded-3xl bg-primary/20 blur-xl" />
          </span>
          <p className="mt-5 font-display text-lg font-bold">{t('add.upload.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('add.upload.or')}{' '}
            <span className="font-semibold text-primary">{t('add.upload.browse')}</span>
          </p>
          <p className="mt-3 text-xs text-muted-foreground/80">{t('add.upload.hint')}</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-card p-5 shadow-soft"
        >
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
              <FileVideo className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('add.upload.size')}: {formatSize(file.size)}
                {duration ? ` · ${t('add.upload.duration')}: ${formatDuration(duration)}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={remove}
              disabled={extracting || disabled}
              aria-label={t('add.upload.remove')}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {preparing && (
            <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.035] px-3.5 py-3" role="status" aria-live="polite">
              <p className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {t('add.upload.inspecting')}
              </p>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t('add.upload.inspecting')} aria-valuetext={t('add.upload.inspecting')}>
                <motion.div
                  className="h-full w-[30%] rounded-full brand-gradient"
                  animate={reduceMotion ? undefined : { x: ['-120%', '430%'] }}
                  transition={reduceMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          )}

          {!preparing && !error && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="upload-video-context" className="text-xs font-medium text-muted-foreground">
                  {t('add.upload.context')}
                </label>
                <textarea
                  id="upload-video-context"
                  value={videoContext}
                  maxLength={3000}
                  rows={2}
                  onChange={(event) => setVideoContext(event.target.value)}
                  placeholder={t('add.upload.contextPlaceholder')}
                  className="mt-1 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('add.upload.contextHelp')}</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="upload-video-spoken-content" className="text-xs font-medium text-muted-foreground">
                  {t('add.upload.spokenContent')}
                </label>
                <textarea
                  id="upload-video-spoken-content"
                  value={spokenContent}
                  maxLength={8000}
                  rows={4}
                  onChange={(event) => setSpokenContent(event.target.value)}
                  placeholder={t('add.upload.spokenContentPlaceholder')}
                  className="mt-1 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                />
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t('add.upload.spokenContentHelp')}</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="upload-video-language" className="text-xs font-medium text-muted-foreground">
                  {t('add.upload.language')}
                </label>
                <select
                  id="upload-video-language"
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                >
                  {VIDEO_LANGUAGES.map((code) => (
                    <option key={code} value={code}>{t(`add.link.videoLanguage.${code}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {extracting && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('add.upload.frameProgress')}</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full brand-gradient"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                />
              </div>
            </div>
          )}

          {ready && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500"
            >
              <ShieldCheck className="h-4 w-4" />
              {t('add.upload.ready')}
            </motion.p>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        disabled={!ready}
        onClick={() => void startAnalysis()}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all enabled:hover:brightness-110 enabled:hover:shadow-float enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {t('add.upload.analyze')}
        {Number.isFinite(Number(creditCost)) && (
          <span
            aria-label={`${creditCost} ${Number(creditCost) === 1 ? t('pricing.credit') : t('pricing.credits')}`}
            className="ms-1 inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/25 bg-black/15 px-2.5 py-1 text-xs font-bold shadow-inner"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>{creditCost}</span>
          </span>
        )}
      </button>

      <div className="mt-5 flex gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-semibold">{t('add.upload.privacyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('add.upload.privacy')}</p>
        </div>
      </div>
    </div>
  );
}
