'use client'

import { useMemo, useState } from 'react'
import { Mail, Phone, ExternalLink, MapPin, Search, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DossierGroup, DossierContact, DossierOutreach } from '@/data/upcycling-dossier'

/** Vorausgefüllter mailto:-Link aus der Akquise-Botschaft der Gruppe. */
function mailtoFor(email: string, outreach: DossierOutreach): string {
  const params = new URLSearchParams({ subject: outreach.subject, body: outreach.body })
  // URLSearchParams kodiert Leerzeichen als '+'; mailto erwartet %20.
  return `mailto:${email}?${params.toString().replace(/\+/g, '%20')}`
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

function matches(c: DossierContact, q: string): boolean {
  if (!q) return true
  const hay = `${c.name} ${c.category} ${c.city ?? ''} ${c.note ?? ''}`.toLowerCase()
  return hay.includes(q)
}

export function DossierContacts({ groups }: { groups: DossierGroup[] }) {
  const [active, setActive] = useState<string>('alle')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const visibleGroups = useMemo(() => {
    const base = active === 'alle' ? groups : groups.filter((g) => g.key === active)
    return base
      .map((g) => ({ ...g, contacts: g.contacts.filter((c) => matches(c, q)) }))
      .filter((g) => g.contacts.length > 0)
  }, [groups, active, q])

  const totalShown = visibleGroups.reduce((n, g) => n + g.contacts.length, 0)

  const chips: { key: string; label: string; count: number }[] = [
    { key: 'alle', label: 'Alle', count: groups.reduce((n, g) => n + g.contacts.length, 0) },
    ...groups.map((g) => ({ key: g.key, label: g.shortLabel, count: g.contacts.length })),
  ]

  return (
    <section className="border-b border-subtle bg-canvas">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h2 className="ui-public-display-md">Akquise-Kontakte</h2>
        <p className="ui-public-section-lede mt-4 max-w-3xl">
          Reale, öffentlich verifizierbare Geschäftsadressen. Die E-Mail-Schaltfläche
          öffnet eine vorausgefüllte Nachricht — passend zur jeweiligen Gruppe.
        </p>

        {/* Steuerung: Gruppen-Chips + Suche */}
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const isActive = active === chip.key
              return (
                <Button
                  key={chip.key}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setActive(chip.key)}
                  aria-pressed={isActive}
                  className={cn(
                    'h-auto gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium',
                    isActive
                      ? 'border-action bg-action text-white hover:bg-action'
                      : 'border-subtle bg-surface-base text-text-secondary hover:border-action/40 hover:bg-surface-base hover:text-text-primary',
                  )}
                >
                  {chip.label}
                  <span className={cn('font-mono text-xs', isActive ? 'text-white/80' : 'text-text-tertiary')}>
                    {chip.count}
                  </span>
                </Button>
              )
            })}
          </div>

          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, Kategorie oder Ort suchen…"
              aria-label="Kontakte durchsuchen"
              className="pl-9"
            />
          </div>
        </div>

        {/* Gruppen */}
        {visibleGroups.length === 0 ? (
          <p className="mt-12 text-sm text-text-tertiary">
            Keine Treffer für „{query}“.
          </p>
        ) : (
          <div className="mt-12 space-y-14">
            {visibleGroups.map((group) => (
              <div key={group.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg font-semibold text-text-primary sm:text-xl">{group.title}</h3>
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
                    {group.contacts.length} {group.contacts.length === 1 ? 'Kontakt' : 'Kontakte'}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm text-text-secondary">{group.intro}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Send className="h-3 w-3" aria-hidden="true" />
                  E-Mail-Vorlage: „{group.outreach.subject}“
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {group.contacts.map((contact) => (
                    <ContactCard key={contact.name} contact={contact} outreach={group.outreach} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 font-mono text-xs text-text-tertiary">
          {totalShown} von {chips[0].count} Kontakten angezeigt
        </p>
      </div>
    </section>
  )
}

function ContactCard({
  contact,
  outreach,
}: {
  contact: DossierContact
  outreach: DossierOutreach
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-subtle bg-surface-base p-5 transition-colors hover:border-strong">
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 break-words text-base font-semibold text-text-primary">{contact.name}</h4>
        <span className="shrink-0 rounded-full border border-subtle bg-surface-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          {contact.category}
        </span>
      </div>

      {(contact.address || contact.city) && (
        <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-text-secondary">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-tertiary" aria-hidden="true" />
          <span>
            {contact.address ? `${contact.address}, ` : ''}
            {contact.city}
          </span>
        </p>
      )}

      {contact.note && <p className="mt-2 text-sm text-text-secondary">{contact.note}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {contact.email && (
          <ActionLink href={mailtoFor(contact.email, outreach)} icon={Mail} primary>
            E-Mail
          </ActionLink>
        )}

        {contact.bestContactUrl && (
          <ActionLink href={contact.bestContactUrl} icon={ExternalLink} external primary={!contact.email}>
            Kontaktseite
          </ActionLink>
        )}

        {contact.phone && (
          <ActionLink href={telHref(contact.phone)} icon={Phone}>
            {contact.phone}
          </ActionLink>
        )}

        {contact.website && contact.website !== contact.bestContactUrl && (
          <ActionLink href={contact.website} icon={ExternalLink} external primary={!contact.email && !contact.bestContactUrl}>
            Website
          </ActionLink>
        )}
      </div>
    </div>
  )
}

function ActionLink({
  href,
  icon: Icon,
  children,
  primary,
  external,
}: {
  href: string
  icon: typeof Mail
  children: React.ReactNode
  primary?: boolean
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
        primary
          ? 'border-action/40 bg-action-muted/15 text-action hover:bg-action-muted/25'
          : 'border-subtle bg-surface-base text-text-secondary hover:border-action/40 hover:text-text-primary',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="break-all">{children}</span>
    </a>
  )
}
