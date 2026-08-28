"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#07090a] px-5 text-zinc-100">
      <section className="panel-shine w-full max-w-xl rounded-2xl border border-red-300/15 bg-[#101416] p-8 text-center shadow-2xl shadow-black/50">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-red-300/10 text-red-200"><AlertTriangle className="size-5" /></span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-red-200">Workspace interrupted</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">KAIRO could not render this view.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">Retry the current operation. No live result is silently replaced with demo data.</p>
        <Button className="mt-7" onClick={reset}><RefreshCw className="size-4" />Try again</Button>
      </section>
    </main>
  );
}
