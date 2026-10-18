import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';

const SCORES = [91, 86, 88, 82, 90, 84];

export default function SampleThumbnails() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const images = (settings.gallery_images || []).slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:snap-start lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {t('gallery.tag')}
        </span>
        <h2 className="fly-3d mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">{t('gallery.title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('gallery.subtitle')}</p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
          >
            <TiltCard intensity={8} className="group">
              <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow duration-700 group-hover:shadow-float">
                <Image
                  src={src}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 ease-out sm:group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-primary shadow-soft backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  {t('gallery.tag')}
                </span>
                <span className="absolute bottom-3 end-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                  {t('gallery.score')} {SCORES[i % SCORES.length]}
                </span>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}