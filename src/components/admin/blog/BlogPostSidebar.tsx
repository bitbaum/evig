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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <Heading level={3} className="font-medium text-gray-900 dark:text-white mb-4">Status</Heading>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => onFormDataChange({ ...formData, isPublished: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
          </label>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {formData.isPublished ? 'Veröffentlicht' : 'Entwurf'}
          </span>
        </div>
      </div>

      {/* Category */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <Heading level={3} className="font-medium text-gray-900 dark:text-white mb-4">Kategorie</Heading>
        <select
          value={formData.categoryId}
          onChange={(e) => onFormDataChange({ ...formData, categoryId: e.target.value })}
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Keine Kategorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Featured Image */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <Heading level={3} className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Beitragsbild
        </Heading>
        <input
          type="text"
          value={formData.featuredImage}
          onChange={(e) => onFormDataChange({ ...formData, featuredImage: e.target.value })}
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <Heading level={3} className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </Heading>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Tag hinzufügen"
          />
          <button
            type="button"
            onClick={onAddTag}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="hover:text-green-900 dark:hover:text-green-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <Heading level={3} className="font-medium text-gray-900 dark:text-white mb-4">SEO</Heading>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Meta-Titel</label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => onFormDataChange({ ...formData, seoTitle: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={formData.title || 'SEO Titel'}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Meta-Beschreibung</label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => onFormDataChange({ ...formData, seoDescription: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={formData.excerpt || 'SEO Beschreibung'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
