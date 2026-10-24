import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Sparkles, Eye, BarChart3, Coins, ImagePlus, X, ChevronDown, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { prepareReferenceFrames } from '@/lib/videoFrames';

// YouTube links only — any other URL is rejected.
function isValidYouTubeUrl(value) {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) return false;
    const videoId = url.hostname === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.pathname === '/watch'
        ? url.searchParams.get('v')
        : url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})\/?$/)?.[1];
    return /^[\w-]{11}$/.test(videoId || '');
  } catch {
    return false;
  }
}

const FIELDS = [
  { k: 'impressions', labelKey: 'add.link.studio.impressions', ph: '125,000 / 125K / 1.2M' },
  { k: 'ctr', labelKey: 'add.link.studio.ctr', ph: '4.2' },
  { k: 'views', labelKey: 'add.link.studio.views', ph: '8,500 / 8.5K / 1.2M' },
  { k: 'avgView', labelKey: 'add.link.studio.avgView', ph: '2:10 / 1:02:10', duration: true },
  { k: 'duration', labelKey: 'add.link.studio.duration', ph: '12:30 / 1:12:30', duration: true },
];

const EXTRA_FIELDS = [
  { k: 'traffic_sources', labelKey: 'add.link.extra.trafficSources', options: ['browse', 'suggested', 'search', 'shorts', 'external', 'channel_pages', 'playlists', 'notifications', 'other_source', 'NA'], multiple: true },
  { k: 'video_age_days', labelKey: 'add.link.extra.videoAge', options: ['less_than_day', 'one_to_seven_days', 'eight_to_thirty_days', 'one_to_six_months', 'six_to_twelve_months', 'over_year', 'NA'] },
  { k: 'content_type', labelKey: 'add.link.extra.contentType', options: ['tutorial', 'review', 'vlog', 'entertainment', 'education', 'gaming', 'news', 'other_content', 'NA'] },
  { k: 'target_audience', labelKey: 'add.link.extra.audience', options: ['beginners', 'enthusiasts', 'professionals', 'students', 'general_audience', 'children', 'creators', 'other_audience', 'NA'] },
  { k: 'retention_percentage', labelKey: 'add.link.extra.retention', placeholderKey: 'add.link.extra.retentionPlaceholder', numeric: true },
  { k: 'previous_views', labelKey: 'add.link.extra.previousViews', placeholderKey: 'add.link.extra.previousViewsPlaceholder', numeric: true },
  { k: 'previous_ctr', labelKey: 'add.link.extra.previousCtr', placeholderKey: 'add.link.extra.previousCtrPlaceholder', numeric: true },
];

function parseNum(v, key) {
  if (v == null || String(v).trim() === '') return null;
  const value = String(v).trim();
  if (/^na$/i.test(value)) return 'NA';
  const normalized = value.replace(/,/g, '');
  const allowSuffix = ['impressions', 'views', 'previous_views'].includes(key);
  const match = normalized.match(allowSuffix ? /^(\d+(?:\.\d+)?)\s*([kmb])?$/i : /^(\d+(?:\.\d+)?)$/i);
  if (!match) return null;
  const multiplier = { k: 1_000, m: 1_000_000, b: 1_000_000_000 }[match[2]?.toLowerCase()] || 1;
  const parsed = Number(match[1]) * multiplier;
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidNumericField(key, value) {
  const parsed = parseNum(value, key);
  if (parsed === 'NA') return true;
  if (typeof parsed !== 'number') return false;
  if (['impressions', 'views', 'video_age_days', 'previous_views'].includes(key)) {
    return Number.isInteger(parsed);
  }
  if (['ctr', 'retention_percentage', 'previous_ctr'].includes(key)) {
    return parsed >= 0 && parsed <= 100;
  }
  return parsed >= 0;
}

function parseTime(v) {
  if (v == null || String(v).trim() === '') return null;
  const s = String(v).trim();
  if (/^na$/i.test(s)) return 'NA';
  if (s.includes(':')) {
    const parts = s.split(':');
    if (parts.some((part) => !/^\d+$/.test(part))) return null;
    if (parts.length === 2) {
      const [minutes, seconds] = parts.map(Number);
      return seconds <= 59 ? minutes * 60 + seconds : null;
    }
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts.map(Number);
      return minutes <= 59 && seconds <= 59 ? hours * 3600 + minutes * 60 + seconds : null;
    }
    return null;
  }
  return /^\d+$/.test(s) ? Number(s) : null;
}

