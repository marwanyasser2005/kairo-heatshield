import "server-only";
import { fortyGuardFetch } from "@/lib/fortyguard/client";
import { statusEnvelopeSchema } from "@/lib/fortyguard/schemas";
import { FortyGuardError } from "@/lib/fortyguard/types";

export async function getActivityStatus(activityId: string) {
  const response = await fortyGuardFetch(`/v1/status/${encodeURIComponent(activityId)}`, { method: "GET" });
  const parsed = statusEnvelopeSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.error) throw new FortyGuardError("FortyGuard returned an invalid activity envelope.", "NORMALIZATION", 502);
  return parsed.data.data;
}

const POLL_DELAYS_MS = [800, 1400, 2200, 3200, 5000, 7000] as const;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function pollActivity(activityId: string) {
  for (let attempt = 0; attempt <= POLL_DELAYS_MS.length; attempt += 1) {
    try {
      const activity = await getActivityStatus(activityId);
      const status = activity.status.toLowerCase();
      if (status === "completed" || status === "succeeded") {
        if (activity.result === undefined) throw new FortyGuardError("The activity completed without a result.", "NORMALIZATION", 502);
        return { status: "Completed" as const, result: activity.result };
      }
      if (status === "failed" || status === "error") throw new FortyGuardError(`FortyGuard activity ${activityId} failed.`, "UPSTREAM", 502);
    } catch (error) {
      const retryableNotFound = error instanceof FortyGuardError && error.code === "NOT_FOUND" && attempt < 2;
      if (!retryableNotFound) throw error;
    }
    if (attempt < POLL_DELAYS_MS.length) await wait(POLL_DELAYS_MS[attempt]);
  }
  throw new FortyGuardError("The FortyGuard activity did not complete within KAIRO's bounded polling window.", "TIMEOUT", 504);
}
