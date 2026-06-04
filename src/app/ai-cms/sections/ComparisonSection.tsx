export function ComparisonSection() {
  const rows = [
    { feature: 'Kontext beim Feedback', classic: '❌ Manuell', new: '✅ Automatisch (URL, Screenshot)' },
    { feature: 'Einreichung für Nutzer', classic: '❌ E-Mail / Formular', new: '✅ Direkt auf der Seite' },
    { feature: 'Redaktioneller Aufwand', classic: '❌ Hoch', new: '✅ Niedrig (KI-Gruppierung)' },
    { feature: 'Anonyme Einreichungen', classic: '✅ Möglich', new: '✅ Möglich' },
    { feature: 'Benachrichtigungen', classic: '❌ Manuell', new: '✅ Automatisch' },
    { feature: 'Datenschutz', classic: '✅ DSGVO-konform', new: '✅ DSGVO-konform' },
  ]

  return (
    <section className="py-16 px-4 bg-surface-raised">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
          Klassisches CMS vs. Kontextuelles System
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-strong">
                <th className="text-left py-3 pr-4 font-semibold text-text-secondary">Funktion</th>
                <th className="text-left py-3 px-4 font-semibold text-text-tertiary">Klassisch</th>
                <th className="text-left py-3 pl-4 font-semibold text-action">Unser System</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.feature} className={i % 2 === 0 ? 'bg-surface-base' : ''}>
                  <td className="py-3 pr-4 text-text-secondary font-medium">{r.feature}</td>
                  <td className="py-3 px-4 text-text-tertiary">{r.classic}</td>
                  <td className="py-3 pl-4 text-text-primary">{r.new}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
