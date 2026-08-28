import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#07090a] px-5 text-zinc-100">
      <section className="panel-shine w-full max-w-xl rounded-2xl border border-white/[0.09] bg-[#101416] p-8 text-center shadow-2xl shadow-black/50">
        <MapPinned className="mx-auto size-8 text-cyan-300" />
        <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-cyan-200">404 · Outside the study area</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">This KAIRO view does not exist.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">Return to the heat intelligence workspace and continue from verified evidence.</p>
        <Link href="/dashboard" className={buttonVariants({ className: "mt-7" })}><ArrowLeft className="size-4" />Back to dashboard</Link>
      </section>
    </main>
  );
}
