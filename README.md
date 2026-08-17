# neskil.github.io

Niklas Billgren's personal site, hosted on GitHub Pages. Static HTML/CSS/JS, no build step — each folder is a self-contained page served directly from the repo.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Landing page / portfolio hub linking out to the sections below. |
| `cv/` | Curriculum vitae site. |
| `cargo-lander/` | CargoLander — a browser-based 2D lander/logistics game with a custom physics engine. See [cargo-lander/README.md](cargo-lander/README.md) for internals. |
| `games/` | Interactive game library — a browsable/filterable catalog of games (`data.js` holds the entries). |
| `math/` | EU/US unit cheat sheet. |
| `converter/` | Quick mental unit converter. |
| `car/` | Lease vs. finance vs. cash vs. monthly rental — US car cost-of-ownership calculator. Linked from the card grid on the landing page. |
| `supply-chain/` | Supply Chain Tycoon — a Mini-Metro-style logistics mini-game (roads, trucks, factories, orders). See [supply-chain/README.md](supply-chain/README.md). |
| `supply-chain-legacy/` | Frozen single-file snapshot of the pre-rewrite Supply Chain sim. Reachable only from the "vault" row on the landing page; kept out of the sitemap on purpose. |
| `3d-engine-poc/` | Yard Master — a WebGL container-stacking puzzle (three.js, vendored, no build step). See [3d-engine-poc/README.md](3d-engine-poc/README.md). |
| `golf/` | Pocket Links — an eighteen-hole 2D mini golf game (canvas, own physics). See [golf/README.md](golf/README.md). |
| `surprise/` | Misc. personal page ("Bacons lilla hörna") — an HTML5 UP "Dimension" one-pager with two Phaser toys, plus `cv_legacy/`. Pruned to what it actually serves; see "Pruning surprise/" below before adding to it. |
| `404.html` | Custom not-found page (GitHub Pages serves it automatically). |
| `robots.txt` / `sitemap.xml` | Crawler hints. `surprise/` is excluded, being vendored third-party demo code, as are the test harnesses — see "What crawlers see" below. |
| `assets/` | `og/` link-preview images (one per page) and `portrait.webp` for the About card. |
| `favicon.ico` | Site-wide favicon. |

## What crawlers see

Every page that is meant to be found carries a `<link rel="canonical">`, a
`<meta name="description">`, and the Open Graph / Twitter tags described below,
and appears in `sitemap.xml`.

Everything else must opt out, and does so twice: a `Disallow` line in
`robots.txt` so the page is never fetched, and `<meta name="robots"
content="noindex">` in the page itself so it stays out of the index even if
something reaches it by a route `robots.txt` doesn't cover. Belt and braces,
because the two mechanisms fail differently — `robots.txt` cannot suppress a
URL that other sites link to, and a `noindex` tag is never read if the fetch
is blocked. That set is the headless test harnesses (`*/tests.html`,
`3d-engine-poc/physics-tests.html`) and the screenshot/audio probes
(`cargo-lander/syntax-check.html`, `cargo-lander/probe-screenshot.html`,
`supply-chain/audio-check.html`, `supply-chain/research-zoom-check.html`).

`cargo-lander/level-editor.html` is *not* in that set — it is a real feature
linked from the game, and stays indexable.

Add a new test or probe page and it needs both lines, or it will quietly show
up in search results next to the pages you meant to publish.

## Link previews

Every page carries Open Graph / Twitter Card tags so a pasted link renders as a
card in LinkedIn, Slack, iMessage, Discord, etc. instead of a bare URL. The
`og:image` for each page is a real 1200×630 screenshot of that page, checked in
under `assets/og/`.

To regenerate one after a visual change, screenshot the page with headless
Chrome and crop off the window chrome:

```
chromium --headless=new --hide-scrollbars --window-size=1200,720 \
         --virtual-time-budget=8000 --screenshot=out.png <page-url>
```

The `--window-size` height needs ~90px of slack (the captured image is the full
window, so 720 in gives 630 of painted page once the bottom band is cropped).
Pages whose content animates in, like the homepage card grid, need the
entry animation pinned to its end state first, or the capture can catch it at
`opacity: 0`; load the page in an iframe from a throwaway wrapper file and
inject `animation: none !important` before shooting. `cargo-lander/` has the
same problem with its first-run modals, which `probe-screenshot.html` already
shows how to suppress via `localStorage`.

Absolute URLs are required in the tags; scrapers don't resolve relative paths.
Test changes with LinkedIn's Post Inspector or Facebook's Sharing Debugger; both
cache aggressively, so re-scrape after an update.

## Pruning `surprise/`

`surprise/` arrived as a full checkout of the Phaser 3 examples repo dropped on
top of an HTML5 UP template: 4,995 files and 556 MB, of which the site served
about a hundred. It is now down to what the three pages actually load.

What stayed, and why:

- The Dimension one-pager and its `assets/{css,js,fonts}`, `images/`.
- `cv_legacy/` **in full**, including files no page references. It is a
  personal CV, it is 2.4 MB, and `cv/index.html` reaches into it for the
  profile photo — not the place to save bytes.
- `img/` **in full**, same reasoning: personal photos, 680 KB.
- `phaser/dist/phaser.js` (loaded by `game2.html`), the two particle atlases
  under `phaser/src/particles/`, and `src/games/firstgame/assets/`, which
  `game.html` loads at runtime.

What went: the examples corpus (`assets/` demo media, `build/` — 223 MB of
numbered Phaser dev builds), `src/` bar the one game, the vendored Monaco
editor under `js/vs/`, and `plugins/`.

Two traps if you prune again. Phaser loads assets from **string literals**, so
`href`/`src` crawling alone will delete files the games need — check
`load.image(...)`/`load.atlas(...)` calls too. And `index.html` and `game.html`
pull Phaser from a CDN, so in a sandbox with no egress they fail with "Phaser
is not defined" and never request their assets; route the CDN to
`phaser/dist/phaser.js` before trusting a runtime capture.

Pre-existing breakage, left alone: `game.html` loads `img/bg.jpg`, which has
never existed in this repo, and both game pages link root-absolute favicons
(`/favicon-16x16.png`) that resolve to the site root rather than `surprise/`.

Note this reclaims working-copy and Pages-deploy size, not `.git` — the blobs
stay in history, so a fresh clone is unchanged until someone rewrites it.

## Development

No build tooling — open any `index.html` directly, or serve the repo root with a static file server (recommended so relative `<script>`/`<link>` paths resolve correctly), e.g.:

```
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

Each subfolder is independent; check its own `index.html` (and any local README) before making changes.
