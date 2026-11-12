import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, LifeBuoy, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const CONTENT = {
  en: {
    privacy: {
      icon: ShieldCheck,
      title: 'Privacy Policy',
      intro: 'A clear guide to what ClipLens uses, what it saves, and what you can remove.',
      sections: [
        { h: 'Information saved with an analysis', p: [
          'Your account email is used for sign-in. ClipLens saves your YouTube link, tool inputs, generated results, status, and date in your account. The review, title, and thumbnail tools reuse one record for the same video. Row-level access controls keep analysis records visible only to their owner. Open History from your profile menu.',
        ] },
        { h: 'When you review a YouTube link', p: [
          'ClipLens sends the YouTube URL, its public thumbnail, the YouTube Studio metrics, and any context, creator problem description, or optional images you provide to Manus. Manus attempts to inspect the public video and transcript; access can vary by video. ClipLens does not publish changes to your channel.',
        ] },
        { h: 'Thumbnail generation and storage', p: [
          'Manus generates requested thumbnails. Temporary frame references are sent to Manus and removed from temporary storage after processing. Generated thumbnails are saved in public image storage; anyone with the image URL may be able to view them.',
        ] },
        { h: 'Third-party services', p: [
          'ClipLens uses Supabase for sign-in, analysis records, and storage. Manus is the analysis service used for video analysis, title suggestions, and thumbnail generation. Information needed for these tasks is sent to Manus and is subject to its privacy terms.',
        ] },
        { h: 'Your choices and deletion', p: [
          'You can remove an analysis from History in your profile. This removes its report from your account. A generated thumbnail is a separate public image file and may remain available at its URL after the report is deleted. Avoid submitting confidential or sensitive material.',
        ] },
      ],
    },
    terms: {
      icon: FileText,
      title: 'Terms of Service',
      intro: 'Please use ClipLens with content and information you are allowed to share.',
      sections: [
        { h: 'What ClipLens does', p: [
          'ClipLens analyzes public YouTube videos and details you enter. Its scores, explanations, title ideas, and thumbnails are suggestions to help with your decisions, not professional advice or a promise of performance.',
        ] },
        { h: 'Your content and permissions', p: [
          'You keep ownership of the content you provide. You must have the rights and permissions needed to analyze a YouTube video or submit reference images and YouTube Studio data. Do not submit material that violates another person’s rights or privacy.',
        ] },
        { h: 'Use accurate information', p: [
          'You are responsible for the context and performance metrics you enter. ClipLens may not be able to verify private Studio metrics, and its analysis can be limited by the information available.',
        ] },
        { h: 'Credits and thumbnail generation', p: [
          'Analyses and thumbnail generation may use ClipLens credits and processing capacity. The current ClipLens cost is shown before you start. Thumbnail generation can fail if the service is not configured, has no available usage, or is busy.',
        ] },
        { h: 'No promised results', p: [
          'ClipLens cannot guarantee views, clicks, watch time, audience growth, or the accuracy of every generated suggestion. You decide whether to use, edit, or publish any recommendation.',
        ] },
        { h: 'Respect platform rules', p: [
          'Use ClipLens lawfully and follow YouTube’s terms when reviewing videos from YouTube. ClipLens does not edit, publish, or manage your channel.',
        ] },
      ],
    },
    help: {
      icon: LifeBuoy,
      title: 'Help',
      intro: 'Follow these steps to get a useful report and find it again later.',
      sections: [
        { h: '1. Choose a YouTube tool', p: [
          'Use the navigation bar to open Video evaluation, Title & description, or Thumbnail. Each tool accepts a public YouTube link and has its own fields.',
        ] },
        { h: '2. Review a YouTube video', p: [
          'For Video evaluation, paste a public YouTube link and add any impressions, click-through rate, views, average view duration, video duration, traffic sources, or comparable channel metrics you have from YouTube Studio. Leave unknown values blank; the report will state when its evidence is limited.',
        ] },
        { h: '3. Read your report', p: [
          'Each completed tool is saved to your private History. Open it from your profile menu. The same video link reuses its existing record, so the next tool adds its result without creating another history entry.',
        ] },
        { h: '4. Generate or download a thumbnail', p: [
          'Use the Thumbnail tool to describe the style, add optional reference images, and create a new image. You can download the result from its results page.',
        ] },
        { h: 'Find or delete a past analysis', p: [
          'Open the account menu in the profile area of the navigation bar and choose History to revisit or delete a report. Generated thumbnail files are stored separately and may remain accessible by their image URL.',
        ] },
        { h: 'If something fails', p: [
          'Check your connection and make sure the video link and required fields are valid. If a report shows a failed step, use Retry on that screen. Thumbnail generation may be temporarily unavailable when the image service is not configured or busy.',
        ] },
      ],
    },
  },
  ar: {
    privacy: {
      icon: ShieldCheck,
      title: 'سياسة الخصوصية',
      intro: 'شرح واضح لما يستخدمه ClipLens وما يحفظه والبيانات التي يمكنك حذفها.',
      sections: [
        { h: 'المعلومات المحفوظة مع التحليل', p: [
          'يُستخدم بريد حسابك لتسجيل الدخول. ويحفظ ClipLens رابط يوتيوب ومدخلات الأدوات والنتائج والحالة والتاريخ في حسابك. تستخدم أدوات التقييم والعنوان والصورة سجلًا واحدًا للرابط نفسه. تمنع صلاحيات قاعدة البيانات المستخدمين الآخرين من رؤية سجلاتك. افتح السجل من قائمة الملف الشخصي.',
        ] },
        { h: 'عند مراجعة رابط يوتيوب', p: [
          'يرسل ClipLens رابط يوتيوب وصورته المصغّرة العامة وإحصاءات YouTube Studio والسياق ووصف المشكلة أو الصور الاختيارية التي تضيفها إلى Manus. يحاول Manus فحص الفيديو العام وتفريغه النصي، وقد يختلف الوصول حسب الفيديو. لا ينشر ClipLens أي تغييرات على قناتك.',
        ] },
        { h: 'توليد الصور المصغّرة وحفظها', p: [
          'يولّد Manus الصور المصغّرة المطلوبة. تُرسل إليه صور الإطارات المرجعية ثم تُحذف من التخزين المؤقت بعد المعالجة. تُحفظ الصور المولّدة في مساحة صور عامة، لذلك قد يتمكن أي شخص لديه رابط الصورة من مشاهدتها.',
        ] },
        { h: 'الخدمات الخارجية', p: [
          'يستخدم ClipLens خدمة Supabase لتسجيل الدخول وسجلات التحليل والتخزين. ويستخدم Manus وحده لتحليل الفيديو واقتراح العناوين وتوليد الصور. تُرسل المعلومات اللازمة لهذه المهام إلى Manus وتخضع لسياسة الخصوصية الخاصة به.',
        ] },
        { h: 'خياراتك وحذف البيانات', p: [
          'يمكنك حذف التحليل من السجل الموجود في قائمة الملف الشخصي. يزيل ذلك التقرير من حسابك. أما الصورة المصغّرة فهي ملف عام مستقل وقد يبقى رابطها متاحًا بعد حذف التقرير. تجنّب إدخال معلومات سرية أو حساسة.',
        ] },
      ],
    },
    terms: {
      icon: FileText,
      title: 'شروط الاستخدام',
      intro: 'استخدم ClipLens فقط مع المحتوى والمعلومات التي يحق لك مشاركتها.',
      sections: [
        { h: 'ما الذي يقدمه ClipLens', p: [
          'يحلل ClipLens فيديوهات يوتيوب العامة وملاحظاتك. الدرجات والتفسيرات وأفكار العناوين والصور المصغّرة اقتراحات تساعدك على اتخاذ القرار، وليست استشارة مهنية أو وعدًا بتحقيق نتائج.',
        ] },
        { h: 'المحتوى والصلاحيات', p: [
          'تبقى ملكية المحتوى الذي تقدمه لك. عليك امتلاك الحقوق والصلاحيات اللازمة لمراجعة فيديو يوتيوب أو إرسال الصور المرجعية وبيانات YouTube Studio. لا ترسل محتوى ينتهك حقوق الآخرين أو خصوصيتهم.',
        ] },
        { h: 'أدخل معلومات دقيقة', p: [
          'أنت مسؤول عن سياق الفيديو ومقاييس الأداء التي تدخلها. قد لا يستطيع ClipLens التحقق من إحصاءات Studio الخاصة، وقد تكون النتيجة محدودة بالمعلومات المتوفرة.',
        ] },
        { h: 'الرصيد وتوليد الصور المصغّرة', p: [
          'قد تستهلك التحليلات وتوليد الصور رصيد ClipLens وسعة المعالجة. تظهر تكلفة ClipLens قبل البدء. وقد يتعذر توليد الصور إذا لم تكن الخدمة مهيأة أو لم تتوفر سعة كافية أو كانت مشغولة.',
        ] },
        { h: 'لا توجد نتائج مضمونة', p: [
          'لا يضمن ClipLens المشاهدات أو النقرات أو مدة المشاهدة أو نمو الجمهور أو دقة كل اقتراح مولّد. أنت تقرر استخدام أي اقتراح أو تعديله أو نشره.',
        ] },
        { h: 'الالتزام بقواعد المنصات', p: [
          'استخدم ClipLens بطريقة نظامية والتزم بشروط يوتيوب عند مراجعة فيديوهاته. لا يعدّل ClipLens قناتك ولا ينشر عليها محتوى.',
        ] },
      ],
    },
    help: {
      icon: LifeBuoy,
      title: 'المساعدة',
      intro: 'اتبع الخطوات لتصل إلى تقرير مفيد وتعود إليه لاحقًا.',
      sections: [
        { h: '١. اختر أداة يوتيوب', p: [
          'استخدم شريط التنقل لفتح تقييم الفيديو أو العنوان والوصف أو الصورة المصغّرة. تقبل كل أداة رابط يوتيوب عامًا ولها حقولها الخاصة.',
        ] },
        { h: '٢. راجع فيديو يوتيوب', p: [
          'في تقييم الفيديو، الصق رابطًا عامًا وأدخل ما يتوفر لديك من مرات الظهور ونسبة النقر والمشاهدات ومتوسط مدة المشاهدة ومدة الفيديو ومصادر الزيارات ومقاييس فيديوهات قناتك المشابهة من YouTube Studio. اترك ما لا تعرفه فارغًا؛ وسيوضح التقرير حدود الأدلة المتاحة.',
        ] },
        { h: '٣. اقرأ التقرير', p: [
          'يُحفظ كل عمل في سجل خاص واحد للفيديو. افتحه من قائمة الملف الشخصي. عند استخدام الرابط نفسه في أداة أخرى، تُضاف النتيجة إلى السجل نفسه بلا إدخال نسخة جديدة.',
        ] },
        { h: '٤. ولّد صورة مصغّرة أو نزّلها', p: [
          'استخدم أداة الصورة المصغّرة لوصف الأسلوب وإضافة صور مرجعية اختيارية وإنشاء صورة جديدة، ثم حمّل النتيجة من صفحة النتائج.',
        ] },
        { h: 'العثور على تحليل سابق أو حذفه', p: [
          'افتح قائمة الملف الشخصي في شريط التنقل ثم اختر السجل للعودة إلى تقرير أو حذفه. تُحفظ الصور المولّدة كملفات مستقلة وقد تظل متاحة عبر رابطها.',
        ] },
        { h: 'إذا تعذّر إكمال خطوة', p: [
          'تحقق من اتصالك وصحة رابط الفيديو والحقول المطلوبة. إذا ظهرت مرحلة فاشلة في التقرير، استخدم زر إعادة المحاولة. قد يتوقف توليد الصور مؤقتًا إذا لم تكن خدمة الصور مهيأة أو كانت مشغولة.',
        ] },
      ],
    },
  },
};

export default function Info({ kind = 'privacy' }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const content = (CONTENT[lang] || CONTENT.en)[kind] || CONTENT.en.privacy;
  const Icon = content.icon;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/45 px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('common.back')}
      </button>

      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/55 p-5 shadow-soft sm:p-8">
        <span className="absolute -end-10 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl brand-gradient text-white shadow-soft">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{content.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{content.intro}</p>
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4">
        {content.sections.map((section, index) => (
          <section key={section.h} className="relative rounded-2xl border border-border/80 bg-card/50 p-4 shadow-soft sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/[0.07] font-mono text-[10px] font-bold text-primary" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-sm font-bold leading-relaxed text-foreground sm:text-base">{section.h}</h2>
                <div className="mt-1.5 space-y-2">
                  {section.p.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="text-sm leading-7 text-muted-foreground">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/" className="font-semibold text-primary hover:underline">{t('results.backHome')}</Link>
      </p>
    </div>
  );
}
