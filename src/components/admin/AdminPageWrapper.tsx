import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Heading from '@/components/ui/Heading'

const ICON_COLOR_CLASSES = {
  blue: 'bg-blue-100 text-blue-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  teal: 'bg-teal-100 text-teal-600',
  gray: 'bg-gray-100 text-gray-600',
} as const

interface AdminPageWrapperProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: keyof typeof ICON_COLOR_CLASSES
  backButton?: { href: string; label: string }
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function AdminPageWrapper({
  title,
  description,
  icon: Icon,
  iconColor = 'blue',
  backButton,
  actions,
  children,
}: AdminPageWrapperProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {backButton && (
            <>
              <Link
                href={backButton.href}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">{backButton.label}</span>
              </Link>
              <div className="w-px h-6 bg-gray-300 shrink-0" />
            </>
          )}
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 ${ICON_COLOR_CLASSES[iconColor]}`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
            <div className="min-w-0">
              <Heading level={1} className="text-xl sm:text-2xl text-gray-900 dark:text-white truncate">
                {title}
              </Heading>
              {description && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}
