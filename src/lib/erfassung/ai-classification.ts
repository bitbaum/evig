/**
 * AI Classification — Product type detection, category assignment, condition parsing.
 *
 * Contains the fast regex-based fallback parser that extracts structured product data
 * from raw text using pattern matching. Used when AI providers are unavailable.
 *
 * Business rules for:
 * - Manufacturer detection
 * - Model name extraction
 * - Spec parsing (CPU, RAM, storage)
 * - Price extraction
 * - Condition assessment
 * - Category/subcategory classification
 * - Customer profile assignment
 */

import type { VoiceProductData } from '@/types/erfassung'
import { KATEGORIEN } from '@/config/erfassung/categories'

/**
 * Fast regex-based fallback parser for when AI providers are slow/unavailable.
 * Extracts product info directly from text using pattern matching.
 */
export function fastParseProductText(text: string): VoiceProductData {
  const textLower = text.toLowerCase()

  // Known manufacturers
  const manufacturers = ['dell', 'hp', 'lenovo', 'apple', 'asus', 'acer', 'microsoft', 'samsung', 'thinkpad', 'macbook']
  const hersteller = manufacturers.find(m => textLower.includes(m)) || ''

  // Extract model name (words after manufacturer, typically alphanumeric)
  const modelMatch = text.match(/(?:latitude|thinkpad|elitebook|probook|macbook|surface|inspiron|xps|pavilion)\s*[\w\-]+/i)
  const produktname = modelMatch ? modelMatch[0] : text.split(/\s+/).slice(0, 3).join(' ')

  // Extract specs
  const specs: Array<{key: string, value: string}> = []

  // CPU
  const cpuMatch = text.match(/i[357]\s*[-]?\s*\d{4,5}[a-z]?|ryzen\s*\d|m[123]\s*(pro|max)?|core\s*\d/i)
  if (cpuMatch) specs.push({ key: 'CPU', value: cpuMatch[0] })

  // RAM
  const ramMatch = text.match(/(\d+)\s*gb\s*(ram)?/i)
  if (ramMatch) specs.push({ key: 'RAM', value: `${ramMatch[1]} GB` })

  // Storage
  const storageMatch = text.match(/(\d+)\s*gb\s*(ssd|hdd|nvme)|(\d+)\s*tb/i)
  if (storageMatch) {
    const size = storageMatch[1] || storageMatch[3]
    const unit = storageMatch[3] ? 'TB' : 'GB'
    const type = storageMatch[2]?.toUpperCase() || 'SSD'
    specs.push({ key: 'Speicher', value: `${size} ${unit} ${type}` })
  }

  // Price - look for number with currency indicator, or standalone price-like number at end
  // Must have currency indicator OR be a reasonable price (50-9999) not followed by GB/SSD/etc
  const priceWithCurrency = text.match(/(\d{2,4})\s*(chf|franken|fr\.?|sfr|.-)/i)
  const priceAtEnd = text.match(/\b(\d{2,4})\s*$/i) // number at end of string
  const verkaufspreis = priceWithCurrency ? priceWithCurrency[1]
    : (priceAtEnd && parseInt(priceAtEnd[1]) >= 50 && parseInt(priceAtEnd[1]) <= 9999) ? priceAtEnd[1]
    : ''

  // Condition
  let zustand = 'good'
  if (textLower.includes('neu') && !textLower.includes('wie neu')) zustand = 'new'
  else if (textLower.includes('wie neu')) zustand = 'like_new'
  else if (textLower.includes('gut')) zustand = 'good'
  else if (textLower.includes('akzeptabel') || textLower.includes('fair')) zustand = 'fair'
  else if (textLower.includes('schlecht')) zustand = 'poor'

  // Category - default to laptops (values derived from KATEGORIEN SSOT)
  const catLaptops = KATEGORIEN.find(k => k.label === 'Laptops')!
  const catDesktops = KATEGORIEN.find(k => k.label === 'Desktop PCs')!
  const catMonitors = KATEGORIEN.find(k => k.label === 'Monitore')!

  const hauptkategorie = textLower.includes('monitor') ? catMonitors.value
    : textLower.includes('desktop') || textLower.includes('pc') ? catDesktops.value
    : catLaptops.value

  const subBusiness = catLaptops.subs.find(s => s.label === 'Business Laptops')?.value || ''
  const subConsumer = catLaptops.subs.find(s => s.label === 'Consumer Laptops')?.value || ''
  const subGaming = catLaptops.subs.find(s => s.label === 'Gaming Laptops')?.value || ''

  const unterkategorie = hauptkategorie === catLaptops.value
    ? (textLower.includes('gaming') ? subGaming : textLower.includes('business') || textLower.includes('latitude') || textLower.includes('thinkpad') ? subBusiness : subConsumer)
    : ''

  // Customer profiles based on product type
  const kundenprofile: string[] = []
  if (textLower.includes('thinkpad') || textLower.includes('latitude') || textLower.includes('elitebook')) {
    kundenprofile.push('buero', 'dev')
  }
  if (textLower.includes('gaming')) kundenprofile.push('gamer')
  if (kundenprofile.length === 0) kundenprofile.push('buero', 'student')

  return {
    hersteller: hersteller.charAt(0).toUpperCase() + hersteller.slice(1),
    produktname,
    kurzbeschreibung: `${hersteller} ${produktname} - gebrauchtes Gerät in gutem Zustand`,
    specs,
    verkaufspreis,
    zustand,
    hauptkategorie,
    unterkategorie,
    kundenprofile,
  }
}
