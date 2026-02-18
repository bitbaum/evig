import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import DecisionListClient from '../DecisionListClient'

describe('DecisionListClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders error state on failed fetch and retries successfully', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Kaputt' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })

    const stats = { voting: 0, discussion: 0, closed: 0, pendingVotes: 0 }
    render(<DecisionListClient currentUserId="test-user-id" isSuperAdmin={false} stats={stats} />)

    expect(await screen.findByText('Kaputt')).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: 'Erneut versuchen' })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Keine Entscheidungen gefunden')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
