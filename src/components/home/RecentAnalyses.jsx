import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Clapperboard, Clock, FileVideo, Play, Sparkles, Youtube } from 'lucide-react';
import { Sieve } from '@lucasmarkes/hairline/react';
import { backend } from '@/api/supabaseClient';
import StatusBadge from '@/components/StatusBadge';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n';
import ScrollSection from './ScrollSection';
import RevealCard from './RevealCard';
import ScrollTypingText from './ScrollTypingText';
import { useFinePointer } from '@/hooks/use-pointer-capability';

const ENTRANCES = ['glideStart', 'settle', 'glideEnd', 'lift'];

function formatAnalysisDate(value, lang) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { month: 'short', day: 'numeric' }).format(date);
}

export default function RecentAnalyses() {
  const finePointer = useFinePointer();
  const { t, lang } = useI18n();
  const [items, setItems] = useState(null); // null = loading, [] = empty

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const page = await backend.data.Analysis.filter(
          {},
          { sort: '-created_date', limit: 4, fields: ['source_type', 'source_label', 'status', 'score', 'thumbnail_url', 'created_date'] }
        );
        if (active) setItems(page.items || []);
      } catch {
        if (active) setItems([]);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <ScrollSection className="recent-log mx-auto max-w-[1440px] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
      <header className="recent-log-heading">
        <div><span className="recent-log-kicker"><i /><Clock className="h-3.5 w-3.5" />CL / 06</span><ScrollTypingText as="h2" text={t('recent.title')} /><ScrollTypingText as="p" text={t('recent.subtitle')} delay={100} /></div>
        {items?.length > 0 && <Link to="/history" className="recent-log-viewall">{t('recent.viewAll')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>}
      </header>

      {items === null ? (
        <div className="recent-log-list" aria-label={t('common.loading')}>
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="recent-log-skeleton"><span /><i /><b /><em /></div>)}
        </div>
      ) : items.length === 0 ? (
        <div className="recent-log-empty">
          {finePointer && <Sieve className="recent-empty-figure" intensity={0.32} theme="auto" aria-hidden="true" />}
          <div><ScrollTypingText as="p" text={t('recent.empty')} /><Link to="/analyze"><Sparkles className="h-4 w-4" />{t('recent.emptyCta')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link></div>
        </div>
      ) : (
        <div className="recent-log-list">
          {items.map((analysis, index) => (
            <RevealCard key={analysis.id} delay={index * 0.07} variant={ENTRANCES[index % ENTRANCES.length]}>
              <Link to={analysis.status === 'completed' ? `/results/${analysis.id}` : `/progress/${analysis.id}`} className="recent-log-row group">
                <div className="recent-log-thumb">
                  {analysis.thumbnail_url ? (
                    <>
                      <Image src={analysis.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="recent-thumb-play" aria-hidden="true"><Play className="h-4 w-4 fill-current" /></span>
                    </>
                  ) : (
                    <span className={`recent-thumb-placeholder ${analysis.source_type === 'youtube' ? 'is-youtube' : 'is-upload'}`} aria-hidden="true">
                      <i className="recent-thumb-orbit"><Clapperboard className="h-6 w-6" /></i>
                      <span className="recent-thumb-bars"><i /><i /><i /><i /><i /><i /><i /></span>
                      <b>CLIP LENS</b>
                    </span>
                  )}
                </div>
                <div className="recent-log-main">
                  <div className="recent-log-meta-line">
                    <span className="recent-log-type">
                      {analysis.source_type === 'youtube' ? <Youtube className="h-3.5 w-3.5" aria-hidden="true" /> : <FileVideo className="h-3.5 w-3.5" aria-hidden="true" />}
                      {analysis.source_type === 'youtube' ? t('recent.type.youtube') : t('recent.type.upload')}
                    </span>
                    {formatAnalysisDate(analysis.created_date, lang) && <time className="recent-log-date" dateTime={analysis.created_date}>{formatAnalysisDate(analysis.created_date, lang)}</time>}
                  </div>
                  <ScrollTypingText as="p" text={analysis.source_label || '—'} />
                  <div className="recent-log-facts">
                    <div className="recent-log-state"><StatusBadge status={analysis.status} /></div>
                    {analysis.score != null && analysis.status === 'completed' && <span className="recent-log-score"><b>{analysis.score}</b><small>{t('recent.score')}</small></span>}
                  </div>
                </div>
                <ArrowUpRight className="recent-log-arrow h-5 w-5" aria-hidden="true" />
              </Link>
            </RevealCard>
          ))}
        </div>
      )}
    </ScrollSection>
  );
}
