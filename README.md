# neskil.github.io

Niklas Billgren's personal site, hosted on GitHub Pages. Static HTML/CSS/JS, no build step — each folder is a self-contained page served directly from the repo.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Landing page / portfolio hub linking out to the sections below. The cards are grouped into foldable shelves (games, labs, useful tools, about) with a jump bar above them; a fold is remembered per browser, and a phone opens only the first shelf until told otherwise. Leave the page alone for 40 seconds and a parcel drops onto a card in view for a Cargo Lander to winch away (`?idle=N` starts it N seconds in). |
| `cv/` | Curriculum vitae site. |
| `cargo-lander/` | CargoLander — a browser-based 2D lander/logistics game with a custom physics engine. See [cargo-lander/README.md](cargo-lander/README.md) for internals. |
| `games/` | Interactive game library — a browsable/filterable catalog of games (`data.js` holds the entries). A game with no `imgUrl` of its own (most of them) shows its genre's picture from `images/genres/`: 768×768 WebP, cover-cropped by the card and the modal, about 1.5 MB for all seventeen. They were 1024×1024 JPEGs named `.png`, 16 MB in all; a new one should go through the same encode (`ffmpeg -i in -vf scale=768:768:flags=lanczos -c:v libwebp -quality 75 -compression_level 6 out.webp` — ImageMagick's `convert` ignores `-quality` for WebP). |
| `math/` | EU/US unit cheat sheet. |
| `converter/` | Quick mental unit converter. |
| `car/` | Lease vs. finance vs. cash vs. monthly rental — US car cost-of-ownership calculator. Linked from the card grid on the landing page. |
| `bil/` | Leasa · Hyra · Köpa — the Swedish edition of `car/`: cash, billån, privatleasing, bilabonnemang, långtidshyra, no car and (if offered) a förmånsbil, priced through one cash-flow ledger in kronor a month and per mil, with malus, ränteavdrag on secured loans only, the three-year vagnskadegaranti, besiktning and winter wheels. Swedish or English at a toggle (the browser's language by default, remembered, carried in share links), a nine-question walkthrough that fills the inputs in, and a second car priced through the same routes beside the first. The preset cars resell on their own curves, measured from October 2026 listings. Every figure lives in `js/data.js` with its source; the rules are DOM-free in `js/model.js`, asserted by `tests.html`. See [bil/README.md](bil/README.md) for the US→Sweden parameter map and the formulas. |
| `supply-chain/` | Supply Chain Tycoon — a Mini-Metro-style logistics mini-game (roads, trucks, factories, orders). See [supply-chain/README.md](supply-chain/README.md). |
| `wow/` | WoW Forever Countdown — a countdown to World of Warcraft: Forever (4 November 2026, 3 PM PST, midnight in Stockholm) for a group of friends: their party as Warcraft party frames with a ready check, launch time by time zone, the roadmap as a quest log, and a Great Vault holding the share link. At the foot of the page is the camp, the party in 3D by the fire with a Warcraft-style UI over it (nameplates, target frame, minimap, party chat, an action bar of emotes); `js/world.js` and the vendored three.js in `vendor/` load only when it scrolls near. Reachable only from the vault row on the landing page and kept out of the sitemap, but it carries the OG tags so a link pasted in a chat shows a card. |
| `supply-chain-legacy/` | Frozen single-file snapshot of the pre-rewrite Supply Chain sim. Reachable only from the "vault" row on the landing page; kept out of the sitemap on purpose. |
| `3d-engine-poc/` | Yard Master — a WebGL container-stacking puzzle (three.js, vendored, no build step). See [3d-engine-poc/README.md](3d-engine-poc/README.md). |
| `cargo-packer/` | Cargo Packer 3D — eight container-loading algorithms (good, baseline and deliberately bad) packing the same editable cargo, side by side, with centre-of-gravity tracking and a guided tour per algorithm. See [cargo-packer/README.md](cargo-packer/README.md). |
| `golf/` | Pocket Links — a 2D mini golf game (canvas, own physics): thirteen six-hole courses, each a biome with a trick of its own (wind on the farm, dunes in the desert, turnstiles and travelators at the funfair, a record player on a desk, avalanche chutes on the mountain, lava and geysers on the volcano, black holes in space), and a procedural draw, opened in turn by the stars each hole gives and picked from a dialog of hole plans; a title screen, pass-and-play for up to four, and a board that turns for an upright phone. Plus `level-editor.html`, a visual hole editor that runs on the game's own modules. See [golf/README.md](golf/README.md). Shares one landing-page card with `golf3d/`; the card's flip side picks between them. |
| `golf3d/` | Loft Links — 3D golf, fifteen six-hole courses in four groups (three.js, vendored; own physics), plus `level-editor.html`, a plan-and-preview hole editor that runs on the game's own modules, and `turntable.html`, which draws every hole from eight angles as a contact sheet per course. See [golf3d/README.md](golf3d/README.md). |
| `viz-poc/` | Data Room — eight interactive 3D visualizations behind one scene switcher: a trade-flow globe, this repo drawn as a city, a particle morph field, a raymarched nebula, boid flocking, a Mandelbulb, four strange attractors and a wave field. Every scene has live controls; the whole interface folds away. See [viz-poc/CLAUDE.md](viz-poc/CLAUDE.md). |
| `sand/` | Sand Clock — a falling-sand sandbox (canvas, cellular automaton) that opens as a one-minute hourglass: the neck passes one grain a step, and it holds 3,600. Some thirty materials that react (lava sets to stone in water, acid eats all but glass, gunpowder trails burn like fuses, metal carries pulses from a battery, seeds grow into trees, ants dig), picked from seven basics plus six group trays; tools for lines, boxes, taps and drains (fill-capped), wind, heat, cold, lightning and blasts; gravity in four directions (or phone tilt), speed, undo, share-by-link and PNG export; volcano, garden, lab and machines scenes. A Detail setting (Auto picks from a benchmark) changes the grid size, and 32×32 chunks that have settled sleep, which is what keeps fine grids fast. Logic in `js/sim.js`, no DOM; asserted by `tests.html`. |
| `terrarium/` | Pocket Weather Terrarium — a 3D world in a corked jar (three.js, vendored) whose sky follows the live weather (Open-Meteo, no key) and the sun's true elevation at a chosen place, with the moon's real phase; drag to turn the jar on its stand, pinch to zoom in. Daisies grow in clumps, reeds and lily pads ring the pond, birds wheel overhead on fine days, leaves come down in autumn (or when the glass is tapped), and rain with the sun out brings a rainbow. The time of year comes from the date and hemisphere (`seasonOf` in `js/weather.js`): blossom on the tree in spring, fewer flowers in winter. Mist lifts off the pond on cool mornings, a lantern lights the path at dusk, and shooting stars cross clear nights. Starts from the browser's time zone without asking; city search and "use my location" refine it, and it falls back to a seasonal guess offline. Logic in `js/weather.js`, asserted by `tests.html`; the scene is `js/scene.js`, and the sheep, the worm in the soil and the saucer that visits every few minutes (or after five quick taps, or `?ufo=N` seconds in) are `js/visitors.js`, along with the butterflies on warm days and the duck and duckling on the pond. The jar opens with a short eased turn; `?intro=0` skips it for screenshots. |
| `elevator/` | Tiny Elevator Tycoon — program a building's lifts (next-stop strategy, zone, idle parking, shared calls) and run a day of seeded arrivals; six levels scored on average wait and people lost to the stairs. Star thresholds are calibrated against every program in `allRules()`, and `tests.html` checks each level is still winnable at three stars. Logic in `js/sim.js`. |
| `paper-plane/` | Paper Plane Glider — fold a sheet of A4 yourself: drag a point of the paper to where it should land and the flap swings over its crease (mirrored by default; on a touch screen letting go only places the fold, which can be adjusted before the Fold button makes it), or add named folds (corners in, nose down, tip up, nose under) that find their place on whatever the paper looks like by then. The design is the list of folds: reorder, tune and delete them and the sheet is folded again from scratch, with a live 3D model, balance and test throw beside it. Guides for the Classic Dart, Wide Glider and Nakamura Lock. `js/fold.js` is the folding engine (facets, layers, which pieces are joined, fold steps, and the measurements: planform, centre of gravity, aerodynamic centre); `js/flight.js` flies what was folded side-on (a flat sheet stalls and drops, a layered nose glides) and `js/flight3d.js` gives it roll and yaw from the same sheet, so a lopsided fold veers and a tilted throw curves. Shape the wings in 3D (`js/model.js`), then throw it down a 3D office (`js/flyview3d.js`, three.js from `vendor/`, loaded on the way to the Fly step; the side-on `js/flyview.js` where there is no WebGL): aim, power, direction and wrist tilt, three cameras, ten missions, the longest throw or the daily bin; keep planes in a hangar and share them by link. `PLAN.md` holds what is left to do and what was learned building the 3D flight. `tests.html` checks the folding, the steps, the physics in 2D and 3D and that every mission can be done. |
| `fika/` | Fika Generator — three tarot-style cards for a Swedish fika (pastry, drink, conversation topic), drawn as small SVGs in `js/art.js`. Knows the pastry days (Fettisdagen from Easter, Kanelbullens dag, Lucia…) and seasonal cards, keeps cards across deals, deals a shared "today's fika" and encodes a hand in the URL by card id. Deck and calendar in `js/deck.js`; asserted by `tests.html`. |
| `name-song/` | Sound of Your Name — any text becomes a short tune (each letter a fixed scale step; key, mode, tempo, chords and instrument from the whole name), played on a small Web Audio synth with a generated reverb and drawn as a rosette that follows the playhead. Share by `?n=` link or save a 1080px picture. Composer in `js/compose.js`, no audio or DOM; asserted by `tests.html`. |
| `surprise/` | Misc. personal page ("Bacons lilla hörna") — an HTML5 UP "Dimension" one-pager with two Phaser toys, plus `cv_legacy/`. Pruned to what it actually serves; see "Pruning surprise/" below before adding to it. |
| `404.html` | Custom not-found page (GitHub Pages serves it automatically). |
| `robots.txt` / `sitemap.xml` | Crawler hints. `surprise/` is excluded, being vendored third-party demo code, as are the test harnesses — see "What crawlers see" below. |
| `assets/` | `og/` link-preview images (one per page), `preview/` card-back screenshots for the landing page, and `portrait.webp` for the About card. |
| `favicon.ico` | Site-wide favicon. |
| `CLAUDE.md` | Root pointer so agents load `.agents/AGENTS.md`, which is not a path Claude Code looks in by itself. |
| `tools/` | Dependency-free Node scripts: the test runner, the site checker, and a static server. See "Checks" below. |
| `.github/workflows/ci.yml` | Runs both checks on every push and pull request. |

## What crawlers see

Every page that is meant to be found carries a `<link rel="canonical">`, a
`<meta name="description">`, the Open Graph / Twitter tags described below, and
a JSON-LD block, and appears in `sitemap.xml`.

The JSON-LD says in `schema.org` terms what the Open Graph tags say in prose:
each page is a `VideoGame`, a `WebApplication`, or the site or profile itself,
authored by one `Person` node that every page repeats by `@id`. Its `url`,
`description` and `image` are the same strings as the page's canonical,
description and `og:image` — deliberately, so the two can be checked against
each other. Change one and change the other, or `check-site.mjs` will say so:
markup that disagrees with the page is worse than none, because a crawler acts
on it.

Everything else must opt out, and does so twice: a `Disallow` line in
`robots.txt` so the page is never fetched, and `<meta name="robots"
content="noindex">` in the page itself so it stays out of the index even if
something reaches it by a route `robots.txt` doesn't cover. Belt and braces,
because the two mechanisms fail differently — `robots.txt` cannot suppress a
URL that other sites link to, and a `noindex` tag is never read if the fetch
is blocked. That set is the headless test harnesses (`*/tests.html`,
`3d-engine-poc/physics-tests.html`, `golf/ui-tests.html`,
`golf3d/shader-tests.html`, `golf3d/ui-tests.html`,
`supply-chain/interaction-tests.html`) and the
screenshot/audio probes (`cargo-lander/syntax-check.html`,
`cargo-lander/probe-screenshot.html`, `supply-chain/audio-check.html`,
`supply-chain/research-zoom-check.html`, `golf3d/turntable.html`).

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
Nothing in that folder is fetched on load; together they are about 1.1 MB.

Two things make them worth the trouble, and both are easy to lose when
regenerating one:

- **Shoot the thing running, not its menu.** A screenshot of a title screen
  tells you nothing you did not already read on the front of the card. Drive
  the app in first — dismiss the tutorial, pick the mission, start the round,
  answer a question — then shoot. Better still, shoot it moving: the golf
  and Cargo Lander shots are taken mid-shot — a ball rolling with its trail
  behind it, a drive in the air, the lander under thrust — by setting the
  game's own aim/power state and pressing its swing key, or (Cargo Lander,
  which crawls at a few frames a second headless) by placing the lander with
  the `CLAUDE.md` teleport recipe and stepping `game.update(1.0)` a few times.
  `car` is a designed hero rather than a screenshot, so it is reused as-is.
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
Cargo Lander uses this for five — four missions in flight (canyon, islands,
grotto, derelict station) and the R&D Upgrades shop. The golf picker does the
same in each of its two `.dim-shot` frames, four holes apiece; the two frames
take turns on a half-beat so the panel never changes both pictures at once.
The markup stays a plain list, so with the script off the card shows the first
shot rather than a pile. A regenerated shot that keeps its filename gets a
`?v=` bump on its `data-src`, or a returning visitor keeps the cached one.

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
red. Currently nineteen suites (over 7,200 assertions), about a minute.

