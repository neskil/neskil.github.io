# Changelog

## v0.5.1 — the yard gets a surface

**Added**

- **Procedural material skins** (`render/textures.js`). Everything in the yard
  used to be a flat colour, which is why a container read as a brick and the
  tank read as a hole. Canvas-drawn skins now carry corrugation, panel seams,
  bolt rows, weld beads, rain streaks, rust, tread plate, plank grain, brushed
  steel and tarmac aggregate. One set is drawn at load and shared by every unit
  in the yard.

- **Carrier livery on the boxes.** The wall skin is greyscale so `material.color`
  can still carry the paint, so the carrier's name and a container number are
  their own decal, painted on both flanks.

- **An environment map, one per weather preset.** Metals had nothing to reflect,
  so a `metalness: 0.95` tank barrel rendered as a black tube and every steel
  corner casting as a black cube. There is now a painted sky behind them —
  daylight, dusk, overcast, fog and a floodlit night — because `scene.environment`
  lights everything it touches and this three.js has no global dial to turn it
  down after dark.

**Changed**

- **The L and the T are machinery modules, not three cubes.** They are extruded
  from the silhouette of their own footprint mask, so the notch is a real edge
  rather than a seam between boxes: bevelled steel, a hazard-chevron skirt, a
  tread-plate deck inside a raised kerb, corner castings on every outside corner,
  and lifting eyes, a vent bank and a junction box on top. The placement ghost is
  extruded from the same outline, so the preview has the shape the piece has.

- **Corrugation moved from geometry into a normal map.** Twenty-odd rib boxes per
  container were most of the yard's draw calls and read no better than a pressed
  steel profile does. A 40ft is down from 61 meshes to 31, with more surface
  detail rather than less; the freed budget went on top and bottom rails, door
  hardware and crate corner brackets.

**Fixed**

- **A rotated L-block claimed the wrong corner.** `footprint()` transposed a
  mask on rotation while the mesh turned it a quarter, and a transposed L is the
  mirror of a rotated one — so the grid reserved the notch on the opposite
  corner from the one on screen. It is a real quarter turn now. Nothing else in
  the catalogue was affected: every rectangle and the T are symmetric about the
  diagonal, which is why this survived this long.

## v0.5.0 — Cascade

**Added**

- **Cascade — the falling-cargo game.** 3D Tetris, played with the containers
  the campaign already uses. A crane releases one unit at a time at the roof of
  a 4×4×8 bay and it comes down a tier at a time on its own; you steer it while
  it falls. Fill every one of a tier's sixteen slots and the tier ships out,
  everything above settles down a level, and you get the height back. The run
  ends when there is no room left to release the next container.

  The pitch at the top of `PLAN.md` has always been "3D Tetris for shipping
  containers", and the campaign deliberately took the clock out of it —
  deliberation is what that mode is for. This is the other half, in its own
  mode, where the roadmap said a timed variant belonged.

  The cargo catalogue turns out to read as a tetromino set with nothing added:
  the 10ft is the single cell, the 20ft the domino, the 40ft an I-piece that
  spans the bay end to end, the crate an O, and the L-corner and T-beam exactly
  what their names say.

- **Layer clears, combos and a perfect clear.** A container occupies exactly one
  tier — that is the grid's model, not a simplification made for this — so a
  lock can only ever complete the tier it lands on. One layer per piece, never
  four. Consecutive clears are what pay instead: the multiplier climbs by half
  for each one in a row, and emptying the bay completely is worth more than the
  tier that did it.

- **A lock grace.** A piece that touches down is not committed for another
  0.6 s, and sliding it renews that up to a dozen times. Without it, sliding a
  container into the gap beside it is a reflex test rather than a decision.

- **Screen-relative steering.** The arrows are resolved against the camera, so ◀
  means left on screen no matter where you have orbited to — the one thing a 3D
  Tetris cannot get wrong. `R` turns the piece with a kick list behind it,
  `Shift` held makes it fall ten times faster, `Space` drops it now. With a
  mouse, hovering aims and a click drops; on a phone the first tap aims and a
  second tap on the same spot commits, the same bargain the tower's console
  struck.

**Changed**

