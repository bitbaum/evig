import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Web Design & Development | RevampIT',
  description: 'Professional web design and development services using open source technologies. Modern, responsive websites built with sustainability and performance in mind.',
  openGraph: {
    title: 'Web Design & Development | RevampIT',
    description: 'Professional web design and development services using open source technologies. Modern, responsive websites built with sustainability and performance in mind.',
    type: 'website',
    url: 'https://revampit.org/services/web-design-development',
  },
}

export default function WebDesignDevelopmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 