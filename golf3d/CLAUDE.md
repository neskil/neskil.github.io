# Claude Code — Project Context (golf3d)

**Loft Links**: seven six-hole courses of 3D golf on vendored three.js (r128),
ES5-flavoured plain JavaScript, no build step. Open `index.html` and it runs.

Doc map: **[README.md](README.md)** owns the architecture, the file roles and
load order, why each shader is written the way it is, the course-authoring
vocabulary, and the controls. Workspace-wide rules (stack, styling, commit
prefixes) live in [`.agents/AGENTS.md`](../.agents/AGENTS.md). Don't restate
either here — point at them.

## Standing instructions

- **Finish on `master`, without being asked.** A change here is not done when
  the feature branch is pushed. Once it is complete and verified:
  1. `git fetch origin master` and fast-forward local `master` to it.
  2. Merge the branch with `--no-ff` and a `merge: <summary>` subject reusing
     the feature commit's one-line summary — the shape most merges in this
     folder's history already take.
  3. **Re-run the verification on the merged result**, not just on the branch.
     `master` moves under long-running work; the merge can pull in a commit the
     branch was never tested against.
  4. `git push -u origin master`.

  Don't open a PR for it. A PR is for when the owner asks for one, or when
  landing it needs a call that isn't yours — a conflict where both sides
  changed the same behaviour, or a change reaching outside `golf3d/`.
- **Verify before committing at all**: `tests.html` must stay fully green, and
  anything visual needs to be looked at in a real browser (recipe below) rather
  than reasoned about. A shader that compiles is not a shader that looks right.
- Bump `G3.VERSION` (top of `js/config.js`) on every commit that ships a
  user-visible change — patch for fixes, minor for features — and update the
  matching `?v=X.Y.Z` cache-busting string on **every** local `<script>` and
  `<link>` in `index.html`. GitHub Pages caches hard; a stale query string
  means phones keep running the old JS after a deploy. Skip only for
  docs/comment-only or pure-refactor commits.

## Verification

`tests.html` is headless and needs a local server (the modules are separate
`<script>` tags, so `file://` will not do):

```sh
python3 -m http.server 8899          # from the repo root, not from golf3d/
```

Then load `http://localhost:8899/golf3d/tests.html` and read the summary line —
it prints `✓ N passed` or lists the failures. It covers the physics, the pads
and surfaces, the walls and gates, and the course geometry; it does **not**
load WebGL, so it can tell you a hole is built wrong and can never tell you a
shader is wrong.

For anything visual, drive the real page with Playwright (installed globally;
`NODE_PATH=$(npm root -g)`) on SwiftShader:

```js
chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
```

`?course=<id>&hole=1..6&weather=<id>` jumps straight to a hole under a chosen
sky, which is what makes a before/after screenshot pair reproducible. Listen on
`pageerror` and on `console` for `THREE.WebGL` — **a GLSL compile failure does
not throw**, it logs and leaves you with a black or untextured surface, so a
screenshot that looks plausible is not on its own proof the shader compiled.

## Things that will bite

- **The lit materials hand three.js an sRGB hex as a linear albedo, on
  purpose** — that is the palette, not a bug to fix. The two unlit shaders (sky
  and water) convert properly via `lin()`; the fog colour is deliberately left
  unconverted in both, because it has to match three.js's own fog on the lit
  materials. See README → "Light".
- **Water and sky are raw `ShaderMaterial`s** in `js/shaders.js`, written as
  arrays of GLSL source strings. The turf is a third thing: four fragments
  spliced into three.js's Lambert via `onBeforeCompile`. Changing any of them
  means reading GLSL, not setting a property.
- **The pretty water path is `#ifdef PRETTY` inside the one water shader**,
  flipped by `render.setWaterQuality()` and remembered in `localStorage`. Keep
  both paths in that single source — a forked copy will drift — and keep the
  wave level-of-detail *outside* the ifdef: it is an aliasing fix both paths
  need, not an effect.
