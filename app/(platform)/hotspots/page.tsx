import type { Metadata } from "next";
import { KairoPage } from "@/components/dashboard/kairo-page";
export const metadata: Metadata = { title: "Hotspots" };
export default function Page() { return <KairoPage view="hotspots" />; }
