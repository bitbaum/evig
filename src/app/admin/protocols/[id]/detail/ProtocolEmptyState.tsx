/** Empty state slice — no structured notes exist and nothing is processing. */

import { FileText } from 'lucide-react';
import Heading from '@/components/admin/AdminHeading';
import { Card } from '@/components/ui/card';

export function ProtocolEmptyState() {
  return (
    <Card className="p-12 text-center">
      <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
      <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
        Keine strukturierten Notizen
      </Heading>
      <p className="text-text-tertiary">
        Füge ein Transkript hinzu, um es von der KI verarbeiten zu lassen.
      </p>
    </Card>
  );
}
