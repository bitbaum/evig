'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  GraduationCap,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { WorkshopProposalForm } from './components/WorkshopProposalForm'
import { responsiveTypography } from '@/lib/responsive'

export default function WorkshopProposalPage() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className={`${responsiveTypography.subsection} font-bold text-gray-900 mb-4`}>
              Anmeldung erforderlich
            </h1>
            <p className="text-gray-600 mb-6">
              Bitte melden Sie sich an, um einen Workshop vorzuschlagen.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <GraduationCap className="w-8 h-8 text-green-600" />
            </div>
            <h1 className={`${responsiveTypography.section} font-bold text-gray-900 mb-2`}>
              Workshop vorschlagen
            </h1>
            <p className="text-gray-600">
              Schlagen Sie einen neuen Workshop vor und teilen Sie Ihr Wissen mit der Community
            </p>
          </div>
        </div>

        <WorkshopProposalForm />
      </div>
    </div>
  )
}
