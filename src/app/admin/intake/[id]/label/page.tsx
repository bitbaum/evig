'use client'

/**
 * Device QR Label — the physical↔digital link of the intake pipeline.
 *
 * A small printable label (62mm label-printer format) applied to the device
 * at capture time. Scanning the QR opens the device's pipeline detail
 * (/admin/intake?detail=<id>), so any workstation — Werkbank, Datenlöschung,
 * QK — jumps straight to the right checklist without searching.
 *
 * German-only by design, like the factsheet: it is a print artifact for the
 * workshop, not a localized UI surface.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Package, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'
import { buildQrImageUrl } from '@/config/integrations'
import { ORG } from '@/config/org'
import { getConditionLabel } from '@/config/erfassung'
import {
  INTAKE_TIER_LABELS,
  QUICK_CAPTURE_LABEL,
  type IntakeTier,
} from '@/config/intake-checklist'
import { PRINT_PREVIEW_SHADOW } from '@/config/ui-colors'
import { formatDateShort } from '@/lib/date-formats'
import { apiFetch } from '@/lib/api/client'

interface LabelData {
  id: string
  item_uuid: string
  brand: string
  product_name: string
  condition: string
  intake_tier: IntakeTier | null
  created_at: string
}

export default function IntakeLabelPage() {
  const params = useParams()
  const inventoryId = params.id as string
  const [device, setDevice] = useState<LabelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDevice() {
      const result = await apiFetch<LabelData>(`/api/admin/intake/${inventoryId}`)
      if (result.success && result.data) {
        setDevice(result.data)
      } else {
        setError(result.error || 'Gerät nicht gefunden')
      }
      setLoading(false)
    }
    if (inventoryId) fetchDevice()
  }, [inventoryId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-raised">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-action border-t-transparent"></div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-raised">
        <div className="text-center">
          <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <Heading level={2} className="text-xl font-semibold text-text-primary">
            {error || 'Gerät nicht gefunden'}
          </Heading>
        </div>
      </div>
    )
  }

  const detailUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${ROUTES.admin.intakeDetail(device.id)}`
  const qrUrl = buildQrImageUrl(detailUrl, 300)
  const deviceName = `${device.brand ?? ''} ${device.product_name ?? ''}`.trim()

  return (
    <>
      {/* Print controls — hidden in print */}
      <div className="print:hidden fixed top-0 left-0 right-0 bg-surface-base border-b border z-50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Link
            href={ROUTES.admin.intakeDetail(device.id)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary min-h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </Link>
          <Button onClick={() => window.print()} variant="primary">
            <Printer className="w-5 h-5" />
            Etikett drucken
          </Button>
        </div>
      </div>

      {/* Label preview */}
      <div className="bg-surface-raised min-h-screen pt-20 pb-8 print:pt-0 print:pb-0 print:bg-surface-base print:min-h-0 flex items-start justify-center">
        <div className="intake-label bg-surface-base flex items-stretch gap-2 p-2 border border print:border-0">
          {/* QR — scanning opens the device's checklist */}
          { }
          <img
            src={qrUrl}
            alt={`QR-Code zu ${device.item_uuid}`}
            className="intake-label-qr shrink-0"
          />
          <div className="flex flex-col justify-between min-w-0 py-0.5">
            <div>
              <div className="font-mono font-bold text-base leading-tight">{device.item_uuid}</div>
              <div className="text-xs leading-snug text-text-primary line-clamp-2">{deviceName || '—'}</div>
            </div>
            <div className="text-[10px] leading-tight text-text-secondary">
              <div>
                {device.intake_tier ? INTAKE_TIER_LABELS[device.intake_tier] : QUICK_CAPTURE_LABEL}
                {' · '}
                {getConditionLabel(device.condition)}
              </div>
              <div>{ORG.name} · {formatDateShort(device.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles — 62mm label-printer format (Brother QL & Co.) */}
      <style jsx global>{`
        .intake-label {
          width: 62mm;
          height: 34mm;
        }
        .intake-label-qr {
          width: 28mm;
          height: 28mm;
          align-self: center;
        }
        @media print {
          @page {
            size: 62mm 34mm;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
        @media screen {
          .intake-label {
            box-shadow: ${PRINT_PREVIEW_SHADOW};
            transform: scale(2);
            transform-origin: top center;
            margin-top: 2rem;
          }
        }
      `}</style>
    </>
  )
}
