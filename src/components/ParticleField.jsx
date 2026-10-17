import React, { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Youtube, ThumbsUp, Eye } from 'lucide-react';

const POINTER_RADIUS = 230; // px — how far a mote feels the cursor
const POINTER_PUSH = 120; // px — strongest nudge, right at the cursor
const LEAN_X = 110;
const LEAN_Y = 80;

const KIND_MIX = ['dot', 'youtube', 'like', 'views', 'dot'];

function kindFor(index, variant, imageUrl) {
  if (variant === 'youtube') return 'youtube';
  if (variant === 'like') return 'like';
  if (variant === 'views') return 'views';
  if (variant === 'custom') return imageUrl ? 'custom' : 'dot';
  if (variant === 'mixed') return KIND_MIX[index % KIND_MIX.length];
  return 'dot';
}

function makeMotes(variant, imageUrl) {
  const baseCount = variant === 'mixed' ? 20 : variant === 'dots' || variant === 'custom' ? 26 : 14;
  return Array.from({ length: baseCount }, (_, id) => {
    const kind = kindFor(id, variant, imageUrl);
    const icon = kind !== 'dot';
    return {
      id,
      kind,
      x: Math.random(),
      size: icon ? 12 + Math.random() * 12 : 2 + Math.random() * 4,
      speed: icon ? 0.008 + Math.random() * 0.016 : 0.012 + Math.random() * 0.022,
      sway: icon ? 24 + Math.random() * 60 : 18 + Math.random() * 70,
      seed: Math.random() * Math.PI * 2,
      depth: 0.35 + Math.random() * 0.65,
      opacity: icon ? 0.1 + Math.random() * 0.18 : 0.14 + Math.random() * 0.3,
      twinkle: 0.6 + Math.random() * 1.4,
      phase: Math.random(),
      spin: icon ? Math.random() * 44 - 22 : 0,
      warm: Math.random() > 0.5,
    };
  });
}

// Slow motes drifting up through the page, like dust caught in a lens. The
// shape comes from the admin dashboard: dots, YouTube / like / views icons, a
// mix of all of them, or a custom uploaded image. Positions are driven per
// frame so the field leans with the pointer and parts gently around it.
// Decorative only, and switched off entirely for reduced motion.
export default function ParticleField({ variant = 'dots', imageUrl }) {
  const reduce = useReducedMotion();
  const motes = useMemo(() => makeMotes(variant, imageUrl), [variant, imageUrl]);
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
        pointer.x += (pointer.tx - pointer.x) * 0.1;
        pointer.y += (pointer.ty - pointer.y) * 0.1;
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
        x += leanX * LEAN_X * m.depth;
        y += leanY * LEAN_Y * m.depth;

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

        el.style.transform =
          `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` +
          (m.spin ? ` rotate(${(t * m.spin).toFixed(1)}deg)` : '');
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
      {motes.map((m) =>
        m.kind === 'dot' ? (
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
        ) : (
          <span
            key={m.id}
            className="mote grid place-items-center"
            style={{
              width: m.size,
              height: m.size,
              filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))',
            }}
          >
            {m.kind === 'youtube' && <Youtube className="h-full w-full text-primary" />}
            {m.kind === 'like' && <ThumbsUp className="h-full w-full text-primary" />}
            {m.kind === 'views' && <Eye className="h-full w-full text-primary" />}
            {m.kind === 'custom' && (
              <img src={imageUrl} alt="" className="h-full w-full object-contain" />
            )}
          </span>
        )
      )}
    </div>
  );
}