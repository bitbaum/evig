import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareButton } from '@/components/ui/share-button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Verein Linuxola',
  description: 'Linuxola is a Swiss organization dedicated to providing access to information technology and connecting African partners to the global digital commons.'
}

export default function LinuxolaPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Verein Linuxola"
        description="Bridging the digital divide between Switzerland and Africa"
      >
        <div className="flex gap-4 mt-8">
          <Link href="/get-involved/donate">
            <Button size="lg" className="bg-white text-green-800 hover:bg-green-50">
              Donate Equipment
            </Button>
          </Link>
          <Link href="/get-involved/volunteer">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Volunteer
            </Button>
          </Link>
        </div>
      </HeroBanner>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">About Linuxola</h2>
            <p className="text-xl text-gray-600">
              Verein Linuxola was founded on December 2, 2005 by eight people from different 
              regions of Switzerland. The purpose of the organization is to provide access to 
              information technology and a connection to the global digital commons for our 
              partners in Africa.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Impact Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Providing access to technology and training</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Supporting sustainable IT infrastructure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Promoting open source solutions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Building long-term partnerships</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Our Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Established computer labs in schools and communities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Trained local IT professionals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Implemented sustainable technology solutions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Created lasting partnerships with African organizations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Equipment Needs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Equipment We Need</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Computers & Laptops</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Laptops (3-5 years old)</li>
                    <li>• Desktop PCs</li>
                    <li>• Monitors</li>
                    <li>• Keyboards & Mice</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Networking</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Network Switches</li>
                    <li>• Wireless Routers</li>
                    <li>• Network Cables</li>
                    <li>• UPS Systems</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Accessories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• USB Drives</li>
                    <li>• External Hard Drives</li>
                    <li>• Power Supplies</li>
                    <li>• RAM Modules</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Get Involved Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Get Involved</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Donate Equipment</h3>
                <p className="text-gray-600 mb-4 flex-grow">Your used IT equipment can make a real difference in African communities</p>
                <Link href="/get-involved/donate" className="block w-full">
                  <Button variant="outline" className="w-full">Donate Now</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Volunteer</h3>
                <p className="text-gray-600 mb-4 flex-grow">Share your technical expertise and help set up computer labs</p>
                <Link href="/get-involved/volunteer" className="block w-full">
                  <Button variant="outline" className="w-full">Join Us</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Spread the Word</h3>
                <p className="text-gray-600 mb-4 flex-grow">Help us reach more potential donors and volunteers</p>
                <ShareButton 
                  className="w-full"
                  text="Support Linuxola in bridging the digital divide between Switzerland and Africa! Learn more about their mission and how you can help."
                  url="https://revampit.ch/projects/linuxola"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Join Our Mission</h2>
            <p className="text-xl mb-8">
              Whether you have equipment to donate, technical skills to share, or want to support our cause in another way, 
              we'd love to hear from you. Together, we can bridge the digital divide.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/contact">
                <Button variant="secondary" size="lg">
                  Contact Us
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 