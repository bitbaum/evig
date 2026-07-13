'use client'

import { useState } from 'react'
import { Download, Code2, ChevronDown, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isTextFile } from '@/config/deliverables'

interface DeliverableFile {
  name: string
  url: string
}

/**
 * Lists a deliverable's files with a download link and, for text/code files,
 * an inline "view code" toggle that fetches the (public) file content.
 * Used on both the admin detail page and the public share page.
 */
export default function DeliverableFiles({ files }: { files: DeliverableFile[] }) {
  if (!files || files.length === 0) return null
  return (
    <div className="bg-surface-base rounded-lg border p-5">
      <h2 className="flex items-center gap-2 font-semibold text-text-primary mb-4">
        <FileText className="w-4 h-4" />
        Dateien ({files.length})
      </h2>
      <ul className="space-y-2">
        {files.map((f) => (
          <FileRow key={f.url} file={f} />
        ))}
      </ul>
    </div>
  )
}

function FileRow({ file }: { file: DeliverableFile }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const canView = isTextFile(file.name)

  async function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (code === null) {
      setLoading(true)
      try {
        const res = await fetch(file.url)
        setCode(res.ok ? await res.text() : 'Datei konnte nicht geladen werden.')
      } catch {
        setCode('Datei konnte nicht geladen werden.')
      }
      setLoading(false)
    }
  }

  return (
    <li className="border rounded-md">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <span className="text-sm font-medium text-text-primary truncate">{file.name}</span>
        <div className="flex items-center gap-1 shrink-0">
          {canView && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="gap-1 text-xs text-text-secondary hover:text-action"
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          )}
          <a
            href={file.url}
            download
            className="inline-flex items-center gap-1 text-xs text-action hover:underline px-2 py-1 rounded"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>
      {open && (
        <div className="border-t bg-surface-raised max-h-96 overflow-auto">
          {loading ? (
            <div className="p-4 flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin" /> Lädt…
            </div>
          ) : (
            <pre className="p-3 text-xs text-text-primary whitespace-pre overflow-x-auto"><code>{code}</code></pre>
          )}
        </div>
      )}
    </li>
  )
}
