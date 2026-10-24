import { useEffect, useRef, useState } from 'react';

export default function ScrollProgress() {
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const [enabled, setEnabled] = useState(() => (
    typeof window !== 'undefined'
    && window.matchMedia('(min-width: 641px) and (hover: hover) and (pointer: fine)').matches
  ));

  useEffect(() => {
    const query = window.matchMedia('(min-width: 641px) and (hover: hover) and (pointer: fine)');
    const sync = () => setEnabled(query.matches);
    sync();
    if (query.addEventListener) query.addEventListener('change', sync);
    else query.addListener(sync);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', sync);
      else query.removeListener(sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let frame = 0;

    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const track = trackRef.current;
        const thumb = thumbRef.current;
        if (!track || !thumb) return;

        const viewportHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const maxScroll = Math.max(0, documentHeight - viewportHeight);
        const trackHeight = track.clientHeight;
        const thumbHeight = Math.min(trackHeight, Math.max(30, trackHeight * viewportHeight / documentHeight));
        const travel = Math.max(0, trackHeight - thumbHeight);
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

        track.classList.toggle('page-scroll-progress--visible', maxScroll > 0);
        thumb.style.height = `${thumbHeight}px`;
        thumb.style.transform = `translate3d(0, ${travel * progress}px, 0)`;
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(update);
    if (resizeObserver) {
      resizeObserver.observe(document.documentElement);
      if (document.body) resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      resizeObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={trackRef} className="page-scroll-progress" aria-hidden="true">
      <div ref={thumbRef} className="page-scroll-progress-thumb" />
    </div>
  );
}
