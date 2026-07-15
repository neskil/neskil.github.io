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

1. **Autosave / resume** — persist `SC.state` to localStorage every few
   seconds and on tab close; "Continue" vs "New game" on the help screen.
   Without it every reload wipes progress, which caps session length.
   Needs a serializer (nodes/edges/orders hold object refs → save by id).
2. **Money & event feedback** — floating "+$450" at the city on payout,
   red "−$180" when building, brief camera-shake-free flash on expiry.
   Cheap to do in render.js, big juice payoff.
3. **Order → map linking** — tap an order row to pan/zoom to its city;
   highlight the planned route (city ↔ factory ↔ suppliers) while held.
   Makes "no route!" self-explanatory.
4. **Truck capacity upgrade track** — haul 2–3 items per trip; makes the
   shop more interesting and reduces late-game truck spam.
5. **Tutorialize the first order** — instead of only the text overlay:
   dim the map, arrow at HQ + nearest supplier, "build a road here". The
   overlay stays as reference.

## Phase 2 — Strategic depth

6. **Fail state / difficulty ramp** — currently endless and consequence-free.
   Proposal: reputation hearts (start 5); each expired order costs one;
   0 = game over screen with stats + restart. Deadlines/order pace tighten
   as delivered count grows. (Alternative: keep endless "zen" mode as a
   toggle.)
7. **Road congestion** — per-edge speed drops when >N trucks are on it;
   rendered as the road glowing warmer. Rewards building parallel routes
   and ring roads instead of one mega-highway.
8. **River ferries** — a cheaper-but-slower alternative to bridges: build
   a dock pair, ferry shuttles on a fixed cadence (reuses the old sim's
   boat visual). Bridges = fast + expensive, ferries = cheap + queueing.
9. **Contracts** — occasional long-running deals: "3× green every 60s for
   5 minutes at a locked-in rate". Creates steady demand you can build
   dedicated infrastructure for.
9b. **Promotions research** — a purchasable research node (or repeatable
   research-gated action) that temporarily boosts order frequency/payout
   for one chosen good, e.g. "+50% bread orders for 3 minutes". Lighter
   than Contracts (no locked-in rate/infrastructure commitment) and
   reuses the `research.js` machinery already in place — natural next
   entry in `SC.RESEARCH` once a design for repeatable (vs. one-shot)
   research is settled (the current tree assumes each id completes once).
10. **Factory specialization** — optional: assign a factory a single
    recipe for a crafting-speed bonus; generalists stay flexible.

## Phase 3 — Content & replayability

11. **Seeded worlds** — replace `Math.random` in map gen with a seeded
    PRNG; URL `?seed=x` shares a map; enables a "daily challenge".
    (Also makes generated-world tests deterministic — do this early if 6+
    lands, the fail state wants fair comparisons.)
12. **Stats & achievements screen** — deliveries per product, money
    curve, busiest road; milestones ("First bridge", "10-truck fleet").
13. **Bigger maps / regions** — after the map fills, unlock an adjacent
    region connected by a highway (new camera bounds, same state).

## Tech housekeeping (ongoing, fold into the above)

- **Seeded RNG module** (`js/rng.js`) — prerequisite for 11, helps tests.
- **Pathfinding cache** — Dijkstra runs per dispatch/planning tick; fine
  now (~30 nodes), cache distances keyed on a `networkVersion` counter
  before congestion (7) multiplies calls.
- **Interaction tests** — drive `SC.input._handleTap` in tests.html
  (build/select/demolish/buy flows are currently only hand-tested).
- **Sound pass** — truck-departure blip, ambient loop, separate music/sfx
  toggles (pattern already in cargo-lander's audio.js).

## Open questions (answer inline)

- **A. Fail state or endless?** Hearts/game-over (6) vs endless score
  chase — or both via a mode picker?
- **B. Dispatch control**: keep fully automatic dispatch, or add opt-in
  manual control (e.g. pin a truck to a route, Mini-Metro-line style)?
  Manual control is a big design fork — worth deciding before Phase 2.
- **C. Visual direction**: stay abstract (shapes/glow, current look) or
  move toward tiny sprites (buildings, truck art)?
- **D. Priorities**: suggested order is 1 → 2 → 3 → 6 → 4 → 7 → 11 → …
  — reorder as you see fit.
