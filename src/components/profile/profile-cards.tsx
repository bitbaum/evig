import { Link } from '@/i18n/navigation';
import { Star, ArrowUpRight } from 'lucide-react';
import { formatDateShort } from '@/lib/date-formats';
import { Eyebrow } from '@/components/ui/Eyebrow';
import Heading from '@/components/ui/Heading';

/**
 * Presentational cards shared by the public profile surfaces.
 * OfferingCard = one listing/service/workshop/post tile; ReviewCard = one review.
 * Pure UI, no data access — see useProfileData for fetching.
 */

export function OfferingCard({
  href,
  eyebrow,
  title,
  description,
  image,
  meta,
}: {
  href: string;
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  image?: string | null;
  meta?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface-base transition-colors hover:border-action"
    >
      {image && (
        <img src={image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-4">
        {eyebrow && (
          <Eyebrow as="div" className="mb-1.5">
            {eyebrow}
          </Eyebrow>
        )}
        <Heading
          level={3}
          className="text-base font-semibold leading-snug text-text-primary transition-colors group-hover:text-action"
        >
          {title}
        </Heading>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between pt-1">
          {meta ? <span className="text-xs text-text-tertiary">{meta}</span> : <span />}
          <ArrowUpRight className="h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-action" />
        </div>
      </div>
    </Link>
  );
}

export function ReviewCard({
  rating,
  title,
  content,
  date,
  href,
  hrefLabel,
}: {
  rating: number;
  title: string | null;
  content: string;
  date: string;
  href?: string | null;
  hrefLabel?: string | null;
}) {
  return (
    <div className="rounded-xl border border-subtle bg-surface-base p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < rating ? 'fill-warning-400 text-warning-400' : 'text-text-muted'}`}
            />
          ))}
        </div>
        <span className="text-xs text-text-tertiary">{formatDateShort(date)}</span>
      </div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="mt-2 inline-block text-xs font-medium text-action hover:underline"
        >
          {hrefLabel}
        </Link>
      )}
      {title && <div className="mt-2 text-sm font-medium text-text-primary">{title}</div>}
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{content}</p>
    </div>
  );
}
