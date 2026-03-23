// Skeleton loading components for GazelleGo

export function SkeletonCard() {
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-6 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="h-5 w-12 bg-zinc-800 rounded-full" />
            <div className="h-5 w-24 bg-zinc-800 rounded-full" />
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
          </div>
          {/* Route */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-28 bg-zinc-800 rounded-lg" />
            <div className="h-4 w-4 bg-zinc-700 rounded" />
            <div className="h-6 w-28 bg-zinc-800 rounded-lg" />
          </div>
          {/* Description */}
          <div className="h-4 w-full bg-zinc-800 rounded mb-1.5" />
          <div className="h-4 w-3/4 bg-zinc-800 rounded mb-3" />
          {/* Meta */}
          <div className="flex gap-4">
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-4 w-16 bg-zinc-800 rounded" />
          </div>
        </div>
        {/* Action button */}
        <div className="shrink-0 flex flex-col gap-2">
          <div className="h-9 w-20 bg-zinc-800 rounded-xl" />
          <div className="h-5 w-20 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-zinc-800 rounded-full shrink-0" />
        <div className="flex-1">
          <div className="h-6 w-32 bg-zinc-800 rounded mb-2" />
          <div className="h-4 w-24 bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-zinc-800 rounded-xl" />
        <div className="h-20 bg-zinc-800 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonMessage() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 bg-zinc-800 rounded-full shrink-0 mt-1" />
      <div className="flex-1 max-w-xs">
        <div className="h-10 bg-zinc-800 rounded-2xl rounded-tl-sm mb-1" />
        <div className="h-3 w-12 bg-zinc-800 rounded ml-2" />
      </div>
    </div>
  )
}
