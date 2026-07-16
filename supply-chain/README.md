# Supply Chain Tycoon

A lightweight logistics tycoon game (think Factorio-flavoured Mini Metro):
build roads between suppliers, factories and cities; trucks automatically
haul raw materials to factories and finished products to the cities that
ordered them. Earn money, buy trucks and factories, upgrade, and keep up
as the map grows.

This replaced the old ambient "supply chain simulation". The CV page kept
that ambient animation as its background — it now lives independently at
`cv/supply-chain-bg.js` and shares no code with this game.

## Game rules

- **Goods & recipes** (emoji-first, colors are accents): suppliers
  (hexagons) provide raw goods; each factory (square) is dedicated to one
  recipe. 🌾wheat+💧water→🍞bread (bakery), 🧶wool+🛞rubber→👟sneakers
  (sneaker factory), the two-tier chain 🪨ore+⚫coal→🔩steel (smelter),
  🔩steel+💾chips→🚗cars (car factory), and the three-tier chain
  🟠copper+🛞rubber→🧵wire (wire mill), 🧵wire+💾chips→🔌circuit board
  (circuit factory), 🔌circuit+🔩steel→🤖robots (robot factory). Steel,
  chips and rubber are each shared by two recipes, so one supplier's
  placement (and the roads to it) can matter for more than one product.
  Steel/wire/circuit are intermediates — cities only order `orderable`
  goods; the planner recursively schedules factory-to-factory runs for
  chains of any depth (nothing in `economy.js`/`factories.js` is
  hardcoded to 2 tiers). The goods tree lives in `js/config.js`
  (`SC.GOODS`) — adding a good/recipe is one entry there, plus a pool
  entry in `js/map.js` if it should be unlockable.
- **Orders**: HQ (⭐) is the only order-placing location at the start.
  New customer DCs (🏢) unlock on their own independent timer (~50-70s for
  the first, ~90-140s between further ones — `CUSTOMER_SPAWN_FIRST` /
  `CUSTOMER_SPAWN_INTERVAL` in `config.js`) and start placing orders too.
  Each order is a timed request (product × qty, payout); the planner picks
  the cheapest operational factory chain that can reach both the raw
  suppliers and the ordering HQ/DC over the road network — if none exists
  the order shows "no route!" until you build one.
- **Roads**: tap node → tap node. Cost scales with length; crossing the
  river costs 3× (bridge). Tap a road twice to demolish for a 50% refund
  (refused while a truck is on it).
- **Modes** (bottom-right toggle): **Build** (🔨, default) is the road
  tap-tap flow above. **Upgrade** (⬆️) turns taps into upgrades: tap a
  supplier twice to level its stock cap/regen, or a road twice to pave
  it into a highway (see Supplier stock / Highways below). **Inspect**
  (🔍) disables building; hovering (mouse) or tapping (touch — tap
  again, or elsewhere, to dismiss) a node instead opens a tooltip and
  glows the relevant roads — a factory's needed ingredients and whether
  each is connected, a supplier's consuming factories (plus its stock
  level), or a city's open orders and routes.
- **Trucks & yards**: HQ (⭐) is always a yard; build more (Shop panel,
  price grows per yard like trucks do) to station trucks nearer distant
  routes. Buying a truck stations it at whichever yard is picked in the
  Shop's dropdown. Idle trucks head back to their home yard when there's
  no work, and dispatch matches the *globally* nearest idle truck to each
  job — so a truck parked at a yard near the action beats one that would
  have to cross the map, purely from where it's stationed (no manual
  route-pinning). Trucks haul one item each by default; capacity allowing,
  a truck also bundles any other pending job that shares the exact same
  pickup and drop, so one trip can carry several units at once. The Truck
  Capacity upgrade raises how many a truck can bundle per trip.
- **Credit line**: purchases may push the balance negative down to
  −$1,500 (`CREDIT_LIMIT`, raised by Credit Line research); debt accrues
  interest continuously in `economy.tick` at the difficulty's rate
  (`SC.diff().interestPerMin` — 15%/min on Normal). The HUD flips to a
  red "Debt" readout while under water, and to a `⚠ DEFAULT IN Ns`
  countdown past the limit (see Default fail state below).
