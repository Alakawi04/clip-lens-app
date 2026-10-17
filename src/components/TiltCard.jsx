import React, { useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// Pointer-reactive 3D tilt wrapper with a soft iOS-style glare.
export default function TiltCard({ children, className = '', intensity = 12 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [s, setS] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  const onMove = (e) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setS({ rx: (0.5 - py) * intensity, ry: (px - 0.5) * intensity, gx: px * 100, gy: py * 100, active: true });
  };

  const onLeave = () => setS({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`perspective ${className}`}>
      <div
        className="preserve-3d relative rounded-3xl transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: `perspective(1000px) rotateX(${s.rx}deg) rotateY(${s.ry}deg) scale(${s.active ? 1.03 : 1}) translateZ(${s.active ? 26 : 0}px)`,
          boxShadow: s.active
            ? '0 36px 64px -28px hsl(0 0% 0% / 0.8), 0 0 0 1px hsl(var(--primary) / 0.35), 0 0 44px -14px hsl(var(--primary) / 0.5)'
            : 'none',
        }}
      >
        {children}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
          style={{
            opacity: s.active ? 1 : 0,
            background: `radial-gradient(320px circle at ${s.gx}% ${s.gy}%, hsl(var(--primary) / 0.22), transparent 60%)`,
          }}
        />
      </div>
    </div>
  );
}