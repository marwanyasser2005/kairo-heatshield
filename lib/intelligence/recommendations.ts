import type { ActionItem, Hotspot, Insight } from "@/types";

export function generateActionPlan(hotspots: Hotspot[]): ActionItem[] {
  return hotspots.slice(0, 3).map((hotspot, index) => {
    const intervention =
      hotspot.urban.vegetationPct < 12
        ? "Vegetation and shade assessment"
        : hotspot.urban.imperviousPct > 72
          ? "Cool-surface and public-space redesign assessment"
          : "Cooling infrastructure and targeted monitoring assessment";
    return {
      zoneId: hotspot.id,
      zone: hotspot.name,
      priority: index + 1,
      risk: hotspot.model.heatExposureCategory,
      evidence: hotspot.evidence,
      intervention,
      reason: `Consider prioritizing ${hotspot.name} for ${intervention.toLowerCase()} because multiple observed, derived, and urban-context signals contribute to its analytical priority.`,
    };
  });
}

export function generateInsights(hotspots: Hotspot[], strongestCorrelation: { variable: string; pearson: number | null }): Insight[] {
  const top = hotspots[0];
  const anomaly = hotspots.find((item) => item.derived.anomalySeverity === "HIGH" || item.derived.anomalySeverity === "CRITICAL") ?? top;
  return [
    {
      id: "priority-top",
      type: "PRIORITY",
      title: `${top.name} ranks first for assessment`,
      severity: top.model.heatExposureCategory,
      evidence: top.evidence,
      explanation: "Heat exposure, persistence, anomaly, neighborhood intensity, and population context jointly contribute to this current analytical priority.",
      source: "KAIRO Priority Engine · Demo analysis",
    },
    {
      id: "anomaly-top",
      type: "HEAT ANOMALY",
      title: `${anomaly.name} departs from its local baseline`,
      severity: anomaly.derived.anomalySeverity,
      evidence: [
        `Current ${anomaly.observed.temperatureC.toFixed(1)}°C`,
        `Expected ${anomaly.observed.baselineTemperatureC.toFixed(1)}°C`,
        `Deviation +${anomaly.derived.temporalDeviationC.toFixed(1)}°C`,
      ],
      explanation: "A robust median/MAD score flags an unusual local observation; it does not identify a cause.",
      source: "KAIRO robust anomaly detector · Demo time series",
    },
    {
      id: "correlation-top",
      type: "CORRELATION",
      title: `${strongestCorrelation.variable} has the strongest demo association`,
      severity: "MODERATE",
      evidence: [`Pearson r = ${(strongestCorrelation.pearson ?? 0).toFixed(2)}`, `N = ${hotspots.length}`],
      explanation: "The relationship is descriptive, not causal, and may reflect land use, time, weather, or morphology confounders.",
      source: "KAIRO correlation engine · Phoenix demo sample",
    },
  ];
}
