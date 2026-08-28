import { getFortyGuardCapabilities } from "@/lib/fortyguard/capabilities";
import { getDemoDashboardData } from "@/lib/datasets/loader";
import { KairoWorkspace, type WorkspaceView } from "@/components/dashboard/kairo-workspace";
import type { CityId } from "@/lib/demo/data";

export function KairoPage({ view, cityId = "phoenix" }: { view: WorkspaceView; cityId?: CityId }) {
  return <KairoWorkspace view={view} data={getDemoDashboardData(cityId)} capabilities={getFortyGuardCapabilities()} cityId={cityId} />;
}
