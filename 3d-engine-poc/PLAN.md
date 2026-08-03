# Yard Master — turning the 3D POC into a game

This is the design + roadmap document for `3d-engine-poc/`. The POC shipped as a
sandbox: spawn containers, drive a reach stacker, change the weather. Fun to look
at, but there was nothing to *win*. This document describes the game that grows
out of it, and the file architecture that lets it be built incrementally without
another rewrite.

Read `README.md` for the "what is where" reference. This file is the "why".

---

## 1. The pitch

**3D Tetris for shipping containers.** A manifest of cargo arrives in a fixed
order. You have a marked yard bay. Every unit has to go somewhere, and it has to
obey the rules of a real terminal — supported from below, within crane reach,
hazmat separated, and nothing buried that leaves before the thing on top of it.

When the manifest is empty, the yard is measured. **The score is the volume of
the smallest box that contains everything you stacked.** Sprawl is expensive.
Air pockets are expensive. Lowest envelope wins.

That single scoring rule is what makes it a game rather than a toy: it is
unambiguous, it is computed from geometry the player can see, and there is always
an obviously better answer you didn't find.

## 2. The scoring rule, precisely

After the last unit is placed, take the axis-aligned bounding box of every
occupied grid cell:

```
envelope = (spanX · CELL_X) · (spanZ · CELL_Z) · (spanTiers · TIER_H)   [m³]
```

`spanX`/`spanZ`/`spanTiers` are counted in **cells**, from the extreme occupied
coordinates — so an outlier container parked three slots away from the pile
inflates the envelope for every tier, which is exactly the punishment we want.

**Par** is derived from the manifest, never hand-tuned:

```
par = (total footprint cells of all units) · CELL_X · CELL_Z · TIER_H
```

That is the volume of a hypothetical perfect pack with zero wasted slots. It is
usually unreachable — which is the point; par is the asymptote, medals are the
achievable band around it.

| Medal | Default threshold |
| --- | --- |
| 🥇 Gold | envelope ≤ par × 1.10 |
| 🥈 Silver | envelope ≤ par × 1.30 |
| 🥉 Bronze | envelope ≤ par × 1.60 |

Missions can override the multipliers. Because par is computed, **adding a
mission is a data-only change** — no balancing pass, no magic numbers.

Secondary stats shown on the scorecard (not ranked, just for flavour and
teaching):

- **Slot efficiency** — `occupiedCells / envelopeCells`, i.e. how much of your
  bounding box is actually cargo.
- **Cargo volume / TEU / mass** — the real-world numbers, carried over from the
  POC's HUD.
- **Moves used** and **undos**.

## 3. Grid model

Containers are not free-floating; they live in a lattice. This is what makes the
puzzle legible and makes legality checks cheap.

- Cell footprint: **3.05 m × 3.05 m**. Chosen so ISO lengths land on integers —
  a 20ft (6.06 m) is 2 cells, a 40ft (12.19 m) is 4 cells. The 0.6 m slack across
  the 2.44 m width reads as the walking aisle a real yard has.
- Tier height: **2.90 m** — one 40ft high-cube. Every unit occupies exactly one
  tier, so the vertical axis stays integral.

Cargo catalogue (footprint in cells, `X × Z` at rotation 0):

| Type | Cells | Notes |
| --- | --- | --- |
| `10ft` | 1 × 1 | The filler piece. Fits the gaps nothing else fits. |
| `20ft` | 2 × 1 | The workhorse. |
| `40ft` | 4 × 1 | Long. Awkward. Wants to be placed early. |
| `crate` | 2 × 2 | Out-of-gauge breakbulk. The only square piece. |
| `tank` | 2 × 1 | Tank container — **nothing may be stacked on it**. |
| `pallet` | — | Sandbox prop only, not a grid piece. |

Rotation is 90° swaps of the footprint. The grid API takes an arbitrary **cell
mask**, not a width/height pair, so L-shaped and stepped pieces can be added
later without touching the placement code.

**Gravity is real.** A unit dropped at `(x, z)` comes to rest one tier above the
highest occupied cell under its footprint. You cannot place into a pocket that
its own footprint can't reach — no cheating an overhang into existence.

## 4. Rules (the difficulty knobs)

Rules are declared per mission as strings like `'support:1'`. They are pure
functions of (grid, piece, position) and each returns a human-readable reason
when it fails, which is what the HUD shows under the cursor. Adding a rule is one
entry in `core/rules.js` plus one string in a mission.

| Rule | Meaning |
| --- | --- |
| `support:<ratio>` | Fraction of the footprint that must rest on something. `1` = full support, `0.5` = cantilever allowed. |
| `maxTier:<n>` | Crane reach. No stacking above tier `n`. |
| `noTopLoad` | Nothing may be placed on a unit flagged `noTopLoad` (tanks, flatracks). |
| `heavyBelow` | A unit may not sit on anything lighter than itself. |
| `hazmatGap` | Two hazmat units may not share a face on the same tier. |
| `reeferEdge` | A reefer needs at least one cell on the bay perimeter — it has to reach a power point. |
| `departureOrder` | Nothing may be stacked over a unit that leaves earlier. This is the rule that turns packing into planning. |

`departureOrder` is the interesting one. Units carry a departure day; the
manifest arrives in random order; you have to build the pile so the Monday cargo
is still diggable on Monday. It is the mechanic that makes a *logistics* game out
of a *packing* game, and it is why the campaign saves it for the back half.

