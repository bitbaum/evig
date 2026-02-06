/**
 * CSV File Parser for Bulk Erfassung
 *
 * Parses CSV/TSV files into BulkProduct arrays with automatic column detection.
 * Uses CSV_COLUMN_ALIASES config for mapping column names to form fields.
 */

import { parse } from 'csv-parse/sync'
import { CSV_COLUMN_ALIASES } from '@/config/erfassung'
import { createDefaultBulkProduct } from '@/types/erfassung'
import type { BulkProduct, ErfassungFormData } from '@/types/erfassung'

/**
 * Auto-detect delimiter by checking first few lines
 */
function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0] || ''
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const commaCount = (firstLine.match(/,/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length

  if (tabCount > semicolonCount && tabCount > commaCount) return '\t'
  if (semicolonCount > commaCount) return ';'
  return ','
}

/**
 * Map a CSV column header to an ErfassungFormData field name
 */
function mapColumnName(header: string): string | null {
  const normalized = header.trim().toLowerCase().replace(/[\s-_]+/g, '_')
  return CSV_COLUMN_ALIASES[normalized] || null
}

/**
 * Parse CSV content into BulkProduct array
 *
 * @param content - Raw CSV/TSV string
 * @returns Object with parsed products and any unmapped column names
 */
export function parseCSV(content: string): {
  products: BulkProduct[]
  unmappedColumns: string[]
} {
  const delimiter = detectDelimiter(content)

  const records: Record<string, string>[] = parse(content, {
    columns: true,
    delimiter,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  })

  if (records.length === 0) {
    return { products: [], unmappedColumns: [] }
  }

  // Build column mapping from CSV headers to form fields
  const csvHeaders = Object.keys(records[0])
  const columnMap: Record<string, string> = {}
  const unmappedColumns: string[] = []

  for (const header of csvHeaders) {
    const mapped = mapColumnName(header)
    if (mapped) {
      columnMap[header] = mapped
    } else {
      unmappedColumns.push(header)
    }
  }

  // Convert each record to a BulkProduct
  const products: BulkProduct[] = records.map((record) => {
    const product = createDefaultBulkProduct('csv')
    const data: Partial<ErfassungFormData> = {}

    for (const [csvCol, formField] of Object.entries(columnMap)) {
      const value = record[csvCol]
      if (!value) continue

      if (formField === 'kundenprofile') {
        // Comma-separated profile slugs
        data.kundenprofile = value.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        ;(data as Record<string, string>)[formField] = value
      }
    }

    // Apply mapped data to product
    Object.assign(product, data)

    // Validate and set status
    const hasRequired = product.hersteller && product.produktname
    product._status = hasRequired ? 'valid' : 'warning'
    product._errors = hasRequired ? [] : ['Hersteller und Produktname fehlen']

    return product
  })

  return { products, unmappedColumns }
}
