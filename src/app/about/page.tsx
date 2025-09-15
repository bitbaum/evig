import { Metadata } from 'next'
import HardcodedAboutPage from './hardcoded-content'

export const metadata: Metadata = {
  title: 'About Us - RevampIT',
  description: 'Learn about our mission to extend the life of IT devices and promote sustainable computing practices.',
};

export default function AboutPage() {
  return <HardcodedAboutPage />;
} 