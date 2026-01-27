/**
 * Product Categories Configuration
 *
 * Hierarchical category structure for products.
 * Used in: product erfassung, navigation, filtering, search
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
 */

export interface SubKategorie {
  /** Unique identifier */
  value: string
  /** German display name */
  label: string
}

export interface Kategorie {
  /** Unique identifier (2-digit recommended) */
  value: string
  /** German display name */
  label: string
  /** Icon (optional, for UI) */
  icon?: string
  /** Subcategories */
  subs: SubKategorie[]
}

/**
 * Product categories hierarchy
 */
export const KATEGORIEN: Kategorie[] = [
  {
    value: '10',
    label: 'Laptops',
    icon: '💻',
    subs: [
      { value: '101', label: 'Business Laptops' },
      { value: '102', label: 'Consumer Laptops' },
      { value: '103', label: 'Gaming Laptops' },
      { value: '104', label: 'Ultrabooks' },
      { value: '105', label: 'Convertibles' },
    ],
  },
  {
    value: '20',
    label: 'Desktop PCs',
    icon: '🖥️',
    subs: [
      { value: '201', label: 'Office PCs' },
      { value: '202', label: 'Gaming PCs' },
      { value: '203', label: 'Workstations' },
      { value: '204', label: 'Mini PCs' },
    ],
  },
  {
    value: '30',
    label: 'Monitore',
    icon: '🖵',
    subs: [
      { value: '301', label: 'Office Monitore' },
      { value: '302', label: 'Gaming Monitore' },
      { value: '303', label: 'Profi Monitore' },
    ],
  },
  {
    value: '40',
    label: 'Tablets',
    icon: '📱',
    subs: [
      { value: '401', label: 'Android Tablets' },
      { value: '402', label: 'iPads' },
      { value: '403', label: 'Windows Tablets' },
    ],
  },
  {
    value: '50',
    label: 'Smartphones',
    icon: '📱',
    subs: [
      { value: '501', label: 'Android' },
      { value: '502', label: 'iPhone' },
    ],
  },
  {
    value: '60',
    label: 'Drucker & Scanner',
    icon: '🖨️',
    subs: [
      { value: '601', label: 'Laserdrucker' },
      { value: '602', label: 'Tintenstrahldrucker' },
      { value: '603', label: 'Scanner' },
      { value: '604', label: 'Multifunktionsgeräte' },
    ],
  },
  {
    value: '70',
    label: 'Komponenten',
    icon: '🔧',
    subs: [
      { value: '701', label: 'Grafikkarten' },
      { value: '702', label: 'RAM' },
      { value: '703', label: 'SSDs/HDDs' },
      { value: '704', label: 'CPUs' },
      { value: '705', label: 'Netzteile' },
      { value: '706', label: 'Mainboards' },
    ],
  },
  {
    value: '80',
    label: 'Peripherie',
    icon: '🖱️',
    subs: [
      { value: '801', label: 'Tastaturen' },
      { value: '802', label: 'Mäuse' },
      { value: '803', label: 'Webcams' },
      { value: '804', label: 'Headsets' },
      { value: '805', label: 'Docking Stations' },
    ],
  },
  {
    value: '90',
    label: 'Netzwerk',
    icon: '🌐',
    subs: [
      { value: '901', label: 'Router' },
      { value: '902', label: 'Switches' },
      { value: '903', label: 'Access Points' },
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
export function getAllCategoriesFlat(): Array<{ value: string; label: string; isMain: boolean }> {
  const result: Array<{ value: string; label: string; isMain: boolean }> = []

  for (const kategorie of KATEGORIEN) {
    result.push({ value: kategorie.value, label: kategorie.label, isMain: true })
    for (const sub of kategorie.subs) {
      result.push({ value: sub.value, label: `${kategorie.label} > ${sub.label}`, isMain: false })
    }
  }

  return result
}
