import { NextResponse } from "next/server";
import { getActivityStatus } from "@/lib/fortyguard/status";
import { normalizeCompletedHeatmap } from "@/lib/fortyguard/heatmap";
import { FortyGuardError } from "@/lib/fortyguard/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await context.params;
  if (!/^[a-zA-Z0-9-]{1,200}$/.test(activityId)) return NextResponse.json({ error: "Invalid activity ID." }, { status: 400 });
  try {
    const activity = await getActivityStatus(activityId);
    const status = activity.status.toLowerCase();
    if (status === "completed" || status === "succeeded") {
      if (activity.result === undefined) throw new FortyGuardError("The activity completed without a result.", "NORMALIZATION", 502);
      const timestamp = new URL(request.url).searchParams.get("analysisTimestamp") ?? undefined;
      const safeTimestamp = timestamp && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) ? timestamp : undefined;
      return NextResponse.json(normalizeCompletedHeatmap(activityId, activity.result, safeTimestamp), { headers: { "Cache-Control": "no-store" } });
    }
    if (status === "failed" || status === "error") throw new FortyGuardError("The FortyGuard heatmap activity failed.", "UPSTREAM", 502);
    return NextResponse.json({ activityId, status: "Processing" }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const safe = error instanceof FortyGuardError ? error : new FortyGuardError("Unable to check the activity.", "UPSTREAM", 502);
    return NextResponse.json({ error: safe.message, code: safe.code, retryAfterSeconds: safe.retryAfterSeconds }, { status: safe.status });
  }
}
