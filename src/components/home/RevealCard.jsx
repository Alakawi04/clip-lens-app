import { motion, useReducedMotion } from 'framer-motion';
import { useFinePointer } from '@/hooks/use-pointer-capability';

const ENTRANCES = {
  lift: {
    initial: { opacity: 0, y: 46, scale: 0.96, rotateX: 5 },
    transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
  },
  glideStart: {
    initial: { opacity: 0, x: -54, y: 16, scale: 0.97, rotateY: -6, rotateZ: -0.7 },
    transition: { type: 'spring', stiffness: 82, damping: 22, mass: 0.8 },
  },
  glideEnd: {
    initial: { opacity: 0, x: 54, y: 16, scale: 0.97, rotateY: 6, rotateZ: 0.7 },
    transition: { type: 'spring', stiffness: 82, damping: 22, mass: 0.8 },
  },
  focus: {
    initial: { opacity: 0, y: 10, scale: 0.82, rotateZ: -1.5 },
    transition: { duration: 0.8, ease: [0.2, 1, 0.25, 1] },
  },
  unfold: {
    initial: { opacity: 0, y: 30, scale: 0.97, rotateX: 12 },
    transition: { duration: 0.88, ease: [0.22, 1, 0.36, 1] },
  },
  drift: {
    initial: { opacity: 0, x: -24, y: 38, scale: 0.94, rotateZ: 2.5 },
    transition: { type: 'spring', stiffness: 76, damping: 20, mass: 0.85 },
  },
  settle: {
    initial: { opacity: 0, x: 20, y: -28, scale: 0.94, rotateY: 5 },
    transition: { duration: 0.82, ease: [0.12, 0.9, 0.24, 1] },
  },
};

export default function RevealCard({ children, className = '', delay = 0, variant = 'lift' }) {
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const entrance = ENTRANCES[variant] || ENTRANCES.lift;

  return (
    <motion.div
      initial={reduceMotion || !finePointer ? false : entrance.initial}
      whileInView={finePointer ? { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0 } : undefined}
      viewport={finePointer ? { once: true, amount: 0.18, margin: '0px 0px -10% 0px' } : undefined}
      transition={reduceMotion ? { duration: 0 } : finePointer ? { ...entrance.transition, delay } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={reduceMotion || !finePointer ? undefined : { transformPerspective: 1200, transformOrigin: 'center bottom' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
