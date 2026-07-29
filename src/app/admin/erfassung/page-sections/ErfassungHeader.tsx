'use client'

// Page header: back link, mode-aware title/subtitle, bulk-mode reset button (extracted verbatim from page.tsx).
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'
import { adminInteractive } from '@/lib/admin-ui'
import type { useErfassungForm } from '@/components/erfassung/useErfassungForm'
import type { BulkProduct } from '@/types/erfassung'

interface ErfassungHeaderProps {
  form: ReturnType<typeof useErfassungForm>
  viewMode: 'single' | 'bulk'
  bulkProducts: BulkProduct[]
  handleBulkReset: () => void
}

export function ErfassungHeader({ form, viewMode, bulkProducts, handleBulkReset }: ErfassungHeaderProps) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Link
        href={ROUTES.admin.intake}
        className={`p-2 sm:p-2 rounded-lg ${adminInteractive.rowHover} touch-manipulation`}
      >
        <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5" />
      </Link>
      <div className="flex-1 min-w-0">
        <Heading level={1} className="text-xl sm:text-2xl font-bold text-text-primary truncate">
          {form.isEditMode ? 'Produkt bearbeiten' : viewMode === 'bulk' ? `Import prüfen (${bulkProducts.length} Produkte)` : 'Produkt aufnehmen'}
        </Heading>
        <p className="text-sm sm:text-base text-text-secondary hidden sm:block">
          {form.isEditMode ? 'Produktdaten aktualisieren' : viewMode === 'bulk' ? 'KI-Ergebnis prüfen und ausgewählte Produkte ins Inventar übernehmen' : 'Daten eingeben, KI-Vorschlag prüfen und den nächsten realen Arbeitsschritt wählen'}
        </p>
      </div>
      {viewMode === 'bulk' && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBulkReset}
          className="text-sm text-text-tertiary hover:text-text-secondary"
        >
          Zurück zur Einzelerfassung
        </Button>
      )}
    </div>
  )
}
