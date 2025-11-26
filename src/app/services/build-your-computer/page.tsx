'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { 
  Computer, 
  Cpu, 
  HardDrive, 
  Monitor, 
  Zap, 
  Globe, 
  Recycle, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Leaf,
  Star,
  ArrowRight,
  Search,
  ShoppingCart,
  Award,
  Shield,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

// Types for build result
interface Component {
  id: number
  name: string
  condition: 'used' | 'refurbished' | 'new'
  location: string
  price: number
  performance: number
  sustainability: number
  inStock: number
}

interface BuildResult {
  cpu: Component
  gpu: Component
  ram: Component
  storage: Component
  totalPrice: number
  sustainabilityScore: number
  performance: number
  usedPartsPercent: number
}

// Mock inventory data to demonstrate the concept
const mockInventory = {
  cpus: [
    { id: 1, name: 'Intel Core i7-10700K', condition: 'used' as const, location: 'Zürich, CH', price: 180, performance: 85, sustainability: 95, inStock: 3 },
    { id: 2, name: 'AMD Ryzen 7 3700X', condition: 'refurbished' as const, location: 'Berlin, DE', price: 165, performance: 82, sustainability: 92, inStock: 2 },
    { id: 3, name: 'Intel Core i5-11400F', condition: 'used' as const, location: 'London, UK', price: 120, performance: 75, sustainability: 88, inStock: 5 },
    { id: 4, name: 'AMD Ryzen 5 5600X', condition: 'new' as const, location: 'Lieferant', price: 280, performance: 88, sustainability: 45, inStock: 99 }
  ],
  gpus: [
    { id: 1, name: 'NVIDIA RTX 3070', condition: 'used' as const, location: 'Amsterdam, NL', price: 320, performance: 90, sustainability: 94, inStock: 1 },
    { id: 2, name: 'AMD RX 6600 XT', condition: 'refurbished' as const, location: 'Paris, FR', price: 180, performance: 75, sustainability: 91, inStock: 2 },
    { id: 3, name: 'NVIDIA GTX 1660 Super', condition: 'used' as const, location: 'Zürich, CH', price: 140, performance: 65, sustainability: 89, inStock: 4 }
  ],
  ram: [
    { id: 1, name: '32GB DDR4-3200 (2x16GB)', condition: 'used' as const, location: 'Wien, AT', price: 85, performance: 85, sustainability: 93, inStock: 8 },
    { id: 2, name: '16GB DDR4-3200 (2x8GB)', condition: 'refurbished' as const, location: 'München, DE', price: 45, performance: 80, sustainability: 90, inStock: 12 },
    { id: 3, name: '64GB DDR4-3200 (4x16GB)', condition: 'used' as const, location: 'Stockholm, SE', price: 180, performance: 95, sustainability: 95, inStock: 2 }
  ],
  storage: [
    { id: 1, name: '1TB NVMe SSD Samsung 980', condition: 'used' as const, location: 'Barcelona, ES', price: 65, performance: 88, sustainability: 87, inStock: 6 },
    { id: 2, name: '2TB SATA SSD Crucial MX500', condition: 'refurbished' as const, location: 'Rom, IT', price: 120, performance: 82, sustainability: 89, inStock: 3 },
    { id: 3, name: '512GB NVMe SSD WD Black', condition: 'new' as const, location: 'Lieferant', price: 85, performance: 90, sustainability: 40, inStock: 99 }
  ]
}

const useCategories = [
  { id: 'office', name: 'Büro & Business', description: 'E-Mail, Dokumente, Web-Browsing, Videoanrufe' },
  { id: 'creative', name: 'Kreativarbeit', description: 'Foto-/Videobearbeitung, Design, Content-Erstellung' },
  { id: 'gaming', name: 'Gaming', description: 'Moderne Spiele, Streaming, Hochleistungs-Computing' },
  { id: 'development', name: 'Softwareentwicklung', description: 'Programmierung, Tests, mehrere VMs, Kompilierung' },
  { id: 'server', name: 'Server/NAS', description: 'Dateiserver, Medienserver, Heimautomatisierung' },
  { id: 'ai', name: 'KI/Maschinelles Lernen', description: 'Modelltraining, Datenverarbeitung, CUDA-Workloads' }
]

