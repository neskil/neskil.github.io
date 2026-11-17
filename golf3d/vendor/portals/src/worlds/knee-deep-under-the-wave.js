// KNEE-DEEP UNDER THE WAVE (film worlds D). Card: INSPIRED BY Interstellar (2014), film.
// The film's PLACE and its SIGN, drawn anew in our own hand as a place to fly through: a sea that is knee-deep to
// every horizon; a far pale mountain range that is one wave; a black hole with its bent ring of light, this
// world's only sun, standing on the range, swallowed by the crest and whole again beyond it; one small landing
// craft of our own design and a few floating hull panels. No person and no figure, no robot, nothing lettered, no
// sound, no frame of the film; no body, nobody in danger: the craft is whole and rides the wave.
// The design: design/film/knee-deep-under-the-wave.design.md.
//
// SAID AT THE HEAD (the laws of the build):
// - EVERYTHING SCRIPTED IS A PLACE: s = metres flown (u times the law's ROUTE_LENGTH) is handed to every part;
//   the wave's place, the sea's drawing-off in front of it, the wave's shade, the craft's lift-off and course are
//   functions of s in the law file (src/parts/knee-deep-under-the-wave-law.js). Nothing scripted reads the clock,
//   the lens or a seed.
// - A DECLARED PACING: the wave runs a course of its own toward the lens. For every metre of ground the lens
//   covers the wave covers the law's PLAN.far metres while it is far off; it slows as its foot nears and passes
//   under the lens (PLAN.slowFrom to PLAN.slowTo) to PLAN.face metres, and to PLAN.behind once the lens is over
//   its crest. The lens's height is the wave's water under it plus a clearance, so the route climbs the face,
//   crosses the crest and dives down the back by the law's own numbers. The craft flies a course of its own on
//   the wave (the law's COURSE), told by metres flown; it is never the lens's course. THE CRAFT GOES BEFORE THE
//   VISITOR: it lifts off as the lens passes it, overtakes the lens 26 m off on its right, flies before it low over
//   the sea to the wave (50 to 80 m ahead) and up the face (45 to 120 m ahead) and is over the crest first. Its
//   station is worked from where the lens is on the route, never from where the lens looks.
// - A DECLARED GROWTH: from the crest to the ring the hole grows about its centre to the law's HOLE.grow times its
//   angular measure (the law's holeGrow(s), by metres flown): the flight is drawn toward it. THE CREST IS UNEVEN
//   along its length (the law's crestLift(x)): a range of peaks and saddles; the route crosses through a saddle.
// - THE FLIGHT'S PACE (the law's pace(u), a pure function of u): unhurried over the calm sea, quicker up the face
//   and down the back, unhurried into the ring.
// - BY THE CLOCK (ambient loops only): ripples, the net of light on the sand, the glitter, the wind's dark patches
//   going over the sea, its broad glints, its swell lines and the drift of its foam lanes, the water's streaming
//   toward the wave, the foam's drift up the face, the spray and mist, the turning of the gas in the hole's band
//   and arches with its knots, the stars' twinkling, the cloud's drift, the lamps' blink, the flames' flicker, the
//   panels' rocking.
// - WHAT READS THE EYE (all allowed kinds): the sky's dome is drawn round the eye; mirrors and sheens by the
//   direction of view; air by distance (the light file's kdHaze); patterns filtered by a pixel's footprint; thin
//   lights kept a pixel and a half wide; spray and mist, which are flown through, thin by their true distance to the
//   eye only inside the kit's near range (the law's WAY.eye, 0.6 to 2.5 m).
// - A RULE OF PLACE, THE WAY THROUGH (the law's WAY): where the laid line passes through the foot's mist and the
//   crest's spray, the sheets are thin by their distance to that fixed stretch of the line (clear within WAY.clear
//   metres of it, whole from WAY.whole metres off it): a parting in the veil over the saddle and a gap in the mist,
//   standing in the wave's own frame, the same for every eye, seed and pace. Nothing of it follows the lens.
// - LOOKS A SEED DEALS: the hour is the place's own (the hole is its sun and does not move; ctx.vary.hour is not
//   honoured). The seed deals the sand's forms, the foam's and spray's patterns, the panels' scatter.
// - THE ROUTE (the law's ROUTE): due north along x = 0. It enters 46 m over the sea, sinks to 5 m and skims;
//   climbs the wave's face 22 m and more over its water while the wave sweeps under it, crosses the crest 26 m
//   over it, dives down the back, pulls up.
// - THE WAY OUT: the last 330 m of ground rise straight at the hole's own elevation into the ring (its last knots
//   stand in one line; portal.tilt), high over the sea (the law's RING), so that the ring stands in the middle of the
//   hole's dark disc. The ring begins to show where the lens crosses the crest (portal.revealDistance is the
//   route's length from there on). portal.drawWithin: the wave runs over the ring's place long before the lens
//   comes to it, so the ring is left undrawn until its place is deep inside the wave's body (the law's RING_DRAWN,
//   a place on the route) and stands whole when the lens comes over the crest; no light and no double of the ring
//   anywhere. portal.drawIn is not set.
// - THE SIX LOOKS, each opened and closed by a stage or a place of the law: the hole, lightly, from the entry
//   until the wave has swallowed it; the floating panels, lightly, as the lens nears them (on its left); the
//   standing craft as the lens nears and passes it (on its right); the wave's crest dead ahead, while the lens nears
//   and climbs the face, until the hole begins to rise over the crest; the hole, whole again and growing, from there
//   over the crest and all the way down the back and through the pull-up until the last straight begins (which
//   itself points at it); and, mixed into that, a look after the craft as it goes away up and to the right, from
//   the crest until the pull-up begins (while the craft still stands before the hole's disc, just beyond the crest,
//   the two looks agree; the lens looks where the craft IS; the craft is never steered by it).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { ROUTE, ROUTE_LENGTH, RING, RING_DRAWN, WAVE, STAGE, PLACES, HOLE_DIR, FLIGHT_SECONDS, crestZ, craft as craftAt, pace } from '../parts/knee-deep-under-the-wave-law.js';
import { makeHoleLight } from '../parts/knee-deep-under-the-wave-light.js';
import { buildSky } from '../parts/knee-deep-under-the-wave-sky.js';
import { buildSea } from '../parts/knee-deep-under-the-wave-sea.js';
import { buildWave } from '../parts/knee-deep-under-the-wave-wave.js';
import { buildCraft } from '../parts/knee-deep-under-the-wave-craft.js';

