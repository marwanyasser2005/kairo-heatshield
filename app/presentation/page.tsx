import type { Metadata } from "next";
import { PresentationWorkspace } from "@/components/dashboard/presentation-workspace";
import { getDemoDashboardData } from "@/lib/datasets/loader";
export const metadata: Metadata = { title: "Presentation Mode" };
export default function Page() { return <PresentationWorkspace data={getDemoDashboardData()} />; }
