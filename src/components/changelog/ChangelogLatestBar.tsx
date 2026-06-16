interface ChangelogLatestBarProps {
  latestLabel: string
  version: string
  dateIso: string
  dateShort: string
  commandLabel: string
  command: string
}

export function ChangelogLatestBar({
  latestLabel,
  version,
  dateIso,
  dateShort,
  commandLabel,
  command,
}: ChangelogLatestBarProps) {
  return (
    <div className="ui-sticky-subnav border-b border-subtle bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/75">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-text-secondary">
            <span className="text-text-tertiary">{latestLabel}</span>{' '}
            <span className="text-text-primary">v{version}</span>
            <span className="text-text-tertiary"> · </span>
            <time dateTime={dateIso}>{dateShort}</time>
          </p>
          <div className="min-w-0">
            <p className="sr-only">{commandLabel}</p>
            <pre className="overflow-x-auto rounded-lg border border-subtle bg-canvas px-3 py-2 font-mono text-xs text-text-secondary">
              <code>$ {command}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
