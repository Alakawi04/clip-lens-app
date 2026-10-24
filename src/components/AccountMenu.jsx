import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  History as HistoryIcon,
  ChevronDown,
  LayoutDashboard,
  User as UserIcon,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'عربي' },
];

// iOS-style account menu: avatar chip + glass dropdown (language lives in here).
export default function AccountMenu({ showLabel = false, labelStyle, displayLabel, labelClassName }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const label = user?.full_name || user?.email || '';
  const initial = (label.trim()[0] || '?').toUpperCase();

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const pickLang = (code) => {
    setOpen(false);
    setLang(code);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('auth.account')}
        className="navbar-account-trigger inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 p-1 pe-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] backdrop-blur-sm transition-[color,background-color,box-shadow] hover:bg-white/20 active:scale-95 dark:border-white/12 dark:bg-black/35 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] dark:hover:bg-black/25"
      >
        {isAuthenticated ? (
          <span className="grid h-7 w-7 place-items-center rounded-full brand-gradient text-xs font-bold text-white">
            {initial}
          </span>
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full brand-gradient text-white">
            <UserIcon className="h-3.5 w-3.5" />
          </span>
        )}
        {showLabel && (
          <motion.span
            className={labelClassName || 'hidden overflow-hidden whitespace-nowrap text-xs font-semibold lg:inline-block'}
            style={labelStyle}
          >
            {displayLabel || t('nav.profile')}
          </motion.span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="account-menu-popover absolute left-0 right-auto z-50 mt-2 w-[min(15rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-popover/95 p-1.5 shadow-float backdrop-blur-xl">
          {isAuthenticated && (
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-sm font-semibold">{t('nav.profile')}</p>
              {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
          )}

          <div className="px-1 pb-1 pt-2">
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('lang.label')}
            </p>
            <div className="flex gap-1 rounded-xl border border-border bg-card/60 p-0.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => pickLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                    lang === l.code
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {lang === l.code && <Check className="h-3 w-3" />}
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 h-px bg-border" />

          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => go('/admin')}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  {t('admin.title')}
                </button>
              )}
              <button
                type="button"
                onClick={() => go('/history')}
                className="mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                {t('nav.history')}
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                {t('auth.signOut')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => go('/login')}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
            >
              <UserIcon className="h-4 w-4" />
              {t('auth.signIn')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
