'use client';

/** File-upload panel for DataEntryTabs — CSV dropzone label plus unmapped-column warning. */

import { Loader2, AlertCircle, FileUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FileUploadPanelProps {
  isUploading: boolean;
  unmappedColumns: string[];
  onFileUpload: (file: File) => void;
}

export function FileUploadPanel({
  isUploading,
  unmappedColumns,
  onFileUpload,
}: FileUploadPanelProps) {
  const t = useTranslations('components.erfassung.dataEntryTabs');

  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-strong dark:border-action rounded-xl cursor-pointer hover:border-action hover:bg-action-muted transition-colors">
        {isUploading ? (
          <>
            <Loader2 className="w-10 h-10 text-action mb-2 animate-spin" />
            <span className="text-sm text-action font-medium">{t('processing')}</span>
          </>
        ) : (
          <>
            <FileUp className="w-10 h-10 text-action mb-2" />
            <span className="text-sm text-text-secondary font-medium">{t('chooseFile')}</span>
            <span className="text-xs text-text-muted mt-1">{t('fileHint')}</span>
          </>
        )}
        <input
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
          className="hidden"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileUpload(file);
          }}
        />
      </label>

      {unmappedColumns.length > 0 && (
        <div className="flex items-start gap-2 py-2 px-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-warning-700 dark:text-warning-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">{t('unmappedColumns')}</span> {unmappedColumns.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
