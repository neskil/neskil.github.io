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
| `golf/` | Pocket Links — an eighteen-hole 2D mini golf game (canvas, own physics), plus `level-editor.html`, a visual hole editor that runs on the game's own modules. See [golf/README.md](golf/README.md). Shares one landing-page card with `golf3d/`; the card's flip side picks between them. |
| `golf3d/` | Loft Links — 3D mini golf, three six-hole courses (three.js, vendored; own physics), plus `level-editor.html`, a plan-and-preview hole editor that runs on the game's own modules. See [golf3d/README.md](golf3d/README.md). |
| `viz-poc/` | Data Room — eight interactive 3D visualizations behind one scene switcher: a trade-flow globe, this repo drawn as a city, a particle morph field, a raymarched nebula, boid flocking, a Mandelbulb, four strange attractors and a wave field. Every scene has live controls; the whole interface folds away. See [viz-poc/CLAUDE.md](viz-poc/CLAUDE.md). |
| `surprise/` | Misc. personal page ("Bacons lilla hörna") — an HTML5 UP "Dimension" one-pager with two Phaser toys, plus `cv_legacy/`. Pruned to what it actually serves; see "Pruning surprise/" below before adding to it. |
| `404.html` | Custom not-found page (GitHub Pages serves it automatically). |
| `robots.txt` / `sitemap.xml` | Crawler hints. `surprise/` is excluded, being vendored third-party demo code, as are the test harnesses — see "What crawlers see" below. |
| `assets/` | `og/` link-preview images (one per page), `preview/` card-back screenshots for the landing page, and `portrait.webp` for the About card. |
| `favicon.ico` | Site-wide favicon. |
| `tools/` | Dependency-free Node scripts: the test runner, the site checker, and a static server. See "Checks" below. |
| `.github/workflows/ci.yml` | Runs both checks on every push and pull request. |

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
`3d-engine-poc/physics-tests.html`, `golf3d/shader-tests.html`) and the
screenshot/audio probes (`cargo-lander/syntax-check.html`,
`cargo-lander/probe-screenshot.html`, `supply-chain/audio-check.html`,
`supply-chain/research-zoom-check.html`).

`404.html` is the one deliberate exception: it carries `noindex` but no
`Disallow`, because GitHub Pages serves it for every missing URL and a crawler
sent there has to be able to fetch it.

`cargo-lander/level-editor.html`, `golf/level-editor.html` and
`golf3d/level-editor.html` are *not* in that set — all three are real features
linked from their games, and stay indexable.

Add a new test or probe page and it needs both lines, or it will quietly show
up in search results next to the pages you meant to publish. `node
tools/check-site.mjs` fails if you forget one — that is what it is for, and it
is the reason `golf3d/shader-tests.html` stopped being missing from
`robots.txt` (`Disallow: /*/tests.html` does not match `shader-tests.html`;
the wildcard needs a `/` immediately before `tests.html`).

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

## Card previews

Every card on the landing page is a flip card: the front is a spine you read
while scrolling, and turning it over shows a screenshot of the thing running
plus the button that starts it. Those screenshots live in `assets/preview/` as
800x420 WebP, one per card, and are held in `data-src` until the card is
flipped (or, on a machine with a pointer, until the cursor reaches the card).
Nothing in that folder is fetched on load; together they are under 200 KB.

Two things make them worth the trouble, and both are easy to lose when
regenerating one:

- **Shoot the thing running, not its menu.** A screenshot of a title screen
  tells you nothing you did not already read on the front of the card. Drive
  the app in first — dismiss the tutorial, pick the mission, start the round,
  answer a question — then shoot. `golf` and `golf3d` were already gameplay in
  `assets/og/`, and `car` is a designed hero rather than a screenshot, so those
  three are reused as-is.
- **Shoot at a width the content fills.** Several pages put their content in a
  narrow max-width column; at 1200px wide they come out as a stripe of UI in a
  field of background. 720-1000px wide is usually the frame the column fills.
