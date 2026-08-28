import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/kairo-mark.webp";

export function Logo({ className, alt = "KAIRO HeatShield logo" }: { className?: string; alt?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={512}
      height={512}
      sizes="(max-width: 640px) 36px, 40px"
      priority
      className={cn("size-9 shrink-0 rounded-xl border border-white/[0.09] bg-black object-contain shadow-[0_0_24px_rgba(34,211,238,.08)] transition-[border-color,filter] duration-200 group-hover:border-cyan-300/25 group-hover:saturate-125 sm:size-10", className)}
    />
  );
}
