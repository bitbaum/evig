/**
 * Product Categories Configuration
 *
 * Hierarchical category structure for products.
 * Used in: product erfassung, navigation, filtering, search
 *
 * SSOT: This is the single source of truth for product categories.
 * Adding/removing a category here automatically updates the entire app.
 *
 * Structure:
 *   - Main categories (10, 20, 30, ...)
 *   - Subcategories (101, 102, 201, 202, ...)
 *
 * ID Convention:
 *   - Main: 2-digit (10, 20, 30, ...)
 *   - Sub: 3-digit, first digit = parent (101, 102 under 10)
 *
 * To add a new category:
 *   1. Add to KATEGORIEN array
 *   2. Add spec template in spec-templates.ts if needed
 *
 * To add a new subcategory:
 *   1. Add to parent category's subs array
 *   2. Use 3-digit ID starting with parent's ID
 */

export interface SubKategorie {
  /** Unique identifier */
  value: string
  /** German display name */
  label: string
  /** Description explaining this subcategory */
  description?: string
}

export interface Kategorie {
  /** Unique identifier (2-digit recommended) */
  value: string
  /** German display name */
  label: string
  /** Icon (emoji for UI) */
  icon?: string
  /** Description explaining what this category is for */
  description: string
  /** What products belong here */
  examples?: string[]
  /** Subcategories */
  subs: SubKategorie[]
}

/**
 * Product categories hierarchy
 *
 * RevampIT focuses on refurbished IT equipment:
 * - Computing devices (Laptops, Desktops, Tablets, Phones)
 * - Display & Output (Monitors, Printers)
 * - Components & Upgrades
 * - Peripherals & Accessories
 * - Networking
 */
export const KATEGORIEN: Kategorie[] = [
  {
    value: '10',
    label: 'Laptops',
    icon: '💻',
    description: 'Tragbare Computer aller Art - von Business bis Gaming',
    examples: ['ThinkPad', 'MacBook', 'Dell Latitude', 'HP EliteBook'],
    subs: [
      {
        value: '101',
        label: 'Business Laptops',
        description: 'Robuste Arbeitsgeräte mit guter Tastatur und Anschlüssen',
      },
      {
        value: '102',
        label: 'Consumer Laptops',
        description: 'Allround-Geräte für Heimgebrauch',
      },
      {
        value: '103',
        label: 'Gaming Laptops',
        description: 'Leistungsstarke Geräte mit dedizierter Grafik',
      },
      {
        value: '104',
        label: 'Ultrabooks',
        description: 'Dünne, leichte Premium-Laptops',
      },
      {
        value: '105',
        label: 'Convertibles',
        description: '2-in-1 Geräte mit Touch/Stift-Unterstützung',
      },
    ],
  },
  {
    value: '20',
    label: 'Desktop PCs',
    icon: '🖥️',
    description: 'Stationäre Computer - mehr Leistung, bessere Erweiterbarkeit',
    examples: ['Dell OptiPlex', 'HP ProDesk', 'Lenovo ThinkCentre', 'Custom PCs'],
    subs: [
      {
        value: '201',
        label: 'Office PCs',
        description: 'Kompakte Büro-Computer für alltägliche Aufgaben',
      },
      {
        value: '202',
        label: 'Gaming PCs',
        description: 'Leistungsstarke Systeme mit Gaming-Grafikkarte',
      },
      {
        value: '203',
        label: 'Workstations',
        description: 'Professionelle Systeme für CAD, Rendering, etc.',
      },
      {
        value: '204',
        label: 'Mini PCs',
        description: 'Kleine, platzsparende Desktop-Systeme',
      },
    ],
  },
  {
    value: '30',
    label: 'Monitore',
    icon: '🖵',
    description: 'Bildschirme für Arbeit, Gaming und kreative Tätigkeiten',
    examples: ['Dell UltraSharp', 'LG UltraWide', 'Samsung Curved', 'EIZO'],
    subs: [
      {
        value: '301',
        label: 'Office Monitore',
        description: 'Standard-Bildschirme für Büroarbeit (60Hz, Full HD)',
      },
      {
        value: '302',
        label: 'Gaming Monitore',
        description: 'Schnelle Bildschirme (144Hz+, niedrige Latenz)',
      },
      {
        value: '303',
        label: 'Profi Monitore',
        description: 'Farbgenaue Displays für Grafik/Video (100% sRGB)',
      },
    ],
  },
  {
    value: '40',
    label: 'Tablets',
    icon: '📱',
    description: 'Touchscreen-Geräte zwischen Smartphone und Laptop',
    examples: ['iPad', 'Samsung Galaxy Tab', 'Microsoft Surface'],
    subs: [
      {
        value: '401',
        label: 'Android Tablets',
        description: 'Tablets mit Android-Betriebssystem',
      },
      {
        value: '402',
        label: 'iPads',
        description: 'Apple Tablets mit iPadOS',
      },
      {
        value: '403',
        label: 'Windows Tablets',
        description: 'Tablets mit vollwertigem Windows',
      },
    ],
  },
  {
    value: '50',
    label: 'Smartphones',
    icon: '📱',
    description: 'Mobiltelefone mit Touchscreen und Apps',
    examples: ['iPhone', 'Samsung Galaxy', 'Google Pixel', 'OnePlus'],
    subs: [
      {
        value: '501',
        label: 'Android',
        description: 'Smartphones mit Android-Betriebssystem',
      },
      {
        value: '502',
        label: 'iPhone',
        description: 'Apple Smartphones mit iOS',
      },
    ],
  },
  {
    value: '60',
    label: 'Drucker & Scanner',
    icon: '🖨️',
    description: 'Geräte für Ausgabe und Digitalisierung von Dokumenten',
    examples: ['HP LaserJet', 'Brother', 'Canon', 'Epson'],
    subs: [
      {
        value: '601',
        label: 'Laserdrucker',
        description: 'Schnelle Drucker für viele Seiten (Toner)',
      },
      {
        value: '602',
        label: 'Tintenstrahldrucker',
        description: 'Günstige Drucker, gut für Fotos (Tinte)',
      },
      {
        value: '603',
        label: 'Scanner',
        description: 'Dokumente und Bilder digitalisieren',
      },
      {
        value: '604',
        label: 'Multifunktionsgeräte',
        description: 'Drucker, Scanner, Kopierer in einem',
      },
    ],
  },
  {
    value: '70',
    label: 'Komponenten',
    icon: '🔧',
    description: 'Einzelteile zum Aufrüsten oder Reparieren von Computern',
    examples: ['NVIDIA RTX', 'AMD Ryzen', 'Samsung SSD', 'Corsair RAM'],
    subs: [
      {
        value: '701',
        label: 'Grafikkarten',
        description: 'GPUs für Gaming, Rendering, KI',
      },
      {
        value: '702',
        label: 'RAM',
        description: 'Arbeitsspeicher (DDR4, DDR5)',
      },
      {
        value: '703',
        label: 'SSDs/HDDs',
        description: 'Speicherlaufwerke (SSD schnell, HDD günstig)',
      },
      {
        value: '704',
        label: 'CPUs',
        description: 'Prozessoren (Intel/AMD)',
      },
      {
        value: '705',
        label: 'Netzteile',
        description: 'Stromversorgung für Desktop-PCs',
      },
      {
        value: '706',
        label: 'Mainboards',
        description: 'Hauptplatinen für Desktop-PCs',
      },
    ],
  },
  {
    value: '80',
    label: 'Peripherie',
    icon: '🖱️',
    description: 'Eingabegeräte und Zubehör für Computer',
    examples: ['Logitech', 'Microsoft', 'Dell', 'HP'],
    subs: [
      {
        value: '801',
        label: 'Tastaturen',
        description: 'Kabelgebunden und kabellos',
      },
      {
        value: '802',
        label: 'Mäuse',
        description: 'Kabelgebunden und kabellos',
      },
      {
        value: '803',
        label: 'Webcams',
        description: 'Kameras für Videokonferenzen',
      },
      {
        value: '804',
        label: 'Headsets',
        description: 'Kopfhörer mit Mikrofon',
      },
      {
        value: '805',
        label: 'Docking Stations',
        description: 'Erweiterungsstationen für Laptops',
      },
    ],
  },
  {
    value: '90',
    label: 'Netzwerk',
    icon: '🌐',
    description: 'Geräte für Internet und lokale Netzwerke',
    examples: ['Ubiquiti', 'Cisco', 'TP-Link', 'Netgear'],
    subs: [
      {
        value: '901',
        label: 'Router',
        description: 'Internetzugang und WLAN-Verteilung',
      },
      {
        value: '902',
        label: 'Switches',
        description: 'Netzwerk-Verteiler für Kabelverbindungen',
      },
      {
        value: '903',
        label: 'Access Points',
        description: 'WLAN-Erweiterung für grosse Flächen',
      },
    ],
  },
]

