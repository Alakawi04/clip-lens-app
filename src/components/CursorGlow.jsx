import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// A soft brand-tinted spotlight that trails the cursor through the ambient
// layer — light passing through the lens. Deliberately faint, and desktop
// pointers only.
export default function CursorGlow() {
  const reduce = useReducedMotion();
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (reduce || !node) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const pos = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2,
      active: false,
    };
    let raf = 0;

    const tick = () => {
      const dx = pos.tx - pos.x;
      const dy = pos.ty - pos.y;
      if (!pos.active || (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2)) {
        pos.x = pos.tx;
        pos.y = pos.ty;
        node.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
        raf = 0;
        return;
      }

      pos.x += dx * 0.16;
      pos.y += dy * 0.16;
      node.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      if (!pos.active) {
        pos.active = true;
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      node.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      pos.active = false;
      node.style.opacity = '0';
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-0 h-[38rem] w-[38rem] rounded-full opacity-0 transition-opacity duration-700"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.025), transparent 65%)',
        willChange: 'transform',
      }}
    />
  );
}
