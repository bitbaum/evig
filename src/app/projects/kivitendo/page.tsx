'use client'

import { HeroBanner } from '@/components/ui/hero-banner'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Code, Users, Globe, Shield, Zap, Package, FileText, Settings, ShoppingCart } from 'lucide-react'
import React from 'react'

export default function KivitendoPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Kivitendo"
        description="Das einzigartige Open Source CRM & ERP, das durch ständige personalisierte Weiterentwicklung höchste Qualitätsstandards erfüllt"
        className="bg-gradient-to-r from-blue-600 to-blue-800"
      />

      {/* Key Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Warum Kivitendo wählen?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Eine umfassende Lösung für Auftragsabwicklung, Warenwirtschaft und Finanzbuchhaltung
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <Code className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">Open-Source-Vorteile</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Hohe Anpassungsfähigkeit an Ihre Bedürfnisse</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Vollständiger Zugriff auf Code und Entwicklungen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Keine fixen Lizenzkosten</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <Package className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">Auftragsabwicklung</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Kompletter Workflow von Angebot bis Rechnung</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Anpassbare Dokumentvorlagen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Direkte E-Mail-Integration</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <FileText className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">Finanzbuchhaltung</h3>
                </div>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Komplette oder modulare Buchhaltung</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Anpassbarer Kontenplan</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                    <span>Import von Kontoauszügen</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Hauptmerkmale</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Umfassende Funktionen für Ihre Geschäftsanforderungen
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-2xl font-semibold mb-6">Geschäftskonfiguration</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Mehrere Währungen & Sprachen</span>
                      <p className="text-gray-600 mt-1">Unterstützung für verschiedene Währungen und Kundensprachen</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Mandantenfähigkeit</span>
                      <p className="text-gray-600 mt-1">Verwalten Sie mehrere Unternehmen in einem System</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Benutzerdefinierte Benutzergruppen</span>
                      <p className="text-gray-600 mt-1">Definieren Sie spezifische Berechtigungen für verschiedene Rollen</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <h3 className="text-2xl font-semibold mb-6">Integration & Anpassung</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Webshop-Integration</span>
                      <p className="text-gray-600 mt-1">Nahtlose Anbindung an Ihren Online-Shop</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Benutzerdefinierte Variablen</span>
                      <p className="text-gray-600 mt-1">Definieren Sie benutzerdefinierte Felder für Kunden, Artikel und Projekte</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <span className="font-medium">Prozessautomatisierung</span>
                      <p className="text-gray-600 mt-1">Automatisieren Sie Hintergrundprozesse und periodische Aufgaben</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Preisstruktur</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Flexible Optionen, die Ihren Geschäftsanforderungen entsprechen
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-semibold mb-4">Hosting-Paket</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-3" />
                    <span>Internetzugang von überall</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-3" />
                    <span>Unbegrenzte Benutzer</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-3" />
                    <span>Tägliche Datensicherung</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-3" />
                    <span>Upgrades der Standardversion</span>
                  </li>
                </ul>
                <div className="text-3xl font-bold mb-2">CHF 100.- / Monat</div>
                <p className="text-blue-100">CHF 50.- für gemeinnützige Organisationen</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-2xl font-semibold mb-4">Individuelle Entwicklung</h3>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Konfiguration & Support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Individuelle Anpassungen</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Persönliche Beratung</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Detaillierte Offerte</span>
                  </li>
                </ul>
                <div className="text-3xl font-bold mb-2">CHF 100.- / Stunde</div>
                <p className="text-gray-600">Massgeschneiderte Lösungen für Ihre spezifischen Bedürfnisse</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Ressourcen & Community</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Treten Sie unserer aktiven Community bei und greifen Sie auf umfassende Ressourcen zu
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  title: 'Kivitendo Schweiz',
                  description: 'Offizielle Schweizer Kivitendo-Website',
                  href: 'https://www.kivitendo.ch',
                  icon: 'swiss'
                },
                { 
                  title: 'Kivitendo Deutschland',
                  description: 'Offizielle Deutsche Kivitendo-Website',
                  href: 'https://www.kivitendo.de',
                  icon: 'german'
                },
                { 
                  title: 'Community-Forum',
                  description: 'Holen Sie sich Hilfe und teilen Sie Wissen mit anderen Benutzern',
                  href: 'https://forum.kivitendo.de/',
                  icon: 'forum'
                },
                { 
                  title: 'Funktionswünsche',
                  description: 'Sehen Sie sich kommende Funktionen an und tragen Sie dazu bei',
                  href: 'https://wiki.revamp-it.ch/index.php?title=Wunschliste_Kivitendo',
                  icon: 'features'
                }
              ].map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.title}</h3>
                      <p className="text-gray-600 text-sm">{link.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 