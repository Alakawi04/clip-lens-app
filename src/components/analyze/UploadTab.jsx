import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileVideo, X, ShieldCheck, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_DURATION = 30 * 60; // 30 min

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(s) {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function UploadTab({ onStart }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(null);

  const validate = (f) => {
    if (!f) return false;
    if (f.type !== 'video/mp4' && !f.name.toLowerCase().endsWith('.mp4')) {
      setError(t('add.upload.invalid'));
      return false;
    }
    if (f.size > MAX_SIZE) {
      setError(t('add.upload.tooBig'));
      return false;
    }
    setError('');
    return true;
  };

  const handleFile = useCallback((f) => {
    if (!validate(f)) {
      setFile(null);
      setProgress(0);
      setDuration(null);
      return;
    }
    setFile(f);
    setProgress(0);
    setDuration(null);
    setUploading(true);

    // read duration via a hidden video element
    const url = URL.createObjectURL(f);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      const d = v.duration;
      setDuration(d);
      URL.revokeObjectURL(url);
      if (d && d > MAX_DURATION) {
        setError(t('add.upload.tooLong'));
        setUploading(false);
      }
    };
    v.onerror = () => URL.revokeObjectURL(url);
    v.src = url;

    // simulate receiving the file
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 22 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setUploading(false);
      }
      setProgress(Math.min(100, Math.round(p)));
    }, 220);
  }, [t]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const remove = () => {
    setFile(null);
    setProgress(0);
    setError('');
    setDuration(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const ready = file && !error && !uploading && progress >= 100 && !(duration && duration > MAX_DURATION);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all ${
            dragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border bg-card/40 hover:border-primary/50 hover:bg-card/70'
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        >
          <span className="relative grid h-20 w-20 place-items-center rounded-3xl brand-gradient text-white shadow-float transition-transform group-hover:scale-105">
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
              aria-label={t('add.upload.remove')}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('add.upload.progress')}</span>
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
              {t('add.upload.done')}
            </motion.p>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
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
        onClick={() => onStart({ sourceType: 'upload', sourceLabel: file.name })}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all enabled:hover:brightness-110 enabled:hover:shadow-float enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        {t('add.upload.analyze')}
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