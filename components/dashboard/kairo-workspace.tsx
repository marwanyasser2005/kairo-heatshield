"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, Bot, Building2, CheckCircle2, ChevronRight, CircleDot, Crosshair, Database, FileDown, FlaskConical, Flame, Info, Layers3, Leaf, Lightbulb, LoaderCircle, Radio, RotateCcw, Route, ScanLine, ShieldCheck, Sliders, Sparkles, ThermometerSun, TreePalm, TrendingUp, Users, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import type { CapabilityReport, NormalizedLiveHeatmap } from "@/lib/fortyguard/types";
import type { CityId } from "@/lib/demo/data";
import { CITIES } from "@/lib/demo/data";
import type { DashboardData, HeatZoneCollection, ScenarioResult, ScenarioStep, ScenarioType, Severity } from "@/types";
import { analystQuestions, answerAnalyst } from "@/lib/agent/planner";
import { HEAT_EXPOSURE_DISCLAIMER } from "@/lib/intelligence/risk";
import { SCENARIO_CONFIG, SCENARIO_DISCLAIMER, simulateScenario } from "@/lib/intelligence/scenarios";
import { findRoute } from "@/lib/intelligence/routing";
import { TemporalTrend, CorrelationExplorer, CorrelationTable, UrbanContextChart } from "@/components/charts/intelligence-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Progress } from "@/components/ui/progress";
import { cn, formatNumber } from "@/lib/utils";

import HeatMap from "@/components/maps/heat-map";

export type WorkspaceView = "dashboard" | "map" | "hotspots" | "routes" | "environment" | "correlations" | "insights" | "scenarios" | "actions" | "analyst";

const viewMeta: Record<WorkspaceView, { eyebrow: string; title: string; description: string }> = {
  dashboard: { eyebrow: "See → Explain → Prioritize → Act", title: "Phoenix at a glance", description: "Where heat is building, which zones stand out, and what makes them worth a closer look." },
  map: { eyebrow: "Explore the city", title: "Phoenix heat field", description: "Move block by block between temperature, canopy, hotspots, and the evidence attached to each zone." },
  hotspots: { eyebrow: "What rises to the top", title: "Hotspot ranking", description: "Temperature matters, but it is not the whole story. Persistence, local deviation, surrounding intensity, and exposure shape the order." },
  routes: { eyebrow: "Track 01 · Cool route planner", title: "Cool route planner", description: "Compare the shortest pedestrian path with the lowest-exposure alternative. A screening aid for movement—not a navigation or safety directive." },
  environment: { eyebrow: "Look beyond temperature", title: "The city around the heat", description: "Compare built form, hard surfaces, Phoenix canopy, humidity, and population context around the leading zones." },
  correlations: { eyebrow: "Track 07 · Analysis & correlation", title: "What moves with heat?", description: "Inspect Pearson and Spearman results, sample size, and the caveats that keep association from becoming a causal claim." },
  insights: { eyebrow: "Read the finding, then the proof", title: "What the evidence suggests", description: "Each finding keeps its supporting values, plain-language interpretation, source, and limits close by." },
  scenarios: { eyebrow: "Track 01 · Digital twin simulation", title: "Cooling scenario lab", description: "Test what a canopy, cool-roof, shade, or surface-albedo package could mean for one zone. A screening estimate with uncertainty—not a forecast or a construction spec." },
  actions: { eyebrow: "From ranking to fieldwork", title: "What to investigate next", description: "Three assessment paths for the highest-priority zones. They guide the next question; they do not promise an outcome." },
  analyst: { eyebrow: "Track 06 · Agentic AI", title: "Interrogate the evidence", description: "A bounded agent routes questions to local analytical tools—without inventing numbers or depending on an LLM." },
};

function severityTone(severity: Severity) {
  return severity.toLowerCase() as "low" | "moderate" | "high" | "critical";
}

const metricDefinitions = [
  { key: "averageExposure", label: "Heat exposure", suffix: "/100", icon: Flame },
  { key: "hotspotCount", label: "Hotspots", suffix: " zones", icon: Crosshair },
  { key: "anomalyCount", label: "Anomalies", suffix: " high", icon: Activity },
  { key: "priorityZoneCount", label: "Priority zones", suffix: " active", icon: Route },
  { key: "peakTemperatureC", label: "Peak temperature", suffix: "°C", icon: ThermometerSun },
] as const;

const VERIFIED_PHOENIX_ACTIVITY = "2f195ef9-91dc-401b-bd80-3e8d9133351f";
const VERIFIED_PHOENIX_TIMESTAMP = "2025-07-15T16:00:00-07:00";

