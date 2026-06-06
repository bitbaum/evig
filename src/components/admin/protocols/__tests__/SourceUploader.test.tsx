/**
 * SourceUploader tests.
 *
 * Covers: click-to-browse, drop, classification, validation gating,
 * audio-replaces-on-second-pick, text-files-accumulate-without-dupes,
 * remove chip emits correct next value, disabled state.
 */

import { render, fireEvent } from '@testing-library/react'
import { SourceUploader, type SourceValue } from '../SourceUploader'

const makeFile = (name: string, size: number, type = '') => {
  const file = new File([new Uint8Array(size)], name, { type })
  // jsdom creates File with the right size, but be explicit so tests
  // are robust against future jsdom changes.
  Object.defineProperty(file, 'size', { value: size })
  return file
}

const empty: SourceValue = { audio: null, textFiles: [] }

describe('SourceUploader', () => {
  it('renders the drop zone with format hints', () => {
    const { getByText, getByLabelText } = render(
      <SourceUploader value={empty} onChange={() => {}} />,
    )
    expect(getByText(/Dateien hier ablegen oder klicken/)).toBeInTheDocument()
    expect(getByLabelText(/Dateien hier ablegen/)).toBeInTheDocument()
  })

  it('accepts an audio file via drop, emits onChange with audio set', () => {
    const onChange = jest.fn()
    const { getByLabelText } = render(<SourceUploader value={empty} onChange={onChange} />)
    const dropZone = getByLabelText(/Dateien hier ablegen/)
    const audio = makeFile('meeting.mp3', 1024, 'audio/mpeg')

    fireEvent.drop(dropZone, { dataTransfer: { files: [audio] } })

    expect(onChange).toHaveBeenCalledWith({ audio, textFiles: [] })
  })

  it('accepts a text file via drop, emits onChange with text in array', () => {
    const onChange = jest.fn()
    const { getByLabelText } = render(<SourceUploader value={empty} onChange={onChange} />)
    const text = makeFile('notes.txt', 512, 'text/plain')

    fireEvent.drop(getByLabelText(/Dateien hier ablegen/), { dataTransfer: { files: [text] } })

    expect(onChange).toHaveBeenCalledWith({ audio: null, textFiles: [text] })
  })

  it('drops audio + text in one go — both end up in next value', () => {
    const onChange = jest.fn()
    const { getByLabelText } = render(<SourceUploader value={empty} onChange={onChange} />)
    const audio = makeFile('rec.m4a', 2048, 'audio/mp4')
    const text = makeFile('agenda.md', 256, 'text/markdown')

    fireEvent.drop(getByLabelText(/Dateien hier ablegen/), {
      dataTransfer: { files: [audio, text] },
    })

    expect(onChange).toHaveBeenCalledWith({ audio, textFiles: [text] })
  })

  it('rejects unsupported file type and calls onError', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { getByLabelText } = render(
      <SourceUploader value={empty} onChange={onChange} onError={onError} />,
    )
    const bad = makeFile('photo.png', 1024, 'image/png')

    fireEvent.drop(getByLabelText(/Dateien hier ablegen/), {
      dataTransfer: { files: [bad] },
    })

    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/nicht unterstützt/))
    // Drop should still call onChange with the empty merge (no valid files)
    expect(onChange).toHaveBeenCalledWith({ audio: null, textFiles: [] })
  })

  it('rejects oversized text file via validator', () => {
    const onChange = jest.fn()
    const onError = jest.fn()
    const { getByLabelText } = render(
      <SourceUploader value={empty} onChange={onChange} onError={onError} />,
    )
    // 5 MB cap + 1 byte
    const huge = makeFile('huge.txt', 5 * 1024 * 1024 + 1, 'text/plain')

    fireEvent.drop(getByLabelText(/Dateien hier ablegen/), {
      dataTransfer: { files: [huge] },
    })

    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/zu gross/))
  })

  it('new audio replaces previous audio (single-audio invariant)', () => {
    const onChange = jest.fn()
    const first = makeFile('first.mp3', 1024, 'audio/mpeg')
    const second = makeFile('second.mp3', 2048, 'audio/mpeg')
    const { getByLabelText } = render(
      <SourceUploader value={{ audio: first, textFiles: [] }} onChange={onChange} />,
    )

    fireEvent.drop(getByLabelText(/Dateien hier ablegen/), {
      dataTransfer: { files: [second] },
    })

    expect(onChange).toHaveBeenCalledWith({ audio: second, textFiles: [] })
  })

  it('text files accumulate', () => {
    const onChange = jest.fn()
    const existing = makeFile('a.txt', 100, 'text/plain')
    const fresh = makeFile('b.txt', 200, 'text/plain')
    const { getByLabelText } = render(
      <SourceUploader value={{ audio: null, textFiles: [existing] }} onChange={onChange} />,
    )

    fireEvent.drop(getByLabelText(/Dateien hier ablegen/), {
      dataTransfer: { files: [fresh] },
    })

    expect(onChange).toHaveBeenCalledWith({ audio: null, textFiles: [existing, fresh] })
  })

  it('does NOT add a duplicate text file (same name + size)', () => {
    const onChange = jest.fn()
    const existing = makeFile('a.txt', 100, 'text/plain')
    const dupe = makeFile('a.txt', 100, 'text/plain')
    const { getByLabelText } = render(
      <SourceUploader value={{ audio: null, textFiles: [existing] }} onChange={onChange} />,
    )

    fireEvent.drop(getByLabelText(/Dateien hier ablegen/), {
      dataTransfer: { files: [dupe] },
    })

    expect(onChange).toHaveBeenCalledWith({ audio: null, textFiles: [existing] })
  })

  it('renders audio chip and emits empty audio when removed', () => {
    const onChange = jest.fn()
    const audio = makeFile('rec.wav', 1024, 'audio/wav')
    const { getByLabelText } = render(
      <SourceUploader value={{ audio, textFiles: [] }} onChange={onChange} />,
    )

    fireEvent.click(getByLabelText('rec.wav entfernen'))
    expect(onChange).toHaveBeenCalledWith({ audio: null, textFiles: [] })
  })

  it('renders text chip and emits filtered list when removed', () => {
    const onChange = jest.fn()
    const a = makeFile('a.txt', 100, 'text/plain')
    const b = makeFile('b.txt', 200, 'text/plain')
    const { getByLabelText } = render(
      <SourceUploader value={{ audio: null, textFiles: [a, b] }} onChange={onChange} />,
    )

    fireEvent.click(getByLabelText('a.txt entfernen'))
    expect(onChange).toHaveBeenCalledWith({ audio: null, textFiles: [b] })
  })

  it('does not respond to drops when disabled', () => {
    const onChange = jest.fn()
    const { getByLabelText } = render(
      <SourceUploader value={empty} onChange={onChange} disabled />,
    )
    const file = makeFile('rec.mp3', 1024, 'audio/mpeg')

    fireEvent.drop(getByLabelText(/Dateien hier ablegen/), {
      dataTransfer: { files: [file] },
    })

    expect(onChange).not.toHaveBeenCalled()
  })
})
