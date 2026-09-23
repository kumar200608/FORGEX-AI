export type Confidence = "high" | "medium" | "low";

export function confidenceFor(source: unknown): Confidence {
  if (source === "api") return "high";
  if (source === "probe") return "medium";
  return "low";
}

const SLOW_TYPES: readonly string[] = ["slow-2g", "2g", "3g"];

export function isSlowNetwork(effectiveType: unknown): boolean {
  return typeof effectiveType === "string" && (SLOW_TYPES as readonly string[]).includes(effectiveType);
}
