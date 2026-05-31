// Lightweight cross-MFE communication via CustomEvents on window.
// Each MFE ships its own copy — they only agree on the event NAME and payload
// shape, never on a shared import. That is what keeps them decoupled.
export const eventBus = {
  emit: (event: string, detail: unknown) =>
    window.dispatchEvent(new CustomEvent(event, { detail })),
  on: (event: string, handler: (e: CustomEvent) => void) =>
    window.addEventListener(event, handler as EventListener),
  off: (event: string, handler: (e: CustomEvent) => void) =>
    window.removeEventListener(event, handler as EventListener),
}

export interface Article {
  title: string
  source: { name: string }
  publishedAt: string
  urlToImage: string | null
  url: string
}