export default {
  id: 'knee-deep-under-the-wave', name: 'Knee-Deep Under the Wave', category: 'screen', placeKind: 'ocean',
  screen: 'Interstellar', screenYear: '2014', screenKind: 'film', weirdness: 0.45, media: ['air'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const path = makePath(ROUTE), L = ROUTE_LENGTH;
    const light = makeHoleLight();
    scene.add(light.rig);

    // ---- the parts
    const detail = Math.min(1, Math.max(0.5, (ctx.quality && ctx.quality.detail) || 1));
    const opts = { path, light, detail };
    const sky = await buildSky(ctx, opts); await ctx.yield();
    const sea = await buildSea(ctx, opts); await ctx.yield();
    const wave = await buildWave(ctx, opts); await ctx.yield();
    const craft = await buildCraft(ctx, opts); await ctx.yield();
    const parts = [sky, sea, wave, craft];
    for (const p of parts) scene.add(p.object);

    // ---- looks (gaze pulls), opened and closed by the law's stages; each target is computed from u
    const at = new THREE.Vector3(), eye = new THREE.Vector3();
    const uOf = (s) => s / L;
    const hole = (time, u) => { path.pointAt(u, eye); return at.set(eye.x + 4000 * HOLE_DIR[0], eye.y + 4000 * HOLE_DIR[1], eye.z + 4000 * HOLE_DIR[2]); };
    const pois = [
      { at: hole, from: 0, to: uOf(STAGE.swallowed), weight: 0.3, fade: 0.08 },
      { at: () => at.set(PLACES.panels.x, 0, PLACES.panels.z), from: uOf(STAGE.panels - PLACES.panels.seenFrom), to: uOf(STAGE.panels + PLACES.panels.along / 2), weight: 0.35, fade: 0.3 },
      { at: () => at.set(PLACES.craft.x, PLACES.craft.length / 4, PLACES.craft.z), from: uOf(STAGE.craft - PLACES.craft.seenFrom), to: uOf(STAGE.craft + PLACES.craft.length), weight: 0.6, fade: 0.3 },
      { at: (time, u) => at.set(0, WAVE.height, crestZ(u * L)), from: uOf(STAGE.swallowed), to: uOf(STAGE.rise), weight: 0.6, fade: 0.06 },
      { at: hole, from: uOf(STAGE.rise), to: uOf(STAGE.straight), weight: 0.8, fade: 0.15 },
      { at: (time, u) => { const c = craftAt(u * L); return at.set(c.x, c.y, c.z); }, from: uOf(STAGE.crest), to: uOf(STAGE.pull), weight: 0.6, fade: 0.3 },
    ];

    return {
      scene, path, duration: FLIGHT_SECONDS, pace, pois,
      camera: { fov: 66, near: 0.5, far: 42000, lookAhead: 40, bank: 0.3 },
      portal: { shape: 'circle', radius: RING.radius, color: '#ffe2b0', glow: 1, tilt: true, revealDistance: L - STAGE.crest, drawWithin: L - RING_DRAWN },
      post: { exposure: 1, bloom: { strength: 0.4, radius: 0.6, threshold: 1.0 }, grade: { saturation: 1.06, contrast: 1.06, vignette: 0.3, grain: 0.02 } },
      update(dt, time, camera, u) {
        const s = u * L;
        light.set(s, time);
        for (const p of parts) p.update(time, s, camera);
      },
      dispose() { for (const p of parts) if (p.dispose) p.dispose(); },
    };
  },
};
