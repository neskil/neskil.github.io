# Data Room — standing instructions

Eight 3D visualizations behind one scene switcher. Vanilla JS, three.js r128
vendored, no build step. Read `.agents/AGENTS.md` first for the workspace-wide
rules; this file owns what is specific to this folder.

## Shape of the thing

| File | Owns |
| --- | --- |
| `index.html` | The page: head/meta, the HUD markup, and the ordered `<script>` list. |
| `style.css` | All of the chrome. There is no per-scene CSS. |
| `js/app.js` | The shell — renderer, loop, scene registry, HUD, orbit controller, quality ladder, control widgets. |
| `js/scene-*.js` | One self-contained scene each. |
| `js/data/*.js` | Baked data: the land mask, the port table, the repo stats. |
| `vendor/three.min.js` | three.js r128, UMD global. Do not upgrade casually — the scenes use r128 shader-chunk names and `sRGBEncoding`. |

## The scene contract

A scene calls `VizApp.register({...})` and gets told when to run. It **never**
touches the canvas, the loop, the HUD or the document body.

Required: `id`, `label`, `title`, `blurb`, `accent`, `init(ctx)` returning
`{ scene, camera }`. Optional: `hint`, `legend`, `controls`, `update(dt, t)`,
`resize(w, h)`, `onPointerMove/Down/Up/Leave(pointer)`, `dispose()`.

`legend` and `controls` are **declarations**, not DOM — the shell renders both.
A scene that appends its own elements to the body is a scene that will leak one
on a switch; that already happened once and is why the API is shaped this way.

The shell hands scenes four things worth knowing about:

- `VizApp.makeOrbit(camera, dom, opts)` — spherical camera with damping,
  pinch-zoom and a `focus(theta, phi)` setter. Home-grown because r128's
  OrbitControls has `getAzimuthalAngle` but no setter.
- `VizApp.makeQualityLadder(renderer, rungs, apply)` — for per-pixel scenes
  only (nebula, Mandelbulb). Measures its own frame rate off the wall clock,
  **not** the loop's `dt`, which is clamped to 100ms and would hide exactly
  the slow frames it needs to see.
- `VizApp.fitDistance(camera, radius)` — how far back the camera must sit for
  something of that radius to fit on **both** axes. A perspective camera's fov
  is vertical only, so portrait phones clip the sides without this.
- `VizApp.setControl(id, value)` — when one control changes another.

## Traps

- **`gl_PointSize` is in buffer pixels**, and the buffer is CSS size × pixel
  ratio. Every point scene multiplies its scale by `renderer.getPixelRatio()`,
  or dots come out half-size on a retina screen.
- **The point-size constant is per-scene.** It converts world units to pixels
  at the distance that camera actually sits. Copying the globe's constant into
  a scene whose camera is eight times further out puts every point below one
  pixel.
- **Shader compile cost is real.** The compiler unrolls march loops, so every
  noise or distance-estimator call inside one is paid for dozens of times in
  the compiled program. The nebula and the Mandelbulb both had to have their
  loop bounds cut before a software rasteriser would compile them at all, and a
  shader that takes half a minute to build is a blank page on a slow machine.
  If you add per-pixel work, check it still compiles quickly.
- **Scene switches must free GPU memory.** `disposeTree` in the shell walks
  what it is replacing; a scene holding its own textures should drop them in
  `dispose()`.
- **`[hidden]` loses to a class that sets `display`.** `style.css` has a
  `[hidden] { display: none !important }` rule for exactly this; keep it.

## Versioning and cache-busting

Bump the `?v=` on every local `<script>` and `<link>` in `index.html` together
whenever any of them changes, and bump the `href` on the landing-page card in
the root `index.html` to match. They are all one number on purpose.

## Verifying a change

There is no test harness here yet (see "Open items"). Verify headless:

```
python -m http.server 8000
chromium --headless=new --hide-scrollbars --window-size=1280,800 \
         --virtual-time-budget=8000 \
         --screenshot=out.png "http://localhost:8000/viz-poc/#globe"
```

Any scene can be deep-linked with its `id` as the fragment, and changing the
fragment on a running page switches scenes. What to check after a change that
touches the shell: every scene in both directions, the legend row count per
scene, that exactly one canvas exists, that the Mandelbulb's and nebula's
buffer shrinks under load and is restored on leaving them, and a portrait
viewport.

## Open items

- **No test harness.** Every other project of this size in the repo has a
  `tests.html`. This should get one, plus the `robots.txt` Disallow and
  `noindex` that go with a test page.
- **`js/data/city.js` is measured by hand** and was accurate on 2026-09-03. It
  drifts from the day it is written. Nothing breaks as it ages — a building is
  the wrong height — but regenerate it when it starts to look wrong.
- **The land mask is coarse and hand-drawn.** Good enough for a dot the size of
  a dot; it will look wrong to anyone who knows a coastline well.
- **Port throughput is rounded 2023 figures.** Close enough to size a dot
  honestly, not close enough to quote.
