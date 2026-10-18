import React from 'react';
import { Link } from 'react-router-dom';
import { Languages, Sparkles, Play, Check, Type } from 'lucide-react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import ScoreRing from '@/components/ScoreRing';
import { useI18n } from '@/lib/i18n';

// Side panel for the split auth screens: a product-flavored mockup.
// Purely illustrative — the "Demo" badge keeps it from reading as real
// user results. No sample titles or user-like data.
export function AuthDemoPanel() {
  const { t } = useI18n();

  return (
    <div className="relative w-full max-w-md justify-self-center overflow-hidden rounded-[2rem] border border-border/70 bg-card/40 p-6 shadow-float sm:p-8 lg:justify-self-start">
      <div className="pointer-events-none absolute -top-24 start-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px] animate-pulse-soft rtl:translate-x-1/2" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl brand-gradient text-white shadow-soft">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t('auth.demo.badge')}
          </span>
        </div>
        <h2 className="mt-4 font-display text-xl font-extrabold tracking-tight">{t('auth.demo.title')}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('auth.demo.desc')}</p>
      </div>

      {/* Mock analysis card */}
      <div className="relative mt-6 space-y-4 rounded-3xl border border-border bg-charcoal/60 p-5">
        <div className="flex items-center gap-4">
          <span className="grid aspect-video w-28 shrink-0 place-items-center rounded-xl brand-gradient text-white shadow-soft">
            <Play className="h-5 w-5 fill-white" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <ScoreRing score={87} size={72} stroke={7} />
            <p className="text-[11px] font-semibold text-muted-foreground">{t('auth.demo.thumbScore')}</p>
          </div>
        </div>

        <div className="h-px bg-border/60" />

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">{t('auth.demo.titleClarity')}</span>
            <Type className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[92%] rounded-full brand-gradient" />
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-500">
            <Check className="h-3.5 w-3.5" />
          </span>
          <p className="text-sm font-semibold">{t('auth.demo.recommendations')}</p>
        </div>
      </div>
    </div>
  );
}

// Two-column auth layout (shadcn login-02 structure on ClipLens identity):
// form column + product visual column. On small screens the form shows
// first and the visual panel moves below it.
export default function AuthSplit({ icon: Icon, title, subtitle, footer, children }) {
  const { lang, toggleLang, t } = useI18n();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-24 start-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] dark:bg-primary/25 rtl:translate-x-1/2" />
        <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-accent-foreground/15 blur-[120px]" />
        <div className="absolute bottom-10 start-0 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5">
        <Link to="/" className="transition-transform hover:scale-[1.02]">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'en' ? 'عربي' : 'English'}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-2 text-xs font-semibold transition-all hover:bg-card active:scale-95"
          >
            <Languages className="h-3.5 w-3.5 text-muted-foreground" />
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Form + visual columns */}
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pb-14 pt-28 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pt-24">
        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="glass rounded-[2rem] border border-border/70 p-7 shadow-float sm:p-8">
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.35rem] brand-gradient text-white shadow-float">
                {Icon && <Icon className="h-8 w-8" aria-hidden="true" />}
              </div>
              <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="mt-7">{children}</div>
          </div>

          {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}

          {/* Legal links */}
          <p className="mt-4 text-center text-xs text-muted-foreground/80">
            {t('auth.terms.pre')}{' '}
            <Link to="/terms" className="font-medium text-foreground/90 underline-offset-2 transition-colors hover:text-primary hover:underline">
              {t('footer.terms')}
            </Link>{' '}
            {t('auth.terms.mid')}{' '}
            <Link to="/privacy" className="font-medium text-foreground/90 underline-offset-2 transition-colors hover:text-primary hover:underline">
              {t('footer.privacy')}
            </Link>
          </p>
        </div>

        <AuthDemoPanel />
      </div>
    </div>
  );
}