// Shown by Next.js App Router instantly on navigation to /queue while the
// server component fetches data. The layout shell (header + sidebar) is
// already visible — this only covers the <main> content area.

export default function QueueLoading() {
  return (
    <div className="space-y-3 pb-4 animate-pulse">
      {/* Metrics bar — 5 chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-neutral-slate-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-neutral-slate-100 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-2 w-14 bg-neutral-slate-100 rounded" />
              <div className="h-5 w-8 bg-neutral-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        {/* Left — check-in strip + queue table */}
        <div className="space-y-3">
          {/* Check-in strip */}
          <div className="bg-white rounded-lg border border-neutral-slate-200 p-4 space-y-3">
            <div className="h-3 w-36 bg-neutral-slate-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 h-10 bg-neutral-slate-100 rounded-md" />
              <div className="md:col-span-5 h-10 bg-neutral-slate-100 rounded-md" />
              <div className="md:col-span-2 h-10 bg-neutral-slate-100 rounded-md" />
            </div>
            <div className="flex justify-end">
              <div className="h-9 w-36 bg-neutral-slate-200 rounded-md" />
            </div>
          </div>

          {/* Queue table */}
          <div className="bg-white rounded-lg border border-neutral-slate-200 overflow-hidden">
            {/* Table header bar */}
            <div className="px-4 py-3 flex justify-between items-center border-b border-neutral-slate-200">
              <div className="h-3 w-32 bg-neutral-slate-200 rounded" />
              <div className="h-8 w-48 bg-neutral-slate-100 rounded-md" />
            </div>
            {/* Rows */}
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

        {/* Right — next patient card + room panel */}
        <div className="space-y-3">
          {/* Next patient card */}
          <div className="bg-white rounded-lg border border-neutral-slate-200 p-4 space-y-3">
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

          {/* Room assign panel */}
          <div className="bg-white rounded-lg border border-neutral-slate-200 overflow-hidden">
            <div className="p-4 space-y-2">
              <div className="h-2.5 w-36 bg-neutral-slate-200 rounded mb-3" />
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
