import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useI18n } from '@/lib/i18n';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 border-t border-border/70">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
          <div className="max-w-xs text-center sm:text-start">
            <Logo className="h-8 w-8" />
            <p className="mt-3 text-sm text-muted-foreground">{t('footer.tagline')}</p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center sm:items-end sm:text-end">
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">{t('nav.home')}</Link>
              <Link to="/analyze" className="hover:text-foreground transition-colors">{t('nav.analyze')}</Link>
              <Link to="/analyze?mode=review" className="hover:text-foreground transition-colors">{t('nav.review')}</Link>
              <Link to="/history" className="hover:text-foreground transition-colors">{t('nav.history')}</Link>
              <span className="hidden h-4 w-px bg-border sm:inline-block" aria-hidden="true" />
              <Link to="/privacy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link>
              <Link to="/help" className="hover:text-foreground transition-colors">{t('footer.help')}</Link>
            </nav>
            <p className="text-xs text-muted-foreground/80">© {new Date().getFullYear()} ClipLens · {t('footer.rights')}</p>
            <p className="max-w-sm text-xs text-muted-foreground/60">{t('footer.disclaimer')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}