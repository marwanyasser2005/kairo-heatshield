import type { CorrelationResult } from "@/types";

function validateSamples(x: number[], y: number[]) {
  if (x.length !== y.length) throw new Error("Correlation samples must have the same length.");
  if (x.length < 2) return false;
  return true;
}

export function pearsonCorrelation(x: number[], y: number[]) {
  if (!validateSamples(x, y)) return null;
  const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
  const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
  let numerator = 0;
  let sumX = 0;
  let sumY = 0;
  for (let index = 0; index < x.length; index += 1) {
    const dx = x[index] - meanX;
    const dy = y[index] - meanY;
    numerator += dx * dy;
    sumX += dx ** 2;
    sumY += dy ** 2;
  }
  const denominator = Math.sqrt(sumX * sumY);
  return denominator === 0 ? null : numerator / denominator;
}

export function rank(values: number[]) {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);
  let cursor = 0;
  while (cursor < sorted.length) {
    let end = cursor;
    while (end + 1 < sorted.length && sorted[end + 1].value === sorted[cursor].value) end += 1;
    const averageRank = (cursor + end + 2) / 2;
    for (let index = cursor; index <= end; index += 1) ranks[sorted[index].index] = averageRank;
    cursor = end + 1;
  }
  return ranks;
}

export function spearmanCorrelation(x: number[], y: number[]) {
  if (!validateSamples(x, y)) return null;
  return pearsonCorrelation(rank(x), rank(y));
}

export function describeCorrelation(variable: string, temperatures: number[], values: number[]): CorrelationResult {
  const minimumSample = 8;
  if (temperatures.length < minimumSample) {
    return {
      variable,
      pearson: null,
      spearman: null,
      sampleSize: temperatures.length,
      direction: "None",
      strength: "Insufficient",
      caveat: `At least ${minimumSample} matched zones are required.`,
    };
  }
  const pearson = pearsonCorrelation(temperatures, values);
  const spearman = spearmanCorrelation(temperatures, values);
  const coefficient = pearson ?? 0;
  const absolute = Math.abs(coefficient);
  const strength = absolute >= 0.8 ? "Very strong" : absolute >= 0.6 ? "Strong" : absolute >= 0.4 ? "Moderate" : absolute >= 0.2 ? "Weak" : "Very weak";
  return {
    variable,
    pearson,
    spearman,
    sampleSize: temperatures.length,
    direction: coefficient > 0.05 ? "Positive" : coefficient < -0.05 ? "Negative" : "None",
    strength,
    caveat: "Association only. Season, time of day, humidity, elevation, land use, weather, and urban morphology may confound this result.",
  };
}
