import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-ui="card"
      className={cn(
        "panel-shine min-w-0 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4 xl:px-6",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-4 xl:px-6 xl:py-5", className)}
      {...props}
    />
  );
}
