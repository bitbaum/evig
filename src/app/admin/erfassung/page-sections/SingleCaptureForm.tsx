'use client';

// Single-mode step 2/3: review form with AI assist, product fields, destination, and submit bar (extracted verbatim from page.tsx).
import type { RefObject } from 'react';
import { ProductForm } from '@/components/erfassung/ProductForm';
import { CaptureDestinationFields } from '@/components/erfassung/CaptureDestinationFields';
import { ErfassungSubmitBar } from '@/components/erfassung/ErfassungSubmitBar';
import { AIFormAssist } from '@/components/ai/AIFormAssist';
import type { useErfassungForm } from '@/components/erfassung/useErfassungForm';
import Heading from '@/components/admin/AdminHeading';
import { CAPTURE_DESTINATIONS } from '@/config/intake-workflow';

interface SingleCaptureFormProps {
  form: ReturnType<typeof useErfassungForm>;
  reviewRef: RefObject<HTMLFormElement | null>;
}

export function SingleCaptureForm({ form, reviewRef }: SingleCaptureFormProps) {
  return (
    <form
      ref={reviewRef}
      data-product-form
      onSubmit={(e) => form.handleSubmit(e, 'erfassen')}
      className="scroll-mt-24 space-y-5"
    >
      {form.saveError && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg text-sm">
          {form.saveError}
        </div>
      )}

      <section aria-labelledby="capture-review-title" className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action text-sm font-semibold text-action-text">
            2
          </div>
          <div>
            <Heading
              level={2}
              id="capture-review-title"
              className="text-base font-semibold text-text-primary"
            >
              Produktdaten prüfen
            </Heading>
            <p className="mt-0.5 text-sm text-text-secondary">
              KI-Vorschläge kontrollieren. Nur Hersteller und Produktname sind zum Speichern nötig.
            </p>
          </div>
        </div>

        {/* Ask the AI to change the extracted data in natural language —
            "Beschreibung ausführlicher", "Preis auf 80 CHF", "Specs ergänzen".
            Expanded by default so the tweak surface is visible, not hidden
            behind a chevron. Uses the shared FORM_AI_REGISTRY (formType
            'erfassung') like every other admin form. */}
        <AIFormAssist
          formType="erfassung"
          variant="section"
          defaultExpanded
          hasContentOverride={Boolean(
            form.formData.hersteller.trim() ||
            form.formData.produktname.trim() ||
            form.formData.kurzbeschreibung.trim(),
          )}
          currentData={{
            hersteller: form.formData.hersteller,
            produktname: form.formData.produktname,
            kurzbeschreibung: form.formData.kurzbeschreibung,
            verkaufspreis: form.formData.verkaufspreis,
            zustand: form.formData.zustand,
            hauptkategorie: form.formData.hauptkategorie,
            unterkategorie: form.formData.unterkategorie,
            specs: form.formData.specs.filter((s) => s.key && s.value),
            kundenprofile: form.formData.kundenprofile,
          }}
          onFieldsFilled={(data, metadata) =>
            form.handleAssistFields(data as Partial<typeof form.formData>, metadata)
          }
        />

        <ProductForm
          formData={form.formData}
          aiMetadata={form.aiMetadata}
          showAdvanced={form.showAdvanced}
          isEditMode={form.isEditMode}
          onFieldChange={form.handleChange}
          onSpecChange={form.handleSpecChange}
          onCategoryChange={form.handleKategorieChange}
          onProfileToggle={form.toggleProfile}
          onSpecAdd={form.addSpecField}
          onSpecRemove={form.removeSpecField}
          onImageChange={(image) => form.setFormData((prev) => ({ ...prev, image }))}
          onToggleAdvanced={() => form.setShowAdvanced(!form.showAdvanced)}
        />
      </section>

      {!form.isEditMode && (
        <CaptureDestinationFields
          destination={form.destination}
          onDestinationChange={form.setDestination}
          qcSkipReason={form.qcSkipReason}
          onQcSkipReasonChange={form.setQcSkipReason}
          donation={form.donation}
          onDonationChange={form.setDonation}
        />
      )}

      <ErfassungSubmitBar
        isEditMode={form.isEditMode}
        isLoading={form.isLoading}
        destination={form.destination}
        canSubmit={Boolean(
          form.formData.hersteller.trim() &&
          form.formData.produktname.trim() &&
          (form.destination !== CAPTURE_DESTINATIONS.SHOP_UNTESTED ||
            (form.qcSkipReason.trim().length >= 10 && Number(form.formData.verkaufspreis) > 0)),
        )}
        onSubmit={form.handleSubmit}
      />
    </form>
  );
}
