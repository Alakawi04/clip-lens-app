import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Youtube, ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';

export default function ToolCards() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const cards = [
    {
      to: '/analyze',
      icon: Upload,
      title: t('tools.analyze.title'),
      desc: t('tools.analyze.desc'),
      cta: t('tools.analyze.cta'),
      image: settings.tool_analyze_image_url,
    },
    {
      to: '/analyze?mode=review',
      icon: Youtube,
      title: t('tools.review.title'),
      desc: t('tools.review.desc'),
      cta: t('tools.review.cta'),
      image: settings.tool_review_image_url,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:snap-start lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="fly-3d font-display text-2xl font-bold tracking-tight sm:text-3xl">{t('tools.title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('tools.subtitle')}</p>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.to}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                to={c.to}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={c.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 sm:group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute start-4 top-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-primary shadow-float backdrop-blur">
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="font-display text-xl font-bold">{c.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {c.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}