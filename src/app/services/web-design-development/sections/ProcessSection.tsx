const processSteps = [
  {
    step: '01',
    title: 'Entdeckung',
    description: 'Wir beginnen mit einer umfassenden Beratung, um deine Ziele, Anforderungen und Zielgruppe zu verstehen.',
  },
  {
    step: '02',
    title: 'Planung',
    description: 'Wir erstellen einen detaillierten Projektplan, einschliesslich Zeitplan, Technologie-Stack und Designansatz.',
  },
  {
    step: '03',
    title: 'Entwicklung',
    description: 'Wir erstellen deine Website nach agiler Methodik mit regelmässigen Updates und Feedback-Sitzungen.',
  },
  {
    step: '04',
    title: 'Start & Support',
    description: 'Wir starten deine Website und bieten laufenden Support, Wartung und Optimierung.',
  },
]

export function ProcessSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Unser Entwicklungsprozess</h2>
          <p className="text-lg text-gray-600">
            Wir verfolgen einen kollaborativen, transparenten Prozess, der sicherstellt, dass Ihr Projekt
            deinen Bedürfnissen entspricht und deine Erwartungen übertrifft.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {processSteps.map((phase, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {phase.step}
              </div>
              <h3 className="text-xl font-bold mb-3">{phase.title}</h3>
              <p className="text-gray-600">{phase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
