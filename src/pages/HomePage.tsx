import React, { useState, useEffect, useMemo } from 'react';
import { Product, AdaptiveProfile, NetworkProfile, DeviceProfile, ProductVariant } from '../types';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { AdaptiveImage } from '../components/AdaptiveImage';
import { ImageComparisonLab } from '../components/ImageComparisonLab';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { formatINR, calculateDiscountPercent } from '../lib/currency';
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShoppingBag,
  Clock,
  Check,
  Gauge,
  Heart,
  Star,
  ShieldCheck,
} from 'lucide-react';

interface HomePageProps {
  adaptive: AdaptiveProfile;
  network: NetworkProfile;
  device: DeviceProfile;
  onAddToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  onBuyNow: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  onNavigate: (route: 'home' | 'products' | 'dashboard') => void;
  onHoverPrefetchProduct: (product: Product) => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  adaptive,
  network,
  device,
  onAddToCart,
  onBuyNow,
  onNavigate,
  onHoverPrefetchProduct,
  wishlistIds,
  onToggleWishlist,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);

  // Handle delayed / deferred recommendations logic based on AdaptiveProfile
  useEffect(() => {
    if (adaptive.recommendations === 'instant') {
      setRecommendationsLoaded(true);
    } else if (adaptive.recommendations === 'delayed') {
      const timer = setTimeout(() => {
        setRecommendationsLoaded(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setRecommendationsLoaded(false);
    }
  }, [adaptive.recommendations]);

  const featuredProduct = PRODUCTS[0];
  const [homeCategory, setHomeCategory] = useState<string>('All');

  const is5G =
    network.effectiveType === '5g' ||
    network.classification === 'ULTRA_FAST' ||
    adaptive.imageStrategy === 'ultra-4k' ||
    network.downlinkMb >= 25;

  const is4G =
    !is5G &&
    (network.effectiveType === '4g' ||
      network.classification === 'FAST' ||
      adaptive.mode === 'ENHANCED');

  const displayProducts = useMemo(() => {
    if (homeCategory === 'All') return PRODUCTS.slice(1, 17);
    return PRODUCTS.filter((p) => p.category === homeCategory);
  }, [homeCategory]);

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleBuy = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyNow(product);
  };

  return (
    <div id="home-page-container" className="min-h-screen bg-neutral-950 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-800/80 bg-gradient-to-b from-neutral-900/50 via-neutral-950 to-neutral-950 pt-8 pb-14 sm:pt-14 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AdaptX Indian Store • ₹ INR Localized</span>
                <span className="text-emerald-600">|</span>
                <span className="font-mono text-[11px] text-emerald-300 font-semibold">
                  {adaptive.compressionLabel}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Adaptive Web.{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Faster for India.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed">
                Browse 50 premium engineering devices priced in Indian Rupee (₹ INR). Supporting UPI (GPay, PhonePe, Paytm), Cards, NetBanking, and Cash on Delivery with full adaptive payload delivery.
              </p>

              {/* Real-time Adaptation Impact Metric Callout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 backdrop-blur-sm">
                  <div className="text-[11px] text-neutral-500 font-medium">Image Strategy</div>
                  <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-0.5 capitalize">
                    {adaptive.imageStrategy} ({adaptive.imageTargetWidth}px)
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    {adaptive.imageStrategy === 'low' ? 'Saves ~78% 3G mobile data' : 'Full fidelity delivery'}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 backdrop-blur-sm">
                  <div className="text-[11px] text-neutral-500 font-medium">JavaScript Bundle Tier</div>
                  <div className="text-sm sm:text-base font-bold text-teal-400 font-mono mt-0.5">
                    Tier {adaptive.jsTier}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    {adaptive.jsTier === 'LITE' ? 'Heavy 3D interactors pruned' : 'Full rich interactions'}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 backdrop-blur-sm col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-neutral-500 font-medium">Indian Payment Gateway</div>
                  <div className="text-sm sm:text-base font-bold text-cyan-400 font-mono mt-0.5">
                    UPI / Cards / COD
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    0% Convenience Fee
                  </div>
                </div>
              </div>

              {/* CTA Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('products')}
                  id="hero-explore-catalog-btn"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-bold text-neutral-950 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>Explore 50 Products (₹ INR)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  id="hero-view-vitals-btn"
                  className="rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Gauge className="h-4 w-4 text-emerald-400" />
                  <span>Inspect Real Web Vitals</span>
                </button>
              </div>
            </div>

            {/* Hero Featured Product Card with Priority Image */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950 p-5 shadow-2xl backdrop-blur-xl">
                {/* Badge header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Flagship Priority Asset</span>
                  </div>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                    Price Updated
                  </span>
                </div>

                {/* Priority Adaptive Image */}
                <div className="rounded-2xl overflow-hidden border border-neutral-800/60 shadow-inner">
                  <AdaptiveImage
                    images={featuredProduct.images}
                    gallery={featuredProduct.gallery}
                    alt={featuredProduct.name}
                    strategy={adaptive.imageStrategy}
                    priority={true}
                    aspectRatio="aspect-16/10"
                    showBadge={true}
                    onHoverPrefetch={() => onHoverPrefetchProduct(featuredProduct)}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400">{featuredProduct.brand}</span>
                      <h2 className="text-xl font-bold text-white">{featuredProduct.name}</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-mono font-bold text-emerald-400 block">
                        {formatINR(featuredProduct.price)}
                      </span>
                      {featuredProduct.originalPrice && (
                        <span className="text-xs font-mono text-neutral-500 line-through">
                          MRP: {formatINR(featuredProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {featuredProduct.description}
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(featuredProduct)}
                      id="hero-inspect-modal-btn"
                      className="rounded-xl border border-neutral-700 bg-neutral-800 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-all cursor-pointer text-center"
                    >
                      Inspect &amp; 3D
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBuy(featuredProduct, e)}
                      id="hero-buy-now-btn"
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-bold text-neutral-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Zap className="h-3.5 w-3.5 fill-neutral-950" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-neutral-800/80 gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Live Adaptive Delivery Demo
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Featured Equipment (Indian Catalog)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('products')}
            id="view-all-products-link"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Full Catalog ({PRODUCTS.length} items in ₹ INR)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Category Exploration Tabs */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = homeCategory === cat;
            const count =
              cat === 'All'
                ? PRODUCTS.length
                : PRODUCTS.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setHomeCategory(cat)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20 font-bold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => {
            const discount = calculateDiscountPercent(product.price, product.originalPrice);
            const isWishlisted = wishlistIds.has(product.id);

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                onMouseEnter={() => onHoverPrefetchProduct(product)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 cursor-pointer ${
                  is5G
                    ? 'border-neutral-800 bg-neutral-900/60 hover:border-amber-400/90 hover:bg-neutral-900/95 shadow-xl hover:shadow-[0_0_35px_-5px_rgba(245,158,11,0.5),0_0_20px_rgba(16,185,129,0.35)] hover:-translate-y-1.5'
                    : is4G
                    ? 'border-neutral-800 bg-neutral-900/50 hover:border-emerald-500/50 hover:bg-neutral-900/85 shadow-md hover:shadow-[0_0_15px_-2px_rgba(16,185,129,0.22)] hover:-translate-y-0.5'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/70 shadow-sm'
                }`}
              >
                {/* 5G Switch: Full Radiant Glow Halo & Top Laser Refraction Line */}
                {is5G && (
                  <>
                    <div
                      className="pointer-events-none absolute -inset-[2.5px] -z-10 rounded-2xl bg-gradient-to-r from-amber-500/45 via-emerald-400/35 to-cyan-400/45 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                      aria-hidden="true"
                    />
                  </>
                )}

                {/* 4G Switch: Lightly Glow Soft Ambient Halo */}
                {is4G && !is5G && (
                  <>
                    <div
                      className="pointer-events-none absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-400/15 to-cyan-400/20 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-75"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] rounded-t-2xl bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-80"
                      aria-hidden="true"
                    />
                  </>
                )}

                <div>
                  {/* Product Image with Wishlist Button */}
                  <div className="rounded-xl overflow-hidden border border-neutral-800/80 relative">
                    <AdaptiveImage
                      images={product.images}
                      gallery={product.gallery}
                      alt={product.name}
                      strategy={adaptive.imageStrategy}
                      priority={false}
                      aspectRatio="aspect-square"
                      showBadge={true}
                      onHoverPrefetch={() => onHoverPrefetchProduct(product)}
                    />

                    {/* Top Right: 5G Glow / 4G Light Glow Badge & Wishlist Button */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                      {is5G ? (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full px-2 py-0.5 bg-amber-500/25 backdrop-blur-md border border-amber-400/60 text-[9px] font-mono font-bold text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                          5G GLOW
                        </span>
                      ) : is4G ? (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full px-2 py-0.5 bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 text-[9px] font-mono font-medium text-emerald-300/90 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
                          4G Light Glow
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product);
                        }}
                        className="rounded-full p-2 bg-neutral-950/70 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-rose-400 transition-colors cursor-pointer"
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    </div>

                    {product.isPriceUpdated && (
                      <div className="absolute top-2 left-2 z-10 rounded bg-emerald-500/90 text-neutral-950 px-1.5 py-0.5 text-[9px] font-mono font-bold shadow">
                        Price Updated
                      </div>
                    )}
                  </div>

                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{product.brand || product.category}</span>
                      <span className="text-amber-400 font-mono flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{product.rating}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                      {product.name}
                    </h3>

                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-mono font-bold text-white">
                        {formatINR(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="ml-1.5 text-xs text-neutral-500 line-through font-mono">
                          {formatINR(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleAdd(product, e)}
                      className="rounded-lg bg-neutral-800 hover:bg-neutral-700 py-1.5 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Add to cart"
                    >
                      {addedId === product.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      <span>{addedId === product.id ? 'Added' : 'Cart'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleBuy(product, e)}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-1.5 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Zap className="h-3 w-3 fill-neutral-950" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Image Fidelity & Byte Comparison Lab */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-14">
        <ImageComparisonLab currentStrategy={adaptive.imageStrategy} />
      </section>

      {/* Dynamic Recommendations Feed */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-16">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
            <div>
              <h3 className="text-lg font-bold text-white">
                Adaptive Delivery Engine Status
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Current decision profile computed from active network latency, downlink, and hardware threads.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-mono text-neutral-300 border border-neutral-700">
                Recommendations: <strong className="text-emerald-400 uppercase">{adaptive.recommendations}</strong>
              </span>
            </div>
          </div>

          {/* Conditional Recommendations Area */}
          <div className="mt-6 pt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Dynamic Recommendations Feed (Indian Stock)
              </span>
              {adaptive.recommendations === 'delayed' && !recommendationsLoaded && (
                <span className="flex items-center gap-1.5 text-xs text-blue-400 font-mono">
                  <Clock className="h-3 w-3 animate-spin" />
                  Delayed until main thread idle...
                </span>
              )}
            </div>

            {recommendationsLoaded ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-3">
                  <Sparkles className="h-4 w-4" />
                  <span>Personalized Gear Suggestions (₹ INR)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-300">
                  <div
                    onClick={() => setSelectedProduct(PRODUCTS[4])}
                    className="rounded-lg bg-neutral-900/80 p-3 border border-neutral-800 flex items-center justify-between gap-3 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={PRODUCTS[4].images.low} alt="" className="h-12 w-12 rounded object-cover" />
                      <div>
                        <div className="font-bold text-white">{PRODUCTS[4].name}</div>
                        <div className="text-emerald-400 font-mono font-bold">{formatINR(PRODUCTS[4].price)}</div>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 hover:text-white">View →</span>
                  </div>

                  <div
                    onClick={() => setSelectedProduct(PRODUCTS[5])}
                    className="rounded-lg bg-neutral-900/80 p-3 border border-neutral-800 flex items-center justify-between gap-3 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img src={PRODUCTS[5].images.low} alt="" className="h-12 w-12 rounded object-cover" />
                      <div>
                        <div className="font-bold text-white">{PRODUCTS[5].name}</div>
                        <div className="text-emerald-400 font-mono font-bold">{formatINR(PRODUCTS[5].price)}</div>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 hover:text-white">View →</span>
                  </div>
                </div>
              </div>
            ) : adaptive.recommendations === 'deferred' ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-center justify-between">
                <span>Recommendations were deferred to preserve data on Lite tier.</span>
                <button
                  type="button"
                  onClick={() => setRecommendationsLoaded(true)}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1.5 transition-colors cursor-pointer"
                >
                  Load Anyway
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 text-xs text-neutral-500 text-center">
                Recommendations module is currently disabled under this network condition.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          adaptive={adaptive}
          onAddToCart={onAddToCart}
          onBuyNow={(prod, qty, variant) => {
            setSelectedProduct(null);
            onBuyNow(prod, qty, variant);
          }}
          onToggleWishlist={onToggleWishlist}
          isWishlisted={wishlistIds.has(selectedProduct.id)}
        />
      )}
    </div>
  );
};