## 5. Mode structure

**Campaign (line missions)** — an ordered chain. Each mission unlocks the next on
any medal. Bay grows, manifest lengthens, one new rule at a time:

| # | Mission | Bay | Introduces |
| --- | --- | --- | --- |
| 1 | First Shift | 4×3×3 | Placement, gravity, envelope scoring |
| 2 | Long Boxes | 6×3×3 | 40ft units, rotation matters |
| 3 | Reach Limit | 5×4×2 | `maxTier` — you must spread, not tower |
| 4 | Out of Gauge | 5×4×3 | `crate` 2×2 pieces |
| 5 | Top Heavy | 5×4×4 | `heavyBelow` |
| 6 | No Top Load | 5×4×4 | `tank` units, `noTopLoad` |
| 7 | Cold Chain | 6×4×4 | `reeferEdge` |
| 8 | Dangerous Goods | 6×4×4 | `hazmatGap` |
| 9 | Monday Sailing | 6×4×4 | `departureOrder` |
| 10 | Mixed Traffic | 7×5×4 | Everything, longer manifest |
| 11 | Tight Bay | 5×4×5 | Narrow footprint, tall stacking |
| 12 | Yard Master | 8×5×5 | Full rule set, 28 units |

**Sandbox** — the POC, preserved and unrestricted: free spawn, weather, X-ray,
heatmap, train unloading, and two drivable machines — the reach stacker and the
rail-mounted gantry crane, which spans the tracks and can lift a container
straight off a flatcar. Only one holds the keyboard at a time. No grid, no
placement rules.

**Contracts** — an optional layer on top of sandbox, and the one place the game
has an economy. Timed delivery orders name a zone on the apron and a payout;
move cargo into it before the clock runs out and you are paid, miss it and you
lose capital and reputation. Earnings buy machine upgrades. Cargo already parked
in a zone when the order lands is discounted — an order has to be *delivered*.

It stays deliberately separate from the campaign's envelope score: one rewards
speed and hauling, the other rewards deliberation and geometry. Mixing them
would make both worse.

**Daily / seeded run** *(roadmap)* — the same manifest for everyone on a given
date, derived from `seedFromDate()`. The deterministic manifest generator is
already in place for exactly this.

## 6. Feel and feedback

The things that make it read as a game rather than an editor:

- **Ghost preview.** The piece under the cursor is rendered translucent at the
  tier it would land on, tinted green or red, with a drop shadow column to the
  floor so you can read its footprint from any camera angle.
- **Rejection is explained.** When a placement is illegal the HUD names the rule
  ("40ft would bury a Tue departure"), it does not just refuse.
- **Undo.** `Z` pops the last unit back onto the queue. Puzzle games without undo
  are hostile; the score already punishes bad play.
- **The queue is visible.** Next three units, with type, traits and departure
  day. Lookahead is the difference between a puzzle and a lottery.
- **The envelope is drawn live.** A wireframe box around the current stack that
  grows when you sprawl. The player sees the score being made.
- **Medal reveal.** Scorecard with envelope vs par, the medal, and the delta to
  your previous best.

## 7. Architecture, and why it's shaped this way

The POC was seven files in a flat `js/` folder, each one reaching into the
others through a shared `window.Cargo3D` bag. That was fine for a POC and would
have become unworkable by mission 3. The restructure follows one rule:

> **`core/` never mentions THREE.**

Everything that decides *what is true* — where a container can go, whether a rule
is satisfied, what the envelope volume is, what the manifest contains — is plain
data and plain functions. Everything that decides *what it looks like* lives in
`render/`. `game/` owns the loop and the input, `ui/` owns the DOM, `missions/`
is data.

The payoff is concrete:

- **`tests.html` can test the whole game's logic** by loading five small scripts
  and no WebGL context. Grid, gravity, support, every rule, scoring, medals and
  manifest determinism are all unit-testable, offline, over `file://`.
- **A rendering change cannot break the rules**, and a rule change cannot break
  the rendering.
- **Missions are data**, so the campaign can grow without code.
- Solvers, replays, and an AI opponent all become possible later, because the
  game state is a serializable object rather than a scene graph.

Load order matters (plain `<script>` tags, no bundler, per house style):
`vendor → core → missions → render → game → ui → app`.

## 8. Roadmap

**Shipped in this pass**
- `core/` logic layer, fully unit-tested
- Campaign with 12 line missions, computed par, medals, localStorage progress
- Grid placement with gravity, ghost preview, rotation, undo
- Live envelope wireframe, mission HUD, queue lookahead, scorecard
- Sandbox mode preserved with all POC toys, plus the gantry crane and the
  contracts economy folded into the new architecture
- Landing-page card rewritten, wired to campaign progress

**Next**
- Replay/share: serialize the placement list, replay it on load from a URL hash
- Daily seeded run + local leaderboard
- Reach stacker as an optional *manual* placement mode in campaign (drive the
  unit into position instead of clicking) — the vehicle code is already there
- Solver for a true par (branch-and-bound over the manifest) to replace the
  perfect-pack idealisation
- Non-rectangular pieces (the grid already accepts arbitrary cell masks)
- Touch controls and a mobile layout

**Deliberately not doing**
- Physics simulation. Toppling stacks would be spectacular and would make the
  puzzle unreadable. The support rules encode the same intent, legibly.
- Real-time pressure in the campaign. The fun here is deliberation. If a timed
  variant is wanted it belongs in a separate mode, not bolted onto missions.
