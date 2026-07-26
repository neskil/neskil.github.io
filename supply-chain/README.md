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
- **Field expansion**: at scheduled delivery counts (`WORLD_EXPAND.at` in
  `config.js`, currently 18/42/78) the playing field itself grows — each
  expansion adds `stepW`/`stepH` toward the near edge, opening new frontier
  land and pushing the mountain backdrop out. The live size lives in
  `SC.state.worldW`/`worldH` (seeded from the `WORLD_W`/`WORLD_H` base,
  persisted); camera bounds, node placement and the terrain all read
  `SC.worldW()`/`SC.worldH()`, so it's fully size-agnostic.
  `SC.map.expandField()` grows it once; `maybeExpandField()` (called from
  the milestone hook) fires the next scheduled step. Each expansion also
  **seeds the frontier** (`frontierSpot`): a new active supplier (random
  raw) and a for-sale factory (random recipe) spawn in the new band —
  both active so they never join or reorder the milestone unlock queue —
  so there's something out there worth roading toward. Dev: `&expand=N`.
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
  ~3× faster order arrivals plus a higher concurrent-order cap. Can target
  a specific good (`startPromotion(good)`) or all products; the timer survives
  saves (`promoUntil`).
- **Factory Specialization**: inspecting a factory lets you toggle it between
  Generalist (flexible) and Specialized (dedicates the factory to its recipe
  for a **1.5× crafting speed boost**). Specialized factories only source
  and deliver for their chosen recipe.
- **Regions & Map Expansion**: beyond field expansions (`WORLD_EXPAND`), reaching
  milestones allows unlocking new adjacent regions (`unlockRegion()`), expanding
  world dimensions, seeding new customer cities and suppliers, and linking them
  via paved highway edges.
- **Within-Run Difficulty Ramp**: order deadlines gradually tighten and new order
  spawn rates speed up as your total delivery count increases (`getDeadlineRamp()`,
  `getSpawnRamp()`), adding a dynamic challenge that scales with your empire.
