import { Metadata } from 'next'
import Image from 'next/image'
import { HeroBanner } from '@/components/ui/hero-banner'

export const metadata: Metadata = {
  title: 'About Us - RevampIT',
  description: 'Learn about our mission to extend the life of IT devices and promote sustainable computing practices.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Extending the Life of Technology"
        description="For 15 years, we've been fighting against the premature retirement of computers and promoting sustainable IT practices."
      />

      {/* Mission Section */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <div className="space-y-6">
            <p className="text-lg">
              At RevampIT, we believe in "Retirement Age 10 for Laptops!" We're a non-profit organization that has been transforming the way people think about technology since 2009. Our mission is simple but powerful: extend the life of IT devices and reduce electronic waste through repair, refurbishment, and sustainable practices.
            </p>
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden my-8">
              <Image
                src="/images/storefront.png"
                alt="RevampIT storefront with large windows displaying computers and equipment"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
            <p className="text-lg">
              Operating from our unique space in a former bank building, we've created a community hub where technology meets sustainability. Our approach combines hardware recycling with open-source software solutions, creating a holistic approach to sustainable computing that benefits both people and the planet.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Areas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Hardware Recycling</h3>
              <p className="text-lg">
                We repair and refurbish IT devices of all ages, giving them a second life and reducing electronic waste. From 11-year-old MacBooks to vintage computers, we believe every device deserves a chance to continue serving its purpose. Our repair services help keep technology out of landfills and in the hands of those who need it.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Open Source Software</h3>
              <p className="text-lg">
                We're strong advocates for Linux and other open-source solutions. These technologies not only keep older devices running efficiently but also provide security advantages by giving users control over their systems. Our regular workshops help people learn how to use these powerful tools effectively.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Community Impact</h3>
              <p className="text-lg">
                We create meaningful employment opportunities for those who might struggle in traditional job markets. Our innovative barter system allows people to exchange services (like haircuts) for technology, making computing accessible to everyone. We also provide hosting and cloud services for Swiss SMEs who want to keep their data in Switzerland.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">By the Numbers</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Environmental Impact</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">5+</p>
                  <p className="text-gray-600">Years average device lifespan extension through our refurbishment program</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">1000+</p>
                  <p className="text-gray-600">Devices saved from landfills annually through repair and refurbishment</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">75%</p>
                  <p className="text-gray-600">Of donated equipment successfully refurbished and given a second life</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Community Impact</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">20+</p>
                  <p className="text-gray-600">People trained in open source and sustainable technology annually</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">90%</p>
                  <p className="text-gray-600">Of interns successfully transition to tech careers or further education</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-green-700 mb-2">10+</p>
                  <p className="text-gray-600">Successful work reintegration cases through our program</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold">Our Story</h2>
          <div className="space-y-6 text-lg">
            <p>
              Founded in 2009, RevampIT started as a small repair shop with a big vision. What began as a simple idea - extending the life of technology - has grown into a movement that's changing how people think about their devices.
            </p>
            <p>
              Today, our team of 20 dedicated individuals works together to promote sustainable IT practices. We've become a trusted resource for both individuals and businesses looking to reduce their environmental impact while maintaining access to reliable technology.
            </p>
            <p>
              Our commitment to sustainability goes beyond just repairing devices. We're actively involved in climate demonstrations, sharing knowledge about sustainable digital alternatives, and working to change the conversation around technology consumption.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-xl mb-8">
            Whether you need a device repaired, want to learn about sustainable computing, or wish to support our cause, we welcome you to be part of our community. Together, we can make technology more sustainable and accessible for everyone.
          </p>
          <a
            href="/get-involved"
            className="inline-block bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Involved
          </a>
        </div>
      </section>
    </main>
  )
} 