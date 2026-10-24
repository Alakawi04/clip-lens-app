import { useLayoutEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

function AppBootstrap() {
  useLayoutEffect(() => {
    const loader = document.getElementById('initial-page-loader');
    if (!loader) return undefined;

    let active = true;
    let revealed = false;
    let cleanupTimer;
    let minimumTimer;
    let revealFrame;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal = () => {
      if (!active || revealed || !loader.isConnected) return;
      revealed = true;
      loader.setAttribute('aria-hidden', 'true');
      loader.classList.add('is-ready');
      document.documentElement.classList.add('is-revealing');
      cleanupTimer = window.setTimeout(() => {
        loader.remove();
        document.documentElement.classList.remove('is-booting', 'is-revealing');
      }, prefersReducedMotion ? 40 : 900);
    };

    const importantImages = [...document.querySelectorAll('#root img')].filter(
      (image) => image.loading === 'eager' || image.fetchPriority === 'high'
    );
    const imagesReady = Promise.all(
      importantImages.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          const finish = () => resolve();
          image.addEventListener('load', finish, { once: true });
          image.addEventListener('error', finish, { once: true });
        });
      })
    );
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const pageResourcesReady = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    const minimumDisplayMs = prefersReducedMotion ? 1300 : 3200;
    const elapsedMs = performance.now() - (window.__clipLensBootAt ?? performance.now());
    const minimumDisplayReady = new Promise((resolve) => {
      minimumTimer = window.setTimeout(resolve, Math.max(0, minimumDisplayMs - elapsedMs));
    });
    const revealWhenReady = () => {
      if (active) revealFrame = window.requestAnimationFrame(reveal);
    };
    Promise.all([imagesReady, fontsReady, pageResourcesReady, minimumDisplayReady]).then(revealWhenReady, revealWhenReady);

    return () => {
      active = false;
      window.clearTimeout(cleanupTimer);
      window.clearTimeout(minimumTimer);
      if (revealFrame) window.cancelAnimationFrame(revealFrame);
    };
  }, []);

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppBootstrap />,
);
