"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Hero Banner Component
function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium mb-4">
              🌱 Nachhaltig & Hochwertig
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Technologie,
              <br />
              <span className="text-amber-300">neu gedacht.</span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-6 max-w-lg">
              Professionell aufbereitete Computer & IT-Geräte –
              gut für dein Portemonnaie und unseren Planeten.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="#products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors shadow-lg"
              >
                🛒 Jetzt stöbern
              </Link>
            </div>
          </div>

          <div className="flex-shrink-0 grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { icon: "🔧", label: "Geprüfte Qualität" },
              { icon: "🌱", label: "Nachhaltig" },
              { icon: "💬", label: "Support" },
              { icon: "📦", label: "Schneller Versand" },
            ].map((item, i) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/10"
              >
                <span className="text-2xl sm:text-3xl block mb-2">{item.icon}</span>
                <div className="font-semibold text-sm sm:text-base">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Trust Badges Section
function TrustBadges() {
  const badges = [
    { icon: "🔧", label: "Geprüfte Qualität", desc: "Jedes Gerät wird technisch überprüft" },
    { icon: "📦", label: "Schneller Versand", desc: "Innerhalb von 2-3 Werktagen" },
    { icon: "🌱", label: "Nachhaltig", desc: "Gut für die Umwelt" },
    { icon: "💬", label: "Support", desc: "Persönliche Beratung" },
  ];

  return (
    <section className="py-6 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {badges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-2xl sm:text-3xl flex-shrink-0">{badge.icon}</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm sm:text-base">{badge.label}</div>
                <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MedusaShopPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-2xl font-bold mb-6">Medusa Shop</h1>

        {/* Simple message for now */}
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Shop wird vorbereitet</h2>
          <p className="text-gray-600 mb-4">
            Wir arbeiten daran, Ihnen die besten refurbished Produkte zu präsentieren.
          </p>
          <p className="text-sm text-gray-500">
            In der Zwischenzeit können Sie unsere Produkte über die API abrufen:
          </p>
          <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
            GET /api/shop/products
          </code>
        </div>
      </div>
    </div>
  );
}