- **Research**: one project at a time, paid upfront, takes real time,
  then unlocks its effect. **`SC.RESEARCH` in `config.js` is the source
  of truth** for the tech list — name, cost, time, `requires` and effect
  fields all live there, and `SC.RESEARCH_ORDER` fixes display order, so
  don't restate the roster here (it goes stale the moment a tech is
  added). Every tech's time is ×0.7 of its original value (research
  trains 30% faster across the board). Shape of the tree: a couple of
  cheap standalone unlocks (road crossings/junctions, Site Requisition
  for manual placement) plus four branches rooted at Credit Line,
  Asphalt Paving, Fertilizer Program and Premium Contracts, each mixing
  cap-raising upgrades with unlocks (promotions, standing orders,
  highways). Effect fields are generic — additive bonuses (`creditBonus`,
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
  (`CONTRACT_PENALTY_MULT × missingUnits × perUnitRate`). Standing
  Orders research unlocks a Shop toggle (`SC.state.autoAcceptContracts`,
  persisted in saves) that skips the Accept/Decline card entirely —
  `economy.tick` calls `acceptContract` right after `rollContractOffer`
  whenever the tech is done and the toggle is on.
- **Dev tools panel**: a lasting ☰-menu toggle ("🛠 Dev tools", persisted
  in localStorage like Sound). Not a gameplay feature and not reachable
  by a normal player — see [DEBUG.md](DEBUG.md) for what it exposes.
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
- **Sound & music**: two independent ☰-menu toggles, both persisted.
  **🔊 Sound** covers one-shot blips (build/cash/error/…) *and* the world
  ambience; **🎵 Music** covers the score. Everything is synthesised at
  runtime in `js/audio.js` — there are no audio files in the repo, which
  keeps the folder self-contained and lets the sound react to game state:
  - *Ambience* is three looping filtered-noise beds whose gains are ramped
    (never rebuilt) each frame — wind rising with cloud cover/wind strength,
    rain with the rain spell, and a traffic hum that saturates with the
    number of trucks actually rolling (`1 - e^(-n/6)`), so a busy network is
    audibly busy. It ducks to silence while paused or after game over.
  - *Music* is a generative four-chord loop (Am7–Fmaj7–Cmaj7–G7, 8s per
    chord) with a pad, a bass root and a sparse melody drawn from a fixed
    A-minor-pentatonic scale — consonant over all four chords, so notes can
    be picked at random without ever clashing. The day/night cycle drives it:
    the pad's filter opens and the melody gets busier by day, darker and
    sparser at night. Notes are scheduled on a 0.5s grid with a 0.4s
    lookahead from `SC.audio.update()`.
  - Audio runs on the **wall clock**, so `update()` sits outside main.js's
    fast-forward sub-step loop — 4× speed simulates faster without pitching
    the music up. Nothing is created until the first user gesture (autoplay
    policy), which is why headless probes are silent.
- **Guided tutorial**: a fresh run opens with a four-step walkthrough of the
  first order — road the bakery to wheat, then to water, then to HQ, then
  watch a truck fill it. A banner names the exact next tap while the map
  dims and pulses a ring + arrow on the nodes that step means, so "tap the
  bakery, then the wheat farm" points at two specific buildings instead of
  leaving a new player to find them. Skippable from the banner, and it never
  appears for a restored save that already finished it. Steps are stated as
  **goals, not actions** (`js/tutorial.js`), re-checked on `roadBuilt`/
  `roadDemolished`/`orderComplete` — so one road can retire two steps at
  once, and a step can't desync from the world. `SC.state.tutorialStep`
  persists (−1 = finished/skipped, which is also what pre-tutorial saves
  restore as, so an existing run is never dropped into step 1). Dev:
  `&tutorial=N`.
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
| `js/tutorial.js` | Guided first-order tutorial: the step list, which nodes each step points at, and when a step is satisfied. Pure logic — ui.js renders the banner and render-network.js draws the focus dim/rings, both by reading `current()`/`focus()` |
| `js/inspect.js` | Inspect-mode data: node → its connections/routes, for the hover/hold tooltip and highlight. Collected route paths carry a `.good` property per leg so the glow overlay tints each leg by its cargo (chain-step colors) |
| `js/research.js` | Tech tree engine: one active project, cost/time, generic effect accessors (`bonusSum`, `customerSpawnMult`, `upgradeMaxBonus`) |
| `js/placement.js` | Manual site placement: cost, validity (land/river/min-distance); supplier/factory locked behind research, truck yards and junctions are not |
| `js/camera.js` | World↔screen transform (isometric 2:1 projection), pan/zoom/clamp (math only). `project`/`unproject` map the flat world ground plane onto the iso view; all input hit-testing rides on `toScreen`/`toWorld`, so logic stays in flat coords |
| `js/render-core.js` | Rendering entry point. Owns the internal context object `R` (`SC._render`) that the other three render files destructure — shared canvas ctx, camera helpers (`S`/`zoom`), colour utilities, the seeded scenery PRNG (`makeRng`), and the per-frame orchestrator (`frame`/`drawWorld`). Also owns the **background cache**: static scenery (terrain/land/grid/patches/trees) renders into an offscreen layer re-blitted while panning (`renderBg`/`drawBg`) so mobile panning stays smooth; dpr capped at 2. The layer is only ever blitted at its exact render zoom — a scaled blit is a ≤120ms stopgap mid-pinch, then it re-renders (a lingering scaled blit was the mobile "giant/torn scenery" glitch) — and the ctx swap in `renderBg` is try/finally-guarded. `bgKey` includes `terrainKey()` so the cache re-bakes when the field expands |
| `js/render-env.js` | Environment layer: sky, **day/night cycle**, weather, terrain, land, river, ambient scenery. The **low-poly heightfield terrain backdrop** (`drawTerrain`/`ensureTerrain`) continues the ground plane past every edge of the field — beyond the two far (low world x+y) edges it rises into faceted, faintly-wireframed mountains via ridged value-noise (`terrainHeight`/`ridged`), and beyond the two near edges it *descends* into rolling lowland foothills (negative heights, `TERRAIN.dip`), so the field reads as a plateau in one continuous landscape rather than an island floating over the sky. Flat inside the field so it never occludes play, flat-shaded per facet with the slope, blended toward the live sky for aerial haze so it tracks day/night + weather, sized from `SC.worldW()`/`worldH()` + a skirt and rebuilt only when the field grows (`terrainKey`). The day/night clock (`DAY_LENGTH`, cosmetic/non-persisted) sweeps the sky palette across night↔day↔dusk keyframes, arcs a crossfading sun/moon, applies a full-screen `'screen'` colour grade to lift the baked-night ground toward daylight without rebuilding the bg cache, and drives the `nightLevel` that other layers fade their lights by. **Rotating weather** (`WEATHER_ROTATION`): clear→clouds→rain→snow spells fade in/out, a slowly-turning wind vector drifts sky clouds + soft ground cloud-shadows and angles pooled/capped rain & snow particles; rain adds a road sheen (`drawWetRoads`) and snow lays a slowly-melting blanket (`drawSnowBlanket`). **Night atmosphere** (per-frame, kept out of the cached bg): moon glow + a faint aurora band, a moonlight shimmer streak on the river, drifting world-anchored fireflies, and a cached screen-edge vignette drawn last for framing. Distance fog fades the far edge of the land into the sky; a screen-space star field sits behind the world |
| `js/render-network.js` | Network layer: road ribbons, bridge/ferry crossings drawn over just the water (`drawBridgeCrossing`/`drawFerryCrossing`), animated route-flow dashes pulsing in the cargo colour along roads carrying trucks (`drawRouteFlow`), extruded diamond-prism buildings (`prism` — story lines, doors, factory smokestacks, plus a seeded window grid whose warm lit windows and additive `bloom()` come up at night), sprite-based soft shadows that swing opposite the sun/moon and lengthen near the horizon (`drawShadow`), themed supplier sites per raw material (farm/lake+pump/mine/pasture/rubber grove/fab — `drawSupplierSite`), junction roundabouts (`drawJunction`), truck yards as a flat asphalt parking lot with painted stall lines and the idle trucks homed there parked nose-in across its bays (`drawYardSite`/`drawYardParking`) instead of a 🅿️ icon + count — HQ/DC get the same apron. The plot pad under each building is a feathered radial fade rather than a flat fill, so it doesn't add a hard edge. Also order bubbles, inspect/tutorial highlights, ghost road + placement previews, and offscreen edge arrows |
| `js/render-actors.js` | Actor layer: cab+trailer trucks (`drawTruckAt`, night-only headlight glows), the "+$"/"−$" floaters, `orderComplete` coin/spark bursts, and the loading/unloading crate that hops into a truck on pickup and down into a node on delivery (`drawTransfer`, driven render-side by cargo-length change, depth-sorted so a nearer site clips it). Entities depth-sort back-to-front; idle trucks (no route/jobs) are skipped here and drawn by their home node instead. A small `TRUCK_DEPTH_BIAS` nudges trucks forward in the sort so one arriving beside a node isn't hard-clipped by that node's body — a single-point painter's sort has no notion of footprint size, so a truck's final approach used to lose that near-tie |
| `js/input.js` | Pointer events: pan, pinch, wheel, tap-to-build, Upgrade-mode taps, Inspect hover/hold. Node picking hit-tests the whole extruded building (ground→roof capsule, `nodeAtScreen`); `getHoverNode` feeds the ghost-road snap + hover ring so previews match what a click hits |
| `js/ui.js` | HUD, orders/shop panels, research-tree overlay, difficulty picker, game-over overlay, toasts, help overlay, dev-tools panel. Publishes its internals on `SC._ui` for `ui-bind.js` |
| `js/ui-bind.js` | Event wiring extracted from `ui.js` purely to keep that file editable — loads after it and is invoked by `ui.js`'s `init()` via `SC._ui.bind()`. Handler bodies are unchanged from when they lived inside the `ui.js` closure |
| `js/audio.js` | Shared AudioContext + music/sfx/ambience buses; the weather- and traffic-reactive ambient bed and the generative score (all synthesised, no audio assets). `update()` is called once per frame from main.js, outside the fast-forward sub-step loop |
| `js/sfx.js` | WebAudio one-shot blips, routed into `audio.js`'s sfx bus. Owns the **Sound** toggle (one-shots + ambience); music toggles separately |
| `js/main.js` | Bootstrap, game loop (fast-forward runs N sub-steps/frame), `?probe=N`/`?seed=`/`?speed=` headless verification hooks |

`tests.html` runs the logic modules against hand-built deterministic maps
(straight river, fixed nodes) — see CLAUDE.md for the headless recipes.

## What's next

**[PLAN.md](PLAN.md)** owns the roadmap — shipped log, phased items, and
the unbuilt backlog. It used to be duplicated here in a second list that
drifted out of sync with it (claiming congestion and the within-run
difficulty ramp were unbuilt long after both shipped), so this section is
deliberately just a pointer. Add ideas to PLAN.md, not here.
