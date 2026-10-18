import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function Steps() {
  const { t } = useI18n();
  const steps = [
    { icon: Upload, title: t('steps.1.title'), desc: t('steps.1.desc') },
    { icon: Sparkles, title: t('steps.2.title'), desc: t('steps.2.desc') },
    { icon: Check, title: t('steps.3.title'), desc: t('steps.3.desc') },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:snap-start lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="fly-3d font-display text-2xl font-bold tracking-tight sm:text-3xl">{t('steps.title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('steps.subtitle')}</p>
      </div>
      <div className="relative mt-10 grid gap-6 sm:grid-cols-3">
        {/* connector line */}
        <div className="absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="hover-3d-sm relative grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card shadow-soft">
                <Icon className="h-6 w-6 text-primary" />
                <span className="absolute -end-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-bold">{s.title}</h3>
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}