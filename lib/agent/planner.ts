import { getDemoDashboardData } from "@/lib/datasets/loader";

export const analystTools = [
  { name: "getHeatmap", purpose: "Return the normalized zone heat field", bounded: "read-only" },
  { name: "getHotspots", purpose: "Return the multi-evidence hotspot ranking", bounded: "read-only" },
  { name: "getEnvironment", purpose: "Return urban context for a zone", bounded: "read-only" },
  { name: "getCorrelations", purpose: "Return Pearson/Spearman results", bounded: "read-only" },
  { name: "compareZones", purpose: "Compare selected zones side by side", bounded: "read-only" },
  { name: "generateActionPlan", purpose: "Return assessment-first priorities", bounded: "recommendation only" },
  { name: "simulateScenario", purpose: "Run a screening what-if cooling simulation", bounded: "screening estimate" },
] as const;

export const analystQuestions = [
  "Which zone should we prioritize?",
  "Why is the top zone high risk?",
  "What are the main heat drivers?",
  "Which variables correlate with temperature?",
  "Compare the top three hotspots.",
  "What should we assess first?",
  "What if we add 20% canopy to the top zone?",
] as const;

export const BOUNDED_AUTHORITY =
  "The KAIRO Analyst routes questions to local deterministic tools and may recommend attention or assessment. It must not issue public-safety alerts, approve construction, or fabricate values. No tool writes to any system.";

export interface AnalystTrace {
  intent: string;
  selectedTools: string[];
  reasoning: string;
}

export interface AnalystAnswer {
  title: string;
  answer: string;
  evidence: string[];
  tools: string[];
  trace: AnalystTrace;
  boundedAuthority: string;
}

function route(question: string): AnalystTrace {
  const normalized = question.toLowerCase();
  if (normalized.includes("correlat") || normalized.includes("driver")) {
    return { intent: "association", selectedTools: ["getCorrelations()"], reasoning: "Question asks about temperature drivers or correlation; routed to the correlation engine." };
  }
  if (normalized.includes("compare") || normalized.includes("three")) {
    return { intent: "comparison", selectedTools: ["getHotspots()", "compareZones()"], reasoning: "Question asks to compare top zones; routed to hotspot ranking and zone comparison tools." };
  }
  if (normalized.includes("assess") || normalized.includes("action") || normalized.includes("first")) {
    return { intent: "action", selectedTools: ["generateActionPlan()"], reasoning: "Question asks for next assessment; routed to the action-plan tool (recommendation only)." };
  }
  if (normalized.includes("what if") || normalized.includes("canopy") || normalized.includes("cool")) {
    return { intent: "simulation", selectedTools: ["simulateScenario()"], reasoning: "Question asks for a what-if cooling outcome; routed to the screening scenario simulator." };
  }
  return { intent: "priority", selectedTools: ["getHotspots()", "getEnvironment()"], reasoning: "Default priority intent; routed to hotspot ranking and environment context." };
}

export function answerAnalyst(question: string): AnalystAnswer {
  const data = getDemoDashboardData();
  const trace = route(question);
  const top = data.hotspots[0];
  if (trace.intent === "association") {
    const correlations = [...data.correlations].sort((a, b) => Math.abs(b.pearson ?? 0) - Math.abs(a.pearson ?? 0));
    return {
      title: "Temperature associations",
      answer: `${correlations[0].variable} is the strongest linear association in this 30-zone demo sample (r = ${(correlations[0].pearson ?? 0).toFixed(2)}, N = ${correlations[0].sampleSize}). This is association, not causation.`,
      evidence: correlations.slice(0, 3).map((item) => `${item.variable}: r ${(item.pearson ?? 0).toFixed(2)}, ρ ${(item.spearman ?? 0).toFixed(2)}`),
      tools: trace.selectedTools,
      trace,
      boundedAuthority: BOUNDED_AUTHORITY,
    };
  }
  if (trace.intent === "comparison") {
    return {
      title: "Top three hotspot comparison",
      answer: `${data.hotspots.slice(0, 3).map((item) => item.name).join(", ")} lead the multi-evidence ranking. The order considers exposure, persistence, anomaly, neighborhood intensity, and population context.`,
      evidence: data.hotspots.slice(0, 3).map((item) => `#${item.rank} ${item.name}: ${item.model.priorityScore}/100 priority, ${item.observed.temperatureC.toFixed(1)}°C`),
      tools: trace.selectedTools,
      trace,
      boundedAuthority: BOUNDED_AUTHORITY,
    };
  }
  if (trace.intent === "action") {
    const action = data.actions[0];
    return {
      title: "First assessment",
      answer: `Consider prioritizing ${action.zone} for ${action.intervention.toLowerCase()}. This is a screening recommendation, not a guaranteed cooling outcome.`,
      evidence: action.evidence,
      tools: trace.selectedTools,
      trace,
      boundedAuthority: BOUNDED_AUTHORITY,
    };
  }
  if (trace.intent === "simulation") {
    return {
      title: "Screening cooling simulation",
      answer: `A 20-point canopy increase on ${top.name} projects a screening reduction in the order of 1 to 2°C, scaled down where existing canopy is already high. This is a screening estimate with a wide uncertainty band, not a forecast. Open the Cooling Lab to adjust the full package.`,
      evidence: [`Baseline ${top.observed.temperatureC.toFixed(1)}°C`, `Current canopy ${top.urban.vegetationPct.toFixed(1)}%`, `Tool: simulateScenario() returns a screening range, never a guaranteed outcome`],
      tools: trace.selectedTools,
      trace,
      boundedAuthority: BOUNDED_AUTHORITY,
    };
  }
  return {
    title: "Priority zone",
    answer: `${top.name} is Priority 1 with a ${top.model.priorityScore}/100 multi-evidence priority score. ${top.derived.temporalDeviationC.toFixed(1)}°C of local deviation and ${top.observed.persistenceHours} hours of persistence are material contributors.`,
    evidence: top.evidence,
    tools: trace.selectedTools,
    trace,
    boundedAuthority: BOUNDED_AUTHORITY,
  };
}
