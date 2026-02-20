'use client'

import { Star } from 'lucide-react'

const SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
} as const

interface StarRatingProps {
  rating: number
  size?: keyof typeof SIZES
}

export function StarRating({ rating, size = 'md' }: StarRatingProps) {
  const starSize = SIZES[size]

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}
