# Changelog

## v0.4.1 — a phone-sized yard, and the Tetris blocks everywhere

**Added**

- **Collapsible toolbar sections on a phone.** The control bar showed every
  section at once — five stacked rows eating half the yard, most of it cold.
  Each section now folds to a chip that still reports what it is set to
  (`Spawn Cargo · 20ft`), one section is open at a time, and picking from an
  exclusive group folds it away again the way a dropdown would. The desktop bar
  is untouched: above the breakpoint the module unwinds itself.
- **The L-corner and T-beam modules are spawnable** in the sandbox and the
  physics yard, not just in the campaign. They are the most interesting thing in
  the catalogue to pack, and the most interesting to balance.
- 3 more assertions: a masked piece being hollow where it looks hollow.

**Fixed**

- **Masked cargo collided as its bounding box.** An L-block's notch is visibly
  empty, so cargo dropped into it has to fall through, not rest on air. A body's
  shape is now a list of axis-aligned boxes — one for ordinary cargo, the union
  of the occupied cells for a masked piece, merged into runs so no interior face
  reaches the contact test. `penetrationOf()` reads the same shape, so the spawn
  clearance check no longer refuses a slot that is genuinely empty.
- **The top bar did not fit a phone.** Five items priced for a desktop: the
  title wrapped to two lines, the badge to three, and the menu button — the only
  way out of a mode — was pushed off the right edge.
- The grid ghost is now mask-aware, so an L-block previews as an L rather than
  as the 2×2 box around it.

## v0.4.0 — physics as a failure mode

The campaign gets the simulation, in the one place it belongs. `support:1` was
the only rule that was ever a physical claim; the other six are regulations, and
a real terminal genuinely does refuse those moves. So physics replaces support
and nothing else.

**Added**

- **A `physics` rule and three missions that use it** — *Balancing Act*,
  *Top Heavy* and *Salvage Yard*. No support ratio to satisfy: overhang what you
  like, and the yard tells you. The existing thirteen missions are untouched, so
  their medals still mean what they meant.
- **Collapse costs ground.** Anything that falls is craned back onto the queue
  and the squares it started on and landed on are struck off for the rest of the
  shift. You re-place the cargo with less yard to do it in, which shows up in the
  envelope as sprawl. The manifest never changes size, so par stays honest.
- The grid stays authoritative throughout: physics is only ever asked *did it
  hold*, and a surviving stack snaps back to the lattice it was always on. That
  is what keeps envelope scoring and a computed par meaningful.
- `YardGrid` learned blocked squares; `render/yard.js` paints them as wreckage.

**Fixed**

- **Every container's hitbox was turned ninety degrees.** `render/containers.js`
  lays a container's length along X, and the grid agrees — a 40ft at rotation 0
  spans four cells in X — but `RigidBox` read `spec.width` as the X extent. So
  the collision box was across the container it belonged to: stacks that looked
  flush overlapped, and neighbours that looked clear shoved each other aside by
  over a metre. Extents are now named by axis, `sizeX`/`sizeY`/`sizeZ`, so the
  mistake cannot be spelled.
- **A rotated container could be dropped inside its neighbour.** `rotate()`
  turned the ghost but left the clearance height solved for the old footprint,
  and `pointerup` dropped without re-reading the pointer — which a touch tap
  needs, since it cannot be relied on to send a `pointermove` first.
- Sample points covered a box's corners, edges and faces but not its centre, so
  a container crossing through the middle of another could overlap with no point
  inside either one.
- **Any mission with pre-placed obstacles crashed on entry** — the obstacle loop
  used `self` twenty lines before it was declared. That has been broken since
  obstacles shipped, taking *Endless Yard* with it.

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
