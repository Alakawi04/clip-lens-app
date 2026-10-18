import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, FileText, LifeBuoy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const CONTENT = {
  en: {
    privacy: {
      icon: ShieldCheck,
      title: 'Privacy Policy',
      intro: 'How ClipLens handles your data — in plain language.',
      sections: [
        {
          h: 'What we store',
          p: [
            'When you run an analysis, ClipLens saves the source name (your file name or the YouTube link), the results, and the date, so you can return to them from History.',
            'Your account email is stored with your login.',
          ],
        },
        {
          h: 'Uploaded videos',
          p: ['Uploaded MP4 files are used to generate your analysis. They are not published or shared with other users.'],
        },
        {
          h: 'Your control',
          p: ['Your analyses belong to your account. You can delete any analysis at any time from the History page — deletion is permanent.'],
        },
        {
          h: 'No guarantees',
          p: ['ClipLens does not guarantee views or watch time.'],
        },
      ],
    },
    terms: {
      icon: FileText,
      title: 'Terms of Service',
      intro: 'The basics of using ClipLens.',
      sections: [
        {
          h: 'The service',
          p: ['ClipLens gives feedback and suggestions on how your video is presented. Suggestions are recommendations, not guarantees of performance.'],
        },
        {
          h: 'Your content',
          p: ['Your videos and their content remain yours.'],
        },
        {
          h: 'Fair use',
          p: ['Use ClipLens only on content you have the right to analyze, and follow YouTube\'s terms when reviewing published videos.'],
        },
        {
          h: 'No guarantees',
          p: ['ClipLens does not guarantee views, clicks, or watch time.'],
        },
      ],
    },
    help: {
      icon: LifeBuoy,
      title: 'Help',
      intro: 'Quick answers to get you moving.',
      sections: [
        {
          h: 'Getting started',
          p: ['Create a free account, then open Analyze and choose: upload an MP4, or paste a public YouTube link.'],
        },
        {
          h: 'Upload limits',
          p: ['MP4 files up to 500 MB, up to 30 minutes long.'],
        },
        {
          h: 'YouTube links',
          p: ['Any public youtube.com or youtu.be link works.'],
        },
        {
          h: 'Your results',
          p: ['Every finished analysis is saved to History automatically — open it anytime to see the score, title ideas, and recommendations.'],
        },
        {
          h: 'Deleting an analysis',
          p: ['Open History and use the Delete button on any analysis to remove it permanently.'],
        },
        {
          h: 'Something went wrong?',
          p: ['Check your connection and try again. If an analysis fails, use Retry on its screen.'],
        },
      ],
    },
  },
  ar: {
    privacy: {
      icon: ShieldCheck,
      title: 'سياسة الخصوصية',
      intro: 'كيف يتعامل ClipLens مع بياناتك — بلغة واضحة.',
      sections: [
        {
          h: 'ما الذي نخزّنه',
          p: [
            'عند تشغيل أي تحليل، يحفظ ClipLens اسم المصدر (اسم ملفك أو رابط يوتيوب)، والنتائج، والتاريخ، لتتمكن من العودة إليها من صفحة السجل.',
            'يُخزَّن بريد حسابك مع بيانات تسجيل دخولك.',
          ],
        },
        {
          h: 'الفيديوهات المرفوعة',
          p: ['تُستخدم ملفات MP4 المرفوعة لتوليد نتيجة التحليل فقط، ولا تُنشر أو تُشارك مع أي مستخدم آخر.'],
        },
        {
          h: 'تحكمك الكامل',
          p: ['تحليلاتك ملك لحسابك، ويمكنك حذف أي تحليل في أي وقت من صفحة السجل — والحذف نهائي.'],
        },
        {
          h: 'لا ضمانات',
          p: ['ClipLens لا يضمن عدد المشاهدات أو مدة المشاهدة.'],
        },
      ],
    },
    terms: {
      icon: FileText,
      title: 'شروط الاستخدام',
      intro: 'أساسيات استخدام ClipLens.',
      sections: [
        {
          h: 'الخدمة',
          p: ['يقدّم ClipLens ملاحظات واقتراحات حول طريقة عرض فيديوك. الاقتراحات توصيات وليست ضمانات لأي نتائج.'],
        },
        {
          h: 'محتواك',
          p: ['فيديوهاتك ومحتواها تبقى ملكك بالكامل.'],
        },
        {
          h: 'الاستخدام العادل',
          p: ['استخدم ClipLens فقط على محتوى تملك حق تحليله، والتزم بشروط يوتيوب عند مراجعة فيديوهات منشورة.'],
        },
        {
          h: 'لا ضمانات',
          p: ['ClipLens لا يضمن المشاهدات أو النقرات أو مدة المشاهدة.'],
        },
      ],
    },
    help: {
      icon: LifeBuoy,
      title: 'المساعدة',
      intro: 'إجابات سريعة لتبدأ مباشرة.',
      sections: [
        {
          h: 'البداية',
          p: ['أنشئ حسابًا مجانيًا، ثم افتح صفحة التحليل واختر: رفع ملف MP4، أو لصق رابط يوتيوب عام.'],
        },
        {
          h: 'حدود الرفع',
          p: ['ملفات MP4 حتى 500 ميغابايت، وبمدة لا تتجاوز 30 دقيقة.'],
        },
        {
          h: 'روابط يوتيوب',
          p: ['يعمل أي رابط عام من youtube.com أو youtu.be.'],
        },
        {
          h: 'نتائجك',
          p: ['يُحفظ كل تحليل مكتمل في السجل تلقائيًا — افتحه في أي وقت لرؤية الدرجة وأفكار العناوين والتوصيات.'],
        },
        {
          h: 'حذف تحليل',
          p: ['افتح السجل واستخدم زر الحذف على أي تحليل لإزالته نهائيًا.'],
        },
        {
          h:'واجهت مشكلة؟',
          p: ['تحقق من اتصالك وحاول مجددًا. وإذا فشل التحليل، استخدم زر إعادة المحاولة من شاشته.'],
        },
      ],
    },
  },
};

export default function Info({ kind = 'privacy' }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const c = (CONTENT[lang] || CONTENT.en)[kind] || CONTENT.en.privacy;
  const Icon = c.icon;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {(CONTENT[lang] || CONTENT.en).help.sections ? null : null}
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl brand-gradient text-white shadow-soft">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{c.title}</h1>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">{c.intro}</p>
      </motion.div>

      <div className="mt-8 space-y-4">
        {c.sections.map((s, i) => (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <h2 className="font-display text-base font-bold">{s.h}</h2>
            <div className="mt-2 space-y-1.5">
              {s.p.map((para, j) => (
                <p key={j} className="text-sm leading-relaxed text-muted-foreground">{para}</p>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/" className="font-semibold text-primary hover:underline">
          {(CONTENT[lang] || CONTENT.en).help.title === 'Help' ? 'Back to home' : 'عودة للرئيسية'}
        </Link>
      </p>
    </div>
  );
}