- **Frame on the subject, don't hide the chrome.** Yard Master's control bar is
  half the screen in sandbox mode; the preview clips to the yard above it
  (`page.screenshot({ clip })` against the toolbar's measured top) rather than
  hiding the element, so what ships is still an unedited screenshot. Same idea
  for the CV, which is clipped around the portrait rather than the page top.

Cargo Lander is the counter-example to shooting fresh at all: it opens its own
"How to Play" modal on a clean profile, so it needs the tutorial dismissed
before the capture, exactly the trap described under "Link previews" above.

A card can carry more than one shot: put several `<img>` in the `.peek-shot`
and the script stacks them, cross-fades between them every 2.6s and adds dots.
Cargo Lander uses this for three — a mission in flight, a procedural run in
another biome, and the level editor with a level loaded. The markup stays a
plain list, so with the script off the card shows the first shot rather than
three piled up.

There is no image tooling in this repo — no PIL, no ImageMagick, no cwebp. The
downscale and the WebP encode are done by loading the PNG into a canvas in
headless Chromium and calling `toDataURL('image/webp', 0.82)`, cover-cropped to
800x420.

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

## Checks

Two commands, both dependency-free — no `package.json`, no lockfile, nothing to
install. The site has no build step and neither does the tooling for it; all
they need is Node 18+ and a Chrome or Chromium on the machine.

```
node tools/run-tests.mjs      # every headless suite in the repo
node tools/check-site.mjs     # robots/sitemap/meta/link invariants
```

`.github/workflows/ci.yml` runs both on every push and pull request.

**`run-tests.mjs`** serves the repo over HTTP (the harnesses fetch their
modules, so `file://` gives CORS errors) and loads each suite in headless
Chrome — the same `--virtual-time-budget` trick as the screenshot recipe above,
so eighteen seconds of page timers return in about one. It reads the verdict
out of each harness's `<div id="summary">` and exits non-zero if any suite is
red. Currently eight suites, 4,199 assertions, about 20 seconds.

Two things about it are deliberate:

- **Suites are discovered, not listed.** Any `*tests.html` with a
  `#summary` is one. Give a project a harness and it is picked up with no edit
  to the runner — the same reason `supply-chain/tests.html` derives its module
  list instead of repeating it.
- **An unreadable summary is a failure, not a pass.** The eight harnesses
  predate any shared contract and each phrase their result differently, so the
  parser understands all of them; when it cannot, it says so and goes red. "The
  page didn't say" and "the page said everything is fine" must not collapse
  into the same green tick.

Pass a substring to narrow it: `node tools/run-tests.mjs golf3d`.

**`check-site.mjs`** enforces what "What crawlers see" and "Link previews"
describe, so those sections stop being things a reader is trusted to remember.
It sorts every page into one of three classes and checks each accordingly:

| Class | How it is decided | What is required |
| --- | --- | --- |
| promoted | listed in `sitemap.xml` | canonical, description, the full OG set, `twitter:card`, the analytics tag, an `og:image` that exists on disk |
| excluded | carries `noindex` | a matching `robots.txt` `Disallow`, and absence from the sitemap |
| unlisted | neither | nothing beyond the universal rules — but any tag it *does* carry must still be right |

It also checks that every `<loc>` in the sitemap resolves to a real file, that
no `Disallow` rule matches nothing (a stale rule protects nothing), that every
`og:image` and canonical is absolute and correct, that every page declares a
language, and that internal `href`/`src` references resolve.

Neither script covers `surprise/` — it is vendored third-party code, disallowed
wholesale, and not ours to hold to the house rules.

## Development

No build tooling — open any `index.html` directly, or serve the repo root with a static file server (recommended so relative `<script>`/`<link>` paths resolve correctly), e.g.:

```
node tools/serve.mjs 8000      # or: python -m http.server 8000
```

Then visit `http://localhost:8000/`.

Each subfolder is independent; check its own `index.html` (and any local README) before making changes.
