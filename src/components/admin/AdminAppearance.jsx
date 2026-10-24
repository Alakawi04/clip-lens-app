import React, { useEffect } from 'react';
import { Check, Moon, Sun, Network, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes';
import { applyAccentColor, saveSiteThemePreference } from '@/lib/SiteSettingsContext';
import { applySiteFonts, DEFAULT_SITE_FONTS, FONT_OPTIONS, loadFontPreviews } from '@/lib/siteFonts';
import { useI18n } from '@/lib/i18n';

const PRESETS = [
  { name: 'YouTube Red', value: '#FF0000' },
  { name: 'Crimson', value: '#DC2626' },
  { name: 'Ember', value: '#E11D48' },
  { name: 'Deep Red', value: '#B91C1C' },
  { name: 'Sunset', value: '#F97316' },
  { name: 'Violet', value: '#7C3AED' },
];

export default function AdminAppearance({ draft, set }) {
  const { t, lang } = useI18n();
  const { setTheme } = useTheme();
  const current = (draft.accent_color || '#FF0000').toUpperCase();
  const fonts = { ...DEFAULT_SITE_FONTS, ...(draft.texts?.__appearance || {}) };
  const letterSpacing = Math.min(0.04, Math.max(0, Number(fonts.letterSpacing) || 0));
  const siteTheme = draft.texts?.__appearance?.theme === 'light' ? 'light' : 'dark';
  const particleStyle = draft.particles_style === 'none' ? 'none' : 'neural';

  useEffect(() => {
    loadFontPreviews();
  }, []);

  // Live preview as the admin picks a color; persisted on save.
  const pick = (value) => {
    set({ accent_color: value });
    applyAccentColor(value);
  };

  const pickFont = (language, value) => {
    const next = { ...fonts, [language]: value };
    set({ texts: { ...(draft.texts || {}), __appearance: next } });
    applySiteFonts(next);
  };

  const pickLetterSpacing = (value) => {
    const next = { ...fonts, letterSpacing: Number(value) };
    set({ texts: { ...(draft.texts || {}), __appearance: next } });
    applySiteFonts(next);
  };

  const pickTheme = (value) => {
    const next = { ...fonts, theme: value };
    set({ texts: { ...(draft.texts || {}), __appearance: next } });
    saveSiteThemePreference(value);
    setTheme(value);
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.appearance.theme')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.appearance.themeHint')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { value: 'dark', label: t('admin.appearance.dark'), icon: Moon, preview: 'bg-[#101012] text-white' },
            { value: 'light', label: t('admin.appearance.light'), icon: Sun, preview: 'bg-[#f6f4f2] text-[#242326]' },
          ].map((option) => {
            const Icon = option.icon;
            const selected = siteTheme === option.value;
            return (
              <button key={option.value} type="button" onClick={() => pickTheme(option.value)} aria-pressed={selected}
                className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-start transition-colors ${selected ? 'border-primary/55 bg-primary/[0.07]' : 'border-border/80 bg-card/35 hover:border-primary/30'}`}>
                <span className={`grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-black/10 ${option.preview}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><b className="block text-sm">{option.label}</b><small className="mt-1 block text-xs text-muted-foreground">{selected ? t('admin.appearance.activeTheme') : t('admin.appearance.chooseTheme')}</small></span>
                <span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'}`} aria-hidden="true">{selected && <Check className="h-3.5 w-3.5" />}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.appearance.fonts')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.appearance.fontsHint')}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            { key: 'arabic', label: t('admin.appearance.arabicFont'), dir: 'rtl', sample: 'صناعة محتوى يلفت الانتباه' },
            { key: 'english', label: t('admin.appearance.englishFont'), dir: 'ltr', sample: 'Stand out with every video' },
          ].map((item) => (
            <div key={item.key} className="min-w-0 rounded-2xl border border-border/80 bg-background/45 p-3 sm:p-4">
              <div className="flex min-h-10 items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold">{item.label}</h4>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {FONT_OPTIONS[item.key].length} {lang === 'ar' ? 'خطًا' : 'fonts'}
                  </p>
                </div>
                <span
                  dir={item.dir}
                  className="max-w-[55%] truncate rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-1 text-[11px] font-semibold text-primary"
                  style={{ fontFamily: `"${fonts[item.key]}"` }}
                  title={fonts[item.key]}
                >
                  {fonts[item.key]}
                </span>
              </div>

              <div
                role="group"
                aria-label={item.label}
                className="mt-3 grid max-h-[21rem] grid-cols-1 gap-2 overflow-y-auto overscroll-contain pe-1 sm:grid-cols-2"
              >
                {FONT_OPTIONS[item.key].map((font) => {
                  const selected = fonts[item.key] === font;
                  return (
                    <button
                      key={font}
                      type="button"
                      onClick={() => pickFont(item.key, font)}
                      aria-pressed={selected}
                      className={`group relative min-h-[5.1rem] min-w-0 rounded-xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                        selected
                          ? 'border-primary/60 bg-primary/[0.09] shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.13)]'
                          : 'border-border/80 bg-card/35 hover:border-primary/35 hover:bg-card/75'
                      }`}
                    >
                      <span className="block truncate pe-5 text-xs font-bold text-foreground" style={{ fontFamily: `"${font}", sans-serif` }}>
                        {font}
                      </span>
                      <span dir={item.dir} className="mt-1.5 block truncate text-[13px] text-muted-foreground" style={{ fontFamily: `"${font}", sans-serif` }}>
                        {item.sample}
                      </span>
                      <span className={`absolute end-2 top-2 grid h-4 w-4 place-items-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background/70 text-transparent'}`} aria-hidden="true">
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p dir={item.dir} className="mt-3 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 text-sm" style={{ fontFamily: `"${fonts[item.key]}", sans-serif` }}>
                {item.sample}
              </p>
            </div>
          ))}
        </div>
        <label htmlFor="site-letter-spacing" className="mt-5 block rounded-2xl border border-border/80 bg-card/30 p-4">
          <span className="flex items-start justify-between gap-4">
            <span className="min-w-0">
              <b className="block text-sm">{t('admin.appearance.letterSpacing')}</b>
              <small className="mt-1 block text-xs leading-relaxed text-muted-foreground">{t('admin.appearance.letterSpacingHint')}</small>
            </span>
            <output htmlFor="site-letter-spacing" className="shrink-0 rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-1 font-mono text-xs text-primary">
              {letterSpacing.toFixed(3)}em
            </output>
          </span>
          <input
            id="site-letter-spacing"
            type="range"
            min="0"
            max="0.04"
            step="0.001"
            value={letterSpacing}
            onChange={(event) => pickLetterSpacing(event.target.value)}
            aria-label={t('admin.appearance.letterSpacing')}
            className="mt-4 w-full accent-primary"
          />
          <span className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{t('admin.appearance.letterSpacingDefault')}</span>
            <span>{t('admin.appearance.letterSpacingWide')}</span>
          </span>
          <p className="mt-3 rounded-xl border border-border/70 bg-background/40 px-3 py-2.5 text-sm" style={{ letterSpacing: `${letterSpacing}em` }}>
            {lang === 'ar' ? 'نص واضح ومريح للقراءة' : 'Clear, comfortable text spacing'}
          </p>
        </label>
      </section>

      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.appearance.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.appearance.hint')}</p>

        <label htmlFor="site-accent-color" className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('admin.appearance.accent')}
        </label>

        <div className="mt-3 flex flex-wrap gap-3">
          {PRESETS.map((p) => {
            const active = p.value.toUpperCase() === current;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => pick(p.value)}
                aria-label={p.name}
                className={`relative h-11 w-11 rounded-2xl border transition-transform active:scale-95 ${
                  active ? 'border-foreground/60 scale-105' : 'border-border'
                }`}
                style={{ background: p.value }}
              >
                {active && <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(draft.accent_color || '') ? draft.accent_color : '#FF0000'}
            onChange={(e) => pick(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-transparent"
          />
          <input
            id="site-accent-color"
            value={draft.accent_color || ''}
            onChange={(e) => pick(e.target.value)}
            className="h-10 w-36 rounded-xl border border-border bg-transparent px-3 font-mono text-xs uppercase outline-none focus:ring-2 focus:ring-ring/40"
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-semibold text-primary">
            <span className="h-3 w-3 rounded-full" style={{ background: draft.accent_color || '#FF0000' }} />
            {t('admin.appearance.accent')}
          </span>
        </div>
      </section>

      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.appearance.particles')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.appearance.particles.hint')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { value: 'none', label: t('admin.particles.off'), icon: EyeOff },
            { value: 'neural', label: t('admin.particles.neural'), icon: Network },
          ].map((option) => {
            const Icon = option.icon;
            const selected = particleStyle === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => set({ particles_style: option.value })}
                aria-pressed={selected}
                className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-colors ${selected ? 'border-primary/55 bg-primary/[0.07]' : 'border-border/80 bg-card/35 hover:border-primary/30'}`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground'}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{option.label}</span>
                <span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'}`} aria-hidden="true">
                  {selected && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
        {particleStyle === 'neural' && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block rounded-2xl border border-border/80 bg-card/30 p-4">
              <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                <span>{t('admin.particles.density')}</span>
                <output className="font-mono text-xs text-primary">{draft.particle_count ?? 120}</output>
              </span>
              <input
                type="range"
                min="12"
                max="360"
                step="1"
                value={draft.particle_count ?? 120}
                onChange={(event) => set({ particle_count: Number(event.target.value) })}
                aria-label={t('admin.particles.density')}
                className="mt-3 w-full accent-primary"
              />
              <span className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>12</span><span>360</span></span>
            </label>
            <label className="block rounded-2xl border border-border/80 bg-card/30 p-4">
              <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                <span>{t('admin.particles.size')}</span>
                <output className="font-mono text-xs text-primary">{Number(draft.particle_size ?? 1.55).toFixed(1)}×</output>
              </span>
              <input
                type="range"
                min="0.45"
                max="4.8"
                step="0.1"
                value={draft.particle_size ?? 1.55}
                onChange={(event) => set({ particle_size: Number(event.target.value) })}
                aria-label={t('admin.particles.size')}
                className="mt-3 w-full accent-primary"
              />
              <span className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>0.45×</span><span>4.8×</span></span>
            </label>
          </div>
        )}
      </section>

    </div>
  );
}
