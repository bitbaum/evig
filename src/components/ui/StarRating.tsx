'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  /** Current rating, 0–5. */
  value: number
  /** Provide to make interactive; omit for read-only display. */
  onChange?: (rating: number) => void
  /** Optional form label rendered above the stars. */
  label?: string
  /** Visual size — `sm` ≈ 16px, `md` ≈ 20px, `lg` ≈ 24px. */
  size?: 'sm' | 'md' | 'lg'
}

const STAR_SIZE = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
} as const

/**
 * Five-star rating widget.
 * Read-only when `onChange` is not provided.
 */
export function StarRating({ value, onChange, label, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const interactive = !!onChange
  const sizeClass = STAR_SIZE[size]

  const stars = [1, 2, 3, 4, 5].map((star) => {
    const filled = star <= (interactive ? (hover || value) : Math.round(value))
    const starEl = (
      <Star
        className={`${sizeClass} transition-colors ${
          filled ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'
        }`}
      />
    )

    if (!interactive) {
      return <span key={star}>{starEl}</span>
    }

    return (
      <button
        key={star}
        type="button"
        onClick={() => onChange?.(star)}
        onMouseEnter={() => setHover(star)}
        onMouseLeave={() => setHover(0)}
        className="p-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded hover:scale-110 transition-transform"
      >
        {starEl}
      </button>
    )
  })

  if (label) {
    return (
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
        <div className="flex gap-1">{stars}</div>
      </div>
    )
  }

  return <div className="flex items-center gap-0.5">{stars}</div>
}
