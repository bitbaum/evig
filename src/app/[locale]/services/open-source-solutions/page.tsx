import { Metadata } from 'next'
import { Code2 } from 'lucide-react'
import { ORG } from '@/config/org'
import { PageHero } from '@/components/layout/PageHero'
import { RegistrySearch } from './components/RegistrySearch'
import {
  getAllAlternatives,
  getAllCategories,
  getAllProprietaryApps,
} from '@/config/open-source-registry'

export const metadata: Metadata = {
  title: `Open-Source-Alternativen | ${ORG.name}`,
  description: `Finde die beste Open-Source-Alternative zu proprietärer Software. Ehrliche Bewertungen, Migrations-Tipps und Unterstützung durch ${ORG.name}.`,
  keywords: [
    'open source alternativen',
    'open source software',
    'kostenlose software',
    'photoshop alternative',
    'microsoft office alternative',
    'linux',
  ],
}

export default function OpenSourceSolutionsPage() {
  const alternatives = getAllAlternatives()
  const categories = getAllCategories()
  const proprietaryApps = getAllProprietaryApps()

  return (
    <main>
      <PageHero
        theme="services"
        icon={Code2}
        title="Open-Source-Alternativen"
        subtitle="Finde die beste freie Alternative zu proprietärer Software — mit ehrlichen Bewertungen und Migrations-Tipps."
      />

      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-10 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">{alternatives.length}</p>
              <p className="text-sm text-gray-500">Open-Source-Alternativen</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{proprietaryApps.length}</p>
              <p className="text-sm text-gray-500">Proprietäre Programme</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-sm text-gray-500">Kategorien</p>
            </div>
          </div>

          <RegistrySearch alternatives={alternatives} categories={categories} />
        </div>
      </section>
    </main>
  )
}