function DataControl({ capabilities, onLiveComplete, cityId, activeLabel }: { capabilities: CapabilityReport; onLiveComplete: (result: NormalizedLiveHeatmap) => void; cityId: CityId; activeLabel: DashboardData["label"] | NormalizedLiveHeatmap["label"] }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "queued" | "processing" | "failed">("idle");
  const [error, setError] = useState("");
  const [activityId, setActivityId] = useState("");
  const city = CITIES[cityId];
  const openVerifiedActivity = async () => {
    setError("");
    setActivityId(VERIFIED_PHOENIX_ACTIVITY);
    setStatus("processing");
    try {
      const response = await fetch(`/api/fortyguard/status/${VERIFIED_PHOENIX_ACTIVITY}?analysisTimestamp=${encodeURIComponent(VERIFIED_PHOENIX_TIMESTAMP)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || result.mode !== "live") throw new Error(result.error || "The verified Phoenix activity is not currently available.");
      onLiveComplete(result as NormalizedLiveHeatmap);
      setStatus("idle");
      setOpen(false);
    } catch (caught) {
      setStatus("failed");
      setError(caught instanceof Error ? caught.message : "Unable to open the verified activity.");
    }
  };
  const runLive = async () => {
    setError("");
    setActivityId("");
    if (!capabilities.configured) {
      setStatus("failed");
      setError("FORTYGUARD_API_KEY is not configured on the server. The Phoenix Scenario remains active.");
      return;
    }
    setStatus("queued");
    try {
      const submissionResponse = await fetch("/api/fortyguard/heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          polygon_aoi: { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[-112.092, 33.442], [-112.052, 33.442], [-112.052, 33.47], [-112.092, 33.47], [-112.092, 33.442]]] } }] },
          date_time: { start_date: "2025-07-15", start_time: "16:00", filter_type: 1 },
          granularity: 100,
          analytic_type: "tcm",
        }),
      });
      const submission = await submissionResponse.json();
      if (!submissionResponse.ok || typeof submission.activityId !== "string") throw new Error(submission.error || "FortyGuard did not accept the live request.");
      setActivityId(submission.activityId);
      setStatus("processing");

      const delays = [0, 1500, 2500, 4000, 6000, 8000, 10000, 12000];
      for (let attempt = 0; attempt < delays.length; attempt += 1) {
        if (delays[attempt] > 0) await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
        const timestampQuery = typeof submission.analysisTimestamp === "string" ? `?analysisTimestamp=${encodeURIComponent(submission.analysisTimestamp)}` : "";
        const statusResponse = await fetch(`/api/fortyguard/status/${encodeURIComponent(submission.activityId)}${timestampQuery}`, { cache: "no-store" });
        const result = await statusResponse.json();
        if (statusResponse.status === 202 || (statusResponse.status === 404 && attempt < 2)) continue;
        if (!statusResponse.ok) throw new Error(result.error || "FortyGuard activity failed.");
        if (result.mode === "live") {
          onLiveComplete(result as NormalizedLiveHeatmap);
          setStatus("idle");
          setOpen(false);
          return;
        }
      }
      throw new Error("The activity is still processing after KAIRO's bounded polling window. Try again shortly; no demo data was substituted.");
    } catch (caught) {
      setStatus("failed");
      setError(caught instanceof Error ? caught.message : "Live request failed.");
    }
  };
  return (
    <div id="live-mode" className="w-full max-w-[460px]">
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] sm:p-2">
        <div className="hidden min-w-0 flex-1 px-2 text-right sm:block">
          <p className="truncate text-xs font-bold text-zinc-200">{city.name}, {city.state}</p>
          <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[.14em] text-zinc-600">{city.sampleDate} · {city.sampleTime} {city.timezone}</p>
        </div>
        <Button variant="secondary" size="sm" className="w-full justify-between sm:w-auto sm:min-w-36" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="data-source-panel">
          <Database className="size-3.5 shrink-0" />
          <span>Data source</span>
          <ChevronRight className={cn("size-3.5 shrink-0 transition-transform duration-200", open && "rotate-90")} />
        </Button>
      </div>
      {open && <div id="data-source-panel" className="page-enter mt-2 w-full rounded-xl border border-white/12 bg-[#101416] p-4 shadow-[0_18px_60px_rgba(0,0,0,.28)]">
        <div className="flex min-w-0 items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-bold">FortyGuard connection</p><p className="mt-1 text-xs leading-5 text-zinc-500">Verified server adapter · United States coverage only</p></div><Button variant="ghost" size="icon" className="size-9 min-h-9 shrink-0" onClick={() => setOpen(false)} aria-label="Close data source panel"><X className="size-4" /></Button></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="min-w-0 rounded-lg border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-500">Current evidence</p><Badge className="mt-2 max-w-full truncate" tone={activeLabel === "LIVE FORTYGUARD DATA" ? "live" : "demo"}>{activeLabel}</Badge></div><div className="min-w-0 rounded-lg border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-500">API key</p><p className={cn("mt-2 truncate text-xs font-bold", capabilities.configured ? "text-cyan-200" : "text-zinc-400")}>{capabilities.configured ? "Configured" : "Not configured"}</p></div></div>
        <div className="mt-3 space-y-2">{capabilities.capabilities.slice(0, 4).map((capability) => <div key={capability.id} className="flex min-w-0 items-center gap-2 text-xs"><span className={cn("size-1.5 shrink-0 rounded-full", capability.state === "available" ? "bg-cyan-300" : capability.state === "plan-restricted" ? "bg-amber-300" : "bg-zinc-600")} /><span className="min-w-0 flex-1 truncate text-zinc-300">{capability.name}</span><span className="shrink-0 text-zinc-600">{capability.plan}</span></div>)}</div>
        {status !== "idle" && <div className="mt-4 min-w-0 rounded-lg border border-white/[0.08] bg-black/20 p-3" aria-live="polite"><div className="flex items-center gap-2 text-xs font-semibold"><LoaderCircle className={cn("size-3.5 shrink-0", status !== "failed" && "animate-spin text-cyan-300 motion-reduce:animate-none")} /><span>{status === "queued" ? "Queued · submitting activity" : status === "processing" ? "Processing · bounded client polling" : "Failed"}</span></div>{activityId && <p className="mt-2 truncate font-mono text-[10px] text-zinc-600">Activity · {activityId}</p>}{error && <p className="mt-2 break-words text-xs leading-5 text-red-200" role="alert">{error}</p>}</div>}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" className="w-full" onClick={openVerifiedActivity} disabled={status === "queued" || status === "processing"}><CheckCircle2 className="size-4 shrink-0" /><span className="truncate">Open verified result</span></Button>
          <Button className="w-full" onClick={runLive} disabled={status === "queued" || status === "processing"}><Radio className="size-4 shrink-0" /><span className="truncate">Run new TCM</span></Button>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-zinc-400">LIVE appears only after a completed, normalized FortyGuard response. The Phoenix Scenario is never substituted silently.</p>
      </div>}
    </div>
  );
}

function PageHeader({ view, capabilities, onLiveComplete, cityId, activeLabel }: { view: WorkspaceView; capabilities: CapabilityReport; onLiveComplete: (result: NormalizedLiveHeatmap) => void; cityId: CityId; activeLabel: DashboardData["label"] | NormalizedLiveHeatmap["label"] }) {
  const meta = viewMeta[view];
  return (
    <header data-testid="page-header" className="relative isolate border-b border-white/[0.07] px-4 py-6 sm:px-6 xl:px-8">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,.055),transparent_62%)]" />
      <div className="relative grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={activeLabel === "LIVE FORTYGUARD DATA" ? "live" : "demo"}>{activeLabel}</Badge>
            <span className="h-px w-7 bg-cyan-300/50" />
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-600">{meta.eyebrow}</p>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-[-.05em] sm:text-3xl lg:text-[2.5rem]">{meta.title}</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-500">{meta.description}</p>
        </div>
        <div className="w-full min-w-0 xl:justify-self-end"><DataControl capabilities={capabilities} onLiveComplete={onLiveComplete} cityId={cityId} activeLabel={activeLabel} /></div>
      </div>
    </header>
  );
}

function MetricGrid({ data }: { data: DashboardData }) {
  const [exposure, ...rest] = metricDefinitions;
  const exposureValue = Math.round(data.metrics.averageExposure);
  return (
    <div data-testid="metric-grid" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      <Card data-metric-card className="bento-card border-orange-300/[0.13] sm:col-span-2 xl:col-span-4 2xl:col-span-2">
        <CardContent className="flex h-full min-h-[120px] items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <IconTile data-icon-tile tone="orange" size="sm"><Flame /></IconTile>
              <p className="min-w-0 truncate text-[10px] font-black uppercase tracking-[.18em] text-zinc-500">{exposure.label}</p>
            </div>
            <p className="metric-number mt-3 flex items-baseline gap-1 whitespace-nowrap text-4xl font-black text-white sm:text-5xl"><span>{exposureValue}</span><span className="text-sm tracking-normal text-zinc-600">/100</span></p>
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-orange-300"><TrendingUp className="size-3 shrink-0" /><span className="truncate">Elevated city exposure</span></p>
          </div>
          <div className="relative grid size-20 shrink-0 place-items-center rounded-full sm:size-24 2xl:size-28" style={{ background: `conic-gradient(#fb923c ${exposureValue * 3.6}deg, rgba(255,255,255,.06) 0)` }}>
            <div className="grid size-[60px] place-items-center rounded-full border border-white/[0.07] bg-[#0c1113] sm:size-[72px] 2xl:size-[86px]">
              <div className="text-center">
                <ScanLine className="mx-auto size-4 text-cyan-200 sm:size-5" />
                <p className="mt-0.5 font-mono text-[8px] text-zinc-600 sm:text-[9px]">INDEX</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {rest.map(({ key, label, suffix, icon: Icon }) => (
        <Card data-metric-card key={key} className="bento-card relative overflow-hidden">
          <div className={cn("absolute inset-x-0 top-0 h-px", key === "peakTemperatureC" ? "bg-orange-400/60" : "bg-cyan-300/35")} />
          <CardContent className="relative flex h-full min-h-[120px] flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-[9px] font-black uppercase tracking-[.17em] text-zinc-600">{label}</p>
              <IconTile data-icon-tile tone={key === "peakTemperatureC" ? "orange" : "cyan"} size="sm"><Icon /></IconTile>
            </div>
            <div className="min-w-0">
              <p className="metric-number flex items-baseline gap-1 whitespace-nowrap text-3xl font-black text-white"><span>{formatNumber(data.metrics[key], key === "peakTemperatureC" ? 1 : 0)}</span><span className="text-sm font-normal tracking-normal text-zinc-600">{suffix}</span></p>
              <p className="mt-1 truncate text-[10px] text-zinc-600">Across 30 modeled zones</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SelectedZonePanel({ zone, rank }: { zone: HeatZoneCollection["features"][number]; rank?: number }) {
  const { properties } = zone;
  return <Card className="h-full"><CardHeader><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge tone={severityTone(properties.model.heatExposureCategory)}>{properties.model.heatExposureCategory}</Badge>{rank && <Badge tone="neutral">Priority {rank}</Badge>}</div><h2 className="mt-3 truncate text-xl font-black">{properties.name}</h2><p className="mt-1 truncate text-xs text-zinc-500">{properties.id} · {properties.district}</p></div><IconTile><Crosshair /></IconTile></CardHeader><CardContent className="space-y-5"><div className="grid grid-cols-2 gap-3">{[{ label: "Temperature", value: `${properties.observed.temperatureC.toFixed(1)}°C` }, { label: "Exposure", value: `${properties.model.heatExposureScore}/100` }, { label: "Persistence", value: `${properties.observed.persistenceHours}h` }, { label: "Anomaly", value: `+${properties.derived.temporalDeviationC.toFixed(1)}°C` }].map((item) => <div key={item.label} className="min-w-0 rounded-lg border border-white/[0.07] bg-black/20 p-3"><p className="truncate text-[10px] uppercase tracking-[.14em] text-zinc-600">{item.label}</p><p className="metric-number mt-2 truncate text-lg font-bold">{item.value}</p></div>)}</div><div><div className="flex items-center justify-between text-xs"><span className="text-zinc-500">Built density</span><span>{properties.urban.builtDensityPct.toFixed(0)}%</span></div><Progress value={properties.urban.builtDensityPct} className="mt-2" /></div><div><div className="flex items-center justify-between text-xs"><span className="text-zinc-500">Tree canopy · City of Phoenix</span><span>{properties.urban.vegetationPct.toFixed(1)}%</span></div><Progress value={properties.urban.vegetationPct * 3} className="mt-2 [&>div]:bg-lime-400" /></div><div className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.035] p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-200">Why this matters</p><p className="mt-2 text-xs leading-5 text-zinc-400">Observed heat, persistence, local deviation, built context, canopy, and population exposure jointly contribute to the zone&apos;s current analytical priority.</p></div><p className="text-[10px] leading-4 text-zinc-600">Source: {properties.source}</p></CardContent></Card>;
}

function DashboardView({ data, selectedId, setSelectedId }: { data: DashboardData; selectedId: string; setSelectedId: (id: string) => void }) {
  const selected = data.zones.features.find((zone) => zone.properties.id === selectedId) ?? data.zones.features[0];
  return <div className="space-y-4"><MetricGrid data={data} /><div className="grid gap-4 2xl:grid-cols-[1.55fr_.45fr]"><Card className="border-beam overflow-hidden"><CardHeader><div className="flex min-w-0 items-center gap-3"><IconTile><Crosshair /></IconTile><div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-[.2em] text-zinc-600">Phoenix operating picture</p><h2 className="mt-1 truncate text-lg font-bold">Heat exposure field</h2></div></div><div className="flex shrink-0 items-center gap-2"><span className="signal-pulse size-2 rounded-full bg-emerald-400" /><Badge tone="demo">30 zones · 3 hotspots</Badge></div></CardHeader><CardContent className="p-2 xl:p-2"><HeatMap zones={data.zones} hotspots={data.hotspots} selectedId={selectedId} onSelect={setSelectedId} className="min-h-[560px]" /></CardContent></Card><SelectedZonePanel zone={selected} rank={data.hotspots.find((item) => item.id === selected.properties.id)?.rank} /></div><div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]"><Card className="bento-card"><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Temporal analysis</p><h2 className="mt-2 text-lg font-bold">Observed vs local baseline</h2></div><div className="flex gap-3 text-[10px] uppercase tracking-[.14em]"><span className="text-orange-300">— Observed</span><span className="text-cyan-200">-- Baseline</span></div></CardHeader><CardContent><TemporalTrend data={data.temporalSeries} /></CardContent></Card><Card className="bento-card"><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Priority queue</p><h2 className="mt-2 text-lg font-bold">Top 3 hotspots</h2></div></CardHeader><CardContent className="space-y-2">{data.hotspots.slice(0, 3).map((hotspot) => <button key={hotspot.id} onClick={() => setSelectedId(hotspot.id)} className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-3 text-left transition-all hover:border-orange-300/15 hover:bg-orange-300/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-300/10 text-sm font-black text-orange-200">{hotspot.rank}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{hotspot.name}</span><span className="mt-1 block truncate text-xs text-zinc-600">{hotspot.observed.temperatureC.toFixed(1)}°C · {hotspot.observed.persistenceHours}h persistence</span></span><span className="metric-number shrink-0 text-sm font-bold text-cyan-200">{hotspot.model.priorityScore}</span></button>)}</CardContent></Card></div><div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.03] px-4 py-3 text-xs leading-5 text-amber-100/70"><Info className="mr-2 inline size-3.5" />{HEAT_EXPOSURE_DISCLAIMER}</div></div>;
}

function MapView({ data, selectedId, setSelectedId }: { data: DashboardData; selectedId: string; setSelectedId: (id: string) => void }) {
  const selected = data.zones.features.find((zone) => zone.properties.id === selectedId) ?? data.zones.features[0];
  return <div className="grid gap-4 2xl:grid-cols-[1fr_360px]"><HeatMap zones={data.zones} hotspots={data.hotspots} selectedId={selectedId} onSelect={setSelectedId} className="min-h-[max(430px,calc(100dvh-250px))]" /><SelectedZonePanel zone={selected} rank={data.hotspots.find((item) => item.id === selectedId)?.rank} /></div>;
}

function HotspotsView({ data, setSelectedId }: { data: DashboardData; setSelectedId: (id: string) => void }) {
  return <div className="space-y-4"><div className="grid gap-4 lg:grid-cols-3">{data.hotspots.slice(0, 3).map((hotspot) => <Card key={hotspot.id} className={cn("overflow-hidden", hotspot.rank === 1 && "border-orange-300/20")}><div className="h-1 bg-gradient-to-r from-orange-400 to-red-500" /><CardContent><div className="flex items-center justify-between"><span className="metric-number text-4xl font-black text-zinc-700">0{hotspot.rank}</span><Badge tone={severityTone(hotspot.model.heatExposureCategory)}>{hotspot.model.heatExposureCategory}</Badge></div><h2 className="mt-5 text-xl font-black">{hotspot.name}</h2><p className="mt-1 text-xs text-zinc-600">{hotspot.id} · {hotspot.district}</p><div className="mt-6 grid grid-cols-3 gap-2">{[{ label: "Temp", value: `${hotspot.observed.temperatureC.toFixed(1)}°` }, { label: "Persist", value: `${hotspot.observed.persistenceHours}h` }, { label: "Priority", value: hotspot.model.priorityScore }].map((item) => <div key={item.label}><p className="metric-number text-lg font-bold">{item.value}</p><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-zinc-600">{item.label}</p></div>)}</div><Button variant="secondary" className="mt-6 w-full" onClick={() => setSelectedId(hotspot.id)}>Inspect evidence <ArrowUpRight className="size-4" /></Button></CardContent></Card>)}</div><Card><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Full ranking</p><h2 className="mt-2 text-lg font-bold">Spatial hotspot evidence</h2></div></CardHeader><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-[.14em] text-zinc-600">{["Rank", "Zone", "Temperature", "Persistence", "Heat index", "Anomaly", "Exposure", "Priority"].map((item) => <th key={item} className="px-5 py-3">{item}</th>)}</tr></thead><tbody>{data.hotspots.slice(0, 10).map((hotspot) => <tr key={hotspot.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]"><td className="metric-number px-5 py-4 font-black text-zinc-500">#{hotspot.rank}</td><td className="px-5 py-4"><button className="cursor-pointer text-left font-semibold hover:text-cyan-200" onClick={() => setSelectedId(hotspot.id)}>{hotspot.name}</button><p className="mt-1 text-xs text-zinc-600">{hotspot.id}</p></td><td className="metric-number px-5 py-4">{hotspot.observed.temperatureC.toFixed(1)}°C</td><td className="metric-number px-5 py-4">{hotspot.observed.persistenceHours}h</td><td className="metric-number px-5 py-4">{hotspot.observed.heatIndexC.toFixed(1)}°C</td><td className="px-5 py-4"><Badge tone={severityTone(hotspot.derived.anomalySeverity)}>+{hotspot.derived.temporalDeviationC.toFixed(1)}°</Badge></td><td className="metric-number px-5 py-4 text-cyan-200">{hotspot.model.heatExposureScore}</td><td className="metric-number px-5 py-4 font-bold text-orange-200">{hotspot.model.priorityScore}</td></tr>)}</tbody></table></div></Card></div>;
}

function EnvironmentView({ data }: { data: DashboardData }) {
  const top = data.hotspots[0];
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ icon: Building2, label: "Built-up density", value: `${top.urban.builtDensityPct.toFixed(0)}%`, note: "Demo context" }, { icon: Leaf, label: "Tree canopy", value: `${top.urban.vegetationPct.toFixed(1)}%`, note: "City of Phoenix 2022 sample" }, { icon: Layers3, label: "Impervious", value: `${top.urban.imperviousPct.toFixed(0)}%`, note: "Demo context" }, { icon: Users, label: "Population density", value: top.urban.populationDensityKmSq.toLocaleString("en-US"), note: "Demo exposure context / km²" }].map(({ icon: Icon, label, value, note }) => <Card key={label}><CardContent><div className="flex min-w-0 items-center gap-3"><IconTile size="lg"><Icon /></IconTile><div className="min-w-0"><p className="truncate text-xs text-zinc-500">{label}</p><p className="metric-number mt-1 truncate text-2xl font-black">{value}</p></div></div><p className="mt-5 truncate border-t border-white/[0.06] pt-3 text-[10px] uppercase tracking-[.14em] text-zinc-600">{note}</p></CardContent></Card>)}</div><div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]"><Card><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Urban variables</p><h2 className="mt-2 text-lg font-bold">Priority-zone context</h2></div><Badge tone="demo">Mixed source classes</Badge></CardHeader><CardContent><UrbanContextChart zones={data.zones} /></CardContent></Card><Card><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Provenance</p><h2 className="mt-2 text-lg font-bold">What is real here?</h2></div><IconTile><ShieldCheck /></IconTile></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-zinc-400"><p><strong className="text-white">Tree canopy:</strong> 30 real `TREE_PCT_N` values with tract-center geometry from the City of Phoenix Office of Heat Response shade-study service.</p><p><strong className="text-white">Heat:</strong> deterministic demo scenario, not a FortyGuard response.</p><p><strong className="text-white">Other urban fields:</strong> plausible, deterministic demo context. They are not claimed as downloaded Census or USGS observations.</p><div className="rounded-lg border border-amber-300/10 bg-amber-300/[0.035] p-3 text-xs text-amber-100/70">2022 canopy and 2025 demo heat are not temporally aligned. Production analysis should use full tract intersections and matched dates.</div></CardContent></Card></div></div>;
}

function CorrelationsView({ data }: { data: DashboardData }) {
  return <div className="space-y-4"><CorrelationExplorer zones={data.zones} initial={data.correlations} /><Card><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Accessible data table</p><h2 className="mt-2 text-lg font-bold">All matched variables</h2></div><Badge tone="neutral">Scenario associations</Badge></CardHeader><CorrelationTable data={data.correlations} /></Card><div className="rounded-xl border border-amber-300/12 bg-amber-300/[0.035] p-4 text-sm leading-6 text-amber-100/70"><AlertTriangle className="mr-2 inline size-4" /><strong>Correlation does not imply causation.</strong> Season, time of day, humidity, elevation, land use, weather, and urban morphology are plausible confounders. Demo temperature was generated from urban variables; the coefficients demonstrate pipeline behavior, not an empirical Phoenix discovery.</div></div>;
}

function InsightsView({ data }: { data: DashboardData }) {
  const extra = data.hotspots.slice(1, 4).map((hotspot, index) => ({ id: `extra-${index}`, type: index === 0 ? "PERSISTENCE" : index === 1 ? "URBAN CONTEXT" : "HOTSPOT", title: `${hotspot.name}: multi-signal watch`, severity: hotspot.model.heatExposureCategory, evidence: hotspot.evidence, explanation: "This screening insight combines observed heat with derived and contextual evidence. It does not identify a causal driver.", source: hotspot.source }));
  return <div className="grid gap-4 xl:grid-cols-2">{[...data.insights, ...extra].map((insight) => <Card key={insight.id}><CardHeader><div><div className="flex flex-wrap gap-2"><Badge tone={severityTone(insight.severity)}>{insight.severity}</Badge><Badge tone="neutral">{insight.type}</Badge></div><h2 className="mt-4 text-xl font-black">{insight.title}</h2></div><Lightbulb className="size-5 text-cyan-300" /></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2">{insight.evidence.map((evidence) => <div key={evidence} className="rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2 text-xs text-zinc-300"><CircleDot className="mr-2 inline size-3 text-cyan-300" />{evidence}</div>)}</div><p className="mt-5 text-sm leading-6 text-zinc-400">{insight.explanation}</p><p className="mt-5 border-t border-white/[0.06] pt-3 text-[10px] uppercase tracking-[.13em] text-zinc-600">Source · {insight.source}</p></CardContent></Card>)}</div>;
}

function ActionsView({ data }: { data: DashboardData }) {
  const exportBrief = () => {
    const top = data.hotspots[0];
    const lines = [
      "KAIRO HEATSHIELD — FIELD ASSESSMENT BRIEF",
      "Phoenix, Arizona · Demo analysis · 15 Jul 2025 16:00 MST",
      "",
      `Priority 1: ${top.name} (${top.id})`,
      `Exposure score: ${top.model.heatExposureScore}/100 · ${top.model.heatExposureCategory}`,
      `Temperature: ${top.observed.temperatureC.toFixed(1)}°C · Persistence: ${top.observed.persistenceHours}h`,
      `Anomaly: ${top.derived.anomalyScore} (${top.derived.anomalySeverity})`,
      `Canopy: ${top.urban.vegetationPct.toFixed(1)}% (City of Phoenix 2022 sample)`,
      "",
      "Evidence:",
      ...top.evidence.map((e) => `  - ${e}`),
      "",
      "Recommended next assessment:",
      `  ${data.actions[0].intervention}`,
      "",
      "Limitations: Screening analytical index, not a certified safety index. Demo heat values are deterministic scenario data. Canopy is a 2022 snapshot temporally mismatched with the demo heat scenario. Correlation does not imply causation.",
      "",
      "Generated by KAIRO HeatShield · FortyGuard provides the temperature intelligence.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kairo-brief-${top.id.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return <div className="space-y-4"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Field assessment</p><p className="mt-1 text-sm text-zinc-500">Export a one-page brief for the priority zone.</p></div><Button variant="secondary" onClick={exportBrief}><FileDown className="size-4" />Export field brief</Button></div><div className="grid gap-4 xl:grid-cols-3">{data.actions.map((action) => <Card key={action.zoneId} className={cn(action.priority === 1 && "border-orange-300/20")}><CardHeader><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-orange-200">Priority {action.priority}</p><h2 className="mt-3 text-xl font-black">{action.zone}</h2></div><span className="metric-number text-4xl font-black text-zinc-800">0{action.priority}</span></CardHeader><CardContent><Badge tone={severityTone(action.risk)}>{action.risk} analytical risk</Badge><div className="mt-6 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-200">Potential intervention</p><p className="mt-2 font-semibold">{action.intervention}</p></div><ul className="mt-5 space-y-3">{action.evidence.slice(0, 3).map((item) => <li key={item} className="flex gap-3 text-xs leading-5 text-zinc-400"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-cyan-300" />{item}</li>)}</ul><p className="mt-5 text-xs leading-5 text-zinc-500">{action.reason}</p></CardContent></Card>)}</div><Card><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Decision guardrails</p><h2 className="mt-2 text-lg font-bold">What this plan does—and does not—say</h2></div><ShieldCheck className="size-5 text-cyan-300" /></CardHeader><CardContent className="grid gap-4 text-sm leading-6 text-zinc-400 md:grid-cols-3"><p><strong className="block text-white">Assessment first</strong>Recommendations direct further design and monitoring work; they are not construction instructions.</p><p><strong className="block text-white">No guaranteed cooling</strong>KAIRO does not estimate a promised temperature reduction from any intervention.</p><p><strong className="block text-white">No health-impact claim</strong>Population is exposure context only; no illness, mortality, or safety outcome is inferred.</p></CardContent></Card></div>;
}

function AnalystView() {
  const [question, setQuestion] = useState<string>(analystQuestions[0]);
  const result = useMemo(() => answerAnalyst(question), [question]);
  return <div className="grid gap-4 xl:grid-cols-[.68fr_1.32fr]"><Card><CardHeader><div><Badge tone="live">Bounded agent · no LLM</Badge><h2 className="mt-4 text-lg font-bold">Suggested questions</h2></div><Bot className="size-5 text-cyan-300" /></CardHeader><CardContent className="space-y-2">{analystQuestions.map((item) => <button key={item} onClick={() => setQuestion(item)} className={cn("flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg border px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300", question === item ? "border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-100" : "border-white/[0.06] bg-black/10 text-zinc-400 hover:bg-white/[0.03]")}><Sparkles className="size-3.5 shrink-0" />{item}</button>)}</CardContent></Card><Card className="min-h-[560px]"><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">KAIRO Analyst · Track 06</p><h2 className="mt-2 text-xl font-black">{result.title}</h2></div><Badge tone="neutral">Tool-routing agent</Badge></CardHeader><CardContent><div className="rounded-xl border border-white/[0.07] bg-black/20 p-5"><p className="text-xs font-semibold text-zinc-500">Question</p><p className="mt-2 text-sm text-zinc-200">{question}</p></div><div className="mt-4 rounded-xl border border-cyan-300/12 bg-cyan-300/[0.035] p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-200">Agent reasoning</p><p className="mt-2 text-xs leading-5 text-zinc-400">Intent: <span className="font-mono text-cyan-200">{result.trace.intent}</span></p><p className="mt-1 text-xs leading-5 text-zinc-400">{result.trace.reasoning}</p></div><div className="mt-4 rounded-xl border border-cyan-300/12 bg-cyan-300/[0.035] p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-200">Evidence-backed answer</p><p className="mt-3 text-base leading-7 text-zinc-200">{result.answer}</p></div><div className="mt-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-600">Evidence used</p><div className="mt-3 grid gap-2">{result.evidence.map((item) => <div key={item} className="flex gap-3 rounded-lg border border-white/[0.06] px-3 py-3 text-sm text-zinc-400"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-300" />{item}</div>)}</div></div><div className="mt-6 flex flex-wrap items-center gap-2"><span className="text-xs text-zinc-600">Routed tools:</span>{result.tools.map((tool) => <code key={tool} className="rounded bg-white/[0.05] px-2 py-1 text-[11px] text-cyan-200">{tool}</code>)}</div><div className="mt-4 rounded-lg border border-amber-300/12 bg-amber-300/[0.035] p-3 text-[11px] leading-5 text-amber-100/70"><ShieldCheck className="mr-1.5 inline size-3.5" />{result.boundedAuthority}</div></CardContent></Card></div>;
}

function RoutesView({ data }: { data: DashboardData }) {
  const [startId, setStartId] = useState(data.zones.features[0].properties.id);
  const [endId, setEndId] = useState(data.hotspots[0].id);
  const result = useMemo(() => findRoute(data.zones.features, startId, endId), [data.zones.features, startId, endId]);
  const tooltipStyle = { background: "#111619", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#fff", fontSize: 12 };
  const chartData = result ? [{ name: "Shortest", exposure: result.shortest.totalExposure, distance: result.shortest.totalDistanceKm }, { name: "Coolest", exposure: result.coolest.totalExposure, distance: result.coolest.totalDistanceKm }] : [];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Route planning</p><h2 className="mt-2 text-lg font-bold">Choose start and end zones</h2></div><IconTile><TreePalm /></IconTile></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-zinc-400">Start zone<select value={startId} onChange={(event) => setStartId(event.target.value)} className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-[#0a0d0f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300">{data.zones.features.map((zone) => <option key={zone.properties.id} value={zone.properties.id}>{zone.properties.name}</option>)}</select></label>
          <label className="block text-xs font-semibold text-zinc-400">End zone<select value={endId} onChange={(event) => setEndId(event.target.value)} className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-[#0a0d0f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300">{data.zones.features.map((zone) => <option key={zone.properties.id} value={zone.properties.id}>{zone.properties.name}</option>)}</select></label>
        </CardContent>
      </Card>
      {result ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="border-beam"><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Exposure comparison</p><h2 className="mt-2 text-lg font-bold">Shortest vs coolest</h2></div><IconTile><TrendingUp /></IconTile></CardHeader><CardContent>
              <div className="h-[300px]" role="img" aria-label="Cumulative heat exposure for shortest and coolest routes"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 16, right: 10, left: -10, bottom: 0 }}><CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" /><XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} /><RTooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,.04)" }} /><Bar dataKey="exposure" name="Cumulative exposure" radius={[6, 6, 0, 0]} maxBarSize={120}><Cell fill="#fb923c" /><Cell fill="#67e8f9" /></Bar></BarChart></ResponsiveContainer></div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>div:last-child]:col-span-2 sm:[&>div:last-child]:col-span-1"><div className="min-w-0 rounded-lg border border-white/[0.07] bg-black/20 p-3"><p className="truncate text-[10px] uppercase tracking-[.14em] text-zinc-600">Exposure saved</p><p className="metric-number mt-2 truncate text-xl font-bold text-cyan-200">{result.exposureReduction}</p></div><div className="min-w-0 rounded-lg border border-white/[0.07] bg-black/20 p-3"><p className="truncate text-[10px] uppercase tracking-[.14em] text-zinc-600">Peak Δ</p><p className="metric-number mt-2 truncate text-xl font-bold text-white">{(result.shortest.peakTemperatureC - result.coolest.peakTemperatureC).toFixed(1)}°C</p></div><div className="min-w-0 rounded-lg border border-white/[0.07] bg-black/20 p-3"><p className="truncate text-[10px] uppercase tracking-[.14em] text-zinc-600">Added distance</p><p className="metric-number mt-2 truncate text-xl font-bold text-zinc-300">{result.distanceAddedKm} km</p></div></div>
            </CardContent></Card>
            <Card><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Coolest path</p><h2 className="mt-2 text-lg font-bold">Stops along the way</h2></div><Badge tone="live">{result.coolest.stops.length} stops</Badge></CardHeader><CardContent className="space-y-2">{result.coolest.stops.map((stop, index) => <div key={stop.id} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/15 px-3 py-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-cyan-300/10 font-mono text-[10px] text-cyan-200">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-200">{stop.name}</p><p className="text-[10px] text-zinc-600">{stop.id}</p></div><div className="ml-auto text-right"><p className="metric-number text-sm font-bold text-orange-300">{stop.temperatureC.toFixed(1)}°C</p><p className="text-[10px] text-zinc-600">{stop.exposure}/100</p></div></div>)}</CardContent></Card>
          </div>
          <div className="rounded-xl border border-amber-300/12 bg-amber-300/[0.035] p-4 text-sm leading-6 text-amber-100/70"><Info className="mr-2 inline size-4" />{result.recommendation}</div>
        </>
      ) : <Card><CardContent className="grid place-items-center py-16 text-sm text-zinc-500"><Info className="size-6 text-zinc-600" />Select two different zones to plan a route.</CardContent></Card>}
    </div>
  );
}

function ScenariosView({ data, selectedId, setSelectedId }: { data: DashboardData; selectedId: string; setSelectedId: (id: string) => void }) {
  const [levels, setLevels] = useState<Record<ScenarioType, number>>({ canopy: 20, coolRoof: 0, shade: 0, surfaceAlbedo: 0 });
  const zone = data.zones.features.find((item) => item.properties.id === selectedId) ?? data.zones.features[0];
  const steps: ScenarioStep[] = (Object.entries(levels) as [ScenarioType, number][])
    .filter(([, level]) => level > 0)
    .map(([type, level]) => ({ type, level }));
  const result: ScenarioResult = simulateScenario(zone, steps);
  const chartData = [
    { name: "Baseline", temp: Number(result.baseline.temperatureC.toFixed(1)) },
    { name: "Projected", temp: Number(result.projected.temperatureC.toFixed(1)) },
  ];
  const tooltipStyle = { background: "#111619", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#fff", fontSize: 12 };
  const setLevel = (type: ScenarioType, value: number) => setLevels((prev) => ({ ...prev, [type]: value }));
  const reset = () => setLevels({ canopy: 0, coolRoof: 0, shade: 0, surfaceAlbedo: 0 });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 2xl:grid-cols-[1fr_380px]">
        <Card className="border-beam overflow-hidden">
          <CardHeader>
            <div className="flex min-w-0 items-center gap-3">
              <IconTile><FlaskConical /></IconTile>
              <div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-[.2em] text-zinc-600">Counterfactual simulation</p><h2 className="mt-1 truncate text-lg font-bold">Scenario comparison</h2></div>
            </div>
            <Badge tone="demo">Screening · not a forecast</Badge>
          </CardHeader>
          <CardContent className="p-2 xl:p-4">
            <div className="h-[360px]" role="img" aria-label={`Baseline ${result.baseline.temperatureC.toFixed(1)} degrees versus projected ${result.projected.temperatureC.toFixed(1)} degrees`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
                  <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[24, "dataMax + 2"]} unit="°" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={result.uncertainty.highC} stroke="rgba(103,232,249,.4)" strokeDasharray="4 4" label={{ value: "uncertainty", fill: "#71717a", fontSize: 9, position: "right" }} />
                  <RTooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,.04)" }} />
                  <Bar dataKey="temp" radius={[6, 6, 0, 0]} maxBarSize={120}>
                    {chartData.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? "#fb923c" : "#67e8f9"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 [&>div:last-child]:col-span-2 sm:[&>div:last-child]:col-span-1">
              <div className="rounded-lg border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-600">Baseline</p><p className="metric-number mt-2 text-xl font-bold text-orange-300">{result.baseline.temperatureC.toFixed(1)}°C</p></div>
              <div className="rounded-lg border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-600">Projected</p><p className="metric-number mt-2 text-xl font-bold text-cyan-200">{result.projected.temperatureC.toFixed(1)}°C</p></div>
              <div className="rounded-lg border border-cyan-300/12 bg-cyan-300/[0.04] p-3"><p className="text-[10px] uppercase tracking-[.14em] text-cyan-200">Estimated reduction</p><p className="metric-number mt-2 text-xl font-bold text-white">{Math.abs(result.deltaC).toFixed(1)}°C</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Treatment package</p><h2 className="mt-2 text-lg font-bold">What-if controls</h2></div>
              <Button variant="ghost" size="icon" className="size-9 min-h-9" onClick={reset} aria-label="Reset scenario"><RotateCcw className="size-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="block text-xs font-semibold text-zinc-400">Assessment zone
              <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-[#0a0d0f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300">
                {data.hotspots.map((hotspot) => <option key={hotspot.id} value={hotspot.id}>#{hotspot.rank} {hotspot.name}</option>)}
              </select>
            </label>
            <p className="text-[10px] text-zinc-600">{zone.properties.name} · {zone.properties.observed.temperatureC.toFixed(1)}°C · canopy {zone.properties.urban.vegetationPct.toFixed(1)}%</p>
            {(Object.entries(SCENARIO_CONFIG) as [ScenarioType, typeof SCENARIO_CONFIG[ScenarioType]][]).map(([type, config]) => (
              <div key={type}>
                <div className="flex items-center justify-between text-xs"><span className="font-semibold text-zinc-300">{config.label}</span><span className="font-mono text-cyan-200">{levels[type]}{config.unit.replace("%", "")}</span></div>
                <input type="range" min={0} max={100} step={5} value={levels[type]} onChange={(event) => setLevel(type, Number(event.target.value))} className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-cyan-300" aria-label={`${config.label} level`} />
                <p className="mt-1 text-[10px] text-zinc-600">{config.unit} · cap {config.maxContributionC}°C</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Contribution breakdown</p><h2 className="mt-2 text-lg font-bold">Where the reduction comes from</h2></div><IconTile><Sliders /></IconTile></CardHeader>
          <CardContent className="space-y-2">
            {result.contributions.length === 0 && <p className="text-sm text-zinc-500">No treatments selected. Adjust a slider to simulate a cooling package.</p>}
            {result.contributions.map((contribution) => (
              <div key={contribution.type} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/15 px-3 py-3">
                <CircleDot className="size-3 text-cyan-300" />
                <span className="text-sm text-zinc-300">{SCENARIO_CONFIG[contribution.type].label}</span>
                <span className="ml-auto font-mono text-sm text-cyan-200">−{contribution.contributionC.toFixed(2)}°C</span>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-cyan-300/12 bg-cyan-300/[0.04] px-3 py-3"><span className="text-sm font-bold text-white">Estimated reduction</span><span className="metric-number font-mono text-lg font-bold text-white">{Math.abs(result.deltaC).toFixed(1)}°C</span></div>
            <p className="mt-2 text-[11px] leading-5 text-zinc-600">Uncertainty band: <span className="text-zinc-400">{result.uncertainty.lowC.toFixed(1)}°C to {result.uncertainty.highC.toFixed(1)}°C</span> · confidence: {result.confidence}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-600">Assumptions & limits</p><h2 className="mt-2 text-lg font-bold">What this simulation is—and is not</h2></div><IconTile><ShieldCheck /></IconTile></CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">{result.assumptions.map((assumption) => <li key={assumption} className="flex gap-3 text-xs leading-5 text-zinc-400"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-cyan-300" />{assumption}</li>)}</ul>
            <div className="rounded-lg border border-amber-300/12 bg-amber-300/[0.035] p-3 text-xs leading-5 text-amber-100/70"><AlertTriangle className="mr-1.5 inline size-3.5" />{SCENARIO_DISCLAIMER}</div>
            <div className="grid grid-cols-2 gap-2 pt-2"><div className="rounded-lg border border-white/[0.06] bg-black/15 p-3"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-600">Exposure reduction</p><p className="metric-number mt-1 text-lg font-bold text-white">{Math.abs(result.deltaExposure)} pts</p></div><div className="rounded-lg border border-white/[0.06] bg-black/15 p-3"><p className="text-[10px] uppercase tracking-[.14em] text-zinc-600">Category shift</p><p className="mt-1 text-sm font-bold text-zinc-200">{result.baseline.category} → {result.projected.category}</p></div></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LiveResultView({ result, onDemo }: { result: NormalizedLiveHeatmap; onDemo: () => void }) {
  const temperatures = result.zones.features.map((zone) => zone.properties.observed.temperatureC);
  const metrics = [
    { label: "Normalized tiles", value: result.zones.features.length.toLocaleString("en-US") },
    { label: "Maximum TCM", value: `${Math.max(...temperatures).toFixed(2)}°C` },
    { label: "Mean TCM", value: `${result.temperatureRangeC.mean.toFixed(2)}°C` },
    { label: "Minimum TCM", value: `${Math.min(...temperatures).toFixed(2)}°C` },
  ];
  const observedAt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Phoenix" }).format(new Date(result.analysisTimestamp));
  return <div className="page-enter space-y-4"><div className="flex flex-col gap-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between"><div><Badge tone="live">LIVE FORTYGUARD DATA</Badge><h2 className="mt-3 text-xl font-black">Verified Phoenix TCM activity</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-zinc-400">Phoenix AOI · {observedAt} MST · 100 m requested granularity</p></div><Button variant="secondary" onClick={onDemo}>Open Phoenix Scenario</Button></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Card key={metric.label}><CardContent><p className="text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">{metric.label}</p><p className="metric-number mt-4 text-3xl font-black">{metric.value}</p></CardContent></Card>)}</div><HeatMap zones={result.zones} hotspots={[]} onSelect={() => undefined} className="min-h-[620px]" /><div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.03] p-4 text-sm leading-6 text-amber-100/75"><Info className="mr-2 inline size-4" />This activity returned only verified 2 m air-temperature TCM. The map uses a clearly labeled relative scale because the observed range is only {(result.temperatureRangeC.maximum - result.temperatureRangeC.minimum).toFixed(3)}°C. Canopy, anomaly, urban context, correlations, and actions are intentionally withheld in Live Mode.</div></div>;
}

export function KairoWorkspace({ view, data, capabilities, cityId = "phoenix" }: { view: WorkspaceView; data: DashboardData; capabilities: CapabilityReport; cityId?: CityId }) {
  const [selectedId, setSelectedId] = useState(data.hotspots[0].id);
  const [liveResult, setLiveResult] = useState<NormalizedLiveHeatmap | null>(null);
  let content: React.ReactNode;
  if (liveResult) content = <LiveResultView result={liveResult} onDemo={() => setLiveResult(null)} />;
  else if (view === "dashboard") content = <DashboardView data={data} selectedId={selectedId} setSelectedId={setSelectedId} />;
  else if (view === "map") content = <MapView data={data} selectedId={selectedId} setSelectedId={setSelectedId} />;
  else if (view === "hotspots") content = <HotspotsView data={data} setSelectedId={setSelectedId} />;
  else if (view === "routes") content = <RoutesView data={data} />;
  else if (view === "environment") content = <EnvironmentView data={data} />;
  else if (view === "correlations") content = <CorrelationsView data={data} />;
  else if (view === "insights") content = <InsightsView data={data} />;
  else if (view === "scenarios") content = <ScenariosView data={data} selectedId={selectedId} setSelectedId={setSelectedId} />;
  else if (view === "actions") content = <ActionsView data={data} />;
  else content = <AnalystView />;
  const activeLabel = liveResult?.label ?? data.label;
  return <main className="min-h-dvh min-w-0"><PageHeader view={view} capabilities={capabilities} onLiveComplete={setLiveResult} cityId={cityId} activeLabel={activeLabel} /><div className="page-enter min-w-0 p-4 sm:p-6 xl:p-8">{content}</div></main>;
}
