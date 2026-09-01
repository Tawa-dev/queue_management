// Shown instantly on navigation to /reports while the server component fetches.

const SKELETON_HEIGHTS = [40, 70, 55, 90, 35, 60];

export default function ReportsLoading() {
  return (
    <div className="space-y-5 pb-6 animate-pulse">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-neutral-slate-200 rounded" />
          <div className="h-3 w-64 bg-neutral-slate-100 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-28 bg-neutral-slate-100 rounded" />
          <div className="h-8 w-20 bg-neutral-slate-200 rounded-md" />
        </div>
      </div>

      {/* 5 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-neutral-slate-200 p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-lg bg-neutral-slate-100 shrink-0" />
            <div className="space-y-2">
              <div className="h-2.5 w-24 bg-neutral-slate-100 rounded" />
              <div className="h-6 w-12 bg-neutral-slate-200 rounded" />
              <div className="h-2 w-20 bg-neutral-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Hourly bar chart */}
      <div className="bg-white rounded-lg border border-neutral-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1.5">
            <div className="h-3 w-44 bg-neutral-slate-200 rounded" />
            <div className="h-2.5 w-56 bg-neutral-slate-100 rounded" />
          </div>
          <div className="w-5 h-5 bg-neutral-slate-100 rounded" />
        </div>
        <div className="flex items-end gap-1.5 h-40">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[28px] bg-neutral-slate-100 rounded-t-sm"
              style={{ height: `${SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length]}%` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-slate-100">
          <div className="h-2.5 w-20 bg-neutral-slate-100 rounded" />
          <div className="h-2.5 w-24 bg-neutral-slate-100 rounded" />
        </div>
      </div>

      {/* Footer note */}
      <div className="flex justify-end">
        <div className="h-2.5 w-80 bg-neutral-slate-100 rounded" />
      </div>
    </div>
  );
}
