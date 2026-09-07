import { Link } from '@/i18n/navigation';
import { BlogPost } from '@/lib/blog';
import { ORG } from '@/config/org';
import { parseLongform } from '@/lib/longform/parse';
import LongformBody from '@/lib/longform/LongformBody';
import { ReadingProgress } from 'bip-kit/react';
import 'bip-kit/styles.css';
import '@/lib/longform/longform.css';
import BlogTableOfContents from './BlogTableOfContents';
import ShareButtons from './ShareButtons';
import NewsletterSignup from './NewsletterSignup';

interface BlogPostContentProps {
  post: BlogPost;
}

/**
 * Blog article body — parses the markdown (file- or DB-sourced) into bip-kit
 * typed blocks and renders them through the reference renderer. Typed blocks
 * are the security model for DB/submission content: no HTML passthrough
 * exists, so no sanitizer is needed. The sticky TOC stays evig's own shell
 * (i18n label, aria-current, rail design language) fed from the same blocks,
 * so anchors and scroll-spy share one id contract.
 */
export default function BlogPostContent({ post }: BlogPostContentProps) {
  const { blocks, tocHeadings } = parseLongform(post.body);
  const showToc = tocHeadings.length >= 3;

  return (
    <>
      <ReadingProgress />
      <div
        className={
          showToc
            ? 'mx-auto grid max-w-[1120px] gap-x-12 px-4 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]'
            : ''
        }
      >
        {showToc && <BlogTableOfContents headings={tocHeadings} />}
        <article
          className={
            showToc
              ? 'min-w-0 max-w-[720px] pb-16 pt-12'
              : 'mx-auto max-w-[720px] px-4 pb-16 pt-12 sm:px-6'
          }
        >
          <div className="mb-16">
            <LongformBody blocks={blocks} />
          </div>

          {/* Tags — each links to the index filtered on that tag */}
          {post.tags && post.tags.length > 0 && (
            <div className="border-t border-subtle py-8">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-subtle px-4 font-mono text-xs text-text-tertiary transition-colors hover:border-strong hover:text-text-primary"
                  >
                    {tag}
                  </Link>
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
  );
}
