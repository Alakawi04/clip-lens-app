import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useI18n();
  const current = resolvedTheme || theme || 'light';
  const isDark = current === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
      className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-foreground/70 transition-all hover:bg-card hover:text-foreground hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <Sun className={`h-4 w-4 transition-all ${isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'} absolute`} />
      <Moon className={`h-4 w-4 transition-all ${isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'} absolute`} />
    </button>
  );
}