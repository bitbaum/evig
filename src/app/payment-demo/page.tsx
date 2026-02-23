'use client'

import { Suspense } from 'react'
import { logger } from '@/lib/logger'
import { ServiceBookingPayment } from '@/components/payments/service-booking'

export default function PaymentDemoPage() {
  // Mock service data for demonstration
  const mockService = {
    id: '1',
    slug: 'macbook-repair',
    name: 'MacBook Reparatur',
    price_cents: 15000, // CHF 150.00
    requires_approval: false
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            RevampIT Payment Integration Demo
          </h1>
          <p className="text-lg text-gray-600">
            Vollständige Payment-Integration mit Stripe, Escrow-Schutz und automatischer Rechnungserstellung
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              ✨ Implementierte Features
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Stripe Payment Processing
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Escrow Customer Protection
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Automatic Invoice Generation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                PDF Invoice Creation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Webhook Status Updates
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Admin Payment Dashboard
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Swiss VAT Compliance (7.7%)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Multi-currency Ready (CHF/EUR)
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">
              🔧 API Endpoints
            </h2>
            <ul className="space-y-2 text-sm font-mono text-xs">
              <li>POST /api/payments/create-intent</li>
              <li>POST /api/payments/webhook</li>
              <li>POST /api/payments/refund</li>
              <li>GET /api/payments/escrow/[id]</li>
              <li>POST /api/payments/escrow/[id]/release</li>
              <li>POST /api/invoices</li>
              <li>GET /api/invoices/[id]/pdf</li>
              <li>POST /api/appointments/book-with-payment</li>
              <li>POST /api/appointments/[id]/pay</li>
              <li>GET /api/admin/payments/dashboard</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">
            💳 Live Demo: Service-Buchung mit Zahlung
          </h2>
          <p className="text-gray-600 mb-6">
            Testen Sie die vollständige Payment-Integration. Diese Demo zeigt, wie Kunden Services buchen und sofort bezahlen können.
          </p>

          <Suspense fallback={<div className="text-center p-8">Loading payment form...</div>}>
            <ServiceBookingPayment
              service={mockService}
              onSuccess={(result) => {
                logger.info('Payment success', { result })
              }}
              onError={(error) => {
                logger.error('Payment error', { error })
              }}
            />
          </Suspense>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            🏗️ System Architecture
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Frontend (Next.js)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• React Components</li>
                <li>• Stripe Elements</li>
                <li>• Form Validation</li>
                <li>• Real-time Updates</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Backend (Next.js API)</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Payment Intents</li>
                <li>• Webhook Handlers</li>
                <li>• Database Operations</li>
                <li>• PDF Generation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">External Services</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Stripe Payments</li>
                <li>• PostgreSQL Database</li>
                <li>• Puppeteer (PDF)</li>
                <li>• Email Service</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Diese Demo verwendet Test-API-Schlüssel. In Produktion werden echte Stripe-Schlüssel verwendet.
          </p>
        </div>
      </div>
    </div>
  )
}