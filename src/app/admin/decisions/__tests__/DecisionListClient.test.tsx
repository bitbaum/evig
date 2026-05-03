import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { apiFetch } from '@/lib/api/client'
import DecisionListClient from '../DecisionListClient'

jest.mock('@/lib/api/client')

const mockedApiFetch = jest.mocked(apiFetch)

describe('DecisionListClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedApiFetch
      .mockResolvedValueOnce({ success: false, error: 'Kaputt' })
      .mockResolvedValueOnce({ success: true, data: { decisions: [], total: 0, page: 1, limit: 20 } })
  })

  it('renders error state on failed fetch and retries successfully', async () => {
    const stats = { voting: 0, discussion: 0, closed: 0, pendingVotes: 0 }
    render(<DecisionListClient currentUserId="test-user-id" isSuperAdmin={false} stats={stats} />)

    expect(await screen.findByText('Kaputt')).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: 'Erneut versuchen' })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Keine Entscheidungen gefunden')).toBeInTheDocument()
    })

    expect(mockedApiFetch).toHaveBeenCalledTimes(2)
  })
})
