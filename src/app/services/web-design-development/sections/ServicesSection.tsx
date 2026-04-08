import { CheckCircle2 } from 'lucide-react'
import { services } from '../data'
import Heading from '@/components/ui/Heading'

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">Unsere Webentwicklungsdienste</Heading>
          <p className="text-lg text-gray-600 mb-4">
            Umfassende Weblösungen, die mit Open-Source-Technologien und nachhaltigen Praktiken erstellt werden.
          </p>
          <div className="text-green-600 font-semibold text-xl mb-8">
            Professionelle Webentwicklung ab CHF 70/Stunde
          </div>
          <div className="bg-green-50 rounded-lg p-6 text-left">
            <Heading level={3} className="text-green-800 mb-2">Kostenlose Erstberatung</Heading>
            <p className="text-green-700">
              Wir beginnen jedes Projekt mit einer umfassenden Beratung, um Ihre Bedürfnisse,
              Ziele und technischen Anforderungen zu verstehen. Dies hilft uns, genaue Schätzungen zu liefern und
              sicherzustellen, dass wir die richtige Lösung für Ihr Projekt sind.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start mb-6">
                <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                  <service.icon className="w-8 h-8" />
                </div>
                <div>
                  <Heading level={3} className="mb-3">{service.title}</Heading>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {service.features.map((feature, i) => (
                  <div key={i} className="flex items-center text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
