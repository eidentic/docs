import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: true,
  },
  build: {
    assets: '_helio',
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  devToolbar: {
    enabled: false,
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'tap',
  },
  vite: {
    ssr: {
      noExternal: ['@iconify/react'],
      external: ['react-syntax-highlighter'],
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    logLevel: 'error',
    server: {
      hmr: {
        overlay: false,
      },
    },
  },
});
