import { cn } from '@/lib/utils'
import { type MigrationDifficulty, MIGRATION_DIFFICULTY_CONFIG } from '@/config/open-source-registry'

interface MigrationDifficultyBadgeProps {
  difficulty: MigrationDifficulty
  className?: string
}

export function MigrationDifficultyBadge({ difficulty, className }: MigrationDifficultyBadgeProps) {
  const config = MIGRATION_DIFFICULTY_CONFIG[difficulty]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.color, className)}>
      {config.label}
    </span>
  )
}
