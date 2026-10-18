// Mock analysis result generator.
// This is the "activatable structure": today it returns realistic sample data;
// later, replace `generateMockResult` with a real AI call (backend function)
// that fills the same shape. The Analysis entity + UI already expect this shape.

export const SAMPLE_THUMBNAILS = [
  'https://images.unsplash.com/photo-1598899134739-24c46f8b8f23?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1596704017254-930121d89203?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1493612276216-ee392551f8a4?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1280&q=80',
];

const TITLE_BANK = [
  {
    title: 'I Tried This for 30 Days — Here’s What Actually Happened',
    recommended: true,
    reason: 'Curiosity + a clear promise. It sets an expectation the video can deliver.',
  },
  {
    title: 'The Simple Habit That Changed My Mornings',
    recommended: false,
    reason: 'Benefit-led and concise. Works well if the video is practical and personal.',
  },
  {
    title: 'Why Everyone Is Talking About This (And If It’s Worth It)',
    recommended: false,
    reason: 'Taps into trend and skepticism. Strong when the topic is genuinely debated.',
  },
  {
    title: 'A Beginner’s Guide to Getting Started Today',
    recommended: false,
    reason: 'Direct and searchable. Good for evergreen, how-to content.',
  },
];

const IMPROVEMENTS = [
  { key: 'subject', title: 'improve.subject', description: 'improve.subject.desc' },
  { key: 'text', title: 'improve.text', description: 'improve.text.desc' },
  { key: 'contrast', title: 'improve.contrast', description: 'improve.contrast.desc' },
  { key: 'mobile', title: 'improve.mobile', description: 'improve.mobile.desc' },
  { key: 'consistency', title: 'improve.consistency', description: 'improve.consistency.desc' },
];

const SUMMARIES = {
  en: [
    'Your video has a clear subject, but the current framing and text could be sharper. The suggested thumbnail lifts the focal point and adds contrast for small screens.',
    'Strong content, but the presentation undersells it. A tighter title and a bolder thumbnail would help viewers grasp the value faster.',
    'The footage is engaging. The main opportunity is consistency between the title promise and the thumbnail so viewers trust the click.',
  ],
  ar: [
    'فيديوك واضح الموضوع، لكن التأطير والنص الحالي يمكن أن يكونا أوضح. الصورة المقترحة ترفع نقطة التركيز وتضيف تباينًا للشاشات الصغيرة.',
    'محتوى قوي، لكن العرض لا يمنحه حقه. عنوان أضيق وصورة أجرأ يساعدان المشاهد على إدراك القيمة أسرع.',
    'اللقطات جذابة. الفرصة الرئيسية هي الاتساق بين وعد العنوان والصورة ليثق المشاهد بالنقرة.',
  ],
};

export function pickThumbnail(seed) {
  const idx = Math.abs(String(seed || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % SAMPLE_THUMBNAILS.length;
  return SAMPLE_THUMBNAILS[idx];
}

// 210 → "3:30"
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Returns the full result payload (score, summary, thumbnail, titles, improvements).
// When YouTube stats are available (public and/or from the creator's Studio
// dashboard), the result is grounded in them: engagement, CTR and retention
// nudge the score, lead the summary, and point at the real problem.
export function generateMockResult({ sourceType, sourceLabel, stats, durationSeconds }) {
  const lang = (typeof window !== 'undefined' && document.documentElement.lang === 'ar') ? 'ar' : 'en';
  let score = 62 + Math.floor(Math.random() * 30); // 62-91
  const summaries = SUMMARIES[lang];
  let summary = summaries[Math.floor(Math.random() * summaries.length)];

  if (stats) {
    const fmt = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'en-US').format(n);
    const clamp = (n) => Math.max(35, Math.min(97, n));
    const parts = [];

    if (stats.views > 0 && stats.likes != null) {
      const likeRate = (stats.likes / stats.views) * 100;
      score = clamp(score + Math.round((likeRate - 3) * 2));
      parts.push(lang === 'ar'
        ? `${fmt(stats.views)} مشاهدة و${fmt(stats.likes)} إعجابًا (نسبة إعجاب ${likeRate.toFixed(1)}٪).`
        : `${fmt(stats.views)} views and ${fmt(stats.likes)} likes (${likeRate.toFixed(1)}% like rate).`);
    }

    if (stats.ctr != null) {
      score = clamp(score + Math.round((stats.ctr - 4) * 3));
      parts.push(lang === 'ar'
        ? `نسبة النقر ${stats.ctr.toFixed(1)}٪${stats.impressions != null ? ` من ${fmt(stats.impressions)} ظهور` : ''}.`
        : `A ${stats.ctr.toFixed(1)}% click-through rate${stats.impressions != null ? ` on ${fmt(stats.impressions)} impressions` : ''}.`);
      if (stats.ctr < 4) {
        parts.push(lang === 'ar'
          ? 'النقرة ضعيفة: الصورة المصغّرة والعنوان لا يجذبان بما يكفي — هذه أول أولوية للتحسين.'
          : 'Clicks are weak: the thumbnail and title are not pulling viewers in — this is the first thing to fix.');
      }
    }

    if (stats.avg_view_duration != null && durationSeconds > 0) {
      const retention = Math.min(100, (stats.avg_view_duration / durationSeconds) * 100);
      parts.push(lang === 'ar'
        ? `متوسط المشاهدة ${formatDuration(stats.avg_view_duration)} من ${formatDuration(durationSeconds)} (${retention.toFixed(0)}٪).`
        : `Average view duration ${formatDuration(stats.avg_view_duration)} of ${formatDuration(durationSeconds)} (${retention.toFixed(0)}%).`);
      if (retention < 30) {
        parts.push(lang === 'ar'
          ? 'الاحتفاظ منخفض: المشاهدون يغادرون مبكرًا، فراجع بداية الفيديو وإيقاعه.'
          : 'Retention is low: viewers drop off early — revisit your opening and pacing.');
      }
    }

    if (parts.length) summary = parts.join(' ') + ' ' + summary;
  }

  return {
    score,
    summary,
    thumbnail_url: pickThumbnail(sourceLabel || sourceType),
    title_suggestions: TITLE_BANK,
    improvements: IMPROVEMENTS,
  };
}

// Stage definitions (key + label key + desc key) used by the progress screen.
export const ANALYSIS_STAGES = [
  { key: 'uploading', labelKey: 'progress.stage.1', descKey: 'progress.stage.1.desc' },
  { key: 'scenes', labelKey: 'progress.stage.2', descKey: 'progress.stage.2.desc' },
  { key: 'titles', labelKey: 'progress.stage.3', descKey: 'progress.stage.3.desc' },
  { key: 'preparing', labelKey: 'progress.stage.4', descKey: 'progress.stage.4.desc' },
];