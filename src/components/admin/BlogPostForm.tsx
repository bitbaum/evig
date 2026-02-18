'use client'

/**
 * Blog Post Form
 *
 * Reusable form for creating and editing blog posts.
 * Used by /admin/content/blog/new and /admin/content/blog/[id]
 */

import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react'
import {
  useBlogPostForm,
  BlogPostEditor,
  BlogPostSidebar,
  BlogAIModal,
} from './blog'
import type { BlogPostFormProps } from './blog'

export function BlogPostForm({ initialData, isEdit = false }: BlogPostFormProps) {
  const {
    formData,
    setFormData,
    categories,
    saving,
    error,
    success,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTitleChange,
    handleSubmit,
    showAIModal,
    setShowAIModal,
    aiMode,
    aiTopic,
    setAiTopic,
    aiInstruction,
    setAiInstruction,
    aiGenerating,
    aiError,
    handleAIGenerate,
    handleAIRefine,
    openAIModal,
    quickActions,
  } = useBlogPostForm({ initialData, isEdit })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content/blog"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Artikel bearbeiten' : 'Neuer Artikel'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEdit ? 'Änderungen am Artikel vornehmen' : 'Erstellen Sie einen neuen Blog-Artikel'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEdit ? (
            <button
              onClick={() => openAIModal('refine')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Mit KI verbessern
            </button>
          ) : (
            <button
              onClick={() => openAIModal('generate')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Mit KI generieren
            </button>
          )}
          {formData.slug && isEdit && (
            formData.isPublished ? (
              <Link
                href={`/blog/${formData.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Veröffentlichten Artikel ansehen"
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </Link>
            ) : (
              <span
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                title="Artikel muss zuerst veröffentlicht werden"
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </span>
            )
          )}
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving || !formData.title || !formData.content}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Speichern
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving || !formData.title || !formData.content}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Veröffentlichen
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BlogPostEditor
          formData={formData}
          onFormDataChange={setFormData}
          onTitleChange={handleTitleChange}
        />

        <BlogPostSidebar
          formData={formData}
          categories={categories}
          tagInput={tagInput}
          onFormDataChange={setFormData}
          onTagInputChange={setTagInput}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <BlogAIModal
          aiMode={aiMode}
          aiTopic={aiTopic}
          aiInstruction={aiInstruction}
          aiGenerating={aiGenerating}
          aiError={aiError}
          categoryName={categories.find(c => c.id === formData.categoryId)?.name}
          quickActions={quickActions}
          onTopicChange={setAiTopic}
          onInstructionChange={setAiInstruction}
          onGenerate={handleAIGenerate}
          onRefine={handleAIRefine}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  )
}
