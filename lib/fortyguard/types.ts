import type { HeatZoneCollection } from "@/types";

export type CapabilityState = "available" | "unavailable" | "plan-restricted" | "unsupported-location" | "api-unavailable";

export interface FortyGuardCapability {
  id: string;
  name: string;
  state: CapabilityState;
  plan: "Basic + Premium" | "Premium";
  note: string;
}

export interface CapabilityReport {
  configured: boolean;
  coverage: "United States only";
  source: string;
  capabilities: FortyGuardCapability[];
}

export interface NormalizedLiveHeatmap {
  mode: "live";
  label: "LIVE FORTYGUARD DATA";
  activityId: string;
  status: "Completed";
  zones: HeatZoneCollection;
  statistics: Record<string, unknown>;
  source: "FortyGuard Temperature API";
  analysisTimestamp: string;
  temperatureRangeC: { minimum: number; maximum: number; mean: number };
}

export type FortyGuardErrorCode =
  | "CONFIGURATION"
  | "VALIDATION"
  | "AUTHENTICATION"
  | "PLAN_RESTRICTED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM"
  | "TIMEOUT"
  | "NORMALIZATION";

export class FortyGuardError extends Error {
  constructor(
    message: string,
    public readonly code: FortyGuardErrorCode,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "FortyGuardError";
  }
}
