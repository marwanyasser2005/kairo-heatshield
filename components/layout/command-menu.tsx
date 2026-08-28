"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowRight, Command as CommandIcon, PanelTop, Search } from "lucide-react";
import { platformNavigation } from "@/components/layout/navigation";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

export function CommandMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className={cn("flex min-h-11 cursor-pointer items-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-zinc-500 transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.05] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300", compact ? "size-11 justify-center" : "w-full gap-3 px-3 text-xs") } aria-label="Open command menu">
          <Search className="size-4" />
          {!compact && <><span>Search intelligence</span><kbd className="ml-auto flex items-center gap-1 rounded border border-white/10 bg-black/20 px-1.5 py-1 font-mono text-[9px] text-zinc-600"><CommandIcon className="size-2.5" />K</kbd></>}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined} className="fixed left-1/2 top-[18%] z-50 w-[min(92vw,640px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/12 bg-[#101416] shadow-2xl shadow-black/70 outline-none">
          <Dialog.Title className="sr-only">Navigate KAIRO HeatShield</Dialog.Title>
          <Command>
            <CommandInput autoFocus placeholder="Search pages, evidence, actions…" />
            <CommandList>
              <CommandEmpty>No matching intelligence surface.</CommandEmpty>
              {(["Observe", "Evidence", "Decide"] as const).map((group) => (
                <CommandGroup key={group} heading={group}>
                  {platformNavigation.filter((item) => item.group === group).map(({ href, label, description, icon: Icon }) => (
                    <CommandItem key={href} value={`${label} ${description}`} onSelect={() => navigate(href)}>
                      <IconTile><Icon /></IconTile>
                      <span><span className="block font-semibold text-zinc-200">{label}</span><span className="mt-0.5 block text-xs text-zinc-600">{description}</span></span>
                      <CommandShortcut><ArrowRight className="size-3.5" /></CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              <CommandGroup heading="Judge flow">
                <CommandItem onSelect={() => navigate("/presentation")}><IconTile tone="orange"><PanelTop /></IconTile><span className="min-w-0 truncate font-semibold text-zinc-200">Presentation mode</span><CommandShortcut>3 min</CommandShortcut></CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
