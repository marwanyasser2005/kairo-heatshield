import { NextResponse } from "next/server";
import { getFortyGuardCapabilities } from "@/lib/fortyguard/capabilities";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getFortyGuardCapabilities(), { headers: { "Cache-Control": "no-store" } });
}
