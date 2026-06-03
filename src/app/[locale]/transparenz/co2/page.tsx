export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, ExternalLink, Calculator, FileText } from 'lucide-react'
import { ORG } from '@/config/org'
import { ORG_NUMBERS_DEFAULTS } from '@/lib/org-numbers.defaults'
import { CATEGORY_WEIGHT_KG, CATEGORY_CO2_KG_OVERRIDE, estimateCO2Savings, estimateCO2Source } from '@/config/co2-impact'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'

/**
 * /transparenz/co2 — Methodology page for the CO₂ savings estimates.
 *
 * Every CO₂ number on the site (badges, impact stats, donations page)
 * traces back to one of the entries on this page. Show the formula,
 * cite the source for each input, give the last-verified date.
 *
 * The data is read directly from src/lib/org-numbers.defaults.ts —
 * adding a new factor there with citation fields automatically
 * surfaces here. No copy duplication.
 */

export const metadata: Metadata = {
  title: `CO₂-Berechnung & Quellen — Methodik | ${ORG.name}`,
  description: `Wie ${ORG.name} CO₂-Einsparungen schätzt — Formel, Annahmen, Quellen. Transparenz statt Marketing-Zahlen.`,
  openGraph: {
    title: `CO₂-Methodik | ${ORG.name}`,
    description: 'Formel, Annahmen, Quellen für jede CO₂-Zahl auf der Seite.',
    type: 'article',
  },
}

const CO2_NUMBER_KEYS = [
  'co2_factor_per_kg_device',
  'co2_production_new_laptop',
  'co2_refurbishment',
  'co2_savings_per_device',
  'annual_co2_saved_tons',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  '10': 'Laptop',
  '20': 'Desktop-PC',
  '30': 'Monitor',
  '40': 'Tablet',
  '50': 'Smartphone',
  '60': 'Drucker / Scanner',
  '70': 'Komponente',
  '80': 'Peripherie',
  '90': 'Netzwerk-Gerät',
}

