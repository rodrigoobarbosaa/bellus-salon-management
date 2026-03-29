import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-shimmer rounded-md", className)}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border-black/[0.04] border bg-card p-6 space-y-3 shadow-[var(--shadow-card)]">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

function SkeletonCalendar() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="h-10 w-14" />
          <div className="flex-1 grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonList, SkeletonCalendar };
