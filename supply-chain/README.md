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
  touches cities — see Orders above for how customer DCs unlock. Locked
  pool sites are placed at world-gen within a spread cap of an
  already-placed node (`map.randomLandSpotNear`), so the network grows
  outward organically instead of a site stranding itself in a far map
  corner behind one absurdly long road; either bank is still fair game
  (river-grace gates *when* far-bank sites unlock, not whether they exist).
  The cap is per-difficulty (`SC.nodeMaxSpread` → `DIFFICULTIES[].nodeSpread`,
  falling back to `CONFIG.NODE_MAX_SPREAD`): tighter/tidier on Easy (520),
  real sprawl and longer supply lines on Hard (820).
- **Difficulty** (picked on the new-game screen, fixed per run, saved):
  `SC.DIFFICULTIES` presets set starting money, debt interest rate,
  order-deadline multiplier, the default grace period, and the
  `riverGraceMin` ease-in. Normal is the balance baseline (15%/min
  interest, 20% tighter deadlines); Easy keeps the original pace; Hard
  tightens both further; Sandbox starts rich with no interest and no
  fail state (`noFail`).
- **River-grace ease-in** (`riverGraceMin`, per difficulty): for the
  first N minutes of a run, milestone/customer unlocks (`map.unlockNext`)
  stay on HQ's bank, so early growth never forces an expensive
  bridge/ferry before you're established. Derived from HQ's position
  (`map.startSide`/`sideOf`), so it needs nothing persisted. A far-bank
  city held during grace is retried the moment the window closes rather
  than mistaken for a drained pool (`map.anyHeldByRiverGrace` +
  `riverGraceRemaining`, used by `economy.tick`). Easy/Sandbox 5 min,
  Normal 3 min, Hard 0 (far-bank sites from turn one).
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
  then unlocks its effect — `SC.RESEARCH` in `config.js`. Thirteen techs:
  standalone Road Junctions (cheap, early — unlocks placeable junctions,
  see Growth above); Site Requisition (manual placement); then four
  branches — Credit Line II/III → Premium Contracts (+15% payouts) →
  Regional Marketing (customer DCs arrive 40% sooner) and Marketing Blitz
  (unlocks promotions, above); Asphalt Paving (highways) →
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
- **Congestion** (`SC.state.congestionEnabled`, a difficulty trait fixed
  for the run — on for Normal/Hard, off for Easy/Sandbox; not a normal
  player-facing toggle, see the Dev tools panel further down for A/B
  comparison): once more than
  `CONGESTION_THRESHOLD` trucks share an edge at once, each additional
  truck slows it multiplicatively (`CONGESTION_STEP`, floored at
  `CONGESTION_FLOOR` — never a full stop). `SC.roads.speedMult` folds
  this in on top of the highway boost, live off
  `SC.vehicles.truckCountOnEdge`, so it affects both truck movement
  *and* Dijkstra's routing weight — dispatch naturally prefers a
  quieter parallel road over a jammed one. The road glows warmer the
  busier it gets (`render.drawRoads`).
- **Ferries**: a cheaper-but-slower alternative to a bridge. Tapping a
  road across the river no longer builds it outright — `input.js` emits
  `crossingChoice` instead, and `ui.js` pops a Bridge-vs-Ferry modal
  (both costs quoted live via `SC.roads.quote`) so the pick happens in
  context rather than via a pre-set toggle. Choosing Ferry builds
  `edge.ferry = true` instead of a bridge, at `FERRY_COST_MULT` (cheaper
  than `BRIDGE_MULT`) but `FERRY_SPEED_MULT` (slower than a normal road,
  folded into `speedMult` the same way the highway boost is). A ferry
  can't be paved into a highway (`upgradeQuote` rejects it — it's a
  boat, not a road surface); congestion (if enabled) still applies on
  top, so trucks queueing for the boat reuses the exact same mechanic
  as a jammed road queue. `SC.map.riverCrossing` finds just the water
  stretch of the edge (fraction range along it, sampled like
  `segmentCrossesRiver` but returning where, not just whether) so both
  crossing types render only over the water — plain road on the banks
  right up to the water's edge. A ferry shows a teal dashed lane
  confined to that stretch (no boat glyph — ⛴ rendered as an unstyled
  black fallback glyph on some Android emoji fonts, and the lane already
  reads as "ferry" on its own); a bridge
  gets an actual lifted deck on piers with a shadow on the water below
  and guard rails, also confined to the water (`render.drawBridgeCrossing`/
  `drawFerryCrossing`).
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
- **Dev tools panel**: a lasting ☰-menu toggle ("🛠 Dev tools", persisted
  in localStorage like Sound — `?dev=1` also forces it on for one load).
  Not a normal gameplay feature. Shows a collapsible panel under the
  top-left HUD bar with an FPS readout and one-off testing aids —
  Congestion (A/B override, see above), Add money, Roll contract, Finish
  research, Spawn next customer. Lives entirely in `ui.js`; each button
  reuses the same public logic functions a normal action would call
  (`rollContractOffer`, `research.tick`, etc.) rather than duplicating
  them.
