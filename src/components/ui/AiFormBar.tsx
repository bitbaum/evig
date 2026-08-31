'use client';

/**
 * AiFormBar — the one control for AI form assistance.
 *
 * Generic on purpose: it knows nothing about categories, protocols or members,
 * only about a `UseAiForm` store, so every form in the app gets the same
 * affordance from one implementation.
 *
 * The part that matters is the second turn. The bar stays available after a
 * fill, so "kürzer" or "eher grün" applies to what is already in the form.
 * `useAiForm` infers fill vs refine from whether the form is empty, so there is
 * no mode for the user to get wrong.
 *
 * Rendering is local to this app — the package ships no markup — and uses the
 * same primitives as the rest of the admin forms.
 */

import { useState } from 'react';
import { Sparkles, Loader2, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UseAiForm } from '@fleet/ai-forms/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AiFormBarProps {
  form: UseAiForm;
  /** What to describe, shown while the form is still empty. */
  fillPlaceholder: string;
  /** What to change, shown once the form has content. */
  refinePlaceholder: string;
}

export function AiFormBar({ form, fillPlaceholder, refinePlaceholder }: AiFormBarProps) {
  const [instruction, setInstruction] = useState('');
  const t = useTranslations('aiForm');

  const isRefining = !form.isEmpty;

  const submit = async () => {
    const text = instruction.trim();
    if (!text || form.busy) return;
    const result = await form.ask(text);
    // Keep the text on failure so the user can edit it instead of retyping.
    if (result.ok) setInstruction('');
  };

  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4" />
        {isRefining ? t('refineTitle') : t('fillTitle')}
      </div>

      <p className="text-xs text-muted-foreground">
        {isRefining ? t('refineHint') : t('fillHint')}
      </p>

      <Textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder={isRefining ? refinePlaceholder : fillPlaceholder}
        disabled={form.busy}
        rows={3}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
        }}
      />

      {form.error ? (
        <p role="alert" className="text-xs text-destructive">
          {form.error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void submit()}
          disabled={form.busy || !instruction.trim()}
        >
          {form.busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isRefining ? t('refineSubmit') : t('fillSubmit')}
        </Button>

        {/* An AI edit the user cannot take back is one they cannot safely try. */}
        {form.canUndo ? (
          <Button type="button" size="sm" variant="ghost" onClick={form.undo} disabled={form.busy}>
            <Undo2 className="h-3.5 w-3.5" />
            {t('undo')}
          </Button>
        ) : null}

        {form.changed.length > 0 ? (
          <span className="ml-auto text-xs text-muted-foreground">
            {t('changedFields', { count: form.changed.length })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
