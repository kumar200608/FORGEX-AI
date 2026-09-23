import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  Calendar,
  Lock,
  Truck,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { CartItem, CheckoutOrder, PaymentMethodType, ShippingAddress, UpiApp } from '../types';
import { formatINR } from '../lib/currency';

interface CheckoutPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: CheckoutOrder) => void;
}

const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
  { id: 'kotak', name: 'Kotak Mahindra', code: 'KOTAK' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' },
];

export const CheckoutPaymentModal: React.FC<CheckoutPaymentModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
}) => {
  // Steps: 'address' -> 'payment' -> 'processing' -> 'success'
  const [step, setStep] = useState<'address' | 'payment' | 'processing' | 'success'>('address');

  // Address State
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: 'Rahul Sharma',
    phone: '+91 98765 43210',
    addressLine: 'Flat 402, Lotus Grandeur, 100ft Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560038',
  });

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  const [upiApp, setUpiApp] = useState<UpiApp>('gpay');
  const [upiId, setUpiId] = useState('rahul.sharma@okhdfcbank');
  const [isUpiVerified, setIsUpiVerified] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 min countdown

  // Card State
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829');
  const [cardHolder, setCardHolder] = useState('RAHUL SHARMA');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('•••');

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // EMI State
  const [emiTenure, setEmiTenure] = useState(6);

  // COD State
  const [codCaptcha, setCodCaptcha] = useState('7492');
  const [enteredCaptcha, setEnteredCaptcha] = useState('7492');

  // Confirmed Order
  const [confirmedOrder, setConfirmedOrder] = useState<CheckoutOrder | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Subtotal Calculation
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = Math.round(subtotal * 0.05); // 5% online prepaid special discount
  const finalDiscount = paymentMethod === 'cod' ? 0 : discount;
  const deliveryFee = 0; // Free delivery
  const total = subtotal - finalDiscount + deliveryFee;

  // QR Timer
  useEffect(() => {
    if (showQrCode && qrTimer > 0) {
      const interval = setInterval(() => setQrTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [showQrCode, qrTimer]);

  if (!isOpen) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    setStep('processing');

    setTimeout(() => {
      const order: CheckoutOrder = {
        orderId: `ADX-IN-${Math.floor(100000 + Math.random() * 900000)}`,
        items: [...items],
        subtotal,
        discount: finalDiscount,
        deliveryFee,
        total,
        paymentMethod,
        paymentDetails: {
          upiId: paymentMethod === 'upi' ? upiId : undefined,
          upiApp: paymentMethod === 'upi' ? upiApp : undefined,
          cardLast4: paymentMethod === 'card' ? '8829' : undefined,
          cardNetwork: paymentMethod === 'card' ? 'RuPay Platinum' : undefined,
          bankName:
            paymentMethod === 'netbanking'
              ? POPULAR_BANKS.find((b) => b.id === selectedBank)?.name
              : undefined,
          emiTenureMonths: paymentMethod === 'emi' ? emiTenure : undefined,
          emiMonthlyAmount: paymentMethod === 'emi' ? Math.round(total / emiTenure) : undefined,
        },
        shippingAddress: address,
        timestamp: Date.now(),
        status: 'CONFIRMED',
      };

      setConfirmedOrder(order);
      setStep('success');
      onOrderSuccess(order);
    }, 2000);
  };

  const handleCopyOrderId = () => {
    if (confirmedOrder) {
      navigator.clipboard.writeText(confirmedOrder.orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleAutofillAddress = () => {
    setAddress({
      fullName: 'Vikramaditya Verma',
      phone: '+91 94451 88392',
      addressLine: 'Villa 14, Palm Meadows, Whitefield High Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560066',
    });
  };

  return (
    <div
      id="checkout-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="checkout-modal-container"
        className="relative my-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Back Navigation */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            {step === 'payment' && (
              <button
                type="button"
                id="checkout-back-to-address-btn"
                onClick={() => setStep('address')}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/70 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                title="Go back to shipping address"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Address</span>
              </button>
            )}

            {step === 'address' && (
              <button
                type="button"
                id="checkout-back-to-cart-btn"
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/70 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                title="Go back to cart"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Cart</span>
              </button>
            )}

            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {step === 'address' && '1. Shipping & Delivery Address'}
                {step === 'payment' && '2. Select Payment Method (₹ INR)'}
                {step === 'processing' && 'Authorizing Payment...'}
                {step === 'success' && 'Order Placed Successfully!'}
              </h2>
              <p className="text-xs text-neutral-400">
                {step === 'address' && 'Deliver to India • Free Express Shipping'}
                {step === 'payment' && '100% Encrypted & RBI Compliant Payment Gateway'}
                {step === 'processing' && 'Please do not refresh or press back'}
                {step === 'success' && 'Thank you for shopping with AdaptX'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="checkout-close-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Close checkout modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: ADDRESS */}
          {step === 'address' && (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Contact & Delivery Details
                </span>
                <button
                  type="button"
                  onClick={handleAutofillAddress}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Use Demo Address (Bengaluru)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Mobile Phone (+91) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    House No., Street, Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.addressLine}
                    onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                    placeholder="Flat / House No., Building Name, Street"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. Mumbai, Bengaluru, Delhi"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={address.pinCode}
                      onChange={(e) => setAddress({ ...address, pinCode: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="6 digits"
                    />
                  </div>
                </div>
              </div>

              {/* Order Quick Summary Banner */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400">Total Items in Cart:</span>
                  <span className="ml-1 text-xs font-bold text-white">
                    {items.reduce((sum, i) => sum + i.quantity, 0)} items
                  </span>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Truck className="h-3 w-3" />
                    <span>Free Express Air Courier across India (2–3 Days)</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-400">Total Amount:</span>
                  <p className="text-lg font-bold font-mono text-emerald-400">{formatINR(total)}</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 cursor-pointer"
                >
                  Leave & Return to Cart
                </button>
                <button
                  type="submit"
                  id="proceed-to-payment-btn"
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Continue to Payment Method</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 'payment' && (
            <div className="space-y-6">
              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-5 w-5 mb-1 text-emerald-400" />
                  <span className="text-xs font-bold">UPI / QR</span>
                  <span className="text-[10px] text-emerald-500 font-medium">Instant • 5% off</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1 text-blue-400" />
                  <span className="text-xs font-bold">Cards</span>
                  <span className="text-[10px] text-neutral-400">RuPay / Visa / MC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'netbanking'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <Building2 className="h-5 w-5 mb-1 text-amber-400" />
                  <span className="text-xs font-bold">Net Banking</span>
                  <span className="text-[10px] text-neutral-400">50+ Indian Banks</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('emi')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'emi'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <Calendar className="h-5 w-5 mb-1 text-purple-400" />
                  <span className="text-xs font-bold">No-Cost EMI</span>
                  <span className="text-[10px] text-neutral-400">From ₹{Math.round(total / 6)}/mo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <Banknote className="h-5 w-5 mb-1 text-emerald-300" />
                  <span className="text-xs font-bold">Cash on Delivery</span>
                  <span className="text-[10px] text-neutral-400">Pay at Doorstep</span>
                </button>
              </div>

              {/* PAYMENT DETAILS PANEL */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
                {/* 1. UPI METHOD */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-300">
                        Choose your preferred UPI payment mode:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowQrCode(!showQrCode)}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:underline cursor-pointer font-medium"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>{showQrCode ? 'Switch to UPI ID' : 'Show Instant QR Code'}</span>
                      </button>
                    </div>

                    {!showQrCode ? (
                      <div className="space-y-4">
                        {/* UPI App Icons Selection */}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'gpay', label: 'Google Pay', icon: '⚡' },
                            { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
                            { id: 'paytm', label: 'Paytm', icon: '🔷' },
                            { id: 'bhim', label: 'BHIM UPI', icon: '🇮🇳' },
                          ].map((app) => (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => {
                                setUpiApp(app.id as UpiApp);
                                setUpiId(
                                  app.id === 'gpay'
                                    ? 'rahul.sharma@okhdfcbank'
                                    : app.id === 'phonepe'
                                    ? '9876543210@ybl'
                                    : app.id === 'paytm'
                                    ? '9876543210@paytm'
                                    : 'rahulsharma@upi'
                                );
                              }}
                              className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                upiApp === app.id
                                  ? 'border-emerald-500 bg-emerald-500/15 text-white'
                                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <span>{app.icon}</span>
                              <span>{app.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* UPI ID Input */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Enter Virtual Payment Address (UPI ID)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => {
                                setUpiId(e.target.value);
                                setIsUpiVerified(true);
                              }}
                              placeholder="e.g. username@okhdfcbank, mobile@upi"
                              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none font-mono"
                            />
                            {isUpiVerified && (
                              <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Verified</span>
                              </div>
                            )}
                          </div>
                          <p className="mt-1.5 text-[11px] text-neutral-500">
                            A payment collect notification request will be delivered to your registered UPI app.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* QR Code View */
                      <div className="flex flex-col items-center justify-center py-2 space-y-3">
                        <div className="rounded-2xl border-2 border-emerald-500/40 bg-white p-4 shadow-xl">
                          {/* Simulated high-clarity QR Code graphic */}
                          <div className="relative h-44 w-44 bg-neutral-950 p-2 rounded-lg flex flex-col items-center justify-center text-center">
                            <QrCode className="h-28 w-28 text-emerald-400" />
                            <div className="text-[10px] font-mono text-neutral-300 mt-1">
                              UPI: adaptx.merchant@okhdfc
                            </div>
                            <div className="text-[11px] font-bold text-emerald-400">
                              Amount: {formatINR(total)}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-neutral-300 font-medium">
                            Scan with Any UPI App (GPay, PhonePe, Paytm, CRED)
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                            Dynamic Session valid for: {Math.floor(qrTimer / 60)}:
                            {(qrTimer % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CARD METHOD */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span>Supported Networks: RuPay, Visa, Mastercard</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>RBI Tokenized</span>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none font-mono tracking-widest"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Name as on Card"
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1">
                            Expiry
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. NET BANKING METHOD */}
                {paymentMethod === 'netbanking' && (
                  <div className="space-y-4">
                    <span className="text-xs font-semibold text-neutral-300">
                      Select Your Preferred Indian Bank:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {POPULAR_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.id)}
                          className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                            selectedBank === b.id
                              ? 'border-emerald-500 bg-emerald-500/15 text-white'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span>{b.name}</span>
                          <span className="font-mono text-[10px] text-emerald-400">{b.code}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      You will be securely redirected to your bank&apos;s authorized netbanking login portal for 2FA OTP verification.
                    </p>
                  </div>
                )}

                {/* 4. EMI METHOD */}
                {paymentMethod === 'emi' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300">Choose No-Cost EMI Plan:</span>
                      <span className="text-emerald-400 font-mono">0% Annual Interest</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[3, 6, 9, 12].map((tenure) => {
                        const monthly = Math.round(total / tenure);
                        const isSelected = emiTenure === tenure;
                        return (
                          <button
                            key={tenure}
                            type="button"
                            onClick={() => setEmiTenure(tenure)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-md'
                                : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span className="text-xs font-bold">{tenure} Months</span>
                            <span className="text-xs font-mono font-semibold text-emerald-400 mt-1">
                              {formatINR(monthly)}/mo
                            </span>
                            <span className="text-[10px] text-neutral-500">Zero Processing</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Available on HDFC, ICICI, SBI, Axis, and Bajaj Finserv Insta EMI Cards.
                    </p>
                  </div>
                )}

                {/* 5. COD METHOD */}
                {paymentMethod === 'cod' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2">
                      <Truck className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Cash on Delivery Verification:</span>
                        <p className="text-neutral-300 text-[11px] mt-0.5">
                          You can pay via Cash, Google Pay, or UPI QR code directly to the courier agent upon doorstep delivery.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium text-neutral-300">
                        Enter Security Verification Captcha:
                      </label>
                      <div className="rounded-lg bg-neutral-800 px-3 py-1 font-mono text-sm tracking-widest text-emerald-400 font-bold border border-neutral-700 select-none">
                        {codCaptcha}
                      </div>
                      <input
                        type="text"
                        maxLength={4}
                        value={enteredCaptcha}
                        onChange={(e) => setEnteredCaptcha(e.target.value)}
                        className="w-20 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-center font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown in Indian Rupee */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Cart Subtotal ({items.length} unique products)</span>
                  <span className="font-mono text-white">{formatINR(subtotal)}</span>
                </div>

                {finalDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Instant Digital Prepaid Discount (5%)</span>
                    </span>
                    <span className="font-mono font-semibold">-{formatINR(finalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Pan-India Courier Shipping (Express Air)</span>
                  <span className="font-semibold text-emerald-400">FREE</span>
                </div>

                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Goods & Services Tax (GST 18% inclusive)</span>
                  <span className="text-neutral-400">Included</span>
                </div>

                <div className="border-t border-neutral-800 pt-2 flex justify-between items-center text-sm font-bold text-white">
                  <span>Total Amount Payable</span>
                  <span className="font-mono text-lg text-emerald-400">{formatINR(total)}</span>
                </div>
              </div>

              {/* Action Buttons with Back Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  id="payment-back-btn"
                  onClick={() => setStep('address')}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-800 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Address</span>
                </button>

                <button
                  type="button"
                  id="confirm-pay-btn"
                  onClick={handlePlaceOrder}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>
                    Pay {formatINR(total)}{' '}
                    {paymentMethod === 'upi' ? 'via UPI' : paymentMethod === 'card' ? 'via Card' : ''}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING SIMULATION */}
          {step === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-cyan-500/20 border-b-cyan-500 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Authorizing Secure Transaction</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  Connecting to NPCI Unified Payments Interface & Tokenized Banking Gateway...
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 font-mono text-[11px] text-neutral-400">
                <Lock className="h-3 w-3 text-emerald-400" />
                <span>256-bit End-to-End Encryption</span>
              </div>
            </div>
          )}

          {/* STEP 4: ORDER CONFIRMED */}
          {step === 'success' && confirmedOrder && (
            <div className="py-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Order Confirmed!</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Your payment of <strong className="text-emerald-400 font-mono">{formatINR(confirmedOrder.total)}</strong> has been processed successfully. A confirmation message and tracking link have been dispatched to {confirmedOrder.shippingAddress.phone}.
                </p>
              </div>

              {/* Order Details Card */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[11px] text-neutral-400 block">Order Identifier</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-sm font-bold text-white">{confirmedOrder.orderId}</span>
                      <button
                        type="button"
                        onClick={handleCopyOrderId}
                        className="rounded p-1 text-neutral-400 hover:text-white cursor-pointer"
                        title="Copy Order ID"
                      >
                        {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block">Payment Method</span>
                    <span className="font-medium text-xs text-emerald-400 uppercase tracking-wide">
                      {confirmedOrder.paymentMethod} {confirmedOrder.paymentDetails?.upiApp ? `(${confirmedOrder.paymentDetails.upiApp})` : ''}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block mb-0.5">Shipping Destination</span>
                    <p className="text-white font-medium">{confirmedOrder.shippingAddress.fullName}</p>
                    <p className="text-neutral-400">{confirmedOrder.shippingAddress.addressLine}</p>
                    <p className="text-neutral-400">
                      {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state} - {confirmedOrder.shippingAddress.pinCode}
                    </p>
                  </div>

                  <div>
                    <span className="text-neutral-500 block mb-0.5">Estimated Dispatch & Delivery</span>
                    <p className="text-white font-medium">Dispatched via BlueDart / Delhivery Express</p>
                    <p className="text-emerald-400 mt-0.5">Delivery in 2 business days</p>
                  </div>
                </div>

                {/* Items Purchased List */}
                <div className="border-t border-neutral-800 pt-3">
                  <span className="text-[11px] text-neutral-500 block mb-2">Purchased Products ({confirmedOrder.items.length})</span>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {confirmedOrder.items.map((item: CartItem) => (
                      <div key={item.product.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.product.images.placeholder || item.product.images.low}
                            alt={item.product.name}
                            className="h-8 w-8 rounded-lg object-cover bg-neutral-900 border border-neutral-800"
                          />
                          <div>
                            <p className="text-white font-medium">{item.product.name}</p>
                            <span className="text-[10px] text-neutral-500">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-mono text-neutral-300 font-semibold">
                          {formatINR(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Finish Actions */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  id="order-success-continue-btn"
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Continue Exploring Store</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
