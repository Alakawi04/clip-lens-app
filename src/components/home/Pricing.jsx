import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Zap, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Basket, Vault } from '@lucasmarkes/hairline/react';
import { invokeFunction } from '@/api/supabaseClient';
import { useSiteSettings } from '@/lib/SiteSettingsContext';
import { useAuth } from '@/lib/AuthContext';
import { useCredits } from '@/lib/CreditContext';
import { useI18n } from '@/lib/i18n';
import ScrollSection from './ScrollSection';
import RevealCard from './RevealCard';
import ScrollTypingText from './ScrollTypingText';
import { useFinePointer } from '@/hooks/use-pointer-capability';

// Plans section — rendered only while the credit system is enabled.
export default function Pricing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { isAuthenticated } = useAuth();
  const { enabled, plan } = useCredits();
  const finePointer = useFinePointer();
  const [busy, setBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);

  if (!enabled) return null;

  const isPro = plan === 'pro';

  const upgrade = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isPro) return;
    setBusy(true);
    setCheckoutError(false);
    try {
      const response = await invokeFunction('createCreditCheckout', {});
      const url = response?.data?.url;
      if (typeof url !== 'string' || !url.startsWith('https://checkout.stripe.com/')) {
        throw new Error('Checkout service returned an invalid URL.');
      }
      window.location.assign(url);
    } catch (error) {
      console.error('Could not start Pro checkout:', error);
      setCheckoutError(true);
    } finally {
      setBusy(false);
    }
  };

  const freeFeatures = [
    <><b>{settings.credits_signup}</b> {t('pricing.signupCredits')}</>,
    <>{settings.credits_cost} {Number(settings.credits_cost) === 1 ? t('pricing.credit') : t('pricing.credits')} {t('pricing.perLinkAnalysis')}</>,
    <>{settings.credits_upload_cost} {Number(settings.credits_upload_cost) === 1 ? t('pricing.credit') : t('pricing.credits')} {t('pricing.perUploadAnalysis')}</>,
    t('pricing.free.f1'),
    t('pricing.free.f2'),
    t('pricing.free.f3'),
  ];
  const proFeatures = [
    <><Zap className="pricing-feature-zap" /><span><b>{settings.credits_pro_amount}</b> {t('pricing.monthlyCredits')}</span></>,
    t('pricing.pro.f1'), t('pricing.pro.f2'), t('pricing.pro.f3'),
    t('pricing.pro.f4'), t('pricing.pro.f5'), t('pricing.pro.f6'),
  ];

  return (
    <ScrollSection id="pricing" className="pricing-ledger mx-auto max-w-[1440px] scroll-mt-24 px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
      <header className="pricing-ledger-heading">
        <div><span className="pricing-ledger-kicker">CL / 05 <i /></span><ScrollTypingText as="h2" text={t('pricing.title')} /></div>
        <ScrollTypingText as="p" text={t('pricing.subtitle')} delay={100} />
      </header>

      <div className="pricing-ledger-rows">
        <RevealCard variant="glideStart" className="pricing-ledger-row pricing-ledger-free">
          <div className="pricing-plan-intro">
            <span className="pricing-plan-index">01</span>
            <ScrollTypingText as="h3" text={t('pricing.free.name')} />
            <ScrollTypingText as="p" text={t('pricing.free.desc')} delay={100} />
            <div className="pricing-plan-price-row">
              <strong className="pricing-plan-price"><small>$</small>0</strong>
              {finePointer && <div className="pricing-plan-price-figure" aria-hidden="true"><Basket intensity={0.26} theme="auto" /></div>}
            </div>
          </div>
          <ul className="pricing-feature-list pricing-feature-free">
            {freeFeatures.map((feature, index) => <li key={index}><Check />{feature}</li>)}
          </ul>
          <Link to="/analyze" className="pricing-plan-cta pricing-plan-cta-free">{t('hero.cta')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
        </RevealCard>

        <RevealCard variant="focus" className="pricing-ledger-row pricing-ledger-pro">
          <div className="pricing-pro-light" aria-hidden="true" />
          <div className="pricing-plan-intro pricing-pro-intro">
            <span className="pricing-plan-index">02</span>
            <span className="pricing-popular"><Sparkles className="h-3 w-3" />{t('pricing.mostPopular')}</span>
            <ScrollTypingText as="h3" text={t('pricing.pro.name')} />
            <ScrollTypingText as="p" text={t('pricing.pro.desc')} delay={100} />
            <div className="pricing-plan-price-row">
              <strong className="pricing-plan-price"><small>$</small>{settings.credits_pro_price}<em>{t('pricing.perMonth')}</em></strong>
              {finePointer && <div className="pricing-plan-price-figure" aria-hidden="true"><Vault intensity={0.26} theme="auto" /></div>}
            </div>
          </div>
          <ul className="pricing-feature-list pricing-feature-pro">
            {proFeatures.map((feature, index) => <li key={index}>{index > 0 && <Check />}{feature}</li>)}
          </ul>
          <div className="pricing-cta-column">
            {isPro ? (
              <span className="pricing-plan-cta pricing-plan-cta-current"><Check className="h-4 w-4" />{t('pricing.pro.isPro')}</span>
            ) : (
              <button type="button" onClick={upgrade} disabled={busy} className="pricing-plan-cta pricing-plan-cta-pro">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{isAuthenticated ? t('pricing.pro.cta') : t('pricing.pro.login')}</span>
                {!busy && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
              </button>
            )}
            {checkoutError && <p role="alert" className="pricing-checkout-error">{t('pricing.checkoutError')}</p>}
          </div>
        </RevealCard>
      </div>
    </ScrollSection>
  );
}
