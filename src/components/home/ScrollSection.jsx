import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useFinePointer } from '@/hooks/use-pointer-capability';

export default function ScrollSection({ children, className = '', ...props }) {
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();

  return (
    <motion.section
      {...props}
      initial={reduceMotion || !finePointer ? false : { opacity: 0 }}
      whileInView={finePointer ? { opacity: 1 } : undefined}
      viewport={finePointer ? { once: true, amount: 0.06 } : undefined}
      transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
