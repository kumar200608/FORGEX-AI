import { NetworkClassification, NetworkProfile } from '../types';

type NetworkChangeListener = (profile: NetworkProfile) => void;

interface NetworkInformation extends EventTarget {
  effectiveType?: '5g' | '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

export function classifyNetwork(
  isOnline: boolean,
  effectiveType?: string,
  downlink?: number,
  rtt?: number,
  saveData?: boolean
): NetworkClassification {
  if (!isOnline) {
    return 'OFFLINE';
  }

  // If user explicitly enabled Data Saver header, respect it by treating as SLOW/constrained
  if (saveData) {
    return 'SLOW';
  }

  const effType = effectiveType?.toLowerCase();

  // Slow 2G / 2G or severe latency
  if (effType === 'slow-2g' || effType === '2g') {
    return 'SLOW';
  }

  if (rtt !== undefined && rtt > 450) {
    return 'SLOW';
  }

  if (downlink !== undefined && downlink < 1.2) {
    return 'SLOW';
  }

  // Moderate 3G
  if (effType === '3g') {
    return 'MODERATE';
  }

  if (rtt !== undefined && rtt > 180) {
    return 'MODERATE';
  }

  if (downlink !== undefined && downlink < 4.0) {
    return 'MODERATE';
  }

  // Ultra-Fast 5G / Gigabit tier (downlink >= 30 Mbps or RTT <= 20ms or explicit 5G)
  if (effType === '5g' || (downlink !== undefined && downlink >= 25.0 && (rtt === undefined || rtt <= 30))) {
    return 'ULTRA_FAST';
  }

  // Fast 4G or better
  if (effType === '4g' || (downlink !== undefined && downlink >= 4.0)) {
    return 'FAST';
  }

  // Default fallback when API provides limited data but browser is online
  return 'FAST';
}

class NetworkDetector {
  private listeners: Set<NetworkChangeListener> = new Set();
  private currentProfile: NetworkProfile;

  constructor() {
    this.currentProfile = this.detectCurrentProfile();
    this.initListeners();
  }

  public getProfile(): NetworkProfile {
    return this.currentProfile;
  }

  public subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.currentProfile);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private detectCurrentProfile(): NetworkProfile {
    if (typeof window === 'undefined') {
      return {
        effectiveType: '4g',
        downlinkMb: 10,
        rttMs: 50,
        saveData: false,
        isOnline: true,
        classification: 'FAST',
        source: 'fallback-estimation',
      };
    }

    const isOnline = navigator.onLine !== false;
    const nav = navigator as unknown as { connection?: NetworkInformation };
    const conn = nav.connection;

    if (conn) {
      const effectiveType = conn.effectiveType || '4g';
      const downlinkMb = conn.downlink !== undefined ? conn.downlink : 10;
      const rttMs = conn.rtt !== undefined ? conn.rtt : 50;
      const saveData = Boolean(conn.saveData);

      const classification = classifyNetwork(isOnline, effectiveType, downlinkMb, rttMs, saveData);

      return {
        effectiveType,
        downlinkMb,
        rttMs,
        saveData,
        isOnline,
        classification,
        source: 'navigator.connection',
      };
    }

    // Graceful fallback when Network Information API is absent (e.g. Safari, iOS)
    const classification = isOnline ? 'FAST' : 'OFFLINE';
    return {
      effectiveType: isOnline ? '4g' : 'unknown',
      downlinkMb: isOnline ? 10 : 0,
      rttMs: isOnline ? 60 : 0,
      saveData: false,
      isOnline,
      classification,
      source: 'fallback-estimation',
    };
  }

  private handleNetworkChange = () => {
    const newProfile = this.detectCurrentProfile();
    this.currentProfile = newProfile;
    this.listeners.forEach((listener) => listener(newProfile));
  };

  private initListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);

    const nav = navigator as unknown as { connection?: NetworkInformation };
    if (nav.connection && typeof nav.connection.addEventListener === 'function') {
      nav.connection.addEventListener('change', this.handleNetworkChange);
    }
  }
}

export const networkDetector = new NetworkDetector();
