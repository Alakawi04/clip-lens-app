import React from 'react';
import { Check, Circle, Youtube, ThumbsUp, Eye, Layers, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageField from '@/components/admin/ImageField';
import { applyAccentColor } from '@/lib/SiteSettingsContext';
import { useI18n } from '@/lib/i18n';

const PRESETS = [
  { name: 'YouTube Red', value: '#FF0000' },
  { name: 'Crimson', value: '#DC2626' },
  { name: 'Ember', value: '#E11D48' },
  { name: 'Deep Red', value: '#B91C1C' },
  { name: 'Sunset', value: '#F97316' },
  { name: 'Violet', value: '#7C3AED' },
];

const PARTICLE_OPTIONS = [
  { value: 'dots', icon: Circle, label: 'admin.particles.dots' },
  { value: 'youtube', icon: Youtube, label: 'admin.particles.youtube' },
  { value: 'like', icon: ThumbsUp, label: 'admin.particles.like' },
  { value: 'views', icon: Eye, label: 'admin.particles.views' },
  { value: 'mixed', icon: Layers, label: 'admin.particles.all' },
  { value: 'custom', icon: ImageIcon, label: 'admin.particles.custom' },
];

export default function AdminAppearance({ draft, set }) {
  const { t } = useI18n();
  const current = (draft.accent_color || '#FF0000').toUpperCase();

  // Live preview as the admin picks a color; persisted on save.
  const pick = (value) => {
    set({ accent_color: value });
    applyAccentColor(value);
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.appearance.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.appearance.hint')}</p>

        <Label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('admin.appearance.accent')}
        </Label>

        <div className="mt-3 flex flex-wrap gap-3">
          {PRESETS.map((p) => {
            const active = p.value.toUpperCase() === current;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => pick(p.value)}
                aria-label={p.name}
                className={`relative h-11 w-11 rounded-2xl border transition-transform active:scale-95 ${
                  active ? 'border-foreground/60 scale-105' : 'border-border'
                }`}
                style={{ background: p.value }}
              >
                {active && <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(draft.accent_color || '') ? draft.accent_color : '#FF0000'}
            onChange={(e) => pick(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-transparent"
          />
          <Input
            value={draft.accent_color || ''}
            onChange={(e) => pick(e.target.value)}
            className="h-10 w-36 font-mono text-xs uppercase"
          />
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs font-semibold text-primary">
            <span className="h-3 w-3 rounded-full" style={{ background: draft.accent_color || '#FF0000' }} />
            {t('admin.appearance.accent')}
          </span>
        </div>
      </section>

      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.appearance.particles')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.appearance.particles.hint')}</p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {PARTICLE_OPTIONS.map((o) => {
            const Icon = o.icon;
            const active = (draft.particles_style || 'dots') === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => set({ particles_style: o.value })}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                  active
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border bg-card/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(o.label)}
              </button>
            );
          })}
        </div>

        {(draft.particles_style || 'dots') === 'custom' && (
          <div className="mt-5 max-w-sm">
            <ImageField
              label={t('admin.particles.image')}
              value={draft.particles_image_url}
              onChange={(v) => set({ particles_image_url: v })}
            />
          </div>
        )}
      </section>
    </div>
  );
}