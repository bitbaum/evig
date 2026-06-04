import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogPost } from '@/lib/blog'
import ShareButtons from './ShareButtons'
import NewsletterSignup from './NewsletterSignup'
import Heading from '@/components/ui/Heading'

interface BlogPostContentProps {
  post: BlogPost
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  return (
    <>
    <article className="max-w-[680px] mx-auto px-6 py-16">
      {/* Main Content - Medium Style */}
      <div className="mb-16">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <Heading level={1} className="text-4xl font-bold text-text-primary mt-12 mb-4 leading-tight">
                {children}
              </Heading>
            ),
            h2: ({ children }) => (
              <Heading level={2} className="text-3xl font-bold text-text-primary mt-10 mb-3 leading-tight">
                {children}
              </Heading>
            ),
            h3: ({ children }) => (
              <Heading level={3} className="text-2xl font-bold text-text-primary mt-8 mb-3 leading-tight">
                {children}
              </Heading>
            ),
            p: ({ children }) => (
              <p className="text-[21px] text-neutral-800 leading-[1.58] mb-8 font-serif">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="text-[21px] text-neutral-800 leading-[1.58] mb-8 pl-8 space-y-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="text-[21px] text-neutral-800 leading-[1.58] mb-8 pl-8 space-y-2 list-decimal">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-[21px] text-neutral-800 leading-[1.58]">
                {children}
              </li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-text-primary underline decoration-neutral-900 hover:text-primary-700 hover:decoration-primary-700 transition-colors"
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-text-primary">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic">
                {children}
              </em>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-neutral-900 dark:border-neutral-500 pl-6 py-2 my-8 italic text-[21px] text-text-secondary leading-[1.58]">
                {children}
              </blockquote>
            ),
            code: ({ children, className }) => {
              const isInline = !className
              if (isInline) {
                return (
                  <code className="bg-surface-raised text-neutral-800 px-2 py-0.5 rounded-sm text-[18px] font-mono">
                    {children}
                  </code>
                )
              }
              return (
                <code className="block bg-neutral-900 dark:bg-neutral-800 text-neutral-100 p-6 rounded-lg overflow-x-auto text-[16px] font-mono my-8">
                  {children}
                </code>
              )
            },
            hr: () => (
              <hr className="my-12 border-t border" />
            ),
          }}
        >
          {post.body}
        </ReactMarkdown>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="py-8 border-t border">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-surface-raised text-text-secondary text-sm rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Share Buttons */}
      <div className="py-8 border-t border">
        <ShareButtons
          url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://revampit.ch'}/blog/${post.slug}`}
          title={post.title}
        />
      </div>
    </article>

    {/* Newsletter Signup */}
    <NewsletterSignup />
  </>
  )
}
