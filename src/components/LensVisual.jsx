import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1493612276216-ee392551f8a4?auto=format&fit=crop&w=900&q=80';

// A dimensional, lens-inspired 3D object: a 16:9 thumbnail frame stacked over
// sample thumbnail cards, with a rotating lens ring. Pointer movement is slow
// and limited; respects prefers-reduced-motion.
export default function LensVisual({ className = '', size = 360 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { settings } = useSiteSettings();
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const gallery = settings.gallery_images || [];
  const MAIN_IMG = settings.hero_image_url || FALLBACK_HERO;
  const BACK_A = gallery[2] || gallery[0] || FALLBACK_HERO;
  const BACK_B = gallery[3] || gallery[1] || FALLBACK_HERO;

  const onMove = (e) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: py * -12, ry: px * 16 });
  };

  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`perspective select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.div
        className="preserve-3d relative h-full w-full"
        animate={reduce ? {} : { y: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        {/* Glow base */}
        <div className="absolute inset-0 -z-10 grid place-items-center">
          <div className="h-3/4 w-3/4 rounded-full bg-primary/25 blur-3xl" />
        </div>

        {/* Back thumbnail cards (depth) */}
        <div
          className="absolute left-1/2 top-1/2 aspect-video w-[66%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
          style={{ transform: 'translateZ(-60px) translate(-74%, -104%) rotate(-11deg)' }}
        >
          <Image src={BACK_A} alt="" className="h-full w-full object-cover opacity-90" />
        </div>
        <div
          className="absolute left-1/2 top-1/2 aspect-video w-[66%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
          style={{ transform: 'translateZ(-40px) translate(-26%, 4%) rotate(9deg)' }}
        >
          <Image src={BACK_B} alt="" className="h-full w-full object-cover opacity-90" />
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

        {/* Video frame card */}
        <div
          className="absolute left-1/2 top-1/2 aspect-video w-[88%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-float"
          style={{ transform: 'translateZ(70px) translate(-50%, -50%)' }}
        >
          <Image src={MAIN_IMG} alt="" className="h-full w-full object-cover" />
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
        </div>

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
  );
}