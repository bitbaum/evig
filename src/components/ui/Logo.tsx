import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ORG, ORG_IMAGES } from '@/config/org'

interface LogoProps {
  className?: string
  href?: string
  showText?: boolean
}

export function Logo({ className, href = '/', showText = true }: LogoProps) {
  return (
    <Link href={href} className={cn('group block max-w-full', className)}>
      {/* max-w-full + object-left let the logo scale down inside a shrinking
          flex container (narrow phones) instead of overflowing the row. */}
      <Image
        src={ORG_IMAGES.logo}
        alt={ORG.name}
        width={200}
        height={48}
        className="h-12 w-auto max-w-full object-contain object-left transition-transform duration-200 group-hover:scale-105"
        priority
      />
    </Link>
  )
} 