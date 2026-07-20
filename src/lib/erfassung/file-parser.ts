/**
 * CSV/Excel File Parser for Bulk Erfassung
 *
 * Parses CSV/TSV/Excel files into BulkProduct arrays with automatic column detection.
 * Uses CSV_COLUMN_ALIASES config for mapping column names to form fields.
 */

import { parse } from 'csv-parse/sync'
import ExcelJS from 'exceljs'
import { CSV_COLUMN_ALIASES, normalizeConditionValue } from '@/config/erfassung'
import { createDefaultBulkProduct } from '@/types/erfassung'
import type { BulkProduct, ErfassungFormData } from '@/types/erfassung'
import { detectCategory } from './ai-classification'

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

    // Normalize condition alias to canonical DB value
    if (data.zustand) {
      data.zustand = normalizeConditionValue(data.zustand)
    }

    // Apply mapped data to product
    Object.assign(product, data)

    // Categorise rows that arrived without a category. A CSV rarely has a
    // category column, so — like the paste path — infer it from the name via
    // the shared keyword classifier (instant, no AI call). Left empty when
    // unknown so the operator picks, rather than guessing a wrong default.
    if (!product.hauptkategorie) {
      product.hauptkategorie = detectCategory(
        [product.hersteller, product.produktname, product.kurzbeschreibung].filter(Boolean).join(' '),
      )
    }

    // Validate and set status
    const hasRequired = product.hersteller && product.produktname
    product._status = hasRequired ? 'valid' : 'warning'
    product._errors = hasRequired ? [] : ['Hersteller und Produktname fehlen']

    return product
  })

  return { products, unmappedColumns }
}

/**
 * Parse Excel (.xlsx/.xls) buffer into BulkProduct array.
 * Converts the first sheet to CSV, then delegates to parseCSV().
 */
export async function parseExcel(buffer: ArrayBuffer): Promise<{
  products: BulkProduct[]
  unmappedColumns: string[]
}> {
  const workbook = new ExcelJS.Workbook()
  // ExcelJS types expect legacy Buffer; use Uint8Array conversion + assertion
  await workbook.xlsx.load(Buffer.from(new Uint8Array(buffer)) as never)

  const sheet = workbook.worksheets[0]
  if (!sheet || sheet.rowCount === 0) {
    return { products: [], unmappedColumns: [] }
  }

  // Convert sheet to semicolon-delimited CSV string
  const rows: string[] = []
  sheet.eachRow((row) => {
    const values = row.values as (string | number | boolean | null | undefined)[]
    // ExcelJS row.values is 1-indexed (index 0 is undefined), so slice from 1
    const cells = values.slice(1).map(v => {
      if (v == null) return ''
      const str = String(v)
      // Escape semicolons and quotes in cell values
      return str.includes(';') || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    })
    rows.push(cells.join(';'))
  })

  return parseCSV(rows.join('\n'))
}
