import * as React from "react";
import { cn } from "@/lib/utils";

const styles = {
  demo: "border-[rgba(251,146,60,0.2)] bg-[rgba(251,146,60,0.08)] text-[#fdba74]",
  live: "border-[rgba(34,211,238,0.2)] bg-[rgba(34,211,238,0.08)] text-[#67e8f9]",
  low: "border-[rgba(148,163,184,0.15)] bg-[rgba(148,163,184,0.06)] text-[#cbd5e1]",
  moderate: "border-[rgba(250,204,21,0.18)] bg-[rgba(250,204,21,0.08)] text-[#fde047]",
  high: "border-[rgba(251,146,60,0.18)] bg-[rgba(251,146,60,0.08)] text-[#fb923c]",
  critical: "border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.08)] text-[#f87171]",
  neutral: "border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] text-[var(--muted)]",
} as const;

export function Badge({ className, tone = "neutral", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof styles }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] leading-none",
        styles[tone],
        className
      )}
      {...props}
    />
  );
}
