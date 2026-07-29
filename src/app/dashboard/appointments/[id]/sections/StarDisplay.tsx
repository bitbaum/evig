/** Read-only 1–5 star rating row used by the rating card and rating form. */

'use client'

import { Star } from 'lucide-react'

export function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'fill-warning-400 text-warning-400' : 'text-text-muted dark:text-text-secondary'}`}
        />
      ))}
    </div>
  )
}
