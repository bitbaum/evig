import {
  Code,
  Globe,
  Shield,
  Zap,
  Users,
  Monitor,
  Heart,
  Database,
} from 'lucide-react'

const coreValues = [
  { icon: Code, title: 'Open Source', description: 'Transparenter, überprüfbarer Code, den Sie vollständig einsehen, ändern und besitzen können. Keine proprietären Black Boxes oder Anbieterbindungen.', borderColor: 'border-green-500', bgColor: 'bg-green-100', iconColor: 'text-green-600', titleColor: 'text-green-800' },
  { icon: Globe, title: 'Dezentralisierung', description: 'Befreien Sie sich von Big-Tech-Plattformen. Hosten Sie Ihre Website überall, bewahren Sie Ihre Unabhängigkeit und vermeiden Sie einzelne Ausfallpunkte.', borderColor: 'border-blue-500', bgColor: 'bg-blue-100', iconColor: 'text-blue-600', titleColor: 'text-blue-800' },
  { icon: Shield, title: 'Datenschutz zuerst', description: 'Minimales Tracking, sichere Authentifizierung und transparente Datenverarbeitung. Die Privatsphäre Ihrer Benutzer wird durch Design geschützt, nicht als nachträglicher Gedanke.', borderColor: 'border-purple-500', bgColor: 'bg-purple-100', iconColor: 'text-purple-600', titleColor: 'text-purple-800' },
  { icon: Database, title: 'Besitzen Sie Ihre Daten', description: 'Ihre Daten gehören Ihnen, nicht den Tech-Giganten. Volle Kontrolle darüber, wo sie gespeichert werden, wie sie verwendet werden und wer darauf zugreift.', borderColor: 'border-orange-500', bgColor: 'bg-orange-100', iconColor: 'text-orange-600', titleColor: 'text-orange-800' },
  { icon: Heart, title: 'Besitzen Sie Ihren Code', description: 'Vollständiges Eigentum am Quellcode Ihrer Website. Ändern, erweitern oder migrieren Sie jederzeit ohne Einschränkungen oder Lizenzgebühren.', borderColor: 'border-teal-500', bgColor: 'bg-teal-100', iconColor: 'text-teal-600', titleColor: 'text-teal-800' },
  { icon: Zap, title: 'Maximale Automatisierung', description: 'Nahtlose automatisierte Arbeitsabläufe, die den manuellen Aufwand minimieren und gleichzeitig alle unsere Grundprinzipien beibehalten. 100% Automatisierung ist unser Ziel.', borderColor: 'border-rose-500', bgColor: 'bg-rose-100', iconColor: 'text-rose-600', titleColor: 'text-rose-800' },
  { icon: Users, title: 'Benutzererfahrung', description: 'Intuitive Benutzeroberflächen, die von den Benutzern nur minimalen Aufwand erfordern und gleichzeitig maximale Funktionalität und Produktivität bieten.', borderColor: 'border-indigo-500', bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600', titleColor: 'text-indigo-800' },
  { icon: Monitor, title: 'Entwicklererfahrung', description: 'Sauberer, wartbarer Code mit ausgezeichneten Tools und Dokumentationen, die die Entwicklung und Wartung zu einem Vergnügen machen.', borderColor: 'border-cyan-500', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600', titleColor: 'text-cyan-800' },
]

export function ValuesSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Unsere Grundwerte</h2>
          <p className="text-xl text-gray-600 mb-8">
            Jede von uns erstellte Website dient einem ultimativen Ziel: <strong>Ihrer Freiheit</strong>. Jedes Prinzip arbeitet zusammen, um Anstrengung von Notwendigkeit in Wahl zu verwandeln.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((value, index) => (
            <div key={index} className={`bg-white rounded-xl p-6 shadow-xl border-l-4 ${value.borderColor} hover:shadow-2xl transition-shadow duration-300`}>
              <div className="text-center">
                <div className={`w-14 h-14 ${value.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <value.icon className={`w-7 h-7 ${value.iconColor}`} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${value.titleColor}`}>{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
