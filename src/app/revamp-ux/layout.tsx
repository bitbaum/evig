import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Revamp-UX: Kontextuelles Nutzer-Feedback | RevampIT',
  description: 'Revamp-UX ermöglicht es Nutzern, direkt auf jeder Seite kontextuelles Feedback zu geben. Ein integriertes Feedback- und Content-Management-System.',
  keywords: ['Website Feedback', 'User Experience', 'UX Feedback', 'Content Management', 'Community-driven Development', 'Revamp-UX'],
}

export default function RevampUXLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


