import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hardware Development',
  description: 'RevampIT\'s hardware development work focuses on discovering new possibilities for decommissioned computer hardware, optimizing energy usage, and creating guides for open source hardware assembly.'
}

export default function HardwarePage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Hardware Development"
        description="Innovative solutions for sustainable computing"
      >
        <div className="flex gap-4 mt-8">
          <Link href="/get-involved/volunteer">
            <Button size="lg" className="bg-white text-green-800 hover:bg-green-50">
              Join Our Projects
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
            <h2 className="text-4xl font-bold mb-6 text-center">About Our Hardware Work</h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              At revamp-it, we focus on finding new applications for decommissioned computer hardware 
              that remains fully functional but is no longer suitable for its original purpose due to 
              technological advancement.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Hardware Repurposing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Finding new functionalities for used electronic components and extending their lifecycle
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Energy Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Developing energy and resource-efficient computing solutions
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-xl">Open Source Guides</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Creating comprehensive guides for open source hardware assembly
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Current Projects */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Current Projects</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">12V Power for Recycled Computers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Developing solutions to replace 220V power supplies with 12V alternatives for use with 
                    renewable energy sources (solar, wind, or pedal power).
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Creating self-build guides for 12V power supplies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Maximizing use of recycled components</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Enabling computer use in areas with limited power infrastructure</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">EPROM Repurposing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Collecting and reprogramming BIOS chips from old motherboards, expansion cards, and printers.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Using EPROM programmer for chip reprogramming</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Implementation in network cards with empty sockets</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Enabling network boot for LTSP clients</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Interested in these chips:</p>
                    <p className="text-sm text-gray-600">27C128, 27C256, 27C512</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Power Supply Repair</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Developing expertise in computer power supply repair and component replacement.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Focus on large, easily replaceable components</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Extending the life of partially damaged power supplies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Creating repair guides and documentation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">LCD Monitor Repair</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Expanding our expertise in repairing flat-screen monitors with minor defects.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Diagnosing and fixing common LCD issues</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Component-level repair techniques</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Documenting successful repair methods</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* SCSI Project */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">SCSI Cable Repurposing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Exploring new applications for SCSI cables and interfaces, which were once the standard 
                  for reliable data transfer in server environments.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Finding new uses for robust SCSI cables</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Developing alternative applications for SCSI interfaces</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Creating documentation for repurposing methods</span>
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
                <h3 className="text-xl font-semibold mb-4">Share Knowledge</h3>
                <p className="text-gray-600 mb-4 flex-grow">Contribute your expertise in hardware repair and optimization</p>
                <Link href="/get-involved/volunteer" className="block w-full">
                  <Button variant="outline" className="w-full">Join Us</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Donate Hardware</h3>
                <p className="text-gray-600 mb-4 flex-grow">Contribute old hardware for our repurposing projects</p>
                <Link href="/get-involved/donate" className="block w-full">
                  <Button variant="outline" className="w-full">Donate</Button>
                </Link>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-semibold mb-4">Collaborate</h3>
                <p className="text-gray-600 mb-4 flex-grow">Work with us on hardware development projects</p>
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