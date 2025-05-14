import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kivitendo Modus CH - Swiss ERP Solution',
  description: 'Kivitendo is the unique Open Source CRM & ERP that meets the highest quality standards through constant personalized development.'
}

export default function KivitendoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 