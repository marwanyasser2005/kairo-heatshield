import { describe, expect, it } from "vitest";
import { heatmapRequestSchema, isApprovedPhoenixRequest, PHOENIX_LIVE_REQUEST } from "@/lib/fortyguard/schemas";
import { normalizeCompletedHeatmap } from "@/lib/fortyguard/heatmap";

const validRequest = {
  polygon_aoi: { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[-112.08, 33.44], [-112.06, 33.44], [-112.06, 33.46], [-112.08, 33.46], [-112.08, 33.44]]] } }] },
  date_time: { start_date: "2025-07-15", start_time: "16:00", filter_type: 1 },
  granularity: 100,
  analytic_type: "tcm",
} as const;

describe("FortyGuard validation and normalization", () => {
  it("accepts only a verified request structure", () => {
    expect(heatmapRequestSchema.safeParse(validRequest).success).toBe(true);
    const openPolygon = structuredClone(validRequest) as unknown as {
      polygon_aoi: { features: Array<{ geometry: { coordinates: number[][][] } }> };
    };
    openPolygon.polygon_aoi.features[0].geometry.coordinates[0][4] = [-112.07, 33.45];
    expect(heatmapRequestSchema.safeParse(openPolygon).success).toBe(false);
  });

  it("restricts the public live runner to the reviewed Phoenix TCM request", () => {
    expect(isApprovedPhoenixRequest(PHOENIX_LIVE_REQUEST)).toBe(true);
    expect(isApprovedPhoenixRequest({ ...PHOENIX_LIVE_REQUEST, granularity: 60 })).toBe(false);
  });

  it("normalizes documented completed GeoJSON without exposing raw properties", () => {
    const result = normalizeCompletedHeatmap("activity-1", {
      map_data: { type: "FeatureCollection", features: [{ type: "Feature", id: "tile-1", properties: { temperature: 42.5, private_upstream_field: "not forwarded" }, geometry: { type: "Polygon", coordinates: [[[-112.08, 33.44], [-112.06, 33.44], [-112.06, 33.46], [-112.08, 33.46], [-112.08, 33.44]]] } }] },
      stats_data: { Temperature_stats: { Mean: 42.5 } },
    });
    expect(result.label).toBe("LIVE FORTYGUARD DATA");
    expect(result.zones.features[0].properties.observed.temperatureC).toBe(42.5);
    expect(result.zones.features[0].properties).not.toHaveProperty("private_upstream_field");
    expect(result.temperatureRangeC).toEqual({ minimum: 42.5, maximum: 42.5, mean: 42.5 });
    expect(result.analysisTimestamp).toBe("2025-07-15T16:00:00-07:00");
  });

  it("normalizes the verified live average_temperature field", () => {
    const result = normalizeCompletedHeatmap("activity-live", {
      map_data: { type: "FeatureCollection", features: [{ type: "Feature", id: 8, properties: { tile_id: 8, average_temperature: 41.75, min_temperature: 40.2, max_temperature: 43.1 }, geometry: { type: "Polygon", coordinates: [[[-112.08, 33.44], [-112.06, 33.44], [-112.06, 33.46], [-112.08, 33.46], [-112.08, 33.44]]] } }] },
      stats_data: {},
    });
    expect(result.zones.features[0].properties.observed.temperatureC).toBe(41.75);
    expect(result.zones.features[0].id).toBe("8");
  });

  it("refuses to guess an undocumented temperature property", () => {
    expect(() => normalizeCompletedHeatmap("activity-2", { map_data: { type: "FeatureCollection", features: [{ type: "Feature", properties: { mystery: 42 }, geometry: { type: "Polygon", coordinates: [[[-1, 0], [0, 0], [0, 1], [-1, 1], [-1, 0]]] } }] }, stats_data: {} })).toThrow(/did not include/);
  });
});
