# Supply Chain Tycoon — development plan (v1 → v2)

Status: **agreed 2026-07-15** (decisions below); last synced with shipped
reality **2026-07-25 (v1.57.0)**. Baseline is v1.0.0 (playable core loop:
roads, trucks, orders, upgrades, milestone map growth, pan/pinch camera).

This file owns the roadmap: the Shipped log, the phased items (all of
1-16 have now landed), and **Phase 4**, the unbuilt backlog. New ideas go
in Phase 4 — not in README.md, which now just points here. See
[CLAUDE.md](CLAUDE.md) for which doc owns what.

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

- v1.63.0: **six new goods, no new raw materials** — 🛞tyres (rubber+coal)
  and 🧣textiles (wool+water) as intermediates, feeding 🚲bicycles
  (tyre+steel), 🧥jackets (cloth+rubber), 🔋batteries (copper+coal) and
  🛵e-scooters (tyre+battery, the first recipe whose input is itself an
  orderable product). Orderable goods go 4 → 8. Deliberately built from the
  existing eight raws, so coal is now wanted by the smelter, the tyre plant
  and the battery plant at once, water by the bakery and the textile mill:
  running several chains means planting *more of the same suppliers*, and
  the milestone pool interleaves those extra sites with the new factories.
  The start screen's Production Recipes graph is now laid out from
  `SC.GOODS` instead of a hand-written position table that silently dropped
  anything missing from it.
- v1.62.1: **research tree readable on mobile** — the overlay used to shrink
  the whole tree to fit a phone's width, bottoming out at 0.62 and putting the
  description text at ~7px, with no way to zoom in (the page is
  `user-scalable=no`, since the map canvas owns pinch). It now opens at 1:1
  with phone-sized cards and larger type, and carries its own zoom: pinch
  inside the tree, ± / ⤢ buttons in the header, ctrl-wheel on desktop, all
  anchored so the point under the gesture stays put. Zooming out reaches a
  whole-tree overview however wide the tree grows. Rows are also pitched off
  the measured card heights per row instead of one worst-case constant, so the
  tree is considerably shorter and the edges leave from real card bottoms.
  Covered by `research-zoom-check.html` (see CLAUDE.md → Verification).
- v1.61.2: **ground quality — biome-driven supplier yield** — a supplier's
  regen is now multiplied by the biome band under it (`BIOME_BANDS` ×
  `BIOME_YIELD`, per material) plus a small per-site roll
  (`SITE_YIELD_VARIANCE`), so crops thrive on green ground and struggle in
  sand while mines read the same map the other way. The biome field moved
  out of `render-env` into `state.js`, so the tint you see and the
  multiplier you get come from one seeded source — the map is now the
  legend for where to build and which site is worth upgrading. Inspect a
  supplier for its band, yield % and units/sec. Derived from position +
  seed, so it needs no save-format change and travels with `?seed=`.
- v1.61.1: **upgraded suppliers grow on the ground, not just upward** — a
  supplier level now widens its plot (`SITE_FW_PER_LEVEL`) as well as
  raising the model, and each site's art fills the extra ground: furrow
  count tracks the field width, a rubber grove plants another tree per
  level, farm and pasture gain a second barn from level 2. Same idea as a
  yard's parking lot growing with the fleet homed there — what you spent
  on a site is legible from across the map, not only in the ▲ pips.
- v1.61.0: **Traffic & Bottleneck Heatmap + Dijkstra Pathfinding Caching** —
  added a dedicated Heatmap mode button (`🔥`) that visualizes road usage and
  truck throughput with dynamic color gradients (Green → Yellow → Red glow),
  midpoint bottleneck warning badges (`⚠️`), and interactive edge traffic stats;
  implemented Dijkstra path memoization in `roads.js` keyed by `networkVersion` and
  traffic distribution.
- v1.57.1: **the overlap rules explain themselves on the map** — the build
  ghost marks the site it would run over (clearance ring + ✕) or lights the
  road it can't cross red, and draws the legal alternative in green beside
  it (the two hops through that site, or the ends of the road in the way);
  a legal crossing rings and prices each interchange it would build. Help
  overlay gained a "Roads can't overlap" entry. Per v1.56.0 below.