- **`frameBay()` takes an aim height.** It centred on the bay's lower third,
  which is right for a campaign bay — wider than it is tall, and the cargo that
  matters is near the floor. Cascade's bay is twice as tall as it is wide and is
  played from the roof down, so aiming below the middle of it put the piece you
  were steering off the top of the screen for its first three tiers.

## v0.4.3 — Tower is its own game

**Added**

- **A tidier main menu.** The library credit no longer sits above the game's
  name, where it wrapped to two lines on a phone; the campaign's four progress
  pills are one divided pill, which cannot wrap onto a second row.
- **Tower is a menu item**, not a toggle buried in an experimental mode. The two
  games now sit next to each other on the main menu: pack the manifest into the
  smallest box, or stack until it falls over. The physics yard keeps its own
  entry for free play, and the Challenge toggle still switches between them
  in-mode.
- **An X/Y/Z console.** A pointer aims to within a fingertip, which is not
  enough for a tall stack and is hopeless on a phone. Three axis pairs step the
  container over in whole slots (25 cm in free placement), raise the height it is
  released from, and a Drop button commits. Arrow keys do the same on a
  keyboard, `Shift` with them for height, `Space` to let go. A nudge holds the
  position against the pointer until you drop or drag the camera, so a stray
  mouse move cannot undo the aim you just took.
- **Aim before you drop, on touch.** A mouse has already aimed by hovering, so a
  click still drops in one action. A finger has not: the first tap parks the
  ghost where you meant it and a second tap on the same spot commits, which is
  what leaves room to use the console in between.
## v0.4.2 — a phone that stays where you put it

**Fixed**

- **A swipe on the control bar scrolled the whole game off the screen.** The
  page shell was `height: 100%; overflow: hidden`, which on a phone is two
  separate lies: `100%` is the layout viewport (browser chrome hidden) rather
  than the shorter one you are looking at, and `overflow: hidden` suppresses the
  scrollbar without making the box unscrollable — a swipe that starts inside a
  nested scroller still chains out to the document and drags it. So the bar had
  a screenful of slack behind it, and using it pulled the top bar, the HUD and
  the canvas up past the bottom edge, scrollbar and all. The shell is now a
  fixed box sized in `dvh`, every panel that scrolls contains its own
  overscroll, and the canvas is measured from its container instead of from
  `window.innerHeight` so the two can never disagree.
- **A bay framed for a desktop ran off both edges of an upright phone.** The
  camera fitted the bay's bounding sphere to the vertical field of view only,
  but the horizontal one narrows with the aspect ratio. It now fits whichever
  axis is tighter, leaves more margin in portrait — where the strip and the
  control bar own the top and bottom of the screen — and re-fits when the phone
  is turned, widening rather than yanking a camera the player has moved.

**Added**

- **The mission readouts came back to the phone.** They were hidden outright
  below the breakpoint, which left a phone playing blind: no manifest, no
  envelope, no medal, and no way to read the regulation that just refused a
  move. They fold into one sheet instead, closed by default, with a strip under
  the top bar that both summarises it and opens it — what is landing, how far
  through, where the envelope sits against par, and which medal that still
  leaves. Tapping the yard dismisses the sheet without also dropping a
  container.
- **The sandbox inspector works on a phone.** Selecting a container and then
  being unable to rotate or remove it was the whole interaction, missing.
- **The phone layout now covers a phone on its side too.** 844 × 390 escaped the
  width breakpoint and got the desktop arrangement — a queue down one edge, a
  readout down the other and a bar across the bottom — which leaves the yard a
  letterbox. Short viewports take the same layout as narrow ones, and start with
  every toolbar section folded.
- Safe-area insets on the top bar, the control bar, the strip and the overlays,
  so nothing sits under a cutout or a gesture bar; larger dismiss and menu
  targets; and overlay panels laid out for one column rather than two.

## v0.4.1 — a phone-sized yard, and the Tetris blocks everywhere

**Added**

- **Collapsible toolbar sections on a phone.** The control bar showed every
  section at once — five stacked rows eating half the yard, most of it cold.
  Each section now folds to a chip that still reports what it is set to
  (`Spawn Cargo · 20ft`), one section is open at a time, and picking from an
  exclusive group folds it away again the way a dropdown would. The desktop bar
  is untouched: above the breakpoint the module unwinds itself.