- **Menu (☰)**: pauses the sim; shows session stats (difficulty,
  interest paid, fleet/yards) and autosave status, with Save now /
  Sound / Full screen / How to play / New game (two-tap confirm; routes
  through the new-game screen so the difficulty can be re-picked). The
  game autosaves every 5s and on visibilitychange/pagehide/beforeunload,
  so closing the tab is safe.
- **Growth**: every 3 filled orders a locked supplier/factory site
  activates (buy factory sites with a tap-twice); this track never
  touches cities — see Orders above for how customer DCs unlock.
- **Difficulty** (picked on the new-game screen, fixed per run, saved):
  `SC.DIFFICULTIES` presets set starting money, debt interest rate,
  order-deadline multiplier, and the default grace period. Normal is
  the balance baseline (15%/min interest, 20% tighter deadlines);
  Easy keeps the original pace; Hard tightens both further; Sandbox
  starts rich with no interest and no fail state (`noFail`).
- **Default fail state**: purchases are blocked past −creditLimit, so
  only compounding interest can drag the balance below it — that's an
  unrecoverable-by-buying spiral, so it starts a grace-period countdown
  (HUD shows `⚠ DEFAULT IN Ns`). Recover above the limit to clear it;
  hit zero and the bank forecloses: game-over overlay, save wiped.
  The countdown is persisted so reloading doesn't reset it.
- **Promotions** (needs Marketing Blitz researched): a repeatable paid
  action in the Shop — `PROMO_COST` buys `PROMO_DURATION` seconds of
  ~3× faster order arrivals plus a higher concurrent-order cap. One at
  a time; the timer survives saves (`promoUntil`).
- **Research**: one project at a time, paid upfront, takes real time,
  then unlocks its effect — `SC.RESEARCH` in `config.js`. Twelve techs
  across four branches: Site Requisition (manual placement); Credit
  Line II/III → Premium Contracts (+15% payouts) → Regional Marketing
  (customer DCs arrive 40% sooner) and Marketing Blitz (unlocks
  promotions, above); Asphalt Paving (highways) →
  Overdrive Engines (+3 truck-speed cap) → Bulk Logistics (+2 capacity
  cap); Fertilizer Program (+50% supplier regen) → Factory Automation
  (+3 factory-speed cap) and Preservatives (+25% order deadlines).
  Effect fields are generic — additive bonuses (`creditBonus`,
  `payoutBonus`, `deadlineBonus`, `supplierRegenBonus`) sum via
  `research.bonusSum`, `customerSpawnMult` multiplies, and
  `upgradeMaxBonus` raises upgrade caps. The Shop panel keeps a
  one-line shortcut (progress/available count); tapping it opens the
  full tree in its own overlay, laid out left-to-right by prerequisite
  depth with connecting lines to its `requires` (not a flat list — see
  `updateResearchTree`/`researchTiers` in `ui.js`).
- **Demand scaling**: the concurrent-order cap grows with the customer
  network (`economy.maxActiveOrders` = base + `ORDER_PER_CITY` per
  active DC beyond HQ), so a grown map generates enough work to pay
  for its grown costs.
- **Supplier stock**: suppliers hold a finite stockpile that regenerates
  over time (`SUPPLIER_REGEN`) up to a cap; a truck arriving at a dry
  supplier waits there (`'loading'` phase) until stock catches up. Each
  supplier is individually upgradable in **Upgrade mode** (⬆️, top
  right): tap twice to raise its cap and regen (per-supplier `level`,
  price ladder `SUPPLIER_UPGRADE_BASE/GROWTH`). The Fertilizer Program
  research boosts all suppliers' regen globally.
- **Highways** (needs Asphalt Paving researched): Upgrade mode on a road
  paves it (`edge.level 1`) — trucks cross it `HIGHWAY_SPEED_MULT`×
  faster, and pathfinding weighs edges by travel time so routes prefer
  paved legs.
