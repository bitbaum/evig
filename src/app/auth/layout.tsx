import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | RevampIT',
    default: 'Konto | RevampIT',
  },
  description:
    'Melde dich bei RevampIT an, um Reparaturanfragen zu stellen, auf dem Marktplatz zu handeln und an Workshops teilzunehmen.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
