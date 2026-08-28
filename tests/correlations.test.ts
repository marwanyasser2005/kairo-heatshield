import { describe, expect, it } from "vitest";
import { describeCorrelation, pearsonCorrelation, rank, spearmanCorrelation } from "@/lib/intelligence/correlations";

describe("correlation calculations", () => {
  it("calculates perfect positive and negative Pearson association", () => {
    expect(pearsonCorrelation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(pearsonCorrelation([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
  });

  it("uses average ranks for ties in Spearman", () => {
    expect(rank([10, 10, 20])).toEqual([1.5, 1.5, 3]);
    expect(spearmanCorrelation([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1);
  });

  it("withholds interpretation below minimum N", () => {
    const result = describeCorrelation("Canopy", [1, 2, 3], [3, 2, 1]);
    expect(result.strength).toBe("Insufficient");
    expect(result.pearson).toBeNull();
  });
});
