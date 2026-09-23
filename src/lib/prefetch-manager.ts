import { PrefetchStrategy } from '../types';

export interface PrefetchLogEntry {
  id: string;
  url: string;
  strategy: PrefetchStrategy;
  status: 'EXECUTED' | 'SKIPPED_CONSTRAINED' | 'SKIPPED_OFFLINE' | 'HOVER_TRIGGERED';
  timestamp: string;
  reason: string;
}

type LogListener = (logs: PrefetchLogEntry[]) => void;

class PrefetchManager {
  private prefetchedUrls: Set<string> = new Set();
  private logs: PrefetchLogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

  public getLogs(): PrefetchLogEntry[] {
    return [...this.logs];
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public requestPrefetch(
    url: string,
    strategy: PrefetchStrategy,
    trigger: 'idle' | 'hover' | 'explicit' = 'idle'
  ) {
    if (this.prefetchedUrls.has(url)) {
      return;
    }

    const now = new Date().toLocaleTimeString();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Rule 1: OFFLINE or SLOW (DISABLED)
    if (strategy === 'DISABLED') {
      this.addLog({
        id,
        url,
        strategy,
        status: 'SKIPPED_CONSTRAINED',
        timestamp: now,
        reason: 'Network/Device profile requires zero unnecessary data transfer. Prefetch suppressed.',
      });
      return;
    }

    // Rule 2: MODERATE (LIMITED)
    if (strategy === 'LIMITED') {
      if (trigger === 'hover' || trigger === 'explicit') {
        this.executePrefetch(url);
        this.addLog({
          id,
          url,
          strategy,
          status: 'HOVER_TRIGGERED',
          timestamp: now,
          reason: 'Intent detected via hover/focus. Fetching asset cautiously.',
        });
      } else {
        this.addLog({
          id,
          url,
          strategy,
          status: 'SKIPPED_CONSTRAINED',
          timestamp: now,
          reason: 'Background idle prefetch blocked under Moderate connection. Awaiting explicit user hover intent.',
        });
      }
      return;
    }

    // Rule 3: FAST (AGGRESSIVE)
    if (strategy === 'AGGRESSIVE') {
      this.executePrefetch(url);
      this.addLog({
        id,
        url,
        strategy,
        status: 'EXECUTED',
        timestamp: now,
        reason: 'Fast network & high-spec device detected. Aggressive speculative preload allowed.',
      });
    }
  }

  private executePrefetch(url: string) {
    this.prefetchedUrls.add(url);

    if (typeof document === 'undefined') return;

    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = url.match(/\.(jpg|jpeg|png|webp|avif)$/i) ? 'image' : 'fetch';
      document.head.appendChild(link);
    } catch {
      // Fallback
    }
  }

  private addLog(entry: PrefetchLogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > 30) {
      this.logs.pop();
    }
    this.notify();
  }

  private notify() {
    const current = this.getLogs();
    this.listeners.forEach((l) => l(current));
  }
}

export const prefetchManager = new PrefetchManager();
