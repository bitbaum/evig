import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-green-50 to-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Kontextuelles Feedback-System
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-6">
          Website-Verbesserungen direkt auf der Seite
        </h1>
        <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
          Unser Verbesserungssystem ermöglicht es Nutzern, Feedback direkt auf jeder Seite zu geben —
          ohne E-Mail, ohne Ticket, ohne Umwege. Eine moderne Alternative zu herkömmlichen CMS-Workflows.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Jetzt mitmachen
          </Link>
          <Link
            href="#workflow"
            className="inline-flex items-center justify-center px-6 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
          >
            So funktioniert es
          </Link>
        </div>
      </div>
    </section>
  )
}
