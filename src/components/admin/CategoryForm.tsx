'use client'

/**
 * CategoryForm - Reusable form for creating/editing blog categories
 *
 * Used by both /admin/content/categories/new and /admin/content/categories/[id]
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Heading from '@/components/admin/AdminHeading'
import { Tag, Save, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useBlogCategories } from '@/hooks/useBlogCategories'
import type { CategoryFormData } from '@/hooks/useBlogCategories'
import { UI_COLOR_PALETTE } from '@/config/ui-colors'
import { generateSlug } from '@/lib/utils/slug'

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>
  isEdit?: boolean
}

const COLOR_PALETTE = UI_COLOR_PALETTE

export default function CategoryForm({
  initialData,
  isEdit = false,
}: CategoryFormProps) {
  const router = useRouter()
  const { saving, deleting, error, success, saveCategory, deleteCategory } = useBlogCategories()
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    color: initialData?.color || '#22c55e',
    sort_order: initialData?.sort_order || 0,
    is_active: initialData?.is_active ?? true,
  })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit)

  // Auto-generate slug from name — computed during name change, not via effect
  const updateName = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      ...(!slugManuallyEdited && name ? { slug: generateSlug(name) } : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const saved = await saveCategory(formData, { isEdit, id: initialData?.id })
    if (saved) {
      setTimeout(() => router.push('/admin/content/categories'), 1000)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Kategorie wirklich löschen?')) return
    const deleted = await deleteCategory(initialData?.id || '')
    if (deleted) {
      router.push('/admin/content/categories')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content/categories"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color + '20' }}
            >
              <Tag className="w-5 h-5" style={{ color: formData.color }} />
            </div>
            <div>
              <Heading level={1} className="text-2xl text-gray-900 dark:text-white">
                {isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
              </Heading>
              <p className="text-gray-600 dark:text-gray-400">
                {isEdit
                  ? 'Kategorie-Details anpassen'
                  : 'Neue Blog-Kategorie erstellen'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Löschen...' : 'Löschen'}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.name || !formData.slug}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div id="category-form-error" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateName(e.target.value)}
                placeholder="z.B. Nachhaltigkeit"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'category-form-error' : undefined}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }}
                placeholder="z.B. nachhaltigkeit"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                required
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'category-form-error' : undefined}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL-freundlicher Name (automatisch generiert)
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Kurze Beschreibung der Kategorie..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Farbe
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    placeholder="#22c55e"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color }))
                      }
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        formData.color === color
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sort Order & Active Status */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sortierung
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Niedrigere Zahlen erscheinen zuerst
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Aktiv (in Kategorie-Auswahl sichtbar)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <Heading level={3} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Vorschau
          </Heading>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: formData.color + '20',
                color: formData.color,
              }}
            >
              <Tag className="w-4 h-4" />
              {formData.name || 'Kategorie-Name'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              /blog/kategorie/{formData.slug || 'slug'}
            </span>
          </div>
        </div>
      </form>
    </div>
  )
}
