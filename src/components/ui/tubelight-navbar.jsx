import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function NavBar({
  items = [],
  className,
  compact = false,
  placement = 'floating',
}) {
  const location = useLocation();
  const inline = placement === 'inline';
  const current = `${location.pathname}${location.search}`;
  const [hidden, setHidden] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    if (inline) return undefined;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;

      if (navRef.current?.contains(document.activeElement)) return;
      if (y < 12 || delta < -1) setHidden(false);
      else if (delta > 1) setHidden(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [inline]);

  return (
    <motion.div
      ref={navRef}
      className={cn(
        inline
          ? 'relative flex min-w-0 items-center justify-center'
          : 'mobile-floating-navbar fixed bottom-0 left-1/2 z-50 mb-[max(1rem,env(safe-area-inset-bottom))] max-w-[calc(100vw-1.5rem)] lg:hidden',
        className
      )}
      aria-hidden={!inline && hidden ? true : undefined}
      style={inline ? undefined : { x: '-50%', pointerEvents: hidden ? 'none' : 'auto' }}
      initial={false}
      animate={inline
        ? { scale: compact ? 0.98 : 1 }
        : { scale: compact ? 0.97 : 1, y: hidden ? 88 : compact ? -3 : 0, opacity: hidden ? 0 : compact ? 0.97 : 1 }}
      transition={hidden
        ? { type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }
        : { type: 'spring', stiffness: 310, damping: 31, mass: 0.48 }}
    >
      <nav
        aria-label="Primary navigation"
        className={cn(
          'navbar-smooth-ease relative isolate flex items-center transition-[border-radius,background-color,border-color,box-shadow,padding,font-size] duration-300 motion-reduce:transition-none',
          inline
            ? 'gap-0.5'
            : 'gap-0.5 rounded-full border border-white/25 bg-background/35 bg-[linear-gradient(135deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_48%,rgba(255,255,255,0.16)_100%)] px-1 py-1 shadow-[0_20px_55px_-28px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.38),inset_0_-1px_0_rgba(255,255,255,0.12)] ring-1 ring-white/15 backdrop-blur-[18px] backdrop-saturate-150 dark:border-white/15 dark:bg-black/55 dark:ring-white/[0.08] dark:shadow-[0_20px_55px_-28px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.018)_48%,rgba(255,255,255,0.055)_100%)]'
        )}
      >
        {!inline && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-0 z-10 h-px rounded-full bg-gradient-to-r from-transparent via-white/75 to-transparent dark:via-white/35"
          />
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.to || (item.to === '/' && location.pathname === '/');

          return (
            <Link
              key={item.to}
              to={item.to}
              tabIndex={!inline && hidden ? -1 : undefined}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'navbar-smooth-ease relative isolate inline-flex items-center justify-center rounded-full font-semibold transition-[color,background-color,box-shadow,padding,font-size] duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
                inline
                  ? compact ? 'px-3 py-2 text-[13px]' : 'px-4 py-2.5 text-sm'
                  : 'h-11 w-11',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {Icon && (
                  <Icon
                    size={inline ? 16 : 18}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                )}
                {inline && <span className="whitespace-nowrap">{item.name}</span>}
              </span>
              {isActive && (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 z-0 rounded-full bg-primary/10 ring-1 ring-inset ring-primary/10"
                  initial={false}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}
