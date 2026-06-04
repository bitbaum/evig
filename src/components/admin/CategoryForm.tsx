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
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useBlogCategories } from '@/hooks/useBlogCategories'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import type { CategoryFormData } from '@/hooks/useBlogCategories'
import { DEFAULT_CATEGORY_COLOR, UI_COLOR_PALETTE } from '@/config/ui-colors'
import { generateSlug } from '@/lib/utils/slug'
import { UI_FEEDBACK_MS } from '@/config/limits'
import { ROUTES } from '@/config/routes'

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
  const t = useTranslations('admin.categories')
  const { saving, deleting, error, success, saveCategory, deleteCategory } = useBlogCategories()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    color: initialData?.color || DEFAULT_CATEGORY_COLOR,
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
      setTimeout(() => router.push(ROUTES.admin.categories), UI_FEEDBACK_MS.REDIRECT)
    }
  }

  const doDelete = async () => {
    setConfirmDelete(false)
    const deleted = await deleteCategory(initialData?.id || '')
    if (deleted) {
      router.push(ROUTES.admin.categories)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.admin.categories}
            className="p-2 hover:bg-surface-raised dark:hover:bg-surface-base/6 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color + '20' }}
            >
              <Tag className="w-5 h-5" style={{ color: formData.color }} />
            </div>
            <div>
              <Heading level={1} className="text-2xl text-text-primary">
                {isEdit ? t('titleEdit') : t('titleNew')}
              </Heading>
              <p className="text-text-secondary">
                {isEdit ? t('subtitleEdit') : t('subtitleNew')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEdit && (
            <Button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? t('deleting') : t('delete')}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={saving || !formData.name || !formData.slug}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div id="category-form-error" className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-action-muted-muted border border-strong text-action px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <FormField label="Name" required htmlFor="category-name">
              <Input
                id="category-name"
                type="text"
                value={formData.name}
                onChange={(e) => updateName(e.target.value)}
                placeholder="z.B. Nachhaltigkeit"
                required
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'category-form-error' : undefined}
              />
            </FormField>

            {/* Slug */}
            <FormField label="Slug" required htmlFor="category-slug" hint="URL-freundlicher Name (automatisch generiert)">
              <Input
                id="category-slug"
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }}
                placeholder="z.B. nachhaltigkeit"
                className="font-mono text-sm"
                required
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'category-form-error' : undefined}
              />
            </FormField>

            {/* Description */}
            <FormField label="Beschreibung" className="md:col-span-2">
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Kurze Beschreibung der Kategorie..."
                rows={3}
                className="resize-none"
              />
            </FormField>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
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
                    className="w-10 h-10 rounded-sm cursor-pointer border-0"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="flex-1 font-mono text-sm"
                    placeholder={DEFAULT_CATEGORY_COLOR}
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
                          ? 'border-neutral-900 dark:border-white scale-110'
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
              <FormField label="Sortierung" htmlFor="sort-order" hint="Niedrigere Zahlen erscheinen zuerst">
                <Input
                  id="sort-order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={0}
                />
              </FormField>

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
                  className="w-5 h-5 rounded-sm border-neutral-300 text-action focus:ring-action"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-text-secondary"
                >
                  Aktiv (in Kategorie-Auswahl sichtbar)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
          <Heading level={3} className="text-sm font-medium text-text-secondary mb-4">
            {t('preview')}
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
              {formData.name || t('defaultName')}
            </span>
            <span className="text-sm text-text-tertiary">
              /blog/kategorie/{formData.slug || 'slug'}
            </span>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmDelete}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message')}
        itemName={formData.name}
        isLoading={deleting}
        onConfirm={doDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  )
}
