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
    <Link href={href} className={cn('flex items-center gap-3 group', className)}>
      <Image
        src="/images/logo/revampit-logo.png"
        alt="RevampIT Logo"
        width={40}
        height={40}
        className="transition-transform duration-200 group-hover:scale-105"
      />
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          RevampIT
        </span>
      )}
    </Link>
  )
} 