import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type IconTileTone = "cyan" | "orange" | "lime" | "neutral";
type IconTileSize = "sm" | "md" | "lg";

const toneClasses: Record<IconTileTone, string> = {
  cyan: "border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200",
  orange: "border-orange-300/15 bg-orange-300/[0.07] text-orange-200",
  lime: "border-lime-300/15 bg-lime-300/[0.07] text-lime-200",
  neutral: "border-white/[0.08] bg-white/[0.04] text-zinc-300",
};

const sizeClasses: Record<IconTileSize, string> = {
  sm: "size-8 rounded-lg [&_svg]:size-4",
  md: "size-9 rounded-lg [&_svg]:size-4",
  lg: "size-10 rounded-xl [&_svg]:size-5",
};

export function IconTile({
  tone = "cyan",
  size = "md",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: IconTileTone; size?: IconTileSize }) {
  return (
    <span
      data-ui="icon-tile"
      className={cn(
        "grid shrink-0 place-items-center border shadow-[inset_0_1px_0_rgba(255,255,255,.025)] [&_svg]:shrink-0",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
