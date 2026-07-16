/**
 * TimecardMonthGrid selection model tests.
 *
 * Locks the pointer-engine interaction: plain/modifier clicks, press-and-drag
 * PAINT selection (each entered cell is added — dragging down a column paints
 * that weekday's days, not the linear date range), touch tap-to-toggle, touch
 * long-press paint (add AND remove), weekday-header column select, double-click
 * to open the day editor, and Delete-to-clear. The trailing click that ends a
 * drag must NOT collapse the selection back to a single day.
 *
 * Date cells carry `aria-pressed`; weekday-header buttons do not — that's how we
 * tell them apart in the DOM.
 */

import { render, fireEvent, act } from '@testing-library/react'
import { TimecardMonthGrid } from '../TimecardMonthGrid'

// June 2026: 01=Mon, 02=Tue, 03=Wed, 04=Thu, 05=Fri.
const DATES = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05']

function setup(props: Partial<React.ComponentProps<typeof TimecardMonthGrid>> = {}) {
  const onDaySelect = jest.fn()
  const onWeekdaySelect = jest.fn()
  const onClearSelected = jest.fn()
  const onEditDay = jest.fn()
  const { container } = render(
    <TimecardMonthGrid
      visibleDates={DATES}
      entries={[]}
      focusedDate={DATES[0]}
      selectedDates={[]}
      onDaySelect={onDaySelect}
      onWeekdaySelect={onWeekdaySelect}
      onClearSelected={onClearSelected}
      onEditDay={onEditDay}
      {...props}
    />,
  )
  const all = Array.from(container.querySelectorAll('button'))
  const dayCells = all.filter(b => b.hasAttribute('aria-pressed'))
  const headerCells = all.filter(b => !b.hasAttribute('aria-pressed'))
  return { onDaySelect, onWeekdaySelect, onClearSelected, onEditDay, dayCells, headerCells, container }
}

