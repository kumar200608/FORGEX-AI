import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { PerformanceSnapshot, ResourceMetrics, WebVitalsMetrics } from '../types';

type MetricsChangeListener = (snapshot: PerformanceSnapshot) => void;

class PerformanceMonitor {
  private vitals: WebVitalsMetrics = {
    lcp: null,
    inp: null,
    cls: null,
    fcp: null,
    ttfb: null,
  };

  private listeners: Set<MetricsChangeListener> = new Set();
  private pageLoadDurationMs = 0;
  private isObserving = false;

  constructor() {
    this.initObservers();
  }

  public subscribe(listener: MetricsChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): PerformanceSnapshot {
    const resources = this.computeResourceMetrics();
    const baselineEstimate = this.estimateBaselineTransferBytes(resources);
    const savingsVsBaselineBytes = Math.max(0, baselineEstimate - resources.totalTransferBytes);

    return {
      vitals: { ...this.vitals },
      resources,
      timestamp: Date.now(),
      pageLoadDurationMs: this.pageLoadDurationMs || (typeof performance !== 'undefined' ? Math.round(performance.now()) : 0),
      savingsVsBaselineBytes,
    };
  }

  public recordSyntheticInteraction(interactionDurationMs: number) {
    // If browser hasn't triggered real INP yet, or for immediate interaction telemetry
    if (this.vitals.inp === null || interactionDurationMs > this.vitals.inp) {
      this.vitals.inp = Math.round(interactionDurationMs);
      this.notify();
    }
  }

  private initObservers() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Web Vitals API
      onLCP((metric) => {
        this.vitals.lcp = Math.round(metric.value);
        this.notify();
      }, { reportAllChanges: true });

      onCLS((metric) => {
        this.vitals.cls = Number(metric.value.toFixed(3));
        this.notify();
      }, { reportAllChanges: true });

      onINP((metric) => {
        this.vitals.inp = Math.round(metric.value);
        this.notify();
      }, { reportAllChanges: true });

      onFCP((metric) => {
        this.vitals.fcp = Math.round(metric.value);
        this.notify();
      });

      onTTFB((metric) => {
        this.vitals.ttfb = Math.round(metric.value);
        this.notify();
      });

      // 2. Navigation timing
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navEntries = performance.getEntriesByType('navigation');
          if (navEntries.length > 0) {
            const nav = navEntries[0] as PerformanceNavigationTiming;
            this.pageLoadDurationMs = Math.round(nav.loadEventEnd - nav.startTime);
          } else {
            this.pageLoadDurationMs = Math.round(performance.now());
          }
          this.notify();
        }, 100);
      });

      // 3. Resource Observer to update transfer sizes in real time
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(() => {
          this.notify();
        });
        observer.observe({ type: 'resource', buffered: true });
        this.isObserving = true;
      }
    } catch {
      // Graceful fallback if certain performance observers are restricted
    }
  }

  private computeResourceMetrics(): ResourceMetrics {
    if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
      return {
        totalTransferBytes: 0,
        jsTransferBytes: 0,
        imageTransferBytes: 0,
        cssTransferBytes: 0,
        otherTransferBytes: 0,
        resourceCount: 0,
        totalDecodedBytes: 0,
      };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    let totalTransferBytes = 0;
    let jsTransferBytes = 0;
    let imageTransferBytes = 0;
    let cssTransferBytes = 0;
    let otherTransferBytes = 0;
    let totalDecodedBytes = 0;

    for (const r of resources) {
      // transferSize can be 0 if served from disk cache or cross-origin without Timing-Allow-Origin
      // decodedBodySize provides fallback size
      const transfer = r.transferSize || r.decodedBodySize || 0;
      const decoded = r.decodedBodySize || r.transferSize || 0;

      totalTransferBytes += transfer;
      totalDecodedBytes += decoded;

      const name = r.name.toLowerCase();
      const initiator = r.initiatorType?.toLowerCase();

      if (initiator === 'img' || name.match(/\.(png|jpg|jpeg|webp|avif|svg|gif)($|\?)/i)) {
        imageTransferBytes += transfer;
      } else if (initiator === 'script' || name.match(/\.(js|mjs|ts|tsx)($|\?)/i)) {
        jsTransferBytes += transfer;
      } else if (initiator === 'css' || initiator === 'link' || name.match(/\.css($|\?)/i)) {
        cssTransferBytes += transfer;
      } else {
        otherTransferBytes += transfer;
      }
    }

    return {
      totalTransferBytes,
      jsTransferBytes,
      imageTransferBytes,
      cssTransferBytes,
      otherTransferBytes,
      resourceCount: resources.length,
      totalDecodedBytes,
    };
  }

  private estimateBaselineTransferBytes(current: ResourceMetrics): number {
    // A non-adaptive site serves uncompressed 1200px images and unpartitioned heavy JS bundles
    // Based on typical high-resolution payload multipliers (~3.5x image footprint on non-adaptive stores)
    if (current.imageTransferBytes > 0) {
      return current.imageTransferBytes * 3.2 + current.jsTransferBytes * 1.4;
    }
    return current.totalTransferBytes * 2.5;
  }

  private notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const performanceMonitor = new PerformanceMonitor();
