import { Metadata } from 'next'
import { 
  Award,
  Shield,
  Sparkles,
  Recycle,
  Star,
  CheckCircle2,
  Leaf,
  ArrowRight,
  Globe,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'REVAMPED Zertifizierung | Nachhaltige Computer-Builds | RevampIT',
  description: 'Erfahren Sie mehr über unsere exklusive REVAMPED-Zertifizierung - die Nachhaltigkeit, Qualität und Leistung in jedem Computer garantiert, den wir bauen.',
  keywords: [
    'REVAMPED Zertifizierung',
    'nachhaltige Computer-Zertifizierung',
    'Green Computing Label',
    'umweltfreundlicher Computer-Bau',
    'Computer-Nachhaltigkeitsbewertung',
    'Kreislaufwirtschaft Computing',
    'aufgearbeitete Computer-Zertifizierung',
    'Qualität gebrauchter Computerteile',
    'Umwelt-Computer-Standards',
    'nachhaltige Technologie-Zertifizierung'
  ],
  openGraph: {
    title: 'REVAMPED Zertifizierung | Nachhaltige Computer-Builds | RevampIT',
    description: 'Entdecken Sie unsere exklusive REVAMPED-Zertifizierung - eine Garantie für Nachhaltigkeit, Qualität und Leistung, die einen neuen Standard in der Computerbranche setzt.',
    type: 'website',
    url: 'https://revampit.org/revamped'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REVAMPED Zertifizierung | Nachhaltige Computer-Builds',
    description: 'Der neue Standard im nachhaltigen Computing - REVAMPED-zertifizierte Computer.'
  }
}

export default function RevampedPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-green-600/30 px-6 py-3 rounded-full mb-6">
              <Award className="w-8 h-8 text-green-200 mr-3" />
              <span className="text-2xl font-bold text-white">REVAMPED</span>
              <Sparkles className="w-6 h-6 text-green-200 ml-2" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Die REVAMPED-Zertifizierung
            </h1>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              Jeder Computer, den wir bauen, erhält unser exklusives "REVAMPED"-Label - eine Garantie für Nachhaltigkeit, Qualität und Leistung, die einen neuen Standard in der Branche setzt.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center bg-green-600/30 px-4 py-2 rounded-full">
                <Recycle className="w-4 h-4 mr-2" />
Nachhaltigkeitsfokus
              </div>
              <div className="flex items-center bg-green-600/30 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4 mr-2" />
Qualitätsgarantie
              </div>
              <div className="flex items-center bg-green-600/30 px-4 py-2 rounded-full">
                <Star className="w-4 h-4 mr-2" />
KI-optimierte Builds
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image with Real Revamped Laptop */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Echte REVAMPED-Computer im Einsatz
                  </h2>
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Nachhaltige Technologie, die Menschen gerne verwenden. Unsere REVAMPED-Zertifizierung ist nicht nur ein Versprechen - sie ist ein sichtbares Bekenntnis zu Qualität und Umweltverantwortung.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                    <span className="text-lg">Hauptsächlich gebrauchte und aufgearbeitete Komponenten</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                    <span className="text-lg">Erhebliche Reduzierung der Umweltauswirkungen</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                    <span className="text-lg">Qualitätsgarantie auf jeden Build</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                    <span className="text-lg">Physischer Zertifizierungs-Aufkleber inbegriffen</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/services/build-your-computer"
                    className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Ihren Computer bauen
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <a
                    href="#certificate"
                    className="inline-block border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                  >
