import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import {runAllGovernanceAndStringAudits} from './src/services/auditRunner';

function clinicalGovernancePlugin() {
  return {
    name: 'senior-pet-clinical-governance-audit',
    buildStart() {
      const report = runAllGovernanceAndStringAudits();
      if (!report.passed) {
        const errors = [
          ...report.clinicalReviewFailures,
          ...report.catStringLeaks,
          ...report.dogStringLeaks,
        ];
        throw new Error(`Clinical Governance / Species String Audit Failed:\n${errors.join('\n')}`);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      clinicalGovernancePlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon-32x32.png',
          'apple-touch-icon.png',
          'apple-touch-icon-167x167.png',
          'apple-touch-icon-152x152.png',
          'pwa-192x192.png',
          'pwa-384x384.png',
          'pwa-512x512.png',
          'pwa-1024x1024.png',
          'pwa-maskable-192x192.png',
          'pwa-maskable-512x512.png',
          'pwa-maskable-1024x1024.png',
        ],
        manifest: {
          id: '/',
          name: 'Senior Pet Care Monitor',
          short_name: 'PetMonitor',
          description: 'The senior pet monitor that tells you what changed, what to ask your vet, and what to do next.',
          theme_color: '#FDFBF7',
          background_color: '#FDFBF7',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-1024x1024.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-1024x1024.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
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
