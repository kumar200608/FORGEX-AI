import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AdaptiveProfile,
  CartItem,
  DeviceProfile,
  NetworkProfile,
  PerformanceSnapshot,
  Product,
  ProductVariant,
  PlacedOrder,
  SimulationPreset,
  ThemeMode,
} from './types';
import { networkDetector } from './lib/network-detector';
import { deviceDetector } from './lib/device-detector';
import { computeAdaptiveProfile } from './lib/adaptive-engine';
import { performanceMonitor } from './lib/performance-monitor';
import { prefetchManager } from './lib/prefetch-manager';

import { AdaptiveStatusHUD } from './components/AdaptiveStatusHUD';
import { Header } from './components/Header';
import { CheckoutModal } from './components/CheckoutModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { DashboardPage } from './pages/DashboardPage';
import { PRODUCTS } from './data/products';

export default function App() {
  // 1. Live Detection Signals
  const [network, setNetwork] = useState<NetworkProfile>(() => networkDetector.getProfile());
  const [device, setDevice] = useState<DeviceProfile>(() => deviceDetector.getProfile());
  const [simulationPreset, setSimulationPreset] = useState<SimulationPreset>('none');

  // 2. Real Web Vitals & Resource Metrics
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot>(() =>
    performanceMonitor.getSnapshot()
  );

  // 3. Routing & History Stack State
  const [activeRoute, setActiveRoute] = useState<'home' | 'products' | 'dashboard'>('home');
  const [routeHistory, setRouteHistory] = useState<Array<'home' | 'products' | 'dashboard'>>(['home']);

  // 4. Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('adaptx-cart');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [directBuyItem, setDirectBuyItem] = useState<CartItem | null>(null);
  const [recentOrders, setRecentOrders] = useState<PlacedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('adaptx-orders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Track Order Modal State
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState<boolean>(false);
  const [activeTrackOrderId, setActiveTrackOrderId] = useState<string>('');

  // 5. Wishlist State
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('adaptx-wishlist');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(['adx-01', 'adx-05', 'adx-12']); // Default recommended favorites
  });

  // Save cart, orders & wishlist to local storage
  useEffect(() => {
    try {
      localStorage.setItem('adaptx-cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('adaptx-orders', JSON.stringify(recentOrders));
    } catch {}
  }, [recentOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('adaptx-wishlist', JSON.stringify(Array.from(wishlistIds)));
    } catch {}
  }, [wishlistIds]);

  const handleToggleWishlist = useCallback((product: Product) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
  }, []);

  // 6. Day / Night Theme State (persisted to localStorage)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('adaptx-theme');
      if (saved === 'day' || saved === 'night') return saved;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'day';
      }
      return 'night';
    } catch {
      return 'night';
    }
  });

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'night' ? 'day' : 'night';
      try {
        localStorage.setItem('adaptx-theme', next);
      } catch {}
      return next;
    });
  }, []);

  // Sync theme class to documentElement for full DOM styling
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'day') {
      root.classList.add('theme-day');
      root.classList.remove('theme-night');
    } else {
      root.classList.add('theme-night');
      root.classList.remove('theme-day');
    }
  }, [theme]);

  // Subscribe to network and device changes
  useEffect(() => {
    const unsubNet = networkDetector.subscribe((newNet) => {
      setNetwork(newNet);
    });
    const unsubDev = deviceDetector.subscribe((newDev) => {
      setDevice(newDev);
    });
    const unsubPerf = performanceMonitor.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    return () => {
      unsubNet();
      unsubDev();
      unsubPerf();
    };
  }, []);

  // Compute centralized AdaptiveProfile
  const adaptive: AdaptiveProfile = useMemo(() => {
    return computeAdaptiveProfile(network, device, simulationPreset);
  }, [network, device, simulationPreset]);

  // Handle URL hash / path navigation
  useEffect(() => {
    const syncRouteFromLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/products' || hash === '#/products' || hash === '#products') {
        setActiveRoute('products');
      } else if (path === '/dashboard' || hash === '#/dashboard' || hash === '#dashboard') {
        setActiveRoute('dashboard');
      } else {
        setActiveRoute('home');
      }
    };

    syncRouteFromLocation();
    window.addEventListener('popstate', syncRouteFromLocation);
    window.addEventListener('hashchange', syncRouteFromLocation);
    return () => {
      window.removeEventListener('popstate', syncRouteFromLocation);
      window.removeEventListener('hashchange', syncRouteFromLocation);
    };
  }, []);

  const handleNavigate = useCallback(
    (route: 'home' | 'products' | 'dashboard') => {
      setActiveRoute(route);
      setRouteHistory((prev) => [...prev, route]);
      const hash = route === 'home' ? '' : `#/${route}`;
      if (window.history.pushState) {
        window.history.pushState(null, '', hash || window.location.pathname);
      } else {
        window.location.hash = hash;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  // Step back in history
  const handleGoBack = useCallback(() => {
    if (isTrackOrderOpen) {
      setIsTrackOrderOpen(false);
      return;
    }
    if (isCheckoutOpen) {
      setIsCheckoutOpen(false);
      return;
    }
    if (routeHistory.length > 1) {
      const newHistory = [...routeHistory];
      newHistory.pop(); // Remove current
      const prevRoute = newHistory[newHistory.length - 1] || 'home';
      setRouteHistory(newHistory);
      setActiveRoute(prevRoute);
      const hash = prevRoute === 'home' ? '' : `#/${prevRoute}`;
      if (window.history.pushState) {
        window.history.pushState(null, '', hash || window.location.pathname);
      } else {
        window.location.hash = hash;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleNavigate('home');
    }
  }, [isTrackOrderOpen, isCheckoutOpen, routeHistory, handleNavigate]);

  // Cart operations
  const handleAddToCart = useCallback((product: Product, quantity = 1, variant?: ProductVariant) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedVariant?.id === variant?.id
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedVariant?.id === variant?.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedVariant: variant }];
    });
  }, []);

  const handleBuyNow = useCallback((product: Product, quantity = 1, variant?: ProductVariant) => {
    setDirectBuyItem({ product, quantity, selectedVariant: variant });
    setIsCheckoutOpen(true);
  }, []);

  const handleUpdateCartQuantity = useCallback((productId: string, delta: number, variantId?: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && (!variantId || item.selectedVariant?.id === variantId)) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const handleRemoveFromCart = useCallback((productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && (!variantId || item.selectedVariant?.id === variantId)))
    );
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handleOrderSuccess = useCallback((order: PlacedOrder) => {
    setRecentOrders((prev) => [order, ...prev]);
    setDirectBuyItem(null);
  }, []);

  const handleOpenTrackOrderWithId = useCallback((orderId?: string) => {
    if (orderId) {
      setActiveTrackOrderId(orderId);
    }
    setIsTrackOrderOpen(true);
  }, []);

  // Prefetch trigger on product card hover/touch
  const handleHoverPrefetchProduct = useCallback(
    (product: Product) => {
      let targetImg = product.images.medium;
      if (adaptive.imageStrategy === 'high') {
        targetImg = product.images.high;
      } else if (adaptive.imageStrategy === 'low') {
        targetImg = product.images.low;
      }

      prefetchManager.requestPrefetch(targetImg, adaptive.prefetchStrategy, 'hover');
    },
    [adaptive.imageStrategy, adaptive.prefetchStrategy]
  );

  // Trigger synthetic interaction for INP measurement demonstration
  const handleTriggerInteraction = useCallback(() => {
    const start = performance.now();
    for (let i = 0; i < 50000; i++) {
      Math.sqrt(i);
    }
    const duration = performance.now() - start;
    performanceMonitor.recordSyntheticInteraction(duration + 25);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        theme === 'day' ? 'theme-day bg-slate-50 text-slate-900' : 'theme-night bg-neutral-950 text-neutral-100'
      } selection:bg-emerald-500/20 selection:text-emerald-300`}
    >
      {/* 1. Top HUD Bar */}
      <AdaptiveStatusHUD
        network={network}
        device={device}
        adaptive={adaptive}
        simulationPreset={simulationPreset}
        onSelectSimulation={setSimulationPreset}
        onOpenDashboard={() => handleNavigate('dashboard')}
        activeRoute={activeRoute}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. E-Commerce Navigation & Cart Drawer */}
      <Header
        activeRoute={activeRoute}
        onRouteChange={handleNavigate}
        cart={cart}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOpenCheckout={() => {
          setDirectBuyItem(null);
          setIsCheckoutOpen(true);
        }}
        onOpenTrackOrder={() => handleOpenTrackOrderWithId()}
        wishlistCount={wishlistIds.size}
        onOpenWishlist={() => handleNavigate('products')}
        onBack={handleGoBack}
        canGoBack={activeRoute !== 'home' || routeHistory.length > 1}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 3. Primary Page Routes */}
      <main className="flex-1">
        {activeRoute === 'home' && (
          <HomePage
            adaptive={adaptive}
            network={network}
            device={device}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onNavigate={handleNavigate}
            onHoverPrefetchProduct={handleHoverPrefetchProduct}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {activeRoute === 'products' && (
          <ProductsPage
            adaptive={adaptive}
            network={network}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onHoverPrefetchProduct={handleHoverPrefetchProduct}
            onBackToHome={() => handleNavigate('home')}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {activeRoute === 'dashboard' && (
          <DashboardPage
            network={network}
            device={device}
            adaptive={adaptive}
            snapshot={snapshot}
            simulationPreset={simulationPreset}
            onSelectSimulation={setSimulationPreset}
            onTriggerInteraction={handleTriggerInteraction}
          />
        )}
      </main>

      {/* 4. Checkout Modal with Multi-Step Flow & Indian Payment Methods */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setDirectBuyItem(null);
        }}
        cart={cart}
        directBuyItem={directBuyItem}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
        onTrackOrder={(orderId) => {
          setIsCheckoutOpen(false);
          handleOpenTrackOrderWithId(orderId);
        }}
      />

      {/* 5. Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => {
          setIsTrackOrderOpen(false);
          setActiveTrackOrderId('');
        }}
        recentOrders={recentOrders}
        initialOrderId={activeTrackOrderId}
      />

      {/* 6. Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-8 px-4 sm:px-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-300">AdaptX India</span>
            <span>—</span>
            <span>Adaptive Web. Faster for Everyone. (₹ INR Localized)</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] flex-wrap justify-center">
            <button
              type="button"
              onClick={handleToggleTheme}
              className="text-amber-500 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
            >
              <span>{theme === 'day' ? '☀️ Day Mode' : '🌙 Night Mode'}</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenTrackOrderWithId()}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Track Order
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleNavigate('products')}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Catalog ({PRODUCTS.length} Items in ₹ INR)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setDirectBuyItem(null);
                setIsCheckoutOpen(true);
              }}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Indian Payment Gateway
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Web Vitals Lab
            </button>
            <span>•</span>
            <span>Active Tier: {adaptive.mode}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
