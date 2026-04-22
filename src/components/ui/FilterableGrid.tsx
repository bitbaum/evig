import React from 'react'
import { FilterableItem } from '@/hooks/useFiltering'

// Explicit class maps — Tailwind JIT cannot detect dynamically-interpolated strings
// (e.g. `grid-cols-${n}` is invisible to the scanner). All class names must appear
// as complete strings in source code.
const BASE_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}
const MD_COLS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}
const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}
const XL_COLS: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
}

interface FilterableGridProps<T extends FilterableItem> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
  columns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  animationDelay?: number
  className?: string
}

export function FilterableGrid<T extends FilterableItem>({
  items,
  renderItem,
  keyExtractor,
  columns = { sm: 1, md: 2, lg: 3 },
  animationDelay = 100,
  className = ''
}: FilterableGridProps<T>) {
  const gridClasses = [
    'grid',
    'gap-8',
    columns.sm ? (BASE_COLS[columns.sm] ?? 'grid-cols-1') : 'grid-cols-1',
    columns.md ? (MD_COLS[columns.md] ?? '') : '',
    columns.lg ? (LG_COLS[columns.lg] ?? '') : '',
    columns.xl ? (XL_COLS[columns.xl] ?? '') : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={`${gridClasses} ${className}`}>
      {items.map((item, index) => (
        <div 
          key={keyExtractor(item, index)}
          className="animate-fadeIn"
          style={{ animationDelay: `${index * animationDelay}ms` }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}