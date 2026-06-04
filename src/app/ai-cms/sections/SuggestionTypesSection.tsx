export function SuggestionTypesSection() {
  const types = [
    { label: 'Fehler', emoji: '🐛', description: 'Etwas funktioniert nicht oder zeigt falsche Informationen an.' },
    { label: 'Inhalt', emoji: '✏️', description: 'Text ist veraltet, unvollständig oder missverständlich.' },
    { label: 'Idee', emoji: '💡', description: 'Neue Funktion oder Verbesserungsvorschlag.' },
    { label: 'Rechtschreibung', emoji: '🔤', description: 'Schreibfehler, Grammatik oder Formatierungsprobleme.' },
    { label: 'Barrierefreiheit', emoji: '♿', description: 'Problem mit Screenreader, Kontrast oder Tastaturnavigation.' },
    { label: 'Sonstiges', emoji: '📌', description: 'Allgemeines Feedback, das in keine Kategorie passt.' },
  ]

  return (
    <section className="py-16 px-4 bg-surface-base">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-4">
          Arten von Vorschlägen
        </h2>
        <p className="text-text-secondary text-center mb-10">
          Jede Einreichung wird einem Typ zugeordnet, damit das Team Prioritäten setzen kann.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {types.map((t) => (
            <div key={t.label} className="flex items-start gap-3 p-4 bg-surface-raised rounded-lg border border-strong">
              <span className="text-2xl shrink-0">{t.emoji}</span>
              <div>
                <div className="font-semibold text-text-primary text-sm">{t.label}</div>
                <div className="text-text-secondary text-xs mt-1">{t.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
