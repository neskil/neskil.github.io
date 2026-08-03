# Cargo Yard — development plan

> **Parked variant.** This was written as the plan for `3d-engine-poc/` before
> it emerged that a parallel session had shipped **Yard Master** into that
> folder first. It is kept as the design reasoning behind this build, not as a
> roadmap anyone is executing. See [`HANDOVER.md`](HANDOVER.md).

Status: **v0.2.0**, the POC turned into a game. Baseline was v0.1.0, the
original "3D Cargo Yard & Container Stacking Sandbox" proof of concept: a
Three.js scene, a spawn palette, a drivable reach stacker, weather, x-ray, a
stress heatmap and a train — with no rules, no objective and no way to lose.

This file owns the roadmap: what shipped, what is next, and what is
deliberately not built yet. New ideas go in **Backlog**, not in README.md.
See [CLAUDE.md](CLAUDE.md) for which doc owns what.

## The design decision, and where it came from

The brief was: *line missions, stack the crates like 3D Tetris, lowest total
volume wins from the other coordinates, keep the sandbox.* Read literally,
that is a bin-packing puzzle with a Tetris queue, and the four choices below
are how it became a game rather than an optimiser.

- **"Lowest total volume" = the axis-aligned bounding box.** The score is the
  smallest cuboid containing everything you placed, in m³ — width and depth
  from the extents of the pile, height from the ground up. This is the one
  rule the whole game hangs off, and it is what makes *holes* expensive: the
  box does not care that a gap is empty, only that it has to enclose it.
  Rejected alternatives: convex hull (unreadable), sum of piece volumes
  (constant, so not a score), footprint only (removes the third dimension the
  brief asked for).
- **"Like 3D Tetris" = polycube pieces, not just boxes.** Containers alone
  are all I-pieces, which is a packing exercise, not Tetris. Crate bundles
  are L, J, S, T, O plus genuinely 3D step/tower/corner shapes, and a piece
  is stored as a list of cell offsets so both kinds go through the same code.
  Rotation stays 90° about the vertical only — containers do not get stood on
  end, and four orientations keeps the "is there anywhere legal left" check
  cheap enough to run after every placement.
- **"Line missions" = one linear ladder of twelve.** Read as a straight
  campaign: clear a mission with at least one star and the next opens. Three
  chapters, each named for a shipping line, each mission introducing exactly
  one idea and then never explaining it again. (If "line" meant something
  else — liner services, or a Tetris-style line clear — say so and this is
  the cheapest thing in the design to change: missions are data.)
- **Sandbox survives untouched in spirit.** Same palette, same reach stacker,
  same weather and analysis tools. It now goes through the same occupancy
  grid, which means it also stopped letting containers interpenetrate.

There is no line-clear mechanic and no falling timer. Both were considered
and dropped: a line clear needs a bounded, refilling volume to clear *into*,
which fights "the bounding box is your score", and a timer punishes exactly
the deliberation the scoring rewards. Pressure comes from the queue order and
the preview length instead — `m10` turns the preview down to one.

## The parallel branch, and what happened to it

While this rewrite was in flight, another session took the same POC in a
different direction on `master` (`33247d4`): a **contracts-and-economy
simulator** — `js/game.js` with a money balance, a reputation grade, timed
delivery contracts and upgrades — plus `js/crane.js`, a rail-mounted gantry
crane. Both were built on the old `Cargo3D` architecture that this branch
replaces.

The merge kept one and dropped the other, deliberately:

- **The gantry crane was ported and kept.** Its structure, trolley,
  four-cable hoist and alignment laser are intact; it now runs on delta time,
  takes its input through `input.js`, spans the pad rather than stopping
  short of it, and lifts and sets down *through the occupancy grid* — so it
  cannot build a stack the rules would have refused. Sandbox only, same as
  the reach stacker.
- **The contract/economy layer was not.** Timed contracts score *where a box
  ends up*, which is a different game from scoring *how tightly everything
  packs*, and running both at once would leave the player optimising two
  objectives that pull apart. It also depended on `containers.js` and
  `controls.js`, which this rewrite deletes. It is not lost — it is in
  `git show 33247d4:3d-engine-poc/js/game.js`, and the contract templates
  would port cleanly onto `CY.missions` if the economy loop is wanted back
  as a *fourth chapter* rather than as a parallel mode.

That is a design call made mid-merge, and the cheapest one to reverse: say
so and the templates come back as missions.

## Shipped

### v0.2.0 — the game

