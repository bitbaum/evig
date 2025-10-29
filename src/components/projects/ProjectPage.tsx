/**
 * ProjectPage - Main reusable component for project pages
 * 
 * Uses modular components to build consistent project pages
 */

import { Metadata } from 'next'
import { ProjectHero } from './ProjectHero'
import { ProjectSection } from './ProjectSection'
import { ProjectCallToAction } from './ProjectCallToAction'
import { ProjectPageConfig } from './types'

interface ProjectPageProps {
  config: ProjectPageConfig
}

export function ProjectPage({ config }: ProjectPageProps) {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <ProjectHero hero={config.hero} />

      {/* Content Sections */}
      {config.sections.map((section, index) => (
        <ProjectSection key={index} section={section} />
      ))}
    </main>
  )
}

// Helper function to generate metadata
export function generateProjectMetadata(config: ProjectPageConfig): Metadata {
  return {
    title: config.metadata.title,
    description: config.metadata.description
  }
}

