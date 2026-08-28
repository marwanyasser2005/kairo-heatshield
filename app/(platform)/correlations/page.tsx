import type { Metadata } from "next";
import { KairoPage } from "@/components/dashboard/kairo-page";
export const metadata: Metadata = { title: "Correlations" };
export default function Page() { return <KairoPage view="correlations" />; }
