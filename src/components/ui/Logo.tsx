import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  href?: string
  showText?: boolean
}

export function Logo({ className, href = '/', showText = true }: LogoProps) {
  return (
    <Link href={href} className={cn('group', className)}>
      <Image
        src="/images/logo/revampit-logo.png"
        alt="Revamp-IT"
        width={200}
        height={48}
        className="h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
        priority
      />
    </Link>
  )
} 