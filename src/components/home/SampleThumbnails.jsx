import React, { useMemo } from 'react';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';
import ThumbnailShowcaseScene from './ThumbnailShowcaseScene';

export default function SampleThumbnails() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const images = useMemo(() => {
    if (!Array.isArray(settings.gallery_images)) return [];
    return [...new Set(settings.gallery_images
      .filter((image) => typeof image === 'string' && image.trim())
      .map((image) => image.trim()))].slice(0, 6);
  }, [settings.gallery_images]);

  if (!images.length) return null;

  return (
    <section className="gallery-showcase-scroll-shell" aria-label={t('gallery.title')}>
      <ThumbnailShowcaseScene images={images} />
    </section>
  );
}