- **Congestion** (feature-flagged via `SC.state.congestionEnabled`,
  toggle anytime from the ☰ menu; defaults per difficulty — on for
  Normal/Hard, off for Easy/Sandbox): once more than
  `CONGESTION_THRESHOLD` trucks share an edge at once, each additional
  truck slows it multiplicatively (`CONGESTION_STEP`, floored at
  `CONGESTION_FLOOR` — never a full stop). `SC.roads.speedMult` folds
  this in on top of the highway boost, live off
  `SC.vehicles.truckCountOnEdge`, so it affects both truck movement
  *and* Dijkstra's routing weight — dispatch naturally prefers a
  quieter parallel road over a jammed one. The road glows warmer the
  busier it gets (`render.drawRoads`).
- **Ferries**: a cheaper-but-slower alternative to a bridge, chosen at
  *build* time via the Shop panel's "Ferry crossings" toggle — any road
  drawn across the river while it's on builds `edge.ferry = true`
  instead of a bridge, at `FERRY_COST_MULT` (cheaper than
  `BRIDGE_MULT`) but `FERRY_SPEED_MULT` (slower than a normal road,
  folded into `speedMult` the same way the highway boost is). A ferry
  can't be paved into a highway (`upgradeQuote` rejects it — it's a
  boat, not a road surface); congestion (if enabled) still applies on
  top, so trucks queueing for the boat reuses the exact same mechanic
  as a jammed road queue. Renders as a distinct teal dashed line with a
  small ⛴ shuttling back and forth along the crossing.
- **Contracts**: `rollContractOffer` occasionally proposes a bulk order
  at a locked-in `CONTRACT_RATE_BONUS` premium rate. A non-blocking card
  lets you Accept or Decline within `CONTRACT_OFFER_EXPIRE` before it's
  withdrawn (one offer/active contract at a time). Accepting
  (`acceptContract`) is implemented as a regular order flagged
  `contract: true` — reuses the same planning/delivery/expiry pipeline
  as any other order, styled with a gold outline and 📜 in the Orders
  panel. Unlike a normal missed order (just a tally, no cost), missing
  an accepted contract's deadline (`expireOrder`) charges a penalty
  proportional to however many units are still undelivered
  (`CONTRACT_PENALTY_MULT × missingUnits × perUnitRate`).
- **Per-yard truck prices**: the truck price ladder tracks trucks homed
  at the *active yard* (`SC.trucksAtYard`), so a new yard resets the
  ladder to base price — the ever-growing yard price is the balance
  lever.
- **Deeper chains pay more**: order payouts multiply the good's value by
  `1 + ORDER_DEPTH_VALUE × (depth − 1)`, so cars/robots out-earn bread
  beyond their base value gap.
- **Manual placement** (needs Site Requisition researched): pick a good
  in the Shop panel's Build section, then tap the map to drop that
  supplier/factory anywhere on land — at a premium over the free
  milestone/customer-DC unlocks (`PLACEMENT_SUPPLIER_PRICE`,
  `PLACEMENT_FACTORY_MULT`). A dashed ghost preview shows the spot and
  cost, red where blocked (in the river or too close to another site).
  Truck yards use the same tap-to-place flow and ghost preview but are
  **not** research-gated (`SC.placement.place('yard', ...)`) — a base
  mechanic, not a premium bailout.
- **Camera**: drag to pan, wheel/pinch to zoom.
- **Fast-forward**: the 1×/2×/4× toggle under the HUD (`SC.state.speed`)
  runs that many fixed-size sub-steps of `economy`/`factories`/
  `vehicles`/`research`.tick per animation frame — same dt each
  sub-step, so nothing behaves differently at higher speeds, there's
  just more simulated time per rendered frame. Resets to 1× each
  session (not persisted, like `paused`).
- **Seeded worlds**: map generation (river shape, node placement) runs
  on a seeded PRNG (`js/rng.js`) instead of `Math.random`, so
  `?seed=xyz` on a fresh game reproduces that exact map. The pause menu
  shows the current seed — tap it to copy a shareable `?seed=` link.
  Gameplay randomness (order contents/timing, customer-DC spawn jitter)
  intentionally still uses `Math.random`, so a shared seed reproduces
  the map, not a full deterministic playthrough.
- Endless play; "Filled" vs "Missed" on the HUD is the score.

## Architecture

