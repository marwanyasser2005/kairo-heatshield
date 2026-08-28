import type { HeatZoneFeature, ScenarioResult, ScenarioStep, ScenarioType } from "@/types";
import { calculateHeatExposure } from "@/lib/intelligence/risk";

export const SCENARIO_CONFIG: Record<ScenarioType, { label: string; coefficientCPer10pct: number; maxContributionC: number; unit: string }> = {
  canopy: { label: "Tree canopy", coefficientCPer10pct: 1.0, maxContributionC: 3.5, unit: "% added" },
  coolRoof: { label: "Cool roof", coefficientCPer10pct: 0.6, maxContributionC: 2.4, unit: "% of roofs treated" },
  shade: { label: "Shade structures", coefficientCPer10pct: 0.8, maxContributionC: 2.8, unit: "% of route shaded" },
  surfaceAlbedo: { label: "Surface albedo", coefficientCPer10pct: 0.5, maxContributionC: 2.0, unit: "% of impervious treated" },
};

export const SCENARIO_DISCLAIMER =
  "Screening-level estimate for hackathon decision support. Not a forecast, engineering specification, or guaranteed cooling outcome. Coefficients are conservative literature-informed ranges; field validation is required before investment.";

const UNCERTAINTY_FACTOR = 0.4;
const MIN_PROJECTED_C = 26;

function contributionFor(step: ScenarioStep, zone: HeatZoneFeature["properties"]): number {
  const config = SCENARIO_CONFIG[step.type];
  const level = Math.max(0, Math.min(100, step.level));
  const base = (level / 10) * config.coefficientCPer10pct;
  let scaled = base;
  if (step.type === "canopy") scaled = base * (1 - zone.urban.vegetationPct / 100);
  if (step.type === "coolRoof") scaled = base * (zone.urban.builtDensityPct / 100);
  if (step.type === "surfaceAlbedo") scaled = base * (zone.urban.imperviousPct / 100);
  return Math.max(0, Math.min(config.maxContributionC, scaled));
}

function exposureFor(zone: HeatZoneFeature["properties"], temperatureC: number) {
  return calculateHeatExposure({
    temperatureC,
    heatIndexC: temperatureC,
    persistenceHours: zone.observed.persistenceHours,
    temporalDeviationC: zone.derived.temporalDeviationC,
    spatialIntensity: zone.derived.spatialIntensity,
  });
}

export function simulateScenario(zone: HeatZoneFeature, steps: ScenarioStep[]): ScenarioResult {
  const properties = zone.properties;
  const baselineTemp = properties.observed.temperatureC;
  const baselineExposure = exposureFor(properties, baselineTemp);
  const contributions = steps.map((step) => ({ ...step, contributionC: contributionFor(step, properties) }));
  const totalReduction = contributions.reduce((sum, item) => sum + item.contributionC, 0);
  const projectedTemp = Math.max(MIN_PROJECTED_C, baselineTemp - totalReduction);
  const projectedExposure = exposureFor(properties, projectedTemp);
  const uncertainty = totalReduction * UNCERTAINTY_FACTOR;
  const assumptions = [
    "Coefficients are conservative, literature-informed screening ranges, not field-calibrated.",
    "Canopy benefit diminishes where existing canopy is already high.",
    "Cool-roof and surface-albedo effects scale with the built-up or impervious fraction present.",
    "Interactions between treatments are not modeled additively beyond a per-treatment cap.",
    "Persistence, humidity, and weather confounders are held constant.",
  ];
  if (steps.some((step) => step.type === "canopy")) assumptions.push("Canopy growth is slow; benefits may lag implementation by years.");
  return {
    zoneId: properties.id,
    zoneName: properties.name,
    baseline: { temperatureC: baselineTemp, exposureScore: baselineExposure.score, category: baselineExposure.category },
    projected: { temperatureC: projectedTemp, exposureScore: projectedExposure.score, category: projectedExposure.category },
    deltaC: projectedTemp - baselineTemp,
    deltaExposure: projectedExposure.score - baselineExposure.score,
    uncertainty: { lowC: projectedTemp - uncertainty, highC: projectedTemp + uncertainty },
    confidence: "Screening",
    assumptions,
    contributions,
  };
}

export function compareScenarios(zone: HeatZoneFeature, scenarios: { label: string; steps: ScenarioStep[] }[]): ScenarioResult[] {
  return scenarios.map((scenario) => simulateScenario(zone, scenario.steps));
}
