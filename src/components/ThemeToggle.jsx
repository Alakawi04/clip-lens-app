import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Icon-only pill by default; with showLabel it grows into an icon + Dark/Light
// labeled pill (used by the expanded top-of-page navbar).
export default function ThemeToggle({ className = '', showLabel = false }) {
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
      className={`group relative inline-flex items-center gap-2 rounded-full border border-border bg-card/60 text-foreground/70 transition-all hover:bg-card hover:text-foreground hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        showLabel ? 'px-3.5 py-2 text-xs font-semibold' : 'h-9 w-9 justify-center'
      } ${className}`}
    >
      {showLabel ? (
        // Labeled pill: one real icon + text, so the pill stays symmetric.
        isDark ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />
      ) : (
        // Icon-only pill: both icons crossfade in place, centered.
        <>
          <Sun
            className={`absolute h-4 w-4 transition-all ${isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
          />
          <Moon
            className={`absolute h-4 w-4 transition-all ${isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}`}
          />
        </>
      )}
      {showLabel && <span>{isDark ? t('theme.dark') : t('theme.light')}</span>}
    </button>
  );
}