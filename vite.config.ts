import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'SUPABASE_'],
    define: (() => {
      const envSupabaseUrl = process.env.SUPABASE_URL || '';
      const envSupabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
      const envViteUrl = process.env.VITE_SUPABASE_URL || '';
      const envViteKey = process.env.VITE_SUPABASE_ANON_KEY || '';

      // Tự động nhận diện URL thật (bắt đầu bằng http) và Key thật
      let finalUrl = '';
      if (envSupabaseUrl.startsWith('http')) finalUrl = envSupabaseUrl;
      else if (envViteUrl.startsWith('http')) finalUrl = envViteUrl;
      else if (envViteKey.startsWith('http')) finalUrl = envViteKey;
      else if (envSupabaseKey.startsWith('http')) finalUrl = envSupabaseKey;

      let finalKey = '';
      if (envSupabaseKey && !envSupabaseKey.startsWith('http')) finalKey = envSupabaseKey;
      else if (envViteKey && !envViteKey.startsWith('http')) finalKey = envViteKey;
      else if (envViteUrl && !envViteUrl.startsWith('http')) finalKey = envViteUrl;
      else if (envSupabaseUrl && !envSupabaseUrl.startsWith('http')) finalKey = envSupabaseUrl;

      return {
        'process.env.SUPABASE_URL': JSON.stringify(finalUrl),
        'process.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(finalKey),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(finalUrl),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(finalKey),
        'import.meta.env.SUPABASE_URL': JSON.stringify(finalUrl),
        'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(finalKey),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(finalUrl),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(finalKey),
      };
    })(),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
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