/**
 * Get category by value
 */
export function getCategoryByValue(value: string): Kategorie | undefined {
  return KATEGORIEN.find(k => k.value === value)
}

/**
 * Get subcategory by value
 */
export function getSubcategoryByValue(value: string): SubKategorie | undefined {
  for (const kategorie of KATEGORIEN) {
    const sub = kategorie.subs.find(s => s.value === value)
    if (sub) return sub
  }
  return undefined
}

/**
 * Get parent category for a subcategory
 */
export function getParentCategory(subValue: string): Kategorie | undefined {
  // Subcategory value starts with parent value (e.g., 101 -> 10)
  const parentValue = subValue.slice(0, -1)
  return getCategoryByValue(parentValue)
}

/**
 * Get subcategories for a main category
 */
export function getSubcategories(categoryValue: string): SubKategorie[] {
  return getCategoryByValue(categoryValue)?.subs ?? []
}

/**
 * Flat list of all categories (main + sub) for search/filtering
 */
export function getAllCategoriesFlat(): Array<{ value: string; label: string; isMain: boolean; description?: string }> {
  const result: Array<{ value: string; label: string; isMain: boolean; description?: string }> = []

  for (const kategorie of KATEGORIEN) {
    result.push({
      value: kategorie.value,
      label: kategorie.label,
      isMain: true,
      description: kategorie.description,
    })
    for (const sub of kategorie.subs) {
      result.push({
        value: sub.value,
        label: `${kategorie.label} > ${sub.label}`,
        isMain: false,
        description: sub.description,
      })
    }
  }

  return result
}

/**
 * Get category with full details including parent info
 */
export function getCategoryDetails(value: string): {
  category: Kategorie | SubKategorie
  parent?: Kategorie
  isMain: boolean
  fullLabel: string
  description?: string
} | undefined {
  // Check if it's a main category
  const mainCat = getCategoryByValue(value)
  if (mainCat) {
    return {
      category: mainCat,
      isMain: true,
      fullLabel: mainCat.label,
      description: mainCat.description,
    }
  }

  // Check if it's a subcategory
  const subCat = getSubcategoryByValue(value)
  const parent = getParentCategory(value)
  if (subCat && parent) {
    return {
      category: subCat,
      parent,
      isMain: false,
      fullLabel: `${parent.label} > ${subCat.label}`,
      description: subCat.description,
    }
  }

  return undefined
}
