import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';

// Image control: preview, direct URL, or upload (stored publicly — anyone with the link can open them).
export default function ImageField({ label, value, onChange, aspect = 'aspect-video' }) {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    onChange(file_url);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className={`relative overflow-hidden rounded-2xl border border-border bg-muted/40 ${aspect}`}>
        {value ? (
          <Image src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">{t('admin.field.url')}</div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="h-9 text-xs"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 gap-1.5"
        >
          <Upload className="h-3.5 w-3.5" />
          {t('admin.field.upload')}
        </Button>
      </div>
    </div>
  );
}