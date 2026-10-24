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
          'Your account email is used for sign-in. For each analysis, ClipLens saves its source (file name or YouTube link), the results, status, date, and any context, transcript, or YouTube Studio numbers you entered so you can reopen the report from History.',
        ] },
        { h: 'When you upload an MP4', p: [
          'The full video file is read in your browser. ClipLens samples six still frames; the video itself is not uploaded by the analysis form. Those frames, your optional video context, and any transcript you provide are sent to the analysis service. The sampled frames are kept in this browser for up to 24 hours to support thumbnail generation, then expire automatically.',
        ] },
        { h: 'When you review a YouTube link', p: [
          'ClipLens uses public video details and thumbnail imagery, along with the YouTube Studio metrics and optional images you choose to provide. These inputs are sent to the analysis service to prepare your report. ClipLens does not publish changes to your channel.',
        ] },
        { h: 'Thumbnail generation and storage', p: [
          'If you generate a thumbnail, a temporary reference image may be sent through ClipLens storage to the image service and is removed after the request when cleanup succeeds. Generated thumbnails are saved in public image storage; anyone with the image URL may be able to view them.',
        ] },
        { h: 'Third-party services', p: [
          'ClipLens uses Supabase for sign-in, analysis records, and storage, and external AI services to analyze content or generate images. Information needed for a request is sent to the relevant service and is subject to that provider’s own privacy terms.',
        ] },
        { h: 'Your choices and deletion', p: [
          'You can remove an analysis from History. This removes its report from your account and clears the saved video frames from this browser. A generated thumbnail is a separate public image file and may remain available at its URL after the report is deleted. Avoid submitting confidential or sensitive material.',
        ] },
      ],
    },
    terms: {
      icon: FileText,
      title: 'Terms of Service',
      intro: 'Please use ClipLens with content and information you are allowed to share.',
      sections: [
        { h: 'What ClipLens does', p: [
          'ClipLens analyzes supplied video frames, public video information, and details you enter. Its scores, explanations, title ideas, and thumbnail directions are suggestions to help with your decisions, not professional advice or a promise of performance.',
        ] },
        { h: 'Your content and permissions', p: [
          'You keep ownership of the content you provide. You must have the rights and permissions needed to analyze or submit that content, including any images, transcripts, and YouTube Studio data. Do not upload material that violates another person’s rights or privacy.',
        ] },
        { h: 'Use accurate information', p: [
          'You are responsible for the context, transcript, and performance metrics you enter. ClipLens may not be able to verify private Studio metrics, and its analysis can be limited by the frames and information available.',
        ] },
        { h: 'Credits and image generation', p: [
          'Some analyses or image generations may use credits or a connected image provider balance. The current cost is shown in the app before you start. Image generation can be unavailable or fail if the provider is not configured, has no balance, or is busy.',
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
        { h: '1. Choose how to start', p: [
          'Open Analyze Video. Choose Upload MP4 for a file on your device, or Paste YouTube link to review a public video.',
        ] },
        { h: '2. Upload an MP4', p: [
          'Choose an MP4 up to 500 MB and 30 minutes. Wait while ClipLens checks the video and samples six frames. Add a short description of the video idea and, if you want feedback on spoken content, paste a transcript. Choose the language for the suggested titles, then start the analysis.',
        ] },
        { h: '3. Review a YouTube video', p: [
          'Paste a public YouTube link. ClipLens fills in the public title and thumbnail where available. Choose the title language, then enter the requested impressions, click-through rate, views, average view duration, video duration, and traffic sources from YouTube Studio. Use NA only when a requested value is unavailable. Add optional screenshots or context if they help explain the results.',
        ] },
        { h: '4. Read your report', p: [
          'The finished report is saved in History. Open it to see the score, explanation, recommendations, title ideas, and thumbnail guidance. For MP4 uploads, the score is based on the video idea, any transcript, and six sampled frames; it does not evaluate audio when no transcript is supplied.',
        ] },
        { h: '5. Generate or download a thumbnail', p: [
          'Use Generate another version on the report to make a new thumbnail. This uses the connected image service and may incur its cost or use its balance. You can download the result from the same panel.',
        ] },
        { h: 'Find or delete a past analysis', p: [
          'Open History to revisit an analysis or remove its report. Deleting it also clears the locally saved video frames for that analysis. Generated thumbnail files are stored separately and may remain accessible by their image URL.',
        ] },
        { h: 'If something fails', p: [
          'Check your connection and make sure the file, link, and required fields are valid. If a report shows a failed step, use Retry on that screen. Thumbnail generation also requires an active image provider and available provider balance.',
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
          'يُستخدم بريد حسابك لتسجيل الدخول. ويحفظ ClipLens مع كل تحليل مصدره، مثل اسم الملف أو رابط يوتيوب، والنتائج والحالة والتاريخ، إضافة إلى السياق أو التفريغ النصي أو أرقام YouTube Studio التي أدخلتها، حتى تتمكن من فتح التقرير من السجل.',
        ] },
        { h: 'عند رفع ملف MP4', p: [
          'يُقرأ ملف الفيديو الكامل داخل متصفحك. يختار ClipLens ست لقطات ثابتة؛ ولا ترفع صفحة التحليل ملف الفيديو نفسه. تُرسل هذه اللقطات وسياق الفيديو الاختياري وأي تفريغ نصي تضيفه إلى خدمة التحليل. تُحفظ اللقطات في هذا المتصفح لمدة تصل إلى 24 ساعة لتسهيل توليد صورة مصغّرة، ثم تنتهي صلاحيتها تلقائيًا.',
        ] },
        { h: 'عند مراجعة رابط يوتيوب', p: [
          'يستخدم ClipLens معلومات الفيديو وصورته المصغّرة المتاحتين للعامة، مع إحصاءات YouTube Studio والصور الاختيارية التي تختار إضافتها. تُرسل هذه المدخلات إلى خدمة التحليل لإعداد التقرير. لا ينشر ClipLens أي تغييرات على قناتك.',
        ] },
        { h: 'توليد الصور المصغّرة وحفظها', p: [
          'عند توليد صورة مصغّرة، قد تُرسل صورة مرجعية مؤقتة عبر مساحة تخزين ClipLens إلى خدمة الصور، وتُحذف بعد الطلب عند نجاح التنظيف. تُحفظ الصور المولّدة في مساحة صور عامة، لذلك قد يتمكن أي شخص لديه رابط الصورة من مشاهدتها.',
        ] },
        { h: 'الخدمات الخارجية', p: [
          'يستخدم ClipLens خدمة Supabase لتسجيل الدخول وسجلات التحليل والتخزين، وخدمات ذكاء اصطناعي خارجية لتحليل المحتوى أو توليد الصور. تُرسل المعلومات اللازمة للطلب إلى الخدمة المعنية وتخضع لشروط الخصوصية الخاصة بها.',
        ] },
        { h: 'خياراتك وحذف البيانات', p: [
          'يمكنك حذف التحليل من صفحة السجل، وهذا يزيل تقريره من حسابك ويمسح لقطات الفيديو المحفوظة محليًا في هذا المتصفح. أما الصورة المصغّرة المولّدة فهي ملف عام مستقل وقد يبقى رابطها متاحًا بعد حذف التقرير. تجنّب إدخال معلومات سرية أو حساسة.',
        ] },
      ],
    },
    terms: {
      icon: FileText,
      title: 'شروط الاستخدام',
      intro: 'استخدم ClipLens فقط مع المحتوى والمعلومات التي يحق لك مشاركتها.',
      sections: [
        { h: 'ما الذي يقدمه ClipLens', p: [
          'يحلل ClipLens لقطات الفيديو والمعلومات العامة وملاحظاتك. الدرجات والتفسيرات وأفكار العناوين وتوجيهات الصور اقتراحات تساعدك على اتخاذ القرار، وليست استشارة مهنية أو وعدًا بتحقيق نتائج.',
        ] },
        { h: 'المحتوى والصلاحيات', p: [
          'تبقى ملكية المحتوى الذي تقدمه لك. عليك امتلاك الحقوق والصلاحيات اللازمة لتحليله أو إرساله، بما في ذلك الصور والتفريغات النصية وبيانات YouTube Studio. لا ترفع محتوى ينتهك حقوق الآخرين أو خصوصيتهم.',
        ] },
        { h: 'أدخل معلومات دقيقة', p: [
          'أنت مسؤول عن سياق الفيديو والتفريغ النصي ومقاييس الأداء التي تدخلها. قد لا يستطيع ClipLens التحقق من إحصاءات Studio الخاصة، وقد تكون النتيجة محدودة باللقطات والمعلومات المتوفرة.',
        ] },
        { h: 'الرصيد وتوليد الصور', p: [
          'قد تستهلك بعض التحليلات أو عمليات توليد الصور رصيدًا داخل الموقع أو رصيد خدمة الصور المتصلة. تظهر التكلفة الحالية في التطبيق قبل البدء. وقد يتعذر توليد الصور إذا لم تُفعّل الخدمة أو لم يتوفر رصيد أو كانت الخدمة مشغولة.',
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
        { h: '١. اختر طريقة البدء', p: [
          'افتح «تحليل فيديو». اختر رفع MP4 لملف موجود على جهازك، أو لصق رابط يوتيوب لمراجعة فيديو عام.',
        ] },
        { h: '٢. ارفع ملف MP4', p: [
          'اختر ملف MP4 لا يتجاوز حجمه 500 ميغابايت ومدته 30 دقيقة. انتظر حتى يفحصه ClipLens ويختار ست لقطات. أضف وصفًا قصيرًا لفكرة الفيديو، وإذا أردت تقييم الكلام المنطوق فأضف تفريغًا نصيًا. اختر لغة العناوين المقترحة ثم ابدأ التحليل.',
        ] },
        { h: '٣. راجع فيديو يوتيوب', p: [
          'الصق رابط يوتيوب عام. يملأ ClipLens العنوان والصورة المصغّرة المتاحين تلقائيًا. اختر لغة العناوين، ثم أدخل مرات الظهور ونسبة النقر والمشاهدات ومتوسط مدة المشاهدة ومدة الفيديو ومصادر الزيارات كما تظهر في YouTube Studio. اكتب NA فقط إذا تعذّر توفير قيمة مطلوبة. يمكنك إضافة لقطات شاشة أو سياق اختياريًا لتوضيح النتائج.',
        ] },
        { h: '٤. اقرأ التقرير', p: [
          'يُحفظ التقرير المكتمل في السجل. افتحه لرؤية الدرجة وشرحها والتوصيات وأفكار العناوين وتوجيه الصورة المصغّرة. في ملفات MP4 تعتمد الدرجة على فكرة الفيديو والتفريغ النصي إن أضفته واللقطات الست؛ ولا يقيّم النظام الصوت عند عدم إضافة تفريغ.',
        ] },
        { h: '٥. ولّد صورة مصغّرة أو نزّلها', p: [
          'استخدم «توليد نسخة أخرى» من التقرير لإنشاء صورة جديدة. تعتمد العملية على خدمة الصور المتصلة وقد تستهلك رصيدها أو تكلفتها. يمكنك تنزيل الصورة من اللوحة نفسها.',
        ] },
        { h: 'العثور على تحليل سابق أو حذفه', p: [
          'افتح السجل للعودة إلى تحليل أو لحذف تقريره. يؤدي الحذف أيضًا إلى مسح لقطات الفيديو المحفوظة محليًا لهذا التحليل. تُحفظ الصور المولّدة كملفات مستقلة وقد تظل متاحة عبر رابطها.',
        ] },
        { h: 'إذا تعذّر إكمال خطوة', p: [
          'تحقق من اتصالك وصحة الملف أو الرابط والحقول المطلوبة. إذا ظهرت مرحلة فاشلة في التقرير، استخدم زر إعادة المحاولة. يحتاج توليد الصور كذلك إلى تفعيل خدمة الصور وتوفر رصيد فيها.',
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
