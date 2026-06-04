'use client';

import { ORG } from '@/config/org'

export interface DecisionForExport {
  id: string;
  title: string;
  description: string;
  votingMethod: string;
  category: string;
  outcome: Record<string, unknown> | null;
  outcomeSummary: string | null;
  aiOutcomeNarrative: string | null;
}

function generateBeschlussText(decision: DecisionForExport): string {
  const date = new Date().toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const lines: string[] = [];

  lines.push('BESCHLUSS');
  lines.push('=========');
  lines.push('');
  lines.push(`Titel:                ${decision.title}`);
  lines.push(`Datum:                ${date}`);
  lines.push(`Kategorie:            ${decision.category}`);
  lines.push(`Abstimmungsmethode:   ${decision.votingMethod}`);
  lines.push('');

  if (decision.description) {
    lines.push('BESCHREIBUNG');
    lines.push('------------');
    lines.push(decision.description);
    lines.push('');
  }

  if (decision.aiOutcomeNarrative) {
    lines.push('BESCHLUSSFASSUNG');
    lines.push('----------------');
    lines.push(decision.aiOutcomeNarrative);
    lines.push('');
  }

  if (decision.outcomeSummary) {
    lines.push('ZUSAMMENFASSUNG DES VERANTWORTLICHEN');
    lines.push('-------------------------------------');
    lines.push(decision.outcomeSummary);
    lines.push('');
  }

  if (decision.outcome) {
    lines.push('ABSTIMMUNGSERGEBNIS');
    lines.push('-------------------');
    const o = decision.outcome;
    if ('totalVotes' in o) {
      lines.push(`Abgegebene Stimmen: ${o.totalVotes}`);
    }
    if ('passed' in o) {
      lines.push(`Ergebnis:           ${o.passed ? 'Angenommen' : 'Abgelehnt'}`);
    }
    if ('counts' in o && o.counts && typeof o.counts === 'object') {
      const counts = o.counts as Record<string, number>;
      for (const [key, value] of Object.entries(counts)) {
        lines.push(`  ${key}: ${value}`);
      }
    }
    if ('ranked' in o && Array.isArray(o.ranked)) {
      type RankedItem = {
        label: string;
        votes?: number;
        dots?: number;
        averageScore?: number;
        bordaPoints?: number;
        scorePercent?: number;
      };
      const ranked = o.ranked as RankedItem[];
      ranked.forEach((item, i) => {
        const isBorda = item.bordaPoints !== undefined;
        const isDot = item.dots !== undefined;
        const isScore = item.averageScore !== undefined;
        const metric = isBorda ? item.bordaPoints
          : isDot ? item.dots
          : isScore ? item.averageScore
          : (item.votes ?? 0);
        const unit = isBorda ? 'Borda-Punkte'
          : isDot ? 'Punkte'
          : isScore ? 'Ø Sterne'
          : 'Stimmen';
        const pct = item.scorePercent !== undefined ? ` (${item.scorePercent}%)` : '';
        lines.push(`  ${i + 1}. ${item.label}: ${metric} ${unit}${pct}`);
      });
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`Erstellt am ${date} · ${ORG.name} Entscheidungssystem`);

  return lines.join('\n');
}

export default function BeschlussPdfExport({ decision }: { decision: DecisionForExport }) {
  function handleExport() {
    const text = generateBeschlussText(decision);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beschluss-${decision.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-600 bg-surface-base dark:bg-neutral-800 px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Beschluss exportieren
    </button>
  );
}
