# Data Room — plan

A proof of concept for a "3D visualization" card on the landing page. Four
visualizations behind one scene switcher. **All four are built** — what is
left is the release work in the last section, not the scenes.

Nothing here is released: the page carries `noindex`, sits behind a
`Disallow` in `robots.txt`, and stays out of `sitemap.xml` until it
graduates.

Right now it is reachable from the **Under Construction** card (`#card-wip`) on
the landing page, which is what `.agents/AGENTS.md` keeps that card's CSS
around for.

## The four scenes

In switcher order. Each is a self-contained module under `js/` that registers
itself with `VizApp`; the shell owns the renderer, the loop and the HUD, so a
scene is only ever `init / update / resize / dispose`, plus optional pointer
hooks. Nothing in a scene touches the canvas or the chrome.

### 1. Trade-flow globe — `scene-globe.js` ✅

A slowly rotating night-side globe. Real ports as glowing nodes, great-circle
arcs between them, cargo pulses travelling the arcs at a speed set by the
lane's volume. Hover a port to isolate its lanes and read its throughput.

The on-brand one: this site is Cargo Lander and Supply Chain Tycoon, and the
owner does supply chain planning for a living. Port table is hand-authored in
`js/data/ports.js` — no API, no key, no network at runtime.

### 2. Site-as-a-city — `scene-city.js` ✅

The repo rendered as a city block. One tower per project folder: footprint from
file count, height from lines of code, colour from how recently it was touched.
Orbit around it; click a tower to open that project.

The one nobody else has. It also earns its keep as a navigation surface — it is
the site's own table of contents, in a form you can fly through. Stats are
baked at authoring time into `js/data/city.js` (there is no build step to
generate them at deploy, and a runtime crawl of the repo isn't possible from a
static page).

### 3. Particle morph field — `scene-particles.js` ✅

~100k points that flow between shapes — sphere, torus knot, the site's name as
3D lettering — with a mouse-driven turbulence well and additive blending. All
interpolation happens in the vertex shader off a per-point pair of target
positions, so the CPU does nothing per frame.

The pure eye-candy one. Its job is the moment the card is flipped, so this is
the shot that goes in `assets/preview/`. The word is sampled off a 2D canvas —
draw the text, read back which pixels are lit — and is the one flat shape, so
the camera turns to face it while it forms.

### 4. Raymarched nebula — `scene-nebula.js` ✅

One fullscreen quad and a fragment shader: FBM volumetric cloud march, parallax
on pointer, depth on scroll. No geometry at all.

Wallpaper rather than a toy, but it is the one that will still look good in
five years. It is also the only scene whose cost scales with pixel count
rather than with the number of things on screen, so it carries a measured
quality ladder: if frames get slow it drops render scale and march length a
rung at a time, and hands the full-resolution buffer back on the way out.

## Graduating to a real card

When this stops being a PoC, in this order:

1. Pick the name. "Data Room" is a placeholder.
2. Add the Google Analytics tag (`G-9GP823TGLB`) to `<head>` — AGENTS.md
   requires it on every released public page, and it is deliberately absent
   while this is WIP.
3. Add `<link rel="canonical">`, `<meta name="description">` and the OG /
   Twitter tags; shoot `assets/og/viz-poc.png` at 1200x630 per the recipe in
   the root README.
4. Drop the `noindex` meta and the `robots.txt` `Disallow` line, and add the
   URL to `sitemap.xml`.
5. Shoot `assets/preview/*.webp` card backs — the README is explicit that they
   must show the thing *running*, so drive a scene in first. More than one shot
   is supported; the card cross-fades them.
6. Replace `#card-wip` in `index.html` with a real flip card, and promote the
   row in the root README's layout table out of "work in progress".

## Known gaps, if this goes further

- **`js/data/city.js` is measured by hand.** It was accurate on 2026-09-02 and
  drifts from the day it is written. Nothing breaks as it ages — a building is
  just the wrong height — but a stale Data Room tower is the sort of thing
  that reads as carelessness rather than as a snapshot.
- **The land mask is coarse and hand-drawn.** Good enough for a dot the size
  of a dot; not good enough for anyone to navigate by, and it will look wrong
  to anyone who knows a coastline well.
- **Port throughput is rounded 2023 figures.** Close enough to size a dot
  honestly, not close enough to quote.
- **No test harness.** Every other project of this size in the repo has one
  (`*/tests.html`). If this becomes a real card it should get the same, and
  the same `robots.txt` treatment that goes with it.
