/**
 * EditProposalModal Component
 *
 * Modal for editing workshop proposal fields before approval.
 * Allows admins to make modifications without rejecting the proposal.
 */

'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import {
  WORKSHOP_PROPOSAL_EDITABLE_FIELDS,
  type WorkshopProposalEditableField,
} from '@/config/editable-fields';
import { WORKSHOP_CATEGORIES, WORKSHOP_LEVELS } from '@/config/workshops';
import { logger } from '@/lib/logger';
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
      const response = await fetch(`/api/admin/workshops/proposals/${proposal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          fields: formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSaved();
      } else {
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch (err) {
      logger.error('Error saving proposal edit', { error: err });
      setError('Netzwerkfehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
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
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={config.type === 'textarea' ? 4 : undefined}
            maxLength={'maxLength' in config ? config.maxLength : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={Boolean(config.required)}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field, Number(e.target.value))}
            min={'min' in config ? config.min : undefined}
            max={'max' in config ? config.max : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={Boolean(config.required)}
          />
        );

      case 'select':
        if (field === 'category') {
          return (
            <select
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Wählen...</option>
              {WORKSHOP_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          );
        } else if (field === 'level') {
          return (
            <select
              value={value || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Wählen...</option>
              {WORKSHOP_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          );
        }
        return null;

      case 'array':
        // Display as multiline textarea, one item per line
        const arrayValue = Array.isArray(value) ? value.join('\n') : '';
        return (
          <textarea
            value={arrayValue}
            onChange={(e) => handleArrayFieldChange(field, e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ein Eintrag pro Zeile"
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            maxLength={'maxLength' in config ? config.maxLength : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={Boolean(config.required)}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Vorschlag bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {(Object.keys(WORKSHOP_PROPOSAL_EDITABLE_FIELDS) as WorkshopProposalEditableField[]).map(
            (field) => {
              const config = WORKSHOP_PROPOSAL_EDITABLE_FIELDS[field];
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {config.label}
                    {('required' in config && config.required) && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  {('help' in config && config.help) && (
                    <p className="mt-1 text-xs text-gray-500">{config.help}</p>
                  )}
                </div>
              );
            }
          )}
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