- **Stats & Achievements** (☰ menu): a read-only summary — deliveries
  broken down by product, a money-over-time sparkline (`moneyHistory`,
  sampled every `STATS_SAMPLE_INTERVAL` seconds, capped at
  `STATS_HISTORY_MAX` samples), the busiest road by total truck trips
  (`edge.trips`, incremented once per segment a truck enters — see
  `stats.recordRoadUse`), and nine milestone badges (`SC.ACHIEVEMENTS`)
  like first bridge/ferry/highway/junction, a 10-truck fleet, recovering
  from debt, a fulfilled contract, 100 deliveries, and finishing every
  tech. `stats.js` only listens for events other modules already emit
  (`roadBuilt`, `orderComplete`, `truckBought`, …) — nothing calls it
  directly, so achievements can't drift out of sync with the mechanics
  they're tracking.
- **Per-yard truck prices**: the truck price ladder tracks trucks homed
  at the *active yard* (`SC.trucksAtYard`), so a new yard resets the
  ladder to base price — the ever-growing yard price is the balance
  lever.
- **Junctions**: a `'junction'` node kind that's purely a routing
  waypoint — no `mat`/`recipe`, never a planner source or destination
  (`bestSourceFor`/`activeCities`/`factories.all` all filter by an
  explicit kind, so a junction is invisible to the economy), just
  another node with `edges` that `SC.roads.findPath`'s Dijkstra walks
  like any other. Place one (Shop panel, not research-gated like yards)
  anywhere placement rules allow, at a flat `PLACEMENT_JUNCTION_PRICE` —
  no growth ladder, since routing through one is never shorter than a
  direct road, so there's no cost-reduction exploit to price against.
  Renders as a small roundabout (`drawJunction` — asphalt ring, dashed
  lane guide, planted center island) rather than a building, since
  there's no supply/demand identity to badge with an icon.
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
| `js/stats.js` | Stats & achievements bookkeeping: deliveries per product, a periodic money-history sample for the sparkline, per-edge trip counts (`recordRoadUse`/`busiestRoad`), and milestone unlocks — all purely observational, listens to events other modules already emit (`roadBuilt`, `orderComplete`, etc.) rather than being called directly |
| `js/inspect.js` | Inspect-mode data: node → its connections/routes, for the hover/hold tooltip and highlight. Collected route paths carry a `.good` property per leg so the glow overlay tints each leg by its cargo (chain-step colors) |
| `js/research.js` | Tech tree engine: one active project, cost/time, generic effect accessors (`bonusSum`, `customerSpawnMult`, `upgradeMaxBonus`) |
| `js/placement.js` | Manual site placement: cost, validity (land/river/min-distance); supplier/factory locked behind research, truck yards and junctions are not |
| `js/camera.js` | World↔screen transform (isometric 2:1 projection), pan/zoom/clamp (math only). `project`/`unproject` map the flat world ground plane onto the iso view; all input hit-testing rides on `toScreen`/`toWorld`, so logic stays in flat coords |
| `js/render.js` | Canvas drawing (isometric 2.5D): sky + world-anchored snow-capped mountain ranges (haze by depth), projected land with terrain patches and scattered pines/rocks, river, road ribbons, extruded diamond-prism buildings (story lines, doors, factory smokestacks) with sprite-based soft shadows, themed supplier sites (farm/lake+pump/mine/pasture/rubber grove/fab per raw material, `drawSupplierSite`), depth-sorted back-to-front (a small `TRUCK_DEPTH_BIAS` nudges trucks forward in the sort so one arriving at or sitting beside a node doesn't get hard-clipped by that node's own body — a single-point painter's sort has no notion of footprint size, so a truck's final approach used to sometimes lose that near-tie; the plot pad under each building is also a feathered radial fade rather than a flat fill, so it doesn't add a second hard edge on top of whatever seam remains), cab+trailer trucks and billboarded labels/order-bubbles. Static scenery (mountains/land/grid/patches/trees) renders into a cached offscreen layer re-blitted while panning (`renderBg`/`drawBg`) so mobile panning stays smooth; dpr is capped at 2. The layer is only ever blitted at its exact render zoom — a scaled blit is a ≤120ms stopgap mid-pinch, then it re-renders (a lingering scaled blit was the mobile "giant/torn mountains" glitch), and the ctx swap in `renderBg` is try/finally-guarded. Distance fog fades the far edge of the land into the sky; screen-space star field behind the world; trucks get headlights while driving. Scenery uses a seeded PRNG (`makeRng`) cached so it doesn't flicker. **Night atmosphere** (all per-frame, kept out of the cached bg): a moon with a soft glow + a faint aurora band in the sky, warm lit windows on buildings/factories/HQ/DC/fab (seeded per node in `prism`'s window grid, a few flicker) over a cached warm ground light-spill, a blinking aircraft-style beacon on the HQ landmark, a moonlight shimmer streak on the river, a few drifting world-anchored fireflies, and a cached screen-edge vignette drawn last for framing. **Day/night cycle** (`DAY_LENGTH`, cosmetic/non-persisted): a slow clock sweeps the sky palette (night↔day↔dusk keyframes), arcs a crossfading sun/moon, applies a full-screen `'screen'` colour grade to lift the baked-night ground toward daylight without rebuilding the bg cache, and drives a `nightLevel` that fades windows/fireflies/light-spill/headlights out by day. **Rotating weather** (`WEATHER_ROTATION`): clear→clouds→rain→snow spells fade in/out, a slowly-turning wind vector drifts drifting sky clouds + soft ground cloud-shadows and angles pooled/capped rain & snow particles. Truck headlights are night-only soft glows. Directional cast shadows (`drawShadow`) swing opposite the sun/moon and lengthen near the horizon; animated route-flow dashes (`drawRouteFlow`) pulse along roads carrying trucks in the cargo colour; `orderComplete` fires a coin/spark burst; rain adds a road sheen (`drawWetRoads`) and snow lays a slowly-melting blanket (`drawSnowBlanket`); lit buildings, the HQ beacon and the fab antenna emit an additive `bloom()` glow at night; a crate hops into a truck on pickup and down into a node on delivery (`drawTransfer`, driven render-side by cargo-length change, depth-sorted so a nearer site clips it). Probe flags `&tod=`/`&weather=` force a time/weather for screenshots |
| `js/input.js` | Pointer events: pan, pinch, wheel, tap-to-build, Upgrade-mode taps, Inspect hover/hold. Node picking hit-tests the whole extruded building (ground→roof capsule, `nodeAtScreen`); `getHoverNode` feeds the ghost-road snap + hover ring so previews match what a click hits |
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
- Visuals: the isometric 2.5D view keeps getting depth passes. Landed:
  scenery, themed supplier sites, night atmosphere, cosmetic day↔night
  cycle + rotating weather (clouds/rain/snow with wind), directional
  cast shadows that swing/lengthen with the sun, animated route-flow
  pulses on active roads, delivery coin bursts, and weather-reactive
  ground (rain sheen on roads, a slowly-melting snow blanket).
  **Graphics roadmap (next ideas, unbuilt):**
  - Curved/rounded roads at corners + junctions instead of straight polylines.
  - Parallax on the mountain/sky layers when panning.
  - Lightning + thunder during heavy rain; shooting stars; god rays at dawn.
  - Face textures (subtle noise/brick/metal) instead of flat-colour building faces.
  - Seasonal palettes; richer water reflections beyond the moonlight streak.
  - Weather that actually affects play (rain slowing trucks, etc.) — gameplay, not just cosmetic.
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
