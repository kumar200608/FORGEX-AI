import { OllamaRecommendation, PerformanceSnapshot } from '../types';

export interface AIAnalysisRequest {
  network: string;
  device: string;
  adaptiveMode: string;
  jsTier: string;
  imageStrategy: string;
  prefetchStrategy: string;
  metrics: {
    lcpMs: number | null;
    inpMs: number | null;
    cls: number | null;
    fcpMs: number | null;
    ttfbMs: number | null;
    jsTransferBytes: number;
    imageTransferBytes: number;
    totalTransferBytes: number;
    resourceCount: number;
  };
}

export async function requestOllamaOptimizationAnalysis(
  request: AIAnalysisRequest
): Promise<OllamaRecommendation> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout to keep UI snappy

    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.recommendation) {
        return data.recommendation;
      }
    }
  } catch {
    // Network or server error -> proceed smoothly to deterministic fallback
  }

  // Graceful fallback: Run deterministic rules grounded strictly in the real measured values
  return generateDeterministicAnalysis(request);
}

export function generateDeterministicAnalysis(
  req: AIAnalysisRequest
): OllamaRecommendation {
  const { metrics, network, device, adaptiveMode, imageStrategy } = req;
  const lcp = metrics.lcpMs;
  const cls = metrics.cls;
  const inp = metrics.inpMs;
  const imgKb = Math.round(metrics.imageTransferBytes / 1024);
  const jsKb = Math.round(metrics.jsTransferBytes / 1024);

  // 1. Check LCP Bottlenecks
  if (lcp !== null && lcp > 2500) {
    if (imgKb > 400 || imageStrategy === 'high') {
      return {
        bottleneck: `LCP elevated at ${lcp}ms, driven by image payload weight (${imgKb} KB across loaded resources).`,
        recommendation:
          'Enforce strict adaptive downsampling (switch image strategy from High to Medium/Low) and apply fetchpriority="high" only to the hero asset.',
        priority: 'CRITICAL',
        reasoning: `On ${network} connection, downloading ${imgKb} KB of imagery requires substantial round-trips. Downscaling to 600px/300px WebP shrinks transfer bytes by ~65%, directly lowering LCP below the 2.5s threshold.`,
        estimatedImpact: 'Reduces LCP by an estimated 800ms - 1400ms on throttled connections.',
        source: 'deterministic-fallback',
      };
    }
    return {
      bottleneck: `LCP at ${lcp}ms exceeding 2.5s Good threshold.`,
      recommendation:
        'Defer non-critical third-party scripts and prioritize above-the-fold HTML/CSS rendering streams.',
      priority: 'HIGH',
      reasoning: `Server delivery or render-blocking script execution is delaying the paint of the primary content block under ${network}.`,
      estimatedImpact: 'Reduces initial paint delay by ~400ms - 800ms.',
      source: 'deterministic-fallback',
    };
  }

  // 2. Check Layout Shift (CLS)
  if (cls !== null && cls > 0.1) {
    return {
      bottleneck: `CLS is ${cls.toFixed(3)} (Poor: > 0.1 threshold). Unstable layout shifts detected.`,
      recommendation:
        'Inject explicit aspect-ratio CSS declarations and SVG skeleton placeholders on dynamic product cards.',
      priority: 'HIGH',
      reasoning:
        'Image and dynamic feature components are loading without reserved bounding boxes, causing content below to shift when elements render.',
      estimatedImpact: 'Eliminates unexpected layout reflows, dropping CLS to < 0.02.',
      source: 'deterministic-fallback',
    };
  }

  // 3. Check Interaction to Next Paint (INP)
  if (inp !== null && inp > 200) {
    return {
      bottleneck: `INP at ${inp}ms indicates main-thread latency during user input handlers.`,
      recommendation:
        'Transition JS tier to LITE or partition React re-renders using startTransition and requestIdleCallback.',
      priority: 'HIGH',
      reasoning: `Device is running with ${device} profile. Expensive re-renders or unpartitioned animation loops are blocking input processing.`,
      estimatedImpact: 'Improves input responsiveness by ~120ms, bringing INP into the sub-100ms Good zone.',
      source: 'deterministic-fallback',
    };
  }

  // 4. Check JS payload weight on low-spec device
  if (jsKb > 250 && (device.includes('LOW') || network.includes('SLOW'))) {
    return {
      bottleneck: `JavaScript transfer weight (${jsKb} KB) is burdensome for detected ${device} hardware.`,
      recommendation:
        'Activate AdaptX JS Tier LITE: dynamically unmount 3D canvas and animated product carousels.',
      priority: 'MEDIUM',
      reasoning:
        'Mobile low-core CPUs spend excessive execution time compiling and parsing unneeded script modules.',
      estimatedImpact: 'Cuts main thread parse/compile time by ~45%.',
      source: 'deterministic-fallback',
    };
  }

  // 5. Healthy performance state
  return {
    bottleneck: `No critical bottlenecks detected. Current Adaptive Mode (${adaptiveMode}) is well-balanced.`,
    recommendation:
      'Maintain active AdaptiveProfile with speculative prefetching restricted to user hover intent.',
    priority: 'LOW',
    reasoning: `Measured Web Vitals (LCP: ${lcp ?? 'N/A'}ms, CLS: ${cls ?? 'N/A'}, INP: ${inp ?? 'N/A'}ms) comply with Web Vitals target thresholds. Total payload is lean at ${Math.round(metrics.totalTransferBytes / 1024)} KB.`,
    estimatedImpact: 'Maintains sub-second interactivity and negligible bandwidth wastage.',
    source: 'deterministic-fallback',
  };
}
