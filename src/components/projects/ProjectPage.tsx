import { ProjectHero } from './ProjectHero'
import { ProjectSection } from './ProjectSection'
import { ProjectCallToAction } from './ProjectCallToAction'
import type { ProjectPageConfig } from './types'

interface ProjectPageProps {
  config: ProjectPageConfig
}

export function ProjectPage({ config }: ProjectPageProps) {
  return (
    <main className="min-h-screen">
      <ProjectHero hero={config.hero} />

      {config.sections.map((section, i) => (
        <ProjectSection key={i} section={section} />
      ))}

      {config.cta && <ProjectCallToAction cta={config.cta} />}
    </main>
  )
}

export function generateProjectMetadata(config: ProjectPageConfig) {
  return {
    title: config.metadata.title,
    description: config.metadata.description,
  }
}
