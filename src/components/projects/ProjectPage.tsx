import { ProjectHero } from './ProjectHero'
import { ProjectSection } from './ProjectSection'
import { ProjectCallToAction } from './ProjectCallToAction'
import type { ProjectPageConfig } from './types'

interface ProjectPageProps {
  config: ProjectPageConfig
}

export function ProjectPage({ config }: ProjectPageProps) {
  // The locale layout's <MainLayout> already provides a single <main>; we
  // emit a plain <div> here to avoid nested-main invalid HTML / a11y issues.
  return (
    <div className="min-h-screen">
      {config.hero && <ProjectHero hero={config.hero} />}

      {config.sections.map((section, i) => (
        <ProjectSection key={i} section={section} />
      ))}

      {config.cta && <ProjectCallToAction cta={config.cta} />}
    </div>
  )
}

export function generateProjectMetadata(config: ProjectPageConfig) {
  return {
    title: config.metadata.title,
    description: config.metadata.description,
  }
}
