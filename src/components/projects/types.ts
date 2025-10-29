/**
 * Project Page Types
 *
 * Centralized type definitions for consistent project page structure
 */

export interface ProjectCTA {
  text: string
  href: string
  variant?: 'primary' | 'outline' | 'secondary'
  icon?: React.ReactNode
}

export interface ProjectHero {
  title: string
  description: string
  backgroundColor?: string
  ctas?: ProjectCTA[]
}

export interface ProjectCard {
  title: string
  description: string
  icon?: string | React.ReactNode | React.ComponentType<any>
  features?: string[]
  href?: string
  ctaText?: string
  iconColor?: string
}

export interface ProjectSection {
  title: string
  description?: string
  cards?: ProjectCard[]
  backgroundColor?: 'white' | 'gray' | 'primary'
  layout?: 'grid-2' | 'grid-3' | 'grid-4' | 'single'
}

export interface ProjectPageConfig {
  hero: ProjectHero
  sections: ProjectSection[]
  metadata: {
    title: string
    description: string
  }
}

