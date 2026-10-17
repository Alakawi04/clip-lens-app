import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

const SELECTOR = '.hover-3d, .hover-3d-sm, .fly-3d, .btn-3d';
const EASE = 0.13;

// Pointer-follow 3D lift for anything with a hover class: while the cursor is
// over an element it leans toward it (rotateX/rotateY from the cursor offset)
// and rises slightly; when the pointer leaves, it glides back smoothly via a
// lerped rAF loop instead of snapping. Decorative only; off for reduced motion.
export default function MagneticHover() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return undefined;

    const items = new Map(); // el -> { rx, ry, lift, sc, trx, try_, tlift, tsc, active }
    let current = null;
    let raf = 0;

    const ensure = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const loop = () => {
      items.forEach((it, el) => {
        it.rx += (it.trx - it.rx) * EASE;
        it.ry += (it.try_ - it.ry) * EASE;
        it.lift += (it.tlift - it.lift) * EASE;
        it.sc += (it.tsc - it.sc) * EASE;
        el.style.transform = `perspective(900px) translateY(${it.lift.toFixed(2)}px) rotateX(${it.rx.toFixed(2)}deg) rotateY(${it.ry.toFixed(2)}deg) scale(${it.sc.toFixed(3)})`;

        const settled =
          !it.active &&
          Math.abs(it.rx) < 0.05 &&
          Math.abs(it.ry) < 0.05 &&
          Math.abs(it.lift) < 0.05 &&
          Math.abs(it.sc - 1) < 0.005;
        if (settled) {
          el.style.transform = '';
          items.delete(el);
        }
      });

      if (items.size) raf = requestAnimationFrame(loop);
      else raf = 0;
    };

    const onMove = (e) => {
      const it = items.get(current);
      if (!it) return;
      const r = current.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      it.try_ = px * 14;
      it.trx = -py * 14;
      it.tlift = -7;
      it.tsc = 1.03;
      ensure();
    };

    const onLeave = (e) => {
      const it = items.get(e.currentTarget);
      if (!it) return;
      it.active = false;
      it.trx = 0;
      it.try_ = 0;
      it.tlift = 0;
      it.tsc = 1;
      ensure();
    };

    const onOver = (e) => {
      const t = e.target.closest ? e.target.closest(SELECTOR) : null;
      if (t === current) return;
      if (current) {
        onLeave({ currentTarget: current });
        current.removeEventListener('mousemove', onMove);
        current.removeEventListener('mouseleave', onLeave);
        current = null;
      }
      if (!t) return;
      current = t;
      if (!items.has(t)) {
        items.set(t, { rx: 0, ry: 0, lift: 0, sc: 1, trx: 0, try_: 0, tlift: 0, tsc: 1, active: true });
      } else {
        items.get(t).active = true;
      }
      t.addEventListener('mousemove', onMove);
      t.addEventListener('mouseleave', onLeave);
      ensure();
    };

    document.addEventListener('mouseover', onOver);
    return () => {
      document.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
      if (current) {
        current.removeEventListener('mousemove', onMove);
        current.removeEventListener('mouseleave', onLeave);
      }
      items.forEach((_it, el) => {
        el.style.transform = '';
      });
    };
  }, [reduce]);

  return null;
}