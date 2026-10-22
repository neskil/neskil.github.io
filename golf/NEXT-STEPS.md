# Pocket Links — next steps (v1.10.0 work in progress)

A hand-off note for the next session. Delete this file once it is all done.

## Shipped on the branch, not yet merged to master

- **Fairway flowers toned down.** Showy decals grow only in the borders
  (rough, a 58px band along the cushion, the foot of walls). The open
  fairway gets at most a few faint lawn kinds. See `scenery.js`:
  `border`, `BORDER_MAX`, `LAWN_MAX`.
- **Four new biomes:** autumn, winter, desert and moonlit night, so nine
  in all. Each has its own walls, posts, trees, rim and decals.
- **Scenery picker.** A Scenery row in the course picker, plus the `S`
  key, puts any course in any biome. It is stored in
  `miniGolf.scenery.v1`, and Reset progress keeps it.
- **`ambience.js`:**
  - life over the course: snow, falling leaves, petals, butterflies,
    fluff, dust and fireflies in the air; bird and gull shadows and a
    tumbleweed on the ground;
  - the night pass: dark, lamps on the cushion, posts lit;
  - a light grade baked into the cached layers.
- **Soundscapes in `audio.js`:** wind, sea, birds, gulls, crickets, owl,
  crows and a woodpecker. They follow the Sound switch and stop in a
  hidden tab.
- **`water.js`:** a WebGL shader for the water surface, with a 2D
  fallback.
  - It draws refraction, caustics, depth colour, sky reflection,
    sparkles, cartoon foam and crest strokes, surf, an ice skin, and
    ripples when the ball goes in.
  - The bank face (pseudo-3D sunken water) is in `landscape.js`
    (`bankDepth`, `surfacePath`).
- **A 3D cup in `physics.js` (`cup()`):** the ball has a height `z` and
  falls over the hole. The lip is a circle it leans on, rides, knocks and
  hops over, and there is a 6px funnel round the cup.
  - Tuned in `config.js` (`CUP_*`, `RIM_*`). Overall the cup takes about
    as many lines as the old capture rule did, with more of them at the
    middle and fewer at the edge.
  - Tests are in `tests.html` under "The cup in three dimensions".

## Still to do

1. **Remove the free aiming line** (the user's request). In
   `render.js` → `drawAim`, the guide ray runs 1600px, to the edge of the
   field. Make it short and fading instead, e.g. a new `AIM_GUIDE_LEN`
   of about 110px past the arrowhead. Keep the overswing cone, but make
   it short too. Update the `AIM_GUIDE_ALPHA` comment in `config.js`, and
   check `ui-tests.html` and `help` text for anything that mentions the
   ray.
2. **Draw the ball's height.** `world.ball.z` exists, but `drawBall`
   ignores it.
   - Dipping into the cup (`z < BALL_R`): draw the ball smaller and
     darker, partly hidden by the cup.
   - Hopping (`z > BALL_R`): lift it up the screen with `sv(v, 0, -(z-r))`
     and push its shadow further out.
   - Shade the funnel as a soft ring round the cup in `drawHole`.
3. **A knock sound.** Add an `events.knock` when a lip hit has `e > 0`,
   and a short rim "tock" in `audio.js`.
4. **Measure frame cost** on a Pixel 7 profile. Use `getImageData`
   flushes, as the earlier perf scripts did. The user cancelled a timing
   run, so ask before running a long one. Cases to cover:
   - the night overlay;
   - snow, at 70 flakes;
   - the shader water at scale 1.5.
5. **Docs.** `golf/README.md` needs:
   - the new biomes and the Scenery row;
   - `ambience.js` and `water.js` in the files table;
   - the cup model;
   - the new test counts (unit 870+, UI 145).
   Also update the landing card text in `/index.html` and `README.md` if
   it lists the biomes.
6. **Release.** Run `node tools/run-tests.mjs` and
   `node tools/check-site.mjs`, then merge to master once the user says
   so. Ask before deleting the branch.
