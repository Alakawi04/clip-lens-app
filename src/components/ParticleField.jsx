import React, { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

const COUNT = 26;
const POINTER_RADIUS = 190; // px — how far a mote feels the cursor
const POINTER_PUSH = 92; // px — strongest nudge, right at the cursor

// Slow motes drifting up through the page, like dust caught in a lens. Their
// positions are driven per frame so the field leans with the pointer and parts
// gently around it. Decorative only, and switched off entirely for people who
// prefer reduced motion.
function makeMotes(count) {
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: Math.random(),
    size: 2 + Math.random() * 4,
    speed: 0.012 + Math.random() * 0.022,
    sway: 18 + Math.random() * 70,
    seed: Math.random() * Math.PI * 2,
    depth: 0.35 + Math.random() * 0.65,
    opacity: 0.14 + Math.random() * 0.3,
    twinkle: 0.6 + Math.random() * 1.4,
    phase: Math.random(),
    warm: Math.random() > 0.5,
  }));
}

export default function ParticleField({ count = COUNT }) {
  const reduce = useReducedMotion();
  const motes = useMemo(() => makeMotes(count), [count]);
  const layer = useRef(null);

  useEffect(() => {
    const node = layer.current;
    if (reduce || !node) return;

    const nodes = Array.from(node.children);
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let raf = 0;
    const start = performance.now();

    const onResize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
    };
    const onMove = (e) => {
      if (!pointer.active) {
        pointer.active = true;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    const tick = (now) => {
      const t = (now - start) / 1000;

      if (pointer.active) {
        pointer.x += (pointer.tx - pointer.x) * 0.08;
        pointer.y += (pointer.ty - pointer.y) * 0.08;
      }
      const leanX = pointer.active ? pointer.x / vw - 0.5 : 0;
      const leanY = pointer.active ? pointer.y / vh - 0.5 : 0;

      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const el = nodes[i];
        if (!el) continue;

        const life = (t * m.speed + m.phase) % 1;
        let x = m.x * vw + Math.sin(life * Math.PI * 2 + m.seed) * m.sway;
        let y = vh + 60 - life * (vh + 200);

        // the whole field leans with the cursor, deeper motes leaning more
        x += leanX * 64 * m.depth;
        y += leanY * 46 * m.depth;

        // and parts softly around it
        if (pointer.active) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < POINTER_RADIUS) {
            const falloff = 1 - dist / POINTER_RADIUS;
            const push = falloff * falloff * POINTER_PUSH;
            const inv = dist || 1;
            x += (dx / inv) * push;
            y += (dy / inv) * push;
          }
        }

        const fade = Math.min(1, life / 0.12) * Math.min(1, (1 - life) / 0.16);
        const twinkle = 0.62 + 0.38 * Math.sin(t * m.twinkle + m.seed * 3);

        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        el.style.opacity = (fade * m.opacity * twinkle).toFixed(3);
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [motes, reduce]);

  if (reduce) return null;

  return (
    <div ref={layer} className="absolute inset-0 overflow-hidden">
      {motes.map((m) => (
        <span
          key={m.id}
          className={`mote ${m.warm ? 'bg-primary' : 'bg-foreground'}`}
          style={{
            width: m.size,
            height: m.size,
            boxShadow: m.warm
              ? '0 0 10px 2px hsl(var(--primary) / 0.45)'
              : '0 0 8px 1px hsl(var(--foreground) / 0.18)',
          }}
        />
      ))}
    </div>
  );
}