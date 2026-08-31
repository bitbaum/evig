import { parseStatutenBody, numberParagraphs } from '@/lib/legal/statuten-body';

interface StatutenBodyProps {
  /** Raw article body from the `statuten` message namespace. */
  body: string;
}

/**
 * Renders one statute article: numbered paragraphs with lettered sub-lists.
 * Numbering is generated, never taken from the translated string, so every
 * locale shows identical article structure.
 */
export function StatutenBody({ body }: StatutenBodyProps) {
  const blocks = numberParagraphs(parseStatutenBody(body));

  return (
    <div className="space-y-4">
      {blocks.map(({ block, number }, index) =>
        block.kind === 'list' ? (
          <ol
            key={index}
            className="ml-6 list-[lower-alpha] space-y-2 text-text-secondary marker:text-text-muted"
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="pl-1 leading-7">
                {item}
              </li>
            ))}
          </ol>
        ) : (
          <p key={index} className="flex gap-3 leading-7 text-text-secondary">
            <span
              aria-hidden="true"
              className="shrink-0 font-mono text-sm text-text-muted tabular-nums pt-1"
            >
              {number}
            </span>
            <span>{block.text}</span>
          </p>
        ),
      )}
    </div>
  );
}
