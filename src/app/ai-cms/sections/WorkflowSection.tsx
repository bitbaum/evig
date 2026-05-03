export function WorkflowSection() {
  const steps = [
    { step: '1', title: 'Verbesserung entdecken', description: 'Nutzer klickt auf das Feedback-Symbol auf einer beliebigen Seite.' },
    { step: '2', title: 'Vorschlag einreichen', description: 'Kurze Beschreibung, Typ (Fehler, Inhalt, Idee) und Screenshot werden automatisch erfasst.' },
    { step: '3', title: 'Prüfung durch Redaktion', description: 'Das Team bewertet Vorschläge im Admin-Bereich und entscheidet über Umsetzung.' },
    { step: '4', title: 'Umsetzung & Bestätigung', description: 'Umgesetzte Vorschläge werden als erledigt markiert — der Einreichende erhält eine Benachrichtigung.' },
  ]

  return (
    <section id="workflow" className="py-16 px-4 bg-neutral-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">
          So funktioniert das System
        </h2>
        <div className="relative">
          <div className="hidden md:block absolute left-8 top-8 bottom-8 w-px bg-primary-200" />
          <div className="space-y-8">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold z-10">
                  {s.step}
                </div>
                <div className="pt-3">
                  <h3 className="font-semibold text-neutral-900 mb-1">{s.title}</h3>
                  <p className="text-neutral-600 text-sm">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
