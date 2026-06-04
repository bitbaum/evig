/**
 * ProfileSkeleton - Loading skeleton for profile page
 *
 * Ground Truth #1: Serve humans - Show clear loading states
 */

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-neutral-200 rounded-sm w-1/4"></div>
        <div className="h-4 bg-neutral-200 rounded-sm w-1/2"></div>
      </div>

      {/* Avatar Section Skeleton */}
      <div className="card-shell rounded-lg p-6 space-y-4">
        <div className="h-6 bg-neutral-200 rounded-sm w-1/3"></div>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 bg-neutral-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-10 bg-neutral-200 rounded-sm w-32"></div>
            <div className="h-10 bg-neutral-200 rounded-sm w-32"></div>
          </div>
        </div>
      </div>

      {/* Public Profile Section Skeleton */}
      <div className="card-shell rounded-lg p-6 space-y-6">
        <div className="h-6 bg-neutral-200 rounded-sm w-1/3"></div>

        {/* Display Name */}
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded-sm w-1/4"></div>
          <div className="h-10 bg-neutral-200 rounded-sm"></div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded-sm w-1/4"></div>
          <div className="h-24 bg-neutral-200 rounded-sm"></div>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded-sm w-1/3"></div>
          <div className="h-10 bg-neutral-200 rounded-sm w-1/2"></div>
        </div>
      </div>

      {/* Service Provider Section Skeleton */}
      <div className="card-shell rounded-lg p-6 space-y-4">
        <div className="h-6 bg-neutral-200 rounded-sm w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-neutral-200 rounded-sm"></div>
          <div className="h-4 bg-neutral-200 rounded-sm w-5/6"></div>
          <div className="h-4 bg-neutral-200 rounded-sm w-4/6"></div>
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="flex justify-end gap-3">
        <div className="h-10 bg-neutral-200 rounded-sm w-24"></div>
        <div className="h-10 bg-neutral-200 rounded-sm w-24"></div>
      </div>
    </div>
  )
}
