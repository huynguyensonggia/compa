import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.SITE_URL || '').trim().replace(/\/+$/, '');
  return {
    plugins: [react()],
    define: {
      __SITE_URL__: JSON.stringify(siteUrl),
    },
    build: {
      copyPublicDir: !isSsrBuild,
      emptyOutDir: true,
    },
    server: {
      host: '127.0.0.1',
    },
  };
});
