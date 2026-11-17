// HANDS IN THE PAINTED CAVE: a cave by lamplight, painted in the oldest way there is: a hand laid on the rock and pigment blown round
// it. By the way in every hand has five fingers; at the end of the first gallery one great hand has six; after that the count slips
// room by room until the far wall of the last hall is one hand with fingers all the way round. Nobody is there.
//
// The cave, its hands, its lamps, its water and the whole style are src/parts/hands-in-the-painted-cave.js (one makeStyle instance:
// two grounds of rock by place, pale limestone and soot, each in four flat tones by the law of light: the lamps' pools over a floor
// of light that has no source and is given by place alone; four pigments as spray round bare hands, white and yellow alone on the
// soot; flame, mirror). This file flies it.
//
// THE FLIGHT: the part's line (PATH_POINTS, 425.6 m), 64 s, fov 62, look ahead 10 m, no bank, far 600.
// THE PACE, one law of place: the speed is 0.8 of the mean from 20 m to 110 m flown (the Six and the low passage), 1.15 of it from
// 200 m to 350 m flown (the hall), 1 elsewhere, each change eased over 15 m about its place (PACE below; the engine scales the whole
// so that the flight lasts 64 s).
//
// WHAT READS THE EYE, THE LENS OR THE METRES FLOWN, ALL OF IT. Nothing else in this file or the part does.
//   1 THE FRESH HANDS read THE METRES FLOWN and nothing else (update's u times the line's length; through another world's portal u is
//     0 and the first sites stand as at the entry). A site is abeam at m metres flown (sites every 9 to 14 m of the line from 20 m on,
//     left and right in turn, on the rock 5 to 9.5 m from the line; none abeam from 28 m to 60 m flown: a fresh hand may come in the
//     first gallery, far from the Six's disc, never beside it; none after 350 m flown, so the last cloud has thinned by 342 m flown, before the bend can uncover the ring: the way
//     out stays still). From m - 18 to m - 14.67 the cloud of pigment blooms; to m - 11.33 it hangs and the hand's halo comes WHOLE
//     under it (one share for the whole stencil, never a part of a hand, never a hand without its cloud); to m - 8 the cloud thins;
//     then the hand stays. The same at every pace; flown backward it goes backward; a jump gives the picture flown to.
//   2 THE GAZE reads the place on the line (GAZE, by metres flown; each pull eased in and out over its own rise about its two
//     ends): toward the First Six from 8 m to 52 m (weight 0.8, over 20 m); in the passage the eye looks along its own way, level,
//     to the lit room at its end; toward the Great Sun from 196 m to 228 m (0.7, over 12 m); then ONE SLOW ARC from 226 m to 290 m
//     (0.96, over 8 m; a look given as bearings by the metre flown, the horizon level, no roll): from the Sun's wall round by the east and
//     ACROSS THE LAKE onto the north wall, the look sinking from the Sun's 19 degrees up to about 7 to 8.6 up as flown from 250 m to
//     274 m (the bearings given there are 6.5 to 8; the long view:
//     the Hand of Hands over the doorway, the lake under it, the crown's suns above); toward the Hand of Hands from 276 m to 302 m
//     (0.75, over 12 m); toward THE MIDDLE OF THE DOORWAY'S OPENING under it from 298 m to 348 m (0.92, over 10 m: about 9 degrees
//     down at 315 m and 6 to 7 at 336 m; the doorway square on, its jambs upright; the Hand
//     leaves by the picture's top); toward the ring's seat from 350 m to the end (0.65, eased in over 10 m), so the eye has turned
//     into the bend before the corner uncovers the ring; otherwise ahead.
//   3 THE PACE reads the place on the line (above).
//   4 THE PIXEL'S FOOTPRINT (the eye's distance and the lens together, through the screen derivatives): it filters the rock's stipple
//     and the spray's dots (a grain or a dot is whole at 2.5 picture elements, gone at 1), makes a stencil's edge and the edge between
//     two faces of one tone one picture element broad, and thins a drip's ring that is finer than the picture. A tone's border (and
//     the border between the two grounds) lies where the light or the place puts it and is at most half a metre broad: a stipple
//     where the grain is resolved, and where it is not a clean edge two picture elements broad.
//   5 MOTES OF DUST AND THE RARE FALL are discs turned to the eye, and a mote is never smaller than 0.0014 of its distance (the fall
//     from the crown: 0.0028). No lamp reads the eye: every bowl and flame has one size by its place.
//   6 THE ENGINE'S RING takes the next world's picture by the metres still to fly (portal.revealDistance 135: it begins 135 m before
//     the end, at 290.5 m flown, and is whole 81 m before it, at 344.5 m flown, in the hall: 16 m of flight before the bend can
//     uncover the first of the ring at about 360 m flown). The ring itself is a thing of the engine: a rim of kaolin white.
// Everything else goes by the world's clock alone (lamps, flames, borders, dust, the run round the Great Sun every 9 s, drips, rings,
// the fall from the crown) or stands still. update() uses time and u only: dt 0 changes nothing, the same clock and place give the
// same picture. Nothing is made in update. No still's position, no wall clock, no seed but the brief's variations enters anything.
//
// VARIATIONS (ctx.rng, in the part): three looks (red led, yellow led, black and white led walls in the gallery and the columns; the
// other rooms take the next pigments in turn), the small hands' places and sizes, the forks' turns, the lamps' periods and phases,
// the stalagmites' heights, the drips. The plan, the count by place, the named hands, the line and the fresh hands' law never vary.
// No hour is dealt (ctx.vary.hour is not read). RARE (ctx.vary.rare): a slow fall of white dust from the hall's crown through the
// lamplight, and again in the lake. ctx.quality.detail thins the small hands and the dust, never a named hand.
// No bats. No sky: where nothing is, the scene's background is the deep tone.
import * as THREE from 'three';
import { buildHero, makeStyle, PALETTE, GAZE } from '../parts/hands-in-the-painted-cave.js';

