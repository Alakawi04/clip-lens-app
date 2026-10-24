import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Star, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function TitleList({ titles }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(null);
  const recommended = titles.find((item) => item.recommended) || titles[0];
  const alternatives = titles.filter((item) => item !== recommended);

  const copy = async (title, i) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(i);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const TitleRow = ({ item, index, primary = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      className={`relative rounded-2xl border p-4 ${primary ? 'border-primary/30 bg-primary/[0.07]' : 'border-border/70 bg-background/35'}`}
    >
      <div className="flex items-start gap-3 pe-9">
        {primary && <Star className="mt-1 h-4 w-4 shrink-0 fill-primary text-primary" />}
        <p className="font-display text-sm font-bold leading-relaxed sm:text-base">{item.title}</p>
      </div>
      {item.reason && (
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="w-fit cursor-pointer list-none font-medium hover:text-foreground">{t('results.why')}</summary>
          <p className="mt-1.5 leading-relaxed">{item.reason}</p>
        </details>
      )}
      <button
        type="button"
        onClick={() => copy(item.title, index)}
        aria-label={copied === index ? t('common.copied') : t('results.copyTitle')}
        className="absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-card/80 text-muted-foreground transition hover:text-foreground"
      >
        {copied === index ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </motion.div>
  );

  return (
    <div className="space-y-3">
      {recommended && <TitleRow item={recommended} index={0} primary />}
      {alternatives.length > 0 && (
        <details className="rounded-2xl border border-border/70 bg-background/30 p-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <span>{t('results.moreTitles')}</span>
            <ChevronDown className="h-4 w-4" />
          </summary>
          <div className="mt-3 space-y-2.5">
            {alternatives.map((item, index) => <TitleRow key={`${item.title}-${index}`} item={item} index={index + 1} />)}
          </div>
        </details>
      )}
    </div>
  );
}
