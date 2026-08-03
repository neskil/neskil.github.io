# Cargo Yard

> **Parked variant, not the main game.** `3d-engine-poc/index.html` serves
> **Yard Master**; this folder is a second, independent take on the same
> brief, kept for comparison. Read [`HANDOVER.md`](HANDOVER.md) first — it
> explains why both exist and what is worth taking from this one.

A 3D container-stacking puzzle. You are handed a queue of intermodal boxes
and crate bundles in an order you did not choose, and you have to stack them
so that **the smallest cuboid that still contains everything you placed is as
small as possible**. Width, depth and height all count, and height counts
from the ground.

Twelve missions in a straight line, plus the original free-build sandbox.
Vanilla JS and Three.js, no build step, runs off `file://`.

> **Doc map** — [HANDOVER.md](HANDOVER.md) owns *why this exists beside Yard
> Master and what to harvest from it*. [PLAN.md](PLAN.md) owns *the design
> reasoning and the roadmap*. This file owns *what this build is and how its
> code is laid out*. Put a fact in exactly one of them.

## The rules

### The lattice

Everything happens on an integer voxel grid. One cell is **half a 20ft
container**: 3.05 × 2.90 × 2.60 m (`CY.CELL`). So a 20ft is two cells long, a
40ft is four, a 45ft is five, and one cell of height is one high-cube tier —
a standard and a high cube both cost one tier, which is how a real yard is
planned. A pad is `w × d` cells across and `h` tiers tall (`CY.YARD`,
overridden per mission).

This is not decoration: the occupancy grid in `js/grid.js` is the only thing
that decides where a box is. Meshes are drawn from it, never the reverse.

### Pieces

A piece is a **polycube** — a list of cell offsets. Containers are the boring
I-pieces (2, 4 and 5 cells long); crate bundles are the L, J, S, T, O and
genuinely-3D step/tower/corner shapes. Rotation is 90° steps **about the
vertical only**, so a container never gets stood on end and every piece has
at most four orientations. The authoritative list is `CY.PIECES` in
`js/config.js` — adding a piece is one entry there.

### Scoring

The score is one number, in cubic metres, and lower wins:

```
score = (spanX · 3.05) · (spanY · 2.90) · (spanZ · 2.60)  +  penalties
```

`spanX`/`spanZ` are the extents of what you placed; `spanY` is measured from
the ground, so a tower cannot score as if it floated. **Holes inside the box
are counted** — the cuboid does not care that they are empty, only how big it
has to be. That single fact is the whole game.

The HUD also shows cargo volume, packing percentage, TEU and laden mass, but
those are context, not the score.

### Hard rules — these refuse the placement

| Rule | Effect |
|---|---|
| Bounds & overlap | A cell is taken or it isn't. |
| Support ratio | A set fraction of a piece's underside must be carried (ground counts as full support). Missions dial this from 50% to 75%. |
| Tier ceiling | Nothing may reach above the mission's `maxTier`. |
| No-top pieces | Nothing may rest on a tank frame. |

If a queued piece has *nowhere* legal left, it is abandoned automatically and
charged as a penalty rather than deadlocking the run.

### Soft rules — these cost volume at the final audit

| Rule | Cost |
|---|---|
| A flagged 🚩 priority box ends up buried | +60 m³ |
| A reefer ends up with no open side for its plug | +45 m³ |
| A piece was abandoned | +120 m³ |

Soft rules are choices, not walls: burying a priority box to save a whole
tier can still be the right call. `CY.PENALTY` holds the numbers.

### Medals

Par is derived from the queue, never hand-written: the **theoretical floor**
is the queue's own cell count (a perfect pack with no holes), and gold /
silver / bronze are multiples of it (`CY.score.DEFAULT_PAR`). Bronze is the
unlock gate and is deliberately generous; gold is the challenge. A mission
whose shape mix genuinely cannot pack tight overrides the multipliers in its
own `par` block — and `tests.html` enforces that every mission stays
clearable by a greedy reference packer, so a queue edit cannot silently
strand a target.

### The campaign

Twelve missions in three chapters, linear: clear one with at least one star
and the next opens. Each introduces exactly one idea and then never explains
it again. `CY.missions` in `js/missions.js` is the catalogue; generated
queues are seeded off the mission id, so a mission is the same puzzle for
everyone.

### Sandbox

The original POC, kept: free choice from the full palette, place anywhere
legal, lift anything that has nothing on it, unlimited undo, live metrics,
weather, x-ray, the stress heatmap, the rail siding, and two drivable
machines — the reach stacker and the rail-mounted gantry crane. Both lift and
set down through the same occupancy grid, so neither can build a stack the
rules would refuse. No queue, no par, no medals.

## Controls

| | |
|---|---|
| Point & click | Drop the box on the hook where the green outline is |
| `R` / right-click | Rotate 90° (`Shift+R` the other way) |
| Arrows / `WASD` | Nudge the cursor a cell |
| `Space` / `Enter` | Drop |
| `Z` | Undo |
| Stacker mode | `WASD` drive, `Q`/`E` boom, `Space` lift & set down |
| Gantry mode | `W`/`S` rails, `A`/`D` trolley, `Q`/`E` hoist, `Space` lift & set down |

Touch: the first tap aims, the second commits.

## Architecture

Two layers with a hard line between them. **Everything above `audio` in the
list below is pure logic — no DOM, no THREE** — which is what makes
`tests.html` runnable headless. Logic talks to the UI through `CY.emit`,
never by touching it.

| Module | Owns |
|---|---|
| `config.js` | Every tunable number, the piece catalogue, grid ↔ world maths |
| `events.js` | The `CY.on` / `CY.emit` bus, the only logic→UI channel |
| `rng.js` | Seeded RNG, so generated queues are reproducible |
| `grid.js` | Occupancy, rotation, gravity, support, burial, plug access |
| `scoring.js` | Bounding volume, the audit, par and medals |
| `missions.js` | The mission catalogue and queue generation |
| `save.js` | Progress in `localStorage` (best score and stars per mission) |
| `state.js` | The game itself: modes, cursor, preview, place/undo, finish |
| `audio.js` | Procedural WebAudio — clunks, hydraulics, a continuous engine drone |
| `render-core.js` | Scene, camera, renderer, lights, the frame loop, disposal |
| `render-yard.js` | Apron, the marked pad, the tier cage, floodlight masts |
| `render-piece.js` | Piece meshes, the ghost preview, x-ray, heatmap, scene sync |
| `weather.js` | The five atmosphere presets |
| `vehicle.js` | The reach stacker |
| `crane.js` | The rail-mounted gantry crane |
| `train.js` | Rail siding and road trailer, and the sandbox "unload" |
| `input.js` | Every pointer and key, in one place |
| `ui.js` | Everything that writes to the DOM |
| `ui-bind.js` | Everything that turns a click into a `CY.game` call |
| `main.js` | Bootstrap, and the only file that knows the start-up order |

Namespace is `CY`. Load order is the `mods` array in `index.html`.
