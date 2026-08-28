import type { Severity } from "@/types";

export function median(values: number[]) {
  if (values.length === 0) throw new Error("At least one observation is required.");
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

export function anomalySeverity(score: number): Severity {
  const absolute = Math.abs(score);
  if (absolute >= 3.5) return "CRITICAL";
  if (absolute >= 2.5) return "HIGH";
  if (absolute >= 1.5) return "MODERATE";
  return "LOW";
}

export function detectAnomaly(current: number, historical: number[]) {
  if (historical.length < 5) throw new Error("At least five historical observations are required.");
  const baseline = median(historical);
  const deviations = historical.map((value) => Math.abs(value - baseline));
  const mad = median(deviations);
  const fallback = standardDeviation(historical);
  const score = mad > 0 ? (0.6745 * (current - baseline)) / mad : fallback > 0 ? (current - baseline) / fallback : 0;
  return {
    baseline,
    current,
    deviation: current - baseline,
    score,
    severity: anomalySeverity(score),
    method: mad > 0 ? "robust-z (median/MAD)" : "z-score fallback",
  };
}
