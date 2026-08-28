"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Leaf, MapPinned } from "lucide-react";
import type { HeatZoneCollection, Hotspot } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeatMapProps {
  zones: HeatZoneCollection;
  hotspots: Hotspot[];
  selectedId?: string;
  onSelect: (id: string) => void;
  className?: string;
  presentation?: boolean;
  initialLayerMode?: LayerMode;
  onOpenCanopyScenario?: () => void;
}

export type LayerMode = "heat" | "vegetation";
type Bounds = { west: number; east: number; south: number; north: number };

const HEAT_COLORS = ["#123247", "#0e7490", "#22d3ee", "#facc15", "#fb923c", "#dc2626"];
const CANOPY_COLORS = ["#5b2a0a", "#92400e", "#a16207", "#65a30d", "#22c55e", "#15803d"];

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function mixColor(colors: string[], position: number) {
  const scaled = clamp(position) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const amount = scaled - index;
  const parse = (hex: string) => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  const start = parse(colors[index]);
  const end = parse(colors[index + 1]);
  const channels = start.map((channel, channelIndex) => Math.round(channel + (end[channelIndex] - channel) * amount));
  return `rgb(${channels[0]} ${channels[1]} ${channels[2]})`;
}

function collectionBounds(zones: HeatZoneCollection): Bounds {
  const coordinates = zones.features.flatMap((zone) => zone.geometry.coordinates[0]);
  if (!coordinates.length) return { west: -112.1, east: -112, south: 33.4, north: 33.6 };
  return {
    west: Math.min(...coordinates.map((coordinate) => coordinate[0])),
    east: Math.max(...coordinates.map((coordinate) => coordinate[0])),
    south: Math.min(...coordinates.map((coordinate) => coordinate[1])),
    north: Math.max(...coordinates.map((coordinate) => coordinate[1])),
  };
}

