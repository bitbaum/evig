import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProtocolDetailClient from '../ProtocolDetailClient'
import type { ProtocolDetail } from '@/lib/schemas/protocols'

const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: jest.fn(),
  }),
}))

describe('ProtocolDetailClient', () => {
  const scrollIntoViewMock = jest.fn()

  const baseProtocol: ProtocolDetail = {
    id: 'p-1',
    title: 'Team Meeting',
    meeting_date: '2026-02-17',
    meeting_type: 'team_weekly',
    visibility: 'team',
    attendees: [],
    input_method: 'notes',
    raw_transcript: 'Diese Notizen sind lang genug für erneute Verarbeitung.',
    structured_notes: {
      summary: 'Kurzfassung',
      detected_attendees: [],
      topics: [],
      action_items: [],
      follow_ups: [],
    },
    processing_model: null,
    status: 'review',
    created_by: 'u-1',
    created_by_name: 'Admin',
    created_by_email: 'admin@example.com',
    created_at: '2026-02-17T00:00:00.000Z',
    updated_at: '2026-02-17T00:00:00.000Z',
  }

  beforeEach(() => {
    refreshMock.mockReset()
    scrollIntoViewMock.mockReset()
    Element.prototype.scrollIntoView = scrollIntoViewMock
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    }) as jest.Mock
  })

  it('uses notes reprocess endpoint and body (content) in review mode', async () => {
    render(
      <ProtocolDetailClient
        protocol={baseProtocol}
        actionLinks={[]}
        teamMembers={[]}
        protocolDecisions={[]}
        
        currentUserId="u-1"
        isProtocolCreator
        isSuperAdmin={false}
      />
    )

    fireEvent.click(screen.getByText(/Nicht zufrieden\?/i))

    const button = screen.getByRole('button', { name: /Erneut verarbeiten/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/protocols/p-1/process-notes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: baseProtocol.raw_transcript }),
        })
      )
    })

    expect(refreshMock).toHaveBeenCalled()
  })

  it('creates all unlinked task action items in bulk', async () => {
    const protocolWithTasks: ProtocolDetail = {
      ...baseProtocol,
      structured_notes: {
        summary: 'Kurzfassung',
        detected_attendees: [],
        topics: [],
        action_items: [
          {
            id: 'a-1',
            description: 'Website aktualisieren',
            assigned_to_name: null,
            assigned_to_id: null,
            due_hint: null,
            item_type: 'task',
            topic_id: null,
            priority_hint: 'normal',
          },
        ],
        follow_ups: [],
      },
    }

    render(
      <ProtocolDetailClient
        protocol={protocolWithTasks}
        actionLinks={[]}
        teamMembers={[]}
        protocolDecisions={[]}
        
        currentUserId="u-1"
        isProtocolCreator
        isSuperAdmin={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /1 Aufgaben erstellen/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/protocols/p-1/actions',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('shows workflow stepper with next-step guidance', () => {
    render(
      <ProtocolDetailClient
        protocol={baseProtocol}
        actionLinks={[]}
        teamMembers={[]}
        protocolDecisions={[]}
        
        currentUserId="u-1"
        isProtocolCreator
        isSuperAdmin={false}
      />
    )

    // Progress strip is shown in review mode; active step hint label is rendered
    expect(screen.getByText('KI-Struktur prüfen:')).toBeInTheDocument()
  })

  it('shows progress strip in review mode', () => {
    render(
      <ProtocolDetailClient
        protocol={baseProtocol}
        actionLinks={[]}
        teamMembers={[]}
        protocolDecisions={[]}
        
        currentUserId="u-1"
        isProtocolCreator
        isSuperAdmin={false}
      />
    )

    // All step labels appear in the progress strip
    expect(screen.getByText('Abschliessen')).toBeInTheDocument()
  })

  it('shows actionable empty state when no action items were extracted', () => {
    render(
      <ProtocolDetailClient
        protocol={baseProtocol}
        actionLinks={[]}
        teamMembers={[]}
        protocolDecisions={[]}
        
        currentUserId="u-1"
        isProtocolCreator
        isSuperAdmin={false}
      />
    )

    expect(screen.getByText('Keine Aktionen erkannt')).toBeInTheDocument()
    expect(screen.getByText(/Überarbeite den Inhalt oben/i)).toBeInTheDocument()
  })
})
