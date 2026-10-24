import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

export default function PolicyLinks({ className = '' }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t('footer.legal')} className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground ${className}`}>
      <Link to="/privacy" className="transition-colors hover:text-foreground">{t('footer.privacy')}</Link>
      <Link to="/terms" className="transition-colors hover:text-foreground">{t('footer.terms')}</Link>
      <Link to="/help" className="transition-colors hover:text-foreground">{t('footer.help')}</Link>
    </nav>
  );
}
