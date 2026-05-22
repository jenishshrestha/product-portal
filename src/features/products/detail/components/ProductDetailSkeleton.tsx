import { Skeleton } from "@shared/components/ui/Skeleton";

/**
 * Mirrors the final detail layout's major blocks so the user doesn't see a
 * collapsed → expanded layout jump when the loader finishes. Shown by the
 * route's `pendingComponent` when the cache is cold. Rendered inside the
 * AppShell's `<main>` padding — no extra container needed.
 */
export function ProductDetailSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-8 w-36" />

      <div className="mb-4 flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-7 w-3/5" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex shrink-0 gap-2">
          <Skeleton className="h-[34px] w-28" />
          <Skeleton className="h-[34px] w-20" />
          <Skeleton className="h-[34px] w-24" />
        </div>
      </div>

      <div className="mb-7 flex flex-wrap gap-2.5 border-b border-border-subtle pb-6">
        <Skeleton className="h-[22px] w-24" />
        <Skeleton className="h-[22px] w-32" />
        <Skeleton className="h-[22px] w-28" />
        <Skeleton className="h-[22px] w-32" />
      </div>

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </main>
        <aside className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </aside>
      </div>
    </div>
  );
}
