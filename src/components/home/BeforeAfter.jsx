import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';

export default function BeforeAfter() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{t('preview.title')}</h2>
          <p className="mt-2 text-muted-foreground">{t('preview.subtitle')}</p>
        </div>
        <div className="mt-8 grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-border shadow-soft"
          >
            <div className="relative aspect-video bg-muted">
              <Image
                src={settings.before_image_url}
                alt=""
                className="h-full w-full object-cover opacity-80 grayscale"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-3 start-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                my video vlog 2024
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">{t('preview.before')}</span>
              <span className="text-sm font-bold text-red-500">42</span>
            </div>
          </motion.div>

          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-primary shadow-soft">
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-primary/30 shadow-float ring-1 ring-primary/20"
          >
            <div className="relative aspect-video">
              <Image
                src={settings.after_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 start-3 max-w-[80%] rounded-lg bg-primary px-2.5 py-1.5 text-sm font-extrabold text-white shadow-soft">
                I Tried This For 30 Days
              </div>
              <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-primary shadow-soft backdrop-blur">
                <TrendingUp className="h-3 w-3" />
                {t('preview.tag')}
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-medium text-muted-foreground">{t('preview.after')}</span>
              <span className="text-sm font-bold text-emerald-500">87</span>
            </div>
          </motion.div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <span className="font-semibold text-emerald-500">+45</span> · {t('preview.improvedScore')}
        </p>
      </div>
    </section>
  );
}