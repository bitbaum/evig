'use client'

import { useState } from 'react'

export default function BackgroundSection({ background }: { background: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4 rounded-lg border border-warning-200 bg-warning-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-warning-800 hover:bg-warning-100 transition-colors rounded-lg"
      >
        <span className="flex items-center gap-2">
          <span>📄</span>
          Begründung & Hintergrund lesen
        </span>
        <span className="text-warning-500 text-xs">{open ? '▲ Einklappen' : '▼ Aufklappen'}</span>
      </button>
      {open && (
        <div className="border-t border-warning-200 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-warning-900">
            {background}
          </p>
        </div>
      )}
    </div>
  )
}
