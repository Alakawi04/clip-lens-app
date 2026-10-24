import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Home, Sparkles, Search, History as HistoryIcon, Coins } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import AccountMenu from './AccountMenu';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useCredits } from '@/lib/CreditContext';
import { useScrolled } from '@/hooks/use-scrolled';

export default function Navbar() {
  const { t } = useI18n();
  const scrolled = useScrolled(0);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const easedScrollY = useSpring(scrollY, reduceMotion
    ? { stiffness: 1000, damping: 100 }
    : { stiffness: 320, damping: 34, mass: 0.36 });
  const compactProgress = useTransform(reduceMotion ? scrollY : easedScrollY, [0, 92], [0, 1]);
  const headerMaxWidth = useTransform(compactProgress, [0, 1], ['78rem', '70rem']);
  const headerY = useTransform(compactProgress, [0, 1], [0, -2]);
  const labelOpacity = useTransform(compactProgress, [0, 0.28, 0.62], [1, 0.72, 0]);
  const labelMaxWidth = useTransform(compactProgress, [0, 0.7], ['12rem', '0rem']);
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { enabled, balance } = useCredits();
  const items = [
    { name: t('nav.home'), to: '/', icon: Home },
    { name: t('nav.analyze'), to: '/analyze', icon: Sparkles },
    { name: t('nav.review'), to: '/analyze?mode=review', icon: Search },
    ...(isAuthenticated ? [{ name: t('nav.history'), to: '/history', icon: HistoryIcon }] : []),
  ];

  return (
    <>
      <div className="site-navbar-shell pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 lg:px-6">
        <motion.header
          className={cn(
            'navbar-smooth-ease pointer-events-auto relative isolate mx-auto flex w-full max-w-[78rem] items-center justify-between gap-3 rounded-full border border-white/25 bg-background/35 bg-[linear-gradient(135deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_48%,rgba(255,255,255,0.16)_100%)] px-3 py-2 backdrop-blur-[18px] backdrop-saturate-150 ring-1 ring-white/15 shadow-[0_24px_70px_-34px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.38),inset_0_-1px_0_rgba(255,255,255,0.12)] transition-[border-radius,background-color,border-color,padding,box-shadow,backdrop-filter] duration-300 motion-reduce:transition-none dark:border-white/15 dark:bg-black/55 dark:ring-white/[0.08] dark:shadow-[0_24px_70px_-34px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.018)_48%,rgba(255,255,255,0.055)_100%)] lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:justify-normal lg:gap-5 lg:rounded-[1.5rem] lg:px-4 lg:py-2.5',
            scrolled
              ? 'bg-background/65 border-white/35 px-2.5 py-1.5 shadow-[0_18px_55px_-28px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.3)] lg:rounded-full lg:px-3 lg:py-1.5 dark:border-white/20 dark:bg-black/70'
              : 'dark:border-white/12'
          )}
          initial={false}
          style={{
            maxWidth: headerMaxWidth,
            y: headerY,
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-0 z-10 h-px rounded-full bg-gradient-to-r from-transparent via-white/75 to-transparent dark:via-white/35"
          />
          <div className="navbar-account-group relative z-20 flex min-w-0 shrink items-center gap-1.5 sm:gap-2 lg:justify-self-start">
            <Link
              to="/"
              aria-label="ClipLens"
              className="navbar-brand-link min-w-0 shrink-0 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Logo
                className={cn(
                  'navbar-smooth-ease transition-[width,height] duration-300',
                  scrolled ? 'h-9 w-9' : 'h-10 w-10 sm:h-10 sm:w-10 lg:h-11 lg:w-11'
                )}
                showName
                nameStyle={{ opacity: labelOpacity, maxWidth: labelMaxWidth }}
                nameClassName="hidden lg:inline-flex"
              />
            </Link>
            {isLoadingAuth ? (
              <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-full border border-white/10 bg-white/[0.04]" />
            ) : isAuthenticated ? (
              <AccountMenu
                showLabel
                displayLabel={t('nav.profile')}
                labelStyle={{ opacity: labelOpacity, maxWidth: labelMaxWidth }}
                labelClassName="navbar-profile-label overflow-hidden whitespace-nowrap text-xs font-semibold"
              />
            ) : null}
          </div>

          <NavBar
            items={items}
            compact={scrolled}
            placement="inline"
            className="relative z-20 hidden lg:flex"
          />

          <div className="navbar-control-group relative z-20 flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 lg:justify-self-end">
            <div className="navbar-control-items flex shrink-0 items-center gap-1.5 sm:gap-2">
              {isLoadingAuth ? (
                <span
                  aria-hidden="true"
                  className="h-10 w-12 rounded-full border border-white/10 bg-white/[0.04] sm:w-16"
                />
              ) : enabled && isAuthenticated ? (
                <Link
                  to="/admin"
                  className="navbar-credit-button inline-flex h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.12] px-2.5 text-xs font-bold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-primary/[0.18] sm:px-3"
                  aria-label={String(balance)}
                  title={String(balance)}
                >
                  <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="whitespace-nowrap text-[11px] tabular-nums sm:text-xs">{balance}</span>
                </Link>
              ) : null}
              <ThemeToggle showLabel labelStyle={{ opacity: labelOpacity, maxWidth: labelMaxWidth }} />
            </div>
            {!isLoadingAuth && !isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-none transition-colors hover:bg-primary/90 active:scale-[0.97] sm:gap-2 sm:px-4 sm:text-sm"
                style={{ boxShadow: 'none' }}
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                <span>{t('nav.getStarted')}</span>
              </Link>
            )}
          </div>
        </motion.header>
      </div>

      <NavBar items={items} compact={scrolled} placement="floating" />
    </>
  );
}
