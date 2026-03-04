/**
 * Blog Configuration
 *
 * Re-exports blog AI quick actions from the prompts SSOT.
 * Used by: BlogPostForm
 */

import { BLOG_PROMPTS } from '@/lib/ai/config/prompts'

/** Blog AI quick actions derived from the prompts SSOT */
export const BLOG_AI_QUICK_ACTIONS = Object.entries(BLOG_PROMPTS.quickActions).map(
  ([key, prompt]) => ({
    key,
    label: {
      shorter: 'Kürzer',
      longer: 'Ausführlicher',
      seoOptimize: 'SEO-optimiert',
      addExamples: 'Beispiele',
      simplify: 'Vereinfachen',
    }[key] ?? key,
    prompt,
  })
)
