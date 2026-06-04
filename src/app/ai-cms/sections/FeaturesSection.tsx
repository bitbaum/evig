export function FeaturesSection() {
  const features = [
    { icon: '🗺️', title: 'Seitenkontext automatisch', description: 'URL, Screenshot und Seitentitel werden beim Einreichen automatisch erfasst.' },
    { icon: '🏷️', title: 'Kategorisierung', description: 'Vorschläge nach Typ: Fehler, Inhalt, Idee, Rechtschreibung, Barrierefreiheit.' },
    { icon: '🔔', title: 'Benachrichtigungen', description: 'Nutzer werden informiert, wenn ihr Vorschlag umgesetzt oder kommentiert wird.' },
    { icon: '🤖', title: 'KI-Zusammenfassung', description: 'Ähnliche Vorschläge werden automatisch gruppiert, um Duplikate zu reduzieren.' },
    { icon: '📊', title: 'Auswertung', description: 'Das Staff-Dashboard zeigt Trends und häufig gemeldete Bereiche.' },
    { icon: '🔒', title: 'Datenschutzkonform', description: 'Anonyme Einreichungen möglich — keine Pflichtangaben.' },
  ]

  return (
    <section className="py-16 px-4 bg-surface-raised">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
          Funktionen
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-surface-base rounded-lg border border-strong p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-text-secondary text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
