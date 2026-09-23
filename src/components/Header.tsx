import React, { useState } from 'react';
import {
  ShoppingBag,
  Sparkles,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sun,
  Moon,
  Heart,
  ArrowLeft,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { CartItem, ThemeMode } from '../types';
import { formatINR } from '../lib/currency';

interface HeaderProps {
  activeRoute: 'home' | 'products' | 'dashboard';
  onRouteChange: (route: 'home' | 'products' | 'dashboard') => void;
  cart: CartItem[];
  onUpdateCartQuantity: (productId: string, delta: number, variantId?: string) => void;
  onRemoveFromCart: (productId: string, variantId?: string) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
  onOpenTrackOrder?: () => void;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeRoute,
  onRouteChange,
  cart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  onOpenCheckout,
  onOpenTrackOrder,
  wishlistCount = 0,
  onOpenWishlist,
  onBack,
  canGoBack = false,
  theme = 'night',
  onToggleTheme,
}) => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    onOpenCheckout();
  };

  return (
    <>
      <header className="border-b border-neutral-800 bg-neutral-950/70 backdrop-blur-xl sticky top-[41px] z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Quick Back Button when navigating */}
            {canGoBack && onBack && (
              <button
                type="button"
                onClick={onBack}
                id="header-back-button"
                className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Go back to previous page"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onRouteChange('home')}
              id="brand-logo-btn"
              className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Adapt<span className="text-emerald-400">X</span>
              </span>
              <span className="hidden md:inline-block rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                ₹ INR Indian Store
              </span>
            </button>

            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => onRouteChange('home')}
                id="nav-home-btn"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  activeRoute === 'home'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                Featured
              </button>

              <button
                type="button"
                onClick={() => onRouteChange('products')}
                id="nav-products-btn"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  activeRoute === 'products'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                Catalog (50)
              </button>

              <button
                type="button"
                onClick={() => onRouteChange('dashboard')}
                id="nav-dashboard-btn"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeRoute === 'dashboard'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span className="hidden sm:inline">Performance &amp; AI</span>
                <span className="sm:hidden">Perf</span>
              </button>
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Track Order Button */}
            <button
              type="button"
              onClick={onOpenTrackOrder}
              id="track-order-header-btn"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer"
              title="Track your recent order delivery"
            >
              <Truck className="h-4 w-4 text-emerald-400" />
              <span className="hidden md:inline font-semibold">Track Order</span>
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={onOpenWishlist || (() => onRouteChange('products'))}
              id="wishlist-trigger-btn"
              className="relative flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-rose-400 hover:border-neutral-700 transition-all cursor-pointer"
              title={`Wishlist (${wishlistCount} items)`}
            >
              <Heart className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'}`} />
              <span className="hidden lg:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Day / Night Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              id="theme-toggle-btn"
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                theme === 'day'
                  ? 'border-amber-400/50 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-sm'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-700'
              }`}
              aria-label={`Current mode is ${theme === 'day' ? 'Day' : 'Night'} Mode. Click to switch.`}
              title={`Switch to ${theme === 'day' ? 'Night' : 'Day'} Mode`}
            >
              {theme === 'day' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-600 fill-amber-400" />
                  <span className="hidden lg:inline font-semibold">Day</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-400 fill-indigo-400/30" />
                  <span className="hidden lg:inline font-semibold">Night</span>
                </>
              )}
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              id="cart-trigger-btn"
              className="relative flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:border-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
              aria-label={`View Cart (${totalCartCount} items)`}
            >
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline font-bold font-mono">
                {totalCartCount > 0 ? formatINR(cartSubtotal) : 'Cart'}
              </span>
              {totalCartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-neutral-950">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div
              id="cart-slide-panel"
              className="w-screen max-w-md border-l border-neutral-800 bg-neutral-950 p-6 shadow-2xl flex flex-col justify-between"
            >
              {/* Cart Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-base font-bold text-white">Shopping Cart</h2>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      ({totalCartCount} items)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    id="close-cart-btn"
                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Cart Items List */}
                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="py-16 text-center text-neutral-500">
                      <ShoppingBag className="mx-auto h-10 w-10 text-neutral-700 mb-2" />
                      <p className="text-sm font-medium text-neutral-300">Your cart is currently empty.</p>
                      <p className="text-xs mt-1 text-neutral-500">
                        Explore our 50 Indian catalog products to add items.
                      </p>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div
                        key={`${item.product.id}-${item.selectedVariant?.id || 'default'}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3"
                      >
                        <img
                          src={item.product.images.low}
                          alt={item.product.name}
                          className="h-14 w-14 rounded-lg object-cover bg-neutral-800 border border-neutral-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-white truncate">{item.product.name}</h4>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xs text-emerald-400 font-mono font-bold">
                              {formatINR(item.product.price)}
                            </span>
                            {item.product.originalPrice && (
                              <span className="text-[10px] text-neutral-500 line-through font-mono">
                                {formatINR(item.product.originalPrice)}
                              </span>
                            )}
                          </div>
                          {item.selectedVariant && (
                            <span className="text-[10px] text-neutral-400 block mt-0.5">
                              {item.selectedVariant.name}
                            </span>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => onUpdateCartQuantity(item.product.id, -1, item.selectedVariant?.id)}
                              className="rounded bg-neutral-800 p-1 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-mono text-white px-1.5 font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateCartQuantity(item.product.id, 1, item.selectedVariant?.id)}
                              className="rounded bg-neutral-800 p-1 text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
                              title="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.product.id, item.selectedVariant?.id)}
                          className="rounded p-1.5 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-neutral-800 pt-4 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Total Amount (Incl. GST):</span>
                      <span className="font-mono font-bold text-white text-base">
                        {formatINR(cartSubtotal)}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Free All-India Delivery &amp; 7-Day Replacement</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleCheckoutClick}
                      id="cart-drawer-checkout-btn"
                      className="flex-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
