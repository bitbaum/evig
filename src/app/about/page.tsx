import { Metadata } from 'next'
import HardcodedAboutPage from './hardcoded-content'

export const metadata: Metadata = {
  title: 'Über uns - RevampIT',
  description: 'Erfahre mehr über unsere Mission, die Lebensdauer von IT-Geräten zu verlängern und nachhaltiges Computing zu fördern.',
};

export default function AboutPage() {
  return <HardcodedAboutPage />;
} 