'use client';

// Bulk review mode: table, detail panel, and action bar with their derived selection values (extracted verbatim from page.tsx).
import type { Dispatch, SetStateAction } from 'react';
import { BulkTable } from '@/components/erfassung/BulkTable';
import { BulkDetailPanel } from '@/components/erfassung/BulkDetailPanel';
import { BulkActionBar } from '@/components/erfassung/BulkActionBar';
import type { BulkProduct } from '@/types/erfassung';

interface BulkSectionProps {
  bulkProducts: BulkProduct[];
  bulkPage: number;
  setBulkPage: Dispatch<SetStateAction<number>>;
  selectedProductId: string | null;
  setSelectedProductId: Dispatch<SetStateAction<string | null>>;
  handleBulkProductUpdate: (tempId: string, updates: Partial<BulkProduct>) => void;
  handleBulkProductSelect: (tempId: string) => void;
  handleBulkSelectAll: () => void;
  handleBulkSave: (action: 'draft' | 'erfassen' | 'publish') => Promise<void>;
}

export function BulkSection({
  bulkProducts,
  bulkPage,
  setBulkPage,
  selectedProductId,
  setSelectedProductId,
  handleBulkProductUpdate,
  handleBulkProductSelect,
  handleBulkSelectAll,
  handleBulkSave,
}: BulkSectionProps) {
  const selectedBulkProduct = bulkProducts.find((p) => p._tempId === selectedProductId) || null;
  const selectedCount = bulkProducts.filter((p) => p._selected).length;
  const isBulkSaving = bulkProducts.some((p) => p._status === 'processing');

  return (
    <>
      <BulkTable
        products={bulkProducts}
        page={bulkPage}
        onPageChange={setBulkPage}
        onProductUpdate={handleBulkProductUpdate}
        onProductSelect={handleBulkProductSelect}
        onSelectAll={handleBulkSelectAll}
        onProductClick={(tempId) => setSelectedProductId(tempId)}
      />

      {selectedBulkProduct && (
        <BulkDetailPanel
          key={selectedBulkProduct._tempId}
          product={selectedBulkProduct}
          onUpdate={(updates) => handleBulkProductUpdate(selectedBulkProduct._tempId, updates)}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      <BulkActionBar
        totalCount={bulkProducts.length}
        selectedCount={selectedCount}
        isSaving={isBulkSaving}
        savedCount={bulkProducts.filter((p) => p._status === 'saved').length}
        onSave={handleBulkSave}
        onSelectAll={handleBulkSelectAll}
        allSelected={bulkProducts.every((p) => p._selected)}
      />
    </>
  );
}
