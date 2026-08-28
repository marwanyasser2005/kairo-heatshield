import { describe, expect, it } from "vitest";
import { calculateHeatExposure, HEAT_EXPOSURE_CONFIG } from "@/lib/intelligence/risk";

describe("KAIRO Heat Exposure Index", () => {
  it("uses weights that sum to one", () => {
    expect(Object.values(HEAT_EXPOSURE_CONFIG.weights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
  });

  it("scores transparent normalized components", () => {
    const result = calculateHeatExposure({ temperatureC: 48, persistenceHours: 12, heatIndexC: 58, temporalDeviationC: 8, spatialIntensity: 1 });
    expect(result.score).toBe(100);
    expect(result.category).toBe("CRITICAL");
  });

  it("clamps out-of-range evidence", () => {
    const result = calculateHeatExposure({ temperatureC: 10, persistenceHours: -2, heatIndexC: 8, temporalDeviationC: -10, spatialIntensity: -1 });
    expect(result.score).toBe(0);
    expect(result.category).toBe("LOW");
  });
});
