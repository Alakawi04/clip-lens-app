import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles, Search, History as HistoryIcon, Zap } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import AccountMenu from './AccountMenu';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useCredits } from '@/lib/CreditContext';
import { useScrolled } from '@/hooks/use-scrolled';

// Floating brand mark + account controls, with the tubelight pill below it.
// At the very top of the page everything sits large and labeled (word on the
// profile chip, Dark/Light on the theme toggle, icons + labels in the pill).
// On scroll it all eases back into the normal, slimmer version — never away.
export default function Navbar() {
  const { t } = useI18n();
  const scrolled = useScrolled();
  const { isAuthenticated } = useAuth();
  const { enabled, balance } = useCredits();
  const expanded = !scrolled;

  const items = [
    { name: t('nav.home'), to: '/', icon: Home },
    { name: t('nav.analyze'), to: '/analyze', icon: Sparkles },
    { name: t('nav.review'), to: '/analyze?mode=review', icon: Search },
    // History only makes sense once you can actually have analyses saved.
    ...(isAuthenticated ? [{ name: t('nav.history'), to: '/history', icon: HistoryIcon }] : []),
  ];

  return (
    <>
      <motion.div
        className="fixed inset-x-0 top-0 z-40"
        initial={false}
        animate={{ scale: scrolled ? 0.9 : 1, opacity: scrolled ? 0.92 : 1 }}
        transition={{ type: 'spring', stiffness: 110, damping: 20 }}
      >
        <div
          className={cn(
            'mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-500 sm:px-6 lg:px-8',
            scrolled ? 'gap-0 pt-1.5' : 'gap-3 pt-4 sm:pt-5'
          )}
        >
          <Link
            to="/"
            className="min-w-0 shrink transition-transform duration-500 hover:scale-105 active:scale-95"
          >
            <Logo className={cn('transition-all duration-500', scrolled ? 'h-7 w-7' : 'h-12 w-12')} />
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {enabled && isAuthenticated && (
              <Link
                to="/analyze"
                title={t('nav.credits')}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/70 px-3 py-1.5 text-xs font-bold shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60"
              >
                <Zap className="h-3.5 w-3.5 text-primary" />
                {balance}
              </Link>
            )}
            <ThemeToggle showLabel={expanded} />
            <AccountMenu showLabel={expanded} />
          </div>
        </div>
      </motion.div>

      <NavBar items={items} compact={scrolled} expanded={expanded} />
    </>
  );
}