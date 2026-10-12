import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Chạy ở gốc tên miền (Vercel). GitHub Pages dùng: vite build --base=./
    base: '/',
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          // Tách thư viện ra gói riêng: gói chính nhỏ, trình duyệt lưu đệm thư viện lâu dài
          codeSplitting: {
            groups: [
              { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 },
              { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/, priority: 20 },
              { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/, priority: 10 }
            ]
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
