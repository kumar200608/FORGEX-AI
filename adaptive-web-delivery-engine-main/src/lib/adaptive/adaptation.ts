import type { AdaptiveMode } from "@/types";

export interface AdaptationChanges {
  imageReduced: boolean;
  componentDeferred: boolean;
  animationsReduced: boolean;
  prefetchDisabled: boolean;
}

export function changesFor(mode: AdaptiveMode): AdaptationChanges {
  const constrained = mode === "CONSTRAINED";
  return {
    imageReduced: constrained,
    componentDeferred: constrained,
    animationsReduced: constrained,
    prefetchDisabled: constrained,
  };
}

export function describeStrategies(decision: any): { image: string; component: string; prefetch: string } {
  const mode = decision?.mode as AdaptiveMode | undefined;
  const constrained = mode === "CONSTRAINED";
  return {
    image: constrained ? "Serving reduced images" : "Serving full images",
    component: constrained ? "Deferring non-critical components" : "Rendering all components",
    prefetch: constrained ? "Prefetch disabled" : "Prefetch enabled",
  };
}