Mehr über Zertifizierung erfahren
                  </a>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/images/certification/revamped-laptop-user.jpg" 
                    alt="Woman with pink hair using a laptop with REVAMPED certification sticker"
                    className="w-full h-auto object-cover"
                  />
                  {/* Small badge in top corner - away from sticker area */}
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      REVAMPED
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Revamped Means */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Was "REVAMPED" bedeutet</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Unsere Zertifizierung ist nicht nur ein Label - es ist ein umfassender Standard, der sicherstellt, dass jeder Computer unsere strengen Kriterien für Nachhaltigkeit, Qualität und Leistung erfüllt.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <Recycle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Nachhaltigkeit zuerst</h3>
                <p className="text-gray-600 leading-relaxed">
                  Wir priorisieren gebrauchte und aufgearbeitete Komponenten wo immer möglich und reduzieren so die Umweltauswirkungen drastisch, während wir die Spitzenleistung beibehalten. Wir befolgen Kreislaufwirtschaftsprinzipien in jedem Build.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Qualität garantiert</h3>
                <p className="text-gray-600 leading-relaxed">
                  Jede Komponente wird gründlich getestet, gereinigt und verifiziert, um unsere strengen Leistungs- und Zuverlässigkeitsstandards zu erfüllen. Qualität wird niemals für Nachhaltigkeit kompromittiert.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
                  <Star className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">KI-optimiert</h3>
                <p className="text-gray-600 leading-relaxed">
                  Unsere KI gewährleistet perfekte Komponentenkompatibilität und optimale Leistungsabstimmung für Ihren spezifischen Anwendungsfall. Jeder Build ist intelligent für Ihre Bedürfnisse konzipiert.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate of Authenticity */}
      <section id="certificate" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Echtheitszertifikat</h2>
                <p className="text-xl text-gray-600 mb-8">
                  Jeder REVAMPED-Computer wird mit einem detaillierten Zertifikat geliefert, das vollständige Transparenz über Ihren nachhaltigen Build bietet.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Nachhaltigkeitsbewertungen der Komponenten</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Eingesparte CO₂-Emissionen gegenüber Neubau</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Herkunft und Zustand der Komponenten</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Leistungs-Benchmarks</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    <span className="text-lg">Details zur Garantieabdeckung</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-12 rounded-2xl">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg mb-6">
                    <div className="text-center">
                      <Award className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-green-800">REVAMPED</div>
                      <div className="text-xs text-gray-600">CERTIFIED</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Digital & physisch</h3>
                  <p className="text-gray-600">
                    Ihr Zertifikat umfasst sowohl einen physischen Aufkleber als auch einen digitalen QR-Code für sofortige Verifizierung und detaillierte Komponenteninformationen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticker Gallery */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Die REVAMPED-Label-Kollektion</h2>
              <p className="text-xl text-gray-600">
                Jedes Design repräsentiert unser Engagement für nachhaltiges Computing und Qualitätssicherung.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white p-12 rounded-2xl shadow-lg mb-6">
                  <img 
                    src="/images/certification/sticker-1.png" 
                    alt="REVAMPED certification sticker design"
                    className="w-40 h-40 mx-auto object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">Original-Design</h3>
                <p className="text-gray-600">Saubere, professionelle Zertifizierungsmarke, die unseren laptop-fokussierten Nachhaltigkeitsansatz betont</p>
              </div>
              <div className="text-center">
                <div className="bg-white p-12 rounded-2xl shadow-lg mb-6">
                  <img 
                    src="/images/certification/sticker-2.png" 
                    alt="REVAMPED certification sticker variant"
                    className="w-40 h-40 mx-auto object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">Öko-Variante</h3>
                <p className="text-gray-600">Erweitertes Design, das unseren Umweltfokus und Kreislaufwirtschaftsprinzipien betont</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-green-100 to-blue-100 p-12 rounded-2xl shadow-lg mb-6 relative">
                  <div className="w-40 h-40 mx-auto flex items-center justify-center bg-white rounded-xl shadow-sm">
                    <div className="text-center">
                      <Award className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-bold text-green-800">REVAMPED</div>
                      <div className="text-xs text-gray-600">CERTIFIED</div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full">NEW</div>
                </div>
                <h3 className="text-xl font-bold mb-2">Digitales Zertifikat</h3>
                <p className="text-gray-600">QR-Code-verknüpftes Verifizierungssystem mit Blockchain-gestützten Authentizitätsaufzeichnungen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Schliessen Sie sich der REVAMPED-Revolution an</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Wenn Sie einen REVAMPED-Computer wählen, erhalten Sie nicht nur eine grossartige Maschine - Sie setzen ein Statement über die Zukunft der Technologie. Nachhaltig, leistungsstark und mit einem Zweck gebaut.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services/build-your-computer"
                className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 text-lg"
              >
                Ihren REVAMPED-Build starten
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/contact"
                className="inline-block border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
Mehr über Zertifizierung erfahren
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 