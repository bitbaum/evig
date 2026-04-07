import Link from 'next/link'
import { Save, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
          className="inline-flex items-center justify-center rounded-md font-medium px-6 py-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-900"
        >
          Abbrechen
        </Link>

        <div className="flex gap-3">
          {isEditMode ? (
            <Button type="submit" disabled={isLoading} className="gap-2 px-6 py-3">
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Speichere...</>
              ) : (
                <><Save className="w-5 h-5" /> Änderungen speichern</>
              )}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'draft')}
                disabled={isLoading}
                className="gap-2 px-5 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Save className="w-5 h-5" /> Entwurf</>
                )}
              </Button>

              <Button
                type="button"
                onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'erfassen')}
                disabled={isLoading}
                variant="primary" className="gap-2 px-5 py-3 disabled:bg-blue-400"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Package className="w-5 h-5" /> Erfassen</>
                )}
              </Button>

              <Button
                type="button"
                onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'publish')}
                disabled={isLoading}
                className="gap-2 px-5 py-3"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Package className="w-5 h-5" /> Erfassen & Shop</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-50 safe-area-inset-bottom">
        {isEditMode ? (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              const form = document.querySelector('form')
              if (form) form.requestSubmit()
            }}
            disabled={isLoading}
            className="w-full gap-2 py-4 rounded-xl touch-manipulation min-h-[52px]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Änderungen speichern</span>
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'draft')}
              disabled={isLoading}
              className="gap-1 px-3 py-4 rounded-xl touch-manipulation min-h-[52px] bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
            </Button>

            <Button
              type="button"
              onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'erfassen')}
              disabled={isLoading}
              variant="primary" className="flex-1 gap-2 py-4 rounded-xl touch-manipulation min-h-[52px] disabled:bg-blue-400"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <span>Erfassen</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={(e) => onSubmit(e as unknown as React.FormEvent, 'publish')}
              disabled={isLoading}
              className="flex-1 gap-2 py-4 rounded-xl touch-manipulation min-h-[52px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  <span>+ Shop</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
