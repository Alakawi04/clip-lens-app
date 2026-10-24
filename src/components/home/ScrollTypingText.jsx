import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useFinePointer } from '@/hooks/use-pointer-capability';

function splitText(text) {
  if (/\p{Script=Arabic}/u.test(text)) return text.match(/\S+|\s+/gu) || [];
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

export default function ScrollTypingText({ as: Element = 'span', text = '', className = '', delay = 0, ...props }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const [started, setStarted] = useState(false);
  const parts = useMemo(() => finePointer ? splitText(String(text)) : [], [finePointer, text]);

  useEffect(() => {
    const element = ref.current;
    if (!finePointer || reduceMotion || !element || !('IntersectionObserver' in window)) {
      setStarted(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setStarted(true);
      observer.disconnect();
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [finePointer, reduceMotion]);

  if (!finePointer) {
    return <Element ref={ref} className={`scroll-typing-text${className ? ` ${className}` : ''}`} {...props}>{text}</Element>;
  }

  return (
    <Element ref={ref} className={`scroll-typing-text${started ? ' is-visible' : ''}${className ? ` ${className}` : ''}`} {...props}>
      <span aria-hidden="true" dir="auto" className="scroll-typing-visual">
        {parts.map((part, index) => (
          <span key={`${index}-${part}`} className="scroll-typing-part" style={{ '--scroll-typing-delay': `${delay + Math.min(index, 160) * 7}ms` }}>
            {part}
          </span>
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </Element>
  );
}
