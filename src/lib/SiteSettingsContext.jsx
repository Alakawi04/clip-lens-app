import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Defaults used when the admin has not overridden a value yet.
export const SITE_DEFAULTS = {
  brand_name: 'ClipLens',
  logo_image_url: '',
  accent_color: '#FF0000',
  hero_image_url: 'https://images.unsplash.com/photo-1493612276216-ee392551f8a4?auto=format&fit=crop&w=900&q=80',
  tool_analyze_image_url: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=900&q=80',
  tool_review_image_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=900&q=80',
  before_image_url: 'https://images.unsplash.com/photo-1493612276216-ee392551f8a4?auto=format&fit=crop&w=900&q=70',
  after_image_url: 'https://images.unsplash.com/photo-1598899134739-24c46f8b8f23?auto=format&fit=crop&w=900&q=80',
  gallery_images: [
    'https://images.unsplash.com/photo-1598899134739-24c46f8b8f23?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1596704017254-930121d89203?auto=format&fit=crop&w=1280&q=80',
    'https://images.unsplash.com/photo-1493612276216-ee392551f8a4?auto=format&fit=crop&w=1280&q=80',
  ],
  // Admin text overrides, keyed "<lang>.<i18n key>".
  texts: {},
};

const SiteSettingsContext = createContext(null);

// "#FF0000" -> "0 100% 50%" (the channel format our CSS tokens expect).
export function hexToHslChannels(hex) {
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

// Record values win; empty/blank values fall back to the defaults.
function mergeWithDefaults(record) {
  const out = { ...SITE_DEFAULTS };
  if (!record) return out;
  Object.keys(SITE_DEFAULTS).forEach((key) => {
    const value = record[key];
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
    try {
      const page = await base44.entities.SiteSettings.filter({}, { sort: '-updated_date', limit: 1 });
      const record = page.items?.[0] || null;
      setRecordId(record?.id || null);
      setSettings(mergeWithDefaults(record));
    } catch {
      setSettings(SITE_DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { applyAccentColor(settings.accent_color); }, [settings.accent_color]);

  const save = useCallback(async (patch) => {
    if (recordId) {
      await base44.entities.SiteSettings.update(recordId, patch);
    } else {
      const created = await base44.entities.SiteSettings.create({ ...SITE_DEFAULTS, ...patch });
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