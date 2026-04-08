import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | RevampIT Projekte',
    default: 'Unsere Projekte | RevampIT'
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