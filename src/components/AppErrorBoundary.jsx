import React from 'react';
import { appUrl } from '@/lib/appPaths';

// Remove the boot loader immediately if the app crashes before it is revealed;
// otherwise the splash screen would cover the error forever.
function clearBootLoader() {
  const loader = document.getElementById('initial-page-loader');
  if (!loader?.isConnected) return;
  loader.setAttribute('aria-hidden', 'true');
  loader.classList.add('is-ready');
  document.documentElement.classList.remove('is-booting');
  window.setTimeout(() => loader.remove(), 400);
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unexpected UI error:', error, info);
    clearBootLoader();
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-[100svh] place-items-center bg-background px-4 py-16 text-foreground">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card/80 p-7 text-center shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">ClipLens</p>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            An unexpected error stopped this page from rendering.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground" lang="ar" dir="rtl">
            حدث خطأ غير متوقع ومنع عرض الصفحة.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Reload / إعادة التحميل
            </button>
            <a
              href={appUrl('/')}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary"
            >
              Home / الرئيسية
            </a>
          </div>
        </div>
      </main>
    );
  }
}
