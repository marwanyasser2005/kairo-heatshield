import type { HeatZoneFeature, RoutePath, RouteResult, RouteStop } from "@/types";

const NEAREST_NEIGHBORS = 6;
const CONNECTIVITY_THRESHOLD_KM = 6.5;
const COOL_TRADEOFF = 0.25;

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function neighbors(features: HeatZoneFeature[], index: number) {
  const current = features[index].properties.centroid;
  return features
    .map((zone, other) => ({ other, distance: haversineKm(current, zone.properties.centroid) }))
    .filter((entry) => entry.other !== index)
    .sort((a, b) => a.distance - b.distance)
    .filter((entry, position) => position < NEAREST_NEIGHBORS || entry.distance <= CONNECTIVITY_THRESHOLD_KM);
}

function buildGraph(features: HeatZoneFeature[]) {
  const adjacency = features.map((_, index) => neighbors(features, index));
  for (let index = 0; index < features.length; index += 1) {
    for (const neighbor of adjacency[index]) {
      if (!adjacency[neighbor.other].some((entry) => entry.other === index)) {
        adjacency[neighbor.other].push({ other: index, distance: neighbor.distance });
      }
    }
  }
  return adjacency;
}

function dijkstra(features: HeatZoneFeature[], adjacency: ReturnType<typeof buildGraph>, startIndex: number, endIndex: number, weight: (from: number, to: number, distance: number) => number) {
  const count = features.length;
  const distances = new Array<number>(count).fill(Infinity);
  const previous = new Array<number>(count).fill(-1);
  distances[startIndex] = 0;
  const visited = new Array<boolean>(count).fill(false);
  for (let step = 0; step < count; step += 1) {
    let current = -1;
    let best = Infinity;
    for (let node = 0; node < count; node += 1) {
      if (!visited[node] && distances[node] < best) {
        best = distances[node];
        current = node;
      }
    }
    if (current === -1 || current === endIndex) break;
    visited[current] = true;
    for (const neighbor of adjacency[current]) {
      const edge = weight(current, neighbor.other, neighbor.distance);
      const candidate = distances[current] + edge;
      if (candidate < distances[neighbor.other]) {
        distances[neighbor.other] = candidate;
        previous[neighbor.other] = current;
      }
    }
  }
  const path: number[] = [];
  let cursor = endIndex;
  if (previous[cursor] === -1 && cursor !== startIndex) return [];
  while (cursor !== -1) {
    path.unshift(cursor);
    cursor = previous[cursor];
  }
  return path;
}

function toStop(zone: HeatZoneFeature): RouteStop {
  return {
    id: zone.properties.id,
    name: zone.properties.name,
    temperatureC: zone.properties.observed.temperatureC,
    exposure: zone.properties.model.heatExposureScore,
  };
}

function buildPath(features: HeatZoneFeature[], indices: number[], strategy: "shortest" | "coolest"): RoutePath {
  const stops = indices.map((index) => toStop(features[index]));
  let totalDistanceKm = 0;
  for (let index = 0; index < indices.length - 1; index += 1) {
    totalDistanceKm += haversineKm(features[indices[index]].properties.centroid, features[indices[index + 1]].properties.centroid);
  }
  const totalExposure = stops.reduce((sum, stop) => sum + stop.exposure, 0);
  const peakTemperatureC = Math.max(...stops.map((stop) => stop.temperatureC));
  return {
    label: strategy === "shortest" ? "Shortest path" : "Coolest path",
    strategy,
    zoneIds: stops.map((stop) => stop.id),
    stops,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalExposure,
    peakTemperatureC: Number(peakTemperatureC.toFixed(1)),
  };
}

export function findRoute(zones: HeatZoneFeature[], startId: string, endId: string): RouteResult | null {
  const features = [...zones];
  const startIndex = features.findIndex((zone) => zone.properties.id === startId);
  const endIndex = features.findIndex((zone) => zone.properties.id === endId);
  if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) return null;
  const adjacency = buildGraph(features);
  const shortestIndices = dijkstra(features, adjacency, startIndex, endIndex, (_from, _to, distance) => distance);
  const coolestIndices = dijkstra(features, adjacency, startIndex, endIndex, (_from, to, distance) => features[to].properties.model.heatExposureScore + distance * COOL_TRADEOFF);
  if (shortestIndices.length === 0 || coolestIndices.length === 0) return null;
  const shortest = buildPath(features, shortestIndices, "shortest");
  const coolest = buildPath(features, coolestIndices, "coolest");
  const exposureReduction = shortest.totalExposure - coolest.totalExposure;
  const distanceAddedKm = Number((coolest.totalDistanceKm - shortest.totalDistanceKm).toFixed(2));
  const reduction = shortest.peakTemperatureC - coolest.peakTemperatureC;
  const recommendation =
    exposureReduction > 0
      ? `The coolest path lowers cumulative heat exposure by ${exposureReduction} index-points${reduction > 0 ? ` and the peak temperature by ${reduction.toFixed(1)}°C` : ""}, at the cost of ${distanceAddedKm.toFixed(2)} km. This is a screening aid for pedestrian routing, not a navigation or safety directive.`
      : `The shortest and coolest paths coincide here. Heat exposure is comparable on both options.`;
  return { start: toStop(features[startIndex]), end: toStop(features[endIndex]), shortest, coolest, exposureReduction, distanceAddedKm, recommendation };
}
