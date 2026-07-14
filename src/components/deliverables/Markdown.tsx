'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Small, safe markdown renderer for deliverable descriptions / instructions.
 * Styled to sit inline on the share + detail pages.
 */
export default function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div
      className={
        'space-y-2 text-text-secondary ' +
        '[&_strong]:text-text-primary [&_h2]:text-text-primary [&_h2]:font-semibold [&_h2]:text-base [&_h2]:mt-3 ' +
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 ' +
        '[&_a]:text-action [&_a]:underline ' +
        '[&_code]:bg-surface-overlay [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono ' +
        className
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
