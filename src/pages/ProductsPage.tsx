import React, { useState, useMemo } from 'react';
import { Product, AdaptiveProfile, NetworkProfile, ProductVariant } from '../types';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { AdaptiveImage } from '../components/AdaptiveImage';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { PriceRangeSlider } from '../components/PriceRangeSlider';
import {
  formatINR,
  formatINRNumber,
  calculateDiscountPercent,
  calculateSavings,
} from '../lib/currency';
import {
  Search,
  ShoppingBag,
  Check,
  X,
  Zap,
  Tag,
  Scale,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Heart,
  ArrowLeft,
  ArrowRight,
  Star,
  Sliders,
} from 'lucide-react';

interface ProductsPageProps {
  adaptive: AdaptiveProfile;
  network?: NetworkProfile;
  onAddToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  onBuyNow: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  onHoverPrefetchProduct: (product: Product) => void;
  onBackToHome?: () => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  adaptive,
  network,
  onAddToCart,
  onBuyNow,
  onHoverPrefetchProduct,
  onBackToHome,
  wishlistIds,
  onToggleWishlist,
}) => {
  // Check if active network is 5G/Ultra Fast or 4G/Fast for hardware-accelerated glowing effects
  const is5G =
    network?.effectiveType === '5g' ||
    network?.classification === 'ULTRA_FAST' ||
    adaptive.imageStrategy === 'ultra-4k' ||
    (network?.downlinkMb !== undefined && network.downlinkMb >= 25);

  const is4G =
    !is5G &&
    (network?.effectiveType === '4g' ||
      network?.classification === 'FAST' ||
      adaptive.mode === 'ENHANCED');

  // Compute absolute catalog min and max prices
  const catalogMinPrice = useMemo(() => {
    return Math.min(...PRODUCTS.map((p) => p.price));
  }, []);

  const catalogMaxPrice = useMemo(() => {
    return Math.max(...PRODUCTS.map((p) => p.price));
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<string>('All');
  const [priceRangeValues, setPriceRangeValues] = useState<[number, number]>(() => [
    catalogMinPrice,
    catalogMaxPrice,
  ]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [wishlistOnly, setWishlistOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'reviews'>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  // Derive unique badges across catalog
  const availableBadges = useMemo(() => {
    const badges = new Set<string>();
    PRODUCTS.forEach((p) => {
      if (p.badge) badges.add(p.badge);
    });
    return ['All', ...Array.from(badges)];
  }, []);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: PRODUCTS.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = PRODUCTS.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, []);

  // Compute subcategories for selected category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'All') return [];
    const subs = new Set<string>();
    PRODUCTS.filter((p) => p.category === selectedCategory).forEach((p) => {
      if (p.subCategory) subs.add(p.subCategory);
    });
    return ['All', ...Array.from(subs)];
  }, [selectedCategory]);

  const isPriceFiltered =
    priceRangeValues[0] > catalogMinPrice || priceRangeValues[1] < catalogMaxPrice;

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      // Category filter
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

      // Subcategory filter
      const matchesSubCat =
        selectedSubCategory === 'All' || !p.subCategory || p.subCategory === selectedSubCategory;

      // Badge filter
      const matchesBadge = selectedBadge === 'All' || p.badge === selectedBadge;

      // Wishlist filter
      const matchesWishlist = !wishlistOnly || wishlistIds.has(p.id);

      // Custom Indian Rupee Price Range Segment filter
      const matchesPrice = p.price >= priceRangeValues[0] && p.price <= priceRangeValues[1];

      // In stock filter
      const matchesStock = !inStockOnly || (p.inStock && p.stock > 0);

      // Search query
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        p.tagline.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q)) ||
        Object.entries(p.specs).some(([k, v]) =>
          k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
        );

      return (
        matchesCat &&
        matchesSubCat &&
        matchesBadge &&
        matchesWishlist &&
        matchesPrice &&
        matchesStock &&
        matchesQuery
      );
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewsCount - a.reviewsCount;
      return 0;
    });
  }, [
    selectedCategory,
    selectedSubCategory,
    selectedBadge,
    wishlistOnly,
    wishlistIds,
    priceRangeValues,
    inStockOnly,
    searchQuery,
    sortBy,
  ]);

  // Telemetry computation reacting to active AdaptiveProfile
  const payloadStats = useMemo(() => {
    const count = filteredProducts.length;
    const baselineKb = count * 1200;
    let deliveredKb = 0;
    if (adaptive.imageStrategy === 'high') deliveredKb = count * 1200;
    else if (adaptive.imageStrategy === 'medium') deliveredKb = count * 280;
    else if (adaptive.imageStrategy === 'low') deliveredKb = count * 72;
    else deliveredKb = count * 18;

    const savedKb = Math.max(0, baselineKb - deliveredKb);
    const savingsPercent = baselineKb > 0 ? Math.round((savedKb / baselineKb) * 100) : 0;

    return {
      baselineMb: (baselineKb / 1024).toFixed(1),
      deliveredMb: (deliveredKb / 1024).toFixed(1),
      savedMb: (savedKb / 1024).toFixed(1),
      savingsPercent,
    };
  }, [filteredProducts.length, adaptive.imageStrategy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedSubCategory !== 'All') count++;
    if (selectedBadge !== 'All') count++;
    if (isPriceFiltered) count++;
    if (inStockOnly) count++;
    if (wishlistOnly) count++;
    if (searchQuery.trim().length > 0) count++;
    return count;
  }, [
    selectedCategory,
    selectedSubCategory,
    selectedBadge,
    isPriceFiltered,
    inStockOnly,
    wishlistOnly,
    searchQuery,
  ]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedSubCategory('All');
    setSelectedBadge('All');
    setPriceRangeValues([catalogMinPrice, catalogMaxPrice]);
    setInStockOnly(false);
    setWishlistOnly(false);
    setSearchQuery('');
    setSortBy('featured');
  };

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

  const strategyDetails = {
    'ultra-4k': {
      label: 'Ultra 4K UHD (5G Gigabit)',
      res: '3840px Lossless UHD',
      savings: 'Maximum Fidelity / Uncapped',
      color: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
    },
    high: {
      label: 'High-Res Variant',
      res: '1200px Full Quality',
      savings: 'Baseline (Uncompressed)',
      color: 'text-neutral-200 border-neutral-700 bg-neutral-800/60',
    },
    medium: {
      label: 'Balanced Adaptive',
      res: '600px Compressed WebP',
      savings: '-77% Bytes Saved',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    low: {
      label: 'Lite Compression',
      res: '300px High-Efficiency',
      savings: '-94% Bytes Saved',
      color: 'text-teal-300 border-teal-500/30 bg-teal-500/10',
    },
    minimal: {
      label: 'Offline Minimalist',
      res: '60px Blur Vector',
      savings: '-98% Bytes Saved',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
  }[adaptive.imageStrategy] || {
    label: 'Standard Adaptive',
    res: '1200px Full Quality',
    savings: 'Dynamic Network Tuning',
    color: 'text-neutral-200 border-neutral-700 bg-neutral-800/60',
  };

  return (
    <div id="products-catalog-page" className="min-h-screen bg-neutral-950 pb-24 pt-4 sm:pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-5">
        {/* Breadcrumb Navigation with Back Button */}
        <Breadcrumb
          items={[
            { label: 'Home', onClick: onBackToHome },
            {
              label: 'Catalog',
              onClick: () => {
                setSelectedCategory('All');
                setSelectedSubCategory('All');
              },
            },
            ...(selectedCategory !== 'All'
              ? [{ label: selectedCategory, active: selectedSubCategory === 'All' }]
              : []),
            ...(selectedSubCategory !== 'All' ? [{ label: selectedSubCategory, active: true }] : []),
          ]}
          onBack={onBackToHome}
          showBackButton={true}
        />

        {/* Title Header */}
        <div className="pb-4 border-b border-neutral-800">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                  AdaptX Indian Store Catalog
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 text-[10px] font-mono border border-emerald-500/20">
                  {PRODUCTS.length} Indian Market Products
                </span>
                <span className="rounded-full bg-cyan-500/10 text-cyan-400 px-2 py-0.5 text-[10px] font-mono border border-cyan-500/20">
                  ₹ INR Currency
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white mt-1">
                Hardware &amp; Lifestyle Instruments
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
                Explore our full catalog with realistic Indian market prices in ₹ INR. All items include GST invoice, brand warranty, and fast all-India delivery.
              </p>
            </div>

            {/* Active Adaptive Image Strategy Callout */}
            <div className={`rounded-xl border p-3 ${strategyDetails.color} font-mono text-xs flex items-center gap-3`}>
              <Zap className="h-4 w-4 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider">Image Strategy:</span>
                  <span className="font-bold underline">{strategyDetails.label}</span>
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Target: {strategyDetails.res} ({strategyDetails.savings})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Filter Bar: Search + Category Pills */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                id="catalog-search-input"
                placeholder="Search by product name, brand, spec, category (e.g. Sony, OLED, ₹)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Quick Toggles */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Wishlist filter toggle */}
              <button
                type="button"
                onClick={() => setWishlistOnly(!wishlistOnly)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                  wishlistOnly
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${wishlistOnly ? 'fill-rose-500' : ''}`} />
                <span>Wishlist ({wishlistIds.size})</span>
              </button>

              {/* In-Stock Toggle */}
              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                  inStockOnly
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <PackageCheck className="h-3.5 w-3.5" />
                <span>In Stock</span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="catalog-sort-select" className="text-xs text-neutral-400 font-medium">
                  Sort:
                </label>
                <select
                  id="catalog-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price (₹): Low to High</option>
                  <option value="price-desc">Price (₹): High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                  <option value="reviews">Most Reviewed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categories Pill List with Counts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubCategory('All');
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20'
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

          {/* Subcategories (Dynamic when Category Selected) */}
          {selectedCategory !== 'All' && availableSubCategories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pl-1 text-xs">
              <span className="text-[11px] font-mono text-neutral-500 mr-1">Sub-filters:</span>
              {availableSubCategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                    selectedSubCategory === sub
                      ? 'bg-neutral-200 text-neutral-950 font-bold'
                      : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Secondary Filter Row: Badges & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/60 text-xs">
            {/* Badge Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-neutral-500 font-mono text-[11px] flex items-center gap-1">
                <Tag className="h-3 w-3" /> Badge:
              </span>
              {availableBadges.map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setSelectedBadge(badge)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedBadge === badge
                      ? 'bg-neutral-200 text-neutral-950 font-bold'
                      : 'bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
          </div>

          {/* Dedicated Custom Indian Rupee Price Segment Range Slider */}
          <PriceRangeSlider
            min={catalogMinPrice}
            max={catalogMaxPrice}
            value={priceRangeValues}
            onChange={(newRange) => setPriceRangeValues(newRange)}
            totalProductsCount={PRODUCTS.length}
            filteredProductsCount={filteredProducts.length}
          />

          {/* Active Filter Chips & Summary */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-neutral-400">
                Showing <strong className="text-white">{filteredProducts.length}</strong> of{' '}
                <strong className="text-white">{PRODUCTS.length}</strong> Indian items
              </span>

              {selectedCategory !== 'All' && (
                <span className="flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-mono text-emerald-400 border border-neutral-700">
                  Category: {selectedCategory}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedSubCategory('All');
                    }}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedSubCategory !== 'All' && (
                <span className="flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-mono text-cyan-300 border border-neutral-700">
                  Sub-category: {selectedSubCategory}
                  <button type="button" onClick={() => setSelectedSubCategory('All')} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {isPriceFiltered && (
                <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-mono text-emerald-300 border border-emerald-500/40">
                  Price: {formatINR(priceRangeValues[0])} — {formatINR(priceRangeValues[1])}
                  <button
                    type="button"
                    onClick={() => setPriceRangeValues([catalogMinPrice, catalogMaxPrice])}
                    className="hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedBadge !== 'All' && (
                <span className="flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-mono text-amber-300 border border-neutral-700">
                  Badge: {selectedBadge}
                  <button type="button" onClick={() => setSelectedBadge('All')} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {wishlistOnly && (
                <span className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-mono text-rose-300 border border-rose-500/40">
                  Wishlist Only
                  <button type="button" onClick={() => setWishlistOnly(false)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-mono text-emerald-300 border border-emerald-500/40">
                  In Stock Only
                  <button type="button" onClick={() => setInStockOnly(false)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-mono text-neutral-300 border border-neutral-700">
                  Query: "{searchQuery}"
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div>
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-3xl p-6">
              <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2 opacity-80" />
              <p className="text-base font-bold text-white">No products match your active filter criteria.</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Try widening your search terms, selecting "All Categories", or removing the active badge/price constraints.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Filters ({PRODUCTS.length} items)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
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
                    {/* 5G Switch: Full Radiant Glow Ambient Halo & Top Laser Line */}
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
                      {/* Image container with badges & wishlist toggle */}
                      <div className="rounded-xl overflow-hidden border border-neutral-800/80 relative">
                        <AdaptiveImage
                          images={product.images}
                          gallery={product.gallery}
                          alt={product.name}
                          strategy={adaptive.imageStrategy}
                          priority={false}
                          aspectRatio="aspect-4/3"
                          showBadge={true}
                          showGallerySelector={false}
                          onHoverPrefetch={() => onHoverPrefetchProduct(product)}
                        />

                        {/* Top Left Badges */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                          {product.is5G && (
                            <span className="rounded-md bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 px-2 py-0.5 text-[8.5px] font-mono font-black text-neutral-950 shadow-md">
                              5G READY
                            </span>
                          )}
                          {product.isPriceUpdated && (
                            <span className="rounded-md bg-emerald-500/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-mono font-black text-neutral-950 shadow">
                              Price Updated
                            </span>
                          )}
                          {product.badge && (
                            <span className="rounded-md bg-neutral-950/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono font-bold tracking-wide text-amber-300 border border-amber-500/30">
                              {product.badge}
                            </span>
                          )}
                        </div>

                        {/* Top Right: 5G Glow / 4G Light Glow Badge & Wishlist Button */}
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
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
                      </div>

                      {/* Categorized Metadata Bar */}
                      <div className="mt-3.5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                          <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-300 border border-neutral-700/60">
                            {product.brand || product.category}
                            {product.subCategory ? ` • ${product.subCategory}` : ''}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-amber-400 font-bold">{product.rating}</span>
                            <span className="text-neutral-500">({product.reviewsCount})</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-emerald-400/80 font-mono line-clamp-1">
                            {product.tagline}
                          </p>
                        </div>

                        <p className="text-xs text-neutral-400 line-clamp-2">{product.description}</p>
                      </div>
                    </div>

                    {/* Pricing in INR and Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-mono font-bold text-white">
                              {formatINR(product.price)}
                            </span>
                            {product.originalPrice && (
                              <span className="text-xs text-neutral-500 line-through font-mono">
                                {formatINR(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          {discount > 0 && (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 block">
                              {discount}% OFF • Inclusive of GST
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-neutral-400">
                          {product.stock <= 10 ? (
                            <span className="text-amber-400 font-semibold">Only {product.stock} left</span>
                          ) : (
                            <span className="text-emerald-400">In Stock</span>
                          )}
                        </span>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleAdd(product, e)}
                          id={`add-cart-btn-${product.id}`}
                          className="rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 py-2 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {addedId === product.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Add</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleBuy(product, e)}
                          id={`buy-now-btn-${product.id}`}
                          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1"
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
          )}
        </div>

        {/* Modal Product Details */}
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
            onBackToCatalog={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </div>
  );
};
