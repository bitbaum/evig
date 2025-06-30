import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI-Powered Sustainable Computer Builds | RevampIT',
  description: 'Revolutionary AI system that scans global inventory networks to build custom computers using primarily used and refurbished components. 100% sustainable builds with global parts sourcing.',
  keywords: [
    'sustainable computer build',
    'AI computer builder',
    'used computer parts',
    'refurbished computer components',
    'custom PC build service',
    'green computing',
    'circular economy computing',
    'eco-friendly computer build',
    'global inventory network',
    'computer recycling zurich'
  ],
  openGraph: {
    title: 'AI-Powered Sustainable Computer Builds | RevampIT',
    description: 'Revolutionary AI system that builds custom computers using primarily used and refurbished components from our global network. Try our interactive build tool demo.',
    type: 'website',
    url: 'https://revampit.org/services/build-your-computer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Powered Sustainable Computer Builds | RevampIT',
    description: 'Revolutionary AI system that builds custom computers using primarily used and refurbished components. Try our interactive build tool demo.',
  }
}

export default function BuildComputerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 