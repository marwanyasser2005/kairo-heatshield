import type { Metadata } from "next";
import { KairoPage } from "@/components/dashboard/kairo-page";
export const metadata: Metadata = { title: "Environment" };
export default function Page() { return <KairoPage view="environment" />; }
