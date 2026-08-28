import "server-only";
import { z } from "zod";
import type { Feature, Polygon } from "geojson";
import type { HeatZoneFeature, ZoneProperties } from "@/types";
import { fortyGuardFetch } from "@/lib/fortyguard/client";
import { submissionEnvelopeSchema, type HeatmapRequest } from "@/lib/fortyguard/schemas";
import { FortyGuardError, type NormalizedLiveHeatmap } from "@/lib/fortyguard/types";
import { calculateHeatExposure } from "@/lib/intelligence/risk";

const completedHeatmapSchema = z.object({
  map_data: z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(z.object({
      type: z.literal("Feature"),
      id: z.union([z.string(), z.number()]).optional(),
      properties: z.record(z.string(), z.unknown()),
      geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))) }),
    })),
  }),
  stats_data: z.record(z.string(), z.unknown()),
});

export async function submitHeatmap(request: HeatmapRequest) {
  const response = await fortyGuardFetch("/v1/heatmap", { method: "POST", body: JSON.stringify(request) });
  const parsed = submissionEnvelopeSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.error) throw new FortyGuardError("FortyGuard returned an invalid heatmap submission envelope.", "NORMALIZATION", 502);
  return parsed.data.data.activity_id;
}

function numericTemperature(properties: Record<string, unknown>) {
  const documentedMeaningCandidates = ["temperature", "temperature_c", "temperature_celsius", "average_temperature", "mean_temperature", "tcm", "value"];
  const entries = Object.entries(properties);
  for (const candidate of documentedMeaningCandidates) {
    const entry = entries.find(([key]) => key.toLowerCase() === candidate);
    if (entry && typeof entry[1] === "number" && Number.isFinite(entry[1])) return entry[1];
  }
  return undefined;
}

function centroidOfPolygon(geometry: Polygon): [number, number] {
  const ring = geometry.coordinates[0];
  const points = ring.length > 1 ? ring.slice(0, -1) : ring;
  return [points.reduce((sum, point) => sum + point[0], 0) / points.length, points.reduce((sum, point) => sum + point[1], 0) / points.length];
}

export function normalizeCompletedHeatmap(
  activityId: string,
  result: unknown,
  analysisTimestamp = "2025-07-15T16:00:00-07:00",
): NormalizedLiveHeatmap {
  const parsed = completedHeatmapSchema.safeParse(result);
  if (!parsed.success) throw new FortyGuardError("The completed heatmap did not match the documented GeoJSON result envelope.", "NORMALIZATION", 502);
  const temperatures = parsed.data.map_data.features.map((feature) => numericTemperature(feature.properties));
  if (temperatures.some((value) => value === undefined)) {
    throw new FortyGuardError("The heatmap GeoJSON did not include an identifiable numeric temperature property. Raw data was not guessed.", "NORMALIZATION", 502);
  }
  const values = temperatures as number[];
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const features: HeatZoneFeature[] = parsed.data.map_data.features.map((raw, index) => {
    const temperatureC = values[index];
    const spatialIntensity = Math.max(0, Math.min(1, 0.5 + (temperatureC - mean) / 8));
    const exposure = calculateHeatExposure({ temperatureC, heatIndexC: temperatureC, persistenceHours: 0, temporalDeviationC: 0, spatialIntensity });
    const geometry = raw.geometry as Polygon;
    const properties: ZoneProperties = {
      id: String(raw.id ?? `FG-${index + 1}`),
      name: `FortyGuard tile ${index + 1}`,
      district: "Live analysis area",
      centroid: centroidOfPolygon(geometry),
      observed: {
        temperatureC,
        heatIndexC: temperatureC,
        apparentTemperatureC: temperatureC,
        humidityPct: 0,
        persistenceHours: 0,
        baselineTemperatureC: temperatureC,
        historicalTemperaturesC: [],
        observedAt: analysisTimestamp,
      },
      urban: { builtDensityPct: 0, vegetationPct: 0, imperviousPct: 0, roadDensityKmSq: 0, population: 0, populationDensityKmSq: 0 },
      derived: { temporalDeviationC: 0, spatialIntensity, anomalyScore: 0, anomalySeverity: "LOW" },
      model: { heatExposureScore: exposure.score, heatExposureCategory: exposure.category, priorityScore: 0, priorityRank: 0 },
      source: "FortyGuard Temperature API · live TCM; unavailable context fields remain zero and are not interpreted",
    };
    return { type: "Feature", id: properties.id, geometry, properties } satisfies Feature<Polygon, ZoneProperties>;
  });
  return {
    mode: "live",
    label: "LIVE FORTYGUARD DATA",
    activityId,
    status: "Completed",
    zones: { type: "FeatureCollection", features },
    statistics: parsed.data.stats_data,
    source: "FortyGuard Temperature API",
    analysisTimestamp,
    temperatureRangeC: {
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      mean,
    },
  };
}
