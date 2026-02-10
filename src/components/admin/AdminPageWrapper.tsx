import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backButton && (
            <>
              <Link
                href={backButton.href}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {backButton.label}
              </Link>
              <div className="w-px h-6 bg-gray-300" />
            </>
          )}
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${ICON_COLOR_CLASSES[iconColor]}`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}
