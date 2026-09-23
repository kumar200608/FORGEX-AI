import { useState, useEffect, lazy, Suspense } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import ProductGrid from './components/ProductGrid.jsx'
import DetailModal from './components/DetailModal.jsx'
import DemoControls from './components/DemoControls.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import { useAdaptive } from './adaptive/AdaptiveProvider.jsx'
import { addItem } from './cart.js'
import { routeFromHash, hashFor, DEFAULT_PAGE } from './routes.js'

// The dashboard is its own chunk: measurement UI costs bytes, so it travels
// only when the user actually asks for it.
const Dashboard = lazy(() => import('./components/Dashboard.jsx'))

function useRoute() {
  const [route, setRoute] = useState(() => routeFromHash(window.location.hash))

  // Browser back/forward land here.
  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const go = (view, page = DEFAULT_PAGE) => {
    // Unconditional: clearing the hash with replaceState does not fire
    // `hashchange`, so the state update cannot be left to the listener.
    setRoute({ view, page })
    const next = hashFor(view, page)
    if (next) {
      if (window.location.hash !== next) window.location.hash = next
    } else if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    window.scrollTo(0, 0)
  }

  return [route, go]
}

// Shaped like the page it replaces, so the swap does not jump.
function DashboardSkeleton() {
  return (
    <div className="dash-page" aria-hidden="true">
      <div className="dash-head">
        <div className="dash-head-row">
          <div className="dash-head-main">
            <div className="sk-stack">
              <span className="sk sk-title" />
              <span className="sk sk-line" />
            </div>
          </div>
        </div>
      </div>
      <div className="dash-body">
        <span className="sk sk-block" />
        <div className="tile-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => <span className="sk sk-tile" key={i} />)}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { budget } = useAdaptive()
  const [route, go] = useRoute()
  const [openProduct, setOpenProduct] = useState(null)

  const openDashboard = () => go('dashboard', DEFAULT_PAGE)
  const closeDashboard = () => go('shop')

  return (
    // anim-* gates every transition and entrance animation in the stylesheet
    // against the delivery budget (rich / reduced / off).
    <div className={`app anim-${budget.animations}`}>
      <OfflineBanner />
      {route.view === 'dashboard' ? (
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard
            page={route.page}
            onNavigate={(next) => go('dashboard', next)}
            onClose={closeDashboard}
          />
        </Suspense>
      ) : (
        <>
          <Header onOpenDashboard={openDashboard} />
          <main>
            <Hero onOpenDashboard={openDashboard} />
            <ProductGrid onOpen={setOpenProduct} onAdd={addItem} />
          </main>
          <footer className="site-footer">
            <span>Adaptive Web — signal-adaptive delivery · Hackathon 2026</span>
            <span>React PWA · Service Worker · Network &amp; Device APIs · Cache API · IndexedDB</span>
          </footer>
        </>
      )}
      {openProduct && (
        <DetailModal
          product={openProduct}
          onClose={() => setOpenProduct(null)}
          onAddToCart={addItem}
        />
      )}
      {/* The demo controls stay mounted on every screen: forcing a signal is
          most useful while watching the dashboard react to it. */}
      <DemoControls />
    </div>
  )
}
