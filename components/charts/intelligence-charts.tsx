"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { Info, X } from "lucide-react";
import type { CorrelationResult, HeatZoneCollection } from "@/types";
import { describeCorrelation } from "@/lib/intelligence/correlations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

const tooltipStyle = { background: "#111619", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: "#fff", fontSize: 12 };

export function TemporalTrend({ data, compact = false }: { data: Array<{ time: string; temperature: number; baseline: number; heatIndex: number }>; compact?: boolean }) {
  return (
    <div className={compact ? "h-[220px]" : "h-[300px]"} role="img" aria-label="Temperature trend: observed temperature rises above baseline through the afternoon">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
          <defs><linearGradient id="temperatureArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb923c" stopOpacity={0.3} /><stop offset="100%" stopColor="#fb923c" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
          <XAxis dataKey="time" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[30, 50]} unit="°" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(255,255,255,.16)" }} />
          <Area type="monotone" dataKey="temperature" stroke="#fb923c" fill="url(#temperatureArea)" strokeWidth={2.5} name="Observed °C" />
          <Line type="monotone" dataKey="baseline" stroke="#67e8f9" strokeDasharray="5 5" dot={false} strokeWidth={1.5} name="Baseline °C" />
          <Line type="monotone" dataKey="heatIndex" stroke="#fca5a5" dot={false} strokeWidth={1.25} name="Heat index °C" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const variables = {
  "Built-up density": (zone: HeatZoneCollection["features"][number]) => zone.properties.urban.builtDensityPct,
  "Vegetation cover": (zone: HeatZoneCollection["features"][number]) => zone.properties.urban.vegetationPct,
  "Impervious surface": (zone: HeatZoneCollection["features"][number]) => zone.properties.urban.imperviousPct,
  "Road density": (zone: HeatZoneCollection["features"][number]) => zone.properties.urban.roadDensityKmSq,
  "Population density": (zone: HeatZoneCollection["features"][number]) => zone.properties.urban.populationDensityKmSq,
} as const;

export function CorrelationExplorer({ zones, initial }: { zones: HeatZoneCollection; initial: CorrelationResult[] }) {
  const [variable, setVariable] = useState<keyof typeof variables>("Built-up density");
  const [district, setDistrict] = useState("All Phoenix");
  const [timeFilter, setTimeFilter] = useState("Peak hour");
  const [methodOpen, setMethodOpen] = useState(false);
  const districts = ["All Phoenix", ...Array.from(new Set(zones.features.map((zone) => zone.properties.district)))];
  const filtered = district === "All Phoenix" ? zones.features : zones.features.filter((zone) => zone.properties.district === district);
  const chartData = filtered.map((zone) => ({
    zone: zone.properties.name,
    temperature: zone.properties.observed.temperatureC,
    value: variables[variable](zone),
  }));
  const current = describeCorrelation(variable, chartData.map((item) => item.temperature), chartData.map((item) => item.value));
  const matrix = initial.map((item) => ({ name: item.variable.replace(" density", ""), value: item.pearson ?? 0 }));
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#101416] p-4 xl:flex-row xl:items-center">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-zinc-400">Variable<select value={variable} onChange={(event) => setVariable(event.target.value as keyof typeof variables)} className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-[#0a0d0f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300">{Object.keys(variables).map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-xs font-semibold text-zinc-400">Spatial filter<select value={district} onChange={(event) => setDistrict(event.target.value)} className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-[#0a0d0f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300">{districts.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-xs font-semibold text-zinc-400">Time filter<select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} className="mt-2 min-h-11 w-full cursor-pointer rounded-lg border border-white/10 bg-[#0a0d0f] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300"><option>Peak hour</option><option>Afternoon</option><option>Full demo day</option></select></label>
        </div>
        <Button variant="secondary" className="xl:self-end" onClick={() => setMethodOpen(true)}><Info className="size-4" />How was this calculated?</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-500">Scatter plot</p><h3 className="mt-2 text-lg font-bold">Temperature ↔ {variable}</h3></div><div className="text-right"><p className="metric-number text-3xl font-black text-cyan-100">{current.pearson === null ? "N/A" : current.pearson.toFixed(2)}</p><p className="text-[10px] uppercase tracking-[.16em] text-zinc-500">Pearson r · N {current.sampleSize}</p></div></CardHeader><CardContent>
          <div className="h-[340px]" role="img" aria-label={`Scatter plot for ${variable} and temperature, Pearson coefficient ${current.pearson?.toFixed(2) ?? "unavailable"}`}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 15, right: 18, bottom: 14, left: -10 }}><CartesianGrid stroke="rgba(255,255,255,.06)" /><XAxis dataKey="value" type="number" name={variable} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis dataKey="temperature" type="number" name="Temperature" unit="°C" domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ strokeDasharray: "4 4" }} contentStyle={tooltipStyle} /><Scatter data={chartData} fill="#67e8f9" /></ComposedChart></ResponsiveContainer></div>
          <div className="mt-2 flex flex-wrap items-center gap-2"><Badge tone={current.strength === "Strong" || current.strength === "Very strong" ? "high" : "moderate"}>{current.direction} · {current.strength}</Badge><span className="text-xs text-zinc-500">Spearman ρ = {current.spearman?.toFixed(2) ?? "N/A"} · {timeFilter}</span></div>
        </CardContent></Card>
        <Card><CardHeader><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-500">Correlation matrix</p><h3 className="mt-2 text-lg font-bold">Linear association</h3></div></CardHeader><CardContent><div className="h-[340px]" role="img" aria-label="Bar chart comparing Pearson correlations"><ResponsiveContainer width="100%" height="100%"><BarChart data={matrix} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid horizontal={false} stroke="rgba(255,255,255,.06)" /><XAxis type="number" domain={[-1, 1]} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={82} tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} /><ReferenceLine x={0} stroke="rgba(255,255,255,.25)" /><Tooltip contentStyle={tooltipStyle} formatter={(value) => Number(value).toFixed(2)} /><Bar dataKey="value" radius={4}>{matrix.map((entry) => <Cell key={entry.name} fill={entry.value >= 0 ? "#67e8f9" : "#84cc16"} />)}</Bar></BarChart></ResponsiveContainer></div></CardContent></Card>
      </div>

      {methodOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="method-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setMethodOpen(false); }}><div className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/12 bg-[#101416] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><Badge tone="neutral">Methodology</Badge><h2 id="method-title" className="mt-4 text-2xl font-black">How correlation is calculated</h2></div><Button variant="ghost" size="icon" aria-label="Close methodology" onClick={() => setMethodOpen(false)}><X className="size-5" /></Button></div><div className="mt-6 space-y-5 text-sm leading-7 text-zinc-400"><p><strong className="text-white">Pearson r</strong> measures linear association. <strong className="text-white">Spearman ρ</strong> measures monotonic association by applying Pearson to average ranks, including tie handling.</p><p>KAIRO requires at least eight spatially matched zones. This view currently uses <strong className="text-white">{current.sampleSize}</strong>. No causal claim or health-impact estimate is produced.</p><p className="rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-4 text-amber-100/80">Correlation does not imply causation. Season, time of day, humidity, elevation, weather, land use, and urban morphology can confound the result. Demo heat values were scenario-generated, so these are scenario associations rather than empirical Phoenix findings.</p><p>Canopy values come from the City of Phoenix 2022 tract shade-study sample. Full provenance and alignment limitations are available in the project methodology document.</p></div></div></div>}
    </div>
  );
}