describe('TimecardMonthGrid selection', () => {
  it('renders one day-cell per visible date (plus 7 weekday headers)', () => {
    const { dayCells, headerCells } = setup()
    expect(dayCells).toHaveLength(DATES.length)
    expect(headerCells).toHaveLength(7)
  })

  it('a keyboard/synthetic click (no preceding press) selects a single day', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.click(dayCells[1])
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-02', 'single')
  })

  it('a real mouse press selects the day once; the trailing click is swallowed', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.pointerDown(dayCells[1])
    fireEvent.pointerUp(window)
    fireEvent.click(dayCells[1])
    expect(onDaySelect.mock.calls).toEqual([['2026-06-02', 'single']])
  })

  it('Ctrl/Cmd-click toggles (non-adjacent multi-select)', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.pointerDown(dayCells[1], { ctrlKey: true })
    fireEvent.click(dayCells[1], { ctrlKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-02', 'toggle')
    fireEvent.pointerDown(dayCells[3], { metaKey: true })
    fireEvent.click(dayCells[3], { metaKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-04', 'toggle')
  })

  it('Shift-click selects a range', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.pointerDown(dayCells[3], { shiftKey: true })
    fireEvent.click(dayCells[3], { shiftKey: true })
    expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-04', 'range')
  })

  it('press + drag PAINTS each entered cell (add) and swallows the trailing click', () => {
    const { onDaySelect, dayCells } = setup()
    // Press on day 2, drag across day 3 and day 4.
    fireEvent.pointerDown(dayCells[1])
    fireEvent.pointerEnter(dayCells[2])
    fireEvent.pointerEnter(dayCells[3])
    fireEvent.pointerUp(window)
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
    fireEvent.pointerDown(dayCells[0])
    fireEvent.pointerEnter(dayCells[1])
    fireEvent.pointerUp(window)
    fireEvent.click(dayCells[1]) // swallowed (ends the drag)
    onDaySelect.mockClear()

    fireEvent.pointerDown(dayCells[4]) // a fresh, separate press
    fireEvent.pointerUp(window)
    fireEvent.click(dayCells[4])
    expect(onDaySelect).toHaveBeenCalledTimes(1)
    expect(onDaySelect).toHaveBeenCalledWith('2026-06-05', 'single')
  })

  it('pointerenter without an active drag does nothing', () => {
    const { onDaySelect, dayCells } = setup()
    fireEvent.pointerEnter(dayCells[2])
    expect(onDaySelect).not.toHaveBeenCalled()
  })

  it('double-click opens the day editor', () => {
    const { onEditDay, dayCells } = setup()
    fireEvent.dblClick(dayCells[2])
    expect(onEditDay).toHaveBeenCalledWith('2026-06-03')
  })

  describe('touch', () => {
    it('a tap TOGGLES the day (no drag session)', () => {
      const { onDaySelect, dayCells } = setup()
      fireEvent.pointerDown(dayCells[1], { pointerType: 'touch', clientX: 10, clientY: 10 })
      fireEvent.pointerUp(window)
      fireEvent.click(dayCells[1])
      expect(onDaySelect.mock.calls).toEqual([['2026-06-02', 'toggle']])
    })

    it('long-press starts an ADD paint; moves hit-test the finger position', () => {
      jest.useFakeTimers()
      try {
        const { onDaySelect, dayCells, container } = setup()
        fireEvent.pointerDown(dayCells[1], { pointerType: 'touch', clientX: 10, clientY: 10 })
        act(() => {
          jest.advanceTimersByTime(400) // long-press fires → paint locked
        })
        expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-02', 'add')

        // Touch moves fire on the origin element (implicit capture) and are
        // hit-tested via elementFromPoint on the container.
        document.elementFromPoint = jest.fn(() => dayCells[2])
        fireEvent.pointerMove(container.firstChild as Element, {
          pointerType: 'touch',
          clientX: 60,
          clientY: 10,
        })
        expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-03', 'add')

        fireEvent.pointerUp(window)
        fireEvent.click(dayCells[1]) // trailing click after a paint — swallowed
        expect(onDaySelect).toHaveBeenCalledTimes(2)
      } finally {
        jest.useRealTimers()
      }
    })

    it('a mostly-horizontal swipe starts painting without the long press', () => {
      const { onDaySelect, dayCells, container } = setup()
      fireEvent.pointerDown(dayCells[1], { pointerType: 'touch', clientX: 10, clientY: 10 })
      document.elementFromPoint = jest.fn(() => dayCells[3])
      fireEvent.pointerMove(container.firstChild as Element, {
        pointerType: 'touch',
        clientX: 40, // dx 30 > slop, clearly horizontal
        clientY: 12,
      })
      expect(onDaySelect.mock.calls).toEqual([
        ['2026-06-02', 'add'],
        ['2026-06-04', 'add'],
      ])
    })

    it('a vertical swipe stays a scroll (no selection)', () => {
      const { onDaySelect, dayCells, container } = setup()
      fireEvent.pointerDown(dayCells[1], { pointerType: 'touch', clientX: 10, clientY: 10 })
      fireEvent.pointerMove(container.firstChild as Element, {
        pointerType: 'touch',
        clientX: 11,
        clientY: 60, // clearly vertical
      })
      fireEvent.pointerUp(window)
      expect(onDaySelect).not.toHaveBeenCalled()
    })

    it('long-press on an already selected day paints REMOVE', () => {
      jest.useFakeTimers()
      try {
        const { onDaySelect, dayCells } = setup({ selectedDates: ['2026-06-02', '2026-06-03'] })
        fireEvent.pointerDown(dayCells[1], { pointerType: 'touch', clientX: 10, clientY: 10 })
        act(() => {
          jest.advanceTimersByTime(400)
        })
        expect(onDaySelect).toHaveBeenLastCalledWith('2026-06-02', 'remove')
      } finally {
        jest.useRealTimers()
      }
    })
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
