/**
 * HourRangePicker tests — the day-view hour selection.
 * Verifies slot↔time mapping, toggle clicks, drag-paint, drag-erase, that a
 * SECOND painted block produces a split shift whose gap becomes the break
 * (no modifier keys needed), and that external entry changes re-seed the grid
 * without echoing an onChange back.
 */

import { render, fireEvent } from '@testing-library/react'
import { HourRangePicker } from '../HourRangePicker'

function slot(getByRole: ReturnType<typeof render>['getByRole'], time: string) {
  return getByRole('button', { name: time })
}

describe('HourRangePicker', () => {
  it('shows a device-matched prompt when nothing is selected', () => {
    const { getByText } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={jest.fn()} />,
    )
    // next-intl is mocked to return keys.
    expect(getByText('hourHint')).toBeInTheDocument()
    expect(getByText('hourHintTouch')).toBeInTheDocument()
  })

  it('seeds the summary from an existing entry (break reconstructed at midday)', () => {
    const { getByText } = render(
      <HourRangePicker start="09:00" end="17:00" durationMinutes={420} onChange={jest.fn()} />,
    )
    // 60 min surplus lands in the midday window (12:00 + 12:30 slots removed).
    expect(getByText(/09:00–12:00 · 13:00–17:00/)).toBeInTheDocument()
  })

  it('a single click toggles one 30-min slot on', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    fireEvent.click(slot(getByRole, '09:00'))
    expect(onChange).toHaveBeenLastCalledWith('09:00', '09:30', 0, 30)
  })

  it('clicking a selected slot toggles it off — and clearing everything reports null times', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    fireEvent.click(slot(getByRole, '09:00'))
    fireEvent.click(slot(getByRole, '09:00'))
    expect(onChange).toHaveBeenLastCalledWith(null, null, 0, 0)
  })

  it('press + drag paints a contiguous range (break 0)', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    fireEvent.pointerDown(slot(getByRole, '09:00'))
    fireEvent.pointerEnter(slot(getByRole, '11:00'))
    fireEvent.pointerUp(window)
    // 09:00..11:00 inclusive = 09:00–11:30, 5 slots = 150 min worked, no gap
    expect(onChange).toHaveBeenLastCalledWith('09:00', '11:30', 0, 150)
  })

  it('drag interpolates skipped slots (fast moves cannot leave holes)', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    fireEvent.pointerDown(slot(getByRole, '08:00'))
    // Jump straight to 10:00 without entering 08:30–09:30.
    fireEvent.pointerEnter(slot(getByRole, '10:00'))
    fireEvent.pointerUp(window)
    expect(onChange).toHaveBeenLastCalledWith('08:00', '10:30', 0, 150)
  })

  it('two plain clicks on non-adjacent slots → split shift, gap becomes break', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    fireEvent.click(slot(getByRole, '09:00'))
    fireEvent.click(slot(getByRole, '11:00'))
    // span 09:00–11:30 = 150 min, worked = 2 slots = 60, break = 90
    expect(onChange).toHaveBeenLastCalledWith('09:00', '11:30', 90, 60)
  })

  it('painting two blocks makes a split shift: 08–12 + 14–17 with a 2h break', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start={null} end={null} durationMinutes={0} onChange={onChange} />,
    )
    // Morning block 08:00–12:00 (slots 08:00..11:30).
    fireEvent.pointerDown(slot(getByRole, '08:00'))
    fireEvent.pointerEnter(slot(getByRole, '11:30'))
    fireEvent.pointerUp(window)
    // Afternoon block 14:00–17:00 (slots 14:00..16:30).
    fireEvent.pointerDown(slot(getByRole, '14:00'))
    fireEvent.pointerEnter(slot(getByRole, '16:30'))
    fireEvent.pointerUp(window)
    // Worked 4h + 3h = 420, span 08:00–17:00 = 540, break = 120.
    expect(onChange).toHaveBeenLastCalledWith('08:00', '17:00', 120, 420)
  })

  it('a drag starting on a selected slot ERASES', () => {
    const onChange = jest.fn()
    const { getByRole } = render(
      <HourRangePicker start="09:00" end="12:00" durationMinutes={180} onChange={onChange} />,
    )
    // Erase 11:00–12:00 from the seeded 09:00–12:00 block.
    fireEvent.pointerDown(slot(getByRole, '11:00'))
    fireEvent.pointerEnter(slot(getByRole, '11:30'))
    fireEvent.pointerUp(window)
    expect(onChange).toHaveBeenLastCalledWith('09:00', '11:00', 0, 120)
  })

  it('re-seeds from changed entry props without echoing onChange', () => {
    const onChange = jest.fn()
    const { rerender, getByText } = render(
      <HourRangePicker start="09:00" end="12:00" durationMinutes={180} onChange={onChange} />,
    )
    // The entry changed through another surface (Von/Bis fields, fill action).
    rerender(
      <HourRangePicker start="08:00" end="12:00" durationMinutes={240} onChange={onChange} />,
    )
    expect(getByText(/08:00–12:00/)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
