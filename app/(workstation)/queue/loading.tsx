// Shown by Next.js App Router instantly on navigation to /queue while the
// server component fetches data. The layout shell (header + sidebar) is
// already visible — this only covers the <main> content area.

export default function QueueLoading() {
  return (
    <div className="pb-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        {/* Left column */}
        <div className="space-y-3">
          {/* Metrics bar */}
          <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-neutral-slate-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-neutral-slate-100 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-2 w-14 bg-neutral-slate-100 rounded" />
                  <div className="h-7 w-8 bg-neutral-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Check-in strip — 3-column row */}
          <div className="bg-white rounded-lg border border-neutral-slate-200 p-4 space-y-3 shadow-clinic-sm">
            <div className="h-3 w-36 bg-neutral-slate-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(200px,0.9fr)] gap-4">
              <div className="h-[66px] bg-neutral-slate-100 rounded-md" />
              <div className="h-[66px] bg-neutral-slate-100 rounded-md" />
              <div className="space-y-1.5">
                <div className="h-3 w-12 bg-neutral-slate-100 rounded" />
                <div className="h-10 bg-neutral-slate-100 rounded" />
                <div className="h-10 bg-neutral-slate-200 rounded-md mt-1" />
              </div>
            </div>
          </div>

          {/* Queue table */}
          <div className="bg-white rounded-lg border border-neutral-slate-200 overflow-hidden shadow-clinic-sm">
            <div className="px-4 py-3 flex justify-between items-center border-b border-neutral-slate-200">
              <div className="h-3 w-32 bg-neutral-slate-200 rounded" />
              <div className="h-8 w-48 bg-neutral-slate-100 rounded-md" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-neutral-slate-100 last:border-0"
              >
                <div className="h-4 w-10 bg-neutral-slate-200 rounded" />
                <div className="h-4 w-28 bg-neutral-slate-100 rounded col-span-2" />
                <div className="h-4 w-24 bg-neutral-slate-100 rounded" />
                <div className="h-4 w-10 bg-neutral-slate-100 rounded" />
                <div className="h-5 w-16 bg-neutral-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column — aligned with top of stats */}
        <div className="space-y-3">
          <div className="bg-next-patient rounded-lg border border-[#F3E4C8] p-4 shadow-clinic-sm space-y-3">
            <div className="h-2.5 w-24 bg-neutral-slate-200 rounded" />
            <div className="flex items-start gap-3 mt-2">
              <div className="h-8 w-16 bg-neutral-slate-200 rounded" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-neutral-slate-200 rounded" />
                <div className="h-3 w-24 bg-neutral-slate-100 rounded" />
              </div>
            </div>
            <div className="h-3 w-20 bg-neutral-slate-100 rounded" />
          </div>

          <div className="bg-white rounded-lg border border-neutral-slate-200 shadow-clinic-sm overflow-hidden">
            <div className="bg-primary-tint px-4 py-3 border-b border-[#C7D9F5]/60">
              <div className="h-2.5 w-36 bg-[#C7D9F5]/60 rounded" />
            </div>
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2.5 rounded-md border border-neutral-slate-100"
                >
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-36 bg-neutral-slate-200 rounded" />
                    <div className="h-2.5 w-20 bg-neutral-slate-100 rounded" />
                  </div>
                  <div className="h-7 w-16 bg-neutral-slate-200 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
