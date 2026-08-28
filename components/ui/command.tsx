"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Command = React.forwardRef<React.ElementRef<typeof CommandPrimitive>, React.ComponentPropsWithoutRef<typeof CommandPrimitive>>(({ className, ...props }, ref) => (
  <CommandPrimitive ref={ref} className={cn("flex h-full w-full flex-col overflow-hidden rounded-xl bg-[#101416] text-white", className)} {...props} />
));
Command.displayName = CommandPrimitive.displayName;

export function CommandInput(props: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>) {
  return <div className="flex items-center border-b border-white/[0.08] px-4"><Search className="mr-3 size-4 shrink-0 text-zinc-500" /><CommandPrimitive.Input className="h-14 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" {...props} /></div>;
}

export const CommandList = React.forwardRef<React.ElementRef<typeof CommandPrimitive.List>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>>(({ className, ...props }, ref) => <CommandPrimitive.List ref={ref} className={cn("max-h-[360px] overflow-y-auto overflow-x-hidden p-2", className)} {...props} />);
CommandList.displayName = CommandPrimitive.List.displayName;

export const CommandEmpty = (props: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>) => <CommandPrimitive.Empty className="py-10 text-center text-sm text-zinc-500" {...props} />;
export const CommandGroup = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Group>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>>(({ className, ...props }, ref) => <CommandPrimitive.Group ref={ref} className={cn("overflow-hidden p-1 text-zinc-100 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[.16em] [&_[cmdk-group-heading]]:text-zinc-600", className)} {...props} />);
CommandGroup.displayName = CommandPrimitive.Group.displayName;

export const CommandItem = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Item>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>(({ className, ...props }, ref) => <CommandPrimitive.Item ref={ref} className={cn("relative flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-lg px-3 text-sm text-zinc-400 outline-none transition-colors data-[disabled=true]:pointer-events-none data-[selected=true]:bg-cyan-300/[0.08] data-[selected=true]:text-cyan-100 data-[disabled=true]:opacity-40", className)} {...props} />);
CommandItem.displayName = CommandPrimitive.Item.displayName;

export function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-[10px] uppercase tracking-[.12em] text-zinc-600", className)} {...props} />;
}
