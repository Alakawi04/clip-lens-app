import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TiltCard from '@/components/TiltCard';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useAuth } from '@/lib/AuthContext';
import { useCredits } from '@/lib/CreditContext';
import { useI18n } from '@/lib/i18n';

// Plans section — rendered only while the admin's credit system is enabled.
// Free plan: signup credits, each analysis costs credits. Pro plan: monthly
// credits; requesting it creates an upgrade request an admin approves.
export default function Pricing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { user, isAuthenticated } = useAuth();
  const { enabled, plan } = useCredits();
  const [requested, setRequested] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    base44.entities.UpgradeRequest.filter({ status: 'pending' }, { limit: 1 })
      .then((p) => setRequested(!!p.items?.length))
      .catch(() => {});
  }, [isAuthenticated]);

  if (!enabled) return null;

  const isPro = plan === 'pro';

  const upgrade = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isPro || requested) return;
    setBusy(true);
    try {
      const page = await base44.entities.UpgradeRequest.filter({ status: 'pending' }, { limit: 1 });
      if (!page.items?.length) {
        await base44.entities.UpgradeRequest.create({ user_id: user.id, plan: 'pro', status: 'pending' });
      }
      setRequested(true);
    } finally {
      setBusy(false);
    }
  };

  const cardBase = 'relative flex h-full flex-col rounded-3xl border bg-card p-7 shadow-soft transition-shadow duration-500';

  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:snap-start lg:px-8"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="fly-3d font-display text-2xl font-bold tracking-tight sm:text-3xl">{t('pricing.title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('pricing.subtitle')}</p>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-4xl gap-5 sm:grid-cols-2">
        {/* Free */}
        <TiltCard>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className={cardBase}
          >
            <p className="text-sm font-semibold text-muted-foreground">{t('pricing.free.name')}</p>
            <p className="mt-1 font-display text-4xl font-extrabold">$0</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('pricing.free.desc')}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>
                  <b>{settings.credits_signup}</b> {t('pricing.signupCredits')}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>
                  {settings.credits_cost} {t('pricing.perAnalysis')}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {t('pricing.free.f1')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {t('pricing.free.f2')}
              </li>
            </ul>
            <Link
              to="/analyze"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-border bg-secondary/60 px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            >
              {t('hero.cta')}
            </Link>
          </motion.div>
        </TiltCard>

        {/* Pro */}
        <TiltCard>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className={`${cardBase} border-primary/50 glow-ring`}
          >
            <span className="absolute -top-3 end-5 rounded-full brand-gradient px-3 py-1 text-[11px] font-bold text-primary-foreground shadow-soft">
              {t('pricing.mostPopular')}
            </span>
            <p className="text-sm font-semibold text-muted-foreground">{t('pricing.pro.name')}</p>
            <p className="mt-1 font-display text-4xl font-extrabold brand-text">
              ${settings.credits_pro_price}
              <span className="text-base font-semibold text-muted-foreground">{t('pricing.perMonth')}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t('pricing.pro.desc')}</p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>
                  <b>{settings.credits_pro_amount}</b> {t('pricing.monthlyCredits')}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {t('pricing.pro.f1')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {t('pricing.pro.f2')}
              </li>
            </ul>
            {isPro ? (
              <span className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-secondary/60 px-6 py-3 text-sm font-semibold text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                {t('pricing.pro.isPro')}
              </span>
            ) : requested ? (
              <span className="mt-6 inline-flex items-center justify-center rounded-full bg-secondary/60 px-6 py-3 text-sm font-semibold text-muted-foreground">
                {t('pricing.pro.requested')}
              </span>
            ) : (
              <button
                type="button"
                onClick={upgrade}
                disabled={busy}
                className="btn-sparkle mt-6 w-full"
              >
                <span className="dots_border" />
                <span className="text_button">{isAuthenticated ? t('pricing.pro.cta') : t('pricing.pro.login')}</span>
              </button>
            )}
          </motion.div>
        </TiltCard>
      </div>
    </section>
  );
}