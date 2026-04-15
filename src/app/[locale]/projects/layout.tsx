import { Metadata } from 'next'
import { ORG } from '@/config/org'

export const metadata: Metadata = {
  title: {
    template: `%s | ${ORG.name} Projekte`,
    default: `Unsere Projekte | ${ORG.name}`
  },
  description: 'Entdecke unser vielfältiges Spektrum an Projekten, von Open-Source-Beiträgen bis hin zu Gemeinschaftsinitiativen und Hardware-Entwicklung.'
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