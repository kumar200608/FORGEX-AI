export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageSmall: string;
  imageLarge: string;
  category?: string;
  rating?: number;
  reviews?: number;
  badge?: string;
  brand?: string;
  oldPrice?: number;
  stock?: number;
  freeDelivery?: boolean;
  features?: string[];
  specs?: { label: string; value: string }[];
  colors?: string[];
  warranty?: string;
  returns?: string;
}

export interface CartItem {
  id: string;
  qty: number;
}

export type AdaptiveMode = "FULL" | "CONSTRAINED";

// "detecting": initial signals not yet resolved — the panel should show a
// neutral loading state rather than a mode label during this phase (§9.1).
// "ready": detection has resolved (or was overridden by ?forceMode=...).
export type AdaptiveStatus = "detecting" | "ready";

export interface NetworkInfo {
  effectiveType: string | null;   // "4g" | "3g" | "2g" | "slow-2g" | null
  saveData: boolean;
  downlink: number | null;        // Mbps, if available
  rtt?: number | null;
  source: "api" | "probe" | "unknown"; // where the reading came from
}

export interface DeviceInfo {
  hardwareConcurrency: number | null;
  deviceMemory: number | null;    // GB, if available
}

export interface AdaptationDecision {
  mode: AdaptiveMode;
  network: NetworkInfo;
  device: DeviceInfo;
  confidence?: "high" | "medium" | "low";
  changes: {
    imageReduced: boolean;
    componentDeferred: boolean;
    animationsReduced: boolean;
    prefetchDisabled: boolean;
  };
}

export type DeliveryMode = Lowercase<AdaptiveMode>;
export const toDeliveryMode = (m: AdaptiveMode): DeliveryMode => m.toLowerCase() as DeliveryMode;
export interface Category { slug: string; label: string; count?: number }
export interface RecommendationEntry { productId: string; relatedIds: string[] }
