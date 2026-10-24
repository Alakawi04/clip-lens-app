import React, { useMemo, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TRANSLATIONS, useI18n } from '@/lib/i18n';

// Lets the admin override any UI text on the site, in English and Arabic.
export default function AdminTexts({ draft, set }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const texts = draft.texts || {};

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const map = new Map();

    Object.keys(TRANSLATIONS.en).forEach((key) => {
      if (needle) {
        const haystack = `${key} ${TRANSLATIONS.en[key] || ''} ${TRANSLATIONS.ar[key] || ''}`.toLowerCase();
        if (!haystack.includes(needle)) return;
      }
      const group = key.split('.')[0];
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(key);
    });

    return Array.from(map.entries());
  }, [query]);

  const valueFor = (l, key) => (texts[`${l}.${key}`] !== undefined ? texts[`${l}.${key}`] : TRANSLATIONS[l][key] || '');
  const isEdited = (l, key) => texts[`${l}.${key}`] !== undefined;

  const update = (l, key, value) => set({ texts: { ...texts, [`${l}.${key}`]: value } });

  const reset = (l, key) => {
    const next = { ...texts };
    delete next[`${l}.${key}`];
    set({ texts: next });
  };

  const total = Object.keys(texts).filter((key) => /^(en|ar)\./.test(key)).length;

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-3xl border border-border p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold">{t('admin.texts.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.texts.hint')}</p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('admin.texts.search')}
            className="ps-9"
          />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {total > 0 ? `${total} ${t('admin.texts.edited')}` : t('admin.texts.noneEdited')}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground">
          {t('admin.texts.empty')}
        </p>
      ) : (
        groups.map(([group, keys]) => (
          <div key={group} className="glass-panel overflow-hidden rounded-3xl border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <h4 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">{group}</h4>
              <span className="text-xs text-muted-foreground">{keys.length}</span>
            </div>

            <div className="divide-y divide-border">
              {keys.map((key) => (
                <div key={key} className="grid gap-3 px-5 py-4 lg:grid-cols-2">
                  <div className="lg:col-span-2 flex items-center gap-2">
                    <code className="truncate rounded-lg bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {key}
                    </code>
                    {isEdited('en', key) || isEdited('ar', key) ? (
                      <button
                        type="button"
                        onClick={() => { reset('en', key); reset('ar', key); }}
                        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t('admin.texts.reset')}
                      </button>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('admin.texts.english')}
                    </label>
                    <Input
                      dir="ltr"
                      value={valueFor('en', key)}
                      onChange={(e) => update('en', key, e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('admin.texts.arabic')}
                    </label>
                    <Input
                      dir="rtl"
                      value={valueFor('ar', key)}
                      onChange={(e) => update('ar', key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
