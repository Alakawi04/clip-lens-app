import React from 'react';
import BackgroundLogo3D from './BackgroundLogo3D';
import ParticleField from './ParticleField';
import CursorGlow from './CursorGlow';

// Site-wide ambient background: a deep, near-black studio wash, one slow brand
// halo, drifting motes, a fine film-grain texture and a grounding vignette.
// Everything here is intentionally dim so page content stays the brightest
// thing on screen.
export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-studio" />

      {/* single slow halo — the only moving light in the room */}
      <div className="absolute left-1/2 top-[-24%] h-[42rem] w-[42rem] rounded-full bg-primary/[0.08] blur-[170px] animate-drift-a" />

      <CursorGlow />

      <div className="absolute inset-0 bg-grain opacity-[0.05]" />
      <div className="absolute inset-0 bg-vignette" />

      <ParticleField />

      <BackgroundLogo3D />
    </div>
  );
}