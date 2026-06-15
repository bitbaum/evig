'use client'

interface LoadingIndicatorProps {
  message?: string
}

export function LoadingIndicator({ message = "Typing..." }: LoadingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-surface-base text-text-primary rounded-2xl rounded-bl-md p-3 border border-subtle">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-action rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-action rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-action rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs text-text-muted">{message}</span>
        </div>
      </div>
    </div>
  )
}