function pointInPolygon(point: [number, number], ring: number[][]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x, y] = ring[index];
    const [previousX, previousY] = ring[previous];
    const intersects = y > point[1] !== previousY > point[1]
      && point[0] < ((previousX - x) * (point[1] - y)) / ((previousY - y) || Number.EPSILON) + x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export default function HeatMap({ zones, hotspots, selectedId, onSelect, className, presentation = false, initialLayerMode = "heat", onOpenCanopyScenario }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layerMode, setLayerMode] = useState<LayerMode>(initialLayerMode);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const selectedZone = zones.features.find((zone) => zone.properties.id === selectedId);
  const isLive = zones.features.some((zone) => zone.properties.source.includes("FortyGuard Temperature API"));
  const activeLayerMode: LayerMode = isLive ? "heat" : layerMode;
  const activeInspectionId = isLive ? inspectedId ?? hoveredId : selectedId ?? hoveredId;
  const inspectedZone = zones.features.find((zone) => zone.properties.id === activeInspectionId);
  const bounds = useMemo(() => collectionBounds(zones), [zones]);
  const temperatures = useMemo(() => zones.features.map((zone) => zone.properties.observed.temperatureC), [zones]);
  const canopyValues = useMemo(() => zones.features.map((zone) => zone.properties.urban.vegetationPct), [zones]);
  const temperatureDomain = useMemo(() => {
    const minimum = Math.min(...temperatures);
    const maximum = Math.max(...temperatures);
    return [minimum, maximum] as const;
  }, [temperatures]);
  const canopyDomain = useMemo(() => [Math.min(...canopyValues), Math.max(...canopyValues)] as const, [canopyValues]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !zones.features.length) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      const padding = presentation ? 42 : Math.min(58, Math.max(28, displayWidth * 0.055));
      const plotWidth = Math.max(1, displayWidth - padding * 2);
      const plotHeight = Math.max(1, displayHeight - padding * 2);
      const longitudeSpan = Math.max(bounds.east - bounds.west, Number.EPSILON);
      const latitudeSpan = Math.max(bounds.north - bounds.south, Number.EPSILON);
      const project = ([longitude, latitude]: number[]) => [
        padding + ((longitude - bounds.west) / longitudeSpan) * plotWidth,
        padding + ((bounds.north - latitude) / latitudeSpan) * plotHeight,
      ] as const;

      const background = context.createLinearGradient(0, 0, displayWidth, displayHeight);
      background.addColorStop(0, "#071014");
      background.addColorStop(0.52, "#030708");
      background.addColorStop(1, "#071013");
      context.fillStyle = background;
      context.fillRect(0, 0, displayWidth, displayHeight);

      context.lineWidth = 1;
      context.strokeStyle = "rgba(103,232,249,.055)";
      for (let x = padding; x <= displayWidth - padding + 1; x += Math.max(42, plotWidth / 12)) {
        context.beginPath(); context.moveTo(x, padding); context.lineTo(x, displayHeight - padding); context.stroke();
      }
      for (let y = padding; y <= displayHeight - padding + 1; y += Math.max(42, plotHeight / 8)) {
        context.beginPath(); context.moveTo(padding, y); context.lineTo(displayWidth - padding, y); context.stroke();
      }

      const [domainMinimum, domainMaximum] = activeLayerMode === "heat" ? temperatureDomain : canopyDomain;
      const domainSpan = Math.max(domainMaximum - domainMinimum, Number.EPSILON);
      const colors = activeLayerMode === "heat" ? HEAT_COLORS : CANOPY_COLORS;

      for (const zone of zones.features) {
        const value = activeLayerMode === "heat" ? zone.properties.observed.temperatureC : zone.properties.urban.vegetationPct;
        const ring = zone.geometry.coordinates[0];
        const normalized = clamp((value - domainMinimum) / domainSpan);
        context.beginPath();
        ring.forEach((coordinate, index) => {
          const [x, y] = project(coordinate);
          if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.closePath();
        context.fillStyle = mixColor(colors, normalized);
        context.globalAlpha = isLive ? 0.94 : 0.9;
        context.fill();
        context.globalAlpha = 1;
        context.lineWidth = zone.properties.id === activeInspectionId ? 2.5 : isLive ? 0.45 : 1;
        context.strokeStyle = zone.properties.id === activeInspectionId
          ? "rgba(255,255,255,.98)"
          : isLive ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.24)";
        context.stroke();
      }

      for (const hotspot of hotspots.slice(0, 3)) {
        const [x, y] = project(hotspot.centroid);
        context.beginPath(); context.arc(x, y, 16, 0, Math.PI * 2);
        context.fillStyle = "rgba(251,146,60,.16)"; context.fill();
        context.lineWidth = 2; context.strokeStyle = "rgba(251,146,60,.72)"; context.stroke();
        context.beginPath(); context.arc(x, y, 5, 0, Math.PI * 2);
        context.fillStyle = "#fff7ed"; context.fill();
        context.lineWidth = 2; context.strokeStyle = "#f97316"; context.stroke();
      }

      const vignette = context.createRadialGradient(displayWidth / 2, displayHeight / 2, Math.min(displayWidth, displayHeight) * 0.25, displayWidth / 2, displayHeight / 2, Math.max(displayWidth, displayHeight) * 0.75);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,.32)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, displayWidth, displayHeight);
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [activeInspectionId, activeLayerMode, bounds, canopyDomain, hotspots, isLive, presentation, temperatureDomain, zones]);

  const pointerCoordinate = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const padding = presentation ? 42 : Math.min(58, Math.max(28, rect.width * 0.055));
    const plotWidth = Math.max(1, rect.width - padding * 2);
    const plotHeight = Math.max(1, rect.height - padding * 2);
    const x = clamp((event.clientX - rect.left - padding) / plotWidth);
    const y = clamp((event.clientY - rect.top - padding) / plotHeight);
    return [bounds.west + x * (bounds.east - bounds.west), bounds.north - y * (bounds.north - bounds.south)] as [number, number];
  };

  const zoneAtPointer = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = pointerCoordinate(event);
    return zones.features.find((zone) => pointInPolygon(point, zone.geometry.coordinates[0]));
  };

  if (!zones.features.length) {
    return <div className={cn("relative grid min-h-[430px] place-items-center overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--background)]", className)}><div className="text-center"><Badge tone="neutral">No spatial data</Badge><p className="mt-3 text-sm text-zinc-400">Run a verified live analysis or open the Phoenix scenario.</p></div></div>;
  }

  const heatMinimum = temperatureDomain[0];
  const heatMaximum = temperatureDomain[1];
  const legend = activeLayerMode === "heat"
    ? `${heatMinimum.toFixed(isLive ? 2 : 1)} to ${heatMaximum.toFixed(isLive ? 2 : 1)}°C`
    : `${canopyDomain[0].toFixed(0)} to ${canopyDomain[1].toFixed(0)}% canopy`;

  return (
    <div className={cn("relative min-h-[430px] overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[#030708] shadow-[var(--shadow-elevated)]", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full touch-manipulation"
        role="img"
        aria-label={`${isLive ? "Verified FortyGuard TCM" : "Phoenix resilience scenario"} choropleth. ${zones.features.length.toLocaleString("en-US")} zones. ${legend}.`}
        onPointerMove={(event) => {
          const zone = zoneAtPointer(event);
          setHoveredId(zone?.properties.id ?? null);
          event.currentTarget.style.cursor = zone ? (isLive ? "help" : "pointer") : "crosshair";
        }}
        onPointerLeave={() => setHoveredId(null)}
        onClick={(event) => {
          const zone = zoneAtPointer(event);
          if (!zone) return;
          if (isLive) setInspectedId(zone.properties.id);
          else onSelect(zone.properties.id);
        }}
      />

      <span className="pointer-events-none absolute left-3 top-3 z-10 size-5 border-l-2 border-t-2 border-cyan-400/60" />
      <span className="pointer-events-none absolute right-3 top-3 z-10 size-5 border-r-2 border-t-2 border-cyan-400/60" />
      <span className="pointer-events-none absolute bottom-3 left-3 z-10 size-5 border-b-2 border-l-2 border-orange-400/60" />
      <span className="pointer-events-none absolute bottom-3 right-3 z-10 size-5 border-b-2 border-r-2 border-orange-400/60" />

      <div className="absolute left-5 top-5 z-10 flex gap-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-raised)]/95 p-1.5 shadow-2xl backdrop-blur-xl">
        <Button size="sm" variant={activeLayerMode === "heat" ? "primary" : "secondary"} onClick={() => setLayerMode("heat")} aria-pressed={activeLayerMode === "heat"}><Flame className="size-3.5" />Heat</Button>
        <Button
          size="sm"
          variant={activeLayerMode === "vegetation" ? "primary" : "secondary"}
          onClick={() => isLive ? onOpenCanopyScenario?.() : setLayerMode("vegetation")}
          aria-pressed={activeLayerMode === "vegetation"}
          aria-label={isLive ? "Open the labeled Phoenix canopy scenario" : "Show City of Phoenix canopy sample"}
          title={isLive ? "Open the labeled Phoenix canopy scenario" : "Show City of Phoenix canopy sample"}
        >
          <Leaf className="size-3.5" />Canopy{isLive && <span className="hidden text-[9px] font-medium text-zinc-400 sm:inline">Scenario</span>}
        </Button>
      </div>

      <div className="absolute right-5 top-5 z-10 hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]/92 px-3 py-2 backdrop-blur-lg sm:flex">
        <span className={cn("size-2 rounded-full", isLive ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.6)]" : "bg-cyan-300")} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-zinc-200">{isLive ? "Verified FortyGuard TCM" : "Phoenix scenario field"}</span>
      </div>

      <div className="absolute bottom-5 left-5 z-10 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]/95 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2"><MapPinned className="size-3.5 shrink-0 text-cyan-200" /><span className={cn("h-1.5 w-20 rounded-full sm:w-24", activeLayerMode === "heat" ? "bg-gradient-to-r from-[#123247] via-yellow-400 to-red-600" : "bg-gradient-to-r from-amber-950 via-lime-600 to-green-700")} /><span className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-zinc-200">{legend}</span></div>
        {isLive && <p className="mt-1.5 text-[10px] leading-4 text-zinc-300">Relative scale within this activity · 2 m air temperature</p>}
      </div>

      {isLive && inspectedZone && (
        <div className="absolute bottom-24 right-5 z-10 w-52 max-w-[calc(100%-2.5rem)] rounded-xl border border-cyan-300/20 bg-[#071016]/95 p-3 shadow-2xl backdrop-blur-xl" aria-live="polite">
          <p className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200">Inspected temperature tile</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="metric-number text-2xl font-black text-white">{inspectedZone.properties.observed.temperatureC.toFixed(2)}°C</p>
            <p className="truncate font-mono text-[9px] text-zinc-500">{inspectedZone.properties.id}</p>
          </div>
          <p className="mt-1 text-[10px] leading-4 text-zinc-400">Verified FortyGuard TCM value. Select another tile to inspect it.</p>
        </div>
      )}

      {selectedZone && !isLive && (
        <div className="absolute bottom-20 right-5 z-10 hidden w-56 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-raised)]/95 p-4 shadow-2xl backdrop-blur-xl md:block">
          <p className="text-[10px] font-black uppercase tracking-[.17em] text-cyan-200">Selected scenario zone</p><p className="mt-2 truncate text-sm font-bold text-white">{selectedZone.properties.name}</p>
          <div className="mt-3 flex items-end justify-between"><div><p className="metric-number text-2xl font-black text-orange-300">{selectedZone.properties.observed.temperatureC.toFixed(1)}°</p><p className="text-[10px] uppercase tracking-[.12em] text-zinc-400">Modeled temp</p></div><div className="text-right"><p className="metric-number text-lg font-black text-cyan-200">{selectedZone.properties.model.heatExposureScore}</p><p className="text-[10px] uppercase tracking-[.12em] text-zinc-400">Exposure</p></div></div>
        </div>
      )}

      <span className="sr-only">Map extent {bounds.west.toFixed(4)} to {bounds.east.toFixed(4)} longitude and {bounds.south.toFixed(4)} to {bounds.north.toFixed(4)} latitude.</span>
    </div>
  );
}
