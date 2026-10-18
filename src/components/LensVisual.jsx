import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring } from 'framer-motion';
import { Play, Sparkles, BarChart3, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';

const FALLBACKS = [
  'https://images.unsplash.com/photo-1493612276216-ee392551f8a4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522199755835-a69bdb78cb1e?auto=format&fit=crop&w=900&q=80',
];

// Stack slots (pos 0 = front). x/y in % of card size, z in px depth.
const SLOTS = [
  { x: 0, y: 0, z: 90, r: 0, s: 1, o: 1 },
  { x: -24, y: -22, z: -45, r: -14, s: 0.88, o: 0.95 },
  { x: 26, y: 18, z: -95, r: 12, s: 0.78, o: 0.9 },
  { x: -38, y: 30, z: -145, r: -18, s: 0.7, o: 0.85 },
];
// Snappier while the pointer is over the deck, slow and dreamy as it settles back.
const SPRING = { type: 'spring', stiffness: 170, damping: 20, opacity: { duration: 0.35 } };
const SPRING_RETURN = { type: 'spring', stiffness: 22, damping: 26, opacity: { duration: 0.9 } };

// A lens-inspired card deck: cards cycle automatically (the front card slides
// out and tucks behind the deck) and spread apart on hover. Pointer tilt is
// slow and limited; respects prefers-reduced-motion.
export default function LensVisual({ className = '', size = 360 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { settings } = useSiteSettings();
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const [order, setOrder] = useState([0, 1, 2, 3]);
  const [zoomed, setZoomed] = useState(null);

  // Tilt runs through soft springs so it eases out slowly when the pointer leaves.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rx = useSpring(tiltX, { stiffness: 130, damping: 16 });
  const ry = useSpring(tiltY, { stiffness: 130, damping: 16 });

  const images = useMemo(() => {
    const raw = [settings.hero_image_url, ...(settings.gallery_images || [])].filter(Boolean);
    const uniq = [...new Set(raw)];
    for (const fallback of FALLBACKS) {
      if (uniq.length >= 4) break;
      if (!uniq.includes(fallback)) uniq.push(fallback);
    }
    return uniq.slice(0, 4);
  }, [settings.hero_image_url, settings.gallery_images]);

  // Keep the deck in sync with the available images.
  useEffect(() => {
    setOrder(images.map((_, i) => i));
  }, [images]);

  // Auto-cycle: the front card slides out to the back of the deck. Paused on hover.
  useEffect(() => {
    if (reduce || hovered || zoomed !== null || order.length < 2) return undefined;
    const id = setInterval(() => {
      setOrder((prev) => [...prev.slice(1), prev[0]]);
    }, 4600);
    return () => clearInterval(id);
  }, [reduce, hovered, zoomed, order.length]);

  const onMove = (e) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    tiltX.set(py * -20);
    tiltY.set(px * 26);
  };

  const targetFor = (pos) => {
    const p = SLOTS[Math.min(pos, SLOTS.length - 1)];
    const m = hovered && pos > 0 ? 2.2 : 1;
    return {
      x: `${-50 + p.x * m}%`,
      y: `${-50 + p.y * m}%`,
      z: hovered && pos > 0 ? p.z - 22 : p.z,
      rotate: p.r * m,
      scale: p.s,
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
        setHovered(false);
      }}
      className={`perspective select-none aspect-square w-full ${className}`}
      style={{ maxWidth: size }}
    >
      <motion.div className="preserve-3d h-full w-full" style={{ rotateX: rx, rotateY: ry }}>
        <motion.div
          className="preserve-3d relative h-full w-full"
          animate={reduce ? {} : { y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Glow base */}
          <div className="absolute inset-0 -z-10 grid place-items-center">
            <div className="h-3/4 w-3/4 rounded-full bg-primary/25 blur-3xl" />
          </div>

          {/* Ghost glow panels — blurred echoes of the card stack behind the deck */}
          <div
            className="absolute left-1/2 top-1/2 aspect-video w-[130%] rounded-[2.5rem] bg-primary/20 blur-3xl"
            style={{ transform: 'translate(-50%, -50%) rotate(-12deg) translateZ(-150px)' }}
          />
          <div
            className="absolute left-1/2 top-1/2 aspect-video w-[105%] rounded-[2.5rem] bg-primary/10 blur-2xl"
            style={{ transform: 'translate(-50%, -50%) rotate(9deg) translateZ(-190px)' }}
          />

          {/* Card deck */}
          {order.map((imgIndex, pos) => {
            const isFront = pos === 0;
            return (
              <motion.div
                key={imgIndex}
                onClick={() => setZoomed(imgIndex)}
                className="absolute left-1/2 top-1/2 aspect-video w-[86%] cursor-pointer overflow-hidden rounded-2xl border border-border bg-card"
                initial={false}
                animate={targetFor(pos)}
                transition={hovered ? SPRING : SPRING_RETURN}
                style={{
                  transformOrigin: 'center',
                  boxShadow: isFront
                    ? '0 24px 60px -12px hsl(0 0% 0% / 0.45)'
                    : '0 12px 34px -10px hsl(0 0% 0% / 0.4)',
                }}
              >
                <Image src={images[imgIndex]} alt="" className="h-full w-full object-cover" />
                {isFront && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-primary shadow-float backdrop-blur">
                        <Play className="h-5 w-5 translate-x-0.5 fill-primary" />
                      </span>
                    </div>
                    {/* scan line */}
                    <motion.div
                      className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0"
                      animate={reduce ? {} : { y: ['-20%', '120%'] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </>
                )}
              </motion.div>
            );
          })}

          {/* Floating AI-review chip */}
          <div
            className="absolute -end-1 top-[16%] flex items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-float backdrop-blur"
            style={{ transform: 'translateZ(100px)' }}
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl brand-gradient text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="text-[10px] font-semibold leading-tight text-foreground">
              {t('hero.chip.reviewTitle')}
              <br />
              <span className="font-medium text-muted-foreground">{t('hero.chip.reviewLabel')}</span>
            </div>
          </div>

          {/* Floating insights chip */}
          <div
            className="absolute -start-2 bottom-[16%] flex items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-float backdrop-blur"
            style={{ transform: 'translateZ(90px)' }}
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-secondary text-primary">
              <BarChart3 className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="text-[10px] font-medium text-muted-foreground">{t('hero.chip.insightTitle')}</div>
              <div className="text-sm font-extrabold brand-text leading-none">{t('hero.chip.insightLabel')}</div>
            </div>
          </div>
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