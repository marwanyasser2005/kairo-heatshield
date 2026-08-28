import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300", className)} aria-label="KAIRO HeatShield home">
      <Logo />
      {!compact && <span><span className="block text-[15px] font-black tracking-[0.24em] text-white">KAIRO</span><span className="mt-0.5 block text-[9px] font-bold tracking-[0.22em] text-zinc-500">URBAN HEATSHIELD</span></span>}
    </Link>
  );
}
