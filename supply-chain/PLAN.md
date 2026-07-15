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
  ✅ Shipped in v1.7.0 as **truck yards** (settled the naming collision
  with customer DCs — see below).
- **C. Visuals**: stay abstract — sprites are out. But refresh the art
  direction: doesn't need to keep the current sci-fi glow look; explore
  a warmer/cleaner abstract style in a dedicated visual pass.
- **D. Priority order approved**: autosave → feedback → order-linking →
  fail state (with mode picker) → truck capacity → depots (B) →
  congestion → seeds → rest.

## Shipped

*(v1.8.0-v1.9.2 below were developed in parallel across two branches —
this one and another doing v1.5.0/v1.6.0 Build vs Inspect + the robot
chain, then a v1.7.0 for screen-edge arrows and a fullscreen toggle;
renumbered on merge to land after all of them in one consistent
sequence. No functional overlap, just repeated numbering collisions from
parallel work — see `js/config.js` `SC.VERSION` for the number that
actually shipped.)*

- v1.9.2: truck yards (decision B). HQ (⭐) is always a yard; more can be
  built via the Shop panel (not research-gated, price grows per yard like
  trucks do — reuses the manual-placement tap-to-place flow from v1.5.0).
  Buying a truck stations it at whichever yard is selected in a new Shop
  dropdown. Idle trucks with no work head back to their home yard.
  Dispatch was upgraded from "each truck grabs its own nearest job in
  array order" to true nearest-truck-to-job matching, repeated until no
  more idle trucks or jobs match — this is what actually makes a truck's
  home yard matter for which jobs it wins, closing a gap the old
  algorithm quietly had even before yards existed. Yard nodes render
  distinctly (🅿️, violet) with a live parked-truck count; HQ shows its
  own count too. Save format bumped to v3 (trucks[] now carries per-truck
  homeYard; old saves reset).
- v1.9.1: screen-edge arrows point toward unconnected nodes that are
  currently off-screen; a full-screen toggle was added to the menu.
- v1.9.0: three-tier robot chain (🟠copper+🛞rubber→🧵wire mill,
  🧵wire+💾chips→🔌circuit factory, 🔌circuit+🔩steel→🤖robot factory) —
  rubber, chips and steel are now each shared by two recipes, so one
  supplier's roads matter for more than one product. No planner changes
  needed; `economy.bestSourceFor`/`planUnit` were already generic over
  chain depth.
- v1.8.0: Build vs Inspect mode toggle (top right). Inspect: hover
  (mouse) or hold (touch, long-press) a node for a tooltip — a factory's
  inputs and their connected/unreachable status, a supplier's consuming
  factories, or a city's open orders — with the relevant roads glowing.
- v1.6.0: truck capacity upgrade. Trucks default to hauling one item, but
  the dispatcher now bundles any other pending job sharing the exact same
  pickup and drop onto the same trip, up to the truck's capacity; the
  Truck Capacity upgrade (Shop panel, 3 levels) raises that cap. Trucks
  hauling more than one item show a ×N badge. Truck state internally
  moved from a single `job`/`cargo` pair to `jobs[]`/`cargo[]` arrays
  (vehicles.js, save.js, render.js, ui.js all updated).
- v1.5.0: research tree (`SC.RESEARCH`, one project at a time, paid
  upfront + timed) with Site Requisition (unlocks manual placement below)
  and a stacking Credit Line II/III. Manual placement: pick a good in the
  Shop panel's Build section, tap the map to drop that supplier/factory
  anywhere on land at a premium, with a live green/red ghost preview.
  This is the "player-placed sites locked behind research, plus
  research-boosted credit line" ask — promotions (temporary demand
  boosts) are the natural next research node, not yet built.
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
4. ~~Truck capacity upgrade track~~ — shipped v1.6.0.
5. **Tutorialize the first order** — instead of only the text overlay:
   dim the map, arrow at HQ + nearest supplier, "build a road here". The
   overlay stays as reference.
6. ~~Interaction modes: Build vs Inspect~~ — shipped v1.8.0. Detail kept
   below for reference:
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
10b. **Promotions research** — a purchasable research node (or repeatable
    research-gated action) that temporarily boosts order frequency/payout
    for one chosen good, e.g. "+50% bread orders for 3 minutes". Lighter
    than Contracts (no locked-in rate/infrastructure commitment) and
    reuses the `research.js` machinery already in place — natural next
    entry in `SC.RESEARCH` once a design for repeatable (vs. one-shot)
    research is settled (the current tree assumes each id completes once).
11. **Factory specialization** — optional: assign a factory a single
    recipe for a crafting-speed bonus; generalists stay flexible.
12. ~~Deeper, shared supply chains~~ — shipped v1.9.0 (the 🟠🧵🔌🤖 chain,
    see Shipped above). Detail kept below for reference:
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
  `vehicles.dispatch()` (v1.9.2) went from O(idle+jobs) to a repeated
  global-nearest-match (worst case O(min(idle,jobs) × idle × jobs) per
  tick) to make yards' home-region preference actually work — still fine
  at current fleet sizes, but the first thing to optimize (or cache) if
  trucks/jobs both grow a lot.
- **Interaction tests** — drive `SC.input._handleTap` in tests.html
  (build/select/demolish/buy flows are currently only hand-tested).
- **Sound pass** — truck-departure blip, ambient loop, separate music/sfx
  toggles (pattern already in cargo-lander's audio.js).

## Open questions

None outstanding — A/B/C/D above are the settled answers to what used to
be open here. (Removed the old duplicate "Open questions" list that
predated those decisions and still asked A–D as unresolved with
now-stale item numbers.)
