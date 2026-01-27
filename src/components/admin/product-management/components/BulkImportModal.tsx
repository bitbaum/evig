'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Upload, XCircle } from 'lucide-react'

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Bulk-Import von Produkten
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  CSV-Datei auswählen
                </h3>
                <p className="text-gray-600 mb-4">
                  Laden Sie eine CSV-Datei mit Ihren Produkten hoch
                </p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer inline-block"
                >
                  Datei auswählen
                </label>
              </div>

              {/* CSV Format Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Erforderliches CSV-Format:
                </h4>
                <div className="text-sm text-blue-800 font-mono bg-blue-100 p-3 rounded">
                  Titel,Beschreibung,Preis (CHF),Kategorie,Marke,Bild-URL<br/>
                  &quot;Dell Latitude E7470&quot;,&quot;Professioneller Laptop&quot;,599.00,&quot;Laptops&quot;,&quot;Dell&quot;,&quot;https://...&quot;<br/>
                  &quot;Samsung Monitor 27&apos;&quot;,&quot;4K Monitor&quot;,449.00,&quot;Monitore&quot;,&quot;Samsung&quot;,&quot;https://...&quot;
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Hinweis: Die erste Zeile muss die Spaltenüberschriften enthalten
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Produkte importieren
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
