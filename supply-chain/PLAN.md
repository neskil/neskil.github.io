# Supply Chain Tycoon — development plan (v1 → v2)

Status: **agreed 2026-07-15** (decisions below). Baseline is v1.0.0
(playable core loop: roads, trucks, orders, upgrades, milestone map
growth, pan/pinch camera).

## Decisions (owner review, 2026-07-15)

- **A. Fail state**: BOTH — mode picker at new-game: "Standard"
  (reputation hearts, game over) and "Zen" (endless, current behaviour).
- **B. Dispatch**: compromise — trucks get a **home depot**. HQ is
  the first depot; more can be built/bought later. Trucks belong to a
  specific depot, start from it, return to it when idle, and the player
  sets how many trucks are stationed at each depot. Dispatch stays
  automatic within that constraint (a truck only takes jobs, preferring
  ones near its home region). No per-route manual pinning.
  ⚠️ **Naming note**: "DC" is now taken — v1.3.0 introduced customer DCs
  (🏢, order-*placing* cities that unlock over time). Truck home depots
  need a different name when B is implemented (e.g. "truck depot" / "yard").
- **C. Visuals**: stay abstract — sprites are out. But refresh the art
  direction: doesn't need to keep the current sci-fi glow look; explore
  a warmer/cleaner abstract style in a dedicated visual pass.
- **D. Priority order approved**: autosave → feedback → order-linking →
  fail state (with mode picker) → truck capacity → depots (B) →
  congestion → seeds → rest.

## Shipped

- v1.4.0: credit line (spend to −$1,500; debt bleeds 10%/min interest,
  red HUD readout) so a cash crunch can't deadlock the early game; a
  proper ☰ menu (pauses the sim: stats, autosave status + Save now,
  sound, help, two-tap New game) replacing the three top-right icon
  buttons; extra save flushes on pagehide/beforeunload for mobile tab
  kills.
- v1.3.0: HQ (⭐) is the sole order-placing location at game start;
  customer DCs (🏢) unlock on their own independent timer (not tied to
  delivery milestones), so demand visibly expands beyond HQ over a
  session. Emoji icons now sit on a solid backing plate (bigger, no
  longer fighting node shapes/progress rings for legibility) on
  suppliers, factories, order bubbles, and truck cargo.
- v1.2.0: emoji goods tree (🌾💧→🍞, 🧶🛞→👟, 🪨⚫→🔩→+💾→🚗) with
  specialized factories (bakery, smelter, car/sneaker factory) and
  recursive multi-tier order planning; colors demoted to accents.
- v1.1.0: autosave/resume (+ restart button), money floaters at the
  point of spend/earn, tap an order row to jump to its city with the
  planned route highlighted.

## Phase 1 — Stickiness & feel (small, high-value)

1. ~~Autosave / resume~~ — shipped v1.1.0.
2. ~~Money & event feedback~~ — shipped v1.1.0.
3. ~~Order → map linking~~ — shipped v1.1.0 (tap an order row → route
   highlight). Generalized by item 6 below.
4. **Truck capacity upgrade track** — haul 2–3 items per trip; makes the
   shop more interesting and reduces late-game truck spam.
5. **Tutorialize the first order** — instead of only the text overlay:
   dim the map, arrow at HQ + nearest supplier, "build a road here". The
   overlay stays as reference.
6. **Interaction modes: Build vs Inspect** *(in progress — 2026-07-15)* —
   right now the map only has one gesture (tap-tap to build/demolish a
   road). Add a mode toggle in the top bar:
   - **Build** (current behaviour, default): tap-tap builds/demolishes
     roads, tap a for-sale site to buy it — unchanged.
   - **Inspect**: tapping doesn't build. Hovering (mouse) or holding
     (touch, long-press like the demolish-confirm gesture) a node opens
     an info tooltip and highlights the relevant roads, reusing/
     generalizing the order-route highlight overlay (`SC.state.highlight`)
     from item 3:
     - **Factory**: recipe + emoji, its inputs (raw or intermediate) with
       connected/unreachable status per input, distance if connected.
       Highlights the path(s) from the best-connected source(s) of each
       input up to this factory (recursing through intermediates, e.g.
       hovering the car factory lights up the smelter's own ore/coal
       roads too).
     - **Supplier**: which good it provides, and which active factories
       currently use that good, with connected/unreachable status per
       factory. Highlights the roads to the connected ones.
     - **City (HQ/DC)**: its open orders and their planned routes (same
       overlay `focusOrder` already draws, just triggered by hover
       instead of tapping the order row).
   - Pure logic (which nodes relate to which, path collection) lives in
     a new `js/inspect.js` next to economy.js/roads.js so it's headless
     testable; only the tooltip DOM/positioning and the mode-toggle
     button live in ui.js/input.js.

