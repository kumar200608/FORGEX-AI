import React, { useState, useEffect, useMemo } from 'react';
import { Product, AdaptiveProfile, ProductVariant } from '../types';
import { AdaptiveImage, GalleryItem } from './AdaptiveImage';
import { StandardQuickCompare, Enhanced3DInspector, LiteNotice } from './AdaptiveFeatures';
import { Breadcrumb } from './Breadcrumb';
import {
  formatINR,
  formatINRNumber,
  calculateDiscountPercent,
  calculateSavings,
  getEstimatedDeliveryDate,
} from '../lib/currency';
import {
  X,
  Heart,
  ShoppingBag,
  Zap,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Receipt,
  Star,
  Sparkles,
  MapPin,
  ArrowLeft,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  adaptive: AdaptiveProfile;
  onAddToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  onBuyNow: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onBackToCatalog?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  adaptive,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  onBackToCatalog,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);

  // Reset activeGalleryIndex and quantity whenever a new product is selected
  useEffect(() => {
    setActiveGalleryIndex(0);
    setQuantity(1);
  }, [product?.id]);

  // Ensure full, consistent gallery list (Hero Angle + Perspectives)
  const modalGalleryList: GalleryItem[] = useMemo(() => {
    if (product.gallery && product.gallery.length > 0) {
      return product.gallery;
    }
    const baseHigh = product.images.high;
    const baseUltra4k = product.images.ultra4k || (baseHigh.includes('unsplash.com') ? baseHigh.replace(/w=\d+/, 'w=3840').replace(/q=\d+/, 'q=95') : baseHigh);
    return [
      {
        ...product.images,
        ultra4k: baseUltra4k,
        caption: 'Studio Angle',
      },
      {
        ultra4k: baseUltra4k,
        high: baseHigh,
        medium: product.images.medium,
        low: product.images.low,
        placeholder: product.images.placeholder,
        caption: '45° Isometric',
      },
      {
        ultra4k: baseUltra4k,
        high: baseHigh,
        medium: product.images.medium,
        low: product.images.low,
        placeholder: product.images.placeholder,
        caption: 'Macro Texture',
      },
    ];
  }, [product]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [pincodeInput, setPincodeInput] = useState('560001');
  const [pincodeStatus, setPincodeStatus] = useState<{ checked: boolean; valid: boolean; city?: string }>({
    checked: true,
    valid: true,
    city: 'Bengaluru',
  });
  const [addedAnimation, setAddedAnimation] = useState(false);

  const discountPercent = calculateDiscountPercent(product.price, product.originalPrice);
  const savings = calculateSavings(product.price, product.originalPrice);

  const handleCheckPincode = () => {
    const clean = pincodeInput.trim();
    if (clean.length === 6 && /^\d+$/.test(clean)) {
      let city = 'Metro Area';
      if (clean.startsWith('110')) city = 'New Delhi';
      else if (clean.startsWith('400')) city = 'Mumbai';
      else if (clean.startsWith('560')) city = 'Bengaluru';
      else if (clean.startsWith('600')) city = 'Chennai';
      else if (clean.startsWith('700')) city = 'Kolkata';
      else if (clean.startsWith('500')) city = 'Hyderabad';
      setPincodeStatus({ checked: true, valid: true, city });
    } else {
      setPincodeStatus({ checked: true, valid: false });
    }
  };

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedVariant);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleDirectBuy = () => {
    onBuyNow(product, quantity, selectedVariant);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-neutral-800 bg-neutral-950 p-5 sm:p-8 shadow-2xl text-neutral-100 max-h-[92vh] overflow-y-auto">
        {/* Navigation & Close Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800/80 gap-3">
          <Breadcrumb
            items={[
              { label: 'Home', onClick: onBackToCatalog || onClose },
              { label: product.category, onClick: onBackToCatalog || onClose },
              { label: product.name, active: true },
            ]}
            onBack={onBackToCatalog || onClose}
            showBackButton={true}
            className="border-0 bg-transparent p-0"
          />

          <button
            type="button"
            onClick={onClose}
            id="close-product-detail-modal-btn"
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Core Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Adaptive Images & Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/50 shadow-inner">
              {/* Wishlist Floating Button */}
              <button
                type="button"
                onClick={() => onToggleWishlist(product)}
                id="modal-toggle-wishlist-btn"
                className="absolute top-3 right-3 z-10 rounded-full p-2.5 bg-neutral-950/70 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-rose-400 transition-colors cursor-pointer"
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart
                  className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-neutral-300'}`}
                />
              </button>

              {/* Price Updated & Discount Badges */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                {product.is5G && (
                  <span className="rounded-md bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 px-2 py-0.5 text-[9px] font-mono font-black text-neutral-950 shadow-md">
                    ⚡ 5G ULTRA HD READY
                  </span>
                )}
                {product.isPriceUpdated && (
                  <span className="rounded-md bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold text-neutral-950 shadow">
                    Price Updated
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="rounded-md bg-amber-500/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold text-neutral-950 shadow">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              <AdaptiveImage
                images={product.images}
                gallery={modalGalleryList}
                alt={product.name}
                strategy={adaptive.imageStrategy}
                priority={true}
                aspectRatio="aspect-square"
                showBadge={true}
                showGallerySelector={false}
                enableHoverZoom={true}
                enableLightbox={true}
                activeGalleryIndex={activeGalleryIndex}
                onGalleryIndexChange={setActiveGalleryIndex}
              />
            </div>

            {/* Hover-to-Zoom 4K Texture Feature Guide Bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px] font-mono text-neutral-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Hover to Zoom 4K Textures</span>
              </span>
              <span className="text-neutral-500 text-[10px] hidden sm:inline">
                Ultra 3840px Lossless UHD Micro-Fidelity
              </span>
            </div>

            {/* Multi-angle Gallery Thumbnails */}
            {modalGalleryList.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {modalGalleryList.map((img, idx) => {
                  const isSelected = activeGalleryIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveGalleryIndex(idx)}
                      className={`relative rounded-xl overflow-hidden border aspect-square transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-102'
                          : 'border-neutral-800 bg-neutral-900/40 opacity-70 hover:opacity-100 hover:border-neutral-700'
                      }`}
                      title={img.caption || `Angle ${idx + 1} (Click to inspect 4K texture)`}
                    >
                      <img
                        src={img.low || img.medium}
                        alt={`${product.name} angle ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-neutral-950/85 text-[9px] font-mono text-emerald-300 text-center py-0.5 truncate px-1">
                        {img.caption || `Angle ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Information, Pricing in INR, Stock & Actions */}
          <div className="md:col-span-6 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span>{product.brand || 'AdaptX Prime'}</span>
                <span className="text-neutral-600">•</span>
                <span>{product.category}</span>
                {product.subCategory && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span>{product.subCategory}</span>
                  </>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mt-1">{product.name}</h2>
              <p className="text-xs text-neutral-400 mt-1">{product.tagline}</p>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-amber-400 font-bold font-mono">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-neutral-400">({product.reviewsCount} Indian customer ratings)</span>
                <span className="text-neutral-600">|</span>
                <span className={`font-mono text-[11px] ${product.stock < 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} units left)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Indian Rupee Pricing Section */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-mono font-black text-white">
                  {formatINR(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm font-mono text-neutral-500 line-through">
                    MRP: {formatINR(product.originalPrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ({discountPercent}% OFF)
                  </span>
                )}
              </div>

              {savings > 0 && (
                <div className="text-xs font-mono font-medium text-emerald-400">
                  You Save: <strong>{formatINR(savings)}</strong> inclusive of all taxes
                </div>
              )}

              <div className="text-[11px] text-neutral-400 pt-1 flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                <span>GST invoice with 18% tax credit included at checkout</span>
              </div>
            </div>

            {/* Product Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Select Edition / Color: <strong className="text-white">{selectedVariant?.name}</strong>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        selectedVariant?.id === v.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      {v.colorHex && (
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-neutral-700"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <span>{v.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pincode & Delivery Checker */}
            <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Delivery &amp; COD Availability
                </span>
                <span className="text-[11px] font-mono text-neutral-400">All India Delivery</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCheckPincode}
                  className="rounded-xl bg-neutral-800 hover:bg-neutral-700 px-3.5 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Check
                </button>
              </div>

              {pincodeStatus.checked && pincodeStatus.valid && (
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <Truck className="h-3 w-3" />
                  <span>
                    Get it by <strong>{getEstimatedDeliveryDate(3)}</strong> • Free Delivery &amp; COD available for {pincodeStatus.city}
                  </span>
                </div>
              )}
              {pincodeStatus.checked && !pincodeStatus.valid && (
                <div className="text-[11px] text-rose-400">
                  Please enter a valid 6-digit Indian Pincode.
                </div>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">Quantity:</span>
                <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="rounded-lg bg-neutral-950 p-1 text-neutral-400 hover:text-white disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-white px-2">{quantity}</span>
                  <button
                    type="button"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="rounded-lg bg-neutral-950 p-1 text-neutral-400 hover:text-white disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  id="modal-add-to-cart-btn"
                  className="rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 py-3 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {addedAnimation ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 text-emerald-400" />
                      <span>Add to Cart ({formatINR(product.price * quantity)})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDirectBuy}
                  id="modal-buy-now-btn"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Zap className="h-4 w-4 fill-neutral-950" />
                  <span>Buy Now (Instant Checkout)</span>
                </button>
              </div>
            </div>

            {/* Trust & Guarantee Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80 text-[10px] text-neutral-400 text-center">
              <div className="p-2 rounded-xl bg-neutral-900/40 border border-neutral-800">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                <span className="font-semibold text-neutral-200 block">100% Genuine</span>
                <span>Direct Brand Sourced</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/40 border border-neutral-800">
                <RotateCcw className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                <span className="font-semibold text-neutral-200 block">7-Day Return</span>
                <span>Hassle-free replacement</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/40 border border-neutral-800">
                <Truck className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                <span className="font-semibold text-neutral-200 block">Free Shipping</span>
                <span>On orders above ₹999</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Description, Specifications, and Adaptive Tier Modules */}
        <div className="mt-8 pt-6 border-t border-neutral-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Product Description</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">{product.description}</p>

              <h4 className="text-xs font-bold text-white mt-4 mb-2">Key Highlights</h4>
              <ul className="space-y-1.5 text-xs text-neutral-400">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-2">Technical Specifications</h3>
              <div className="rounded-xl border border-neutral-800 overflow-hidden text-xs">
                {Object.entries(product.specs).map(([key, val], idx) => (
                  <div
                    key={key}
                    className={`flex justify-between p-2.5 ${
                      idx % 2 === 0 ? 'bg-neutral-900/60' : 'bg-neutral-950'
                    }`}
                  >
                    <span className="text-neutral-400 font-medium">{key}</span>
                    <span className="text-neutral-200 font-mono text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* JS Tier Adaptive Simulation Modules */}
          <div className="pt-4 border-t border-neutral-800">
            {adaptive.jsTier === 'ENHANCED' && <Enhanced3DInspector product={product} />}
            {adaptive.jsTier === 'STANDARD' && <StandardQuickCompare product={product} />}
            {adaptive.jsTier === 'LITE' && (
              <LiteNotice reason="Active device concurrency or 3G bandwidth profile pruned the heavy 3D inspector to optimize INP & save mobile battery." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
