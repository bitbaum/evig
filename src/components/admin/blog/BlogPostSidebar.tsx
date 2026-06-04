import { Image as ImageIcon, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
      <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
        <Heading level={3} className="font-medium text-text-primary mb-4">Status</Heading>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => onFormDataChange({ ...formData, isPublished: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-overlay peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-base after:border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-action"></div>
          </label>
          <span className="text-sm text-text-secondary">
            {formData.isPublished ? 'Veröffentlicht' : 'Entwurf'}
          </span>
        </div>
      </div>

      {/* Category */}
      <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
        <Heading level={3} className="font-medium text-text-primary mb-4">Kategorie</Heading>
        <Select
          value={formData.categoryId}
          onChange={(e) => onFormDataChange({ ...formData, categoryId: e.target.value })}
        >
          <option value="">Keine Kategorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>
      </div>

      {/* Featured Image */}
      <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
        <Heading level={3} className="font-medium text-text-primary mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Beitragsbild
        </Heading>
        <Input
          type="text"
          value={formData.featuredImage}
          onChange={(e) => onFormDataChange({ ...formData, featuredImage: e.target.value })}
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
      <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
        <Heading level={3} className="font-medium text-text-primary mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags
        </Heading>
        <div className="flex gap-2 mb-3">
          <Input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
            className="flex-1"
            placeholder="Tag hinzufügen"
          />
          <Button type="button" onClick={onAddTag} variant="secondary" size="sm">
            +
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-action-muted-muted text-action rounded-sm text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="hover:text-action-text"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
        <Heading level={3} className="font-medium text-text-primary mb-4">SEO</Heading>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Meta-Titel</label>
            <Input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => onFormDataChange({ ...formData, seoTitle: e.target.value })}
              placeholder={formData.title || 'SEO Titel'}
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Meta-Beschreibung</label>
            <Textarea
              value={formData.seoDescription}
              onChange={(e) => onFormDataChange({ ...formData, seoDescription: e.target.value })}
              rows={2}
              placeholder={formData.excerpt || 'SEO Beschreibung'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
