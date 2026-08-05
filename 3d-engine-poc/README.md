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
├── version.js          build stamp shown in the top bar (tools/stamp-build.sh)
├── tests.html          headless unit tests for core/ + missions/
├── physics-tests.html  headless unit tests for the rigid-body solver
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
│   ├── app.js          bootstrap + mode machine (attract/mission/sandbox/physics)
│   ├── audio.js        procedural sound
│   ├── camera.js       named camera rigs with eased transitions
│   ├── placement.js    pointer → legal grid placement, ghost, rotate, undo
│   ├── mission.js      campaign mode
│   ├── contracts.js    binds the job board to the sandbox
│   ├── sandbox.js      free-build mode
│   ├── physics.js      rigid-body solver — contacts, friction, sleep
│   └── physicsMode.js  experimental physics yard: free play + tower challenge
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

**Physics is a sibling of the grid, not a replacement for it.** The campaign
holds a stack up with `support:1` — a rule that counts occupied cells underneath.
That is a deliberate abstraction, and it cannot become real physics, because
`core/` is forbidden from touching THREE. So `game/physics.js` sits beside the
grid instead: an impulse solver with no grid, no rules and no support ratio,
where a stack stands because it balances. Both are legitimate; they answer
different questions. See *The physics yard* below.

**Missions are data.** Everything in `campaign.js` is a plain object;
`missionSchema.js` validates the lot, and `tests.html` asserts that each
mission's cell count actually factors into a box the bay can hold — so par stays
an honest target rather than an unreachable one.

## The physics yard

`🧪 Physics (Exp)` on the main menu. No bay, no manifest, no regulations — every
container is a rigid body and the stack does whatever the solver says.

**The solver** (`game/physics.js`) is sequential-impulse, and every shape is a
box or a small union of them:

- A body's shape is a list of axis-aligned boxes in body space. Ordinary cargo
  is one. The masked pieces — the L-corner and T-beam modules — are the union of
  their occupied cells, merged into runs along X, so the notch is genuinely
  empty and a container dropped into it falls past to whatever is underneath.
- Contacts come from sampling 22 points per box (8 corners, 12 edge midpoints,
  2 face centres) against the other body's boxes. No SAT, no GJK — for a yard
  full of cuboids, point-in-box is enough and it is cheap.
- Body axes match the mesh: **length along X, width along Z.** A body that
  disagrees with its own mesh is self-consistent and still completely wrong —
  containers pass through each other end to end and collide with the air beside
  them.
- Each step collects contacts once, then relaxes them over 10 iterations with
  **accumulated** normal and friction impulses. The accumulation is the part that
  matters: with a single pass, a support impulse cannot propagate up a stack, and
  towers sag and topple no matter how carefully they were built.
- Friction uses two fixed tangents clamped to the friction cone.
- **Fixed 1/120 s timestep** with an accumulator. Not an optimisation — the
  overlap correction divides by the step, so at a variable `dt` a single short
  frame fires the whole yard into the sky. The correction is clamped as well.
  A side effect worth having: the same tower scores identically at 10 fps and
  60 fps.
- Bodies sleep after 0.5 s at rest and drop out of the loop. A settled stack of
  40 costs ~0.55 ms/frame.

**Two challenges**, switched from the toolbar:

- *Free play* — drop anything anywhere and watch it fall over.
- *Tower* — stack as high as you can. Height is only credited once every body is
  asleep, so a tower has to actually stand still to count. Each settled container
  remembers the height it settled at; if one ever drops more than 1.2 m below
  that, something under it gave way and the run is over. Best height persists.

**Two placement styles**, in the physics yard *and* the sandbox:

- *Grid* — snaps to the campaign's slot lattice in quarter turns, the same
  placement the missions use. The grid decides where a container lands; physics
  still decides whether it stays there.
- *Free* — anywhere the cursor points, in 15° steps.

`G` toggles between them. The lattice maths lives in `render/yard.js` beside the
bay's, because that file is the only one allowed to multiply by `CELL_X`.

## Running the tests

Two pages, deliberately separate:

| page | covers | loads THREE |
|---|---|---|
| `tests.html` | `core/` + `missions/` — grid, rules, scoring, manifests, save | **no** |
| `physics-tests.html` | the rigid-body solver | yes (maths only, no WebGL) |

`tests.html` loading no THREE at all is the guard behind *the one rule* — it
breaks loudly if `core/` ever reaches for it. The solver genuinely needs
`Vector3` and `Quaternion`, so it gets its own page. Do not merge them.

```sh
for page in tests.html physics-tests.html; do
  chrome --headless=new --disable-gpu --virtual-time-budget=90000 \
    --dump-dom "file:///path/to/3d-engine-poc/$page" | grep -oE 'ALL TESTS PASSED[^<]*|FAILED — [^<]*'
done
```

Both set `document.title` to `PASS`/`FAIL` and leave
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

## Which build is live

The top bar carries a dim monospace chip with the short commit hash, linking to
that commit on GitHub — enough to tell at a glance, on a phone, whether the
deployed page is the one you just pushed. Run `tools/stamp-build.sh` before
pushing and commit what it writes to `version.js`.

The stamp names the commit that was HEAD when the script ran, not the commit
that records the stamp: writing a hash into a file changes that file's hash, so
an unbuilt static site cannot do better. It names the change you care about.

## Save data

One key, `cargo3d.save.v1`:

```js
{
  version: 1,
  missions:  { m01: { plays, best, medal, completed, lastEnvelope, par, updatedAt } },
  settings:  { muted, weather, showGrid },
  stats:     { unitsPlaced, missionsRun },
  physics:   { bestHeight, bestUnits, runs },
  contracts: { money, delivered, rating, upgrades } | null
}
```

`physics` was added without bumping the version, because it is purely additive:
`read()` fills it in for a save written before the mode existed. `tests.html`
asserts that an old save survives the round trip.

Bump `SAVE_VERSION` and migrate rather than repurposing fields.
`core/storage.js` falls back to an in-memory store when localStorage is blocked,
so the game still plays from `file://` in a locked-down browser.

The portfolio landing page links here from the main `#card-3d-poc` card and reads progress via `loadHighScores()` to render the `#stat-3d-poc` mission chip.
