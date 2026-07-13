import Link from 'next/link'
import { FileText, ArrowRight } from 'lucide-react'

interface Props {
  /** Where to send the "back to blog" link. */
  blogHref?: string
  /** Login link, shown so staff can sign in to preview a draft. */
  loginHref?: string
}

/**
 * Friendly stand-in for a bare 404 when a post exists but isn't publicly
 * available yet (a draft). Explains the situation instead of "not found", and
 * offers a way forward — the blog index, and a sign-in link for staff who need
 * to preview it. Never leaks the draft's content.
 */
export default function BlogUnavailable({ blogHref = '/blog', loginHref }: Props) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4 py-16">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-subtle bg-surface-raised text-text-secondary">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="ui-public-eyebrow mt-6">Noch nicht veröffentlicht</div>
        <h1 className="ui-public-display-md mt-2">Dieser Beitrag ist noch ein Entwurf</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-text-secondary">
          Der Beitrag existiert, ist aber noch nicht öffentlich. Sobald er veröffentlicht ist, funktioniert
          dieser Link für alle. Falls du zum Team gehörst, melde dich an, um die Vorschau zu sehen.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={blogHref}
            className="inline-flex items-center gap-2 rounded-btn bg-action px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Zum Blog <ArrowRight className="h-4 w-4" />
          </Link>
          {loginHref && (
            <Link
              href={loginHref}
              className="inline-flex items-center gap-2 rounded-btn border border-subtle px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-overlay"
            >
              Anmelden
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
