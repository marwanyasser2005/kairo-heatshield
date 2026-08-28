"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

export function SheetContent({ className, children, side = "left", ...props }: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "left" | "right" }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
      <SheetPrimitive.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(88vw,320px)] flex-col border-white/10 bg-[#0b0e10] shadow-2xl shadow-black/60 outline-none transition-transform duration-200 ease-out",
          side === "left" ? "left-0 border-r data-[state=closed]:-translate-x-full" : "right-0 border-l data-[state=closed]:translate-x-full",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close aria-label="Close navigation" className="absolute right-3 top-3 grid size-11 cursor-pointer place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
          <X className="size-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export const SheetTitle = SheetPrimitive.Title;
export const SheetDescription = SheetPrimitive.Description;
