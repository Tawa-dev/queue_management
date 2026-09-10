// Shown instantly on navigation to /settings while the server component fetches.

export default function SettingsLoading() {
  return (
    <div className="space-y-6 pb-6 animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-5 w-24 bg-neutral-slate-200 rounded" />
        <div className="h-3 w-48 bg-neutral-slate-100 rounded" />
      </div>

      {/* Staff section skeleton */}
      <div className="bg-white rounded-lg border border-neutral-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-slate-100" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-neutral-slate-200 rounded" />
              <div className="h-2.5 w-16 bg-neutral-slate-100 rounded" />
            </div>
          </div>
          <div className="h-8 w-24 bg-neutral-slate-200 rounded-md" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-5 py-3.5 border-b border-neutral-slate-100 last:border-0">
            <div className="h-4 w-32 bg-neutral-slate-100 rounded col-span-2" />
            <div className="h-4 w-40 bg-neutral-slate-100 rounded col-span-1" />
            <div className="h-5 w-20 bg-neutral-slate-100 rounded-full" />
            <div className="h-7 w-20 bg-neutral-slate-100 rounded-md ml-auto" />
          </div>
        ))}
      </div>

      {/* Rooms section skeleton */}
      <div className="bg-white rounded-lg border border-neutral-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-slate-100" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-36 bg-neutral-slate-200 rounded" />
              <div className="h-2.5 w-20 bg-neutral-slate-100 rounded" />
            </div>
          </div>
          <div className="h-8 w-24 bg-neutral-slate-200 rounded-md" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-5 py-3.5 border-b border-neutral-slate-100 last:border-0">
            <div className="h-4 w-36 bg-neutral-slate-100 rounded" />
            <div className="h-4 w-12 bg-neutral-slate-100 rounded" />
            <div className="h-4 w-28 bg-neutral-slate-100 rounded" />
            <div className="h-5 w-16 bg-neutral-slate-100 rounded-full" />
            <div className="h-7 w-20 bg-neutral-slate-100 rounded-md ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
