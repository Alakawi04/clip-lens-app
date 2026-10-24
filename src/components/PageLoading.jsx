import { ScanSearch } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function PageLoading() {
  const { t } = useI18n();

  return (
    <div className="page-loader" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{t('common.loading')}</span>
      <div className="page-loader-card" aria-hidden="true">
        <div className="page-loader-mark">
          <ScanSearch className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <div className="page-loader-copy">
          <span className="page-loader-brand">ClipLens</span>
          <span className="page-loader-label">{t('common.loading')}</span>
        </div>
        <div className="page-loader-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
