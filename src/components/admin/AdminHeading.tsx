/**
 * AdminHeading — compact heading for admin/dashboard UIs.
 * Defaults variant="admin" so dashboard pages get appropriately sized headings.
 * All other props pass through to the shared Heading component.
 */
import Heading, { type HeadingProps } from '@/components/ui/Heading'

export default function AdminHeading(props: HeadingProps) {
  return <Heading variant="admin" {...props} />
}
