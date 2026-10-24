import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

const ParticleField = lazy(() => import('./ParticleField'));
const CursorGlow = lazy(() => import('./CursorGlow'));

// Site-wide ambient background: a deep, near-black studio wash, a subtle
// pointer-aware neural mesh and a fine film-grain texture
// and a grounding vignette. Everything here is intentionally dim so page
// content stays the brightest thing on screen.
export default function AmbientBackground() {
  const { settings } = useSiteSettings();
  const [effectsReady, setEffectsReady] = useState(false);
  const [desktopEffects, setDesktopEffects] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    const sync = () => setDesktopEffects(query.matches);
    sync();
    if (query.addEventListener) query.addEventListener('change', sync);
    else query.addListener(sync);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', sync);
      else query.removeListener(sync);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let idleId;
    const start = () => setEffectsReady(true);

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(start, { timeout: 900 });
    } else {
      timeoutId = window.setTimeout(start, 250);
    }

    return () => {
      if (idleId) window.cancelIdleCallback?.(idleId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-studio" />

      <div className="absolute inset-0 bg-vignette" />

      {effectsReady && desktopEffects && (
        <Suspense fallback={null}>
          <div className="absolute inset-0 bg-grain opacity-[0.035]" />
          <CursorGlow />
          {settings.particles_style !== 'none' && (
          <ParticleField count={settings.particle_count} size={settings.particle_size} />
          )}
        </Suspense>
      )}
    </div>
  );
}