const performanceNeeds = [
  { id: 'basic', name: 'Grundlegend', description: 'Leichte Aufgaben, ausreichende Leistung' },
  { id: 'moderate', name: 'Moderat', description: 'Ausgewogene Leistung für die meisten Aufgaben' },
  { id: 'high', name: 'Hoch', description: 'Starke Leistung für anspruchsvolle Aufgaben' },
  { id: 'extreme', name: 'Extrem', description: 'Spitzenleistung, keine Kompromisse' }
]

export default function BuildYourComputerPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    useCase: '',
    performance: '',
    budget: '',
    sustainability: 'high',
    specific: ''
  })
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Mock AI recommendation based on user input
    const getRecommendation = (): BuildResult => {
      switch (formData.useCase) {
        case 'gaming':
          return {
            cpu: mockInventory.cpus[0], // i7-10700K
            gpu: mockInventory.gpus[0], // RTX 3070
            ram: mockInventory.ram[1], // 16GB
            storage: mockInventory.storage[0], // 1TB NVMe
            totalPrice: 705,
            sustainabilityScore: 91,
            performance: 85,
            usedPartsPercent: 100
          }
        case 'creative':
          return {
            cpu: mockInventory.cpus[1], // Ryzen 7 3700X
            gpu: mockInventory.gpus[1], // RX 6600 XT
            ram: mockInventory.ram[0], // 32GB
            storage: mockInventory.storage[1], // 2TB SSD
            totalPrice: 550,
            sustainabilityScore: 93,
            performance: 82,
            usedPartsPercent: 100
          }
        default:
          return {
            cpu: mockInventory.cpus[2], // i5-11400F
            gpu: mockInventory.gpus[2], // GTX 1660 Super
            ram: mockInventory.ram[1], // 16GB
            storage: mockInventory.storage[0], // 1TB NVMe
            totalPrice: 370,
            sustainabilityScore: 89,
            performance: 72,
            usedPartsPercent: 100
          }
      }
    }

    setBuildResult(getRecommendation())
    setIsAnalyzing(false)
    setStep(3)
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              KI-gestützte nachhaltige Computer-Builds
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-4 sm:mb-6 md:mb-8 text-green-200">
              100% Gebrauchtteile-Priorität • Globales Inventar-Netzwerk • Intelligentes KI-Matching
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 sm:mb-8">
              Unser revolutionäres KI-System scannt unser Inventar und globale Partnernetzwerke, um Ihren perfekten Computer hauptsächlich aus gebrauchten und wiederaufbereiteten Komponenten zusammenzustellen. Nur wenn es absolut notwendig ist, beschaffen wir neue Teile.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center bg-green-600/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Recycle className="w-4 h-4 mr-2" />
                Kreislaufwirtschaft
              </div>
              <div className="flex items-center bg-green-600/30 px-4 py-2 rounded-full">
                <Globe className="w-4 h-4 mr-2" />
                Globales Netzwerk
              </div>
              <div className="flex items-center bg-green-600/30 px-4 py-2 rounded-full">
                <Star className="w-4 h-4 mr-2" />
                KI-optimiert
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Wie unser KI-Build-System funktioniert</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold mb-3">Anforderungsanalyse</h3>
              <p className="text-gray-600">Teilen Sie uns Ihren Anwendungsfall, Ihre Leistungsanforderungen und Ihre Nachhaltigkeitspräferenzen mit</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold mb-3">Globaler Inventar-Scan</h3>
              <p className="text-gray-600">Die KI scannt unser Inventar + Partnernetzwerke in ganz Europa und darüber hinaus</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold mb-3">Intelligente Optimierung</h3>
              <p className="text-gray-600">Der Algorithmus priorisiert gebrauchte Teile, optimiert auf Leistung und Nachhaltigkeit</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-xl font-bold mb-3">Zusammenbau & Zertifizierung</h3>
              <p className="text-gray-600">Professionelle Montage mit unserer "Revamped"-Nachhaltigkeitszertifizierung</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Build Tool */}
      <section className="py-12 sm:py-16 md:py-20" id="build-tool">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">Testen Sie unsere Build-Tool-Demo</h2>
            <p className="text-center text-gray-600 mb-12">Erleben Sie, wie unser KI-System Komponenten für Ihre spezifischen Bedürfnisse empfehlen würde</p>
            
            {/* Progress Bar */}
            <div className="flex items-center justify-center mb-8">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
              <div className={`w-24 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
              <div className={`w-24 h-1 ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Step 1: Requirements */}
              {step === 1 && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold mb-6">Wofür werden Sie Ihren Computer verwenden?</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {useCategories.map((category) => (
                      <div 
                        key={category.id}
                        onClick={() => setFormData({...formData, useCase: category.id})}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${ 
                          formData.useCase === category.id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-semibold">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Leistungsanforderungen</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {performanceNeeds.map((perf) => (
                        <button
                          key={perf.id}
                          onClick={() => setFormData({...formData, performance: perf.id})}
                          className={`p-3 text-center border-2 rounded-lg transition-all ${ 
                            formData.performance === perf.id 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold">{perf.name}</div>
                          <div className="text-xs text-gray-600">{perf.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Budgetbereich (CHF)</label>
                    <select 
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Budgetbereich auswählen</option>
                      <option value="300-500">CHF 300-500</option>
                      <option value="500-800">CHF 500-800</option>
                      <option value="800-1200">CHF 800-1200</option>
                      <option value="1200+">CHF 1200+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Spezifische Anforderungen (optional)</label>
                    <textarea 
                      value={formData.specific}
                      onChange={(e) => setFormData({...formData, specific: e.target.value})}
                      placeholder="Haben Sie spezielle Bedürfnisse? (z.B. mehrere Monitore, VR-Gaming, spezielle Softwareanforderungen)"
                      className="w-full p-3 border border-gray-300 rounded-lg h-20"
                    />
                  </div>

                  <button 
                    onClick={() => setStep(2)}
                    disabled={!formData.useCase || !formData.performance || !formData.budget}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                  >
                    Weiter zur Analyse
                  </button>
                </div>
              )}

              {/* Step 2: AI Analysis */}
              {step === 2 && (
                <div className="text-center space-y-8">
                  <h3 className="text-2xl font-bold">KI-Inventaranalyse</h3>
                  
                  {!isAnalyzing ? (
                    <>
                      <div className="bg-green-50 p-6 rounded-lg">
                        <h4 className="font-semibold mb-4">Zusammenfassung Ihrer Anforderungen:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          <div><strong>Anwendungsfall:</strong> {useCategories.find(c => c.id === formData.useCase)?.name}</div>
                          <div><strong>Leistung:</strong> {performanceNeeds.find(p => p.id === formData.performance)?.name}</div>
                          <div><strong>Budget:</strong> {formData.budget}</div>
                          <div><strong>Nachhaltigkeit:</strong> Hohe Priorität</div>
                        </div>
                        {formData.specific && (
                          <div className="mt-4 text-left"><strong>Besondere Hinweise:</strong> {formData.specific}</div>
                        )}
                      </div>

                      <p className="text-gray-600">Bereit, unser globales Inventar-Netzwerk zu scannen und Ihre personalisierte Build-Empfehlung zu generieren?</p>
                      
                      <div className="flex gap-4 justify-center">
                        <button 
                          onClick={() => setStep(1)}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Zurück zur Bearbeitung
                        </button>
                        <button 
                          onClick={handleAnalyze}
                          className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center"
                        >
                          <Search className="w-5 h-5 mr-2" />
                          Globales Inventar analysieren
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                      <div className="space-y-3">
                        <p className="font-semibold">🔍 Scanne Inventar-Netzwerke...</p>
                        <p className="text-gray-600">• Überprüfe Lager Zürich (847 Komponenten)</p>
                        <p className="text-gray-600">• Scanne europäische Partner (12.450+ Komponenten)</p>
                        <p className="text-gray-600">• KI optimiert für Nachhaltigkeit + Leistung</p>
                        <p className="text-gray-600">• Berechne Versandrouten und -kosten</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Results */}
              {step === 3 && buildResult && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">Ihr optimierter Build</h3>
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="flex items-center">
                        <Leaf className="w-4 h-4 text-green-500 mr-1" />
                        {buildResult.sustainabilityScore}% Nachhaltig
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                        {buildResult.performance}% Leistungsübereinstimmung
                      </div>
                      <div className="flex items-center">
                        <Recycle className="w-4 h-4 text-green-500 mr-1" />
                        {buildResult.usedPartsPercent}% Gebrauchtteile
                      </div>
                    </div>
                  </div>

                  {/* Component List */}
                  <div className="space-y-4">
                    {[
                      { component: buildResult.cpu, icon: Cpu, type: 'Prozessor' },
                      { component: buildResult.gpu, icon: Monitor, type: 'Grafikkarte' },
                      { component: buildResult.ram, icon: Zap, type: 'Arbeitsspeicher' },
                      { component: buildResult.storage, icon: HardDrive, type: 'Speicher' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg">
                        <item.icon className="w-8 h-8 text-green-600 mr-4" />
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.component.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${ 
                              item.component.condition === 'used' ? 'bg-green-100 text-green-800' :
                              item.component.condition === 'refurbished' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {item.component.condition === 'used' ? 'Gebraucht' : item.component.condition === 'refurbished' ? 'Wiederaufbereitet' : 'Neu'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{item.type}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {item.component.location}
                            </span>
                            <span>{item.component.inStock} auf Lager</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">CHF {item.component.price}</div>
                          <div className="text-xs text-gray-500">ca. 3-5 Tage</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total and Actions */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Gesamtkosten des Builds:</span>
                      <span className="text-2xl font-bold text-green-600">CHF {buildResult.totalPrice}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-6">
                      + Montage & Test: CHF 120 | + Versand: CHF 45 | + "Revamped"-Zertifizierung: Inklusive
                    </div>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Anforderungen ändern
                      </button>
                      <Link 
                        href="/contact"
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center flex items-center justify-center"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Diesen Build bestellen
                      </Link>
                    </div>
                  </div>

                  {/* Sustainability Impact */}
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="font-bold mb-4 flex items-center">
                      <Leaf className="w-5 h-5 text-green-600 mr-2" />
                      Umweltauswirkungen
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-semibold">CO₂ gespart</div>
                        <div className="text-green-600">~85kg im Vergleich zu Neubau</div>
                      </div>
                      <div>
                        <div className="font-semibold">Wiederverwendete Komponenten</div>
                        <div className="text-green-600">4 von 4 Hauptteilen</div>
                      </div>
                      <div>
                        <div className="font-semibold">Kreislaufwirtschaft</div>
                        <div className="text-green-600">Verlängert die Lebensdauer der Hardware</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Warum unser KI-Build-System wählen?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <Globe className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-4">Globales Inventar-Netzwerk</h3>
              <p className="text-gray-600">Zugang zu Tausenden von gebrauchten und wiederaufbereiteten Komponenten in ganz Europa und darüber hinaus, mit Echtzeit-Bestandsverfolgung.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <Star className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-4">KI-gestützte Optimierung</h3>
              <p className="text-gray-600">Intelligente Algorithmen gleichen Leistung, Nachhaltigkeit, Kosten und Verfügbarkeit ab, um Ihre perfekte Build-Kombination zu finden.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-4">"Revamped"-Zertifizierung</h3>
              <p className="text-gray-600">Jeder Build erhält unsere Nachhaltigkeitszertifizierung, die Qualität garantiert und gleichzeitig die Kreislaufwirtschaft unterstützt.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Revamped Certification Brief */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 text-center">
              <div className="inline-flex items-center bg-green-100 px-6 py-3 rounded-full mb-6">
                <Award className="w-8 h-8 text-green-600 mr-3" />
                <span className="text-2xl font-bold text-green-800">Revamped</span>
                <Sparkles className="w-6 h-6 text-green-600 ml-2" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Holen Sie sich Ihre Revamped-Zertifizierung</h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Jeder von uns gebaute Computer erhält unsere exklusive "Revamped"-Zertifizierung - Ihre Garantie für Nachhaltigkeit, Qualität und Leistung.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
                  <div className="text-sm text-gray-600">Nachhaltigkeits-Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">120kg</div>
                  <div className="text-sm text-gray-600">CO₂ gespart</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">2000+</div>
                  <div className="text-sm text-gray-600">Zertifizierte Computer</div>
                </div>
              </div>
              <Link
                href="/revamped"
                className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Mehr über die Revamped-Zertifizierung erfahren
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Bereit, nachhaltig zu bauen?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Schliessen Sie sich der Revolution im Computerbau an. Holen Sie sich einen massgeschneiderten, nachhaltigen Build, der hervorragend funktioniert und gleichzeitig unseren Planeten schont.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Starten Sie Ihren Build
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Alle Dienstleistungen entdecken
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}