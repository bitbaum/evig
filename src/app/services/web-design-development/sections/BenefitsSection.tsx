import { benefits } from '../data'
import Heading from '@/components/ui/Heading'

export function BenefitsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">Warum unsere Webentwicklungsdienste wählen?</Heading>
          <p className="text-lg text-gray-600">
            Wir kombinieren technisches Fachwissen mit nachhaltigen Praktiken, um Websites zu liefern,
            die hervorragend funktionieren und gleichzeitig Ihre Werte unterstützen.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start">
                <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <div>
                  <Heading level={3} className="mb-3">{benefit.title}</Heading>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
