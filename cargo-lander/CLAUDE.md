# Claude Code — Project Context (cargo-lander)

Doc map: **[README.md](README.md)** = current architecture, file roles, load
order, conventions, verification recipes, and the open TODO backlog.
**[HISTORY.md](HISTORY.md)** = shipped work, resolved bug sagas, archived
plans — check it before re-diagnosing an old-sounding bug.

## Standing instructions
- After making a code change in this project, **test it** (tests.html suite +
  exercising any new mechanic against the live `game`/`game.physics` objects —
  headless if no interactive browser is available, see below), fix any bugs
  found, then **commit and push** — without waiting to be asked each time.
- After a feature branch is fully merged into `master` and pushed to remote, ask the user if they want to clean up the branch (delete feature branch and remove git worktree).
- Bump `CargoGame.VERSION` (top of `game.js`, shown in-game as `vX.Y.Z`) on
  every commit that ships a user-visible change: patch for fixes/tweaks, minor
  for new features. Skip only for docs/comment-only or pure-refactor commits.
  Whenever you bump it, also update the `?v=X.Y.Z` cache-busting query string
  on every local `<script src="...">` tag in `index.html` and `tests.html`
  (GitHub Pages caches aggressively; a stale query string means mobile
  browsers keep serving old JS after a deploy — bumping it is what forces a
  fresh fetch without the user needing a manual hard-refresh).
- The mission grid and dev-panel jump buttons are auto-generated from
  `levels[]` (`generateMissionUI()` in `game/menu.js`). Adding a new
  `levelN.js` still requires manually adding its `<script>` tag in
  `index.html`, or it won't be registered at all.
- `game.js` and `physics.js` are classes extended by prototype-mixin files
  (`game/*.js`, `render.js` + `render/*.js`, `physics/*.js`). If a method
  isn't in the class file, grep the sibling directories. Keep new methods in
  the module that matches their concern; script load order lives in
  `index.html` AND `tests.html` — a new mixin file must be added to both.
- Cargo removal must go through `removeCargoBox()` (`game/cargo.js`), never a
  raw `boxes.splice()`.
- Mid-air flythrough pickups (`collectibles: [...]` on a level config) are
  driven by the `COLLECTIBLE_TYPES` registry in `levels/collectibleTypes.js`
  — physics (award logic), rendering (token visual), and the level editor
  (Entities panel add-buttons/list/markers/export) all read it generically.
  Adding a new pickup type is one registry entry there, not new branches in
  those three places.

## Verification (headless — works in any environment)
**Run `./run-tests.sh` first** (from `cargo-lander/`): one command that
serves the folder and runs the boot smoke (`syntax-check.html` — every
script parses + every mixin attached), the tests.html suite, the editor
self-tests + export round-trip, and a game boot probe; exits non-zero on any
failure. The recipes below are for drilling into a specific failure or
visual, using whatever headless Chromium the environment provides (`chrome`,
`chromium`, or a Playwright `headless_shell`; on sandboxed Linux add
`--no-sandbox`):

- **Test suite**: `<chromium> --headless=new --disable-gpu
  --virtual-time-budget=15000 --dump-dom http://localhost:8177/tests.html`,
  then grep the dump for `id="summary"` — must say "N passed / **0 failed**"
  (89 tests at last count; N grows, 0 failed is the bar).
  `--virtual-time-budget` fast-forwards timers so the async run completes
  before the dump.
- **Visual checks**: `probe-screenshot.html?level=N&x=..&y=..&zoom=..`
  (0-based level index) + `--window-size=1280,800 --virtual-time-budget=8000
  --screenshot=out.png`, then Read the PNG. `&debug=1` dumps computed-style
  diagnostics (this caught a CSS rule silently collapsing the minimap to
  2×2px — invisible with zero console errors); `&hide=fn1,fn2` no-ops draw
  calls to bisect a visual; `&script=name` runs scripted repros — add new
  ones there instead of one-off console fiddling. The probe stamps the
  post-FX shader link status bottom-left, since a failed WebGL compile is
  otherwise silent.
- **Multi-frame mechanics**: `--virtual-time-budget` does NOT reliably tick
  `requestAnimationFrame` — drive the physics in a synchronous loop instead
  (see `probe-screenshot.html`'s `parachuteSim` for the pattern).
- **Console-driven mechanic checks**: move the lander by setting
  `game.physics.lander.x/y` **and** `Matter.Body.setPosition(
  game.physics.landerBody, {x,y})` together — updating only one desyncs the
  body from its mirror and fakes collision damage. Step with
  `game.update(1.0)` (dt≈1.0 = one 60fps frame).

Full recipes and the mobile manual-QA checklist: README.md → Verification.
