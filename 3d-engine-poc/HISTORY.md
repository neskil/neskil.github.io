# Changelog

## v0.3.0 — the physics yard

Real rigid-body physics alongside the grid, not instead of it. The campaign's
`support:1` rule counts occupied cells underneath; it cannot become physics,
because `core/` may not touch THREE. So the solver sits beside it.

**Added**

- **Tower challenge.** Stack as high as you can. Height counts only once every
  container is asleep, so the tower has to genuinely stand still. Each settled
  container remembers where it settled; if one drops 1.2 m below that, something
  under it gave way and the run ends. Best height persists in the save.
- **Grid placement in the sandbox and the physics yard.** A toolbar button (and
  `G`) switches between the campaign's slot lattice in quarter turns, and free
  placement wherever the cursor points. The grid says where a container lands;
  physics still says whether it stays. The sandbox gains a ghost preview it
  never had.
- **A camera that follows the tower up**, easing and pulling back as the stack
  grows, and yielding the moment the player takes the camera themselves.
- Laden mass per container — a 40ft outweighs a 10ft roughly four to one, so
  what goes where changes what the stack does.
- 18 more assertions: tower records, and a save written before this release
  round-tripping intact.

**Fixed**

- **The solver could not stack.** It ran one sequential pass over contacts per
  substep, so a support impulse never propagated up a chain: a perfectly aligned
  tower of eight tilted 23° and sagged 0.6 m, and 0.3 m of placement jitter
  collapsed a tower of twelve outright. Replaced with accumulated impulses
  relaxed over ten iterations — 23.3° → 0.4°, and the jittered tower now stands.
- **Sleep was dead code.** `resolveGround()` woke every body it touched, so a
  container was woken forever by the floor it was resting on. The ground now
  wakes nothing, and a settled neighbour only wakes for a partner that is
  actually moving. Forty bodies went from 3.18 ms/frame to 0.55 ms.
- **A short frame fired the yard into the sky.** The overlap correction divides
  by the timestep, so one near-zero `delta` — a resumed tab, a stolen clock —
  produced an impulse that launched a settled stack at 22 m/s. Physics now runs
  on a fixed 1/120 s step with a clamped correction. The same tower scores
  identically at 10 fps and 60 fps.
- `campaign — schema` asserted `nextAfter('m12') === null`; the campaign had
  gained a thirteenth mission and the assertion had been failing silently. It now
  derives the last mission instead of naming it.

## v0.2.0 — Yard Master

The proof of concept becomes a game.

**Added**

- **Campaign mode** with 12 line missions. Each gives a bay, a manifest and a
  set of terminal regulations; each unlocks the next on any medal.
- **Envelope scoring.** The rank is the volume of the smallest box containing
  every occupied slot — lowest wins. Par is a computed zero-waste pack of the
  same manifest, with gold/silver/bronze at multiples of it.
- **Grid placement** with real gravity, ghost preview, drop-column indicator,
  90° rotation and undo. Illegal placements are refused *and explained*: the
  HUD names the regulation that blocked them.
- **Seven regulations** — support ratio, crane reach, no top loading, heavy at
  the bottom, hazmat separation, reefer power points, and departure order.
- **New cargo:** 10ft boxes, 2×2 breakbulk crates and tank containers, plus
  reefer / hazmat / heavy traits and departure days.
- **Live envelope wireframe** in the scene, a medal track in the HUD, and a
  three-deep queue lookahead.
- **Scorecard** with envelope vs par, medal thresholds and best-result tracking.
- **`core/` logic layer** with no THREE dependency, and `tests.html` — 133
  assertions covering the grid, every rule, scoring, manifests, the save file
  and the whole campaign's validity, runnable headless over `file://`.
- Progress saved to `cargo3d.save.v1`.

**Changed**

- Restructured from a flat `js/` folder into `core/ · missions/ · render/ ·
  game/ · ui/ · styles/`. See `README.md`.
- Sandbox mode preserved in full — free spawn, reach stacker, train unloading,
  weather, X-ray, tier heatmap — now reachable from the main menu.
- **Gantry crane and the contracts economy carried across.** The rail-mounted
  crane became `render/crane.js` and is a second drivable machine in sandbox
  (only one machine holds the keyboard at a time); it can lift a container
  straight off a flatcar. The contract system split into `core/contracts.js`
  (pure state machine — orders, payouts, reputation, expiry, upgrades, now
  unit-tested) and `game/contracts.js` (sandbox binding, zone marker, HUD).
  Capital, reputation and upgrades persist. Fixed in the port: cargo already
  standing in a delivery zone no longer pays out the moment an order is issued.
- Reach stacker driving is frame-rate independent (was per-frame constants).
- Camera rigs frame the bay by its bounding sphere and ease between presets.

## v0.1.0 — 3D Cargo Yard POC

- Three.js scene, procedural corrugated containers, orbit/isometric/crane
  cameras, click-to-spawn stacking, drivable reach stacker, freight train and
  semi truck props, five weather presets, X-ray view, stress heatmap,
  procedural audio.