- **An occupancy grid** (`js/grid.js`). The POC snapped every box to a 2.5 m
  lattice regardless of the box being 6 or 12 m long, so 40ft containers
  interpenetrated their neighbours and "stacking" was a y-offset guess with a
  1.5 m proximity test. Placement is now integer cells: a cell is taken or it
  is not. Cell = half a 20ft (3.05 × 2.90 × 2.60 m), so a 20ft is 2 cells, a
  40ft is 4, and a tier is a high cube.
- **Pieces as polycubes**, containers and Tetris-shaped crate bundles
  through one code path, with real rotation that actually changes the
  footprint (the POC rotated the *mesh* and left the placement maths facing
  along X).
- **Gravity, support ratio, tier ceilings, no-top pieces** — the hard rules,
  all enforced by one validator, `CY.game.preview()`, which the ghost mesh,
  the mouse, the keyboard and the reach stacker all share.
- **Bounding-volume scoring** with a live par track, plus soft-rule penalties
  (buried priority sailings, reefers with no plug access, abandoned pieces)
  audited at the end.
- **Twelve missions** in three chapters, linear unlock, seeded queues,
  derived par, medals, and `localStorage` progress.
- **Two reference players in the test suite** as the balance authority — a
  naive one that proves no mission can deadlock, and a greedy one that proves
  every mission stays clearable. 165 assertions, 0 failures.
- **A real module split**: eight pure-logic modules that run headless, and a
  render/DOM layer that only subscribes to them.

### Fixed on the way through

- The heatmap wrote its colour over every shell mesh but only the body mesh
  ever stored an original colour, so switching it off repainted every
  container's corrugation Maersk teal.
- Nothing was ever disposed: deleting a container leaked its geometries,
  materials and textures. Everything removed now goes through
  `CY.render.disposeObject`, with a shared-geometry cache so a container is 9
  meshes rather than ~50 (the ribs are a generated corrugation texture now).
- The reach stacker integrated per *frame*, not per second, so it was twice
  as fast on a 120 Hz screen. Same for the rain.
- The engine sound spawned a fresh oscillator every frame the throttle was
  held — sixty nodes a second. It is one drone whose gain and pitch follow
  road speed.
- Two competing `keydown` listeners, neither calling `preventDefault`, so the
  arrow keys scrolled the page while they drove the crane and Space did both
  jobs at once. One input module now.
- The grid helper drew an 80 m grid at 2.5 m spacing that corresponded to
  nothing. The pad is drawn from the actual lattice.
- "Unload train" removed a container from a flatcar and then spawned a
  *different*, random one at a random spot. It hands you the box it lifted.

## Next

Roughly in the order they would pay off.

1. **A tutorial overlay for `m1`.** The mission brief carries the teaching
   now, which works but is a wall of text on first contact. Three pointed
   prompts anchored to the pad would land better.
2. **Mobile.** The layout reflows and taps place, but the two-tap aim-then-
   commit flow needs a visible aiming state, and the bottom toolbar wants to
   become a sheet. Currently unverified below ~500 px.
3. **A shareable score.** `?mission=m9&seed=…` plus a copyable result string,
   so a run can be compared. The seeded queues already make this meaningful.
4. **Undo depth in missions.** Undo is currently unlimited, which makes gold
   a matter of patience rather than planning. A per-mission undo budget (or
   "restart is free, undo is not") is the honest fix.
5. **The stacker in missions.** Right now it is sandbox-only. A chapter where
   placement must be *driven* would give the vehicle a reason to exist beyond
   the sandbox — and reintroduces travel distance as a second cost.

## Backlog

Unbuilt, unordered, no commitment.

- **Ship loading.** A second scoring axis: boxes leave in a given order, so
  the yard has to be planned for retrieval, not just density. The `priority`
  tag is a one-piece prototype of this.
- **Weight and stability.** Mass exists on every piece and is shown in the
  HUD but does nothing. Heavy-on-light crushing, and a centre-of-mass check
  per stack, would make the heatmap load-bearing rather than decorative.
- **Daily yard.** One generated queue a day, same for everyone, one attempt.
- **Endless mode.** Pieces keep coming until nothing legal is left; score is
  volume per unit shipped rather than total volume.
- **A real solver** to compute a true optimum per mission, replacing the
  theoretical-floor par with an achievable one. Expensive, and the greedy
  reference player in the tests already covers the thing that matters
  (nothing becomes unclearable).
- **Piece bag randomisation** à la Tetris (draw from a shuffled bag rather
  than uniformly) so generated missions cannot deal four tanks in a row.
- **Replay/ghost of your best run** on a mission.
- **Sound design pass.** The audio is three procedural effects and a drone;
  a yard should sound busier.
