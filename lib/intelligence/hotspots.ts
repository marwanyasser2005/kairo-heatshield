import type { HeatZoneFeature, Hotspot } from "@/types";

function distance(a: [number, number], b: [number, number]) {
  const latitudeScale = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  return Math.sqrt(((a[0] - b[0]) * latitudeScale) ** 2 + (a[1] - b[1]) ** 2);
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function detectHotspots(zones: HeatZoneFeature[]): Hotspot[] {
  const candidates = zones.map((zone) => {
    const nearby = zones.filter((candidate) => distance(zone.properties.centroid, candidate.properties.centroid) <= 0.027);
    const neighborhoodTemperature = nearby.reduce((sum, item) => sum + item.properties.observed.temperatureC, 0) / nearby.length;
    const neighborhoodIntensity = clamp((neighborhoodTemperature - 36) / 10);
    const anomalyEvidence = clamp(Math.abs(zone.properties.derived.anomalyScore) / 5);
    const persistenceEvidence = clamp(zone.properties.observed.persistenceHours / 12);
    const exposureEvidence = clamp(zone.properties.urban.populationDensityKmSq / 4500);
    const priorityScore = Math.round(
      100 *
        (zone.properties.model.heatExposureScore / 100 * 0.35 +
          anomalyEvidence * 0.2 +
          persistenceEvidence * 0.15 +
          neighborhoodIntensity * 0.15 +
          exposureEvidence * 0.15),
    );
    return {
      ...zone.properties,
      model: { ...zone.properties.model, priorityScore },
      neighborhoodIntensity,
      rank: 0,
      evidence: [
        `${zone.properties.observed.temperatureC.toFixed(1)}°C observed temperature`,
        `${zone.properties.observed.persistenceHours} hours above the demo persistence threshold`,
        `${zone.properties.derived.temporalDeviationC >= 0 ? "+" : ""}${zone.properties.derived.temporalDeviationC.toFixed(1)}°C from its local baseline`,
        `${zone.properties.urban.populationDensityKmSq.toLocaleString("en-US")} people/km² exposure context`,
      ],
    } satisfies Hotspot;
  });
  return candidates
    .sort((a, b) => b.model.priorityScore - a.model.priorityScore)
    .map((hotspot, index) => ({ ...hotspot, rank: index + 1, model: { ...hotspot.model, priorityRank: index + 1 } }));
}
