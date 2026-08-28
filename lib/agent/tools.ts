import { getDemoDashboardData } from "@/lib/datasets/loader";

export function getHeatmap() {
  return getDemoDashboardData().zones;
}

export function getHotspots() {
  return getDemoDashboardData().hotspots.slice(0, 5);
}

export function getEnvironment(zoneId?: string) {
  const zones = getDemoDashboardData().zones.features;
  return zoneId ? zones.find((zone) => zone.properties.id === zoneId)?.properties : zones.map((zone) => zone.properties);
}

export function getCorrelations() {
  return getDemoDashboardData().correlations;
}

export function compareZones(zoneIds: string[]) {
  return getDemoDashboardData().zones.features.filter((zone) => zoneIds.includes(zone.properties.id)).map((zone) => zone.properties);
}

export function generateActionPlan() {
  return getDemoDashboardData().actions;
}
