/**
 * HourRangePicker tests — the day-view hour selection (multi-select).
 * Verifies slot↔time mapping, contiguous drag, and that NON-ADJACENT
 * (Ctrl-click) selection produces a split shift whose gap becomes the break.
 */

import { render, fireEvent } from '@testing-library/react'
import { HourRangePicker } from '../HourRangePicker'

describe('HourRangePicker', () => {
  it('shows a prompt when nothing is selected', () => {
    const { getByText } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={jest.fn()} />,
    )
    expect(getByText(/Ctrl\/Cmd-Klick für geteilte Schichten/)).toBeInTheDocument()
  })

  it('seeds the summary from an existing entry', () => {
    const { getByText } = render(
      <HourRangePicker start="09:00" end="17:00" durationMinutes={420} onChange={jest.fn()} />,
    )
    // 09:00–17:00 with 420 worked → 60 min reconstructed as break
    expect(getByText(/09:00–17:00/)).toBeInTheDocument()
  })

  it('a single click selects one 30-min slot', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    fireEvent.click(getByRole('button', { name: '09:00' }))
    expect(onChange).toHaveBeenLastCalledWith('09:00', '09:30', 0, 30)
  })

  it('click + drag selects a contiguous range (break 0)', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    fireEvent.mouseDown(getByRole('button', { name: '09:00' }))
    fireEvent.mouseEnter(getByRole('button', { name: '11:00' }))
    fireEvent.mouseUp(window)
    // 09:00..11:00 inclusive = 09:00–11:30, 5 slots = 150 min worked, no gap
    expect(onChange).toHaveBeenLastCalledWith('09:00', '11:30', 0, 150)
  })

  it('Ctrl-click two non-adjacent slots → split shift, gap becomes break', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    fireEvent.click(getByRole('button', { name: '09:00' }))
    fireEvent.click(getByRole('button', { name: '11:00' }), { ctrlKey: true })
    // span 09:00–11:30 = 150 min, worked = 2 slots = 60, break = 90
    expect(onChange).toHaveBeenLastCalledWith('09:00', '11:30', 90, 60)
  })
})
