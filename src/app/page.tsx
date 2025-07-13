import { ArrowRight, Leaf, Recycle, Users, Code } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const features = [
    {
      name: 'Nachhaltige Lösungen',
      description: 'Wir bieten umweltfreundliche Technologielösungen, die helfen, Elektroschrott zu reduzieren.',
      icon: Leaf,
    },
    {
      name: 'Gemeinschaft im Fokus',
      description: 'Werde Teil unserer Freiwilligen-Community und bewirke etwas Gutes.',
      icon: Users,
    },
    {
      name: 'Kreislaufwirtschaft',
      description: 'Wir geben Technik ein zweites Leben durch Wiederaufbereitung und Recycling.',
      icon: Recycle,
    },
    {
      name: 'Open Source',
      description: 'Wir setzen auf Open Source und teilen Wissen und Lösungen mit der Gemeinschaft.',
      icon: Code,
    },
  ]

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Technik ein zweites Leben geben
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Wir bereiten Computer und Geräte wieder auf, recyceln und verteilen sie neu – für eine nachhaltigere Zukunft. Mach mit bei unserer Mission, Elektroschrott zu reduzieren und Technik für alle zugänglich zu machen.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="https://www.revamp-it.ch/index.php/de/shop-de"
                className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                Zum Shop
              </Link>
              <Link href="/services" className="text-sm font-semibold leading-6 text-gray-900">
                Unsere Dienstleistungen <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-green-600">Unsere Mission</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Gemeinschaft stärken durch nachhaltige Technologie
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Wir setzen uns dafür ein, Elektroschrott zu reduzieren und Technik für alle zugänglich zu machen.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-green-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* CTA section */}
      <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Bereit, einen Unterschied zu machen?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Werde Teil unserer Freiwilligen-Community und hilf mit, eine nachhaltigere Zukunft durch Technik zu gestalten.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/get-involved"
              className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Mitmachen
            </Link>
            <Link href="/about" className="text-sm font-semibold leading-6 text-gray-900">
              Mehr erfahren <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
