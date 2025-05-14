import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | RevampIT Projects',
    default: 'Projects | RevampIT'
  },
  description: 'Discover our diverse range of projects from open-source contributions to community initiatives and hardware development.'
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
} 