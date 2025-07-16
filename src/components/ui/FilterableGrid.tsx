import React from 'react'
import { FilterableItem } from '@/hooks/useFiltering'

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
  const getGridClasses = () => {
    const classes = ['grid', 'gap-8']
    
    if (columns.sm) classes.push(`grid-cols-${columns.sm}`)
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`)
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`)
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`)
    
    return classes.join(' ')
  }

  return (
    <div className={`${getGridClasses()} ${className}`}>
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