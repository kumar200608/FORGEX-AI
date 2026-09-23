import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Truck,
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Copy,
  Check,
  Printer,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { PlacedOrder, CartItem } from '../types';
import { formatINR } from '../lib/currency';
import { PRODUCTS } from '../data/products';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentOrders?: PlacedOrder[];
  initialOrderId?: string;
}

// Built-in realistic sample demo orders for quick lookup and testing
const DEMO_ORDERS: PlacedOrder[] = [
  {
    id: 'ADX-IN-892314',
    createdAt: Date.now() - 1000 * 60 * 60 * 36, // 1.5 days ago
    items: [
      { product: PRODUCTS[0], quantity: 1 },
      { product: PRODUCTS[3], quantity: 2 },
    ],
    address: {
      fullName: 'Vikram Mehta',
      phone: '9876543210',
      pincode: '560001',
      flat: 'Flat 304, Palm Grove Heights',
      street: '100ft Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      landmark: 'Opposite Metro Pillar 114',
      addressType: 'home',
    },
    deliveryOption: {
      id: 'express',
      name: 'Express Air Shipping',
      description: 'Guaranteed 24-48 hours priority dispatch',
      estimatedDays: 'Tomorrow by 4:00 PM',
      price: 149,
    },
    paymentInfo: {
      method: 'upi',
      upiApp: 'Google Pay',
      upiId: 'vikram.mehta@oksbi',
    },
    subtotal: PRODUCTS[0].price + PRODUCTS[3].price * 2,
    discount: 500,
    couponCode: 'ADAPTX500',
    gstAmount: Math.round((PRODUCTS[0].price + PRODUCTS[3].price * 2 - 500) * 0.18),
    shippingFee: 149,
    totalAmount: PRODUCTS[0].price + PRODUCTS[3].price * 2 - 500 + 149,
    status: 'shipped',
    trackingNumber: 'BLUEDART-EXP-9928103IN',
  },
  {
    id: 'ADX-IN-734190',
    createdAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    items: [{ product: PRODUCTS[1], quantity: 1 }],
    address: {
      fullName: 'Priya Sundaram',
      phone: '9840123456',
      pincode: '600028',
      flat: 'Villa 12, Alwarpet Gardens',
      street: 'TTK Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      landmark: 'Near Music Academy',
      addressType: 'home',
    },
    deliveryOption: {
      id: 'standard',
      name: 'Standard Delivery',
      description: 'Free across Indian pincodes',
      estimatedDays: 'Friday, 25 Sep 2026',
      price: 0,
    },
    paymentInfo: {
      method: 'card',
      cardNumber: '4532 8901 2345 9012',
      cardHolder: 'PRIYA SUNDARAM',
    },
    subtotal: PRODUCTS[1].price,
    discount: 0,
    gstAmount: Math.round(PRODUCTS[1].price * 0.18),
    shippingFee: 0,
    totalAmount: PRODUCTS[1].price,
    status: 'processing',
    trackingNumber: 'DELHIVERY-AWB-4491029IN',
  },
  {
    id: 'ADX-IN-619283',
    createdAt: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
    items: [{ product: PRODUCTS[2], quantity: 1 }],
    address: {
      fullName: 'Ananya Deshmukh',
      phone: '9820098200',
      pincode: '400050',
      flat: 'B-1202, Sea Green Towers',
      street: 'Bandra West, Hill Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      addressType: 'home',
    },
    deliveryOption: {
      id: 'same_day',
      name: 'Same Day Metro Express',
      description: 'Fast doorstep delivery',
      estimatedDays: 'Delivered',
      price: 299,
    },
    paymentInfo: {
      method: 'cod',
    },
    subtotal: PRODUCTS[2].price,
    discount: 0,
    gstAmount: Math.round(PRODUCTS[2].price * 0.18),
    shippingFee: 299,
    totalAmount: PRODUCTS[2].price + 299,
    status: 'delivered',
    trackingNumber: 'XPRESSBEES-IN-8820194',
  },
];

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  recentOrders = [],
  initialOrderId = '',
}) => {
  const [orderIdInput, setOrderIdInput] = useState<string>(initialOrderId || '');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [matchedOrder, setMatchedOrder] = useState<PlacedOrder | null>(null);
  const [searchError, setSearchError] = useState<string>('');
  const [copiedAWB, setCopiedAWB] = useState<boolean>(false);
  const [showSupportToast, setShowSupportToast] = useState<boolean>(false);

  // Combine user session orders with demo orders
  const allOrders = useMemo(() => {
    return [...recentOrders, ...DEMO_ORDERS];
  }, [recentOrders]);

  // If initialOrderId is provided when opening, auto-populate
  React.useEffect(() => {
    if (initialOrderId) {
      setOrderIdInput(initialOrderId);
      const found = allOrders.find((o) => o.id.toLowerCase() === initialOrderId.trim().toLowerCase());
      if (found) {
        setPhoneInput(found.address.phone);
        setMatchedOrder(found);
      }
    }
  }, [initialOrderId, allOrders]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError('');
    const cleanId = orderIdInput.trim().toUpperCase();
    const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);

    if (!cleanId) {
      setSearchError('Please enter a valid Order ID (e.g. ADX-IN-892314)');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setSearchError('Please enter your 10-digit registered Indian mobile number');
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      const found = allOrders.find((order) => {
        const orderIdMatch = order.id.toUpperCase().includes(cleanId) || cleanId.includes(order.id.toUpperCase());
        const phoneMatch = order.address.phone.slice(-10) === cleanPhone;
        return orderIdMatch && phoneMatch;
      });

      if (found) {
        setMatchedOrder(found);
        setSearchError('');
      } else {
        // Fallback: check if Order ID alone exists to give helpful feedback
        const idOnly = allOrders.find((o) => o.id.toUpperCase().includes(cleanId));
        if (idOnly) {
          setSearchError(`Order ID found, but the phone number does not match registered mobile (+91 ${idOnly.address.phone.slice(0, 3)}•••••${idOnly.address.phone.slice(-2)}).`);
        } else {
          setSearchError(`No order found matching "${cleanId}" for mobile +91 ${cleanPhone}. Please check your SMS or use one of the sample orders.`);
        }
      }
    }, 700);
  };

  const handleSelectSample = (sample: PlacedOrder) => {
    setOrderIdInput(sample.id);
    setPhoneInput(sample.address.phone);
    setMatchedOrder(sample);
    setSearchError('');
  };

  const handleCopyAWB = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAWB(true);
    setTimeout(() => setCopiedAWB(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-950 p-5 sm:p-8 shadow-2xl text-neutral-100 max-h-[92vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>Track Your Order</span>
                  <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                    Live GPS Status
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Real-time All-India courier tracking &amp; delivery updates
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              id="close-track-order-modal-btn"
              className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Lookup Input Form */}
          <form onSubmit={handleSearch} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Enter Order Details</span>
              <span className="text-neutral-400 font-normal">SMS OTP / Verification protected</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Order ID Input */}
              <div className="sm:col-span-6">
                <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                  Order ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="track-order-id-input"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ADX-IN-892314"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-500 uppercase focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobile Number Input */}
              <div className="sm:col-span-6">
                <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                  10-Digit Registered Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="track-phone-input"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-11 pr-3 py-2.5 text-xs font-mono text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {searchError && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              {/* Quick Sample Order Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-neutral-400">
                <span>Recent Sample:</span>
                {allOrders.slice(0, 3).map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="rounded-lg bg-neutral-950 px-2 py-1 text-emerald-400 border border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  >
                    {sample.id}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                id="track-order-submit-btn"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {isSearching ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Searching Order...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Matched Order Display */}
          {matchedOrder && (
            <div className="space-y-6">
              {/* Status Header Card */}
              <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                      Order ID
                    </span>
                    <span className="text-base font-black font-mono text-white flex items-center gap-2">
                      {matchedOrder.id}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-sans font-bold capitalize border ${
                          matchedOrder.status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : matchedOrder.status === 'shipped'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {matchedOrder.status === 'shipped'
                          ? 'In Transit'
                          : matchedOrder.status === 'processing'
                          ? 'Processing'
                          : matchedOrder.status === 'delivered'
                          ? 'Delivered'
                          : 'Order Confirmed'}
                      </span>
                    </span>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                      Estimated Delivery
                    </span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {matchedOrder.deliveryOption.estimatedDays}
                    </span>
                  </div>
                </div>

                {/* Tracking AWB & Courier Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="text-neutral-400">Courier Partner: </span>
                      <strong className="text-white">
                        {matchedOrder.trackingNumber.startsWith('BLUEDART')
                          ? 'Blue Dart Express'
                          : matchedOrder.trackingNumber.startsWith('DELHIVERY')
                          ? 'Delhivery Logistics'
                          : 'XpressBees Surface & Air'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-neutral-400">AWB:</span>
                    <span className="text-white font-bold">{matchedOrder.trackingNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyAWB(matchedOrder.trackingNumber)}
                      className="rounded p-1 text-emerald-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Copy Tracking ID"
                    >
                      {copiedAWB ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Dynamic 5-Stage Tracking Timeline Stepper */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-white mb-4 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Shipment Journey Milestones</span>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                    {/* Stage 1: Order Confirmed */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-neutral-950">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Order Confirmed &amp; Payment Verified</div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Payment via {matchedOrder.paymentInfo.method.toUpperCase()} confirmed. Order routed to Indian Fulfillment Center.
                        </p>
                        <span className="text-[10px] font-mono text-neutral-500 mt-0.5 block">
                          {new Date(matchedOrder.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Stage 2: Packed & Quality Checked */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                          matchedOrder.status === 'processing' ||
                          matchedOrder.status === 'shipped' ||
                          matchedOrder.status === 'delivered'
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                        }`}
                      >
                        <Package className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Packed &amp; Sanitized at Warehouse Hub</div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Package passed quality check and handed over to courier dispatch team in Bengaluru Central Hub.
                        </p>
                        <span className="text-[10px] font-mono text-neutral-500 mt-0.5 block">
                          {new Date(matchedOrder.createdAt + 1000 * 60 * 60 * 4).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Stage 3: In Transit */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                          matchedOrder.status === 'shipped' || matchedOrder.status === 'delivered'
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                        }`}
                      >
                        <Truck className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">In Transit to Regional Sorting Center</div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Shipment arrived at destination regional hub for {matchedOrder.address.city}, {matchedOrder.address.state}.
                        </p>
                        {matchedOrder.status === 'shipped' && (
                          <span className="inline-block mt-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 text-[10px] font-mono">
                            Current Location: {matchedOrder.address.city} Sorting Facility
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stage 4: Out for Delivery */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                          matchedOrder.status === 'delivered'
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                        }`}
                      >
                        <MapPin className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Out for Delivery</div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Delivery agent will contact +91 {matchedOrder.address.phone} with contactless OTP before arrival.
                        </p>
                      </div>
                    </div>

                    {/* Stage 5: Delivered */}
                    <div className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                          matchedOrder.status === 'delivered'
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Delivered</div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {matchedOrder.status === 'delivered'
                            ? 'Handed over successfully with signature & OTP verification.'
                            : `Expected: ${matchedOrder.deliveryOption.estimatedDays}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items & Address Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Delivery Address */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold border-b border-neutral-800 pb-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="font-bold text-white">{matchedOrder.address.fullName}</p>
                  <p className="text-neutral-300 leading-relaxed">
                    {matchedOrder.address.flat}, {matchedOrder.address.street}
                    <br />
                    {matchedOrder.address.city}, {matchedOrder.address.state} - {matchedOrder.address.pincode}
                  </p>
                  {matchedOrder.address.landmark && (
                    <p className="text-neutral-400">Landmark: {matchedOrder.address.landmark}</p>
                  )}
                  <p className="text-emerald-400 font-mono">Mobile: +91 {matchedOrder.address.phone}</p>
                </div>

                {/* Payment Summary */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold border-b border-neutral-800 pb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Payment &amp; GST Details</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Payment Mode:</span>
                    <strong className="text-white uppercase font-mono">{matchedOrder.paymentInfo.method}</strong>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Items Subtotal:</span>
                    <span className="font-mono">{formatINR(matchedOrder.subtotal)}</span>
                  </div>
                  {matchedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({matchedOrder.couponCode || 'Promo'}):</span>
                      <span className="font-mono">- {formatINR(matchedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-300">
                    <span>Shipping Charges:</span>
                    <span className="font-mono">{matchedOrder.shippingFee === 0 ? 'FREE' : formatINR(matchedOrder.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-neutral-800 pt-1.5">
                    <span>Total Amount:</span>
                    <span className="text-emerald-400 font-mono text-sm">{formatINR(matchedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Items in Package */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Items in this Shipment ({matchedOrder.items.length})</span>
                  <span className="text-neutral-400 text-[11px]">Includes Brand Warranty</span>
                </div>

                <div className="space-y-2.5">
                  {matchedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800/80 bg-neutral-950 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.images.low}
                          alt={item.product.name}
                          className="h-12 w-12 rounded-lg object-cover bg-neutral-900 border border-neutral-800"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.product.name}</h4>
                          <span className="text-[10px] font-mono text-neutral-400">
                            Qty: {item.quantity} {item.selectedVariant && `• ${item.selectedVariant.name}`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold text-xs text-white">
                        {formatINR(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support & Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Print Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSupportToast(true);
                      setTimeout(() => setShowSupportToast(false), 3000);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Need Help?</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMatchedOrder(null);
                    setOrderIdInput('');
                    setPhoneInput('');
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                >
                  Track Another Order
                </button>
              </div>

              {showSupportToast && (
                <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3 text-xs text-cyan-300 flex items-center justify-between">
                  <span>
                    💬 24x7 Indian Delivery Helpline: <strong>1800-ADAPTX-IN</strong> (Toll Free) or WhatsApp <strong>+91 98765 43210</strong>
                  </span>
                  <span className="text-[10px] font-mono">Agent Active</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
