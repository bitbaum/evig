'use client'

/**
 * BulkSuccessScreen Component
 *
 * Shown after a bulk save completes. Displays summary of saved/failed products
 * with options to retry failed, download results, or start new erfassung.
 */

import { CheckCircle2, AlertCircle, Download, RotateCcw, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import type { BulkSaveResponse } from '@/types/erfassung'

interface BulkSuccessScreenProps {
  result: BulkSaveResponse
  onRetryFailed: () => void
  onReset: () => void
}

export function BulkSuccessScreen({ result, onRetryFailed, onReset }: BulkSuccessScreenProps) {
  const t = useTranslations('components.erfassung.bulkSuccess')
  const hasFailures = result.failed > 0

  const handleDownloadCSV = () => {
    const headers = ['#', 'Status', 'Produkt-ID', 'Item-UUID', 'Fehler']
    const rows = result.results.map((r, i) => [
      i + 1,
      r.success ? t('successLabel') : t('failedLabel'),
      r.productId || '-',
      r.itemUUID || '-',
      r.error || '-',
    ])

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `erfassung-ergebnis-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          {hasFailures ? (
            <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <Heading level={2} className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {hasFailures ? t('titlePartial') : t('titleAll')}
          </Heading>
          <p className="text-gray-600 dark:text-gray-400">
            {t('summary', { succeeded: result.succeeded, total: result.total })}
            {hasFailures && `, ${t('failed', { count: result.failed })}`}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{result.succeeded}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('successLabel')}</div>
          </div>
          {hasFailures && (
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{result.failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('failedLabel')}</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{result.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('totalLabel')}</div>
          </div>
        </div>

        {/* Item UUIDs list for successful saves */}
        {result.results.some(r => r.success && r.itemUUID) && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-left max-h-48 overflow-y-auto">
            <Heading level={3} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('createdIds')}</Heading>
            <div className="space-y-1">
              {result.results
                .filter(r => r.success && r.itemUUID)
                .map((r, i) => (
                  <div key={i} className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {r.itemUUID}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasFailures && (
            <button
              type="button"
              onClick={onRetryFailed}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t('retryFailed')}
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('downloadCsv')}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('newCapture')}
          </button>
        </div>
      </div>
    </div>
  )
}
