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

In a terminal (PowerShell, cmd or bash) with the `claude` CLI:

```
claude plugin marketplace add NikGob/claude-plugins
claude plugin install cache-pill@nikgob --config cache_ttl=1h
```

Or at the prompt of a Claude Code terminal session:

```
/plugin install cache-pill --marketplace NikGob/claude-plugins
```

Then open a new session in the desktop app's Code tab. The plugin does not show in claude.ai's plugin directory: it installs from this GitHub repository.

Needs a recent Claude Code with mods (v2.1.287 or later); keep the desktop app updated. Only one plugin can draw above the prompt, so turn off other status-band plugins (like Desktop Statusline).
