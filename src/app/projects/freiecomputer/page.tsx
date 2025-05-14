import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FreieComputer.ch - Swiss Label for Free Software',
  description: 'The Swiss label for computers with pre-installed free software and guaranteed support. Promoting freedom of choice in computing since 2010.'
}

export default function FreieComputerPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="FreieComputer.ch"
        description="The Swiss label for computers with pre-installed free software and guaranteed support"
      >
        <div className="flex gap-4 mt-8">
          <Link href="/get-involved/volunteer">
            <Button size="lg" className="bg-white text-green-800 hover:bg-green-50">
              Join Our Mission
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Contact Us
            </Button>
          </Link>
        </div>
      </HeroBanner>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-center">About FreieComputer.ch</h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              Together with dedicated people from the Open Source community, revamp-it has helped establish 
              this label to promote freedom of choice in computing and support retailers who sell computers 
              with pre-installed free software.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Free Software</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Computers with pre-installed Linux and other free software alternatives
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Guaranteed Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Transparent support services with clear cost information at purchase
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Community Driven</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    A non-profit association supported by the Open Source community
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Our Mission</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Breaking the Monopoly</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Challenging the dominance of proprietary operating systems by providing accessible alternatives.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Promoting Linux and free software</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Supporting independent retailers</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Creating awareness of alternatives</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Consumer Choice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Making it easier for consumers to access computers with free software.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Pre-installed free software</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Transparent support options</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Clear cost information</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Support Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Ensuring a smooth transition to free software with comprehensive support.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Guaranteed support packages</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Transparent pricing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Professional assistance</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Community Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Building a community dedicated to promoting free software in Switzerland.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Open Source collaboration</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Knowledge sharing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Community support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Our History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Since the launch of FreieComputer.ch in 2010, revamp-it has been offering certified computers 
                  for sale under the label. We continue to work with dedicated individuals from the Open Source 
                  community to make the label more widely known and accessible.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Established in 2010</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Non-profit association structure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Ongoing community development</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
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
                <h3 className="text-xl font-semibold mb-4">Join Us</h3>
                <p className="text-gray-600 mb-4 flex-grow">Help make the label more widely known and accessible</p>
                <Link href="/get-involved/volunteer" className="block w-full">
                  <Button variant="outline" className="w-full">Volunteer</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Learn More</h3>
                <p className="text-gray-600 mb-4 flex-grow">Visit our website for detailed information about the label</p>
                <a href="https://www.freiecomputer.ch" target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button variant="outline" className="w-full">Visit FreieComputer.ch</Button>
                </a>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Contact</h3>
                <p className="text-gray-600 mb-4 flex-grow">Get in touch to learn more about our initiative</p>
                <Link href="/contact" className="block w-full">
                  <Button variant="outline" className="w-full">Contact Us</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 