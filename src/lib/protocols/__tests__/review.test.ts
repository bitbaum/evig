import { getProtocolReviewChecklist, getProtocolReviewCounts } from '../review'
import { PROTOCOL_STATUSES } from '@/config/protocols'
import type { ActionLinkRecord, StructuredNotes } from '@/lib/schemas/protocols'

const notes: StructuredNotes = {
  summary: 'Summary',
  detected_attendees: ['Anna'],
  topics: [{ id: 'topic-1', title: 'Topic', discussion: 'Talk', outcome: null }],
  action_items: [
    {
      id: 'task-1',
      description: 'Assigned task',
      assigned_to_name: 'Anna',
      assigned_to_id: 'user-anna',
      due_hint: null,
      item_type: 'task',
      topic_id: 'topic-1',
      priority_hint: 'normal',
    },
    {
      id: 'task-2',
      description: 'Unresolved task',
      assigned_to_name: 'Ben',
      assigned_to_id: null,
      due_hint: null,
      item_type: 'task',
      topic_id: 'topic-1',
      priority_hint: 'high',
    },
    {
      id: 'decision-1',
      description: 'Decide budget',
      assigned_to_name: null,
      assigned_to_id: null,
      due_hint: null,
      item_type: 'decision',
      topic_id: 'topic-1',
      priority_hint: null,
    },
  ],
  follow_ups: [{ description: 'Check later', status: null }],
}

const taskLink = {
  action_item_id: 'task-1',
} as ActionLinkRecord

describe('protocol review helpers', () => {
  it('derives review counts from structured notes and links', () => {
    const counts = getProtocolReviewCounts(notes, [taskLink])

    expect(counts).toMatchObject({
      topics: 1,
      actions: 3,
      tasks: 2,
      linkedTasks: 1,
      unlinkedTasks: 1,
      decisions: 1,
      openDecisions: 1,
      unresolvedAssignees: 1,
      followUps: 1,
    })
  })

  it('marks task and people review active while unresolved work remains', () => {
    const checklist = getProtocolReviewChecklist({
      status: PROTOCOL_STATUSES.REVIEW,
      hasRawInput: true,
      notes,
      actionLinks: [taskLink],
      decisionVotes: [],
      decisionOutcomes: [],
    })

    expect(checklist.find((item) => item.id === 'people')?.state).toBe('active')
    expect(checklist.find((item) => item.id === 'tasks')?.state).toBe('active')
    expect(checklist.find((item) => item.id === 'finalize')?.state).toBe('pending')
  })
})
