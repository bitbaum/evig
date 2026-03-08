/**
 * Whisper model configuration — SSOT for both UI and API.
 */

export interface WhisperModelOption {
  id: string
  label: string
  size: string
  hint: string
}

export const WHISPER_MODELS: WhisperModelOption[] = [
  { id: 'tiny', label: 'Tiny', size: '~75 MB', hint: 'Schnellstes Modell, geringste Genauigkeit' },
  { id: 'base', label: 'Base', size: '~140 MB', hint: 'Guter Kompromiss aus Geschwindigkeit und Genauigkeit' },
  { id: 'small', label: 'Small', size: '~460 MB', hint: 'Bessere Genauigkeit, langsamer' },
  { id: 'medium', label: 'Medium', size: '~1.5 GB', hint: 'Hohe Genauigkeit, deutlich langsamer' },
  { id: 'large-v3', label: 'Large v3', size: '~3 GB', hint: 'Höchste Genauigkeit, sehr langsam auf CPU' },
]

export const DEFAULT_WHISPER_MODEL = 'base'
