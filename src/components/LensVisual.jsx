import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

const FALLBACKS = [
  'https://images.unsplash.com/photo-1493612276216-ee392551f8a4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1522199755835-a69bdb78cb1e?auto=format&fit=crop&w=900&q=80',
];

// Stack slots (pos 0 = front). x/y in % of card size, z in px depth.
const SLOTS = [
  { x: 0, y: 0, z: 70, r: 0, s: 1, o: 1 },
  { x: -18, y: -16, z: -30, r: -10, s: 0.88, o: 0.95 },
  { x: 19, y: 14, z: -70, r: 9, s: 0.8, o: 0.9 },
  { x: -29, y: 22, z: -100, r: -14, s: 0.73, o: 0.85 },
];
const SPRING = { type: 'spring', stiffness: 52, damping: 20, opacity: { duration: 0.55 } };

// A lens-inspired card deck: cards cycle automatically (the front card slides
// out and tucks behind the deck) and spread apart on hover. Pointer tilt is
// slow and limited; respects prefers-reduced-motion.
export default function LensVisual({ className = '', size = 360 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { settings } = useSiteSettings();
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);
  const [order, setOrder] = useState([0, 1, 2, 3]);

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
    if (reduce || hovered || order.length < 2) return undefined;
    const id = setInterval(() => {
      setOrder((prev) => [...prev.slice(1), prev[0]]);
    }, 4600);
    return () => clearInterval(id);
  }, [reduce, hovered, order.length]);

  const onMove = (e) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: py * -12, ry: px * 16 });
  };

  const targetFor = (pos) => {
    const p = SLOTS[Math.min(pos, SLOTS.length - 1)];
    const m = hovered && pos > 0 ? 2.6 : 1;
    return {
      x: `${-50 + p.x * m}%`,
      y: `${-50 + p.y * m}%`,
      z: hovered && pos > 0 ? p.z - 25 : p.z,
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
        setTilt({ rx: 0, ry: 0 });
        setHovered(false);
      }}
      className={`perspective select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="preserve-3d h-full w-full" style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}>
        <motion.div
          className="preserve-3d relative h-full w-full"
          animate={reduce ? {} : { y: [0, -14, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Glow base */}
          <div className="absolute inset-0 -z-10 grid place-items-center">
            <div className="h-3/4 w-3/4 rounded-full bg-primary/25 blur-3xl" />
          </div>

          {/* Lens ring */}
          <motion.div
            className="absolute inset-6 rounded-full border-[6px] border-primary/30"
            animate={reduce ? {} : { rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            style={{ transform: 'translateZ(20px)' }}
          >
            <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_20px] shadow-primary" />
          </motion.div>

          {/* Card deck */}
          {order.map((imgIndex, pos) => {
            const isFront = pos === 0;
            return (
              <motion.div
                key={imgIndex}
                className="absolute left-1/2 top-1/2 aspect-video w-[86%] overflow-hidden rounded-2xl border border-border bg-card"
                initial={false}
                animate={targetFor(pos)}
                transition={SPRING}
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

          {/* Floating thumbnail chip */}
          <div
            className="absolute -end-1 top-[16%] flex items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-float backdrop-blur"
            style={{ transform: 'translateZ(100px)' }}
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl brand-gradient text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="text-[10px] font-semibold leading-tight text-foreground">
              AI<br />ready
            </div>
          </div>

          {/* Floating score chip */}
          <div
            className="absolute -start-2 bottom-[16%] rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-float backdrop-blur"
            style={{ transform: 'translateZ(90px)' }}
          >
            <div className="text-[10px] font-medium text-muted-foreground">Score</div>
            <div className="text-lg font-extrabold brand-text leading-none">87</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}