- v1.56.0: **road overlap rules** — a road may no longer be laid over the
  top of the network: it can't brush past a site it doesn't connect to
  (`NODE_ROAD_CLEARANCE`), and it can't cross another road until the
  early **Road Crossings** research, after which each crossing builds a
  paid **interchange** (a junction node splitting both roads). Late-game
  maps had degenerated into a cat's cradle of map-long diagonals drawn
  straight over everything; now the geometry has to be planned, junctions
  earn their keep, and the crossings research does what its name says.
  See README "Overlap rules". A region's free connector highway (Item 15
  below) obeys the same rules — it routes clear of other sites and gets
  free interchanges where it crosses a road.
- v1.57.0: **Remaining Gameplay & Strategic Depth**:
  - Within-Run Difficulty Ramp (Item 7): Order deadlines and spawn intervals tighten progressively as total delivered orders increase.
  - Targeted Promotions (Item 10b): Marketing Blitz allows selecting a specific product target (or all products) for focused demand bursts.
  - Factory Specialization (Item 11): Players can specialize a factory into a single recipe for a 1.5× crafting speed bonus, while generalists stay flexible.
  - Bigger Maps & Regions (Item 15): Delivery milestones unlock adjacent regions connected by paved highways with expanded camera bounds and unified economy.
- v1.56.0: **Late-delivery penalty** — regular orders expiring undelivered now charge a monetary fine scaling with difficulty (`orderPenaltyMult`: Sandbox 0x, Easy 0.1x, Normal 0.3x, Hard 0.5x) and proportional to missing units / payout value.
- v1.37.0: **Stats & Achievements screen** (☰ menu) — deliveries per
  product, a money-over-time sparkline, busiest road by trip count, and
  nine milestone badges. Per item 14 below — details there.
- v1.34.0: **junction visual is now a roundabout**, not a `🔀`-badged
  box. Per item 16 below — details there. Also dropped the ferry's
  shuttling ⛴ boat glyph — it rendered as an unstyled black fallback
  glyph on some Android emoji fonts, and the teal dashed lane already
  reads as "ferry" without it.
- v1.32.0: **junctions** — a placeable routing waypoint (Shop panel,
  flat price, not research-gated) with no supply/demand of its own, so
  roads can fork/merge/reroute through it. Per item 16 below — details
  there.
- v1.30.0: **bridges and ferries render over just the water**, not the
  whole road — a real piered/lifted deck for a bridge, a confined
  teal lane + boat for a ferry. Per item 9 below — details there.
- v1.27.0: **Dev tools panel is now a lasting ☰-menu toggle**
  ("🛠 Dev tools: on/off", persisted in localStorage like Sound), not
  just a `?dev=1` URL flag to retype every visit — the flag still works
  too, adopting itself as the persisted choice. Per item 8 below —
  details there.
- v1.24.0: **Dev tools panel** (`?dev=1`) grows from a single congestion
  pill into a small collapsible panel: FPS readout, Add money, Roll
  contract, Finish research, Spawn next customer. Per item 8 below —
  details there.
- v1.23.0: **congestion is difficulty-only**; the ☰-menu toggle is gone,
  replaced by a `?dev=1` dev-only A/B panel. Per item 8 below — details
  there.
- v1.20.0: **river-crossing choice modal** replaces the ferry build-mode
  toggle. Per item 9 below — details there.
- v1.19.0: **contracts**. Per item 10 below — details there.
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
parallel work — see the `window.SC_VERSION` token at the top of
`index.html` (mirrored into `SC.VERSION`) for the number that actually
shipped.)*

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
5. ~~Tutorialize the first order~~ — shipped v1.55.0, as scoped: the help
   overlay stays as reference, and a fresh run now also gets a four-step
   guided walkthrough (`js/tutorial.js`) that dims the map, rings + arrows
   the nodes each step names, and captions the exact next tap in a banner.
   Steps are written as **goals rather than actions** and re-checked on the
   events that can satisfy them (`roadBuilt`/`roadDemolished`/
   `orderComplete`) instead of being advanced by the taps that caused them —
   so a single road can retire two steps at once, and the sequence can't
   desync from the world. `SC.state.tutorialStep` persists so a reload
   resumes mid-sequence; −1 means finished or skipped, which is also what a
   pre-tutorial save restores as, so an existing run is never dropped into
   step 1. Skippable from the banner. Dev: `&tutorial=N`.
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

