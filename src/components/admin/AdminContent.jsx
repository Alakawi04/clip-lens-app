import React, { useRef, useState } from 'react';
import { Upload, Plus, X, Loader2 } from 'lucide-react';
import { uploadPublicFile } from '@/api/supabaseClient';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageField from '@/components/admin/ImageField';
import { useI18n } from '@/lib/i18n';

export default function AdminContent({ draft, set }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [newImage, setNewImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const gallery = draft.gallery_images || [];

  const addImage = (url) => {
    const value = String(url || '').trim();
    if (!value) return;
    set({ gallery_images: [...gallery, value] });
    setNewImage('');
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadPublicFile({ file });
      addImage(file_url);
    } catch (error) {
      console.error('Failed to upload gallery image:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => set({ gallery_images: gallery.filter((_, i) => i !== index) });

  const imageFields = [
    { key: 'hero_image_url', label: t('admin.images.hero') },
    { key: 'tool_analyze_image_url', label: t('admin.images.toolAnalyze') },
    { key: 'tool_review_image_url', label: t('admin.images.toolReview') },
    { key: 'before_image_url', label: t('admin.images.before') },
    { key: 'after_image_url', label: t('admin.images.after') },
  ];

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.brand.title')}</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('admin.brand.name')}
            </Label>
            <Input value={draft.brand_name || ''} onChange={(e) => set({ brand_name: e.target.value })} className="h-10" />
          </div>
          <ImageField
            label={t('admin.brand.image')}
            value={draft.logo_image_url}
            onChange={(v) => set({ logo_image_url: v })}
            aspect="aspect-[3/1]"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t('admin.brand.imageHint')}</p>
      </section>

      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.images.title')}</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {imageFields.map((f) => (
            <ImageField key={f.key} label={f.label} value={draft[f.key]} onChange={(v) => set({ [f.key]: v })} />
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-3xl border border-border p-6">
        <h3 className="font-display text-base font-bold">{t('admin.images.gallery')}</h3>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="https://…"
            className="h-10 min-w-[12rem] flex-1 text-xs"
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {t('admin.field.upload')}
          </Button>
          <Button type="button" onClick={() => addImage(newImage)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t('admin.images.add')}
          </Button>
        </div>

        {gallery.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((src, i) => (
              <div key={`${src}-${i}`} className="group relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted/40">
                <Image src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label={t('admin.field.remove')}
                  className="absolute end-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}