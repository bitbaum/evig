/**
 * EditSubmissionModal Component
 *
 * Modal for editing blog submission fields before approval/publishing.
 * Allows admins to make modifications without rejecting the submission.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Heading from '@/components/ui/Heading';
import { BLOG_SUBMISSION_EDITABLE_FIELDS } from '@/config/editable-fields';
import { logger } from '@/lib/logger';
import { apiFetch } from '@/lib/api/client';

interface BlogSubmission {
  id: string;
  title: string;
  content: string;
  excerpt?: string | null;
  category_id?: string | null;
  tags?: string[];
}

interface EditSubmissionModalProps {
  submission: BlogSubmission;
  onClose: () => void;
  onSaved: () => void;
}

export function EditSubmissionModal({
  submission,
  onClose,
  onSaved,
}: EditSubmissionModalProps) {
  // Initialize form data from submission
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data: Record<string, any> = {};
    Object.keys(BLOG_SUBMISSION_EDITABLE_FIELDS).forEach((field) => {
      data[field] = (submission as unknown as Record<string, unknown>)[field] ?? '';
    });
    return data;
  });

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load blog categories for the select field
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await apiFetch<Array<{ id: string; name: string }>>('/api/admin/blog/categories');
        if (result.success && result.data) {
          setCategories(result.data);
        }
      } catch (err) {
        logger.error('Error loading categories', { error: err });
      }
    };
    loadCategories();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await apiFetch(`/api/admin/blog/submissions/${submission.id}`, {
        method: 'PATCH',
        body: {
          action: 'edit',
          fields: formData,
        },
      });

      if (result.success) {
        onSaved();
      } else {
        setError(result.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      logger.error('Error saving submission edit', { error: err });
      setError('Netzwerkfehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string | string[] | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle tags field (comma-separated to array)
  const handleTagsChange = (value: string) => {
    const tagsArray = value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    handleFieldChange('tags', tagsArray);
  };

  const renderField = (field: keyof typeof BLOG_SUBMISSION_EDITABLE_FIELDS) => {
    const config = BLOG_SUBMISSION_EDITABLE_FIELDS[field];
    const value = formData[field];

    switch (config.type) {
      case 'markdown':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            required={Boolean('required' in config && config.required)}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={Boolean('required' in config && config.required)}
          />
        );

      case 'select':
        if (field === 'category_id') {
          return (
            <select
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Keine Kategorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          );
        }
        return null;

      case 'tags':
        // Display as comma-separated input
        const tagsValue = Array.isArray(value) ? value.join(', ') : '';
        return (
          <input
            type="text"
            value={tagsValue}
            onChange={(e) => handleTagsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="tag1, tag2, tag3"
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={Boolean('required' in config && config.required)}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <Heading level={2} className="text-2xl">Einreichung bearbeiten</Heading>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {(
            Object.keys(BLOG_SUBMISSION_EDITABLE_FIELDS) as Array<
              keyof typeof BLOG_SUBMISSION_EDITABLE_FIELDS
            >
          ).map((field) => {
            const config = BLOG_SUBMISSION_EDITABLE_FIELDS[field];
            return (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {config.label}
                  {('required' in config && config.required) && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {('help' in config && config.help) && <p className="mt-1 text-xs text-gray-500">{config.help}</p>}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSaving}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichert...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
