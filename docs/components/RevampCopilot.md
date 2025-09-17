created_date: 2025-09-16
last_modified_date: 2025-09-16
last_modified_summary: Initial document describing RevampCopilot layering and behavior

## RevampCopilot (Chatbot) — Component Guide

### Overview
`RevampCopilot` is the site assistant shown as a floating button and an expandable chat panel. It must remain accessible above non-critical overlays while yielding to critical UI like the mobile navigation.

### Stacking Context and z-index
- Floating button: `z-[95]`
- Chat panel: `z-[96]`
- Welcome modal overlay/content: `z-[80]/z-[81]`
- Mobile menu overlay/panel: `z-[100]/z-[101]`

Result: Chat stays above general overlays (e.g., feature panels, welcome overlay) but below the mobile menu.

### Files
- `src/features/chatbot/components/FloatingButton.tsx`
- `src/features/chatbot/components/RevampCopilot.tsx`
- `src/features/chatbot/components/ChatWindow.tsx`

### Behavior
- The chat input focuses automatically when the panel opens or after sending a message.
- Enter submits; Shift+Enter allows multiline in future variants.

### Accessibility
- Buttons have clear `aria-label`s.
- Panel does not trap focus; ESC behavior handled by browser/OS; consider adding a close shortcut in future.

### Troubleshooting
- Chat hidden behind overlay: verify z-index values and ensure no inline styles override class-based z-indices.
- Input not typing: ensure the panel is not minimized and `onKeyDown` is bound; check for page-level focus traps.

### Change Log
- 2025-09-16: Adjusted z-index for chat (95/96) and WelcomeModal (80/81) to resolve overlay conflicts.


