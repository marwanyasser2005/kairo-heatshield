"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn("z-50 rounded-md border border-white/10 bg-[#151a1d] px-2.5 py-1.5 text-xs font-medium text-zinc-100 shadow-xl shadow-black/35", className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