7. ~~Fail state & difficulty ramp~~ — shipped v1.13.0 as loan default + difficulty presets. Within-run difficulty ramp shipped v1.57.0 (tightens order deadlines and spawn intervals as total delivered count increases).
8. ~~Road congestion~~ — shipped v1.17.0, reusing exactly the highway
   plumbing this item predicted: `edge.level`'s `speedMult` gained a
   `congestionMult` factor (`SC.vehicles.truckCountOnEdge` beyond
   `CONGESTION_THRESHOLD` slows an edge multiplicatively, floored at
   `CONGESTION_FLOOR`), read live by both truck movement and Dijkstra's
   weighting, so dispatch actually prefers a quieter parallel road. A
   busy road glows warmer (`render.drawRoads`). Shipped as a **feature
   flag** (`SC.state.congestionEnabled`) per the owner's request: on by
   default for Normal/Hard, off for Easy/Sandbox. v1.17.0-v1.22.0 also
   exposed a live ☰-menu toggle so any run could override the default;
   v1.23.0 removed that player-facing toggle — congestion is now purely
   a difficulty trait, fixed for the run like interest rate or deadlines
   — and replaced it with a `?dev=1` dev-only panel (a pill under the
   top-left HUD bar) that flips `congestionEnabled` live for the owner's
   own A/B comparison during development, not for normal play. v1.24.0
   grew that pill into a full collapsible **Dev tools** panel (FPS
   readout + Add money / Roll contract / Finish research / Spawn next
   customer, alongside the congestion toggle) per the owner's request
   for "a dev menu with some settings for game tuning and other stuff."
   v1.27.0 made it a lasting ☰-menu toggle (persisted in localStorage
   like Sound) instead of only a `?dev=1` flag to retype each visit, per
   the owner's follow-up: "I want the dev menu each time in the main
   menu."
9. ~~River ferries~~ — shipped v1.18.0, scoped down from the original
   "dock pair + fixed-cadence shuttle" proposal to an edge-level
   alternative: a road across the river builds as `edge.ferry` instead
   of a bridge — `FERRY_COST_MULT` cheaper than `BRIDGE_MULT`, but
   `FERRY_SPEED_MULT` slower, can't be paved into a highway. No new node
   kind or scheduling clock — the "queueing" half of the ask is
   congestion (if enabled) applying to a ferry edge same as any other,
   which reads as trucks queueing for the boat without a separate queue
   simulation. v1.18.0 shipped a boat emoji shuttling along the crossing
   for the promised visual; v1.34.0 dropped it (it rendered as an
   unstyled black fallback glyph on some Android emoji fonts, and the
   teal dashed lane reads as "ferry" on its own). v1.18.0 chose the ferry
   at build time via a persistent Shop panel toggle; v1.20.0 replaced
   that with a `crossingChoice` modal that pops up in context the moment
   a tapped road actually crosses the river (Bridge vs. Ferry, costs
   shown live) — the toggle needed remembering to flip on/off around
   each crossing, which the owner found convoluted. v1.30.0 reworked the
   *visual* per the owner's request ("should be an actual bridge over
   the water or the ferry should be a object and only during the water
   part, road up until the water edge"): the old style dashed the
   *entire* edge to suggest a crossing; now `SC.map.riverCrossing` finds
   just the water fraction of the edge (sampled like
   `segmentCrossesRiver` but returning where, not just whether), so
   `render.js` draws ordinary road on both banks right up to the
   water's edge, then only over the water: a ferry's teal dashed lane +
   boat (`drawFerryCrossing`), or an actual lifted deck on piers with a
   water shadow and guard rails for a bridge (`drawBridgeCrossing`).
10. ~~Contracts~~ — shipped v1.19.0, scoped to reuse the existing order
    machinery instead of a parallel demand system: `rollContractOffer`
    proposes a bulk deal (bigger `qty`, `CONTRACT_RATE_BONUS` premium
    per-unit rate) on its own clock; the player Accepts or Declines a
    non-blocking card within `CONTRACT_OFFER_EXPIRE`. Accepting
    (`acceptContract`) turns the offer into a regular order flagged
    `contract: true`, planned/delivered/paid through the normal pipeline.
    The owner's requested twist — "penalty if you miss it" — lives in
    `expireOrder`: a missed contract charges `CONTRACT_PENALTY_MULT ×
    missingUnits × perUnitRate` on top of the miss, scaled so a
    near-complete contract stings less than an untouched one; a normal
    order still misses for free. One contract (offer or active) at a
    time.