Two things about it are deliberate:

- **Suites are discovered, not listed.** Any `*tests.html` with a
  `#summary` is one. Give a project a harness and it is picked up with no edit
  to the runner — the same reason `supply-chain/tests.html` derives its module
  list instead of repeating it.
- **An unreadable summary is a failure, not a pass.** The harnesses
  predate any shared contract and each phrase their result differently, so the
  parser understands all of them; when it cannot, it says so and goes red. "The
  page didn't say" and "the page said everything is fine" must not collapse
  into the same green tick.

Pass a substring to narrow it: `node tools/run-tests.mjs golf3d`.

**What the runner does not cover, and should not.** A project may also own a
tool that produces a *picture* rather than a verdict, and the discovery rule
above is what keeps the two apart: a harness is a `*tests.html` with a
`#summary`, and anything that cannot answer green or red has no business
being run by something that exits non-zero. `golf3d/turntable.html` is the one
of those — it draws every hole in the game from eight fixed angles as a contact
sheet per course, driven by `golf3d/tools/turntable.mjs`, and what it is for is
the class of fault that is invisible to the simulation and obvious in a
screenshot. Its machine-checkable half lives in `golf3d/js/audit.js` and *is*
asserted, by `golf3d/tests.html`, in the run above. See golf3d/README.md →
"The pictures, which neither suite can see".

