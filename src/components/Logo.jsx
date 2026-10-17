import React from 'react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

// Brand logo — driven by the admin dashboard (name + optional logo image).
export default function Logo({ className = 'h-10 w-10' }) {
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
      <span
        className={`relative ${className} grid place-items-center rounded-2xl brand-gradient shadow-[0_10px_28px_-6px] shadow-primary/60 ring-1 ring-white/25 transition-transform duration-300 hover:-translate-y-1 hover:rotate-3 hover:scale-105`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2 text-white drop-shadow" aria-hidden="true">
          <circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="2" />
          <circle cx="11" cy="11" r="2.4" fill="currentColor" />
          <path d="M16.5 16.5L20 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px] shadow-white/80" />
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight">
        {head}
        <span className="brand-text">{tail}</span>
      </span>
    </span>
  );
}