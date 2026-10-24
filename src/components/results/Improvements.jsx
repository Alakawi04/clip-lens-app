import React from 'react';
import { motion } from 'framer-motion';
import { Image, Type, Contrast, Smartphone, Layers, ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const ICONS = {
  subject: Image,
  text: Type,
  contrast: Contrast,
  mobile: Smartphone,
  consistency: Layers,
};

export default function Improvements({ items }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        const Icon = ICONS[it.key] || Layers;
        return (
          <motion.div
            key={it.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="rounded-2xl border border-border/70 bg-background/30 px-3.5 py-3"
          >
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{it.title.startsWith('improve.') ? t(it.title) : it.title}</span>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </summary>
              <p className="ms-11 mt-2 text-sm leading-relaxed text-muted-foreground">{t(it.description)}</p>
            </details>
          </motion.div>
        );
      })}
    </div>
  );
}
