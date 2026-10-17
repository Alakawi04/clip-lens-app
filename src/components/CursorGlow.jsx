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

    const onMove = (e) => {
      if (!pos.active) {
        pos.active = true;
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      node.style.opacity = '1';
    };
    const onLeave = () => {
      pos.active = false;
      node.style.opacity = '0';
    };

    const tick = () => {
      if (pos.active) {
        pos.x += (pos.tx - pos.x) * 0.09;
        pos.y += (pos.ty - pos.y) * 0.09;
        node.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

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
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.07), transparent 65%)',
        willChange: 'transform',
      }}
    />
  );
}