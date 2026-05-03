import { Image as ImageIcon, Tag } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import type { BlogPostData, Category } from './types'

interface Props {
  formData: BlogPostData
  categories: Category[]
  tagInput: string
  onFormDataChange: (data: BlogPostData) => void
  onTagInputChange: (value: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
}

export function BlogPostSidebar({
  formData,
  categories,
  tagInput,
  onFormDataChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <Heading level={3} className="font-medium text-neutral-900 dark:text-white mb-4">Status</Heading>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => onFormDataChange({ ...formData, isPublished: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-500 peer-checked:bg-primary-600"></div>
          </label>
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {formData.isPublished ? 'Veröffentlicht' : 'Entwurf'}
          </span>
        </div>
      </div>

      {/* Category */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <Heading level={3} className="font-medium text-neutral-900 dark:text-white mb-4">Kategorie</Heading>
        <select
          value={formData.categoryId}
          onChange={(e) => onFormDataChange({ ...formData, categoryId: e.target.value })}
          className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Keine Kategorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Featured Image */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <Heading level={3} className="font-medium text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Beitragsbild
        </Heading>
        <input
          type="text"
          value={formData.featuredImage}
          onChange={(e) => onFormDataChange({ ...formData, featuredImage: e.target.value })}
          className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="https://..."
        />
        {formData.featuredImage && (
          <img
            src={formData.featuredImage}
            alt="Preview"
            className="mt-4 rounded-lg w-full h-32 object-cover"
          />
        )}
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <Heading level={3} className="font-medium text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </Heading>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
            className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Tag hinzufügen"
          />
          <button
            type="button"
            onClick={onAddTag}
            className="px-3 py-2 bg-neutral-100 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-500"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="hover:text-primary-900 dark:hover:text-primary-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700">
        <Heading level={3} className="font-medium text-neutral-900 dark:text-white mb-4">SEO</Heading>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Meta-Titel</label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => onFormDataChange({ ...formData, seoTitle: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={formData.title || 'SEO Titel'}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">Meta-Beschreibung</label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => onFormDataChange({ ...formData, seoDescription: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={formData.excerpt || 'SEO Beschreibung'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
