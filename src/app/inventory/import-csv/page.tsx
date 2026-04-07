'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  ArrowLeft,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  duplicates: string[];
}

export default function ImportCSVPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string[][] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError('Bitte wählen Sie eine CSV-Datei aus')
        return
      }

      setFile(selectedFile)
      setError(null)
      setResult(null)

      // Preview CSV content
      try {
        const text = await selectedFile.text()
        const lines = text.split('\n').slice(0, 6) // First 6 lines for preview
        const parsed = lines.map(line => line.split(';').map(cell => cell.trim()))
        setPreview(parsed)
      } catch (err) {
        setError('Fehler beim Lesen der Datei')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const text = await file.text()

      const response = await fetch('/api/inventory/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvContent: text,
          options: {
            skipDuplicates: true,
            autoCategorize: true
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const importResult = await response.json()
      setResult(importResult)

    } catch (err) {
      setError('Fehler beim Importieren der CSV-Datei')
      logger.error('Import error', { error: err })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = `Artikelnummer;Typ;Artikelbeschreibung;Verkaufspreis;Hersteller
GA-N210SL-1GI;W;5185;0.00;Gigabyte
ALI00001;W;100% getestet Echtem Touch Panel Touchpad Trackpad Mit Kabel Für Apple Macbook Retina 13 ''A1502 Touchpad Trackpad 2015 Jahr;0.00;
406;W;10/100 Intellinet Netzwerkkarte;7.00;Intellinet
1608;W;10/100Mbps 3-port Print Server;15.00;unbekannt
2297;W;10Base-T Worgoup Ethernet Hub;0.00;
1931;W;128 MB  SDRAM DIMM 168pin 133 MHZ;10.00;diverse
5002;W;"15"" Touchcomputer";0.00;Tyco`

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_inventory.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              CSV Import
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Bestehende Inventardaten aus Kivitendo importieren
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200 mb-2">
                So funktioniert der Import
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Laden Sie Ihre CSV-Datei aus Kivitendo hoch</li>
                <li>• Die KI analysiert automatisch Produktnamen und Kategorien</li>
                <li>• Nachhaltigkeits-Scores werden automatisch berechnet</li>
                <li>• Doppelte Artikelnummern werden übersprungen</li>
                <li>• Produkte werden automatisch für den Verkauf freigegeben</li>
              </ul>
              <button
                onClick={downloadSampleCSV}
                className="mt-3 text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Beispiel-CSV herunterladen →
              </button>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="text-center">
            {!file ? (
              <div>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  CSV-Datei auswählen
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Wählen Sie Ihre exportierte Kivitendo-CSV-Datei aus
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-5 h-5" />
                  Datei auswählen
                </Button>
              </div>
            ) : (
              <div>
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Datei ausgewählt
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                    Andere Datei
                  </Button>
                  <Button onClick={handleUpload} disabled={isUploading} className="gap-2 px-6 py-3">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importiere...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Import starten
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CSV Preview */}
        {preview && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Dateivorschau
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {preview[0]?.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1, 4).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-600">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-gray-600 dark:text-gray-400">
                          {cell.length > 50 ? `${cell.substring(0, 50)}...` : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Zeigt die ersten 3 Datenzeilen von {preview.length - 1} Gesamtzeilen
            </p>
          </div>
        )}

        {/* Import Results */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Import abgeschlossen
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                <div className="text-sm text-green-800 dark:text-green-300">Importiert</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-yellow-800 dark:text-yellow-300">Übersprungen</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.duplicates.length}</div>
                <div className="text-sm text-blue-800 dark:text-blue-300">Duplikate</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  Fehler ({result.errors.length})
                </h4>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                    {result.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>• ... und {result.errors.length - 10} weitere Fehler</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={() => router.push('/inventory/dashboard')} className="gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700">
                Zum Dashboard
              </Button>
              <Button
                onClick={() => {
                  setFile(null)
                  setResult(null)
                  setPreview(null)
                }}
                variant="outline"
                className="gap-2 px-6 py-3"
              >
                Neue Datei importieren
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}















