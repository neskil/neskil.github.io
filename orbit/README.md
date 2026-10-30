# Pocket Orbit

Fly a cargo tug round a pocket-sized Earth with real orbital mechanics. Seven
missions and a sandbox, in vanilla JS on a 2D canvas, with no dependencies.

| File | What it holds |
| --- | --- |
| `index.html` | The page: styles, mission card, telemetry, controls, dialogs. |
| `js/sim.js` | Physics, missions, docking, goals, scoring and the predicted path. No DOM. |
| `js/pilot.js` | The autopilot behind "Show me", and the proof in `tests.html` that every mission can be flown at three stars. No DOM. |
| `js/app.js` | Drawing, input, camera, HUD, sound, saved progress. |
| `tests.html` | Headless suite (`node tools/run-tests.mjs orbit`). |
| `img/earth.webp`, `img/clouds.webp` | The planet and its clouds, seen from above the North Pole. |
| `tools/textures.py` | How those two images were made (numpy + Pillow, one-off). |

## Units

The planet's radius is 1 and GM is 1, so a circular orbit at radius r has
speed 1/√r and period 2π·r^1.5. For display, one unit of length is 800 km and
one of speed 2 km/s, which makes one unit of time 400 s. The Earth is pocket
sized: low orbit is 240 km up at about 1.75 km/s, and the air (where you burn
up) ends at 96 km. The Moon has its true size relative to the planet (0.27)
but sits 10 radii out instead of 60, so a trip there fits a phone screen.

## Physics

Only the ship is integrated (RK4, roughly six hundred steps per orbit, shorter
near the Moon). The Moon and the stations are on circular orbits computed
from the clock, so looking ahead costs nothing. `predict()` uses the same
integrator as `step()`, so the dotted line is the path you will fly, and the
tests check that. Prograde, retrograde and radial burns are measured against
the Moon while inside its sphere of influence (the faint circle), and against
the planet otherwise.

Docking is a tractor beam: you dock within `DOCK_DIST` (40 km) of a station
when moving slower than `DOCK_SPEED` (60 m/s) relative to it. Any burn
undocks you, and the station ignores you until you have drifted clear.

## Stars

Each mission has a fuel budget (`dv`) and two thresholds (`stars`): spend less
than the first for two stars and less than the second for three. The
thresholds were set by flying every mission with `pilot.js`, which flies
near-textbook transfers, and allowing about 25% on top. `tests.html` fails
if the autopilot stops making three stars or if the budget leaves too little
room for mistakes, so retune a mission there after changing it.

The autopilot plans one burn at a time and looks again when it is done, so a
burn that came out a little long or short is fixed by the next one. It uses
phasing orbits within one orbit, Hohmann transfers with a phase-angle wait
between orbits, and a proportional close-in near a station. For the Moon it
grid-searches the departure, makes one mid-course correction and brakes at
periapsis.

## The Earth texture

`img/earth.webp` is NASA's Blue Marble (public domain; NASA Visible Earth),
taken as the 4096×2048 `earth-blue-marble.jpg` that ships in the
[`three-globe`](https://www.npmjs.com/package/three-globe) npm package's
`example/img/`. It is reprojected orthographically onto the northern
hemisphere as seen from above the pole, so that turning it anticlockwise is
the real direction of spin. `img/clouds.webp` is not a photograph: it is
procedural noise sampled on the sphere, made by the same script. To rebuild
both, run `tools/textures.py` (see the usage line at its top).

## Release

The game is not on the landing page and not in `sitemap.xml` yet. Per
AGENTS.md → "Release flow", the card waits for approval. When it gets one,
add the card to the games shelf in `index.html` and a preview to
`assets/preview/`, then add the URL to `sitemap.xml`. The page already
carries its OG tags and JSON-LD (`assets/og/orbit.png`).
