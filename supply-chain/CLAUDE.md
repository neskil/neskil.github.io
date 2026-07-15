# Claude Code — Project Context (supply-chain)

**Supply Chain Tycoon**: a Mini-Metro-ish logistics game. HQ (⭐) is the
only order-placing location at the start; more customer DCs (🏢) unlock
over time on their own clock (`nextCustomerIn`, independent of the
supplier/factory milestone track — see `SC.map.unlockNext(filterFn)`).
Factories combine two raw materials/intermediates into a product
(emoji-first identity, e.g. 🌾+💧→🍞, 🪨+⚫→🔩→+💾→🚗), the player builds
roads and buys trucks/factories/upgrades; dispatch is automatic.

Doc map: **[README.md](README.md)** = architecture, module roles, game
rules, and the TODO backlog. This folder is fully self-contained — it
must NOT reference files outside `supply-chain/`. (The CV's ambient
network background is a separate, unrelated script: `cv/supply-chain-bg.js`.
Don't couple the two again.)

## Standing instructions
- After a code change, **run the test suite** (below), fix what breaks,
  then commit and push without waiting to be asked.
- Bump `SC.VERSION` (top of `js/config.js`) on every commit that ships a
  user-visible change, and update the `?v=X.Y.Z` cache-busting query on
  every local `<script>`/`<link>` tag in `index.html` AND `tests.html`
  (GitHub Pages caches aggressively; stale query strings keep mobile
  browsers on old JS after a deploy).
- Layering rule: `config/state/map/roads/factories/economy/vehicles/camera`
  are **pure logic** — no DOM, no canvas (that's what makes tests.html
  runnable headless). Only `render/input/ui/main` touch the DOM. Logic
  notifies the UI via `SC.emit(...)`/`SC.on(...)`, never directly.
- New script files must be added to `index.html`; logic modules also to
  `tests.html`. Load order matters: config → state → save → sfx → map →
  camera → roads → factories → economy → vehicles → research → placement →
  (render → input → ui → main).

## Verification (headless — works in any environment)
Serve the repo root, e.g. `python3 -m http.server 8199` from the repo root,
then (any headless Chromium works; on sandboxed Linux add `--no-sandbox`):

- **Logic tests**: `<chromium> --headless=new --disable-gpu
  --virtual-time-budget=15000 --dump-dom
  http://localhost:8199/supply-chain/tests.html`, grep for `id="summary"`
  — must say "N passed / **0 failed**" (39 tests at last count; N grows,
  0 failed is the bar).
- **Visual/gameplay smoke**: `index.html?probe=40` auto-builds the starter
  roads, spawns an order, and fast-forwards 40 simulated seconds
  synchronously (rAF does NOT tick reliably under `--virtual-time-budget`,
  so the probe drives ticks in a loop — same lesson as cargo-lander).
  Screenshot it with `--window-size=1280,800 --virtual-time-budget=6000
  --screenshot=out.png` and Read the PNG: expect roads, trucks, order
  bubbles, and money ≠ starting value. `?nohelp=1` skips the help overlay
  without running the probe. Add `&dc=1` to force `nextCustomerIn` down to
  3s so a second (customer DC) city appears within a short probe window —
  otherwise the default 50-70s first-spawn delay means most probes only
  ever show HQ. `&debt=900` forces a negative balance post-probe (red
  debt HUD / credit-limit UI); `&menu=1` opens the ☰ menu overlay on load.
  `&research=manualPlacement,creditLine2` instantly completes those techs
  (also tops up money so the Build section/menu are screenshotable).
  `&placemode=factory:shoes` arms manual-placement mode (requires
  `manualPlacement` researched — pass both together); `&hoverAt=x,y`
  (world coords) fakes a pointer position via `SC.input._setDebugHover`
  so the placement/road ghost preview renders without a real pointermove.
  `&capacity=1` maxes the truck-capacity upgrade so bundled multi-item
  hauls (the ×N badge over a truck) show up without a long probe.
  `&yard=1` builds a second truck yard near HQ, stations a truck there,
  and sets it as the active yard, for screenshotting the yard marker/
  per-yard truck counts.
- **Mobile layout**: same screenshot with `--window-size=390,844`.
