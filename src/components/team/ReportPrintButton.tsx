'use client'

import { useTranslations } from 'next-intl'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Print-to-PDF button for the Monatsrapport. Neutral location so both the admin
 * report page and the public share page (/r/[token]) can use it without a
 * cross-import from app/admin/*.
 */
export function ReportPrintButton() {
  const t = useTranslations('admin.timecards')
  return (
    <Button type="button" variant="primary" size="sm" onClick={() => window.print()} className="gap-1.5 print:hidden">
      <Printer className="h-4 w-4" aria-hidden="true" />
      {t('reportPrint')}
    </Button>
  )
}