Plain ES5-ish scripts on one `window.SC` namespace, no build step.
Strict layering: logic modules never touch the DOM (headless-testable);
they signal the UI through the tiny `SC.on`/`SC.emit` pub/sub in state.js.

| File | Role |
|---|---|
| `js/config.js` | Constants, `SC.GOODS` tree (emoji/recipes/prices), `SC.RESEARCH` techs, `SC.DIFFICULTIES` presets, `SC.VERSION` |
| `js/state.js` | `SC.state` factory, pub/sub, derived getters (prices, speeds, `SC.diff()`, supplier cap/regen, per-yard truck price) |
| `js/save.js` | Autosave/restore to localStorage (serialize/restore round-trip) |
| `js/rng.js` | Seeded PRNG (xmur3 hash + mulberry32 stream) used only by map.js's world gen, so `?seed=` reproduces a map |
| `js/map.js` | World gen: river, node sites, starter cluster (seeded via `js/rng.js`, `generateWorld(seed)`); `unlockNext(filterFn)` for milestone (supplier/factory) and customer-DC (city) unlock tracks |
| `js/roads.js` | Road build/demolish/quote (incl. ferry-vs-bridge), highway upgrades, congestion (`speedMult`/`congestionMult`), Dijkstra pathfinding weighted by travel time |
| `js/factories.js` | Craft tasks (incl. intermediates), raw intake, production ticks, site purchase |
| `js/economy.js` | Orders (spawn/plan/deliver/expire) with recursive multi-tier sourcing, money, interest + default countdown, upgrades, supplier stock regen/upgrades, promotions, customer-DC spawn timer, contract offers (roll/accept/decline) and miss penalties |
| `js/vehicles.js` | Trucks (each with a home yard), haul jobs, dispatcher (globally nearest idle truck per job, bundles same-route jobs up to capacity, sends idle trucks home), supplier-stock loading waits, reassignment, movement, `truckCountOnEdge` (feeds congestion) |
| `js/inspect.js` | Inspect-mode data: node → its connections/routes, for the hover/hold tooltip and highlight |
| `js/research.js` | Tech tree engine: one active project, cost/time, generic effect accessors (`bonusSum`, `customerSpawnMult`, `upgradeMaxBonus`) |
| `js/placement.js` | Manual site placement: cost, validity (land/river/min-distance); supplier/factory locked behind research, truck yards are not |
| `js/camera.js` | World↔screen transform, pan/zoom/clamp (math only) |
| `js/render.js` | Canvas drawing (world coords under camera transform) |
| `js/input.js` | Pointer events: pan, pinch, wheel, tap-to-build, Upgrade-mode taps, Inspect hover/hold |
| `js/ui.js` | HUD, orders/shop panels, research-tree overlay, difficulty picker, game-over overlay, toasts, help overlay |
| `js/sfx.js` | WebAudio blips (autoplay-unlock + mute pattern from cargo-lander) |
| `js/main.js` | Bootstrap, game loop (fast-forward runs N sub-steps/frame), `?probe=N`/`?seed=`/`?speed=` headless verification hooks |

`tests.html` runs the logic modules against hand-built deterministic maps
(straight river, fixed nodes) — see CLAUDE.md for the headless recipes.

## TODO backlog

See `PLAN.md` for the full phased roadmap; short version below (kept in
sync with it):

- Curved/waypoint roads; road congestion (per-road speed *upgrades*
  landed as highways in v1.11; congestion slowdowns did not).
- Sound of moving trucks / ambient loop; music toggle separate from sfx.
- Touch: long-press as an alternative to double-tap for demolish/buy (the
  Inspect-mode hold gesture above uses the same long-press primitive).
- Promotions landed in v1.13 as a research-unlocked *repeatable shop
  action* (the tree stays one-shot-per-id); a per-good targeted promo
  is the remaining refinement if wanted.
- Research cancel/refund (currently a started project can't be aborted).
- Difficulty ramp *within* a run (deadlines shrinking over time) —
  difficulty presets landed in v1.13, but each run is flat.
- Faster-milestone research (unlock a site every 2 deliveries instead
  of 3) — considered for v1.12 but deferred: milestone pace is the main
  faucet controlling map growth, and cheapening it risks flooding the
  midgame with sites; revisit alongside a difficulty ramp.
