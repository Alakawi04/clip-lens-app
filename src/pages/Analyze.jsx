import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Youtube, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import UploadTab from '@/components/analyze/UploadTab';
import LinkTab from '@/components/analyze/LinkTab';
import { useI18n } from '@/lib/i18n';

export default function Analyze() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(params.get('mode') === 'review' ? 'link' : 'upload');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTab(params.get('mode') === 'review' ? 'link' : 'upload');
  }, [params]);

  const switchTab = (next) => {
    setTab(next);
    setParams(next === 'link' ? { mode: 'review' } : {}, { replace: true });
  };

  const handleStart = async ({ sourceType, sourceLabel, sourceUrl }) => {
    setSubmitting(true);
    try {
      let label = sourceLabel;
      let extra = {};
      // For YouTube links, fetch the video's public stats first so the
      // analysis is grounded in real numbers (views, likes, date…).
      if (sourceType === 'youtube' && sourceUrl) {
        try {
          const res = await base44.functions.invoke('fetchYouTubeStats', { url: sourceUrl });
          const s = res?.data;
          if (s && !s.error) {
            label = `YouTube · ${s.title}`;
            extra = {
              thumbnail_url: s.thumbnail_url || '',
              duration_seconds: s.duration_seconds || null,
              youtube_stats: {
                views: s.views,
                likes: s.likes,
                comments: s.comments,
                channel: s.channel || '',
                published_at: s.published_at || '',
              },
            };
          }
        } catch {
          // couldn't fetch stats — continue with the raw link
        }
      }
      const rec = await base44.entities.Analysis.create({
        source_type: sourceType,
        source_label: label,
        source_url: sourceUrl || '',
        status: 'uploading',
        progress: 0,
        ...extra,
      });
      navigate(`/progress/${rec.id}`);
    } catch {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: 'upload', label: t('add.tab.upload'), icon: Upload },
    { key: 'link', label: t('add.tab.link'), icon: Youtube },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
      <button
        onClick={() => navigate('/')}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('add.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('add.subtitle')}</p>
      </motion.div>

      {/* Tabs */}
      <div className="mt-7 inline-flex w-full rounded-full border border-border bg-card/60 p-1 shadow-soft">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              type="button"
              onClick={() => switchTab(tb.key)}
              className={`relative inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 -z-10 rounded-full brand-gradient shadow-soft"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="h-4 w-4" />
              {tb.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === 'upload' ? (
          <UploadTab onStart={handleStart} />
        ) : (
          <LinkTab onStart={handleStart} />
        )}
      </div>

      {submitting && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {tab === 'link' ? t('add.link.fetching') : t('common.loading')}
        </p>
      )}
    </div>
  );
}