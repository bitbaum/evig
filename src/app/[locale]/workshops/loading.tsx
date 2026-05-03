export default function WorkshopsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-yellow-200 animate-pulse" />
          </div>
          <div className="h-10 bg-yellow-200 rounded w-64 mx-auto mb-6 animate-pulse" />
          <div className="h-5 bg-yellow-100 rounded w-96 mx-auto animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-12 pb-16">
        {/* Filter bar skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 mb-8">
          <div className="flex gap-4">
            <div className="h-10 w-40 bg-neutral-200 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-neutral-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
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
      </div>
    </div>
  )
}
