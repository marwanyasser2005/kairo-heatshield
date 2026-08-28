import type { HeatZoneFeature, HeatZoneCollection, ZoneProperties } from "@/types";
import { detectAnomaly } from "@/lib/intelligence/anomaly";
import { calculateHeatExposure } from "@/lib/intelligence/risk";

export type CityId = "phoenix" | "los-angeles";

export interface CityConfig {
  id: CityId;
  name: string;
  state: string;
  timezone: string;
  sampleDate: string;
  sampleTime: string;
}

export const CITIES: Record<CityId, CityConfig> = {
  phoenix: {
    id: "phoenix",
    name: "Phoenix",
    state: "Arizona",
    timezone: "MST",
    sampleDate: "15 Jul 2025",
    sampleTime: "16:00",
  },
  "los-angeles": {
    id: "los-angeles",
    name: "Los Angeles",
    state: "California",
    timezone: "PST",
    sampleDate: "15 Jul 2025",
    sampleTime: "14:00",
  },
};

const LA_SHADE_SAMPLE: Array<readonly [number, number, number]> = [
  [-118.4912, 34.0195, 18.42], [-118.4721, 34.0142, 15.67], [-118.3892, 34.0523, 22.14],
  [-118.3512, 34.0612, 19.88], [-118.3298, 34.0587, 24.31], [-118.3087, 34.0601, 26.75],
  [-118.2456, 34.0712, 31.22], [-118.4123, 34.0689, 17.93], [-118.2891, 34.0645, 28.44],
  [-118.2567, 34.0598, 25.67], [-118.5234, 34.0412, 14.23], [-118.2123, 34.0534, 29.88],
  [-118.2098, 34.0412, 27.56], [-118.3123, 34.0289, 21.34], [-118.3145, 34.0198, 23.12],
  [-118.4234, 34.0589, 16.78], [-118.4012, 34.0623, 18.92], [-118.3789, 34.0556, 20.45],
  [-118.3567, 34.0589, 22.67], [-118.3345, 34.0545, 24.89], [-118.3123, 34.0612, 26.34],
  [-118.4567, 34.0289, 15.12], [-118.2678, 34.0678, 27.89], [-118.3456, 34.0123, 19.45],
  [-118.3234, 34.0134, 21.78], [-118.3212, 34.0128, 23.45], [-118.4345, 34.0234, 16.34],
  [-118.3567, 33.9989, 24.56], [-118.3556, 33.9912, 22.34], [-118.3123, 33.9823, 28.91],
];

const LA_NAMED_ZONES: Record<number, [string, string]> = {
  0: ["Santa Monica Coastal Edge", "Westside"],
  6: ["Downtown LA Core", "Central"],
  11: ["East LA Industrial", "Eastside"],
  21: ["Venice Beach Corridor", "Westside"],
  26: ["South Central Grid", "South LA"],
};

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function historyAround(baseline: number, seed: number) {
  return Array.from({ length: 24 }, (_, index) =>
    round(baseline + Math.sin((index + seed) * 1.5) * 0.55 + Math.cos((index + seed) * 0.42) * 0.25, 2),
  );
}

function polygonFor(center: readonly [number, number, number]): HeatZoneFeature["geometry"] {
  const [longitude, latitude] = center;
  const west = longitude - 0.005;
  const east = longitude + 0.005;
  const south = latitude - 0.004;
  const north = latitude + 0.004;
  return {
    type: "Polygon",
    coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]],
  };
}

