/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'logo.jpeg',
        'icons/*.png',
        'screenshots/*.jpg',
      ],
      manifest: {
        name: 'FieldSync',
        short_name: 'FieldSync',
        description: 'Offline-first collaborative field inspection, work order management, and real-time operations platform',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
        orientation: 'portrait-primary',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        lang: 'en',
        dir: 'ltr',
        categories: ['business', 'productivity', 'utilities'],
        prefer_related_applications: false,
        launch_handler: {
          client_mode: ['navigate-existing', 'auto'],
        },
        icons: [
          {
            src: '/logo.jpeg',
            sizes: '548x532',
            type: 'image/jpeg',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-1.jpg',
            sizes: '1280x720',
            type: 'image/jpeg',
            form_factor: 'wide',
            label: 'FieldSync Operations Dashboard and SLA Tracking',
          },
          {
            src: '/screenshots/mobile-1.jpg',
            sizes: '750x1334',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Mobile Field Inspection and UPI QR Payment',
          },
        ],
        shortcuts: [
          {
            name: 'Active Inspections',
            short_name: 'Inspections',
            description: 'View active work orders and field inspection checklist',
            url: '/inspections',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Invoices & Billing',
            short_name: 'Billing',
            description: 'Manage customer invoices and collect UPI payments',
            url: '/admin',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        file_handlers: [
          {
            action: '/inspections',
            accept: {
              'application/json': ['.json'],
              'text/csv': ['.csv'],
            },
          },
        ],
        protocol_handlers: [
          {
            protocol: 'web+fieldsync',
            url: '/inspections?ref=%s',
          },
        ],
        share_target: {
          action: '/inspections',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'media',
                accept: ['image/*', 'application/pdf'],
              },
            ],
          },
        },
        related_applications: [],
        edge_side_panel: {
          preferred_width: 420,
        },
        note_taking: {
          new_note_url: '/inspections?action=new-note',
        },
        widgets: [
          {
            name: 'FieldSync Work Orders',
            short_name: 'Work Orders',
            description: 'Active field inspection tickets and SLA status',
            tag: 'fieldsync-orders',
            template: 'widget',
            ms_ac_template: 'widgets/orders.json',
            data: 'api/widget-data',
            type: 'application/json',
            screenshots: [
              {
                src: '/screenshots/mobile-1.jpg',
                sizes: '750x1334',
                label: 'FieldSync Mobile Widget',
              },
            ],
            icons: [
              {
                src: '/icons/icon-192.png',
                sizes: '192x192',
              },
            ],
          },
        ],
      },
      workbox: {
        importScripts: ['/sw-custom.js'],
        // Cache the app shell + screenshots + icons (including jpeg)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg,jpeg,webp}'],
        // Don't cache API routes - they handle their own offline state
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cloudinary CDN images (read-only, cache aggressively)
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase REST API - NetworkFirst with 5s timeout, falls back to IndexedDB
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day stale-while-revalidate
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase Auth - NetworkOnly (never cache auth tokens)
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Health endpoint - network first, fast timeout
            urlPattern: /\/api\/health$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'health-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 1, maxAgeSeconds: 60 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})
