import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Floating "tubelight" pill navigation — a soft lamp glides under the active item.
// When `compact` it eases into a slimmer, lighter version of itself: it stays put.
export function NavBar({ items = [], className, compact = false, expanded = false }) {
  const location = useLocation();
  const current = `${location.pathname}${location.search}`;

  return (
    <motion.div
      className={cn(
        'fixed bottom-0 left-1/2 z-50 mb-5',
        'md:bottom-auto md:top-0 md:mb-0 md:pt-5',
        className
      )}
      style={{ x: '-50%' }}
      initial={false}
      animate={{ scale: compact ? 0.9 : 1, y: compact ? -6 : 0, opacity: compact ? 0.92 : 1 }}
      transition={{ type: 'spring', stiffness: 250, damping: 28 }}
    >
      <div
        className={cn(
          'flex items-center rounded-full border backdrop-blur-xl transition-all duration-500',
          compact
            ? 'gap-0.5 border-border/50 bg-card/40 px-1 py-0.5 shadow-none'
            : expanded
              ? 'gap-1.5 border-border bg-card/70 px-1.5 py-1.5 shadow-float'
              : 'gap-1 border-border bg-card/70 px-1 py-1 shadow-float'
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.to || (item.to === '/' && location.pathname === '/');

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'relative cursor-pointer rounded-full font-semibold transition-all duration-500',
                compact ? 'px-4 py-1.5 text-[13px]' : expanded ? 'px-5 py-2.5 text-sm md:px-6 md:text-base' : 'px-5 py-2 text-sm',
                'text-muted-foreground hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              {expanded ? (
                <>
                  {Icon && <Icon className="h-4 w-4 md:hidden" size={18} strokeWidth={2.5} aria-hidden="true" />}
                  <span className="hidden md:inline">{item.name}</span>
                </>
              ) : (
                <>
                  <span className="hidden md:inline">{item.name}</span>
                  <span className="md:hidden">{Icon ? <Icon size={18} strokeWidth={2.5} /> : item.name}</span>
                </>
              )}
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 -z-10 w-full rounded-full bg-primary/10"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-primary">
                    <div className="absolute -left-2 -top-2 h-6 w-12 rounded-full bg-primary/20 blur-md" />
                    <div className="absolute -top-1 h-6 w-8 rounded-full bg-primary/20 blur-md" />
                    <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-primary/20 blur-sm" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

export default NavBar;