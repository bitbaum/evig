export function ProblemSection() {
  const problems = [
    {
      title: 'Feedback geht verloren',
      description: 'Nutzer finden einen Fehler, öffnen aber keine E-Mail. Der Fehler bleibt unbemerkt.',
    },
    {
      title: 'Fehlender Kontext',
      description: 'Bug-Reports ohne Screenshot oder URL sind kaum verwertbar.',
    },
    {
      title: 'Langsame Redaktionszyklen',
      description: 'Inhaltliche Änderungen brauchen Wochen, bis sie jemand einpflegt.',
    },
  ]

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-neutral-900 text-center mb-4">
          Das Problem mit klassischem Feedback
        </h2>
        <p className="text-neutral-600 text-center mb-12 max-w-2xl mx-auto">
          Traditionelle Rückmeldewege — E-Mail, Kontaktformular, Ticket-System — haben alle denselben
          Nachteil: sie trennen Kontext vom Problem.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div key={p.title} className="bg-error-50 border border-error-100 rounded-lg p-6">
              <h3 className="font-semibold text-error-900 mb-2">{p.title}</h3>
              <p className="text-error-700 text-sm">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
