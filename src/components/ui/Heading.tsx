import { cn } from '@/lib/utils'
import { responsiveTypography } from '@/lib/responsive'

interface HeadingProps {
  level: 1 | 2 | 3 | 4
  children: React.ReactNode
  className?: string
}

const levelConfig = {
  1: { tag: 'h1' as const, typography: responsiveTypography.hero },
  2: { tag: 'h2' as const, typography: responsiveTypography.section },
  3: { tag: 'h3' as const, typography: responsiveTypography.subsection },
  4: { tag: 'h4' as const, typography: responsiveTypography.cardTitle },
}

export default function Heading({ level, children, className }: HeadingProps) {
  const { tag: Tag, typography } = levelConfig[level]
  return <Tag className={cn(typography, 'font-bold', className)}>{children}</Tag>
}
