import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Icon-only pill by default; with showLabel it grows into an icon + Dark/Light
// labeled pill (used by the expanded top-of-page navbar).
export default function ThemeToggle({ className = '', showLabel = false, labelStyle }) {
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
      className={`navbar-theme-toggle group relative inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 text-foreground/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-sm transition-[color,background-color,box-shadow] hover:bg-white/20 hover:text-foreground hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/12 dark:bg-black/35 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] dark:hover:bg-black/25 ${
        showLabel ? 'w-11 min-w-11 justify-center px-0 text-xs font-semibold lg:min-w-[3.5rem] lg:w-auto lg:justify-start lg:px-3.5' : 'w-11 justify-center'
      } ${className}`}
    >
      {showLabel ? (
        // Labeled pill: one real icon + text, so the pill stays symmetric.
        isDark ? <Moon className="h-[18px] w-[18px] shrink-0" /> : <Sun className="h-[18px] w-[18px] shrink-0" />
      ) : (
        // Icon-only pill: both icons crossfade in place, centered.
        <>
          <Sun
            className={`absolute h-[18px] w-[18px] transition-all ${isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
          />
          <Moon
            className={`absolute h-[18px] w-[18px] transition-all ${isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}`}
          />
        </>
      )}
      {showLabel && (
        <motion.span
          className="hidden overflow-hidden whitespace-nowrap lg:inline-block"
          style={labelStyle}
        >
          {isDark ? t('theme.dark') : t('theme.light')}
        </motion.span>
      )}
    </button>
  );
}
