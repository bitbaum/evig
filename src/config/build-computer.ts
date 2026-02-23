/**
 * Build-Your-Computer Configuration
 *
 * Mock inventory data and configuration for the AI-powered
 * sustainable computer build tool demo.
 */

export interface BuildComponent {
  id: number
  name: string
  condition: 'used' | 'refurbished' | 'new'
  location: string
  price: number
  performance: number
  sustainability: number
  inStock: number
}

export interface BuildResult {
  cpu: BuildComponent
  gpu: BuildComponent
  ram: BuildComponent
  storage: BuildComponent
  totalPrice: number
  sustainabilityScore: number
  performance: number
  usedPartsPercent: number
}

export const MOCK_INVENTORY = {
  cpus: [
    { id: 1, name: 'Intel Core i7-10700K', condition: 'used' as const, location: 'Zürich, CH', price: 180, performance: 85, sustainability: 95, inStock: 3 },
    { id: 2, name: 'AMD Ryzen 7 3700X', condition: 'refurbished' as const, location: 'Berlin, DE', price: 165, performance: 82, sustainability: 92, inStock: 2 },
    { id: 3, name: 'Intel Core i5-11400F', condition: 'used' as const, location: 'London, UK', price: 120, performance: 75, sustainability: 88, inStock: 5 },
    { id: 4, name: 'AMD Ryzen 5 5600X', condition: 'new' as const, location: 'Lieferant', price: 280, performance: 88, sustainability: 45, inStock: 99 },
  ],
  gpus: [
    { id: 1, name: 'NVIDIA RTX 3070', condition: 'used' as const, location: 'Amsterdam, NL', price: 320, performance: 90, sustainability: 94, inStock: 1 },
    { id: 2, name: 'AMD RX 6600 XT', condition: 'refurbished' as const, location: 'Paris, FR', price: 180, performance: 75, sustainability: 91, inStock: 2 },
    { id: 3, name: 'NVIDIA GTX 1660 Super', condition: 'used' as const, location: 'Zürich, CH', price: 140, performance: 65, sustainability: 89, inStock: 4 },
  ],
  ram: [
    { id: 1, name: '32GB DDR4-3200 (2x16GB)', condition: 'used' as const, location: 'Wien, AT', price: 85, performance: 85, sustainability: 93, inStock: 8 },
    { id: 2, name: '16GB DDR4-3200 (2x8GB)', condition: 'refurbished' as const, location: 'München, DE', price: 45, performance: 80, sustainability: 90, inStock: 12 },
    { id: 3, name: '64GB DDR4-3200 (4x16GB)', condition: 'used' as const, location: 'Stockholm, SE', price: 180, performance: 95, sustainability: 95, inStock: 2 },
  ],
  storage: [
    { id: 1, name: '1TB NVMe SSD Samsung 980', condition: 'used' as const, location: 'Barcelona, ES', price: 65, performance: 88, sustainability: 87, inStock: 6 },
    { id: 2, name: '2TB SATA SSD Crucial MX500', condition: 'refurbished' as const, location: 'Rom, IT', price: 120, performance: 82, sustainability: 89, inStock: 3 },
    { id: 3, name: '512GB NVMe SSD WD Black', condition: 'new' as const, location: 'Lieferant', price: 85, performance: 90, sustainability: 40, inStock: 99 },
  ],
} as const

export const USE_CASE_OPTIONS = [
  { id: 'office', name: 'Büro & Business', description: 'E-Mail, Dokumente, Web-Browsing, Videoanrufe' },
  { id: 'creative', name: 'Kreativarbeit', description: 'Foto-/Videobearbeitung, Design, Content-Erstellung' },
  { id: 'gaming', name: 'Gaming', description: 'Moderne Spiele, Streaming, Hochleistungs-Computing' },
  { id: 'development', name: 'Softwareentwicklung', description: 'Programmierung, Tests, mehrere VMs, Kompilierung' },
  { id: 'server', name: 'Server/NAS', description: 'Dateiserver, Medienserver, Heimautomatisierung' },
  { id: 'ai', name: 'KI/Maschinelles Lernen', description: 'Modelltraining, Datenverarbeitung, CUDA-Workloads' },
] as const

export const PERFORMANCE_OPTIONS = [
  { id: 'basic', name: 'Grundlegend', description: 'Leichte Aufgaben, ausreichende Leistung' },
  { id: 'moderate', name: 'Moderat', description: 'Ausgewogene Leistung für die meisten Aufgaben' },
  { id: 'high', name: 'Hoch', description: 'Starke Leistung für anspruchsvolle Aufgaben' },
  { id: 'extreme', name: 'Extrem', description: 'Spitzenleistung, keine Kompromisse' },
] as const

export const BUDGET_OPTIONS = [
  { value: '300-500', label: 'CHF 300-500' },
  { value: '500-800', label: 'CHF 500-800' },
  { value: '800-1200', label: 'CHF 800-1200' },
  { value: '1200+', label: 'CHF 1200+' },
] as const

/** Get a mock build recommendation based on use case */
export function getMockRecommendation(useCase: string): BuildResult {
  const inv = MOCK_INVENTORY
  switch (useCase) {
    case 'gaming':
      return {
        cpu: inv.cpus[0], gpu: inv.gpus[0], ram: inv.ram[1], storage: inv.storage[0],
        totalPrice: 705, sustainabilityScore: 91, performance: 85, usedPartsPercent: 100,
      }
    case 'creative':
      return {
        cpu: inv.cpus[1], gpu: inv.gpus[1], ram: inv.ram[0], storage: inv.storage[1],
        totalPrice: 550, sustainabilityScore: 93, performance: 82, usedPartsPercent: 100,
      }
    default:
      return {
        cpu: inv.cpus[2], gpu: inv.gpus[2], ram: inv.ram[1], storage: inv.storage[0],
        totalPrice: 370, sustainabilityScore: 89, performance: 72, usedPartsPercent: 100,
      }
  }
}
