import Link from 'next/link'
import { Wrench, GraduationCap } from 'lucide-react'
import { type OSSAlternative } from '@/config/open-source-registry'

interface RevampITServicesCTAProps {
  alternative: OSSAlternative
}

export function RevampITServicesCTA({ alternative }: RevampITServicesCTAProps) {
  const services = alternative.revampitServices
  if (!services) return null

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
      <h3 className="text-base font-bold text-blue-900 mb-3">
        Wir helfen beim Umstieg
      </h3>

      {services.itHilfeNote && (
        <div className="flex items-start gap-3 mb-3">
          <Wrench className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">{services.itHilfeNote}</p>
            <Link
              href="/services/it-hilfe"
              className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
            >
              IT-Hilfe anfragen
            </Link>
          </div>
        </div>
      )}

      {services.workshopSlug && (
        <div className="flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">Passender Workshop verfügbar</p>
            <Link
              href={`/workshops/${services.workshopSlug}`}
              className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
            >
              Workshop ansehen
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
