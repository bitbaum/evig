"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Upload, XCircle } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

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
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <Heading level={2} className="text-xl text-neutral-900">
                  Bulk-Import von Produkten
                </Heading>
                <button
                  onClick={onClose}
                  className="text-neutral-500 hover:text-neutral-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload */}
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <Heading level={3} className="text-lg font-medium text-neutral-900 mb-2">
                  CSV-Datei auswählen
                </Heading>
                <p className="text-neutral-600 mb-4">
                  Lade eine CSV-Datei mit deinen Produkten hoch
                </p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 cursor-pointer inline-block"
                >
                  Datei auswählen
                </label>
              </div>

              {/* CSV Format Info */}
              <div className="bg-info-50 rounded-lg p-4">
                <Heading level={4} className="font-medium text-info-900 mb-2">
                  Erforderliches CSV-Format:
                </Heading>
                <div className="text-sm text-info-800 font-mono bg-info-100 p-3 rounded">
                  Titel,Beschreibung,Preis (CHF),Kategorie,Marke,Bild-URL
                  <br />
                  &quot;Dell Latitude E7470&quot;,&quot;Professioneller Laptop&quot;,599.00,&quot;Laptops&quot;,&quot;Dell&quot;,&quot;https://...&quot;
                  <br />
                  &quot;Samsung Monitor 27&quot;&quot;,&quot;4K Monitor&quot;,449.00,&quot;Monitore&quot;,&quot;Samsung&quot;,&quot;https://...&quot;
                </div>
                <p className="text-xs text-info-700 mt-2">
                  Hinweis: Die erste Zeile muss die Spaltenüberschriften enthalten
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Abbrechen
                </button>
                <button className="px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700">
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
