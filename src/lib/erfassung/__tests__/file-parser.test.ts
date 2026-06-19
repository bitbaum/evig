/**
 * Tests for file-parser.ts
 *
 * Tests CSV parsing, delimiter detection, column mapping,
 * and product validation from file input.
 */

// exceljs is only used by parseExcel; these tests exercise parseCSV only.
// Stub it so Jest never loads exceljs' ESM-only `uuid` dependency (which isn't
// transformed and otherwise crashes the whole suite at import time).
jest.mock('exceljs', () => ({ Workbook: class {} }))

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: () => data,
      status: init?.status || 200,
    }),
  },
}))

import { parseCSV } from '../file-parser'

// ============================================================================
// parseCSV - Basic functionality
// ============================================================================

describe('parseCSV', () => {
  it('parses semicolon-delimited CSV with known headers', () => {
    const csv = `Hersteller;Produktname;Preis;Zustand
Dell;Latitude 5540;350;Gut
HP;EliteBook 840;299;Sehr gut`

    const { products, unmappedColumns } = parseCSV(csv)
    expect(products).toHaveLength(2)
    expect(products[0].hersteller).toBe('Dell')
    expect(products[0].produktname).toBe('Latitude 5540')
    expect(products[0].verkaufspreis).toBe('350')
    expect(products[1].hersteller).toBe('HP')
    expect(unmappedColumns).toHaveLength(0)
  })

  it('parses comma-delimited CSV', () => {
    const csv = `Brand,Model,Price
Lenovo,ThinkPad X1,450
Asus,ZenBook 14,380`

    const { products } = parseCSV(csv)
    expect(products).toHaveLength(2)
    expect(products[0].hersteller).toBe('Lenovo')
    expect(products[0].produktname).toBe('ThinkPad X1')
    expect(products[0].verkaufspreis).toBe('450')
  })

  it('parses tab-delimited TSV', () => {
    const tsv = `Marke\tProdukt\tPreis\nApple\tMacBook Pro\t800\nSamsung\tGalaxy S21\t400`

    const { products } = parseCSV(tsv)
    expect(products).toHaveLength(2)
    expect(products[0].hersteller).toBe('Apple')
  })

  it('maps German column aliases correctly', () => {
    const csv = `Firma;Modell;VK;Beschreibung
Dell;XPS 15;999;Business Laptop`

    const { products, unmappedColumns } = parseCSV(csv)
    expect(products).toHaveLength(1)
    expect(products[0].hersteller).toBe('Dell')
    expect(products[0].produktname).toBe('XPS 15')
    expect(products[0].verkaufspreis).toBe('999')
    expect(products[0].kurzbeschreibung).toBe('Business Laptop')
    expect(unmappedColumns).toHaveLength(0)
  })

  it('maps English column aliases correctly', () => {
    const csv = `Manufacturer;Product;Price;Condition
Dell;Latitude;350;Good`

    const { products } = parseCSV(csv)
    expect(products).toHaveLength(1)
    expect(products[0].hersteller).toBe('Dell')
    expect(products[0].produktname).toBe('Latitude')
  })

  it('reports unmapped columns', () => {
    const csv = `Hersteller;Produktname;UnknownField;AnotherOne
Dell;XPS;foo;bar`

    const { products, unmappedColumns } = parseCSV(csv)
    expect(products).toHaveLength(1)
    expect(unmappedColumns).toContain('UnknownField')
    expect(unmappedColumns).toContain('AnotherOne')
  })

  it('returns empty for empty content', () => {
    const csv = `Hersteller;Produktname`
    const { products } = parseCSV(csv)
    expect(products).toHaveLength(0)
  })

  it('sets valid status when required fields present', () => {
    const csv = `Hersteller;Produktname
Dell;Latitude`

    const { products } = parseCSV(csv)
    expect(products[0]._status).toBe('valid')
    expect(products[0]._errors).toHaveLength(0)
  })

  it('sets warning status when required fields missing', () => {
    const csv = `Beschreibung
Nur eine Beschreibung`

    const { products } = parseCSV(csv)
    expect(products[0]._status).toBe('warning')
    expect(products[0]._errors.length).toBeGreaterThan(0)
  })

  it('handles BOM in CSV', () => {
    const csvWithBom = '\uFEFFHersteller;Produktname\nDell;Latitude'
    const { products } = parseCSV(csvWithBom)
    expect(products).toHaveLength(1)
    expect(products[0].hersteller).toBe('Dell')
  })

  it('skips empty lines', () => {
    const csv = `Hersteller;Produktname

Dell;Latitude

HP;EliteBook
`
    const { products } = parseCSV(csv)
    expect(products).toHaveLength(2)
  })

  it('maps dimension columns', () => {
    const csv = `Hersteller;Produktname;Länge;Breite;Höhe;Gewicht
Dell;Laptop;350;250;20;1.5`

    const { products } = parseCSV(csv)
    expect(products[0].laenge_mm).toBe('350')
    expect(products[0].breite_mm).toBe('250')
    expect(products[0].hoehe_mm).toBe('20')
    expect(products[0].gewicht_kg).toBe('1.5')
  })

  it('maps inventory columns', () => {
    const csv = `Hersteller;Produktname;Lagerort;Box;Menge
Dell;Latitude;Zürich;A1;5`

    const { products } = parseCSV(csv)
    expect(products[0].location).toBe('Zürich')
    expect(products[0].box_id).toBe('A1')
    expect(products[0].auf_lager).toBe('5')
  })
})
