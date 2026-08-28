import { describe, expect, it } from "vitest";
import { createDemoZones } from "@/lib/demo/data";
import { detectHotspots } from "@/lib/intelligence/hotspots";

describe("spatial hotspot ranking", () => {
  it("produces a complete stable ranking with multi-evidence fields", () => {
    const zones = createDemoZones().features;
    const ranked = detectHotspots(zones);
    expect(ranked).toHaveLength(30);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].model.priorityScore).toBeGreaterThan(ranked[5].model.priorityScore);
    expect(ranked[0].neighborhoodIntensity).toBeGreaterThanOrEqual(0);
    expect(ranked[0].evidence).toHaveLength(4);
  });

  it("does not mutate source zone ranks", () => {
    const zones = createDemoZones().features;
    detectHotspots(zones);
    expect(zones.every((zone) => zone.properties.model.priorityRank === 0)).toBe(true);
  });
});
