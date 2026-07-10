# Level Improvement Plan — L2 through L9

High-level design plan for improving levels 2–9. **Level 1 is the benchmark — do not touch it.**
Written for a follow-up implementation session; each level section is independently actionable.

## Why Level 1 works (the benchmark)

Before changing anything, understand what makes L1 good, because most of L2–L9's weaknesses are
departures from these qualities:

1. **Organic, readable terrain.** ~35 vertices of rolling ground with local variation — small dips,
   ridges, a side island. Nothing is axis-aligned; it looks like a place, not a diagram.
2. **Environmental storytelling.** A lake with a boat, a secondary floating island, water pockets —
   detail that isn't mechanically necessary but makes the world feel authored.
3. **One clear skill test** (tilt/landing speed) with gentle stakes, plus optional spice (the quick
   quest, the out-of-bounds water monster).
4. **Route shape**: pickup → delivery → return creates a loop across varied terrain, so the player
   sees the whole map.

The recurring anti-patterns in L2–L9, in rough priority order:

- **Boxy, low-vertex terrain.** L2, L4, L5, L7, L9 are built almost entirely from flat horizontal
  shelves and rectangles. They read as programmer art next to L1.
- **Laser overuse.** Lasers appear in L3, L5, L7, L8. By L8 (where they're introduced as the "NEW
  MECHANIC" per its own header comment!) the player has already seen them three times. Hazard
  identity per level is diluted.
- **Dead space / unused map.** Large flat runs with nothing to do or see (L2's plateaus, L4's
  eastern ridge, L7's long flats).
- **Difficulty ordering wobbles.** L3 (tiny pads + constant wind + twin lasers + acid at padScale
  0.65) is arguably harder than L4 and L6. L5's winch level is long (300s) but mechanically gentle.

## Global passes (apply across all of L2–L9)

- **Terrain organiciy pass**: every flat shelf longer than ~300px should get 2–4 vertices of
  gentle height variation (±10–30px), except deliberate landing pads. Rectangles only where the
  fiction justifies them (station hull plates in L8).
- **Hazard identity pass**: aim for ≤1 hazard *type* per level being "the star", introduced in this
  order: wind (L3), gravity well (L4), winch precision + first laser (L5), worm (L6), fuel/distance
  (L7), laser gauntlet as mastery (L8), everything (L9). Remove lasers where they're set dressing.
- **Set-dressing pass**: L1 has a boat and a floating island; L9 has buildings and collectibles.
  Most levels between have neither. Each level should get 1–2 non-mechanical or lightly-mechanical
  landmarks (buildings, water bodies, collectibles, debris) that fit the biome.
- **Verification**: after each level edit, run `tests.html` and take a `probe-screenshot.html?level=N`
  headless screenshot to eyeball the silhouette (see CLAUDE.md recipe). Terrain polygons are easy to
  break invisibly (self-intersections, gaps to OOB).

## Per-level plans

### L2 — Cross-Dock Sorting (Amber Wastes)
**Problem**: terrain is two nearly-flat shelves and one artificial chasm; the ceiling is a flat slab
that serves no gameplay purpose; the sorting lesson is good but the world is empty.
- Reshape both plateaus with dunes/mesas: rolling amber terrain, a couple of rock spires near the
  chasm lip that force a slightly considered approach to each hub.
- Make the chasm a *feature*: widen the mouth, add a ledge partway down with an optional collectible
  (cash) so brave players can dip in; quicksand OOB and monster already sell the danger.
- Either remove the flat ceiling or sculpt it into an overhanging dust-cloud rock formation that
  visibly frames the two hubs. A flat y:150 slab reads as a bug.
- Keep difficulty low — this is still level 2. No new hazards.

### L3 — Gale-Force Winds (Glacial Peaks)
**Problem**: overloaded for its slot — constant wind AND padScale 0.65 AND twin fast-cycling lasers
AND acid OOB. The lasers steal focus from the wind, which is the level's actual lesson.
- Make **wind the only star**: remove both lasers (they belong to L5+/L8's arc), or replace with a
  single slow, generous one if a gate is still wanted.
- Ease padScale to ~0.8; the wind already demands precision.
- Compensate visually: sharpen the peak silhouette (more jagged ice vertices), add a frozen
  waterfall or ice-shelf water body on the leeward side.
- Consider wind *gusts* only if cheap; otherwise constant wind is fine for the teaching slot.

### L4 — Gravity Anomaly (Volcanic)
**Problem**: header comment promises "dual cargo sort" and "asteroid obstacles" but the config has
one hub, `allowedTypes: ["normal"]`, and an empty `segments` array — the level shipped half-built.
The terrain is a flat valley in three straight lines.
- Deliver on the intent: add a second hub (e.g. red "Deep Storage" on the eastern ridge past the
  incinerator vent) and `allowedTypes: ["normal","red"]` — reinforces L2's sorting under vortex
  pressure.
- Add 3–5 floating volcanic-rock `segments` orbiting the gravity well region as the promised
  obstacles.
- Sculpt the terrain: volcanic cones, a lava-adjacent lowland, ragged ceiling stalactites instead of
  the flat slab. Add a small lava water body (recolored) below the vent field.
- Fix the header comment to match reality afterwards.

### L5 — The Needle's Eye (Crystal Caverns)
**Problem**: the winch concept is the best in the game, but the cave is rectangles and the
laser-across-the-shaft doubles up with an incinerator, making the drop feel more like RNG-waiting
than precision.
- Crystal-ify the geometry: jagged stalactites/stalagmites on ceiling and floor, an angular
  crystal-lined shaft (slightly funnel-shaped: wider mouth, narrow throat) so rope control is the
  test, not timing.
- Keep **one** timed hazard, not two — prefer the incinerator on the pit floor (unique placement)
  and drop the shaft laser, or vice versa. Slow the cycle so a good pilot passes on skill.
- Add a second, *optional* narrow side-pocket with a cash collectible reachable only by winch —
  rewards mastery of the level's own mechanic.
- 300s time limit can drop to ~240 once the double-hazard wait is gone.

### L6 — Sand Worm's Lair (Amber Dusk)
**Problem**: closest to L1 in terrain quality; main weakness is that the worm threat is mostly
implied — the flight over the mound is a one-shot fly-through with no route decision.
- Add a route choice: a low fast lane through the valley (short, inside worm range) vs. a high slow
  arc near a sculpted ceiling/rock arch (long, safe but fuel/time-costly). Choice is what makes a
  threat interesting.
- Add 1–2 desert set pieces: a half-buried wreck (building/segments) on the valley floor, bones
  around the worm mound.
- Optional fuel collectible on the far plateau to reward the risky low line.
- Otherwise leave tuning alone; its difficulty slot is right.

### L7 — The Deep Haul (Bioluminescent Depths)
**Problem**: great premise (fuel-discipline endurance) undermined by copy-paste geometry — floor and
ceiling are alternating flat steps, and the two vertical full-height lasers are both anti-theme
(who built lasers in a cave?) and anti-fun on a 4km run where dying late costs minutes.
- Replace both lasers with biome-native hazards: relocate the existing gas-pocket zones to guard the
  Fuel Pump and Valley Base approaches, or use dripping-goo/incinerator vents. Nothing on the
  critical path should hard-gate on a timer this deep into a long haul.
- Undulate the whole tube: break every flat 200–400px run into organic cave contours; vary the
  squeeze corridor so it bends (vertical S-curve) rather than just narrows.
- Add mid-route visual milestones so progress is felt: a glowing underground lake (water body)
  in the x:1900–2300 valley, crystal clusters, a wrecked hauler near the squeeze as a warning.
- Consider a second refuel at ~x:2900 with a tighter main tank margin, making fuel routing a real
  decision on the *return* leg too.

### L8 — Orbital Gauntlet (Derelict Station)
**Problem**: the laser gauntlet is the right finale mechanic, but by now lasers have appeared in
L3/L5/L7, so the "new mechanic" landing is flat (fix by removing them earlier, see above). The
platforms are uniform quads of near-identical size and spacing — the "derelict station" reads as
eight floating bricks.
- Differentiate platform silhouettes: tilt some decks, add broken antenna/hull greebles via
  `segments`, vary platform lengths and vertical spread more aggressively (one platform under
  another, forcing a wraparound approach).
- Keep all three lasers but make them the *only* timed hazards in the whole midgame→finale arc that
  fire this fast; with earlier levels de-lasered, this becomes the payoff.
- The return leg is the best idea in the level — advertise it: after final delivery, flip laser
  phases or speed them up slightly ("defense grid alerted") if cheap to do; otherwise at least
  mention the return gauntlet in the quest text.
- Void OOB + gravity well are good; leave physics tuning as is.

### L9 — The Cauldron (finale / chaos)
**Problem**: intended as "absolute chaos" but is the boxiest map in the game — five rectangles.
Chaos should come from the *simulation* (worm + traffic + wind + weather + blackhole), and it does;
the terrain fails to look like a place that chaos happens *in*.
- Full terrain rebuild keeping the same functional layout (left shelf HQ / suspended hub / right
  acid rim / worm pit between): carve it as one ragged cavern with the pit as an obvious scar,
  give the suspended rock a stalactite-like anchor or chain visual, jagged ceiling.
- The suspended hub platform is 200px wide but the deck between y:500 rims is only 40px thick —
  make it chunkier and more dramatic (crystal spire rising from the pit).
- Space out the chaos ingredients spatially so each has a zone: worm owns the center, blackhole owns
  the acid side, wind + traffic own the airspace. Currently the right side stacks blackhole + acid
  + silo while the center-left is comparatively empty.
- Add 1–2 more destructible buildings and a risky third fuel pickup inside the worm radius.
- Re-verify difficulty *after* L3/L5/L7 are eased — L9 should clearly remain the hardest.

## Suggested implementation order

1. **L4** (half-built — highest value per effort), then **L2** (early-game polish players see most).
2. **L3 + L5 + L7 de-laser/re-theme pass** (one coherent "hazard identity" commit).
3. **L7 + L9 terrain rebuilds** (biggest geometry jobs).
4. **L6 + L8 enrichment** (already decent; additive changes).

One commit per level (or per pass), version-bumped, with tests + probe screenshot per CLAUDE.md.