export function UrbanContextChart({ zones }: { zones: HeatZoneCollection }) {
  const data = useMemo(() => [...zones.features].sort((a, b) => b.properties.model.priorityScore - a.properties.model.priorityScore).slice(0, 8).map((zone) => ({ name: zone.properties.id, built: zone.properties.urban.builtDensityPct, canopy: zone.properties.urban.vegetationPct, impervious: zone.properties.urban.imperviousPct })), [zones]);
  return <div className="h-[320px]" role="img" aria-label="Urban context comparison for priority zones"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" /><XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis unit="%" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="built" name="Built density" fill="#67e8f9" radius={[4,4,0,0]} /><Bar dataKey="canopy" name="Tree canopy" fill="#84cc16" radius={[4,4,0,0]} /><Bar dataKey="impervious" name="Impervious" fill="#fb923c" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>;
}

export function CorrelationTable({ data }: { data: CorrelationResult[] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[.16em] text-zinc-600"><th className="px-4 py-3">Variable</th><th className="px-4 py-3">Pearson r</th><th className="px-4 py-3">Spearman ρ</th><th className="px-4 py-3">N</th><th className="px-4 py-3">Association</th></tr></thead><tbody>{data.map((item) => <tr key={item.variable} className="border-b border-white/[0.05] last:border-0"><td className="px-4 py-4 font-semibold text-zinc-200">{item.variable}</td><td className="metric-number px-4 py-4 text-cyan-200">{formatNumber(item.pearson ?? 0, 2)}</td><td className="metric-number px-4 py-4">{formatNumber(item.spearman ?? 0, 2)}</td><td className="metric-number px-4 py-4 text-zinc-500">{item.sampleSize}</td><td className="px-4 py-4"><Badge tone={item.direction === "Negative" ? "moderate" : "live"}>{item.direction} · {item.strength}</Badge></td></tr>)}</tbody></table></div>;
}
