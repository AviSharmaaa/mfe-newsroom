// Lightweight cross-MFE communication via CustomEvents on window.
// This is the canonical copy referenced in the README. Every MFE replicates
// this exact pattern (even mfe-weather, in plain JS) — they share the event
// CONTRACT, never a code import. That decoupling is the whole point.
export const eventBus = {
  emit: (event: string, detail: unknown) =>
    window.dispatchEvent(new CustomEvent(event, { detail })),
  on: (event: string, handler: (e: CustomEvent) => void) =>
    window.addEventListener(event, handler as EventListener),
  off: (event: string, handler: (e: CustomEvent) => void) =>
    window.removeEventListener(event, handler as EventListener),
}
