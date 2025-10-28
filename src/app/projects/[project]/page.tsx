import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import TinaProject from '@/components/TinaProject'

export async function generateMetadata({ params }: { params: { project: string } }): Promise<Metadata> {
  // For now, return generic metadata - in a real app you'd fetch the project data
  return {
    title: `${params.project} - RevampIT Projects`,
    description: 'Projects and initiatives from RevampIT.',
  }
}

export default function ProjectPage({ params }: { params: { project: string } }) {
  const filename = `${params.project}.md`

  return <TinaProject filename={filename} />
}