**`check-site.mjs`** enforces what "What crawlers see" and "Link previews"
describe, so those sections stop being things a reader is trusted to remember.
It sorts every page into one of three classes and checks each accordingly:

| Class | How it is decided | What is required |
| --- | --- | --- |
| promoted | listed in `sitemap.xml` | canonical, description, the full OG set, `twitter:card`, an `og:image` that exists on disk, and a JSON-LD block that agrees with all of it |
| excluded | carries `noindex` | a matching `robots.txt` `Disallow`, and absence from the sitemap |
| unlisted | neither | nothing beyond the universal rules — but any tag it *does* carry must still be right |

Every page a visitor can land on — promoted or not — also needs the analytics
tag and a `viewport` meta. Those two are not about crawlers: an untagged page
is one nobody knows is being used, and a page with no `viewport` renders at
desktop width on a phone, which is how `cargo-lander/level-editor.html` shipped
until the check went in. The one exception is `supply-chain-legacy/`, a frozen
snapshot that is meant to stay exactly as it was.

It also checks that every `<loc>` in the sitemap resolves to a real file, that
no `Disallow` rule matches nothing (a stale rule protects nothing), that every
`og:image` and canonical is absolute and correct, that every JSON-LD block
parses and every site URL inside it resolves, that every page declares a
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
