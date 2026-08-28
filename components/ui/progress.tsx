import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return <div className={cn("h-1.5 overflow-hidden rounded-full bg-white/[0.07]", className)}><div className="h-full rounded-full bg-cyan-300 transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
