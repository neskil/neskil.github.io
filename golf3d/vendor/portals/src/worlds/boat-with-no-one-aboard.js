// THE BOAT WITH NO ONE ABOARD. From the bow of a worn pine river barge with nobody on it we run out of a brown river
// mouth, over three standing green rollers and through seas each of one colour (milk and stars, a green dark, a
// violet sea along a coast of great flowers, a pearl sea under an ice front, a squall and a red wall of sky, deep
// blue under funnels of fire) to islands heaped of star points, among which the line rises from the sea to the ring.
//
// THE BOAT WE RIDE IS DECLARED. It is the book's own boat, carried at ONE CONSTANT STATION ON THE EYE from the first
// metre of the visit to the last: the only body of this world that goes with the eye. (The kit's boxes of rain,
// snow, petals and blown spray are a medium we pass through; the sea's grid and the sky's dome are drawn round
// the eye and painted by world place.)
//   STATION: on the line, under the eye, heading along the line. The deck lies 2.38 m under the eye (the eye rides
//   EYE = 2.8 m over the water's ride profile, the deck BOW.deck = 0.42 m over the water; the swell lifts the hull
//   under the eye by its own height there, under a metre). The stem is BOW.stem = 5.0 m ahead of the eye, the
//   head of its post 1.68 m under the eye's level; the hull is 2.1 m to a side and runs 9 m astern of the eye.
//   ONE STATE: BORNE UNDER THE EYE AT THAT ONE STATION, from the first metre to the last: on the water where the
//   line lies on the water, over it where the line rises (the last 200 m, over the last island's rim to the
//   ring). Its attitude is a rule of what lies under it at its own place: the slope of the water where the line
//   lies on the sea; the line's own slope where the line stands above the sea; the two blended by the height of
//   the line over the water at that place (0.3 to 2.5 m), with no step. Its roll is the water's and goes to
//   nought with that height, as its trim goes to the line's slope; a slow wander of its head (0.02 rad) is the
//   boat's own and goes on at every height, on the water and above it alike.
//   NOTHING IS STAGED WHERE THE LINE RISES: no water falls from the hull, and no spray, flock, sound, sway or
//   beat begins or ends there. Whatever the boat wears it wears by the table's rows at its own place, there as
//   everywhere.
//   WHAT IT WEARS, each read from the table at the boat's own place:
//     the film of water over its planks and the spray blown across it: row 13 (the bar) at the boat's s;
//     its heel to the lee in the squall: row 12 (the rain) at the boat's s;
//     the strength of the cold crescents on its planks: row 10 (the ambient light) at each plank's own place
//     (how many planks bear one is the visit's: ctx.vary.rare);
//     its own light and wet sheen: rows 8, 9 and 10 (the key, its direction, the ambient) at each plank's place;
//     ITS WASH ALONG THE HULL AND ITS WAKE ASTERN, painted on the sea's own face at the boat's place (the part's
//     sea): they are the hull's contact with the water, there wherever the hull sits in the sea and nowhere it
//     does not (by the height of the hull over the water at its own place); the wake's glow is row 7 (the
//     phosphorus) at the water's own place;
//     THE BIRDS ON ITS RAIL (four to six by the visit) ARE PART OF WHAT THE BOAT WEARS: on the cap rail 2.1 to
//     4.4 m ahead of the eye, perched or flying their loops off it, from the first metre to the last; their
//     places are places of the boat's own frame, their habit is on the world clock, their light is rows 8 to 10.
//   NOTHING OF IT IS SWITCHED, BEGUN OR ENDED BY THE METRES FLOWN: no law of boat or birds reads the flight's
//   share or a metre of the voyage as a gate. (bowG.visible = !ctx.through hides it only in the view through a
//   portal from another world, where nobody rides.)
//   THE HERD OF SEA-HORSES IS NO COMPANION: it is a habit of the blue sea on the world clock, on lanes of that
//   sea (HERD), there for whoever comes; it does not go with the eye and nothing of it reads the eye.
//
// Space: the voyage runs toward -Z; s = -z is metres of the voyage from the entry; +X is starboard; y = 0 is mean sea
// level. The seas are bands across the voyage and every thing is placed by s and x from the PLACES of the visit.
// The hero part (src/parts/boat-with-no-one-aboard.js) holds the sea, its table, the sky and the star archipelago.
// The eye rides 2.8 m over the water's ride profile from the entry to the lift (a plain cosine over the three
// rollers, whose water is peaked under it), then climbs over the last island's rim to the ring.
// THE PLACE STANDS. Each sea's water, sky, light and weather are written by world z in one table (the part), the
// same for whoever is there at any moment. EACH THING TAKES THE TABLE AT ITS OWN PLACE AND THE WEATHER BETWEEN THE
// EYE AND ITSELF. A SUN STANDS IN ITS OWN SEA'S SKY AT ONE STRENGTH, FOR EVER, AND IS SEEN FROM ANY SEA; ONLY THE
// WEATHER BETWEEN THE EYE AND IT DIMS IT: a disc's strength is a constant of its own sea, and what an eye sees of
// it is that constant times what the table's summed fog lets through between the eye's place and the nearest
// metre of the sun's own sea, whichever way that sea lies (the depth taken along the sun's fixed bearing), every
// air of the table alike: haze, dawn, mist, squall and red wall. The mock suns stand and fall with the silver sun by the same law.
// So the low sun and the silver sun are in the sky of the river mouth and of the milk sea too, as much of them as
// the haze between leaves, and beyond the squall and the red wall there is nothing of either. (The dome's own
// colours, the fire along the blue sea's sea-line and the lightning on cloud keep the dome's law: the sky's
// colour in a direction is that of the sea a little way on in that direction.) The fire lies
// along the blue sea's sea-line; the doors over the star islands stand open and are closed to an eye only by the
// depth of squall and red air along the ray; the squall's strokes, the far lightning (which has a place of its own
// off the line), the embers under the funnels and the wheeling flocks are there for whoever is anywhere, each lit
// by the sea it is in and dimmed by the table's summed fog along the ray. Only the media that are where the eye
// is (rain, snow, petals, the bar's blown spray) read the table at the eye. What moves keeps a habit on the world clock
// and reads at every phase: the doves' sheets through their join, the birds on our rail, the snakes of the coast,
// the calving of the ice front, the wheeling flocks, fish, lightning, spray, the sea-horses' herd on its lane of
// the blue sea, the gold birds. Every body is kept off the lens by its place: its whole course against the line.
// WHAT FOLLOWS THE METRES OF THE VOYAGE, and nothing else does: the pace (slower over the bar and across the blue
// sea, by places); the looks to what stands alongside (by places); and what the boat wears from the place it is
// in (above). None of them begins, turns or ends anything.
// JOINS: every join between two seas is 2 x JOIN metres of weather centred on the join's own place.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { CEIL, JOIN, RED_DEPTH, GLSL_SEAS, GLSL_SKY, GLSL_REDAIR, seaStops, seaTable, makeSeas, skyUniforms, makeSkyDome, makeSea, makeStarIslands, makeGoldenBirds, makeColumns, birdGeometry, birdMaterial, linear, GLSL_FLOAT, NDOOR, NISL, NLAMP, NFUN, NBERG } from '../parts/boat-with-no-one-aboard.js';

const EYE = 2.8;
// every stream of this world, forked from ctx.rng in this order at the head of build(), before anything is built
const STREAMS = ['deal', 'wharf', 'barges', 'lamps', 'bow', 'rope', 'perch', 'rafts', 'wheel', 'doves', 'fall', 'coast', 'flowers', 'eyes', 'trees', 'snakes', 'petals',
  'ice', 'bergs', 'fish', 'squall', 'wall', 'funnels', 'embers', 'horses', 'islands', 'heaps', 'gold', 'spray', 'snow', 'rain', 'mist'];
// the streams of the things that came later: each made from the world's seed and its own name (it draws from no parent)
const OWN = ['ropeSwing', 'rollers', 'hull', 'reef', 'cliffs', 'islet', 'bolts', 'peaks', 'hills', 'ground', 'seracs', 'loom', 'nearFunnel', 'columns', 'rents', 'pass', 'calve', 'drop',
  'calvePhase', 'brash'];

// the river's own hour (the other seas keep their light whatever the hour)
const RIVER = {
  dusk: { deep: linear('#3d2a18', 0.6), crest: linear('#9a6c3c', 0.9), foam: linear('#cdb898', 0.8), skyHi: linear('#3c3566', 1), skyLo: linear('#9a6a78', 1), astern: linear('#e07a30', 0.9),
    fog: linear('#6e5068', 0.85), key: linear('#ff9c4a', 0.35), keyDir: [0, 0.35, 0.94], amb: linear('#66546e', 0.95), stars: 0.25, lamps: 1 },
  dawn: { deep: linear('#3d2a18', 0.55), crest: linear('#8c6c50', 0.8), foam: linear('#d8c8b8', 0.8), skyHi: linear('#54506a', 0.9), skyLo: linear('#b88c8c', 0.9), astern: linear('#eab09a', 0.9),
    fog: linear('#9a7880', 0.8), key: linear('#ffc0a0', 0.6), keyDir: [0, 0.3, 0.95], amb: linear('#6c6274', 0.9), stars: 0.1, lamps: 0.85 },
  day: { deep: linear('#4a3520', 0.6), crest: linear('#a07c48', 0.8), foam: linear('#e0d0b0', 0.8), skyHi: linear('#8c7c5c', 0.9), skyLo: linear('#bca474', 0.9), astern: linear('#ccb484', 0.9),
    fog: linear('#a89068', 0.8), key: linear('#ffe0a8', 0.7), keyDir: [0.2, 0.9, 0.3], amb: linear('#86785c', 0.9), stars: 0, lamps: 0.5 },
  night: { deep: linear('#241a12', 0.5), crest: linear('#6a4c2c', 0.7), foam: linear('#b8a688', 0.7), skyHi: linear('#090a14', 1), skyLo: linear('#1c2034', 1), astern: linear('#22243a', 1),
    fog: linear('#181b2c', 1), key: linear('#ff9c4a', 0.5), keyDir: [0, 0.4, 0.9], amb: linear('#2e2c40', 0.9), stars: 1, lamps: 1.25 },
};
const RIVER_REST = { glow: [0, 0, 0], swell: 0.07, foamAmt: 0.12, rough: 0.6, cloud: 0.55, dens: 1 / 900, chop: 0.5, spec: 0.7 };

// THE SEEDED VARIATIONS, dealt by shares from the stream 'deal' (and the engine's hints)
function deal(v, vary) {
  const hour = vary.hour === 'dawn' || vary.hour === 'day' || vary.hour === 'night' ? vary.hour : 'dusk';
  // which bank has the longer wharf, which side the flower coast stands on, which side the ice (drawn apart)
  const wharfLong = v() < 1 / 2 ? -1 : 1, coastSide = v() < 1 / 2 ? -1 : 1, iceSide = v() < 1 / 2 ? 1 : -1;
  const nFunnels = v.int(2, 4), nFar = v.int(5, 8);
  const mood = vary.mood ?? 0.5, fire = '#' + new THREE.Color('#e2461a').lerp(new THREE.Color('#b8481c'), mood).getHexString();
  return { hour, wharfLong, coastSide, iceSide, nFunnels, nFar, mood, fire, swellK: lerp(0.8, 1.2, mood), density: vary.density ?? 1, rare: !!vary.rare, river: { ...RIVER_REST, ...RIVER[hour] } };
}

// THE PLACES of the voyage (metres from the entry), from the hour's lengths
function places(V) {
  const P = { bar: 110, crest: [140, 195, 250], milk: 250, wall0: 750, wall1: 775, star: 880, lift: 950, saddle: 1090, ring: 1150 };
  P.green = P.milk + 90 + (V.hour === 'night' ? 40 : 0);
  P.violet = P.green + 60; P.coast0 = P.violet + 40;
  P.squall = P.wall0 - 30; P.front1 = P.wall0 - 15; P.front0 = P.front1 - (V.hour === 'day' ? 160 : V.hour === 'night' ? 80 : 120);
  // the coast ends where the join's weather begins (JOIN m before the front's near corner); the ice sea begins midway
  // between the coast's end and the front's near corner, and the join's mist stands on that same place
  P.mist = P.front0 - JOIN; P.coast1 = P.mist; P.ice = (P.coast1 + P.front0) / 2;
  return P;
}

// THE ROUTE: way points from the places. Lateral keys are metres off the axis.
// Beyond the red wall the line weaves: from the axis 45 m past the wall it leans NEAR.lean m toward the one funnel
// that hangs near (W.fun, on the hand away from the first island), swings ISLE.lean m toward the first island so
// that it passes through the outer sheets of that island's rising birds abeam of it (W.isle), and is back on the
// axis 50 m before the saddle. Between those places the line eases (a cosine), with a way point every 15 m.
const NEAR = { lean: 5 }, ISLE = { x: -100, R: 55, lean: 24 };
// the reef of the bar: its rocks' near edges lie REEF.near to REEF.far m from the line, and more behind them out to REEF.back
const REEF = { near: 15, far: 40, mid: 27, back: 90 };
function layRoute(P, V, seas) { const r = routePoints(P, V, seas); return { path: makePath(r.pts), xAt: r.xAt }; }
function routePoints(P, V, seas) {
  const cs = V.coastSide, is = V.iceSide, c = P.crest;
  const keys = [[0, 0], [60, 0], [P.bar, -4 * cs], [(c[0] + c[1]) / 2, -8 * cs], [c[1], -8 * cs], [(c[1] + c[2]) / 2, -6 * cs], [c[2], -2 * cs], [c[2] + 35, 4 * cs],
    [P.violet, 14 * cs], [P.coast0 + 30, 10 * cs], [P.mist, 6 * is], [(P.front0 + P.front1) / 2 - 15, 20 * is], [P.wall0 - 10, 14 * is]];
  const weave = [[P.wall1 + 45, 0], [V.nearFunnel.s, V.nearFunnel.side * NEAR.lean], [P.lift - 15, Math.sign(ISLE.x) * ISLE.lean], [P.saddle - 50, 0]];
  for (let i = 0; i < weave.length - 1; i++) { const [s0, x0] = weave[i], [s1, x1] = weave[i + 1], n = Math.max(1, Math.round((s1 - s0) / 15));
    for (let k = 0; k < n; k++) { const t = k / n; keys.push([lerp(s0, s1, t), lerp(x0, x1, 0.5 - 0.5 * Math.cos(Math.PI * t))]); } }
  keys.push([P.saddle - 50, 0], [P.saddle, 0]);
  const xAt = (s) => { let i = 0; while (i < keys.length - 2 && s > keys[i + 1][0]) i++; const t = clamp((s - keys[i][0]) / (keys[i + 1][0] - keys[i][0]), 0, 1); return lerp(keys[i][1], keys[i + 1][1], t); };
  const pts = [];
  for (const [s, x] of keys) {
    if (s >= P.lift) break;
    pts.push([x, EYE + seas.rideS(s), -s]);
    // over the bar: a way point every eighth of a wave, from the ride profile itself (2.8 m over the water at every
    // crest and trough, more between)
    if (s >= P.bar && s < c[2] + 35) { const nx = keys.find((k) => k[0] > s)[0]; for (let q = s + 6.9; q < nx - 3; q += 6.9) pts.push([xAt(q), EYE + seas.rideS(q), -q]); }
  }
  // the lift: the slope comes on over 30 m and goes off over the 30 m before the saddle
  const slope = (s) => smoothstep(P.lift, P.lift + 30, s) * (1 - smoothstep(P.saddle - 30, P.saddle, s));
  let area = 0; for (let s = P.lift; s < P.saddle; s += 1) area += slope(s + 0.5);
  const m = (46 - EYE) / area; let y = EYE;
  pts.push([xAt(P.lift), EYE, -P.lift]);
  for (let s = P.lift; s < P.saddle; s += 1) { y += m * slope(s + 0.5); if ((s + 1 - P.lift) % 14 === 0 && s + 1 < P.saddle - 4) pts.push([xAt(s + 1), y, -(s + 1)]); }
  pts.push([0, 46, -P.saddle], [0, 46, -(P.saddle + 30)], [0, 46, -P.ring]);
  return { pts, xAt };
}

// ---- a small bag of coloured, flat-shaded geometry: position, normal, colour, aFx = (emissive, kind: 0 plain, 1 wood), aWarm (lamp light baked per vertex)
function makeBag() {
  const P = [], N = [], C = [], FX = [], I = [];
  const bag = {
    kind: 0, emit: 0,
    quad(a, b, c, d, col) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i0 = P.length / 3;
      for (const q of [a, b, c, d]) { P.push(q[0], q[1], q[2]); N.push(nx, ny, nz); C.push(col[0], col[1], col[2]); FX.push(bag.emit, bag.kind); }
      I.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
      return bag;
    },
    tri(a, b, c, col) { return bag.quad(a, b, c, c, col); },
    // a box standing on y0: centre (cx, cz), sizes, turned ry about its own axis; o.taper narrows the top, o.open leaves out the bottom
    box(cx, y0, cz, sx, sy, sz, col, o = {}) {
      const c = Math.cos(o.ry || 0), s = Math.sin(o.ry || 0), t = o.taper ?? 1, hx = sx / 2, hz = sz / 2;
      const pt = (x, y, z) => [cx + x * c + z * s, y0 + y, cz - x * s + z * c];
      const b = [pt(-hx, 0, -hz), pt(hx, 0, -hz), pt(hx, 0, hz), pt(-hx, 0, hz)], u = [pt(-hx * t, sy, -hz * t), pt(hx * t, sy, -hz * t), pt(hx * t, sy, hz * t), pt(-hx * t, sy, hz * t)];
      bag.quad(b[3], b[2], u[2], u[3], col).quad(b[1], b[0], u[0], u[1], col).quad(b[2], b[1], u[1], u[2], col).quad(b[0], b[3], u[3], u[0], col).quad(u[3], u[2], u[1], u[0], col);
      if (!o.open) bag.quad(b[0], b[1], b[2], b[3], col);
      return bag;
    },
    // an upright post or drum: smooth round the axis
    cyl(x, y0, z, r0, r1, h, seg, col, o = {}) {
      const i0 = P.length / 3, lx = o.lean ? o.lean[0] : 0, lz = o.lean ? o.lean[1] : 0;
      for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        P.push(x + ca * r0, y0, z + sa * r0, x + lx + ca * r1, y0 + h, z + lz + sa * r1); N.push(ca, 0, sa, ca, 0, sa); C.push(col[0], col[1], col[2], col[0], col[1], col[2]); FX.push(bag.emit, bag.kind, bag.emit, bag.kind); }
      for (let j = 0; j < seg; j++) { const a = i0 + j * 2; I.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
      if (o.cap) { const top = []; for (let j = 0; j < seg; j++) { const a = j / seg * Math.PI * 2; top.push([x + lx + Math.cos(a) * r1, y0 + h, z + lz + Math.sin(a) * r1]); } for (let j = 1; j < seg - 1; j++) bag.tri(top[0], top[j + 1], top[j], col); }
      return bag;
    },
    // a smooth skin over rings: each ring { c: centre, u, v: its two axes (unit), ru, rv: half widths }
    loft(rings, seg, col) {
      const i0 = P.length / 3;
      for (const r of rings) for (let j = 0; j <= seg; j++) { const a = j / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        P.push(r.c[0] + r.u[0] * ca * r.ru + r.v[0] * sa * r.rv, r.c[1] + r.u[1] * ca * r.ru + r.v[1] * sa * r.rv, r.c[2] + r.u[2] * ca * r.ru + r.v[2] * sa * r.rv);
        let nx = r.u[0] * ca * r.rv + r.v[0] * sa * r.ru, ny = r.u[1] * ca * r.rv + r.v[1] * sa * r.ru, nz = r.u[2] * ca * r.rv + r.v[2] * sa * r.ru; const l = Math.hypot(nx, ny, nz) || 1;
        N.push(nx / l, ny / l, nz / l); const cc = r.col || col; C.push(cc[0], cc[1], cc[2]); FX.push(bag.emit, bag.kind); }
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i0 + i * (seg + 1) + j, b = a + seg + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
      return bag;
    },
    get triangles() { return I.length / 3; },
    vertexCount() { return P.length / 3; },
    // warm(x, y, z, nx, ny, nz): lamp light at a vertex (0..). bake(warm, count) bakes the next count vertices and
    // says whether any are left (a build rests between runs); toGeometry(warm) bakes whatever is left
    bake(warm, count = 1e9) {
      const n = P.length / 3; if (!bag.W || bag.W.length !== n) { bag.W = new Float32Array(n); bag.baked = 0; }
      const to = Math.min(n, bag.baked + count), W = bag.W;
      for (let i = bag.baked; i < to; i++) W[i] = warm(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
      bag.baked = to; return to < n;
    },
    toGeometry(warm) {
      const g = new THREE.BufferGeometry(), n = P.length / 3;
      if (warm) bag.bake(warm);
      const W = warm ? bag.W : new Float32Array(n);
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aFx', new THREE.Float32BufferAttribute(FX, 2)); g.setAttribute('aWarm', new THREE.BufferAttribute(W, 1)); g.setIndex(I);
      return g;
    },
  };
  return bag;
}

