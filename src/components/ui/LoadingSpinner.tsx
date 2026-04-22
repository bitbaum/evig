import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  text?: string
}

export default function LoadingSpinner({ text }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    </div>
  )
}
