# Data Room — plan

A proof of concept for a "3D visualization" card on the landing page. Four
visualizations behind one scene switcher, built one at a time. Nothing here is
released: the page carries `noindex`, sits behind a `Disallow` in
`robots.txt`, and stays out of `sitemap.xml` until it graduates.

Right now it is reachable from the **Under Construction** card (`#card-wip`) on
the landing page, which is what `.agents/AGENTS.md` keeps that card's CSS
around for.

## The four scenes

Ordered as they'll be built. Each is a self-contained module under `js/` that
registers itself with `VizApp`; the shell owns the renderer, the loop and the
HUD, so a scene is only ever `init / update / resize / dispose`.

### 1. Trade-flow globe — `scene-globe.js`

A slowly rotating night-side globe. Real ports as glowing nodes, great-circle
arcs between them, cargo pulses travelling the arcs at a speed set by the
lane's volume. Hover a port to isolate its lanes and read its throughput.

The on-brand one: this site is Cargo Lander and Supply Chain Tycoon, and the
owner does supply chain planning for a living. Port table is hand-authored in
`js/data/ports.js` — no API, no key, no network at runtime.

### 2. Site-as-a-city — `scene-city.js`

The repo rendered as a city block. One tower per project folder: footprint from
file count, height from lines of code, colour from how recently it was touched.
Orbit around it; click a tower to open that project.

The one nobody else has. It also earns its keep as a navigation surface — it is
the site's own table of contents, in a form you can fly through. Stats are
baked at authoring time into `js/data/city.js` (there is no build step to
generate them at deploy, and a runtime crawl of the repo isn't possible from a
static page).

### 3. Particle morph field — `scene-particles.js`

~100k points that flow between shapes — sphere, torus knot, the site's name as
3D lettering — with a mouse-driven turbulence well and additive blending. All
interpolation happens in the vertex shader off a per-point pair of target
positions, so the CPU does nothing per frame.

The pure eye-candy one, and the cheapest to build. Its job is the moment the
card is flipped: this is the shot that goes in `assets/preview/`.

### 4. Raymarched nebula — `scene-nebula.js`

One fullscreen quad and a fragment shader: FBM volumetric cloud march, parallax
on pointer, depth on scroll. No geometry at all.

Wallpaper rather than a toy, so it goes last — but it is ~200 lines and it is
the one that will still look good in five years.

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
6. Replace `#card-wip` in `index.html` with a real flip card, and add a row to
   the site layout table in the root README.
