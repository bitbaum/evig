/**
 * TimecardMonthGrid selection model tests.
 *
 * Locks the spreadsheet interaction: plain/modifier clicks, click-and-drag
 * PAINT selection (each entered cell is added — dragging down a column paints
 * that weekday's days, not the linear date range), weekday-header column select,
 * and Delete-to-clear. The trailing click that ends a drag must NOT collapse the
 * selection back to a single day.
 *
 * Date cells carry `aria-pressed`; weekday-header buttons do not — that's how we
 * tell them apart in the DOM.
 */

import { render, fireEvent } from '@testing-library/react'
import { TimecardMonthGrid } from '../TimecardMonthGrid'

// June 2026: 01=Mon, 02=Tue, 03=Wed, 04=Thu, 05=Fri.
const DATES = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05']

function setup() {
  const onDaySelect = jest.fn()
  const onWeekdaySelect = jest.fn()
  const onClearSelected = jest.fn()
  const { container } = render(
    <TimecardMonthGrid
      visibleDates={DATES}
      entries={[]}
      focusedDate={DATES[0]}
      selectedDates={[]}
      onDaySelect={onDaySelect}
      onWeekdaySelect={onWeekdaySelect}
      onClearSelected={onClearSelected}
    />,
  )
  const all = Array.from(container.querySelectorAll('button'))
  const dayCells = all.filter(b => b.hasAttribute('aria-pressed'))
  const headerCells = all.filter(b => !b.hasAttribute('aria-pressed'))
  return { onDaySelect, onWeekdaySelect, onClearSelected, dayCells, headerCells, container }
}

describe('TimecardMonthGrid selection', () => {
  it('renders one day-cell per visible date (plus 7 weekday headers)', () => {
    const { dayCells, headerCells } = setup()
    expect(dayCells).toHaveLength(DATES.length)
    expect(headerCells).toHaveLength(7)
  })

  it('plain click selects a single day', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.click(dayCells[1])
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-02', 'single')
  })

  it('Ctrl/Cmd-click toggles (non-adjacent multi-select)', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.click(dayCells[1], { ctrlKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-02', 'toggle')
    fireEvent.click(dayCells[3], { metaKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-04', 'toggle')
  })

  it('Shift-click selects a range', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.click(dayCells[3], { shiftKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-04', 'range')
  })

  it('click + drag PAINTS each entered cell (add) and swallows the trailing click', () => {
    const { onDaySelect, dayCells } = setup()
    // Press on day 2, drag across day 3 and day 4.
    fireEvent.mouseDown(dayCells[1])
    fireEvent.mouseEnter(dayCells[2])
    fireEvent.mouseEnter(dayCells[3])
    fireEvent.mouseUp(window)
    // The click fired by the browser when the drag ends must not re-select one day.
    fireEvent.click(dayCells[3])

    expect(onDaySelect.mock.calls).toEqual([
      ['2026-06-02', 'single'],
      ['2026-06-03', 'add'],
      ['2026-06-04', 'add'],
    ])
  })

  it('a normal click still works after a drag finished', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.mouseDown(dayCells[0])
    fireEvent.mouseEnter(dayCells[1])
    fireEvent.mouseUp(window)
    fireEvent.click(dayCells[1]) // swallowed (ends the drag)
    onDaySelect.mockClear()

    fireEvent.click(dayCells[4]) // a fresh, separate click
    expect(onDaySelect).toHaveBeenCalledTimes(1)
    expect(onDaySelect).toHaveBeenCalledWith('2026-06-05', 'single')
  })

  it('mouseenter without an active drag does nothing', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.mouseEnter(dayCells[2])
    expect(onDaySelect).not.toHaveBeenCalled()
  })

  it('clicking a weekday header selects that whole column', () => {
    const { onWeekdaySelect, headerCells } = setup()
    // Headers are Mon-first (Mo,Di,…); Di (index 1) → JS weekday 2 (Tuesday).
    fireEvent.mouseDown(headerCells[1])
    expect(onWeekdaySelect).toHaveBeenLastCalledWith(2, false)
  })

  it('dragging across weekday headers adds each column', () => {
    const { onWeekdaySelect, headerCells } = setup()
    fireEvent.mouseDown(headerCells[0]) // Mo → weekday 1, fresh
    fireEvent.mouseEnter(headerCells[1]) // Di → weekday 2, additive
    fireEvent.mouseEnter(headerCells[2]) // Mi → weekday 3, additive
    fireEvent.mouseUp(window)
    expect(onWeekdaySelect.mock.calls).toEqual([
      [1, false],
      [2, true],
      [3, true],
    ])
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
