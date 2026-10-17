import React from "react";
import { Link } from "react-router-dom";
import { Languages } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const { lang, toggleLang } = useI18n();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      {/* Ambient iOS-style background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-24 start-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] dark:bg-primary/25" />
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

      <div className="w-full max-w-md">
        <div className="glass rounded-[2rem] border border-border/70 p-7 shadow-float sm:p-9">
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
      </div>
    </div>
  );
}