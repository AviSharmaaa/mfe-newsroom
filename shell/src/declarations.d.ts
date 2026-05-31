// Module Federation remotes are resolved at runtime, so TypeScript needs
// these ambient declarations to type the dynamic imports.
declare module 'mfe_headlines/HeadlinesApp' {
  const HeadlinesApp: React.ComponentType
  export default HeadlinesApp
}
declare module 'mfe_bookmarks/BookmarksApp' {
  const BookmarksApp: React.ComponentType
  export default BookmarksApp
}
declare module 'mfe_weather/WeatherWidget' {
  // Federation may expose the vanilla widget as a named export OR under
  // `default`, so the shell resolves mount() from either shape.
  export function mount(containerId: string): void
  const _default: { mount: (containerId: string) => void }
  export default _default
}
