import { ArticleBody, setHighlighterLoader } from 'bip-kit/react';
import { MermaidBlock } from 'bip-kit/react/mermaid';
import type { ContentBlock } from 'bip-kit';

/**
 * The server-side long-form body renderer — bip-kit's reference renderer
 * with evig's wiring. The public post page (and the staff draft preview,
 * which is the same route) renders every blog body through this component.
 *
 * The loader registration below is load-bearing for the standalone deploy:
 * bip-kit's zero-config shiki load goes through a bundler-hidden dynamic
 * import that Next's file tracer cannot see, so an `output: "standalone"`
 * build would silently ship without shiki and prod would render code blocks
 * as the un-highlighted mono fallback while dev shows them highlighted
 * (FleetCrown and OrangeCat both shipped that exact hole). The literal
 * `() => import('shiki')` lives HERE, in our code, where the bundler
 * resolves it into the server chunk. Do not "clean up" this call.
 * (Belt-and-braces: scripts/selfhost-deploy-evig.sh also restores the
 * standalone node_modules/shiki symlink pnpm output-tracing drops.)
 */
setHighlighterLoader(() => import('shiki'));

export default function LongformBody({ blocks }: { blocks: ContentBlock[] }) {
  return <ArticleBody blocks={blocks} components={{ mermaid: MermaidBlock }} />;
}
