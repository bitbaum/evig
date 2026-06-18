/**
 * TimecardMonthGrid selection model tests.
 *
 * Locks the spreadsheet interaction the user asked for: plain/modifier clicks,
 * click-and-drag range selection, and Delete-to-clear. Drag is the novel bit —
 * mousedown starts, mouseenter extends, and the trailing click that ends a drag
 * must NOT collapse the range back to a single day.
 */

import { render, fireEvent } from '@testing-library/react'
import { TimecardMonthGrid } from '../TimecardMonthGrid'

const DATES = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05']

function setup() {
  const onDaySelect = jest.fn()
  const onClearSelected = jest.fn()
  const { container } = render(
    <TimecardMonthGrid
      visibleDates={DATES}
      entries={[]}
      focusedDate={DATES[0]}
      selectedDates={[]}
      onDaySelect={onDaySelect}
      onClearSelected={onClearSelected}
    />,
  )
  const buttons = Array.from(container.querySelectorAll('button'))
  return { onDaySelect, onClearSelected, buttons, container }
}

describe('TimecardMonthGrid selection', () => {
  it('renders one button per visible date', () => {
    const { buttons } = setup()
    expect(buttons).toHaveLength(DATES.length)
  })

  it('plain click selects a single day', () => {
    const { onDaySelect, buttons } = setup()
    fireEvent.click(buttons[1])
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-02', 'single')
  })

  it('Ctrl/Cmd-click toggles (non-adjacent multi-select)', () => {
    const { onDaySelect, buttons } = setup()
    fireEvent.click(buttons[1], { ctrlKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-02', 'toggle')
    fireEvent.click(buttons[3], { metaKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-04', 'toggle')
  })

  it('Shift-click selects a range', () => {
    const { onDaySelect, buttons } = setup()
    fireEvent.click(buttons[3], { shiftKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-04', 'range')
  })

  it('click + drag selects a range and swallows the trailing click', () => {
    const { onDaySelect, buttons } = setup()
    // Press on day 2, drag across day 3 and day 4.
    fireEvent.mouseDown(buttons[1])
    fireEvent.mouseEnter(buttons[2])
    fireEvent.mouseEnter(buttons[3])
    fireEvent.mouseUp(window)
    // The click fired by the browser when the drag ends must not re-select one day.
    fireEvent.click(buttons[3])

    expect(onDaySelect.mock.calls).toEqual([
      ['2026-06-02', 'single'],
      ['2026-06-03', 'range'],
      ['2026-06-04', 'range'],
    ])
  })

  it('a normal click still works after a drag finished', () => {
    const { onDaySelect, buttons } = setup()
    fireEvent.mouseDown(buttons[0])
    fireEvent.mouseEnter(buttons[1])
    fireEvent.mouseUp(window)
    fireEvent.click(buttons[1]) // swallowed (ends the drag)
    onDaySelect.mockClear()

    fireEvent.click(buttons[4]) // a fresh, separate click
    expect(onDaySelect).toHaveBeenCalledTimes(1)
    expect(onDaySelect).toHaveBeenCalledWith('2026-06-05', 'single')
  })

  it('mouseenter without an active drag does nothing', () => {
    const { onDaySelect, buttons } = setup()
    fireEvent.mouseEnter(buttons[2])
    expect(onDaySelect).not.toHaveBeenCalled()
  })

  it('Delete clears the selected days', () => {
    const { onClearSelected, container } = setup()
    fireEvent.keyDown(container.firstChild as Element, { key: 'Delete' })
    expect(onClearSelected).toHaveBeenCalledTimes(1)
  })

  it('Backspace also clears', () => {
    const { onClearSelected, container } = setup()
    fireEvent.keyDown(container.firstChild as Element, { key: 'Backspace' })
    expect(onClearSelected).toHaveBeenCalledTimes(1)
  })
})
