import { BarChart3, Bot, Crosshair, FlaskConical, Gauge, Leaf, Lightbulb, Map, Route, TreePalm, type LucideIcon } from "lucide-react";

export type PlatformNavItem = { href: string; label: string; description: string; icon: LucideIcon; group: "Observe" | "Evidence" | "Decide" };

export const platformNavigation: PlatformNavItem[] = [
  { href: "/dashboard", label: "Overview", description: "Phoenix at a glance", icon: Gauge, group: "Observe" },
  { href: "/map", label: "Heat map", description: "Spatial heat and canopy layers", icon: Map, group: "Observe" },
  { href: "/hotspots", label: "Hotspots", description: "What rises to the top", icon: Crosshair, group: "Observe" },
  { href: "/routes", label: "Cool route", description: "Plan lower-exposure pedestrian paths", icon: TreePalm, group: "Observe" },
  { href: "/environment", label: "Environment", description: "Urban form and canopy context", icon: Leaf, group: "Evidence" },
  { href: "/correlations", label: "Correlations", description: "Pearson and Spearman analysis", icon: BarChart3, group: "Evidence" },
  { href: "/insights", label: "Insights", description: "Finding, proof, and limits", icon: Lightbulb, group: "Evidence" },
  { href: "/scenarios", label: "Cooling lab", description: "Test what-if cooling scenarios", icon: FlaskConical, group: "Decide" },
  { href: "/actions", label: "Actions", description: "What to investigate next", icon: Route, group: "Decide" },
  { href: "/analyst", label: "Analyst", description: "Ask the current evidence", icon: Bot, group: "Decide" },
];
