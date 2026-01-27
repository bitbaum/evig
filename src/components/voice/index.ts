/**
 * Voice recording components
 *
 * Refactored from the original 563-line VoiceRecorder.tsx
 * Following DRY and separation of concerns principles.
 */

export * from './types'
export { VoiceProductInput } from './VoiceProductInput'
export { VoiceRecorder } from './VoiceRecorder'
export { VoiceWaveform } from './VoiceWaveform'
export { VoiceTimer, formatTime } from './VoiceTimer'
export { VoiceControls } from './VoiceControls'
export { VoiceStatusMessage } from './VoiceStatusMessage'
export type { VoiceProductData } from './VoiceProductInput'
