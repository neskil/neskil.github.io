# neskil.github.io

Niklas Billgren's personal site: static HTML/CSS/JS on GitHub Pages, no build
step, each folder a self-contained page.

## How the owner works — finish on `master`, every time

The owner uses Claude **only from the Claude app on a phone**, in remote
sessions. There is no laptop, no local checkout and no preview: the one way
they can see a change is the live site on GitHub Pages, after it has been
merged to `master`, pushed, and the page has refreshed. So:

- **A change is not done until it is merged to `master` and pushed.** Do it
  without being asked, once the checks below are green and anything visual has
  been looked at headlessly. A pushed feature branch is invisible to them, and
  "ready for you to review" is a dead end — they cannot review it.
- **Your own verification is the only verification before it ships.** They
  cannot test anything before it is live, so run the suites, drive the page in
  headless Chromium, and screenshot what changed. Say plainly what you checked
  and what you could not.
- **Bump the cache-busting version** where the folder has one (golf3d:
  `G3.VERSION` and every `?v=`), or their phone keeps the old JS after the push.
- No pull request unless they ask for one; merge with `--no-ff`, re-run the
  checks on the merged result, then push.
- **It is a one-person project.** Nobody else works on it, so there is no
  reviewer to wait for and no one else's branch to protect. When `master` has
  moved under you, that is the owner's other Claude sessions: merge it in,
  resolve the conflict (usually only version strings — take the higher one and
  bump past it), re-run the checks and push, rather than stopping to ask.

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
node tools/run-tests.mjs      # every headless suite (about a minute)
node tools/check-site.mjs     # robots/sitemap/meta/JSON-LD/link invariants
```

Both are dependency-free — no install step, just Node and a Chrome already on
the machine. CI runs the same two, so a red one is a red build. README →
"Checks" explains what they cover.
