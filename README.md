# claude-plugins

Claude Code plugins by NikGob.

## cache-pill

One line above the prompt in the Claude desktop app's Code tab:

```
⚡ Cache ▰▰▰▰▰▰▱ 98% · 186k cached · 2k new          🔥 warm ▰▰▰▰▱▱ 56:34
```

- **Left:** how much of the last request was read from the prompt cache (cheap) vs. processed anew.
- **Right:** countdown until the cache goes cold. Turns amber under 5 minutes and red when cold: the next message then re-reads the whole conversation at full price.

The cache lifetime is 1 hour on a Claude subscription within plan usage, and 5 minutes with an API key or usage credits. Set it with `/plugin configure cache-pill@nikgob` (`1h` or `5m`).

Reads only token counts the app already has. Makes no network calls and writes no files.

### Install

Type at the prompt of a Claude Code session:

```
/plugin install cache-pill --marketplace NikGob/claude-plugins
```

Answer `y` to add the marketplace, then pick a scope. The line appears in new sessions in the desktop app's Code tab.

Needs a recent Claude Code with mods (v2.1.287 or later); keep the desktop app updated. Only one plugin can draw above the prompt, so turn off other status-band plugins (like Desktop Statusline).
