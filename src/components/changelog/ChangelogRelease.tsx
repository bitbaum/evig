import type { ChangelogRelease as ChangelogReleaseType } from '@/config/changelog'
import { formatChangelogDate, formatChangelogDateShort, pickLocalized } from '@/lib/changelog'

interface ChangelogReleaseProps {
  release: ChangelogReleaseType
  locale: string
}

export function ChangelogRelease({ release, locale }: ChangelogReleaseProps) {
  const title = pickLocalized(locale, release.title)
  const dateLong = formatChangelogDate(release.date, locale)
  const dateShort = formatChangelogDateShort(release.date, locale)

  return (
    <section
      id={release.id}
      className="scroll-mt-36 border-t border-subtle py-12 first:border-t-0 first:pt-8"
    >
      <div className="grid gap-6 lg:grid-cols-[7.5rem_minmax(0,1fr)] lg:gap-10">
        <div className="font-mono text-xs tabular-nums text-text-tertiary lg:sticky lg:top-[calc(var(--header-offset,4rem)+6rem)] lg:self-start">
          <time dateTime={release.date} className="hidden sm:block">
            {dateLong}
          </time>
          <time dateTime={release.date} className="sm:hidden">
            {dateShort}
          </time>
        </div>

        <div className="min-w-0">
          <span className="inline-block rounded-full border border-subtle px-2.5 py-0.5 font-mono text-[11px] text-text-secondary">
            v{release.version}
          </span>
          <h2 className="ui-public-display-md mt-4">{title}</h2>
          <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-text-secondary">
            {release.changes.map((change, index) => (
              <li key={index} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-text-tertiary" />
                <span>{pickLocalized(locale, change)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
