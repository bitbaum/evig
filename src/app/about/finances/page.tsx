import { Metadata } from 'next'
import FinancesContent from './FinancesContent'

export const metadata: Metadata = {
  title: 'Finanzen & Transparenz - RevampIT',
  description: 'Öffentliche Finanzdaten von RevampIT. Erfahren Sie, wie wir unsere Mittel einsetzen und wie hoch unsere Eigenfinanzierungsquote ist.',
}

export default function FinancesPage() {
  return <FinancesContent />
}
