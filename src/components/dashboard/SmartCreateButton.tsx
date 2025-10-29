import React from 'react'

interface SmartCreateButtonProps {
  children?: React.ReactNode
  onClick?: () => void
}

export default function SmartCreateButton({ children, onClick }: SmartCreateButtonProps) {
  return (
    <button onClick={onClick} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
      {children || 'Create'}
    </button>
  )
}