function baseZone(index: number, cityId: CityId): HeatZoneFeature {
  const row = Math.floor(index / 6);
  const column = index % 6;
  const shadeSample = cityId === "phoenix" ? PHOENIX_SHADE_SAMPLE[index] : LA_SHADE_SAMPLE[index];
  const namedZones = cityId === "phoenix" ? PHOENIX_NAMED_ZONES : LA_NAMED_ZONES;
  const [name, district] = namedZones[index] ?? (cityId === "phoenix"
    ? [`Shade Study Sample ${String(index + 1).padStart(2, "0")}`, "Citywide Phoenix sample"]
    : [`LA Prototype Cell ${String(index + 1).padStart(2, "0")}`, "Synthetic prototype"]);
  const builtDensityPct = cityId === "phoenix" ? 52 + ((column * 9 + row * 7 + index) % 34) : 48 + ((column * 8 + row * 6 + index) % 30);
  const imperviousPct = Math.min(91, builtDensityPct + 6 + ((index * 3) % 7));
  const vegetationPct = shadeSample[2];
  const humidityPct = cityId === "phoenix" ? 22 + ((row * 3 + column * 2) % 13) : 45 + ((row * 2 + column) % 15);
  const populationDensityKmSq = cityId === "phoenix" ? 1250 + ((index * 347) % 3100) : 2100 + ((index * 412) % 3800);
  const isAnomaly = index === 6 || index === 11;
  const isPersistentHotspot = index === 26;
  const urbanHeat = builtDensityPct * 0.048 + imperviousPct * 0.015 - vegetationPct * 0.048;
  const hotspotLift = index === 6 ? 2.4 : index === 11 ? 2.1 : index === 26 ? 1.9 : 0;
  const baseTemp = cityId === "phoenix" ? 36.6 : 34.2;
  const temperatureC = round(baseTemp + urbanHeat + row * 0.15 + hotspotLift);
  const deviation = isAnomaly ? (index === 6 ? 4.8 : 4.2) : isPersistentHotspot ? 1.0 : 0.38 + ((index * 7) % 8) * 0.07;
  const baselineTemperatureC = round(temperatureC - deviation);
  const historicalTemperaturesC = historyAround(baselineTemperatureC, index);
  const anomaly = detectAnomaly(temperatureC, historicalTemperaturesC);
  const persistenceHours = isPersistentHotspot ? 10 : index === 6 ? 9 : index === 11 ? 8 : 2 + ((index * 5) % 5);
  const heatIndexC = round(temperatureC + 1.2 + humidityPct * 0.038);
  const geometry = polygonFor(shadeSample);
  const centroid: [number, number] = [
    round((geometry.coordinates[0][0][0] + geometry.coordinates[0][2][0]) / 2, 6),
    round((geometry.coordinates[0][0][1] + geometry.coordinates[0][2][1]) / 2, 6),
  ];
  const properties: ZoneProperties = {
    id: `${cityId === "phoenix" ? "PHX" : "LA"}-${String(index + 1).padStart(2, "0")}`,
    name,
    district,
    centroid,
    observed: {
      temperatureC,
      heatIndexC,
      apparentTemperatureC: round(temperatureC + 0.8 + humidityPct * 0.022),
      humidityPct,
      persistenceHours,
      baselineTemperatureC: round(anomaly.baseline),
      historicalTemperaturesC,
      observedAt: `2025-07-15T${cityId === "phoenix" ? "16" : "14"}:00:00${cityId === "phoenix" ? "-07" : "-08"}:00`,
    },
    urban: {
      builtDensityPct: round(builtDensityPct),
      vegetationPct: round(vegetationPct),
      imperviousPct: round(imperviousPct),
      roadDensityKmSq: round(3.8 + ((index * 10) % 38) / 10),
      population: Math.round(populationDensityKmSq * 2.4),
      populationDensityKmSq: Math.round(populationDensityKmSq),
    },
    derived: {
      temporalDeviationC: round(temperatureC - anomaly.baseline),
      spatialIntensity: 0,
      anomalyScore: round(anomaly.score, 2),
      anomalySeverity: anomaly.severity,
    },
    model: { heatExposureScore: 0, heatExposureCategory: "LOW", priorityScore: 0, priorityRank: 0 },
    source: cityId === "phoenix"
      ? "KAIRO deterministic Phoenix heat scenario + City of Phoenix 2022 TREE_PCT_N canopy sample"
      : "KAIRO deterministic Los Angeles prototype; no external canopy provenance claimed",
  };
  return { type: "Feature", id: properties.id, geometry, properties };
}

