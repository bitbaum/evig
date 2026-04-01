import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProtocolFormClient from '../ProtocolFormClient'

const pushMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe('ProtocolFormClient', () => {
  beforeEach(() => {
    pushMock.mockReset()
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { id: 'p-100' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { processed: true } }) }) as jest.Mock
  })

  it('runs progressive transcript flow create + process', async () => {
    render(<ProtocolFormClient />)

    fireEvent.click(screen.getByRole('button', { name: /Teamsitzung/i }))

    fireEvent.click(screen.getByRole('button', { name: /Transkript.*Rohtext/i }))

    fireEvent.change(screen.getByLabelText(/Transkript/i), {
      target: { value: 'Dies ist ein genügend langes Transkript für die Verarbeitung mit mehr als fünfzig Zeichen.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Erstellen & Verarbeiten/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/protocols',
        expect.objectContaining({ method: 'POST' })
      )
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/protocols/p-100/process',
        expect.objectContaining({ method: 'POST' })
      )
    })

    expect(pushMock).toHaveBeenCalledWith('/admin/protocols/p-100')
  })
})
