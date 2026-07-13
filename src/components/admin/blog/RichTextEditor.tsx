'use client'

/**
 * Rich-text (WYSIWYG) editor for blog content.
 *
 * Authors see real formatting — bold looks bold, headings look like headings —
 * and never have to type Markdown syntax. Storage stays Markdown (the public
 * site + translations are unchanged): the editor parses the incoming Markdown
 * and serialises back to Markdown on every change via tiptap-markdown.
 *
 * A "Markdown" toggle drops to a raw source textarea for power users or for
 * editing complex existing content (nested tables/quotes) with full control.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import { Markdown } from 'tiptap-markdown'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2, Table as TableIcon,
  Code, Undo2, Redo2, Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
}

/** One toolbar button — icon, active state, click handler. */
function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={active ? 'bg-primary-600 text-white hover:bg-primary-600' : 'text-text-secondary'}
    >
      {children}
    </Button>
  )
}

function Toolbar({ editor, onToggleSource }: { editor: Editor; onToggleSource: () => void }) {
  // Re-render the toolbar as selection/marks change so active states stay live.
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-subtle bg-surface-raised px-2 py-1.5">
      <ToolbarButton title="Fett" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton title="Kursiv" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton title="Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton title="Überschrift 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton title="Überschrift 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton title="Aufzählung" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton title="Nummerierte Liste" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton title="Zitat" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton title="Link einfügen" active={editor.isActive('link')} onClick={() => {
        const prev = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('Link-URL (leer lassen zum Entfernen):', prev || 'https://')
        if (url === null) return
        if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }}><Link2 className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton title="Tabelle einfügen" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton title="Rückgängig" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton title="Wiederholen" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></ToolbarButton>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onToggleSource}
        className="ml-auto gap-1.5 text-text-secondary"
        title="Zum Markdown-Quelltext wechseln"
      >
        <Type className="w-4 h-4" /> Markdown
      </Button>
    </div>
  )
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const [mode, setMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg')
  // Tracks the last Markdown WE emitted, so external prop changes (e.g. switching
  // language tabs) are pushed into the editor while our own edits are not.
  const lastEmitted = useRef(value)

  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch in the App Router
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({ html: false, tightLists: true, transformPastedText: true, linkify: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'rich-editor-content focus:outline-none',
        'aria-label': placeholder || 'Artikelinhalt',
      },
    },
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown.getMarkdown()
      lastEmitted.current = md
      onChange(md)
    },
  })

  // Push external changes (locale switch, AI translation load) into the editor
  // without clobbering the caret during the author's own typing.
  useEffect(() => {
    if (!editor) return
    if (value !== lastEmitted.current) {
      lastEmitted.current = value
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  const toMarkdownMode = useCallback(() => setMode('markdown'), [])
  const toWysiwygMode = useCallback(() => setMode('wysiwyg'), [])

  if (mode === 'markdown') {
    return (
      <div className="overflow-hidden rounded-lg border border-subtle">
        <div className="flex items-center justify-between border-b border-subtle bg-surface-raised px-3 py-1.5">
          <span className="text-xs font-medium text-text-tertiary">Markdown-Quelltext</span>
          <Button type="button" size="sm" variant="ghost" onClick={toWysiwygMode} className="gap-1.5 text-text-secondary" title="Zur visuellen Bearbeitung wechseln">
            <Type className="w-4 h-4" /> Visuell
          </Button>
        </div>
        <Textarea
          value={value}
          onChange={(e) => { lastEmitted.current = e.target.value; onChange(e.target.value) }}
          rows={20}
          className="rounded-none border-0 font-mono text-sm focus-visible:ring-0"
          placeholder={placeholder}
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-subtle">
      {editor && <Toolbar editor={editor} onToggleSource={toMarkdownMode} />}
      <EditorContent editor={editor} className="max-h-[640px] overflow-y-auto bg-surface-base px-4 py-3" />
    </div>
  )
}
