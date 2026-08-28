import type { CityId } from "@/lib/demo/data";
import type { CorrelationResult, DashboardData } from "@/types";
import { createDemoZones, demoTemporalSeries, CITIES } from "@/lib/demo/data";
import { describeCorrelation } from "@/lib/intelligence/correlations";
import { detectHotspots } from "@/lib/intelligence/hotspots";
import { generateActionPlan, generateInsights } from "@/lib/intelligence/recommendations";

export function computeCorrelations(cityId: CityId): CorrelationResult[] {
  const zones = createDemoZones(cityId).features;
  const temperatures = zones.map((zone) => zone.properties.observed.temperatureC);
  const variables = [
    { variable: "Built-up density", values: zones.map((zone) => zone.properties.urban.builtDensityPct) },
    { variable: "Vegetation cover", values: zones.map((zone) => zone.properties.urban.vegetationPct) },
    { variable: "Impervious surface", values: zones.map((zone) => zone.properties.urban.imperviousPct) },
    { variable: "Road density", values: zones.map((zone) => zone.properties.urban.roadDensityKmSq) },
    { variable: "Population density", values: zones.map((zone) => zone.properties.urban.populationDensityKmSq) },
    { variable: "Relative humidity", values: zones.map((zone) => zone.properties.observed.humidityPct) },
  ];
  return variables.map(({ variable, values }) => describeCorrelation(variable, temperatures, values));
}

export function getDemoDashboardData(cityId: CityId = "phoenix"): DashboardData {
  const city = CITIES[cityId];
  const zones = createDemoZones(cityId);
  const hotspots = detectHotspots(zones.features);
  const rankById = new Map(hotspots.map((hotspot) => [hotspot.id, hotspot]));
  for (const zone of zones.features) {
    const ranked = rankById.get(zone.properties.id);
    if (ranked) zone.properties.model = ranked.model;
  }
  const correlations = computeCorrelations(cityId);
  const strongest = [...correlations].sort((a, b) => Math.abs(b.pearson ?? 0) - Math.abs(a.pearson ?? 0))[0];
  const highAnomalies = zones.features.filter((zone) => ["HIGH", "CRITICAL"].includes(zone.properties.derived.anomalySeverity));
  return {
    mode: "demo",
    label: "PHOENIX SCENARIO",
    location: `${city.name}, ${city.state}`,
    generatedAt: `2025-07-15T${cityId === "phoenix" ? "16" : "14"}:00:00${cityId === "phoenix" ? "-07" : "-08"}:00`,
    zones,
    hotspots,
    correlations,
    insights: generateInsights(hotspots, strongest),
    actions: generateActionPlan(hotspots),
    metrics: {
      averageExposure: Math.round(zones.features.reduce((sum, zone) => sum + zone.properties.model.heatExposureScore, 0) / zones.features.length),
      hotspotCount: 3,
      anomalyCount: highAnomalies.length,
      priorityZoneCount: 3,
      peakTemperatureC: Math.max(...zones.features.map((zone) => zone.properties.observed.temperatureC)),
    },
    temporalSeries: demoTemporalSeries[cityId],
  };
}
