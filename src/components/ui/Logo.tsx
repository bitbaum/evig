import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  href?: string
  showText?: boolean
}

export function Logo({ className, href = '/', showText = true }: LogoProps) {
  return (
    <Link href={href} className={cn('flex items-center gap-3 group', className)}>
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-700 shadow-lg group-hover:shadow-xl transition-all duration-200">
        <span className="text-white font-bold text-xl">R</span>
      </div>
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          RevampIT
        </span>
      )}
    </Link>
  )
} 