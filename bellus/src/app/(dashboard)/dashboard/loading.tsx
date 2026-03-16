export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Greeting skeleton */}
      <div>
        <div className="h-8 w-64 rounded bg-stone-200" />
        <div className="mt-2 h-4 w-48 rounded bg-stone-100" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-stone-200 bg-white p-5"
          >
            <div className="h-4 w-24 rounded bg-stone-200" />
            <div className="mt-3 h-8 w-16 rounded bg-stone-100" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-stone-100" />
              <div className="h-3 w-3/4 rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
