# Debug & screenshot flags

URL flags on `supply-chain/index.html`, used to put the game into a
specific state for a headless screenshot or a quick manual check. None of
this is reachable by a normal player.

**Two groups, and the difference matters:**

- **Standalone flags** are read during boot/render and work on their own.
- **Probe flags** are read inside `SC.runProbe()` ([js/main.js](js/main.js)),
  so they do nothing without `?probe=N`. They are written `&flag` below.

`?probe=N` builds the starter roads (bakery→wheat, →water, →HQ), spawns an
order, and fast-forwards N simulated seconds **synchronously** — rAF does
not tick reliably under `--virtual-time-budget`, so the probe drives the
ticks in a loop itself (same lesson as cargo-lander).

Adding a flag? Add the row here too — this table is the whole contract.

## Standalone

| Flag | Effect |
|---|---|
| `?probe=N` | Starter roads + one order, fast-forward N simulated seconds. The gate for every `&` flag below. |
| `?new=1` | New-game screen incl. the difficulty picker. |
| `?nohelp=1` | Skip the help overlay without running the probe. |
| `?seed=xyz` | Reproduce a specific map (river shape, node layout). Same mechanism as the shareable `?seed=` on a real new game; pair with `probe` for a deterministic screenshot of a known layout. |
| `?tutorial=N` | Drop a fresh world onto guided-tutorial step N (1-based, default 1), for the banner and the focus dim/rings. Pair with `nohelp=1`. Deliberately *not* part of `probe` — the starter roads would satisfy the first three steps before the shot is taken. `?tutorial=1&probe=40` is useful the other way round: verifying the sequence auto-completes and the banner retires. |
| `?menu=1` | Open the ☰ menu overlay on load. |
| `?techtree=1` | Open the 🔬 Research overlay (its own menu, separate from the Shop panel's Build/Buy list). |
| `?dev=1` | Force the Dev tools panel on for this load — and adopt it as the persisted choice. It is otherwise a lasting ☰-menu toggle ("🛠 Dev tools: on/off", stored in localStorage like Sound). |
| `?tod=0..1` | Pin the cosmetic day/night phase — 0/1 midnight, 0.25 sunrise, 0.5 noon, 0.75 sunset. Read in [js/render-env.js](js/render-env.js); render-only, not persisted. |
| `?weather=clear\|clouds\|rain\|snow` | Force a weather spell (it otherwise rotates on its own). Render-only, not persisted. |

## Probe flags — world & map

| Flag | Effect |
|---|---|
| `&dc=1` | Force `nextCustomerIn` to 3s so a second (customer DC) city appears inside a short probe. Without it the 50-70s first-spawn delay means most probes only ever show HQ. |
| `&expand=N` | Apply N field expansions up front — bigger playing field, terrain backdrop pushed out, and per expansion a seeded frontier supplier + for-sale factory. Saves researching `landSurvey` and buying each parcel by hand. |
| `&region=1` | Unlock the next adjacent region (`SC.map.unlockRegion`). |
| `&focus=x,y[,zoom]` | Point the camera at a world position. Screenshots otherwise always frame the HQ cluster — this is how far corners, specific sites, or a whole-map view (low zoom) get verified. |
| `&sitegallery=1` | Drop one active supplier of every raw material in a grid beside HQ (bypassing placement rules) so all themed site models — farm/lake/mine/pasture/grove/fab — fit in one shot. |
| `&yard=1` | Build a second truck yard near HQ, station a truck there, make it active. For the yard marker + per-yard truck counts. |
| `&junction=1` | Place a junction near HQ (same ring-search as `&yard=1`) and road it in, for the roundabout marker (`drawJunction`). |
| `&ferry=1` | Build a ferry from HQ to a node mirrored across the river (crosses it regardless of seed), for the teal dashed lane confined to the water stretch (`SC.map.riverCrossing`) — road renders normally on both banks right up to the water's edge. |
| `&bridge=1` | Same trick without the ferry option: the piered, lifted-deck bridge spanning only the water. |
| `&crossing=1` | Fire the Bridge-vs-Ferry `crossingChoice` modal directly, for the choice UI without tapping a real river-crossing road. |

## Probe flags — economy & fail states

| Flag | Effect |
|---|---|
| `&debt=900` | Force a negative balance post-probe (red debt HUD / credit-limit UI). |
| `&doom=42` | Force a balance beyond the credit limit with 42s on the countdown (⚠ HUD state). |
| `&gameover=1` | Trigger the foreclosure overlay. |
| `&contract=1` | Force-roll a contract offer (skips the random `CONTRACT_INTERVAL` wait), for the Accept/Decline card. |
| `&contract=accept` | Same, and auto-accepts it into a real gold-outlined 📜 order in the Orders panel. |
| `&promo=1` | Complete Marketing Blitz and start a promotion (shop button shows the running timer). |
| `&drain=1` | Empty supplier stocks (red low-stock bars). |
| `&suplevel=2` | Level every supplier up twice (▲ pips). |
| `&spec=1` | Specialize the first factory into its own recipe. |

## Probe flags — research & building

| Flag | Effect |
|---|---|
| `&research=id,id` | Instantly complete those techs by id (also tops up money, so the Build section/menu are screenshotable). Ids are the keys of `SC.RESEARCH` in [js/config.js](js/config.js). |
| `&placemode=factory:shoes` | Arm manual-placement mode. Requires `manualPlacement` researched — pass both together. |
| `&hoverAt=x,y` | Fake a pointer position (world coords) via `SC.input._setDebugHover`, so the placement/road ghost preview renders without a real pointermove. |
| `&inspect=<mat>\|hq\|factory\|<node id>` | Switch to inspect mode and open the tooltip on a node via `SC.input._setDebugInspect`, without a real tap — a raw material name (`wheat`, `ore`, …) picks the first active supplier of it. The way to screenshot what a site reports: stock, rate, and its biome/yield row. |
| `&highway=1` | Complete Asphalt Paving and pave every built road (highway styling). |
| `&capacity=1` | Max the truck-capacity upgrade, so bundled multi-item hauls (the ×N badge) show up without a long probe. |
| `&interchange=1` | Complete the Road Crossings research, drop a waypoint either side of the first starter road and connect them, so the **interchange** a legal crossing builds (junction on the crossing point, both roads split through it — see README "Overlap rules") can be screenshotted. Pair with `&focus=` to frame it. |
| `&select=hq\|factory\|<node id>` | Pick the node a road would start from, so `&hoverAt=` renders the build ghost. With the crossings research it rings each interchange the road would build and prices it there; without it the ghost goes red with the block reason, a ✕ + clearance ring (or a red-lit road) on whatever is in the way, and the green legal alternative beside it. Those pointing marks are a second render pass (`R.drawGhostMarks()`, after the entity pass) — verify them at a decent `&focus=` zoom, since at low zoom they hide under the site art they point at. |

## Probe flags — visuals & UI

| Flag | Effect |
|---|---|
| `&jam=1` | Force-enable congestion and park 4 trucks mid-span on the factory→HQ edge (bypassing real dispatch timing) so the red congestion glow is deterministic. |
| `&routeglow=1` | Pin the first planned order's route-glow overlay (each leg tinted by the cargo hauled on it) with a far-off expiry so it survives the screenshot delay. |
| `&xfer=1` | Spawn a persistent loading + unloading crate near HQ, so the pickup/delivery crate animation can be caught without hitting a real 0.55s transfer. |
| `&stats=1` | Force sample deliveries / money history / road trips and a few unlocked achievements, then open the Stats & Achievements overlay directly. |
| `&speed=N` | Set the fast-forward multiplier (1/2/4) before the probe loop runs — mostly for eyeballing that higher speeds don't desync anything over a longer probe. |

## Dev tools panel

A lasting ☰-menu toggle, not a URL flag (`?dev=1` just forces it on and
persists that choice). Once on, a collapsible panel under the top-left HUD
bar offers:

- **FPS** readout.
- **Congestion** toggle — `SC.state.congestionEnabled` is otherwise fixed by
  difficulty for the whole run and is not player-facing; this is the way to
  A/B a map with and without it.
- **Add money** (+$10,000).
- **Roll contract** — force `rollContractOffer` now instead of waiting out
  `CONTRACT_INTERVAL`.
- **Finish research** — complete the active project instantly (disabled with
  none active).
- **Spawn next customer** — zero `nextCustomerIn` and re-tick, so the next
  customer DC unlocks immediately.

It lives entirely in [js/ui.js](js/ui.js), and each button calls the same
public logic function a normal action would (`rollContractOffer`,
`research.tick`, …) rather than duplicating it.
