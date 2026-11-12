// Deterministic fallback performance summary used when the model does not
// return a performance score. It compares the supplied Studio metrics with the
// channel baselines the creator entered and never invents a benchmark.

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'na') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function compareToBaseline(currentValue, baselineValue) {
  const current = toNumber(currentValue);
  const baseline = toNumber(baselineValue);
  if (current === null || baseline === null || baseline <= 0 || current < 0) return null;
  const ratio = current / baseline;
  const score = 50 + 20 * Math.log2(Math.max(ratio, 0.01));
  return {
    current,
    baseline,
    ratio,
    score: Math.round(Math.max(0, Math.min(100, score))),
    changePercent: Math.round((ratio - 1) * 100),
  };
}

function formatNumber(value, lang) {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-JO' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(value);
}

export function createPerformanceFallback(stats = {}, lang = 'en') {
  const arabic = lang === 'ar';
  const viewsComparison = compareToBaseline(stats.views, stats.previous_views);
  const ctrComparison = compareToBaseline(stats.ctr, stats.previous_ctr);
  const scores = [viewsComparison, ctrComparison].filter(Boolean).map((item) => item.score);
  const score = scores.length ? Math.round(scores.reduce((total, value) => total + value, 0) / scores.length) : 50;
  const confidence = scores.length > 1 ? 'medium' : 'low';

  const metrics = [];

  if (toNumber(stats.views) !== null) {
    metrics.push(viewsComparison
      ? {
        metric: arabic ? 'المشاهدات مقارنة بمتوسط فيديوهاتك' : 'Views compared with your similar videos',
        assessment: arabic
          ? `المشاهدات ${viewsComparison.changePercent >= 0 ? 'أعلى' : 'أقل'} من المتوسط الذي أدخلته بنسبة ${Math.abs(viewsComparison.changePercent)}٪.`
          : `Views are ${Math.abs(viewsComparison.changePercent)}% ${viewsComparison.changePercent >= 0 ? 'above' : 'below'} the channel average you provided.`,
        evidence: arabic
          ? `${formatNumber(viewsComparison.current, lang)} مشاهدة مقابل متوسط ${formatNumber(viewsComparison.baseline, lang)}.`
          : `${formatNumber(viewsComparison.current, lang)} views compared with your average of ${formatNumber(viewsComparison.baseline, lang)}.`,
      }
      : {
        metric: arabic ? 'المشاهدات' : 'Views',
        assessment: arabic
          ? 'لا يمكن الحكم على هذا الرقم وحده دون مقارنته بفيديوهات مشابهة في قناتك.'
          : 'This count alone cannot show whether performance is strong without a comparable channel baseline.',
        evidence: arabic
          ? 'أضف متوسط مشاهدات فيديوهاتك المشابهة لإجراء مقارنة.'
          : 'Add the average views from similar videos for a useful comparison.',
      });
  }

  if (toNumber(stats.ctr) !== null) {
    metrics.push(ctrComparison
      ? {
        metric: arabic ? 'نسبة النقر مقارنة بمتوسط قناتك' : 'CTR compared with your channel average',
        assessment: arabic
          ? `نسبة النقر ${ctrComparison.changePercent >= 0 ? 'أعلى' : 'أقل'} من متوسطك بنسبة ${Math.abs(ctrComparison.changePercent)}٪.`
          : `CTR is ${Math.abs(ctrComparison.changePercent)}% ${ctrComparison.changePercent >= 0 ? 'above' : 'below'} the channel average you provided.`,
        evidence: arabic
          ? `${formatNumber(ctrComparison.current, lang)}٪ مقابل متوسط ${formatNumber(ctrComparison.baseline, lang)}٪.`
          : `${formatNumber(ctrComparison.current, lang)}% compared with your average of ${formatNumber(ctrComparison.baseline, lang)}%.`,
      }
      : {
        metric: arabic ? 'نسبة النقر' : 'Click-through rate',
        assessment: arabic
          ? 'تحتاج نسبة النقر إلى سياق الظهور ومصدر الزيارة ومقارنة بفيديوهات قناتك.'
          : 'CTR needs impression volume, traffic-source context, and a comparison with similar videos on your channel.',
        evidence: arabic
          ? 'لا توجد مقارنة سابقة من القناة ضمن البيانات.'
          : 'No channel baseline was included in the submitted information.',
      });
  }

  const averageView = toNumber(stats.avg_view_duration);
  const videoDuration = toNumber(stats.video_duration);
  if (averageView !== null && videoDuration !== null && videoDuration > 0) {
    const retention = Math.min(100, Math.round((averageView / videoDuration) * 100));
    metrics.push({
      metric: arabic ? 'متوسط مدة المشاهدة' : 'Average view duration',
      assessment: arabic
        ? `متوسط المشاهدة يساوي نحو ${retention}٪ من مدة الفيديو. قارن النسبة بفيديوهات مشابهة قبل اعتبارها مرتفعة أو منخفضة.`
        : `Average view duration is about ${retention}% of the video length. Compare it with similar videos before treating it as high or low.`,
      evidence: arabic
        ? `${formatNumber(averageView, lang)} ثانية من أصل ${formatNumber(videoDuration, lang)} ثانية.`
        : `${formatNumber(averageView, lang)} seconds out of ${formatNumber(videoDuration, lang)} seconds.`,
    });
  }

  if (!metrics.length) {
    metrics.push({
      metric: arabic ? 'كفاية بيانات الأداء' : 'Performance evidence available',
      assessment: arabic
        ? 'لم تتوفر أرقام قابلة للمقارنة لإصدار حكم موثوق؛ لذلك تظهر الدرجة المؤقتة 50/100 كخط أساس محايد.'
        : 'There are no comparable figures for a reliable judgment, so the provisional 50/100 is shown as a neutral starting point.',
      evidence: arabic
        ? 'أضف المشاهدات ونسبة النقر ومتوسط المشاهدة، ويفضل متوسط فيديوهات مشابهة من قناتك.'
        : 'Add views, CTR, average view duration, and preferably averages from similar videos on your channel.',
    });
  }

  const causes = [];
  if (viewsComparison && viewsComparison.ratio < 0.7) {
    causes.push({
      cause: arabic ? 'المشاهدات أقل من متوسط فيديوهات القناة' : 'Views are below the channel baseline',
      evidence: arabic
        ? `المشاهدات الحالية أقل من المتوسط الذي أدخلته بنسبة ${Math.abs(viewsComparison.changePercent)}٪.`
        : `Current views are ${Math.abs(viewsComparison.changePercent)}% below the average you provided.`,
      confidence: 'low',
    });
  }
  if (ctrComparison && ctrComparison.ratio < 0.7) {
    causes.push({
      cause: arabic ? 'نسبة النقر أقل من متوسط القناة' : 'CTR is below the channel baseline',
      evidence: arabic
        ? `نسبة النقر أقل من المتوسط الذي أدخلته بنسبة ${Math.abs(ctrComparison.changePercent)}٪؛ راجع توافق العنوان والصورة مع الجمهور ومصدر الزيارات.`
        : `CTR is ${Math.abs(ctrComparison.changePercent)}% below your baseline; review title/thumbnail fit alongside audience and traffic source.`,
      confidence: 'low',
    });
  }

  const summary = scores.length
    ? arabic
      ? 'درجة مؤقتة محسوبة من المقارنة بمتوسط قناتك الذي أدخلته. هي مؤشر أولي، وليست حكمًا نهائيًا على جودة الفيديو أو توقعًا للمشاهدات.'
      : 'Provisional score based on the channel averages you entered. It is an initial comparison, not a final judgment of video quality or a view forecast.'
    : arabic
      ? 'درجة مؤقتة 50/100 لعدم توفر مقارنة كافية مع فيديوهات مشابهة في قناتك. لا تعني أن الأداء متوسط؛ أضف متوسط المشاهدات ونسبة النقر وبيانات الاحتفاظ ثم أعد التحليل للحصول على تقييم أدق.'
      : 'Provisional 50/100 because there is not enough comparable channel data. This does not mean the video is average; add similar-video views, CTR, and retention details, then rerun for a more specific assessment.';

  return { score, confidence, summary, metrics, causes };
}
