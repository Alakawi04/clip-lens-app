import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Soft curtain shown while the language (and page direction) swaps.
export default function LanguageTransition() {
  const { switching, t } = useI18n();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {switching && (
        <motion.div
          key="language-transition"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[120] grid place-items-center bg-background/85 backdrop-blur-2xl"
        >
          <div className="flex flex-col items-center gap-5">
            <div className="relative grid h-20 w-20 place-items-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={reduce ? {} : { scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="absolute inset-0 rounded-full border border-primary/25" />
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
                animate={reduce ? {} : { rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              />
              <motion.span
                className="absolute inset-2 rounded-full border-2 border-transparent border-b-primary/50"
                animate={reduce ? {} : { rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <Languages className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">{t('lang.switching')}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}