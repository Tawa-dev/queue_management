// Shown instantly on navigation to /rooms while the server component fetches.

export default function RoomsLoading() {
  return (
    <div className="space-y-4 pb-6 animate-pulse">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-44 bg-neutral-slate-200 rounded" />
          <div className="h-3 w-72 bg-neutral-slate-100 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-20 bg-neutral-slate-100 rounded-full" />
          <div className="h-6 w-24 bg-neutral-slate-100 rounded-full" />
          <div className="h-8 w-20 bg-neutral-slate-200 rounded-md" />
        </div>
      </div>

      {/* Live indicator */}
      <div className="h-2.5 w-28 bg-neutral-slate-100 rounded" />

      {/* Room cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-neutral-slate-200 p-4 flex flex-col gap-3"
          >
            {/* Room name + badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-neutral-slate-200 rounded" />
                <div className="h-3 w-20 bg-neutral-slate-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-neutral-slate-100 rounded-full shrink-0" />
            </div>
            {/* Occupant placeholder */}
            <div className="flex-1 min-h-[52px] space-y-1.5">
              <div className="h-4 w-24 bg-neutral-slate-100 rounded" />
              <div className="h-3 w-32 bg-neutral-slate-100 rounded" />
            </div>
            {/* Action button */}
            <div className="h-8 w-full bg-neutral-slate-200 rounded-md" />
          </div>
        ))}
      </div>

      {/* Recent assignments table */}
      <div className="bg-white rounded-lg border border-neutral-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-slate-200">
          <div className="h-3 w-44 bg-neutral-slate-200 rounded" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-neutral-slate-100 last:border-0"
          >
            <div className="h-3.5 w-14 bg-neutral-slate-100 rounded" />
            <div className="h-3.5 w-10 bg-neutral-slate-200 rounded" />
            <div className="h-3.5 w-28 bg-neutral-slate-100 rounded" />
            <div className="h-3.5 w-24 bg-neutral-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
