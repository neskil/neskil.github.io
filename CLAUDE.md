# neskil.github.io

Niklas Billgren's personal site: static HTML/CSS/JS on GitHub Pages, no build
step, each folder a self-contained page.

## Read these first

The standing instructions for this repo live in
**[.agents/AGENTS.md](.agents/AGENTS.md)** — stack, styling, release flow, git
conventions, and the rules that apply to every page. Read it before changing
anything.

This file exists so that happens automatically: Claude Code loads a root
`CLAUDE.md` on its own, but `.agents/AGENTS.md` is not a path it looks in, so
the rules were only found by someone going to look for them.

Beyond that, the doc map in AGENTS.md says who owns what. In short:

| Doc | Owns |
| --- | --- |
| [.agents/AGENTS.md](.agents/AGENTS.md) | Workspace-wide rules — read first. |
| [README.md](README.md) | Layout table, crawler rules, OG/card screenshot recipes, the `tools/` checks. |
| `*/CLAUDE.md`, `*/README.md` | Per-project internals and verification recipes. Read the one for the folder you are in. |

Put a fact in exactly one place and point at it rather than restating it — that
rule governs these docs too.

## Before you push

```
node tools/run-tests.mjs      # every headless suite (~20s, 8 suites)
node tools/check-site.mjs     # robots/sitemap/meta/JSON-LD/link invariants
```

Both are dependency-free — no install step, just Node and a Chrome already on
the machine. CI runs the same two, so a red one is a red build. README →
"Checks" explains what they cover.
