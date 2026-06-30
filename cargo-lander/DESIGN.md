# CargoLander — Design Document

*If you were starting over, what would you build?*

> **Status: retrospective only, not an active plan.** This is a "lessons learned"
> thought experiment, not a roadmap — there is no v2 rebuild in progress or planned.
> The current `game.js`/`physics.js` architecture is the one being maintained; see
> [README.md](README.md) for how it actually works today.

---

## The Core Idea (Don't Lose This)

A physics-based delivery game where the **tension** is the point. You fly a lander, pick up cargo at a terminal, and deliver it to color-coded hubs. Every second on the clock is a tradeoff:

- Land too fast → crash damage
- Wait at the terminal for a second box → timer ticks down
- Take a shortcut through the danger zone → sandworm risk
- Carry heavy cargo → less fuel efficiency

The game is not about score. It's about **the decision you make on every flight**.

That feeling — hovering, watching your fuel, deciding whether to grab the third box or just go — is the entire product. Everything else is decoration.

---

## What Actually Mattered (Keep)

| Thing | Why it worked |
|---|---|
| Matter.js rigid bodies | Boxes stacking, sliding off, rolling — unscripted physical comedy |
| Cargo type matching | Simple color-matching gives routes meaning without text |
| Fire timer on dropped boxes | Risk/reward: land sloppily and cargo burns |
| Countdown per box at terminal | Wait for more cargo vs. fly fast — real choice |
| Sandworm hazard zone | One enemy that doesn't need an AI system — pure proximity risk |
| Cave ceiling segments | Vertical danger without complex level geometry |

## What Became Bloat (Cut or Simplify)

- **Upgrade system** — 15 upgrades across 6 types. Nobody read them. Replace with 2–3 permanent unlocks tied to mission completions (e.g. "unlock cave levels", "unlock drone").
- **Dual renderer (game.js + renderer.js + ui.js)** — ended up with triplicated rendering code. One file, one render loop.
- **Elaborate crane animations at terminal** — looked cool, confused players about when cargo was ready. The immediate-spawn mechanic was simpler and better.
- **Budget/economy layer** — missionBudget + globalCash + career stats is 3 systems doing the job of "did you succeed?" Collapse into a single star rating per mission.
- **Particle system bolted on** — no lifecycle management, particles just accumulate. Use a fixed-size ring buffer of 200 slots.

---

## How to Build It Better From Scratch

### Stack

```
Matter.js 0.19        — physics engine (keep, it's good)
Canvas 2D             — rendering (no WebGL needed at this scale)
Vanilla JS, no build  — deploy is just a folder, zero tooling debt
```

### Architecture (3 files max)

```
physics.js   — Matter world, lander body, box bodies, terrain bodies
              — NO game logic, NO rendering, just physics state
game.js      — update loop, input, level loading, win/lose conditions
              — calls physics.step(dt), reads physics.state, calls render.*
render.js    — pure functions: drawTerrain(ctx, pts), drawBox(ctx, box), etc.
              — NO state mutations, takes data, draws it
```

The current project let `game.js` grow to 4000+ lines because rendering, logic, and state all lived there. The fix is strict ownership: physics.js owns bodies, game.js owns rules, render.js owns pixels.

### Level Format (The Key Improvement)

Current levels are defined as JS objects with flat `terrainType: "flat"` — interesting geometry requires manual coordinate arrays which nobody writes by hand.

**Better approach: sketch-to-level pipeline.**

A level is a PNG sketch (anything hand-drawn in Paint, Figma, or on paper):

```
level_03.png   — dark pixels = terrain, colored pixels = pad locations
                 red pixel = start depot, yellow = collection, blue/green/etc = hubs
                 white pixels with border = cave ceiling segments
```

A small loader converts it at runtime:

```js
async function loadLevelFromImage(url) {
    const img = await loadImage(url);
    const pixels = samplePixels(img);          // downsample to 200×100 grid
    const terrain = traceContour(pixels);      // marching squares → polygon
    const pads = findColoredMarkers(pixels);   // scan for known marker colors
    const segments = findCeilingBrushes(pixels);
    return { terrain, pads, segments };
}
```

This means:
- A designer can sketch a level in 10 minutes
- Caves, overhangs, ramps, narrow passages — all free
- Iteration is "redraw the PNG" not "edit 200 coordinate pairs"
- Levels are visually inspectable before you even run the game

### Terrain as Polygon, Not Heightmap

Current terrain is a heightmap: `terrainPoints[x] = y`. This can't represent caves, overhangs, or vertical walls.

Replace with a **closed polygon** traced from the level image. Matter.js `Bodies.fromVertices()` handles arbitrary concave terrain. The lander and boxes just collide with it — no special-case raycasting needed.

```js
const terrainBody = Matter.Bodies.fromVertices(cx, cy, vertices, {
    isStatic: true,
    friction: 0.6,
    label: 'terrain'
});
```

### Lander Physics (What's Already Right)

The hybrid approach from this project is actually correct:
- Matter.js handles collision response (rigid body)
- Game code drives velocity (thruster forces via `Body.applyForce`)
- Static body when landed (prevents jitter from solver corrections)
- `dt = Math.min(dt, 1.5)` cap (prevents physics explosion at low FPS)

**Keep all of this.**

### Level Progression (Simpler)

```
Mission 1: Flat terrain, 1 cargo type, no hazards → teach controls
Mission 2: Rolling hills, 2 cargo types → teach routing
Mission 3: First cave passage → teach vertical danger
Mission 4: Sandworm zone + time pressure → teach risk tradeoff
Mission 5: Multi-story level from PNG sketch → everything combined
```

5 missions. Each one introduces exactly one new mechanic. No filler.

### The Drone vs. Lander Decision

Two vehicles is probably one too many. If you rebuild:
- **Start with just the lander** (simpler, more physical, feels better)
- Unlock the drone as a reward for completing mission 3
- The drone's grapple rope is genuinely interesting but needs a reason to exist — make one mission require lifting a box from below a ledge that the lander can't reach

### What a v2 Session Would Look Like

1. `terrain-from-png loader` — 1 day
2. 5 hand-sketched PNGs exported from Figma — 2 hours
3. `physics.js` with polygon terrain + lander hybrid — 1 day
4. `render.js` drawing terrain outline + boxes + lander — 1 day
5. `game.js` wiring input + delivery loop + win condition — 1 day
6. Sandworm: distance check + lunge animation + retreat — half day
7. Polish: camera, fire on dropped boxes, particle burst on delivery — 1 day

Total: ~6 days to a shippable v1 that's cleaner than the current 353-commit version.

---

## The One Line to Remember

> The game is a hovering decision machine. Physics is the medium. Everything else is texture.
