import React, { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { Stack } from '@lucasmarkes/hairline/react';
import { useI18n } from '@/lib/i18n';
import ScrollTypingText from './ScrollTypingText';
import { useFinePointer } from '@/hooks/use-pointer-capability';

export default function ThumbnailShowcaseScene({ images }) {
  const { t, lang, dir } = useI18n();
  const trackRef = useRef(null);
  const wheelLockRef = useRef(false);
  const wheelTimerRef = useRef(null);
  const activeRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const galleryCount = String(images.length).padStart(2, '0');
  const activeNumber = String(activeIndex + 1).padStart(2, '0');
  activeRef.current = activeIndex;

  useEffect(() => {
    const track = trackRef.current;
    const cards = track?.querySelectorAll('[data-gallery-card]');
    if (!cards?.length) return undefined;

    if (!('IntersectionObserver' in window)) {
      cards.forEach((card) => card.classList.add('is-revealed'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [images.length]);

  useEffect(() => {
    const track = trackRef.current;
    const anchors = track?.querySelectorAll('[data-gallery-anchor]');
    if (!track || !anchors?.length) return undefined;

    let frame = 0;
    const updateActive = () => {
      frame = 0;
      if (wheelLockRef.current) return;
      const readingLine = window.scrollY + window.innerHeight * 0.44;
      let nextIndex = 0;
      anchors.forEach((anchor, index) => {
        if (anchor.getBoundingClientRect().top + window.scrollY <= readingLine) nextIndex = index;
      });
      activeRef.current = nextIndex;
      setActiveIndex((current) => current === nextIndex ? current : nextIndex);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActive);
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [images.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const onWheel = (event) => {
      if (window.matchMedia('(max-width: 700px)').matches || event.ctrlKey) return;
      if (Math.abs(event.deltaY) < 8) return;

      const nextIndex = activeRef.current + (event.deltaY > 0 ? 1 : -1);
      // Let the page scroll normally when the gallery has reached either end.
      if (nextIndex < 0 || nextIndex >= images.length) return;

      // Keep the wheel responsive during the brief smooth-scroll transition.
      // A locked wheel event must be allowed to scroll the page instead of
      // being swallowed, otherwise trackpads can feel stuck at a card.
      if (wheelLockRef.current) return;
      event.preventDefault();

      const anchor = track.querySelector(`[data-gallery-anchor="${nextIndex}"]`);
      const card = track.querySelector(`[data-gallery-card="${nextIndex}"]`);
      if (!anchor || !card) return;

      wheelLockRef.current = true;
      activeRef.current = nextIndex;
      setActiveIndex(nextIndex);

      const stickyTop = Number.parseFloat(getComputedStyle(card).top) || 96;
      const targetTop = Math.max(0, anchor.getBoundingClientRect().top + window.scrollY - stickyTop);
      if (reduceMotion) window.scrollTo(0, targetTop);
      else window.scrollTo({ top: targetTop, behavior: 'smooth' });

      window.clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => {
        wheelLockRef.current = false;
        window.dispatchEvent(new Event('scroll'));
      }, 680);
    };

    track.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      track.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelTimerRef.current);
      wheelLockRef.current = false;
    };
  }, [images.length, reduceMotion]);

  useEffect(() => {
    if (selectedIndex === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex]);

  return (
    <div className="gallery-stack-scene" dir={dir}>
      <header className="gallery-stack-header">
        <div className="gallery-stack-heading-row">
          <div>
            <span className="gallery-stack-eyebrow"><i />{t('gallery.tag')}<b>CL / 01</b></span>
            <ScrollTypingText as="h2" text={t('gallery.title')} />
          </div>
          <div className="gallery-stack-heading-aside">
            <ScrollTypingText as="p" text={t('gallery.subtitle')} delay={100} />
            <span className="gallery-stack-total" aria-hidden="true"><b>{activeNumber}</b><i /><small>{galleryCount} {lang === 'ar' ? 'نماذج' : 'THUMBNAILS'}</small></span>
            {finePointer && <div className="gallery-stack-deck-figure" aria-hidden="true"><Stack intensity={0.28} theme="auto" /></div>}
          </div>
        </div>
        <div className="gallery-stack-progress" aria-hidden="true">
          <i style={{ width: `${((activeIndex + 1) / images.length) * 100}%` }} />
        </div>
      </header>

      <div ref={trackRef} className="gallery-stack-track" dir="ltr" aria-label={lang === 'ar' ? 'معرض الصور المصغرة' : 'Thumbnail gallery'}>
        {images.map((src, index) => (
          <Fragment key={`${src}-${index}`}>
            <span className="gallery-stack-anchor" data-gallery-anchor={index} aria-hidden="true" />
            <article
              id={`gallery-slide-${index + 1}`}
              data-gallery-card={index}
              aria-current={activeIndex === index ? 'step' : undefined}
              className="gallery-stack-card"
              style={{
                '--stack-level': index + 1,
                '--stack-top': `${Math.max(0, Math.min(index, images.length - 2)) * 8}px`,
                '--reveal-delay': `${Math.min(index, 4) * 65}ms`,
              }}
            >
              <button
                type="button"
                className={`gallery-stack-image${failedImages.has(src) ? ' is-broken' : ''}`}
                tabIndex={0}
                onClick={() => setSelectedIndex(index)}
                onPointerMove={(event) => {
                  if (event.pointerType !== 'mouse') return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const x = (event.clientX - bounds.left) / bounds.width;
                  const y = (event.clientY - bounds.top) / bounds.height;
                  event.currentTarget.style.setProperty('--pointer-x', `${x * bounds.width}px`);
                  event.currentTarget.style.setProperty('--pointer-y', `${y * bounds.height}px`);
                  event.currentTarget.style.setProperty('--image-shift-x', `${(0.5 - x) * 5}px`);
                  event.currentTarget.style.setProperty('--image-shift-y', `${(0.5 - y) * 3}px`);
                }}
                onPointerLeave={(event) => {
                  event.currentTarget.style.setProperty('--image-shift-x', '0px');
                  event.currentTarget.style.setProperty('--image-shift-y', '0px');
                }}
                aria-label={`${t('common.openImage')} ${index + 1}`}
              >
                <img
                  src={src}
                  alt={`${lang === 'ar' ? 'صورة مصغّرة تمثيلية' : 'Representative thumbnail'} ${index + 1}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  draggable="false"
                  onError={() => setFailedImages((current) => current.has(src) ? current : new Set([...current, src]))}
                  onLoad={() => setFailedImages((current) => {
                    if (!current.has(src)) return current;
                    const next = new Set(current);
                    next.delete(src);
                    return next;
                  })}
                />
                {failedImages.has(src) && (
                  <span className="gallery-stack-image-fallback" aria-hidden="true">
                    <i><ArrowUpRight /></i><b>CLIP LENS</b>
                  </span>
                )}
                <span className="gallery-stack-image-shade" aria-hidden="true" />
                <span className="gallery-stack-image-meta" aria-hidden="true">
                  <span><i /> CLIP LENS</span>
                  <span>{String(index + 1).padStart(2, '0')} <b>/</b> {galleryCount}</span>
                </span>
                <span className="gallery-stack-image-footer" aria-hidden="true">
                  <b>{lang === 'ar' ? 'صورة مصغّرة تمثيلية' : 'Representative thumbnail'}</b>
                  <i><ArrowUpRight /></i>
                </span>
              </button>
            </article>
          </Fragment>
        ))}
      </div>

      {selectedIndex !== null && images[selectedIndex] && createPortal(
        <div
          className="thumbnail-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${t('gallery.title')} ${selectedIndex + 1}`}
          onClick={(event) => { if (event.target === event.currentTarget) setSelectedIndex(null); }}
        >
          <button type="button" className="thumbnail-lightbox-close" aria-label={t('common.close')} onClick={() => setSelectedIndex(null)}>
            <X aria-hidden="true" />
          </button>
          {failedImages.has(images[selectedIndex]) ? (
            <div className="thumbnail-lightbox-fallback" aria-hidden="true"><i><ArrowUpRight /></i><b>CLIP LENS</b></div>
          ) : (
            <img
              src={images[selectedIndex]}
              alt={`${lang === 'ar' ? 'صورة مصغّرة تمثيلية' : 'Representative thumbnail'} ${selectedIndex + 1}`}
              onError={() => setFailedImages((current) => new Set([...current, images[selectedIndex]]))}
            />
          )}
          <span>{String(selectedIndex + 1).padStart(2, '0')} <i /> {t('gallery.title')}</span>
        </div>,
        document.body,
      )}
    </div>
  );
}
