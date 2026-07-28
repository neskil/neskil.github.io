# neskil.github.io

Niklas Billgren's personal site, hosted on GitHub Pages. Static HTML/CSS/JS, no build step — each folder is a self-contained page served directly from the repo.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Landing page / portfolio hub linking out to the sections below. |
| `cv/` | Curriculum vitae site. |
| `cargo-lander/` | CargoLander — a browser-based 2D lander/logistics game with a custom physics engine. See [cargo-lander/README.md](cargo-lander/README.md) for internals. |
| `games/` | Interactive game library — a browsable/filterable catalog of games (`data.js` holds the entries). |
| `math/` | US → Metric mental math trainer. |
| `converter/` | Quick mental unit converter. |
| `car/` | Lease vs. finance vs. cash vs. monthly rental — US car cost-of-ownership calculator. Reached from the vault, not the card grid. |
| `supply-chain/` | Supply Chain Tycoon — a Mini-Metro-style logistics mini-game (roads, trucks, factories, orders). See [supply-chain/README.md](supply-chain/README.md). |
| `surprise/` | Misc. personal page ("Bacons lilla hörna"). |
| `404.html` | Custom not-found page (GitHub Pages serves it automatically). |
| `robots.txt` / `sitemap.xml` | Crawler hints. `surprise/` is excluded — it's vendored third-party demo code. |
| `assets/og/` | Link-preview images, one per page. See below. |
| `favicon.ico` | Site-wide favicon. |

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
Pages whose content animates in — the homepage card grid, for one — need the
entry animation pinned to its end state first, or the capture can catch it at
`opacity: 0`; load the page in an iframe from a throwaway wrapper file and
inject `animation: none !important` before shooting. `cargo-lander/` has the
same problem with its first-run modals, which `probe-screenshot.html` already
shows how to suppress via `localStorage`.

Absolute URLs are required in the tags — scrapers don't resolve relative paths.
Test changes with LinkedIn's Post Inspector or Facebook's Sharing Debugger; both
cache aggressively, so re-scrape after an update.

## Development

No build tooling — open any `index.html` directly, or serve the repo root with a static file server (recommended so relative `<script>`/`<link>` paths resolve correctly), e.g.:

```
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

Each subfolder is independent; check its own `index.html` (and any local README) before making changes.
