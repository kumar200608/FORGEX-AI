/**
 * AdaptX Core TypeScript Types & Interfaces
 * Adaptive Web. Faster for Everyone.
 */

export type NetworkClassification = 'ULTRA_FAST' | 'FAST' | 'MODERATE' | 'SLOW' | 'OFFLINE';

export type DeviceClassification = 'HIGH' | 'MEDIUM' | 'LOW';

export type AdaptiveMode = 'ENHANCED' | 'STANDARD' | 'LITE' | 'OFFLINE';

export type ImageQualityStrategy = 'ultra-4k' | 'high' | 'medium' | 'low' | 'minimal';

export type JsTier = 'ENHANCED' | 'STANDARD' | 'LITE';

export type PrefetchStrategy = 'AGGRESSIVE' | 'LIMITED' | 'DISABLED';

export type RecommendationsTiming = 'instant' | 'delayed' | 'deferred' | 'disabled';

export interface NetworkProfile {
  effectiveType: '5g' | '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlinkMb: number; // in Mbps
  rttMs: number; // Round-trip time in ms
  saveData: boolean;
  isOnline: boolean;
  classification: NetworkClassification;
  source: 'navigator.connection' | 'fallback-estimation' | 'simulation';
}

export interface DeviceProfile {
  hardwareConcurrency: number; // CPU cores
  deviceMemoryGb?: number; // RAM in GB if available
  isReducedMotion: boolean;
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  classification: DeviceClassification;
  source: 'browser-apis' | 'simulation';
}

export interface AdaptiveProfile {
  mode: AdaptiveMode;
  jsTier: JsTier;
  imageStrategy: ImageQualityStrategy;
  imageTargetWidth: number; // in px
  prefetchStrategy: PrefetchStrategy;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  recommendations: RecommendationsTiming;
  compressionLabel: string;
  isSimulated: boolean;
  simulationName?: string;
  reasons: string[];
}

export interface WebVitalsMetrics {
  lcp: number | null; // Largest Contentful Paint (ms)
  inp: number | null; // Interaction to Next Paint (ms)
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint (ms)
  ttfb: number | null; // Time to First Byte (ms)
}

export interface ResourceMetrics {
  totalTransferBytes: number;
  jsTransferBytes: number;
  imageTransferBytes: number;
  cssTransferBytes: number;
  otherTransferBytes: number;
  resourceCount: number;
  totalDecodedBytes: number;
}

export interface PerformanceSnapshot {
  vitals: WebVitalsMetrics;
  resources: ResourceMetrics;
  timestamp: number;
  pageLoadDurationMs: number;
  savingsVsBaselineBytes: number;
}

export interface OllamaRecommendation {
  bottleneck: string;
  recommendation: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  estimatedImpact: string;
  source: 'ollama-local' | 'deterministic-fallback';
  modelUsed?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  colorHex?: string;
  inStock?: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: 'Tech' | 'Home' | 'Lifestyle' | 'Audio' | 'Wearables' | 'Workspace' | 'Mobility' | 'Vision' | 'Photography' | 'Smart Home' | 'Gaming' | 'Outdoor' | string;
  subCategory?: string;
  price: number; // in INR ₹
  originalPrice?: number; // in INR ₹
  discountPercent?: number;
  rating: number;
  reviewsCount: number;
  description: string;
  tagline: string;
  badge?: string;
  stock: number;
  variants?: ProductVariant[];
  images: {
    ultra4k?: string; // 3840px / 2400px UHD lossless
    high: string; // 1200px
    medium: string; // 600px
    low: string; // 300px
    placeholder: string; // low-res blur/svg
  };
  gallery?: Array<{
    ultra4k?: string;
    high: string;
    medium: string;
    low: string;
    placeholder: string;
    caption?: string;
  }>;
  specs: Record<string, string>;
  features: string[];
  weightKg: number;
  inStock: boolean;
  isPriceUpdated?: boolean;
  is5G?: boolean;
}

export interface IndianAddress {
  fullName: string;
  phone: string;
  pincode: string;
  flat: string;
  street: string;
  city: string;
  state: string;
  landmark?: string;
  addressType: 'home' | 'work' | 'other';
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine?: string;
  flat?: string;
  street?: string;
  city: string;
  state: string;
  pinCode?: string;
  pincode?: string;
  landmark?: string;
  addressType?: 'home' | 'work' | 'other';
}

export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod' | 'emi';
export type UpiApp = 'gpay' | 'phonepe' | 'paytm' | 'cred' | 'bhim' | 'other';

export interface PaymentInfo {
  method: PaymentMethodType;
  upiId?: string;
  upiApp?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  bankName?: string;
  walletName?: string;
  emiTenureMonths?: number;
}

export interface DeliveryOption {
  id: 'standard' | 'express' | 'same_day';
  name: string;
  description: string;
  estimatedDays: string;
  price: number;
}

export interface PlacedOrder {
  id: string;
  createdAt: number;
  items: CartItem[];
  address: IndianAddress;
  deliveryOption: DeliveryOption;
  paymentInfo: PaymentInfo;
  subtotal: number;
  discount: number;
  couponCode?: string;
  gstAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered';
  trackingNumber: string;
}

export interface CheckoutOrder {
  orderId: string;
  id?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  shippingFee?: number;
  total: number;
  totalAmount?: number;
  paymentMethod: PaymentMethodType;
  paymentDetails?: {
    upiId?: string;
    upiApp?: string;
    cardLast4?: string;
    cardNetwork?: string;
    bankName?: string;
    emiTenureMonths?: number;
    emiMonthlyAmount?: number;
  };
  paymentInfo?: PaymentInfo;
  shippingAddress: ShippingAddress;
  address?: IndianAddress;
  timestamp: number;
  createdAt?: number;
  status: 'CONFIRMED' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  trackingNumber?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
}

export type SimulationPreset = 'none' | 'fast-5g' | 'fast-high' | 'moderate-med' | 'slow-low' | 'offline';

export type ThemeMode = 'night' | 'day';

