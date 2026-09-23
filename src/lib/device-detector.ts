import { DeviceClassification, DeviceProfile } from '../types';

type DeviceChangeListener = (profile: DeviceProfile) => void;

export function classifyDevice(
  cores: number,
  memoryGb?: number,
  isReducedMotion: boolean = false,
  isMobile: boolean = false
): DeviceClassification {
  // If memory is explicitly reported as <= 2GB or cores <= 2, it's a constrained device
  if (memoryGb !== undefined && memoryGb <= 2) {
    return 'LOW';
  }

  if (cores <= 2) {
    return 'LOW';
  }

  // High-performance modern devices
  if (cores >= 6 && (memoryGb === undefined || memoryGb >= 6)) {
    return 'HIGH';
  }

  if (!isMobile && cores >= 4 && (memoryGb === undefined || memoryGb >= 4)) {
    return 'HIGH';
  }

  // Mid-tier devices
  return 'MEDIUM';
}

class DeviceDetector {
  private listeners: Set<DeviceChangeListener> = new Set();
  private currentProfile: DeviceProfile;

  constructor() {
    this.currentProfile = this.detectCurrentProfile();
    this.initListeners();
  }

  public getProfile(): DeviceProfile {
    return this.currentProfile;
  }

  public subscribe(listener: DeviceChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.currentProfile);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private detectCurrentProfile(): DeviceProfile {
    if (typeof window === 'undefined') {
      return {
        hardwareConcurrency: 8,
        deviceMemoryGb: 8,
        isReducedMotion: false,
        isMobile: false,
        screenWidth: 1440,
        screenHeight: 900,
        pixelRatio: 1,
        classification: 'HIGH',
        source: 'browser-apis',
      };
    }

    const nav = navigator as unknown as {
      hardwareConcurrency?: number;
      deviceMemory?: number;
      maxTouchPoints?: number;
    };

    const hardwareConcurrency = nav.hardwareConcurrency || 4;
    const deviceMemoryGb = nav.deviceMemory; // might be undefined in Safari / Firefox

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReducedMotion = motionMedia.matches;

    const isMobile =
      window.innerWidth < 768 ||
      (nav.maxTouchPoints !== undefined && nav.maxTouchPoints > 0 && window.innerWidth < 1024);

    const screenWidth = window.screen?.width || window.innerWidth;
    const screenHeight = window.screen?.height || window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    const classification = classifyDevice(hardwareConcurrency, deviceMemoryGb, isReducedMotion, isMobile);

    return {
      hardwareConcurrency,
      deviceMemoryGb,
      isReducedMotion,
      isMobile,
      screenWidth,
      screenHeight,
      pixelRatio,
      classification,
      source: 'browser-apis',
    };
  }

  private handleMediaChange = () => {
    const newProfile = this.detectCurrentProfile();
    this.currentProfile = newProfile;
    this.listeners.forEach((listener) => listener(newProfile));
  };

  private initListeners() {
    if (typeof window === 'undefined') return;

    try {
      const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
      motionMedia.addEventListener('change', this.handleMediaChange);

      window.addEventListener('resize', this.handleMediaChange);
    } catch {
      // Fallback for older browsers
    }
  }
}

export const deviceDetector = new DeviceDetector();
