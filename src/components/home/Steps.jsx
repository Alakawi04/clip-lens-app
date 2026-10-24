import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Exploded, Loupe, Plot, Stack } from '@lucasmarkes/hairline/react';
import { useReducedMotion } from 'framer-motion';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';
import VideoStoryScene from './VideoStoryScene';
import ScrollTypingText from './ScrollTypingText';
import { useFinePointer } from '@/hooks/use-pointer-capability';

const VISUAL_KEYS = ['source', 'frame', 'report', 'preview'];
const STORY_FIGURES = [Exploded, Loupe, Plot, Stack];

function WorkflowChapter({ index, active, title, desc, outcome }) {
  return (
    <article
      id={`workflow-step-${index + 1}`}
      data-step={index}
      className={`steps3d-chapter ${active === index ? 'is-active' : ''}`}
      aria-current={active === index ? 'step' : undefined}
    >
      <div className="steps3d-step-number">0{index + 1}<i /></div>
      <div className="steps3d-copy">
        <ScrollTypingText as="h3" text={title} />
        <ScrollTypingText as="p" text={desc} delay={100} />
        <div className="steps3d-outcome"><Check aria-hidden="true" /><ScrollTypingText as="span" text={outcome} delay={160} /></div>
      </div>
    </article>
  );
}

export default function Steps() {
  const { t } = useI18n();
  const { settings } = useSiteSettings();
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const wheelLockRef = useRef(false);
  const wheelTimerRef = useRef(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  activeRef.current = active;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const root = document.documentElement;
    const updateNavbarVisibility = () => {
      const bounds = section.getBoundingClientRect();
      const hasEnteredStory = bounds.top < -window.innerHeight * .16;
      const hasLeftStory = bounds.bottom < window.innerHeight * .15;
      root.classList.toggle('is-how-it-works-active', hasEnteredStory && !hasLeftStory);
    };

    updateNavbarVisibility();
    window.addEventListener('scroll', updateNavbarVisibility, { passive: true });
    window.addEventListener('resize', updateNavbarVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateNavbarVisibility);
      window.removeEventListener('resize', updateNavbarVisibility);
      root.classList.remove('is-how-it-works-active');
    };
  }, []);

  const images = useMemo(() => [
    settings.tool_analyze_image_url || settings.hero_image_url,
    settings.hero_image_url || settings.hero_images?.[0],
    settings.before_image_url || settings.gallery_images?.[1],
    settings.after_image_url || settings.gallery_images?.[0] || settings.hero_image_url,
  ], [settings.tool_analyze_image_url, settings.hero_image_url, settings.hero_images, settings.before_image_url, settings.gallery_images, settings.after_image_url]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (wheelLockRef.current) return;
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * .48) - Math.abs(b.boundingClientRect.top - window.innerHeight * .48))[0];
      if (visible) {
        const nextStep = Number(visible.target.dataset.step);
        setActive((current) => current === nextStep ? current : nextStep);
      }
    }, { rootMargin: '-30% 0px -30% 0px', threshold: [0, .2, .45, .7] });
    track.querySelectorAll('[data-step]').forEach((chapter) => observer.observe(chapter));
    return () => observer.disconnect();
  }, []);

  // Treat each deliberate wheel gesture as one chapter advance while the
  // pointer is over this section. At the first/last chapter, page scrolling
  // naturally continues into the neighboring home section.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const onWheel = (event) => {
      if (Math.abs(event.deltaY) < 8 || event.ctrlKey) return;
      const direction = event.deltaY > 0 ? 1 : -1;
      const nextStep = activeRef.current + direction;
      if (nextStep < 0 || nextStep >= VISUAL_KEYS.length) return;

      event.preventDefault();
      if (wheelLockRef.current) return;

      wheelLockRef.current = true;
      activeRef.current = nextStep;
      setActive(nextStep);
      document.getElementById(`workflow-step-${nextStep + 1}`)?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'center',
      });

      window.clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 560);
    };

    section.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      section.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelTimerRef.current);
      wheelLockRef.current = false;
    };
  }, [reduceMotion]);

  const jumpToStep = (index) => {
    document.getElementById(`workflow-step-${index + 1}`)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  return (
    <section ref={sectionRef} id="how-it-works" className="steps3d-section steps3d-scroll-story" aria-labelledby="workflow-title">
      <div className="steps3d-inner">
        <header className="steps3d-heading home-section-heading home-section-heading--steps">
          <ScrollTypingText as="h2" id="workflow-title" text={t('steps.title')} />
          <ScrollTypingText as="p" text={t('steps.subtitle')} delay={100} />
        </header>

        <nav className="steps3d-route" aria-label={t('steps.title')}>
          {VISUAL_KEYS.map((key, index) => (
            <button
              type="button"
              key={key}
              className={active === index ? 'is-active' : ''}
              aria-current={active === index ? 'step' : undefined}
              onClick={() => jumpToStep(index)}
            >
              <span>0{index + 1}</span>{t(`steps.${index + 1}.visual.${key}`)}
            </button>
          ))}
        </nav>

        <div className="steps3d-layout steps3d-story-layout">
          <div className="steps3d-sticky">
            <VideoStoryScene
              images={images}
              active={active}
              Figure={finePointer ? STORY_FIGURES[active] : null}
              label={t(`steps.${active + 1}.visual.${VISUAL_KEYS[active]}`)}
              reducedMotion={reduceMotion}
            />
          </div>
          <div className="steps3d-track" ref={trackRef}>
            {VISUAL_KEYS.map((key, index) => (
              <WorkflowChapter
                key={key}
                index={index}
                active={active}
                title={t(`steps.${index + 1}.title`)}
                desc={t(`steps.${index + 1}.desc`)}
                outcome={t(`steps.${index + 1}.outcome`)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
