import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves this project from /clip-lens-app/; local/dev builds stay at /.
  base: process.env.GITHUB_ACTIONS === 'true' ? '/clip-lens-app/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
