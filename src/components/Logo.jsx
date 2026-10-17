import React from 'react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

// Brand logo — driven by the admin dashboard (name + optional logo image).
export default function Logo({ className = 'h-9 w-9' }) {
  const { settings } = useSiteSettings();
  const brand = settings.brand_name || 'ClipLens';

  if (settings.logo_image_url) {
    return (
      <span className="inline-flex select-none items-center" aria-label={brand}>
        <Image src={settings.logo_image_url} alt={brand} className="h-9 w-auto max-w-[11rem] object-contain" />
      </span>
    );
  }

  const mid = Math.ceil(brand.length / 2);
  const head = brand.slice(0, mid);
  const tail = brand.slice(mid);

  return (
    <span className="inline-flex select-none items-center gap-2.5" aria-label={brand}>
      <span className={`relative ${className} grid place-items-center rounded-2xl brand-gradient shadow-soft`}>
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2 text-white" aria-hidden="true">
          <circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="2" />
          <circle cx="11" cy="11" r="2.4" fill="currentColor" />
          <path d="M16.5 16.5L20 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-white/90 shadow" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">
        {head}
        <span className="brand-text">{tail}</span>
      </span>
    </span>
  );
}