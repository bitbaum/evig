/**
 * Admin Hirn Page - Pure AI Chat Interface
 *
 * Main entry point for Hirn AI assistant.
 * Transformed from BI dashboard to pure AI chat.
 * Protected by role-based access control.
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Brain } from 'lucide-react';
import { HirnChat } from '@/components/admin/HirnChat';
import { HirnProviderSelector } from '@/components/admin/HirnProviderSelector';
import Heading from '@/components/admin/AdminHeading';
import { ORG } from '@/config/org';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface KnowledgeStats {
  totalDocuments: number;
  totalChunks: number;
}

/** What Hirn knows: documents and chunks, as one quiet line in the page header. */
function useKnowledgeStats(): KnowledgeStats | null {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  useEffect(() => {
    let alive = true;
    apiFetch<KnowledgeStats>('/api/admin/hirn/documents?stats=true')
      .then((result) => {
        if (alive && result.success && result.data) setStats(result.data);
      })
      .catch((err) => logger.error('Failed to load Hirn stats', { error: err }));
    return () => {
      alive = false;
    };
  }, []);
  return stats;
}

export default function HirnPageClient() {
  const t = useTranslations('admin.hirn.stats');
  const stats = useKnowledgeStats();

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-action flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">
              Hirn AI
            </Heading>
            <p className="text-sm text-text-secondary">
              KI-Assistent mit {ORG.name} Dokumentation und Code-Kontext
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {stats && (
            <p className="hidden sm:block text-sm text-text-secondary">
              {t('documentsLabel')}: {stats.totalDocuments} · {t('chunksLabel')}:{' '}
              {stats.totalChunks}
            </p>
          )}
          <HirnProviderSelector />
        </div>
      </div>

      {/* The chat is a whole app: its list, New chat and rename come with it. */}
      <div className="h-[calc(100%-5rem)] bg-surface-base">
        <HirnChat />
      </div>
    </div>
  );
}