## Phase 2 — Strategic depth

7. **Fail state / difficulty ramp** — currently endless and consequence-free.
   Proposal: reputation hearts (start 5); each expired order costs one;
   0 = game over screen with stats + restart. Deadlines/order pace tighten
   as delivered count grows. (Alternative: keep endless "zen" mode as a
   toggle.)
8. **Road congestion** — per-edge speed drops when >N trucks are on it;
   rendered as the road glowing warmer. Rewards building parallel routes
   and ring roads instead of one mega-highway.
9. **River ferries** — a cheaper-but-slower alternative to bridges: build
   a dock pair, ferry shuttles on a fixed cadence (reuses the old sim's
   boat visual). Bridges = fast + expensive, ferries = cheap + queueing.
10. **Contracts** — occasional long-running deals: "3× green every 60s for
    5 minutes at a locked-in rate". Creates steady demand you can build
    dedicated infrastructure for.
11. **Factory specialization** — optional: assign a factory a single
    recipe for a crafting-speed bonus; generalists stay flexible.
12. **Deeper, shared supply chains** *(next up after item 6)* — today
    every raw good feeds exactly one recipe (wheat/water only ever make
    bread) and chains are at most 2 tiers deep (ore+coal→steel→+chips→
    car). Rework `SC.GOODS` so:
    - Some raw/intermediate goods are shared inputs across multiple
      recipes (e.g. a good feeds two different factories), so a single
      supplier's placement matters for more than one product and roads
      do double duty — this is the "resources used in multiple places"
      request.
    - At least one chain goes 3 tiers deep, for more multi-step planning
      and more interesting factory placement.
    - `SC.depthOf`, the recursive planner (`economy.bestSourceFor`/
      `planUnit`), and `SC.factories.canSource` are already
      recursive/generic over chain depth — this should mostly be new
      `SC.GOODS` entries plus map-gen pool changes, not planner surgery.
      Re-verify `ORDER_DEPTH_SLACK`/payout scaling still feels fair at
      depth 3.

## Phase 3 — Content & replayability

13. **Seeded worlds** — replace `Math.random` in map gen with a seeded
    PRNG; URL `?seed=x` shares a map; enables a "daily challenge".
    (Also makes generated-world tests deterministic — do this early if 7+
    lands, the fail state wants fair comparisons.)
14. **Stats & achievements screen** — deliveries per product, money
    curve, busiest road; milestones ("First bridge", "10-truck fleet").
15. **Bigger maps / regions** — after the map fills, unlock an adjacent
    region connected by a highway (new camera bounds, same state).

## Tech housekeeping (ongoing, fold into the above)

- **Seeded RNG module** (`js/rng.js`) — prerequisite for 13, helps tests.
- **Pathfinding cache** — Dijkstra runs per dispatch/planning tick; fine
  now (~30 nodes), cache distances keyed on a `networkVersion` counter
  before congestion (8) multiplies calls — inspect mode (6) adds more
  per-hover `bestSourceFor`/`pathDist` calls too, worth watching.
- **Interaction tests** — drive `SC.input._handleTap` in tests.html
  (build/select/demolish/buy flows are currently only hand-tested).
- **Sound pass** — truck-departure blip, ambient loop, separate music/sfx
  toggles (pattern already in cargo-lander's audio.js).

## Open questions

None outstanding — A/B/C/D above are the settled answers to what used to
be open here. (Removed the old duplicate "Open questions" list that
predated those decisions and still asked A–D as unresolved with
now-stale item numbers.)
