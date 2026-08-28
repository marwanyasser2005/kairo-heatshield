"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Crosshair, Database, Flame, FlaskConical, Route, ThermometerSun } from "lucide-react";
import type { DashboardData } from "@/types";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { simulateScenario } from "@/lib/intelligence/scenarios";
import { cn } from "@/lib/utils";

const HeatMap = dynamic(() => import("@/components/maps/heat-map"), {
  ssr: false,
  loading: () => <div className="min-h-[520px] rounded-xl border border-white/[0.08] bg-[#0b0f11]" />,
});

export function PresentationWorkspace({ data }: { data: DashboardData }) {
  const correlation = [...data.correlations].sort((a, b) => Math.abs(b.pearson ?? 0) - Math.abs(a.pearson ?? 0))[0];
  const priorityZone = data.zones.features.find((zone) => zone.properties.id === data.hotspots[0].id) ?? data.zones.features[0];
  const canopyScenario = simulateScenario(priorityZone, [{ type: "canopy", level: 20 }]);
  const proof = [
    { icon: Database, value: "1,055", label: "Verified live TCM tiles", note: "Completed FortyGuard activity", tone: "cyan" as const },
    { icon: Crosshair, value: data.metrics.hotspotCount, label: "Priority zones", note: "Phoenix scenario ranking", tone: "orange" as const },
    { icon: FlaskConical, value: `${Math.abs(canopyScenario.deltaC).toFixed(1)}°C`, label: "Screening estimate", note: "20% canopy scenario · not measured", tone: "cyan" as const },
    { icon: CheckCircle2, value: data.actions.length, label: "Assessment briefs", note: "Evidence kept with every action", tone: "cyan" as const },
  ];

  return (
    <main className="min-h-dvh bg-[#080a0c] text-white">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5 lg:px-8">
        <Brand />
        <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
          <Badge className="max-w-full" tone="demo"><span className="hidden sm:inline">3-minute judge mode · </span>Live proof + labeled scenario</Badge>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "hidden sm:inline-flex")}>
            <ArrowLeft className="size-4" />Exit presentation
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1800px] p-4 lg:p-6">
        <section aria-label="Hackathon evidence summary" className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {proof.map(({ icon: Icon, value, label, note, tone }) => (
            <Card key={label} className={cn(tone === "orange" ? "border-orange-300/15" : "border-cyan-300/12")}>
              <CardContent className="flex min-h-[108px] min-w-0 items-center gap-3 p-4">
                <IconTile size="sm" tone={tone}><Icon /></IconTile>
                <div className="min-w-0">
                  <p className="metric-number truncate text-2xl font-black text-white">{value}</p>
                  <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[.12em] text-zinc-300">{label}</p>
                  <p className="mt-1 truncate text-[10px] text-zinc-600">{note}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_.55fr]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300">KAIRO HeatShield · Phoenix, Arizona</p>
                <h1 className="mt-2 text-3xl font-black tracking-[-.045em] lg:text-5xl">From temperature to priority.</h1>
              </div>
              <p className="max-w-md text-sm leading-6 text-zinc-500">Detect → Analyze → Explain → Prioritize → Act</p>
            </div>
            <HeatMap zones={data.zones} hotspots={data.hotspots} selectedId={data.hotspots[0].id} onSelect={() => undefined} className="min-h-[520px] xl:min-h-[670px]" presentation />
          </div>

          <div className="grid min-w-0 content-start gap-3">
            <div className="grid gap-2 min-[480px]:grid-cols-3">
              {[
                { icon: Flame, label: "Exposure", value: data.metrics.averageExposure },
                { icon: Crosshair, label: "Hotspots", value: data.metrics.hotspotCount },
                { icon: ThermometerSun, label: "Peak", value: `${data.metrics.peakTemperatureC.toFixed(1)}°` },
              ].map(({ icon: Icon, label, value }) => (
                <Card key={label}>
                  <CardContent className="flex min-h-[104px] min-w-0 items-center gap-3 p-4 min-[480px]:block">
                    <IconTile size="sm" tone={label === "Peak" ? "orange" : "cyan"}><Icon /></IconTile>
                    <div className="min-w-0 min-[480px]:mt-4">
                      <p className="metric-number truncate text-2xl font-black">{value}</p>
                      <p className="mt-1 truncate text-[9px] uppercase tracking-[.14em] text-zinc-600">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-zinc-600">Top 3 hotspots</p>
                <div className="mt-4 space-y-3">
                  {data.hotspots.slice(0, 3).map((hotspot) => (
                    <div key={hotspot.id} className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-300/10 text-sm font-black text-orange-200">{hotspot.rank}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{hotspot.name}</p>
                        <p className="mt-1 truncate text-xs text-zinc-600">{hotspot.observed.temperatureC.toFixed(1)}°C · +{hotspot.derived.temporalDeviationC.toFixed(1)}° anomaly</p>
                      </div>
                      <span className="metric-number shrink-0 font-bold text-cyan-200">{hotspot.model.priorityScore}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-zinc-600">Main evidence</p>
                <h2 className="mt-3 text-lg font-black">{data.hotspots[0].name}</h2>
                <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                  {data.hotspots[0].evidence.map((item) => <div key={item} className="rounded-lg border border-white/[0.06] p-2.5 text-zinc-400">{item}</div>)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-zinc-600">Strongest scenario association</p>
                    <p className="mt-2 truncate font-bold">{correlation.variable}</p>
                  </div>
                  <p className="metric-number shrink-0 text-3xl font-black text-cyan-200">{correlation.pearson?.toFixed(2)}</p>
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-500">Pearson r · N {correlation.sampleSize} · association, not causation</p>
              </CardContent>
            </Card>

            <Card className="border-cyan-300/12 bg-cyan-300/[0.025]">
              <CardContent>
                <div className="flex gap-3">
                  <Route className="mt-0.5 size-5 shrink-0 text-cyan-300" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-cyan-200">Action plan · Priority 1</p>
                    <p className="mt-2 font-bold">{data.actions[0].intervention}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">Recommended for assessment; no guaranteed cooling outcome.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-5 flex flex-col items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#101416] p-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-lg font-semibold">FortyGuard provides the temperature intelligence. <span className="text-cyan-200">KAIRO turns it into decisions.</span></p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">Live provider data and modeled scenario context remain visibly separate throughout the experience.</p>
          </div>
          <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>Open verified live result <ArrowRight className="size-4" /></Link>
        </section>
      </div>
    </main>
  );
}
