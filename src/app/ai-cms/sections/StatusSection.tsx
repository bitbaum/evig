import { ORG } from '@/config/org'

export function StatusSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-neutral-900 mb-6">
          Aktueller Status
        </h2>
        <div className="inline-flex items-center gap-2 bg-warning-50 border border-warning-200 text-warning-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-warning-500 rounded-full" />
          In Entwicklung — Beta
        </div>
        <p className="text-neutral-600 mb-8">
          Das Verbesserungssystem wird schrittweise auf {ORG.emailDomain} eingeführt. Zuerst auf ausgewählten
          Seiten, dann auf der gesamten Plattform.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 text-left">
          {[
            { phase: 'Phase 1', label: 'Abgeschlossen', detail: 'Backend, Datenbank, Admin-Verwaltung', done: true },
            { phase: 'Phase 2', label: 'Aktiv', detail: 'Frontend-Widget auf ausgewählten Seiten', done: false },
            { phase: 'Phase 3', label: 'Geplant', detail: 'KI-Gruppierung, öffentliche Übersicht', done: false },
          ].map((p) => (
            <div key={p.phase} className={`rounded-lg border p-4 ${p.done ? 'bg-primary-50 border-primary-200' : 'bg-neutral-50 border-neutral-200'}`}>
              <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">{p.phase}</div>
              <div className={`font-semibold mb-1 ${p.done ? 'text-primary-800' : 'text-neutral-700'}`}>{p.label}</div>
              <div className="text-xs text-neutral-600">{p.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
