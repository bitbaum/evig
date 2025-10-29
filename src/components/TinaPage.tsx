'use client'

// TinaCMS integration temporarily disabled
// Content is managed through markdown files in /content/pages/

interface TinaPageProps {
  filename: string
  children?: React.ReactNode
}

export default function TinaPage({ filename, children }: TinaPageProps) {
  // For now, show a message about content management
  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose prose-lg max-w-none">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Content Management</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            This page content is managed through markdown files in the <code>/content/</code> directory.
          </p>
        </header>

        {children}

        <div className="prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
          <p>
            <strong>To edit this page:</strong>
          </p>
          <ol>
            <li>Edit the markdown file: <code>/content/pages/{filename}</code></li>
            <li>Changes will be reflected immediately in development</li>
            <li>For TinaCMS integration, set up cloud credentials</li>
          </ol>

          <p>
            <strong>Current file:</strong> <code>{filename}</code>
          </p>
        </div>
      </article>
    </div>
  )
}
