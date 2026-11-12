import React, { useEffect, useRef, useState } from 'react';
import { Coins, ImagePlus, Loader2, Sparkles, X, Youtube } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { prepareReferenceFrames } from '@/lib/videoFrames';

function validYouTubeUrl(value) {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) return false;
    const id = url.hostname === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.pathname === '/watch'
        ? url.searchParams.get('v')
        : url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})\/?$/)?.[1];
    return /^[\w-]{11}$/.test(id || '');
  } catch {
    return false;
  }
}

const languages = ['auto', 'ar', 'en', 'es', 'fr', 'de', 'pt', 'tr', 'hi', 'id', 'ja', 'ko'];

export default function YouTubeToolForm({ tool, initialUrl = '', initialStats = null, onStart, creditCost, disabled, submitError }) {
  const { t } = useI18n();
  const [url, setUrl] = useState(initialUrl);
  const [language, setLanguage] = useState('auto');
  const [context, setContext] = useState('');
  const [audience, setAudience] = useState('');
  const [style, setStyle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [thumbnailText, setThumbnailText] = useState('');
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [referenceFrames, setReferenceFrames] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => setUrl(initialUrl || ''), [initialUrl]);
  useEffect(() => {
    if (!initialStats) return;
    setLanguage(initialStats.video_language || 'auto');
    setContext(initialStats.video_context || '');
    setAudience(initialStats.title_audience || '');
    setStyle(initialStats.title_style || '');
    setKeywords(initialStats.title_keywords || '');
    setThumbnailPrompt(initialStats.thumbnail_image_prompt || '');
    setThumbnailText(initialStats.thumbnail_text || '');
  }, [initialStats]);

  const handleImages = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    event.target.value = '';
    if (!files.length) return;
    try {
      const frames = await prepareReferenceFrames(files);
      setReferenceFrames(frames);
      setReferenceFiles(files);
      setError('');
    } catch {
      setError(t('tools.form.referenceError'));
    }
  };

  const submit = (event) => {
    event.preventDefault();
    setError('');
    if (!validYouTubeUrl(url.trim())) {
      setError(t('add.link.invalid'));
      return;
    }
    if (tool === 'thumbnail' && !thumbnailPrompt.trim() && !context.trim()) {
      setError(t('tools.thumbnail.directionRequired'));
      return;
    }
    const label = `YouTube · ${url.trim()}`;
    const shared = {
      sourceType: 'youtube',
      sourceLabel: label,
      sourceUrl: url.trim(),
      toolMode: tool,
      referenceFrames,
      videoContext: context.trim().slice(0, 3000),
      studioStats: {
        video_language: language,
        video_language_mode: language === 'auto' ? 'auto' : 'selected',
        title_audience: audience.trim().slice(0, 300),
        title_style: style.trim().slice(0, 300),
        title_keywords: keywords.trim().slice(0, 500),
        thumbnail_image_prompt: thumbnailPrompt.trim().slice(0, 2400),
        thumbnail_text: thumbnailText.trim().slice(0, 120),
        has_reference_images: referenceFrames.length > 0,
      },
    };
    onStart(shared);
  };

  const isTitles = tool === 'titles';
  const submitLabel = t(isTitles ? 'tools.titles.submit' : 'tools.thumbnail.submit');
  const titlePreview = keywords.split(',').map((item) => item.trim()).find(Boolean) || t('tools.titles.previewNew');

  return (
    <form onSubmit={submit} className={`tool-input-form tool-input-form--${tool} rounded-[2rem] border border-border bg-card/45 p-5 shadow-soft sm:p-7`}>
      <div className="tool-source-field">
        <span className="tool-source-icon"><Youtube className="h-4 w-4" /></span>
        <label htmlFor="tool-youtube-url" className="sr-only">{t('tools.form.youtubeUrl')}</label>
        <input
          id="tool-youtube-url"
          type="url"
          dir="ltr"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={disabled}
          className="tool-source-input"
        />
        <span className="tool-source-status" aria-hidden="true">{initialUrl && url === initialUrl ? <Sparkles className="h-3.5 w-3.5" /> : 'YT'}</span>
      </div>

      {isTitles ? (
        <>
          <section className="tool-title-brief mt-5">
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="tool-field-label">
                {t('tools.form.language')}
                <select value={language} onChange={(event) => setLanguage(event.target.value)} className="tool-field-control">
                  {languages.map((option) => <option key={option} value={option}>{t(`add.link.videoLanguage.${option}`)}</option>)}
                </select>
              </label>
              <label className="tool-field-label">
                {t('tools.titles.audience')}
                <input value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={300} placeholder={t('tools.titles.audiencePlaceholder')} className="tool-field-control" />
              </label>
              <label className="tool-field-label">
                {t('tools.titles.style')}
                <input value={style} onChange={(event) => setStyle(event.target.value)} maxLength={300} placeholder={t('tools.titles.stylePlaceholder')} className="tool-field-control" />
              </label>
              <label className="tool-field-label">
                {t('tools.titles.keywords')}
                <input value={keywords} onChange={(event) => setKeywords(event.target.value)} maxLength={500} placeholder={t('tools.titles.keywordsPlaceholder')} className="tool-field-control" />
              </label>
            </div>
            <label className="tool-field-label mt-4 block">
              {t('tools.titles.context')}
              <textarea value={context} onChange={(event) => setContext(event.target.value.slice(0, 3000))} rows={4} maxLength={3000} placeholder={t('tools.titles.contextPlaceholder')} className="tool-field-control min-h-28 resize-y leading-relaxed" />
            </label>
          </section>
          <div className="tool-title-live-preview mt-4">
            <span className="tool-title-preview-mark"><Sparkles className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p>{t('tools.titles.previewRefined')}</p><strong dir="auto">{titlePreview}</strong></div>
            <span className="tool-title-preview-check"><span>{t('tools.titles.previewBadge')}</span><b>{keywords.length}/500</b></span>
          </div>
        </>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            <label className="tool-language-compact">{t('tools.form.language')}<select value={language} onChange={(event) => setLanguage(event.target.value)} className="tool-field-control">
              {languages.map((option) => <option key={option} value={option}>{t(`add.link.videoLanguage.${option}`)}</option>)}
            </select></label>
          </div>
          <div className="tool-thumbnail-composer mt-4">
            <div className="tool-thumbnail-prompt-column">
              <label className="tool-field-label">
                {t('tools.thumbnail.direction')}
                <textarea value={thumbnailPrompt} onChange={(event) => setThumbnailPrompt(event.target.value.slice(0, 2400))} rows={5} maxLength={2400} placeholder={t('tools.thumbnail.directionPlaceholder')} className="tool-field-control min-h-36 resize-y leading-relaxed" />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="tool-field-label">
                  {t('tools.thumbnail.hook')}
                  <input value={thumbnailText} onChange={(event) => setThumbnailText(event.target.value)} maxLength={120} placeholder={t('tools.thumbnail.hookPlaceholder')} className="tool-field-control" />
                </label>
                <label className="tool-field-label">
                  {t('tools.thumbnail.context')}
                  <input value={context} onChange={(event) => setContext(event.target.value.slice(0, 3000))} maxLength={3000} placeholder={t('tools.thumbnail.contextPlaceholder')} className="tool-field-control" />
                </label>
              </div>
            </div>
            <div className="tool-thumbnail-form-preview">
              <div className="tool-thumbnail-preview-art">
                <span className="tool-thumbnail-preview-sheen" />
                <span className="tool-thumbnail-preview-subject" />
                <strong dir="auto">{thumbnailText.trim() || t('tools.thumbnail.canvasWords')}</strong>
                <span className="tool-thumbnail-preview-stamp">16:9</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-semibold text-muted-foreground"><span>{t('tools.thumbnail.canvasLabel')}</span><span>{thumbnailText.length}/120</span></div>
            </div>
          </div>
          <div className="tool-reference-picker mt-4">
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void handleImages(event)} className="hidden" />
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">{t('tools.thumbnail.references')}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('tools.thumbnail.referencesHint')}</p>{referenceFiles.length > 0 && <p className="mt-1 text-xs font-semibold text-primary">{referenceFiles.length} {t('tools.thumbnail.referencesSelected')}</p>}</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="tool-reference-button"><ImagePlus className="h-4 w-4" />{t('tools.thumbnail.chooseImages')}</button>
              {referenceFiles.length > 0 && <button type="button" onClick={() => { setReferenceFiles([]); setReferenceFrames([]); }} aria-label={t('tools.thumbnail.removeImages')} className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"><X className="h-4 w-4" /></button>}
            </div>
          </div>
        </>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">{error}</p>}
      {submitError && <p role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">{t('analyze.submitError')}</p>}
      <button type="submit" disabled={disabled || !url.trim()} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {disabled ? t('tools.form.working') : submitLabel}
        {Number.isFinite(Number(creditCost)) && <span className="ms-1 inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/25 bg-black/15 px-2.5 py-1 text-xs font-bold"><Coins className="h-3.5 w-3.5" />{creditCost}</span>}
      </button>
    </form>
  );
}
