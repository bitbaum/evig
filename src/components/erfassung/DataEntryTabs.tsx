'use client';

/**
 * DataEntryTabs Component
 *
 * Multi-mode data entry UI for product capture:
 * - Text (Formular): Quick text → AI extraction → Form prefill (single or bulk)
 * - File (Datei): CSV upload → parsed products → bulk table
 * - Speech (Sprache): Voice recording → transcription → AI extraction
 * - Picture (Bild): Photo/upload → AI analysis
 *
 * Auto-detects single vs bulk: paste one product → single form. Paste many → bulk table.
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { detectMultipleProducts } from '@/lib/erfassung/detect-multi';
import { VoiceEntry } from './VoiceEntry';
import { ImageCapture } from './ImageCapture';
import { CollapseHeader } from './data-entry-tabs/CollapseHeader';
import { TabHeaders } from './data-entry-tabs/TabHeaders';
import { QuickTextPanel } from './data-entry-tabs/QuickTextPanel';
import { FileUploadPanel } from './data-entry-tabs/FileUploadPanel';
import { useCoreTabs, type EntryMode, type QuickEntryState } from './data-entry-tabs/tabs-config';
import type { ErfassungFormData, AIFieldMetadata, BulkProduct } from '@/types/erfassung';

export type { EntryMode } from './data-entry-tabs/tabs-config';

interface DataEntryTabsProps {
  onProductData: (data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => void;
  onBulkData?: (products: BulkProduct[]) => void;
  onImageCapture?: (imageBase64: string) => void;
  onError?: (error: string) => void;
  onDataFilled?: () => void;
  onManualEntry?: () => void;
  activeMode?: EntryMode;
  className?: string;
  showAllTabs?: boolean;
  collapsed?: boolean;
}

export function DataEntryTabs({
  onProductData,
  onBulkData,
  onImageCapture,
  onError,
  onDataFilled,
  onManualEntry,
  activeMode: initialMode = 'form',
  className = '',
  showAllTabs = false,
  collapsed = false,
}: DataEntryTabsProps) {
  const t = useTranslations('components.erfassung.dataEntryTabs');

  const CORE_TABS = useCoreTabs();

  const tabs = showAllTabs
    ? CORE_TABS
    : CORE_TABS.filter((tab) => tab.id === 'form' || tab.id === 'file');
  const [activeMode, setActiveMode] = useState<EntryMode>(initialMode);
  const [quickText, setQuickText] = useState('');
  const [quickEntryState, setQuickEntryState] = useState<QuickEntryState>('idle');
  const [quickEntryError, setQuickEntryError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [isUploading, setIsUploading] = useState(false);
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);

  // Sync prop → local state when parent changes the collapsed prop.
  // This is the legitimate "mirror external value" pattern; setState in
  // effect is unavoidable here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCollapsed(collapsed);
  }, [collapsed]);

  // Handle image capture
  const handleImageCapture = useCallback(
    (base64: string) => {
      onImageCapture?.(base64);
    },
    [onImageCapture],
  );

  // Handle quick text entry with AI — auto-detects single vs multi
  const handleQuickTextSubmit = useCallback(async () => {
    if (!quickText.trim()) return;

    setQuickEntryState('loading');
    setQuickEntryError(null);

    try {
      const isMulti = detectMultipleProducts(quickText);

      if (isMulti && onBulkData) {
        // Multi-product: call bulk-text API
        const result = await apiFetch<{ products: BulkProduct[]; productCount: number }>(
          '/api/admin/erfassung/bulk-text',
          {
            method: 'POST',
            body: { text: quickText },
          },
        );

        if (!result.success) {
          throw new Error(result.error || t('processingFailed'));
        }

        onBulkData(result.data!.products);
        setQuickEntryState('success');
        setIsCollapsed(true);
        logger.info('Bulk text entry successful', { count: result.data!.productCount });

        setTimeout(() => {
          setQuickEntryState('idle');
          setQuickText('');
        }, 800);
      } else {
        // Single product: call existing text API
        const result = await apiFetch<{
          data: Partial<ErfassungFormData>;
          metadata: AIFieldMetadata;
        }>('/api/admin/erfassung/text', {
          method: 'POST',
          body: { text: quickText },
        });

        if (!result.success) {
          throw new Error(result.error || t('processingFailed'));
        }

        const productData = result.data!.data;
        const formData: Partial<ErfassungFormData> = {
          hersteller: productData.hersteller,
          produktname: productData.produktname,
          kurzbeschreibung: productData.kurzbeschreibung,
          specs: productData.specs,
          verkaufspreis: productData.verkaufspreis,
          zustand: productData.zustand,
          hauptkategorie: productData.hauptkategorie,
          unterkategorie: productData.unterkategorie,
          kundenprofile: productData.kundenprofile,
        };

        onProductData(formData, result.data!.metadata as AIFieldMetadata);
        setQuickEntryState('success');
        setIsCollapsed(true);
        onDataFilled?.();
        logger.info('Quick text entry successful', { product: productData.produktname });

        setTimeout(() => {
          setQuickEntryState('idle');
          setQuickText('');
        }, 800);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setQuickEntryError(message);
      setQuickEntryState('error');
      onError?.(message);
      logger.error('Quick text entry failed', { error });
    }
  }, [t, quickText, onProductData, onBulkData, onError, onDataFilled]);

  // Handle CSV file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!onBulkData) return;
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const { data: result, error: apiError } = await apiFetch<{
          products: BulkProduct[];
          unmappedColumns?: string[];
        }>('/api/admin/erfassung/bulk-upload', {
          method: 'POST',
          body: formData,
          formData: true,
        });

        if (apiError || !result) {
          throw new Error(apiError || t('processingFailed'));
        }

        onBulkData(result.products);
        setUnmappedColumns(result.unmappedColumns || []);
        setIsCollapsed(true);
        logger.info('File upload successful', {
          count: result.products.length,
          unmappedColumns: result.unmappedColumns,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        onError?.(message);
        logger.error('CSV upload failed', { error });
      } finally {
        setIsUploading(false);
      }
    },
    [t, onBulkData, onError],
  );

  return (
    <div
      className={`overflow-hidden rounded-xl border border-default bg-surface-base ${className}`}
    >
      {/* Collapsible header */}
      <CollapseHeader
        isCollapsed={isCollapsed}
        quickEntryState={quickEntryState}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Tab headers */}
      {!isCollapsed && tabs.length > 1 && (
        <TabHeaders tabs={tabs} activeMode={activeMode} onSelectMode={setActiveMode} />
      )}

      {/* Tab content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5">
          <p className="mb-4 text-sm text-text-secondary">
            {tabs.find((tab) => tab.id === activeMode)?.description}
          </p>
          {/* Speech mode — record → transcribe → extract (VoiceEntry composes
            useVoiceRecording + useVoiceProduct; posts to /api/admin/erfassung/voice) */}
          {activeMode === 'speech' && (
            <VoiceEntry
              onProductData={onProductData}
              onError={onError}
              onDataFilled={onDataFilled}
            />
          )}

          {/* Picture mode — photo/upload → vision analysis → form prefill */}
          {activeMode === 'picture' && (
            <ImageCapture
              onImageCapture={handleImageCapture}
              onAnalysisComplete={(data, metadata) => {
                onProductData(data, metadata);
                onDataFilled?.();
              }}
              onError={onError}
            />
          )}

          {/* Form mode with Quick Text Entry */}
          {activeMode === 'form' && (
            <QuickTextPanel
              quickText={quickText}
              onQuickTextChange={setQuickText}
              quickEntryState={quickEntryState}
              quickEntryError={quickEntryError}
              onSubmit={handleQuickTextSubmit}
              onManualEntry={onManualEntry}
            />
          )}

          {/* File upload mode */}
          {activeMode === 'file' && (
            <FileUploadPanel
              isUploading={isUploading}
              unmappedColumns={unmappedColumns}
              onFileUpload={handleFileUpload}
            />
          )}
        </div>
      )}
    </div>
  );
}
