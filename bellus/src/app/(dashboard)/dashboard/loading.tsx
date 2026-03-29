export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Greeting skeleton */}
      <div>
        <div className="h-9 w-72 rounded-lg animate-shimmer" />
        <div className="mt-2 h-4 w-48 rounded animate-shimmer" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border-black/[0.04] border bg-white p-6 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="size-8 rounded-lg animate-shimmer" />
            </div>
            <div className="h-9 w-20 rounded animate-shimmer" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded animate-shimmer" />
              <div className="h-3 w-3/4 rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
