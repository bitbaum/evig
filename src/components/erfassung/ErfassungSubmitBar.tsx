import Link from 'next/link'
import { Save, Loader2, Package } from 'lucide-react'

interface Props {
  isEditMode: boolean
  isLoading: boolean
  onSubmit: (e: React.FormEvent, action: 'draft' | 'erfassen' | 'publish') => void
}

export function ErfassungSubmitBar({ isEditMode, isLoading, onSubmit }: Props) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex justify-between items-center pt-4">
        <Link
          href="/admin/products"
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
        >
          Abbrechen
        </Link>

        <div className="flex gap-3">
          {isEditMode ? (
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Speichere...</>
              ) : (
                <><Save className="w-5 h-5" /> Änderungen speichern</>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'draft')}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Save className="w-5 h-5" /> Entwurf</>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'erfassen')}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Package className="w-5 h-5" /> Erfassen</>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'publish')}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Package className="w-5 h-5" /> Erfassen & Shop</>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-50 safe-area-inset-bottom">
        {isEditMode ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              const form = document.querySelector('form')
              if (form) form.requestSubmit()
            }}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Änderungen speichern</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'draft')}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold px-3 py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'erfassen')}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <span>Erfassen</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'publish')}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <span>+ Shop</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
