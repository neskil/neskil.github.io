# Claude Code — Project Context (supply-chain)

**Supply Chain Tycoon**: a Mini-Metro-ish logistics game. HQ (⭐) is the
only order-placing location at the start; more customer DCs (🏢) unlock
over time on their own clock (`nextCustomerIn`, independent of the
supplier/factory milestone track — see `SC.map.unlockNext(filterFn)`).
Factories combine two raw materials/intermediates into a product
(emoji-first identity, e.g. 🌾+💧→🍞, 🪨+⚫→🔩→+💾→🚗, and the 3-tier
🟠+🛞→🧵→+💾→🔌→+🔩→🤖 chain that shares rubber/chips/steel with the
sneaker/car chains), the player builds roads and buys trucks/factories/
upgrades; dispatch is automatic.

Doc map: **[README.md](README.md)** = architecture, module roles, game
rules, and the TODO backlog. This folder is fully self-contained — it
must NOT reference files outside `supply-chain/`. (The CV's ambient
network background is a separate, unrelated script: `cv/supply-chain-bg.js`.
Don't couple the two again.)

## Standing instructions
- After a code change, **run the test suite** (below), fix what breaks,
  then **commit**, **merge in the latest `origin/master`** (fetch + merge,
  resolving any conflicts — this project runs several agent sessions in
  parallel, hence the "Merge master: reconcile…" commits throughout
  history), and **push**, all without waiting to be asked. Only skip the
  merge/push step if the repo's git workflow for this session pins you to
  a review branch instead (e.g. a PR-based harness) — in that case commit
  and push to that branch and let the normal review/merge flow take it
  from there.
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
  `tests.html`. Load order matters: config → state → save → sfx → rng →
  map → camera → roads → factories → economy → vehicles → inspect →
  research → placement → (render → input → ui → main). (`rng.js` must
  precede `map.js`: `SC.map`'s IIFE calls `SC.rng.create(...)` at
  load time to seed its default RNG.)

## Verification (headless — works in any environment)
Serve the repo root, e.g. `python3 -m http.server 8199` from the repo root,
then (any headless Chromium works; on sandboxed Linux add `--no-sandbox`):

- **Logic tests**: `<chromium> --headless=new --disable-gpu
  --virtual-time-budget=15000 --dump-dom
  http://localhost:8199/supply-chain/tests.html`, grep for `id="summary"`
  — must say "N passed / **0 failed**" (110 tests at last count; N grows,
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
  per-yard truck counts. `&highway=1` completes pavedRoads and paves all
  built roads (highway styling); `&suplevel=2` levels every supplier up
  twice (▲ pips); `&drain=1` empties supplier stocks (red low-stock
  bars). `&doom=42` forces a balance beyond the credit limit with 42s
  on the default countdown (⚠ HUD state); `&gameover=1` triggers the
  foreclosure overlay; `&promo=1` completes Marketing Blitz and starts
  a promotion (shop button shows the running timer). `?new=1` (no
  probe) shows the new-game screen incl. the difficulty picker.
  `&techtree=1` opens the 🔬 Research overlay
  (its own menu, separate from the Shop panel's Build/Buy list) on load,
  for screenshotting the tree layout. `&speed=N` sets the fast-forward
  multiplier (1/2/4) before the probe loop runs — mostly useful for
  eyeballing that higher speeds don't desync anything over a longer
  synchronous probe. `&seed=xyz` reproduces a specific map (river shape,
  node layout) instead of a random one — same mechanism as the shareable
  `?seed=` on a real new game; pair with `probe` to get a deterministic
  screenshot of a known layout. `&jam=1` force-enables congestion and
  parks 4 trucks mid-span on the factory→HQ edge (bypassing real
  dispatch timing) so the red congestion glow can be screenshotted
  deterministically.
- **Mobile layout**: same screenshot with `--window-size=390,844`. Caveat
  found while building the research-tree overlay: this Chromium build
  enforces a **hard ~500px minimum layout viewport** in headless mode —
  `document.documentElement.clientWidth` reads 500 for any `--window-size`
  narrower than that (confirmed at 320/390/450/499, all clamp to 500;
  501+ tracks the requested size), while `--screenshot` still crops to
  the requested (e.g. 390×844) pixel dimensions. So a "mobile" screenshot
  below ~500 wide shows a left-edge *crop* of the 500px-wide layout, not
  a true narrow-viewport render — centered elements (`margin: auto` /
  flex `justify-content: center`) will look like they overflow the right
  edge even when they're correctly centered in the real (500px) layout.
  Don't chase that as a CSS bug; verify centered/capped-width overlays at
  `--window-size=500,844` or wider instead, or note the discrepancy and
  reason about the real (unclamped) viewport port math by hand.
