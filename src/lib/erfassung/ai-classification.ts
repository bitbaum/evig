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
 * Keyword-based product-category detection → KATEGORIEN code, or '' if unknown.
 *
 * Single SSOT for the fast/offline classifier: used by the CSV import (instant,
 * no AI call, so spreadsheet rows land categorised like the paste path), the
 * fast text parser, and the multi-extract AI fallback. The paste/photo paths
 * prefer the AI's category and only fall back here. Codes come from KATEGORIEN
 * (looked up by label) so they stay SSOT.
 *
 * Accessory/printer/monitor/network patterns are matched BEFORE the laptop and
 * desktop brand patterns — otherwise "Dockingstation Lenovo ThinkPad" would hit
 * the `thinkpad` laptop pattern and mis-file a dock as a laptop.
 */
export function detectCategory(text: string): string {
  const code = (label: string): string => KATEGORIEN.find(k => k.label === label)?.value ?? ''
  const patterns: Array<[RegExp, string]> = [
    [/\b(drucker|laserjet|pixma|officejet|deskjet|i-?sensys|imageclass|maxify|multifunktion|printer|scanner|toner)\b|\b(mfc|dcp)[-\s]/i, code('Drucker & Scanner')],
    [/\b(ultrasharp|ultrawide|monitor|bildschirm|beamer|projektor|eizo|zoll[\s-]*(led|lcd|tft))\b/i, code('Monitore')],
    [/\b(dockingstation|dock|router|switch|access\s*point|firewall|netzwerk(adapter)?|wlan|nas|tp-?link|archer|\bmodem\b|converged\s*network|(ethernet|network|server)\s*adapter|ubee)\b/i, code('Netzwerk')],
    [/\b(tastatur|keyboard|maus|mouse|webcam|headset|lautsprecher)\b/i, code('Peripherie')],
    [/\b(ipad|galaxy\s*tab|surface\s*(go|pro)|tablet)\b/i, code('Tablets')],
    [/\b(iphone|galaxy\s*s\d|pixel\s*\d|smartphone|handy)\b/i, code('Smartphones')],
    [/\b(thinkpad|latitude|elitebook|probook|macbook|ideapad|inspiron|pavilion|vivobook|zenbook|chromebook|swift|aspire|travelmate|lifebook|\bxps\b|laptop|notebook|ultrabook)\b/i, code('Laptops')],
    [/\b(optiplex|prodesk|thinkcentre|imac|mac\s*mini|nuc|elitedesk|esprimo|compaq\s*\d|desktop|tower|workstation|power\s*macintosh|pc)\b/i, code('Desktop PCs')],
    // Internal PC parts → the existing "Komponenten" bucket. Checked LAST so a
    // device name (laptop/desktop/monitor…) always wins over a parts keyword.
    // Includes single-category component brands (Nvidia/ATI/Seagate/WD/Arctic…)
    // that only make one kind of part, so a bare model number still classifies.
    [/\b(grafikkarte|graphics\s*card|\bgpu\b|radeon|geforce|quadro|nvidia|\bati\b|sapphire|matrox|club3d|festplatte|\bhdd\b|\bssd\b|nvme|barracuda|spinpoint|deskstar|caviar|seagate|western\s*digital|\bwd\d|mainboard|motherboard|\bcpu\b|prozessor|ryzen|\bxeon\b|pentium|celeron|kühler|lüfter|\bcooler\b|freezer|hydro|wraith|cryorig|gelid|\barctic\b|netzteil|\bpsu\b|be\s*quiet|arbeitsspeicher|\bddr\d?\b|\bdimm\b|laufwerk|dvd|blu-?ray|optisches|zip-?laufwerk|tape\s*drive|diskette)\b/i, code('Komponenten')],
  ]
  for (const [re, cat] of patterns) {
    if (cat && re.test(text)) return cat
  }
  return ''
}

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

  // Category via the shared keyword classifier; default to laptops (the most
  // common intake) when nothing matches. Values derive from KATEGORIEN SSOT.
  const catLaptops = KATEGORIEN.find(k => k.label === 'Laptops')!
  const hauptkategorie = detectCategory(text) || catLaptops.value

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
