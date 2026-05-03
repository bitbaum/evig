import { Metadata } from 'next'
import { PackageCheck } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import IntakeClient from './IntakeClient'

export const metadata: Metadata = {
  title: 'Geräte-Eingang',
  description: 'Geräte erfassen, prüfen und für den Verkauf freigeben.',
}

export default function IntakePage() {
  return (
    <AdminPageWrapper
      title="Geräte-Eingang"
      description="Geräte erfassen, prüfen und freigeben"
      icon={PackageCheck}
      iconColor="blue"
    >
      <IntakeClient />
    </AdminPageWrapper>
  )
}