// ---- the material of every fixed solid thing: lit by the sea it stands in (the table), fogged by the table, wood grain where asked
function litMaterial(seas, o = {}) {
  const U = { ...seas.uniforms, uLamp: { value: new THREE.Color(o.lamp || '#ffb24a') }, uWet: { value: o.wet ?? 0 }, uCalm: { value: o.calm ?? 0 }, uRim: { value: o.rim ?? 0 }, ...(o.uniforms || {}) };
  return new THREE.ShaderMaterial({ uniforms: U, side: o.side ?? THREE.FrontSide, vertexColors: true,
    vertexShader: GLSL_SEAS + /* glsl */`
      attribute vec2 aFx; attribute float aWarm; varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying vec3 vFx; varying vec3 vLp;
      ${o.vertPars || ''}
      void main(){
        vec3 p = position, n = normal;
        ${o.vert || ''}
        #ifdef USE_INSTANCING
          vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.); vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
        #else
          vec4 wp = modelMatrix * vec4(p, 1.); vN = normalize(mat3(modelMatrix) * n);
        #endif
        vWp = wp.xyz; vLp = p; vCol = color; vFx = vec3(aFx, aWarm);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + GLSL_SEAS + /* glsl */`
      uniform vec3 uLamp; uniform float uWet; uniform float uCalm; uniform float uRim; varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying vec3 vFx; varying vec3 vLp;
      ${o.fragPars || ''}
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        vec3 alb = vCol;
        if (vFx.y > .5){
          vec3 a = abs(n); float c = a.y > .6 ? vLp.x / .26 : vLp.y / .3, along = a.y > .6 ? vLp.z : (a.x > a.z ? vLp.z : vLp.x);
          float e = min(fract(c), 1. - fract(c));
          alb *= mix(.5, 1., smoothstep(.015, .09, e)) * (.82 + .32 * hash11(floor(c) * 1.37 + 3.)) * (.88 + .24 * vnoise(vec2(c * 9., along * 1.3)));
        } else alb *= .9 + .2 * vnoise(vLp.xz * 1.7 + vLp.y * 2.3);
        vec3 glowAdd = vec3(0.);
        ${o.frag || ''}
        vec3 lit = seaLight(n, vWp, vec3(1.), .35); lit = mix(lit, vec3(dot(lit, vec3(.3, .5, .2))), uCalm);
        vec3 col = alb * lit + alb * uLamp * vFx.z + vCol * vFx.x + glowAdd;
        vec3 v = normalize(cameraPosition - vWp);
        col += uWet * seaAt(10., vWp.xz).rgb * pow(1. - clamp(dot(n, v), 0., 1.), 4.) * .5;
        // (rim: the key's own colour along every edge that turns from the eye)
        col += uRim * seaAt(8., vWp.xz).rgb * pow(1. - clamp(dot(n, v), 0., 1.), 3.) * .6;
        gl_FragColor = vec4(seaFog(col, vWp, clamp(vFx.x * .2, 0., .7)), 1.);
      }` });
}
// ---- our own bow: the foredeck of a river barge of pale pine, seen from where a rider would stand. Local space: the
// origin is the waterline under the eye, forward is -Z, starboard +X; the deck lies 0.42 m over the water (a laden
// barge, low in it) and the rider stands on the hatch boards. HULL.lively: how many times the water's own slope the
// light hull answers the swell with.
const BOW = { deck: 0.42, stem: 5.0, aft: -9, beam: 2.1, rail: 0.32 };
const HULL = { lively: 4 };
const bowHalf = (f) => (f <= 1 ? BOW.beam : BOW.beam * Math.sqrt(Math.max(0, 1 - Math.pow((f - 1) / (BOW.stem - 1), 2.3))));
const bowDeck = (f) => BOW.deck + 0.2 * Math.pow(Math.max(f, 0) / BOW.stem, 2);
function bowGeometry(rng) {
  const b = makeBag(), pine = linear('#c8ad84'), pale = linear('#d9c39c'), tar = linear('#2c2219'), dark = linear('#6a5338'), iron = linear('#30302e'), rope = linear('#b79a66');
  const N = 22, st = []; for (let i = 0; i <= N; i++) { const t = i / N; st.push(BOW.aft + (BOW.stem - BOW.aft) * (1 - Math.pow(1 - t, 1.5))); }
  const P = (f, x, y) => [x, y, -f];
  b.kind = 1;
  for (let i = 0; i < N; i++) {
    const f0 = st[i], f1 = st[i + 1], w0 = bowHalf(f0), w1 = bowHalf(f1), d0 = bowDeck(f0), d1 = bowDeck(f1), in0 = Math.max(w0 - 0.2, 0), in1 = Math.max(w1 - 0.2, 0);
    // deck (four strips across, so the planks' shading has corners to hang on)
    for (let k = 0; k < 4; k++) { const a = -1 + k / 2, c = a + 0.5; b.quad(P(f0, a * in0, d0), P(f0, c * in0, d0), P(f1, c * in1, d1), P(f1, a * in1, d1), pine); }
    for (const sd of [-1, 1]) {
      const A = (f, w, y) => P(f, sd * w, y), flip = (q) => (sd > 0 ? b.quad(q[0], q[1], q[2], q[3], q[4]) : b.quad(q[1], q[0], q[3], q[2], q[4]));
      // the bulwark's inner face, its cap rail, the hull's side down into the water
      flip([A(f0, in0, d0), A(f1, in1, d1), A(f1, in1, d1 + BOW.rail), A(f0, in0, d0 + BOW.rail), dark]);
      flip([A(f0, in0 - 0.05, d0 + BOW.rail), A(f1, in1 - 0.05, d1 + BOW.rail), A(f1, w1 + 0.06, d1 + BOW.rail), A(f0, w0 + 0.06, d0 + BOW.rail), pale]);
      flip([A(f1, w1 + 0.06, d1 + BOW.rail), A(f1, w1 * 0.9, -0.5), A(f0, w0 * 0.9, -0.5), A(f0, w0 + 0.06, d0 + BOW.rail), tar]);
    }
  }
  // the stem post, the towing bitt with its cross pin, a windlass between two cheeks, the hatch coaming behind the eye
  b.box(0, bowDeck(BOW.stem - 0.2), -(BOW.stem - 0.22), 0.26, 0.5, 0.3, dark);
  const bf = 3.55, by = bowDeck(bf);
  b.box(0, by, -bf, 0.22, 0.55, 0.22, dark).box(0, by + 0.36, -bf, 0.7, 0.09, 0.09, dark).box(0, by + 0.55, -bf, 0.28, 0.05, 0.28, pale);
  b.kind = 0;
  const wf = 4.3, wy = bowDeck(wf);
  for (const sd of [-1, 1]) b.box(sd * 0.5, wy, -wf, 0.12, 0.36, 0.34, dark);
  for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.283, a1 = (k + 1) / 8 * 6.283, r = 0.13, y = wy + 0.22; b.quad([-0.44, y + Math.sin(a0) * r, -wf + Math.cos(a0) * r], [0.44, y + Math.sin(a0) * r, -wf + Math.cos(a0) * r], [0.44, y + Math.sin(a1) * r, -wf + Math.cos(a1) * r], [-0.44, y + Math.sin(a1) * r, -wf + Math.cos(a1) * r], k % 2 ? rope : pale); }
  b.kind = 1;
  b.box(0, BOW.deck, 3.4, 3.1, 0.34, 7.4, dark, { open: true }).box(0, BOW.deck + 0.34, 3.4, 3.3, 0.06, 7.6, pale, { open: true });
  for (const sd of [-1, 1]) for (const f of [1.6, 3.9]) { b.kind = 0; b.box(sd * (bowHalf(f) - 0.42), bowDeck(f), -f, 0.1, 0.13, 0.3, iron); }
  // the snapped tow rope: turns round the bitt, a slack length to the stem, and a tail that hangs free and swings (kind 2)
  b.kind = 0;
  for (let k = 0; k < 4; k++) b.cyl(0, by + 0.14 + k * 0.05, -bf, 0.17, 0.17, 0.045, 8, rope);
  const tube = (pts, r, kind) => { b.kind = kind; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; b.quad([p[0] - r, p[1], p[2]], [p[0] + r, p[1], p[2]], [q[0] + r, q[1], q[2]], [q[0] - r, q[1], q[2]], rope).quad([p[0], p[1] - r, p[2] + r], [p[0], p[1] + r, p[2] - r], [q[0], q[1] + r, q[2] - r], [q[0], q[1] - r, q[2] + r], rope); } };
  const slack = []; for (let i = 0; i <= 8; i++) { const t = i / 8, f = lerp(bf + 0.15, BOW.stem - 0.5, t); slack.push([0.16 + 0.5 * Math.sin(t * 3.1) + rng.range(-0.04, 0.04), bowDeck(f) + 0.04 + 0.3 * t * t, -f]); }
  tube(slack, 0.03, 0);
  const tail = []; for (let i = 0; i <= 7; i++) tail.push([-0.26 - 0.02 * i, by + 0.36 - 0.07 * i, -bf + 0.05]);
  tube(tail, 0.03, 2);
  b.kind = 0;
  return b.toGeometry();
}
// ---- a moored river barge like our own: blunt at both ends, hatch boards, a small house aft. Forward is -Z.
function bargeGeometry(rng, L, B) {
  const b = makeBag(), pine = linear('#b89c74'), pale = linear('#cdb690'), tar = linear('#231b14'), dark = linear('#5c4832'), amber = linear('#ffb24a');
  const half = (t) => B / 2 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t * 2 - 1), 3.2)), 0.5), N = 14, dy = 0.95;
  b.kind = 1;
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N, z0 = (0.5 - t0) * L, z1 = (0.5 - t1) * L, w0 = half(t0), w1 = half(t1);
    b.quad([-w0, dy, z0], [w0, dy, z0], [w1, dy, z1], [-w1, dy, z1], pine);
    for (const sd of [-1, 1]) {
      b.quad([sd * w0, dy + 0.4, z0], [sd * w1, dy + 0.4, z1], [sd * w1 * 0.9, -0.5, z1], [sd * w0 * 0.9, -0.5, z0], tar);
      b.quad([sd * (w0 - 0.12), dy, z0], [sd * (w1 - 0.12), dy, z1], [sd * (w1 - 0.12), dy + 0.4, z1], [sd * (w0 - 0.12), dy + 0.4, z0], dark);
      b.quad([sd * (w0 - 0.14), dy + 0.4, z0], [sd * (w1 - 0.14), dy + 0.4, z1], [sd * (w1 + 0.04), dy + 0.4, z1], [sd * (w0 + 0.04), dy + 0.4, z0], pale);
    }
  }
  // hatch covers along the hold, a house aft with a lit window, a load of its own, a bow post with a small lantern
  const hl = L * rng.range(0.42, 0.52), hz = -L * 0.06;
  b.box(0, dy, hz, B * 0.62, 0.45, hl, dark, { open: true }).box(0, dy + 0.45, hz, B * 0.66, 0.08, hl + 0.2, pale, { open: true });
  const hw = B * rng.range(0.5, 0.62), hh = rng.range(1.7, 2.2), hd = rng.range(2.6, 3.4), hzc = L * 0.5 - 1.6 - hd / 2;
  b.box(0, dy, hzc, hw, hh, hd, pine, { open: true }).box(0, dy + hh, hzc, hw + 0.5, 0.12, hd + 0.5, linear('#2a2a30'), { open: true });
  b.kind = 0; b.emit = 2.4; b.box(rng.sign() * (hw / 2 + 0.02), dy + hh * 0.5, hzc, 0.06, 0.5, 0.6, amber); b.emit = 0;
  const load = rng();
  if (load < 0.4) { b.kind = 1; for (let k = 0, n = rng.int(3, 7); k < n; k++) { const z = rng.range(0.8, 1.4); b.box(rng.range(-0.8, 0.8), dy + 0.53, hz + rng.range(-hl * 0.4, hl * 0.4), z, z * 0.8, z, k % 2 ? dark : pine, { ry: rng.range(0, 1.5) }); } }
  else if (load < 0.75) { b.kind = 0; b.box(0, dy + 0.53, hz, B * 0.5, rng.range(0.7, 1.2), hl * 0.7, linear('#4e4a3c'), { taper: 0.6 }); }
  b.kind = 1; b.box(0, dy, -L * 0.5 + 1.3, 0.22, 1.6, 0.22, dark);
  b.kind = 0; b.emit = 3.5; b.box(0, dy + 1.6, -L * 0.5 + 1.3, 0.3, 0.38, 0.3, amber); b.emit = 0;
  return { geometry: b.toGeometry(), lamp: [0, dy + 1.8, -L * 0.5 + 1.3] };
}
// ---- the great flowers of the coast, 8 m tall at scale 1, facing local +Z (the water). Two shapes: a nodding
// trumpet with a dark throat and gold anthers, and a plume of many small bells. Blooms are white here and take each
// plant's own tint (aWarm marks what is bloom); the leaves are dark and reach down to the water. No bloom has a disc.
function flowerGeometry(kind, rng) {
  const b = makeBag(), leafA = linear('#16301e'), leafB = linear('#285030'), stemC = linear('#2a4428'), gold = linear('#ffc23a');
  // a fleshy blade through pts (a smooth closed skin, rounded at its edges): half width wid(t), thickness thk, lying
  // across 'side'; cols from col0 at its root to col1 at its tip
  const blade = (pts, wid, thk, side, col0, col1) => {
    const n = pts.length - 1, rings = pts.map((p, i) => { const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, n)], t = i / n; let tx = c[0] - a[0], ty = c[1] - a[1], tz = c[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
      // across: 'side' made square to the blade's run; the other axis is the blade's own normal
      const d = side[0] * tx + side[1] * ty + side[2] * tz; let ux = side[0] - d * tx, uy = side[1] - d * ty, uz = side[2] - d * tz; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
      return { c: p, u: [ux, uy, uz], v: [ty * uz - tz * uy, tz * ux - tx * uz, tx * uy - ty * ux], ru: Math.max(wid(t), 0.01), rv: thk * (1 - 0.6 * t) + 0.01, col: [lerp(col0[0], col1[0], t), lerp(col0[1], col1[1], t), lerp(col0[2], col1[2], t)] }; });
    b.loft(rings, 6, col0);
  };
  // a ribbon through pts, its width from wid(t), flat across 'up x along'
  const strip = (pts, wid, col0, col1, up) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1), dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2];
      let sx = dy * up[2] - dz * up[1], sy = dz * up[0] - dx * up[2], sz = dx * up[1] - dy * up[0]; const l = Math.hypot(sx, sy, sz) || 1; sx /= l; sy /= l; sz /= l;
      const w0 = wid(t0), w1 = wid(t1), c = [lerp(col0[0], col1[0], t0), lerp(col0[1], col1[1], t0), lerp(col0[2], col1[2], t0)];
      b.quad([p[0] - sx * w0, p[1] - sy * w0, p[2] - sz * w0], [p[0] + sx * w0, p[1] + sy * w0, p[2] + sz * w0], [q[0] + sx * w1, q[1] + sy * w1, q[2] + sz * w1], [q[0] - sx * w1, q[1] - sy * w1, q[2] - sz * w1], c);
    }
  };
  // marks: [vertex count after a piece, bloom mask]
  const marks = [];
  const done = (m) => marks.push([b.vertexCount(), m]);
  // the stem leans out over the water and nods at its head
  const H = 8, stem = []; for (let i = 0; i <= 6; i++) { const t = i / 6; stem.push([rng.range(-0.1, 0.1) * t, H * (t - 0.06 * t * t * t), 1.5 * t * t + 0.9 * t * t * t * t]); }
  for (let i = 0; i < 6; i++) { const p = stem[i], q = stem[i + 1]; b.cyl(p[0], p[1], p[2], 0.2 - 0.02 * i, 0.18 - 0.02 * i, q[1] - p[1], 5, stemC, { lean: [q[0] - p[0], q[2] - p[2]] }); }
  // leaves from the foot, arching and falling to the water
  const nl = kind ? 6 : 8;
  for (let k = 0; k < nl; k++) {
    // (the leaves toward the water lie low, so the dark between the plants stands open to the sea)
    const a = k / nl * 6.283 + rng.range(-0.3, 0.3), low = Math.cos(a) > 0.25, len = rng.range(3.2, 5.4) * (kind ? 1.15 : 1) * (low ? 0.8 : 1), rise = rng.range(1.6, 3.4) * (low ? 0.3 : 1), pts = [];
    for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push([Math.sin(a) * len * t, 0.2 + rise * Math.sin(Math.PI * Math.min(t * 1.25, 1)) * (1 - 0.4 * t) - 0.5 * t * t, Math.cos(a) * len * t]); }
    strip(pts, (t) => (kind ? 1.05 : 0.6) * Math.sin(Math.PI * Math.min(0.08 + t * 0.92, 1)) + 0.03, k % 2 ? leafA : leafB, leafA, [0, 1, 0.01]);
  }
  done(0);
  const top = stem[6];
  if (!kind) {
    // six fleshy petals flaring from a deep throat, each a smooth curved blade that curls back at its tip; the bloom
    // nods toward the water. The throat is a dark funnel; six long stamens stand out of it, each with a gold anther.
    const ax = [0, -0.5, 0.86], at = (al, ou, u) => [top[0] + ax[0] * al + u[0] * ou, top[1] + ax[1] * al + u[1] * ou, top[2] + ax[2] * al + u[2] * ou];
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * 6.283, ca = Math.cos(a), sa = Math.sin(a), u = [ca, sa * 0.86, sa * 0.5], pts = [];
      for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push(at(2.3 * t - 0.9 * t * t * t, 0.25 + 1.9 * t * t + 0.65 * t, u)); }
      blade(pts, (t) => 0.24 + 1.0 * Math.sin(Math.PI * Math.min(0.12 + t * 0.88, 1)), 0.16, [-sa, ca * 0.86, ca * 0.5], [0.3, 0.1, 0.22], [1, 1, 1]);
    }
    done(1);
    { const th = [[-0.5, 0.3], [0.1, 0.32], [0.7, 0.5], [1.1, 0.85]], dk = [0.1, 0.02, 0.07];
      b.loft(th.map(([al, r], i) => ({ c: at(al, 0, [0, 0, 0]), u: [1, 0, 0], v: [0, 0.86, 0.5], ru: r, rv: r, col: i < 2 ? dk : [0.22, 0.05, 0.14] })), 8, dk); }
    done(0);
    b.emit = 1.4;
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + 0.5, u = [Math.cos(a), Math.sin(a) * 0.86, Math.sin(a) * 0.5], p0 = at(0.5, 0.08, u), p1 = at(2.5, 0.5, u);
      b.emit = 0.5; b.loft([{ c: p0, u: [1, 0, 0], v: [0, 0.86, 0.5], ru: 0.035, rv: 0.035 }, { c: p1, u: [1, 0, 0], v: [0, 0.86, 0.5], ru: 0.03, rv: 0.03 }], 4, [1, 0.9, 0.6]);
      b.emit = 1.4; b.loft([{ c: p1, u: [1, 0, 0], v: [0, 0.86, 0.5], ru: 0.03, rv: 0.03 }, { c: at(2.62, 0.52, u), u: [1, 0, 0], v: [0, 0.86, 0.5], ru: 0.13, rv: 0.1 }, { c: at(2.9, 0.58, u), u: [1, 0, 0], v: [0, 0.86, 0.5], ru: 0.11, rv: 0.09 }, { c: at(3.0, 0.6, u), u: [1, 0, 0], v: [0, 0.86, 0.5], ru: 0.02, rv: 0.02 }], 5, gold); }
    b.emit = 0; done(0);
  } else {
    // a plume of hanging bells spiralling up the last three metres of the stem: each bell hangs mouth down from a
    // short stalk, a smooth flared cup with a dark inside and a gold clapper
    for (let k = 0; k < 16; k++) {
      const t = k / 15, y = top[1] - 3.2 + 3.4 * t, i0 = Math.min(5, Math.floor((y / H) * 6)), sp = stem[i0], sq = stem[i0 + 1], f = clamp((y - sp[1]) / Math.max(sq[1] - sp[1], 1e-3), 0, 1);
      const cx = lerp(sp[0], sq[0], f), cz = lerp(sp[2], sq[2], f), a = k * 2.4, r = 0.9 * (1 - 0.6 * t) + 0.2, size = 0.95 * (1 - 0.55 * t) + 0.25;
      const px = cx + Math.cos(a) * r, pz = cz + Math.sin(a) * r, ox = Math.cos(a) * 0.35, oz = Math.sin(a) * 0.35;
      const R = (yy, rr, out, col) => ({ c: [px + ox * out, y - yy * size, pz + oz * out], u: [1, 0, 0], v: [0, 0, 1], ru: rr * size, rv: rr * size, col });
      b.loft([R(-0.25, 0.05, 0, [0.5, 0.5, 0.5]), R(0, 0.2, 0, [0.8, 0.8, 0.8]), R(0.45, 0.42, 0.3, [1, 1, 1]), R(0.95, 0.5, 0.7, [1, 1, 1]), R(1.25, 0.78, 1, [1, 1, 1])], 7, [1, 1, 1]);
      marks.push([b.vertexCount(), 1]);
      b.emit = 1.2; b.box(px + ox * 0.9, y - 1.3 * size, pz + oz * 0.9, 0.14 * size, 0.3 * size, 0.14 * size, gold); b.emit = 0; marks.push([b.vertexCount(), 0]);
      b.cyl(cx, y, cz, 0.04, 0.03, 0.02, 3, stemC, { lean: [px - cx, pz - cz] }); marks.push([b.vertexCount(), 0]);
    }
  }
  const g = b.toGeometry(), wa = g.getAttribute('aWarm'); let i0 = 0;
  for (const [n, m] of marks) { for (let i = i0; i < n; i++) wa.array[i] = m; i0 = n; }
  return g;
}
// ---- a sea-horse: the real small animal's shape grown to 3.6 m. Local space: +X is its heading, +Y up, the water's
// rest line at y = 0.5 (chest); the head bows forward on an arched neck, a long tube of a snout, a small crown,
// a fin on the back, a belly, and a tail that curls forward under it. No legs, no mane.
function seaHorseGeometry() {
  const b = makeBag(), skin = linear('#0a0c12'), ridge = linear('#12151e');
  const key = [[1.08, 1.2, 0.065], [0.6, 1.38, 0.1], [0.36, 1.52, 0.22], [0.1, 1.6, 0.27], [-0.12, 1.36, 0.25], [-0.1, 1.0, 0.26], [0.08, 0.6, 0.35], [0.2, 0.12, 0.43], [0.12, -0.4, 0.37], [-0.04, -0.86, 0.25],
    [-0.1, -1.26, 0.17], [0.04, -1.6, 0.11], [0.3, -1.76, 0.075], [0.47, -1.57, 0.05], [0.36, -1.38, 0.03]];
  const cr = (a, c, d, e, t) => 0.5 * ((2 * c) + (-a + d) * t + (2 * a - 5 * c + 4 * d - e) * t * t + (-a + 3 * c - 3 * d + e) * t * t * t);
  const pts = [];
  for (let i = 0; i < key.length - 1; i++) for (let q = 0; q < 3; q++) { const t = q / 3, K = (j) => key[clamp(j, 0, key.length - 1)]; pts.push([0, 1, 2].map((d) => cr(K(i - 1)[d], K(i)[d], K(i + 1)[d], K(i + 2)[d], t))); }
  pts.push(key[key.length - 1]);
  const rings = pts.map((p, i) => {
    const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, pts.length - 1)]; let tx = c[0] - a[0], ty = c[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const bump = i > 8 ? 1 + 0.09 * (i % 2 ? 1 : -1) : 1;
    return { c: [p[0], p[1], 0], u: [-ty, tx, 0], v: [0, 0, 1], ru: Math.max(p[2], 0.02) * bump, rv: Math.max(p[2], 0.02) * 0.78 * bump, col: i % 2 ? skin : ridge };
  });
  b.loft(rings, 8, skin);
  // the crown, the fin on the back, two small fins behind the head, the eyes (dull, never lit)
  for (const [x, h] of [[0.16, 0.26], [0.04, 0.32], [-0.08, 0.22]]) b.tri([x - 0.07, 1.82, 0], [x + 0.07, 1.82, 0], [x - 0.03, 1.82 + h, 0], ridge);
  for (let k = 0; k < 5; k++) { const y0 = 0.95 - k * 0.2, y1 = y0 - 0.2, w = (j) => 0.34 * Math.sin(Math.PI * clamp((j + 0.5) / 6, 0, 1)); b.quad([-0.3 + 0.07 * k, y0, 0], [-0.3 + 0.07 * (k + 1), y1, 0], [-0.3 + 0.07 * (k + 1) - 0.2 - w(k + 1), y1 - 0.05, 0], [-0.3 + 0.07 * k - 0.2 - w(k), y0 - 0.05, 0], ridge); }
  for (const sd of [-1, 1]) { b.tri([-0.02, 1.36, sd * 0.2], [-0.2, 1.5, sd * 0.36], [-0.22, 1.24, sd * 0.33], ridge); b.box(0.3, 1.56, sd * 0.2, 0.09, 0.09, 0.05, linear('#3a3f4c')); }
  return b.toGeometry();
}
// ---- a sea bird that perches on our rail, 0.55 m tall: dark back and cap, pale breast, an orange bill, pale gold
// eyes. Local space: it stands on the origin facing +Z. Wings are kind 3 (left) and 4 (right): built spread, they are
// folded along the back by the material until the bird flaps.
function perchBirdGeometry() {
  const b = makeBag(), back = linear('#262a36'), breast = linear('#d4d9de'), cap = linear('#15171f'), bill = linear('#e08a22'), leg = linear('#c8742a'), gold = linear('#ffe08a');
  const sp = [[0.2, -0.27, 0.015, back], [0.235, -0.15, 0.065, back], [0.3, -0.02, 0.1, back], [0.37, 0.08, 0.092, breast], [0.455, 0.135, 0.055, breast], [0.52, 0.165, 0.062, cap], [0.535, 0.215, 0.04, cap]];
  b.loft(sp.map((p, i) => { const a = sp[Math.max(i - 1, 0)], c = sp[Math.min(i + 1, sp.length - 1)]; let ty = c[0] - a[0], tz = c[1] - a[1]; const l = Math.hypot(ty, tz) || 1; ty /= l; tz /= l;
    return { c: [0, p[0], p[1]], u: [1, 0, 0], v: [0, tz, -ty], ru: p[2], rv: p[2] * 0.92, col: p[3] }; }), 7, back);
  b.loft([{ c: [0, 0.53, 0.235], u: [1, 0, 0], v: [0, 1, 0], ru: 0.022, rv: 0.02 }, { c: [0, 0.51, 0.33], u: [1, 0, 0], v: [0, 1, 0], ru: 0.004, rv: 0.004 }], 5, bill);
  for (const sd of [-1, 1]) {
    b.cyl(sd * 0.04, 0, 0, 0.008, 0.01, 0.22, 4, leg).box(sd * 0.04, 0, 0.02, 0.05, 0.012, 0.08, leg);
    b.emit = 1.6; b.box(sd * 0.052, 0.525, 0.2, 0.016, 0.026, 0.026, gold); b.emit = 0;
    b.kind = sd < 0 ? 3 : 4;
    const sh = [sd * 0.08, 0.37, 0.03], W = (o, z) => [sh[0] + sd * o, sh[1], sh[2] + z];
    b.quad(W(0, 0.07), W(0.22, 0.09), W(0.22, -0.13), W(0, -0.12), back).quad(W(0.22, 0.09), W(0.46, 0.02), W(0.44, -0.1), W(0.22, -0.13), cap);
    b.quad(W(0, -0.12), W(0.22, -0.13), W(0.22, -0.17), W(0, -0.15), breast);
    b.kind = 0;
  }
  return b.toGeometry();
}
export default {
  id: 'boat-with-no-one-aboard',
  name: 'The Boat with No One Aboard',
  category: 'books',
  placeKind: 'ocean',
  book: 'The Drunken Boat',
  author: 'Arthur Rimbaud, 1854 to 1891',
  media: ['water', 'air'],
  weirdness: 0.85,
  async build(ctx) {
    const detail = ctx.quality?.detail ?? 1;
    const S = Object.fromEntries(STREAMS.map((k) => [k, ctx.rng.fork(k)]));
    const N = Object.fromEntries(OWN.map((k) => [k, ctx.core.makeRng(ctx.core.hashSeed(k + ':' + ctx.seed))]));
    const V = deal(S.deal, ctx.vary || {}), P = places(V), cs = V.coastSide, is = V.iceSide;
    // the rollers' phases across the voyage; the funnel that hangs near the line over the far part of the blue sea
    // (0.7 to 0.85 of the way from the red wall's far face to the star sea's edge: beyond the red air, and ahead of
    // whoever comes through the wall for most of the crossing)
    V.roll = [N.rollers.range(0, 6.28), N.rollers.range(0, 6.28), N.rollers.range(0, 6.28)];
    V.nearFunnel = { s: lerp(P.wall1, P.star, N.nearFunnel.range(0.7, 0.85)), side: -Math.sign(ISLE.x), off: N.nearFunnel.range(19, 23), top: N.nearFunnel.range(250, 300), tip: N.nearFunnel.range(5, 15), ph: N.nearFunnel.range(0, 6.28) };
    // which hand the reef of the bar lies on
    V.reefSide = N.reef.sign();
    const scene = new THREE.Scene();
    await ctx.yield();
    // (the table is written in four runs)
    const stops = seaStops(P, V);
    await ctx.yield();
    const table = seaTable(P, V, stops); for (let k = 1; k <= 4; k++) { table.fill(k / 4); await ctx.yield(); }
    const seas = makeSeas(P, V, table.stops, table), skyU = skyUniforms();
    await ctx.yield();
    // the low sun of the violet sea stands on the side away from the coast, the white sun of the ice sea on the side away from the ice;
    // each at one strength for ever (the fourth number) in the sky of its own sea, whose clear air lies between its
    // two joins (uSunSea: the violet sea's first and last metre, the ice sea's): the part's sunSeen
    { const d2r = Math.PI / 180; skyU.uSunA.value.set(Math.sin(50 * d2r) * -cs * Math.cos(4 * d2r), Math.sin(4 * d2r), -Math.cos(50 * d2r) * Math.cos(4 * d2r), 1); skyU.uSunB.value.set(Math.sin(30 * d2r) * -is * Math.cos(12 * d2r), Math.sin(12 * d2r), -Math.cos(30 * d2r) * Math.cos(12 * d2r), 1);
      skyU.uSunSea.value.set(P.violet + JOIN, P.ice - JOIN, P.ice + JOIN, P.squall - JOIN);
      skyU.uDogA.value.set(Math.sin(52 * d2r) * -is * Math.cos(12 * d2r), Math.sin(12 * d2r), -Math.cos(52 * d2r) * Math.cos(12 * d2r)); skyU.uDogB.value.set(Math.sin(8 * d2r) * -is * Math.cos(12 * d2r), Math.sin(12 * d2r), -Math.cos(8 * d2r) * Math.cos(12 * d2r));
      skyU.uDawn.value.set(P.violet, -cs, 1.5); skyU.uSquall.value.set((P.squall + P.wall0) / 2, (P.wall0 - P.squall) / 2); const f = new THREE.Color(V.fire); skyU.uFire.value.set(f.r * 2.6, f.g * 2.6, f.b * 2.6, 0); }
    // where the blue sea's table metre lies, and the star sea's; the bay of night opens from the star sea's edge
    seas.uniforms.uBlueStar.value.set((P.wall1 + P.star) / 2, P.star + JOIN); seas.uniforms.uBay.value.set(P.star, 3.3, 60, 0);
    // (the way points, then the kit's path through them in a step of its own)
    const { pts: wayPts, xAt } = routePoints(P, V, seas);
    await ctx.yield();
    const path = makePath(wayPts), L = path.length;
    await ctx.yield();
    // metres of route flown when the eye is at voyage metre s, and back (the route never turns back along z)
    const zTab = []; { const p = new THREE.Vector3(); for (let d = 0; d <= L + 2; d += 2) zTab.push(-path.posAtDist(Math.min(d, L), p).z); }
    const dOfS = (s) => { let lo = 0, hi = zTab.length - 1; if (s <= zTab[0]) return 0; if (s >= zTab[hi]) return L; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zTab[m] <= s) lo = m; else hi = m; } return Math.min(L, 2 * (lo + (s - zTab[lo]) / Math.max(zTab[hi] - zTab[lo], 1e-6))); };
    const uOfS = (s) => dOfS(s) / L;
    // the voyage metre of the eye at u
    const sOfU = (u) => { const f = clamp(u, 0, 1) * L / 2, i = Math.min(Math.floor(f), zTab.length - 2); return lerp(zTab[i], zTab[i + 1], f - i); };
    // the squall's own middle (its point stop in the table)
    const sq = (P.squall + P.wall0) / 2;
    // the weather of a place, read from the table's rows 11 to 13 (the part's weatherAt, by voyage metre)
    const rowW = [0, 0, 0, 0], rowB = [0, 0, 0, 0], rowH = [0, 0, 0, 0];
    await ctx.yield();
    // the route's place at every metre of the voyage (x, y), for every clearance test of this build
    const routeAt = []; { const p = new THREE.Vector3(); for (let s = 0; s <= P.ring + 1; s++) { path.posAtDist(dOfS(s), p); routeAt.push(p.x, p.y); } }
    // the least distance on the water from a place to the route, tested every 2 m of route for 30 m either way
    const nearLine = (x, z) => { let m = 1e9; const s0 = Math.round(-z); for (let s = Math.max(0, s0 - 30); s <= Math.min(P.ring, s0 + 30); s += 2) m = Math.min(m, Math.hypot(routeAt[s * 2] - x, -s - z)); return m; };
    await ctx.yield();

    // ---- sky and sea (the hero part)
    const dome = makeSkyDome({ ...seas.uniforms, ...skyU }); scene.add(dome);
    await ctx.yield();
    const sea = makeSea(seas, skyU); scene.add(sea.mesh);
    scene.fog = new THREE.FogExp2(0x000000, 1 / 900);
    await ctx.yield();
    // ---- our bow (hidden while the world is seen through a portal)
    const bowU = { uFilm: { value: 0 }, uCres: { value: V.rare ? 1 : 0.42 }, uDeck: { value: new THREE.Vector2(S.bow.range(0, 40), S.bow.range(0, 40)) }, uRope: { value: new THREE.Vector2(N.ropeSwing.range(0, 6.28), N.ropeSwing.range(0, 6.28)) } };
    const bowMat = litMaterial(seas, { side: THREE.DoubleSide, wet: 1, calm: 0.8, uniforms: bowU, vertPars: 'uniform vec2 uRope;', fragPars: 'uniform float uFilm; uniform float uCres; uniform vec2 uDeck;',
      vert: /* glsl */`if (aFx.y > 1.5){ float k = clamp((.95 - p.y) / .5, 0., 1.); p.x += sin(uTime * 1.9 + uRope.x) * .16 * k * k; p.z += sin(uTime * 1.3 + uRope.y) * .1 * k * k; }`,
      frag: /* glsl */`if (n.y > .6){
          float fn = vnoise(vLp.xz * vec2(2.6, 1.5) + vec2(0., -uTime * 2.4)) + .2 * sin(vLp.z * 1.3 - uTime * 2.6);
          float film = uFilm * smoothstep(.4, .75, fn), fleck = uFilm * smoothstep(.62, .8, vnoise(vLp.xz * vec2(7., 2.2) + vec2(0., -uTime * 3.1))) * smoothstep(.45, .7, fn);
          alb = mix(alb * mix(1., .62, uFilm), seaAt(1., vWp.xz).rgb * .5 + .06, film * .22) + fleck * .1;
          // small crescents of cold light on the planks, always there (uCres: how many of the cells bear one; a
          // rare visit has more), each pulsing on its own beat. Their light answers the ambient light of the sea
          // the boat is in (the table's row 10 at this place): strongest where that is darkest.
          vec2 g = (vLp.xz + uDeck) / .42, c = floor(g), f = fract(g) - .5; float hsh = hash12(c + 5.);
          if (hsh > 1. - uCres * .6){ float a = hsh * 40.; vec2 d = vec2(cos(a), sin(a));
            float cr = smoothstep(.2, .17, length(f - d * .02)) * smoothstep(.15, .18, length(f - d * .1));
            float dark = 1. - smoothstep(.05, .22, dot(seaAt(10., vWp.xz).rgb, vec3(.3, .5, .2)));
            glowAdd += vec3(.48, .82, 1.) * cr * 3. * mix(.3, 1., dark) * (.55 + .45 * sin(uTime * 3. + hsh * 60.)); }
          // sea flowers on the planks, always there: dark lobed mouths 0.15 to 0.3 m across that open and close,
          // each on its own beat, yellow suckers in a ring at the mouth
          vec2 g2 = (vLp.xz + uDeck) / .62 + 11.3, c2 = floor(g2); float h2 = hash12(c2);
          if (h2 < .42){ vec2 d2 = fract(g2) - .5 - (hash22(c2 + 2.) - .5) * .5; float r2 = length(d2) * .62, th = atan(d2.y, d2.x);
            float opn = .55 + .45 * sin(uTime * (.5 + h2 * 2.) + h2 * 50.), R2 = (.075 + .075 * fract(h2 * 31.)) * (.62 + .38 * opn) * smoothstep(0., .2, .54 - h2);
            float lobes = R2 * (.74 + .26 * cos(th * 7. + h2 * 9.)), body = smoothstep(lobes, lobes * .8, r2);
            alb = mix(alb, vec3(.03, .02, .045), body * .93);
            float ring = smoothstep(.014, .004, abs(r2 - R2 * .36 * opn)) * smoothstep(.25, .45, abs(fract(th * 1.75 + h2) - .5));
            glowAdd += vec3(1., .72, .12) * ring * body * 1.3; }
        }` });
    const bowG = new THREE.Group(), bowMesh = new THREE.Mesh(bowGeometry(S.rope), bowMat); bowMesh.frustumCulled = false; bowG.add(bowMesh); scene.add(bowG);
    const tanV = new THREE.Vector3();
    // THE HULL'S ATTITUDE is a rule of the water under it. It lies on the rollers' ride (their slope under its length);
    // being light it answers the swell with HULL.lively times the swell's own slope, along (pitch) and across (roll);
    // its head falls off down the slope across it and slews on a roller's face (yaw); in the squall the wind off the
    // ice heels it to the lee; where the line stands above the sea it takes the line's own slope and its roll goes
    // to nought with the height: no sway begins there. Its head wanders a little (0.02 rad, slowly) at every height.
    const hullPh = [N.hull.range(0, 6.28), N.hull.range(0, 6.28), N.hull.sign()];
    const placeBow = (u, time) => {
      path.pointAt(u, eye); path.tangentAt(u, tanV);
      const hl = Math.hypot(tanV.x, tanV.z) || 1, fx_ = tanV.x / hl, fz = tanV.z / hl, rx = -fz, rz = fx_, s = -eye.z;
      const air = smoothstep(0.3, 2.5, eye.y - EYE - seas.rideAt(eye.x, eye.z));
      const R = (a, b) => seas.rideAt(eye.x + fx_ * a + rx * b, eye.z + fz * a + rz * b), W = (a, b) => seas.swellAt(eye.x + fx_ * a + rx * b, eye.z + fz * a + rz * b, time);
      const slopeR = (R(4.5, 0) - R(-7, 0)) / 11.5, slopeW = (W(4.5, 0) - W(-7, 0)) / 11.5, acrossW = (W(0, 2.2) - W(0, -2.2)) / 4.4;
      // (the squall's wind is where its rain is: the table's row 12 at the boat's place)
      const heel = 0.15 * seas.row(12, s, rowH)[0] * (1 + 0.25 * Math.sin(time * 1.1 + hullPh[0]));
      const pitch = Math.atan(slopeR) + Math.atan(HULL.lively * slopeW), roll = Math.atan(HULL.lively * acrossW) + is * heel;
      // (its yaw: what the water's slope under it gives, which goes with the height as the roll does; and a slow
      // wander of its own head, the boat's from the first metre to the last, at every height)
      const yaw = (-1.2 * HULL.lively * acrossW + 0.3 * slopeR * hullPh[2]) * (1 - air) + 0.02 * Math.sin(time * 0.23 + hullPh[1]);
      bowG.position.set(eye.x, lerp(R(0, 0) + W(0, 0), eye.y - EYE, air), eye.z);
      bowG.rotation.set(lerp(pitch, Math.asin(clamp(tanV.y, -1, 1)), air), Math.atan2(-tanV.x, -tanV.z) + yaw, roll * (1 - air), 'YXZ');
      sea.uniforms.uBoat.value.set(eye.x, eye.z, fx_, fz); sea.uniforms.uBoatK.value = 1 - air;
      return air;
    };
    await ctx.yield();

    // ---- SEA 1, the river mouth: two pile wharves, sheds, lantern posts, four moored barges
    const wl = V.wharfLong, wood = linear('#4a3c30'), woodD = linear('#2e2620'), roofC = linear('#26262c'), amber = linear('#ffb24a');
    const wb = makeBag(), lamps = [], wr = S.wharf;
    const wharf = (side, face, s0, s1) => {
      const xo = (d) => side * (face + d);
      for (let s = s0; s < s1 - 0.1; s += 8) { const e = Math.min(s + 8, s1); wb.kind = 1;
        wb.quad([xo(0), 5, -s], [xo(0), 5, -e], [xo(17), 5, -e], [xo(17), 5, -s], wood).quad([xo(17), 5, -s], [xo(17), 5, -e], [xo(0), 5, -e], [xo(0), 5, -s], wood);
        wb.box(xo(0.1), 4.45, -(s + e) / 2, 0.3, 0.55, e - s, woodD); }
      wb.kind = 0;
      for (let s = s0 + 1; s < s1; s += 3.3) for (const d of [0.4, 6, 12]) wb.cyl(xo(d + wr.range(-0.2, 0.2)), -1.5, -s, 0.3, 0.26, 6.5, 6, woodD, { lean: [wr.range(-0.2, 0.2), wr.range(-0.2, 0.2)] });
      wb.box(xo(0), -1.5, -(s0 - 0.2), 0.4, 6.4, 0.4, woodD).box(xo(8.5), -1.5, -(s0 - 0.2), 17, 6.4, 0.3, woodD).box(xo(8.5), -1.5, -(s1 + 0.2), 17, 6.4, 0.3, woodD);
      // sheds: each of its own width, depth, wall and ridge (ridge at most 14 m over the water)
      for (let s = s0 + wr.range(6, 12); s < s1 - 8;) {
        const w = wr.range(11, 19), d = wr.range(7.5, 10), wall = wr.range(3.6, 5.6), ridge = Math.min(wall + wr.range(2.2, 3.6), 9), cx = xo(6 + d / 2 + wr.range(0, 1.5)), col = [wood, woodD, linear('#3c342e')][wr.int(0, 2)];
        if (s + w > s1 - 2) break;
        wb.kind = 1; wb.box(cx, 5, -(s + w / 2), d, wall, w, col, { open: true });
        const x0 = cx - d / 2, x1 = cx + d / 2, y0 = 5 + wall, y1 = 5 + ridge, za = -s + 0.5, zb = -(s + w) - 0.5;
        wb.kind = 0; wb.quad([x0 - 0.5, y0, za], [x0 - 0.5, y0, zb], [cx, y1, zb], [cx, y1, za], roofC).quad([cx, y1, za], [cx, y1, zb], [x1 + 0.5, y0, zb], [x1 + 0.5, y0, za], roofC);
        wb.kind = 1; wb.tri([x0, y0, za + 0.5], [x1, y0, za + 0.5], [cx, y1, za + 0.5], col).tri([x1, y0, zb - 0.5 + 1], [x0, y0, zb - 0.5 + 1], [cx, y1, zb + 0.5], col);
        // a great door on the water side, sometimes a lit window
        wb.kind = 0; wb.box(cx - side * (d / 2 + 0.03), 5, -(s + w * wr.range(0.3, 0.7)), 0.12, wall * 0.78, w * 0.3, linear('#17130f'));
        if (wr() < 0.55) { wb.emit = 2.2; wb.box(cx - side * (d / 2 + 0.05), 5 + wall * 0.5, -(s + w * wr.range(0.08, 0.2)), 0.1, 0.9, 0.8, amber); wb.emit = 0; }
        s += w + wr.range(3, 9);
      }
      // crates, barrels, bollards along the face
      for (let s = s0 + 3; s < s1 - 2; s += wr.range(2.5, 7)) { const k = wr(), d = wr.range(1.2, 4.6);
        if (k < 0.45) { wb.kind = 1; const z = wr.range(0.8, 1.7); wb.box(xo(d), 5, -s, z, z * wr.range(0.7, 1.1), z, wr() < 0.5 ? wood : linear('#5c4a36'), { ry: wr.range(0, 1.5) }); }
        else if (k < 0.75) { wb.kind = 0; wb.cyl(xo(d), 5, -s, 0.42, 0.42, 1.1, 8, linear('#3a2c22'), { cap: true }); }
        else { wb.kind = 0; wb.cyl(xo(0.6), 5, -s, 0.22, 0.28, 0.6, 6, linear('#1c1c1e'), { cap: true }); } }
      // nine lantern posts, 7 m tall, in the water at the face
      for (let i = 0; i < 9; i++) { const s = lerp(s0 + 4, s1 - 4, i / 8) + wr.range(-1.2, 1.2), x = xo(-0.7), h = 7 + wr.range(-0.3, 0.3);
        wb.kind = 0; wb.cyl(x, -1.5, -s, 0.16, 0.12, h + 1.5, 6, woodD).box(x, h + 0.62, -s, 0.7, 0.1, 0.7, roofC);
        wb.emit = 4 * V.river.lamps; wb.box(x, h, -s, 0.44, 0.6, 0.44, amber); wb.emit = 0; lamps.push([x, h + 0.3, -s]); }
    };
    wharf(wl, 32, -40, 105); await ctx.yield(); wharf(-wl, 30, 15, 95);
    await ctx.yield();
    // the banks behind the wharves, ending at the bar, with the far roofs and lit windows of a river town
    const bank = (side, face) => {
      const x0 = side * (face + 17), far = side * 520, earth = linear('#221c1a');
      wb.kind = 0;
      for (let s = -300; s < P.bar - 2; s += 34) { const e = Math.min(s + 34, P.bar - 2), y = 3.4 + wr.range(-0.4, 0.6); wb.quad([Math.min(x0, far), y, -s], [Math.min(x0, far), y, -e], [Math.max(x0, far), y, -e], [Math.max(x0, far), y, -s], earth); wb.box(x0, -1.5, -(s + e) / 2, 0.6, y + 1.5, e - s, earth); }
      wb.box((x0 + far) / 2, -1.5, -(P.bar - 2), Math.abs(far - x0), 5, 0.6, earth);
      for (let i = 0; i < 9; i++) wb.box(x0 + side * wr.range(-3, 30), -1.2, -(P.bar + wr.range(-1, 9)), wr.range(2, 5), wr.range(1.5, 4.2), wr.range(2, 5), linear('#2a2624'), { ry: wr.range(0, 3), taper: 0.6 });
      for (let i = 0; i < 26; i++) {
        const d = wr.range(8, 190), s = wr.range(-280, P.bar - 20), w = wr.range(7, 16), h = wr.range(4, 11) * (1 + d / 400), x = x0 + side * d;
        wb.box(x, 3.2, -s, wr.range(7, 13), h, w, linear('#1e1a1c'), { open: true, taper: 0.82 });
        if (wr() < 0.6) { wb.emit = 2; wb.box(x - side * 4.4, 3.2 + h * wr.range(0.3, 0.6), -s + wr.range(-2, 2), 0.2, 0.8, 0.9, amber); wb.emit = 0; }
      }
    };
    bank(wl, 32); bank(-wl, 30);
    await ctx.yield();
    // four moored barges, each of its own length and load, 12 to 16 m off the line by their near side, and their mooring piles
    const barges = [], bgr = S.barges;
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1, Lb = bgr.range(16, 20), Bb = bgr.range(4.4, 5.4), s = 20 + i * 24 + bgr.range(-5, 5), off = bgr.range(12, 16) + Bb / 2, x = xAt(s) + side * off;
      const g = bargeGeometry(bgr, Lb, Bb), m = new THREE.Mesh(g.geometry, null); m.position.set(x, 0, -s); m.rotation.order = 'YXZ'; m.rotation.y = bgr.range(-0.12, 0.12) + (bgr() < 0.5 ? Math.PI : 0);
      barges.push({ m, ph: bgr.range(0, 6.28), x, z: -s, yaw: m.rotation.y, lamp: g.lamp });
      for (const e of [-1, 1]) wb.cyl(x + side * (Bb / 2 + 0.7), -1.5, -s + e * Lb * 0.36, 0.3, 0.24, 4.6 + bgr.range(0, 1), 6, woodD, { lean: [bgr.range(-0.2, 0.2), 0] });
      const c = Math.cos(m.rotation.y), sn = Math.sin(m.rotation.y); lamps.push([x + g.lamp[2] * sn, g.lamp[1], -s + g.lamp[2] * c]);
    }
    await ctx.yield();
    // lamp light baked on the timber round each lantern
    const warmAt = (x, y, z, nx, ny, nz) => { let w = 0; for (const l of lamps) { const dx = l[0] - x, dy = l[1] - y, dz = l[2] - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 < 900) w += Math.max(0.15, (dx * nx + dy * ny + dz * nz) / Math.sqrt(d2 + 1e-3)) * 1.3 / (1 + d2 / 16); } return Math.min(w, 1.6) * V.river.lamps; };
    const fixedMat = litMaterial(seas, { side: THREE.DoubleSide });
    while (wb.bake(warmAt, 1200)) await ctx.yield();
    await ctx.yield();
    const wharfMesh = new THREE.Mesh(wb.toGeometry(warmAt), fixedMat); wharfMesh.frustumCulled = false; scene.add(wharfMesh);
    for (const bg of barges) { bg.m.material = fixedMat; scene.add(bg.m); }
    await ctx.yield();
    // the lanterns' glows; their wavering roads on the brown water are the sea's own mirror of each lamp (the part's
    // sea shader), as far out as the river's water reaches (the bar's join)
    const lampGlow = fx.makeGlows({ positions: lamps, color: '#ffb24a', size: 3.4, intensity: 2.0 * V.river.lamps, flicker: 0.3, time: seas.uniforms.uTime, rng: S.lamps });
    scene.add(lampGlow.object);
    { const c = new THREE.Color('#ffa63c').multiplyScalar(1.5 * V.river.lamps); sea.uniforms.uLampC.value.set(c.r, c.g, c.b, P.bar + JOIN);
      lamps.slice(0, NLAMP).forEach((l, i) => sea.uniforms.uLampP.value[i].set(l[0], l[1], l[2], 1)); }
    await ctx.yield();
    // ---- THE REEF OF THE BAR, on the hand V.reefSide, from the first roller's foot to the last roller's foot. A front
    // rank of rocks, one every 9 to 15 m of the bar, each with its near edge REEF.near to REEF.far m from the line
    // (tested every 2 m of route); more behind them out to REEF.back m, larger the farther off. Weed hangs from the
    // front rocks to the water; the timbers of a wreck lie among them. The rollers break along all of that hand.
    // (rock: beds that dip a little along the voyage, cracks, a dark wet foot)
    const rockMat = litMaterial(seas, { side: THREE.DoubleSide, wet: 0.7, lamp: '#' + new THREE.Color().setRGB(V.river.astern[0], V.river.astern[1], V.river.astern[2]).getHexString(),
      frag: /* glsl */`{ float along = vWp.z + vWp.x * .3, beds = vnoise(vec2(along * .035, vWp.y * .75 + along * .05)) * .5 + vnoise(vec2(along * .16, vWp.y * 2.4)) * .3 + vnoise(vWp.xz * .9 + vWp.y * .3) * .2;
          alb *= .55 + .9 * beds; alb *= mix(vec3(.5, .62, .55), vec3(1.), smoothstep(-.5, 1.6, vWp.y)); }` });
    // the light from astern (the river's own low sky) on every face turned to it, and a little on every face that is not turned from it
    const asternLit = (x, y, z, nx, ny, nz) => 1.5 * Math.max(0, 0.3 * ny + 0.95 * nz + 0.22);
    const ICO = new THREE.IcosahedronGeometry(1, 1).getAttribute('position').array;
    // one rock: a lump of 80 flat faces, its own outline from the noise; cols = [low (weed line), body, top]
    const lump = (b, cx, cy, cz, rx, ry, rz, sd, cols, turn = 0) => {
      const c = Math.cos(turn), s = Math.sin(turn), V3 = (k) => {
        const px = ICO[k], py = ICO[k + 1], pz = ICO[k + 2], nz = 0.62 + 0.75 * ctx.noise.fbm3(px * 1.4 + sd, py * 1.4, pz * 1.4 - sd, 3), up = py > 0 ? Math.pow(py, 0.75) : py * 0.5;
        const lx = px * rx * nz, lz = pz * rz * nz; return [cx + lx * c + lz * s, cy + up * ry * nz, cz - lx * s + lz * c]; };
      for (let k = 0; k < ICO.length; k += 9) { const p = V3(k), q = V3(k + 3), r = V3(k + 6), t = clamp(((p[1] + q[1] + r[1]) / 3 - cy) / Math.max(ry, 0.1), 0, 1);
        b.tri(p, q, r, t < 0.22 ? cols[0] : t < 0.7 ? mix3c(cols[1], cols[2], (t - 0.22) * 0.8) : cols[2]); }
    };
    const mix3c = (a, c, t) => [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)];
    const reefS0 = P.bar, reefS1 = P.crest[2] + 35, rs = V.reefSide, reefRocks = [], reefFront = [];
    {
      const rr = N.reef, b = makeBag(), basalt = [linear('#1c2a1c'), linear('#34363c'), linear('#6a665c')], kelp = [linear('#3c4a1a'), linear('#5a4f1e'), linear('#2a3a16')];
      const put = (s, off, R) => { const x = xAt(s) + rs * off, z = -s; if (nearLine(x, z) - R < REEF.near) return null; const k = { x, z, s, R, H: R * rr.range(0.55, 1.1), sd: rr.range(0, 90) }; reefRocks.push(k); return k; };
      for (let s = reefS0 + rr.range(0, 8); s < reefS1; s += rr.range(9, 15)) { const R = rr.range(3, 6.5), k = put(s, rr.range(REEF.near, REEF.far) + R + 1, R); if (k) reefFront.push(k); }
      for (let i = 0; i < 30; i++) { const t = rr(), R = lerp(4, 11, t) * rr.range(0.7, 1.2); put(rr.range(reefS0 - 6, reefS1 + 14), lerp(REEF.far, REEF.back, t) + R + rr.range(0, 12), R); }
      { let c = 0; for (const k of reefRocks) { lump(b, k.x, -1.2, k.z, k.R, k.H + 1.2, k.R * rr.range(0.7, 1.1), k.sd, basalt, rr.range(0, 3)); if (++c % 12 === 0) await ctx.yield(); } }
      await ctx.yield();
      // weed: three to five ribbons from each front rock's shoulder down into the water, on the side toward the line
      for (const k of reefFront) for (let i = 0, n = rr.int(3, 5); i < n; i++) {
        const a = Math.PI * (rs > 0 ? 1 : 0) + rr.range(-1.2, 1.2), ca = Math.cos(a), sa = Math.sin(a), w = rr.range(0.35, 0.8), col = kelp[i % 3];
        const p0 = [k.x + ca * k.R * 0.35, k.H * 0.75, k.z + sa * k.R * 0.35], p1 = [k.x + ca * k.R * 0.8, k.H * 0.3, k.z + sa * k.R * 0.8], p2 = [k.x + ca * (k.R + 1.2), -0.6, k.z + sa * (k.R + 1.2)];
        b.quad([p0[0] + sa * w, p0[1], p0[2] - ca * w], [p0[0] - sa * w, p0[1], p0[2] + ca * w], [p1[0] - sa * w, p1[1], p1[2] + ca * w], [p1[0] + sa * w, p1[1], p1[2] - ca * w], col);
        b.quad([p1[0] + sa * w, p1[1], p1[2] - ca * w], [p1[0] - sa * w, p1[1], p1[2] + ca * w], [p2[0] - sa * w * 0.6, p2[1], p2[2] + ca * w * 0.6], [p2[0] + sa * w * 0.6, p2[1], p2[2] - ca * w * 0.6], col);
      }
      // the wreck's timbers: between two front rocks a keel baulk lying aslant, a row of curved ribs standing from it,
      // loose planks; two such, each where its middle is REEF.near + 4 m or more from the line
      const grey = linear('#6e665a'), greyD = linear('#4a443c');
      for (let w = 0, tries = 0; w < 2 && tries < 20; tries++) {
        const s = lerp(reefS0 + 15, reefS1 - 15, (w + rr.range(0.2, 0.8)) / 2), x = xAt(s) + rs * rr.range(REEF.near + 9, REEF.far + 4), yaw = rr.range(-0.5, 0.5), len = rr.range(8, 12), cy = Math.cos(yaw), sy = Math.sin(yaw);
        if (nearLine(x, -s) < REEF.near + 4) continue;
        b.kind = 1; b.box(x, 0.3, -s, 0.5, 0.55, len, greyD, { ry: yaw });
        for (let i = 0, n = rr.int(5, 7); i < n; i++) { const f = (i + 0.5) / n - 0.5, bx = x + sy * f * len, bz = -s + cy * f * len, h = rr.range(2.6, 4.4) * (1 - 1.2 * f * f), sd = rr() < 0.7 ? rs : -rs;
          for (let q = 0; q < 4; q++) { const t0 = q / 4, t1 = (q + 1) / 4, o0 = 1.9 * Math.sin(t0 * 1.9) * sd, o1 = 1.9 * Math.sin(t1 * 1.9) * sd;
            b.cyl(bx + cy * o0, 0.5 + h * t0, bz - sy * o0, 0.16, 0.14, h / 4 + 0.05, 4, q % 2 ? grey : greyD, { lean: [cy * (o1 - o0), -sy * (o1 - o0)] }); } }
        for (let i = 0; i < 3; i++) b.box(x + rr.range(-4, 4), rr.range(0.1, 0.9), -s + rr.range(-5, 5), 0.34, 0.1, rr.range(2.5, 4.5), grey, { ry: rr.range(0, 3) });
        b.kind = 0; w++;
      }
      while (b.bake(asternLit, 1200)) await ctx.yield();
      await ctx.yield();
      const m = new THREE.Mesh(b.toGeometry(asternLit), rockMat); m.frustumCulled = false; scene.add(m);
      sea.uniforms.uReef.value.set(xAt((reefS0 + reefS1) / 2) + rs * (REEF.near + 14), rs);
    }
    await ctx.yield();
    // the rollers burst on every front rock: a tower of spray thrown 8 to 16 m up from the rock's side toward the
    // line, on the rock's own beat (the clock; a tower reads at any phase: rising, standing or falling), carried by
    // the wind off the reef 2.5 to 4.5 m/s across the line. Each tower is 44 puffs thrown one after another.
    // SPRAY IS A MEDIUM WE PASS THROUGH: a puff's place is the world's (its tower's site or its crest, its throw and
    // the wind), and the line may cross it. THE MEDIUM'S NEAR LAW: its opacity falls with the true distance of each
    // drawn point of it from the lens, from whole at 2.5 m to nothing at 0.6 m, with no step; it reads nothing else.
    // aS = (site x, site z, beat s, phase), aV = (velocity across, up, along m/s, its turn in the beat), aK = (size m, growth, seed, _)
    {
      const rr = N.reef, NP = 44, n = (reefFront.length * NP + 3 * 2 * 20 * 5) * 4, aS = new Float32Array(n), aV = new Float32Array(n), aK = new Float32Array(n), GRAV = 6; let k = 0;
      for (const r of reefFront) {
        const tall = rr.range(8, 16), vy = Math.sqrt(2 * GRAV * tall), beat = 2 * vy / GRAV + rr.range(0.4, 1.4), ph = rr(), wind = -rs * rr.range(2.5, 4.5), sx = r.x - rs * r.R * 0.7;
        for (let i = 0; i < NP; i++, k += 4) { const q = rr();
          aS.set([sx + rr.range(-1.5, 1.5), r.z + rr.range(-2.5, 2.5), beat, ph], k); aV.set([wind + rr.range(-1.2, 1.2), vy * (0.45 + 0.55 * Math.sqrt(q)), rr.range(-1.5, 1.5), rr.range(0, 0.22)], k); aK.set([rr.range(0.9, 1.7), rr.range(1.5, 3.2), rr.range(0, 50), 0], k); }
      }
      // and spindrift flies from the lip of every roller: along each crest line, every 5 to 8 m out to 90 m either
      // side, puffs thrown 1 to 3 m up and carried down the lee by the river's run and across by the reef's wind
      for (const c of P.crest) for (const sd of [-1, 1]) for (let o = rr.range(1, 5); o < 90; o += rr.range(5, 8)) {
        const x = xAt(c) + sd * o, z = -(c - seas.wander(x)), tall = rr.range(1, 3), vy = Math.sqrt(2 * GRAV * tall), beat = 2 * vy / GRAV + rr.range(0.2, 1.2), ph = rr();
        for (let i = 0; i < 5; i++, k += 4) { aS.set([x + rr.range(-2, 2), z + rr.range(-0.6, 0.6), beat, ph], k); aV.set([-rs * rr.range(1, 3), vy * rr.range(0.6, 1), -rr.range(2, 5), rr.range(0, 0.5)], k); aK.set([rr.range(0.5, 1), rr.range(1.2, 2.4), rr.range(0, 50), 0], k); }
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(aV, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(aK, 4)); g.instanceCount = k / 4;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: seas.uniforms, side: THREE.DoubleSide,
        vertexShader: GLSL_SEAS + GLSL_FLOAT + /* glsl */`attribute vec4 aS; attribute vec4 aV; attribute vec4 aK; varying vec2 vUv; varying vec3 vWp; varying vec3 vD; varying vec3 vEye;
          void main(){
            float t = fract(uTime / aS.z + aS.w - aV.w) * aS.z, fall = 2. * aV.y / ${GRAV.toFixed(1)}, a = clamp(t / fall, 0., 1.);
            vec3 c = vec3(aS.x + aV.x * t, surfaceH(aS.xy) - .3 + aV.y * t - ${(GRAV / 2).toFixed(1)} * t * t, aS.y + aV.z * t);
            float size = aK.x * (1. + aK.y * a) * step(t, fall);
            vec4 mv = viewMatrix * vec4(c, 1.); mv.xy += position.xy * size;
            vUv = position.xy; vWp = c; vD = vec3(a, aK.z, 0.); vEye = mv.xyz; gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: fx.GLSL_NOISE + GLSL_SEAS + /* glsl */`varying vec2 vUv; varying vec3 vWp; varying vec3 vD; varying vec3 vEye;
          void main(){
            float r2 = dot(vUv, vUv), n = fbm(vUv * 1.7 + vD.y + vec2(0., vD.x * 2.));
            float al = (1. - r2) * smoothstep(0., .06, vD.x) * (1. - smoothstep(.55, 1., vD.x)) * smoothstep(.25, .7, n + .3 - r2 * .3);
            // (the medium's near law: thinner from 2.5 m of the lens, nothing at 0.6 m)
            al *= smoothstep(.6, 2.5, length(vEye));
            if (al < hash12(gl_FragCoord.xy + vD.y) * .92 + .05) discard;
            vec3 col = seaLight(normalize(vec3(vUv.x * .5, .8, .4)), vWp, vec3(.9, .95, .96), .8) * (.75 + .5 * n);
            gl_FragColor = vec4(seaFog(col, vWp, 0.), 1.);
          }` }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---- THE CLIFFS OF THE BAR. Behind the reef a cliff 25 to 50 m tall stands 92 to 104 m off the axis, from where
    // the river's bank ends to 40 m beyond the last roller's foot, where it swings away and falls to the water; on
    // the other hand a lower head (10 to 18 m) ends abeam of the first crest. A cliff is a run of buttresses, each
    // edge with its own set-back and height, so its face is faceted and its skyline broken; it leans back in three lifts.
    const cliffWall = (b, q, o) => {
      // (its height runs in long swells along its length, with a small step from edge to edge and a notch now and then)
      const ph = q.range(0, 6.28), edges = []; for (let s = o.s0; s < o.s1 + 0.1;) { const t = (s - o.s0) / (o.s1 - o.s0), end = smoothstep(0, o.rise / (o.s1 - o.s0), t) * (1 - smoothstep(1 - o.fall / (o.s1 - o.s0), 1, t));
        edges.push({ s, off: o.off + q.range(-6, 6) + o.swing * Math.pow(smoothstep(1 - o.fall / (o.s1 - o.s0), 1, t), 2), top: Math.max(2.5, lerp(o.lo, o.hi, clamp(0.5 + 0.38 * Math.sin(s * 0.045 + ph) + 0.2 * Math.sin(s * 0.11 + ph * 2) + q.range(-0.08, 0.08), 0, 1)) * end), notch: q() < 0.18 }); s += q.range(7, 13); }
      const foot = linear('#2c2a2c'), mid = linear('#57463a'), band = linear('#8a6c4c'), turf = linear('#4a5a38'), X = (off) => o.side * off;
      for (let i = 0; i < edges.length - 1; i++) {
        const a = edges[i], c = edges[i + 1], dip = a.notch ? 0.72 : 1, ys = [0.34, 0.72, 1], back = [0, q.range(1, 3.5), q.range(4, 8)], cols = [foot, mid, band];
        let pa = [X(a.off), -2, -a.s], pc = [X(c.off), -2, -c.s];
        for (let k = 0; k < 3; k++) { const na = [X(a.off + back[k]), a.top * ys[k] * dip, -a.s], nc = [X(c.off + back[k]), c.top * ys[k] * dip, -c.s];
          if (o.side > 0) b.quad(pa, pc, nc, na, cols[k]); else b.quad(pc, pa, na, nc, cols[k]); pa = na; pc = nc; }
        // the top: turf rising a little inland, then falling away
        const ta = [X(a.off + back[2] + 30), a.top * dip + 5, -a.s], tc = [X(c.off + back[2] + 30), c.top * dip + 5, -c.s], fa = [X(a.off + 420), 4, -a.s], fc = [X(c.off + 420), 4, -c.s];
        if (o.side > 0) b.quad(pa, pc, tc, ta, band).quad(ta, tc, fc, fa, turf); else b.quad(pc, pa, ta, tc, band).quad(tc, ta, fa, fc, turf);
      }
      // its two ends: closed by a face across the voyage, so nothing is seen through it from astern or from ahead
      for (const e of [edges[0], edges[edges.length - 1]]) b.quad([X(e.off), -2, -e.s], [X(e.off + 420), -2, -e.s], [X(e.off + 420), 4, -e.s], [X(e.off + 8), e.top, -e.s], mid);
    };
    // the flowered islet beyond the last roller, on the hand away from the reef: abeam of the milk sea's middle, its
    // near shore 45 to 60 m from the line
    const islet = { R: N.islet.range(13, 18), H: N.islet.range(6, 9), s: (P.milk + P.green) / 2 + N.islet.range(-8, 8) }; islet.x = xAt(islet.s) - rs * (N.islet.range(45, 60) + islet.R); islet.z = -islet.s;
    {
      const b = makeBag(), q = N.cliffs, end = reefS1 + 40;
      cliffWall(b, q, { side: rs, s0: P.bar - 4, s1: end, off: 98, lo: 25, hi: 50, rise: 30, fall: 70, swing: 150 });
      await ctx.yield();
      cliffWall(b, q, { side: -rs, s0: P.bar - 4, s1: P.crest[0] + 34, off: 88, lo: 10, hi: 18, rise: 20, fall: 30, swing: 40 });
      const iq = N.islet, rock = [linear('#1c2a1c'), linear('#3a3438'), linear('#6c5c50')];
      lump(b, islet.x, -1.5, islet.z, islet.R, islet.H + 1.5, islet.R * iq.range(0.75, 1), iq.range(0, 90), rock, iq.range(0, 3));
      for (let i = 0, n = iq.int(3, 5); i < n; i++) { const a = iq.range(0, 6.28), d = islet.R * iq.range(0.9, 1.5), R = iq.range(2, 4.5); lump(b, islet.x + Math.cos(a) * d, -1, islet.z + Math.sin(a) * d, R, R * iq.range(0.5, 1) + 1, R, iq.range(0, 90), rock, iq.range(0, 3)); }
      while (b.bake(asternLit, 1200)) await ctx.yield();
      await ctx.yield();
      const m = new THREE.Mesh(b.toGeometry(asternLit), rockMat); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---- THE SQUALL AND THE RED WALL ARE WEATHER: air of the table, by world place, the same for whoever is there.
    // The squall is its depth of dark air from WX.squall (where the ice sea's air ends) to the red wall's near face
    // (WX.near); the red wall is its depth of red air from that face to where the blue sea's air begins (WX.end),
    // so deep that an eye in it sees nothing but the wall (the part: RED_DEPTH, redAir).
    // ONE BACKSTOP stands in the red air, across the voyage at the middle of the wall's thickness (WX.back), from the
    // water to the ceiling. Every thing of this world takes the weather's fog exactly, but fog is one flat colour
    // and the wall's face is a cloud with a pattern: a thing beyond the wall would stand on that pattern as a flat
    // shape. So the backstop closes the view of what lies beyond the wall's middle (more than four depths of red
    // air beyond it). What a ray shows on it is found from THE DEPTH OF EACH WEATHER ALONG THAT RAY, on the table's
    // summed fog, and from nothing else:
    //   the red wall's cloud, by the depth of red air along the ray (the part's redAir: the same law the sky takes
    //   for an eye inside the wall, so the backstop is crossed unseen: before it and beyond it a ray shows the same);
    //   over it the squall's slate cloud, by the depth of squall air along the ray before the wall's near face;
    //   over all the ordinary air before the squall, as it fogs any thing.
    // So from the ice sea the squall stands as a dark bank; in the squall the red wall stands ahead through the
    // rain with its lichens of sun; inside the wall its air is all round, with the lichens in its near half; from
    // its middle on the air is plain red, and the sea beyond comes clear as that air thins by place. Nothing here
    // reads how far the eye is from anything: no rent opens, nothing tears or fades by range; cloud, gold cells
    // and blue smears keep one size and one strength in world metres.
    const WX = { squall: P.squall - JOIN, near: P.wall0, back: (P.wall0 + P.wall1) / 2, end: P.wall1 + JOIN, top: 170 };
    skyU.uWall.value = P.wall1; skyU.uRed.value.set(WX.near, WX.back, WX.end, WX.top); skyU.uWallOff.value.set(S.wall.range(0, 60), S.wall.range(0, 60));
    // (the red air's folds take the visit's place in the wall's own pattern: the same two numbers, no draw more)
    seas.uniforms.uFold.value.copy(skyU.uWallOff.value);
    // THE SHEETS THE RED AIR'S FOLDS ARE READ ON (the part's redFold) stand at places of the table's own red air:
    // WX.fold0 and WX.fold1 are the first and the last half metre of the voyage where the table's air is a tenth of
    // a depth to the metre or more (the fold's own least air: under it the folds are nothing). The upright sheet
    // stands across the voyage at WX.fold1, where the red air ends; the level sheet lies RED_HIGH m over the mean
    // sea (four times the eye's own height: low enough to stand in the bow's sight through the wall) between the two.
    { const tr = [0, 0, 0, 0], RED_HIGH = 12; WX.fold0 = WX.near; WX.fold1 = WX.end;
      while (WX.fold0 > WX.squall && seas.row(6, WX.fold0 - 0.5, tr)[3] >= 0.09) WX.fold0 -= 0.5;
      while (WX.fold1 > WX.back && seas.row(6, WX.fold1, tr)[3] < 0.09) WX.fold1 -= 0.5;
      seas.uniforms.uSheet.value.set((WX.fold0 + WX.fold1) / 2, (WX.fold1 - WX.fold0) / 2, WX.fold1, RED_HIGH); WX.airA = [0, 0, 0, 0]; WX.airB = [0, 0, 0, 0]; }
    const wallMat = new THREE.ShaderMaterial({ uniforms: { ...seas.uniforms, ...skyU, uBolt: { value: new THREE.Vector2(0, 0) }, uSq: { value: new THREE.Vector2(WX.squall, WX.near) } }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec3 vWp; void main(){ vWp = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
      fragmentShader: fx.GLSL_NOISE + GLSL_SEAS + GLSL_SKY + GLSL_REDAIR + /* glsl */`uniform mat4 projectionMatrix; uniform vec2 uBolt; uniform vec2 uSq; varying vec3 vWp;
        void main(){
          vec3 dir = normalize(vWp - cameraPosition);
          // THE BACKSTOP HIDES ONLY WHAT STANDS MORE THAN FOUR DEPTHS OF THE RED AIR BEYOND IT (4 x RED_DEPTH m
          // along the ray): its depth in the picture is that of the place so much farther along the ray. What is
          // nearer than that stands in its own fog, exact through any weather: the sea, and the boat we ride with
          // the birds of its rail, which reach the wall's middle before the eye does and are never cut by a plane.
          vec4 cp = projectionMatrix * viewMatrix * vec4(vWp + dir * ${(4 * RED_DEPTH).toFixed(1)}, 1.);
          gl_FragDepth = clamp(cp.z / cp.w * .5 + .5, 0., 1.);
          // metres of ray to a metre of voyage; the eye's voyage metre; is the eye before the backstop
          float k = 1. / max(abs(dir.z), .02), se = -cameraPosition.z, front = step(se, uRed.y);
          // (behind the wall's cloud the sky as the dome shows it from here; the squall's own cloud is the sky
          // closed at the squall's middle: the part's skyColR)
          vec3 sky = skyCol(dir, cameraPosition, 0.), skyc = skyColR(dir, cameraPosition, 0., 0.);
          vec4 ra = redAir(cameraPosition, dir);
          vec3 col = mix(sky, ra.rgb, ra.a);
          // the squall's slate cloud with shafts of rain, paler where it meets the sea: the closed sky's colour in
          // that direction folded lighter and darker; a stroke lights its folds, most within some 25 m of its own place;
          // the small white sun of the ice sea stands in it as a pale disc in haze, by what the air between the eye
          // and that sun's own sea leaves of it (the part's sunSeen: whole from the ice sea, less by the squall's
          // own air from inside it). ITS MOCK SUNS LIE ON THE CLOUD BY THE SKY'S ONE LAW, LAID ONCE: they come with
          // the closed sky's colour the cloud is made of (skyColR lays them by the part's mockOn: a patch is never
          // more than as bright again as the air it lies on) and take the cloud's folds with it, so a patch follows
          // the cloud's own lightness at its place; the cloud adds no patch of its own. The cloud's share is
          // the depth of squall air along the ray between the eye and the wall's near face; its top stands 300 m up.
          float tauS = front * max(seaRowS(9., uSq.y).a - seaRowS(9., clamp(se, uSq.x, uSq.y)).a, 0.) * k;
          float rag = fbmLo(vec2(vWp.x * .012, uTime * .02)) * 46., ownS = smoothstep(300., 180., vWp.y + rag);
          float c3 = fbm(vec2(vWp.x * .012 + uTime * .012, vWp.y * .022) + uWallOff), streak = vnoise(vec2(vWp.x * .22 + vWp.y * .05, vWp.y * .012 - uTime * .6));
          float fold = smoothstep(.35, .8, c3);
          vec3 sq = skyc * mix(.8, 1.5, c3) * (.8 + .4 * streak) + seaRowS(5., uSquall.x).rgb * .5 * smoothstep(20., 0., vWp.y);
          sq += vec3(.7, .8, 1.2) * uFlash * fold * .3 + vec3(1.5, 1.8, 2.7) * uBolt.y * exp(-min(abs(vWp.x - uBolt.x) / 25., 20.)) * (.06 + fold * .9);
          float cb = clamp(dot(dir, uSunB.xyz), 0., 1.);
          sq += sunSeen(uSunB, uSunSea.zw, se) * (vec3(2.2, 2.3, 2.5) * smoothstep(.99982, .99992, cb) + vec3(.5, .52, .58) * pow(cb, 220.) + vec3(.1, .11, .13) * pow(cb, 24.));
          col = mix(col, sq, ownS * (1. - exp(-tauS)));
          // the ordinary air between the eye and the weather's edge (before the squall, or beyond the wall's end):
          // by its depth along the ray the weather goes into THE SKY'S OWN COLOUR in that direction (what stands
          // in the sky far off is lost in the sky, not in a flat colour: from the far seas the bank is the sky)
          float tE = mix(max(se - uRed.z, 0.), max(uSq.x - se, 0.), front) * k;
          gl_FragColor = vec4(mix(sky, col, exp(-seaDepth(cameraPosition + dir * tE))), 1.);
        }` });
    const redWall = new THREE.Mesh(new THREE.PlaneGeometry(4800, CEIL + 3, 48, 1).translate(0, (CEIL + 3) / 2 - 3, -WX.back), wallMat); redWall.frustumCulled = false; scene.add(redWall);
    // THE DOOR'S LIGHT TAKES THE WEATHER LIKE EVERY OTHER LIGHT. The engine draws the ring at the voyage's end and
    // its halo without fog; so the world lays the weather over them: a disc just before the ring (the ring and
    // the bright of its halo: full to 12 m from its middle, none at 2.6 radii) painted with the air between the eye
    // and the ring by the law that fogs a light (the part's seaFog with a whole hold: nothing up to one depth, all
    // of it from three: the disc is WHOLE from three depths, for the ring is so bright that the hundredth part a
    // plain fog leaves of a thing at four or five depths still stood as a small pale ring at the sea-line through
    // the wall's far half). In the blue sea and beyond there is no such depth along the way and the disc is clear.
    const DOOR = 9;
    {
      const veil = new THREE.Mesh(new THREE.CircleGeometry(2.6 * DOOR, 32), new THREE.ShaderMaterial({ uniforms: seas.uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`varying vec3 vWp; varying vec2 vL; void main(){ vL = position.xy; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: GLSL_SEAS + /* glsl */`varying vec3 vWp; varying vec2 vL;
          void main(){
            float tau = seaDepth(vWp), a = smoothstep(1., 3., tau) * smoothstep(${(2.6 * DOOR).toFixed(1)}, 12., length(vL));
            if (a < .003) discard;
            gl_FragColor = vec4(seaFogCol(vWp, tau), a);
          }` }));
      { const pe = path.pointAt(1, new THREE.Vector3()); veil.position.set(pe.x, pe.y, pe.z + 0.6); } veil.renderOrder = 8; veil.frustumCulled = false; scene.add(veil);
    }
    // lightning on a seeded schedule that repeats every LOOP s, DEALT ROUND THE LOOP: the gaps between strokes are
    // drawn (lo..hi s) until they fill the loop, scaled so that they sum to it exactly (by 0.92 at the least: never
    // two strokes within 0.55 s), and the first stroke stands at a seeded phase of the loop; so the gap across the
    // loop's end is a gap like any other and no value of the clock is always dark. Each stroke is eased up in 0.1 s
    // and down in 0.35 s, stands at its own place across the voyage and is of one of five shapes.
    // out = (place across, the stroke's own strength, which shape); returns the flash's strength.
    const NSHAPE = 5, LOOP = 20;
    const schedule = (q, lo, hi, half) => {
      const gaps = []; let sum = 0; while (sum < LOOP) { const g = q.range(lo, hi); gaps.push(g); sum += g; }
      const st = []; let t = q() * LOOP; for (const g of gaps) { st.push([t % LOOP, q.range(-half, half), st.length % NSHAPE]); t += g * LOOP / sum; }
      return (time, out) => { const tt = time % LOOP; let f = 0, bx = 0, bf = 0, bv = 0;
        for (const [t0, x, v] of st) { const dt_ = (tt - t0 + LOOP) % LOOP; if (dt_ > 0 && dt_ < 0.6) { const p = smoothstep(0, 0.1, dt_) * (1 - smoothstep(0.1, 0.45, dt_)); if (p > f) { f = p; bx = x; bv = v; } bf = Math.max(bf, smoothstep(0, 0.06, dt_) * (1 - smoothstep(0.08, 0.3, dt_))); } }
        out.set(bx, bf, bv); return f; };
    };
    // the squall's strokes come 0.55 to 1.7 s apart (any three and a half seconds of the clock hold two, the loop's
    // end like any other); the far lightning, 1.0 to 3.2 s apart.
    // THE FAR LIGHTNING HAS A PLACE OF ITS OWN, OFF THE LINE: over the open sea on the hand away from the flower
    // coast, abeam of where the green night's own water begins (FARL.s), its strokes dealt FARL.half m either way
    // across the voyage about a middle that stands off the line by FARL.clear m, that half and the widest reach of
    // the dealt strokes' shapes as drawn: NO PART OF ANY STROKE COMES WITHIN FARL.clear m OF THE LINE, on any
    // seed. It flashes on the clock for whoever is anywhere, at one strength, and is seen as far as the air
    // between lets it be (a stroke's light takes the table's summed weather along the ray).
    const FARL = { s: P.green + JOIN, clear: 200, half: 150, scale: 1.5 };
    // THE SQUALL'S STROKES KEEP A CLEAR WIDTH FROM THE LINE AS WELL, in both their planes (the far lightning's rule,
    // by place): NO PART OF ANY STROKE AS DRAWN, trunk or branch, the ribbon's whole width, in the near plane or in
    // the mirrored quarter copy before the red wall, STANDS WITHIN SQUALL.clear m OF THE LINE, on any seed, at any
    // clock. It is laid in build from the shapes as drawn and the route's own places (where the planes are made,
    // below): for each shape, the spans of place across in which some part of it would stand in that width
    // (squallLane). A stroke's dealt number is its place across unless it lies in such a span of its shape; then the
    // stroke stands as far OUTSIDE that span's nearer end as its number lies inside it (squallAt), so strokes dealt
    // apart stand apart and none stands on the end itself; where that place lies in another span of the shape the
    // same step is taken from it again, once for each span the shape has at the most, and a number still inside
    // a span after that stands on the end it was last carried over. No draw of any stream is added or changed and
    // no stroke's time, strength or shape; what a stroke lights follows its place as before.
    // SQUALL.clear, 12 m: four widths of a stroke's trunk, which is a ribbon 3 m wide that glows brighter than
    // white: at that width a lit stroke stands beside the way as a thing of the squall and is never a glare on it.
    const SQUALL = { clear: 12 }, squallLane = [];
    const squallIn = (x, ln) => { for (let i = 0; i < ln.length; i++) if (x > ln[i][0] && x < ln[i][1]) return i; return -1; };
    const squallAt = (x, v) => { const ln = squallLane[v]; let e = x;
      for (let n = 0; n < ln.length; n++) { const i = squallIn(x, ln); if (i < 0) return x; e = x - ln[i][0] < ln[i][1] - x ? ln[i][0] : ln[i][1]; x = 2 * e - x; }
      return squallIn(x, ln) < 0 ? x : e; };
    const flashAt = schedule(S.squall, 0.6, 1.7, 150), farAt = schedule(N.bolts, 1.2, 3.2, FARL.half);
    // the strokes themselves: branched ribbons in a plane across the voyage, five shapes, one shown at a time
    const boltU = { uB: { value: new THREE.Vector3() } }, farU = { uB: { value: new THREE.Vector3() } }, farS = FARL.s; let farX = 0;
    {
      const br = N.bolts, pos = [], dat = [], idx = [];
      const stroke = (v, x0, y0, x1, y1, w, depth) => {
        let pts = [[x0, y0], [x1, y1]];
        for (let lv = 0, amp = Math.hypot(x1 - x0, y1 - y0) * 0.16; lv < 4; lv++, amp *= 0.5) { const nx = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; nx.push([(a[0] + b[0]) / 2 + br.range(-amp, amp), (a[1] + b[1]) / 2 + br.range(-amp, amp) * 0.3], b); } pts = nx; }
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w, base = pos.length / 3;
          pos.push(a[0] - nx, a[1] - ny, 0, a[0] + nx, a[1] + ny, 0, b[0] + nx, b[1] + ny, 0, b[0] - nx, b[1] - ny, 0);
          for (const c of [-1, 1, 1, -1]) dat.push(c, v);
          idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
          // a branch leaves the stroke now and then, downward and aside, thinner
          if (depth < 2 && a[1] > 30 && br() < (depth ? 0.08 : 0.2)) { const len = br.range(30, 90) / (depth + 1), ang = br.sign() * br.range(0.4, 1.1); stroke(v, a[0], a[1], a[0] + Math.sin(ang) * len, Math.max(a[1] - Math.cos(ang) * len, 2), w * 0.55, depth + 1); }
        }
      };
      for (let v = 0; v < NSHAPE; v++) stroke(v, br.range(-25, 25), 270, br.range(-40, 40), 0, 1.5, 0);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(dat, 2)); g.setIndex(idx);
      // A STROKE TAKES ITS STRENGTH AT ITS OWN PLACE AND THE WEATHER BETWEEN THE EYE AND ITSELF: uK is the table's
      // lightning row at the stroke's own voyage metre (whole for the far lightning, which is no part of the squall);
      // each point of the ribbon keeps of its light what the summed fog along the ray to it leaves (the part's seaDim)
      const boltMat = (U, k) => new THREE.ShaderMaterial({ uniforms: { ...seas.uniforms, uB: U.uB, uK: { value: k } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: GLSL_SEAS + /* glsl */`attribute vec2 aB; uniform vec3 uB; uniform float uK; varying float vC; varying float vK;
          void main(){ vC = aB.x; float on = uB.y * uK * (1. - step(.5, abs(aB.y - uB.z))); vec4 wp = modelMatrix * vec4(position, 1.); wp.x += uB.x;
            vK = on * seaDim(wp.xyz, .3);
            gl_Position = on > .001 ? projectionMatrix * viewMatrix * wp : vec4(0., 0., 2., 1.); }`,
        fragmentShader: /* glsl */`varying float vC; varying float vK; void main(){ float c = clamp(vC, -1., 1.); gl_FragColor = vec4(vec3(2.6, 3., 4.2) * exp(-c * c * 4.) * vK, 1.); }` });
      const boltRow = (sv) => seas.row(11, sv, [0, 0, 0, 0])[3];
      const near = new THREE.Mesh(g, boltMat(boltU, boltRow(P.squall - 2))); near.position.set(0, 0, -(P.squall - 2)); near.frustumCulled = false; near.renderOrder = 4; scene.add(near);
      let reach = 0; for (let i = 0; i < pos.length; i += 3) reach = Math.max(reach, Math.abs(pos[i]));
      farX = xAt(FARL.s) - cs * (FARL.clear + FARL.half + reach * FARL.scale);
      const far = new THREE.Mesh(g, boltMat(farU, 1)); far.position.set(farX, 0, -farS); far.scale.set(FARL.scale, FARL.scale, 1); far.frustumCulled = false; far.renderOrder = 4; scene.add(far);
      // the same strokes stand again deep in the squall, 3 m before the red wall's near face, mirrored and a quarter as
      // far apart: from inside the storm they are close on either hand
      const inner = new THREE.Mesh(g, boltMat(boltU, boltRow(P.wall0 - 3))); inner.position.set(0, 0, -(P.wall0 - 3)); inner.scale.set(-0.25, 1, 1); inner.frustumCulled = false; inner.renderOrder = 4; scene.add(inner);
      // THE SQUALL'S LANES, shape by shape, for both planes as built (SQUALL.clear above). The line's reach across
      // and its highest place are taken at every metre of voyage within that width and a metre more of the plane,
      // either way (beyond that the voyage's own metres keep the width). A quad of the shape whose lowest corner is
      // not SQUALL.clear m over that highest place forbids the span of place across in which its box would stand
      // within SQUALL.clear m of that reach; the spans of a shape are merged where they meet.
      for (let v = 0; v < NSHAPE; v++) {
        const sp = [];
        for (const m of [near, inner]) {
          const sv = Math.round(-m.position.z), w = Math.ceil(SQUALL.clear) + 1; let x0 = 1e9, x1 = -1e9, y1 = -1e9;
          for (let s = sv - w; s <= sv + w; s++) { x0 = Math.min(x0, routeAt[s * 2]); x1 = Math.max(x1, routeAt[s * 2]); y1 = Math.max(y1, routeAt[s * 2 + 1]); }
          for (let i = 0; i < pos.length; i += 12) {
            if (dat[i / 12 * 8 + 1] !== v) continue;
            const qx = [0, 3, 6, 9].map((k) => pos[i + k] * m.scale.x), qy = Math.min(pos[i + 1], pos[i + 4], pos[i + 7], pos[i + 10]) * m.scale.y;
            if (qy < y1 + SQUALL.clear) sp.push([x0 - SQUALL.clear - Math.max(...qx), x1 + SQUALL.clear - Math.min(...qx)]);
          }
        }
        sp.sort((a, b) => a[0] - b[0]);
        const lane = []; for (const s of sp) { const l = lane[lane.length - 1]; if (l && s[0] <= l[1]) l[1] = Math.max(l[1], s[1]); else lane.push(s); }
        squallLane.push(lane);
      }
    }
    const rain = fx.makeParticles({ rng: S.rain, preset: 'rain', count: Math.round(5200 * detail), time: seas.uniforms.uTime, colors: ['#c8d4e4', '#9fb0c8', '#e6eef8'] }); rain.setOpacity(0); scene.add(rain.object);
    const rainI = rain.uniforms.uIntensity.value;
    await ctx.yield();
    const snow = fx.makeParticles({ rng: S.snow, preset: 'snow', count: Math.round(3600 * detail), time: seas.uniforms.uTime, colors: ['#dff6e6', '#b8f0d0', '#ffffff'], intensity: 1.5 }); snow.setOpacity(0); scene.add(snow.object);
    await ctx.yield();
    // ---- SEA 3: rafts of flower foam on the milk sea, each of its own size and outline, floating with the swell.
    // Their near edges keep 10 m or more from the line, sides by turn, spaced so that one is never far.
    {
      const rr = S.rafts, n = Math.max(4, Math.round(6 * V.density)), pos = [], dat = [], idx = [], span = (P.green + 30) - (P.milk + 10);
      for (let i = 0; i < n; i++) {
        const R = rr.range(4, 7), s = P.milk + 10 + (i + rr.range(0.15, 0.85)) * span / n, side = i % 2 ? 1 : -1, x = xAt(s) + side * (10 + R + rr.range(0, 12)), seed = rr.range(0, 99), base = pos.length / 3;
        for (let a = 0; a <= 8; a++) for (let b = 0; b <= 8; b++) { pos.push(x + (a / 4 - 1) * R * 1.25, 0, -s + (b / 4 - 1) * R * 1.25); dat.push(a / 4 - 1, b / 4 - 1, R, seed); }
        for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) { const q = base + a * 9 + b; idx.push(q, q + 1, q + 9, q + 1, q + 10, q + 9); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aRaft', new THREE.Float32BufferAttribute(dat, 4)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: seas.uniforms, side: THREE.DoubleSide,
        vertexShader: GLSL_SEAS + GLSL_FLOAT + /* glsl */`attribute vec4 aRaft; varying vec4 vRaft; varying vec3 vWp; void main(){ vRaft = aRaft; vec3 p = position; p.y = surfaceH(p.xz) + .06 + .1 * aRaft.z * max(1. - 1.5 * dot(aRaft.xy, aRaft.xy), 0.); vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
        fragmentShader: fx.GLSL_NOISE + GLSL_SEAS + /* glsl */`varying vec4 vRaft; varying vec3 vWp;
          void main(){
            vec2 q = vRaft.xy * 1.25; float R = vRaft.z, sd = vRaft.w;
            float edge = length(q) + (fbmLo(q * 1.6 + sd) - .5) * .7 + (vnoise(vWp.xz * 1.1 + sd) - .5) * .25;
            if (edge > .98) discard;
            // blossoms: one to a cell, five petals round a gold heart; cream foam between them
            vec2 g = vWp.xz * 1.15 + sd; vec3 vo = voronoi(g);
            float id = vo.z, r = vo.x, th = atan(fract(g.y) - .5, fract(g.x) - .5);
            float petal = smoothstep(.5, .4, r / (.6 + .22 * cos(5. * th + id * 20.))), heart = smoothstep(.12, .08, r), has = step(.12, id);
            vec3 tint = id < .45 ? vec3(1., .42, .62) : id < .7 ? vec3(1., .6, .36) : id < .88 ? vec3(.98, .95, .9) : vec3(.78, .5, .95);
            vec3 foamC = vec3(.78, .82, .8) * (.55 + .45 * smoothstep(.0, .14, vo.y)) * (.8 + .2 * vnoise(vWp.xz * 9.));
            vec3 alb = mix(foamC, tint * (.6 + .4 * smoothstep(.5, .12, r)), petal * has);
            alb = mix(alb, vec3(1., .7, .1), heart * has);
            alb *= .35 + .65 * smoothstep(.98, .72, edge);
            vec3 col = seaLight(vec3(0., 1., 0.), vWp, alb, .5) * 1.5 + alb * vec3(1., .72, .2) * heart * has * .9;
            gl_FragColor = vec4(seaFog(col, vWp, 0.), 1.);
          }` }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---- THE DOVES OF THE JOIN: a habit of that place. Sheets of white birds fly straight tracks in the world, each
    // track through its sheet's own passing place in the join's air (within JOIN m of the join's place along the
    // voyage, within 20 m of the line, 12 to 30 m up) and slanting across from the dawn's bright hand toward the
    // coast's. A sheet comes in level, 9 to 15 m over the sea, from DOVE.from m before its passing place (out of the
    // pale light on the sea-line), climbs aslant through the join and is lost DOVE.to m beyond it, high in the green
    // night's air; then it comes again. All sheets fly at one seeded speed, so one period (the track's length over
    // that speed) holds for all, and their starts are staggered evenly round it: at any moment of the clock the
    // sheets stand evenly spaced along their tracks, whoever comes. A bird is a fixed offset in phase and place on
    // its sheet. No bird flies lower than 9 m over the sea.
    // aA = (passing x, y, z, phase: the sheet's start and the bird's lag), aB = (period s, place across the sheet m, slant across per m, climb per m)
    const DOVE = { from: -110, to: 110, sheet: Math.round(200 * detail) };
    {
      const dr = S.doves, sheets = V.hour === 'dawn' ? 10 : 5, n = sheets * DOVE.sheet, aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aC = new Float32Array(n * 4);
      const len = DOVE.to - DOVE.from, period = len / dr.range(13, 15.5);
      for (let k = 0; k < sheets; k++) {
        const sx = P.violet + dr.range(-JOIN, JOIN), px = xAt(sx) + dr.range(-20, 20), py = dr.range(12, 30), start = (k + dr.range(0.2, 0.8)) / sheets, slant = cs * dr.range(0.3, 0.6), climb = dr.range(0.22, 0.4), tilt = dr.range(-0.25, 0.25);
        for (let i = 0; i < DOVE.sheet; i++) {
          const j = (k * DOVE.sheet + i) * 4, w = clamp(dr.gauss() * 14, -40, 40), lag = clamp(dr.gauss() * 14, -40, 40);
          aA[j] = px; aA[j + 1] = py + w * tilt + dr.range(-1.5, 1.5); aA[j + 2] = -sx; aA[j + 3] = start + lag / len;
          aB[j] = period; aB[j + 1] = w; aB[j + 2] = slant; aB[j + 3] = climb;
          aC[j] = dr.range(0.7, 0.95); aC[j + 1] = dr(); aC[j + 2] = dr.range(3.6, 5.2); aC[j + 3] = dr();
        }
        await ctx.yield();
      }
      const m = new THREE.Mesh(birdGeometry(n, aA, aB, aC), birdMaterial(seas.uniforms, /* glsl */`
        vec3 birdPos(out vec3 fwd, out float vis){
          float g = mix(${DOVE.from.toFixed(1)}, ${DOVE.to.toFixed(1)}, fract(uTime / aB.x + aA.w));
          // level at its own floor until its climbing line rises through that, with a rounded knee
          float fl = 9. + aC.w * 6., yc = aA.y + aB.w * g, hk = max(4. - abs(yc - fl), 0.) / 4.;
          fwd = vec3(aB.z, aB.w * smoothstep(fl - 4., fl + 4., yc), 1.);
          vis = smoothstep(${DOVE.from.toFixed(1)}, ${(DOVE.from + 40).toFixed(1)}, g) * smoothstep(${DOVE.to.toFixed(1)}, ${(DOVE.to - 60).toFixed(1)}, g);
          return vec3(aA.x + aB.z * g + aB.y, max(yc, fl) + hk * hk + sin(uTime * 2. + aC.y * 30.) * .3, aA.z + g - aB.z * aB.y);
        }`, /* glsl */`vec3 birdCol(float shade, vec3 wp){ return seaLight(vec3(0., .6, .8), wp, vec3(.92, .93, .95), .8) * (.4 + .6 * shade) + vec3(1., .93, .8) * (.5 + .75 * shade); }`));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---- SEA 4: the flower coast on the side cs. The shoreline lies 28 to 34 m off the axis from coast0 to coast1 and
    // swings away from the voyage at both ends (at the far end from shoreTurn, 48 m before the coast's end: THE POINT
    // WHERE THE SHORE TURNS AWAY FROM THE LINE); a bank 3 m high, dark ground rising inland. The bank's own profile:
    // its face rises BANK.h m over the first BANK.w m behind the water's edge; bankTop is the first place behind
    // the edge where the face has reached its full height (the face's own width, BANK.w).
    const cr = S.coast, shoreJit = Array.from({ length: 64 }, () => cr.range(-3, 3)), shoreTurn = P.coast1 - 48;
    const shoreX = (s) => { const f = clamp((s - (P.coast0 - 60)) / 6, 0, 62.99), i = Math.floor(f); const j = lerp(shoreJit[i], shoreJit[i + 1], f - i);
      return 31 + j + 420 * Math.pow(1 - smoothstep(P.coast0 - 60, P.coast0 + 6, s), 2) + 420 * Math.pow(smoothstep(shoreTurn, P.coast1 + 10, s), 2); };
    // Inland the ground rises in hills (40 to 110 m, 400 to 1400 m from the shore), their ridges from a ridged noise
    // of the place (the stream 'hills' sets where in the noise this visit's hills lie), so the land's skyline is broken.
    const hillAt = [N.hills.range(0, 60), N.hills.range(0, 60)];
    const BANK = { h: 2.6, w: 3.2 }, bankFace = (o) => BANK.h * smoothstep(0, BANK.w, o), bankTop = BANK.w;
    const landY = (s, o) => (o < 0 ? Math.max(-1.2, o * 0.22) : bankFace(o) + 0.5 * smoothstep(3, 9, o) + 4 * smoothstep(20, 160, o) + 5 * smoothstep(140, 520, o) + (o > 6 ? (1.6 + 9 * smoothstep(40, 300, o)) * ctx.noise.fbm2(s * 0.021, o * 0.012, 3) * smoothstep(6, 40, o) : 0)
      + (o > 300 ? smoothstep(300, 900, o) * (40 + 70 * ctx.noise.ridged2(s * 0.0042 + hillAt[0], o * 0.0026 + hillAt[1], 3)) * (1 - 0.7 * smoothstep(1100, 1500, o)) : 0));
    // (the coast's ground, rocks, roots and trees: lit by their sea, rimmed by its key, glowing where a bloom hangs over them)
    const coastBag = makeBag(), groundMat = litMaterial(seas, { side: THREE.DoubleSide, lamp: '#ff7a8a', wet: 0.5, rim: 0.5 });
    {
      // (wet sand at the water, mossed earth on the bank, the far ground paler with distance)
      const b = coastBag, offs = [-7, -2, 0, 1.6, 3.4, 9, 20, 42, 80, 130, 190, 260, 340, 440, 560, 700, 860, 1040, 1240, 1500], earth = linear('#34402c'), sand = linear('#5c4c56'), far = linear('#4c4868'), hill = linear('#625a80');
      for (let s = P.coast0 - 60; s < P.coast1 + 10; s += 6) { for (let k = 0; k < offs.length - 1; k++) {
        const o0 = offs[k], o1 = offs[k + 1], A = (ss, o) => [cs * (shoreX(ss) + o), landY(ss, o), -ss], c = k < 3 ? sand : k < 8 ? earth : k < 13 ? far : hill;
        if (cs > 0) b.quad(A(s, o0), A(s + 6, o0), A(s + 6, o1), A(s, o1), c); else b.quad(A(s + 6, o0), A(s, o0), A(s, o1), A(s + 6, o1), c);
      } if (((s - P.coast0) / 6) % 8 === 0) await ctx.yield(); }
    }
    await ctx.yield();
    // the flowers: three to five deep on bank and shallows, 5 to 11 m tall, each of its own height, lean, turn and tint;
    // none whose leaves come within 12 m of the line (tested every 2 m of route on this visit's own layout)
    const flowers = [], flr = S.flowers;
    for (let i = 0, n = Math.round(70 * V.density), tries = 0; i < n && tries < n * 8; tries++) {
      const s = flr.range(P.coast0 - 6, P.coast1 - 30), o = flr.range(-3.5, 10) + (flr() < 0.3 ? flr.range(4, 12) : 0), h = flr.range(5, 11) * (o > 8 ? 1.1 : 1), sc = h / 8;
      const x = cs * (shoreX(s) + o), z = -s;
      if (nearLine(x, z) < 12 + 5.4 * sc) continue;
      if (flowers.some((f) => Math.hypot(f.x - x, f.z - z) < 1.6 * (f.sc + sc))) continue;
      flowers.push({ x, y: Math.max(landY(s, o), -0.3) - 0.15, z, s, o, sc, h, kind: flr() < 0.62 ? 0 : 1, yaw: (cs > 0 ? -Math.PI / 2 : Math.PI / 2) + flr.range(-0.7, 0.7), tilt: flr.range(-0.08, 0.08), tint: flr() });
      i++;
    }
    // and six to nine on the islet, round its crown, each facing out over the water
    for (let i = 0, n = N.islet.int(6, 9); i < n; i++) { const a = (i + N.islet.range(0.1, 0.9)) / n * 6.283, d = islet.R * N.islet.range(0.25, 0.7), h = N.islet.range(6, 10), red = N.islet() < 0.65;
      flowers.push({ x: islet.x + Math.cos(a) * d, y: islet.H * (1 - Math.pow(d / islet.R, 2)) * 0.7, z: islet.z + Math.sin(a) * d, s: islet.s, o: 0, sc: h / 8, h, kind: red ? 1 : 0, yaw: Math.atan2(Math.cos(a), Math.sin(a)) + N.islet.range(-0.4, 0.4), tilt: N.islet.range(-0.08, 0.08), tint: red ? N.islet.range(0, 0.45) : N.islet.range(0.7, 1) }); }
    const flowerMat = litMaterial(seas, { side: THREE.DoubleSide, lamp: '#000000', rim: 0.3,
      vertPars: 'attribute vec3 aTint; varying vec3 vTint;',
      vert: /* glsl */`vTint = aTint; float ph = instanceMatrix[3].x * .7 + instanceMatrix[3].z * .9, k = p.y * p.y / 64.; p.z += sin(uTime * .9 + ph) * .5 * k; p.x += sin(uTime * .63 + ph * 1.7) * .35 * k; p.y -= .12 * k * (1. + sin(uTime * .9 + ph));`,
      fragPars: 'varying vec3 vTint;', frag: /* glsl */`alb = mix(alb, alb * vTint * 1.5, vFx.z); glowAdd += vTint * seaAt(8., vWp.xz).rgb * .22 * vFx.z;` });
    for (const kind of [0, 1]) {
      const list = flowers.filter((f) => f.kind === kind), g = flowerGeometry(kind, flr), im = new THREE.InstancedMesh(g, flowerMat, Math.max(list.length, 1)), tint = new Float32Array(Math.max(list.length, 1) * 3);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), c = new THREE.Color();
      list.forEach((f, i) => { E.set(f.tilt, f.yaw, f.tilt * 0.6, 'YXZ'); M.compose(new THREE.Vector3(f.x, f.y, f.z), Q.setFromEuler(E), new THREE.Vector3(f.sc, f.sc, f.sc)); im.setMatrixAt(i, M);
        c.set(kind ? '#ff5a3c' : '#ffd9e6').lerp(new THREE.Color(kind ? '#ffb23a' : '#e04aa8'), f.tint * f.tint).toArray(tint, i * 3); });
      im.count = list.length; g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3)); im.frustumCulled = false; scene.add(im);
      await ctx.yield();
    }
    // ---- the ground under the flowers (stream ground): wet rocks along the water's edge (none nearer the line than
    // the flowers' leaves, 12 m), roots that arch from the feet of the shore's flowers into the water, lianas hanging
    // between neighbours. Everything of the coast's ground takes the glow of the blooms over it: a bloom lights
    // what lies within about 9 m of its head, baked at each vertex.
    {
      const gr = N.ground, b = coastBag, rockC = [linear('#1a2420'), linear('#4a4650'), linear('#7a7482')], rootC = linear('#6a5240'), vine = linear('#3c6a2c'), vineL = linear('#5a8a38');
      const shore = flowers.filter((f) => f.s !== islet.s);
      for (let i = 0, tries = 0; i < 36 && tries < 300; tries++) { const s = gr.range(P.coast0 - 6, P.coast1 - 30), o = gr.range(-5, 4), R = gr.range(0.8, 2.4), x = cs * (shoreX(s) + o), z = -s;
        if (nearLine(x, z) - R < 12) continue; lump(b, x, Math.max(landY(s, o), -0.6) - 0.5, z, R, R * gr.range(0.6, 1.1) + 0.5, R * gr.range(0.7, 1.2), gr.range(0, 90), rockC, gr.range(0, 3)); i++; if (i % 12 === 0) await ctx.yield(); }
      await ctx.yield();
      for (const f of shore) if (f.o < 6) for (let i = 0, n = gr.int(2, 3); i < n; i++) {
        const a = (cs > 0 ? Math.PI : 0) + gr.range(-1.1, 1.1), len = gr.range(2.5, 5) * f.sc, ca = Math.cos(a), sa = Math.sin(a), arch = gr.range(0.6, 1.4) * f.sc; let px = f.x, py = f.y + 0.9 * f.sc, pz = f.z;
        for (let q = 0; q < 3; q++) { const t1 = (q + 1) / 3, nx = f.x + ca * len * t1, nz = f.z + sa * len * t1, ny = f.y + 0.9 * f.sc * (1 - t1) + arch * Math.sin(Math.PI * t1) - 1.2 * t1;
          b.loft([{ c: [px, py, pz], u: [-sa, 0, ca], v: [0, 1, 0], ru: 0.2 * f.sc * (1 - 0.25 * q), rv: 0.2 * f.sc * (1 - 0.25 * q) }, { c: [nx, ny, nz], u: [-sa, 0, ca], v: [0, 1, 0], ru: 0.2 * f.sc * (0.75 - 0.25 * q), rv: 0.2 * f.sc * (0.75 - 0.25 * q) }], 5, rootC); px = nx; py = ny; pz = nz; }
      }
      await ctx.yield();
      const byS = shore.slice().sort((p, q) => p.s - q.s);
      for (let i = 0; i < byS.length - 1; i++) { const p = byS[i], q = byS[i + 1], d = Math.hypot(p.x - q.x, p.z - q.z); if (d < 3 || d > 11 || gr() < 0.35) continue;
        const y0 = p.y + p.h * gr.range(0.5, 0.75), y1 = q.y + q.h * gr.range(0.5, 0.75), sag = gr.range(1.2, 2.8), w = 0.09;
        for (let k = 0; k < 8; k++) { const t0 = k / 8, t1 = (k + 1) / 8, A = (t) => [lerp(p.x, q.x, t), lerp(y0, y1, t) - sag * Math.sin(Math.PI * t), lerp(p.z, q.z, t)], a0 = A(t0), a1 = A(t1);
          b.quad([a0[0], a0[1] - w, a0[2]], [a1[0], a1[1] - w, a1[2]], [a1[0], a1[1] + w, a1[2]], [a0[0], a0[1] + w, a0[2]], vine);
          if (k % 2) b.tri([a0[0], a0[1], a0[2]], [a0[0] + 0.3, a0[1] - 0.9, a0[2] + 0.25], [a0[0] - 0.3, a0[1] - 0.8, a0[2] - 0.25], vineL); } }
      await ctx.yield();
      // the blooms' heads, in bins of 12 m of the voyage, and their glow at a place
      const bins = new Map(); for (const f of shore) { const hx = f.x + Math.sin(f.yaw) * 2.4 * f.sc, hy = f.y + 7.5 * f.sc, hz = f.z + Math.cos(f.yaw) * 2.4 * f.sc, k = Math.floor(-hz / 12); if (!bins.has(k)) bins.set(k, []); bins.get(k).push([hx, hy, hz]); }
      const bloomAt = (x, y, z) => { let w = 0; const k = Math.floor(-z / 12); for (let j = k - 1; j <= k + 1; j++) { const L = bins.get(j); if (L) for (const h of L) { const dx = h[0] - x, dy = h[1] - y, dz = h[2] - z; w += 1.4 / (1 + (dx * dx + dy * dy + dz * dz) / 18); } } return Math.min(w, 1.6); };
      while (b.bake(bloomAt, 1200)) await ctx.yield();
      await ctx.yield();
      const m = new THREE.Mesh(b.toGeometry(bloomAt), groundMat); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // gold cat's eyes in pairs in the dark between and under the flowers: each pair 0.8 m apart, 0.5 to 3 m over the
    // ground, 1 to 8 m behind the front stems, facing its own fixed way within 50 degrees of the line out to the water
    // (most of them a little toward the river mouth, whence anything on this sea comes),
    // blinking on its own clock; some open again a metre aside. No eye sits in a bloom, none follows the boat.
    const eyePairs = [];
    {
      const er = S.eyes, n = Math.round(40 * V.density), aP = new Float32Array(n * 4), aE = new Float32Array(n * 4); let k = 0;
      for (let tries = 0; k < n && tries < n * 10; tries++) {
        const s = er.range(P.coast0, P.coast1 - 34), o = er.range(0.5, 8), x = cs * (shoreX(s) + o), z = -s, y = landY(s, o) + er.range(0.9, 3);
        if (nearLine(x, z) < 18 || flowers.some((f) => Math.hypot(f.x - x, f.z - z) < 1.1 * f.sc)) continue;
        eyePairs.push([x, z]); aP.set([x, y, z, (cs > 0 ? -Math.PI / 2 : Math.PI / 2) + cs * er.range(-0.25, 0.87)], k * 4); aE.set([er.range(3, 9), er.range(0, 9), er() < 0.4 ? 1 : 0, er.range(1, 1.2)], k * 4); k++;
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1.5, -0.9, 0, 1.5, -0.9, 0, 1.5, 0.9, 0, -1.5, 0.9, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('aE', new THREE.InstancedBufferAttribute(aE, 4)); g.instanceCount = k;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: seas.uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: GLSL_SEAS + /* glsl */`attribute vec4 aP; attribute vec4 aE; varying vec2 vUv; varying float vOpen; varying float vFog;
          void main(){
            float ph = (uTime + aE.y) / aE.x, bp = fract(ph), cyc = floor(ph);
            vOpen = smoothstep(0., .035, bp) * (1. - smoothstep(.88, .915, bp));
            float shift = aE.z * (mod(cyc, 2.) * 2. - 1.) * .5;
            vec3 right = vec3(cos(aP.w), 0., -sin(aP.w));
            // (each eye throws a soft glow about 0.6 m round itself, in metres like the eye: that is what carries far)
            vec3 p = aP.xyz + right * ((position.x + shift) * aE.w) + vec3(0., position.y * aE.w, 0.);
            vUv = position.xy; vFog = exp(-seaDepth(p));
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`varying vec2 vUv; varying float vOpen; varying float vFog;
          void main(){
            vec2 q = vec2(abs(vUv.x) - .4, vUv.y - .28 * (abs(vUv.x) - .4));
            float lid = max(.1 * vOpen, .004), a = 1. - (q.x * q.x / .0225 + q.y * q.y / (lid * lid));
            float eye = smoothstep(0., .3, a), pupil = smoothstep(.062, .045, length(vec2(q.x, vUv.y - .28 * (abs(vUv.x) - .4))));
            vec3 col = mix(vec3(1., .62, .08), vec3(1.3, 1.1, .5), smoothstep(.3, 1., a)) * 3. * eye * (1. - .9 * pupil);
            col += vec3(1., .58, .1) * exp(-min(dot(q, q) / .09, 20.)) * .5 * smoothstep(1.5, 1.1, abs(vUv.x)) * smoothstep(.9, .6, abs(vUv.y));
            gl_FragColor = vec4(col * vOpen * vFog, 1.);
          }` }));
      m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
    }
    await ctx.yield();
    // THE SNAKE WOOD: nine crooked trees, A GREAT SNAKE ON EVERY ONE, stand together ON THE POINT WHERE THE SHORE
    // TURNS AWAY FROM THE LINE (shoreTurn, the shore's own course: there it begins to swing inland). The wood lies
    // along the turning shore as far as the top of its bank stays within TREE.far m of the line (woodEnd, found from
    // the shore's course and the line), and back from there by its own length (nine trees in two ranks, TREE.apart
    // m apart). THE FRONT RANK STANDS ON THE TOP OF THE BANK: the first place behind the water's edge where the
    // bank has reached its full height (bankTop, the land's own profile), the flowers of the water's edge before
    // it on the bank's face and in the shallows; THE BACK RANK behind it by the trees' own spread (a limb's
    // length, TREE.limb m). WHAT IN FACT PLACES A TREE: each is dealt a place in its rank (its metre along the
    // wood), and stands on THE NEAREST FREE GROUND TO THAT PLACE: ground on the bank's top or behind it, TREE.near
    // to TREE.far m from the line, clear of every flower's stem and pair of eyes and TREE.apart m from the next
    // tree (tried in rings 1.5 m apart round the dealt place, a place every 1.5 m round each; most trees stand on
    // such ground and not on the dealt place itself; none within 60 m: no tree). A tree's whole shape is drawn
    // from its stream before its ground is sought, so a tree without ground spends its own draws and no other's.
    // THE SNAKE HANGS ON THE WATER'S SIDE OF ITS TREE: from the limb, of those at the trunk's fourth and fifth
    // joints, whose middle is nearest the line. NO WOOD, LEAF OR SNAKE COMES
    // WITHIN TREE.clear m OF THE LINE: a tree reaches at most TREE.near - TREE.clear m from its foot (its trunk's
    // wander 3.4 m, a limb TREE.limb m, the leaves at its end 5.5 m; a snake hangs inside that). Each snake keeps
    // its own beat of the clock (SNAKE.beat s, stream drop, the starts dealt a ninth of a beat apart): it hangs
    // swaying from its limb for SNAKE.hang of the beat, slips a little, lets go and falls its own length into the
    // dark under its tree, lies there, and draws itself up the limb again. It does so whoever passes.
    const SNAKE = { beat: [8, 12], hang: 0.25 }, TREE = { n: 9, near: 25, far: 45, limb: 8, apart: 5, clear: 8 }, snakes = [];
    {
      // (each crown is a rounded mass of leaves, lit; its outline from the noise)
      const tr = S.trees, b = makeBag(), bark = linear('#4a3a34'), leafC = [linear('#16301e'), linear('#2c5a34'), linear('#56803e')], sr = S.snakes, nT = TREE.n, feet = [];
      let woodEnd = shoreTurn; while (woodEnd < P.coast1 && nearLine(cs * (shoreX(woodEnd + 1) + bankTop), -(woodEnd + 1)) <= TREE.far) woodEnd += 1;
      const free = (ss, oo) => { const fx = cs * (shoreX(ss) + oo), fz = -ss, d = nearLine(fx, fz); return oo >= bankTop && d >= TREE.near && d <= TREE.far && !flowers.some((f) => Math.hypot(f.x - fx, f.z - fz) < 1.6 * f.sc + 1.3) && !eyePairs.some((e) => Math.hypot(e[0] - fx, e[1] - fz) < 2.5) && !feet.some((q) => Math.hypot(q[0] - fx, q[1] - fz) < TREE.apart); };
      for (let i = 0; i < nT; i++) {
        // its dealt place: its metre along the wood, on the bank's top (front rank) or a limb's length behind it (back rank)
        const sD = lerp(woodEnd - nT * TREE.apart / 2, woodEnd, (i + tr.range(0.2, 0.8)) / nT), oD = bankTop + (i % 2) * TREE.limb;
        // its shape: girth, twist, height; two limbs at each of the trunk's upper five joints, each with its crown of leaves
        const sh = { r: tr.range(0.9, 1.3), twist: tr.range(0, 6.28), H: tr.range(12, 15), limbs: [] };
        for (let k = 0; k < 10; k++) sh.limbs.push({ a: tr.range(0, 6.28), len: tr.range(TREE.limb / 2, TREE.limb), up: tr.range(0.5, 3), rx: tr.range(2.4, 4), ry: tr.range(1.6, 2.6), rz: tr.range(2.4, 4), turn: tr.range(0, 3) });
        let s = 0, o = -1;
        for (let ring = 0; ring < 60 && o < 0; ring += 1.5) for (let a = 0, na = 8 + 4 * ring; a < na && o < 0; a++) { const ss = sD + ring * Math.cos(a / na * 6.2832), oo = oD + ring * Math.sin(a / na * 6.2832); if (free(ss, oo)) { s = ss; o = oo; } }
        if (o < 0) continue;
        feet.push([cs * (shoreX(s) + o), -s]);
        const x0 = cs * (shoreX(s) + o), y0 = landY(s, o) - 0.5; let x = x0, y = y0, z = -s, r = sh.r, limb = null;
        const twist = sh.twist, H = sh.H;
        for (let k = 0; k < 7; k++) { const h = H / 7, lx = Math.sin(twist + k * 1.3) * 1.5 * (k / 3), lz = Math.cos(twist * 1.7 + k * 1.1) * 1.3 * (k / 3); b.cyl(x, y, z, r, r * 0.8, h, 6, bark, { lean: [lx, lz] }); x += lx; y += h; z += lz; r *= 0.8;
          if (k >= 2) for (let q = 0; q < 2; q++) { const lm = sh.limbs[(k - 2) * 2 + q], ex = x + Math.cos(lm.a) * lm.len, ez = z + Math.sin(lm.a) * lm.len, ey = y + lm.up;
            b.cyl(x, y - 0.4, z, r * 0.7, r * 0.3, ey - y + 0.4, 5, bark, { lean: [ex - x, ez - z] });
            lump(b, ex, ey - 0.6, ez, lm.rx, lm.ry, lm.rz, ex * 0.37 + ez * 0.11, leafC, lm.turn); if ((k === 3 || k === 4) && (!limb || nearLine((x + ex) / 2, (z + ez) / 2) < nearLine(limb[0], limb[2]))) limb = [(x + ex) / 2, (y + ey) / 2 + 0.2, (z + ez) / 2]; } }
        lump(b, x, y - 1, z, 4.2, 3.2, 4.2, x * 0.37 + z * 0.11, leafC, twist);
        if (i % 3 === 2) await ctx.yield();
        if (limb) snakes.push({ limb, s, tree: i });
      }
      const m = new THREE.Mesh(b.toGeometry(), groundMat); m.frustumCulled = false; scene.add(m);
      snakes.forEach((sn, i) => {
        const sb = makeBag(), L = sr.range(9, 11), ochre = linear('#c8a040'), dk = linear('#1c2a14'), ph = sr.range(0, 6.28); let x = 0, y = 0, z = 0;
        for (let k = 0; k < 14; k++) { const h = L / 14, r = 0.42 * (k === 13 ? 1.5 : 1 - 0.3 * Math.abs(k - 6) / 7), lx = Math.sin(k * 0.9 + ph) * 0.5, lz = Math.cos(k * 0.7 + ph) * 0.4; sb.cyl(x, y - h, z, r * 0.92, r, h, 6, k % 3 ? ochre : dk, { lean: [-lx, -lz] }); x += lx; z += lz; y -= h; }
        sn.U = { uSn: { value: new THREE.Vector4(ph, 0, 0, 0) } }; sn.L = L; sn.per = N.drop.range(SNAKE.beat[0], SNAKE.beat[1]); sn.start = (i + N.drop.range(0.2, 0.8)) / snakes.length;
        const mm = new THREE.Mesh(sb.toGeometry(), litMaterial(seas, { uniforms: sn.U, vertPars: 'uniform vec4 uSn;', vert: /* glsl */`float k = clamp(-p.y / 10., 0., 1.); p.x += sin(uTime * .7 + uSn.x) * 1.4 * k * k; p.z += cos(uTime * .5 + uSn.x) * .9 * k * k; p.y -= uSn.z;` }));
        mm.position.set(sn.limb[0], sn.limb[1], sn.limb[2]); mm.frustumCulled = false; scene.add(mm);
      });
    }
    const petals = fx.makeParticles({ rng: S.petals, preset: 'petals', count: Math.round(700 * detail), time: seas.uniforms.uTime, colors: ['#ffd9e6', '#e04aa8', '#ff9a6a'], intensity: 0.9 }); petals.setOpacity(0); scene.add(petals.object);
    // five rainbow arcs lie under the water on the hand away from the coast, measured from the line's place at the
    // coast's middle; they run straightest abeam of the coast's beginning and bow outward from there (the part's sea)
    sea.uniforms.uBow.value.set(xAt((P.coast0 + P.coast1) / 2), P.coast0, -cs, 0);
    // rare: far out on the side away from the coast the violet sea pours over an edge. The lip runs beside the voyage
    // for the length of this sea, 450 m off the line: a pale line of broken water and a bank of mist rising over it.
    let fallMist = null, fallLip = null;
    if (V.rare) {
      const fr = S.fall, sm = (P.coast0 + P.coast1) / 2 + fr.range(-15, 15), len = P.coast1 - P.violet + 60, fx0 = xAt(sm) - cs * 450;
      const lip = new THREE.Mesh(new THREE.PlaneGeometry(16, len, 1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8e0ff') }));
      lip.position.set(fx0, 0.5, -sm); scene.add(lip); fallLip = { object: lip, s: sm };
      fallMist = fx.makeMist({ rng: fr, count: 70, area: [50, 44, len], center: [fx0 - cs * 20, 26, -sm], size: [40, 90], color: '#d8ccf4', opacity: 0.42, drift: [0, 2.2, 0], time: seas.uniforms.uTime });
      scene.add(fallMist.object);
    }
    await ctx.yield();
    // ---- SEA 5: the ice front on the side `is`, 45 m tall, its face 100 m off the axis from front0 to front1; its two
    // flanks run back inland. Columns of their own width, height and set-back, with crevasses between.
    // (ice: its shaded faces are blue and give back a deep light of their own; a stroke of the squall's lightning
    // lights every face turned toward the squall or the sky, by the table's lightning row at the face's own place)
    const iceMat = litMaterial(seas, { side: THREE.DoubleSide, lamp: '#000000', vertPars: GLSL_FLOAT, uniforms: { uFlash: skyU.uFlash }, fragPars: 'uniform float uFlash;',
      vert: /* glsl */`
        #ifdef USE_INSTANCING
          p.y += surfaceH(vec2(instanceMatrix[3].x, instanceMatrix[3].z)) * .8;
        #endif`,
      frag: /* glsl */`{ float along = abs(n.x) > abs(n.z) ? vWp.z : vWp.x;
          float streak = vnoise(vec2(along * .9, vWp.y * .07)) * .6 + vnoise(vec2(along * 3.1, vWp.y * .22)) * .4;
          float strata = smoothstep(.35, .65, vnoise(vec2(along * .03, vWp.y * .55 + along * .04)));
          alb *= (.8 + .26 * streak) * (.92 + .12 * strata);
          // THE LAW OF AN ICE FACE, by the key of the sea it stands in (the table's row 9 at the face's own place: in
          // the ice sea the white sun's hand). A face turned to that light is pale, warm white; a face in its own
          // shade is a deep blue, and blue-green where the ice is old (a slow pattern of the place, more of it low
          // down): it stands darker than the pearl sky behind it, and gives back a little deep light of its own.
          // Its foot is wet and dark to 2.8 m over the mean sea, and under 7 m an upright face in shade takes a
          // deeper blue toward the water.
          vec3 kdI = seaAt(9., vWp.xz).xyz; float nlI = clamp(dot(n, kdI / max(length(kdI), 1e-3)) * .5 + .5, 0., 1.), sunI = smoothstep(.42, .78, nlI);
          float oldI = smoothstep(.56, .8, vnoise(vec2(along * .13 + 7., vWp.y * .1)) + .16 * (1. - smoothstep(2., 14., vWp.y)));
          alb = mix(alb * mix(vec3(.3, .52, .95), vec3(.26, .66, .68), oldI), alb * vec3(1.08, 1., .84), sunI);
          alb = mix(alb, vec3(.1, .34, .56), (1. - smoothstep(0., 7., vWp.y)) * .4 * step(n.y, .5) * (1. - .7 * sunI));
          alb *= mix(vec3(.34, .58, .66), vec3(1.), smoothstep(.4, 2.8, vWp.y));
          glowAdd += vec3(.03, .1, .16) * (1. - abs(n.y)) * smoothstep(.55, .2, streak) * (1. - sunI);
          glowAdd += mix(vec3(.012, .05, .13), vec3(.008, .085, .085), oldI) * (1. - smoothstep(.2, .7, nlI)) * (.5 + .5 * streak) + vec3(.7, .8, 1.2) * uFlash * seaRow(11., vWp.z).a * alb * (.3 + .7 * clamp(.6 * n.y - .8 * n.z, 0., 1.)); }` });
    const pearl = linear('#dfe7ec'), iceBlue = linear('#4f7fa6'), iceDeep = linear('#27506f', 0.8);
    // The face stands FRONT m off the axis. THE FRONT CALVES AS A HABIT: CALVE.n slabs stand along it, SLAB m tall,
    // their feet in the sea, each in a bay of the face (the face stands 3 to 5 m back behind a slab). One seeded
    // period holds for the whole front and the slabs' turns come one share of it apart (a period over their number),
    // give or take a tenth of a share; a slab's lean and fall last a share and a quarter (CALVE.fall s), so one of
    // them is always somewhere in its fall. A slab leans and falls seaward about its foot; the pale wave it throws
    // up spreads and dies (CALVE.wave s, from where its upper part strikes the water, 0.87 of its height out); and
    // over the rest of the period the next slab comes forward out of the bay (CALVE.back m) to stand where the last
    // one stood. The front does this whoever passes, and WHERE IN ITS PERIOD THE FRONT STANDS WHEN THE CLOCK STARTS
    // IS DEALT (one free phase for the whole front, a share of the period from a stream of its own, added to every
    // slab's start): no moment of the clock is favoured over another.
    const FRONT = 100, SLAB = 30, frontLen = P.front1 - P.front0, slabX = FRONT + 1, CALVE = { n: clamp(Math.round(frontLen / 34), 3, 4), fall: 0, drop: 2.4, lean: 0.14, wave: 5.5, back: 7.5, wide: 8.5 };
    const calveT = CALVE.n * N.calve.range(7, 8.5), calvePh = N.calvePhase(), slabs = [];
    CALVE.fall = 1.25 * calveT / CALVE.n;
    {
      const q = N.calve, turn = Array.from({ length: CALVE.n }, (_, k) => k);
      for (let k = CALVE.n - 1; k > 0; k--) { const j = q.int(0, k), t = turn[k]; turn[k] = turn[j]; turn[j] = t; }
      for (let k = 0; k < CALVE.n; k++) slabs.push({ s: P.front0 + frontLen * (k + q.range(0.3, 0.7)) / CALVE.n, start: (turn[k] + q.range(0.4, 0.6)) / CALVE.n + calvePh });
    }
    // (the look goes to the place of the slab nearest the front's middle, whatever its metre)
    const towerX = slabX, lookS = P.front0 + frontLen / 2, towerS = slabs.reduce((m, q) => (Math.abs(q.s - lookS) < Math.abs(m.s - lookS) ? q : m)).s;
    {
      const ir = S.ice, b = makeBag(), cols = []; let s = P.front0;
      while (s < P.front1 - 2) { const w = Math.min(ir.range(5, 9.5), P.front1 - s), c = { s0: s, s1: s + w, off: FRONT + ir.range(-4, 5), top: ir.range(38, 48), cut: ir() < 0.3 };
        // (a bay behind each slab: there the face stands 3 to 5 m back)
        if (slabs.some((q) => c.s1 > q.s - CALVE.wide / 2 - 1 && c.s0 < q.s + CALVE.wide / 2 + 1)) c.off = FRONT + 3 + (c.off - FRONT + 4) * 2 / 9;
        cols.push(c); s += w; }
      const X = (o) => is * o, mixc = (a, c, t) => [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)];
      cols.forEach((c, i) => {
        // the face in three lifts, each set back or forward a little; blue at the water, pearl at the top
        const ys = [-3, c.top * 0.3, c.top * 0.68, c.top], os = [c.off - ir.range(0, 1.5), c.off + ir.range(-1, 1), c.off + ir.range(0, 1.6), c.off + ir.range(1, 3)];
        for (let k = 0; k < 3; k++) {
          const col = mixc(iceBlue, pearl, 0.35 + 0.3 * k);
          const a0 = [X(os[k]), -c.s0], a1 = [X(os[k]), -c.s1], b0 = [X(os[k + 1]), -c.s0], b1 = [X(os[k + 1]), -c.s1];
          if (is > 0) b.quad([a0[0], ys[k], a0[1]], [a1[0], ys[k], a1[1]], [b1[0], ys[k + 1], b1[1]], [b0[0], ys[k + 1], b0[1]], col); else b.quad([a1[0], ys[k], a1[1]], [a0[0], ys[k], a0[1]], [b0[0], ys[k + 1], b0[1]], [b1[0], ys[k + 1], b1[1]], col);
          // the column's two sides (the walls of the crevasses), deep blue
          for (const sz of [c.s0, c.s1]) b.quad([X(os[k]), ys[k], -sz], [X(os[k] + 14), ys[k], -sz], [X(os[k + 1] + 14), ys[k + 1], -sz], [X(os[k + 1]), ys[k + 1], -sz], iceDeep);
        }
        // the top, rising inland
        const offs = [os[3], os[3] + 16, 160, 420, 1100], tops = [c.top, c.top + ir.range(-2, 4), 50 + ir.range(-5, 5), 56, 62];
        for (let k = 0; k < 4; k++) { const A = (ss, j) => [X(offs[j]), tops[j], -ss]; if (is > 0) b.quad(A(c.s0, k), A(c.s1, k), A(c.s1, k + 1), A(c.s0, k + 1), pearl); else b.quad(A(c.s1, k), A(c.s0, k), A(c.s0, k + 1), A(c.s1, k + 1), pearl); }
        // a crevasse: a dark slot let into the face between some columns
        if (c.cut && i > 0) b.box(X(c.off + 1.2), -3, -c.s0, 3.4, c.top * ir.range(0.6, 0.95), ir.range(0.8, 1.8), linear('#16384f', 0.7));
      });
      // the two flanks, running straight inland from the corners
      for (const [s0, dir] of [[P.front0, -1], [P.front1, 1]]) for (let k = 0; k < 12; k++) {
        const o0 = FRONT + k * 46, o1 = o0 + 46, sa = s0 + dir * k * 2.5, sb = s0 + dir * (k + 1) * 2.5, t0 = 42 + k * 1.2 + ir.range(-4, 4), t1 = 42 + (k + 1) * 1.2 + ir.range(-4, 4), col = mixc(iceBlue, pearl, 0.3 + 0.5 * ir());
        b.quad([X(o0), -3, -sa], [X(o1), -3, -sb], [X(o1 + 3), t1, -sb], [X(o0 + 3), t0, -sa], col);
        b.quad([X(o0 + 3), t0, -sa], [X(o1 + 3), t1, -sb], [X(o1 + 3), 54, -(sb - dir * 40)], [X(o0 + 3), 54, -(sa - dir * 40)], pearl);
      }
      // a range of peaks stands on the sheet between the flanks (stream peaks sets where in the noise this visit's
      // range lies): ridges 25 to 135 m over the sheet from 130 m inland of the face, so the ice's skyline is broken
      // from wherever its flanks are seen
      const pq = N.peaks, pox = pq.range(0, 50), poz = pq.range(0, 50), NX = 20, NS = 12, o0 = FRONT + 30, o1 = FRONT + 560, sA = P.front0 - 4, sB = P.front1 + 4, white = linear('#f4f8fb');
      const hAt = (o, s) => 50 + smoothstep(o0, o0 + 200, o) * (1 - 0.5 * smoothstep(o1 - 160, o1, o)) * (0.35 + 0.65 * Math.sin(Math.PI * (s - sA) / (sB - sA))) * (25 + 110 * ctx.noise.ridged2(o * 0.0052 + pox, s * 0.0052 + poz, 4));
      for (let i = 0; i < NX; i++) { for (let j = 0; j < NS; j++) { const oa = lerp(o0, o1, i / NX), ob = lerp(o0, o1, (i + 1) / NX), sa = lerp(sA, sB, j / NS), sb = lerp(sA, sB, (j + 1) / NS);
        const h = [hAt(oa, sa), hAt(ob, sa), hAt(ob, sb), hAt(oa, sb)], steep = (Math.max(...h) - Math.min(...h)) / 30, col = mixc(mixc(pearl, white, clamp((h[0] - 70) / 70, 0, 1)), iceBlue, clamp(steep - 0.25, 0, 0.7));
        const A = [X(oa), h[0], -sa], B = [X(ob), h[1], -sa], C = [X(ob), h[2], -sb], D = [X(oa), h[3], -sb]; if (is > 0) b.quad(A, D, C, B, col); else b.quad(A, B, C, D, col); }
        if (i % 7 === 6) await ctx.yield(); }
      const m = new THREE.Mesh(b.toGeometry(), iceMat); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // the slabs and their waves: each slab four blocks of its own set and turn; each wave a low dome of spray over a
    // ring of foam on the water, growing from where the slab strikes
    {
      const q = N.calve, dp = 6, waveGeo = new THREE.SphereGeometry(1, 28, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      for (const sl of slabs) {
        const b = makeBag(), wS = CALVE.wide * q.range(0.88, 1.06);
        for (let k = 0; k < 4; k++) { const y0 = k * 7.5 - 3, w = wS * (1 - 0.08 * k), d = dp * (1 - 0.1 * k); b.box(-is * (d / 2 + q.range(0, 0.8)), y0, q.range(-0.5, 0.5), d, k === 3 ? 10.5 : 7.5, w, [lerp(iceBlue[0], pearl[0], 0.3 + 0.2 * k), lerp(iceBlue[1], pearl[1], 0.3 + 0.2 * k), lerp(iceBlue[2], pearl[2], 0.3 + 0.2 * k)], { taper: k === 3 ? 0.55 : 0.94, ry: q.range(-0.08, 0.08) }); }
        const m = new THREE.Mesh(b.toGeometry(), iceMat); m.frustumCulled = false;
        sl.g = new THREE.Group(); sl.g.add(m); sl.g.position.set(is * slabX, 0, -sl.s); scene.add(sl.g);
        sl.U = { ...seas.uniforms, uW: { value: 0 } };
        const wm = new THREE.Mesh(waveGeo, new THREE.ShaderMaterial({ uniforms: sl.U, side: THREE.DoubleSide,
          vertexShader: /* glsl */`uniform float uW; varying vec3 vWp; varying vec3 vL; void main(){ vL = position; float up = sin(min(uW * 2.4, 3.14159)); vec3 p = position * vec3(6. + 34. * uW, 3. + 24. * up * (1. - .5 * uW), 6. + 34. * uW); vec4 wp = modelMatrix * vec4(p, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
          fragmentShader: fx.GLSL_NOISE + GLSL_SEAS + /* glsl */`uniform float uW; varying vec3 vWp; varying vec3 vL;
            void main(){
              float ang = atan(vL.z, vL.x), life = smoothstep(0., .08, uW) * (1. - smoothstep(.55, 1., uW));
              float jets = fbm(vec2(ang * 3.2, vL.y * 2.2 - uW * 5.)) * .65 + vnoise(vec2(ang * 13., vL.y * 5. - uW * 9.)) * .35;
              float a = life * smoothstep(.46, .8, jets + (1. - vL.y) * .3 - uW * .2) * (1. - smoothstep(.5, .95, vL.y));
              if (a < hash12(gl_FragCoord.xy + 3.7) * .96 + .02) discard;
              vec3 col = seaLight(normalize(vec3(vL.x, .6, vL.z)), vWp, vec3(.9, .94, .97), .7) * (.7 + .4 * jets);
              gl_FragColor = vec4(seaFog(col, vWp, 0.), 1.);
            }` }));
        wm.position.set(is * (slabX - 0.87 * SLAB), 0, -sl.s); wm.frustumCulled = false; scene.add(wm);
        await ctx.yield();
      }
    }
    // a slab's place in its beat at a moment of the clock. Over the first of its lean and fall (CALVE.fall s in all)
    // it leans slowly seaward about its foot, to CALVE.lean rad; THE FALL ITSELF TAKES CALVE.drop s (from that lean
    // to flat on the water, gathering speed, as a slab SLAB m tall falls about its foot), the slab sinking as it
    // goes down; the wave begins as its upper part strikes (0.16 of the drop before its end); then the next slab
    // stands back in the bay and comes forward.
    const placeSlabs = (time) => {
      for (const sl of slabs) {
        const c = (time / calveT + sl.start) % 1, t = c * calveT, down = t < CALVE.fall, back = down ? 0 : 1 - smoothstep(CALVE.fall / calveT, 0.85, c);
        const tl = CALVE.fall - CALVE.drop, x = clamp((t - tl) / CALVE.drop, 0, 1), k0 = 2 * CALVE.lean / tl * CALVE.drop / (1.62 - CALVE.lean);
        const rot = !down ? 0 : t < tl ? CALVE.lean * (t / tl) * (t / tl) : CALVE.lean + (1.62 - CALVE.lean) * (k0 * x + (1 - k0) * Math.pow(x, 2.4));
        sl.g.rotation.z = is * rot; sl.g.position.y = down ? -7 * Math.pow(rot / 1.62, 0.83) : 0; sl.g.position.x = is * (slabX + CALVE.back * back);
        sl.U.uW.value = clamp((t - (CALVE.fall - 0.16 * CALVE.drop)) / CALVE.wave, 0, 1);
      }
    };
    await ctx.yield();
    // THE GREAT BERGS: THE LINE RUNS DOWN A LANE OF ICE. From the coast's end (P.coast1) to the squall (P.squall) great
    // bergs stand on both hands of the line, by turns: one for every BERG.every m of that water (seven at the least,
    // eleven at the most), each BERG.tall m tall, its near side BERG.gap m from the line. THE GAP IS LAID BY PLACE:
    // every corner of the berg as built and turned, at rest and at the four far ends of its rocking (update's own
    // figures for every berg, BERG.rock rad about its waterline, both swings at once either way), against the line
    // at every metre of the voyage abeam of it (lineGap); the berg is set across until its nearest corner
    // stands at its dealt gap, so no part of any berg ever stands nearer the line than BERG.gap[0] (BERG.clear m of
    // clear air and seven more). ON THE ICE'S HAND two waters are kept free of them, by place: the sight from every
    // metre of the look that holds the front's slab (from the shore's turn until that slab bears BERG.bear degrees
    // off the bow: the look's own window) to that slab, as wide as the slab; and the round of water where a slab
    // falls and throws its wave (BERG.wave m about the place its upper part strikes). So the bergs of the ice's hand
    // stand from where that sight has swung clear, and the open hand's along the whole sea; each hand's bergs are
    // spread evenly over its own free water and the two hands' turns fall between one another's.
    const BERG = { every: 14.5, tall: [14, 28], gap: [9, 16], clear: 2.0, rock: [0.035, 0.03], bear: 60, wave: 6 + 34 * 0.55, water: 3 };
    const bergs = [];
    // the least distance on the water from a place to the flown line, against the line's place at every metre of
    // the voyage within reach m of the place either way (the line between two metres taken straight)
    const lineGap = (x, z, reach) => { let m = 1e9;
      for (let s = Math.max(0, Math.floor(-z - reach)); s < Math.min(P.ring, Math.ceil(-z + reach)); s++) { const ax = routeAt[s * 2], dx = routeAt[s * 2 + 2] - ax, t = clamp(((x - ax) * dx - z - s) / (dx * dx + 1), 0, 1); m = Math.min(m, Math.hypot(ax + dx * t - x, s + t + z)); }
      return m; };
    // the look's sight to its slab: is a round of r m about a place clear of every sight line from the look's window
    // (each metre of the voyage from the shore's turn to where the slab bears BERG.bear degrees) to the slab's place,
    // the sight as wide at each point as the slab is seen there (nothing at the eye, the slab's own width at the slab)
    const sightS1 = (() => { let s = towerS; for (let i = 0; i < 4; i++) s = towerS - Math.abs(is * towerX - xAt(s)) / Math.tan(BERG.bear * Math.PI / 180); return s; })();
    const sightClear = (x, z, r) => { const tx = is * towerX;
      for (let e = Math.floor(shoreTurn); e <= Math.ceil(sightS1); e++) { const ex = routeAt[e * 2], dx = tx - ex, ds = towerS - e, t = clamp(((x - ex) * dx + (-z - e) * ds) / (dx * dx + ds * ds), 0, 1);
        if (Math.hypot(ex + dx * t - x, e + ds * t + z) < r + t * CALVE.wide / 2) return false; }
      return true; };
    // a slab's fall: is a round of r m about a place clear of the water where any slab falls and throws its wave
    const fallClear = (x, z, r) => slabs.every((sl) => Math.hypot(x - is * (slabX - 0.87 * SLAB), z + sl.s) >= r + BERG.wave);
    // is a place on the water within m metres of a berg's waterline (the box of its half breadth and half length, turned as it is)
    const inBerg = (x, z, m) => bergs.some((g) => { const c = Math.cos(g.m.rotation.y), sn = Math.sin(g.m.rotation.y), dx = x - g.x, dz = z - g.z; return Math.abs(dx * c - dz * sn) < g.hb + m && Math.abs(dx * sn + dz * c) < g.ha + m; });
    const bergGeo = (tall, rad, sd) => {
      const g = new THREE.IcosahedronGeometry(1, 2), pa = g.getAttribute('position'), n = pa.count, col = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) {
        const px = pa.getX(k), py = pa.getY(k), pz = pa.getZ(k), nz = 0.6 + 0.8 * ctx.noise.fbm3(px * 1.3 + sd, py * 1.3, pz * 1.3 - sd, 3), up = py > 0 ? Math.pow(py, 0.7) : py * 0.45;
        const peak = 1 + 0.5 * Math.max(0, Math.sin(Math.atan2(pz, px) * 2 + sd)) * Math.max(py, 0);
        pa.setXYZ(k, px * rad * nz, up * tall * nz * peak * 0.95, pz * rad * nz * 0.8);
        const t = clamp(up * 1.2 + 0.25, 0, 1); col[k * 3] = lerp(iceBlue[0], pearl[0], t); col[k * 3 + 1] = lerp(iceBlue[1], pearl[1], t); col[k * 3 + 2] = lerp(iceBlue[2], pearl[2], t);
      }
      g.computeVertexNormals(); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aFx', new THREE.BufferAttribute(new Float32Array(n * 2), 2)); g.setAttribute('aWarm', new THREE.BufferAttribute(new Float32Array(n), 1));
      return g;
    };
    // A GREAT BERG'S SOLID, in its own frame (y = 0 its waterline, z along its length, x across its breadth): flat
    // faces over rings of corners, so every face catches the light as one plane. iceCol is one column of it: N
    // corners, each at its own share of the radius all the way up (ribs and flat cliffs), from 3 m under the water
    // to its top; its waterline is undercut (a notch under a lip 2.2 m up) and the foot under the lip is dark and
    // wet; it tapers as a block (a flat top, tilted) or as a horn (o.spire: blunt, four tenths of its foot's breadth at its top; the top is cut aslant by a share of ITS OWN BREADTH, 0.25 to 0.6 of the top's lesser half breadth from its middle to its rim, so that it is blunt from every side; the faces of a horn's last band, which the cut twists, are two triangles each with its own facing); it leans by o.lean m at its top. Colour by
    // height (blue ice below, pearl to white above, a face here and there of older, greener ice). o.inner (-1 or 1):
    // the faces that look that way across the berg, up to o.innerTop m, are the walls of an arch or a rift: they
    // are green-blue and give their own light, strongest low in the cleft.
    const bergWhite = linear('#f6f9fb'), bergWet = linear('#1f5f78', 0.8), bergOld = linear('#8fcfd0', 0.95), bergInner = linear('#22a9b4', 0.9);
    const iceCol = (b, q, o) => {
      const N = o.N, h = o.h, lip = Math.min(2.2, 0.3 * h), spire = o.spire, lv = spire ? [[-3, 1.02], [0.7, 0.88], [lip, 1], [0.3 * h, 0.88], [0.55 * h, 0.76], [0.8 * h, 0.6], [h, 0.42]] : [[-3, 1.02], [0.7, 0.88], [lip, 1], [0.38 * h, 0.96], [o.sh * h, 0.9], [(o.sh + 0.04) * h, 0.9 * o.ledge], [h, (o.top ?? 0.7) * o.ledge]];
      const rib = [], th = [], turn = q.range(0, 6.28), tilt = spire ? 0 : q.range(0.08, 0.3), rise = spire ? 0.42 * Math.min(o.ra, o.rb) * q.range(0.25, 0.6) : 0, ta = q.range(0, 6.28);
      for (let j = 0; j < N; j++) { rib.push(q.range(0.76, 1.12)); th.push(turn + (j + q.range(-0.28, 0.28)) / N * Math.PI * 2); }
      const ring = lv.map(([y, k], l) => th.map((a, j) => { const tt = Math.pow(clamp(y / h, 0, 1), 1.3), kk = k * rib[j] * (l > 2 ? q.range(0.93, 1.07) : 1);
        return [o.cx + o.lean[0] * tt + Math.cos(a) * o.rb * kk, l === lv.length - 1 ? (spire ? y + rise * Math.cos(a - ta) : y * (1 + tilt * Math.cos(a - ta))) : y, o.cz + o.lean[1] * tt + Math.sin(a) * o.ra * kk]; }));
      const face = (p0, p1, p2, p3, two) => {
        const ym = (p0[1] + p1[1] + p2[1] + p3[1]) / 4, xm = (p0[0] + p1[0] + p2[0] + p3[0]) / 4 - o.cx, zm = (p0[2] + p1[2] + p2[2] + p3[2]) / 4 - o.cz, up = clamp(ym / o.H, 0, 1);
        let col = up < 0.3 ? [0, 1, 2].map((i) => lerp(iceBlue[i], pearl[i], 0.72 + 0.93 * up)) : [0, 1, 2].map((i) => lerp(pearl[i], bergWhite[i], (up - 0.3) / 0.7));
        const r = q(); if (r < 0.16) col = [0, 1, 2].map((i) => lerp(col[i], bergOld[i], 0.55)); else col = col.map((v) => v * (0.92 + 0.5 * (r - 0.16) * 0.2));
        if (ym < lip) col = [0, 1, 2].map((i) => lerp(bergWet[i], col[i], 0.25 * clamp(ym / lip, 0, 1)));
        b.emit = 0;
        if (o.inner && ym > 0 && ym < o.innerTop && xm * o.inner > 0.25 * o.rb && Math.abs(zm) < 0.8 * o.ra) { col = bergInner; b.emit = 0.18 + 0.32 * (1 - ym / o.innerTop); }
        if (two) b.tri(p0, p1, p2, col).tri(p0, p2, p3, col); else b.quad(p0, p1, p2, p3, col); b.emit = 0;
      };
      for (let l = 0; l < lv.length - 1; l++) for (let j = 0; j < N; j++) { const j1 = (j + 1) % N; face(ring[l][j1], ring[l][j], ring[l + 1][j], ring[l + 1][j1], spire && l === lv.length - 2); }
      // the top: a fan from the last ring to a point a little over the middle of the ring's own cut
      const tr = ring[lv.length - 1], apex = [o.cx + o.lean[0], spire ? h + 0.5 * rise : h * (1.02 + 0.5 * tilt), o.cz + o.lean[1]];
      for (let j = 0; j < N; j++) { const j1 = (j + 1) % N; face(tr[j1], tr[j], apex, apex); }
    };
    // the kinds of great berg: 0 a pinnacled berg (rounds p1m3, p1m4): a block whose top stands at half the berg's
    // height or more AS BUILT (dealt 0.56 to 0.68 of it; the solid is then pressed so that its highest corner, a horn's
    // rim, stands at H: by 0.9 at the least, for a horn's cut rises 1.51 m at the most and no berg is under 14 m), crowned by four or five blunt horns, each on its own bearing round the
    // block's middle and none at the middle, one of the full height and the others 0.72 to 0.94 of it; a horn's foot
    // is near round, 0.36 to 0.52 of the block's LESSER half measure (so that a horn is a tower on the block and not
    // a blade along it). A law of the berg's own form, the same on every seed: a massive block under a crown, not
    // slim points over a low block; 1 a table with a tilted top and a shoulder; 2 an
    // arch: two piers and the bridge between them, the way through lying along the berg's length (the piers 0.7 of
    // that length, so that the way is wide for its depth); 3 a rift: two towers that lean together over a cleft. H its height, a its half length, bx its half breadth (m). Returns the
    // geometry, its highest corner brought to H exactly.
    const bergSolid = (q, kind, H, a, bx) => {
      const b = makeBag(), col = (o) => iceCol(b, q, { H, lean: [0, 0], sh: q.range(0.5, 0.75), ledge: q() < 0.5 ? q.range(0.62, 0.8) : 1, ...o });
      if (kind === 0) {
        col({ cx: 0, cz: 0, ra: a, rb: bx, h: H * q.range(0.56, 0.68), N: 11 });
        for (let i = 0, n = q.int(4, 5), a0 = q.range(0, 6.28); i < n; i++) { const ang = a0 + (i + q.range(-0.3, 0.3)) / n * 6.283, d = q.range(0.25, 0.5), r = Math.min(a, bx) * q.range(0.36, 0.52);
          col({ cx: Math.cos(ang) * d * bx, cz: Math.sin(ang) * d * a, ra: r * q.range(0.85, 1.15), rb: r * q.range(0.85, 1.15), h: H * (i ? q.range(0.72, 0.94) : 1), N: 7, spire: true, lean: [q.range(-0.08, 0.08) * H, q.range(-0.08, 0.08) * H] }); }
      } else if (kind === 1) {
        col({ cx: 0, cz: 0, ra: a, rb: bx, h: H * 0.8, N: 12, top: 0.78 });
        const ang = q.range(0, 6.28); col({ cx: Math.cos(ang) * 0.55 * bx, cz: Math.sin(ang) * 0.55 * a, ra: a * q.range(0.45, 0.6), rb: bx * q.range(0.45, 0.6), h: H * q.range(0.35, 0.55), N: 9 });
      } else {
        const g = kind === 2 ? q.range(6, 8) : q.range(2.2, 3.4), rp = (bx - g / 2) / 2, ap = kind === 2 ? 0.7 * a : a, hs = [H * 0.92, H * q.range(0.72, 0.9)], sw = q.sign();
        for (const sd of [-1, 1]) { const h = hs[sd * sw > 0 ? 0 : 1];
          col({ cx: sd * (g / 2 + rp), cz: 0, ra: ap, rb: rp, h, N: 9, top: 0.8, lean: [kind === 3 ? -sd * 0.25 * g : 0, q.range(-0.05, 0.05) * H], inner: -sd, innerTop: kind === 2 ? 0.62 * hs[1] : 0.9 * h }); }
        if (kind === 2) {
          // the bridge: a beam of six corners from pier to pier, its under side an arch and lit from within
          const yo = 0.6 * hs[1], ty = H * q.range(0.1, 0.14), M = 6, K = 6, x0 = g / 2 + 0.6 * rp, rz = Array.from({ length: K }, () => q.range(0.8, 1)), rr = [];
          for (let i = 0; i <= M; i++) { const x = lerp(-x0, x0, i / M), yc = yo + ty + 0.25 * g * Math.sin(Math.PI * i / M);
            rr.push(rz.map((r, k) => { const f = (k + 0.5) / K * Math.PI * 2; return [x, yc + Math.sin(f) * ty * q.range(0.85, 1.15), Math.cos(f) * ap * 0.82 * r]; })); }
          for (let i = 0; i < M; i++) for (let k = 0; k < K; k++) { const k1 = (k + 1) % K, under = Math.sin((k + 1) / K * Math.PI * 2) < -0.3;
            b.emit = under ? 0.3 : 0; b.quad(rr[i][k1], rr[i][k], rr[i + 1][k], rr[i + 1][k1], under ? bergInner : pearl); }
          b.emit = 0;
        }
      }
      const g = b.toGeometry(), pa = g.getAttribute('position'), na = g.getAttribute('normal'); let top = 0;
      for (let k = 0; k < pa.count; k++) top = Math.max(top, pa.getY(k));
      for (let k = 0, f = H / top; k < pa.count; k++) { if (pa.getY(k) > 0) pa.setY(k, pa.getY(k) * f); const nx = na.getX(k), ny = na.getY(k) / f, nz = na.getZ(k), l = Math.hypot(nx, ny, nz) || 1; na.setXYZ(k, nx / l, ny / l, nz / l); }
      return g;
    };
    {
      const br = S.bergs;
      // one great berg looms in the squall (stream loom): 16 to 20 m tall, 4 to 10 m beyond the squall's middle on the
      // hand the line swings toward as it leaves the ice, so it stands ahead where the squall's cloud thins with the air between; its
      // near side 14 to 18 m from the line (tested as the others are)
      { const lq = N.loom, tall = lq.range(16, 20), rad = tall * lq.range(0.7, 0.9), side = -is, s = sq + lq.range(4, 10); let x = xAt(s) + side * (rad + lq.range(14, 18));
        while (nearLine(x, -s) < rad + 14) x += side;
        const m = new THREE.Mesh(bergGeo(tall, rad, lq.range(0, 50)), iceMat); m.position.set(x, 0, -s); m.rotation.order = 'YXZ'; m.rotation.y = lq.range(0, 6.28); m.frustumCulled = false; scene.add(m); bergs.push({ m, x, z: -s, ph: lq.range(0, 6.28), rad }); }
      await ctx.yield();
      // THE GREAT BERGS ARE LAID, after the squall's great berg, so that none of them stands in it: the open hand's
      // free water ends BERG.water m before that berg's reach in plan (or at the squall, where that comes first); the
      // ice's hand's begins at the first metre from which the whole band a berg can stand in (BERG.gap[0] m to the
      // farthest reach of the broadest) lies clear of the look's sight. Of the n bergs each hand takes its share by
      // the length of its free water and spreads them evenly over it (a slot each); a berg's half length is BERG.long
      // of its slot, its half breadth BERG.broad m (an arch a fifth more). On the ice's hand a berg whose corners
      // would stand in the look's sight or in a slab's fall is narrowed from its far side (to 0.6 of its breadth at
      // the most), then carried up the voyage 2 m at a time; one that finds no place is not built. A berg is turned
      // BERG.turn rad either way by its draw; AN ARCH OR A RIFT IS LAID WITH ITS WAY THROUGH TOWARD THE LINE: its length
      // lies along the sight from its own middle to the line's place BERG.aim m down the voyage before it (a typed
      // figure, 45 m: about three and a half lengths of a berg, which is 7 to 20 m long as built and 13 m in the middle), a third of the dealt turn either way, so that whoever comes up the lane sees through it
      // from the bergs before it until it is nearly abeam. A rule of the berg's place, the same on every visit.
      // (round p1m4) EACH BERG'S SOLID DRAWS FROM A STREAM OF ITS OWN (the world's seed, the name bergSolid and the berg's
      // number in the lane): S.bergs deals only the kinds, each berg's measures, gap, turn, rocking phase and place in
      // its slot, so that a change to one kind's form moves no other berg's dice and no berg's place by the stream.
      {
        BERG.long = [0.27, 0.36]; BERG.broad = [7, 10]; BERG.turn = 0.2; BERG.aim = 45;
        const loom = bergs[0], rockK = Math.hypot(BERG.rock[0], BERG.rock[1]), open = -is, n = clamp(Math.round((P.squall - P.coast1) / BERG.every), 7, 11);
        let loomR = 0; { const pa = loom.m.geometry.getAttribute('position'); for (let k = 0; k < pa.count; k++) loomR = Math.max(loomR, Math.hypot(pa.getX(k), pa.getZ(k)) + rockK * Math.abs(pa.getY(k))); }
        const endO = Math.min(P.squall, -loom.z - loomR - BERG.water), far = BERG.gap[1] + 2 * 1.2 * 1.2 * BERG.broad[1];
        let sFree = P.squall; for (let s = Math.ceil(P.squall); s >= P.coast1; s--) { let ok = true; for (let d = BERG.gap[0]; d <= far && ok; d += 1) ok = sightClear(xAt(s) + is * d, -s, 0); if (!ok) break; sFree = s; }
        const lenO = endO - P.coast1, lenI = Math.max(P.squall - sFree, 0), mI = lenI < 2 * BERG.every ? 0 : Math.max(1, Math.round(n * lenI / (lenO + lenI))), mO = n - mI;
        const kinds = Array.from({ length: n }, () => (br() < 0.6 ? 0 : 1)), archAt = br.int(0, n - 1), riftAt = (archAt + br.int(2, n - 2)) % n, rift = br() < 0.5;
        kinds[archAt] = 2; if (n >= 9 || rift) kinds[riftAt] = 3;
        const slots = []; for (let k = 0; k < mO; k++) slots.push({ hand: open, s0: P.coast1 + k * lenO / mO, w: lenO / mO }); for (let k = 0; k < mI; k++) slots.push({ hand: is, s0: sFree + k * lenI / mI, w: lenI / mI });
        slots.sort((p, r) => p.s0 + p.w / 2 - r.s0 - r.w / 2);
        const endOf = { [open]: -1e9, [is]: -1e9 };
        // (the five poses of a rocking berg: at rest, and both swings at their far ends either way)
        const POSE = [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]], eu = new THREE.Euler(), mt = new THREE.Matrix4();
        for (let i = 0; i < n; i++) {
          const sl = slots[i], hand = sl.hand, kind = kinds[i], H = br.range(BERG.tall[0], BERG.tall[1]), a = sl.w * br.range(BERG.long[0], BERG.long[1]), bx = br.range(BERG.broad[0], BERG.broad[1]) * (kind === 2 ? 1.2 : 1);
          const gap = br.range(BERG.gap[0], BERG.gap[1]), turn = br.range(-BERG.turn, BERG.turn), ry = kind > 1 ? Math.atan2(-hand * (gap + bx), BERG.aim) + 0.3 * turn : turn, ph = br.range(0, 6.28), g = bergSolid(ctx.core.makeRng(ctx.core.hashSeed('bergSolid' + i + ':' + ctx.seed)), kind, H, a, bx), pa = g.getAttribute('position'), cr = Math.cos(ry), sr = Math.sin(ry);
          let s = sl.s0 + sl.w * (0.5 + br.range(-1, 1) * Math.max(0, 0.5 - 1.25 * a / sl.w - 0.5 * BERG.water / sl.w)), k = 1, x = xAt(s) + hand * (gap + bx), ok = false, lo = 0, hi = 0;
          const pm = POSE.map(([p, q]) => mt.makeRotationFromEuler(eu.set(p * BERG.rock[0], ry, q * BERG.rock[1], 'YXZ')).elements.slice()), d0 = new Float32Array(pa.count);
          for (let tries = 0; tries < 40 && !ok; tries++) {
            // (set across until its nearest corner, in the nearest of its five poses, stands gap m from the line and
            // 3 cm more, for the line is flown a little rounder than straight between two metres: every corner at
            // rest first, then the four swung poses of each corner that its swing could bring nearer than the nearest yet)
            for (let it = 0; it < 4; it++) { let d = 1e9;
              for (let c = 0; c < pa.count; c++) { const lx = k * pa.getX(c), lz = pa.getZ(c); d0[c] = lineGap(x + lx * cr + lz * sr, -s - lx * sr + lz * cr, 24); d = Math.min(d, d0[c]); }
              for (let c = 0; c < pa.count; c++) { const lx = k * pa.getX(c), ly = pa.getY(c), lz = pa.getZ(c); if (d0[c] - rockK * Math.abs(ly) - 0.1 > d) continue;
                for (let j = 1; j < 5; j++) { const e = pm[j]; d = Math.min(d, lineGap(x + e[0] * lx + e[4] * ly + e[8] * lz, -s + e[2] * lx + e[6] * ly + e[10] * lz, 24)); } }
              x += hand * (gap + 0.03 - d); }
            await ctx.yield();
            ok = true; lo = 1e9; hi = -1e9;
            for (let c = 0; c < pa.count; c++) { const lx = k * pa.getX(c), lz = pa.getZ(c), wx = x + lx * cr + lz * sr, wz = -s - lx * sr + lz * cr, r = rockK * Math.abs(pa.getY(c)) + 0.1;
              lo = Math.min(lo, -wz - r); hi = Math.max(hi, -wz + r); if (Math.hypot(wx - loom.x, wz - loom.z) < loomR + BERG.water || (hand === is && !(sightClear(wx, wz, r) && fallClear(wx, wz, r)))) ok = false; }
            if (lo < endOf[hand]) { s += endOf[hand] - lo + 0.01; x = xAt(s) + hand * (gap + bx); ok = false; } else if (!ok) { if (k > 0.62) k *= 0.92; else { s += 2; x = xAt(s) + hand * (gap + bx); } }
          }
          await ctx.yield();
          if (!ok) continue;
          if (k < 1) { const na = g.getAttribute('normal'); for (let c = 0; c < pa.count; c++) { pa.setX(c, pa.getX(c) * k); const nx = na.getX(c) / k, ny = na.getY(c), nz = na.getZ(c), l = Math.hypot(nx, ny, nz) || 1; na.setXYZ(c, nx / l, ny / l, nz / l); } }
          let rad = 0; for (let c = 0; c < pa.count; c++) rad = Math.max(rad, Math.hypot(pa.getX(c), pa.getZ(c)));
          endOf[hand] = hi + BERG.water;
          const m = new THREE.Mesh(g, iceMat); m.position.set(x, 0, -s); m.rotation.order = 'YXZ'; m.rotation.y = ry; m.frustumCulled = false; scene.add(m); bergs.push({ m, x, z: -s, ph, rad });
        }
      }
      await ctx.yield();
      // THE SEA'S OWN FACE TAKES THE BERGS' PLACES (the part's uBerg, uBergK, uBergS): each berg's middle, its half
      // breadth and half length at its waterline (its corners between the water and 3 m up), its turn and its height;
      // and the stretch of the voyage they stand in, three heights either way (as far as a berg's mirror lies)
      { let lo = 1e9, hi = -1e9;
        bergs.slice(0, NBERG).forEach((g, i) => { const pa = g.m.geometry.getAttribute('position'); let hb = 0, ha = 0, top = 0;
          for (let c = 0; c < pa.count; c++) { const y = pa.getY(c); top = Math.max(top, y); if (y > -0.5 && y < 3) { hb = Math.max(hb, Math.abs(pa.getX(c))); ha = Math.max(ha, Math.abs(pa.getZ(c))); } }
          g.hb = hb; g.ha = ha; g.top = top; sea.uniforms.uBerg.value[i].set(g.x, g.z, hb, ha); sea.uniforms.uBergK.value[i].set(Math.cos(g.m.rotation.y), Math.sin(g.m.rotation.y), top, 0); lo = Math.min(lo, -g.z - 3 * top); hi = Math.max(hi, -g.z + 3 * top); });
        sea.uniforms.uBergS.value.set(lo, hi); }
      // seracs (stream seracs): towers of ice 25 to 40 m tall standing in the sea before the face, 40 to 70 m from
      // the line on the ice's hand, one every 14 to 22 m from 60 m before the front's near corner to its far corner;
      // none where a slab of the face falls (abeam of a slab, within the slab's own height of its foot), none within a berg
      { const q = N.seracs, sb = makeBag(), iceC = [iceDeep, iceBlue, pearl];
        for (let s = P.front0 - 60 + q.range(0, 10); s < P.front1; s += q.range(14, 22)) { const tall = q.range(25, 40), R = q.range(4.5, 8), x = xAt(s) + is * (q.range(40, 70) + R), sd = q.range(0, 90), turn = q.range(0, 3), lean = q.range(-0.12, 0.12);
          if (slabs.some((sl) => Math.abs(s - sl.s) < CALVE.wide / 2 + 1.5 * R + 1 && Math.abs(x) + 2.5 * R + 5 > slabX - SLAB) || bergs.some((g) => Math.hypot(g.x - x, g.z + s) < g.rad + R)) continue;
          lump(sb, x, -3, -s, R, tall + 3, R * 0.8, sd, iceC, turn); lump(sb, x + lean * tall + R * 0.9, -2, -s + R * 0.7, R * 0.6, tall * 0.55, R * 0.6, sd + 7, iceC, turn + 1); }
        const m = new THREE.Mesh(sb.toGeometry(), iceMat); m.frustumCulled = false; scene.add(m); }
      await ctx.yield();
      // brash ice: small floes, never within 7 m of the line; they ride the swell. Two in five lie off the face; two in
      // five GATHER IN THE BERGS' LEE (the wind of this sea is off the ice: a floe of the lee lies on the side of its
      // berg away from the ice, from the berg's skin out to three of its reaches down the wind, the field widening
      // as it goes); one in five lies loose in the lane's water
      // (round p1m2) the brash has a stream of its own (N.brash), so that a change to the great bergs' laying moves no floe's dice
      const bq = N.brash;
      const cb = makeBag(); cb.box(0, -0.35, 0, 1, 0.75, 1, pearl, { taper: 0.7 });
      const list = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
      for (let i = 0, tries = 0; i < Math.round(220 * V.density) && tries < 3000; tries++) {
        const kd = bq(), near = kd < 0.4, lee = kd >= 0.6 ? bergs[bq.int(0, bergs.length - 1)] : null, d = lee ? lee.rad * (0.9 + 2.1 * bq() * bq()) : 0;
        const s = lee ? -lee.z + bq.range(-1, 1) * (0.5 * lee.rad + 0.35 * d) : bq.range(P.ice, P.front1 + 6), x = lee ? lee.x - is * d : near ? is * (FRONT - bq.range(2, 60) * bq()) : xAt(s) + bq.sign() * bq.range(7, 70), z = -s;
        if (nearLine(x, z) < 7 || bergs.some((g) => Math.hypot(g.x - x, g.z - z) < g.rad * 0.9)) continue;
        list.push([x, z, bq.range(0.5, 2.6) * (near ? 1.4 : 1), bq.range(0, 6.28), bq.range(0.5, 1.3)]); i++;
      }
      const im = new THREE.InstancedMesh(cb.toGeometry(), iceMat, Math.max(list.length, 1));
      list.forEach((f, i) => { E.set(0, f[3], 0); M.compose(new THREE.Vector3(f[0], 0, f[1]), Q.setFromEuler(E), new THREE.Vector3(f[2], f[4], f[2] * 0.8)); im.setMatrixAt(i, M); });
      im.count = list.length; im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield();
    // gold fish leaping in schools of 8 to 20 beside the route through the ice sea, in arcs 2 to 4 m high: every
    // school at its own place, 7 m or more from the line, each school on its own beat (the clock; a leap reads at any phase).
    // Every school is dealt as before the great bergs stood (no draw of its stream moves). A SCHOOL LEAPS IN OPEN WATER:
    // one dealt where a berg stands (its middle within 5 m of a berg's waterline box) leaps at its own distance on the
    // other hand of the line, or else at the nearest metre of the voyage either way, on either hand, within FISH_CARRY m
    // (20: past the longest berg and its water), where the water is open and the line 7.5 m off; one that finds
    // none stays as dealt. A fish that would leap through ice is drawn in toward its school's middle or left out.
    // aA = (leap's middle x, z, heading, length m), aB = (period s, phase, height m, size m)
    {
      const fr = S.fish, A = [], B = [];
      for (let s = P.ice + 8, k = 0; s < P.squall - 4; s += fr.range(10, 17), k++) {
        const side0 = k % 2 ? 1 : -1, off = fr.range(8, 19), n = Math.round(fr.int(8, 20) * Math.min(V.density, 1.2)), hj = fr.range(-0.5, 0.5), tin = fr() < 0.3, per = fr.range(2.4, 3.6), ph0 = fr(), FISH_CARRY = 20;
        if (nearLine(xAt(s) + side0 * off, -s) < 7.5) continue;
        let side = side0, sc = s;
        find: for (let e = 0; e <= FISH_CARRY; e++) for (const f of e ? [e, -e] : [0]) for (const h of [side0, -side0]) {
          const q = s + f, x = xAt(q) + h * off; if (q < P.ice + 8 || q > P.squall - 4) continue;
          if (nearLine(x, -q) >= 7.5 && !inBerg(x + h * 1.5, -q, 5)) { side = h; sc = q; break find; } }
        const cx = xAt(sc) + side * off, head = Math.PI + hj + (tin ? side * -0.5 : 0);
        // (one period to a school; a fish differs from its school by a fixed share of the beat)
        for (let i = 0; i < n; i++) { const t = fr(), ox = fr.gauss() * 1.6 + side * 1.5, oz = fr.gauss() * 2.4; A.push(cx + ox, -sc + oz, head + fr.gauss() * 0.12, fr.range(4, 7)); B.push(per, ph0 + t * 0.3 + (fr() < 0.5 ? 0.5 : 0), fr.range(2, 4), fr.range(0.9, 1.4));
          // (NO FISH LEAPS THROUGH ICE: one whose leap, at its two ends or its middle, would pass within 1.5 m of a berg's
          // waterline box is drawn in toward its school's middle, to half and then to a quarter of its dealt place about
          // it; one that still would is not there)
          { const k = A.length - 4, hx = Math.sin(A[k + 2]) * A[k + 3] / 2, hz = Math.cos(A[k + 2]) * A[k + 3] / 2, mx = cx + side * 1.5, hit = (f) => [-1, 0, 1].some((e) => inBerg(mx + (ox - side * 1.5) * f + e * hx, -sc + oz * f + e * hz, 1.5));
            let f = 1; while (f > 0.2 && hit(f)) f /= 2;
            if (f > 0.2) { A[k] = mx + (ox - side * 1.5) * f; A[k + 1] = -sc + oz * f; } else { A.length -= 4; B.length -= 4; } } }
      }
      const g = new THREE.InstancedBufferGeometry(), v = [0, 0, .5, 0, .17, .08, 0, -.15, .08, 0, .17, .08, 0, 0, -.32, 0, -.15, .08, 0, 0, -.32, 0, .2, -.55, 0, -.2, -.55, 0, 0, .5, -.1, 0, .05, .1, 0, .05, -.1, 0, .05, 0, 0, -.32, .1, 0, .05];
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4)); g.instanceCount = A.length / 4;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: seas.uniforms, side: THREE.DoubleSide,
        vertexShader: GLSL_SEAS + GLSL_FLOAT + /* glsl */`attribute vec4 aA; attribute vec4 aB; varying vec3 vCol;
          void main(){
            float ph = fract(uTime / aB.x + aB.y), a = ph / .44, vis = step(a, 1.);
            vec2 dir = vec2(sin(aA.z), cos(aA.z)), xz = aA.xy + dir * aA.w * (a - .5);
            vec3 c = vec3(xz.x, surfaceH(aA.xy) - .25 + aB.z * 4. * a * (1. - a), xz.y);
            vec3 fwd = normalize(vec3(dir.x * aA.w, aB.z * 4. * (1. - 2. * a), dir.y * aA.w)), sd = normalize(cross(fwd, vec3(0., 1., 0.))), up = cross(sd, fwd);
            float wag = sin(uTime * 19. + aB.y * 40.) * .12 * (.5 - position.z);
            vec3 p = c + (fwd * position.z + up * position.y + sd * (position.x + wag)) * aB.w * vis;
            vec3 lit = seaLight(normalize(up + sd * sign(position.x + .001) * .5), c, vec3(1., .62, .12), .6);
            vCol = lit * 1.5 + vec3(1., .66, .16) * (.5 + .9 * smoothstep(-.1, .17, position.y));
            vCol *= exp(-seaDepth(c));
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }` }));
      m.frustumCulled = false; scene.add(m);
    }
    // mist rolling in the join before the ice, violet: its cloud is centred on the join's own place (P.ice)
    const mist = fx.makeMist({ rng: S.mist, count: 70, area: [460, 16, 110], center: [0, 9, -P.ice], size: [26, 58], color: '#b8a8dc', opacity: 0.3, drift: [1.8, 0, 0.5], time: seas.uniforms.uTime });
    scene.add(mist.object);
    await ctx.yield();
    // ---- SEA 6: the funnels of fire, hung from the sky over the blue wings of the sea on either hand of the bay of
    // night (two to four by the visit, sides by turn, each 130 to 240 m outside the bay's edge). Each is the sky's own
    // blue drawn down in a dish 220 m across, torn at the middle into a throat of falling fire, 60 m wide under the
    // dish and 14 m wide in its lowest 120 m, fraying out 5 to 15 m over the water; a patch of sea boils under it.
    // One more hangs NEAR: over the far part of the blue sea, its foot 19 to 23 m off the line (the line leans toward it).
    // Every funnel's foot sways on its own seeded phase, by at most a quarter of its distance from the line (16 m at most).
    const funnels = [];
    {
      const fr = S.funnels, side0 = fr.sign(), B = seas.uniforms.uBay.value, pos = [], dat = [], sw = [], idx = [], NH = 34, NA = 40;
      for (let i = 0; i < V.nFunnels; i++) {
        const side = i % 2 ? -side0 : side0, s = P.star + 330 + i * fr.range(100, 150) + fr.range(0, 60), x = side * (B.z + (s - B.x) / B.y + fr.range(130, 240)), top = fr.range(250, 300), tip = fr.range(5, 15);
        funnels.push({ x, z: -s, top, tip, ph: fr.range(0, 6.28) });
      }
      { const nf = V.nearFunnel; funnels.push({ x: xAt(nf.s) + nf.side * nf.off, z: -nf.s, top: nf.top, tip: nf.tip, ph: nf.ph }); }
      for (const f of funnels) {
        const x = f.x, s = -f.z, top = f.top, tip = f.tip; f.sway = Math.min(16, nearLine(x, f.z) / 4);
        const base = pos.length / 3, yDish = top - 110, yThin = tip + 120;
        for (let k = 0; k <= NH; k++) {
          const t = k / NH, y = t < 0.4 ? lerp(tip, yThin, t / 0.4) : t < 0.7 ? lerp(yThin, yDish, (t - 0.4) / 0.3) : lerp(yDish, top, (t - 0.7) / 0.3);
          const r = t < 0.4 ? 7 : t < 0.7 ? lerp(7, 30, Math.pow((t - 0.4) / 0.3, 1.6)) : 30 + 80 * Math.pow((t - 0.7) / 0.3, 2.3);
          for (let j = 0; j <= NA; j++) { const a = j / NA * Math.PI * 2; pos.push(x + Math.cos(a) * r, y, -s + Math.sin(a) * r); dat.push(a, t, f.ph, (y - tip) / (top - tip)); sw.push(f.sway); }
        }
        for (let k = 0; k < NH; k++) for (let j = 0; j < NA; j++) { const a = base + k * (NA + 1) + j, c = a + NA + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
        // the boiling patch
        const b2 = pos.length / 3; pos.push(x, 0.6, -s); dat.push(0, -1, f.ph, 0); sw.push(0);
        for (let j = 0; j <= 16; j++) { const a = j / 16 * Math.PI * 2; pos.push(x + Math.cos(a) * 60, 0.6, -s + Math.sin(a) * 60); dat.push(a, -2, f.ph, 0); sw.push(0); }
        for (let j = 0; j < 16; j++) idx.push(b2, b2 + 1 + j, b2 + 2 + j);
      }
      // the fire's road on the water under each (the sea's shader mirrors a light 60 m up in each throat)
      funnels.slice(0, NFUN).forEach((f, i) => sea.uniforms.uFunP.value[i].set(f.x, 60, f.z, 1));
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(dat, 4)); g.setAttribute('aSw', new THREE.Float32BufferAttribute(sw, 1)); g.setIndex(idx);
      const fc = new THREE.Color(V.fire);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...seas.uniforms, ...skyU, uFireC: { value: fc } }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`uniform float uTime; attribute vec4 aF; attribute float aSw; varying vec4 vF; varying vec3 vWp;
          void main(){ vF = aF; vec3 p = position; float low = 1. - clamp(aF.w, 0., 1.), ph = aF.z;
            if (aF.y >= 0.) p.xz += vec2(sin(uTime * .21 + ph + p.y * .012), cos(uTime * .17 + ph * 1.7 + p.y * .009)) * aSw * low * low;
            vWp = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
        fragmentShader: fx.GLSL_NOISE + GLSL_SEAS + GLSL_SKY + /* glsl */`uniform vec3 uFireC; varying vec4 vF; varying vec3 vWp;
          void main(){
            float dth = hash12(gl_FragCoord.xy + 1.3) * .96 + .02;
            vec3 fire = uFireC * 3.;
            if (vF.y < -.5){
              // the patch of sea that boils under the frayed tip
              float r = -vF.y - 1., b = fbm(vec2(vF.x * 3., r * 6. - uTime * .8) + vF.z * 1.4) * smoothstep(1., .1, r);
              if (b * 1.5 < dth + .25) discard;
              gl_FragColor = vec4(seaFog(mix(fire * .5, vec3(2.4, 1.7, .7), smoothstep(.45, .8, b)) * b, vWp, .6), 1.); return;
            }
            float t = vF.y, a = vF.x + uTime * .32 + vWp.y * .014 + vF.z; vec2 q = vec2(cos(a), sin(a));
            float dish = smoothstep(.62, .8, t);
            float st = fbm(vec3(q * mix(2.1, 3.2, dish), vWp.y * .021 - uTime * .2 + vF.z * .8));
            float fine = vnoise(vec3(q * 8., vWp.y * .1 - uTime * 1.1));
            float fall = vnoise(vec3(q * 4.5, vWp.y * .045 + uTime * 2.4)) * .65 + vnoise(vec3(q * 11., vWp.y * .14 + uTime * 5.)) * .35;
            vec3 hot = mix(fire * .55, vec3(3.2, 2.2, .75), fall * fall) * (.45 + .75 * fall);
            // the frayed tip and the torn rim
            float alpha = smoothstep(.0, .16, t + (fine - .5) * .16) * (1. - smoothstep(.74, 1., t + (st - .5) * .55));
            if (alpha < dth) discard;
            vec3 blue = seaRowS(4., uBlueStar.x).rgb;
            vec3 sheath = blue * (.28 + .9 * st) + fire * .1 * (1. - dish) + hot * .12 * (1. - dish);
            float open = mix(smoothstep(.36, .56, st + (.5 - t) * .5), smoothstep(.56, .7, st) * (1. - dish) * .8, smoothstep(.3, .7, t));
            vec3 col = gl_FrontFacing ? mix(sheath, hot, open) : mix(hot, sheath * .6, dish);
            // near its rim the dish is the sky itself, seen through the red wall's air where that stands between
            // (the fog's own colour by its own depth, as much as the air where the fog is seen is the red wall's:
            // the part's seaFogCol; in the blue sea's air there is none of it and the rim is the sky as before)
            vec3 skyc = skyCol(normalize(vWp - cameraPosition), cameraPosition, 0.); float tr = seaDepth(vWp);
            skyc = mix(skyc, seaFogCol(vWp, tr), (1. - exp(-tr)) * smoothstep(.09, .25, seaAt(6., mix(cameraPosition.xz, vWp.xz, seaFogAt(cameraPosition.z, vWp.z, tr))).a));
            col = mix(seaFog(col, vWp, .45 * open), skyc, smoothstep(.84, 1., t));
            gl_FragColor = vec4(col, 1.);
          }` }));
      m.frustumCulled = false; scene.add(m);
    }
    // THE EMBERS FALL BESIDE THE WAY, NEVER ACROSS IT: a rule of place, the same for every funnel on every seed. Under
    // each funnel the fire falls in a box EMBER.box m on a side about the funnel's own place (EMBER.rate embers at full
    // detail: the fall's density). An ember is a body up to EMBER.wide m wide, and the kit wraps it into its box after
    // its wander (its middle never leaves the box: nothing is owed for wander). So the box's face toward the line keeps
    // EMBER.clear m of clear air and the widest ember's half width from the line along the whole of its length (and
    // EMBER.bend m more for the line's bend between two tested places): tested against the route's place at every
    // metre of the voyage abeam of the box, from that distance before its near end to that distance beyond its far
    // end. Where the full box would come nearer it is narrowed from the line's side (never past the funnel's own
    // middle: the fall stays under its throat) and its middle moves to the funnel's far side; the embers go with the
    // box's volume, so the fall is as dense there as under any funnel. A funnel far from the line keeps the full box.
    const EMBER = { box: 70, rate: 420, wide: 1.4, clear: 2.0, bend: 0.1 };
    const embers = funnels.map((f) => {
      const h = EMBER.box / 2, keep = EMBER.clear + EMBER.wide / 2 + EMBER.bend, sf = -f.z, side = Math.sign(f.x - routeAt[clamp(Math.round(sf), 0, P.ring) * 2]) || 1;
      let reach = -1e9;
      for (let s = Math.max(0, Math.floor(sf - h - keep)); s <= Math.min(P.ring + 1, Math.ceil(sf + h + keep)); s++) reach = Math.max(reach, side * routeAt[s * 2]);
      const cut = clamp(reach + keep - (side * f.x - h), 0, h);
      const e = fx.makeParticles({ rng: S.embers, preset: 'embers', follow: false, center: [f.x + side * cut / 2, f.tip + 24, f.z], box: [EMBER.box - cut, EMBER.box, EMBER.box], count: Math.round(EMBER.rate * detail * (1 - cut / EMBER.box)), velocity: [0.6, -9, 0.4], velocityRandom: [3, 4, 3],
        size: [0.5, EMBER.wide], fadeUp: 0, time: seas.uniforms.uTime, fog: false }); scene.add(e.object); return e; });
    await ctx.yield();
    // fourteen sea-horses, seven on either hand, 5 to 11 m off the line: A HERD THAT RUNS ITS LANE OF THE BLUE SEA ON
    // THE WORLD CLOCK, whoever comes. The lane lies along the line from the red wall's far face to 40 m beyond the
    // lift's foot; the herd runs it at one speed (0.55 to 0.7 of the boat's own way across this sea: stream pass;
    // so whoever sails the lane overhauls horse after horse), each horse a fixed share of the lap from the next of
    // its hand (seven evenly round the lap, so at every moment one of each hand is within a seventh of the lane of
    // any place on it) with a bounded drift of its own. They rise beyond the red wall, peel outward nearing the star
    // islands and go under; under the water a horse is at the lane's head again. Surge, arch and plunge run on the
    // clock, each on its own beat.
    // THE LANES lie HERD.near to HERD.far m off the line, one horse to a lane on either hand. A horse is a body: its
    // skin as drawn reaches HERD.skin m from its middle across the lane (its own half width and fins, 0.45 m, and its
    // side drift of 0.8 m). THE MARGIN IS A RULE OF THE PLACE, FOR EVERY SEED: the nearest lane's offset (HERD.near m
    // and more) less the skin, HERD.near - HERD.skin m of clear water between a horse and the line across its lane.
    const HERD = { near: 5, far: 11, skin: 1.25 };
    const horses = [], hr = S.horses, LANE = { from: P.wall1, len: P.lift + 40 - P.wall1 }, herdV = (L / 48) * (1 - 0.22) * N.pass.range(0.55, 0.7);
    for (let i = 0; i < 14; i++) horses.push({ side: i % 2 ? 1 : -1, off: HERD.near + (HERD.far - HERD.near) * ((Math.floor(i / 2) + hr.range(0.1, 0.9)) / 7), start: ((Math.floor(i / 2) * 3) % 7 + hr()) / 7, ph: hr.range(0, 6.28), per: hr.range(2.1, 3.1), amp: hr.range(0.7, 1.0), size: hr.range(0.92, 1.08) });
    const horseMat = litMaterial(seas, { side: THREE.DoubleSide, lamp: '#000000', uniforms: { uRimC: { value: new THREE.Color(V.fire) } }, fragPars: 'uniform vec3 uRimC;',
      frag: /* glsl */`{ vec3 vv = normalize(cameraPosition - vWp); float rim = pow(1. - clamp(dot(n, vv), 0., 1.), 2.6);
          vec3 kd2 = seaAt(9., vWp.xz).xyz; kd2 /= max(length(kd2), 1e-3);
          // wet black: the back takes the sky's blue, the edges the fire's orange, a hard glint from the key
          glowAdd += seaAt(4., vWp.xz).rgb * max(n.y * .8 + .3, 0.) * .5 + uRimC * rim * rim * (1.1 - .6 * n.y) * 1.6
            + seaAt(8., vWp.xz).rgb * pow(clamp(dot(reflect(-vv, n), kd2), 0., 1.), 24.) * .9; }` });
    const horseMesh = new THREE.InstancedMesh(seaHorseGeometry(), horseMat, 14); horseMesh.frustumCulled = false; scene.add(horseMesh);
    // spray at their chests: two crossed sheets a horse, standing on the water where it breaks the surface
    const sprayG = new THREE.BufferGeometry();
    sprayG.setAttribute('position', new THREE.Float32BufferAttribute([-1.3, 0, 0, 1.3, 0, 0, 1.3, 1.9, 0, -1.3, 1.9, 0, 0, 0, -1.3, 0, 0, 1.3, 0, 1.9, 1.3, 0, 1.9, -1.3], 3));
    sprayG.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2)); sprayG.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    const sprayMesh = new THREE.InstancedMesh(sprayG, new THREE.ShaderMaterial({ uniforms: seas.uniforms, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vWp; varying float vK; void main(){ vUv = uv; vK = length(instanceMatrix[0].xyz); vec4 wp = instanceMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: fx.GLSL_NOISE + GLSL_SEAS + /* glsl */`varying vec2 vUv; varying vec3 vWp; varying float vK;
        void main(){
          float x = vUv.x * 2. - 1., j = fbm(vec2(vWp.x * 1.4 + vWp.z * 1.1, vWp.y * 1.6 - uTime * 3.2));
          float a = smoothstep(.3, .75, j + .35 - vUv.y * .8) * (1. - x * x) * (1. - vUv.y) * clamp(vK * 1.3, 0., 1.);
          if (a < hash12(gl_FragCoord.xy + 9.1) * .9 + .06) discard;
          vec3 col = vec3(.78, .84, 1.) * (seaAt(10., vWp.xz).rgb * 2.2 + seaAt(8., vWp.xz).rgb * .3);
          gl_FragColor = vec4(seaFog(col, vWp, 0.), 1.);
        }` }), 14);
    sprayMesh.frustumCulled = false; scene.add(sprayMesh);
    const hM = new THREE.Matrix4(), hQ = new THREE.Quaternion(), hE = new THREE.Euler(0, 0, 0, 'YZX'), hP = new THREE.Vector3(), hS = new THREE.Vector3();
    const placeHorses = (time) => {
      const run = P.lift + 40 - P.star - 10;
      horses.forEach((h, i) => {
        const phi = time * 6.2832 / h.per + h.ph, lap = (time * herdV / LANE.len + h.start) % 1, sh = LANE.from + lap * LANE.len + 2.5 * Math.sin(time * 0.23 + h.ph) + 0.9 * Math.sin(phi - 0.8);
        const q = clamp((sh - (P.star + 10)) / run, 0, 1), off = h.off + 34 * q * q, x = xAt(sh) + h.side * off + 0.8 * Math.sin(time * 0.31 + h.ph * 3), z = -sh;
        const up = smoothstep(P.wall1, P.wall1 + JOIN, sh) * (1 - smoothstep(0.5, 0.95, q)), w = seas.heightAt(x, z, time), lift = Math.sin(phi) * h.amp;
        hP.set(x, w - 0.1 * h.size + lift - (1 - up) * 4.6, z); hE.set(0, Math.PI / 2 - Math.atan(h.side * 68 * q / run), 0.1 + 0.3 * Math.cos(phi)); hS.setScalar(h.size);
        hM.compose(hP, hQ.setFromEuler(hE), hS); horseMesh.setMatrixAt(i, hM);
        // the spray is greatest as the chest drives up through the surface and again as the head goes under
        const k = up * (0.35 + 0.65 * Math.pow(Math.abs(Math.cos(phi)), 1.5));
        hP.set(x, w - 0.1, z - 0.35); hE.set(0, h.ph, 0); hS.set(k * h.size, k * h.size * (0.7 + 0.3 * Math.abs(Math.cos(phi))), k * h.size); hM.compose(hP, hQ.setFromEuler(hE), hS); sprayMesh.setMatrixAt(i, hM);
      });
      horseMesh.instanceMatrix.needsUpdate = true; sprayMesh.instanceMatrix.needsUpdate = true;
    };
    placeHorses(0);
    await ctx.yield();
    // ---- SEA 7: the archipelago of stars. Island 1 to port and island 2 to starboard (shores 45 and 50 m from the
    // line), island 3 the ring round the portal with a saddle in its near rim; five to eight far islands inside the
    // bay of night, each in its own place by the visit, and their doors in the ceiling.
    // The two near islands' columns each have a character of their own (stream columns): over one the birds rise
    // slowly in wide loose spirals from far out on the water (R x 0.8 to R + 30 m from its middle, so the line passes
    // through their outer sheets), its pillar narrow with its light lying low; over the other they rise fast and
    // straight in narrow sheets, its pillar wide with its light lying high. The ring keeps the first form.
    const cq = N.columns;
    const slow = (R) => ({ rise: { speed: [cq.range(4.5, 5.5), cq.range(7, 9)], turn: [1.2, cq.range(1.9, 2.5)], wide: [0.5, cq.range(0.9, 1.2)], from: [R * 0.8, R + 30] }, pillar: { width: cq.range(0.62, 0.78), rise: cq.range(5, 7), low: cq.range(0.75, 0.9) } });
    const fast = () => ({ rise: { speed: [cq.range(11, 13), cq.range(15, 18)], turn: [0.15, cq.range(0.5, 0.8)], wide: [0.15, cq.range(0.3, 0.45)] }, pillar: { width: cq.range(1.08, 1.22), rise: cq.range(13, 16), low: cq.range(0.15, 0.3) } });
    const isles = [
      { x: ISLE.x, z: -(P.lift - 15), R: ISLE.R, H: 34, ring: null, saddle: null, points: Math.round(9000 * detail), column: 0.12, birds: Math.round(6000 * detail), door: 50, far: false, ...slow(ISLE.R) },
      { x: 125, z: -(P.lift + 50), R: 75, H: 48, ring: null, saddle: null, points: Math.round(12000 * detail), column: 0.12, birds: Math.round(8000 * detail), door: 66, far: false, ...fast() },
      { x: 0, z: -P.ring, R: 80, H: 55, ring: { inner: 45, crest: 62 }, saddle: { dir: 1, half: 22, low: 25 }, points: Math.round(17000 * detail), column: 0.14, birds: Math.round(16000 * detail), door: 85, far: false },
    ];
    {
      const ir = S.islands, B = seas.uniforms.uBay.value;
      for (let i = 0, tries = 0; i < V.nFar && tries < 200; tries++) {
        const s = P.ring + 150 + (i + ir.range(0.1, 0.9)) * 1100 / V.nFar, R = ir.range(55, 110), half = B.z + (s - B.x) / B.y - R - 40, x = ir.range(-1, 1) * half;
        if (isles.some((o) => Math.hypot(o.x - x, o.z + s) < (o.R + R) * 1.5) || Math.abs(x) < 50 && s < P.ring + 400) continue;
        isles.push({ x, z: -s, R, H: R * ir.range(0.45, 0.8), ring: null, saddle: null, points: Math.round(2600 * detail), column: 0.2, birds: Math.round(2400 * detail), door: R * 0.8, far: true }); i++;
      }
      // glows of islands farther still, out to 3 km: doors only
      const doors = isles.map((o) => [o.x, o.z, o.door, 1]);
      for (let i = 0; doors.length < NDOOR; i++) { const s = ir.range(2300, 3000), half = B.z + (s - B.x) / B.y - 150; doors.push([ir.range(-1, 1) * half, -s, ir.range(60, 110), 0.45]); }
      doors.slice(0, NDOOR).forEach((d, i) => skyU.uDoors.value[i].set(d[0], d[1], d[2], d[3]));
      // each door's own outline (stream rents): which way it is drawn out, by how much, and where in the noise its torn edge lies
      skyU.uDoorK.value.forEach((k) => { const t = N.rents.range(0, Math.PI), asp = N.rents.range(0.6, 1.5); k.set(Math.cos(t), Math.sin(t), asp, N.rents.range(0, 90)); });
      isles.slice(0, NISL).forEach((o, i) => seas.uniforms.uIsl.value[i].set(o.x, o.z, o.R, o.H));
    }
    // the points keep clear of the route (none within 14 m of the eye's line, in the plane across the voyage)
    const clearOfRoute = (x, y, z) => { const s = Math.round(-z); if (s < 0 || s > P.ring + 40) return true; const k = Math.min(s, P.ring) * 2; return Math.hypot(x - routeAt[k], y - routeAt[k + 1]) > 14; };
    // (a place's distance from the line: in the plane across the voyage at its own metre; beyond the line's end, from that end)
    const lineDist = (x, y, z) => { const sv = clamp(Math.round(-z), 0, P.ring), k = sv * 2; return Math.hypot(x - routeAt[k], y - routeAt[k + 1], Math.max(-z - P.ring, 0), Math.max(z, 0)); };
    const stars = await makeStarIslands(ctx, isles, { rng: S.heaps, seas, clear: clearOfRoute, lineDist }); scene.add(stars.mesh);
    await ctx.yield();
    const columns = makeColumns(isles, { seas }); scene.add(columns.mesh);
    await ctx.yield();
    // (the gold birds keep clear of the line by place: no bird's course within BIRD_OFF m of it in the plane across
    // the voyage, which is 3 m or more in space; where the line passes through a column's edge the sheets part round it)
    const BIRD_OFF = 3.5; let routeTop = 0; for (let k = 1; k < routeAt.length; k += 2) routeTop = Math.max(routeTop, routeAt[k]);
    const birdClear = (x, y, z) => { const s = Math.round(-z); if (s < 0 || s > P.ring) return true; const dx = x - routeAt[s * 2], dy = y - routeAt[s * 2 + 1]; return dx * dx + dy * dy > BIRD_OFF * BIRD_OFF; };
    // (the bearings from an island on which the line lies within the birds' reach of it, widened by the clearance)
    const lineBearings = (sp) => { const reach = 1.5 * sp.R + 50, bins = new Uint8Array(256); let any = false;
      for (let s = Math.max(0, Math.floor(-sp.z - reach)); s <= Math.min(P.ring, Math.ceil(-sp.z + reach)); s++) { const dx = routeAt[s * 2] - sp.x, dz = -s - sp.z, r = Math.hypot(dx, dz); if (r > reach) continue;
        const a = Math.atan2(dz, dx), w = r < 6 ? Math.PI : Math.min(Math.PI, (BIRD_OFF + 1.5) / r); for (let b = Math.floor((a - w) * 256 / 6.2832); b <= Math.floor((a + w) * 256 / 6.2832); b++) bins[((b % 256) + 256) % 256] = 1; any = true; }
      return any ? bins : null; };
    const gold = await makeGoldenBirds(ctx, isles, { rng: S.gold, seas, clear: birdClear, clearTop: routeTop + BIRD_OFF + 2, clearNear: lineBearings }); scene.add(gold.mesh);
    await ctx.yield();
    // ---- the loud birds on our rail (four to six by the visit): a habit of the boat. They are on the cap rail from
    // the first metre to the last; perched, they hop, turn on each other and flap, each on its own beat. Two never
    // leave. Each of the others, on its own seeded period of the clock (11 to 19 s), tips forward off the rail, flies
    // one closed loop outboard of its own perch (a ring 2.2 to 3.4 m in radius, drawn out 1.3 times along the hull,
    // that touches the rail only at the perch and rises 1.6 to 2.8 m; flown in 3.2 to 4.2 s, setting out the way
    // the bird faces) and sets its feet down where it left. No bird is ever inboard of the rail in the air.
    const perch = [];
    {
      const pr = S.perch, n = clamp(Math.round(5 * V.density), 4, 6), g = perchBirdGeometry();
      await ctx.yield();
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1, f = 2.1 + 2.3 * ((Math.floor(i / 2) + pr.range(0.15, 0.85)) / Math.ceil(n / 2));
        // uBird = (wings open 0..1, its flap's phase, in flight 0..1: the wings then beat across the back, which is uppermost)
        const U = { uBird: { value: new THREE.Vector3(0, pr.range(0, 6.28), 0) } };
        const mat = litMaterial(seas, { side: THREE.DoubleSide, lamp: '#000000', uniforms: U, vertPars: 'uniform vec3 uBird;',
          vert: /* glsl */`if (aFx.y > 2.5){ float sd = aFx.y < 3.5 ? -1. : 1.; vec3 o = vec3(sd * .08, .37, .03), q = p - o; float ox = q.x * sd, a = .2 + .75 * sin(uTime * 17. + uBird.y);
            vec3 fold = o + vec3(sd * ox * .1, q.y - ox * .32, q.z - ox * .8), open = o + vec3(sd * ox * cos(a), q.y + ox * sin(a) * (1. - uBird.z), q.z - ox * sin(a) * uBird.z);
            p = mix(fold, open, uBird.x); }` });
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.rotation.order = 'YXZ'; bowG.add(m);
        const per = pr.range(11, 19), face = pr.range(-0.6, 0.6) + (pr() < 0.5 ? 0 : Math.PI);
        perch.push({ m, U, side, f, stays: i < 2, per, start: pr(), air: pr.range(3.2, 4.2) / per, R: pr.range(2.2, 3.4), up: pr.range(1.6, 2.8), way: Math.cos(face) < 0 ? -1 : 1, ph: pr.range(0, 6.28), beat: pr.range(0.7, 1.3), face });
        await ctx.yield();
      }
    }
    const placePerch = (time) => {
      for (const b of perch) {
        // where it is in its beat: th runs 0..1 over a flight and is 0 while it sits; a is its way round the ring
        // (slow off the rail and slow back on to it); e is 1 in the air, 0 with its feet on the rail
        const c = b.stays ? 1 : (time / b.per + b.start) % 1, th = c < b.air ? c / b.air : 0, a = 2 * Math.PI * th * th * (3 - 2 * th), e = smoothstep(0, 0.12, th) * (1 - smoothstep(0.88, 1, th));
        // perched: a hop and a side step now and then, a lunge at its neighbour, a flap to keep its feet
        const hop = Math.pow(Math.max(0, Math.sin(time * 1.7 * b.beat + b.ph)), 6), lunge = Math.pow(Math.max(0, Math.sin(time * 0.9 * b.beat + b.ph * 2.3)), 4), flap = Math.pow(Math.max(0, Math.sin(time * 0.55 * b.beat + b.ph * 1.3)), 10);
        const f = b.f + 0.16 * Math.sin(time * 0.43 * b.beat + b.ph), px = b.side * (bowHalf(f) - 0.07), py = bowDeck(f) + BOW.rail;
        b.m.position.set(px + b.side * b.R * (1 - Math.cos(a)), py + 0.07 * hop * (1 - e) + b.up * (0.5 - 0.5 * Math.cos(a)), -f + b.way * 1.3 * b.R * Math.sin(a));
        // in the air the bird lies level along its way round the ring, head first, wings beating; it comes upright as
        // it sets its feet on the rail and tips forward again as it leaves
        const sit = b.face + 0.5 * Math.sin(time * 0.6 * b.beat + b.ph); let turn = Math.atan2(b.side * Math.sin(a), b.way * 1.3 * Math.cos(a)) - sit; turn -= Math.round(turn / (2 * Math.PI)) * 2 * Math.PI;
        b.m.rotation.set(0.55 * lunge * (1 - e) + 1.3 * e, sit + turn * e, 0.12 * Math.sin(time * 2.1 + b.ph) * (1 - e) + 0.25 * e * Math.sin(time * 1.3 + b.ph));
        b.U.uBird.value.x = Math.max(e > 0.02 ? 1 : 0, flap, lunge * 0.6); b.U.uBird.value.z = e;
      }
    };
    // others wheel over the milk sea, the green night, the violet sea and the ice sea: each flock on a closed loop of
    // its own in the world (a wobbled ellipse 14 to 22 m in radius, 7 to 12 m up), flown on the world clock, so the boat
    // comes up to it, passes it and leaves it astern. A flock reaches REACH m round its loop: every way point of a loop
    // is 10 m + REACH or more from the line (tested every 2 m of route) and the loop's near side within 30 m + REACH.
    // A FLOCK IS LIT BY THE SEA IT FLIES OVER: its light is dealt once, here, from the table's rows at its own loop's
    // middle (key, key's direction, ambient, the water's glow), and its fog is the weather between the eye and that
    // place (kitAir, below).
    const kitLight = { sunDir: new THREE.Vector3(0, 1, 0), sunColor: new THREE.Color(1, 1, 1), sunIntensity: 1, sky: new THREE.Color(0.5, 0.5, 0.5), skyIntensity: 1, ground: new THREE.Color(0.3, 0.3, 0.3), groundIntensity: 1 };
    const wheelers = [];
    {
      const wr2 = S.wheel, REACH = 6, over = [[P.milk + JOIN, P.green - JOIN], [P.green - JOIN, P.violet], [P.violet + JOIN, P.ice - JOIN], [P.ice + JOIN, P.squall - JOIN]];
      for (let k = 0; k < over.length; k++) {
        const side = k % 2 ? 1 : -1; let loop = null;
        for (let t = 0; t < 12 && !loop; t++) {
          const sc = lerp(over[k][0], over[k][1], wr2.range(0.25, 0.75)), R = wr2.range(14, 22), cx = xAt(sc) + side * (R * 1.15 + REACH + wr2.range(10, 30)), up = wr2.range(7, 12), a0 = wr2.range(0, 6.28), ell = wr2.range(0.7, 1), cand = [];
          let ok = true;
          for (let i = 0; i < 10; i++) { const a = a0 + side * i / 10 * Math.PI * 2, r = R * (1 + wr2.range(-0.15, 0.15)), x = cx + Math.cos(a) * r, z = -sc + Math.sin(a) * r * ell; ok = ok && nearLine(x, z) >= 10 + REACH; cand.push([x, up + 2 * Math.sin(a * 2), z]); }
          if (ok) { loop = cand; loop.sc = sc; loop.cx = cx; loop.up = up; }
        }
        if (!loop) continue;
        // (A FLOCK WHEELS OVER WHAT STANDS UNDER ITS LOOP: where a berg's reach in plan comes under the loop's ring
        // (the ring's widest radius and OUT m, a bird's own farthest place beside its loop), the whole loop is lifted
        // until its lowest bird flies BERG.clear m over that berg's top as it rocks. OUT and UNDER are the kit's deal
        // at four sigma of its bell curve (0.45 of the spread: 4 m across and along, 2 m up), the wander (1.5 m
        // across and along, 1 m up) and 0.7 m of bird; UNDER has the loop's own 2 m of dip besides. No draw moves; a
        // loop with no berg under it flies as dealt.)
        { let lift = 0; const rr = Math.max(...loop.map((p) => Math.hypot(p[0] - loop.cx, p[2] + loop.sc))), OUT = (4 * 0.45 * 4 + 1.5) * Math.SQRT2 + 0.7, UNDER = 2 + 4 * 0.45 * 2 + 1 + 0.7;
          for (const g of bergs) if (Math.hypot(g.x - loop.cx, g.z + loop.sc) < rr + OUT + g.rad) lift = Math.max(lift, g.top + Math.hypot(BERG.rock[0], BERG.rock[1]) * g.rad + BERG.clear + UNDER - loop.up);
          for (const p of loop) p[1] += lift; loop.up += lift; }
        await ctx.yield();
        const fl = F.makeFlock({ rng: wr2, species: 'gulls', count: Math.round(6 * V.density), light: kitLight, body: '#e9edf0', wingC: '#2b2f3a', route: loop, closed: true, speed: wr2.range(8, 11), spread: [4, 2, 8], wander: [1.5, 1, 1.5, 0.35] });
        { const wu = fl.uniforms, K = seas.row(8, loop.sc, [0, 0, 0, 0]), D = seas.row(9, loop.sc, [0, 0, 0, 0]), A = seas.row(10, loop.sc, [0, 0, 0, 0]), G = seas.row(3, loop.sc, [0, 0, 0, 0]);
          wu.uSunDir.value.set(D[0], D[1], D[2]).normalize(); wu.uSunColor.value.setRGB(K[0], K[1], K[2]); wu.uSkyColor.value.setRGB(A[0], A[1], A[2]);
          wu.uGroundColor.value.setRGB(A[0] * 0.5 + G[0], A[1] * 0.5 + G[1], A[2] * 0.5 + G[2]); fl.place = [loop.cx, loop.up, -loop.sc]; }
        scene.add(fl.object); wheelers.push(fl);
        await ctx.yield();
      }
    }
    await ctx.yield();
    // THE KIT'S THINGS TAKE THEIR FOG FROM THE SCENE'S ONE FOG, which the renderer reads as each thing is drawn. So each
    // kit thing sets that fog as it is drawn (values only), by its own law of place:
    //   between: a flock, a compact thing: the weather between the eye that draws it and the thing's own place: the
    //     amount at that place is the depth every own shader takes (the part's depth), its colour the air's where
    //     the fog is seen (fogShare);
    //   own: a thing spread over its place (the lanterns' glows, the mist of the join, the rare fall's mist and lip):
    //     the air of the sea it stands in, the table's row 6 at its own voyage metre, whoever looks from wherever;
    //   eye: a medium that is where the eye is (rain, snow, petals, the bar's blown spray): the air at the eye.
    const airRow = [0, 0, 0, 0], airP = new THREE.Vector3();
    const kitAir = (obj, law) => obj.traverse((o) => { if (o.isMesh || o.isPoints) o.onBeforeRender = (r, sc, cam) => { airP.setFromMatrixPosition(cam.matrixWorld); law(airP); }; });
    const airAt = (sv, dens) => { seas.row(6, sv, airRow); scene.fog.color.setRGB(airRow[0], airRow[1], airRow[2]); scene.fog.density = dens ?? airRow[3]; };
    const airEye = (c) => airAt(-c.z), airOwn = (sv) => () => airAt(sv);
    const airBetween = (x, y, z) => (c) => { const tau = seas.depth(c.x, c.y, c.z, x, y, z), d = Math.max(Math.hypot(x - c.x, y - c.y, z - c.z), 1); airAt(-lerp(c.z, z, seas.fogShare(c.z, z, tau)), Math.sqrt(tau) / d); };
    for (const w of wheelers) kitAir(w.object, airBetween(w.place[0], w.place[1], w.place[2]));
    kitAir(lampGlow.object, airOwn((-40 + 105) / 2)); kitAir(mist.object, airOwn(P.ice));
    for (const m of [rain, snow, petals]) kitAir(m.object, airEye);
    if (fallLip) { kitAir(fallLip.object, airOwn(fallLip.s)); kitAir(fallMist.object, airOwn(fallLip.s)); }
    // ---- the gaze: the looks go to what stands alongside, one at a time, each a window of the voyage between
    // places with its target found from u inside its own function:
    //  the reef, 35 m ahead of the eye, from the first roller's foot to the last roller's foot (the whole bar);
    //  the flower shore 40 m ahead of the eye, from where the shore first stands within 60 m of the line to the point
    //   where the shore turns away (shoreTurn: the look is laid to that place of the shore and rests on it);
    //  the place of the slab of the ice front nearest the front's middle, from the shore's turn (the shore swings
    //   away there and the front stands clear beyond it) until that place bears BEAR degrees off the bow. (The look
    //   takes hold in the violet sea's last metres because the front is passed 80 m off: abeam of the front's near
    //   corner the slab at its middle already bears about BEAR degrees, so a look laid between places of the ice
    //   sea alone would have no length on about two visits in five and too short a length for the camera's turn
    //   on the rest);
    //  the near funnel's throat 30 m up, from the red wall's far face until it bears BEAR degrees off the bow;
    //  the first island's heap on its near side, until that bears BEAR degrees;
    //  the ring, from then to the saddle (taken hold of before the lift begins).
    // The last three hand over to one another across one shared stretch of HAND m (a second and a half at the pace
    // there): each begins HAND m of voyage before the place where the look before it lets go.
    // THE TYPED METRES OF THE LOOKS AND THEIR REASONS:
    //  35 m ahead on the reef: two thirds of a wave (the crests stand 55 m apart), so the gaze rests on the next
    //   crest's break and not on the rock abeam; REEF.mid is the middle of the front rank's band; 4 m up: a rock's top
    //  40 m ahead on the shore: the nearest flowers stand 16 to 22 m off, so the shore 40 m on bears about 30 degrees
    //   off the bow; 2 m inland of the water's edge, 5 m up: the height of the lowest blooms
    //  48 m before the coast's end: where the shore itself begins to swing away from the voyage (shoreX)
    //  the slab nearest the front's middle (lookS), 14 m up: half a slab's height; BEAR = 60 degrees off the bow,
    //   one bearing for the three looks that end by a bearing: a little inside the half field, where a thing abeam
    //   begins to leave the picture
    //  30 m up the near funnel: a third of the way up the thin of its throat; 18 m up the first island's heap: half
    //   its crest; 0.55 of the island's half width toward the line: the heap's near shoulder
    const gA = new THREE.Vector3(), gB = new THREE.Vector3(), gE = new THREE.Vector3(), gR = new THREE.Vector3(), gF = new THREE.Vector3(), gI = new THREE.Vector3(), gP = new THREE.Vector3();
    // a look's window lies between two voyage metres (s0, s1) and its ramps are a length of voyage: half a wave on the
    // bar, TURN m (a second and a half at the full pace) along the coast and the ice, HAND m for the last three
    const TURN = 36, look = (s0, s1, ramp) => { const from = uOfS(s0), to = uOfS(s1); return { from, to, fade: Math.min(0.5, (uOfS(s0 + ramp) - from) / Math.max(to - from, 1e-6)) }; };
    const HAND = 30, BEAR = 60, sAtBearing = (x, sp) => { let s = sp; for (let i = 0; i < 4; i++) s = sp - Math.abs(x - xAt(s)) / Math.tan(BEAR * Math.PI / 180); return s; };
    let coastIn = P.coast0 - 60; while (coastIn < P.coast0 && shoreX(coastIn) - cs * xAt(coastIn) > 60) coastIn += 1;
    const fun = funnels[funnels.length - 1], heapX = ISLE.x - Math.sign(ISLE.x) * ISLE.R * 0.55, heapS = P.lift - 15;
    // (the voyage metres where the near funnel, and the first island's heap, bear BEAR degrees off the bow)
    const sFun = sAtBearing(fun.x, -fun.z), sHeap = sAtBearing(heapX, heapS);
    const pois = [
      { at: (time, u) => { path.pointAt(u, gE); const sa = -gE.z + 35; return gR.set(xAt(sa) + V.reefSide * REEF.mid, 4, -sa); }, ...look(P.bar, P.crest[2] + 35, (P.crest[1] - P.crest[0]) / 2), weight: 0.5 },
      { at: (time, u) => { path.pointAt(u, gE); const sa = Math.min(-gE.z + 40, shoreTurn); return gA.set(cs * (shoreX(sa) + 2), 5, -sa); }, ...look(coastIn, shoreTurn, TURN), weight: 0.35 },
      { at: () => gB.set(is * towerX, 14, -towerS), ...look(shoreTurn, sAtBearing(is * towerX, towerS), TURN), weight: 0.35 },
      { at: () => gF.set(fun.x, 30, fun.z), ...look(P.wall1, sFun, HAND), weight: 0.35 },
      { at: () => gI.set(heapX, 18, -heapS), ...look(sFun - HAND, sHeap, HAND), weight: 0.3 },
      { at: () => gP.set(0, 46, -P.ring), ...look(sHeap - HAND, P.saddle, HAND), weight: 0.3 },
    ];
    // ---- the pace, by metres of the voyage: a little slower over the bar (the pace falls as the first roller
    // rises under the bow, from its foot to its crest, and comes back down the last roller's far side, from its crest
    // to its foot); slowest across the blue sea of the funnels and the sea-horses (falling over the 25 m beyond the red
    // wall's far face, the wall's own thickness, and coming back over the 30 m in which the lift's slope comes on)
    const pace = (u) => { const s = sOfU(u); return 1 - 0.08 * seas.row(13, s, rowB)[0] - 0.22 * smoothstep(P.wall1, P.wall1 + (P.wall1 - P.wall0), s) * (1 - smoothstep(P.lift, P.lift + 30, s)); };
    // spray blown off the reef and the standing rollers across the boat, over the bar only
    const spray = fx.makeParticles({ rng: S.spray, preset: 'snow', count: Math.round(1500 * detail), time: seas.uniforms.uTime, colors: ['#ffffff', '#e8f6f0', '#d0ece2'], velocity: [-V.reefSide * 6, 0.3, 4], velocityRandom: [2, 1.2, 3], size: [0.04, 0.14], intensity: 1.4 });
    spray.setOpacity(0); scene.add(spray.object); kitAir(spray.object, airEye);

    const eye = new THREE.Vector3(), camP = new THREE.Vector3(), size = new THREE.Vector2();
    function update(dt, time, camera, u) {
      seas.uniforms.uTime.value = time;
      camP.setFromMatrixPosition(camera.matrixWorld); sea.follow(camP.x, camP.z);
      // (the red air between the eye and the folds' upright sheet: the table's summed fog between the two voyage metres)
      seas.uniforms.uSheetAir.value = Math.abs(seas.row(9, WX.fold1, WX.airA)[3] - seas.row(9, -camP.z, WX.airB)[3]);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); seas.uniforms.uBufH.value = size.y; }
      path.pointAt(u, eye); const s = -eye.z;
      // (the scene's fog rests at the air of the eye's place; each kit thing sets its own as it is drawn: kitAir)
      airEye(camP);
      const air = placeBow(u, time); bowG.visible = !ctx.through;
      // THE MEDIA THAT ARE WHERE THE EYE IS (rain, snow, petals) take the table's row 12 at that place; what the bow
      // wears takes row 13 at the boat's place. Nothing that stands is read here: suns, fire, dawn and doors are the
      // sky's own; strokes, embers and flocks take their own place and the weather between.
      seas.row(12, -camP.z, rowW); seas.row(13, s, rowB);
      bowU.uFilm.value = rowB[0];
      for (const bg of barges) { const h = seas.heightAt(bg.x, bg.z, time); bg.m.position.y = h; bg.m.rotation.x = 0.03 * Math.sin(time * 0.8 + bg.ph); bg.m.rotation.z = 0.04 * Math.sin(time * 0.6 + bg.ph * 1.7); }
      lampGlow.update(dt, time, camera);
      // the squall's strokes fall on their schedule of the clock, for whoever is anywhere; what they light takes
      // the flash by its own place (sky, cloud and ice in their shaders; the rain is where the eye is)
      const fl = flashAt(time, boltU.uB.value);
      // (the stroke's dealt number, carried to its place across clear of the line: SQUALL.clear)
      boltU.uB.value.x = squallAt(boltU.uB.value.x, boltU.uB.value.z);
      skyU.uFlash.value = fl; wallMat.uniforms.uBolt.value.set(boltU.uB.value.x, boltU.uB.value.y);
      // the far lightning, likewise, at its own place
      { const ff = farAt(time, farU.uB.value); skyU.uFar.value.set(farX + farU.uB.value.x, -farS, ff, 0); }
      rain.setOpacity(rowW[0]); rain.uniforms.uIntensity.value = rainI * (1 + 2.2 * fl); rain.update(dt, time, camera);
      snow.setOpacity(rowW[1]); snow.update(dt, time, camera);
      // (a snake's beat: hang for SNAKE.hang of it, slip 1.2 m in 1.5 s, fall free to its own length and a metre more, lie
      // half a second, climb back over what is left)
      for (const sn of snakes) { const t = ((time / sn.per + sn.start) % 1) * sn.per, t0 = SNAKE.hang * sn.per, t1 = t0 + 1.5, t2 = t1 + 2, deep = sn.L + 1;
        sn.U.uSn.value.z = t < t0 ? 0 : t < t1 ? 1.2 * smoothstep(t0, t1, t) : t < t2 ? Math.min(deep, 1.2 + 4.9 * (t - t1) * (t - t1)) : deep * (1 - smoothstep(t2, sn.per, t)); }
      petals.setOpacity(rowW[2]); petals.update(dt, time, camera);
      placeSlabs(time);
      for (const g of bergs) { g.m.position.y = seas.heightAt(g.x, g.z, time) * 0.6; g.m.rotation.x = 0.035 * Math.sin(time * 0.5 + g.ph); g.m.rotation.z = 0.03 * Math.sin(time * 0.37 + g.ph * 2); }
      mist.update(dt, time, camera); if (fallMist) fallMist.update(dt, time, camera);
      // the embers fall under every funnel always; their light takes the weather between the eye and their own place
      // (the table's summed fog along the ray, as the star points take it: the red air hides them by its depth)
      embers.forEach((e, i) => { const f = funnels[i]; e.setOpacity(seas.dim(camP.x, camP.y, camP.z, f.x, f.tip + 24, f.z, 0.2)); e.update(dt, time, camera); });
      placeHorses(time);
      placePerch(time);
      for (const w of wheelers) w.update(dt, time, camera, u);
      spray.setOpacity(0.9 * rowB[0]); spray.update(dt, time, camera);
    }

    return {
      scene, path, duration: 48,
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 30, nearThrough: 0.3, sway: 0.6, bank: 0.3 },
      pois, pace,
      portal: { shape: 'circle', radius: DOOR, color: '#ffe9b0', glow: 1.1, revealDistance: 320, blendDistance: 25 },
      post: { exposure: 1.0, bloom: { strength: 0.45, radius: 0.6, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.04, vignette: 0.28, grain: 0.02 } },
      ride: 'none', companion: 'none', style: 'none',
      update,
      dispose() {},
    };
  },
};