10b. ~~Promotions research~~ — shipped v1.13.0 as Marketing Blitz. Refined in v1.57.0 to allow targeting a chosen good (e.g., "+50% bread orders") or all products.
11. ~~Factory specialization~~ — shipped v1.57.0: players can assign a factory a single recipe for a 1.5× crafting speed bonus while generalists stay flexible.
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
14. ~~Stats & achievements screen~~ — shipped v1.37.0, exactly as scoped:
    deliveries per product, a money curve (sparkline), busiest road (by
    total truck trips), and nine milestone badges including "First
    Bridge" and "10-Truck Fleet". New `js/stats.js` is purely
    observational — it listens to events other modules already emit
    (`roadBuilt`, `roadUpgraded`, `sitePlaced`, `truckBought`,
    `researchComplete`, `orderComplete`, `debtRecovered`) rather than
    being called directly, so nothing else needed to change to wire it
    up. Road-trip counts ride on `edge.trips` the same way `level`/
    `ferry` already do, so they persist via `save.js` for free. Opened
    from a new "📊 Stats & Achievements" row in the ☰ menu.
15. ~~Bigger maps / regions~~ — shipped v1.57.0: delivery milestones unlock adjacent regions connected by paved highways with expanded camera bounds and unified economy.
16. ~~Junctions~~ — shipped v1.32.0, per the owner's request for "a
    connection node, at a cost, so you can route traffic": a `'junction'`
    node kind that's a plain routing waypoint, placeable anywhere
    placement rules allow (Shop panel, not research-gated — same
    base-mechanic reasoning as yards) at a flat `PLACEMENT_JUNCTION_PRICE`
    ($400). No new pathfinding — `SC.roads.findPath`'s Dijkstra already
    walks `node.edges` generically, so a junction just sits in the graph
    as a fork/merge/reroute point; it's invisible to the economy since
    `bestSourceFor`/`activeCities`/`factories.all` all filter by an
    explicit kind, never a junction. No growth ladder like yards get:
    since any path through a junction is never shorter than a direct
    road, there's no cost-reduction exploit to price against, so a flat
    price is enough. Originally rendered as a small flat `🔀`-badged
    marker; v1.34.0 replaced it with an actual roundabout (asphalt ring,
    dashed lane guide, planted center island — `drawJunction`) per the
    owner's "the junction marker is ugly, can't it be a roundabout
    instead" — no icon needed since the shape itself reads as what it is.

## Phase 4 — Unbuilt backlog

Items 1-16 above are all shipped, so this is where the live backlog
lives. (Moved here from README.md's old "TODO backlog", which had drifted
into claiming shipped features were unbuilt.)

**Gameplay**

- Curved / waypoint roads instead of straight node-to-node polylines.
- Touch: long-press as an alternative to double-tap for demolish/buy —
  the Inspect-mode hold gesture already uses the same long-press
  primitive.
- Research cancel/refund — a started project currently can't be aborted.
- Faster-milestone research (unlock a site every 2 deliveries instead of
  3). Considered for v1.12 and deferred: milestone pace is the main
  faucet controlling map growth, and cheapening it risks flooding the
  midgame with sites. Now that the within-run ramp (item 7) has shipped,
  it's worth revisiting against it.
- Biome-specific supplier bonuses — e.g. greenland tiles boosting wool
  and wheat suppliers. Consider pivoting from auto-spawning suppliers to
  the player placing them on advantageous biomes.
- Weather that affects play (rain slowing trucks, etc.) rather than
  being purely cosmetic.
- Daily challenge: share today's date as the map seed (left open by item
  13, along with generated-world test determinism).

**Audio**

- Per-channel volume sliders instead of the current on/off toggles.

**Graphics** — the iso 2.5D view has had many depth passes (scenery,
themed supplier sites, night atmosphere, day↔night, rotating weather,
directional shadows, route-flow pulses, coin bursts, heightfield
terrain). Next ideas, unbuilt:

- Curved/rounded roads at corners and junctions.
- Parallax on the terrain/sky layers when panning.
- Lightning + thunder in heavy rain; shooting stars; god rays at dawn.
- Face textures (subtle noise/brick/metal) instead of flat-colour
  building faces.
- Seasonal palettes; richer water reflections beyond the moonlight
  streak.

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
