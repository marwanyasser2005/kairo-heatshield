import type { Feature, FeatureCollection, Polygon } from "geojson";

export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type DataMode = "demo" | "live";

export interface ObservedHeatData {
  temperatureC: number;
  heatIndexC: number;
  apparentTemperatureC: number;
  humidityPct: number;
  persistenceHours: number;
  baselineTemperatureC: number;
  historicalTemperaturesC: number[];
  observedAt: string;
}

export interface UrbanContext {
  builtDensityPct: number;
  vegetationPct: number;
  imperviousPct: number;
  roadDensityKmSq: number;
  population: number;
  populationDensityKmSq: number;
}

export interface DerivedHeatData {
  temporalDeviationC: number;
  spatialIntensity: number;
  anomalyScore: number;
  anomalySeverity: Severity;
}

export interface ModelOutput {
  heatExposureScore: number;
  heatExposureCategory: Severity;
  priorityScore: number;
  priorityRank: number;
}

export interface ZoneProperties {
  id: string;
  name: string;
  district: string;
  centroid: [number, number];
  observed: ObservedHeatData;
  urban: UrbanContext;
  derived: DerivedHeatData;
  model: ModelOutput;
  source: string;
}

export type HeatZoneFeature = Feature<Polygon, ZoneProperties>;
export type HeatZoneCollection = FeatureCollection<Polygon, ZoneProperties>;

export interface Hotspot extends ZoneProperties {
  rank: number;
  neighborhoodIntensity: number;
  evidence: string[];
}

export interface CorrelationResult {
  variable: string;
  pearson: number | null;
  spearman: number | null;
  sampleSize: number;
  direction: "Positive" | "Negative" | "None";
  strength: "Very weak" | "Weak" | "Moderate" | "Strong" | "Very strong" | "Insufficient";
  caveat: string;
}

export interface Insight {
  id: string;
  type: "HEAT ANOMALY" | "HOTSPOT" | "PERSISTENCE" | "CORRELATION" | "URBAN CONTEXT" | "PRIORITY";
  title: string;
  severity: Severity;
  evidence: string[];
  explanation: string;
  source: string;
}

export interface ActionItem {
  zoneId: string;
  zone: string;
  priority: number;
  risk: Severity;
  evidence: string[];
  intervention: string;
  reason: string;
}

export interface RouteStop {
  id: string;
  name: string;
  temperatureC: number;
  exposure: number;
}

export interface RoutePath {
  label: string;
  strategy: "shortest" | "coolest";
  zoneIds: string[];
  stops: RouteStop[];
  totalDistanceKm: number;
  totalExposure: number;
  peakTemperatureC: number;
}

export interface RouteResult {
  start: RouteStop;
  end: RouteStop;
  shortest: RoutePath;
  coolest: RoutePath;
  exposureReduction: number;
  distanceAddedKm: number;
  recommendation: string;
}

export type ScenarioType = "canopy" | "coolRoof" | "shade" | "surfaceAlbedo";

export interface ScenarioStep {
  type: ScenarioType;
  level: number;
}

export interface ScenarioContribution {
  type: ScenarioType;
  level: number;
  contributionC: number;
}

export interface ScenarioResult {
  zoneId: string;
  zoneName: string;
  baseline: { temperatureC: number; exposureScore: number; category: Severity };
  projected: { temperatureC: number; exposureScore: number; category: Severity };
  deltaC: number;
  deltaExposure: number;
  uncertainty: { lowC: number; highC: number };
  confidence: "Screening" | "Field-validated";
  assumptions: string[];
  contributions: ScenarioContribution[];
}

export interface DashboardData {
  mode: DataMode;
  label: "PHOENIX SCENARIO" | "LIVE FORTYGUARD DATA";
  location: string;
  generatedAt: string;
  zones: HeatZoneCollection;
  hotspots: Hotspot[];
  correlations: CorrelationResult[];
  insights: Insight[];
  actions: ActionItem[];
  metrics: {
    averageExposure: number;
    hotspotCount: number;
    anomalyCount: number;
    priorityZoneCount: number;
    peakTemperatureC: number;
  };
  temporalSeries: Array<{ time: string; temperature: number; baseline: number; heatIndex: number }>;
}