- **The L-corner and T-beam modules are spawnable** in the sandbox and the
  physics yard, not just in the campaign. They are the most interesting thing in
  the catalogue to pack, and the most interesting to balance.
- 3 more assertions: a masked piece being hollow where it looks hollow.

**Fixed**

- **Masked cargo collided as its bounding box.** An L-block's notch is visibly
  empty, so cargo dropped into it has to fall through, not rest on air. A body's
  shape is now a list of axis-aligned boxes — one for ordinary cargo, the union
  of the occupied cells for a masked piece, merged into runs so no interior face
  reaches the contact test. `penetrationOf()` reads the same shape, so the spawn
  clearance check no longer refuses a slot that is genuinely empty.
- **The top bar did not fit a phone.** Five items priced for a desktop: the
  title wrapped to two lines, the badge to three, and the menu button — the only
  way out of a mode — was pushed off the right edge.
- The grid ghost is now mask-aware, so an L-block previews as an L rather than
  as the 2×2 box around it.

## v0.4.0 — physics as a failure mode

The campaign gets the simulation, in the one place it belongs. `support:1` was
the only rule that was ever a physical claim; the other six are regulations, and
a real terminal genuinely does refuse those moves. So physics replaces support
and nothing else.

**Added**

- **A `physics` rule and three missions that use it** — *Balancing Act*,
  *Top Heavy* and *Salvage Yard*. No support ratio to satisfy: overhang what you
  like, and the yard tells you. The existing thirteen missions are untouched, so
  their medals still mean what they meant.
- **Collapse costs ground.** Anything that falls is craned back onto the queue
  and the squares it started on and landed on are struck off for the rest of the
  shift. You re-place the cargo with less yard to do it in, which shows up in the
  envelope as sprawl. The manifest never changes size, so par stays honest.
- The grid stays authoritative throughout: physics is only ever asked *did it
  hold*, and a surviving stack snaps back to the lattice it was always on. That
  is what keeps envelope scoring and a computed par meaningful.
- `YardGrid` learned blocked squares; `render/yard.js` paints them as wreckage.

**Fixed**

- **Every container's hitbox was turned ninety degrees.** `render/containers.js`
  lays a container's length along X, and the grid agrees — a 40ft at rotation 0
  spans four cells in X — but `RigidBox` read `spec.width` as the X extent. So
  the collision box was across the container it belonged to: stacks that looked
  flush overlapped, and neighbours that looked clear shoved each other aside by
  over a metre. Extents are now named by axis, `sizeX`/`sizeY`/`sizeZ`, so the
  mistake cannot be spelled.
- **A rotated container could be dropped inside its neighbour.** `rotate()`
  turned the ghost but left the clearance height solved for the old footprint,
  and `pointerup` dropped without re-reading the pointer — which a touch tap
  needs, since it cannot be relied on to send a `pointermove` first.
- Sample points covered a box's corners, edges and faces but not its centre, so
  a container crossing through the middle of another could overlap with no point
  inside either one.
- **Any mission with pre-placed obstacles crashed on entry** — the obstacle loop
  used `self` twenty lines before it was declared. That has been broken since
  obstacles shipped, taking *Endless Yard* with it.

## v0.3.0 — the physics yard

Real rigid-body physics alongside the grid, not instead of it. The campaign's
`support:1` rule counts occupied cells underneath; it cannot become physics,
because `core/` may not touch THREE. So the solver sits beside it.

**Added**

- **Tower challenge.** Stack as high as you can. Height counts only once every
  container is asleep, so the tower has to genuinely stand still. Each settled
  container remembers where it settled; if one drops 1.2 m below that, something
  under it gave way and the run ends. Best height persists in the save.
- **Grid placement in the sandbox and the physics yard.** A toolbar button (and
  `G`) switches between the campaign's slot lattice in quarter turns, and free
  placement wherever the cursor points. The grid says where a container lands;
  physics still says whether it stays. The sandbox gains a ghost preview it
  never had.
