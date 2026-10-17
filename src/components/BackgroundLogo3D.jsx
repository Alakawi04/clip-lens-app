import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useSiteSettings } from '@/lib/SiteSettingsContext';

const FALLBACK_MARK =
  'https://media.base44.com/images/public/6ad3b9fadbf23651c67f40d9/5a4a1eee8_cliplens_logo_icon_clean_large-removebg-preview.png';

const MASK = 'radial-gradient(closest-side, #000 58%, transparent 100%)';

// Compact brand mark floating in real 3D space: it turns slowly on its own axis,
// leans toward the pointer, and sits above two soft depth copies and a pair of
// orbiting rings. It stays out of the way while the hero fills the screen, then
// eases in and drifts up as the page scrolls. Respects reduced motion.
export default function BackgroundLogo3D() {
  const { settings } = useSiteSettings();
  const mark = settings.logo_image_url || FALLBACK_MARK;
  const reduce = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frame = useRef(0);
  const { scrollY } = useScroll();

  const opacity = useTransform(scrollY, [140, 600], [0, 1]);
  const scale = useTransform(scrollY, [140, 600], [0.88, 1]);
  const y = useTransform(scrollY, [0, 1600], [30, -130]);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e) => {
      window.cancelAnimationFrame(frame.current);
      frame.current = window.requestAnimationFrame(() => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        setTilt({ x: nx * 14, y: ny * -11 });
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.cancelAnimationFrame(frame.current);
    };
  }, [reduce]);

  const markClass = 'h-[10rem] w-[10rem] object-contain md:h-[17rem] md:w-[17rem]';

  return (
    <div className="absolute inset-0 grid place-items-center" style={{ perspective: '1500px' }}>
      <motion.div className="grid place-items-center" style={reduce ? undefined : { opacity, scale, y }}>
        {/* pointer-reactive lean */}
        <motion.div
          className="relative grid place-items-center"
          style={{ transformStyle: 'preserve-3d', rotateX: 12 + tilt.y, rotateY: -16 + tilt.x }}
        >
          {/* self-turning 3D core */}
          <motion.div
            className="relative grid place-items-center"
            style={{ transformStyle: 'preserve-3d' }}
            animate={
              reduce
                ? {}
                : { rotateY: [-14, 14, -14], rotateX: [-6, 6, -6], y: [0, -16, 0] }
            }
            transition={{
              rotateY: { duration: 26, repeat: Infinity, ease: 'easeInOut' },
              rotateX: { duration: 34, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {/* inner orbit */}
            <span
              className="absolute h-[14rem] w-[14rem] md:h-[24rem] md:w-[24rem]"
              style={{ transform: 'translateZ(-90px) rotateX(62deg)' }}
            >
              <motion.span
                className="relative block h-full w-full rounded-full border border-primary/10"
                animate={reduce ? {} : { rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              >
                <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/60" />
              </motion.span>
            </span>

            {/* outer orbit */}
            <span
              className="absolute h-[18rem] w-[18rem] md:h-[30rem] md:w-[30rem]"
              style={{ transform: 'translateZ(-160px) rotateX(62deg)' }}
            >
              <motion.span
                className="relative block h-full w-full rounded-full border border-primary/[0.06]"
                animate={reduce ? {} : { rotate: -360 }}
                transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
              >
                <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary/35" />
              </motion.span>
            </span>

            {/* depth copies — give the flat mark real volume */}
            <Image
              src={mark}
              alt=""
              fittingType="fit"
              className={`absolute ${markClass} mix-blend-multiply opacity-[0.03] dark:mix-blend-screen dark:opacity-[0.07]`}
              style={{
                transform: 'translateZ(-150px) scale(1.2)',
                maskImage: MASK,
                WebkitMaskImage: MASK,
                filter: 'blur(7px)',
              }}
            />
            <Image
              src={mark}
              alt=""
              fittingType="fit"
              className={`absolute ${markClass} mix-blend-multiply opacity-[0.04] dark:mix-blend-screen dark:opacity-[0.1]`}
              style={{
                transform: 'translateZ(-70px) scale(1.09)',
                maskImage: MASK,
                WebkitMaskImage: MASK,
                filter: 'blur(3px)',
              }}
            />

            {/* the mark itself */}
            <Image
              src={mark}
              alt=""
              fittingType="fit"
              className={`relative ${markClass} mix-blend-multiply opacity-[0.08] dark:mix-blend-screen dark:opacity-[0.24]`}
              style={{ maskImage: MASK, WebkitMaskImage: MASK }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}