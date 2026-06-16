interface ChangelogHeroProps {
  eyebrow: string
  badge: string
  title: string
  subtitle: string
}

export function ChangelogHero({ eyebrow, badge, title, subtitle }: ChangelogHeroProps) {
  return (
    <header className="border-b border-subtle bg-surface-base">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="ui-public-eyebrow">{eyebrow}</div>
            <span className="rounded-full border border-subtle px-3 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
              {badge}
            </span>
          </div>
          <h1 className="ui-public-display-lg mt-4">{title}</h1>
          <p className="ui-public-section-lede mt-4 max-w-2xl">{subtitle}</p>
        </div>
      </div>
    </header>
  )
}
