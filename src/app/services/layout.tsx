import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Computer Repair & IT Services | RevampIT',
  description: 'Professional computer repair, web development, data recovery, Linux support, and hardware recycling services. Affordable and eco-friendly solutions for your tech needs.',
  openGraph: {
    title: 'Computer Repair & IT Services | RevampIT',
    description: 'Professional computer repair, web development, data recovery, Linux support, and hardware recycling services. Affordable and eco-friendly solutions for your tech needs.',
    type: 'website',
    url: 'https://revampit.org/services',
  },
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 