/**
 * EditProposalModal Component
 *
 * Modal for editing workshop proposal fields before approval.
 * Allows admins to make modifications without rejecting the proposal.
 */

'use client';

import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import Heading from '@/components/admin/AdminHeading';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import {
  WORKSHOP_PROPOSAL_EDITABLE_FIELDS,
  type WorkshopProposalEditableField,
} from '@/config/editable-fields';
import { WORKSHOP_CATEGORIES, WORKSHOP_LEVELS } from '@/config/workshops';
import { logger } from '@/lib/logger';
import { apiFetch } from '@/lib/api/client';
import type { WorkshopProposalWithProposer } from '@/components/workshops/types';

interface EditProposalModalProps {
  proposal: WorkshopProposalWithProposer;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProposalModal({ proposal, onClose, onSaved }: EditProposalModalProps) {
  // Initialize form data from proposal
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data: Record<string, any> = {};
    Object.keys(WORKSHOP_PROPOSAL_EDITABLE_FIELDS).forEach((field) => {
      data[field] = proposal[field as keyof typeof proposal] ?? '';
    });
    return data;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await apiFetch(`/api/admin/workshops/proposals/${proposal.id}`, {
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
      logger.error('Error saving proposal edit', { error: err });
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

  // Handle array fields (learning_objectives)
  const handleArrayFieldChange = (field: string, value: string) => {
    const array = value.split('\n').filter((line) => line.trim());
    handleFieldChange(field, array);
  };

  const renderField = (field: WorkshopProposalEditableField) => {
    const config = WORKSHOP_PROPOSAL_EDITABLE_FIELDS[field];
    const value = formData[field];

    switch (config.type) {
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={4}
            maxLength={'maxLength' in config ? config.maxLength : undefined}
            required={'required' in config ? Boolean(config.required) : false}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            min={'min' in config ? config.min : undefined}
            max={'max' in config ? config.max : undefined}
            required={'required' in config ? Boolean(config.required) : false}
          />
        );

      case 'select':
        if (field === 'category') {
          return (
            <Select
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
            >
              <option value="">Wählen...</option>
              {WORKSHOP_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </Select>
          );
        } else if (field === 'level') {
          return (
            <Select
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
            >
              <option value="">Wählen...</option>
              {WORKSHOP_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </Select>
          );
        }
        return null;

      case 'array': {
        // Display as multiline textarea, one item per line
        const arrayValue = Array.isArray(value) ? value.join('\n') : '';
        return (
          <Textarea
            value={arrayValue}
            onChange={(e) => handleArrayFieldChange(field, e.target.value)}
            rows={5}
            placeholder="Ein Eintrag pro Zeile"
          />
        );
      }

      default: // text
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            maxLength={'maxLength' in config ? config.maxLength : undefined}
            required={'required' in config ? Boolean(config.required) : false}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <Heading level={2} className="text-2xl">Vorschlag bearbeiten</Heading>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg p-4">
              <p className="text-error-800 dark:text-error-400">{error}</p>
            </div>
          )}

          {(Object.keys(WORKSHOP_PROPOSAL_EDITABLE_FIELDS) as WorkshopProposalEditableField[]).map(
            (field) => {
              const config = WORKSHOP_PROPOSAL_EDITABLE_FIELDS[field];
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
            }
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neutral-50 border-t px-6 py-4 flex justify-end gap-3">
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
