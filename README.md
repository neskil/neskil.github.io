# neskil.github.io

Niklas Billgren's personal site, hosted on GitHub Pages. Static HTML/CSS/JS, no build step — each folder is a self-contained page served directly from the repo.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Landing page / portfolio hub linking out to the sections below. Markup only — see [Landing page](#landing-page) for its CSS and JS. |
| `css/`, `js/` | Stylesheets and scripts for the landing page, and nothing else. |
| `tests.html` | Logic tests for the landing page's `js/` modules. Open it in a browser; it self-reports. |
| `cv/` | Curriculum vitae site. |
| `cargo-lander/` | CargoLander — a browser-based 2D lander/logistics game with a custom physics engine. See [cargo-lander/README.md](cargo-lander/README.md) for internals. |
| `games/` | Interactive game library — a browsable/filterable catalog of games (`data.js` holds the entries). |
| `math/` | EU/US unit cheat sheet. |
| `converter/` | Quick mental unit converter. |
| `car/` | Lease vs. finance vs. cash vs. monthly rental — US car cost-of-ownership calculator. Linked from the card grid on the landing page. |
| `supply-chain/` | Supply Chain Tycoon — a Mini-Metro-style logistics mini-game (roads, trucks, factories, orders). See [supply-chain/README.md](supply-chain/README.md). |
| `surprise/` | Misc. personal page ("Bacons lilla hörna"). |
| `404.html` | Custom not-found page (GitHub Pages serves it automatically). |
| `robots.txt` / `sitemap.xml` | Crawler hints. `surprise/` is excluded, being vendored third-party demo code. |
| `assets/` | `og/` link-preview images (one per page) and `portrait.webp` for the About card. |
| `favicon.ico` | Site-wide favicon. |

## Landing page

`index.html` is markup only. Its styling and behaviour live in `css/` and
`js/`, split by concern:

| File | Owns |
| --- | --- |
| `css/base.css` | Design tokens, reset, the animated page background, header and footer. |
| `css/cards.css` | The grid and the standard card: tilt/glare variables, per-card accents, material and shine effects, badges. |
| `css/flip.css` | Cards that open in place instead of navigating (About, Under construction). |
| `css/vault.css` | The easter eggs — Vault panel, sparks, toast, gravity glitch. |
| `js/background.js` | The canvas constellation, the shared pointer state, and the themed drifters. |
| `js/stats.js` | Reads each game's localStorage save and renders the high-score chip on its card. |
| `js/tilt.js` | The 3D tilt and glare on every card: hover, accelerometer, scroll bend, cursor proximity. |
| `js/flip.js` | Opening and closing a flip card, including the grow-to-centre animation. |
| `js/vault.js` | Five clicks on the name, and everything behind that door. |
| `js/main.js` | Calls each module's `init()`. The only file that wires anything up. |

Same conventions as `supply-chain/`: plain scripts, no bundler, no modules.
Each file attaches to a global `HOME` namespace and does nothing until
`main.js` calls its `init()`, which is what lets `tests.html` load the same
files and exercise their logic without a page around them.

Adding a card means: markup in `index.html`, an accent block in
`css/cards.css`, and — if it wants the page tint, a bigger sway or a themed
drifter — an entry in the tables at the top of `js/background.js` and
`js/tilt.js`. `tests.html` cross-checks those tables against the real card
ids when served over HTTP, so a renamed card shows up as a failure rather
than as an effect that quietly stops working.

### Tests

Open `tests.html` in a browser and read the summary line at the top. Most of
it runs off `file://`; the card-id cross-checks need the repo served over
HTTP and say so when skipped. Headless:

```
chromium --headless=new --virtual-time-budget=8000 --dump-dom \
         http://localhost:8000/tests.html | grep -o 'id="summary".\{0,80\}'
```

The tests cover the pure logic only — save-file parsing, panel geometry, tilt
math, drifter lifecycles. Anything that needs a real layout or a real frame
clock is left to the eye.

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

## Development

No build tooling — open any `index.html` directly, or serve the repo root with a static file server (recommended so relative `<script>`/`<link>` paths resolve correctly), e.g.:

```
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

Each subfolder is independent; check its own `index.html` (and any local README) before making changes.
