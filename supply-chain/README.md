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
  (sneaker factory), and the two-tier chain 🪨ore+⚫coal→🔩steel (smelter),
  🔩steel+💾chips→🚗cars (car factory). Steel is an intermediate — cities
  only order `orderable` goods; the planner recursively schedules smelter
  runs and inter-factory hauls for deeper chains. The goods tree lives in
  `js/config.js` (`SC.GOODS`) — adding a good/recipe is one entry there.
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
- **Trucks**: haul one item each; idle trucks take the nearest pending
  job. Buy more at the shop (price grows per truck); they spawn at HQ.
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
| `js/vehicles.js` | Trucks, haul jobs, dispatcher, movement |
| `js/camera.js` | World↔screen transform, pan/zoom/clamp (math only) |
| `js/render.js` | Canvas drawing (world coords under camera transform) |
| `js/input.js` | Pointer events: pan, pinch, wheel, tap-to-build |
| `js/ui.js` | HUD, orders/shop panels, toasts, help overlay |
| `js/sfx.js` | WebAudio blips (autoplay-unlock + mute pattern from cargo-lander) |
| `js/main.js` | Bootstrap, game loop, `?probe=N` headless verification hook |

`tests.html` runs the logic modules against hand-built deterministic maps
(straight river, fixed nodes) — see CLAUDE.md for the headless recipes.

## TODO backlog

- Truck capacity upgrade (haul 2+ items per trip).
- Curved/waypoint roads; road congestion or per-road speed.
- Sound of moving trucks / ambient loop; music toggle separate from sfx.
- Difficulty ramp: order deadlines shrink at higher levels; game-over state.
- Touch: long-press as an alternative to double-tap for demolish/buy.
