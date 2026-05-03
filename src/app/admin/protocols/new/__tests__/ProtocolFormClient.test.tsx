import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { apiFetch } from '@/lib/api/client'
import ProtocolFormClient from '../ProtocolFormClient'

jest.mock('@/lib/api/client')

// AIFormAssist uses useTranslations which requires IntlProvider — mock it out in unit tests
jest.mock('@/components/ai/AIFormAssist', () => ({
  AIFormAssist: () => null,
}))

const mockedApiFetch = jest.mocked(apiFetch)
const pushMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

const teamMembers = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
]

describe('ProtocolFormClient', () => {
  beforeEach(() => {
    pushMock.mockReset()
    jest.clearAllMocks()
    mockedApiFetch.mockResolvedValueOnce({ success: true, data: { id: 'p-100' } })
    // Process call uses native fetch — keep global.fetch mock for it
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { processed: true } }),
    }) as jest.Mock
  })

  it('creates protocol with transcript in 2-step flow', async () => {
    render(<ProtocolFormClient teamMembers={teamMembers} />)

    // Step 1: Setup — select meeting type
    fireEvent.change(screen.getByLabelText(/Sitzungstyp/i), {
      target: { value: 'team_weekly' },
    })

    // Step 2: Content — enter transcript
    const textarea = await screen.findByLabelText(/Transkript oder Notizen/i)
    fireEvent.change(textarea, {
      target: { value: 'Dies ist ein genügend langes Transkript für die Verarbeitung mit mehr als fünfzig Zeichen.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Protokoll erstellen/i }))

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        '/api/protocols',
        expect.objectContaining({ method: 'POST' })
      )
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/protocols/p-100/process',
        expect.objectContaining({ method: 'POST' })
      )
    })

    expect(pushMock).toHaveBeenCalledWith('/admin/protocols/p-100')
  })
})
