import { PageShell } from '@/components/layout/PageShell'

export default function WorkshopsLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="bg-warning-50 dark:bg-neutral-900 border-b border-warning-100 dark:border-white/[0.06] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-warning-200 animate-pulse" />
          </div>
          <div className="h-10 bg-warning-200 rounded w-64 mx-auto mb-6 animate-pulse" />
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mx-auto animate-pulse" />
        </div>
      </div>

      <PageShell py="pt-12 pb-16">
        {/* Filter bar skeleton */}
        <div className="card-shell p-4 mb-8">
          <div className="flex gap-4">
            <div className="h-10 w-40 bg-neutral-200 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-neutral-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-shell overflow-hidden">
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 bg-neutral-200 rounded-lg animate-pulse" />
                  <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse" />
                </div>
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4 animate-pulse" />
                <div className="h-4 bg-neutral-200 rounded w-full mb-2 animate-pulse" />
                <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
              </div>
              <div className="p-6">
                <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2 animate-pulse" />
                <div className="h-4 bg-neutral-200 rounded w-1/3 mb-4 animate-pulse" />
                <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4 animate-pulse" />
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-neutral-200 rounded-lg animate-pulse" />
                  <div className="flex-1 h-10 bg-neutral-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageShell>
    </>
  )
}
