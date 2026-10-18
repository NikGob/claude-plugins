import { atom, read, update } from 'claude-code'
import type { ModelUsage, Register } from 'claude-code'

const turn = atom({ plugin: 'cache-pill', key: 'step' } as const, null)
const now = atom({ plugin: 'cache-pill', key: 'now' } as const, 0)

const TICK_MS = 1000
const PANE = 'cache-pill'
const BAR_PX = 70
const SOON_MS = 5 * 60_000

const tokens = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`

// mm:ss under an hour, h:mm:ss above.
const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return s >= 3600 ? `${Math.floor(s / 3600)}:${mm}:${ss}` : `${mm}:${ss}`
}

// Drawn as an image, so it cannot follow the theme: a translucent track reads on light and dark.
const bar = (percent: number, color: string) => {
  const filled = Math.round((Math.max(0, Math.min(percent, 100)) / 100) * BAR_PX)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BAR_PX}" height="6" viewBox="0 0 ${BAR_PX} 6">` +
    `<rect width="${BAR_PX}" height="6" rx="3" fill="#808080" fill-opacity="0.25"/>` +
    `<rect width="${filled}" height="6" rx="3" fill="${color}"/></svg>`
  )
}

const hitColor = (hit: number) => (hit >= 80 ? '#30a46c' : hit >= 50 ? '#e0a030' : '#e5484d')

export const register: Register = (on, options) => {
  const ttlMs = options.cache_ttl === '5m' ? 5 * 60_000 : 60 * 60_000

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    void $.ui.close({ id: PANE })
    const t0 = await $.clock.now()
    await update($, now, () => t0)
    $.clock.every(TICK_MS, async () => {
      const t = await $.clock.now()
      await update($, now, () => t)
    })
    return started
  })

  // Each API request inside a turn: its cache read is what the cache held for that request
  // (a turn's own usage sums every request, so it would count the context several times).
  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    if (!e.agentId && r.usage) {
      const at = await $.clock.now()
      const u: ModelUsage = r.usage
      const total = u.input_tokens + u.cache_creation_input_tokens + u.cache_read_input_tokens
      await update($, turn, () => ({
        at,
        hit: total === 0 ? null : Math.round((u.cache_read_input_tokens / total) * 100),
        read: u.cache_read_input_tokens,
        written: u.cache_creation_input_tokens,
        fresh: u.input_tokens,
      }))
      await update($, now, () => at)
    }
    return r
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.hasSurvey) return next(e)
    const { Box, Svg, Text } = $.ui.resolve(e)

    const t = await read($, turn)
    if (t === null) {
      return (
        <Box flexDirection="row" justifyContent="space-between" width="100%">
          <Text dimColor>{'⚡ Cache'}</Text>
          <Text dimColor>{'waiting for the first reply…'}</Text>
        </Box>
      )
    }

    const left = ttlMs - Math.max(0, (await read($, now)) - t.at)
    const cold = left <= 0
    const soon = !cold && left < SOON_MS
    const hit = t.hit ?? 0
    const ttlPct = (left / ttlMs) * 100
    const ttlColor = cold ? '#e5484d' : soon ? '#e0a030' : '#2f7de1'

    const right = e.props.isWorking ? (
      <Text dimColor>{'● working…'}</Text>
    ) : cold ? (
      <Text color="error">{'❄ cold · next message rewrites the cache'}</Text>
    ) : (
      <Box flexDirection="row" alignItems="center" columnGap={1}>
        <Text color={soon ? 'warning' : undefined} dimColor={!soon}>{soon ? '⏳ cooling' : '🔥 warm'}</Text>
        <Svg source={bar(ttlPct, ttlColor)} alt={`cache warm for ${clock(left)}`} width={BAR_PX} height={6} />
        <Text tabular color={soon ? 'warning' : undefined}>{clock(left)}</Text>
      </Box>
    )

    return (
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
        <Box flexDirection="row" alignItems="center" columnGap={1}>
          <Text>{'⚡ Cache'}</Text>
          <Svg source={bar(hit, hitColor(hit))} alt={`cache hit ${hit}%`} width={BAR_PX} height={6} />
          <Text tabular color={hit < 50 ? 'warning' : undefined}>{t.hit === null ? '—' : `${hit}%`}</Text>
          <Text tabular dimColor>{`· ${tokens(t.read ?? 0)} cached · ${tokens((t.written ?? 0) + (t.fresh ?? 0))} new`}</Text>
        </Box>
        <Box flexShrink={0} marginLeft={2}>
          {right}
        </Box>
      </Box>
    )
  })
}
