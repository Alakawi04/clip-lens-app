import React, { useState } from 'react';
import { Download, Copy, Check, Terminal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';

const COMMANDS = 'npm install -g base44@latest\nbase44 eject\ncd my-app\nnpm install\nbase44 dev';

// Small, quiet button at the bottom of the admin dashboard — opens a short
// guide for downloading the full site code as a ZIP and running it locally.
export default function ExportCodeButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMMANDS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5" />
        {t('admin.local.button')}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{t('admin.local.title')}</DialogTitle>
            <DialogDescription>{t('admin.local.hint')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">{t('admin.local.zip')}</p>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Terminal className="h-3.5 w-3.5" />
                  {t('admin.local.cli')}
                </span>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('admin.local.copied') : t('admin.local.copy')}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-border bg-black/40 p-3 font-mono text-xs leading-relaxed text-foreground/90">
                {COMMANDS}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}