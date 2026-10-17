import React from 'react';
import { motion } from 'framer-motion';
import { Image, Type, Contrast, Smartphone, Layers } from 'lucide-react';
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
    <div className="space-y-3">
      {items.map((it, i) => {
        const Icon = ICONS[it.key] || Layers;
        return (
          <motion.div
            key={it.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="flex gap-3.5 rounded-2xl border border-border bg-card p-4"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{t(it.title)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(it.description)}</p>
            </div>
            <span className="ms-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
              {i + 1}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}