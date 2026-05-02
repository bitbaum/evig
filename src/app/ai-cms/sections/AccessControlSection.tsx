export function AccessControlSection() {
  const roles = [
    { role: 'Alle Nutzer', can: ['Vorschläge einreichen', 'Eigene Vorschläge verfolgen'], color: 'blue' },
    { role: 'Registrierte Mitglieder', can: ['Vorschläge bewerten', 'Kommentare hinzufügen'], color: 'green' },
    { role: 'Redaktion / Staff', can: ['Alle Vorschläge verwalten', 'Status setzen', 'Änderungen umsetzen'], color: 'purple' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-900',
    green: 'bg-green-50 border-green-100 text-green-900',
    purple: 'bg-purple-50 border-purple-100 text-purple-900',
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-neutral-900 text-center mb-4">
          Zugangskontrolle
        </h2>
        <p className="text-neutral-600 text-center mb-12">
          Das System funktioniert für alle — anonym oder eingeloggt. Mehr Rechte erhalten Mitglieder und Staff.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <div key={r.role} className={`border rounded-lg p-6 ${colorMap[r.color]}`}>
              <h3 className="font-semibold mb-3">{r.role}</h3>
              <ul className="space-y-1">
                {r.can.map((item) => (
                  <li key={item} className="text-sm flex items-start gap-2">
                    <span className="mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
