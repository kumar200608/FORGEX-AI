import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Banknote,
  Truck,
  MapPin,
  ShoppingBag,
  Percent,
  Copy,
  Download,
  Printer,
  Sparkles,
  Calendar,
  AlertCircle,
  QrCode,
  Tag,
  Clock,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import {
  CartItem,
  IndianAddress,
  PaymentInfo,
  PaymentMethodType,
  DeliveryOption,
  PlacedOrder,
} from '../types';
import {
  formatINR,
  formatINRNumber,
  calculateSavings,
  getEstimatedDeliveryDate,
  INDIAN_STATES,
} from '../lib/currency';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderSuccess?: (order: PlacedOrder) => void;
  onTrackOrder?: (orderId: string) => void;
  directBuyItem?: CartItem | null;
}

type CheckoutStep = 'cart' | 'address' | 'delivery' | 'payment' | 'review' | 'confirmed';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart: initialCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  onTrackOrder,
  directBuyItem,
}) => {
  // Use directBuyItem if provided, otherwise regular cart
  const cart = useMemo(() => {
    if (directBuyItem) return [directBuyItem];
    return initialCart;
  }, [directBuyItem, initialCart]);

  const [step, setStep] = useState<CheckoutStep>('cart');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Address state
  const [address, setAddress] = useState<IndianAddress>({
    fullName: 'Rahul Sharma',
    phone: '9876543210',
    pincode: '560001',
    flat: 'Flat 402, Prestige Tower',
    street: 'MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    landmark: 'Near Metro Station',
    addressType: 'home',
  });
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof IndianAddress, string>>>({});

  // Delivery Option state
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>({
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Reliable doorstep ground shipping',
    estimatedDays: getEstimatedDeliveryDate(4),
    price: 0,
  });

  // Payment State
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'upi',
    upiApp: 'Google Pay',
    upiId: 'rahul.sharma@okaxis',
    cardNumber: '4532 8901 2345 6789',
    cardHolder: 'RAHUL SHARMA',
    cardExpiry: '08/28',
    cardCvv: '789',
    bankName: 'HDFC Bank',
    walletName: 'Paytm Wallet',
    emiTenureMonths: 6,
  });

  const [customUpiId, setCustomUpiId] = useState('');
  const [codCaptchaInput, setCodCaptchaInput] = useState('');
  const [codCaptchaError, setCodCaptchaError] = useState('');
  const [generatedCaptcha] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalMRP = useMemo(() => {
    return cart.reduce((sum, item) => {
      const original = item.product.originalPrice || item.product.price;
      return sum + original * item.quantity;
    }, 0);
  }, [cart]);

  const totalItemSavings = Math.max(0, totalMRP - subtotal);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  // Indian GST 18% inclusive / calculated
  const gstAmount = Math.round(taxableAmount * 0.18);
  const shippingFee = deliveryOption.price;
  const totalAmount = taxableAmount + shippingFee;

  // Available Delivery Options
  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      description: 'Free across all serviceable Indian pincodes',
      estimatedDays: getEstimatedDeliveryDate(4),
      price: 0,
    },
    {
      id: 'express',
      name: 'Express Air Shipping',
      description: 'Guaranteed 24-48 hours priority dispatch',
      estimatedDays: getEstimatedDeliveryDate(2),
      price: 149,
    },
    {
      id: 'same_day',
      name: 'Same Day Metro Express',
      description: 'Available for Delhi NCR, Mumbai, Bengaluru',
      estimatedDays: 'Today by 9:00 PM',
      price: 299,
    },
  ];

  // Coupon application logic
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'FESTIVE10' || code === 'INDIA10') {
      const discount = Math.round(subtotal * 0.1);
      setAppliedCoupon({ code, discountAmount: discount });
      setCouponInput('');
    } else if (code === 'ADAPTX500' || code === 'SAVE500') {
      const discount = Math.min(500, subtotal);
      setAppliedCoupon({ code, discountAmount: discount });
      setCouponInput('');
    } else if (code === 'FIRSTBUY') {
      const discount = Math.round(subtotal * 0.15);
      setAppliedCoupon({ code, discountAmount: discount });
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code. Try FESTIVE10 or ADAPTX500');
    }
  };

  // Pincode lookup helper
  const handlePincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setAddress((prev) => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      if (cleanPin.startsWith('110')) {
        setAddress((prev) => ({ ...prev, city: 'New Delhi', state: 'Delhi NCR' }));
      } else if (cleanPin.startsWith('400')) {
        setAddress((prev) => ({ ...prev, city: 'Mumbai', state: 'Maharashtra' }));
      } else if (cleanPin.startsWith('560')) {
        setAddress((prev) => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
      } else if (cleanPin.startsWith('600')) {
        setAddress((prev) => ({ ...prev, city: 'Chennai', state: 'Tamil Nadu' }));
      } else if (cleanPin.startsWith('700')) {
        setAddress((prev) => ({ ...prev, city: 'Kolkata', state: 'West Bengal' }));
      } else if (cleanPin.startsWith('500')) {
        setAddress((prev) => ({ ...prev, city: 'Hyderabad', state: 'Telangana' }));
      } else if (cleanPin.startsWith('380')) {
        setAddress((prev) => ({ ...prev, city: 'Ahmedabad', state: 'Gujarat' }));
      } else if (cleanPin.startsWith('411')) {
        setAddress((prev) => ({ ...prev, city: 'Pune', state: 'Maharashtra' }));
      }
    }
  };

  // Address validation
  const validateAddress = (): boolean => {
    const errors: Partial<Record<keyof IndianAddress, string>> = {};
    if (!address.fullName.trim()) errors.fullName = 'Please enter your full name';
    if (!address.phone.trim() || address.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }
    if (!address.pincode.trim() || address.pincode.length !== 6) {
      errors.pincode = 'Please enter a valid 6-digit Pincode';
    }
    if (!address.flat.trim()) errors.flat = 'Please enter flat/house no./building name';
    if (!address.street.trim()) errors.street = 'Please enter street / locality';
    if (!address.city.trim()) errors.city = 'Please enter city';
    if (!address.state.trim()) errors.state = 'Please select state';

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step transitions
  const handleProceedToAddress = () => {
    if (cart.length === 0) return;
    setStep('address');
  };

  const handleProceedToDelivery = () => {
    if (validateAddress()) {
      setStep('delivery');
    }
  };

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handleProceedToReview = () => {
    setStep('review');
  };

  // Step back navigation
  const handleStepBack = () => {
    if (step === 'address') setStep('cart');
    else if (step === 'delivery') setStep('address');
    else if (step === 'payment') setStep('delivery');
    else if (step === 'review') setStep('payment');
  };

  // Place Order Simulation
  const handlePlaceOrder = () => {
    if (paymentInfo.method === 'cod') {
      if (codCaptchaInput.trim() !== generatedCaptcha) {
        setCodCaptchaError('Please enter the matching 4-digit verification code.');
        setStep('payment');
        return;
      }
    }
    setCodCaptchaError('');

    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      const newOrder: PlacedOrder = {
        id: `ADX-IN-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: Date.now(),
        items: [...cart],
        address: { ...address },
        deliveryOption: { ...deliveryOption },
        paymentInfo: { ...paymentInfo },
        subtotal,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
        gstAmount,
        shippingFee,
        totalAmount,
        status: 'confirmed',
        trackingNumber: `EXP-DEL-${Math.floor(10000000 + Math.random() * 90000000)}IN`,
      };

      setPlacedOrder(newOrder);
      setStep('confirmed');
      if (onOrderSuccess) onOrderSuccess(newOrder);
      if (!directBuyItem) onClearCart();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-neutral-800 bg-neutral-950 p-5 sm:p-8 shadow-2xl text-neutral-100 max-h-[92vh] flex flex-col justify-between overflow-hidden">
        {/* Header & Steps Indicator */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              {step !== 'cart' && step !== 'confirmed' && (
                <button
                  type="button"
                  onClick={handleStepBack}
                  id="checkout-back-step-btn"
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Back</span>
                </button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white">
                    Adapt<span className="text-emerald-400">X</span> Express Checkout
                  </span>
                  <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                    ₹ INR Localized
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Secure 256-Bit SSL Encrypted Indian Payment Gateway
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              id="close-checkout-modal-btn"
              className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          {step !== 'confirmed' && (
            <div className="py-3.5 border-b border-neutral-800/80">
              <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-medium">
                <div
                  className={`flex items-center gap-1.5 cursor-pointer ${
                    step === 'cart' ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                  onClick={() => setStep('cart')}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-mono border border-neutral-700">
                    1
                  </span>
                  <span className="hidden sm:inline">Cart</span>
                </div>
                <div className="h-[1px] w-6 sm:w-12 bg-neutral-800" />

                <div
                  className={`flex items-center gap-1.5 cursor-pointer ${
                    step === 'address' ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                  onClick={() => {
                    if (cart.length > 0) setStep('address');
                  }}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-mono border border-neutral-700">
                    2
                  </span>
                  <span className="hidden sm:inline">Address</span>
                </div>
                <div className="h-[1px] w-6 sm:w-12 bg-neutral-800" />

                <div
                  className={`flex items-center gap-1.5 cursor-pointer ${
                    step === 'delivery' ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                  onClick={() => {
                    if (validateAddress()) setStep('delivery');
                  }}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-mono border border-neutral-700">
                    3
                  </span>
                  <span className="hidden sm:inline">Delivery</span>
                </div>
                <div className="h-[1px] w-6 sm:w-12 bg-neutral-800" />

                <div
                  className={`flex items-center gap-1.5 cursor-pointer ${
                    step === 'payment' ? 'text-emerald-400 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                  onClick={() => {
                    if (validateAddress()) setStep('payment');
                  }}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-mono border border-neutral-700">
                    4
                  </span>
                  <span className="hidden sm:inline">Payment</span>
                </div>
                <div className="h-[1px] w-6 sm:w-12 bg-neutral-800" />

                <div
                  className={`flex items-center gap-1.5 ${
                    step === 'review' ? 'text-emerald-400 font-bold' : 'text-neutral-500'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-mono border border-neutral-700">
                    5
                  </span>
                  <span className="hidden sm:inline">Review</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 pr-1">
          {/* STEP 1: CART REVIEW */}
          {step === 'cart' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-400" />
                  <span>Review Order Items ({cart.length})</span>
                </h3>
                {cart.length > 0 && !directBuyItem && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-16 text-center text-neutral-500">
                  <ShoppingBag className="mx-auto h-12 w-12 text-neutral-700 mb-2" />
                  <p className="text-sm font-semibold text-neutral-300">Your cart is currently empty</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Please select an item from our 50 Indian catalog products.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const itemSavings = calculateSavings(item.product.price, item.product.originalPrice);
                    return (
                      <div
                        key={item.product.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.product.images.low}
                            alt={item.product.name}
                            className="h-16 w-16 rounded-xl object-cover bg-neutral-800 border border-neutral-700"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold text-emerald-400">
                                {item.product.brand || item.product.category}
                              </span>
                              {item.product.isPriceUpdated && (
                                <span className="rounded bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 text-[9px] font-mono border border-emerald-500/20">
                                  Price Updated
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white">{item.product.name}</h4>
                            <p className="text-xs text-neutral-400 line-clamp-1">{item.product.tagline}</p>
                            {item.selectedVariant && (
                              <span className="inline-block mt-1 text-[11px] font-mono text-neutral-300">
                                Variant: <strong>{item.selectedVariant.name}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6">
                          {/* Quantity control */}
                          <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-1">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="rounded-lg bg-neutral-900 p-1.5 text-neutral-300 hover:bg-neutral-800 transition-colors"
                              title="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-mono font-bold text-white px-2">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="rounded-lg bg-neutral-900 p-1.5 text-neutral-300 hover:bg-neutral-800 transition-colors"
                              title="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Price breakdown */}
                          <div className="text-right">
                            <div className="text-base font-mono font-bold text-white">
                              {formatINR(item.product.price * item.quantity)}
                            </div>
                            {item.product.originalPrice && (
                              <div className="text-xs text-neutral-500 line-through font-mono">
                                {formatINR(item.product.originalPrice * item.quantity)}
                              </div>
                            )}
                            {itemSavings > 0 && (
                              <div className="text-[10px] font-mono font-semibold text-emerald-400">
                                Save {formatINR(itemSavings * item.quantity)}
                              </div>
                            )}
                          </div>

                          {!directBuyItem && (
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.product.id)}
                              className="rounded-lg p-2 text-neutral-500 hover:text-rose-400 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Indian Coupon Code Section */}
              {cart.length > 0 && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Apply Festive Promo Coupon</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code: FESTIVE10, ADAPTX500, FIRSTBUY"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono uppercase text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  {couponError && <p className="text-xs text-rose-400 mt-1">{couponError}</p>}

                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300">
                      <span className="font-mono font-bold">
                        Coupon "{appliedCoupon.code}" Applied! ({formatINR(appliedCoupon.discountAmount)} discount)
                      </span>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(null)}
                        className="text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
                    <span>Popular:</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('FESTIVE10')}
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      FESTIVE10 (10% Off)
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput('ADAPTX500')}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      ADAPTX500 (₹500 Flat)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DELIVERY ADDRESS */}
          {step === 'address' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <span>Indian Delivery & Billing Address</span>
                </h3>
                <span className="text-xs font-mono text-neutral-400">Pincode Auto-Detection Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full rounded-xl border ${
                      addressErrors.fullName ? 'border-rose-500' : 'border-neutral-800'
                    } bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none`}
                  />
                  {addressErrors.fullName && (
                    <p className="text-[11px] text-rose-400 mt-1">{addressErrors.fullName}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 mb-1 block">
                    10-Digit Mobile Number (For Delivery SMS / OTP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={(e) =>
                        setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                      }
                      placeholder="9876543210"
                      className={`w-full rounded-xl border ${
                        addressErrors.phone ? 'border-rose-500' : 'border-neutral-800'
                      } bg-neutral-900 pl-11 pr-3 py-2.5 text-xs font-mono text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none`}
                    />
                  </div>
                  {addressErrors.phone && (
                    <p className="text-[11px] text-rose-400 mt-1">{addressErrors.phone}</p>
                  )}
                </div>

                {/* 6-Digit Pincode */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 mb-1 block">
                    6-Digit Pincode (Auto-fills City & State) *
                  </label>
                  <input
                    type="text"
                    value={address.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="e.g. 560001 or 110001"
                    className={`w-full rounded-xl border ${
                      addressErrors.pincode ? 'border-rose-500' : 'border-neutral-800'
                    } bg-neutral-900 px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none`}
                  />
                  {addressErrors.pincode && (
                    <p className="text-[11px] text-rose-400 mt-1">{addressErrors.pincode}</p>
                  )}
                </div>

                {/* Flat / Building */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 mb-1 block">
                    Flat, House No., Building Name *
                  </label>
                  <input
                    type="text"
                    value={address.flat}
                    onChange={(e) => setAddress({ ...address, flat: e.target.value })}
                    placeholder="e.g. Flat 402, Prestige Tower"
                    className={`w-full rounded-xl border ${
                      addressErrors.flat ? 'border-rose-500' : 'border-neutral-800'
                    } bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none`}
                  />
                  {addressErrors.flat && (
                    <p className="text-[11px] text-rose-400 mt-1">{addressErrors.flat}</p>
                  )}
                </div>

                {/* Street / Locality */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 mb-1 block">
                    Area, Colony, Street, Sector *
                  </label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="e.g. MG Road, Indiranagar"
                    className={`w-full rounded-xl border ${
                      addressErrors.street ? 'border-rose-500' : 'border-neutral-800'
                    } bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none`}
                  />
                  {addressErrors.street && (
                    <p className="text-[11px] text-rose-400 mt-1">{addressErrors.street}</p>
                  )}
                </div>

                {/* Landmark */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 mb-1 block">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                    placeholder="e.g. Near Metro Station / Apollo Hospital"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 mb-1 block">Town / City *</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                    className={`w-full rounded-xl border ${
                      addressErrors.city ? 'border-rose-500' : 'border-neutral-800'
                    } bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none`}
                  />
                  {addressErrors.city && (
                    <p className="text-[11px] text-rose-400 mt-1">{addressErrors.city}</p>
                  )}
                </div>

                {/* State Dropdown */}
                <div>
                  <label className="text-xs font-medium text-neutral-300 mb-1 block">State / UT *</label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address Type Pill Selector */}
              <div className="pt-2">
                <label className="text-xs font-medium text-neutral-400 mb-1.5 block">Address Type</label>
                <div className="flex gap-3">
                  {(['home', 'work', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAddress({ ...address, addressType: type })}
                      className={`rounded-xl px-4 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer border ${
                        address.addressType === type
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {type} (7 AM - 9 PM)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DELIVERY OPTIONS */}
          {step === 'delivery' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-400" />
                <span>Select Delivery Speed for {address.city}, {address.pincode}</span>
              </h3>

              <div className="space-y-3">
                {deliveryOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setDeliveryOption(opt)}
                    className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                      deliveryOption.id === opt.id
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg'
                        : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                          deliveryOption.id === opt.id
                            ? 'border-emerald-500 bg-emerald-500 text-neutral-950'
                            : 'border-neutral-700 bg-neutral-950'
                        }`}
                      >
                        {deliveryOption.id === opt.id && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{opt.name}</h4>
                          <span className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                            Estimated: {opt.estimatedDays}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{opt.description}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold text-sm">
                      {opt.price === 0 ? (
                        <span className="text-emerald-400 uppercase">FREE</span>
                      ) : (
                        <span className="text-white">{formatINR(opt.price)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 text-xs text-neutral-400 flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  All shipments are insured with contactless OTP-verified delivery and real-time live GPS tracking.
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: INDIAN PAYMENT METHODS */}
          {step === 'payment' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span>Choose Payment Method</span>
                </h3>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> 100% Safe &amp; RBI Approved
                </span>
              </div>

              {/* Payment Type Selector Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: Smartphone, badge: 'Fastest' },
                  { id: 'card', label: 'Cards', icon: CreditCard, badge: 'Visa/RuPay' },
                  { id: 'netbanking', label: 'NetBanking', icon: Building2, badge: '50+ Banks' },
                  { id: 'wallet', label: 'Wallets', icon: Wallet, badge: 'Instant' },
                  { id: 'emi', label: 'Easy EMI', icon: Percent, badge: 'No Cost' },
                  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, badge: 'Cash/UPI' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentInfo.method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentInfo({ ...paymentInfo, method: m.id as PaymentMethodType })}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                          : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-emerald-400' : 'text-neutral-400'}`} />
                      <span className="text-xs font-bold">{m.label}</span>
                      <span className="text-[9px] font-mono text-neutral-500 mt-0.5">{m.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* 1. UPI Payment Option Details */}
              {paymentInfo.method === 'upi' && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-4">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Select Preferred UPI App or Enter Custom VPA</span>
                    <span className="text-emerald-400 font-mono">Instant 0% Convenience Fee</span>
                  </div>

                  {/* Popular UPI Apps */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { name: 'Google Pay', handle: 'gpay' },
                      { name: 'PhonePe', handle: 'phonepe' },
                      { name: 'Paytm UPI', handle: 'paytm' },
                      { name: 'Cred UPI', handle: 'cred' },
                    ].map((app) => (
                      <button
                        key={app.name}
                        type="button"
                        onClick={() =>
                          setPaymentInfo({
                            ...paymentInfo,
                            upiApp: app.name,
                            upiId: `user@${app.handle}`,
                          })
                        }
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                          paymentInfo.upiApp === app.name
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <Smartphone className="h-4 w-4 text-emerald-400" />
                        <span>{app.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom UPI ID */}
                  <div>
                    <label className="text-xs text-neutral-300 block mb-1">Or Enter Any UPI ID (VPA)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. yourname@oksbi or mobile@paytm"
                        value={paymentInfo.upiId}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, upiId: e.target.value })}
                        className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        className="rounded-xl bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-emerald-400 border border-neutral-700 cursor-pointer"
                      >
                        Verify VPA
                      </button>
                    </div>
                  </div>

                  {/* QR Code Demo */}
                  <div className="flex items-center gap-3 rounded-xl border border-neutral-800/80 bg-neutral-950 p-3">
                    <QrCode className="h-8 w-8 text-emerald-400 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-white">Dynamic UPI QR Code Available</div>
                      <div className="text-neutral-400 text-[11px]">
                        Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI app to pay {formatINR(totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Credit/Debit Cards */}
              {paymentInfo.method === 'card' && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-bold text-white">Enter Card Details</span>
                    <span className="font-mono">RuPay / Visa / Mastercard / Amex</span>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-300 block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                      placeholder="4532 8901 2345 6789"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs text-neutral-300 block mb-1">Name on Card</label>
                      <input
                        type="text"
                        value={paymentInfo.cardHolder}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardHolder: e.target.value })}
                        placeholder="RAHUL SHARMA"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white uppercase focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">Valid Thru</label>
                      <input
                        type="text"
                        value={paymentInfo.cardExpiry}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardExpiry: e.target.value })}
                        placeholder="MM/YY"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-white text-center focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">CVV (3-4 Digits)</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={paymentInfo.cardCvv}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardCvv: e.target.value })}
                        placeholder="•••"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-white text-center focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Net Banking */}
              {paymentInfo.method === 'netbanking' && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="text-xs font-bold text-white mb-2">Select Your Bank</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      'HDFC Bank',
                      'State Bank of India',
                      'ICICI Bank',
                      'Axis Bank',
                      'Kotak Mahindra Bank',
                      'Punjab National Bank',
                    ].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setPaymentInfo({ ...paymentInfo, bankName: bank })}
                        className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-colors ${
                          paymentInfo.bankName === bank
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Wallets */}
              {paymentInfo.method === 'wallet' && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="text-xs font-bold text-white mb-2">Select Mobile Wallet</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {['Amazon Pay', 'Paytm Wallet', 'PhonePe Wallet', 'Mobikwik'].map((wallet) => (
                      <button
                        key={wallet}
                        type="button"
                        onClick={() => setPaymentInfo({ ...paymentInfo, walletName: wallet })}
                        className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-colors ${
                          paymentInfo.walletName === wallet
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        {wallet}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Easy EMI */}
              {paymentInfo.method === 'emi' && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Select No-Cost / Low-Interest EMI Tenure</span>
                    <span className="text-emerald-400 font-mono">0% Processing Fee</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { months: 3, rate: 0, tag: 'No Cost EMI' },
                      { months: 6, rate: 0, tag: 'No Cost EMI' },
                      { months: 9, rate: 12, tag: 'Standard' },
                      { months: 12, rate: 14, tag: 'Standard' },
                    ].map((emi) => {
                      const monthly = Math.round(totalAmount / emi.months);
                      return (
                        <button
                          key={emi.months}
                          type="button"
                          onClick={() => setPaymentInfo({ ...paymentInfo, emiTenureMonths: emi.months })}
                          className={`p-3 rounded-xl border text-center cursor-pointer transition-colors ${
                            paymentInfo.emiTenureMonths === emi.months
                              ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                              : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <div className="text-sm font-mono font-bold text-emerald-400">
                            {formatINR(monthly)}/mo
                          </div>
                          <div className="text-xs text-neutral-200 mt-0.5">{emi.months} Months</div>
                          <div className="text-[10px] text-neutral-500">{emi.tag}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. Cash on Delivery (COD) */}
              {paymentInfo.method === 'cod' && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                  <div className="text-xs font-bold text-white">Cash on Delivery Verification</div>
                  <p className="text-xs text-neutral-400">
                    Pay via Cash, UPI QR, or Card upon delivery at your doorstep. Please enter the security code below to confirm:
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 font-mono font-black text-lg tracking-widest text-emerald-400 select-none">
                      {generatedCaptcha}
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Enter 4-digit code"
                      value={codCaptchaInput}
                      onChange={(e) => {
                        setCodCaptchaInput(e.target.value);
                        if (codCaptchaError) setCodCaptchaError('');
                      }}
                      className={`w-36 rounded-xl border bg-neutral-950 px-3 py-2 text-xs font-mono text-center text-white focus:outline-none ${
                        codCaptchaError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {codCaptchaError && (
                    <p className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {codCaptchaError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: FINAL ORDER REVIEW */}
          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Review & Confirm Order</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Shipping summary */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 font-bold border-b border-neutral-800 pb-2">
                    <span className="flex items-center gap-1.5 text-white">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Deliver To
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('address')}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-bold text-white">{address.fullName}</p>
                  <p className="text-neutral-300">
                    {address.flat}, {address.street}, {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p className="text-neutral-400 font-mono">Mobile: +91 {address.phone}</p>
                  <p className="text-emerald-400 font-mono">Estimated Delivery: {deliveryOption.estimatedDays}</p>
                </div>

                {/* Payment summary */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-neutral-400 font-bold border-b border-neutral-800 pb-2">
                    <span className="flex items-center gap-1.5 text-white">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-400" /> Payment Mode
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('payment')}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-bold text-white uppercase">{paymentInfo.method} Mode</p>
                  <p className="text-neutral-300 font-mono">
                    {paymentInfo.method === 'upi' && `UPI ID: ${paymentInfo.upiId || 'Selected App'}`}
                    {paymentInfo.method === 'card' && `Card: **** **** **** ${paymentInfo.cardNumber?.slice(-4) || '6789'}`}
                    {paymentInfo.method === 'netbanking' && `Bank: ${paymentInfo.bankName}`}
                    {paymentInfo.method === 'wallet' && `Wallet: ${paymentInfo.walletName}`}
                    {paymentInfo.method === 'emi' && `EMI: ${paymentInfo.emiTenureMonths} Months Tenure`}
                    {paymentInfo.method === 'cod' && 'Cash on Delivery (Pay at Doorstep)'}
                  </p>
                  <p className="text-neutral-400">GST Invoice with 18% Input Tax Credit enabled</p>
                </div>
              </div>

              {/* Items Summary list */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-3 space-y-2">
                <div className="text-xs font-bold text-neutral-300">Items ({cart.length})</div>
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs py-1 border-b border-neutral-800/40 last:border-0">
                    <span className="text-neutral-300 line-clamp-1">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-mono text-white font-semibold">
                      {formatINR(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: ORDER PLACED CONFIRMATION SCREEN */}
          {step === 'confirmed' && placedOrder && (
            <div className="py-6 space-y-6 text-center">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 text-xs font-mono font-bold">
                  Order Successfully Placed!
                </span>
                <h3 className="text-2xl font-black text-white mt-2">Thank you for your order!</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  A confirmation SMS &amp; GST tax invoice has been sent to +91 {placedOrder.address.phone}.
                </p>
              </div>

              {/* Order Tracking Card */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 max-w-lg mx-auto text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <div>
                    <span className="text-neutral-500 text-[10px] font-mono uppercase block">Order ID</span>
                    <span className="font-mono font-bold text-white text-sm">{placedOrder.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500 text-[10px] font-mono uppercase block">Estimated Delivery</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {placedOrder.deliveryOption.estimatedDays}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-neutral-500 text-[10px] font-mono uppercase block">Tracking AWB</span>
                    <span className="font-mono font-bold text-neutral-300">{placedOrder.trackingNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(placedOrder.trackingNumber);
                      setCopiedTracking(true);
                      setTimeout(() => setCopiedTracking(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer"
                  >
                    {copiedTracking ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedTracking ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="border-t border-neutral-800 pt-2 flex items-center justify-between font-mono">
                  <span className="text-neutral-400">Total Paid (Incl. GST):</span>
                  <span className="text-base font-bold text-white">{formatINR(placedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onTrackOrder) {
                      onTrackOrder(placedOrder.id);
                    }
                  }}
                  id="checkout-track-order-btn"
                  className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Truck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Track Live Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Print Tax Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>Continue Shopping</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Price Summary & Action Footer (Except when confirmed) */}
        {step !== 'confirmed' && (
          <div className="border-t border-neutral-800 pt-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Price Calculation details */}
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Items MRP Total:</span>
                  <span>{formatINR(totalMRP)}</span>
                </div>
                {totalItemSavings > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Product Catalog Discount:</span>
                    <span>- {formatINR(totalItemSavings)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-amber-400">
                    <span>Coupon Discount ({appliedCoupon.code}):</span>
                    <span>- {formatINR(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-400">
                  <span>GST (18% inclusive):</span>
                  <span>{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Delivery Charges:</span>
                  <span>{shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white border-t border-neutral-800/80 pt-1">
                  <span>Final Amount (₹ INR):</span>
                  <span className="text-emerald-400 text-base">{formatINR(totalAmount)}</span>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-col gap-2">
                {step === 'cart' && (
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={handleProceedToAddress}
                    id="checkout-proceed-address-btn"
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-neutral-950 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>Proceed to Delivery Address</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {step === 'address' && (
                  <button
                    type="button"
                    onClick={handleProceedToDelivery}
                    id="checkout-proceed-delivery-btn"
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>Deliver to this Address</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {step === 'delivery' && (
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    id="checkout-proceed-payment-btn"
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>Continue to Payment Options</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {step === 'payment' && (
                  <button
                    type="button"
                    onClick={handleProceedToReview}
                    id="checkout-proceed-review-btn"
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-neutral-950 hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>Review Order Summary</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {step === 'review' && (
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handlePlaceOrder}
                    id="checkout-place-order-btn"
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-xs font-bold text-neutral-950 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="h-4 w-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        <span>Processing Secure Payment...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Pay {formatINR(totalAmount)} &amp; Confirm Order</span>
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-500 font-mono">
                  <span>🔒 256-Bit SSL</span>
                  <span>•</span>
                  <span>7-Day Replacement</span>
                  <span>•</span>
                  <span>100% Genuine</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