- **A camera that follows the tower up**, easing and pulling back as the stack
  grows, and yielding the moment the player takes the camera themselves.
- Laden mass per container — a 40ft outweighs a 10ft roughly four to one, so
  what goes where changes what the stack does.
- 18 more assertions: tower records, and a save written before this release
  round-tripping intact.

**Fixed**

- **The solver could not stack.** It ran one sequential pass over contacts per
  substep, so a support impulse never propagated up a chain: a perfectly aligned
  tower of eight tilted 23° and sagged 0.6 m, and 0.3 m of placement jitter
  collapsed a tower of twelve outright. Replaced with accumulated impulses
  relaxed over ten iterations — 23.3° → 0.4°, and the jittered tower now stands.
- **Sleep was dead code.** `resolveGround()` woke every body it touched, so a
  container was woken forever by the floor it was resting on. The ground now
  wakes nothing, and a settled neighbour only wakes for a partner that is
  actually moving. Forty bodies went from 3.18 ms/frame to 0.55 ms.
- **A short frame fired the yard into the sky.** The overlap correction divides
  by the timestep, so one near-zero `delta` — a resumed tab, a stolen clock —
  produced an impulse that launched a settled stack at 22 m/s. Physics now runs
  on a fixed 1/120 s step with a clamped correction. The same tower scores
  identically at 10 fps and 60 fps.
- `campaign — schema` asserted `nextAfter('m12') === null`; the campaign had
  gained a thirteenth mission and the assertion had been failing silently. It now
  derives the last mission instead of naming it.

## v0.2.0 — Yard Master

The proof of concept becomes a game.

**Added**

- **Campaign mode** with 12 line missions. Each gives a bay, a manifest and a
  set of terminal regulations; each unlocks the next on any medal.
- **Envelope scoring.** The rank is the volume of the smallest box containing
  every occupied slot — lowest wins. Par is a computed zero-waste pack of the
  same manifest, with gold/silver/bronze at multiples of it.
- **Grid placement** with real gravity, ghost preview, drop-column indicator,
  90° rotation and undo. Illegal placements are refused *and explained*: the
  HUD names the regulation that blocked them.
- **Seven regulations** — support ratio, crane reach, no top loading, heavy at
  the bottom, hazmat separation, reefer power points, and departure order.
- **New cargo:** 10ft boxes, 2×2 breakbulk crates and tank containers, plus
  reefer / hazmat / heavy traits and departure days.
- **Live envelope wireframe** in the scene, a medal track in the HUD, and a
  three-deep queue lookahead.
- **Scorecard** with envelope vs par, medal thresholds and best-result tracking.
- **`core/` logic layer** with no THREE dependency, and `tests.html` — 133
  assertions covering the grid, every rule, scoring, manifests, the save file
  and the whole campaign's validity, runnable headless over `file://`.
- Progress saved to `cargo3d.save.v1`.

**Changed**

- Restructured from a flat `js/` folder into `core/ · missions/ · render/ ·
  game/ · ui/ · styles/`. See `README.md`.
- Sandbox mode preserved in full — free spawn, reach stacker, train unloading,
  weather, X-ray, tier heatmap — now reachable from the main menu.
- **Gantry crane and the contracts economy carried across.** The rail-mounted
  crane became `render/crane.js` and is a second drivable machine in sandbox
  (only one machine holds the keyboard at a time); it can lift a container
  straight off a flatcar. The contract system split into `core/contracts.js`
  (pure state machine — orders, payouts, reputation, expiry, upgrades, now
  unit-tested) and `game/contracts.js` (sandbox binding, zone marker, HUD).
  Capital, reputation and upgrades persist. Fixed in the port: cargo already
  standing in a delivery zone no longer pays out the moment an order is issued.
- Reach stacker driving is frame-rate independent (was per-frame constants).
- Camera rigs frame the bay by its bounding sphere and ease between presets.

## v0.1.0 — 3D Cargo Yard POC

- Three.js scene, procedural corrugated containers, orbit/isometric/crane
  cameras, click-to-spawn stacking, drivable reach stacker, freight train and
  semi truck props, five weather presets, X-ray view, stress heatmap,
  procedural audio.
