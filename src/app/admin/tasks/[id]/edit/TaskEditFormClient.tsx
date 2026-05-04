'use client'

import TaskFormClient from '../../new/TaskFormClient'
import type { TaskEditItem } from '@/lib/schemas/tasks'

export default function TaskEditFormClient({ task }: { task: TaskEditItem }) {
  return <TaskFormClient task={task} />
}
