import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformLoading() {
  return (
    <main className="min-h-dvh p-4 sm:p-6 xl:p-8" aria-label="Loading KAIRO workspace">
      <div className="space-y-4">
        <div className="space-y-3 border-b border-white/[0.07] pb-7">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-[min(520px,85vw)]" />
          <Skeleton className="h-4 w-[min(680px,90vw)]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-4 2xl:grid-cols-[1.45fr_.55fr]">
          <Skeleton className="min-h-[520px] rounded-xl" />
          <Skeleton className="min-h-[520px] rounded-xl" />
        </div>
      </div>
    </main>
  );
}
