/** Processing spinner slice — shown while the AI structures the transcript. */

import { Loader2 } from 'lucide-react';

export function ProtocolProcessingCard() {
  return (
    <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-8 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-warning-500 mx-auto mb-3" />
      <p className="font-medium text-warning-800 dark:text-warning-300">Wird verarbeitet…</p>
      <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
        Die KI strukturiert das Transkript. Die Seite aktualisiert sich automatisch.
      </p>
    </div>
  );
}
