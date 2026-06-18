/**
 * HourRangePicker tests — the day-view hour selection.
 * Verifies slot↔time mapping and that click/drag reports the right
 * start/end (end is the exclusive boundary of the last selected slot).
 */

import { render, fireEvent } from '@testing-library/react'
import { HourRangePicker } from '../HourRangePicker'

describe('HourRangePicker', () => {
  it('shows a prompt when nothing is selected', () => {
    const { getByText } = render(<HourRangePicker start={null} end={null} onChange={jest.fn()} />)
    expect(getByText(/Ziehe über die Stunden/)).toBeInTheDocument()
  })

  it('renders the current range summary from props', () => {
    const { getByText } = render(<HourRangePicker start="09:00" end="17:00" onChange={jest.fn()} />)
    expect(getByText(/09:00–17:00/)).toBeInTheDocument()
  })

  it('a single click selects one 30-min slot', () => {
    const onChange = jest.fn()
    const { getByRole } = render(<HourRangePicker start={null} end={null} onChange={onChange} />)
    fireEvent.click(getByRole('button', { name: '09:00' }))
    expect(onChange).toHaveBeenLastCalledWith('09:00', '09:30')
  })

  it('click + drag selects a contiguous range (end is exclusive)', () => {
    const onChange = jest.fn()
    const { getByRole } = render(<HourRangePicker start={null} end={null} onChange={onChange} />)
    fireEvent.mouseDown(getByRole('button', { name: '09:00' }))
    fireEvent.mouseEnter(getByRole('button', { name: '11:00' }))
    fireEvent.mouseUp(window)
    expect(onChange).toHaveBeenLastCalledWith('09:00', '11:30')
  })

  it('dragging backwards still yields an ordered range', () => {
    const onChange = jest.fn()
    const { getByRole } = render(<HourRangePicker start={null} end={null} onChange={onChange} />)
    fireEvent.mouseDown(getByRole('button', { name: '14:00' }))
    fireEvent.mouseEnter(getByRole('button', { name: '12:00' }))
    fireEvent.mouseUp(window)
    expect(onChange).toHaveBeenLastCalledWith('12:00', '14:30')
  })
})
