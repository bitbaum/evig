/**
 * EditSubmissionModal Component
 *
 * Modal for editing blog submission fields before approval/publishing.
 * Allows admins to make modifications without rejecting the submission.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import Heading from '@/components/admin/AdminHeading';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
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
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={15}
            className="font-mono text-sm"
            required={Boolean('required' in config && config.required)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={4}
            required={Boolean('required' in config && config.required)}
          />
        );

      case 'select':
        if (field === 'category_id') {
          return (
            <Select
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value || null)}
            >
              <option value="">Keine Kategorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          );
        }
        return null;

      case 'tags': {
        // Display as comma-separated input
        const tagsValue = Array.isArray(value) ? value.join(', ') : '';
        return (
          <Input
            type="text"
            value={tagsValue}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="tag1, tag2, tag3"
          />
        );
      }

      default: // text
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            required={Boolean('required' in config && config.required)}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-base dark:border dark:border-white/6 rounded-lg shadow-xs max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-surface-base border-b px-6 py-4 flex items-center justify-between">
          <Heading level={2} className="text-2xl">Einreichung bearbeiten</Heading>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg p-4">
              <p className="text-error-800 dark:text-error-400">{error}</p>
            </div>
          )}

          {(
            Object.keys(BLOG_SUBMISSION_EDITABLE_FIELDS) as Array<
              keyof typeof BLOG_SUBMISSION_EDITABLE_FIELDS
            >
          ).map((field) => {
            const config = BLOG_SUBMISSION_EDITABLE_FIELDS[field];
            return (
              <FormField
                key={field}
                label={config.label}
                required={'required' in config ? Boolean(config.required) : false}
                hint={'help' in config ? config.help : undefined}
              >
                {renderField(field)}
              </FormField>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface-raised border-t px-6 py-4 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline" disabled={isSaving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} variant="primary" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
