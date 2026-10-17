import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Play } from 'lucide-react';
import SparkleButton from '@/components/SparkleButton';
import LensVisual from '@/components/LensVisual';
import { useI18n } from '@/lib/i18n';

export default function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      {/* richer hero backdrop: brand halo, grid and corner glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(60%_55%_at_50%_25%,black,transparent)]" />
        <div className="absolute -top-36 start-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
        <div className="absolute bottom-[-4rem] end-[-2rem] h-72 w-72 rounded-full bg-primary/12 blur-[100px]" />
        <div className="absolute bottom-[-2rem] start-[-3rem] h-64 w-64 rounded-full bg-primary/10 blur-[90px]" />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-start"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t('hero.badge')}
          </span>
          <h1 className="fly-3d mt-5 text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg lg:mx-0">
            {t('hero.subtitle')}
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <SparkleButton to="/analyze" className="w-full sm:w-auto">
              {t('hero.cta')}
            </SparkleButton>
            <Link
              to="/analyze"
              className="btn-3d inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-card sm:w-auto"
            >
              <Play className="h-4 w-4 fill-current" />
              {t('hero.secondary')}
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/80">{t('hero.note')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <LensVisual size={380} />
        </motion.div>
      </div>
    </section>
  );
}