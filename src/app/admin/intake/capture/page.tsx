// The capture step is a stable sub-route of the one Geräte-Eingang workflow.
// Re-exporting the same page shell avoids a second implementation while giving
// keyboard-first intake a progressive-enhancement-safe URL (no client state or
// query parameter is required to open it).
export { metadata, default } from '../page'
