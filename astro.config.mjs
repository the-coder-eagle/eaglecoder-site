// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://eaglecoder.cn',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api/lover': 'http://localhost:3002',
        '/api/chat': 'http://localhost:3001',
        '/api': 'http://localhost:3000',
      },
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  // 如果后面想用 Decap CMS 或其他在线管理面板取消注释
  // prefetch: { defaultStrategy: 'hover' },
});
