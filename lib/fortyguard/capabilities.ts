import "server-only";
import { hasFortyGuardKey } from "@/lib/fortyguard/client";
import type { CapabilityReport } from "@/lib/fortyguard/types";

export function getFortyGuardCapabilities(): CapabilityReport {
  const configured = hasFortyGuardKey();
  return {
    configured,
    coverage: "United States only",
    source: "https://docs-api.fortyguard.com/docs/limitations",
    capabilities: [
      { id: "heatmap", name: "Heatmap generation", state: configured ? "available" : "unavailable", plan: "Basic + Premium", note: configured ? "Server key configured; availability is confirmed only after a successful request." : "Add FORTYGUARD_API_KEY to enable live requests." },
      { id: "status", name: "Activity status", state: configured ? "available" : "unavailable", plan: "Basic + Premium", note: "Used for bounded result polling." },
      { id: "environment", name: "Environmental parameters", state: configured ? "plan-restricted" : "unavailable", plan: "Basic + Premium", note: "Basic supports up to 3 parameters; Premium supports full access. KAIRO does not submit this endpoint in the judge flow." },
      { id: "satellite", name: "Satellite segmentation", state: "plan-restricted", plan: "Premium", note: "Verified Premium capability; not submitted by this build." },
      { id: "streetview", name: "Street-view segmentation", state: "plan-restricted", plan: "Premium", note: "Verified Premium capability; not submitted by this build." },
      { id: "heat-intelligence", name: "Heat Intelligence report", state: "plan-restricted", plan: "Premium", note: "Verified Premium capability; KAIRO's deterministic engine remains fully available." },
    ],
  };
}
