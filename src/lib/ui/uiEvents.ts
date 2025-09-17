// Lightweight UI event bus to coordinate overlays/widgets
// Events: 'openChat', 'closeChat', 'openSuggestion', 'closeSuggestion'

export type UIEventName = 'openChat' | 'closeChat' | 'openSuggestion' | 'closeSuggestion'

class UIEventBus {
  private target: EventTarget

  constructor() {
    this.target = new EventTarget()
  }

  on(eventName: UIEventName, handler: () => void) {
    const listener = () => handler()
    this.target.addEventListener(eventName, listener)
    return () => this.target.removeEventListener(eventName, listener)
  }

  emit(eventName: UIEventName): void {
    this.target.dispatchEvent(new CustomEvent(eventName))
  }
}

export const uiEvents = new UIEventBus()


