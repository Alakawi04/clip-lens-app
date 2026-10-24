import React from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

// Brand logo — driven by the admin dashboard (name + optional logo image).
export default function Logo({ className = 'h-10 w-10', showName = true, nameClassName = '', nameStyle }) {
  const { settings } = useSiteSettings();
  const brand = settings.brand_name || 'ClipLens';
  const logoImage = settings.logo_image_url || '/cliplens-logo.png';
  const mid = Math.ceil(brand.length / 2);
  const head = brand.slice(0, mid);
  const tail = brand.slice(mid);
  const textDirection = /[A-Za-z]/.test(brand) ? 'ltr' : undefined;

  return (
    <span className="inline-flex select-none items-center gap-2.5" aria-label={brand}>
      <Image src={logoImage} alt={brand} className={`${className} object-contain`} />
      {showName && (
        <motion.span
          dir={textDirection}
          className={`max-w-full overflow-hidden whitespace-nowrap font-display text-2xl font-extrabold tracking-tight ${nameClassName}`}
          style={{ ...(textDirection ? { unicodeBidi: 'isolate' } : {}), ...nameStyle }}
        >
          {head}
          <span className="brand-text">{tail}</span>
        </motion.span>
      )}
    </span>
  );
}
