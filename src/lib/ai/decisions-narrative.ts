/**
 * AI Outcome Narrative Generator
 *
 * Generates a formal Beschluss-style narrative (Swiss Verein protocol text)
 * after a decision is closed and tallies are computed.
 */

import { callWithFallback } from '@/lib/ai/providers';
import { BRAND_CONTEXT } from '@/lib/ai/config/prompts';
import type { DecisionOption } from '@/lib/schemas/decisions';

interface NarrativeParams {
  title: string;
  description: string;
  votingMethod: string;
  options: DecisionOption[];
  outcome: Record<string, unknown>;
  outcomeSummary?: string | null;
  participantScope: string;
  category: string;
}

/**
 * Convert raw tally data into a readable summary string for the AI prompt.
 */
function buildTallySummary(
  method: string,
  outcome: Record<string, unknown>,
  options: DecisionOption[]
): string {
  const totalVotes = (outcome.totalVotes as number) ?? 0;

  switch (method) {
    case 'consent': {
      const counts = (outcome.counts as Record<string, number>) ?? {};
      const passed = outcome.passed as boolean;
      return (
        `${totalVotes} Stimmen — Zustimmung: ${counts.agree ?? 0}, ` +
        `Enthaltung: ${counts.abstain ?? 0}, Ablehnung: ${counts.disagree ?? 0}, ` +
        `Blockierung: ${counts.block ?? 0}. ${passed ? 'Angenommen (kein Block).' : 'Blockiert.'}`
      );
    }
    case 'simple_majority': {
      const counts = (outcome.counts as Record<string, number>) ?? {};
      const passed = outcome.passed as boolean;
      return (
        `${totalVotes} Stimmen — Ja: ${counts.yes ?? 0}, Nein: ${counts.no ?? 0}, ` +
        `Enthaltung: ${counts.abstain ?? 0}. ${passed ? 'Angenommen.' : 'Abgelehnt.'}`
      );
    }
    case 'approval':
    case 'dot':
    case 'score':
    case 'ranked_choice': {
      const ranked = (outcome.ranked as Array<{
        label: string;
        votes?: number;
        dots?: number;
        averageScore?: number;
        bordaPoints?: number;
      }>) ?? [];
      const top3 = ranked.slice(0, 3).map((o, i) => {
        const metric = o.votes ?? o.dots ?? o.bordaPoints ?? o.averageScore ?? 0;
        const unit =
          method === 'approval' ? 'Stimmen'
          : method === 'dot' ? 'Punkte'
          : method === 'ranked_choice' ? 'Borda-Punkte'
          : 'Ø Sterne';
        return `${i + 1}. ${o.label}: ${metric} ${unit}`;
      });
      return `${totalVotes} Stimmen. Rangfolge: ${top3.join(', ')}.`;
    }
    default:
      return `${totalVotes} Stimmen abgegeben.`;
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  vorstandsbeschluss: 'Vorstandsbeschluss',
  mitgliederbeschluss: 'Mitgliederbeschluss',
  ratifizierung: 'Ratifizierungsbeschluss',
  statutenaenderung: 'Statutenänderung',
  budget: 'Budget-Genehmigung',
  operativ: 'Operative Entscheidung',
};

/**
 * Generate a formal narrative describing the outcome of a closed decision.
 * Returns null if the AI is unavailable or times out.
 */
export async function generateOutcomeNarrative(
  params: NarrativeParams
): Promise<string | null> {
  try {
    const { title, votingMethod, options, outcome, outcomeSummary, category } = params;
    const tallySummary = buildTallySummary(votingMethod, outcome, options);
    const categoryLabel = CATEGORY_LABELS[category] ?? category;

    const systemPrompt = `${BRAND_CONTEXT}

Du generierst prägnante, formelle Beschlussprotokolle auf Schweizer Deutsch für einen Schweizer Verein.
Schreibe im Stil eines Vereinsprotokolls: sachlich, klar, vollständig in 2-4 Sätzen.
Verwende ausschliesslich Schweizer Deutsch (ss statt ß, korrekte Umlaute ä/ö/ü).
Formuliere so, dass der Text direkt ins Protokoll kopiert werden kann.`;

    const userPrompt = `Erstelle eine formelle Beschlussfassung für folgende Abstimmung:

Titel: ${title}
Kategorie: ${categoryLabel}
Abstimmungsmethode: ${votingMethod}
Ergebnis: ${tallySummary}${outcomeSummary ? `\nManuelle Zusammenfassung des Verantwortlichen: ${outcomeSummary}` : ''}

Schreibe eine Beschlussfassung im Protokollstil (2-4 Sätze, Präteritum oder Perfekt).
Beispiel: "Der Vorstand hat mit 8 von 10 Stimmen beschlossen, das neue Logo (Variante A) einzuführen. Variante B erhielt 5 Stimmen. Der Beschluss tritt per sofort in Kraft."`;

    const result = await callWithFallback({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 512,
    });

    return result?.text?.trim() ?? null;
  } catch {
    // Non-critical — if AI is unavailable, the decision still closes successfully
    return null;
  }
}
