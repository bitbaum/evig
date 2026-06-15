'use client'

import { Send } from 'lucide-react'
import { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          variant="primary"
          size="icon"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="rounded-full"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
