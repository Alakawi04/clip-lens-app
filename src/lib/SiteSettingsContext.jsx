import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { backend, isSupabaseConfigured } from '@/api/supabaseClient';
import { applySiteFonts } from '@/lib/siteFonts';

const LEGACY_DEFAULT_LOGOS = new Set([
  'https://6ad73690824d5e0dba9e87a3.imgix.net/cliplens_logo_icon_clean_large-removebg-preview.png',
  '/cliplens-logo.png',
  '/cliplens-logo.svg',
]);

// Defaults used when the admin has not overridden a value yet.
const SITE_DEFAULTS = {
  brand_name: 'ClipLens',
  logo_image_url: '/cliplens-logo.png',
  accent_color: '#FF0000',
  particles_style: 'neural',
  particle_count: 120,
  particle_size: 1.55,
  hero_image_url: 'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/Edit_thumbnail_text_and_elements_2K_20261018001924.jpg',
  hero_images: [
    'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/Edit_thumbnail_text_and_elements_2K_20261018001924.jpg',
    'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/clip_lens_style_01_cinematic.png',
    'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/clip_lens_style_03_tech.png',
    'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/clip_lens_style_10_digital.png',
  ],
  tool_analyze_image_url: 'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/AI_video_analysis_website_icon_2K_20261018003923.jpg',
  tool_review_image_url: 'https://6ad73690824d5e0dba9e87a3.imgix.net/Change_color_theme_2K_20261018004212.jpg',
  before_image_url: 'https://6ad73690824d5e0dba9e87a3.imgix.net/Creating_silhouette_thumbnail_image_2K_20261018003546.jpg',
  after_image_url: 'https://6ad73690824d5e0dba9e87a3.imgix.net/clip_lens_content_03_trending_text.png',
  gallery_images: [
    'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/Edit_thumbnail_text_and_elements_2K_20261018001924.jpg',
    'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/clip_lens_style_01_cinematic.png',
    'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/clip_lens_style_10_digital.png',
    'https://6ad73690824d5e0dba9e87a3.imgix.net/sandbox/clip_lens_style_03_tech.png',
    'https://6ad73690824d5e0dba9e87a3.imgix.net/clip_lens_style_07_comic.png',
    'https://6ad73690824d5e0dba9e87a3.imgix.net/Creating_YouTube_thumbnails_2K_20261018002234.jpg',
  ],
  // Admin text overrides, keyed "<lang>.<i18n key>".
  texts: {},
  // Credit & subscription defaults.
  credits_enabled: true,
  credits_cost: 1,
  credits_upload_cost: 2,
  credits_signup: 3,
  credits_pro_price: 20,
  credits_pro_amount: 200,
};

const SiteSettingsContext = createContext(null);

// "#FF0000" -> "0 100% 50%" (the channel format our CSS tokens expect).
function hexToHslChannels(hex) {
  if (!hex) return null;
  let h = String(hex).replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let hh = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) hh = ((g - b) / d) % 6;
    else if (max === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
    hh *= 60;
    if (hh < 0) hh += 360;
  }
  return `${Math.round(hh)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Applies an accent color to the live design tokens.
export function applyAccentColor(hex) {
  const channels = hexToHslChannels(hex);
  if (!channels || typeof document === 'undefined') return;
  const root = document.documentElement;
  ['--primary', '--ring', '--brand', '--glow', '--chart-1'].forEach((token) => {
    root.style.setProperty(token, channels);
  });
}

export function saveSiteThemePreference(theme) {
  if (theme !== 'dark' && theme !== 'light') return;
  try { window.localStorage.setItem('clip-lens-site-theme', theme); } catch { /* Storage may be disabled. */ }
  if (typeof document !== 'undefined') document.documentElement.dataset.siteTheme = theme;
}

// Record values win; empty/blank values fall back to the defaults.
function mergeWithDefaults(record) {
  const out = { ...SITE_DEFAULTS };
  if (!record) return out;
  Object.keys(SITE_DEFAULTS).forEach((key) => {
    const savedValue = record[key];
    const value = key === 'logo_image_url' && LEGACY_DEFAULT_LOGOS.has(savedValue)
      ? SITE_DEFAULTS.logo_image_url
      : savedValue;
    const filled = Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== '';
    if (filled) out[key] = value;
  });
  return out;
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(SITE_DEFAULTS);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSettings(SITE_DEFAULTS);
      setLoading(false);
      return;
    }
    try {
      const page = await backend.data.SiteSettings.filter({}, { sort: '-updated_date', limit: 1 });
      const record = page.items?.[0] || null;
      setRecordId(record?.id || null);
      setSettings(mergeWithDefaults(record));
    } catch (error) {
      console.error('Failed to load site settings:', error);
      setSettings(SITE_DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { applyAccentColor(settings.accent_color); }, [settings.accent_color]);
  useEffect(() => { applySiteFonts(settings.texts?.__appearance); }, [settings.texts]);

  const save = useCallback(async (patch) => {
    if (recordId) {
      await backend.data.SiteSettings.update(recordId, patch);
    } else {
      const created = await backend.data.SiteSettings.create({ ...SITE_DEFAULTS, ...patch });
      if (!created) throw new Error('Site settings were saved but no record was returned.');
      setRecordId(created.id);
    }
    await load();
  }, [recordId, load]);

  const value = useMemo(
    () => ({ settings, loading, recordId, refresh: load, save }),
    [settings, loading, recordId, load, save]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}

// Safe variant for providers that may render outside the settings tree.
export function useOptionalSiteSettings() {
  return useContext(SiteSettingsContext);
}
