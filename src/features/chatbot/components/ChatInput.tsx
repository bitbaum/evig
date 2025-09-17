'use client'

import { Send } from 'lucide-react'
import { forwardRef } from 'react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(
  ({ value, onChange, onSubmit, onKeyDown, disabled = false, placeholder = "Type here..." }, ref) => {
    return (
      <div className="flex space-x-2">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'