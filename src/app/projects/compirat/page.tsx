import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Compirat - Computer Literacy with Linux',
  description: 'A joint project by Caritas Zürich and revamp-it, providing computer literacy courses and internet access points for people with low income in the Canton of Zürich.'
}

export default function CompiratPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Compirat"
        description="Computer literacy and Linux education for everyone"
      >
        <div className="flex gap-4 mt-8">
          <Link href="/get-involved/volunteer">
            <Button size="lg" className="bg-white text-green-800 hover:bg-green-50">
              Become a Volunteer
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
            <h2 className="text-4xl font-bold mb-6 text-center">About Compirat</h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              A joint project by Caritas Zürich and revamp-it, providing accessible computer literacy 
              courses and internet access points for people with low income in the Canton of Zürich.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Local Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Computer entry-level courses offered in participants' neighborhoods or nearby locations
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Linux Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Introduction to Linux as the operating system, providing a free and open alternative
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Internet Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Free internet access points with professional supervision for practice and learning
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Our Program</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Entry-Level Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Comprehensive computer literacy courses designed for beginners, focusing on essential skills and Linux basics.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Basic computer operation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Introduction to Linux</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Internet and email basics</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Internet Access Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Supervised practice spaces where participants can apply their skills and access the internet.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Professional supervision</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Free internet access</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Practice and support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Advanced Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Specialized courses for participants who want to deepen their knowledge and skills.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Advanced Linux usage</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Productivity tools</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Digital communication</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Online Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Comprehensive online platform with learning materials and support resources.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Course materials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Linux tutorials</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Practice exercises</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Our Locations</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Wetzikon</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Our first location, established in 2010, offering regular courses and an internet access point.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Zürich</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Regular courses and activities in the city of Zürich, with more locations coming soon.
                  </p>
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
                <h3 className="text-xl font-semibold mb-4">Volunteer</h3>
                <p className="text-gray-600 mb-4 flex-grow">Support courses and internet access points as a volunteer</p>
                <Link href="/get-involved/volunteer" className="block w-full">
                  <Button variant="outline" className="w-full">Join Us</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Learn More</h3>
                <p className="text-gray-600 mb-4 flex-grow">Visit our website for detailed information and resources</p>
                <a href="https://www.compirat.ch" target="_blank" rel="noopener noreferrer" className="block w-full">
                  <Button variant="outline" className="w-full">Visit Compirat.ch</Button>
                </a>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Contact</h3>
                <p className="text-gray-600 mb-4 flex-grow">Get in touch for more information about our programs</p>
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