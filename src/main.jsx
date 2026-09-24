import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AdaptiveProvider } from './adaptive/AdaptiveProvider.jsx'
// One self-hosted variable grotesk. The package index registers the latin and
// latin-ext faces; unicode-range keeps latin-ext off the wire for latin text
// (46.7 KB woff2, one axis, 400-900). See README → "Bytes we chose to spend".
import '@fontsource-variable/schibsted-grotesk'
import './styles.css'
import { applyTheme, watchSystemTheme } from './theme.js'

// The inline script in index.html already set data-theme before paint; this
// keeps it in step with the OS while 'system' is selected, and pushes the
// resolved value into React so the control shows the right state.
applyTheme()
watchSystemTheme()

createRoot(document.getElementById('root')).render(
  <AdaptiveProvider>
    <App />
  </AdaptiveProvider>
)
