import "server-only";
import { FortyGuardError } from "@/lib/fortyguard/types";

const DEFAULT_BASE_URL = "https://api.fortyguard.com";
const MAX_UPSTREAM_BYTES = 8 * 1024 * 1024;

function baseUrl() {
  return (process.env.FORTYGUARD_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function hasFortyGuardKey() {
  return Boolean(process.env.FORTYGUARD_API_KEY?.trim());
}

function mapError(status: number, retryAfter?: number) {
  if (status === 401) return new FortyGuardError("The FortyGuard API key is missing or invalid.", "AUTHENTICATION", 401);
  if (status === 403) return new FortyGuardError("This FortyGuard plan does not authorize the requested capability.", "PLAN_RESTRICTED", 403);
  if (status === 404) return new FortyGuardError("The FortyGuard activity was not found or is not yet visible.", "NOT_FOUND", 404);
  if (status === 429) return new FortyGuardError("FortyGuard rate limit reached. Wait before retrying.", "RATE_LIMITED", 429, retryAfter);
  if (status === 400 || status === 422) return new FortyGuardError("FortyGuard rejected the validated request.", "VALIDATION", status);
  return new FortyGuardError("FortyGuard could not complete the request.", "UPSTREAM", status || 502);
}

export async function fortyGuardFetch(path: string, init: RequestInit = {}, timeoutMs = 20_000) {
  const apiKey = process.env.FORTYGUARD_API_KEY?.trim();
  if (!apiKey) throw new FortyGuardError("FORTYGUARD_API_KEY is not configured on the server.", "CONFIGURATION", 503);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json", ...init.headers },
    });
    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > MAX_UPSTREAM_BYTES) throw new FortyGuardError("FortyGuard returned an unexpectedly large response.", "UPSTREAM", 502);
    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after") || "0") || undefined;
      throw mapError(response.status, retryAfter);
    }
    return response;
  } catch (error) {
    if (error instanceof FortyGuardError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new FortyGuardError("The FortyGuard request timed out.", "TIMEOUT", 504);
    throw new FortyGuardError("FortyGuard is currently unreachable.", "UPSTREAM", 502);
  } finally {
    clearTimeout(timeout);
  }
}
