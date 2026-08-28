import { PlatformShell } from "@/components/layout/platform-shell";
import { hasFortyGuardKey } from "@/lib/fortyguard/client";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell fortyGuardConfigured={hasFortyGuardKey()}>{children}</PlatformShell>;
}
