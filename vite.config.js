import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Emits public/adaptive-build-manifest.json → the runtime can compare the JS it
// actually loaded against what a FULL delivery would load. That is what makes the
// "JS data saved" metric in the dashboard real instead of hand-waved.
function buildManifest() {
  return {
    name: 'adaptive-build-manifest',
    apply: 'build',
    generateBundle(_, bundle) {
      const chunks = {}
      for (const [file, out] of Object.entries(bundle)) {
        if (out.type === 'chunk') chunks[file.replace(/^assets\//, '')] = out.code.length
      }
      this.emitFile({
        type: 'asset',
        fileName: 'adaptive-build-manifest.json',
        source: JSON.stringify({ chunks }, null, 2),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), buildManifest()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react'
            return 'vendor'
          }
          if (id.includes('/heavy/motion')) return 'heavy-motion'
          if (id.includes('/heavy/video')) return 'heavy-video'
          if (id.includes('/heavy/zoom')) return 'heavy-zoom'
        },
      },
    },
  },
  test: {
    // Node is the default because the suites are pure functions, Express routes
    // or plain module logic. The one DOM suite (src/hooks/useDialogFocus.test.jsx)
    // opts into jsdom with a per-file `@vitest-environment jsdom` comment, so the
    // jsdom cost is paid only where a real DOM is needed.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'server/**/*.test.js'],
    // The opt-in MongoDB suite opens one connection for the whole file.
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
})
