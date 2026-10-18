export type Turn = {
  at: number
  hit: number | null
  read: number
  written: number
  fresh: number
}

declare module 'claude-code' {
  interface PluginState {
    'cache-pill': {
      step: Turn | null
      now: number
    }
  }
}
