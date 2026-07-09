/**
 * Build-Your-Computer Configuration
 *
 * HONEST guidance for the sustainable-build helper: given a use case, recommend
 * the component TIERS/TYPES to look for (not fabricated specific products with
 * made-up prices/stock/locations). RevampIT is a local Zürich refurbisher — the
 * tool sends people to browse our REAL refurbished components in the marketplace
 * and to request a built machine, rather than inventing a cross-Europe catalogue.
 */

export interface BuildRecommendation {
  /** Component-tier guidance strings (what to look for), not specific products. */
  cpu: string
  gpu: string
  ram: string
  storage: string
  /** One-line rationale for this use case. */
  note: string
}

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

/**
 * Honest component-tier recommendation per use case. No prices/stock/locations —
 * we don't fabricate a catalogue; the UI links to the real marketplace.
 */
export function getBuildRecommendation(useCase: string): BuildRecommendation {
  switch (useCase) {
    case 'gaming':
      return {
        cpu: '6+ Kerne, Mittelklasse (z.B. Core i5 / Ryzen 5)',
        gpu: 'Dedizierte Grafikkarte empfohlen',
        ram: '16–32 GB',
        storage: 'NVMe-SSD, 500 GB+',
        note: 'Priorität auf Grafikkarte und schnelle SSD für flüssiges Spielen.',
      }
    case 'creative':
      return {
        cpu: '8+ Kerne für schnelles Rendern',
        gpu: 'Dedizierte Grafikkarte für GPU-Beschleunigung',
        ram: '32 GB oder mehr',
        storage: 'NVMe-SSD, 1 TB+ für grosse Projektdateien',
        note: 'Viel RAM und schnelle Speicher beschleunigen Foto- und Videobearbeitung.',
      }
    case 'development':
      return {
        cpu: '6–8 Kerne für parallele Builds',
        gpu: 'Integrierte Grafik genügt (ausser ML/GPU-Arbeit)',
        ram: '32 GB (mehrere VMs/Container)',
        storage: 'NVMe-SSD, 500 GB+',
        note: 'RAM und CPU-Kerne zählen mehr als die Grafikkarte.',
      }
    case 'server':
      return {
        cpu: 'Energieeffizient, moderate Kernzahl',
        gpu: 'Nicht nötig',
        ram: '16–32 GB je nach Diensten',
        storage: 'Grosse HDDs für Kapazität + eine SSD fürs System',
        note: 'Zuverlässigkeit und Speicherkapazität vor Spitzenleistung.',
      }
    case 'ai':
      return {
        cpu: '8+ Kerne',
        gpu: 'Leistungsstarke CUDA-GPU mit viel VRAM',
        ram: '32–64 GB',
        storage: 'NVMe-SSD, 1 TB+ für Datensätze',
        note: 'Die Grafikkarte (VRAM) ist der wichtigste Faktor fürs Training.',
      }
    case 'office':
    default:
      return {
        cpu: '4+ Kerne reichen aus',
        gpu: 'Integrierte Grafik genügt',
        ram: '8–16 GB',
        storage: 'SSD, 250 GB+',
        note: 'Ein refurbished Business-Gerät deckt Büroarbeit problemlos ab.',
      }
  }
}
