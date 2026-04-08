import { whyOpenSource } from '../data'
import Heading from '@/components/ui/Heading'

export function WhyOpenSourceSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">Warum diese Werte wichtig sind</Heading>
          <p className="text-lg text-gray-600">
            In einer Ära zunehmender digitaler Überwachung und Plattformmonopole
            sind diese Prinzipien nicht nur &ldquo;nice-to-haves&rdquo; &ndash; sie sind für die digitale Freiheit und Unabhängigkeit unerlässlich.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {whyOpenSource.map((reason, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                  <reason.icon className="w-6 h-6" />
                </div>
                <Heading level={3} className="">{reason.title}</Heading>
              </div>
              <p className="text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
