# Supply Chain Tycoon — development plan (v1 → v2)

Status: **agreed 2026-07-15** (decisions below); last synced with
shipped reality **2026-07-16 (v1.13.0)**. Baseline is v1.0.0 (playable
core loop: roads, trucks, orders, upgrades, milestone map growth,
pan/pinch camera).

## Decisions (owner review, 2026-07-15)

- **A. Fail state**: BOTH — mode picker at new-game: "Standard"
  (reputation hearts, game over) and "Zen" (endless, current behaviour).
  ✅ Superseded & shipped in v1.13.0 with a different design, per owner
  feedback that going negative felt too easy: instead of reputation
  hearts, the fail state is **loan default** (interest compounding the
  balance below the credit limit starts a grace countdown → bank
  forecloses), and the mode picker became four **difficulty presets**
  (Easy/Normal/Hard set interest rate, deadline multiplier, grace and
  starting money; **Sandbox** is the "Zen" endless mode — no interest,
  no foreclosure). Missed orders still only cost the payout and a
  "Missed" tally, not hearts.
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

- v1.18.0: **river ferries**. Per item 9 below — details there.
- v1.17.0: **road congestion**, feature-flagged. Per item 8 below —
  details there.
- v1.15.0-v1.16.0 (parallel branches, master): top-left corner UI
  consolidated into one pill (☰ + money/debt + idle trucks), Filled/
  Missed HUD tiles dropped (already in the ☰ menu's stats), back button
  moved into the menu, fast-forward toggle repositioned to avoid
  overlapping the Orders panel on phones.
- v1.14.0: **fast-forward + seeded worlds**. A 1×/2×/4× toggle under the
  HUD runs `speed` fixed-size sub-steps of `economy`/`factories`/
  `vehicles`/`research`.tick per animation frame (same dt each sub-step,
  so nothing desyncs at higher multipliers — just more simulated time
  per frame, not bigger/riskier steps); resets to 1× each session (not
  persisted, like `paused`). Seeded worlds per item 13 below.
- v1.13.0: **promotions + loan-default fail state + difficulty modes**.
  Marketing Blitz research unlocks a repeatable paid Shop action ($600 →
  45s of ~3× faster order arrivals and a higher order cap; the tech
  stays one-shot, the *action* repeats — this settled 10b's open
  "repeatable research" design question). Interest compounding the
  balance below the credit limit starts a persisted grace countdown
  (HUD `⚠ DEFAULT IN Ns`); running it out forecloses the run (game-over
  overlay, save wiped). Difficulty presets on the new-game screen —
  Easy 10%/min + full deadlines (the pre-1.13 tuning), Normal 15%/min +
  20% tighter deadlines (new baseline), Hard 20%/min + 35% tighter,
  Sandbox rich/no-interest/no-fail — fixed per run and saved.
- v1.12.0: four techs deepening the tree to 11 across 3 tiers (Premium
  Contracts +15% payouts → Regional Marketing, faster customer DCs;
  Bulk Logistics +2 capacity cap; Preservatives +25% deadlines);
  research effect fields made fully generic (additive `bonusSum`,
  multiplicative `customerSpawnMult`, cap-raising `upgradeMaxBonus`);
  truck reassignment (free "move an idle truck here" under the yard
  picker); order cap now scales +2 per active customer DC.
- v1.11.0: **supplier stock** (finite, regenerating, per-supplier
  upgradable cap/regen; trucks wait at a dry supplier in a 'loading'
  phase), **highways** (Asphalt Paving research + Upgrade mode paves a
  road; trucks 1.6× faster there, Dijkstra weighs travel time),
  **Upgrade mode** as a third mode button, per-yard truck price ladders
  (a new yard resets the price; yard price growth is the lever), +25%
  payout per chain tier, and four techs (Asphalt Paving → Overdrive
  Engines; Fertilizer Program → Factory Automation). Save format v4.
- v1.10.0: research got its own menu — the Shop keeps a one-line
  shortcut, the full tree lives in an overlay laid out by prerequisite
  tier with SVG dependency lines (green when the prereq is done).
- v1.10.1-and-around (parallel branches, master): New Game reset no
  longer silently undone by the unload autosave flush; forgiving touch
  tap threshold; corner-UI relayout (menu+HUD top-left, mode toggle
  bottom-right, back button into the menu).

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

7. ~~Fail state~~ — shipped v1.13.0 as loan default + difficulty
   presets (see Decision A above for how the design changed from the
   reputation-hearts proposal). Still open from this item: the
   **within-run difficulty ramp** (deadlines/order pace tightening as
   the delivered count grows — each run is currently flat), and
   whether missed orders should carry any penalty beyond the lost
   payout. Revisit together with the deferred faster-milestone
   research (README backlog).
8. ~~Road congestion~~ — shipped v1.17.0, reusing exactly the highway
   plumbing this item predicted: `edge.level`'s `speedMult` gained a
   `congestionMult` factor (`SC.vehicles.truckCountOnEdge` beyond
   `CONGESTION_THRESHOLD` slows an edge multiplicatively, floored at
   `CONGESTION_FLOOR`), read live by both truck movement and Dijkstra's
   weighting, so dispatch actually prefers a quieter parallel road. A
   busy road glows warmer (`render.drawRoads`). Shipped as a **feature
   flag** (`SC.state.congestionEnabled`) per the owner's request: on by
   default for Normal/Hard, off for Easy/Sandbox, toggle anytime from
   the ☰ menu regardless of difficulty.
9. ~~River ferries~~ — shipped v1.18.0, scoped down from the original
   "dock pair + fixed-cadence shuttle" proposal to an edge-level
   alternative chosen at build time (Shop panel toggle): a road across
   the river builds as `edge.ferry` instead of a bridge — `FERRY_COST_MULT`
   cheaper than `BRIDGE_MULT`, but `FERRY_SPEED_MULT` slower, can't be
   paved into a highway. No new node kind or scheduling clock — the
   "queueing" half of the ask is congestion (if enabled) applying to a
   ferry edge same as any other, which reads as trucks queueing for the
   boat without a separate queue simulation. A boat emoji shuttles back
   and forth along the crossing for the promised visual, short of a full
   dock/sprite treatment (that's Decision C's dedicated visual pass).
10. **Contracts** — occasional long-running deals: "3× green every 60s for
    5 minutes at a locked-in rate". Creates steady demand you can build
    dedicated infrastructure for.
10b. ~~Promotions research~~ — shipped v1.13.0 as Marketing Blitz: a
    one-shot tech unlocking a *repeatable paid Shop action* (global
    demand burst), which settled the repeatable-research question
    without touching the one-shot tree. Remaining refinement if wanted:
    targeting a **chosen good** ("+50% bread orders") instead of all
    demand — the original per-good idea from this item.
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

13. ~~Seeded worlds~~ — shipped v1.14.0: `js/rng.js` (xmur3 + mulberry32,
    the "Seeded RNG module" from Tech housekeeping below) replaced every
    `Math.random` call in `map.js`'s world generation (river shape, node
    placement); `SC.map.generateWorld(seed)` takes an optional seed and
    records it on `SC.state.seed`. `?seed=xyz` on a fresh game reproduces
    that exact map; the pause menu shows the current seed and copies a
    shareable `?seed=` link on tap. Gameplay randomness (order contents/
    timing, customer-DC spawn jitter) intentionally stays on `Math.random`
    — only the map layout is reproducible, not a full deterministic
    replay. "Daily challenge" (share today's date as the seed) and
    generated-world test determinism are still open follow-ups.
14. **Stats & achievements screen** — deliveries per product, money
    curve, busiest road; milestones ("First bridge", "10-truck fleet").
15. **Bigger maps / regions** — after the map fills, unlock an adjacent
    region connected by a highway (new camera bounds, same state).

## Tech housekeeping (ongoing, fold into the above)

- ~~Seeded RNG module~~ (`js/rng.js`) — shipped alongside 13 above.
- ~~Generic research effects~~ — done in v1.12 (`bonusSum` /
  `customerSpawnMult` / `upgradeMaxBonus`): a new tech is one config
  entry, no new accessor code.
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