const PHOENIX_SHADE_SAMPLE: Array<readonly [number, number, number]> = [
  [-112.26345, 33.40852, 10.86], [-112.2462, 33.40279, 7.26], [-112.12392, 33.66196, 10.61],
  [-112.09132, 33.66207, 10.67], [-112.0742, 33.66174, 11.36], [-112.05705, 33.66188, 13.73],
  [-111.97872, 33.6896, 23.66], [-112.1604, 33.66479, 13.07], [-112.0397, 33.66355, 13.47],
  [-112.00678, 33.65934, 14.55], [-112.28119, 33.51548, 9.76], [-111.93425, 33.63159, 16.26],
  [-111.9345, 33.6186, 17.2], [-112.05058, 33.6042, 19.41], [-112.05217, 33.5947, 14.79],
  [-112.16053, 33.64682, 11.96], [-112.14318, 33.65098, 10.71], [-112.12494, 33.6435, 8.21],
  [-112.10758, 33.64743, 8.72], [-112.09126, 33.64378, 11.02], [-112.05691, 33.65125, 13.53],
  [-112.22103, 33.43732, 7.3], [-111.98883, 33.65944, 15.01], [-112.10843, 33.57484, 7.46],
  [-112.05848, 33.57547, 12.73], [-112.05652, 33.57498, 13.5], [-112.17778, 33.4498, 3.67],
  [-112.10596, 33.5495, 16.98], [-112.1059, 33.54227, 13.82], [-112.05188, 33.53098, 22.61],
];

const PHOENIX_NAMED_ZONES: Record<number, [string, string]> = {
  6: ["Shade Study Sample 07", "Northeast Phoenix"],
  11: ["Shade Study Sample 12", "Northeast Phoenix"],
  8: ["North Phoenix Thermal Grid", "North Phoenix"],
  17: ["Deer Valley Industrial Edge", "Deer Valley"],
  23: ["North Mountain Mobility Basin", "North Mountain"],
  4: ["Encanto Civic Grid", "Encanto"],
  12: ["Grand Avenue Transition", "Alhambra"],
  19: ["Rio Salado Works", "Central City"],
  26: ["South Mountain Gateway", "South Mountain"],
};

export function createDemoZones(cityId: CityId = "phoenix"): HeatZoneCollection {
  const features = Array.from({ length: 30 }, (_, index) => baseZone(index, cityId));
  const meanTemperature = features.reduce((sum, zone) => sum + zone.properties.observed.temperatureC, 0) / features.length;
  for (const zone of features) {
    const spatialIntensity = Math.max(0, Math.min(1, 0.5 + (zone.properties.observed.temperatureC - meanTemperature) / 8));
    const exposure = calculateHeatExposure({
      temperatureC: zone.properties.observed.temperatureC,
      persistenceHours: zone.properties.observed.persistenceHours,
      heatIndexC: zone.properties.observed.heatIndexC,
      temporalDeviationC: zone.properties.derived.temporalDeviationC,
      spatialIntensity,
    });
    zone.properties.derived.spatialIntensity = round(spatialIntensity, 3);
    zone.properties.model.heatExposureScore = exposure.score;
    zone.properties.model.heatExposureCategory = exposure.category;
  }
  return { type: "FeatureCollection", features };
}

export const demoTemporalSeries: Record<CityId, Array<{ time: string; temperature: number; baseline: number; heatIndex: number }>> = {
  phoenix: [
    { time: "08:00", temperature: 33.2, baseline: 32.8, heatIndex: 34.1 },
    { time: "10:00", temperature: 36.5, baseline: 35.6, heatIndex: 38.0 },
    { time: "12:00", temperature: 40.1, baseline: 38.3, heatIndex: 42.2 },
    { time: "14:00", temperature: 42.8, baseline: 40.0, heatIndex: 45.4 },
    { time: "16:00", temperature: 44.6, baseline: 40.9, heatIndex: 47.1 },
    { time: "18:00", temperature: 42.3, baseline: 39.5, heatIndex: 44.8 },
    { time: "20:00", temperature: 39.7, baseline: 37.8, heatIndex: 41.5 },
    { time: "22:00", temperature: 37.8, baseline: 36.6, heatIndex: 39.2 },
  ],
  "los-angeles": [
    { time: "08:00", temperature: 28.4, baseline: 27.9, heatIndex: 29.2 },
    { time: "10:00", temperature: 31.2, baseline: 30.4, heatIndex: 32.8 },
    { time: "12:00", temperature: 34.8, baseline: 33.6, heatIndex: 36.9 },
    { time: "14:00", temperature: 37.2, baseline: 35.8, heatIndex: 39.8 },
    { time: "16:00", temperature: 38.9, baseline: 36.7, heatIndex: 41.6 },
    { time: "18:00", temperature: 36.5, baseline: 35.1, heatIndex: 39.2 },
    { time: "20:00", temperature: 33.8, baseline: 32.9, heatIndex: 36.1 },
    { time: "22:00", temperature: 31.2, baseline: 30.6, heatIndex: 33.4 },
  ],
};
