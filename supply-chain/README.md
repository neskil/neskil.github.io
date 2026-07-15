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

- **Materials & recipes**: three raw materials (red/blue/yellow ore, from
  supplier hexagons). A factory (square) turns two raws into one product:
  red+blue → purple, yellow+blue → green, red+yellow → orange.
- **Orders**: cities (circles) place timed orders (product × qty, payout).
  The planner picks the cheapest operational factory that can reach both
  ingredient suppliers and the ordering city over the road network; if
  none exists the order shows "no route!" until you build one.
- **Roads**: tap node → tap node. Cost scales with length; crossing the
  river costs 3× (bridge). Tap a road twice to demolish for a 50% refund
  (refused while a truck is on it).
- **Trucks**: haul one item each; idle trucks take the nearest pending
  job. Buy more at the shop (price grows per truck); they spawn at HQ.
- **Growth**: every 4 filled orders a locked site activates — new cities,
  suppliers, or factory sites you can buy (tap twice).
- **Camera**: drag to pan, wheel/pinch to zoom.
- Endless play; "Filled" vs "Missed" on the HUD is the score.

## Architecture

Plain ES5-ish scripts on one `window.SC` namespace, no build step.
Strict layering: logic modules never touch the DOM (headless-testable);
they signal the UI through the tiny `SC.on`/`SC.emit` pub/sub in state.js.

| File | Role |
|---|---|
| `js/config.js` | Constants, materials, recipes, prices, `SC.VERSION` |
| `js/state.js` | `SC.state` factory, pub/sub, derived getters (prices, speeds) |
| `js/map.js` | World gen: river, node sites, starter cluster, milestone unlocks |
| `js/roads.js` | Road build/demolish/quote + Dijkstra pathfinding |
| `js/factories.js` | Craft tasks, raw intake, production ticks, site purchase |
| `js/economy.js` | Orders (spawn/plan/deliver/expire), money, upgrades |
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
- Save/load game state to localStorage.
- Difficulty ramp: order deadlines shrink at higher levels; game-over state.
- Touch: long-press as an alternative to double-tap for demolish/buy.
