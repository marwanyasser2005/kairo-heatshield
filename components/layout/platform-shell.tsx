"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronRight, Flame, Menu, PanelTop, Radio, Sparkles } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { CommandMenu } from "@/components/layout/command-menu";
import { platformNavigation } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function Navigation({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return (["Observe", "Evidence", "Decide"] as const).map((group) => (
    <div key={group} className="mb-6 last:mb-0">
      <p className="mb-2.5 px-3 text-[9px] font-black uppercase tracking-[.24em] text-zinc-600">{group}</p>
      <div className="space-y-1">
        {platformNavigation.filter((item) => item.group === group).map(({ href, label, description, icon: Icon }) => {
          const active = pathname === href;
          const link = <Link key={href} href={href} className={cn("group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300", active ? "bg-[linear-gradient(90deg,rgba(103,232,249,.12),rgba(103,232,249,.035))] text-cyan-50 shadow-[inset_0_0_0_1px_rgba(103,232,249,.10),0_8px_30px_rgba(0,0,0,.16)]" : "text-zinc-500 hover:bg-white/[0.045] hover:text-zinc-100")}><span className={cn("absolute inset-y-2 left-0 w-0.5 rounded-full", active ? "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.65)]" : "bg-transparent")} /><Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-cyan-200" : "text-zinc-600 group-hover:text-zinc-300")} /><span className="min-w-0 flex-1"><span className="block">{label}</span>{mobile && <span className="mt-0.5 block truncate text-[10px] font-normal text-zinc-600">{description}</span>}</span>{active ? <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.7)]" /> : mobile ? <ChevronRight className="size-3.5 text-zinc-700" /> : null}</Link>;
          return mobile ? <SheetClose asChild key={href}>{link}</SheetClose> : link;
        })}
      </div>
    </div>
  ));
}

export function PlatformShell({ children, fortyGuardConfigured }: { children: React.ReactNode; fortyGuardConfigured: boolean }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-[#050708] text-white lg:grid lg:grid-cols-[280px_1fr]">
      <a href="#platform-content" className="fixed left-3 top-3 z-[60] -translate-y-20 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-zinc-950 transition-transform focus:translate-y-0">Skip to intelligence</a>
      <aside className="topo-grid hidden border-r border-white/[0.08] bg-[#090d0f] lg:fixed lg:inset-y-0 lg:flex lg:w-[280px] lg:flex-col">
        <div className="flex h-[80px] items-center border-b border-white/[0.08] bg-[#090d0f]/90 px-5"><Brand /></div>
        <div className="px-3 pt-4"><CommandMenu /></div>
        <nav className="kairo-scrollbar flex-1 overflow-y-auto px-3 py-5" aria-label="Main navigation"><Navigation pathname={pathname} /></nav>
        <div className="border-t border-white/[0.07] p-3">
          <Link href="/presentation" className={cn("flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors duration-200", pathname === "/presentation" ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white")}><PanelTop className="size-4 text-orange-300" />Presentation mode<span className="ml-auto rounded border border-white/10 px-1.5 py-1 font-mono text-[9px] text-zinc-600">3 MIN</span></Link>
          <div className="border-beam mt-3 rounded-2xl border border-white/[0.08] bg-[#0d1315]/95 p-3.5"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-zinc-500"><Activity className="size-3 text-cyan-300" />Intelligence grid</div><div className="mt-3 flex items-center gap-2"><span className={cn("signal-pulse size-2 rounded-full", fortyGuardConfigured ? "bg-emerald-400" : "bg-cyan-400")} /><p className="text-xs font-bold text-zinc-200">{fortyGuardConfigured ? "Live adapter ready" : "Demo engine active"}</p><span className="ml-auto font-mono text-[9px] text-zinc-600">99.9%</span></div><div className="mt-3 grid grid-cols-3 gap-1"><span className="h-1 rounded-full bg-cyan-300" /><span className="h-1 rounded-full bg-cyan-300/70" /><span className="h-1 rounded-full bg-orange-400/70" /></div></div>
        </div>
      </aside>
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-40 flex h-[64px] items-center gap-3 border-b border-white/[0.07] bg-[#080a0c]/92 px-3 backdrop-blur-md lg:hidden">
          <Sheet>
            <SheetTrigger asChild><button aria-label="Open navigation" className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><Menu className="size-4" /></button></SheetTrigger>
            <SheetContent>
              <div className="flex h-[72px] items-center border-b border-white/[0.07] px-5"><Brand /><SheetTitle className="sr-only">KAIRO navigation</SheetTitle><SheetDescription className="sr-only">Navigate environmental intelligence surfaces</SheetDescription></div>
              <nav className="kairo-scrollbar flex-1 overflow-y-auto px-3 py-5" aria-label="Mobile main navigation"><Navigation pathname={pathname} mobile /></nav>
              <div className="border-t border-white/[0.07] p-3"><SheetClose asChild><Link href="/presentation" className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-zinc-300 hover:bg-white/[0.05]"><Flame className="size-4 text-orange-300" />Presentation mode</Link></SheetClose></div>
            </SheetContent>
          </Sheet>
          <Brand compact />
          <div className="ml-auto flex items-center gap-2"><CommandMenu compact /><Badge tone={fortyGuardConfigured ? "live" : "demo"} className="hidden sm:inline-flex">{fortyGuardConfigured ? "API ready" : "Demo"}</Badge></div>
        </header>
        <header className="sticky top-0 z-30 hidden h-[72px] items-center justify-between border-b border-white/[0.07] bg-[#06090a]/92 px-6 backdrop-blur-xl lg:flex xl:px-8">
          <div className="flex min-w-0 items-center gap-4"><IconTile><Sparkles /></IconTile><div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-[.22em] text-zinc-600">KAIRO operations</p><div className="mt-1 flex min-w-0 items-center gap-3 text-xs font-semibold text-zinc-300"><span className="truncate">Phoenix intelligence grid</span><Separator orientation="vertical" className="h-3 shrink-0" /><span className="shrink-0 text-zinc-600">33.45°N / 112.07°W</span></div></div></div>
          <div className="hidden items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1.5 xl:flex">{["Detect", "Analyze", "Explain", "Prioritize", "Act"].map((step, index) => <span key={step} className={cn("rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[.12em]", index === 0 ? "bg-cyan-300/10 text-cyan-200" : "text-zinc-600")}>{step}</span>)}<Separator orientation="vertical" className="mx-1 h-4" /><span className="flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-[.14em] text-zinc-500"><Radio className={cn("size-3 shrink-0", fortyGuardConfigured ? "text-emerald-400" : "text-cyan-400")} />{fortyGuardConfigured ? "Live ready" : "Demo"}</span></div>
        </header>
        <div id="platform-content">{children}</div>
      </div>
    </div>
  );
}
