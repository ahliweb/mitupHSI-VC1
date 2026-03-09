import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://personalfinance.ahlikoding.com',
  output: 'static',
  compressHTML: true,
  build: {
    assets: '_assets',
    inlineStylesheets: 'auto',
  },
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
  vite: {
    define: {
      'process.env': {},
    },
    optimizeDeps: {
      exclude: ['@puckeditor/core'],
    },
    ssr: {
      noExternal: ['@puckeditor/core'],
    },
  },
});