function StudioField({ label, placeholder, value, onChange, error, duration }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {duration ? (
        <input
          dir="ltr"
          inputMode="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/40 ${
            error ? 'border-red-500/60 focus:border-red-500' : 'border-border focus:border-primary'
          }`}
        />
      ) : (
        <input
          dir="ltr"
          inputMode="decimal"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/40 ${
            error ? 'border-red-500/60 focus:border-red-500' : 'border-border focus:border-primary'
          }`}
        />
      )}
    </div>
  );
}

export default function LinkTab({ onStart, creditCost, disabled, submitError }) {
  const { t, lang } = useI18n();
  const referenceInputRef = useRef(null);
  const studioDetailsRef = useRef(null);
  const extraDetailsRef = useRef(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [touched, setTouched] = useState(false);
  const [studio, setStudio] = useState({ impressions: '', ctr: '', views: '', avgView: '', duration: '' });
  const [videoLanguage, setVideoLanguage] = useState(lang);
  const [videoContext, setVideoContext] = useState('');
  const [spokenContent, setSpokenContent] = useState('');
  const [extra, setExtra] = useState(Object.fromEntries(EXTRA_FIELDS.map(({ k, multiple }) => [k, multiple ? [] : ''])));
  const [invalidFields, setInvalidFields] = useState([]);
  const [referenceFrames, setReferenceFrames] = useState([]);
  const [referenceError, setReferenceError] = useState('');

  const handleReferenceFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    try {
      setReferenceFrames(await prepareReferenceFrames(files));
      setReferenceError('');
    } catch {
      setReferenceError(t('add.link.reference.invalid'));
    }
  };

  const valid = isValidYouTubeUrl(url.trim());
  const setField = (k) => (eventOrValue) => {
    const value = typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value;
    setStudio((prev) => ({ ...prev, [k]: value }));
    setInvalidFields((fields) => fields.filter((field) => field !== k));
  };
  const setExtraField = (k) => (e) => {
    setExtra((prev) => ({ ...prev, [k]: e.target.value }));
    setInvalidFields((fields) => fields.filter((field) => field !== k));
  };
  const toggleTrafficSource = (source) => {
    setExtra((prev) => {
      const selected = Array.isArray(prev.traffic_sources) ? prev.traffic_sources : [];
      if (source === 'NA') {
        return { ...prev, traffic_sources: selected.includes('NA') ? [] : ['NA'] };
      }
      const withoutUnavailable = selected.filter((item) => item !== 'NA');
      return {
        ...prev,
        traffic_sources: withoutUnavailable.includes(source)
          ? withoutUnavailable.filter((item) => item !== source)
          : [...withoutUnavailable, source],
      };
    });
    setInvalidFields((fields) => fields.filter((field) => field !== 'traffic_sources'));
  };

  const submit = () => {
    setTouched(true);
    const invalidStudio = FIELDS
      .filter((field) => {
        const value = studio[field.k];
        if (String(value).trim() === '') return false;
        return field.k === 'avgView' || field.k === 'duration'
          ? parseTime(value) == null
          : !isValidNumericField(field.k, value);
      })
      .map((field) => field.k);
    const invalidExtra = EXTRA_FIELDS
      .filter((field) => {
        const value = extra[field.k];
        if (field.multiple) return false;
        if (String(value).trim() === '') return false;
        return field.numeric && !isValidNumericField(field.k, value);
      })
      .map((field) => field.k);
    const invalid = [...invalidStudio, ...invalidExtra];
    if (!videoLanguage) invalid.push('video_language');
    setInvalidFields(invalid);
    if (invalidStudio.length && studioDetailsRef.current) studioDetailsRef.current.open = true;
    if (invalidExtra.length && extraDetailsRef.current) extraDetailsRef.current.open = true;
    if (!valid) {
      setUrlError(t('add.link.invalid'));
      return;
    }
    if (invalid.length) return;
    setUrlError('');
    let label = url.trim();
    try {
      const u = new URL(url.trim());
      label = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || u.hostname + u.pathname;
    } catch {
      // keep raw
    }
    onStart({
      sourceType: 'youtube',
      sourceLabel: `YouTube · ${label}`,
      sourceUrl: url.trim(),
      referenceFrames,
      videoContext: videoContext.trim().slice(0, 3000),
      spokenContent: spokenContent.trim().slice(0, 8000),
      studioStats: {
        video_language: videoLanguage,
        impressions: parseNum(studio.impressions, 'impressions'),
        ctr: parseNum(studio.ctr, 'ctr'),
        views: parseNum(studio.views, 'views'),
        avgView: parseTime(studio.avgView),
        duration: parseTime(studio.duration),
        traffic_sources: extra.traffic_sources,
        video_age_days: extra.video_age_days,
        content_type: extra.content_type,
        target_audience: extra.target_audience,
        retention_percentage: parseNum(extra.retention_percentage, 'retention_percentage'),
        previous_views: parseNum(extra.previous_views, 'previous_views'),
        previous_ctr: parseNum(extra.previous_ctr, 'previous_ctr'),
      },
    });
  };

  return (
    <div>
      <div className="rounded-3xl border border-border bg-card/40 p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
            <Link2 className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-lg font-bold">{t('add.link.title')}</p>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="yt-url" className="sr-only">{t('add.link.title')}</label>
          <div className={`flex items-center gap-2 rounded-2xl border bg-card px-3.5 py-1 transition-all ${
            touched && !valid ? 'border-red-500/60 ring-1 ring-red-500/30' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40'
          }`}>
            <input
              id="yt-url"
              type="url"
              inputMode="url"
              dir="ltr"
              value={url}
              onChange={(e) => { const nextUrl = e.target.value; setUrl(nextUrl); if (touched) setUrlError(isValidYouTubeUrl(nextUrl.trim()) ? '' : t('add.link.invalid')); }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={t('add.link.placeholder')}
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <AnimatePresence>
            {urlError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-sm font-medium text-red-600 dark:text-red-400"
              >
                {urlError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4">
            <label htmlFor="video-language" className="text-xs font-medium text-muted-foreground">
              {t('add.link.videoLanguage')} <span className="text-primary">*</span>
            </label>
            <select
              id="video-language"
              required
              aria-invalid={invalidFields.includes('video_language')}
              aria-describedby={invalidFields.includes('video_language') ? 'video-language-error' : undefined}
              value={videoLanguage}
              onChange={(event) => {
                setVideoLanguage(event.target.value);
                setInvalidFields((fields) => fields.filter((field) => field !== 'video_language'));
              }}
              className={`mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 ${
                invalidFields.includes('video_language') ? 'border-red-500/60' : 'border-border focus:border-primary'
              }`}
            >
              <option value="">{t('add.link.videoLanguage.select')}</option>
              {['ar', 'en', 'es', 'fr', 'de', 'pt', 'tr', 'hi', 'id', 'ja', 'ko'].map((code) => (
                <option key={code} value={code}>{t(`add.link.videoLanguage.${code}`)}</option>
              ))}
            </select>
            {invalidFields.includes('video_language') && <p id="video-language-error" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{t('add.link.videoLanguage.required')}</p>}
        </div>

        <details className="group mt-4 rounded-2xl border border-border bg-card/60 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-2"><ImagePlus className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{t('add.link.reference.title')}</span><span className="shrink-0 text-xs font-normal text-muted-foreground">{referenceFrames.length ? `${referenceFrames.length} ${t('add.link.reference.ready')}` : t('add.link.optional')}</span></span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <input
              ref={referenceInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => void handleReferenceFiles(event)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-muted-foreground">{t('add.link.reference.desc')}</p>
              {referenceFrames.length > 0 && <p className="mt-2 text-xs font-medium text-primary">{referenceFrames.length} {t('add.link.reference.ready')}</p>}
              {referenceError && <p className="mt-2 text-xs text-destructive" role="alert">{referenceError}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => referenceInputRef.current?.click()} disabled={disabled} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3.5 py-2 text-xs font-semibold transition hover:border-primary/50 hover:text-primary disabled:opacity-50">
                <ImagePlus className="h-4 w-4" />{t('add.link.reference.choose')}
              </button>
              {referenceFrames.length > 0 && <button type="button" onClick={() => { setReferenceFrames([]); setReferenceError(''); }} aria-label={t('add.link.reference.remove')} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"><X className="h-4 w-4" /></button>}
            </div>
          </div>
        </details>

        <details ref={studioDetailsRef} className="group mt-3 rounded-2xl border border-border bg-card/60 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />{t('add.link.studio.title')} <span className="text-xs font-normal text-muted-foreground">{t('add.link.optional')}</span></span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('add.link.studio.desc')}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('add.link.studio.autoMetadata')}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {FIELDS.map((f) => <StudioField key={f.k} label={t(f.labelKey)} placeholder={f.ph} value={studio[f.k]} onChange={setField(f.k)} error={invalidFields.includes(f.k)} duration={f.duration} />)}
          </div>
          {invalidFields.some((field) => FIELDS.some((item) => item.k === field)) && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{t('add.link.studio.invalid')}</p>}
        </details>

        <details ref={extraDetailsRef} className="group mt-3 rounded-2xl border border-border bg-card/60 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <span>{t('add.link.extra.title')} <span className="text-xs font-normal text-muted-foreground">{t('add.link.optional')}</span></span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('add.link.extra.description')}</p>
          <label htmlFor="youtube-video-context" className="mt-3 block text-xs font-medium text-muted-foreground">{t('add.link.context.label')}</label>
          <textarea id="youtube-video-context" value={videoContext} onChange={(event) => setVideoContext(event.target.value.slice(0, 3000))} maxLength={3000} rows={3} dir="auto" placeholder={t('add.link.context.placeholder')} className="mt-1 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-ring/40" />
          <p className="mt-1 text-end text-[11px] text-muted-foreground">{videoContext.length}/3000</p>
          <label htmlFor="youtube-spoken-content" className="mt-3 block text-xs font-medium text-muted-foreground">{t('add.link.transcript.title')}</label>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('add.link.transcript.help')}</p>
          <textarea id="youtube-spoken-content" value={spokenContent} onChange={(event) => setSpokenContent(event.target.value.slice(0, 8000))} maxLength={8000} rows={4} dir="auto" placeholder={t('add.link.transcript.placeholder')} className="mt-1 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-ring/40" />
          <p className="mt-1 text-end text-[11px] text-muted-foreground">{spokenContent.length}/8000</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {EXTRA_FIELDS.map((field) => (
              <div key={field.k} className={field.multiple ? 'sm:col-span-2' : ''}>
                <label htmlFor={`extra-${field.k}`} className="text-xs font-medium text-muted-foreground">{t(field.labelKey)}</label>
                {field.multiple ? (
                  <fieldset
                    id={`extra-${field.k}`}
                    className={`mt-1 grid gap-2 rounded-xl border p-3 sm:grid-cols-2 ${
                      invalidFields.includes(field.k) ? 'border-red-500/60' : 'border-border'
                    }`}
                  >
                    {field.options.map((option) => {
                      const checked = extra[field.k].includes(option);
                      return (
                        <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTrafficSource(option)}
                            className="h-4 w-4 accent-primary"
                          />
                          <span>{t(`add.link.extra.option.${option}`)}</span>
                        </label>
                      );
                    })}
                  </fieldset>
                ) : field.options ? (
                  <select
                    id={`extra-${field.k}`}
                    value={extra[field.k]}
                    onChange={setExtraField(field.k)}
                    className={`mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring/40 ${
                      invalidFields.includes(field.k) ? 'border-red-500/60 focus:border-red-500' : 'border-border focus:border-primary'
                    }`}
                  >
                    <option value="">{t('add.link.extra.selectPlaceholder')}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>{t(`add.link.extra.option.${option}`)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`extra-${field.k}`}
                    type="text"
                    inputMode={field.numeric ? 'decimal' : undefined}
                    value={extra[field.k]}
                    onChange={setExtraField(field.k)}
                    placeholder={t(field.placeholderKey)}
                    className={`mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/40 ${
                      invalidFields.includes(field.k) ? 'border-red-500/60 focus:border-red-500' : 'border-border focus:border-primary'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </details>

        <button
          type="button"
          onClick={submit}
          disabled={!url.trim() || disabled}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all enabled:hover:brightness-110 enabled:hover:shadow-float enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {disabled ? t('add.link.fetching') : t('add.link.analyze')}
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
        {submitError && <p role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{t('analyze.submitError')}</p>}
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
        <Eye className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">{t('add.link.privacyTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('add.link.privacy')}</p>
        </div>
      </div>
    </div>
  );
}
