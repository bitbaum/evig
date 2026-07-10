import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogPost } from '@/lib/blog'
import { ORG } from '@/config/org'
import { extractHeadings, slugifyHeading } from '@/lib/blog-toc'
import BlogTableOfContents from './BlogTableOfContents'
import ShareButtons from './ShareButtons'
import NewsletterSignup from './NewsletterSignup'

interface BlogPostContentProps {
  post: BlogPost
}

// Flatten heading children (which may include <code>/<em>) to plain text so the
// generated id matches the slug the table of contents links to.
function toText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(toText).join('')
  if (typeof node === 'object' && 'props' in node) {
    return toText((node as { props?: { children?: ReactNode } }).props?.children)
  }
  return ''
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const headings = extractHeadings(post.body)
  const showToc = headings.length >= 3

  return (
    <>
      <div
        className={
          showToc
            ? 'mx-auto grid max-w-[1120px] gap-x-12 px-4 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]'
            : ''
        }
      >
        {showToc && <BlogTableOfContents headings={headings} />}
        <article
          className={
            showToc
              ? 'min-w-0 max-w-[720px] pb-16 pt-12'
              : 'mx-auto max-w-[720px] px-4 pb-16 pt-12 sm:px-6'
          }
        >
        <div className="mb-16">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 id={slugifyHeading(toText(children))} className="scroll-mt-24 mt-14 mb-4 text-2xl font-semibold leading-tight tracking-[-0.01em] text-text-primary sm:text-3xl">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 id={slugifyHeading(toText(children))} className="scroll-mt-24 mt-10 mb-3 text-xl font-semibold leading-tight text-text-primary sm:text-2xl">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-6 text-[19px] leading-[1.75] text-text-primary">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-6 list-disc space-y-2 pl-6 text-[19px] leading-[1.7] text-text-primary marker:text-text-tertiary">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-6 list-decimal space-y-2 pl-6 text-[19px] leading-[1.7] text-text-primary marker:text-text-tertiary">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="pl-1">{children}</li>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="font-medium text-action underline decoration-action/40 underline-offset-[3px] transition-colors hover:decoration-action"
                  {...(href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-text-primary">{children}</strong>
              ),
              em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="my-10 border-l-2 border-action pl-5 text-xl leading-relaxed text-text-primary">
                  {children}
                </blockquote>
              ),
              img: ({ src, alt }) => (
                // Chart/illustration assets. Plain img: same-origin SVGs render
                // as-is without the next/image optimizer (which rejects SVG).
                <img
                  src={typeof src === 'string' ? src : ''}
                  alt={alt || ''}
                  loading="lazy"
                  className="my-10 w-full rounded-xl border border-subtle bg-surface-base"
                />
              ),
              hr: () => <hr className="my-14 border-t border-subtle" />,
              code: ({ children, className }) => {
                const isInline = !className
                if (isInline) {
                  return (
                    <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[0.9em] text-text-primary">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="my-8 block overflow-x-auto rounded-lg bg-surface-overlay p-5 font-mono text-sm leading-relaxed text-text-secondary">
                    {children}
                  </code>
                )
              },
              table: ({ children }) => (
                <div className="my-10 overflow-x-auto rounded-xl border border-subtle">
                  <table className="w-full border-collapse text-left text-[15px]">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-surface-raised">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border-b border-subtle px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border-b border-subtle px-4 py-3 align-top text-text-secondary [tr:last-child_&]:border-b-0">
                  {children}
                </td>
              ),
            }}
          >
            {post.body}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="border-t border-subtle py-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full border border-subtle px-3 py-1 font-mono text-xs text-text-tertiary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="border-t border-subtle py-8">
          <ShareButtons
            url={`${process.env.NEXT_PUBLIC_SITE_URL || ORG.website}/blog/${post.slug}`}
            title={post.title}
          />
        </div>
        </article>
      </div>

      <NewsletterSignup />
    </>
  )
}