export default function Co2MethodologyPage() {
  const numbers = CO2_NUMBER_KEYS
    .map(k => ORG_NUMBERS_DEFAULTS[k])
    .filter(Boolean)

  const mainCategories = Object.entries(CATEGORY_WEIGHT_KG)
    .filter(([k]) => k.length === 2) // only main categories, not sub-IDs
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="min-h-screen">
      <PageHero
        theme="about"
        icon={Leaf}
        title="CO₂-Berechnung & Quellen"
        subtitle="Wir zeigen, woher jede CO₂-Zahl auf dieser Seite stammt. Konservativ gerundet, immer mit verlinkter Quelle. Lieber eine kleinere, ehrliche Zahl als eine grosse, unbelegbare."
      />

      <Section tone="tinted" density="compact">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Die Formel
            </h2>
          </div>
          <div className={cn(designPrimitive.surface.card, 'p-6 font-mono text-sm leading-relaxed')}>
            <p className="text-neutral-900 dark:text-white">
              CO₂-Einsparung pro Gerät = Gerätegewicht (kg) × Emissionsfaktor (kg CO₂e/kg)
            </p>
            <p className="mt-3 text-neutral-600 dark:text-neutral-300">
              Beispiel Laptop: 2,0 kg × 57 kg CO₂e/kg ≈ <strong className="text-neutral-900 dark:text-white">115 kg CO₂e</strong>
            </p>
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 not-italic">
              Schätzung pro Gerät­klasse. Modellgenaue Zahlen (Apple, Dell) sind genauer und
              werden ergänzt, sobald wir die Modell-PCFs der jeweiligen Hersteller in unsere
              Inventarisierung übernehmen.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6">
            Eingangswerte mit Quellen
          </h2>
          <div className="space-y-4">
            {numbers.map(n => (
              <article
                key={n.key}
                className={cn(designPrimitive.surface.card, 'p-5')}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    {n.label}
                  </h3>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                    {n.value}
                  </span>
                </div>
                {n.methodology && (
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                    {n.methodology}
                  </p>
                )}
                {n.calculation && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mb-3">
                    {n.calculation}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-white/[0.04]">
                  {n.sourceDocument && (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{n.sourceDocument}</span>
                    </span>
                  )}
                  {n.externalLink && (
                    <a
                      href={n.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Quelle öffnen <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <span className="ml-auto">Stand: {n.lastVerified}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="tinted" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
            Gewicht pro Geräte­kategorie
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6">
            Diese Durchschnittsgewichte fliessen in die Formel ein. Wir verwenden konservative
            Werte aus öffentlich zugänglichen Produktdaten der häufigsten Modelle.
          </p>
          <div className={cn(designPrimitive.surface.card, 'overflow-hidden')}>
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-white/[0.03] text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Kategorie</th>
                  <th className="px-4 py-3 text-right font-medium">Gewicht</th>
                  <th className="px-4 py-3 text-right font-medium">≈ CO₂ vermieden</th>
                  <th className="px-4 py-3 text-left font-medium">Quelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                {mainCategories.map(([catId, weight]) => {
                  const co2 = estimateCO2Savings(catId) ?? 0
                  const source = estimateCO2Source(catId)
                  const direct = CATEGORY_CO2_KG_OVERRIDE[catId]
                  return (
                    <tr key={catId}>
                      <td className="px-4 py-3 text-neutral-900 dark:text-white">
                        {CATEGORY_LABELS[catId] ?? catId}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                        {weight} kg
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-primary-600 dark:text-primary-400 font-medium">
                        ~{co2} kg
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                        {source === 'direct'
                          ? <span title={`Direkter Studienwert: ${direct} kg`}>Studie (zitiert)</span>
                          : <span title={`Berechnet: ${weight} kg × 57 kg/kg`}>Gewicht × Faktor</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 p-4 border-t border-neutral-100 dark:border-white/[0.04]">
              Bei „Studie (zitiert)" verwenden wir den direkten Wert aus der Eingangs­wert­tabelle oben statt der
              groben Gewicht-mal-Faktor-Schätzung. Sobald wir weitere kategorie­spezifische LCAs (Apple/Dell PER)
              eingepflegt haben, wandern weitere Kategorien hierhin.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
            Grenzen dieser Schätzung
          </h2>
          <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex gap-3">
              <span className="text-primary-600 dark:text-primary-400 flex-shrink-0">•</span>
              <span>
                Die Zahlen umfassen die <strong>Herstellungs-Phase</strong> des Neugeräts
                abzüglich Aufbereitungs-Aufwand. Energie­verbrauch während der Nutzung, Versand
                und End-of-Life sind nicht enthalten.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 dark:text-primary-400 flex-shrink-0">•</span>
              <span>
                Die tatsächliche Einsparung hängt vom <strong>kontrafaktischen Szenario</strong>
                ab: Hätte die Person sonst wirklich ein Neugerät gekauft? Wir gehen davon aus,
                ja — aber das ist nicht jedermanns Realität.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 dark:text-primary-400 flex-shrink-0">•</span>
              <span>
                Strommix­annahme: <strong>Schweizer Stromnetz</strong> (~12 g CO₂e/kWh). In
                Ländern mit kohlelastigem Mix wären die Aufbereitungs-Emissionen höher.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary-600 dark:text-primary-400 flex-shrink-0">•</span>
              <span>
                Wir runden Anzeige-Werte auf 5 kg (unter 100 kg) bzw. 10 kg (darüber) — spurious
                Präzision wie „287,4 kg" suggeriert Genauigkeit, die wir nicht haben.
              </span>
            </li>
          </ul>
        </div>
      </Section>

      <Section tone="tinted" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mb-4">
            Aktualisierung & Mitwirken
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
            Diese Methodik wird laufend aktualisiert. Quellcode der Berechnung und der hier
            verlinkten Daten:
          </p>
          <Link
            href="https://github.com/g-but/revampit/blob/main/src/lib/org-numbers.defaults.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            org-numbers.defaults.ts auf GitHub
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-4">
            Fehler entdeckt oder bessere Quelle bekannt? Eine kurze Mail an{' '}
            <a href="mailto:empfang@revamp-it.ch" className="text-primary-600 dark:text-primary-400 hover:underline">
              empfang@revamp-it.ch
            </a>{' '}
            reicht.
          </p>
        </div>
      </Section>
    </div>
  )
}
