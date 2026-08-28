import { describe, expect, it } from "vitest";
import { detectAnomaly } from "@/lib/intelligence/anomaly";

describe("robust anomaly detection", () => {
  it("detects a strong positive departure using median/MAD", () => {
    const result = detectAnomaly(38.7, [32.9, 33.2, 33.4, 33.5, 33.1, 33.7, 33.3, 33.6, 33.4]);
    expect(result.baseline).toBeCloseTo(33.4);
    expect(result.deviation).toBeCloseTo(5.3);
    expect(["HIGH", "CRITICAL"]).toContain(result.severity);
    expect(result.method).toContain("robust-z");
  });

  it("requires a usable historical window", () => {
    expect(() => detectAnomaly(40, [38, 39])).toThrow(/five historical/);
  });
});
