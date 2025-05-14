import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import { Server, Users, Settings, CheckCircle, Rocket, Phone } from 'lucide-react'
import React from 'react'

const cardClass = 'bg-white rounded-2xl shadow-sm p-8 flex flex-col items-start gap-4 hover:shadow-md transition-shadow duration-300'

export const metadata: Metadata = {
  title: 'LTSP - Linux Terminal Server Project',
  description: 'The Linux Terminal Server Project enables multiple users to work simultaneously on older computers by connecting them to a powerful server, optimizing resource usage and extending hardware lifespan.'
}

export default function LTSPPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <HeroBanner
        title="LTSP - Linux Terminal Server Project"
        description="Extending the life of older computers through server-based computing"
        className="bg-gradient-to-r from-green-600 to-blue-700"
      />

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className={cardClass}>
              <Server className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold">About LTSP</h2>
              <p>
                The Linux Terminal Server Project (LTSP) enables multiple users to work simultaneously on older computers by connecting them to a powerful server. This optimizes resource usage and extends hardware lifespan.
              </p>
            </div>
            <div className={cardClass}>
              <Settings className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold">How It Works</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Applications run on a central server</li>
                <li>Thin clients or old PCs act as terminals</li>
                <li>Efficient resource management</li>
                <li>Consistent user experience</li>
                <li>Minimal requirements for client machines</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className={cardClass}>
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h2 className="text-xl font-semibold">Benefits</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Extend hardware lifespan</li>
                <li>Reduce maintenance costs</li>
                <li>Centralized management & updates</li>
                <li>Improved security</li>
                <li>Lower energy consumption</li>
              </ul>
            </div>
            <div className={cardClass}>
              <Rocket className="w-8 h-8 text-blue-500" />
              <h2 className="text-xl font-semibold">Implementation</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Server setup & configuration</li>
                <li>Client preparation</li>
                <li>Network optimization</li>
                <li>User management & security</li>
                <li>Ongoing support</li>
              </ul>
            </div>
            <div className={cardClass}>
              <Users className="w-8 h-8 text-green-700" />
              <h2 className="text-xl font-semibold">Use Cases</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Schools & education</li>
                <li>Public computer labs</li>
                <li>Businesses</li>
                <li>Community centers</li>
                <li>Non-profits</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className={cardClass}>
              <h2 className="text-xl font-semibold">Get Started</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Assess your infrastructure</li>
                <li>Plan your implementation</li>
                <li>Set up server & clients</li>
                <li>Staff training</li>
                <li>Ongoing support</li>
              </ul>
            </div>
            <div className={cardClass}>
              <Phone className="w-8 h-8 text-blue-700" />
              <h2 className="text-xl font-semibold">Contact Us</h2>
              <p>
                Ready to learn more about how LTSP can benefit your organization? <br />
                <a href="/contact" className="text-blue-700 underline font-medium">Contact us</a> to discuss your needs and how we can help you implement this powerful solution.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 