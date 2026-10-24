import React, { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Loupe } from '@lucasmarkes/hairline/react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';
import ScrollSection from './ScrollSection';
import RevealCard from './RevealCard';
import ScrollTypingText from './ScrollTypingText';
import { useFinePointer } from '@/hooks/use-pointer-capability';

export default function BeforeAfter() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const [split, setSplit] = useState(50);
  const finePointer = useFinePointer();

  return (
    <ScrollSection id="before-after" className="compare-showcase mx-auto max-w-[1400px] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
      <header className="compare-heading home-section-heading home-section-heading--compare">
        <ScrollTypingText as="h2" text={t('preview.title')} />
        <ScrollTypingText as="p" text={t('preview.subtitle')} delay={100} />
      </header>

      <RevealCard variant="unfold" className="compare-reveal">
        <div className="compare-stage" dir="ltr" style={{ '--compare-split': `${split}%` }}>
          <Image src={settings.before_image_url} alt="" className="compare-image compare-image-before" />
          <div className="compare-after-layer"><Image src={settings.after_image_url} alt="" className="compare-image" /></div>
          <span className="compare-label compare-label-before">{t('preview.before')}</span>
          <span className="compare-label compare-label-after">{t('preview.after')}</span>
          <div className="compare-divider" style={{ left: `${split}%` }} aria-hidden="true"><span><ArrowLeftRight className="h-4 w-4" /></span></div>
          <input
            className="compare-slider"
            type="range"
            min="5"
            max="95"
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
            aria-label={`${t('preview.before')} / ${t('preview.after')}`}
          />
        </div>
      </RevealCard>
      <div className="compare-caption">
        {finePointer && <div className="compare-caption-figure" aria-hidden="true"><Loupe intensity={0.28} theme="auto" /></div>}
        <span><i />{t('preview.tag')}</span>
        <ScrollTypingText as="p" text={t('preview.improvedScore')} />
      </div>
    </ScrollSection>
  );
}
