import { describe, expect, it } from "vitest";
import { createDemoZones } from "@/lib/demo/data";
import { simulateScenario, SCENARIO_CONFIG, SCENARIO_DISCLAIMER } from "@/lib/intelligence/scenarios";

describe("simulateScenario", () => {
  const zone = createDemoZones().features[0];

  it("returns zero reduction when no treatments are applied", () => {
    const result = simulateScenario(zone, []);
    expect(result.deltaC).toBe(0);
    expect(result.projected.temperatureC).toBe(result.baseline.temperatureC);
    expect(result.contributions).toHaveLength(0);
    expect(result.confidence).toBe("Screening");
  });

  it("reduces temperature when canopy is added", () => {
    const result = simulateScenario(zone, [{ type: "canopy", level: 40 }]);
    expect(result.deltaC).toBeLessThan(0);
    expect(result.projected.temperatureC).toBeLessThan(result.baseline.temperatureC);
    expect(result.contributions[0].contributionC).toBeGreaterThan(0);
    expect(result.contributions[0].contributionC).toBeLessThanOrEqual(SCENARIO_CONFIG.canopy.maxContributionC);
  });

  it("applies a per-treatment contribution cap", () => {
    const result = simulateScenario(zone, [{ type: "canopy", level: 100 }]);
    expect(result.contributions[0].contributionC).toBeLessThanOrEqual(SCENARIO_CONFIG.canopy.maxContributionC);
  });

  it("reports a symmetric uncertainty band", () => {
    const result = simulateScenario(zone, [{ type: "coolRoof", level: 50 }]);
    const width = result.uncertainty.highC - result.uncertainty.lowC;
    expect(width).toBeGreaterThan(0);
    expect(result.uncertainty.highC).toBeGreaterThan(result.projected.temperatureC);
    expect(result.uncertainty.lowC).toBeLessThan(result.projected.temperatureC);
  });

  it("includes documented assumptions and a screening disclaimer", () => {
    const result = simulateScenario(zone, [{ type: "shade", level: 30 }]);
    expect(result.assumptions.length).toBeGreaterThan(3);
    expect(SCENARIO_DISCLAIMER.toLowerCase()).toContain("not a forecast");
  });

  it("never projects below the minimum floor", () => {
    const result = simulateScenario(zone, [
      { type: "canopy", level: 100 },
      { type: "coolRoof", level: 100 },
      { type: "shade", level: 100 },
      { type: "surfaceAlbedo", level: 100 },
    ]);
    expect(result.projected.temperatureC).toBeGreaterThanOrEqual(26);
  });
});
