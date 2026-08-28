import { NextResponse } from "next/server";
import { heatmapRequestSchema, isApprovedPhoenixRequest, PHOENIX_ANALYSIS_TIMESTAMP } from "@/lib/fortyguard/schemas";
import { submitHeatmap } from "@/lib/fortyguard/heatmap";
import { FortyGuardError } from "@/lib/fortyguard/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const MAX_REQUEST_BYTES = 64 * 1024;
const RUN_COOLDOWN_MS = 45_000;
const recentRuns = new Map<string, number>();

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function clientKey(request: Request) {
  return (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local").slice(0, 80);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Live analysis must be started from the KAIRO workspace." }, { status: 403 });
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > MAX_REQUEST_BYTES) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const validated = heatmapRequestSchema.safeParse(json);
  if (!validated.success) return NextResponse.json({ error: "Invalid heatmap request.", issues: validated.error.issues }, { status: 422 });
  if (!isApprovedPhoenixRequest(validated.data)) return NextResponse.json({ error: "This public demo route is restricted to the reviewed Phoenix TCM activity." }, { status: 403 });
  const key = clientKey(request);
  const lastRun = recentRuns.get(key) ?? 0;
  const retryAfterSeconds = Math.ceil((RUN_COOLDOWN_MS - (Date.now() - lastRun)) / 1000);
  if (retryAfterSeconds > 0) return NextResponse.json({ error: "A live run was started recently. Please reuse its result or wait briefly.", code: "RATE_LIMITED", retryAfterSeconds }, { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } });
  recentRuns.set(key, Date.now());
  try {
    const activityId = await submitHeatmap(validated.data);
    return NextResponse.json({ activityId, status: "Queued", analysisTimestamp: PHOENIX_ANALYSIS_TIMESTAMP }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    recentRuns.delete(key);
    const safe = error instanceof FortyGuardError ? error : new FortyGuardError("Unable to create the live heatmap.", "UPSTREAM", 502);
    return NextResponse.json({ error: safe.message, code: safe.code, retryAfterSeconds: safe.retryAfterSeconds }, { status: safe.status });
  }
}