const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const PACE = [[20, 110, 0.8], [200, 350, 1.15]], EASE = 15;   // metres flown from, to, share of the mean; each change eased over 15 m
const paceAt = (m) => { let f = 1; for (const [a, b, v] of PACE) f += (v - 1) * (sm(a - EASE / 2, a + EASE / 2, m) - sm(b - EASE / 2, b + EASE / 2, m)); return f; };

export default {
  id: 'hands-in-the-painted-cave',
  name: 'Hands in the Painted Cave',
  category: 'interior',
  weirdness: 0.6,
  media: ['air', 'interior'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const style = makeStyle(ctx, { palette: PALETTE });
    scene.background = style.palette.deep.clone();
    const detail = ctx.quality?.detail ?? 1, rare = !!ctx.vary?.rare;
    const hero = await buildHero(ctx, { style, detail, palette: PALETTE });
    scene.add(hero.object);
    await ctx.yield();
    const path = hero.path, L = path.length, seat = hero.anchors.portalSeat;

    // ---- THE RARE EVENT: a slow fall of white dust from the hall's crown through the lamplight (by the world's clock; made only on a
    // rare visit, in the build). Each mote has its own column under the crown, 3 m and more from the line's track, and takes the
    // tone of the lamps' sum where it is: bright in a pool, dim between. Drawn again upside down for the lake.
    let fall = null;
    if (rare) {
      const n = Math.round(1400 * detail), D = [], hc = hero.anchors.plan.hall.c;
      for (let k = 0, i = 0; i < n && k < n * 6; k++) {
        const a = (k * 0.6180339887) % 1 * Math.PI * 2, r = 14 * Math.sqrt(((k * 0.7548776662) % 1)), x = hc[0] + Math.cos(a) * r, z = hc[2] + Math.sin(a) * r;
        if (path.nearestXZ(x, z).dist < 3) continue;
        D.push(x, z, (k * 0.5698402909) % 1, (k * 0.3819660113) % 1); i++;
      }
      const ge = new THREE.InstancedBufferGeometry();
      ge.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); ge.setIndex([0, 1, 2, 1, 3, 2]);
      ge.setAttribute('iD', new THREE.InstancedBufferAttribute(new Float32Array(D), 4)); ge.instanceCount = D.length / 4;
      ge.boundingSphere = new THREE.Sphere(new THREE.Vector3(hc[0], 30, hc[2]), 36);   // the column of the fall, whole: the renderer leaves it out of pictures that cannot hold it
      const T = style.toneThresholds, M = style.toneMul;
      const mat = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uB: { value: style.palette.white } },
        vertexShader: style.lightGLSL + /* glsl */`attribute vec4 iD; uniform vec3 uB; varying vec2 vQ; varying vec3 vCol;
          void main(){ float h1 = iD.z, h2 = iD.w, h3 = fract(h1 * 17.3 + h2 * 5.1), age = fract(uTime * (.011 + .008 * h2) + h1);
            vec3 c = vec3(iD.x + .5 * sin(uTime * .21 + h3 * 40.), 60.5 - age * 60.5, iD.y + .5 * cos(uTime * .17 + h1 * 31.));
            float s = lampSum(c, vec3(0., 1., 0.));
            float mul = s > ${T[0]} ? 1. : (s > ${T[1]} ? ${M[2]} : (s > ${T[2]} ? ${M[1]} : ${M[1]} * .8));
            vCol = uB * mul; vQ = position.xy; vP = c; vL = s; vForm = 0.;
            vec4 mv = modelViewMatrix * vec4(c, 1.); float size = max(.05 + .05 * h3, -mv.z * .0028) * step(.06, c.y);
            mv.xy += position.xy * size; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: 'varying vec2 vQ; varying vec3 vCol; void main(){ if (dot(vQ, vQ) > 1.) discard; gl_FragColor = vec4(vCol, 1.); }' });
      fall = new THREE.Group(); fall.name = 'fall';
      for (const m of [1, -1]) { const me = new THREE.Mesh(ge, mat); me.scale.y = m; me.renderOrder = m > 0 ? 6 : 2.5; me.matrixAutoUpdate = false; me.updateMatrix(); fall.add(me); }
      scene.add(fall);
      await ctx.yield();
    }

    // ---- THE GAZE (by the place on the line): the part's GAZE, each pull eased in and out over 20 m about its place (or over its own rise)
    const RISE = 20;
    // A LOOK GIVEN AS BEARINGS (g.arc: [metre flown, degrees east of north, degrees up]): the target stands 100 m off the line's own place
    // along the look; between two entries the look is eased by a curve through all of them (no stop at an entry), never over 50 degrees up
    const _lp = new THREE.Vector3(), _lt = new THREE.Vector3(), RAD = Math.PI / 180;
    const lookAt = (A) => (time, u) => { const m = Math.max(A[0][0], Math.min(A[A.length - 1][0], u * L)); let k = 0; while (k < A.length - 2 && m > A[k + 1][0]) k++;
      const p0 = A[Math.max(0, k - 1)], p1 = A[k], p2 = A[k + 1], p3 = A[Math.min(A.length - 1, k + 2)], h = p2[0] - p1[0], t = (m - p1[0]) / h, t2 = t * t, t3 = t2 * t;
      const cr = (c) => { const m1 = (p2[c] - p0[c]) / Math.max(p2[0] - p0[0], 1e-6) * h, m2 = (p3[c] - p1[c]) / Math.max(p3[0] - p1[0], 1e-6) * h; return (2 * t3 - 3 * t2 + 1) * p1[c] + (t3 - 2 * t2 + t) * m1 + (3 * t2 - 2 * t3) * p2[c] + (t3 - t2) * m2; };
      const b = cr(1) * RAD, e = Math.min(50, cr(2)) * RAD; path.posAtDist(u * L, _lp);
      return _lt.set(_lp.x + 100 * Math.sin(b) * Math.cos(e), _lp.y + 100 * Math.sin(e), _lp.z - 100 * Math.cos(b) * Math.cos(e)); };
    const pois = GAZE.map((g) => ({
      from: (g.from - (g.rise ?? RISE) / 2) / L, to: (g.to + (g.rise ?? RISE) / 2) / L, fade: (g.rise ?? RISE) / (g.to - g.from + (g.rise ?? RISE)), weight: g.weight,
      at: g.arc ? lookAt(g.arc) : new THREE.Vector3(g.at[0], g.at[1], g.at[2]),
    }));

    return {
      scene, path, duration: 64,
      pace: (u) => paceAt(u * L),
      camera: { fov: 62, near: 0.3, far: 600, lookAhead: 10, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: seat.radius, color: '#F5ECD8', glow: 0.55, revealDistance: 135 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.setFlown((u || 0) * L);      // the fresh hands: the metres flown, nothing else
        hero.update(0, time, camera);     // the world's clock, nothing else (the part reads no dt and no camera)
      },
      dispose() { hero.dispose(); },
    };
  },
};
