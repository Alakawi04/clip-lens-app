import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Star } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function TitleList({ titles }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(null);

  const copy = async (title, i) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(i);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-3">
      {titles.map((s, i) => {
        const isRec = s.recommended;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
              isRec
                ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            {isRec && (
              <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-soft">
                <Star className="h-3 w-3 fill-current" />
                {t('common.recommended')}
              </span>
            )}
            <div className="flex items-start gap-3 pe-20">
              <p className={`font-display ${isRec ? 'text-lg font-bold' : 'text-base font-semibold'} leading-snug`}>
                {s.title}
              </p>
            </div>
            {s.reason && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">{t('results.why')}:</span>{' '}
                {s.reason}
              </p>
            )}
            <button
              type="button"
              onClick={() => copy(s.title, i)}
              className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-all hover:bg-secondary active:scale-95"
            >
              {copied === i ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === i ? t('common.copied') : t('results.copyTitle')}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}