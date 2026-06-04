/**
 * AboutCTA Component
 * 
 * Call-to-action section for the about page.
 * Displays a centered CTA with title, description, and button.
 */

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import Heading from '@/components/ui/Heading'

interface AboutCTAProps {
  title: string
  description: string
  buttonText: string
  href: string
}

export default function AboutCTA({ title, description, buttonText, href }: AboutCTAProps) {
  return (
    <section className="py-20 bg-action text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Heading level={2} className="text-3xl font-bold mb-6">{title}</Heading>
          <p className="text-xl mb-8">
            {description}
          </p>
          <Link href={href}>
            <Button 
              size="lg"
              className="bg-surface-base text-action hover:bg-surface-raised"
            >
              {buttonText}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}


