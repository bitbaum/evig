/**
 * CTASection Component
 * 
 * Reusable CTA section for open-source solutions page
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Created reusable CTA section component
 */

import Link from 'next/link'
import { getTextColor, getButtonVariant } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import { ORG } from '@/config/org'

export function CTASection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-r from-primary-700 to-primary-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Bereit für Open Source?</h2>
        <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto text-white/90">
          Schliessen Sie sich Tausenden von Einzelpersonen und Unternehmen an, die erfolgreich auf Open-Source-Lösungen umgestiegen sind.
          Unser Expertenteam ist bereit, Ihnen beim Wechsel zu helfen.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className={cn(
              'inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold transition-colors duration-300 text-base sm:text-lg min-h-[touch] touch-target',
              'bg-white text-primary-800 hover:bg-primary-50'
            )}
          >
            Starten Sie noch heute
          </Link>
          <Link
            href="/services"
            className={cn(
              'inline-block border-2 border-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold transition-colors duration-300 text-base sm:text-lg min-h-[touch] touch-target',
              'text-white hover:bg-white/10'
            )}
          >
            Alle Dienstleistungen entdecken
          </Link>
        </div>
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 sm:mb-8">Warum {ORG.name} wählen?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 rounded-lg p-4 sm:p-6 border-2 border-white/20">
              <h4 className={cn('text-lg sm:text-xl font-semibold mb-2', 'text-white')}>Expertenberatung</h4>
              <p className="text-white/90 text-sm sm:text-base">Professionelle Unterstützung für Ihre Open-Source-Reise</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 sm:p-6 border-2 border-white/20">
              <h4 className={cn('text-lg sm:text-xl font-semibold mb-2', 'text-white')}>Massgeschneiderte Lösungen</h4>
              <p className="text-white/90 text-sm sm:text-base">Zugeschnitten auf Ihre spezifischen Bedürfnisse und Anforderungen</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 sm:p-6 border-2 border-white/20">
              <h4 className={cn('text-lg sm:text-xl font-semibold mb-2', 'text-white')}>Laufender Support</h4>
              <p className="text-white/90 text-sm sm:text-base">Kontinuierliche Unterstützung und Wartung</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}



