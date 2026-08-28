import { describe, expect, it } from "vitest";
import { createDemoZones } from "@/lib/demo/data";
import { findRoute } from "@/lib/intelligence/routing";

describe("findRoute", () => {
  const zones = createDemoZones().features;

  it("returns null for identical start and end", () => {
    expect(findRoute(zones, zones[0].properties.id, zones[0].properties.id)).toBeNull();
  });

  it("returns a connected path between two different zones", () => {
    const result = findRoute(zones, zones[0].properties.id, zones[5].properties.id);
    expect(result).not.toBeNull();
    expect(result!.coolest.stops.length).toBeGreaterThanOrEqual(2);
    expect(result!.coolest.stops[0].id).toBe(zones[0].properties.id);
    expect(result!.coolest.stops.at(-1)!.id).toBe(zones[5].properties.id);
  });

  it("reports both shortest and coolest strategies", () => {
    const result = findRoute(zones, zones[2].properties.id, zones[8].properties.id)!;
    expect(result.shortest.strategy).toBe("shortest");
    expect(result.coolest.strategy).toBe("coolest");
    expect(result.shortest.totalDistanceKm).toBeGreaterThan(0);
    expect(result.coolest.totalExposure).toBeGreaterThanOrEqual(0);
  });

  it("computes a recommendation string", () => {
    const result = findRoute(zones, zones[0].properties.id, zones[29].properties.id)!;
    expect(typeof result.recommendation).toBe("string");
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});
