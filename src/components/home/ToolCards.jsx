import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Youtube, ArrowRight } from 'lucide-react';
import { Exploded, Plot } from '@lucasmarkes/hairline/react';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';
import { useCredits } from '@/lib/CreditContext';
import ScrollSection from './ScrollSection';
import RevealCard from './RevealCard';
import ScrollTypingText from './ScrollTypingText';
import { useFinePointer } from '@/hooks/use-pointer-capability';

export default function ToolCards() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const { enabled } = useCredits();
  const finePointer = useFinePointer();
  const cards = [
    {
      to: '/analyze',
      icon: Upload,
      title: t('tools.analyze.title'),
      desc: t('tools.analyze.desc'),
      cta: t('tools.analyze.cta'),
      kind: t('steps.1.visual.mp4'),
      creditCost: settings.credits_upload_cost,
      figure: Exploded,
    },
    {
      to: '/analyze?mode=review',
      icon: Youtube,
      title: t('tools.review.title'),
      desc: t('tools.review.desc'),
      cta: t('tools.review.cta'),
      kind: t('steps.1.visual.youtube'),
      creditCost: settings.credits_cost,
      figure: Plot,
    },
  ];

  return (
    <ScrollSection className="tools-showcase mx-auto max-w-[1440px] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
      <header className="tools-showcase-heading home-section-heading home-section-heading--tools">
        <ScrollTypingText as="h2" text={t('tools.title')} />
        <ScrollTypingText as="p" text={t('tools.subtitle')} delay={100} />
      </header>
      <div className="tools-route-grid">
        {cards.map((c, i) => {
          const Icon = c.icon;
          const Figure = c.figure;
          return (
            <RevealCard
              key={c.to}
              delay={i * 0.1}
              variant={i === 0 ? 'glideStart' : 'settle'}
              className={`tools-route-wrap tools-route-wrap-${i + 1}`}
            >
              <Link
                to={c.to}
                className={`tools-pathway group tools-pathway-${i + 1} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              >
                <div className="tools-pathway-topline">
                  <span className="tools-pathway-icon"><Icon aria-hidden="true" /></span>
                  <div className="tools-pathway-meta">
                    <span className="tools-pathway-kind"><b>0{i + 1}</b>{c.kind}</span>
                    {enabled && <span className="tools-pathway-cost">{c.creditCost} {Number(c.creditCost) === 1 ? t('pricing.credit') : t('pricing.credits')}</span>}
                  </div>
                </div>
                {finePointer && <div className={`tools-pathway-figure tools-pathway-figure-${i + 1}`} aria-hidden="true">
                  <Figure intensity={0.38} theme="auto" />
                </div>}
                <div className="tools-pathway-copy">
                  <ScrollTypingText as="h3" text={c.title} delay={40} />
                  <ScrollTypingText as="p" text={c.desc} delay={100} />
                </div>
                <span className="tools-pathway-action"><b>{c.cta}</b><i><ArrowRight className="h-4 w-4 rtl:rotate-180" /></i></span>
              </Link>
            </RevealCard>
          );
        })}
      </div>
    </ScrollSection>
  );
}
