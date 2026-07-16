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
- **Modes** (top-right toggle): **Build** (🔨, default) is the road
  tap-tap flow above. **Inspect** (🔍) disables building; hovering
  (mouse) or holding (touch, same long-press timing as the demolish
  gesture) a node instead opens a tooltip and glows the relevant roads —
  a factory's needed ingredients and whether each is connected, a
  supplier's consuming factories, or a city's open orders and routes.
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
  −$1,500 (`CREDIT_LIMIT`); debt accrues 10%/min interest
  (`DEBT_INTEREST_PER_MIN`), charged continuously in `economy.tick`.
  The HUD flips to a red "Debt" readout while under water.
- **Menu (☰)**: pauses the sim; shows session stats (incl. interest
  paid) and autosave status, with Save now / Sound / How to play /
  New game (two-tap confirm). The game autosaves every 5s and on
  visibilitychange/pagehide/beforeunload, so closing the tab is safe.
- **Growth**: every 3 filled orders a locked supplier/factory site
  activates (buy factory sites with a tap-twice); this track never
  touches cities — see Orders above for how customer DCs unlock.
- **Research**: one project at a time, paid upfront, takes real time,
  then unlocks its effect — `SC.RESEARCH` in `config.js`. Ships with Site
  Requisition (unlocks manual placement, below) and a two-tier Credit
  Line II/III (each raises the credit limit, stacking). The Shop panel
  keeps a one-line shortcut (progress/available count); tapping it opens
  the full tree in its own overlay, laid out left-to-right by
  prerequisite depth with connecting lines to its `requires` (not a flat
  list — see `updateResearchTree`/`researchTiers` in `ui.js`).
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
- Endless play; "Filled" vs "Missed" on the HUD is the score.

## Architecture

Plain ES5-ish scripts on one `window.SC` namespace, no build step.
Strict layering: logic modules never touch the DOM (headless-testable);
they signal the UI through the tiny `SC.on`/`SC.emit` pub/sub in state.js.

| File | Role |
|---|---|
| `js/config.js` | Constants, `SC.GOODS` tree (emoji/recipes/prices), `SC.VERSION` |
| `js/state.js` | `SC.state` factory, pub/sub, derived getters (prices, speeds) |
| `js/save.js` | Autosave/restore to localStorage (serialize/restore round-trip) |
| `js/map.js` | World gen: river, node sites, starter cluster; `unlockNext(filterFn)` for milestone (supplier/factory) and customer-DC (city) unlock tracks |
| `js/roads.js` | Road build/demolish/quote + Dijkstra pathfinding |
| `js/factories.js` | Craft tasks (incl. intermediates), raw intake, production ticks, site purchase |
| `js/economy.js` | Orders (spawn/plan/deliver/expire) with recursive multi-tier sourcing, money, upgrades, customer-DC spawn timer |
| `js/vehicles.js` | Trucks (each with a home yard), haul jobs, dispatcher (globally nearest idle truck per job, bundles same-route jobs up to capacity, sends idle trucks home), movement |
| `js/inspect.js` | Inspect-mode data: node → its connections/routes, for the hover/hold tooltip and highlight |
| `js/research.js` | Tech tree: one active project, cost/time, `SC.RESEARCH` effects (credit bonus, unlocks) |
| `js/placement.js` | Manual site placement: cost, validity (land/river/min-distance); supplier/factory locked behind research, truck yards are not |
| `js/camera.js` | World↔screen transform, pan/zoom/clamp (math only) |
| `js/render.js` | Canvas drawing (world coords under camera transform) |
| `js/input.js` | Pointer events: pan, pinch, wheel, tap-to-build, Inspect hover/hold |
| `js/ui.js` | HUD, orders/shop panels, toasts, help overlay |
| `js/sfx.js` | WebAudio blips (autoplay-unlock + mute pattern from cargo-lander) |
| `js/main.js` | Bootstrap, game loop, `?probe=N` headless verification hook |

`tests.html` runs the logic modules against hand-built deterministic maps
(straight river, fixed nodes) — see CLAUDE.md for the headless recipes.

## TODO backlog

See `PLAN.md` for the full phased roadmap; short version below (kept in
sync with it):

- Curved/waypoint roads; road congestion or per-road speed.
- Sound of moving trucks / ambient loop; music toggle separate from sfx.
- Difficulty ramp: order deadlines shrink at higher levels; game-over state.
- Touch: long-press as an alternative to double-tap for demolish/buy (the
  Inspect-mode hold gesture above uses the same long-press primitive).
- More research nodes (order-pay boosts, faster milestones); a
  "promotions" tech that temporarily boosts demand for a chosen good,
  per the plan's next-steps discussion. (The tree UI and four new techs
  — Asphalt Paving, Overdrive Engines, Fertilizer Program, Factory
  Automation — landed in v1.10/1.11; promotions/repeatable research is
  still open.)
- Research cancel/refund (currently a started project can't be aborted).
- Reassigning an existing truck to a different yard (today you choose a
  yard at purchase time only; there's no way to move a truck already
  in the fleet).
