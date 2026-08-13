/**
 * Blog index skeleton — the page is force-dynamic (DB + auth reads), so slow
 * responses would otherwise block with zero feedback.
 */
export default function BlogLoading() {
  return (
    <main aria-busy="true">
      {/* Hero band placeholder */}
      <div className="bg-surface-raised">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-overlay" />
          <div className="mt-4 h-5 w-72 max-w-full animate-pulse rounded bg-surface-overlay" />
        </div>
      </div>

      {/* Nav bar placeholder */}
      <div className="sticky top-0 z-40 border-b border bg-surface-base">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="h-7 w-16 animate-pulse rounded bg-surface-raised" />
          <div className="ml-auto hidden gap-2 md:flex">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-surface-raised" />
            ))}
          </div>
        </div>
      </div>

      {/* Hero post placeholder */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[16/10] animate-pulse rounded-xl bg-surface-raised" />
          <div className="space-y-4 py-4">
            <div className="h-4 w-28 animate-pulse rounded bg-surface-raised" />
            <div className="h-9 w-full animate-pulse rounded bg-surface-raised" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-surface-raised" />
            <div className="h-4 w-full animate-pulse rounded bg-surface-raised" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-raised" />
          </div>
        </div>

        {/* List placeholders */}
        <div className="mt-10 grid gap-x-8 gap-y-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-5">
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-surface-raised" />
              <div className="min-w-0 flex-1 space-y-3 py-1">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-raised" />
                <div className="h-5 w-full animate-pulse rounded bg-surface-raised" />
                <div className="h-3 w-40 animate-pulse rounded bg-surface-raised" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
