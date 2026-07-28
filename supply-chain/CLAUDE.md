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

This folder is fully self-contained — it must NOT reference files outside
`supply-chain/`. (The CV's ambient network background is a separate,
unrelated script: `cv/supply-chain-bg.js`. Don't couple the two again.)

## Doc map — who owns what

Four docs, each with one job. Put a fact in exactly one of them.

| Doc | Owns |
|---|---|
| **CLAUDE.md** (this file) | How to work in this folder: standing instructions, versioning, merge rules, layering, how to verify. |
| **[README.md](README.md)** | What the game *is* right now: game rules and the architecture/module table. |
| **[PLAN.md](PLAN.md)** | What happened and what's next: shipped log, phased roadmap, unbuilt backlog. |
| **[DEBUG.md](DEBUG.md)** | Every `?probe=`/`&flag` URL aid, as a table. |

**Never enumerate in prose what a config already enumerates.** Tech
counts, goods lists, upgrade ladders and flag lists drift the moment
someone adds an entry; point at `SC.RESEARCH`/`SC.GOODS`/`SC.CONFIG` in
`js/config.js` instead of restating them. When you *do* add a mechanic,
update the one doc that owns it, in the same commit.

## Standing instructions
- After a code change, **run the test suite** (below), fix what breaks,
  then **commit**, **merge in the latest `origin/master`** (fetch + merge,
  resolving any conflicts — this project runs several agent sessions in
  parallel, hence the "Merge master: reconcile…" commits throughout
  history), and **push**, all without waiting to be asked.
- **The maintainer always wants every change to end up merged to
  `master`** — that's the branch GitHub Pages deploys, so work stranded on
  a feature branch is not "done." So:
  - If this session is **not** pinned to a review branch, push straight to
    `master` (after merging the latest `origin/master` in, as above).
  - If the session **is** pinned to a review branch (e.g. a PR-based
    harness set a designated branch you must develop on and forbade pushing
    elsewhere), push to that branch — but the goal is still `master`.
    Follow it through: ensure the PR is opened and merged (enable
    auto-merge if the harness supports it) rather than leaving the branch
    unmerged. Note "merge in the latest `origin/master`" means pulling
    master's commits *into* your branch; it is **not** the same as landing
    your branch *onto* master — the change isn't shipped until master
    contains it.
- **Parallel sessions edit this folder.** Before committing, check
  `git status` for files you did not touch — another session's in-flight
  work can be sitting unstaged in the tree. Stage your own paths
  explicitly; never `git add -A` a dirty tree you didn't create.
- **Versioning / cache-busting (single-token model).** The version lives in
  ONE line — `window.SC_VERSION = 'X.Y.Z'` at the top of `index.html` (and an
  identical line in `tests.html`). A small inline loader in each file
  `document.write`s every `<script>`/`<link>` with `?v=SC_VERSION` appended, in
  the required load order, so the ~40 per-tag query strings no longer exist in
  the committed HTML. `js/config.js` copies the token into `SC.VERSION` (shown
  in the ☰ menu). To ship a user-visible change, bump the token in **three
  isolated spots**: `supply-chain/index.html`, `supply-chain/tests.html`, and
  the root `index.html` landing link (`supply-chain/index.html?v=X.Y.Z`). Do
  NOT reintroduce hand-written `?v=` tags on individual scripts, and do NOT
  hardcode a version in `config.js` — it must read `window.SC_VERSION`.
  (GitHub Pages caches aggressively / serves the branch directly with no build
  step, which is why the token is stamped at load time rather than at deploy.)
  Docs-only changes don't bump it.
- **Merging master under parallel agents (read before resolving conflicts).**
  With the single-token model the churn is tiny, but conflicts can still hit
  those token lines (and, genuinely, real code). The hazard is resolving them
  carelessly and deleting a sibling agent's work. Rules:
    - **Never `git checkout --ours/--theirs <file>` on a whole file to clear a
      merge.** It discards the *entire* other side of the file, including hunks
      git already auto-merged (a real feature from another agent). Resolve
      hunk-by-hunk instead.
    - For a version-token conflict: keep either side, then set the token (all
      three spots + they stay in sync) to the higher of the two bumped by one
      patch level so it exceeds both branches (e.g. master `1.52.0` + your work
      → `1.52.1`).
    - **Before committing the merge, prove nothing was dropped:** diff master
      against the merge base for each conflicted file
      (`git diff $(git merge-base HEAD origin/master) origin/master -- <file>`),
      confirm any non-version changes survived, then run the test suite AND a
      visual smoke (the shop/menu HTML is a frequent parallel-edit hot spot —
      e.g. a renamed button id will pass tests but break the UI).
- **Layering rule.** Everything except `render-*`, `input`, `ui`, `ui-bind`
  and `main` is **pure logic** — no DOM, no canvas. That's the rule that
  keeps `tests.html` runnable headless, and it's checkable rather than a
  list to maintain: `tests.html`'s loader carries exactly the logic modules,
  `index.html`'s carries those plus the DOM ones. Logic notifies the UI via
  `SC.emit(...)`/`SC.on(...)`, never directly.
- **Adding a script file**: add it by **module name** to the `mods` array in
  the inline loader in `index.html` (and, if it's a logic module, in
  `tests.html`'s loader too) — never as a hand-written `<script>` tag. Load
  order *is* array order. Two ordering constraints are load-time hard
  requirements, not style: `rng.js` must precede `map.js` (`SC.map`'s IIFE
  calls `SC.rng.create(...)` to seed its default RNG) and `audio.js` must
  precede `sfx.js` (audio owns the AudioContext and the music/sfx buses;
  sfx.js asks it for its bus on every blip). Beyond those, keep logic before
  render/input/ui, and `ui-bind` after `ui` (it wires handlers off
  `SC._ui`). The four `render-*` files share one internal context object
  (`SC._render`) published by `render-core`, so `render-core` goes first.

## Verification (headless)

Serve the repo root, then point a headless Chromium at it. On Windows:

```bash
python -m http.server 8199
```

Any headless Chromium works (on sandboxed Linux add `--no-sandbox`); below,
`<chromium>` stands for that binary.

- **Logic tests**: `<chromium> --headless=new --disable-gpu
  --virtual-time-budget=15000 --dump-dom
  http://localhost:8199/supply-chain/tests.html`, grep for `id="summary"`
  — must say "N passed / **0 failed**". 0 failed is the bar; N only grows.
- **Audio check**: the WebAudio layer can't live in `tests.html` — it needs a
  real user gesture to open an AudioContext, which headless only permits with
  `--autoplay-policy=no-user-gesture-required`. `audio-check.html` fakes the
  gesture and asserts the graph is wired and scheduling:
  `<chromium> --headless=new --disable-gpu --autoplay-policy=no-user-gesture-required
  --virtual-time-budget=8000 --dump-dom
  http://localhost:8199/supply-chain/audio-check.html`, grep for `id="summary"`
  — "N passed / **0 failed**". Worth running after ANY change to `audio.js`/
  `sfx.js`: `SC.audio.update()` runs inside main.js's rAF loop, so a throw in
  it freezes the entire game, and the plain `?probe=` smoke can't catch that
  (no gesture ever fires there, so the context stays suspended and update()
  returns early).
- **Visual/gameplay smoke**: `index.html?probe=40` fast-forwards 40 simulated
  seconds and is screenshotable with `--window-size=1280,800
  --virtual-time-budget=6000 --screenshot=out.png` — then Read the PNG:
  expect roads, trucks, order bubbles, and money ≠ starting value.
  **[DEBUG.md](DEBUG.md) lists every flag** for putting the game into a
  specific state (debt, night, a ferry, the research tree, …) — check it
  before hand-rolling a setup, and add a row when you add a flag.
- **Research tree zoom/readability**: `<chromium> --headless=new --disable-gpu
  --window-size=900,1100 --virtual-time-budget=15000 --dump-dom
  http://localhost:8199/supply-chain/research-zoom-check.html`, grep for
  `id="summary"` — "N passed / **0 failed**". It drives the real game in a
  500px-wide iframe (which dodges the headless viewport floor below) and
  asserts the phone-facing behaviour `tests.html` can't reach: the tree opens
  at a legible 1:1, pinch/± zoom is anchored, drag still pans, and a tap still
  starts a tech. Worth running after any change to `fitResearchTree` /
  `updateResearchTree` in `ui.js` or the tree's pointer handlers in
  `ui-bind.js`.
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
  reason about the real (unclamped) viewport math by hand.
