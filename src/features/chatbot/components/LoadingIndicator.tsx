'use client'

interface LoadingIndicatorProps {
  message?: string
}

export function LoadingIndicator({ message = "Typing..." }: LoadingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md p-3 border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs text-gray-500">{message}</span>
        </div>
      </div>
    </div>
  )
}