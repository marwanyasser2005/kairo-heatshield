import type { Severity } from "@/types";

export const HEAT_EXPOSURE_CONFIG = {
  weights: {
    temperature: 0.3,
    persistence: 0.22,
    heatIndexUplift: 0.15,
    temporalDeviation: 0.18,
    spatialIntensity: 0.15,
  },
  ranges: {
    temperatureC: [30, 48] as const,
    persistenceHours: [0, 12] as const,
    heatIndexUpliftC: [0, 10] as const,
    temporalDeviationC: [-2, 8] as const,
    spatialIntensity: [0, 1] as const,
  },
  thresholds: { moderate: 35, high: 55, critical: 75 },
} as const;

export interface HeatExposureInput {
  temperatureC: number;
  persistenceHours: number;
  heatIndexC: number;
  temporalDeviationC: number;
  spatialIntensity: number;
}

function normalize(value: number, [min, max]: readonly [number, number]) {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function categoryFromScore(score: number): Severity {
  const { moderate, high, critical } = HEAT_EXPOSURE_CONFIG.thresholds;
  if (score >= critical) return "CRITICAL";
  if (score >= high) return "HIGH";
  if (score >= moderate) return "MODERATE";
  return "LOW";
}

export function calculateHeatExposure(input: HeatExposureInput) {
  const { weights, ranges } = HEAT_EXPOSURE_CONFIG;
  const components = {
    temperature: normalize(input.temperatureC, ranges.temperatureC),
    persistence: normalize(input.persistenceHours, ranges.persistenceHours),
    heatIndexUplift: normalize(input.heatIndexC - input.temperatureC, ranges.heatIndexUpliftC),
    temporalDeviation: normalize(input.temporalDeviationC, ranges.temporalDeviationC),
    spatialIntensity: normalize(input.spatialIntensity, ranges.spatialIntensity),
  };
  const score = Math.round(
    100 *
      (components.temperature * weights.temperature +
        components.persistence * weights.persistence +
        components.heatIndexUplift * weights.heatIndexUplift +
        components.temporalDeviation * weights.temporalDeviation +
        components.spatialIntensity * weights.spatialIntensity),
  );
  return { score, category: categoryFromScore(score), components };
}

export const HEAT_EXPOSURE_DISCLAIMER =
  "This is a prototype analytical index for hackathon decision support. It is not a certified public-health or safety index.";
