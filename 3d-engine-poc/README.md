# Yard Master — architecture

A 3D container-packing game in vanilla JS and Three.js. No build step, no
bundler, no dependencies beyond the two vendored scripts. Open `index.html`
over `file://` and it runs.

For the game design and the roadmap, read [`PLAN.md`](PLAN.md). This file is the
map of the code.

## The one rule

> **`core/` never mentions THREE.**

Everything that decides *what is true* is plain data and plain functions.
Everything that decides *what it looks like* lives in `render/`. That split is
why [`tests.html`](tests.html) can test the entire ruleset — placement, gravity,
support, every regulation, scoring, medals, manifest determinism, save/load —
with no WebGL context, offline, in a headless browser.

## Layout

```
3d-engine-poc/
├── index.html          DOM shell; script tags define load order
├── tests.html          headless unit tests for core/ + missions/
├── PLAN.md             game design & roadmap
├── CLAUDE.md           workflow notes for agents
├── HISTORY.md          changelog
│
├── core/               pure logic — no THREE, no DOM
│   ├── constants.js    grid metrics, cargo catalogue, carriers, traits
│   ├── grid.js         YardGrid: occupancy lattice, gravity, support, bounds
│   ├── rules.js        terminal regulations as predicates + reasons
│   ├── scoring.js      envelope volume, par, medals, scorecards
│   ├── manifest.js     seeded PRNG and manifest generation
│   ├── contracts.js    sandbox job board: orders, payouts, rating, upgrades
│   └── storage.js      localStorage progress and settings
│
├── missions/
│   ├── missionSchema.js  mission shape + validator (run by tests.html)
│   └── campaign.js       the 12 line missions, as data
│
├── render/             THREE-dependent scene construction
│   ├── containers.js   procedural cargo meshes, X-ray, heatmap
│   ├── scene.js        renderer, camera, lights, apron
│   ├── yard.js         bay markings, grid↔world transforms, ghost, envelope
│   ├── weather.js      atmosphere presets
│   ├── terminal.js     rail track, train, semi truck
│   ├── vehicle.js      drivable reach stacker
│   ├── crane.js        rail-mounted gantry crane (trolley, winch, spreader)
│   └── effects.js      lock-in rings, medal burst
│
├── game/               loop, input, modes
│   ├── app.js          bootstrap + mode machine (attract/mission/sandbox)
│   ├── audio.js        procedural sound
│   ├── camera.js       named camera rigs with eased transitions
│   ├── placement.js    pointer → legal grid placement, ghost, rotate, undo
│   ├── mission.js      campaign mode
│   ├── contracts.js    binds the job board to the sandbox
│   └── sandbox.js      free-build mode
│
├── ui/                 DOM only
│   ├── hud.js          mission HUD, queue, sandbox stats, inspector
│   ├── menu.js         main menu, mission select, how-to, pause
│   ├── results.js      scorecard
│   └── ui.js           the facade the game talks to
│
├── styles/             tokens.css → hud.css → menu.css
└── vendor/             three.min.js (r128), OrbitControls.js
```

Load order is `vendor → core → missions → render → game → ui → game/app.js`,
declared by the script tags at the bottom of `index.html`. Every file is an IIFE
hanging one namespace off `window.Cargo3D`.

## Key concepts

**Grid.** The bay is a `cols × rows × tiers` lattice of 3.05 m square cells,
2.90 m per tier. ISO lengths land on whole cells (20ft = 2, 40ft = 4). A
`YardGrid` cell holds a placement id or 0. `restTier()` is gravity;
`supportInfo()` is what the support rules read; `bounds()` is the score.

**Footprints are cell masks.** `Constants.footprint(type, rot)` returns a list of
`[dx, dz]` offsets, not a width/height pair, so non-rectangular cargo can be
added later without touching `grid.js` or `placement.js`.

**Rules are strings.** A mission declares `['support:1', 'maxTier:3']`.
`Rules.validate()` returns `{ok, reason, violations, support}` — the `reason` is
written to be shown to the player verbatim.

**Par is computed.** `Scoring.parFor(units)` is a perfect zero-waste pack of the
manifest. Medals are multiples of it. Adding a mission needs no balancing.

**Missions are data.** Everything in `campaign.js` is a plain object;
`missionSchema.js` validates the lot, and `tests.html` asserts that each
mission's cell count actually factors into a box the bay can hold — so par stays
an honest target rather than an unreachable one.

## Running the tests

Open `tests.html` in a browser, or headless:

```sh
chrome --headless=new --disable-gpu --virtual-time-budget=8000 \
  --dump-dom "file:///path/to/3d-engine-poc/tests.html" | grep -o 'ALL TESTS PASSED[^<]*'
```

The page sets `document.title` to `PASS`/`FAIL` and leaves
`window.__TEST_RESULT__ = {passed, failed, failures}` for a driver to read.

## Adding things

**A mission** — append an object to `CAMPAIGN` in `missions/campaign.js`. Make
the manifest need more cells than the bay floor (otherwise there is no reason to
stack) and pick a cell count that factors into a box inside the bay (otherwise
gold is unreachable). `tests.html` checks both.

**A rule** — add an entry to `RULES` in `core/rules.js` with `label`,
`describe(param)` and `check(ctx)`; reference it by id from a mission. The HUD,
the briefing panel and the how-to page all pick it up automatically.

**A cargo type** — add it to `CARGO_TYPES` in `core/constants.js` with its cell
footprint and true metres, then give it a mesh branch in
`render/containers.js`. Set `gridPiece: false` for sandbox-only props.

## Save data

One key, `cargo3d.save.v1`:

```js
{
  version: 1,
  missions:  { m01: { plays, best, medal, completed, lastEnvelope, par, updatedAt } },
  settings:  { muted, weather, showGrid },
  stats:     { unitsPlaced, missionsRun },
  contracts: { money, delivered, rating, upgrades } | null
}
```

Bump `SAVE_VERSION` and migrate rather than repurposing fields.
`core/storage.js` falls back to an in-memory store when localStorage is blocked,
so the game still plays from `file://` in a locked-down browser.

The portfolio root links here from the work-in-progress card only; this project
has no card in the landing grid until it is finished and approved. See
`CLAUDE.md`.
