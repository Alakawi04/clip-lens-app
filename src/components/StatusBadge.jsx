import React from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const STYLES = {
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  inProgress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
};

export default function StatusBadge({ status }) {
  const { t } = useI18n();
  const map = {
    completed: { label: t('recent.status.completed'), icon: CheckCircle2, cls: STYLES.completed },
    uploading: { label: t('recent.status.inProgress'), icon: Loader2, cls: STYLES.inProgress, spin: true },
    scenes: { label: t('recent.status.inProgress'), icon: Loader2, cls: STYLES.inProgress, spin: true },
    titles: { label: t('recent.status.inProgress'), icon: Loader2, cls: STYLES.inProgress, spin: true },
    preparing: { label: t('recent.status.inProgress'), icon: Loader2, cls: STYLES.inProgress, spin: true },
    failed: { label: t('recent.status.failed'), icon: AlertCircle, cls: STYLES.failed },
  };
  const cfg = map[status] || map.completed;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cfg.cls}`}>
      <Icon className={`h-3.5 w-3.5 ${cfg.spin ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}