import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import SparkleButton from '@/components/SparkleButton';
import LensVisual from '@/components/LensVisual';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import ScrollTypingText from './ScrollTypingText';
import { useFinePointer, useMediaQuery, LARGE_FINE_POINTER_QUERY } from '@/hooks/use-pointer-capability';

export default function Hero() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const finePointer = useFinePointer();
  const showDesktopVisual = useMediaQuery(LARGE_FINE_POINTER_QUERY);
  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="home-hero relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <motion.div
          initial={finePointer ? { opacity: 0, y: 18 } : false}
          animate={finePointer ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-start"
        >
          <ScrollTypingText as="h1" className="fly-3d mt-5 text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" text={t('hero.title')} />
          <ScrollTypingText as="p" className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg lg:mx-0" text={t('hero.subtitle')} delay={120} />
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <SparkleButton to="/analyze" className="w-full sm:w-auto">
              {t('hero.cta')}
            </SparkleButton>
            <button
              type="button"
              onClick={scrollToHow}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3.5 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card sm:w-auto"
            >
              <ArrowDown className="h-4 w-4" />
              {t('hero.secondary')}
            </button>
          </div>
          {!isAuthenticated && (
            <p className="mt-5 text-sm text-muted-foreground">
              {t('hero.note')}{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t('hero.note.login')}
              </Link>
            </p>
          )}
        </motion.div>

        {showDesktopVisual && <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="hidden justify-center lg:flex"
        >
          <LensVisual size={520} />
        </motion.div>}
      </div>
    </section>
  );
}
