import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useInView, useReducedMotion, useMotionValue, useSpring } from 'framer-motion';
import { Sparkles, BarChart3, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';



const FALLBACKS = [
  'https://images.unsplash.com/photo-1493612276216-ee392551f8a4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522199755835-a69bdb78cb1e?auto=format&fit=crop&w=900&q=80',
];

// Original layered stack: the featured card stays forward while its companions recede.
const SLOTS = [
  { x: 0, y: 0, z: 130, r: 0, rx: 0, ry: 0, s: 1, o: 1 },
  { x: -16, y: 13, z: -50, r: -9, rx: 0, ry: 0, s: 0.95, o: 0.96 },
  { x: 15, y: 27, z: -210, r: 11, rx: 0, ry: 0, s: 0.9, o: 0.92 },
  { x: -7, y: 42, z: -370, r: -8, rx: 0, ry: 0, s: 0.86, o: 0.88 },
];
// Original hover fan spreads only the supporting cards around the featured one.
const HOVER_SLOTS = [
  { x: 0, y: 0, z: 130, r: 0, rx: 0, ry: 0 },
  { x: -46, y: -64, z: 22, r: -16, rx: 0, ry: 0 },
  { x: 52, y: 18, z: -55, r: 15, rx: 0, ry: 0 },
  { x: -6, y: 78, z: -125, r: 8, rx: 0, ry: 0 },
];
const SPRING = { type: 'spring', stiffness: 170, damping: 20, opacity: { duration: 0.35 } };
const SPREAD_SPRING = { type: 'spring', stiffness: 210, damping: 28, mass: 0.8, overshootClamping: true, opacity: { duration: 0.25 } };
const POINTER_SPRING = { stiffness: 265, damping: 22, mass: 0.72 };
const CYCLE_TRANSITION = { type: 'tween', duration: 1.15, ease: [0.22, 1, 0.36, 1] };

// A lens-inspired card deck changes its featured image every four seconds.
// Cycling pauses during interaction, zoom, offscreen use, and reduced motion.
export default function LensVisual({ className = '', size = 360 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const isInView = useInView(ref, { amount: 0.2 });
  const { settings } = useSiteSettings();
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [zoomed, setZoomed] = useState(null);
  const [order, setOrder] = useState([0, 1, 2, 3]);
  const [cycleMotion, setCycleMotion] = useState({ id: 0, byImage: {} });
  const orderRef = useRef([0, 1, 2, 3]);

  // Tilt runs through soft springs so it eases out slowly when the pointer leaves.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rx = useSpring(tiltX, POINTER_SPRING);
  const ry = useSpring(tiltY, POINTER_SPRING);

  const images = useMemo(() => {
    const raw = settings.hero_images?.length
      ? settings.hero_images.filter(Boolean)
      : [settings.hero_image_url, ...(settings.gallery_images || [])].filter(Boolean);
    const uniq = [...new Set(raw)];
    for (const fallback of FALLBACKS) {
      if (uniq.length >= 4) break;
      if (!uniq.includes(fallback)) uniq.push(fallback);
    }
    return uniq.slice(0, 4);
  }, [settings.hero_images, settings.hero_image_url, settings.gallery_images]);

  useEffect(() => {
    const nextOrder = images.map((_, i) => i);
    orderRef.current = nextOrder;
    setOrder(nextOrder);
  }, [images]);

  useEffect(() => {
    if (reduce || !isInView || hovered || zoomed !== null || images.length < 2) return undefined;

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const current = orderRef.current;
      const next = [...current.slice(1), current[0]];
      const byImage = Object.fromEntries(next.map((imgIndex, nextPosition) => {
        const previousPosition = current.indexOf(imgIndex);
        const dx = SLOTS[nextPosition].x - SLOTS[previousPosition].x;
        const dy = (SLOTS[nextPosition].y - SLOTS[previousPosition].y) * (9 / 16);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) - SLOTS[nextPosition].r;
        const strength = Math.min(1, Math.hypot(dx, dy) / 90);
        return [imgIndex, { x: Math.sign(dx), y: Math.sign(dy), angle, strength }];
      }));
      orderRef.current = next;
      setCycleMotion((motion) => ({ id: motion.id + 1, byImage }));
      setOrder(next);
    }, 4000);

    return () => window.clearInterval(id);
  }, [images.length, hovered, isInView, reduce, zoomed]);

  const onMove = (e) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltX.set(py * -34);
    tiltY.set(px * 44);
    el.style.setProperty('--lens-light-x', `${(px + 0.5) * 100}%`);
    el.style.setProperty('--lens-light-y', `${(py + 0.5) * 100}%`);
  };

  const setCardLight = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    e.currentTarget.style.setProperty('--lens-light-x', `${x}%`);
    e.currentTarget.style.setProperty('--lens-light-y', `${y}%`);
  };

  const targetFor = (pos) => {
    const p = SLOTS[Math.min(pos, SLOTS.length - 1)];
    const h = hovered && pos > 0 ? HOVER_SLOTS[Math.min(pos, HOVER_SLOTS.length - 1)] : null;
    return {
      x: `${-50 + (h ? h.x : p.x)}%`,
      y: `${-50 + (h ? h.y : p.y)}%`,
      z: h ? h.z : p.z,
      rotate: h ? h.r : p.r,
      rotateX: h ? h.rx : p.rx,
      rotateY: h ? h.ry : p.ry,
      scale: h?.s ?? p.s,
      opacity: p.o,
    };
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        tiltX.set(0);
        tiltY.set(0);
        ref.current?.style.setProperty('--lens-light-x', '50%');
        ref.current?.style.setProperty('--lens-light-y', '28%');
        setHoveredCard(null);
        setHovered(false);
      }}
      className={`lens-visual perspective select-none aspect-square w-full ${className}`}
      style={{ maxWidth: size, perspective: '1150px' }}
    >
      <motion.div className="preserve-3d h-full w-full" style={{ rotateX: rx, rotateY: ry }}>
        <motion.div
          className="preserve-3d relative h-full w-full"
          animate={reduce || !isInView ? { y: 0 } : { y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Glow base */}
          <div className="absolute inset-0 -z-10 grid place-items-center">
            <div className="h-3/4 w-3/4 rounded-full bg-primary/[0.07] blur-3xl" />
          </div>

          {/* Card deck */}
          {order.map((imgIndex, pos) => {
            const isFront = pos === 0;
            const hasOrbitLight = pos === 0;
            const movement = cycleMotion.byImage[imgIndex];
            return (
              <motion.div
                key={imgIndex}
                onClick={() => setZoomed(imgIndex)}
                onMouseEnter={(e) => {
                  setHoveredCard(imgIndex);
                  setCardLight(e);
                }}
                onMouseMove={setCardLight}
                onMouseLeave={() => setHoveredCard(null)}
                className={`lens-card-shell preserve-3d absolute left-1/2 top-1/2 aspect-video w-[80%] cursor-pointer ${hoveredCard === imgIndex ? 'lens-card-shell--active' : ''}`}
                initial={false}
                animate={targetFor(pos)}
                transition={hovered ? SPREAD_SPRING : { ...CYCLE_TRANSITION, delay: pos * 0.045 }}
                style={{ transformOrigin: 'center' }}
              >
                {cycleMotion.id > 0 && movement && !reduce && (
                  <motion.div
                    key={`${cycleMotion.id}-${imgIndex}`}
                    className="lens-card-motion-trail absolute rounded-full"
                    initial={{ opacity: 0, x: -movement.x * 18, y: -movement.y * 18, rotate: movement.angle, scaleX: 0.72, scaleY: 0.72, z: -8 }}
                    animate={{
                      opacity: [0, 0.16 + movement.strength * 0.24, 0],
                      x: [-movement.x * 18, 0, movement.x * 10],
                      y: [-movement.y * 18, 0, movement.y * 10],
                      rotate: movement.angle,
                      scaleX: [0.72, 0.96 + movement.strength * 0.16, 0.82],
                      scaleY: [0.72, 0.86 + movement.strength * 0.06, 0.68],
                    }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformStyle: 'preserve-3d' }}
                    aria-hidden="true"
                  />
                )}
                {/* One close-fitting backing plate gives each image a clean 3D edge. */}
                <div
                  className="lens-card-backing absolute inset-0 rounded-2xl"
                  style={{ transform: 'translateZ(-4px)' }}
                />
                <div
                  className={`lens-card-face ${isFront ? 'lens-card-face--front' : 'lens-card-face--back'} relative h-full w-full overflow-hidden rounded-2xl border-2 border-border bg-card`}
                >
                  <Image
                    src={images[imgIndex]}
                    alt=""
                    loading={isFront ? 'eager' : 'lazy'}
                    fetchPriority={isFront ? 'high' : 'auto'}
                    className="lens-card-image h-full w-full object-cover"
                  />
                  {isFront && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      {/* scan line */}
                      <motion.div
                        className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0"
                        animate={reduce || !isInView ? { y: '-20%' } : { y: ['-20%', '120%'] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 dark:border-white/10" />
                      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/35" />
                    </>
                  )}
                  {hasOrbitLight && (
                    <svg
                      className="lens-card-edge"
                      viewBox="0 0 160 90"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <rect className="lens-card-edge-track" x="1.5" y="1.5" width="157" height="87" rx="7" />
                      <motion.rect
                        className="lens-card-edge-beam"
                        x="1.5"
                        y="1.5"
                        width="157"
                        height="87"
                        rx="7"
                        pathLength="100"
                        strokeDasharray="14 86"
                        animate={reduce || !isInView ? { strokeDashoffset: 0 } : { strokeDashoffset: [0, -100] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.rect
                        className="lens-card-edge-beam lens-card-edge-beam--opposite"
                        x="1.5"
                        y="1.5"
                        width="157"
                        height="87"
                        rx="7"
                        pathLength="100"
                        strokeDasharray="14 86"
                        animate={reduce || !isInView ? { strokeDashoffset: 50 } : { strokeDashoffset: [50, -50] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                      />
                    </svg>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Floating AI-review chip */}
          <motion.div
            className="lens-floating-chip lens-floating-chip--review absolute end-[15%] top-[9%] z-50 flex items-center gap-2 rounded-2xl border border-border bg-card/85 px-3 py-2 backdrop-blur-xl"
            animate={hovered
              ? { x: 76, y: -20, z: -60, scale: 0.82, rotateX: 0, rotateY: 0, opacity: 0.72 }
              : { x: 0, y: 0, z: 245, scale: 1, rotateX: 5, rotateY: -7, opacity: 1 }}
            transition={SPREAD_SPRING}
            style={{ transformStyle: 'preserve-3d', pointerEvents: 'none', zIndex: hovered ? 1 : 50 }}
          >
            <span className="lens-chip-icon grid h-8 w-8 place-items-center rounded-xl brand-gradient text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="lens-chip-copy text-[10px] font-semibold leading-tight text-foreground">
              {t('hero.chip.reviewTitle')}
              <br />
              <span className="font-medium text-muted-foreground">{t('hero.chip.reviewLabel')}</span>
            </div>
          </motion.div>

          {/* Floating insights chip */}
          <motion.div
            className="lens-floating-chip lens-floating-chip--insights absolute start-[15%] bottom-[9%] z-50 flex items-center gap-2 rounded-2xl border border-border bg-card/85 px-3 py-2 backdrop-blur-xl"
            animate={hovered
              ? { x: -76, y: 20, z: -60, scale: 0.82, rotateX: 0, rotateY: 0, opacity: 0.72 }
              : { x: 0, y: 0, z: 245, scale: 1, rotateX: -5, rotateY: 7, opacity: 1 }}
            transition={SPREAD_SPRING}
            style={{ transformStyle: 'preserve-3d', pointerEvents: 'none', zIndex: hovered ? 1 : 50 }}
          >
            <span className="lens-chip-icon grid h-8 w-8 place-items-center rounded-xl bg-secondary text-primary">
              <BarChart3 className="h-3.5 w-3.5" />
            </span>
            <div className="lens-chip-copy">
              <div className="text-[10px] font-medium text-muted-foreground">{t('hero.chip.insightTitle')}</div>
              <div className="text-sm font-extrabold brand-text leading-none">{t('hero.chip.insightLabel')}</div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Click a card to open it fullscreen, with a small X to go back.
          Portaled to body so it escapes the perspective container. */}
      {createPortal(
        <AnimatePresence>
          {zoomed !== null && (
            <motion.div
              className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-6 backdrop-blur-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setZoomed(null)}
            >
              <motion.div
                className="relative overflow-hidden rounded-2xl border border-border shadow-float"
                initial={{ scale: 0.85, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 16, opacity: 0 }}
                transition={SPRING}
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={images[zoomed]}
                  alt=""
                  className="max-h-[84vh] w-auto max-w-[min(64rem,90vw)] object-contain"
                />
                <button
                  type="button"
                  onClick={() => setZoomed(null)}
                  aria-label="Close"
                  className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/80 text-foreground shadow-float backdrop-blur transition-transform duration-500 hover:scale-110 hover:rotate-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
