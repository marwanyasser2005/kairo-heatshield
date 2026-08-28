export function minMaxNormalize(values: number[]) {
  if (values.length === 0) return [];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) return values.map(() => 0.5);
  return values.map((value) => (value - minimum) / (maximum - minimum));
}

export function winsorize(values: number[], lower = 0.05, upper = 0.95) {
  const sorted = [...values].sort((a, b) => a - b);
  const low = sorted[Math.floor((sorted.length - 1) * lower)];
  const high = sorted[Math.ceil((sorted.length - 1) * upper)];
  return values.map((value) => Math.max(low, Math.min(high, value)));
}
