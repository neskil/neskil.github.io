// The Roofs of the Old Stone: the hero set piece and the makers of the roofscape.
// The hero is the tree in the wall: a sheer cliff of masonry with one door high in it and, beside the door, level as a
// pier, a huge dead tree in its grey-brown bark, a fan of roots gripping the cracked and heaved masonry where it leaves
// the wall, its trunk a walkway and its bare limbs spread over the drop; among them a round table under a white cloth
// with a red skirt, two tall chairs, a pot and cups; rooks landing on the limbs; the room behind the door painted all
// over with roots in bright colours.
// FILTERS (said here and at the world's head): the stone shader reads the picture's grain as the breadth of a point of
// the picture on the face, in metres, and uses it for this alone: the rings of drops and the wind's ripples on standing
// water, the sun's glitter on the field's pools and the bark's furrows and grain are each given as the pattern's own
// mean where the pattern is finer than a point; the stone's other fine marks (string courses, the dressings of windows,
// the joints and cracks of flags, the edges of slates) fade toward the plain tone of their face there.
// This file also holds: the plan of a visit (roofPlan: the route, the places and every mass of the castle, as plain
// numbers, so that a replay can fly it without a picture), the film (roofFilm: paces and gaze by places), the stone
// material (masonry, slate, flags, pools, pale wood, mud, the painted room: one shader lit by the sun, the sky and the
// shadows of the great masses), and the makers the world assembles the castle with (tower, turret, range with its
// slates, chimney stack, buttress, merlons, hut).
import * as THREE from 'three';
import { makePath, makeRng, makeNoise, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';

export const DURATION = 50;
// ROUND 7: THE FINGER TOWER IS THE TALLEST THING OF THE PLACE BY A GOOD MARGIN: it stands FINGER_UP higher than it was
// dealt until now (its head 442 to 462 m; the keep's great tower 285 to 305 m; no other tower over 250 m and no roof
// over 256 m: on seeds 1 to 300 the finger's head stands 152 m and more over every other head of the place)
export const FINGER_UP = 112;
const TAU = Math.PI * 2, DEG = Math.PI / 180;
export const NC = 40;
// the few pools on the field of flagstones: the ovals of its low places (the plan's map), as the stone's shader reads them
export const NP = 16;
// the cooking fires of the dwellings outside the gate whose glow the mud walls about them take
export const NF = 24;
// lamps of the courts the stone's shader lights by
export const NL = 32;
// how many pieces of the dead tree throw a shadow (its trunk in three lengths, its four greatest boughs in two each)
export const NT = 11;
// THE WORN WAY on the forecourt's flags, out of the field's gatehouse's arch: as wide as the arch (ARCH_HALF to either
// hand of its middle) and a cart beside it (CART); worn for WAY_LONG out from the arch into the yard (the yard is 80 m
// deep: the wear thins over its far part and is gone 24 m short of the far parapet)
export const ARCH_HALF = 2.2, CART = 2.2, WAY_HALF = ARCH_HALF + CART / 2, WAY_LONG = 56;
// kinds of surface the stone material knows
export const KIND = { MASON: 0, SLATE: 1, FLAGS: 2, WATER: 3, PALE: 4, MUD: 5, PLAIN: 6, PAINT: 7, GLOW: 8, PANE: 9 };
export const col3 = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const PAL = {
  stone: col3('#79787e'), stoneDark: col3('#595a63'), stoneWarm: col3('#8c8576'), slate: col3('#3f444e'), slateBlue: col3('#4a5160'),
  lichen: col3('#c9a13a'), ivy: col3('#1c2a22'), cat: col3('#f4f1ea'), window: col3('#ffb347'), flag: col3('#a8242a'),
  pale: col3('#c4bba8'), mud: col3('#6e5c48'), mudDark: col3('#54463a'), lead: col3('#6c7482'), flags: col3('#6d6e76'),
  tile: col3('#70443a'), tileDark: col3('#5a3c34'), verdigris: col3('#4c6c64'),
};

// the four hours: the sky's own options, and the light of the hour on the stone (the key light, the air from above and
// the ground's from below, linear; the colours the wet slate mirrors and the haze are read from the sky itself). At sunset
// the stone's shade is the blue of the air over it, not the cloud's violet: the air, the ground's light, the afterglow's
// fill and the far haze (half the sky's own colour, half `haze`) are blue; the lit planes are the sun's gold (a yellow
// gold, not the sky's furnace orange). THE SHADE HAS ITS OWN LIGHT AT EVERY HOUR (the stone's shader lays it by one
// law): the air is strong enough that a shaded wall's courses, its ivy and its windows' recesses are read, darker
// and cooler than a lit wall and never one flat tone; the warm light the lit stone throws back (bounceOf) is the
// key light's own colour. sil: the share of the sky a face turned from the sun loses (the castle seen against the
// sun stands darker, never black); deepTint: the colour of the shade in the deep places (the court, the gulf, the lane)
export const HOURS = {
  sunset: {
    // (the sky's ground colours are the violet east's; the furnace of the west is the scatter round the sun; the first
    // stars; and a pale moon two days from full, small, its seas marked on its face, stands low in the east, 160
    // degrees and more round from the sun)
    sky: (P) => ({ preset: 'sunset', sunElevation: P.sunEl, sunAzimuth: P.sunAz / DEG, zenith: '#161a4e', mid: '#3d3684', horizon: '#6a4f9e', scatterColor: '#ff7a2f', scatter: 1, scatterPow: 3.2, scatterHigh: 0.1, stars: 0.5,
      moon: { elevation: 10, azimuth: P.moonAz / DEG, size: 1.5, phase: 0.82, phaseAngle: 24, texture: 0.95, color: '#ece6d6', color2: '#7d7a80', intensity: 0.9, dark: 0.02, glow: 0.07, glowColor: '#cfc8ff' },
      clouds: { coverage: 0.5, softness: 0.3, scale: 1.25, lit: '#ffb070', shade: '#5a3f7a', haze: 0.1 }, clouds2: { coverage: 0.45, stretch: 1, lit: '#ffb48a', shade: '#7a5590' } }),
    sun: [3.7, 2.05, 0.56], air: [0.42, 0.5, 0.95], gnd: [0.3, 0.3, 0.5], fog: 0.00062, wet: 1, cloud: 0.3, glow: 2.8, lit: 0.44, exposure: 1.06, clouds: [0.9, 0.42, 0.44], after: [0.12, 0.12, 0.28], haze: [0.17, 0.2, 0.45], portal: '#ffb347', fire: 2.6, shadow: 0.85, sil: 0.15, deepTint: [0.75, 1.4, 0.95],
  },
  dawn: {
    // (an hour after first light, the sun on the plan's own bearing, lower and paler: rose and pale gold through a
    // thin mist, the air cold and clear overhead; a waning moon going down opposite; few lamps left burning)
    sky: (P) => ({ preset: 'dawn', sunElevation: Math.max(7, P.sunEl - 4), sunAzimuth: P.sunAz / DEG, stars: 0.05,
      moon: { elevation: 8, azimuth: P.moonAz / DEG, size: 1.5, phase: 0.36, phaseAngle: -36, texture: 0.95, intensity: 0.6, dark: 0.02, glow: 0.04 },
      clouds: { coverage: 0.3, softness: 0.3, scale: 1.25, lit: '#ffd2c0', shade: '#6a6c98' } }),
    sun: [3.1, 2.3, 1.6], air: [0.56, 0.66, 0.98], gnd: [0.4, 0.4, 0.52], fog: 0.0011, wet: 1, cloud: 0.25, glow: 2.2, lit: 0.14, exposure: 1.04, clouds: [0.95, 0.72, 0.66], after: [0.16, 0.17, 0.26], haze: [0.5, 0.52, 0.66], portal: '#ffc27a', fire: 2.0, shadow: 0.6, sil: 0.12, deepTint: [0.9, 1.3, 1.1],
  },
  day: {
    // (a late grey-gold afternoon: the sun 18 degrees up on the plan's own bearing)
    sky: (P) => ({ preset: 'overcast', sunElevation: 18, sunAzimuth: P.sunAz / DEG, scatterColor: '#e9c684', scatter: 0.6, horizon: '#cdbf9c',
      clouds: { coverage: 0.74, softness: 0.3, scale: 1.2, lit: '#efe2c4', shade: '#59607a' } }),
    sun: [2.6, 2.3, 1.7], air: [1.15, 1.2, 1.35], gnd: [0.75, 0.72, 0.7], fog: 0.001, wet: 1, cloud: 0.6, glow: 1.8, lit: 0.08, exposure: 1.0, clouds: [0.52, 0.51, 0.48], after: [0.17, 0.15, 0.11], portal: '#ffc66e', fire: 1.2, shadow: 0.4, sil: 0.1, deepTint: [0.9, 1.15, 1.02],
  },
  night: {
    // (the moon is the key light: it stands 15 degrees up on the plan's own bearing of the light, so that the castle's
    // three lights are the same places' by night as by the sunset; the field's pale flags and the keep's front take it
    // as silver, never as white; the band of stars is faint and its heart as blue as its arms, so that no second
    // glow stands in the sky)
    sky: (P, ctx) => ({ preset: 'night', bake: true, bakeSize: 256, renderer: ctx.renderer, zenith: '#0b1430', mid: '#1d3064', horizon: '#3a5490', milkyWay: 0.12, milkyCore: '#8fa0cc', bodyOverrides: { 0: { elevation: 15, azimuth: P.sunAz / DEG, size: 1.7, phase: 0.86, phaseAngle: 24, texture: 0.95 } },
      clouds: { coverage: 0.42, softness: 0.34, scale: 1.3, lit: '#9db2e6', shade: '#26386a' } }),
    sun: [0.8, 1.0, 1.7], air: [0.44, 0.54, 0.9], gnd: [0.28, 0.32, 0.46], fog: 0.0007, wet: 1, cloud: 0.35, glow: 3.4, lit: 0.66, exposure: 1.12, clouds: [0.16, 0.2, 0.36], after: [0.05, 0.07, 0.14], portal: '#ffb347', fire: 3.2, shadow: 0.7, sil: 0.15, deepTint: [0.85, 1.4, 1.1],
  },
};
// THE WARM BOUNCE of an hour: the key light as the castle's own lit stone and lit ground throw it back on the faces
// that look at them (the key light's colour by a warm stone's own: a tenth of its red, less of its green and blue)
export const bounceOf = (H) => [H.sun[0] * 0.1, H.sun[1] * 0.085, H.sun[2] * 0.06];

// ---------------------------------------------------------------- the accumulator: flat triangles with a uv in metres
// attributes: position, normal, color, uv (metres along the face: u across, v up the wall or up the slope) and
// aK = (kind, windows, ivy, shade). windows: 0 none, else the share of cells that hold a window plus a whole number
// that is the wall's own seed; ivy 0..1; shade 0..1 (1 = open to the sky).
// the bounds of an accumulator's first n places: its box (least x, y, z, then greatest) and the square of the furthest
// place's distance from the box's middle
const _ab = new Float64Array(7);
function accBounds(P, n, o) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < n * 3; i += 3) {
    const x = P[i], y = P[i + 1], z = P[i + 2];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  if (!n) { x0 = y0 = z0 = x1 = y1 = z1 = 0; }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2; let r2 = 0;
  for (let i = 0; i < n * 3; i += 3) { const dx = P[i] - cx, dy = P[i + 1] - cy, dz = P[i + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
  o[0] = x0; o[1] = y0; o[2] = z0; o[3] = x1; o[4] = y1; o[5] = z1; o[6] = r2;
  return o;
}
export function makeAcc(cap = 2048) {
  let n = 0, P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), U = new Float32Array(cap * 2), K = new Float32Array(cap * 4);
  const grow = (need) => {
    if (n + need <= cap) return;
    // (every accumulator is made at a size its mesh does not outgrow, so this copy is the rule's fallback and is counted)
    while (n + need > cap) cap *= 2;
    makeAcc.grows++;
    const g = (a, k) => { const b = new Float32Array(cap * k); b.set(a.subarray(0, n * k)); return b; };
    P = g(P, 3); N = g(N, 3); C = g(C, 3); U = g(U, 2); K = g(K, 4);
  };
  const A = { c: [1, 1, 1], k: [0, 0, 0, 1], count: () => n, triangles: () => n / 3 };
  A.col = (c, s = 1) => { A.c = s === 1 ? c : mul3(c, s); return A; };
  A.kind = (kind, win = 0, ivy = 0, shade = 1) => { A.k = [kind, win, ivy, shade]; return A; };
  // one vertex with its own normal and uv
  A.v = (x, y, z, nx, ny, nz, u, v) => {
    grow(1);
    P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z; N[n * 3] = nx; N[n * 3 + 1] = ny; N[n * 3 + 2] = nz;
    C[n * 3] = A.c[0]; C[n * 3 + 1] = A.c[1]; C[n * 3 + 2] = A.c[2]; U[n * 2] = u; U[n * 2 + 1] = v;
    K[n * 4] = A.k[0]; K[n * 4 + 1] = A.k[1]; K[n * 4 + 2] = A.k[2]; K[n * 4 + 3] = A.k[3];
    n++;
  };
  // a flat triangle: normal of the face, uv in metres laid on the face (courses level on walls, rows along the slope on roofs)
  A.tri = (a, b, c) => {
    const a0 = a[0], a1 = a[1], a2 = a[2], b0 = b[0], b1 = b[1], b2 = b[2], c0 = c[0], c1 = c[1], c2 = c[2];
    let nx = (b1 - a1) * (c2 - a2) - (b2 - a2) * (c1 - a1), ny = (b2 - a2) * (c0 - a0) - (b0 - a0) * (c2 - a2), nz = (b0 - a0) * (c1 - a1) - (b1 - a1) * (c0 - a0);
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    let ax, ay, az, dx, dy, dz;
    if (Math.abs(ny) > 0.985) { ax = 1; ay = 0; az = 0; dx = 0; dy = 0; dz = -1; }
    else {
      // down the face: the world's down with the normal's part taken out; across: normal x down
      dx = nx * ny; dy = ny * ny - 1; dz = nz * ny; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      ax = ny * dz - nz * dy; ay = nz * dx - nx * dz; az = nx * dy - ny * dx;
    }
    // (the three corners are written straight into the arrays with one grow and no array made: the build's most used step)
    grow(3);
    const cr = A.c, kk = A.k, i = n * 3, j = n * 2, m = n * 4, c0r = cr[0], c1r = cr[1], c2r = cr[2], k0 = kk[0], k1 = kk[1], k2 = kk[2], k3 = kk[3];
    P[i] = a0; P[i + 1] = a1; P[i + 2] = a2; P[i + 3] = b0; P[i + 4] = b1; P[i + 5] = b2; P[i + 6] = c0; P[i + 7] = c1; P[i + 8] = c2;
    N[i] = nx; N[i + 1] = ny; N[i + 2] = nz; N[i + 3] = nx; N[i + 4] = ny; N[i + 5] = nz; N[i + 6] = nx; N[i + 7] = ny; N[i + 8] = nz;
    C[i] = c0r; C[i + 1] = c1r; C[i + 2] = c2r; C[i + 3] = c0r; C[i + 4] = c1r; C[i + 5] = c2r; C[i + 6] = c0r; C[i + 7] = c1r; C[i + 8] = c2r;
    U[j] = a0 * ax + a1 * ay + a2 * az; U[j + 1] = -(a0 * dx + a1 * dy + a2 * dz);
    U[j + 2] = b0 * ax + b1 * ay + b2 * az; U[j + 3] = -(b0 * dx + b1 * dy + b2 * dz);
    U[j + 4] = c0 * ax + c1 * ay + c2 * az; U[j + 5] = -(c0 * dx + c1 * dy + c2 * dz);
    K[m] = k0; K[m + 1] = k1; K[m + 2] = k2; K[m + 3] = k3; K[m + 4] = k0; K[m + 5] = k1; K[m + 6] = k2; K[m + 7] = k3; K[m + 8] = k0; K[m + 9] = k1; K[m + 10] = k2; K[m + 11] = k3;
    n += 3;
  };
  // a flat quad, corners counter-clockwise seen from outside
  A.quad = (a, b, c, d) => { A.tri(a, b, c); A.tri(a, c, d); };
  A.toGeometry = () => {
    const g = new THREE.BufferGeometry();
    // (views of the arrays as written, no copy: an accumulator is turned into its geometry once, at its end)
    g.setAttribute('position', new THREE.BufferAttribute(P.subarray(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(N.subarray(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(C.subarray(0, n * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(U.subarray(0, n * 2), 2));
    g.setAttribute('aK', new THREE.BufferAttribute(K.subarray(0, n * 4), 4));
    // the bounds by two plain passes over the array (the library's own passes go through an accessor a vertex and
    // held the page several times longer on the largest meshes)
    const b = accBounds(P, n, _ab);
    g.boundingBox = new THREE.Box3(new THREE.Vector3(b[0], b[1], b[2]), new THREE.Vector3(b[3], b[4], b[5]));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2), Math.sqrt(b[6]));
    return g;
  };
  return A;
}
makeAcc.grows = 0;

// ---------------------------------------------------------------- shapes laid into an accumulator
// A place's own frame: yaw is a heading (0 looks down -Z); local z runs along the heading, local x to its right.
const frameOf = (cx, cz, yaw) => { const c = Math.cos(yaw), s = Math.sin(yaw); return (lx, y, lz) => [cx + lx * c + lz * s, y, cz + lx * s - lz * c]; };
// a quad whose outside is toward (ox, oy, oz): the winding is found, not typed
function quadOut(A, a, b, c, d, ox, oy, oz) {
  const nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
  if (nx * ox + ny * oy + nz * oz >= 0) A.quad(a, b, c, d); else A.quad(a, d, c, b);
}
function triOut(A, a, b, c, ox, oy, oz) {
  const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (nx * ox + ny * oy + nz * oz >= 0) A.tri(a, b, c); else A.tri(a, c, b);
}
// a quad of THE FORECOURT'S FLOOR (its corners in order round it, level), every corner with the forecourt's own uv:
// metres across from the middle of the gatehouse's arch and metres out from the arch (the stone's shader lays the
// worn way by it). The winding is found: it faces up
function foreQuad(A, P, a, b, c, d) {
  const q = P.quad, tf = q.t1 + M.NEAR_DEEP, v = (p) => { const wt = P.toWT(p[0], p[2]); A.v(p[0], p[1], p[2], 0, 1, 0, wt[0] - q.mid, wt[1] - tf); };
  if ((b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]) >= 0) { v(a); v(b); v(c); v(a); v(c); v(d); } else { v(a); v(c); v(b); v(a); v(d); v(c); }
}
// a block on its own three half-axes u, v, w about its middle c (a stone tipped any way)
function blockInto(A, c, u, v, w) {
  const pt = (a, b, d) => [c[0] + a * u[0] + b * v[0] + d * w[0], c[1] + a * u[1] + b * v[1] + d * w[1], c[2] + a * u[2] + b * v[2] + d * w[2]];
  quadOut(A, pt(-1, -1, 1), pt(1, -1, 1), pt(1, 1, 1), pt(-1, 1, 1), w[0], w[1], w[2]); quadOut(A, pt(-1, -1, -1), pt(1, -1, -1), pt(1, 1, -1), pt(-1, 1, -1), -w[0], -w[1], -w[2]);
  quadOut(A, pt(1, -1, -1), pt(1, 1, -1), pt(1, 1, 1), pt(1, -1, 1), u[0], u[1], u[2]); quadOut(A, pt(-1, -1, -1), pt(-1, 1, -1), pt(-1, 1, 1), pt(-1, -1, 1), -u[0], -u[1], -u[2]);
  quadOut(A, pt(-1, 1, -1), pt(1, 1, -1), pt(1, 1, 1), pt(-1, 1, 1), v[0], v[1], v[2]); quadOut(A, pt(-1, -1, -1), pt(1, -1, -1), pt(1, -1, 1), pt(-1, -1, 1), -v[0], -v[1], -v[2]);
}
// ROUND 7: a buttress's stage: an upright box whose head is a weathering (b.fall: the head slopes down from the wall,
// where it stands b.y1 high, to the stage's own face, b.fall lower; its frame's across is the way out of the wall).
// A stage with no fall is a box with a lid, as before round 7
function buttInto(A, b) {
  if (!b.fall) { boxInto(A, b.x, b.z, b.yaw, b.hw, b.hl, b.y0, b.y1, { top: true }); return; }
  const o = b.out || 1, F = frameOf(b.x, b.z, b.yaw), c = Math.cos(b.yaw), s = Math.sin(b.yaw), yl = b.y1 - b.fall;
  boxInto(A, b.x, b.z, b.yaw, b.hw, b.hl, b.y0, yl, {});
  quadOut(A, F(-o * b.hw, b.y1, -b.hl), F(-o * b.hw, b.y1, b.hl), F(o * b.hw, yl, b.hl), F(o * b.hw, yl, -b.hl), o * c * 0.5, 1, o * s * 0.5);
  for (const e of [-1, 1]) triOut(A, F(-o * b.hw, yl, e * b.hl), F(o * b.hw, yl, e * b.hl), F(-o * b.hw, b.y1, e * b.hl), e * s, 0, -e * c);
}
// ROUND 7: THE SHADOW A BUTTRESS'S STAGE LAYS ON ITS OWN WALL by the hour's light (key: the way to the light), where
// the wall looks at the light: a skin a hand's breadth off the wall, the wall's own stone with the wall's own windows
// and ivy (K: the wall's numbers, its dress 3: no sun falls on it), from the stage's side away from the light as far
// along the wall as the stage is deep by the light's slant (16 m at the most, and no farther than the face runs),
// its head falling as the light does
function buttShade(A, b, key, K) {
  const c = Math.cos(b.yaw), s = Math.sin(b.yaw), sn = key[0] * c + key[2] * s;
  if (sn < 0.12 || !b.lim) return;
  const sa = key[0] * s - key[2] * c, p = 2 * b.hw, a0 = (sa > 0 ? -1 : 1) * b.hl, a1 = clamp(a0 + clamp(-p * sa / sn, -16, 16), b.lim[0], b.lim[1]);
  if (Math.abs(a1 - a0) < 0.4) return;
  const F = frameOf(b.x, b.z, b.yaw), lx = -b.hw + 0.05, dy = -Math.abs(a1 - a0) * key[1] / Math.max(0.05, Math.abs(sa));
  A.k = K;
  quadOut(A, F(lx, b.y0, a0), F(lx, b.y0, a1), F(lx, b.y1 - (b.fall || 0) + dy, a1), F(lx, b.y1, a0), c, 0, s);
}
// an upright box in a place's frame: half width hw (across), half length hl (along), from y0 to y1; o.top lays a lid
export function boxInto(A, cx, cz, yaw, hw, hl, y0, y1, o = {}) {
  const c = Math.cos(yaw), s = Math.sin(yaw), q = _BOX;
  // o.batter: the share by which the walls lean in at the head (mud walls are thick at the foot)
  // (the eight corners are laid once into scratch arrays, the same sums as the place's frame makes: 0 to 3 at the foot
  // by (across, along) = (1,-1), (1,1), (-1,1), (-1,-1), 4 to 7 at the head)
  const bt = 1 - (o.batter || 0), b0 = y0 === y1 ? bt : 1;
  for (let k = 0; k < 4; k++) {
    const sx = k < 2 ? 1 : -1, sz = k === 1 || k === 2 ? 1 : -1, f = q[k], h = q[k + 4];
    let lx = b0 === 1 ? sx * hw : sx * hw * b0, lz = b0 === 1 ? sz * hl : sz * hl * b0;
    f[0] = cx + lx * c + lz * s; f[1] = y0; f[2] = cz + lx * s - lz * c;
    lx = sx * hw * bt; lz = sz * hl * bt;
    h[0] = cx + lx * c + lz * s; h[1] = y1; h[2] = cz + lx * s - lz * c;
  }
  quadOut(A, q[0], q[1], q[5], q[4], c, 0, s);
  quadOut(A, q[3], q[2], q[6], q[7], -c, 0, -s);
  quadOut(A, q[2], q[1], q[5], q[6], s, 0, -c);
  quadOut(A, q[3], q[0], q[4], q[7], -s, 0, c);
  if (o.top) quadOut(A, q[7], q[4], q[5], q[6], 0, 1, 0);
}
const _BOX = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
// a gabled roof over a box: the ridge runs along the place's heading; oh = overhang of the eaves and the verges
export function gableInto(A, cx, cz, yaw, hw, hl, eave, ridge, oh = 0.5, wall = null) {
  const F = frameOf(cx, cz, yaw), c = Math.cos(yaw), s = Math.sin(yaw), k = (ridge - eave) / hw, ye = eave - oh * k, zl = hl + oh;
  quadOut(A, F(hw + oh, ye, -zl), F(hw + oh, ye, zl), F(0, ridge, zl), F(0, ridge, -zl), c, 1, s);
  quadOut(A, F(-hw - oh, ye, -zl), F(-hw - oh, ye, zl), F(0, ridge, zl), F(0, ridge, -zl), -c, 1, -s);
  if (wall) {
    const keepC = A.c, keepK = A.k; A.c = wall.c; A.k = wall.k;
    triOut(A, F(-hw, eave, hl), F(hw, eave, hl), F(0, ridge, hl), s, 0, -c);
    triOut(A, F(-hw, eave, -hl), F(hw, eave, -hl), F(0, ridge, -hl), -s, 0, c);
    A.c = keepC; A.k = keepK;
  }
}
// A COVERED BRIDGE'S ROOF (B: the bridge as a mass; slate, stone: its colours; wallK: its gallery wall's kind): a
// course of dressed stone stands out under the eaves all round the gallery's head; the slates overhang it by 0.9 m,
// a dark board closing the eaves' under side (their shadow lies on the course and the wall's head); a roll of lead
// caps the ridge and catches the low sun; the two gables are the gallery's own stone
export function bridgeRoofInto(A, B, slate, stone, wallK) {
  const F = frameOf(B.x, B.z, B.yaw), c = Math.cos(B.yaw), s = Math.sin(B.yaw), oh = 0.9, k = (B.ridge - B.eave) / B.hw, ye = B.eave - oh * k, zl = B.hl + oh;
  A.col(stone, 1.14).kind(KIND.MASON, 0, 0, 1); boxInto(A, B.x, B.z, B.yaw, B.hw + 0.3, B.hl + 0.3, B.eave - 0.7, B.eave - 0.1, { top: true });
  A.col([0.035, 0.03, 0.028]).kind(KIND.PLAIN);
  for (const sx of [-1, 1]) quadOut(A, F(sx * B.hw, B.eave - 0.1, -zl), F(sx * (B.hw + oh), ye - 0.06, -zl), F(sx * (B.hw + oh), ye - 0.06, zl), F(sx * B.hw, B.eave - 0.1, zl), 0, -1, 0);
  A.col(slate).kind(KIND.SLATE);
  gableInto(A, B.x, B.z, B.yaw, B.hw, B.hl, B.eave, B.ridge, oh, { c: stone, k: wallK });
  A.col(PAL.lead, 0.95).kind(KIND.PLAIN); boxInto(A, B.x, B.z, B.yaw, 0.32, zl, B.ridge - 0.16, B.ridge + 0.24, { top: true });
}
// a hipped roof: four slopes, the ridge shortened by hw * k at each end
export function hipInto(A, cx, cz, yaw, hw, hl, eave, ridge, k = 0.8) {
  const F = frameOf(cx, cz, yaw), c = Math.cos(yaw), s = Math.sin(yaw), zr = Math.max(0, hl - hw * k);
  quadOut(A, F(hw, eave, -hl), F(hw, eave, hl), F(0, ridge, zr), F(0, ridge, -zr), c, 1, s);
  quadOut(A, F(-hw, eave, -hl), F(-hw, eave, hl), F(0, ridge, zr), F(0, ridge, -zr), -c, 1, -s);
  triOut(A, F(-hw, eave, hl), F(hw, eave, hl), F(0, ridge, zr), s, 1, -c);
  triOut(A, F(-hw, eave, -hl), F(hw, eave, -hl), F(0, ridge, -zr), -s, 1, c);
}
// a round drum from radius r0 at y0 to r1 at y1 with smooth normals; o.top lays a lid; o.a0, o.a1 leave a gap of bearings
// (an opening); o.rag(th) raises or lowers the upper rim (a broken top); o.turn turns its corners' bearings
export function drumInto(A, cx, cz, r0, r1, y0, y1, sides, o = {}) {
  const rm = Math.max(r0, r1), sl = (r0 - r1) / Math.max(0.01, y1 - y0), nl = Math.hypot(1, sl), rag = o.rag || null, tu = o.turn || 0;
  for (let i = 0; i < sides; i++) {
    const t0 = i / sides * TAU + tu, t1 = (i + 1) / sides * TAU + tu;
    if (o.skip && o.skip((t0 + t1) / 2)) continue;
    const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1), ya = y1 + (rag ? rag(t0) : 0), yb = y1 + (rag ? rag(t1) : 0);
    const u0 = t0 * rm, u1 = t1 * rm;
    // (bearing t: the wall point is centre + r * (sin t, -cos t): the same hand as a heading)
    A.v(cx + r0 * s0, y0, cz - r0 * c0, s0 / nl, sl / nl, -c0 / nl, u0, y0); A.v(cx + r1 * s1, yb, cz - r1 * c1, s1 / nl, sl / nl, -c1 / nl, u1, yb); A.v(cx + r0 * s1, y0, cz - r0 * c1, s1 / nl, sl / nl, -c1 / nl, u1, y0);
    A.v(cx + r0 * s0, y0, cz - r0 * c0, s0 / nl, sl / nl, -c0 / nl, u0, y0); A.v(cx + r1 * s0, ya, cz - r1 * c0, s0 / nl, sl / nl, -c0 / nl, u0, ya); A.v(cx + r1 * s1, yb, cz - r1 * c1, s1 / nl, sl / nl, -c1 / nl, u1, yb);
  }
  if (o.top) for (let i = 0; i < sides; i++) {
    const t0 = i / sides * TAU + tu, t1 = (i + 1) / sides * TAU + tu;
    triOut(A, [cx, y1, cz], [cx + r1 * Math.sin(t0), y1, cz - r1 * Math.cos(t0)], [cx + r1 * Math.sin(t1), y1, cz - r1 * Math.cos(t1)], 0, 1, 0);
  }
}
// a round crown from radius r at y0 to a point at y1, smooth all round (the head of a clay dome)
export function crownInto(A, cx, cz, r, y0, y1, sides, turn = 0) {
  const sl = r / Math.max(0.01, y1 - y0), nl = Math.hypot(1, sl);
  for (let i = 0; i < sides; i++) {
    const t0 = i / sides * TAU + turn, t1 = (i + 1) / sides * TAU + turn, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
    A.v(cx + r * s0, y0, cz - r * c0, s0 / nl, sl / nl, -c0 / nl, t0 * r, y0); A.v(cx, y1, cz, 0, 1, 0, (t0 + t1) / 2 * r, y1); A.v(cx + r * s1, y0, cz - r * c1, s1 / nl, sl / nl, -c1 / nl, t1 * r, y0);
  }
}
// a faceted cone (a worn cap of slate or lead)
export function coneInto(A, cx, cz, r, y0, y1, sides, lean = [0, 0]) {
  for (let i = 0; i < sides; i++) {
    const t0 = i / sides * TAU, t1 = (i + 1) / sides * TAU, tm = (t0 + t1) / 2;
    triOut(A, [cx + r * Math.sin(t0), y0, cz - r * Math.cos(t0)], [cx + r * Math.sin(t1), y0, cz - r * Math.cos(t1)], [cx + lean[0], y1, cz + lean[1]], Math.sin(tm), 0.6, -Math.cos(tm));
  }
}
// a row of merlons along the top of a wall from a to b (plan points), on the level y
export function merlonsInto(A, ax, az, bx, bz, y, h = 1.6, w = 1.5, t = 0.9, gap = 1.3) {
  const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.floor(len / (w + gap))), yaw = Math.atan2(bx - ax, -(bz - az));
  for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; boxInto(A, lerp(ax, bx, f), lerp(az, bz, f), yaw, t / 2, w / 2, y, y + h, { top: true }); }
}
// a round limb through points with radii, smooth normals; uv = (round the limb, along it) in metres; o.sway writes the
// limb's give in the wind into aK.z from sway[0] at the first point to sway[1] at the last
export function tubeInto(A, pts, radii, sides, o = {}) {
  const n = pts.length, T = [], keepK = A.k, swayK = [keepK[0], keepK[1], 0, keepK[3]];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1; T.push([(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l]); }
  // a frame carried along the limb: start from the world's up (or x where the limb stands upright)
  let ux = 0, uy = 1, uz = 0; if (Math.abs(T[0][1]) > 0.9) { ux = 1; uy = 0; }
  const ring = [], along = [0];
  for (let i = 0; i < n; i++) {
    const t = T[i], d = ux * t[0] + uy * t[1] + uz * t[2]; ux -= t[0] * d; uy -= t[1] * d; uz -= t[2] * d; const l = Math.hypot(ux, uy, uz) || 1; ux /= l; uy /= l; uz /= l;
    const bx = t[1] * uz - t[2] * uy, by = t[2] * ux - t[0] * uz, bz = t[0] * uy - t[1] * ux;
    ring.push([ux, uy, uz, bx, by, bz]);
    if (i > 0) along.push(along[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  }
  const vert = (i, j) => {
    const a = j / sides * TAU, ca = Math.cos(a), sa = Math.sin(a), f = ring[i], r = radii[i], flat = o.flat && ca > 0 ? 1 - o.flat * ca : 1;
    const nx = f[0] * ca + f[3] * sa, ny = f[1] * ca + f[4] * sa, nz = f[2] * ca + f[5] * sa;
    if (o.sway) { swayK[2] = lerp(o.sway[0], o.sway[1], i / (n - 1)); A.k = swayK; }
    A.v(pts[i][0] + (f[0] * ca * flat + f[3] * sa) * r, pts[i][1] + (f[1] * ca * flat + f[4] * sa) * r, pts[i][2] + (f[2] * ca * flat + f[5] * sa) * r, nx, ny, nz, a * r, along[i]);
  };
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { vert(i, j); vert(i, j + 1); vert(i + 1, j + 1); vert(i, j); vert(i + 1, j + 1); vert(i + 1, j); }
  A.k = keepK;
}

// ---------------------------------------------------------------- the light all the stone shares
export function makeLightUniforms() {
  const boxA = [], boxB = [], poolA = [], poolB = [], treeA = [], treeB = [], fires = [], court = [];
  for (let i = 0; i < NF; i++) fires.push(new THREE.Vector4(0, -1e5, 0, 0));
  for (let i = 0; i < NL; i++) court.push(new THREE.Vector4(0, -1e5, 0, 0));
  for (let i = 0; i < NT; i++) { treeA.push(new THREE.Vector4(0, -1e6, 0, 0)); treeB.push(new THREE.Vector4(0, -1e6, 1, 0)); }
  for (let i = 0; i < NC; i++) { boxA.push(new THREE.Vector4(0, 0, 0, 0)); boxB.push(new THREE.Vector4(1, 0, -1e4, 0)); }
  for (let i = 0; i < NP; i++) { poolA.push(new THREE.Vector4(0, -1e6, 1, 1)); poolB.push(new THREE.Vector4(1, 0, 1, 0)); }
  return {
    // (the numbers a world sets from its sky; these are the sunset's, with the sun on the hero's face, for the hero seen alone)
    uSunDir: { value: new THREE.Vector3(0.62, 0.22, 0.75).normalize() }, uSunCol: { value: new THREE.Color(2.7, 1.65, 0.7) },
    uSkyCol: { value: new THREE.Color(0.86, 0.9, 1.12) }, uGndCol: { value: new THREE.Color(0.6, 0.56, 0.6) }, uBounce: { value: new THREE.Color(0.27, 0.14, 0.042) },
    uHorSun: { value: new THREE.Color(1.0, 0.42, 0.14) }, uHorAway: { value: new THREE.Color(0.2, 0.16, 0.3) }, uZen: { value: new THREE.Color(0.1, 0.08, 0.17) }, uCloudCol: { value: new THREE.Color(0.85, 0.46, 0.38) }, uAfter: { value: new THREE.Color(0.4, 0.22, 0.18) },
    uFogCol: { value: new THREE.Color(0.25, 0.2, 0.33) }, uFogSun: { value: new THREE.Color(0.9, 0.42, 0.18) }, uFogDen: { value: 0.0011 },
    uTime: { value: 0 }, uLit: { value: 0.3 }, uWet: { value: 1 }, uCloud: { value: 0.5 }, uWinGlow: { value: 2.4 }, uRain: { value: 0.6 },
    uBoxA: { value: boxA }, uBoxB: { value: boxB },
    // two lamps: (place, reach in metres) and colour; a lamp's light falls off with the square of the distance over its reach
    uLampP: { value: [new THREE.Vector4(0, -1e4, 0, 1), new THREE.Vector4(0, -1e4, 0, 1)] }, uLampC: { value: [new THREE.Color(0, 0, 0), new THREE.Color(0, 0, 0)] },
    // the field's pools (setPools) and the wind's heading in plan
    uPoolA: { value: poolA }, uPoolB: { value: poolB }, uWind: { value: new THREE.Vector2(1, 0) },
    // the dead tree's shadow: NT round pieces (one end and its radius, the other end and its radius) and the ball of
    // air that holds every place they can shade (setTreeShade; none until a tree is stood)
    uTreeA: { value: treeA }, uTreeB: { value: treeB }, uTreeS: { value: new THREE.Vector4(0, -1e6, 0, 0) },
    // the cliff's face: the heading out of it in plan (x, z), its place along that heading, the share of the sun it throws back
    // (these are the hero's own frame, for the hero seen alone)
    uWall: { value: new THREE.Vector4(0, 1, 0, 0.28) },
    // the deep places' box in the wall's frame (from, to along the wall; from, to out of it), the wall's own heading
    // (x, z, its place along it), the tint of their shade; and the share of the sky a face turned from the sun loses
    uDeep: { value: new THREE.Vector4(1e6, 1e6 + 1, 0, 1) }, uDeepW: { value: new THREE.Vector3(1, 0, 0) }, uDeepTint: { value: new THREE.Color(1, 1, 1) }, uSil: { value: 0.4 },
    // the cooking fires (place, strength: setFires) and the lane's own frame for its lanterns' light on its walls
    // (setLane: its mouth and heading; its right hand, half its breadth, its court's level; its length)
    // the courts' lamps (place, strength: setCourt)
    uCourt: { value: court },
    uFire: { value: fires }, uLane: { value: new THREE.Vector4(0, 0, 1, 0) }, uLaneB: { value: new THREE.Vector4(0, 1, 1, -1e5) }, uLaneLen: { value: 0 },
    // MENDING 1: the lane's hanging galleries, for the water's stains on the wall under each (setLane: metres in from
    // the lane's mouth where it begins and ends, the hand of the lane it hangs on, the height of its foot)
    uGal: { value: [new THREE.Vector4(0, 0, 1, -1e5), new THREE.Vector4(0, 0, 1, -1e5), new THREE.Vector4(0, 0, 1, -1e5), new THREE.Vector4(0, 0, 1, -1e5)] },
  };
}
// the cooking fires: [{ x, y, z }] (the first NF are used), k: how strong their glow is at this hour
export function setFires(U, list, k = 1) {
  for (let i = 0; i < NF; i++) { const f = list[i]; if (f) U.uFire.value[i].set(f.x, f.y + 0.4, f.z, k); else U.uFire.value[i].set(0, -1e5, 0, 0); }
}
// the courts' lamps: [{ x, y, z, k }] (the first NL are used), k: how strong each is; g: how strong all are at this hour
export function setCourt(U, list, g = 1) {
  for (let i = 0; i < NL; i++) { const f = list[i]; if (f) U.uCourt.value[i].set(f.x, f.y, f.z, f.k * g); else U.uCourt.value[i].set(0, -1e5, 0, 0); }
}
// the lane's frame: P.lane
export function setLane(U, P) {
  const L = P.lane, m = P.laneAt(L.u0, 0), t = P.laneAt(L.u0 - 1, 0), r = P.laneAt(L.u0, 1);
  U.uLane.value.set(m[0], m[1], t[0] - m[0], t[1] - m[1]); U.uLaneB.value.set(r[0] - m[0], r[1] - m[1], L.half, L.y); U.uLaneLen.value = L.u0 - L.u1;
  // (the hanging galleries, as the plan dealt them: four at the most)
  for (let i = 0; i < 4; i++) { const j = (L.jetties || [])[i]; if (j) U.uGal.value[i].set(L.u0 - j.ua, L.u0 - j.ub, j.side, L.y + j.up); else U.uGal.value[i].set(0, 0, 1, -1e5); }
}
// the pools on the field: ovals { x, z, a, b, rot } (the first NP are used; a place with none is far from all)
export function setPools(U, list) {
  for (let i = 0; i < NP; i++) {
    const o = list[i];
    if (!o) { U.uPoolA.value[i].set(0, -1e6, 1, 1); U.uPoolB.value[i].set(1, 0, 1, 0); continue; }
    U.uPoolA.value[i].set(o.x, o.z, 1 / o.a, 1 / o.b); U.uPoolB.value[i].set(Math.cos(o.rot), Math.sin(o.rot), Math.min(o.a, o.b), 0);
  }
}
// the dead tree's shadow: pieces [{ a: [x, y, z], ra, b: [x, y, z], rb }] in the world's own frame (the first NT are used)
export function setTreeShade(U, list) {
  let cx = 0, cy = 0, cz = 0, n = 0, rad = 0;
  for (let i = 0; i < NT; i++) {
    const o = list[i];
    if (!o) { U.uTreeA.value[i].set(0, -1e6, 0, 0); U.uTreeB.value[i].set(0, -1e6, 1, 0); continue; }
    U.uTreeA.value[i].set(o.a[0], o.a[1], o.a[2], o.ra); U.uTreeB.value[i].set(o.b[0], o.b[1], o.b[2], o.rb);
    cx += o.a[0] + o.b[0]; cy += o.a[1] + o.b[1]; cz += o.a[2] + o.b[2]; n += 2;
  }
  if (!n) { U.uTreeS.value.set(0, -1e6, 0, 0); return; }
  cx /= n; cy /= n; cz /= n;
  for (let i = 0; i < Math.min(NT, list.length); i++) for (const q of [list[i].a, list[i].b]) rad = Math.max(rad, Math.hypot(q[0] - cx, q[1] - cy, q[2] - cz));
  // (a low sun's shadows are long: the ball is the tree's own and 420 m more)
  U.uTreeS.value.set(cx, cy, cz, rad + 420);
}
// the casters of the great shadows: boxes { x, z, yaw, hw, hl, top }, or upright drums { x, z, hw (the radius), top, round } (the first NC are used)
export function setCasters(U, list) {
  for (let i = 0; i < NC; i++) {
    const b = list[i];
    if (!b) { U.uBoxA.value[i].set(0, 0, 0, 0); U.uBoxB.value[i].set(1, 0, -1e4, 0); continue; }
    U.uBoxA.value[i].set(b.x, b.z, b.hw, b.hl); U.uBoxB.value[i].set(Math.cos(b.yaw), Math.sin(b.yaw), b.top, b.round ? 1 : 0);
  }
}

const GLSL_COMMON = /* glsl */`
float h11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx)*.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
`;
const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uHorSun, uHorAway, uZen, uFogCol, uFogSun, uCloudCol, uAfter;
uniform float uTime, uLit, uWet, uFogDen, uCloud, uWinGlow, uRain;
uniform vec4 uBoxA[${NC}], uBoxB[${NC}];
uniform vec4 uLampP[2]; uniform vec3 uLampC[2];
uniform vec4 uTreeA[${NT}], uTreeB[${NT}], uTreeS;
// the light of the two lamps on a surface (ROUND 7: THE RING'S GOLD, the first lamp, is taken by the lit point's
// distance from the ring alone, far down the lane; a face that stands edge-on to it still takes a fifth of it,
// one turned from it by more than a sixth of a right angle none)
vec3 lampsAt(vec3 p, vec3 n){
  vec3 l0 = uLampP[0].xyz-p, l1 = uLampP[1].xyz-p; float d0 = length(l0), d1 = length(l1);
  return uLampC[0]*max(dot(n, l0/max(d0, 1e-3))*.8+.2, 0.)/(1.+d0*d0/(uLampP[0].w*uLampP[0].w))+uLampC[1]*max(dot(n, l1/max(d1, 1e-3)), 0.)/(1.+d1*d1/(uLampP[1].w*uLampP[1].w));
}
// is a window lit? Each has its own place h (0..1) in the order of lighting; the hour's share uLit of them is lit, and
// those near the edge of that share are lit and put out on slow rounds of their own on the world's clock (66 to 140 s)
float litNow(float h){ return smoothstep(-.004, .004, uLit-h-.07*sin(uTime*(.045+.05*fract(h*17.3))+h*60.)); }
// the sky as a wet surface mirrors it: the furnace band toward the sun, violet away from it and overhead
vec3 skyAt(vec3 d, float glint){
  vec2 sx = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
  float az = clamp(dot(d.xz/max(length(d.xz), 1e-4), sx)*.5+.5, 0., 1.);
  vec3 hor = mix(uHorAway, uHorSun, az*az*az);
  float h = clamp(d.y, 0., 1.);
  vec3 c = mix(hor, uZen, pow(h, .42));
  // the clouds of the hour as a wet roof holds them: a slow dapple that drifts with the wind
  float cl = smoothstep(.22, .85, vn(d.xz/(h+.3)*1.6+uTime*vec2(.012, .005)))*smoothstep(0., .25, h);
  c = mix(c, uCloudCol, cl*.8);
  float s = max(dot(d, uSunDir), 0.);
  return c + uSunCol*(pow(s, 180.)*2.5 + pow(s, 18.)*.22)*glint;
}
// the sky as a sheet of standing water holds it, a true picture of the hour: the furnace band toward the sun, violet
// away from it and overhead; the clouds of the hour in their own two colours (long bars low down, heaps higher up,
// their sides toward the sun the furnace's colour, their bodies violet), drifting with the wind on the world's clock;
// and the sun's own image, a small gold disc (0.9 degree of radius) with a near glow, held under the sky's own sun
vec3 mirrorSky(vec3 d){
  vec2 sx = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
  float az = clamp(dot(d.xz/max(length(d.xz), 1e-4), sx)*.5+.5, 0., 1.), h = clamp(d.y, 0., 1.);
  vec3 c = mix(mix(uHorAway, uHorSun, az*az*az), uZen, pow(h, .42));
  vec2 cp = d.xz/(h+.14);
  float n = vn(cp*vec2(.8, .8)+uTime*vec2(.012, .005))*.58+vn(cp*2.1+3.-uTime*vec2(.008, .011))*.28+vn(cp*5.3+9.)*.14;
  float cl = smoothstep(.47, .58, n)*smoothstep(0., .05, h), edge = 1.-smoothstep(.5, .68, n);
  vec3 lit = mix(uCloudCol*1.15, uHorSun*1.3+vec3(.1, .0, .06), az*az), shade = uZen*1.5+vec3(.09, .03, .13);
  c = mix(c, mix(shade, lit, clamp(.2+.5*az*az+.6*edge, 0., 1.)), cl*.92);
  float s = max(dot(d, uSunDir), 0.);
  return c+vec3(1.5, .86, .25)*smoothstep(.99982, .99992, s)+uHorSun*(pow(s, 90.)*.55);
}
// the dead tree's own shadow: is the way to the sun stopped by one of its round pieces (the nearest place of the ray to
// the piece's middle line lies inside its girth)? Soft at its edge, and softer the farther the shadow has fallen
float treeShade(vec3 p){
  vec3 o = p-uTreeS.xyz; if (dot(o, o) > uTreeS.w*uTreeS.w) return 1.;
  float lit = 1.;
  for (int i = 0; i < ${NT}; i++) {
    vec3 a = uTreeA[i].xyz, ab = uTreeB[i].xyz-a, ao = p-a;
    float d1 = dot(ab, uSunDir), d2 = dot(ab, ab), d3 = dot(ao, uSunDir), d4 = dot(ao, ab);
    float t = clamp((d4-d3*d1)/max(d2-d1*d1, 1e-4), 0., 1.), sr = d1*t-d3, r = mix(uTreeA[i].w, uTreeB[i].w, t);
    float dd = length(a+ab*t-p-uSunDir*max(sr, 0.));
    lit *= 1.-(1.-smoothstep(r*.8, r*1.05+max(sr, 0.)*.03, dd))*smoothstep(r+.5, r+3., sr);
  }
  return lit;
}
// the shadows of the great masses: each an upright box; the ray toward the sun in plan against the box's two slabs
float shadowAt(vec3 p){
  vec2 d = uSunDir.xz; float dl = max(length(d), 1e-4); d /= dl; float rise = uSunDir.y/dl; float lit = 1.;
  for (int i = 0; i < ${NC}; i++) {
    vec4 a = uBoxA[i], b = uBoxB[i];
    vec2 o = p.xz-a.xy;
    // into the box's frame (across, along)
    vec2 ol = vec2(o.x*b.x+o.y*b.y, o.x*b.y-o.y*b.x), dd = vec2(d.x*b.x+d.y*b.y, d.x*b.y-d.y*b.x);
    vec2 sd = vec2(dd.x < 0. ? -1. : 1., dd.y < 0. ? -1. : 1.), ad = max(abs(dd), vec2(1e-4))*sd;
    vec2 t1 = (-a.zw-ol)/ad, t2 = (a.zw-ol)/ad;
    float tn = max(min(t1.x, t2.x), min(t1.y, t2.y)), tf = min(max(t1.x, t2.x), max(t1.y, t2.y));
    // a drum: the ray against its circle (a round tower's own lit side is never inside its caster)
    if (b.w > .5) { float tm = -dot(ol, dd), hc = sqrt(max(a.z*a.z-dot(ol, ol)+tm*tm, 0.)); tn = tm-hc; tf = tm+hc; }
    float te = max(tn, 0.), chord = tf-te, hRay = p.y+te*rise;
    lit *= 1.-smoothstep(0., 1.5+te*.035, b.z-hRay)*smoothstep(0., 1.5+te*.03, chord);
  }
  return lit;
}
vec3 fogged(vec3 col, vec3 w){
  vec3 v = w-cameraPosition; float dist = length(v);
  // (ROUND 7: the haze lies low: over 170 m of the world's height it thins, to 45 hundredths at 400 m and over: the
  // finger's shaft and the head of the keep's great tower stand out of it; everything under 170 m is as it was)
  float den = uFogDen*(1.+1.6*(1.-smoothstep(-25., 45., w.y)))*(1.-.55*smoothstep(170., 400., w.y));
  float f = 1.-exp(-dist*dist*den*den);
  vec2 sx = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
  float toSun = clamp(dot(v.xz/max(length(v.xz), 1e-4), sx), 0., 1.);
  return mix(col, mix(uFogCol, uFogSun, toSun*toSun*toSun), f);
}
`;
export { GLSL_COMMON, GLSL_LIGHT };

// ---------------------------------------------------------------- the stone material
const STONE_VERT = /* glsl */`
attribute vec4 aK;
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec4 vK;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.);
  // dead twigs give a little in the wind (pale wood only: aK.z is the give in metres there)
  float sw = step(3.5, aK.x)*step(aK.x, 4.5)*aK.z;
  wp.xyz += sw*vec3(sin(uTime*1.7+wp.x*.35+wp.y*.2), .6*sin(uTime*2.3+wp.z*.3), cos(uTime*1.4+wp.z*.4+wp.y*.3));
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vCol = color; vUv = uv; vK = aK;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const STONE_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec4 vK;
${GLSL_COMMON}
${GLSL_LIGHT}
uniform vec4 uPoolA[${NP}], uPoolB[${NP}]; uniform vec2 uWind; uniform vec4 uWall, uDeep; uniform vec3 uDeepW, uDeepTint, uBounce; uniform float uSil;
uniform vec4 uFire[${NF}], uLane, uLaneB, uCourt[${NL}], uGal[4]; uniform float uLaneLen;
// MENDING 1: UNDER A HANGING GALLERY OF THE LANE (by the lane's own measures, as its lanterns are): how many metres
// under the gallery's foot a place of its wall lies, and how far in from the gallery's two ends (0 at an end and
// beyond it, 1 a metre and a half in); under none: 1e5 and 0
vec2 underGal(vec3 p){
  vec2 lo = p.xz-uLane.xy; float a = dot(lo, uLane.zw), v = dot(lo, uLaneB.xy); vec2 best = vec2(1e5, 0.);
  if (a < -2. || a > uLaneLen+2. || abs(v) > uLaneB.z+1.5) return best;
  for (int i = 0; i < 4; i++) {
    vec4 g = uGal[i]; float w = smoothstep(g.x-.3, g.x+1.2, a)*(1.-smoothstep(g.y-1.2, g.y+.3, a))*step(0., v*g.z)*step(p.y, g.w);
    if (w > best.y) best = vec2(g.w-p.y, w);
  }
  return best;
}
// THE COURTS' LAMPS on the paving and the walls about them: each lights the stone within 46 m of it, falling off
// with the square of the distance (a broad warm pool under it, a wash on the wall that faces it).
// MENDING 2, R5: A LANTERN THAT STANDS IN A PLACE IS TENDED AND IS LIT AT EVERY HOUR: its glass (a glow of its own
// at every hour), its wash on the stone here and its pool on the paving take no place in the order of lighting, so
// that the three always agree and no hour puts all the lanterns out together. (An oriel, whose light is among these,
// has the first place in the order, nought, which the least hour's share keeps lit.)
vec3 courtLamps(vec3 p, vec3 n){
  float s = 0.;
  for (int i = 0; i < ${NL}; i++) {
    vec3 d = uCourt[i].xyz-p; float d2 = dot(d, d);
    if (d2 < 2116.) s += uCourt[i].w*(max(dot(n, d*inversesqrt(d2+1e-4)), 0.)+.12)/(1.+d2*.016)*(1.-d2/2116.);
  }
  return vec3(1., .58, .22)*(s*uWinGlow);
}
// THE LANE'S LANTERNS ON ITS WALLS, by the lane's own measures (metres along it from its mouth, metres over its
// court, metres to the right of its axis): the lanterns on posts in the court (every 14 m from 7 m in, on alternate
// hands, 3.8 m up) and the lanterns on brackets (every 16 m from 12 m in, each on the wall across the court from
// the post nearest it, 3.3 m up, 0.9 m off its wall); each lights the stone about it, falling off with the square of the distance (ROUND 7: three quarters as fast as before: a
// lantern's wash lies 5 m and more up its wall); lit at every hour, as their glass is (MENDING 2, R5)
vec3 laneLamps(vec3 p, vec3 n){
  vec2 lo = p.xz-uLane.xy; float a = dot(lo, uLane.zw), v = dot(lo, uLaneB.xy), hf = uLaneB.z;
  if (a < -6. || a > uLaneLen+6. || abs(v) > hf+1.5 || p.y > uLaneB.w+40. || p.y < uLaneB.w-2.) return vec3(0.);
  vec3 q = vec3(a, p.y-uLaneB.w, v), nl = vec3(dot(n.xz, uLane.zw), n.y, dot(n.xz, uLaneB.xy)); float s = 0.;
  float k0 = floor((a-12.)/16.+.5), m0 = floor((a-7.)/14.+.5);
  for (int j = -1; j <= 1; j++) {
    float k = k0+float(j);
    if (k >= 0. && 12.+16.*k < uLaneLen-4.) { vec3 d = vec3(12.+16.*k, 3.3, (mod(floor((5.+16.*k)/14.+.5), 2.) > .5 ? -1. : 1.)*(hf-.9))-q; float d2 = dot(d, d); s += (max(dot(nl, d*inversesqrt(d2+1e-4)), 0.)+.2)/(1.+d2*.075); }
    float m = m0+float(j);
    if (m >= 0. && 7.+14.*m < uLaneLen+10.) { vec3 d = vec3(7.+14.*m, 3.8, (mod(m, 2.) > .5 ? 1. : -1.)*(hf-1.6))-q; float d2 = dot(d, d); s += (max(dot(nl, d*inversesqrt(d2+1e-4)), 0.)+.2)/(1.+d2*.075); }
  }
  return vec3(1., .58, .22)*(s*uWinGlow*.8);
}
// how deep in a pool of the field a place lies: metres inside the nearest oval's edge (under nought: outside all)
float poolAt(vec2 p){
  float f = -1e4;
  for (int i = 0; i < ${NP}; i++) {
    vec4 a = uPoolA[i], b = uPoolB[i]; vec2 o = p-a.xy;
    f = max(f, (1.-length(vec2(o.x*b.x+o.y*b.y, o.y*b.x-o.x*b.y)*a.zw))*b.z);
  }
  return f;
}
// what a pool holds of the great masses: the ray a mirror sends up, against the same boxes and drums that
// cast the great shadows. rgb: the mass in the light of the side it shows, thinned by the air between; a: how much of the ray it stops
vec4 massAt(vec3 p, vec3 R){
  vec2 d = R.xz; float dl = max(length(d), 1e-4); d /= dl; float rise = R.y/dl, hit = 0., tHit = 0.;
  for (int i = 0; i < ${NC}; i++) {
    vec4 a = uBoxA[i], b = uBoxB[i];
    vec2 o = p.xz-a.xy;
    vec2 ol = vec2(o.x*b.x+o.y*b.y, o.x*b.y-o.y*b.x), dd = vec2(d.x*b.x+d.y*b.y, d.x*b.y-d.y*b.x);
    vec2 sd = vec2(dd.x < 0. ? -1. : 1., dd.y < 0. ? -1. : 1.), ad = max(abs(dd), vec2(1e-4))*sd;
    vec2 t1 = (-a.zw-ol)/ad, t2 = (a.zw-ol)/ad;
    float tn = max(min(t1.x, t2.x), min(t1.y, t2.y)), tf = min(max(t1.x, t2.x), max(t1.y, t2.y));
    if (b.w > .5) { float tm = -dot(ol, dd), hc = sqrt(max(a.z*a.z-dot(ol, ol)+tm*tm, 0.)); tn = tm-hc; tf = tm+hc; }
    float te = max(tn, 0.), h = smoothstep(0., .5+te*.012, b.z-(p.y+te*rise))*smoothstep(0., .5+te*.01, tf-te);
    if (h > hit) { hit = h; tHit = te; }
  }
  vec2 sx = uSunDir.xz/max(length(uSunDir.xz), 1e-4); float toSun = clamp(dot(d, sx), 0., 1.), f = 1.-exp(-tHit*tHit*uFogDen*uFogDen*1.5);
  // (the face a mass shows the pool is the one that looks back along the ray: in the sun's light when the ray goes from the sun)
  // (in the key light and the air, as the stone itself stands; its piers, windows and stains drawn out down the water)
  vec3 own = mix(vec3(.03, .034, .05)+uSkyCol*.03, vec3(.2, .19, .19)*(uSunCol*.6+uSkyCol*.5), clamp(-dot(d, sx)*1.6-.15, 0., 1.));
  own *= .86+.28*vn(vec2(dot(p.xz, vec2(-d.y, d.x))*.05, tHit*.015));
  return vec4(mix(own, mix(uFogCol, uFogSun, toSun*toSun*toSun), f), hit);
}
// rings from drops on standing water: a tilt of the surface
vec2 ripples(vec2 p, float t){
  vec2 g = vec2(0.);
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 1.3 : 2.3; vec2 c = p/sc+float(k)*17.3; vec2 ci = floor(c), cf = fract(c);
    float ph = fract(t*(.42+.2*h21(ci+3.))+h21(ci)); vec2 dv = cf-(vec2(h21(ci+1.), h21(ci+2.))*.5+.25); float r = length(dv);
    float w = sin((r-ph*.5)*38.)*(1.-smoothstep(0., .07, abs(r-ph*.5)))*(1.-ph);
    g += dv/max(r, 1e-3)*w;
  }
  return g;
}
// MENDING 1: a course's height by its place in the round of eight (four heights, 3.36 m the eight)
float crsH(float k){ k = mod(k, 8.); return k < .5 ? .30 : k < 1.5 ? .46 : k < 2.5 ? .38 : k < 3.5 ? .54 : k < 4.5 ? .38 : k < 5.5 ? .30 : k < 6.5 ? .54 : .46; }
// the shade a window's sill throws on the wall under it (the window's own measures: across from its middle, up from its foot).
// MENDING 2, S1: it is a shade, not a dark block hung under the slab: darkest right under the sill and gone half a
// window's breadth below it
float sill0(float wx, float wy){ float f = smoothstep(-.9, -.36, wy); return (1.-smoothstep(.62, .8, wx))*f*f*(1.-smoothstep(-.4, -.34, wy)); }
void main(){
  vec2 fwv = fwidth(vUv), fwW = fwidth(vW.xz); float fw = max(fwv.x, fwv.y);
  float kind = floor(vK.x+.5);
  vec3 N = normalize(vN), V = normalize(cameraPosition-vW), Ns = N;
  vec3 alb = vCol, emis = vec3(0.), lampL = vec3(0.); float gloss = 0., glint = 1., f0 = .07, field = 0., wallB = 0.; vec2 uv = vUv;
  float big = vn(uv*.07);
  if (kind < .5) {
    // masonry. ROUND 7, THE STONE'S LAW, one for every wall of the place: courses of squared stone 0.42 m high, a
    // stone 0.85 to 1.45 m long, each its own tone and one in nine another quarry's, darker or paler; each course
    // its own tone, a little. THE WALL WAS RAISED IN LIFTS of one to six courses: each lift its own tone, a
    // levelling joint between two lifts, and along it, a hand over it, the putlog holes of the scaffold (a square
    // hole of 0.22 m every 2.6 m, five in eight stopped). Old repairs: great patches of other stone whose edges
    // go by the stones' own. THE WATER'S STAINS hang under every string course, each its own length; lichen; ivy;
    // lancet windows.
    // THE STONE IS READ FROM THE AIR, each way on its own: a bed joint by the picture's grain up the wall, an
    // upright joint by its grain along the wall, so that a wall seen along itself keeps its courses; a joint finer
    // than a point of the picture is laid one point wide and as dark as its own share of that point (as the flags'
    // joints are); where the courses themselves are finer than two points of the picture the wall is given their
    // own mean (six parts in a hundred darker than the bare stone), and the lifts are still read, to 300 m and more
    // MENDING 1, M4: THE STONE SEEN CLOSE IS OLD ASHLAR, NOT LARGE BRICK, by the stone's own law, one for every wall
    // of the place, with no read of the eye beyond the filters above. THE COURSES ARE OF UNEQUAL HEIGHT: four heights
    // (0.30, 0.38, 0.46 and 0.54 m; 0.42 m in the mean, as before) in a round of eight courses, each eight
    // beginning at its own place in the round by a hash of the eight; THE UPRIGHT JOINTS FALL AT UNEQUAL LENGTHS (a
    // stone 0.35 to 2 m long: every joint set off by its own hash, three tenths of a stone to either hand) and
    // are thin and dark (18 mm; a bed joint 30 mm); a lift is one to seven courses of an eight. Where the courses
    // are finer than the picture's grain (the keep's faces from the field, every far wall) they are level lines as
    // before, read by the mean course
    float G8 = 3.36, gi = floor(uv.y/G8), gy = uv.y-gi*G8, rot = floor(h11(gi*1.3+4.)*8.), cutN = 1.+floor(h11(gi+2.)*7.);
    float y0 = 0., ch = .3, cj = 0., yc = 0., acc = 0.; bool got = false;
    for (int j = 0; j < 8; j++) {
      float hj = crsH(rot+float(j));
      if (float(j) < cutN) yc += hj;
      if (!got && (gy < acc+hj || j == 7)) { y0 = acc; ch = hj; cj = float(j); got = true; }
      acc += hj;
    }
    // MENDING 2, G2: THE RUNNING BOND IS BROKEN, by the stone's own law, for every wall alike. LONGER AND SHORTER
    // STONES: one upright joint in five was never cut (never two together): the stones to either hand of it are one
    // long stone, of one tone (a stone 0.35 to 3.4 m long). A THROUGH COURSE NOW AND THEN: one course in seven is a
    // course of bond stones laid through the wall, their ends alone in its face: short stones 0.5 to 0.64 m long.
    // THE JOINTS ARE LESS EVEN: a joint is tight here and open there along the wall (a bed joint 12 to 48 mm, an
    // upright one 7 to 29 mm, as dark as it is open), and a bed joint wanders a finger's breadth up and down
    float row = gi*8.+cj, thru = step(.857, h11(row*2.3+1.7)), len = thru > .5 ? .5+.14*h11(row+9.) : .42*(2.+1.4*h11(row+9.)), qx = uv.x/len+h11(row)*7., ix = floor(qx), fx = qx-ix;
    float dl = fx-(h21(vec2(ix, row*1.3+2.))-.5)*.6, dr = 1.+(h21(vec2(ix+1., row*1.3+2.))-.5)*.6-fx;
    float sn = ix+(dr < 0. ? 1. : dl < 0. ? -1. : 0.), ga = h21(vec2(sn-1., row*1.3+40.)), gb = h21(vec2(sn, row*1.3+40.)), gc = h21(vec2(sn+1., row*1.3+40.));
    float goneL = step(gb, .27)*step(.27, ga)*(1.-thru), goneR = step(gc, .27)*step(.27, gb)*(1.-thru);
    float dL = qx-sn-(h21(vec2(sn, row*1.3+2.))-.5)*.6, dR = sn+1.+(h21(vec2(sn+1., row*1.3+2.))-.5)*.6-qx;
    vec2 id = vec2(sn-goneL, row); float fy = (gy-y0)/ch;
    float tone = h21(id);
    float seeY = 1.-smoothstep(.36, .55, fwv.y/.42), seeX = (1.-smoothstep(.36, .55, fwv.x/len))*seeY;
    float jv = .4+1.2*vn(uv*vec2(.9, 2.3)+vec2(17., 3.)), wob = (vn(vec2(uv.x*1.3, uv.y*.4)+vec2(5., 41.))-.5)*.026;
    float jw = .03*jv, jx = .018*jv, wy = max(jw, fwv.y*1.15), wx = max(jx, fwv.x*1.15);
    float bedJ = (1.-smoothstep(wy*.35, wy*.65, min(abs(fy*ch+wob), abs((1.-fy)*ch-wob))))*min(1., jw/wy)*seeY;
    float headJ = (1.-smoothstep(wx*.35, wx*.65, min(abs(dL)+goneL*9., abs(dR)+goneR*9.)*len))*min(1., jx/wx)*seeX;
    float odd = step(.89, h21(id+7.))*(h21(id+11.) > .45 ? -.2 : .15);
    float lift = gi*2.+step(yc, gy);
    float seeL = 1.-smoothstep(.3, .6, fwv.y/1.176), ldw = min(abs(gy-yc), min(gy, G8-gy)), lw = max(.05, fwv.y*1.15);
    float liftJ = (1.-smoothstep(lw*.35, lw*.65, ldw))*min(1., .05/lw)*seeL;
    float ya = gy >= yc ? gy-yc : gy, pu = uv.x/2.6+h11(lift*3.7)*5., hwx = max(.11, fwv.x*.6), hwy = max(.11, fwv.y*.6);
    float hole = step(h21(vec2(floor(pu), lift+17.)), .36)*(1.-smoothstep(hwx*.7, hwx*1.2, abs(fract(pu)-.5)*2.6))*(1.-smoothstep(hwy*.7, hwy*1.2, abs(ya-.3)))
      *min(1., .11/hwx)*min(1., .11/hwy)*(1.-smoothstep(.5, 1.6, max(fwv.x, fwv.y)));
    // (the faces differ a little block from block: each stone its own tone, one in nine another quarry's; each course
    // and each lift its own, less than before, so that no level bands of one tone stand in the wall)
    float stoneT = 1.+((tone-.5)*.2+odd*.5)*seeX+((h11(row*1.7+5.)-.5)*.07+thru*.045)*seeY+(h11(lift*3.1+7.)-.5)*.11*seeL;
    alb *= 1.03*stoneT*(1.-max(max(bedJ*.55, headJ*.75), max(liftJ*.6, hole*.7)))*(1.-.06*(1.-seeY));
    lampL = laneLamps(vW, N)+courtLamps(vW, N);
    // a wall's string courses: a band of dressed stone every 9.6 m of its height, the shade it throws under itself
    // (read by the picture's grain up the wall alone); and THE WATER'S STAINS under it: dark tracks that hang from
    // the band, each column of them its own strength and its own length (1.4 to 4.6 m), gone before the band below
    float upr = 1.-smoothstep(.2, .5, abs(N.y)), sfade = upr*(1.-smoothstep(.3, 1.2, fwv.y)), s2 = fract(uv.y/9.6+.37)*9.6, scell = floor(uv.y/9.6+.37);
    float band = smoothstep(.5, .54, s2)*(1.-smoothstep(.9, .94, s2)), under = smoothstep(.22, .5, s2)*(1.-step(.5, s2));
    float dn = s2 < .5 ? .5-s2 : 10.1-s2;
    float streak = smoothstep(.5, .86, vn(vec2(uv.x*.8, scell*7.3+3.))*.75+vn(vec2(uv.x*2.9, scell*3.1))*.25);
    float hang = streak*exp(-dn/(1.6+3.8*vn(vec2(uv.x*.8+9., scell*5.))))*upr;
    // (MENDING 1: and under every hanging gallery of the lane: the wall right under its corbels is dark with soot
    // and damp, and tracks of water hang from it 2.5 to 7.5 m down the wall, each column its own)
    vec2 ug = underGal(vW);
    float hangG = ug.y*upr*(.3*exp(-ug.x/2.2)+.7*smoothstep(.35, .8, vn(vec2(uv.x*.6, 3.))*.7+vn(vec2(uv.x*2.3, 11.))*.3)*exp(-ug.x/(2.5+5.*vn(vec2(uv.x*.5+4., 7.)))));
    alb *= (.84+.32*big)*(1.-.4*hang)*(1.-.45*hangG);
    // MENDING 1, M4 AND M5: THE STONE IS OLD ASHLAR UNDER SOOT AND DAMP, DARKER AND GREYER than it was, the same for
    // every wall of the place (the lane's, the keep's, the towers': it is one stone): its own colour drawn four
    // tenths of the way to its grey and a quarter darker, a little toward the cold
    alb = mix(alb, vec3(dot(alb, vec3(.3, .5, .2))), .42)*vec3(.74, .752, .79);
    // the wall's age: great patches of other stone and old repairs (near, a patch's edge goes by the stones' own
    // edges: the patch is read at each stone's own middle), and the dark tracks the rain has worn down it
    vec2 pm = mix(uv, vec2((id.x+.5-h11(row)*7.)*len, gi*G8+y0+.5*ch), seeX);
    alb *= mix(vec3(.74, .72, .78), vec3(1.08, 1.03, .94), smoothstep(.4, .6, vn(pm*.045+vec2(13., 7.))));
    alb *= 1.-.2*smoothstep(.5, .85, vn(vec2(uv.x*.33, uv.y*.11)+21.)*.7+vn(uv*1.3)*.3);
    alb *= 1.+sfade*(.2*band-.45*under*under);
    // lichen: broad rosettes gathered in patches, a dull ochre on the stone
    float lich = smoothstep(.6, .84, vn(uv*.33+vec2(3., 11.)))*smoothstep(.45, .74, vn(uv*1.6));
    alb = mix(alb, vec3(.4, .34, .16)*(.7+.6*tone), lich*.22);
    // ROUND 7, THE DRESS OF A MEMBER (the whole part of aK.z; its fraction is the ivy): 1 A CORBEL TABLE under a
    // parapet (aK.y: the height of the member's own foot): corbels 1.5 m apart, each a stone 0.7 m broad standing
    // out under the parapet's course, a dark pointed gap between each two (the wall in the corbels' own shade), a
    // paler course over them. A FILTER: finer than a point of the picture, the table is its own mean
    float dress = floor(vK.z+.001), ivyK = vK.z-dress;
    if (dress > .5 && dress < 1.5) {
      float bv = (uv.y-vK.y)/1.5, cx = abs(fract(uv.x/1.5)-.5)*1.5;
      float gap = (1.-smoothstep(.34, .42, cx+max(0., bv-.45)*.95))*(1.-step(.8, bv))*smoothstep(-.02, .03, bv);
      float cfade = 1.-smoothstep(.25, .9, max(fwv.x*.9, fwv.y));
      alb *= mix(1., mix(1.-.3*(1.-step(.8, bv)), 1.-.62*gap, cfade)*(1.+.14*smoothstep(.8, .84, bv)), upr);
    }
    if (ivyK > .01) {
      // ivy: masses with a ragged edge, the wall in their shade just under them, leaves that turn in the wind
      float m = vn(uv*.16+vec2(5., 2.))*.6+vn(uv*.9)*.28+vn(uv*3.7)*.12+(vn(uv*9.)-.5)*.03, on = smoothstep(0., .07, m-(1.-ivyK));
      vec2 uu = uv+vec2(.12, .32);
      float m2 = vn(uu*.16+vec2(5., 2.))*.6+vn(uu*.9)*.28+vn(uu*3.7)*.12, over = smoothstep(0., .07, m2-(1.-ivyK));
      alb *= 1.-.45*over*(1.-on);
      float leaf = vn(uv*6.+vec2(uTime*.8, uTime*.35)), spr = vn(uv*19.+vec2(uTime*.5, 0.));
      // (the leaves stand in clumps, each clump its own green, lighter where its sprays stand out of the mass)
      float clump = vn(uv*1.25+vec2(9., 4.)), spray = smoothstep(.45, .8, vn(uv*2.9+7.));
      vec3 green = mix(vec3(.035, .075, .035), vec3(.1, .135, .04), spray*.7+.3*clump)*(.45+.75*leaf+.4*spr*spr)*(.55+.9*clump);
      alb = mix(alb, green, on); gloss = on*.3*leaf*spr;
      // ROUND 7, THE DEAD CREEPER'S NET: beyond the leaves' ragged edge the old stems still hold the wall, bare: a net
      // of thin dark stems that climb and cross, thinning to nothing a little way outside the mass (read near: a stem
      // finer than a point of the picture is laid one point wide and as faint as its own share of that point)
      float bare = smoothstep(-.2, -.03, m-(1.-ivyK))*(1.-on)*(1.-smoothstep(.2, .6, fw));
      if (bare > .01) {
        float tw = max(.035, fw*2.);
        float n1 = abs(vn(vec2(uv.x*2.6+.7*vn(uv*.9), uv.y*.55)+vec2(31., 5.))-.5), n2 = abs(vn(vec2(uv.x*1.1-uv.y*.8, uv.y*1.4+uv.x*.5)+vec2(3., 47.))-.5);
        float net = max(1.-smoothstep(tw*.5, tw, n1), .8*(1.-smoothstep(tw*.4, tw*.8, n2)))*min(1., .035/tw);
        alb = mix(alb, vec3(.075, .06, .045), net*bare*.85);
      }
    }
    // (MENDING 1, a member's dress 5: A HOUSE WITH NO LAMPS: its windows stand as every wall's do, each in its own
    // reveal, and are dark at every hour: the finger tower is the owls')
    bool arc = dress > 1.5 && dress < 2.5, gal = dress > 3.5 && dress < 4.5, owl = dress > 4.5 && dress < 5.5;
    if ((vK.y > .01 && (dress < .5 || (dress > 2.5 && dress < 3.5) || owl)) || arc || gal) {
      // lancet windows: few and tall, each with its own place in its bay and its own size (many small, a few more
      // than twice as great); dressed stone round it, a sill under it, the pane set back in a reveal; a lit one
      // warms its reveal, its sill and the wall beside it.
      // ROUND 7, THE REVEAL: the pane stands back in the wall by half the window's own breadth. What the eye sees
      // through the opening is found where its own ray meets the pane's plane: the pane, or the reveal's jamb, its
      // sill or its head, each in its own light (the jamb turned to the hour's light lit, the other in shade, the
      // sill under the sky, the head dark). The greater windows carry a stone mullion; the sill throws its shade on
      // the wall under it.
      // A BLIND ARCADE (a member's dress 2; aK.y: the height of its foot): the same opening 2.6 m broad and 5.9 m
      // tall every 3.5 m along the wall, a quarter as deep as broad, its back the wall's own stone in the arch's
      // shade: no pane, no lamp.
      // A GALLERY'S ROW OF WINDOWS (a member's dress 4; aK.y: the height of its foot): a lancet 1.1 m broad and 2.5 m
      // tall in every 2.8 m of the wall's own measure, its foot 1.25 m over the member's, mullioned, its pane back in
      // its reveal and lit in its own turn as every window of the place is
      float dens = fract(vK.y), sd = floor(vK.y);
      vec2 cs = vec2(4.6, 6.4), c = uv/cs+vec2(sd*.37, sd*.11);
      if (arc) c = vec2(uv.x/3.5, 0.);
      if (gal) c = vec2(uv.x/2.8, 0.);
      vec2 ci = floor(c), cf = fract(c);
      vec2 jit = vec2(h21(ci+sd+5.), h21(ci+sd+9.))-.5; float wq = h21(ci+sd+13.), wsz = .7+.8*wq*wq;
      float has = step(h21(ci+sd), dens*.8), wxs = (cf.x-.5-jit.x*.3)*cs.x/wsz, wy = (cf.y-.3-jit.y*.16)*cs.y/wsz;
      if (arc) { wsz = 2.35; has = 1.; wxs = (cf.x-.5)*3.5/wsz; wy = (uv.y-vK.y-.45)/wsz; wq = 0.; }
      if (gal) { wsz = 1.; has = 1.; wxs = (cf.x-.5)*2.8; wy = uv.y-vK.y-1.25; wq = .5+.5*h21(ci+sd+13.); }
      float wx = abs(wxs);
      float d = max(wx-.55, max(-wy, wy-2.5+wx*1.2))*wsz, wfade = 1.-smoothstep(1.4, 4., fw), wnear = 1.-smoothstep(.2, .75, fw);
      vec3 Tx = vec3(N.z, 0., -N.x)/max(length(N.xz), 1e-3);
      vec2 back = vec2(dot(V, Tx), V.y)*((arc ? .25 : .5)/max(dot(V, N), .25))*upr*mix(.35, 1., wnear);
      float bx = wxs-back.x, by = wy-back.y, dx = abs(bx)-.55, dy = max(-by, by-2.5+abs(bx)*1.2), dp = max(dx, dy)*wsz;
      float hole = has*(1.-smoothstep(-.02, .05, d)), frame = has*(1.-smoothstep(.1, .36, d)), pane = hole*(1.-smoothstep(-.05, .01, dp));
      float sill = arc ? 0. : has*(1.-smoothstep(.66, .74, wx))*smoothstep(-.34, -.28, wy)*(1.-smoothstep(-.07, -.02, wy));
      vec3 st = alb;
      alb = mix(alb, alb*1.26+.012, frame*(1.-hole)*wnear);
      alb = mix(alb, alb*1.5+.02, sill*wnear);
      alb *= 1.-.32*sill0(wx, wy)*has*wnear*(arc ? 0. : 1.);
      // (MENDING 1: the water's stain under every sill: two or three dark tracks down the wall from the sill's ends
      // and its middle, a metre and more long, gone before the window's own bay ends)
      { float dm = (-.34-wy)*wsz, trk = smoothstep(.3, .75, vn(vec2(uv.x*3.1, ci.y*5.3+ci.x)));
        alb *= 1.-.36*has*(arc || gal ? 0. : 1.)*step(0., dm)*(1.-smoothstep(.6, .78, wx))*trk*exp(-dm/(.7+.9*h21(ci+sd+31.)))*smoothstep(0., .22, cf.y)*wfade; }
      float jamb = step(dy, dx), lj = max(dot(uSunDir, -sign(bx)*Tx), 0.);
      alb = mix(alb, st*mix(by < 1. ? 1.12 : .3, .34+.95*lj, jamb), (hole-pane)*wnear);
      alb = mix(alb, arc ? st*.52 : vec3(.012, .014, .022), pane*wnear);
      float mull = arc ? 0. : has*step(.5, wq)*hole*max(1.-smoothstep(.05, .085, wx), (1.-smoothstep(.04, .07, abs(wy-1.25)))*step(.72, wq));
      alb = mix(alb, st*.94, mull*wnear);
      // (the low roofs' rooms are lit sooner than the high towers': a third more of them at any hour; and the rooms that
      // look into a shaded court or lane sooner still, by their wall's own shade)
      float lh = h21(ci*1.7+sd+3.1), on = litNow(lh-.34*(1.-smoothstep(30., 62., vW.y))-.5*(1.-vK.w)), fl = .82+.18*vn(vec2(uTime*2.3+lh*40., lh*9.));
      vec3 lampC = vec3(1., .6, .22)*uWinGlow*fl*(.55+.6*h21(ci+7.))*on*(arc || owl ? 0. : 1.);
      // (the pane is leaded: a bar up its middle and two across; the lamp stands behind it at its own place, the
      // glass brightest before it; each window its own warmth, from a candle's red gold to a pale lamp's)
      float lead = max(1.-smoothstep(.025, .05, abs(bx)), max(1.-smoothstep(.02, .045, abs(by-.8)), 1.-smoothstep(.02, .045, abs(by-1.6))))*wnear;
      vec2 lp = vec2(bx-(h21(ci+21.)-.5)*.5, by-.5-.9*h21(ci+23.));
      lampC *= mix(vec3(1., .78, .62), vec3(1., 1.12, 1.5), h21(ci+29.)*h21(ci+29.));
      // MENDING 2, R6: A LIT WINDOW'S LIGHT IS FILTERED, NEVER FADED: no window is lit or unlit by how far the eye
      // stands or how great the picture is. Near, the window is drawn (as before). WHERE IT IS FINER THAN A POINT of
      // the picture it gives its share of that point: its opening (a lancet of 2.39 square measures of its own, taken
      // as an upright oblong 1.1 by 2.17) is weighed against the point's own breadth and height on the wall, so that
      // the light a window sends is the same at every distance and passes from point to point with no flicker.
      // WHERE THE WINDOWS' BAYS THEMSELVES ARE FINER THAN A POINT (a grain of 2 to 4.4 m and more: a far wall) the
      // wall gives THE MEAN OF ITS LIT WINDOWS: the share of its bays that have a window, times the hour's share of
      // them that is lit at that height and in that shade, times a window's share of its bay (eight hundredths), in
      // the mean lamp's colour, and the mean of the warmth the lamps lay on the wall about them: an even faint
      // warmth, no sparkle. (A gallery's row: its windows' share of the row's length, 1.1 in 2.8.)
      float fxw = max(fwv.x/wsz, 1e-3), fyw = max(fwv.y/wsz, 1e-3), cyw = clamp((min(wy, 2.17-wy)+.5*fyw)/fyw, 0., min(1., 2.17/fyw));
      float covW = has*clamp((.55+.5*fxw-wx)/fxw, 0., min(1., 1.1/fxw))*cyw, holeF = mix(covW, hole, wnear), paneF = mix(covW, pane, wnear);
      vec3 eW = paneF*(1.-mull*wnear)*lampC*(1.-.8*lead)*mix(1., .5+.9*exp(-dot(lp, lp)*2.2), wnear)+st*lampC*(holeF-paneF)*.8
        +alb*lampC*(sill*.9*wnear+has*(1.-holeF)*(.5*exp(-max(d, 0.)*2.2)+.16*exp(-max(d, 0.)*.6)));
      float farW = smoothstep(2., 4.4, gal ? fwv.x : fw), onM = clamp(uLit+.34*(1.-smoothstep(30., 62., vW.y))+.5*(1.-vK.w), 0., 1.);
      vec3 lampM = vec3(1., .536, .2)*(uWinGlow*.774*onM*(arc || owl ? 0. : 1.));
      emis += mix(eW, gal ? lampM*(.354*cyw) : lampM*min(dens*.8, 1.)*(.072+.17*alb), farW);
    }
  } else if (kind < 1.5) {
    // slate: rows up the slope, each slate its own tone and tilt; wet, it takes the sky
    float rh = .34, row = floor(uv.y/rh);
    vec2 q = vec2(uv.x/.3+.5*mod(row, 2.)+h11(row)*.3, uv.y/rh), id = floor(q), f = fract(q);
    float dfade = 1.-smoothstep(.3, 1.1, fw/.3), tone = h21(id);
    float edge = smoothstep(0., .14, f.y)*smoothstep(0., .08, min(f.x, 1.-f.x));
    // (A FILTER: where the slates are finer than a point of the picture the roof is given their own mean: 0.9 for
    // the slates' tones, edges and the one missing in a hundred; 0.23 of the creeping green's patches)
    alb *= mix(.9, (.8+.32*tone)*(.6+.4*edge)*(1.-.45*step(.99, h21(id+9.))), dfade)*(.85+.3*big);
    float lich = smoothstep(.58, .84, vn(uv*.3+vec2(8., 1.)))*smoothstep(.48, .7, vn(uv*3.3+vec2(1., 5.)));
    alb = mix(alb, mix(vec3(.46, .36, .12), vec3(.34, .19, .1), vn(uv*.11))*(.6+.6*tone), lich*.42);
    // (old patched roofs: broad fields of darker and paler slate, plain enough to be seen in the shade of a low sun,
    // and the green that creeps down from the ridges)
    alb *= .58+.86*vn(uv*vec2(.05, .13)+vec2(4., 9.));
    alb = mix(alb, vec3(.07, .09, .04), .35*mix(.23, smoothstep(.55, .8, vn(uv*vec2(.6, .09)+2.)), dfade));
    gloss = uWet*(.3+.25*tone)*(1.-lich*.8); glint = .3;
    Ns = normalize(N+(vec3(h21(id+1.), h21(id+2.), h21(id+3.))-.5)*.1*dfade);
  } else if (kind < 3.5) {
    // old flagstones (2): slabs of many sizes laid to the floor's own heading (aK.y), dark joints with moss and weeds in
    // them, sunk and cracked slabs each a little out of level, lichen in drifts, rain standing where the floor has sunk
    // and holding the sky; and the leads and gutters that hold the sky (3)
    vec2 P = vW.xz; float pud = 1.; vec3 tip = vec3(0.);
    if (kind < 2.5) {
      lampL = courtLamps(vW, N);
      // THE FORECOURT'S WORN WAY (aK.z 3: the forecourt's uv is its own measure, metres across from the middle of
      // the gatehouse's arch and metres out from the arch): where feet and wheels came out of the arch into the
      // yard the flags are worn, WAY_HALF to either hand (the arch and a cart beside it), wholly so in the middle,
      // most at the arch's mouth, and no more WAY_LONG out. Worn flags are paler and smoother: their tones nearer
      // one another, their joints filled, their cracks and sunk slabs worn level, no moss, no lichen, few stains;
      // and a cart's two ruts run down them 1.5 m apart, wandering a little together, deeper here and fainter
      // there (READ FROM THE AIR as the joints are: a rut finer than a point of the picture is laid one point wide
      // and as dark as its own share of that point). The floor's fineness to the eye and its broad patches are
      // read by the world's metres here, as every other floor's are by its uv
      float worn = 0., rut = 0.;
      if (vK.z > 2.5 && vK.z < 3.6) {
        fw = max(fwW.x, fwW.y); big = vn(P*.07);
        worn = (1.-smoothstep(${(WAY_HALF - 1.3).toFixed(2)}, ${WAY_HALF.toFixed(2)}, abs(vUv.x)))*(1.-smoothstep(${(WAY_LONG * 0.6).toFixed(1)}, ${WAY_LONG.toFixed(1)}, vUv.y));
        float rw = max(.11, fw*1.2), rx = abs(abs(vUv.x+.3*(vn(vec2(vUv.y*.06, 3.))-.5))-.75);
        rut = worn*min(1., .11/rw)*(1.-smoothstep(rw*.5, rw, rx))*(.5+.5*smoothstep(.25, .6, vn(vec2(vUv.y*.3, 9.))));
      }
      float wk = worn*.8;
      float ca = cos(vK.y), sa = sin(vK.y); vec2 G = vec2(P.x*ca+P.y*sa, P.y*ca-P.x*sa)/vec2(3.4, 2.6);
      G.x += h11(floor(G.y))*5.;
      vec2 id = floor(G), f = fract(G); float cut = h21(id+3.);
      vec2 sub = vec2(cut > .45 ? 2. : 1., cut > .75 ? 2. : 1.), fs = fract(f*sub), ids = id*7.+floor(f*sub), size = vec2(3.4, 2.6)/sub;
      float tone = h21(ids), ed = min(min(fs.x, 1.-fs.x)*size.x, min(fs.y, 1.-fs.y)*size.y), jw = .03+.04*h21(ids+5.);
      float dfade = 1.-smoothstep(.25, 1.3, fw), sunk = step(.7, h21(ids+11.));
      // (THE JOINTS ARE READ FROM THE AIR: a joint finer than a point of the picture is laid as a band one point wide,
      // as dark as the joint's own share of that point)
      float jf = max(.06, fw*1.2), joint = 1.-min(1., 1.6*(jw+.03)/jf)*(1.-smoothstep(jw*.5, jw*.5+jf, ed));
      vec2 cp = (fs-.5)*size; float ang = h21(ids+19.)*3.1416;
      float crack = step(.78, h21(ids+17.))*(1.-smoothstep(.012, .05, abs(cp.x*cos(ang)+cp.y*sin(ang)+.3*(vn(cp*1.3+ids)-.5))))*dfade;
      // (A FILTER: where the slabs are finer than a point of the picture the floor is given their own mean: 0.83
      // for the slabs' tones, joints, cracks and sunk slabs; 0.2 of the moss; the lichen's drifts with the mean tone.
      // The worn way's own mean is 1.055: its slabs' tones lie between 1.08 and 1.18 where it is wholly worn)
      alb *= mix(mix(.83, 1.055, wk), mix(.74+.48*tone, 1.08+.1*tone, wk)*(.38+.62*mix(joint, 1., wk*.5))*(1.-.65*crack*(1.-wk))*(1.-.16*sunk*(1.-wk)), dfade)*(.8+.4*mix(big, .6, wk*.6))*(1.-.45*rut);
      // ROUND 7, THE GREAT YARD'S PAVING: the field of flags is laid in great panels between runnels of darker setts
      // 1.5 m broad, 18.5 m apart both ways by the field's own heading (the rain's way to the low places), worn out
      // and relaid in stretches, so that no runnel runs whole from wall to wall (READ FROM THE AIR: a runnel finer
      // than a point of the picture is laid one point wide and as dark as its own share of that point)
      if (vK.z > .5 && vK.z < 1.5) {
        vec2 Gm = vec2(P.x*ca+P.y*sa, P.y*ca-P.x*sa), bd = abs(fract(Gm/18.5+.5)-.5)*18.5; float bw = max(.75, fw*.8);
        float runl = max((1.-smoothstep(bw*.8, bw*1.15, bd.x))*smoothstep(.3, .5, vn(vec2(floor(Gm.x/18.5+.5)*7.3, Gm.y*.035))), (1.-smoothstep(bw*.8, bw*1.15, bd.y))*smoothstep(.3, .5, vn(vec2(Gm.x*.035, floor(Gm.y/18.5+.5)*5.1+9.))));
        alb *= 1.-.3*runl*min(1., .75/bw);
      }
      // (THE DRY FLOORS, the field's flags (aK.z 1), the forecourt's (3) and the tower's round (4): a warm stone that takes the low sun as
      // gold and never as white; broad patches of other stone and old stains; lichen in drifts; moss and weeds in
      // the joints. A quarter over either number: the same floor in the shadow of a small thing that stands on it)
      float isField = step(.5, vK.z)*step(vK.z, 1.5)+step(2.5, vK.z);
      vec3 dry = vec3(1.1, .95, .62)*mix(vec3(.8, .78, .8), vec3(1.12, 1.06, .96), smoothstep(.3, .7, vn(P*.045+vec2(13., 7.))));
      alb *= mix(vec3(1.), dry*(1.-.22*(1.-wk)*smoothstep(.5, .85, vn(P*.11+21.)*.7+vn(P*.9)*.3)), isField);
      float mossy = smoothstep(.3, .7, vn(P*.27+4.)), moss = mix(.2, (1.-smoothstep(jw, jw+.16+.3*mossy, ed))*mossy, dfade);
      alb = mix(alb, mix(vec3(.085, .12, .04), vec3(.1, .12, .035), isField)*mix(1., .7+.6*vn(P*5.), dfade), moss*mix(.85, .75, isField)*(1.-.9*worn));
      float lich = smoothstep(.55, .8, vn(P*.085+vec2(8., 1.)))*smoothstep(.4, .7, vn(P*1.9));
      // (on the dry floors the lichen takes the floor's own warmth: an ochre drift on gold stone, never a pale lace)
      alb = mix(alb, mix(vec3(.5, .47, .37), vec3(.42, .34, .14), vn(P*.05+3.))*mix(vec3(1.), vec3(.92, .8, .52), isField), lich*.26*mix(1., .6+.8*tone, dfade)*(1.+.3*isField)*(1.-worn));
      if (isField > .5) {
        // THE FIELD'S FEW POOLS: small and sharp, in the plan's own low places (each edge wandering half a metre and
        // less either way); a pool is a mirror that holds the sky over it; the flags between are dry. The forecourt's
        // rain stands where its own floor has settled: a few pools by the floor's low places. The tower's round is
        // laid to shed its rain over the rim and holds none
        float wf = (vK.z > 3.6 ? -4. : vK.z > 2.5 ? (vn(P*.045+3.)*.6+vn(P*.13)*.25-.63)*40. : poolAt(P))+(vn(P*.3+7.)-.5)*1.+(vn(P*1.1+2.)-.5)*.3;
        // (a pool has a clear outline and a narrow rim of soaked stone round it; under the water its bed is dark)
        pud = smoothstep(0., .06, wf); field = pud;
        float rim = (1.-smoothstep(0., .5, -wf))*(1.-pud), damp = rim;
        alb *= (1.-.5*rim)*mix(1., .2, pud);
        gloss = mix(.03+.03*tone+.3*rim, 1., pud); f0 = mix(.05, .3, pud); glint = .08*(1.-pud);
        tip = vec3(h21(ids+1.)-.5, 0., h21(ids+2.)-.5)*(.07+.14*sunk)*dfade*(1.-pud)*(1.-.7*worn);
      } else {
      // rain stands where the floor has settled: near, whole slabs of it to their edges, by each slab's own middle; the
      // slabs beside them are damp and dark
      vec2 gc = (id+(floor(f*sub)+.5)/sub-vec2(h11(id.y)*5., 0.))*vec2(3.4, 2.6), Pc = vec2(gc.x*ca-gc.y*sa, gc.x*sa+gc.y*ca);
      // (pools of several slabs together: a slab's own share in whether it holds water is small)
      float low = vn(Pc*.045+3.)*.6+vn(Pc*.13)*.25+h21(ids+11.)*.07, lowFar = vn(P*.045+3.)*.6+vn(P*.13)*.25+.035;
      pud = mix(smoothstep(.55, .62, lowFar), step(.58, low)*smoothstep(jw*.5, jw+.07, ed), dfade);
      float damp = mix(smoothstep(.44, .58, lowFar), smoothstep(.45, .58, low), dfade)*(1.-pud);
      gloss = uWet*mix(.06+.08*tone+.36*damp, .95, pud); alb *= mix(1., .62, max(pud, damp*.7)); f0 = mix(.07, .42, pud); glint = .1;
      tip = vec3(h21(ids+1.)-.5, 0., h21(ids+2.)-.5)*(.07+.14*sunk)*dfade*(1.-pud);
      }
      if (isField > .5) {
        // LEAVES DRIFT OVER THE DRY FLOORS: dead leaves, each a hand and a half long, go down the wind in loose
        // companies on the world's clock, every row of them at its own pace, each turning as it goes (near; MENDING 2,
        // R6: far off, where a leaf is finer than a point of the picture, the floor is given the leaves' own share
        // of it: eight parts in a thousand of it where a company goes, in the leaves' mean colour)
        float lfade = 1.-smoothstep(.04, .13, fw);
        { vec2 lw0 = vec2(dot(P, uWind), dot(P, vec2(-uWind.y, uWind.x))); float lr0 = floor(lw0.y/.9), ls0 = .5+1.1*h11(lr0*1.7+3.);
          alb = mix(alb, vec3(.28, .155, .04), .5*smoothstep(.35, .7, vn(vec2(floor((lw0.x-uTime*ls0)/2.6)*.1, lr0*.045)+31.))*.0081*(1.-lfade)*(1.-pud)); }
        if (lfade > .001) {
          vec2 lw = vec2(dot(P, uWind), dot(P, vec2(-uWind.y, uWind.x)));
          float lrow = floor(lw.y/.9), lsp = .5+1.1*h11(lrow*1.7+3.), lx = lw.x-uTime*lsp, lcell = floor(lx/2.6);
          vec2 lid = vec2(lcell, lrow);
          float there = step(h21(lid+41.), .5*smoothstep(.35, .7, vn(vec2(lcell*.1, lrow*.045)+31.)));
          vec2 lc = vec2((fract(lx/2.6)-.2-.6*h21(lid+5.))*2.6, (fract(lw.y/.9)-.2-.6*h21(lid+9.))*.9);
          float la = h21(lid+13.)*6.283+uTime*lsp*3.*(h21(lid+17.)-.5), lca = cos(la), lsa = sin(la);
          vec2 lr = vec2(lc.x*lca+lc.y*lsa, lc.y*lca-lc.x*lsa)/vec2(.11, .055);
          alb = mix(alb, mix(vec3(.2, .1, .03), vec3(.36, .21, .05), h21(lid+23.)), there*(1.-smoothstep(.6, 1., length(lr)))*lfade*(1.-pud));
        }
      }
      if (vK.z > 1.5 && vK.z < 2.5) {
        // the lane's court (its uv is its own measure: metres along the lane and metres to the right of its axis): a
        // lantern stands every 14 m on alternate hands, 7.4 m off the axis, and throws a warm pool on the paving
        // (MENDING 2, R7: a pool only where the plan has a post: from the first, 7 m in, to the last the plan sets,
        // as the walls' light asks; R5: lit at every hour, as the lantern's glass is)
        float lk0 = floor(vUv.x/14.);
        for (int j = -1; j <= 1; j++) {
          float lk = lk0+float(j); vec2 ld = vec2(vUv.x-(lk*14.+7.), vUv.y-(mod(lk, 2.) > .5 ? 7.4 : -7.4));
          if (lk >= 0. && 7.+14.*lk < uLaneLen+10.) emis += alb*vec3(1., .55, .2)*uWinGlow*(1.7*exp(-dot(ld, ld)/52.)+3.*exp(-dot(ld, ld)/1.5));
        }
      } else if (vK.w < .7) {
        // the low courts' lanterns: a warm pool on the paving, each by its own place, lit and put out with the windows
        vec2 lc = P/31., li = floor(lc), lf = (fract(lc)-.5-(vec2(h21(li+2.), h21(li+6.))-.5)*.4)*31.;
        float lh = h21(li+4.);
        emis += alb*vec3(1., .55, .2)*uWinGlow*step(lh, .7)*litNow(lh*.9)*(1.3*exp(-dot(lf, lf)/20.)+3.*exp(-dot(lf, lf)/1.5));
      }
    } else { gloss = .65; alb *= .5; glint = .3; }
    // (A FILTER: rings finer than a point of the picture are given as the rings' own mean, which is no tilt)
    vec2 rp = ripples(P, uTime)*uRain*pud*(1.-smoothstep(.02, .25, fw));
    N = normalize(N+tip);
    Ns = normalize(N+vec3(rp.x, 0., rp.y)*.35+vec3(vn(P*1.7+uTime*.3)-.5, 0., vn(P*1.9-uTime*.25)-.5)*.05*pud);
    if (field > .001) {
      // the wind's ripples on the pools: ruffled patches that drift down the wind on the world's clock, calm between
      // (A FILTER: ripples finer than a point of the picture are given as their own mean, which is no tilt)
      vec2 pw = vec2(dot(P, uWind), dot(P, vec2(-uWind.y, uWind.x)));
      float gust = smoothstep(.48, .74, vn(vec2(pw.x*.03-uTime*.2, pw.y*.045)+11.))*(1.-smoothstep(.06, .5, fw));
      float rip = sin(pw.x*7.-uTime*4.5+4.*vn(P*.9+3.))+.6*sin(pw.x*12.3-uTime*6.+pw.y*2.+5.*vn(P*.6));
      Ns = normalize(Ns+vec3(uWind.x, 0., uWind.y)*rip*.045*gust*field);
    }
  } else if (kind < 4.5) {
    // the dead tree's bark: long grey-brown plates between deep furrows that run along the limb, each plate its own
    // tone, its grain along it; bare weathered wood in patches on its upper side where the bark has gone; a bloom of
    // lichen on the upper side; darker underneath. Grey-brown in the shade, warm where the low sun strikes it
    // (the furrows wander: the plates' own lines are bent by the limb's slow grain, no two plates the same width or length)
    float bu = uv.x/.42+1.5*(vn(vec2(uv.x*.7, uv.y*.16))-.5)+.6*(vn(vec2(uv.x*2.3, uv.y*.55)+5.)-.5), bcol = floor(bu);
    vec2 bq = vec2(bu, uv.y/(2.6+2.4*h11(bcol+.5))+h11(bcol)*7.3+.3*(vn(vec2(uv.x*1.5, uv.y*.5)+3.)-.5)), bi = floor(bq), bf = fract(bq);
    float bfade = 1.-smoothstep(.12, .7, fw);
    float bed = min(min(bf.x, 1.-bf.x)*.42, min(bf.y, 1.-bf.y)*1.4)+(vn(uv*vec2(9., 2.5))-.5)*.07;
    // (A FILTER: where the furrows and the grain are finer than a point of the picture they are given as their own
    // mean: three parts in ten of the bark lie in furrow, and the grain's mean is its middle tone)
    float furrow = mix(.3, 1.-smoothstep(.0, .11, bed), bfade), btone = h21(bi+3.), grain = mix(.5, vn(vec2(uv.x*14., uv.y*1.3)+bi*3.7), bfade);
    vec3 bark = vec3(.17, .14, .115)*(.65+.7*btone)*(.75+.5*grain);
    bark = mix(bark, vec3(.028, .024, .022), furrow);
    float bare = smoothstep(.46, .7, vn(uv*.17+2.)+.25*(btone-.5))*smoothstep(-.4, .5, N.y);
    bark = mix(bark, vec3(.3, .26, .2)*(.85+.3*grain), bare*.7*(1.-furrow*.6));
    bark = mix(bark, vec3(.16, .17, .1), smoothstep(.62, .84, vn(uv*.6+2.))*.3*smoothstep(0., .7, N.y));
    bark *= mix(.55, 1.05, smoothstep(-.7, .5, N.y))*(.85+.3*vn(uv*.23+7.));
    alb = bark; wallB = 1.;
    N = normalize(N+vec3(grain-.5, 0., btone-.5)*.25*bfade*(1.-furrow));
    gloss = .04;
  } else if (kind < 5.5) {
    alb *= (.72+.5*vn(uv*1.3))*(.9+.2*vn(uv*7.));
    // (a house's wall is dark and damp for its lowest metre: aK.y under 0.48 carries the ground's height under it)
    if (vK.y < .48) alb *= 1.-.62*(1.-smoothstep(.05, 1., vW.y-(vK.y*80.-4.)));
    if (vK.z > .01) {
      // the dwellings' paths: a web of trodden ways between the clumps, darker and smoother than the ground about
      // them, broadest near the wall's foot (on the ground alone)
      if (vK.y > .5) { float pw = abs(vn(vW.xz*.055+5.)-.5), pv = abs(vn(vW.xz*.021+11.)-.5); alb *= 1.-.5*vK.z*max(1.-smoothstep(.01, .035, pw), 1.-smoothstep(.006, .02, pv)); }
      // the dwellings' lanes: a lantern by its own place in every few yards of them, lit and put out with the windows;
      // its pool lies warm on the trodden ground and on the mud walls about it
      vec2 lc = vW.xz/17., li = floor(lc), lf = (fract(lc)-.5-(vec2(h21(li+2.), h21(li+6.))-.5)*.5)*17.; float lh = h21(li+4.);
      emis += alb*vec3(1., .55, .2)*uWinGlow*step(lh, .2+.55*vK.z)*litNow(lh*.9)*1.3*exp(-dot(lf, lf)/16.)*(vK.y > .5 ? 1. : 1.-.6*step(.5, N.y));
    }
    // the cooking fires: each throws its glow on the ground and the mud walls about it and flickers on its own clock
    for (int i = 0; i < ${NF}; i++) {
      vec3 fd = uFire[i].xyz-vW; float f2 = dot(fd, fd);
      if (f2 < 1600.) { float fi = float(i), fl = .78+.22*sin(uTime*(7.+3.*fract(fi*.37))+fi*2.1)*sin(uTime*2.3+fi); emis += alb*vec3(1., .42, .1)*(uFire[i].w*fl*max(dot(N, fd*inversesqrt(f2+1e-4)), .2)/(1.+f2*.1)); }
    }
    if (vK.y > .5) {
      // the trodden ground outside the wall: ruts, and rain standing in them
      vec2 P = vW.xz; float pud = smoothstep(.56, .66, vn(P*.11+9.)*.65+vn(P*.37)*.35);
      alb *= mix(.8, .42, pud); gloss = uWet*pud;
      vec2 rp = ripples(P, uTime)*uRain*pud*(1.-smoothstep(.02, .25, fw));
      Ns = normalize(N+vec3(rp.x, 0., rp.y)*.35);
    }
  } else if (kind < 6.5) {
    alb *= .94+.12*vn(uv*3.);
  } else if (kind < 7.5) {
    // the painted room: roots in bright colours over every wall, lit by its own lamps
    vec2 p = uv*.5; p.x += .7*sin(p.y*1.3)+.5*vn(p*1.7);
    float l1 = abs(fract(p.x*.9+.5*sin(p.y*.7))-.5), l2 = abs(fract(p.x*2.1+p.y*.4+.3*sin(p.y*2.1))-.5), l3 = abs(fract(p.x*3.7-p.y*.9+.4*sin(p.y*3.3))-.5);
    vec3 c = vec3(.95, .74, .3);
    c = mix(c, vec3(.08, .3, .8), (1.-smoothstep(.07, .13, l3))); c = mix(c, vec3(.08, .55, .2), (1.-smoothstep(.09, .16, l2))); c = mix(c, vec3(.85, .08, .06), (1.-smoothstep(.12, .2, l1)));
    alb = c*.5; emis = c*1.6;
  } else if (kind < 8.5) { emis = vCol*uWinGlow; alb = vec3(0.); }
  else {
    // a window's pane: dark glass that takes the sky until its lamp is lit (aK.y is the pane's own place in the order of lighting)
    float on = litNow(vK.y), fl = .84+.16*vn(vec2(uTime*2.1+vK.y*70., vK.y*13.));
    alb = vec3(.012, .014, .022); emis = vCol*uWinGlow*on*fl; gloss = .8*(1.-on);
    // (ROUND 7: every pane is leaded: a lattice of lozenges 0.26 m across, read near)
    float lzg = min(abs(fract((uv.x+uv.y*.6)/.26)-.5), abs(fract((uv.x-uv.y*.6)/.26)-.5))*.26;
    emis *= 1.-.55*(1.-smoothstep(.02, .07, fw))*(1.-smoothstep(.012, .03, lzg));
  }
  float cs = mix(1., smoothstep(.3, .7, vn(vW.xz*.0035+uTime*vec2(.016, .007))*.65+vn(vW.xz*.011-uTime*vec2(.01, .02))*.35), uCloud);
  float sh = shadowAt(vW+N*.4)*cs*treeShade(vW+N*.4);
  // (the shadow of a small thing that stands on a dry floor is laid on the floor by the plan, long by the hour's own
  // light: no sun falls in it)
  if (kind > 1.5 && kind < 2.5 && fract(vK.z) > .1 && fract(vK.z) < .4) sh = 0.;
  // (ROUND 7: a wall in the shadow a buttress lays on it: the wall's own stone, its dress 3: no sun falls on it)
  if (kind < .5 && vK.z > 2.99 && vK.z < 3.99) sh = 0.;
  vec2 sx = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
  float toS = dot(N.xz, sx);
  // THE SHADE'S OWN LIGHT, one law for every face at every place and hour. FROM ABOVE, THE SKY: a face takes the
  // air's cool colour by how much of the sky it looks at; an upright face the glow of the sky it is turned to (the
  // furnace band on the sun's side, six tenths of it in a great shadow; the afterglow on the other); a floor or a
  // roof a share of the lit west whatever its bearing
  float side = 1.-abs(N.y)*.6;
  vec3 amb = mix(uGndCol, uSkyCol, N.y*.5+.5)+(uHorSun*(.3*max(toS, 0.)*mix(.6, 1., sh))+uAfter*max(-toS, 0.))*side+uHorSun*(.25*max(N.y, 0.));
  // AGAINST THE SUN A FACE IS DARKER: a wall turned from the sun takes the dim side of the sky (uSil: the share it
  // loses, by the hour); and THE DEEP PLACES HOLD THEIR OWN AIR: under the roofs' level in the back court, the gulf
  // and the lane (uDeep: their box in the wall's frame) the shade is a cool blue-green and no face is darkened
  // for its bearing
  float dw = dot(vW.xz, uDeepW.xy)-uDeepW.z, dt = dot(vW.xz, uWall.xy)-uWall.z;
  float deep = smoothstep(uDeep.x-20., uDeep.x+10., dw)*(1.-smoothstep(uDeep.y-10., uDeep.y+30., dw))*smoothstep(uDeep.z-14., uDeep.z-2., dt)*(1.-smoothstep(uDeep.w-10., uDeep.w+25., dt))*(1.-smoothstep(135., 175., vW.y));
  amb *= mix(1., mix(1.-uSil, 1., smoothstep(-.85, .1, toS)), (1.-deep)*(1.-abs(N.y)*.7));
  amb = mix(amb, amb*uDeepTint, deep);
  // FROM BELOW AND FROM ACROSS, THE WARM BOUNCE (uBounce: the hour's key light as the castle's own stone throws it
  // back): the lit ground under a face that looks down; the sunlit stone across a court or a lane before a face
  // turned from the sun, and half of that before any upright face (lit stone stands on some side of every yard);
  // seven tenths of it in the deep places, where less lit stone is in sight
  amb += uBounce*((.5+.5*max(-toS, 0.))*side*mix(1., .7, deep)+max(-N.y, 0.));
  // THE CLIFF'S OWN LIGHT, by place: the great face looks at the sun and throws its light back over the first of the
  // gulf; the pale dead wood that stands out of it takes that light on the sides it turns to the face (uWall: the
  // heading out of the face in plan, the face's place along it, the share of the sun that comes back)
  float tw = dot(vW.xz, uWall.xy)-uWall.z;
  amb += uSunCol*(uWall.w*wallB*max(-dot(N.xz, uWall.xy), 0.)*smoothstep(-2., 8., tw)*(1.-smoothstep(70., 260., tw)));
  // old rough stone takes a raking sun more strongly than a smooth face would
  vec3 col = alb*(uSunCol*pow(max(dot(N, uSunDir), 0.), .7)*sh+amb*vK.w+lampsAt(vW, N)+lampL)+emis;
  // (wet slate and wet flags have a broad sheen of their own under a low sun: the slopes that look at it glow)
  col += uSunCol*(gloss*.07*pow(max(dot(Ns, normalize(uSunDir+V)), 0.), 6.)*sh*(1.-field)*vK.w);
  // wet stone seen edge-on glints where it looks to the west: gold along every edge on the sun's side
  // (a floor seen along itself takes three tenths of it: a paved field under a low sun is gold, never a white sheet;
  // clay, turf and thatch are dry and dull: hardly any)
  col += (alb+.025)*uSunCol*(pow(1.-clamp(dot(N, V), 0., 1.), 3.)*smoothstep(-.3, .3, dot(N, uSunDir))*sh*.9*vK.w*mix(1., .3, step(1.5, kind)*step(kind, 3.5))*(1.-.85*step(4.5, kind)*step(kind, 5.5)));
  if (gloss > .001) {
    vec3 R = reflect(-V, Ns); R.y = abs(R.y);
    // (only standing water is a mirror edge-on: wet stone gives back six parts in ten at the most, slate two: a roof
    // that looks at the low sun stays slate, never a pale pane of the sky's light)
    // (THE DIM SKY'S SHEEN: toward the sun a slate gives back two parts in ten and no more; away from it, where the
    // sky it mirrors is the dim violet and the clouds' rose, five: a wet roof in the shade is read by that sheen,
    // slate by slate, and a great shadow takes less of it from the sun's side than from the other)
    vec2 r2s = R.xz/max(length(R.xz), 1e-4); float rs = clamp(dot(r2s, sx), 0., 1.); rs *= rs;
    float fr = min(f0+(1.-f0)*pow(1.-clamp(dot(Ns, V), 0., 1.), 4.), mix(mix(.6, mix(.5, .2, rs), step(.5, kind)*step(kind, 1.5)), 1., max(field, step(2.5, kind)*step(kind, 3.5))));
    vec3 rf = skyAt(R, glint);
    // (a pool of the field holds the sky's own picture and the turrets and the walls upside down, and stays a mirror
    // in their shadows; THE SUN'S PATH OF GLITTER: where the pool's wind-stirred water throws the sun back, bright
    // points that come and go on the world's clock in a short streak under the sun's image, each no brighter than the
    // image itself; far off, where a point is smaller than the picture's grain, the streak is the points' own mean)
    if (field > .001) {
      rf = mix(rf, mirrorSky(R), field);
      vec4 ms = massAt(vW, R); rf = mix(rf, ms.rgb, ms.a*field);
      vec3 R0 = reflect(-V, vec3(0., 1., 0.)); vec2 r2 = R0.xz/max(length(R0.xz), 1e-4);
      float daz = r2.x*sx.y-r2.y*sx.x, del = R0.y-uSunDir.y, lobe = exp(-daz*daz/.0014-del*del/.012)*step(0., dot(r2, sx));
      vec2 gc = vW.xz/.3; float hs = h21(floor(gc)), tw = .5+.5*sin(uTime*(2.+5.*hs)+hs*40.);
      float sp = mix(.105, step(.72, hs)*tw*tw, 1.-smoothstep(.06, .3, fw));
      rf += vec3(1.5, .86, .25)*(lobe*sp*(1.-ms.a)*field);
    }
    col += rf*fr*gloss*mix(mix(mix(.8, .4, rs), 1., sh), 1., field)*vK.w;
  }
  gl_FragColor = vec4(fogged(col, vW), 1.);
}`;
export function makeStoneMaterial(U, o = {}) {
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: STONE_VERT, fragmentShader: STONE_FRAG, vertexColors: true, side: o.side ?? THREE.FrontSide });
  return m;
}

// ---------------------------------------------------------------- THE PLAN OF A VISIT (plain numbers; no picture is needed to make it)
// the station of a course in plan (stations { x, z, az, s }) at its plan distance s (straight beyond both ends)
function planAt(R, s, out = {}) {
  const n = R.length - 1;
  if (s <= 0) { const a = R[0]; out.x = a.x + Math.sin(a.az) * s; out.z = a.z - Math.cos(a.az) * s; out.az = a.az; out.i = 0; return out; }
  if (s >= R[n].s) { const a = R[n], d = s - a.s; out.x = a.x + Math.sin(a.az) * d; out.z = a.z - Math.cos(a.az) * d; out.az = a.az; out.i = n; return out; }
  let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R[m].s <= s) lo = m; else hi = m; }
  const a = R[lo], b = R[lo + 1], t = (s - a.s) / (b.s - a.s);
  out.x = lerp(a.x, b.x, t); out.z = lerp(a.z, b.z, t); out.az = lerp(a.az, b.az, t); out.i = lo;
  return out;
}
const lin = (keys, x) => {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); }
  return keys[keys.length - 1][1];
};
const keyed = (keys, x) => {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], x)); }
  return keys[keys.length - 1][1];
};
// a curve through keys that never overshoots and never nods: a cubic between each pair, its slope at a key the harmonic
// mean of the two secants there (zero where they differ in sign: a summit or a floor stays where it was keyed)
const mono = (keys) => {
  const n = keys.length, sec = [], sl = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) sec.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  for (let i = 1; i < n - 1; i++) sl[i] = sec[i - 1] * sec[i] > 0 ? 2 * sec[i - 1] * sec[i] / (sec[i - 1] + sec[i]) : 0;
  return (x) => {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < n; i++) if (x <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], h = b[0] - a[0], t = (x - a[0]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * h * sl[i - 1] + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * h * sl[i];
    }
    return keys[n - 1][1];
  };
};
const dirOf = (az) => [Math.sin(az), -Math.cos(az)];

// measures of the place (metres). THE CASTLE'S PLAN IS DEALT WHOLE BEFORE THE LINE, in the wall's frame: w along the
// cliff's heading, t out of the cliff, the tree's root at nought (psi: degrees from the cliff's heading toward the gulf).
// The line is laid after it, through the places named here; its own numbers stand at the end.
export const M = {
  WALL_WALK: 34, WALL_THICK: 9,
  // THE CLIFF: its tall blocks stand from CLIFF_W0 to CLIFF_W1 along the wall, CLIFF_DEEP deep behind its face; the tree's
  // trunk stands out of it at TREE_Y, the table TABLE_T out on the trunk, the fork FORK_T out; the trunk TRUNK_R0 thick
  // (its radius) at the wall, TRUNK_R1 at the fork
  CLIFF_W0: -160, CLIFF_W1: 120, CLIFF_DEEP: 100, TREE_Y: 100, TABLE_T: 27, FORK_T: 81, TRUNK_R0: 4.4, TRUNK_R1: 2.4,
  // THE GULF under the cliff: GULF_FAR across; on its far side THE RIM, tall ranges RIM_DEEP deep, with one low length
  // (THE GAP, from GAP_W0 to GAP_W1 along the wall) through which the low sun reaches the tree. THE SLOT: one tall
  // range (the cross range) stands across the gulf from the rim toward the cliff (SLOT_W0 to SLOT_W1 along the wall)
  // and ends SLOT_T0 short of the cliff's face; a covered bridge joins its end to the cliff
  GULF_FAR: 143, RIM_DEEP: 34, RIM_W0: -100, RIM_W1: 300, GAP_W0: 90, GAP_W1: 206, SLOT_W0: -60, SLOT_W1: -38, SLOT_T0: 46,
  // THE CATS' HALL: a long hall in the gulf, parallel to the cliff, its eaves' parapet (the cats' walk) CATS_T out of
  // the cliff, from CATS_W0 along it, CATS_Y high
  CATS_T: 23.5, CATS_W0: 48, CATS_Y: 102,
  // THE KEEP: its first block from KEEP_W0 to KEEP_W1 along the wall and from KEEP_T0 to KEEP_T1 out of it; its front
  // looks on the field
  KEEP_W0: -360, KEEP_W1: -160, KEEP_T0: -30, KEEP_T1: 90,
  // THE FIELD OF FLAGSTONES: from the keep's front (FIELD_T0) to FIELD_T1, FIELD_W0 to FIELD_W1 along the wall, its
  // flags at QUAD_Y; the range on its near side NEAR_DEEP deep, the ranges on its two sides SIDE_DEEP deep
  QUAD_Y: 72, FIELD_T0: 90, FIELD_T1: 238, FIELD_W0: -380, FIELD_W1: -180, NEAR_DEEP: 28, SIDE_DEEP: 30,
  // THE GATE in the outer wall: it stands at (GATE_W, GATE_T); the wall's inward bearing there is GATE_PSI; the road
  // outside runs ROAD straight out of its arch. GATE_HALF: half the breadth of the field's own gatehouse
  GATE_W: -467, GATE_T: 364, GATE_PSI: -5, ROAD: 420, GATE_HALF: 19,
  // THE FORECOURT: a paved yard before the field's gatehouse, on the field's own axis, FORE_HALF to either hand of it
  // and FORE_DEEP out from the gatehouse, at the flags' level; out of the gatehouse's arch a worn way lies on its
  // flags (WAY_HALF and WAY_LONG, by the arch's own measure, at this file's head)
  FORE_HALF: 26, FORE_DEEP: 80,
  // THE BACK COURT behind the keep: paved, from the keep's flank to the cross range and from the cliff's foot
  // COURT_T1 out, at COURT_Y, and on through the slot under its bridge. THE SLOT'S BRIDGE: a covered gallery on two
  // pointed arches from the cliff to the cross range's end (a pier under its middle, an abutment at either end),
  // from SBRIDGE_W0 to SBRIDGE_W1 along the wall, its arches springing at SBRIDGE_SPRING, its ridge at SBRIDGE_RIDGE
  COURT_Y: 78, COURT_T1: 118, SBRIDGE_W0: -55, SBRIDGE_W1: -43, SBRIDGE_SPRING: 84, SBRIDGE_RIDGE: 114,
  // THE LANE OF THE TOWER'S WARD: a straight way to the finger tower on the bearing LANE_PSI; its mouth stands at
  // (LANE_W, LANE_T); between LANE_FROM and LANE_TO metres before the tower's middle two tall ranges stand to either
  // hand of it, LANE_WIDE apart, over a court at LANE_Y; one covered bridge joins them BRIDGE_AT before the tower,
  // BRIDGE_LONG along the lane, its arch springing at BRIDGE_SPRING and its crown at BRIDGE_CROWN. The ring stands in
  // the tower's face on the lane's own bearing, RING_Y high
  LANE_PSI: 12, LANE_W: 140, LANE_T: 22, LANE_FROM: 246, LANE_TO: 130, LANE_WIDE: 18, LANE_DEEP: 22, LANE_Y: 88, BRIDGE_AT: 176, BRIDGE_LONG: 10, BRIDGE_SPRING: 110, BRIDGE_CROWN: 126,
  RING_Y: 122, RING_R: 7,
  // THE TOWER'S ROUND: a paved yard about the finger tower's foot, ROUND_R from its middle, at the lane's court's
  // level; its rim is laid in ROUND_N lengths; the lane opens on it by an apron as broad as the lane's whole
  // ground, which meets the rim along the APRON_N lengths to either hand of the lane's bearing. THE OPEN WAY: the
  // round is open where the lane's mouth and its apron meet it, that is from that stretch of the rim in to the
  // tower's foot, and one rim length more to either hand; the fists stand at the tower's foot everywhere else
  ROUND_R: 100, ROUND_N: 48, APRON_N: 3,
  // THE LINE (laid after every place above is dealt, over what stands): it begins START before the outer wall's walk,
  // on one of the ENTRY_PSI bearings, level for ENTRY_LEVEL at ENTRY_OVER above the walk and STRAIGHT FOR ITS FIRST
  // ENTRY_STRAIGHT (a law of the line's own shape: no course whose arc bends the line sooner is a course at all); it crosses the wall at one
  // of the CROSS offsets along it from the gate; one arc brings it on to the field's axis at one of the ARC_END
  // distances before the gatehouse (of all those courses whose arc is no tighter than R_ENTRY, the one that keeps
  // farthest from every tower that stands as high as it flies; where that one would pass a tower's wall nearer than
  // ROOM, the one of the finer family, the _FINE lists, that passes every wall widest); from the wall to the keep it climbs over the roofs as they stand
  // (ROOF_OVER above every roof and stack within ROOF_SIDE of it, never steeper than SLOPE_UP) to KEEP_OVER above
  // the keep's first roof; R_FIELD round to the bearing KEEP_PSI through the keep's shoulder; R_GULF round and down
  // (its knots set by SLOPE_DOWN; by its own tangent 0.19 at its steepest as flown) to the cliff, along which it flies PASS_T out, SBRIDGE_OVER above the slot's
  // bridge and TREE_CLEAR and more above the highest place of any limb within TREE_NEAR of its course in plan;
  // R_LANE into the lane, LANE_EYE over its court; level for the last LEVEL_END; it ends END_SHORT before the
  // tower's middle
  START: 135, ENTRY_LEVEL: 100, ENTRY_STRAIGHT: 60, ENTRY_PSI: [17, 11, 23, 5, -1, -7], ENTRY_OVER: 12, CROSS: [76, 68, 84, 60, 92, 52, 100, 44, 108, 116, 124, 132, 140], ARC_END: [44, 14, 74], R_ENTRY: 110, ROOM: 8,
  ENTRY_PSI_FINE: [17, 11, 23, 5, -1, -7, 14, 20, 8, 2, -4], CROSS_FINE: [76, 68, 84, 60, 92, 52, 100, 44, 108, 116, 124, 132, 140, 72, 80, 64, 88, 56, 96, 48, 104, 112, 120, 128, 136], ARC_END_FINE: [44, 14, 74, 29, 59], ROOF_OVER: 9, ROOF_SIDE: 7, SLOPE_UP: 0.22, SLOPE_DOWN: 0.12,
  R_FIELD: 120, KEEP_PSI: -35, KEEP_OVER: 20, R_GULF: 110, PASS_T: 15, SBRIDGE_OVER: 6, R_LANE: 150,
  TREE_NEAR: 6, TREE_CLEAR: 4.5, LANE_EYE: 20, LEVEL_END: 74, END_SHORT: 25.5,
  // THE TRUE CLEARANCE: a thing whose nearest place would stand within CLEAR of the line is left out, after its draws
  // (a bird on the wing: its whole round within CLEAR_FLOWN). A tower is asked no more than any other thing: the
  // room from walls is the line's to give, by its choice of course
  CLEAR: 2.5, CLEAR_FLOWN: 2.8,
};

const FORKS = ['plan', 'weather', 'towers', 'great', 'ranges', 'mid', 'far', 'wallout', 'huts', 'quad', 'heromass', 'tree', 'rooks', 'cats', 'smoke', 'finger', 'fists', 'cloth', 'owls', 'sky', 'pools', 'chimneys', 'dormers', 'midtowers', 'fartowers', 'perch', 'quadrooks', 'roofrooks', 'hutsmoke', 'flags', 'bats', 'weed', 'lane', 'midsmoke', 'lift', 'fieldside', 'fielddress', 'fieldweeds', 'keep', 'parliament', 'fistsmoke', 'crown', 'rim', 'gate', 'ledge', 'fires', 'yards', 'oldstone', 'r7tower', 'r7walls', 'r7yard', 'r7lane', 'r7m1front', 'r7m1heads'];
// The whole plan of a visit from its seed. THE ORDER: the frame, the hour and the sun; the places; the masses of the
// places and of the country; the details; the life; and only then THE LINE, laid through the places; last, the true
// clearance: what would stand within it of the line is left out and counted (P.left, by kind).
// (Y, when given, hands the frame back between pieces of work: the build passes ctx.yield; a replay passes nothing)
export async function roofPlan(seed, vary = {}, Y = null) {
  // FORKS: one stream to a thing, each made from the seed and its name, all taken here before any loop runs
  const R_ = {}; for (const name of FORKS) R_[name] = makeRng(hashSeed(name + ':' + seed));
  const noise = makeNoise(hashSeed('roofs-of-the-old-stone-noise:' + seed));
  const pr = R_.plan, mir = pr.chance(0.5) ? 1 : -1, hA = pr.range(0, TAU), sunPsi = pr.range(39, 42), sunEl = pr.range(11, 15), moonPsi = pr.range(-128, -120);
  // the hour is the visitor's (day: a grey-gold afternoon; night: the moon; dawn: a pale rose morning; any other:
  // the sunset as written); the
  // weather is the seed's: on 40 sunsets in 100 it has just rained (the few pools on the field are ruffled by drops)
  const wr = R_.weather, rainDraw = wr();
  const hour = vary.hour === 'day' ? 'day' : vary.hour === 'night' ? 'night' : vary.hour === 'dawn' ? 'dawn' : 'sunset';
  const rain = hour === 'day' ? true : hour === 'sunset' ? rainDraw < 0.4 : false;
  // ---- THE FRAME: the wall's. The cliff's heading is the seed's (any bearing); the hand of the place is the seed's
  const W = dirOf(hA), T = dirOf(hA - 90 * DEG * mir), root = [0, 0];
  const toWT = (x, z) => [x * W[0] + z * W[1], x * T[0] + z * T[1]];
  const fromWT = (w, t) => [W[0] * w + T[0] * t, W[1] * w + T[1] * t];
  const P = { seed, mir, hour, rain, sunEl, sunPsi, moonPsi, hA, W, T, root, toWT, fromWT, noise, R_,
    // (everything the plan is given later is named here, empty, in the order of its giving: the plan keeps one shape
    // from its making on, and what reads it is not made again for each thing it gains)
    sunAz: NaN, moonAz: NaN, Y: null, density: NaN, rare: false, liftPhase: NaN, quad: null, tree: null, treeLimbs: null, lane: null, laneUV: null, laneAt: null, finger: null, treeAlone: null, outer: null, inside: null, gulf: null,
    wardAt: null, heartAt: null, groupAt: null, regionOf: null, hill: null, gate: null, road: null, keep: null, inKeep: null, cats: null, wash: null, ranges: null, towers: null, nearRange: null, quadRanges: null, massB: null, rim: null, slot: null, sbridge: null, lamps: null, heaps: null, inHeap: null, parapet: null, fists: null, TW: null, TWn: 0,
    casters: null, wind: null, windAz: NaN, lanes: null, moundY: null, plumes: null, chimneys: null, dormers: null, huts: null, yards: null, LNG: null, LNC: null, TSC: null, TS: null, SCF: null, SC: null, pools: null, poolAt: null, heroYaw: NaN,
    heroToWorld: null, LC: null, FS: null, GY: null, heroM: null, fires: null, perches: null, owlWindows: null, birds: null, flags: null, weed: null, weeds: null, yard: null, yardSol: null, glows: null, bats: null, floorY: null, box: null,
    RT: null, ys: null, nRT: 0, sEnd: 0, path: null, L: 0, mOf: null, LN: null, LN_N: 0, hE: NaN, s: null, yTree: NaN, cross: NaN, entryPsi: NaN, arcEnd: NaN, room: NaN, fine: false, left: null, leftAt: null };
  // the sun's bearing is the wall's: 39 to 42 degrees out of the cliff's heading toward the gulf, over the gulf's far
  // end (at night the moon does its work from the same bearing; the pale moon of the sunset stands opposite, low)
  P.sunAz = hA - sunPsi * DEG * mir; P.moonAz = hA - moonPsi * DEG * mir;
  P.Y = Y ? Y : async () => {};
  // density (0.7 to 1.3, the visitor's) scales the chimneys that stand, the birds, the cats, the windows; rare: the rooks' lift
  P.density = clamp(Number.isFinite(vary.density) ? vary.density : 1, 0.7, 1.3); P.rare = !!vary.rare; P.liftPhase = R_.lift();
  planPlaces(P);
  // ---- THE TREE IS DEALT WHOLE BY ITS OWN LAW (fork 'tree' its limbs, fork 'crown' its second tier): no limb is broken,
  // thinned or left out for the line (the line is laid clear of the tree as dealt)
  const tr = R_.tree, tFork = M.FORK_T + tr.range(0, 3), reach = tFork + tr.range(32, 38);
  P.treeLimbs = await treeLimbs(tr, { zFork: tFork, reach, r0: M.TRUNK_R0, r1: M.TRUNK_R1, sx: -mir, tTable: M.TABLE_T, crown: R_.crown }, Y);
  P.tree = { y: M.TREE_Y, tTable: M.TABLE_T, tFork, reach, r0: M.TRUNK_R0, r1: M.TRUNK_R1, top: 0, doorW: -11, doorWide: 6, doorTall: 10.5, table: null };
  { const table = fromWT(0, M.TABLE_T); P.tree.table = [table[0], M.TREE_Y + M.TRUNK_R1 * 0.8, table[1]]; }
  await P.Y();
  await planMasses(P);
  await planDetails(P);
  await planLife(P);
  await P.Y();
  await layLine(P);
  await P.Y();
  await clearLine(P);
  return P;
}

const dirP = (psi) => [Math.cos(psi * DEG), Math.sin(psi * DEG)];
// THE PLACES OF THE CASTLE, each by its own measures in the wall's frame: the lane and the finger tower at its end,
// the gate and the outer wall, the field and its forecourt, the keep's back court, the gulf with its rim, the tower's
// round, and what a place is called (regionOf), how high its roofs stand (hill) and how deep in the castle it lies
// (wardAt). No line exists yet.
function planPlaces(P) {
  const { fromWT, mir, R_ } = P;
  // ---- THE LANE OF THE TOWER'S WARD and the finger tower at its end: the lane's bearing, and how far before the
  // tower's middle (u) and to which hand of the lane's axis (v, + to the right going in) a place lies
  const eL = dirP(M.LANE_PSI), towWT = [M.LANE_W + eL[0] * M.LANE_FROM, M.LANE_T + eL[1] * M.LANE_FROM];
  const laz = P.hA - M.LANE_PSI * DEG * mir, ld = dirOf(laz), lr = [Math.cos(laz), Math.sin(laz)], tc = fromWT(towWT[0], towWT[1]);
  P.lane = { az: laz, dir: ld, right: lr, x: tc[0], z: tc[1], u0: M.LANE_FROM, u1: M.LANE_TO, half: M.LANE_WIDE / 2, deep: M.LANE_DEEP, y: M.LANE_Y, wt: towWT, ranges: null, bridge: null, lamps: null };
  P.laneUV = (x, z) => { const dx = x - tc[0], dz = z - tc[1]; return [-(dx * ld[0] + dz * ld[1]), dx * lr[0] + dz * lr[1]]; };
  P.laneAt = (u, v) => [tc[0] - ld[0] * u + lr[0] * v, tc[1] - ld[1] * u + lr[1] * v];
  // the finger tower: a great shaft, 76 m through at its foot and 42 m at its broken head, so that its head reads as a
  // tower's from the outer wall; the window's arch with the ring looks down the lane
  const fr = R_.finger;
  P.finger = { x: tc[0], z: tc[1], rBase: 38, rRing: 27, rTop: 21, base: -24, top: fr.range(330, 350) + FINGER_UP, lean: fr.range(0.5, 1.2), bite: fr.range(0, TAU), ringY: M.RING_Y, az: laz, turrets: [] };
  // the smaller towers on the finger (same fork): eleven turrets that stand out of its shaft on corbels at their own heights
  // and bearings; none stands within 55 degrees of the lane's bearing unless it is 45 m above or below the ring
  for (let k = 0; k < 11; k++) {
    const th = fr.range(0, TAU), y = fr.range(60, 262), r = fr.range(4, 6.5), h = fr.range(18, 38), cap = fr.int(0, 1), sd = fr.int(1, 60);
    const dth = Math.abs((((th - (laz + Math.PI)) % TAU) + TAU + Math.PI) % TAU - Math.PI);
    P.finger.turrets.push({ th, y, r, h, cap, sd, on: dth > 55 * DEG || y - r * 1.8 > M.RING_Y + 45 || y + h + r * 2.6 < M.RING_Y - 45 });
  }
  // (top0: the height the tower had before round 7: the keep's great tower, the wheeling rooks and the owls' windows
  // keep to it, so that the life about the ring is as thick as it was)
  P.finger.top0 = P.finger.top - FINGER_UP;
  // ROUND 7, THE FINGER'S HIGH LIGHTS (fork 'r7tower'): seven tall windows are drawn for the storeys the tower has
  // over its old height, each at its own bearing and height round the shaft (one law all round, as its owls' windows
  // are dealt); one stands where it is whole in one storey's wall, clear of the collars, or is left out after its draws
  { const tr = R_.r7tower, F = P.finger; F.lights = [];
    for (let k = 0; k < 7; k++) {
      const th = tr.range(0, TAU), y = tr.range(F.top0 - 6, F.top - 46), tall = tr.range(7, 11), warm = tr(), W = fingerWall(F, y);
      F.lights.push({ th, y, tall, warm, on: !W.shell && y - tall / 2 - 1 > W.lo + 2.4 && y + tall / 2 + 1 < W.hi - 0.5 });
    } }
  // MENDING 1, M1: THE GREAT FRONT IS A BROKEN GATE OF THE TOWER, NOT A CHURCH'S FRONT (fork 'r7m1front', a stream of
  // its own; every draw is taken here before anything is built). Over the old arch, on the shaft's own face, THREE
  // OPENINGS, NO TWO ALIKE: each its own place across the face (5.6 m apart and 1.3 m to either hand of that), its
  // own sill (3 to 10 m over the old arch's storey), its own breadth (a slit of 1.1 m to a loading door of 3 m as dealt) and
  // its own height: one tall (11 to 15 m), one middling (6.5 to 9.5 m), one short (3 to 5.5 m); the tall one stands
  // to one hand or the other, never in the middle. Each is blind (walled up), shuttered or empty by its own draw;
  // on half the seeds one of them (if it is not walled up) keeps a dim lamp behind its boards, lit and put out
  // with the hour's standing share at a place of its own in the order of lighting, never among the first three
  // tenths. THE PIERS' HEADS are broken stumps of unequal height: one 14 to 24 m over the pier, the other 3.5 to 10 m
  { const fq = R_.r7m1front, F = P.finger, tallAt = fq.chance(0.5) ? 0 : 2, midAt = fq.chance(0.5) ? 1 : 2 - tallAt, lamp = fq.int(0, 5), order = fq.range(0.3, 0.9), hiSide = fq.chance(0.5) ? 1 : -1, hi = fq.range(14, 24), lo = fq.range(3.5, 10), open = [];
    for (let k = 0; k < 3; k++) {
      const off = fq.range(-1.3, 1.3), sill = fq.range(3, 10), tall = fq(), half = fq.range(0.55, 1.5), state = fq.int(0, 2), sd = fq.int(1, 99);
      const kind = k === tallAt ? 2 : k === midAt ? 1 : 0, h = kind === 2 ? lerp(11, 15, tall) : kind === 1 ? lerp(6.5, 9.5, tall) : lerp(3, 5.5, tall);
      open.push({ x: (k - 1) * 5.6 + off, sill, h, half, state, sd, lamp: lamp === k && state !== 0, order });
    }
    // MENDING 2, R9: NO TWO OPENINGS RUN TOGETHER: after the draws each pair of neighbours is held so that 0.6 m of
    // the tower's stone stays between their surrounds (a surround reaches 0.45 m past its opening) and a hand (0.1 m)
    // between their sill slabs (a slab reaches 0.7 m): the narrower of the two yields: an outer one first moves
    // outward as far as the recess holds it (its slab's end 9.1 m from the middle at most), then it is made narrower
    // (never under 0.8 m), then the broader is narrowed too. No draw is added: the stream deals as it did
    for (const [i, j] of [[0, 1], [1, 2]]) {
      const oa = open[i], ob = open[j]; let lack = oa.half + ob.half + 1.5 - (ob.x - oa.x); if (lack <= 0) continue;
      const n = oa.half <= ob.half ? oa : ob, w = n === oa ? ob : oa;
      if (n !== open[1]) { const mv = Math.min(lack, Math.max(0, 9.1 - (Math.abs(n.x) + n.half + 0.7))); n.x += (n === open[0] ? -1 : 1) * mv; lack -= mv; }
      if (lack > 0) { const cut = Math.min(lack, n.half - 0.4); n.half -= cut; lack -= cut; }
      if (lack > 0) w.half -= Math.min(lack, w.half - 0.4);
    }
    F.front = { open, stumps: hiSide > 0 ? [lo, hi] : [hi, lo] }; }
  // THE TREE STANDS ALONE OVER THE GULF: a tower of any kind whose wall would stand within 110 m of the trunk's line,
  // root to crown's end, in plan is left out, after its draws (r: the tower's own radius)
  P.treeAlone = (x, z, r) => { const wt = P.toWT(x, z); return Math.hypot(wt[0], Math.max(0, -wt[1], wt[1] - 120)) >= 110 + r * 1.3; };
  // ---- THE GATE AND THE OUTER WALL: the wall is a great arc through the gate, the castle inside it; the gate stands
  // at its own place and the wall's inward bearing there is the gate's. THE ROAD is trodden ground: it runs straight
  // out of the gate's arch on the gate's own bearing (P.road: how far a place outside the wall lies from its middle)
  const gate = [M.GATE_W, M.GATE_T], nIn = dirP(M.GATE_PSI);
  const Rw = 1500, oc = fromWT(gate[0] + nIn[0] * Rw, gate[1] + nIn[1] * Rw), g = fromWT(gate[0], gate[1]);
  P.outer = { cx: oc[0], cz: oc[1], R: Rw, a0: Math.atan2(g[0] - oc[0], -(g[1] - oc[1])), gx: g[0], gz: g[1] };
  P.inside = (x, z) => P.outer.R - Math.hypot(x - P.outer.cx, z - P.outer.cz);
  { const dx = (g[0] - oc[0]) / Rw, dz = (g[1] - oc[1]) / Rw;
    P.gate = { wt: gate, x: g[0], z: g[1], out: [dx, dz] };
    P.road = (x, z) => { const ox = x - g[0], oz = z - g[1], al = ox * dx + oz * dz; return al < -2 || al > M.ROAD ? 1e9 : Math.abs(ox * dz - oz * dx); }; }
  // ---- the field of flagstones, the keep's ground, the cliff, the gulf under it
  P.quad = { w0: M.FIELD_W0, w1: M.FIELD_W1, t0: M.FIELD_T0, t1: M.FIELD_T1, y: M.QUAD_Y, mid: (M.FIELD_W0 + M.FIELD_W1) / 2 };
  P.gulf = { w0: M.KEEP_W1, w1: M.RIM_W1, t0: 0, t1: M.GULF_FAR };
  // where a place lies: 0 outside the outer wall, 1 the roofs, 2 the field and its ranges, 3 the cliff's blocks, 4 the
  // gulf, 5 the lane's own ground (its two ranges, its court, 4 m about them, and its apron on to the round's rim),
  // 6 the keep's, 7 the rim's and the cross range's, 8 the forecourt, 9 the back court, 10 the tower's round
  const q = P.quad, gf = P.gulf;
  P.regionOf = (x, z, pad = 0) => {
    if (P.inside(x, z) < M.WALL_THICK / 2 + pad) return 0;
    // (the same sums as toWT and laneUV make, without their arrays: this is asked for every corner of every roof)
    const w = x * P.W[0] + z * P.W[1], t = x * P.T[0] + z * P.T[1];
    const dx = x - tc[0], dz = z - tc[1], lu = -(dx * ld[0] + dz * ld[1]), lv = dx * lr[0] + dz * lr[1];
    if (dx * dx + dz * dz < (M.ROUND_R + pad) * (M.ROUND_R + pad)) return 10;
    if (lu > 0 && lu < M.LANE_FROM + 4 + pad && Math.abs(lv) < M.LANE_WIDE / 2 + M.LANE_DEEP + 4 + pad) return 5;
    if (Math.abs(w - q.mid) < M.FORE_HALF + pad && t > q.t1 + M.NEAR_DEEP - pad && t < q.t1 + M.NEAR_DEEP + M.FORE_DEEP + pad) return 8;
    if (w > q.w0 - M.SIDE_DEEP - pad && w < q.w1 + M.SIDE_DEEP + pad && t > q.t0 - pad && t < q.t1 + M.NEAR_DEEP + pad) return 2;
    if (w > M.KEEP_W0 - 14 - pad && w < M.KEEP_W1 + 14 + pad && t > M.KEEP_T0 - 14 - pad && t < M.KEEP_T1 + pad) return 6;
    if (w > M.CLIFF_W0 - pad && w < M.CLIFF_W1 + pad && t > -M.CLIFF_DEEP - pad && t < pad) return 3;
    if (w > M.RIM_W0 - pad && w < M.RIM_W1 + pad && t > M.GULF_FAR - pad && t < M.GULF_FAR + M.RIM_DEEP + pad) return 7;
    if (w > M.SLOT_W0 - pad && w < M.SLOT_W1 + pad && t > M.SLOT_T0 - pad && t < M.GULF_FAR + pad) return 7;
    if (w > M.KEEP_W1 - pad && w < M.SLOT_W0 + pad && t > -pad && t < M.COURT_T1 + pad) return 9;
    if (w > M.SLOT_W0 - pad && w < M.SLOT_W1 + pad && t > -pad && t < M.SLOT_T0 + pad) return 9;
    if (w > gf.w0 - pad && w < gf.w1 + pad && t > gf.t0 - pad && t < gf.t1 + pad) return 4;
    return 1;
  };
  // HOW DEEP IN THE CASTLE A PLACE LIES (the wards): its plan distance from THE PLACES THAT STAND: the field with its
  // gatehouse and forecourt, the keep, the cliff and the gulf with its rim, the gate, the lane with its apron, the
  // tower's round. 0 in such a place; the fine make of roofs and towers belongs to the inner ward (under 235 m), the
  // middle make to the middle ward, the far make beyond
  const heart = [[M.FIELD_W0, M.KEEP_T0, M.FIELD_W1, M.FIELD_T1 + M.NEAR_DEEP], [M.CLIFF_W0, -M.CLIFF_DEEP, M.CLIFF_W1, 0], [M.KEEP_W1, 0, M.RIM_W1, M.GULF_FAR + M.RIM_DEEP],
    [q.mid - M.FORE_HALF, M.FIELD_T1 + M.NEAR_DEEP, q.mid + M.FORE_HALF, M.FIELD_T1 + M.NEAR_DEEP + M.FORE_DEEP]];
  // (the distance from the field, the keep, the cliff and the gulf alone)
  P.heartAt = (x, z) => { const w = x * P.W[0] + z * P.W[1], t = x * P.T[0] + z * P.T[1]; let d = 1e9; for (const h of heart) d = Math.min(d, Math.hypot(Math.max(h[0] - w, 0, w - h[2]), Math.max(h[1] - t, 0, t - h[3]))); return d; };
  // (which of the castle's great meshes a thing of the inner ward is laid into, by its place: 0 the gate's ward, 1 the
  // forecourt and the field's near side, 2 the field and the keep, 3 the court, the cliff and the gulf's first half,
  // 4 the gulf's second half and the lane, 5 the tower's ward)
  P.groupAt = (x, z) => { const w = x * P.W[0] + z * P.W[1], t = x * P.T[0] + z * P.T[1]; return w < M.KEEP_W0 - 60 ? 0 : t > M.FIELD_T1 - 20 && w < M.FIELD_W1 + 40 ? 1 : w < M.KEEP_W1 ? 2 : w < 70 ? 3 : w < 250 ? 4 : 5; };
  P.wardAt = (x, z) => {
    const w = x * P.W[0] + z * P.W[1], t = x * P.T[0] + z * P.T[1]; let d = 1e9;
    for (const h of heart) d = Math.min(d, Math.hypot(Math.max(h[0] - w, 0, w - h[2]), Math.max(h[1] - t, 0, t - h[3])));
    if (d > 0) {
      const dx = x - tc[0], dz = z - tc[1], lu = -(dx * ld[0] + dz * ld[1]), lv = dx * lr[0] + dz * lr[1];
      d = Math.min(d, Math.hypot(x - g[0], z - g[1]), Math.max(0, Math.hypot(dx, dz) - M.ROUND_R), Math.hypot(Math.max(-lu, 0, lu - M.LANE_FROM), Math.max(0, Math.abs(lv) - M.LANE_WIDE / 2 - M.LANE_DEEP)));
    }
    return d;
  };
  // the roof hill: how high the roofs of a place stand: the castle rises inward from its outer wall (against the
  // wall the roofs stand under its walk, and the hill's own swells grow with it over the first 150 m); the gulf's
  // roofs lie deep under the cliff
  P.hill = (x, z) => {
    const n = P.noise, wt = P.toWT(x, z), din = P.inside(x, z);
    const inGulf = smoothstep(gf.t0 - 1, gf.t0 + 18, wt[1]) * (1 - smoothstep(gf.t1 - 20, gf.t1 + 10, wt[1])) * smoothstep(gf.w0 - 10, gf.w0 + 20, wt[0]) * (1 - smoothstep(gf.w1 - 20, gf.w1 + 40, wt[0]));
    const up = 30 + 62 * smoothstep(40, 420, din) + (13 * n.fbm2(x * 0.0045, z * 0.0045, 2) + 7 * n.n2(x * 0.017 + 5, z * 0.017)) * smoothstep(0, 150, din);
    return lerp(up, 52 + 22 * (0.5 + 0.5 * n.n2(x * 0.011, z * 0.011 + 9)), inGulf);
  };
}

// a mass laid in the wall's frame: along = 'w' (ridge along the wall) or 't'; g: the ward it is drawn with (see WARDS)
function wallMass(P, w0, w1, t0, t1, along, o) {
  const c = P.fromWT((w0 + w1) / 2, (t0 + t1) / 2);
  return { x: c[0], z: c[1], yaw: along === 'w' ? P.hA : P.hA - 90 * DEG * P.mir, hw: (along === 'w' ? t1 - t0 : w1 - w0) / 2, hl: (along === 'w' ? w1 - w0 : t1 - t0) / 2, zone: 0, tone: 1, win: 0.45, sd: 7, chim: 0, blue: 0.5, g: 0, ...o };
}
// ROUND 7, A1: THE BUTTRESSES OF A GREAT FACE (fork 'r7walls', asked face by face in the plan's own fixed order: the
// keep's front, its second mass's flank toward the gulf, the lane's six lengths (outer face, then the face on the
// court), the cliff's blocks, the rim's lengths, the cross range's two long faces). They
// stand at UNEQUAL places: the first a fifth to seven tenths of g0 from the face's end, each next one g0 to g1 metres
// on from the one before. Each is its own: its breadth (0.74 to wmax of the face's rule, most of them slim and a few
// great), its depth (d0 to d1 of the rule), its height (0.84 to 1.03 of the rule's, each stage a little its own), and
// stands in the rule's stages, every stage narrower than the one under it, its head a weathering that slopes down
// from the wall to the stage's own face (fall). a, b: the face's two ends in plan; out: the way out of the face; y0:
// the foot; ya to yb: the heights the rule's shares are taken between. Each stage is an upright box in a frame whose
// across is the way out of the wall; lim: how far the face runs along the frame either way from the stage's middle
// (the shadow a stage lays on its wall stops at the face's end). marks: where each stands along the face, how broad
// and how deep at its foot
function faceButts(rng, a, b, out, y0, ya, yb, o) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len, yaw = Math.atan2(out[1], out[0]), l = [], marks = [];
  const sz = Math.sin(yaw) * ux - Math.cos(yaw) * uz >= 0 ? 1 : -1, d0 = o.d0 ?? 0.72, d1 = o.d1 ?? 1.24, wmax = o.wmax ?? 1.7, last = o.steps.length - 1;
  let f = rng.range(o.g0 * 0.2, o.g0 * 0.7);
  for (let k = 0; k < 64 && f < len - 1.2; k++) {
    const rw = rng(), wide = lerp(0.74, wmax, rw * rw), deep = rng.range(d0, d1), hk = rng.range(0.84, 1.03), st = rng(), gap = rng.range(o.g0, o.g1);
    const fa = o.at ? o.at(f) : f, hl = o.hl * wide;
    marks.push({ f: fa, hl, deep: 2 * o.steps[0][0] * deep });
    for (let i = 0; i <= last; i++) {
      const dp = o.steps[i][0] * deep, fr = Math.min(0.985, o.steps[i][1] * hk * (1 + 0.1 * (((st * (7.3 + 3.1 * i)) % 1) - 0.5))), y1 = lerp(ya, yb, fr);
      l.push({ x: a[0] + ux * fa + out[0] * dp, z: a[1] + uz * fa + out[1] * dp, yaw, hw: dp, hl: hl * (1 - 0.1 * i), y0, y1, fall: Math.min(2.2 * dp, (y1 - ya) * 0.4), out: 1, lim: sz > 0 ? [-fa, len - fa] : [fa - len, fa], ivy: o.ivy ? o.ivy(fa, k) : undefined });
    }
    f += gap;
  }
  l.marks = marks;
  return l;
}
// THE KEEP (fork 'keep'): the one great mass of the castle, THE LANDMARK: it closes the far side of the field of
// flagstones, on the field's own axis, its front 200 m long on the flags. Four masses stepped back one on another: the
// first with a buttressed front and a terrace of leads behind merlons; the second, set back, whose face toward the
// field is one tall wall of narrow windows of which a few are lit; the third; and a hipped hall on that. A turret at
// every corner of the three lower masses, smaller towers on them, and at the first mass's back corner a great square
// tower whose head stands 40 m and more under the finger tower's. A ledge crosses the front, and black ivy comes down
// its end toward the gulf. It is dealt before every other mass: what would stand in its ground is left out.
function planKeep(P, ranges, towers) {
  const kp = P.R_.keep, w0 = M.KEEP_W0, w1 = M.KEEP_W1, t0 = M.KEEP_T0, t1 = M.KEEP_T1;
  const yB = kp.range(110, 116), yU = yB + kp.range(52, 62), ox = kp.range(-10, 10), yT = Math.min(kp.range(285, 305), P.finger.top0 - 40);
  const ups = []; for (let k = 0; k < 12; k++) ups.push(kp());
  const yV = yU + kp.range(40, 52), ox2 = kp.range(-8, 8), sds = []; for (let k = 0; k < 12; k++) sds.push(kp.int(1, 60));
  const piece = (a, b, c, d, o) => { const m = wallMass(P, a, b, c, d, 'w', { zone: 0, part: 'keep', tone: 0.98, g: 2, ...o }); ranges.push(m); return m; };
  const base = piece(w0, w1, t0, t1, { roof: 2, eave: yB, ridge: yB, base: 40, win: 0.34, sd: 31, ivy: 0 });
  const u0 = w0 + 24 + ox, u1 = w1 - 50 + ox, uT = t1 - 34;
  const upper = piece(u0, u1, t0 + 8, uT, { roof: 2, eave: yU, ridge: yU, base: yB - 2, win: 0.26, sd: 32 });
  const v0 = u0 + 26 + ox2, v1 = u1 - 26 + ox2;
  const third = piece(v0, v1, t0 + 16, uT - 20, { roof: 2, eave: yV, ridge: yV, base: yU - 2, win: 0.3, sd: 34 });
  piece(v0 + 12, v1 - 12, t0 + 24, uT - 30, { roof: 1, eave: yV + 12, ridge: yV + 28, base: yV - 2, win: 0.3, sd: 33 });
  // THE FRONT'S BUTTRESSES: great stepped ones from the flags to under the merlons, in three stages. ROUND 7: they
  // stand at unequal places 8.5 to 21 m apart, each its own (faceButts); and the second mass's flank toward the gulf,
  // which the line passes through the keep's shoulder, carries its own from the first mass's leads up
  const wr7 = P.R_.r7walls;
  base.butts = faceButts(wr7, P.fromWT(w0 + 9, t1), P.fromWT(w1 - 9, t1), P.T, M.QUAD_Y - 2, M.QUAD_Y, yB, { g0: 8.5, g1: 21, hl: 2.1, steps: [[3.4, 0.5], [2.2, 0.76], [1.1, 0.94]], ivy: (f, k) => (w0 + 9 + f > w1 - 72 && w0 + 9 + f < w1 - 18 ? 0.42 + 0.14 * h1(k * 5.3) : 0) });
  base.marks = base.butts.marks;
  upper.butts = faceButts(wr7, P.fromWT(u1, t0 + 17), P.fromWT(u1, uT - 9), P.W, yB - 1.2, yB - 1.1, yU, { g0: 8, g1: 18, hl: 1.7, steps: [[2.2, 0.5], [1.4, 0.76], [0.7, 0.94]] });
  // ROUND 7: WHAT STANDS IN THE FRONT'S BAYS (a bay: the wall between two buttresses' feet; same fork, four draws):
  // THE KEEP'S DOOR ON THE FIELD in the widest bay, a flight of steps up to it (use 1); a garderobe turret high on
  // the wall of two drawn bays (2); ivy rooted at the foot of two more (3); a blind arcade along the foot of every
  // bay but the door's and the ivy's
  { const mk = base.marks, bays = [], pick = [wr7(), wr7(), wr7(), wr7()];
    for (let i = 0; i + 1 < mk.length; i++) { const a = w0 + 9 + mk[i].f + mk[i].hl + 0.5, b = w0 + 9 + mk[i + 1].f - mk[i + 1].hl - 0.5; if (b - a >= 4.5) bays.push({ a, b, use: 0 }); }
    let wide = null; for (const b of bays) if (!wide || b.b - b.a > wide.b - wide.a) wide = b;
    if (wide) wide.use = 1;
    for (let k = 0; k < 4; k++) { const f = bays.filter((b) => !b.use); if (!f.length) break; f[Math.min(f.length - 1, Math.floor(pick[k] * f.length))].use = k < 2 ? 2 : 3; }
    base.bays = bays; }
  const tower = (w, t, o) => { const c = P.fromWT(w, t), tw = { round: true, cap: 1, ivy: 0.15, tone: 1, win: 0.2, yaw: P.hA, subs: [], x: c[0], z: c[1], part: 'keep', g: 2, ...o }; towers.push(tw); return tw; };
  const sub = (k, a) => ({ a: P.hA + a, k: 0.4, up: 9 + 8 * ups[k], down: 10, cap: 1, on: 0 });
  // the first mass's corner towers (the back one toward the far side is the great square tower)
  tower(w0, t1, { r: 11.5, base: 40, top: yB + 22 + 18 * ups[0], sd: sds[0], subs: [sub(0, 2.2)] });
  tower(w1, t1, { r: 11.5, base: 40, top: yB + 22 + 18 * ups[1], sd: sds[1], subs: [sub(1, 0.9)] });
  tower(w1, t0, { r: 11.5, base: 40, top: yB + 22 + 18 * ups[2], sd: sds[2] });
  tower(w0 + 16, t0 + 14, { r: 17, round: false, cap: 0, base: 40, top: yT, sd: sds[3], win: 0.26, subs: [{ a: P.hA + 0.6, k: 0.42, up: 16, down: 14, cap: 1, on: 0 }, { a: P.hA + 3.5, k: 0.36, up: 10, down: 12, cap: 1, on: 0 }] });
  // the second mass's corner turrets, the third's front turrets
  const tur = [[u0, uT], [u1, uT], [u1, t0 + 8], [u0, t0 + 8]].map(([w, t], k) => tower(w, t, { r: 8, base: yB - 6, top: yU + 16 + 14 * ups[4 + k], sd: sds[4 + k], subs: k < 2 ? [sub(4 + k, k ? 1.2 : 5.1)] : [] }));
  [[v0, uT - 20], [v1, uT - 20]].forEach(([w, t], k) => tower(w, t, { r: 6, base: yU - 6, top: yV + 12 + 10 * ups[8 + k], sd: sds[8 + k] }));
  P.keep = { w: (w0 + w1) / 2, t: (t0 + t1) / 2, x: base.x, z: base.z, base: yB, upper: yU, third: yV, top: yT, blocks: [base, upper, third], bays: base.bays,
    // the wall of narrow windows: the second mass's face toward the field
    glass: { w0: u0 + 9, w1: u1 - 9, t: uT, y0: yB + 7, y1: yU - 9, n: 26 },
    // the ledge across the front, and the ivy on the front's end toward the gulf
    ledge: { w0: w0 + 13, w1: w1 - 13, t: t1, y: lerp(M.QUAD_Y, yB, 0.66) }, ivy: { w0: w1 - 78, w1: w1 - 12, y0: M.QUAD_Y + 6, y1: yB },
    // the shoulder: the gap between the front's corner tower toward the gulf and the second mass's turret on that side
    shoulder: [(w1 + u1) / 2, (t1 + uT) / 2], turret: tur[1] };
  // MENDING 1, M5: THE KEEP IS A RUINOUS OLD PILE, NOT A SET OF CLEAN CONES (fork 'r7m1heads', a stream of its own;
  // four draws for every coned head of the keep, its towers' and its smaller towers' alike, in the order of their
  // making, all taken before anything is chosen): ONE HEAD IN THREE, those with the lowest first draws, IS BROKEN OR
  // UNCAPPED: by its second draw a ragged stump of masonry open to the sky (0), a cone with its top third gone and
  // its rafters bare (1), or a flat cap of patched lead (2). Only the head changes: the tower stands where it stood,
  // as high as it stood under the head, and the plan's own solid for it (the shaft and the room a whole cone
  // takes: what the birds fly round and the line's clearance is asked about) is as it was: no other draw moves.
  // MENDING 2, R11: the plan's solid for a broken head is the head as built (towerSolids): a stump's solid is the
  // shaft's girth up to its highest tooth, a lead cap's 1.14 of the radius; a cut cone keeps the whole cone's room.
  // No draw moves by it; what is tested against a tower's solid after the draws (the rooks' perches and rounds,
  // the towers the line leaves out) is tested against that solid. (MENDING 3, T: the solid is a round about the
  // shaft; a cone's eave, cut or whole, stands 0.06 of the radius outside it, and so do the corners of a near flat
  // head's merlons and of a square head: since mending 3 the fliers' rounds are asked about every head as built,
  // towerBuilt; the towers' own placing and the line's leaving out read the round as before, so no tower moves)
  { const hk = P.R_.r7m1heads, heads = [], dr = [];
    for (const t of towers) { if (t.part !== 'keep') continue; if (t.cap === 1) heads.push(t); for (const sb of t.subs) if (sb.cap === 1) heads.push(sb); }
    for (let i = 0; i < heads.length; i++) dr.push([hk(), hk.int(0, 2), hk(), hk()]);
    const ord = heads.map((h, i) => i).sort((a, b) => dr[a][0] - dr[b][0]), nB = Math.round(heads.length / 3);
    for (let j = 0; j < nB; j++) { const i = ord[j]; heads[i].head = { kind: dr[i][1], a: dr[i][2], ph: dr[i][3] }; } }
  // does a footprint (a middle and a reach, any heading) touch the keep's ground, its corner turrets and its buttresses
  P.inKeep = (x, z, reach) => { const wt = P.toWT(x, z); return wt[0] > w0 - 17 - reach && wt[0] < w1 + 17 + reach && wt[1] > t0 - 17 - reach && wt[1] < t1 + 6 + reach; };
}
// THE LANE'S TWO RANGES AND ITS BRIDGE (fork 'lane'): to either hand of the lane's axis three lengths of tall building
// stand end to end between LANE_FROM and LANE_TO before the tower, their faces LANE_WIDE apart: each its own height
// (eaves 44 to 60 m over the court), its own roof, many windows, two stacks; shallow buttresses stand on their faces
// toward the court, stepped ones on their outer faces. One covered bridge joins the two sides BRIDGE_AT before the
// tower: a pointed arch over the whole breadth of the lane, a gallery of windows over it under its own roof. The court
// between the ranges is paved; lanterns stand along it every 14 m on alternate hands and hang on brackets from the
// walls; a balcony stands out of one wall; a line of washing crosses from wall to wall (fork 'cloth'). These are dealt
// after the keep and before every other mass: what would stand in the lane's ground is left out.
function planLane(P, ranges) {
  const ln = P.R_.lane, L = P.lane, mk = [];
  // (the court's lanterns and the brackets stand by the lane's own measure: a lantern on a post every 14 m on
  // alternate hands; a lantern on a bracket every 16 m, on the wall across the court from the post nearest it. A
  // shallow buttress that would stand where one of them stands or hangs is built 1.6 m along from it instead: a
  // lantern is never in a buttress)
  L.lamps = [];
  for (let k = 0; 7 + 14 * k < L.u0 - L.u1 + 10; k++) L.lamps.push({ a: 7 + 14 * k, v: (k % 2 ? 1 : -1) * (L.half - 1.6) });
  L.brackets = []; for (let k = 0; 12 + 16 * k < L.u0 - L.u1 - 4; k++) { const a = 12 + 16 * k; L.brackets.push({ a, side: Math.floor((a - 7) / 14 + 0.5) % 2 ? -1 : 1, up: 3.9 }); }
  const lanternBy = (u, sd) => { let at = null; for (const q of L.lamps) if (q.v * sd > 0 && Math.abs(L.u0 - q.a - u) < 1.6) at = L.u0 - q.a; for (const q of L.brackets) if (q.side === sd && Math.abs(L.u0 - q.a - u) < 1.6) at = L.u0 - q.a; return at; };
  for (const sd of [-1, 1]) {
    const cuts = [0, ln.range(0.28, 0.4), ln.range(0.6, 0.72), 1];
    for (let k = 0; k < 3; k++) {
      const eave = ln.range(132, 148), rise = ln.range(7, 11), hip = ln() < 0.3, tone = ln.range(0.86, 1.08), sd2 = ln.int(1, 60), blue = ln(), win = ln.range(0.5, 0.66);
      const ua = lerp(L.u0, L.u1, cuts[k]), ub = lerp(L.u0, L.u1, cuts[k + 1]), c = P.laneAt((ua + ub) / 2, sd * (L.half + L.deep / 2));
      const m = { x: c[0], z: c[1], yaw: L.az, hw: L.deep / 2, hl: Math.abs(ua - ub) / 2, zone: 0, tone, win, sd: sd2, blue, roof: hip ? 1 : 0, eave, ridge: eave + rise, base: L.y - 30, part: 'lane', chim: 2, shade: 0.62, side: sd, g: 4 };
      // (ROUND 7: each length's buttresses stand at unequal places, each its own: the stepped ones of its outer face
      // 7.5 to 17 m apart; the shallow ones of its face on the court 7 to 16 m apart, none deeper than before)
      { const wr7 = P.R_.r7walls, ro = [sd * L.right[0], sd * L.right[1]];
        m.butts = faceButts(wr7, P.laneAt(ua, sd * (L.half + L.deep)), P.laneAt(ub, sd * (L.half + L.deep)), ro, m.base, m.base, eave, { g0: 7.5, g1: 17, hl: 1.5, steps: [[1.6, 0.62], [0.9, 0.92]] });
        const inner = faceButts(wr7, P.laneAt(ua, sd * L.half), P.laneAt(ub, sd * L.half), [-ro[0], -ro[1]], L.y - 1, L.y, eave, { g0: 7, g1: 16, hl: 0.9, d0: 0.6, d1: 1, wmax: 1.2, steps: [[0.7, 0.45], [0.4, 0.8]],
          at: (f) => { const u = ua - f, lu = lanternBy(u, sd); return lu === null ? f : ua - (lu + (u >= lu ? 1.6 : -1.6)); } });
        for (const q of inner) m.butts.push(q);
        m.ua = ua; m.ub = ub; m.innerMarks = inner.marks; }
      ranges.push(m); mk.push(m);
    }
  }
  const bc = P.laneAt(M.BRIDGE_AT, 0), bsd = ln.int(1, 60), bblue = ln();
  const bridge = { x: bc[0], z: bc[1], yaw: L.az + Math.PI / 2, hw: M.BRIDGE_LONG / 2, hl: L.half + 1, zone: 0, tone: 0.95, win: 0.8, sd: bsd, blue: bblue, roof: 0, eave: M.BRIDGE_CROWN + 10, ridge: M.BRIDGE_CROWN + 14, base: M.BRIDGE_SPRING, part: 'bridge', chim: 0, shade: 0.6, g: 4 };
  ranges.push(bridge);
  L.ranges = mk; L.bridge = bridge;
  // the lanterns on brackets (every 16 m, on the hand the court's lantern is not, 3.3 m over the court: laid at this
  // function's head), the brazier in the court (beside its second lantern), the balcony, the washing
  L.brazier = { a: 22.6, v: L.half - 3.4 };
  L.balcony = { a: ln.range(22, 34), side: ln.chance(0.5) ? 1 : -1, up: ln.range(11, 14), wide: ln.range(2.4, 3.4) };
  const cl = P.R_.cloth, wa = cl.range(40, 58), wy = L.y + cl.range(8, 10.5), a = P.laneAt(L.u0 - wa, -L.half + 0.2), b = P.laneAt(L.u0 - wa - cl.range(-3, 3), L.half - 0.2);
  P.wash = { a: [a[0], wy, a[1]], b: [b[0], wy + cl.range(-0.6, 0.6), b[1]], things: [], y: wy };
  // ROUND 7, B2: THE LANE'S DRESS (fork 'r7lane'; every draw before any test), by the lane's own measure a (metres
  // in from its mouth):
  //  A HANGING GALLERY on each length that lies before the bridge: over a drawn stretch of the length (four tenths of
  //   it and more), its floor drawn 33.5 to 37 m over the court and kept so low that its roof stands under the wall's
  //   eaves (33 to 37 m as built: the houses' top storeys, at the height of the bridge's own rooms, whose arch has its
  //   crown 38 m over the court; a length that cannot hold it 33 m up has none), 5 to 7.2 m tall, standing 0.9 to
  //   1.15 m out of the wall on a corbel table
  //   under a pent roof of slate, a row of lancets along it, one in every 2.8 m, lit each in its own turn;
  //  THREE LIT ORIELS to either hand at unequal places (the first 10 to 26 m in, each next one 26 to 40 m on), their
  //   sills 6 to 9.5 m over the court: a bay of stone 2.6 m broad standing 1.1 m out on a corbelled foot of three
  //   courses, a lit window in its front and its two sides (lit at every hour: its place in the order of lighting
  //   is nought, which the least hour's share keeps lit; mending 2); each is a light of the place (P.glows) and lies
  //   on the wall across the court. One is moved along its wall, after its draws, off the balcony, the washing's
  //   rope (the whole rope: where it meets the oriel's own wall, and on the far end's wall both ends' places;
  //   mending 3), the bridge, the shallow buttresses and its length's ends, six steps of 2.3 m at the most; one that
  //   still stands on any of them after its last step, or past the lane's end, is left out with its glow
  //   (mending 2, R4);
  //  TWO FLYING ARCHES from wall to wall over the lane: slender pointed ribs 1.0 to 1.5 m thick, the first 26 to 44 m
  //   in, springing 115 to 118.2 m high (a gallery's corbel table stops 1.6 m short of it where its rib would stand
  //   in the table: mending 2, R10), the second 92 to 106 m in (beyond the bridge), springing 124 to 128 m high,
  //   each rising 5.5 to 8 m to its crown: they brace the lane's two high walls against each other over the court,
  //   as the bridge does between them.
  // RULE S for the arches (a passage the line goes under): the walls they spring from stand 9 m to either hand of
  // the line by place; the clear way under the lower one's crown is 32 m and more over the court; no member of either
  // comes within 9 m of the line (counted on seeds 1 to 300: see the round's report)
  { const lr7 = P.R_.r7lane, wa2 = L.u0 - P.laneUV(P.wash.a[0], P.wash.a[2])[0], wb2 = L.u0 - P.laneUV(P.wash.b[0], P.wash.b[2])[0]; L.jetties = []; L.oriels = []; L.arches = [];
    for (const m of mk) {
      const f0 = lr7.range(0, 0.3), f1 = lr7.range(0.7, 1), up0 = lr7.range(33.5, 37), tall = lr7.range(5, 7.2), out = lr7.range(0.9, 1.15), hs = lr7();
      // (the gallery's two ends stand on the wall's own measure of 2.8 m, a window's bay, inside the length's own
      // ends: its row is of whole windows alone)
      const vo = m.side * (L.half - out), q0 = P.laneAt(L.u0, vo), q1 = P.laneAt(L.u0 - 1, vo), r0 = P.laneAt(L.u0, 0), r1 = P.laneAt(L.u0, 1), nx = -m.side * (r1[0] - r0[0]), nz = -m.side * (r1[1] - r0[1]);
      const ux = (q) => q[0] * nz - q[1] * nx, x0 = ux(q0), sg = ux(q1) - x0, snap = (u, inw) => { let v = L.u0 - (Math.round((x0 + sg * (L.u0 - u)) / 2.8) * 2.8 - x0) / sg; if (v > m.ua - 0.3 || v < m.ub + 0.3) v += inw * 2.8; return v; };
      // (a gallery hangs on a length that lies before the bridge, the houses' side of it: it stops 1.5 m short of
      // the bridge; its roof keeps 1 m under the wall's eaves. Beyond the bridge the walls are the round's own, the
      // tower's forecourt, and carry none. RULE S: the galleries' corbels stand 9.5 m and more over the line)
      const up = Math.min(up0, m.eave - L.y - tall - 2.5), ua = snap(lerp(m.ua, m.ub, f0), -1), ub = snap(Math.max(lerp(m.ua, m.ub, f1), M.BRIDGE_AT + M.BRIDGE_LONG / 2 + 1.5), 1);
      if ((m.ua + m.ub) / 2 > M.BRIDGE_AT + M.BRIDGE_LONG / 2 && up >= 33 && ua - ub >= 8.3) L.jetties.push({ m, side: m.side, ua, ub, up, tall, out, hs });
    }
    for (const sd of [-1, 1]) {
      let a = lr7.range(10, 26);
      for (let k = 0; k < 3; k++) {
        const up = lr7.range(6, 9.5), warm = lr7(), step = lr7.range(26, 40); let at = a;
        // (MENDING 2, R4: the place is tested once more after the last move: an oriel that still stands where the
        // law forbids is left out, after its draws, and its glow with it. MENDING 3, M2: AN ORIEL KEEPS OFF THE WHOLE
        // ROPE: the washing's rope runs from wall to wall, its near end tied to the wall of side -1 and its far end
        // to the wall of side 1, up to 3 m along the lane from the near end's place. On the far end's wall both
        // ends' places are asked, 3.2 m to either hand of each; on the near end's wall the near end's, where the
        // rope meets that wall (16 m of court lie between that wall and the far end). The bay and its corbelled
        // foot reach 1.3 m to either hand of the oriel's place and 1.1 m out, whatever their height: 1.7 m and
        // more of air stay between the rope and any stone of an oriel)
        const hitAt = (at) => { const u = L.u0 - at, m = mk.find((q) => q.side === sd && u <= q.ua + 1e-6 && u >= q.ub - 1e-6);
          return (L.balcony.side === sd && Math.abs(at - L.balcony.a) < L.balcony.wide + 2.8) || Math.abs(at - wa2) < 3.2 || (sd > 0 && Math.abs(at - wb2) < 3.2) || Math.abs(at - (L.u0 - M.BRIDGE_AT)) < M.BRIDGE_LONG / 2 + 2.8
            || !m || m.innerMarks.some((q) => Math.abs((m.ua - q.f) - u) < q.hl + 1.8) || Math.abs(u - m.ua) < 2 || Math.abs(u - m.ub) < 2; };
        for (let t = 0; t < 6 && hitAt(at); t++) at += 2.3;
        if (at < L.u0 - L.u1 - 3 && !hitAt(at)) { const c = P.laneAt(L.u0 - at, sd * (L.half - 1.6)); L.oriels.push({ a: at, side: sd, up, warm, x: c[0], y: L.y + up + 2.2, z: c[1] }); }
        a += step;
      }
    }
    L.arches.push({ a: lr7.range(26, 44), spring: lr7.range(115, 118.2), rise: lr7.range(5.5, 7.5), thick: lr7.range(1.0, 1.5) });
    L.arches.push({ a: lr7.range(92, 106), spring: lr7.range(124, 128), rise: lr7.range(5.5, 8), thick: lr7.range(1.0, 1.5) });
  }
}
// THE CATS' HALL (fork 'cats'): a long hall in the gulf, parallel to the cliff, CATS_T out of it: the cats' walk is the
// parapet of its eaves on the cliff's side, CATS_Y high, from an arch they pour out of at CATS_W0 (clear of the
// tree's farthest reach along the wall) to the hall's end 52.5 m on; there the walk leaves the hall and goes away
// down a roof valley, four lengths, to an arch they pour into. The hall's own roof rises 9 to 12 m behind the walk
// and keeps the low sun off it: the white tide runs in blue shade
function planCats(P, ranges) {
  const cr = P.R_.cats, len = 52.5, up = cr.range(9, 12), deep = cr.range(26, 32), tone = cr.range(0.88, 1.04), sd = cr.int(1, 60), cat = [];
  for (let k = 0; k <= 11; k++) {
    const kv = Math.max(0, k - 7), c = P.fromWT(M.CATS_W0 + Math.min(k, 7) * 7.5 + kv * 8, M.CATS_T + [0, 5.5, 14.5, 25.5, 37.5][kv]);
    cat.push([c[0], M.CATS_Y - [0, 3, 7, 11, 15][kv], c[1]]);
  }
  const hall = wallMass(P, M.CATS_W0 - 4, M.CATS_W0 + len, M.CATS_T + 1.5, M.CATS_T + 1.5 + deep, 'w', { roof: 0, eave: M.CATS_Y - 0.6, ridge: M.CATS_Y + up, base: -24, part: 'hall', tone, sd, win: 0.5, chim: 3, shade: 0.6, g: 3 });
  ranges.push(hall);
  P.cats = { pts: cat, dealt: cat, wide: 2.6, hall, w0: M.CATS_W0 - 6, w1: M.CATS_W0 + len + 40, t0: M.CATS_T - 3, t1: M.CATS_T + 1.5 + deep + 12, cum: null, len: 0, list: null };
}
// THE SLOT'S BRIDGE AND THE LAMPS OF THE COURTS (no draws: each by its place's own measures). The bridge is a mass
// like the lane's bridge: a gallery under its own roof, solid from its arches' spring up. THE LAMPS ARE HUNG BY A LAW
// OF THE PLACE ALONE, where someone walks and a hand with a taper on a short pole can tend them (P.lamps: a place
// and a strength each; the stone's shader lights the paving and the walls about them): on posts 4 m over their
// paving along the two sides of the forecourt (four), about the back court (six), at the apron's two corners and
// round the tower's round, 10 m inside its rim, outside the fists that stand about the tower's foot (six, none on
// the lane's own axis); and on iron brackets 3.4 m over the paving at the
// four corners of the slot's bridge, beside the arches a walker goes under (arm: the way out of the wall to the
// lamp). None hangs where no one could come
function planCourts(P, ranges) {
  const q = P.quad, L = P.lane, lamps = [];
  P.sbridge = wallMass(P, M.SBRIDGE_W0, M.SBRIDGE_W1, 0, M.SLOT_T0, 't', { roof: 0, eave: M.SBRIDGE_RIDGE - 3.5, ridge: M.SBRIDGE_RIDGE, base: M.SBRIDGE_SPRING, part: 'sbridge', tone: 0.95, win: 0.8, sd: 41, blue: 0.4, chim: 0, shade: 0.7, g: 3 });
  ranges.push(P.sbridge);
  const wt = (w, t, y, k, post, arm = null) => { const c = P.fromWT(w, t); lamps.push({ x: c[0], y, z: c[1], k, post, arm }); };
  const W = P.W, T = P.T;
  const tf = q.t1 + M.NEAR_DEEP;
  for (const sx of [-1, 1]) for (const d of [16, 60]) wt(q.mid + sx * (M.FORE_HALF - 5), tf + d, M.QUAD_Y + 4, 1, true);
  for (const w of [M.KEEP_W1 + 22, (M.KEEP_W1 + M.SLOT_W0) / 2, M.SLOT_W0 - 16]) for (const t of [26, 82]) wt(w, t, M.COURT_Y + 4, 1, true);
  for (const t of [3.2, M.SLOT_T0 - 3.2]) for (const sg of [-1, 1]) wt((sg < 0 ? M.SBRIDGE_W0 : M.SBRIDGE_W1) + sg * 1.6, t, M.COURT_Y + 3.4, 0.8, false, [sg * W[0], sg * W[1]]);
  for (const sx of [-1, 1]) { const c = P.laneAt(M.LANE_TO - 14, sx * (L.half + 8)); lamps.push({ x: c[0], y: L.y + 4, z: c[1], k: 1, post: true }); }
  for (let k = 0; k < 6; k++) { const a = L.az + (k + 0.5) / 6 * TAU, r = 90; lamps.push({ x: L.x + Math.sin(a) * r, y: L.y + 4, z: L.z - Math.cos(a) * r, k: 1, post: true }); }
  P.lamps = lamps;
  // ROUND 7: THE OTHER LIGHTS OF THE PLACES (P.glows: a place and a strength each; the stone's shader lights the
  // stone about them as it does about the courts' lamps): the lantern on its bracket beside the keep's door on the
  // field; the lit oriels of the lane (planLane); the lanterns under the cloister walk (planLife)
  P.glows = [];
  { const door = (P.keep.bays || []).find((b) => b.use === 1);
    if (door) { const c = P.fromWT((door.a + door.b) / 2 + 2.7, M.KEEP_T1 + 0.75); P.glows.push({ x: c[0], y: M.QUAD_Y + 5.3, z: c[1], k: 0.9 }); } }
  for (const o of L.oriels || []) P.glows.push({ x: o.x, y: o.y, z: o.z, k: 0.12 });
}
// every mass of the castle, as numbers, each by its place: the keep, the lane, the cats' hall, the field's ranges, the
// cliff, the rim, then the country by its wards (roofs, towers), then the casters of the great shadows
async function planMasses(P) {
  const { R_, noise, mir } = P, ranges = [], towers = [], q = P.quad, hA = P.hA;
  planKeep(P, ranges, towers);
  await P.Y();
  planLane(P, ranges);
  planCats(P, ranges);
  await P.Y();
  const wtMass = (w0, w1, t0, t1, along, o) => wallMass(P, w0, w1, t0, t1, along, o);
  // ---- the field's ranges (fork 'quad'): the range on its near side in lengths, the middle one THE GATEHOUSE on the
  // field's own axis, the two side ranges, the corner towers, the gatehouse's turrets. THE FIELD'S SUNWARD SIDES ARE LOW
  // (the near range and the side range toward the gulf: ridges 10 to 12 m over the flags), so that the low sun
  // comes over them onto the flags; the side range away from the sun is tall and takes the sun on its face
  const qr = R_.quad, sideUp = [qr.range(-3, 3), qr.range(-3, 3)], cornerUp = [qr.range(104, 118), qr.range(104, 118)], cornerR = [qr.range(8.5, 11.5), qr.range(8.5, 11.5)];
  const cornerT = [drawTower(qr, 9, 12), drawTower(qr, 9, 12)], gateT = [drawTower(qr, 3.4, 4), drawTower(qr, 3.4, 4)];
  const nw0 = q.w0 - M.SIDE_DEEP, nw1 = q.w1 + M.SIDE_DEEP, gw0 = q.mid - M.GATE_HALF, gw1 = q.mid + M.GATE_HALF, tn0 = q.t1, tn1 = q.t1 + M.NEAR_DEEP;
  const cutsN = [nw0, (nw0 + gw0) / 2, gw0, gw1, (gw1 + nw1) / 2, nw1], nearSegs = [];
  for (let i = 0; i < cutsN.length - 1; i++) {
    const gate = i === 2, m = wtMass(cutsN[i], cutsN[i + 1], tn0, tn1, 'w', { roof: 0, eave: gate ? 76.5 : 77.5, ridge: 82, base: 30, part: 'quad', chim: 0, w0: cutsN[i], w1: cutsN[i + 1], gate, g: 1 });
    nearSegs.push(m);
    await P.Y();
  }
  P.nearRange = nearSegs;
  P.quadRanges = [...nearSegs,
    wtMass(nw0, q.w0, q.t0, q.t1, 't', { roof: 0, eave: 92 + sideUp[0], ridge: 99 + sideUp[0], base: 30, part: 'quad', chim: 5, g: 1 }),
    wtMass(q.w1, nw1, q.t0 + 13, q.t1, 't', { roof: 0, eave: 77.5 + sideUp[1] * 0.4, ridge: 83 + sideUp[1] * 0.4, base: 30, part: 'quad', chim: 5, g: 1 })];
  for (const m of P.quadRanges) ranges.push(m);
  [[nw0 + 15, tn0 + 14], [nw1 - 15, tn0 + 14]].forEach((wt, i) => { const c = P.fromWT(wt[0], wt[1]); towers.push({ ...cornerT[i], x: c[0], z: c[1], r: cornerR[i], base: 30, top: cornerUp[i], part: 'quad', g: 1 }); });
  [[gw0 - 3.5, tn0 + 6], [gw1 + 3.5, tn0 + 6]].forEach((wt, i) => { const c = P.fromWT(wt[0], wt[1]); towers.push({ ...gateT[i], round: true, cap: 1, subs: [], x: c[0], z: c[1], base: 60, top: 97 + 3 * i, part: 'quad', g: 1 }); });
  await P.Y();
  // ---- THE TURRETS OF THE FIELD'S SUNWARD SIDES (fork 'fieldside'): eight are drawn, four along the near range and
  // four along the side range toward the gulf, rising through the roofs 30 to 52 m over the flags; their long shadows
  // lie across the flags. One stands if it keeps off the gatehouse's own stretch (the gatehouse has its turrets) and
  // 2 m from the turret before it
  {
    const fsd = R_.fieldside, stood = [];
    for (let k = 0; k < 8; k++) {
      const t = drawTower(fsd, 5, 8), f = (Math.floor(k / 2) + fsd.range(0.2, 0.8)) / 4, up = fsd.range(30, 52), off = fsd.range(2, 9);
      const wt = k % 2 === 0 ? [lerp(q.w0 + 6, q.w1 - 6, f), tn0 + off] : [q.w1 + off, lerp(q.t0 + 30, q.t1 - 8, f)], c = P.fromWT(wt[0], wt[1]);
      if (k % 2 === 0 && Math.abs(wt[0] - q.mid) < M.GATE_HALF + t.r + 4) continue;
      if (stood.some((o) => Math.hypot(c[0] - o.x, c[1] - o.z) < (t.r + o.r) * 1.15 + 2)) continue;
      const tw = { ...t, x: c[0], z: c[1], base: M.QUAD_Y - 6, top: M.QUAD_Y + up, part: 'field', g: 1 };
      stood.push(tw); towers.push(tw);
    }
  }
  await P.Y();
  // ---- THE CLIFF (fork 'heromass'): blocks of 34 to 52 m along the wall, CLIFF_DEEP deep; one of them is the tree's
  // own block (42 m to either side of the root); every block's face on the gulf carries stepped buttresses
  const hm = R_.heromass, tops = [], lens = [], turrets = [];
  for (let k = 0; k < 12; k++) { tops.push(hm.range(150, 178)); lens.push(hm.range(0.8, 1.2)); turrets.push({ on: hm(), w: hm.range(0.2, 0.8), t: hm.range(-44, -10), r: hm.range(4, 7), up: hm.range(12, 30), tw: drawTower(hm, 4, 7) }); }
  const HB = 42, cuts = [M.CLIFF_W0];
  { const n = Math.max(1, Math.round((-HB - M.CLIFF_W0) / 43)); for (let i = 1; i <= n; i++) cuts.push(lerp(M.CLIFF_W0, -HB, i / n)); cuts.push(HB); const n2 = Math.max(1, Math.round((M.CLIFF_W1 - HB) / 43)); for (let i = 1; i <= n2; i++) cuts.push(lerp(HB, M.CLIFF_W1, i / n2)); }
  // (ROUND 7: at unequal places 7.5 to 19 m apart, each its own, in three stages)
  const butts = (w0, w1, t, out, y0, y1) => faceButts(R_.r7walls, P.fromWT(w0, t), P.fromWT(w1, t), [out * P.T[0], out * P.T[1]], y0, y0, y1, { g0: 7.5, g1: 19, hl: 1.5, steps: [[2.0, 0.5], [1.3, 0.74], [0.7, 0.92]] });
  P.massB = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const isTree = Math.abs(cuts[i] + HB) < 0.01, top = isTree ? Math.max(tops[i], 172) : tops[i];
    const b = wtMass(cuts[i], cuts[i + 1], -M.CLIFF_DEEP, 0, 'w', { roof: 2, eave: top, ridge: top, base: -24, part: 'massB', isTree, w0: cuts[i], w1: cuts[i + 1], win: 0.2 + 0.2 * lens[i], g: 3 });
    if (!isTree) b.butts = butts(cuts[i], cuts[i + 1], 0, 1, -24, top - 6);
    P.massB.push(b); ranges.push(b);
    const tu = turrets[i];
    if (tu.on < 0.75) { const c = P.fromWT(lerp(cuts[i], cuts[i + 1], tu.w), tu.t); if (P.treeAlone(c[0], c[1], tu.r)) towers.push({ ...tu.tw, x: c[0], z: c[1], r: tu.r, base: top - 6, top: top + tu.up, part: 'massB', g: 3 }); }
  }
  await P.Y();
  // ---- THE RIM (fork 'rim'): the gulf's far side: tall ranges with THE GAP between them, one low length through which
  // the low sun reaches the tree and its stretch of the cliff; the rest of the gulf lies in the rim's shade
  { const rm = R_.rim, r0 = M.GULF_FAR, r1 = M.GULF_FAR + M.RIM_DEEP, cut = [M.RIM_W0, (M.RIM_W0 + M.GAP_W0) / 2 + rm.range(-8, 8), M.GAP_W0, (M.GAP_W0 + M.GAP_W1) / 2 + rm.range(-10, 10), M.GAP_W1, (M.GAP_W1 + M.RIM_W1) / 2 + rm.range(-8, 8), M.RIM_W1];
    P.rim = [];
    for (let i = 0; i < 6; i++) {
      const low = i === 2 || i === 3, eave = low ? rm.range(104, 110) : rm.range(160, 178), rise = rm.range(7, 11), tone = rm.range(0.86, 1.06), sd = rm.int(1, 60), blue = rm(), hip = rm() < 0.3;
      const m = wtMass(cut[i], cut[i + 1], r0, r1, 'w', { roof: hip && !low ? 1 : 0, eave, ridge: eave + rise, base: -24, part: 'rim', tone, sd, blue, win: low ? 0.4 : 0.5, chim: 3, low, w0: cut[i], w1: cut[i + 1], g: 3 });
      m.butts = butts(cut[i], cut[i + 1], r0, -1, -24, eave - 5);
      P.rim.push(m); ranges.push(m);
    }
    // THE SLOT'S RANGE (same fork): across the gulf from the rim to SLOT_T0 short of the cliff
    const eave = rm.range(148, 158), rise = rm.range(8, 11), tone = rm.range(0.86, 1.04), sd = rm.int(1, 60), blue = rm();
    P.slot = wtMass(M.SLOT_W0, M.SLOT_W1, M.SLOT_T0, r0, 't', { roof: 0, eave, ridge: eave + rise, base: -24, part: 'rim', tone, sd, blue, win: 0.55, chim: 3, shade: 0.7, g: 3 });
    // (ROUND 7: the cross range's two long faces carry buttresses: the one on the back court from the court's
    // paving, the one on the gulf from the gulf's floor)
    { const o = { g0: 8, g1: 19, hl: 1.5, steps: [[2.0, 0.5], [1.3, 0.74], [0.7, 0.92]] };
      P.slot.butts = faceButts(R_.r7walls, P.fromWT(M.SLOT_W0, M.SLOT_T0 + 5), P.fromWT(M.SLOT_W0, r0 - 4), [-P.W[0], -P.W[1]], -24, M.COURT_Y, eave, o);
      for (const q2 of faceButts(R_.r7walls, P.fromWT(M.SLOT_W1, M.SLOT_T0 + 5), P.fromWT(M.SLOT_W1, r0 - 4), P.W, -24, -24, eave, o)) P.slot.butts.push(q2); }
    ranges.push(P.slot); }
  planCourts(P, ranges);
  await P.Y();
  // ---- THE COUNTRY BY ITS WARDS. The roofs of the inner ward (cells of 30 m; fork 'ranges'): each drawn whole, then
  // stood or dropped; its height is the hill's at its place less its own draw. One within 90 m of the field, the
  // keep, the cliff or the gulf lies with the wall or square to it; the others by the country's own slow field of
  // headings, along it or square to it
  const yawField = (x, z) => 0.9 * noise.fbm2(x * 0.0028 + 3, z * 0.0028, 2);
  const footPts = (m) => {
    const c = Math.cos(m.yaw), s = Math.sin(m.yaw), n = Math.max(1, Math.ceil(m.hl / 3)), out = [];
    for (let i = -n; i <= n; i++) for (const lx of [-1, 0, 1]) { const lz = i / n * m.hl; out.push([m.x + lx * m.hw * c + lz * s, m.z + lx * m.hw * s - lz * c]); }
    return out;
  };
  // (the cats' walk: every roof keeps under it where it passes; no roof stands in the hall)
  const cat = P.cats.pts, hallBox = { x: P.cats.hall.x, z: P.cats.hall.z, yaw: P.cats.hall.yaw, hw: P.cats.hall.hw + 3, hl: P.cats.hall.hl + 3, y0: 0, y1: 1 };
  let cbx0 = 1e9, cbx1 = -1e9, cbz0 = 1e9, cbz1 = -1e9; for (const c of cat) { cbx0 = Math.min(cbx0, c[0] - 6); cbx1 = Math.max(cbx1, c[0] + 6); cbz0 = Math.min(cbz0, c[2] - 6); cbz1 = Math.max(cbz1, c[2] + 6); }
  const catUnder = (x, z) => {
    if (x < cbx0 || x > cbx1 || z < cbz0 || z > cbz1) return 1e9;
    let best = 1e9;
    for (let i = 0; i < cat.length - 1; i++) {
      const a = cat[i], b = cat[i + 1], ex = b[0] - a[0], ez = b[2] - a[2], t = clamp(((x - a[0]) * ex + (z - a[2]) * ez) / (ex * ex + ez * ez), 0, 1);
      if (Math.hypot(x - a[0] - ex * t, z - a[2] - ez * t) < 5.5) best = Math.min(best, lerp(a[1], b[1], t) - 2);
    }
    return best;
  };
  // the castle's own box in the world (the wall's frame from 590 m before the root to 470 m past it, 130 m behind the
  // cliff's face to 470 m out of it)
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const [w, t] of [[-590, -130], [470, -130], [470, 470], [-590, 470]]) { const c = P.fromWT(w, t); x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); z0 = Math.min(z0, c[1]); z1 = Math.max(z1, c[1]); }
  P.box = [x0, x1, z0, z1];
  const NEAR = 235, rr = R_.ranges, wallYaw = hA; let work = 0;
  for (let cz = z0 - NEAR; cz < z1 + NEAR; cz += 30) for (let cx = x0 - NEAR; cx < x1 + NEAR; cx += 30) {
    if (++work % 2 === 0) await P.Y();
    const jx = rr.range(-12, 12), jz = rr.range(-12, 12), turn = rr() < 0.42, jit = rr.gauss() * 0.07, hw = rr.range(5.5, 10), hl = rr.range(14, 40), pitch = rr.range(0.75, 1.15), lift = rr.range(0, 16);
    const roofDraw = rr(), tone = rr.range(0.8, 1.15), win = rr.range(0.05, 0.45), chim = rr(), sd = rr.int(1, 60), blue = rr();
    const x = cx + jx, z = cz + jz, ward = P.wardAt(x, z);
    if (ward > NEAR || P.inKeep(x, z, Math.max(hw, hl))) continue;
    const yaw0 = P.heartAt(x, z) < 90 ? wallYaw : yawField(x, z);
    const m = { x, z, yaw: yaw0 + (turn ? Math.PI / 2 : 0) + jit, hw, hl, zone: 0, tone, win, sd, blue, ward, gulf: false, g: P.groupAt(x, z) };
    if (boxesMeet({ x, z, yaw: m.yaw, hw, hl, y0: 0, y1: 1 }, hallBox)) continue;
    let ok = true, cap = 1e9;
    for (const p of footPts(m)) { const reg = P.regionOf(p[0], p[1], 7); if (reg !== 1 && reg !== 4) { ok = false; break; } if (reg === 4) m.gulf = true; cap = Math.min(cap, catUnder(p[0], p[1])); }
    if (!ok) continue;
    m.roof = roofDraw < 0.6 ? 0 : roofDraw < 0.84 ? 1 : 2;
    m.chim = m.roof !== 2 && chim < 0.7 ? 1 + Math.floor(hl / 11) : 0;
    const rise = m.roof === 2 ? 0 : hw * pitch;
    // (under the cats' walk a roof with stacks stands 5.5 m lower, so that its stacks do too; a flat one 1.5 m, for
    // its merlons)
    m.ridge = Math.min(P.hill(x, z) - lift, cap - (m.chim ? 5.5 : m.roof === 2 ? 1.5 : 0.5));
    m.eave = m.ridge - rise; m.base = m.eave - 44;
    ranges.push(m);
  }
  // ---- the middle ward (cells of 64 m; fork 'mid') and the far roofs to the horizon (cells of 170 m; fork 'far').
  // THE FAR SKYLINE IS THREE MASSES (fork 'far' their places): three great heaps of roof and tower beyond the middle
  // ward, haze between them; of the far roofs outside the heaps one in four stands
  const fr = R_.far, a0 = fr.range(0, TAU), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  P.heaps = [0, 1, 2].map((k) => { const a = a0 + k * TAU / 3 + fr.range(-0.35, 0.35), d = fr.range(1250, 1700); return { x: mx + Math.sin(a) * d, z: mz - Math.cos(a) * d, r: fr.range(380, 520) }; });
  P.inHeap = (x, z) => P.heaps.some((h) => Math.hypot(x - h.x, z - h.z) < h.r);
  const band = async (rng, cell, d0, d1, hw0, hw1, hl0, hl1, zone, up0, up1) => {
    const ext = d1 + 40;
    for (let cz = z0 - ext; cz < z1 + ext; cz += cell) for (let cx = x0 - ext; cx < x1 + ext; cx += cell) {
      if (++work % 50 === 0) await P.Y();
      const jx = rng.range(-0.4, 0.4) * cell, jz = rng.range(-0.4, 0.4) * cell, turn = rng() < 0.45, jit = rng.gauss() * 0.1, hw = rng.range(hw0, hw1), hl = rng.range(hl0, hl1), pitch = rng.range(0.6, 1.0), up = rng.range(up0, up1);
      const roofDraw = rng(), tone = rng.range(0.8, 1.15), win = rng.range(0.05, 0.4), sd = rng.int(1, 60), keep = rng(), blue = rng();
      const x = cx + jx, z = cz + jz, ward = P.wardAt(x, z);
      if (ward <= d0 || ward > d1 || keep > (zone === 2 ? (P.inHeap(x, z) ? 0.95 : 0.25) : 0.86) || P.inKeep(x, z, Math.max(hw, hl))) continue;
      const reg = P.regionOf(x, z, hl + 8);
      if (reg !== 1 && reg !== 4) continue;
      const m = { x, z, yaw: yawField(x, z) + (turn ? Math.PI / 2 : 0) + jit, hw, hl, zone, tone, win, sd, chim: 0, blue, ward, g: 6 };
      m.roof = roofDraw < 0.55 ? 0 : roofDraw < 0.85 ? 1 : 2;
      m.ridge = P.hill(x, z) + up + (zone === 2 && P.inHeap(x, z) ? 30 : 0); m.eave = m.ridge - (m.roof === 2 ? 0 : Math.min(hw * pitch, 14)); m.base = m.eave - (zone === 1 ? 60 : 90);
      ranges.push(m);
    }
  };
  await band(R_.mid, 64, NEAR, 700, 10, 20, 30, 75, 1, -12, 10);
  await band(fr, 170, 700, 2600, 28, 60, 70, 170, 2, -5, 38);
  P.ranges = ranges; P.towers = towers;
  await P.Y();
  await planTowers(P);
}

// a tower as drawn: round or square; its crown (0 flat with merlons on a corbel table, 1 a worn cone of slate, 2
// broken, 3 a saddle roof between two gables, 4 corbelled turrets at its corners under a low cone); ivy; and the
// smaller towers on it
function drawTower(rng, r0, r1) {
  const capA = rng(), capB = rng();
  const t = { r: rng.range(r0, r1), round: rng.chance(0.7), cap: capA < 0.3 ? 0 : capA < 0.45 ? 3 : capB < 0.45 ? 1 : capB < 0.72 ? 4 : 2, ivy: rng.range(0, 0.55) * (rng.chance(0.6) ? 1 : 0), tone: rng.range(0.82, 1.1), sd: rng.int(1, 60), win: rng.range(0.12, 0.34), yaw: rng.range(0, TAU), subs: [] };
  for (let k = 0; k < 3; k++) t.subs.push({ a: rng.range(0, TAU), k: rng.range(0.28, 0.46), up: rng.range(5, 16), down: rng.range(6, 20), cap: rng.int(0, 2), on: rng() });
  // (a saddle roof stands on a square tower; a round one drawn with it is capped in slate)
  if (t.cap === 3 && t.round) t.cap = 1;
  return t;
}
// the towers of the castle, each by its place: the gate's and the outer wall's, the lesser and the great towers of the
// inner ward by cells, the middle ward's and the far heaps', the fists on the rim of the finger tower's round
async function planTowers(P) {
  const { R_ } = P, towers = P.towers, [x0, x1, z0, z1] = P.box;
  const inHall = (x, z, r) => { const wt = P.toWT(x, z); return wt[0] > P.cats.w0 - r && wt[0] < P.cats.w1 + r && wt[1] > P.cats.t0 - r && wt[1] < P.cats.t1 + r; };
  // ---- THE GATE'S TOWERS AND THE OUTER WALL'S (fork 'gate', fork 'wallout'): two great drums flank the gate's arch
  // (3 m of wall between the arch's jamb and each drum's foot); the rest stand every 95 to 140 m along the wall to
  // either hand
  const gt = R_.gate, wo = R_.wallout, OW = P.outer;
  for (const sd of [-1, 1]) {
    let off = 0;
    for (let k = 0; k < 8; k++) {
      const t = drawTower(k === 0 ? gt : wo, k === 0 ? 9.5 : 8, k === 0 ? 11.5 : 11), step = wo.range(95, 140), top = wo.range(46, 62), gTop = gt.range(58, 66);
      off = k === 0 ? 4.2 + 3 + t.r * 1.1 : off + step;
      const th = OW.a0 + sd * off / OW.R, x = OW.cx + Math.sin(th) * OW.R, z = OW.cz - Math.cos(th) * OW.R;
      if (k === 0) { t.round = true; t.cap = 0; t.ivy = Math.max(t.ivy, 0.2); }
      towers.push({ ...t, x, z, base: -6, top: k === 0 ? gTop : top, part: k === 0 ? 'gate' : 'wall', g: 0 });
    }
  }
  // ---- THE LESSER TOWERS OF THE INNER WARD (fork 'towers'): by cells of 64 m over the inner ward, each drawn whole,
  // three in ten standing: 9 to 17 m across, its head 16 to 48 m over the roofs' hill at its own foot; one in ten of
  // those that stand is a slender spiral stair turret. One stands clear of the tree and of every place's ground
  const tw = R_.towers; let work = 0;
  for (let cz = z0 - 200; cz < z1 + 200; cz += 64) for (let cx = x0 - 200; cx < x1 + 200; cx += 64) {
    const t = drawTower(tw, 4.5, 8.5), jx = tw.range(-26, 26), jz = tw.range(-26, 26), up = tw.range(16, 48), keep = tw(), stair = tw() < 0.1;
    if (++work % 40 === 0) await P.Y();
    const x = cx + jx, z = cz + jz;
    if (keep > 0.3 || P.wardAt(x, z) > 200) continue;
    if (stair) { t.r = 3.4; t.stair = true; t.round = true; t.cap = 1; }
    if (P.regionOf(x, z, t.r + 6) !== 1 || !P.treeAlone(x, z, t.r) || inHall(x, z, t.r * 1.5 + 4) || P.inKeep(x, z, t.r * 1.5)) continue;
    const h = P.hill(x, z);
    towers.push({ ...t, x, z, base: h - 40, top: h + (stair ? 16 : up), part: 'lesser', g: P.groupAt(x, z) });
  }
  await P.Y();
  // ---- THE GREAT TOWERS OF THE INNER WARD (fork 'great'): by cells of 110 m over the inner ward, each drawn whole,
  // four in ten standing: 20 to 30 m across, 45 to 90 m over the roofs about them (in the gulf they rise from its
  // floor to about the tree's level); one stands clear of the tree and of every place's ground
  const gr = R_.great;
  for (let cz = z0 - 200; cz < z1 + 200; cz += 110) for (let cx = x0 - 200; cx < x1 + 200; cx += 110) {
    const t = drawTower(gr, 10, 15), jx = gr.range(-45, 45), jz = gr.range(-45, 45), up = gr.range(45, 90), upGulf = gr.range(-10, 35), keep = gr();
    if (++work % 20 === 0) await P.Y();
    const x = cx + jx, z = cz + jz, ward = P.wardAt(x, z);
    if (ward > 200 || keep > 0.4) continue;
    const reg = P.regionOf(x, z, t.r + 8);
    if ((reg !== 1 && reg !== 4) || !P.treeAlone(x, z, t.r) || inHall(x, z, t.r * 1.5 + 4) || P.inKeep(x, z, t.r * 1.5)) continue;
    towers.push({ ...t, x, z, base: reg === 4 ? -24 : P.hill(x, z) - 50, top: reg === 4 ? M.TREE_Y + upGulf : P.hill(x, z) + up, part: 'great', great: true, g: P.groupAt(x, z) });
  }
  await P.Y();
  // ---- the towers of the middle ward and of the far heaps: by cells, each drawn whole, kept on a drawn share.
  // THE FAR SKYLINE: fewer and greater: the far towers stand in the three heaps (three in four of the cells there), one
  // in ten elsewhere
  const scatter = async (rng, cell, d0, d1, r0, r1, up0, up1, share, part) => {
    const ext = d1 + 40;
    for (let cz = z0 - ext; cz < z1 + ext; cz += cell) for (let cx = x0 - ext; cx < x1 + ext; cx += cell) {
      if (++work % 50 === 0) await P.Y();
      const t = drawTower(rng, r0, r1), jx = rng.range(-0.45, 0.45) * cell, jz = rng.range(-0.45, 0.45) * cell, girth = rng(), tall = rng(), up = rng.range(up0, up1) * lerp(0.35, 1.25, tall * tall), keep = rng();
      // (THE SKYLINE IS OF MANY SHAPES: a tower's girth is 0.8 to 2.3 times the drawn one, a few broad as keeps, and its
      // height 0.35 to 1.25 times, most of them low and a few tall)
      t.r *= lerp(0.8, 2.3, girth * girth);
      const x = cx + jx, z = cz + jz, ward = P.wardAt(x, z), heap = part === 'far' && P.inHeap(x, z);
      if (ward <= d0 || ward > d1 || keep > (part === 'far' ? (heap ? 0.75 : 0.1) : share) || P.inKeep(x, z, t.r * 1.5) || !P.treeAlone(x, z, t.r)) continue;
      if (P.regionOf(x, z, t.r + 10) !== 1 || inHall(x, z, t.r * 1.5 + 4)) continue;
      const h = P.hill(x, z);
      t.r = Math.min(t.r, 60);
      towers.push({ ...t, x, z, base: h - 60, top: Math.min(h + up + (heap ? 60 : 0), 250), part, g: 6, ward });
    }
  };
  await scatter(R_.midtowers, 120, 60, 700, 8, 16, 35, 105, 0.34, 'mid');
  await scatter(R_.fartowers, 300, 700, 2600, 22, 40, 70, 190, 0.26, 'far');
  await P.Y();
  // ---- the fists (fork 'fists'): seven squat towers about the finger tower, each at its own bearing and height. THE
  // FINGER RISES FROM AMONG THEM: a fist stands on the tower's round itself, its wall 4 to 14 m from the plinth of
  // the finger's foot by its own draw (every other one 14 m farther out: two rough rings of them), everywhere but
  // in the round's open way (M.ROUND_R's note: where the lane's mouth and its apron meet the round, and a rim
  // length to either hand). A fist any part of whose foot would stand in the open way stands on the round's rim
  // instead, 4 to 24 m outside it. One that would stand in the lane's ground (its ranges, its court, its apron)
  // or any other place's is left out, after its draws. The line has no say here but its true clearance (clearLine).
  // None has a broken head (the finger's own is the one broken head of its ward)
  const fs = R_.fists, F = P.finger; P.fists = [];
  for (let k = 0; k < 7; k++) {
    const t = drawTower(fs, 9, 14), a = (k + fs.range(-0.3, 0.3)) / 7 * TAU, out = fs.range(4, 24), top = fs.range(70, 125) + 35;
    // (dth: its bearing round from the lane's; footD: where it would stand at the foot; the open way's half
    // breadth as the tower's middle sees it, and the fist's own foot's as it would stand there)
    const dth = Math.abs((((a - (F.az + Math.PI)) % TAU) + TAU + Math.PI) % TAU - Math.PI), footD = fingerR(F, M.LANE_Y) + 2.1 + t.r * 1.15 + 2 + out * 0.5 + (k % 2) * 14;
    const atFoot = dth - Math.asin(Math.min(1, t.r * 1.15 / footD)) >= (M.APRON_N + 1) / M.ROUND_N * TAU;
    const dist = atFoot ? footD : M.ROUND_R + t.r * 1.15 + out;
    const x = F.x + Math.sin(a) * dist, z = F.z - Math.cos(a) * dist;
    if (t.cap === 2) t.cap = 0;
    const room = Math.max(t.cap === 1 || t.cap === 4 ? t.r * 2.1 : t.cap === 3 ? t.r * 1.3 : 3, ...t.subs.map((sb) => (sb.on < 0.6 ? sb.up + sb.k * t.r * 2.2 : 0)));
    if (P.regionOf(x, z, t.r * 1.5) !== (atFoot ? 10 : 1) || P.inKeep(x, z, t.r * 1.5)) continue;
    // (its head and the towers on it never over 160 m: under the owls' rounds)
    const f = { ...t, win: Math.max(t.win, 0.42), x, z, base: F.base, top: Math.min(top, 160 - room), part: 'fist', g: 5 };
    P.fists.push(f); towers.push(f);
  }
  // ---- THE LAW OF THE WARDS: the castle rises inward. No tower's head stands higher than 70 m and a fifth of its distance
  // inside the outer wall; the fists round the
  // finger, the turrets of the cliff and of the field, the keep's own towers and the far heaps' are outside that law
  for (const t of towers) {
    if (t.part === 'fist' || t.part === 'massB' || t.part === 'keep' || t.part === 'field' || t.part === 'quad' || t.part === 'far') continue;
    const cap = 70 + Math.max(0, P.inside(t.x, t.z)) / 5;
    if (t.top > cap) t.top = Math.max(cap, t.base + 14);
  }
  // (every tower is dealt now: none stands in another; then the casters of the great shadows are chosen)
  await P.Y();
  towersApart(P);
  // (a lamp's post is not set where a fist stands)
  P.lamps = P.lamps.filter((q) => !P.fists.some((t) => Math.hypot(q.x - t.x, q.z - t.z) < t.r * 1.3 + 2));
  await P.Y();
  planCasters(P);
  await P.Y();
}

// ---------------------------------------------------------------- THE LINE, laid after every place is dealt, over
// what stands. Five legs joined by arcs that touch both: the entry (over the dwellings and the outer wall's walk on
// one of the ENTRY_PSI bearings, crossing the wall beside the gate); the field's own axis, over the forecourt, the gatehouse
// and the flags toward the keep; the keep's leg, KEEP_PSI out of the cliff's heading, through the shoulder between
// the front's corner tower and the second mass's turret; the cliff's leg along the wall, PASS_T out of it, over the
// back court, the slot's bridge and the tree's bole; the lane's own axis into the ring. THE LINE READS THE PLAN (the
// towers, to choose where it crosses the wall; the roofs and stacks under it, for its height; the tree's limbs):
// the plan reads nothing of the line.
// a course in plan: stations every 12 m (every 30 m down the lane to its last 96 m)
function layCourse(P, off, psiIn, arcEnd) {
  const { fromWT, toWT, mir, hA } = P, K = P.keep, q = P.quad, OW = P.outer;
  const eL = dirP(M.LANE_PSI), tw = P.lane.wt, endWT = [tw[0] - eL[0] * M.END_SHORT, tw[1] - eL[1] * M.END_SHORT], leftOf = (d) => [-d[1], d[0]], dIn = dirP(psiIn);
  // (the place on the outer wall's middle off metres along it from the gate, on the field's side of the gate)
  let X = null; for (const sd of [-1, 1]) { const th = OW.a0 + sd * off / OW.R, wt = toWT(OW.cx + Math.sin(th) * OW.R, OW.cz - Math.cos(th) * OW.R); if (!X || wt[1] > X[1]) X = wt; }
  const start = [X[0] - dIn[0] * M.START, X[1] - dIn[1] * M.START], tArc = q.t1 + M.NEAR_DEEP + arcEnd;
  // (the first arc's radius: the one that ends on the field's axis tArc out)
  const R1 = (start[1] + dIn[1] * (q.mid - start[0]) / dIn[0] - tArc) / Math.tan((90 + psiIn) * DEG / 2);
  const legs = [
    { p: start, psi: psiIn, R: R1 },
    { p: [q.mid, q.t1], psi: -90, R: M.R_FIELD },
    { p: K.shoulder, psi: M.KEEP_PSI, R: M.R_GULF },
    { p: [0, M.PASS_T], psi: 0, R: M.R_LANE },
    { p: endWT, psi: M.LANE_PSI, R: 0 },
  ];
  const c0 = fromWT(start[0], start[1]), RT = [{ x: c0[0], z: c0[1], az: hA - psiIn * DEG * mir, s: 0 }], marks = [];
  const put = (w, t, psi, ds) => { const c = fromWT(w, t), a = RT[RT.length - 1]; RT.push({ x: c[0], z: c[1], az: hA - psi * DEG * mir, s: a.s + ds }); };
  let at = start, straight = 0;
  const straightTo = (p, psi, step) => { const len = Math.hypot(p[0] - at[0], p[1] - at[1]), n = Math.max(1, Math.round(len / step)); for (let i = 1; i <= n; i++) put(lerp(at[0], p[0], i / n), lerp(at[1], p[1], i / n), psi, len / n); at = p; };
  for (let k = 0; k < legs.length - 1; k++) {
    const A = legs[k], B = legs[k + 1], da = dirP(A.psi), db = dirP(B.psi), den = da[0] * db[1] - da[1] * db[0];
    const u = ((B.p[0] - A.p[0]) * db[1] - (B.p[1] - A.p[1]) * db[0]) / den, I = [A.p[0] + da[0] * u, A.p[1] + da[1] * u];
    const turn = B.psi - A.psi, tau = A.R * Math.abs(Math.tan(turn * DEG / 2)), sg = Math.sign(turn);
    const q0 = [I[0] - da[0] * tau, I[1] - da[1] * tau], c = [q0[0] + leftOf(da)[0] * A.R * sg, q0[1] + leftOf(da)[1] * A.R * sg];
    straightTo(q0, A.psi, 12); marks.push(RT[RT.length - 1].s);
    // (WHERE THE LINE FIRST BENDS: the curve through the stations is straight as far as the last station before
    // the first arc's first, and leans into the arc from there)
    if (k === 0) straight = RT[RT.length - 2].s;
    const len = A.R * Math.abs(turn) * DEG, n = Math.max(2, Math.ceil(len / 12));
    for (let i = 1; i <= n; i++) { const psi = A.psi + turn * i / n, l = leftOf(dirP(psi)); put(c[0] - l[0] * A.R * sg, c[1] - l[1] * A.R * sg, psi, len / n); }
    at = [I[0] + db[0] * tau, I[1] + db[1] * tau]; marks.push(RT[RT.length - 1].s);
  }
  // (the last 96 m are laid at every 12 m: the curve through the stations is then level and straight for the whole
  // of its last 60 m, with no swell left of the climb before them)
  straightTo([endWT[0] - eL[0] * 96, endWT[1] - eL[1] * 96], M.LANE_PSI, 30);
  straightTo(endWT, M.LANE_PSI, 12);
  return { RT, marks, R1, off, psi: psiIn, arcEnd, straight };
}
// THE PLAIN CLIMB from (s0, y0) to (s1, y1): its slope grows from nought over the first 90 m, holds, and falls to
// nought over the last 60 m (a lens that follows it tips up and levels again over three seconds and more)
function climbAt(s, s0, s1, y0, y1) {
  const D = s1 - s0, r0 = Math.min(90, D * 0.3), r1 = Math.min(60, D * 0.2), k = (y1 - y0) / (D - r0 / 2 - r1 / 2), d = clamp(s - s0, 0, D);
  if (d < r0) { const t = d / r0; return y0 + k * r0 * (t * t * t - 0.5 * t * t * t * t); }
  if (d > D - r1) { const t = (D - d) / r1; return y1 - k * r1 * (t * t * t - 0.5 * t * t * t * t); }
  return y0 + k * (d - r0 / 2);
}
// THE ENTRY'S RISE over a course, from its first metre to 10 m before the keep's front; one law for the course that
// is flown and for every course that is asked the clearance's question. At every station the plain climb (climbAt)
// from the entry's height to yKeep, or ROOF_OVER above the highest roof or stack within ROOF_SIDE of the station if
// that is more; never down again, a climb begun early enough to keep under SLOPE_UP, the first climb from the
// entry's own height never steeper than 0.26, smoothed twice. Returns the plan metres at which the course has the
// field's gatehouse, the field's edge and the keep's front behind it (searched every metre), the last station of
// the rise (iK) and the height at every station up to it (h)
function riseOf(P, c, yE, yKeep) {
  const { toWT } = P, q = P.quad, RT = c.RT, nRT = RT.length - 1, sArcA = c.marks[0], sFieldB = c.marks[3], sGulfA = c.marks[4], _p = {};
  const sWhere = (test, s0, s1) => { for (let s = s0; s < s1; s += 1) { planAt(RT, s, _p); const wt = toWT(_p.x, _p.z); if (test(wt[0], wt[1])) return s; } return s1; };
  const sHouse = sWhere((w, t) => t <= q.t1 + M.NEAR_DEEP / 2, sArcA, sFieldB), sField = sWhere((w, t) => t <= q.t1, sHouse, sFieldB), sFront = sWhere((w, t) => t <= M.KEEP_T1, sField, sGulfA), sK = sFront - 10;
  // (the roofs and stacks that stand under the climb: the top of every range of the inner and middle wards within
  // ROOF_SIDE of a station in plan; a pitched roof's stacks stand 6 m over its ridge, a flat one's merlons 1.6 m)
  const under = []; let iK = 0; while (iK < nRT && RT[iK + 1].s <= sK) iK++;
  { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i <= iK; i++) { x0 = Math.min(x0, RT[i].x); x1 = Math.max(x1, RT[i].x); z0 = Math.min(z0, RT[i].z); z1 = Math.max(z1, RT[i].z); }
    for (const m of P.ranges) if (m.zone < 2 && m.x > x0 - 60 && m.x < x1 + 60 && m.z > z0 - 60 && m.z < z1 + 60) under.push(m); }
  const topAt = (x, z) => { let top = -1e9; for (const m of under) { const ox = x - m.x, oz = z - m.z, cs = Math.cos(m.yaw), sn = Math.sin(m.yaw); if (Math.abs(ox * cs + oz * sn) < m.hw + M.ROOF_SIDE && Math.abs(ox * sn - oz * cs) < m.hl + M.ROOF_SIDE) top = Math.max(top, (m.roof === 2 ? m.eave + 1.6 : m.ridge) + (m.chim ? 6 : 0)); } return top; };
  const h = [];
  for (let i = 0; i <= iK; i++) {
    const st = RT[i], plain = climbAt(st.s, M.ENTRY_LEVEL, sK, yE, yKeep);
    h.push(st.s <= M.ENTRY_LEVEL || st.s >= sField ? plain : Math.min(yKeep, Math.max(plain, topAt(st.x, st.z) + M.ROOF_OVER)));
  }
  for (let i = 1; i <= iK; i++) if (RT[i].s > M.ENTRY_LEVEL) h[i] = Math.max(h[i], h[i - 1]);
  for (let i = iK - 1; i >= 0; i--) if (RT[i].s > M.ENTRY_LEVEL) h[i] = Math.max(h[i], h[i + 1] - M.SLOPE_UP * (RT[i + 1].s - RT[i].s));
  // (the entry's own height stands: the first climb from it is never steeper than 0.26)
  for (let i = 1; i <= iK; i++) h[i] = Math.min(h[i], h[i - 1] + 0.26 * (RT[i].s - RT[i - 1].s));
  for (let pass = 0; pass < 2; pass++) for (let i = 1; i < iK; i++) if (RT[i - 1].s >= M.ENTRY_LEVEL) h[i] = 0.25 * h[i - 1] + 0.5 * h[i] + 0.25 * h[i + 1];
  for (let i = 0; i <= iK; i++) if (RT[i].s <= M.ENTRY_LEVEL + 0.001) h[i] = yE;
  return { sHouse, sField, sFront, sK, iK, h };
}
async function layLine(P) {
  const { toWT, mir } = P, K = P.keep, q = P.quad, _p = {};
  const yE = M.WALL_WALK + M.ENTRY_OVER, yKeep = K.base + M.KEEP_OVER;
  // ---- WHERE IT CROSSES THE WALL. THE ROOM FROM WALLS IS THE LINE'S TO GIVE: every tower stands as it was dealt and
  // the course is chosen among them. FIRST, of the courses on the ENTRY_PSI bearings through the CROSS offsets that
  // come on to the field's axis at the ARC_END distances by an arc of R_ENTRY and more, the one that keeps farthest
  // from the wall of every tower that stands as high as the line flies there (on the plain climb from the entry to
  // the keep), from its first metre to the field's edge. THEN THE CLEARANCE'S OWN QUESTION is asked of that course
  // (askOf: how many towers would stand within the true clearance of it, and the least room between it and the
  // wall of any tower: every solid of a tower by its own girth and heights, the course at the heights its rise
  // gives it). If it keeps ROOM and more, it is the course. If not, the same question is asked of every course of
  // the finer family (ENTRY_PSI_FINE, CROSS_FINE, ARC_END_FINE: the same bearings, offsets and distances and those
  // between them), and the one that would leave out the fewest towers, and of those the one with the widest room,
  // is taken if it is the better. A tower that then stands nearer the line than ROOM is passed close as it stands;
  // only the true clearance leaves one out. IN BOTH FAMILIES A COURSE IS A COURSE ONLY IF ITS LINE IS STRAIGHT FOR
  // ITS FIRST ENTRY_STRAIGHT (layCourse's straight: where its line first bends), as it must be no tighter than R_ENTRY
  let C = null, best = -1e9;
  // (a tower's whole reach: the highest head of it and of the smaller towers on it, and how far the farthest of
  // them stands out from its middle; and the solids of every tower that stands as high as the entry, for askOf)
  const high = [], walls = []; let tried = 0;
  for (const t of P.towers) {
    if (t.part === 'far') continue;
    const so = towerSolids(t); let hi = -1e9, reach = 0; for (const o of so) { hi = Math.max(hi, o.y1); reach = Math.max(reach, Math.hypot(o.x - t.x, o.z - t.z) + o.r); }
    if (hi >= yE - 5) high.push({ x: t.x, z: t.z, hi, reach });
    if (hi + M.CLEAR >= yE) walls.push({ x: t.x, z: t.z, reach, so });
  }
  await P.Y();
  // (where a course first has the keep's front behind it: the plain climb ends 10 m before)
  const frontOf = (c) => { const RTc = c.RT; for (let i = 0; i < RTc.length; i++) { const wt = toWT(RTc[i].x, RTc[i].z); if (RTc[i].s > c.marks[1] && wt[1] <= M.KEEP_T1) return RTc[i].s; } return 0; };
  // THE CLEARANCE'S OWN QUESTION, asked of a course: its stations joined, from its first metre to the end of its
  // rise, each at the height the rise gives it; a solid is asked where the course comes nearest it in plan, if the
  // course flies there within the clearance of the solid's own heights. Returns the towers that would stand within
  // the clearance and three tenths of a metre (the line as flown bows that little off its stations' chords), and
  // the least room (room beyond 40 m is not measured)
  const askOf = (c) => {
    const RTc = c.RT, rise = riseOf(P, c, yE, yKeep), h = rise.h, m = rise.iK; let room = 40, nIn = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i <= m; i++) { const q = RTc[i]; if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.z < z0) z0 = q.z; if (q.z > z1) z1 = q.z; }
    for (const t of walls) {
      const pad = t.reach + 40; let least = 40;
      if (t.x + pad < x0 || t.x - pad > x1 || t.z + pad < z0 || t.z - pad > z1) continue;
      for (const o of t.so) for (let i = 0; i < m; i++) {
        const a = RTc[i], b = RTc[i + 1], dx = b.x - a.x, dz = b.z - a.z, f = clamp(((o.x - a.x) * dx + (o.z - a.z) * dz) / (dx * dx + dz * dz), 0, 1);
        const d = Math.hypot(a.x + dx * f - o.x, a.z + dz * f - o.z) - o.r;
        if (d >= least) continue;
        const y = lerp(h[i], h[i + 1], f);
        if (y > o.y1 + M.CLEAR || y < o.y0 - M.CLEAR) continue;
        least = d;
      }
      if (least < room) room = least;
      if (least < M.CLEAR + 0.3) nIn++;
    }
    return [nIn, room];
  };
  for (const arcEnd of M.ARC_END) for (const psiIn of M.ENTRY_PSI) for (const off of M.CROSS) {
    const c = layCourse(P, off, psiIn, arcEnd), RTc = c.RT, n = RTc.length - 1; let far = 1e9;
    if (c.R1 < M.R_ENTRY || c.straight < M.ENTRY_STRAIGHT) continue;
    const sF = frontOf(c);
    for (let i = 0; i <= n && RTc[i].s < c.marks[2]; i++) {
      const st = RTc[i], y = climbAt(st.s, M.ENTRY_LEVEL, sF - 10, yE, yKeep);
      for (const t of high) { if (t.hi < y - 5) continue; const d = Math.hypot(t.x - st.x, t.z - st.z) - t.reach; if (d < far) far = d; }
    }
    if (far > best) { best = far; C = c; }
    if (++tried % 2 === 0) await P.Y();
  }
  await P.Y();
  let [nIn, room] = askOf(C), fine = false;
  if (room < M.ROOM) {
    await P.Y();
    for (const arcEnd of M.ARC_END_FINE) for (const psiIn of M.ENTRY_PSI_FINE) for (const off of M.CROSS_FINE) {
      const c = layCourse(P, off, psiIn, arcEnd);
      if (++tried % 2 === 0) await P.Y();
      if (c.R1 < M.R_ENTRY || c.straight < M.ENTRY_STRAIGHT) continue;
      const r = askOf(c);
      if (r[0] < nIn || (r[0] === nIn && r[1] > room)) { nIn = r[0]; room = r[1]; C = c; fine = true; }
    }
  }
  P.room = room; P.fine = fine;
  const RT = C.RT, marks = C.marks;
  const nRT = RT.length - 1, sEnd = RT[nRT].s, hE = RT[nRT].az, [sArcA, sArcB, sFieldA, sFieldB, sGulfA, sGulfB, sLaneA, sLaneB] = marks;
  // the plan metre at which the course first has a given place of the wall's frame behind it (searched every metre)
  const sWhere = (test, s0, s1) => { for (let s = s0; s < s1; s += 1) { planAt(RT, s, _p); const wt = toWT(_p.x, _p.z); if (test(wt[0], wt[1])) return s; } return s1; };
  const sWall = M.START, sHouse = sWhere((w, t) => t <= q.t1 + M.NEAR_DEEP / 2, sArcA, sFieldB), sField = sWhere((w, t) => t <= q.t1, sHouse, sFieldB);
  const sFront = sWhere((w, t) => t <= M.KEEP_T1, sField, sGulfA), sFlank = sWhere((w) => w >= M.KEEP_W1, sFront, sGulfB + 50), sSB = sWhere((w) => w >= (M.SBRIDGE_W0 + M.SBRIDGE_W1) / 2, sGulfA, sLaneA);
  const sSlot0 = sWhere((w) => w >= M.SLOT_W0, sGulfA, sLaneA), sSlot1 = sWhere((w) => w >= M.SLOT_W1, sGulfA, sLaneA), sRoot = sWhere((w) => w >= 0, sGulfB, sLaneA + 1), sCats = sWhere((w) => w >= M.CATS_W0, sRoot, sEnd);
  // the lane's plan metres: where the line is LANE_FROM, BRIDGE_AT and LANE_TO before the tower's middle
  const sLane0 = sEnd + M.END_SHORT - M.LANE_FROM, sBridge = sEnd + M.END_SHORT - M.BRIDGE_AT, sLane1 = sEnd + M.END_SHORT - M.LANE_TO;
  await P.Y();
  // ---- THE LINE IS LAID CLEAR OF THE TREE AS DEALT: where its course passes within TREE_NEAR of any limb in plan, it
  // flies TREE_CLEAR above the highest place of every such limb (its thickness and its give in the wind with it)
  let treeTop = -1e9, sT0 = sRoot, sT1 = sRoot;
  { const c = []; for (let s = sSlot1; s <= sLaneB + 40; s += 2) { planAt(RT, s, _p); const q = toWT(_p.x, _p.z); c.push(q[0], q[1], s); }
    const C = new Float64Array(c), O = { top: treeTop, s0: sT0, s1: sT1, w0: 1e9, w1: -1e9, t0: 1e9, t1: -1e9 }; let work = 0;
    for (let k = 0; k < C.length; k += 3) { O.w0 = Math.min(O.w0, C[k]); O.w1 = Math.max(O.w1, C[k]); O.t0 = Math.min(O.t0, C[k + 1]); O.t1 = Math.max(O.t1, C[k + 1]); }
    O.w0 -= M.TREE_NEAR; O.w1 += M.TREE_NEAR; O.t0 -= M.TREE_NEAR; O.t1 += M.TREE_NEAR;
    for (const Lb of P.treeLimbs) { if (++work % 120 === 0) await P.Y(); if (!Lb.gone) limbOverCourse(Lb, C, -mir, M.TREE_NEAR, O); }
    for (const Lb of P.treeLimbs.stubs) { if (++work % 120 === 0) await P.Y(); if (!Lb.gone) limbOverCourse(Lb, C, -mir, M.TREE_NEAR, O); }
    treeTop = O.top; sT0 = O.s0; sT1 = O.s1;
  }
  P.tree.top = treeTop;
  // ---- THE LINE'S HEIGHTS. Level for the first ENTRY_LEVEL, ENTRY_OVER above the outer wall's walk (both cameras
  // begin along the level entry frame). FROM THE WALL TO THE KEEP it climbs over what stands: at every station the
  // plain climb (climbAt) from the entry's height to KEEP_OVER above the keep's first roof, or ROOF_OVER above the highest
  // roof or stack within ROOF_SIDE of the station if that is more; it never comes down again before the keep, begins
  // a climb early enough to keep under SLOPE_UP, and is smoothed twice. (A roof it cannot clear within that slope
  // from the entry's own height is the true clearance's.) It holds the keep's height to 30 m before its flank; comes down behind
  // it to SBRIDGE_OVER above the slot's bridge and on down over the tree's bole (never under the height that clears
  // the tree as dealt), to 8 m over the cats' walk; into the lane, LANE_EYE over its court, level for 30 m and more
  // (to 40 m into the lane at the least); then up under its bridge to the ring's height, level from 8 m before the
  // last LEVEL_END on. THE WAY DOWN is one smooth curve through those knots. SLOPE_DOWN sets where two of the knots
  // stand (the root's, by the fall from the slot's bridge; the lane's, by the fall from over the cats' walk); it is
  // not the curve's steepest: between two knots the line as flown falls 0.19 at the most by its own tangent (0.190 of fall to run on seeds 1 to
  // 300, 0.187 by the tangent's own height, 0.181 over any 8 m of it)
  const yClr = M.TREE_Y + treeTop + M.TREE_CLEAR, ySB = M.SBRIDGE_RIDGE + M.SBRIDGE_OVER, yLane = M.LANE_Y + M.LANE_EYE, sK = sFront - 10;
  const yRoot = Math.max(yClr, ySB - M.SLOPE_DOWN * (sRoot - sSB - 6)), yAft = Math.max(yClr, yRoot - 0.1 * (sT1 + 14 - sRoot));
  // (the knots of the way down; the one where the line is first at the lane's height stands far enough on that the
  // mean fall to it from over the cats' walk is no more than SLOPE_DOWN)
  const sOver = Math.max(sT1 + 30, sCats + 20), yOver = Math.max(yClr, M.CATS_Y + 8), sIn = Math.max(sCats + 60, sLane0 - 10, sOver + (yOver - yLane) / M.SLOPE_DOWN);
  const HK = [[sK, yKeep], [sFlank - 30, yKeep], [sSB - 6, ySB], [sSB + 6, ySB], [sRoot, yRoot], [sT1 + 14, yAft], [sOver, yOver],
    [sIn, yLane], [Math.max(sLane0 + 40, sIn + 30), yLane], [sEnd - M.LEVEL_END, M.RING_Y], [sEnd, M.RING_Y]];
  const hAt = mono(HK);
  // (the rise from the wall to the keep: riseOf, the same law every course is asked by)
  const rise = riseOf(P, C, yE, yKeep), iK = rise.iK;
  let ys = RT.map((st) => hAt(st.s));
  for (let i = 0; i <= iK; i++) ys[i] = rise.h[i];
  await P.Y();
  for (let i = iK + 1; i < nRT; i++) ys[i] = RT[i].s >= sEnd - M.LEVEL_END - 8 ? M.RING_Y : hAt(RT[i].s);
  ys[nRT] = M.RING_Y;
  await P.Y();
  // THE LINE AS FLOWN, one path (the kit's own measure of its length reads sixty places a station: the stations are
  // no closer than the course needs)
  const path = makePath(RT.map((q, i) => [q.x, ys[i], q.z]), { samples: 128 }), L = path.length;
  await P.Y();
  // plan metres to route metres (the route is a little longer than its plan where it climbs or falls)
  const cum = [0]; for (let i = 1; i <= nRT; i++) cum.push(cum[i - 1] + Math.hypot(RT[i].x - RT[i - 1].x, ys[i] - ys[i - 1], RT[i].z - RT[i - 1].z));
  const mOf = (s) => { planAt(RT, clamp(s, 0, sEnd), _p); const k = Math.min(_p.i, nRT - 1); return L * lerp(cum[k], cum[k + 1], clamp((s - RT[k].s) / (RT[k + 1].s - RT[k].s), 0, 1)) / cum[nRT]; };
  // the line itself at every 2 m (x, y, z), for the true clearance
  const LN_N = Math.ceil(L / 2) + 1, LN = new Float32Array(LN_N * 3), _v = new THREE.Vector3();
  for (let i = 0; i < LN_N; i++) { if (i % 200 === 199) await P.Y(); path.posAtDist(Math.min(L, i * 2), _v); LN[i * 3] = _v.x; LN[i * 3 + 1] = _v.y; LN[i * 3 + 2] = _v.z; }
  P.RT = RT; P.ys = ys; P.nRT = nRT; P.sEnd = sEnd; P.path = path; P.L = L; P.mOf = mOf; P.LN = LN; P.LN_N = LN_N; P.hE = hE; P.yTree = yRoot; P.cross = C.off; P.entryPsi = C.psi; P.arcEnd = C.arcEnd;
  P.s = { wall: sWall, arcA: sArcA, arcB: sArcB, house: sHouse, field: sField, fieldA: sFieldA, fieldB: sFieldB, front: sFront, flank: sFlank, gulfA: sGulfA, gulfB: sGulfB, sbridge: sSB, slot0: sSlot0, slot1: sSlot1, root: sRoot, treeA: sT0, treeB: sT1, cats: sCats, laneA: sLaneA, laneB: sLaneB, lane0: sLane0, bridge: sBridge, lane1: sLane1 };
}

// A LIMB OVER THE COURSE: C is the course in the wall's frame at every 2 m (w, t, its plan metre). Of the limb's places
// that lie within near metres of a place of the course in plan, O keeps the highest (its thickness and its give in the
// wind with it) and the first and the last plan metre that has one near. (The course is read by eights: a place of a
// limb that keeps near + 8 m from the middle one of eight is within near of none of them, each being within 8 m of it.)
function limbOverCourse(Lb, C, sx, near, O) {
  const nC = C.length / 3, N2 = near * near, F2 = (near + 8) * (near + 8), nG = Math.floor((nC + 3) / 8) + 1, pts = Lb.pts, rad = Lb.rad, sway = Lb.sway || 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], w = p[0] * sx, t = p[2];
    if (w < O.w0 || w > O.w1 || t < O.t0 || t > O.t1) continue;
    const top = p[1] + rad[i] + sway;
    for (let g = 0; g < nG; g++) {
      const e = Math.min(nC - 1, g * 8) * 3, ew = C[e] - w, et = C[e + 1] - t; if (ew * ew + et * et >= F2) continue;
      const k1 = Math.min(nC - 1, g * 8 + 3);
      for (let k = Math.max(0, g * 8 - 4); k <= k1; k++) {
        const dw = C[k * 3] - w, dt = C[k * 3 + 1] - t;
        if (dw * dw + dt * dt < N2) { const s = C[k * 3 + 2]; if (top > O.top) O.top = top; if (s < O.s0) O.s0 = s; if (s > O.s1) O.s1 = s; }
      }
    }
  }
}
// the least distance from a point to the line between two of its metres (the line's points stand every 2 m)
export function lineNear(P, x, y, z, m0 = 0, m1 = 1e9) {
  const LN = P.LN, i1 = Math.min(P.LN_N - 1, Math.ceil(m1 / 2)); let b2 = 1e30;
  for (let i = Math.max(0, Math.floor(m0 / 2)); i <= i1; i++) { const dx = LN[i * 3] - x, dy = LN[i * 3 + 1] - y, dz = LN[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b2) b2 = d; }
  return Math.sqrt(b2);
}
// ---------------------------------------------------------------- THE TRUE CLEARANCE: the line's only say over the plan.
// A thing whose nearest place would stand within CLEAR (2.5 m) of the line, its own reach counted in, is left out,
// after its draws, and counted by its kind in P.left (a bird on the wing: its whole round within 2.8 m; a tower by
// the same 2.5 m as every other thing). What stands on a thing that is left out goes with it. (The
// places themselves are not asked: the line is laid through them by their own measures: the keep's shoulder, the slot
// and its bridge, the lane and its bridge, the ring.)
async function clearLine(P) {
  const LN = P.LN, n = P.LN_N, C = M.CLEAR, left = { range: 0, buttress: 0, tower: 0, stack: 0, dormer: 0, plume: 0, hut: 0, bird: 0, flag: 0, weed: 0, bats: 0, stone: 0, yard: 0 };
  const goneR = new Set(), goneT = new Set(), goneS = new Set(), at = [];
  // (the line's own box, for a first sieve)
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, yLo = 1e9;
  for (let i = 0; i < n; i++) { const x = LN[i * 3], y = LN[i * 3 + 1], z = LN[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; if (y < yLo) yLo = y; }
  const far = (x, z, r) => x + r < x0 || x - r > x1 || z + r < z0 || z - r > z1;
  await P.Y();
  // ranges (their walls and built roofs, a flat roof's merlons with it) and their buttresses
  let work = 0;
  for (const m of P.ranges) {
    if (++work % 6 === 0) await P.Y();
    if (m.part === 'bridge' || m.part === 'sbridge' || far(m.x, m.z, m.rad + C) || m.topY + 2.4 + C * 1.5 < yLo) continue;
    const up = m.roof === 2 ? 2.4 : 0, r2 = (m.rad + C) * (m.rad + C);
    for (let i = 0; i < n; i++) {
      const x = LN[i * 3], y = LN[i * 3 + 1], z = LN[i * 3 + 2], dx = x - m.x, dz = z - m.z;
      if (dx * dx + dz * dz < r2 && rangeHolds(x, y - up, z, y, C, m.x, m.z, m.cs, m.sn, m.hw, m.hl, m.base, m.roof, m.eave, m.ridge, m.zone)) { goneR.add(m); left.range++; at.push(['range', x, y, z, m.part || 'roof']); break; }
    }
    if (m.butts && !goneR.has(m)) m.butts = m.butts.filter((b) => {
      if (far(b.x, b.z, 8)) return true;
      const cs = Math.cos(b.yaw), sn = Math.sin(b.yaw);
      for (let i = 0; i < n; i++) { const y = LN[i * 3 + 1]; if (y > b.y1 + C) continue; const dx = LN[i * 3] - b.x, dz = LN[i * 3 + 2] - b.z; if (Math.abs(dx * cs + dz * sn) < b.hw + C && Math.abs(dx * sn - dz * cs) < b.hl + C) { left.buttress++; at.push(['buttress', b.x, b.y1, b.z, m.part || 'roof']); return false; } }
      return true;
    });
  }
  await P.Y();
  // towers and the smaller towers on them
  for (const t of P.towers) {
    if (far(t.x, t.z, t.r * 2.5 + C)) continue;
    let hit = false;
    for (const q of towerSolids(t)) { const rq = (q.r + C) * (q.r + C); for (let i = 0; i < n && !hit; i++) { const y = LN[i * 3 + 1]; if (y > q.y1 + C || y < q.y0 - C) continue; const dx = LN[i * 3] - q.x, dz = LN[i * 3 + 2] - q.z; if (dx * dx + dz * dz < rq) hit = true; } }
    if (hit) { goneT.add(t); left.tower++; at.push(['tower', t.x, t.top, t.z, t.part]); }
  }
  await P.Y();
  // stacks (pots and all) and dormers
  for (const c of P.chimneys) {
    if (++work % 100 === 0) await P.Y();
    if (goneR.has(c.m) || goneT.has(c.t)) { goneS.add(c); c.gone = true; continue; }
    if (far(c.x, c.z, 4 + C) || c.y1 + 1.1 + C < yLo) continue;
    for (let i = 0; i < n; i++) { const y = LN[i * 3 + 1]; if (stackHolds(LN[i * 3], y - 0.6, LN[i * 3 + 2], y, C, c.x, c.z, c.cs, c.sn, c.hw, c.hl, c.y0, c.y1)) { goneS.add(c); c.gone = true; left.stack++; at.push(['stack', c.x, c.y1, c.z, c.m ? c.m.part || 'roof' : 'fist']); break; } }
  }
  await P.Y();
  const dormers = [], dormerStands = (d) => {
    const m = d.m; if (goneR.has(m)) return false;
    if (far(m.x, m.z, m.rad + C) || m.ridge + C < yLo) return true;
    const big = d.big || 1, lx = d.side * m.hw * 0.62, x = m.x + lx * m.cs + d.lz * m.sn, z = m.z + lx * m.sn - d.lz * m.cs, yb = roofY(m, m.hw * 0.7), rr = (d.wide + 1.5 + C) * (d.wide + 1.5 + C);
    for (let i = 0; i < n; i++) { const y = LN[i * 3 + 1]; if (y > yb + 2.5 * big + C) continue; const dx = LN[i * 3] - x, dz = LN[i * 3 + 2] - z; if (dx * dx + dz * dz < rr) { left.dormer++; at.push(['dormer', x, yb, z, m.part || 'roof']); return false; } }
    return true;
  };
  for (const d of P.dormers) { if (++work % 150 === 0) await P.Y(); if (dormerStands(d)) dormers.push(d); }
  if (goneR.size) P.ranges = P.ranges.filter((m) => !goneR.has(m));
  if (goneT.size) { const tw = P.towers; for (let i = tw.length - 1; i >= 0; i--) if (goneT.has(tw[i])) tw.splice(i, 1); P.fists = P.fists.filter((t) => !goneT.has(t)); }
  if (goneS.size) P.chimneys = P.chimneys.filter((c) => !goneS.has(c));
  P.dormers = dormers;
  await P.Y();
  // (the readers of solids are made again from what stands)
  if (goneR.size || goneT.size || goneS.size) { P.SC = null; P.TS = null; P.TSC = null; P.TW = null; planCasters(P); }
  await P.Y();
  // smoke: a plume whose smoke as drawn would come within the clearance of the line at any age of a puff: read at
  // 61 ages along its way, each with half the way to the next age added to its reach
  const c3 = [0, 0, 0], NA = 60;
  const plumes = [], plumeStands = (p) => {
    if (p.of && goneS.has(p.of)) return false;
    if (far(p.x, p.z, p.drift + p.r1 * 1.3 + 20)) return true;
    for (let i = 0; i <= NA; i++) { const a = i / NA, r = plumePoint(p, a, P.wind, c3) + Math.hypot(p.rise * (1 - a), p.drift * a) / NA; if ((r <= 9 ? lineNear15(P, c3[0], c3[1], c3[2]) : lineNear(P, c3[0], c3[1], c3[2])) - r < C) { left.plume++; at.push(['plume', p.x, p.y, p.z, p.of ? 'stack' : 'own']); return false; } }
    return true;
  };
  for (const p of P.plumes) { if (++work % 100 === 0) await P.Y(); if (plumeStands(p)) plumes.push(p); }
  P.plumes = plumes;
  await P.Y();
  // dwellings
  P.huts = P.huts.filter((h) => { if (far(h.x, h.z, 6 + C) || h.y1 + 3 + C < yLo) return true; if (lineNear15(P, h.x, h.y1, h.z) < Math.hypot(h.hw, h.hl) + 2.5 + C) { left.hut++; at.push(['hut', h.x, h.y1, h.z, '']); return false; } return true; });
  // birds: every phase of every round that is flown on this visit (a bird goes with its seat; the flock that lifts
  // only on a rare visit is read on its seats on every other)
  { const keep = [], goneB = new Set(); let k = 0;
    const nearL = (b) => (b.kind === 1 && !P.rare ? lineNear15(P, b.home[0], b.home[1], b.home[2]) - b.size * 0.6 - C : birdNear(P, b, M.CLEAR_FLOWN) - M.CLEAR_FLOWN) < 0;
    for (let b of P.birds) {
      if (++k % 50 === 0) await P.Y();
      if (b.seat && goneR.has(b.seat)) { goneB.add(b); continue; }
      // (MENDING 4: a bird that sits or flies another way because its first round would cross a face (first: the round
      // the old law would have flown) goes as before where THAT round comes too near the line: none is added. A bird
      // that flies another way than its first, and would come within 15 m of the line and nearer than its first
      // round came, keeps its seat and SITS. MENDING 5 (said truly in mending 6): A ROOK OF THE TREE on any way but
      // its first sits if that way comes within 15 m of the flown line by this part's own reading (birdNear's walk;
      // the reader's finer walk finds five such ways at 14.73 to 14.92 m, 14.7 m at the least: the reader's count),
      // and beyond that a way may lie nearer the line than the first did; the least distance of any flier from the
      // line is unchanged by it, 2.801 m by this part's own reading (the builder's count, seeds 1 to 300) and
      // 2.764 m by the reader's finer walk (the reader's count), the same in mendings 4 and 5)
      if (b.first && nearL(b.first)) { left.bird++; at.push(['bird', b.home[0], b.home[1], b.home[2], b.on]); goneB.add(b); continue; }
      if (b.first && b.share < 1 && (b.kind !== 1 || P.rare)) {
        const dn = birdNear(P, b, -1e9, true);
        if (b.on === 'tree' ? dn < 15 - b.size * 0.6 : dn < 15 && dn < birdNear(P, b.first, -1e9, true)) {
          const st = { home: b.home, kind: 0, R: 0, H: 0, yaw: b.first.yaw - (b.kind === 2 ? Math.PI / 2 : 0), period: b.period, phase: b.phase, share: 1, size: b.size, tint: b.tint, on: b.on, seat: b.seat, th: b.th, first: b.first };
          const i = P.perches ? P.perches.indexOf(b) : -1; if (i >= 0) P.perches[i] = st;
          b = st;
        }
      }
      if (nearL(b)) { left.bird++; at.push(['bird', b.home[0], b.home[1], b.home[2], b.on]); goneB.add(b); continue; }
      keep.push(b);
    }
    P.birds = keep; if (goneB.size) P.perches = P.perches.filter((b) => !goneB.has(b)); }
  await P.Y();
  // MENDING 6, M2: A BIRD MADE TO SIT IS ASKED WHETHER ITS SEAT IS CLEAR (seatSunk; the law is written there): the
  // rooks the mendings made sit (those that carry the round they first would have flown) on the quad's ridges,
  // the inner ward's roofs, the parapet and the tree. One that is sunk in what is drawn about its seat is left out
  // here, last of all, after every draw and after the line's own say: no bird moves and none is added. NOT ASKED,
  // and as they were: an owl (its seat is asked by its ball where it is dealt), the field's and the ledge's rooks,
  // the flock, every flier's rest at its home, every bird nobody made sit. P.unseated: how many are left out, by
  // seat. The work stands in steps of its own: a hand-back before it, one at every eighth bird asked, one after
  { const keep = [], gone = new Set(), un = { quad: 0, roof: 0, parapet: 0, tree: 0 }; let k = 0;
    for (const b of P.birds) {
      if (b.share >= 1 && b.first && un[b.on] !== undefined) { if (++k % 8 === 0) await P.Y(); if (seatSunk(P, b)) { un[b.on]++; gone.add(b); continue; } }
      keep.push(b);
    }
    if (gone.size) { P.birds = keep; if (P.perches) P.perches = P.perches.filter((b) => !gone.has(b)); }
    P.unseated = un; }
  await P.Y();
  // rags of flag, the weeds, the bats' air
  P.flags = P.flags.filter((f) => { if (goneT.has(f.t)) return false; if (lineNear15(P, f.x, f.y + f.pole, f.z) < f.len + 1 + C) { left.flag++; at.push(['flag', f.x, f.y, f.z, '']); return false; } return true; });
  const weedOk = (w) => lineNear15(P, w.x, w.y + w.h * 0.6, w.z) >= w.h * 0.8 + C;
  P.weeds = P.weeds.filter((w) => { if (weedOk(w)) return true; left.weed++; return false; });
  if (P.weed && !weedOk(P.weed)) { P.weed = null; left.weed++; }
  // the old things of stone on the floors
  P.stones = P.stones.filter((o) => { if (lineNear15(P, o.x, o.y + o.h / 2, o.z) >= Math.hypot(o.r, o.h / 2) + C) return true; left.stone++; at.push(['stone', o.x, o.y, o.z, o.fore ? 'forecourt' : 'field']); return false; });
  if (P.bats && lineNear(P, P.bats.x, P.bats.y, P.bats.z) - P.bats.radius - P.bats.reach < C) { P.bats = null; left.bats++; }
  // (left: the counts by kind; leftAt: each thing left out, its kind, its place and what it stood on, for the counts)
  // (ROUND 7: a thing of the yard is left out whole if any of its solids would stand within the clearance)
  P.yard = P.yard.filter((o) => { if (o.sol.every((q) => lineNear15(P, q[0], o.y + q[3] / 2, q[1]) >= Math.hypot(q[2], q[3] / 2) + C) && (!o.ball || lineNear15(P, o.ball[0], o.ball[1], o.ball[2]) >= o.ball[3] + C)) return true; left.yard++; at.push(['yard', o.x, o.y, o.z, o.kind]); return false; });
  P.left = left; P.leftAt = at;
}

// ---------------------------------------------------------------- THE FILM: paces and gaze by places (route metres)
export function roofFilm(P) {
  const { L, mOf, path } = P, S = P.s, K = P.keep;
  const m = {}; for (const k in S) m[k] = mOf(S[k]);
  // paces at places (metres a second as laid; the engine scales the whole to the duration): steady in over the
  // dwellings and the wall; quicker round the long turn over the gate's ward; easier down the field's axis and round
  // to the keep's shoulder; quicker over its terrace; easier round and down to the cliff; slowest past the tree; slow
  // past the cats' walk; quicker into the lane and through it; slow across the round to the ring. EVERY CHANGE OF
  // PACE IS LAID OVER 45 m AND MORE
  const PACE = [[0, 22], [m.wall, 22], [m.wall + 50, 29], [m.arcB - 30, 29], [m.arcB + 20, 27], [m.fieldA, 27], [m.fieldB, 25], [m.front, 25], [m.flank, 27], [m.gulfB, 20],
    [m.root - 12, 14], [m.root + 10, 14], [m.cats + 10, 16], [Math.max(m.laneB - 20, m.cats + 62), 20], [m.lane0 + 40, 25], [m.bridge, 25], [m.lane1, 22], [L - 50, 14], [L, 12]];
  const pace = (u) => lin(PACE, clamp(u, 0, 1) * L) / 22;
  // THE GAZE, by the metres flown. THE RULE OF THE PULLS: every pull rises and falls over 1.65 s of flight or more
  // (a ramp is 100 m and more where the pace is over 20 m a second, 45 m and more elsewhere). EVERY PULL'S MARK
  // STANDS NEAR THE LENS'S OWN LEVEL OR UNDER IT: while the line climbs or comes down the look is drawn toward the
  // level, so that the uprights of the place stand upright in the picture
  const fade = (a, b, r) => Math.min(0.5, r / (b - a));
  const gka = m.arcA + 10, gkb = m.fieldB, gta = m.flank - 20, gtb = m.laneB + 30, gca = m.root + 20, gcb = m.cats + 62, g3a = m.laneA - 40, gfa = m.field + 10, gfb = m.gulfA + 30, F = P.finger;
  const kc = P.fromWT(K.w, M.FIELD_T0), cp = P.cats.pts[6], sd = dirP(P.sunPsi), gp = P.fromWT(sd[0] * 900, M.PASS_T + sd[1] * 900);
  const pois = [
    // Gk THE KEEP, the place's one landmark: the foot of its front on the flags, a little over them: from the
    // beginning of the long turn until the line has come round toward its shoulder (the look goes before the line
    // round the turn to the keep, is held on it over the forecourt, the gatehouse and the field, and is let go as
    // the line rounds to its shoulder)
    { at: new THREE.Vector3(kc[0], M.QUAD_Y + 14, kc[1]), from: gka / L, to: gkb / L, weight: 0.42, fade: fade(gka, gkb, 110) },
    // Gt THE LOW SUN'S QUARTER over the gulf (a place 900 m off on the sun's own bearing, a little over the tree's
    // height): from 20 m before the keep's flank until 30 m past the turn into the lane (the look is turned out of
    // the cliff's wall toward the gulf while the line comes down behind the keep and along the wall: the door and
    // the bole stand at the picture's wall side, the trunk runs out from them to the table, the gulf lies under
    // them, the cats' walk after them; it is let go through the turn into the lane, which turns the same way)
    { at: new THREE.Vector3(gp[0], M.TREE_Y + 6, gp[1]), from: gta / L, to: gtb / L, weight: 0.45, fade: fade(gta, gtb, 110) },
    // Gc the tide of cats: a place 60 m along their walk, from 20 m past the root to 62 m along the walk
    { at: new THREE.Vector3(cp[0], cp[1] + 0.3, cp[2]), from: gca / L, to: gcb / L, weight: 0.18, fade: 0.5 },
    // G3 the window with the ring at the lane's end: from 40 m before the turn into the lane to the end (the look goes
    // before the line round the turn, down the lane and through its bridge to the ring and the low sun beside the
    // tower, and is held near the level while the line climbs to the ring)
    { at: path.end.clone(), from: g3a / L, to: 1, weight: 0.5, fade: fade(g3a, L, 130) },
    // Gf ROUND 7, THE LOOK OVER THE WALLS: THE FINGER TOWER beyond the keep's shoulder (its shaft a little over the
    // lens's level, 28 m over the ring): from 10 m past the field's near edge (the line is on the field's axis, the
    // keep's front before it) until 30 m past the place where it begins its round down to the cliff. The look goes
    // before the line round its turn along the keep's front: while the line runs beside the keep's
    // great face the look is drawn off that face, over the corner tower and the back court's roofs, to the one
    // thing the flight goes toward; the low sun's quarter takes the look from it as the line comes down
    { at: new THREE.Vector3(F.x, M.RING_Y + 28, F.z), from: gfa / L, to: gfb / L, weight: 0.45, fade: fade(gfa, gfb, 110) },
  ];
  // (nothing of the place is driven by the metres flown: the film is the pace and the gaze alone)
  return { m, PACE, pace, pois };
}
// THE FLOCK'S OWN ROUND, on the world's clock (a rare visit's rooks of the quadrangle's roofs): every 44 s they lift
// off the ridges, wheel over the flags and settle again, whether anyone is there or not. Where the round stands at the
// clock's nought is drawn for the visit (fork 'lift': P.liftPhase), so no film meets it at the same place twice.
// Each rook of the flock leaves its ridge after a delay of its own (0 to 5 s, made of its own drawn phase), flies whole
// rounds of its own loop, as many as end by the 31st second, and lands where it sat.
export const LIFT_ROUND = 44, LIFT_SPAN = 30.8, LIFT_SPREAD = 5;
// a share Q of a flight (0 to 1) eased at its two ends: the body gathers speed over the first share e and loses it over
// the last, so that it leaves its perch from rest and comes to rest on it (the same arithmetic as the birds' shader)
export function easeEnds(Q, e) {
  const t = clamp(Q / e, 0, 1), u = clamp((1 - Q) / e, 0, 1);
  const F = Q < e ? e * (t * t * t - 0.5 * t * t * t * t) : Q < 1 - e ? Q - 0.5 * e : (1 - e) - e * (u * u * u - 0.5 * u * u * u * u);
  return F / (1 - e);
}
const _fr = (x) => x - Math.floor(x);
// NO FLIER FLIES FASTER THAN A ROOK CAN: ROOK_PACE metres a second at the fastest place of its round. Where its dealt
// round would be faster, its flight takes as long as the round needs at that pace (the time it sits between flights
// stays as dealt; its phase is its own draw still): a rule of its own round, after its draws. The birds that lift
// with their flock fly one such round after another.
export const ROOK_PACE = 16;
export function slowRound(b) {
  if (b.share >= 1) return b;
  // (an owl's leaf-shaped round is at its fastest 1.14 times as fast as a circle of its breadth would be)
  const r = Math.hypot(b.R, b.H) * 0.5 * (b.kind === 2 ? 1.14 : 1), T = b.kind === 1 ? b.period : b.period * (1 - b.share);
  if (r * TAU / (T * (1 - Math.min(0.3, 0.5 / T))) <= ROOK_PACE) return b;
  const need = r * TAU / ROOK_PACE, T2 = need + 0.5 >= 5 / 3 ? need + 0.5 : need / 0.7;
  if (b.kind === 1) b.period = T2; else { const sit = b.period * b.share; b.period = sit + T2; b.share = sit / b.period; }
  return b;
}
// the fastest pace of a flier's round, metres a second
export const roundSpeed = (b) => { if (b.share >= 1) return 0; const T = b.kind === 1 ? b.period : b.period * (1 - b.share); return Math.hypot(b.R, b.H) * 0.5 * (b.kind === 2 ? 1.14 : 1) * TAU / (T * (1 - Math.min(0.3, 0.5 / T))); };
// THE BIRDS' CLOCKWORK (the same arithmetic as the birds' shader): where a bird is at a clock, which way it heads and how
// far its wings are open (0 folded on the perch, 1 in flight). lift: the round's drawn phase on a visit whose flock
// lifts, null on any other. A perched bird faces the way its loop leaves the perch and comes back to it, so its heading
// never jumps; its place and its wings ease at both ends of every flight.
export function birdAt(b, time, lift = null, out = {}) {
  const cy = Math.cos(b.yaw), sy = Math.sin(b.yaw), owl = b.kind === 2; let T = 1, tf = -1, loops = 1, sat = 0;
  if (b.kind === 1) {
    if (lift !== null) { const tl = _fr(time / LIFT_ROUND + lift) * LIFT_ROUND, delay = _fr(b.phase * 7.31 + 0.37) * LIFT_SPREAD; loops = Math.max(1, Math.floor((LIFT_SPAN - delay) / b.period)); T = loops * b.period; tf = tl - delay; }
  } else { const p = _fr(time / b.period + b.phase); T = b.period * (1 - b.share); tf = (p - b.share) * b.period; sat = b.share > 0 ? clamp(p / b.share, 0, 1) : 0; }
  const pos = out.pos || (out.pos = [0, 0, 0]), fwd = out.fwd || (out.fwd = [0, 0, 0]);
  if (tf > 0 && tf < T) {
    const Q = tf / T, a = easeEnds(Q, Math.min(0.3, 0.5 / T)) * loops * TAU, hh = Math.sin(a * 0.5) ** 2, f = b.R * 0.5 * (1 - Math.cos(a)), g = b.R * 0.5 * Math.sin(a) * (owl ? hh : 1);
    pos[0] = b.home[0] + sy * f + cy * g; pos[1] = b.home[1] + b.H * hh; pos[2] = b.home[2] - cy * f + sy * g;
    const gd = owl ? Math.cos(a) * hh + 0.5 * Math.sin(a) ** 2 : Math.cos(a);
    const tx = sy * Math.sin(a) + cy * gd, ty = b.H / Math.max(b.R, 1) * Math.sin(a), tz = -cy * Math.sin(a) + sy * gd, tl = Math.hypot(tx, ty, tz);
    if (tl > 1e-4) { fwd[0] = tx / tl; fwd[1] = ty / tl; fwd[2] = tz / tl; } else { const k = a < Math.PI ? 1 : -1; fwd[0] = sy * k; fwd[1] = 0; fwd[2] = -cy * k; }
    out.open = smoothstep(0, 0.35, tf) * (1 - smoothstep(T - 0.35, T, tf)); out.fly = true;
  } else {
    pos[0] = b.home[0]; pos[1] = b.home[1]; pos[2] = b.home[2]; out.open = 0; out.fly = false;
    // (an owl comes in to its sill facing the wall and turns round on it while it sits, to face the way it will leave)
    if (owl) { const th = Math.PI * smoothstep(0.2, 0.8, sat); fwd[0] = -sy * Math.cos(th) + cy * Math.sin(th); fwd[1] = 0; fwd[2] = cy * Math.cos(th) + sy * Math.sin(th); }
    else { fwd[0] = cy; fwd[1] = 0; fwd[2] = sy; }
  }
  return out;
}

// ---------------------------------------------------------------- THE TREE (in the hero's own frame: z out of the wall, y up, origin at the root's middle)
// THE TREE IS DEALT WHOLE BY ITS OWN LAW: every limb is drawn whole (a bowed line of points with radii) and stands as
// drawn. Nothing of it is broken, thinned or left out for the line (the line is laid clear of the tree as dealt); the
// one thing a limb gives way to is the tea set's own air on the trunk. o.sx mirrors the tree left for right.
export async function treeLimbs(rng, o, Y = null) {
  const { zFork, reach, r0, r1, sx } = o, limbs = [];
  // a bowed limb from a point along a direction: n points, the bow lifts (or drops) its middle, the tip wanders; it is
  // thick where it leaves its bough (a collar at the fork) and tapers
  // (every draw of a limb is taken by its caller before any test, so the stream never hangs on what stands)
  const wander = (g = rng) => [g.range(-0.18, 0.18), g.range(-0.1, 0.1), g.range(-0.12, 0.12)];
  const limb = (from, dir, len, ra, rb, bow, level, n, k3) => {
    const pts = [], rad = [], l = Math.hypot(dir[0], dir[1], dir[2]) || 1, d = [dir[0] / l, dir[1] / l, dir[2] / l];
    const kx = k3[0], ky = k3[1], kz = k3[2];
    for (let i = 0; i <= n; i++) {
      const f = i / n, w = f * f;
      pts.push([from[0] + d[0] * len * f + kx * len * w, from[1] + d[1] * len * f + bow * len * Math.sin(Math.PI * f) * 0.5 + ky * len * w, from[2] + d[2] * len * f + kz * len * w]);
      rad.push(lerp(ra, rb, Math.pow(f, 0.8)) * (1 + 0.45 * Math.exp(-i * 1.2)));
    }
    return { pts, rad, level, len };
  };
  const stand = (L, parent, at) => { L.parent = parent; L.at = at; L.sway = [0.02, 0.05, 0.12, 0.3][L.level]; limbs.push(L); return L; };
  // the trunk: level as a pier, a slow wander, out of the wall to the fork: a great bole where it leaves the masonry
  // (half as thick again at the wall's face, easing to the trunk's own girth over its first 14 m), tapering to the fork
  const trunk = { pts: [], rad: [], level: 0, len: zFork + 3 }, nT = 14, wy = rng.range(0, TAU), wx = rng.range(0, TAU);
  for (let i = 0; i <= nT; i++) { const f = i / nT, z = -3 + (zFork + 3) * f; trunk.pts.push([sx * 0.7 * Math.sin(wx + f * 5.1) * f, 0.5 * Math.sin(wy + f * 4.3) * f, z]); trunk.rad.push(lerp(r0, r1, Math.pow(f, 0.7)) * (1 + 0.5 * Math.exp(-Math.max(0, z) / 6))); }
  trunk.sway = 0; limbs.push(trunk);
  const tip = trunk.pts[nT];
  // the crown: five great limbs fanned from the fork, out and up and one down
  const mains = [];
  const fan = [[-0.95, 0.42], [-0.42, 0.72], [0.1, 0.18], [0.5, 0.6], [1.0, 0.3], [0.2, -0.38]];
  for (const [fx, fy] of fan) {
    const a = fx * 0.95 + rng.range(-0.12, 0.12), e = fy + rng.range(-0.1, 0.1), len = (reach - zFork) * rng.range(0.82, 1.08) / Math.max(0.55, Math.cos(a));
    mains.push(stand(limb(tip, [sx * Math.sin(a), Math.sin(e), Math.cos(a) * Math.cos(e)], Math.min(len, 52), r1 * 0.62, 0.22, rng.range(0.05, 0.2), 1, 8, wander()), trunk, nT));
  }
  // limbs along the trunk, from 30 m out (its first length is a bare walkway from the door to the table: the bole,
  // the roots, the snags and the tea set alone): stubs and a few long ones, to both sides and upward
  for (let k = 0; k < 8; k++) {
    const f = rng.range(0.4, 0.9), i = Math.min(nT - 1, Math.floor(f * nT)), p = trunk.pts[i], side = k % 2 ? 1 : -1, long = rng.chance(0.4), lenLong = rng.range(14, 26), lenStub = rng.range(4, 9), len = long ? lenLong : lenStub, up = rng.range(0.15, 0.9), out = rng.range(0.1, 0.6);
    mains.push(stand(limb([p[0], p[1], p[2]], [sx * side * Math.cos(up), Math.sin(up), out], len, trunk.rad[i] * 0.42, 0.14, rng.range(0.02, 0.22), 1, 6, wander()), trunk, i));
  }
  // branches off the limbs, and twigs off the branches
  const child = (parent, level, count, l0, l1, g = rng) => {
    const outL = [];
    for (let k = 0; k < count; k++) {
      const f = g.range(0.3, 0.97), yaw = g.range(-1.2, 1.2), up = g.range(-0.35, 0.8), len = g.range(l0, l1), bow = g.range(-0.05, 0.2), k3 = wander(g);
      const i = Math.min(parent.pts.length - 2, Math.floor(f * (parent.pts.length - 1))), p = parent.pts[i], q = parent.pts[i + 1];
      let dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2]; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      const c = Math.cos(yaw), s = Math.sin(yaw), hx = dx * c + dz * s, hz = -dx * s + dz * c;
      outL.push(stand(limb([p[0], p[1], p[2]], [hx * Math.cos(up), dy * 0.5 + Math.sin(up), hz * Math.cos(up)], len, parent.rad[i] * 0.6, level === 2 ? 0.09 : 0.045, bow, level, level === 2 ? 5 : 3, k3), parent, i));
    }
    return outL;
  };
  if (Y) await Y();
  const branches = []; let n = 0;
  for (const mLimb of mains) { for (const b of child(mLimb, 2, 4, 6, 15)) branches.push(b); if (Y && ++n % 3 === 0) await Y(); }
  for (const b of branches) { child(b, 3, 3, 2, 5.5); if (Y && ++n % 6 === 0) await Y(); }
  // THE CROWN'S SECOND TIER (a stream of its own: o.crown): seven more great limbs fanned from the fork between the
  // first six, five long branches on each of them, three more long branches on every limb of the first tier, and two
  // twigs on each of those branches: the crown is a spread of boughs that is seen as a tree's across the gulf
  const cr = o.crown || rng, mains2 = [], branches2 = [];
  for (const [fx, fy] of [[-0.7, 0.08], [-0.68, 0.95], [-0.15, 0.48], [0.3, 1.0], [0.78, 0.02], [0.75, 0.9], [-0.3, -0.28]]) {
    const a = fx * 0.95 + cr.range(-0.12, 0.12), e = fy + cr.range(-0.1, 0.1), len = (reach - zFork) * cr.range(0.82, 1.08) / Math.max(0.55, Math.cos(a)), bow = cr.range(0.05, 0.2), k3 = wander(cr);
    mains2.push(stand(limb(tip, [sx * Math.sin(a), Math.sin(e), Math.cos(a) * Math.cos(e)], Math.min(len, 52), r1 * 0.56, 0.22, bow, 1, 8, k3), trunk, nT));
  }
  if (Y) await Y();
  for (const m2 of mains2) { for (const b of child(m2, 2, 5, 8, 20, cr)) branches2.push(b); if (Y && ++n % 3 === 0) await Y(); }
  for (const m1 of mains) { for (const b of child(m1, 2, 3, 10, 22, cr)) branches2.push(b); if (Y && ++n % 3 === 0) await Y(); }
  for (const b of branches2) { child(b, 3, 2, 2.5, 6, cr); if (Y && ++n % 6 === 0) await Y(); }
  // THE TRUNK'S SNAGS: twelve broken stumps of old boughs along the trunk, on its flanks (rising a little) and its
  // underside, each by the trunk's own shape and never dealt: 2.5 to 8.5 m long, ending in a splintered point; a long
  // one forks. They stand between a place 10 m past the table (12 m out from the wall where no table is set) and a
  // place 10 m short of the fork: the walkway from the door to the table is bare, and the table is seen alone on it.
  limbs.stubs = [];
  for (let k = 0; k < 12; k++) {
    const z = lerp(o.tTable !== undefined ? o.tTable + 10 : 12, zFork - 10, (k + 0.2 + 0.6 * h1(k * 7.3 + zFork)) / 12), tt = trunkAt(trunk, z), phi = (h1(k * 3.1 + zFork * 2) - 0.5) * 4.2, len = 2.5 + 6 * h1(k * 5.7 + reach) ** 2, lean = (h1(k * 2.3 + 1) - 0.5) * 0.9;
    const d = [Math.sin(phi), -Math.cos(phi) + 0.6 * Math.abs(Math.sin(phi)), lean], dl = Math.hypot(d[0], d[1], d[2]), at = (m) => [tt.x + d[0] / dl * m, tt.y + d[1] / dl * m, z + d[2] / dl * m];
    const r = Math.min(tt.r * 0.34, 0.3 + len * 0.09);
    limbs.stubs.push({ pts: [at(tt.r * 0.7), at(tt.r + len * 0.5), at(tt.r + len * 0.92), at(tt.r + len)], rad: [r * 1.3, r, r * 0.72, 0.04], level: 1, sway: 0 });
    if (len > 5) {
      const m0 = at(tt.r + len * 0.5), sg = lean < 0 ? 1 : -1, pr = (j) => [m0[0] + d[0] / dl * 0.6 * j, m0[1] + (d[1] / dl * 0.6 + 0.7) * j, m0[2] + (d[2] / dl * 0.6 + 0.5 * sg) * j], pl = len * 0.42;
      limbs.stubs.push({ pts: [m0, pr(pl * 0.5), pr(pl)], rad: [r * 0.6, r * 0.45, 0.04], level: 2, sway: 0 });
    }
  }
  // THE TEA SET'S OWN AIR (after every draw, so that no limb's draw or place in the list moves): no limb, branch or
  // twig comes into the box of the table, the two chairs and the blown cloth, with a hand's breadth of air. A limb is
  // broken off before the place where its thickness and its give would enter that air; one left with less than two
  // points, and one whose own bough is gone or broken off before it, is marked gone: it keeps its place in the list,
  // and is neither drawn nor perched on. (A snag of the trunk that would enter that air is left out the same way.)
  if (o.tTable !== undefined) {
    const tt = trunkAt(trunk, o.tTable), deck = tt.y + tt.r * (1 - FLAT), bx = tt.x, bz = o.tTable, AIR = 0.1;
    const boxNear = (x, y, z) => Math.hypot(Math.max(0, Math.abs(x - bx) - TEA_BOX[0]), Math.max(0, deck - y, y - (deck + TEA_BOX[1])), Math.max(0, Math.abs(z - bz) - TEA_BOX[2]));
    for (const L of limbs) {
      if (L.level === 0) continue;
      const par = L.parent;
      if (par && par.level > 0 && (par.gone || L.at > par.pts.length - 1)) { L.gone = true; continue; }
      let keep = L.pts.length;
      for (let i = 0; i < L.pts.length && keep === L.pts.length; i++) {
        const p = L.pts[i], q = L.pts[Math.max(0, i - 1)], r = Math.max(L.rad[i], L.rad[Math.max(0, i - 1)]) + L.sway + AIR;
        if (boxNear((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2) > Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) / 2 + r) continue;
        const n = Math.max(1, Math.ceil(Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) / 0.1));
        for (let k = 0; k <= n; k++) { const f = k / n; if (boxNear(lerp(p[0], q[0], f), lerp(p[1], q[1], f), lerp(p[2], q[2], f)) < r) { keep = i - 1; break; } }
      }
      if (keep < 2) { L.gone = true; continue; }
      if (keep < L.pts.length) { L.pts.length = keep; L.rad.length = keep; L.broken = true; L.rad[keep - 1] = Math.max(L.rad[keep - 1], L.rad[0] * 0.35); }
    }
    limbs.stubs = limbs.stubs.filter((sb) => { for (let i = 0; i < sb.pts.length - 1; i++) for (let k = 0; k <= 8; k++) { const f = k / 8; if (boxNear(lerp(sb.pts[i][0], sb.pts[i + 1][0], f), lerp(sb.pts[i][1], sb.pts[i + 1][1], f), lerp(sb.pts[i][2], sb.pts[i + 1][2], f)) < Math.max(sb.rad[i], sb.rad[i + 1]) + AIR) return false; } return true; });
  }
  return limbs;
}
// the tea set's box about the table's foot on the trunk's walkway: half its breadth across the trunk, its height, half its
// length along the trunk (at a common table's measures the table and its cloth, hem blown out, 1.25 m; the chairs' backs
// 1.55 m; the chairs' heads 1.68 m: each times the set's scale)
// THE TEA SET'S SIZE: a common table's own (the table 1.7 m across under its cloth, the chairs' backs 1.7 m tall):
// TEA_SCALE is 1; its cloth carries the colour by which it is seen (a white top, a skirt of red)
export const TEA_SCALE = 1, TEA_BOX = [1.25 * TEA_SCALE, 1.68 * TEA_SCALE, 1.55 * TEA_SCALE];
// an accumulator seen through a scale about a place: every point laid into it is moved out from (ox, oy, oz) by k
const scaledAcc = (A, ox, oy, oz, k) => {
  const q = (p) => [ox + (p[0] - ox) * k, oy + (p[1] - oy) * k, oz + (p[2] - oz) * k];
  const S = {
    get c() { return A.c; }, set c(v) { A.c = v; }, get k() { return A.k; }, set k(v) { A.k = v; },
    col: (c, f) => { A.col(c, f); return S; }, kind: (a, b, c, d) => { A.kind(a, b, c, d); return S; },
    v: (x, y, z, nx, ny, nz, u, v) => A.v(ox + (x - ox) * k, oy + (y - oy) * k, oz + (z - oz) * k, nx, ny, nz, u * k, v * k),
    tri: (a, b, c) => A.tri(q(a), q(b), q(c)), quad: (a, b, c, d) => { const qa = q(a), qc = q(c); A.tri(qa, q(b), qc); A.tri(qa, qc, q(d)); },
  };
  return S;
};
const scaledCloth = (A, ox, oy, oz, k) => {
  const q = (p) => [ox + (p[0] - ox) * k, oy + (p[1] - oy) * k, oz + (p[2] - oz) * k], g = (d) => [d[0] * k, d[1] * k, d[2] * k];
  const S = { get c() { return A.c; }, set c(v) { A.c = v; }, v: (p, w, d) => A.v(q(p), w, g(d)), quad: (a, b, c, d, wa, wb, wc, wd, dir) => A.quad(q(a), q(b), q(c), q(d), wa, wb, wc, wd, g(dir)) };
  return S;
};

// ---------------------------------------------------------------- cloth: the tea cloth, the flag rags, the washing
// attributes: position, color, aWave = (direction of the give x, y, z, weight: 0 at the fixed edge to 1 at the free one)
// (the give is laid in the cloth's own frame and turned with its object; the cloth's sphere holds its blown shape)
export function makeClothMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 aWave; uniform float uTime; varying vec3 vW; varying vec3 vCol;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.);
  float ph = wp.x*.9+wp.z*.7+wp.y*.4, w = aWave.w;
  float g = .5+.5*sin(uTime*2.3+ph)+.35*sin(uTime*5.1+ph*2.3)+.25*sin(uTime*.7+ph*.3);
  wp.xyz += mat3(modelMatrix)*aWave.xyz*w*g+vec3(0., 1., 0.)*w*w*.12*sin(uTime*3.7+ph*1.7);
  vW = wp.xyz; vCol = color;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
    fragmentShader: /* glsl */`
varying vec3 vW; varying vec3 vCol;
${GLSL_COMMON}
${GLSL_LIGHT}
void main(){
  vec3 N = cross(dFdx(vW), dFdy(vW)), V = normalize(cameraPosition-vW); N /= max(length(N), 1e-12);
  if (dot(N, V) < 0.) N = -N;
  float sh = shadowAt(vW+N*.3);
  // cloth takes the light on its face and lets some of it through from behind
  float ndl = dot(N, uSunDir), lit = max(ndl, 0.)+.6*max(-ndl, 0.);
  // (in a great shadow the mass that throws it hides half the sky too)
  vec3 amb = mix(uGndCol, uSkyCol, N.y*.5+.5)*mix(.6, 1.15, sh);
  gl_FragColor = vec4(fogged(vCol*(uSunCol*lit*sh+amb), vW), 1.);
}` });
}
// a small accumulator for cloth: quads of a hanging sheet
export function makeClothAcc() {
  const P = [], C = [], Wv = [];
  const A = { c: [1, 1, 1] };
  A.v = (p, w, d) => { P.push(p[0], p[1], p[2]); C.push(A.c[0], A.c[1], A.c[2]); Wv.push(d[0], d[1], d[2], w); };
  A.quad = (a, b, c, d, wa, wb, wc, wd, dir) => { A.v(a, wa, dir); A.v(b, wb, dir); A.v(c, wc, dir); A.v(a, wa, dir); A.v(c, wc, dir); A.v(d, wd, dir); };
  // a sheet hung from the edge a-b, falling h, in nu x nv quads, giving along dir (metres at its free edge)
  A.sheet = (a, b, h, nu, nv, dir, rag = null) => {
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const p = (u, v) => { const k = rag ? rag(u) : 1; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - h * v * k, lerp(a[2], b[2], u)]; };
      const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
      A.quad(p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1), v0, v0, v1, v1, dir);
    }
  };
  A.count = () => P.length / 3;
  A.toGeometry = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aWave', new THREE.Float32BufferAttribute(Wv, 4)); g.computeBoundingSphere(); let ex = 0; for (let i = 0; i < Wv.length; i += 4) ex = Math.max(ex, 1.6 * Math.hypot(Wv[i], Wv[i + 1], Wv[i + 2]) * Wv[i + 3] + 0.12 * Wv[i + 3] * Wv[i + 3]); g.boundingSphere.radius += ex; return g; };
  return A;
}

// THE ORDER THE BIRDS ARE DRAWN IN (no draw is taken): the owls first, then the rooks of the tree, the finger, the
// quadrangle and the roofs woven together by each one's place within its own kind, so that the first share of the list
// holds that same share of every kind. A lower detail draws the owls whole and the first share of the rooks.
export function birdDrawOrder(list, detail = 1) {
  const owls = list.filter((b) => b.kind === 2), rest = list.filter((b) => b.kind !== 2), cnt = {}, at = {};
  for (const b of rest) cnt[b.on] = (cnt[b.on] || 0) + 1;
  const keyed = rest.map((b, i) => { at[b.on] = (at[b.on] || 0) + 1; return [(at[b.on] - 0.5) / cnt[b.on], i, b]; });
  keyed.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return { list: [...owls, ...keyed.map((k) => k[2])], count: owls.length + Math.min(rest.length, Math.max(1, Math.floor(rest.length * detail))) };
}
// ---------------------------------------------------------------- birds: rooks that sit and fly their loops, the flock that lifts, the owls
// each bird: { home [x,y,z], kind (0 a loop from its perch and back on the world's clock; 1 sits until the flock's lift,
// then flies whole loops from its perch and lands; 2 an owl: a long round from its sill and back on the world's clock),
// R, H, yaw, period, phase, share (of its time on the perch), size, tint }
export function makeBirds(list, U, shadow = null) {
  const base = [], wing = [];
  const tri = (a, b, c, wa = 0, wb = 0, wc = 0) => { base.push(...a, ...b, ...c); wing.push(wa, wb, wc); };
  const nose = [0, 0, 0.3], tail = [0, 0, -0.26], top = [0, 0.07, 0.02], bot = [0, -0.06, 0.02], l = [-0.075, 0, 0.02], r = [0.075, 0, 0.02];
  tri(nose, top, r); tri(nose, l, top); tri(nose, r, bot); tri(nose, bot, l); tri(tail, r, top); tri(tail, top, l); tri(tail, bot, r); tri(tail, l, bot);
  tri([0, 0.01, -0.2], [0.1, 0, -0.46], [-0.1, 0, -0.46]);
  for (const s of [-1, 1]) {
    const a = [s * 0.07, 0.01, 0.13], b = [s * 0.07, 0.01, -0.1], c = [s * 0.32, 0.01, -0.13], d = [s * 0.32, 0.01, 0.15], e = [s * 0.56, 0.01, -0.04];
    tri(a, b, c, s, s, s); tri(a, c, d, s, s, s); tri(d, c, e, s, s, s);
  }
  const g = new THREE.InstancedBufferGeometry(), n = list.length;
  g.setAttribute('position', new THREE.Float32BufferAttribute(base, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1));
  const home = new Float32Array(n * 3), orb = new Float32Array(n * 4), ph = new Float32Array(n * 4), tint = new Float32Array(n * 3);
  list.forEach((b, i) => {
    home.set(b.home, i * 3); orb.set([b.R, b.H, b.yaw, b.period], i * 4); ph.set([b.phase, b.share, b.size, b.kind], i * 4); tint.set(b.tint, i * 3);
  });
  g.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 3)); g.setAttribute('aOrb', new THREE.InstancedBufferAttribute(orb, 4));
  g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
  g.instanceCount = n;
  // (shadow: the same birds laid as their own shadows on the field's flags: every point of a bird carried down the
  // key light's ray to the flags' level, drawn where it falls on the field and the key light reaches the flags;
  // a standing bird's shadow lies at its feet, a flying bird's fades as it climbs)
  const uniforms = { ...U, uLift: { value: 0 }, uLiftPh: { value: 0 }, uShY: { value: shadow ? shadow.y : 0 }, uShW: { value: new THREE.Vector2(shadow ? shadow.W[0] : 1, shadow ? shadow.W[1] : 0) },
    uShT: { value: new THREE.Vector2(shadow ? shadow.T[0] : 0, shadow ? shadow.T[1] : 1) }, uShBox: { value: new THREE.Vector4(...(shadow ? shadow.box : [0, 0, 0, 0])) }, uShA: { value: shadow ? shadow.alpha : 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms, side: THREE.DoubleSide, defines: shadow ? { SHADOW: 1 } : {}, transparent: !!shadow, depthWrite: !shadow, polygonOffset: !!shadow, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`
attribute float aWing; attribute vec3 aHome; attribute vec4 aOrb; attribute vec4 aPh; attribute vec3 aTint;
uniform float uTime, uLift, uLiftPh, uShY; uniform vec3 uSunDir; varying vec3 vW; varying vec3 vCol; varying float vHgt;
float easeEnds(float Q, float e){
  float t = clamp(Q/e, 0., 1.), u = clamp((1.-Q)/e, 0., 1.);
  float F = Q < e ? e*(t*t*t-.5*t*t*t*t) : (Q < 1.-e ? Q-.5*e : (1.-e)-e*(u*u*u-.5*u*u*u*u));
  return F/(1.-e);
}
void main(){
  float kind = aPh.w, size = aPh.z, tw = 6.2832, period = aOrb.w;
  float cy = cos(aOrb.z), sy = sin(aOrb.z);
  // (a perched bird faces the way its loop leaves the perch and comes back to it: its heading never jumps)
  vec3 d = vec3(sy, 0., -cy), pp = vec3(cy, 0., sy), pos = aHome, fwd = pp;
  float open = 0., flap = 0.;
  {
    // a loop that leaves the perch and comes back to it: a circle through the perch, lifted in its far half. Every bird
    // flies its round on the world's clock, over and over (a rook from its ridge or its limb, an owl from its window).
    // T: the flight's seconds, tf: seconds into it. The rooks that lift together (uLift 1 on a visit whose flock lifts)
    // fly on the flock's own round of 44 s: each leaves after a delay of its own and flies whole loops
    float T = 1., tf = -1., loops = 1.;
    if (kind > .5 && kind < 1.5) {
      float tl = fract(uTime/44.+uLiftPh)*44., delay = fract(aPh.x*7.31+.37)*5.;
      loops = max(1., floor((30.8-delay)/period)); T = loops*period; tf = uLift > .5 ? tl-delay : -1.;
    } else {
      float share = aPh.y, p = fract(uTime/period+aPh.x); T = period*(1.-share); tf = (p-share)*period;
      // (an owl comes in to its sill facing the wall and turns round on it while it sits, to face the way it will leave)
      if (kind > 1.5) { float th = 3.14159265*smoothstep(.2, .8, share > 0. ? clamp(p/share, 0., 1.) : 0.); fwd = -d*cos(th)+pp*sin(th); }
    }
    if (tf > 0. && tf < T) {
      // (the place eases at both ends of the flight; the wings open over the first third of a second and fold over the last)
      float Q = tf/T, a = easeEnds(Q, min(.3, .5/T))*loops*tw, hh = sin(a*.5); hh *= hh;
      // (an owl's round is a long leaf: it leaves its sill straight out of the wall and comes back straight in)
      float owl = step(1.5, kind), sa = sin(a);
      pos += d*(aOrb.x*.5*(1.-cos(a)))+pp*(aOrb.x*.5*sa*mix(1., hh, owl))+vec3(0., aOrb.y*hh, 0.);
      vec3 tg = d*sa+pp*mix(cos(a), cos(a)*hh+.5*sa*sa, owl)+vec3(0., aOrb.y/max(aOrb.x, 1.)*sa, 0.);
      fwd = length(tg) > 1e-4 ? normalize(tg) : d*(a < 3.14159265 ? 1. : -1.);
      open = smoothstep(0., .35, tf)*(1.-smoothstep(T-.35, T, tf));
      // quick beats as it leaves, slow wide ones as it comes in to land (the beat's own clock is the flight's, so it
      // never races); an owl's are slow all the way
      float s8 = clamp((Q-.8)/.2, 0., 1.);
      flap = kind > 1.5 ? 4.2*tf : 9.*tf-3.5*T*.2*(s8*s8*s8-.5*s8*s8*s8*s8);
    }
  }
  vec3 rt = normalize(cross(fwd, vec3(0., 1., 0.))), up = cross(rt, fwd);
  // the wing: a hinge at the shoulder; folded on the perch
  float span = abs(position.x)-.07, ang = mix(-1.25, sin(flap+aPh.x*40.)*.85+.15, open), fold = mix(.4, 1., open);
  vec3 lp = position;
  if (abs(aWing) > .5) { lp.x = aWing*(.07+span*fold*cos(ang)); lp.y = position.y+span*fold*sin(ang); }
  // on the perch a bird stands up (its head high, its tail down) and bobs
  { float st = .6*(1.-open), cs = cos(st), sn = sin(st); lp.yz = vec2(lp.y*cs+lp.z*sn, lp.z*cs-lp.y*sn); }
  lp.y += (1.-open)*(.22+.02*sin(uTime*1.3+aPh.x*60.));
  vec3 wp = pos+(rt*lp.x+up*lp.y+fwd*lp.z)*size;
#ifdef SHADOW
  float hgt = max(wp.y-uShY, 0.); wp.xz -= uSunDir.xz*(hgt/max(uSunDir.y, .05)); wp.y = uShY+.03; vHgt = hgt;
#else
  vHgt = 0.;
#endif
  vW = wp; vCol = aTint;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`,
    fragmentShader: /* glsl */`
varying vec3 vW; varying vec3 vCol; varying float vHgt;
${GLSL_COMMON}
${GLSL_LIGHT}
uniform float uShY, uShA; uniform vec2 uShW, uShT; uniform vec4 uShBox;
void main(){
#ifdef SHADOW
  vec2 wt = vec2(dot(vW.xz, uShW), dot(vW.xz, uShT));
  if (wt.x < uShBox.x || wt.x > uShBox.y || wt.y < uShBox.z || wt.y > uShBox.w) discard;
  // (a shadow lies where its bird stands: one thrown from the wing is lost in the long light as the bird climbs,
  // and is gone by 4 m over the flags)
  gl_FragColor = vec4(fogged(vec3(.2, .17, .15)*uSkyCol, vW), uShA*shadowAt(vW+vec3(0., .4, 0.))*(1.-smoothstep(.8, 4., vHgt)));
  return;
#endif
  vec3 N = cross(dFdx(vW), dFdy(vW)), V = normalize(cameraPosition-vW); N /= max(length(N), 1e-12);
  if (dot(N, V) < 0.) N = -N;
  vec3 amb = mix(uGndCol, uSkyCol, N.y*.5+.5);
  // (a black bird is seen by its sheen: the key light glances off its back and its wings, the sky off its edges)
  vec3 col = vCol*(uSunCol*max(dot(N, uSunDir), 0.)+amb*1.2)+uSkyCol*.12*pow(1.-clamp(dot(N, V), 0., 1.), 3.)+uSunCol*(.05*pow(max(dot(N, normalize(uSunDir+V)), 0.), 6.)+.012*max(dot(N, uSunDir), 0.));
  gl_FragColor = vec4(fogged(col, vW), 1.);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'birds';
  return { mesh, uniforms, count: n, triangles: n * (base.length / 9) };
}

// ---------------------------------------------------------------- THE HERO: the tree in the wall
// the hero's frame: origin at the middle of the tree's root on the wall's face, z out of the wall, y up from the trunk's axis.
// opts.plan (the visit's plan) gives the tree's measures, its limbs as dealt and the hand (mir); alone, the tree stands by its defaults.
export function heroMeasures(P) {
  if (!P) return { sx: -1, tTable: 27, tFork: 83, reach: 118, r0: M.TRUNK_R0, r1: M.TRUNK_R1, doorX: 11, doorWide: 6, doorTall: 10.5, top: 68, base: -126, half: 42, seed: 1 };
  const t = P.tree, blk = P.massB.find((b) => b.isTree), sx = -P.mir;
  return { sx, tTable: t.tTable, tFork: t.tFork, reach: t.reach, r0: t.r0, r1: t.r1, doorX: sx * t.doorW, doorWide: t.doorWide, doorTall: t.doorTall, top: blk.eave - M.TREE_Y, base: blk.base - M.TREE_Y, half: 42, seed: P.seed };
}
// the trunk's middle and radius at a distance z out of the wall
function trunkAt(trunk, z) {
  const p = trunk.pts; let i = 0; while (i < p.length - 2 && p[i + 1][2] < z) i++;
  const f = clamp((z - p[i][2]) / (p[i + 1][2] - p[i][2]), 0, 1);
  return { x: lerp(p[i][0], p[i + 1][0], f), y: lerp(p[i][1], p[i + 1][1], f), r: lerp(trunk.rad[i], trunk.rad[i + 1], f) };
}
const FLAT = 0.3;
function heroWallInto(A, H) {
  const { half, base, top, doorX, doorWide, doorTall, r0 } = H, sill = r0 * (1 - FLAT), hx0 = doorX - doorWide / 2, hx1 = doorX + doorWide / 2, hy0 = sill, hy1 = sill + doorTall, sh = hy1 - 3.2;
  const lo = Math.min(hx0, hx1), hi = Math.max(hx0, hx1);
  // the face: a sheer cliff of masonry, few windows, old ivy; the door's opening left out of it
  A.col(PAL.stone, 0.92).kind(KIND.MASON, 11.18, 0.3, 1);
  const face = (x0, x1, y0, y1) => quadOut(A, [x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], 0, 0, 1);
  face(-half, lo, base, top); face(hi, half, base, top); face(lo, hi, base, hy0); face(lo, hi, hy1, top);
  triOut(A, [lo, sh, 0], [lo, hy1, 0], [doorX, hy1, 0], 0, 0, 1); triOut(A, [hi, sh, 0], [hi, hy1, 0], [doorX, hy1, 0], 0, 0, 1);
  // shallow buttresses up the face and string courses across it (none where the door and the tree are)
  A.col(PAL.stone, 0.85).kind(KIND.MASON, 0, 0.15, 1);
  for (let x = -half + 7; x < half; x += 14) if (Math.abs(x - doorX) > doorWide / 2 + 3 && Math.abs(x) > 6) boxInto(A, x, 0.7, 0, 1.3, 0.7, base, top - 5, { top: true });
  for (const y of [base + 40, base + 78, 26, 48]) if (y < top - 4) { boxInto(A, (-half + lo - 1.5) / 2, 0.35, 0, (lo - 1.5 + half) / 2, 0.35, y, y + 0.8, { top: true }); boxInto(A, (half + hi + 1.5) / 2, 0.35, 0, (half - hi - 1.5) / 2, 0.35, y, y + 0.8, { top: true }); }
  // the parapet's merlons
  merlonsInto(A, -half, -0.7, half, -0.7, top, 2.2, 2.2, 1.2, 1.8);
  // AN OLD LEDGE ACROSS THE FACE, 17 m under the tree: a walk on worn brackets, broken away in two places, weeds and
  // small bushes rooted along it and at the feet of the string courses (each by the wall's own measures, never dealt)
  {
    const ly = -17, sdn = H.seed || 1;
    for (let k = 0; k < 7; k++) {
      const x0 = -half + 2 + (2 * half - 4) * k / 7, x1 = -half + 2 + (2 * half - 4) * (k + 1) / 7;
      if (k === 2 || k === 5) continue;
      A.col(PAL.stoneWarm, 0.9).kind(KIND.MASON, 0, 0.35, 1); boxInto(A, (x0 + x1) / 2, 0.9, 0, (x1 - x0) / 2 - 0.2 * h1(k + sdn), 0.9, ly - 0.6, ly, { top: true });
      A.col(PAL.stone, 0.8).kind(KIND.MASON, 0, 0, 1);
      for (let x = x0 + 1.2; x < x1 - 0.8; x += 2.8) boxInto(A, x, 0.6, 0, 0.3, 0.6, ly - 2, ly - 0.6);
    }
    for (let k = 0; k < 46; k++) {
      const onLedge = k < 30, x = -half + 3 + (2 * half - 6) * h1(k * 3.7 + 0.3), seg = Math.floor((x + half - 2) / ((2 * half - 4) / 7));
      const y = onLedge ? ly : [26.8, 48.8, 26.8, 48.8][k % 4], z = onLedge ? 0.4 + 1.2 * h1(k * 5.1) : 0.35, r = 0.35 + 0.6 * h1(k * 7.9), hh = 0.6 + 1.5 * h1(k * 2.3 + 1) * (onLedge ? 1 : 0.6);
      if (onLedge && (seg === 2 || seg === 5)) continue;
      if (!onLedge && (y > top - 5 || (Math.abs(x - doorX) < doorWide / 2 + 3))) continue;
      A.col([0.09 + 0.05 * h1(k), 0.11 + 0.05 * h1(k + 1), 0.045]).kind(KIND.PLAIN);
      coneInto(A, x, z, r, y, y + hh, 5, [0.3 * (h1(k * 1.3) - 0.5), 0.2]);
      if (h1(k * 9.1) < 0.5) coneInto(A, x + r * 0.9, z + 0.1, r * 0.7, y, y + hh * 0.7, 4, [0.2, 0.1]);
    }
  }
  // the wall's own head and returns for the 13 m behind its face (the painted room stands in that depth; the castle's
  // block begins behind it)
  A.col(PAL.lead).kind(KIND.FLAGS, 0, 0, 1); quadOut(A, [-half, top, -13.2], [half, top, -13.2], [half, top, 0], [-half, top, 0], 0, 1, 0);
  A.col(PAL.stone, 0.9).kind(KIND.MASON, 0, 0.2, 1);
  quadOut(A, [-half, base, -13.2], [-half, base, 0], [-half, top, 0], [-half, top, -13.2], -1, 0, 0); quadOut(A, [half, base, -13.2], [half, base, 0], [half, top, 0], [half, top, -13.2], 1, 0, 0);
  // the door: pale jambs and a pointed arch standing a little proud; its reveals lit by the room
  A.col(PAL.stoneWarm, 1.25).kind(KIND.PLAIN);
  for (const x of [lo - 0.55, hi + 0.55]) boxInto(A, x, 0.3, 0, 0.55, 0.3, hy0 - 0.4, sh, { top: true });
  for (const [xa, xb] of [[lo, doorX], [hi, doorX]]) {
    const o = xa < xb ? -1 : 1;
    quadOut(A, [xa + o * 1.1, sh - 0.4, 0.3], [xa, sh, 0.3], [xb, hy1, 0.3], [xb, hy1 + 1.3, 0.3], 0, 0, 1);
    quadOut(A, [xa + o * 1.1, sh - 0.4, 0], [xa + o * 1.1, sh - 0.4, 0.3], [xb, hy1 + 1.3, 0.3], [xb, hy1 + 1.3, 0], o, 1, 0);
  }
  A.col([0.26, 0.16, 0.07]).kind(KIND.GLOW);
  quadOut(A, [lo, hy0, 0], [lo, sh, 0], [lo, sh, -1.8], [lo, hy0, -1.8], 1, 0, 0); quadOut(A, [hi, hy0, 0], [hi, sh, 0], [hi, sh, -1.8], [hi, hy0, -1.8], -1, 0, 0);
  quadOut(A, [lo, sh, 0], [doorX, hy1, 0], [doorX, hy1, -1.8], [lo, sh, -1.8], 1, -1, 0); quadOut(A, [hi, sh, 0], [doorX, hy1, 0], [doorX, hy1, -1.8], [hi, sh, -1.8], -1, -1, 0);
  quadOut(A, [lo, hy0, 0], [hi, hy0, 0], [hi, hy0, -1.8], [lo, hy0, -1.8], 0, 1, 0);
  // the room behind the door, painted all over with roots
  const rx0 = doorX - 7.5, rx1 = doorX + 7.5, ry1 = hy0 + 12, rz = -12;
  A.col([1, 1, 1]).kind(KIND.PAINT);
  quadOut(A, [rx0, hy0, rz], [rx1, hy0, rz], [rx1, ry1, rz], [rx0, ry1, rz], 0, 0, 1);
  quadOut(A, [rx0, hy0, rz], [rx0, hy0, -1.8], [rx0, ry1, -1.8], [rx0, ry1, rz], 1, 0, 0); quadOut(A, [rx1, hy0, rz], [rx1, hy0, -1.8], [rx1, ry1, -1.8], [rx1, ry1, rz], -1, 0, 0);
  quadOut(A, [rx0, ry1, rz], [rx1, ry1, rz], [rx1, ry1, -1.8], [rx0, ry1, -1.8], 0, -1, 0);
  A.col([0.3, 0.2, 0.11]).kind(KIND.GLOW);
  quadOut(A, [rx0, hy0, rz], [rx1, hy0, rz], [rx1, hy0, -1.8], [rx0, hy0, -1.8], 0, 1, 0);
  // the ledge from the door's sill to the trunk's walkway, on worn brackets
  A.col(PAL.stoneWarm, 0.95).kind(KIND.MASON, 0, 0, 1);
  const lx0 = Math.min(doorX, 0), lx1 = Math.max(doorX, 0) ;
  boxInto(A, (lx0 + lx1) / 2 + Math.sign(doorX) * 1.5, 1.3, 0, (lx1 - lx0) / 2 + 1.5, 1.3, hy0 - 0.7, hy0, { top: true });
  for (let x = lx0 + 1.5; x < lx1; x += 2.6) boxInto(A, x + Math.sign(doorX) * 1.5, 0.9, 0, 0.35, 0.9, hy0 - 2.2, hy0 - 0.7);
}

// the table set for tea, out on the walkway (TABLE_T from the door's wall): a round table under a white cloth with a red skirt, two tall chairs with
// red cushions, a blue pot, two cups on gilt saucers, a cake
function teaInto(A0, CA0, x, y, z, sx) {
  // (laid at a common table's measures and seen through the set's own scale about the table's foot)
  const A = scaledAcc(A0, x, y, z, TEA_SCALE), CA = scaledCloth(CA0, x, y, z, TEA_SCALE);
  const dark = col3('#3b2a20'), china = col3('#e9e4d8'), blue = col3('#2f5fa8');
  A.col(dark).kind(KIND.PLAIN);
  drumInto(A, x, z, 0.09, 0.09, y, y + 0.74, 6); drumInto(A, x, z, 0.4, 0.1, y, y + 0.08, 8);
  A.col(china, 0.5); drumInto(A, x, z, 0.86, 0.86, y + 0.74, y + 0.78, 16, { top: true });
  // the two chairs, tall-backed, one toward the wall and one toward the drop
  for (const s of [-1, 1]) {
    const cz = z + s * 1.3;
    A.col(dark).kind(KIND.PLAIN);
    boxInto(A, x, cz, 0, 0.26, 0.24, y + 0.44, y + 0.5, { top: true });
    for (const lx of [-0.22, 0.22]) for (const lz of [-0.2, 0.2]) boxInto(A, x + lx, cz + lz, 0, 0.03, 0.03, y, y + 0.44);
    for (const lx of [-0.22, 0.22]) boxInto(A, x + lx, cz + s * 0.21, 0, 0.04, 0.04, y + 0.5, y + 1.62, { top: true });
    for (const yy of [0.74, 0.98, 1.22]) boxInto(A, x, cz + s * 0.21, 0, 0.22, 0.02, y + yy, y + yy + 0.13, { top: true });
    boxInto(A, x, cz + s * 0.21, 0, 0.27, 0.035, y + 1.5, y + 1.68, { top: true });
    A.col(col3('#b3262a')); boxInto(A, x, cz, 0, 0.23, 0.21, y + 0.5, y + 0.56, { top: true });
  }
  // the tea things
  const ty = y + 0.8;
  A.col(blue).kind(KIND.PLAIN); drumInto(A, x - sx * 0.12, z + 0.05, 0.15, 0.18, ty, ty + 0.13, 8); drumInto(A, x - sx * 0.12, z + 0.05, 0.18, 0.1, ty + 0.13, ty + 0.27, 8, { top: true });
  tubeInto(A, [[x - sx * 0.12 + 0.13, ty + 0.08, z + 0.05], [x - sx * 0.12 + 0.24, ty + 0.13, z + 0.05], [x - sx * 0.12 + 0.29, ty + 0.2, z + 0.05]], [0.03, 0.022, 0.016], 5);
  A.col(china, 0.85);
  for (const [dx, dz] of [[0.28, -0.42], [-0.3, 0.44]]) { A.col(col3('#d9a53a')); drumInto(A, x + dx, z + dz, 0.13, 0.13, ty, ty + 0.012, 8, { top: true }); A.col(china, 0.85); drumInto(A, x + dx, z + dz, 0.035, 0.055, ty + 0.012, ty + 0.075, 7); }
  A.col(col3('#c98a3a')); drumInto(A, x + sx * 0.36, z - 0.08, 0.14, 0.13, ty + 0.05, ty + 0.14, 9, { top: true });
  A.col(china, 0.85); drumInto(A, x + sx * 0.36, z - 0.08, 0.19, 0.19, ty + 0.035, ty + 0.05, 9, { top: true }); drumInto(A, x + sx * 0.36, z - 0.08, 0.05, 0.03, ty, ty + 0.035, 6);
  // the cloth: its top lies still, its skirt hangs half a metre and lifts in the wind
  const white = [0.97, 0.96, 0.93], red = [0.86, 0.08, 0.06];
  CA.c = white;
  const n = 22, R = 0.9, top = y + 0.79;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), z0 = [0, 0, 0];
    CA.c = white; CA.v([x, top, z], 0, z0); CA.v([x + R * c0, top, z + R * s0], 0, z0); CA.v([x + R * c1, top, z + R * s1], 0, z0);
    for (let j = 0; j < 3; j++) {
      CA.c = j === 0 ? white : red;
      const v0 = j / 3, v1 = (j + 1) / 3, r0 = R + 0.1 * v0, r1 = R + 0.1 * v1, dir = [(c0 + c1) * 0.16 + sx * 0.12, 0.08, (s0 + s1) * 0.16 + 0.06];
      CA.quad([x + r0 * c0, top - 0.64 * v0, z + r0 * s0], [x + r0 * c1, top - 0.64 * v0, z + r0 * s1], [x + r1 * c1, top - 0.64 * v1, z + r1 * s1], [x + r1 * c0, top - 0.64 * v1, z + r1 * s0], v0, v0, v1, v1, dir);
    }
  }
}
export async function buildHero(ctx, opts = {}) {
  const P = opts.plan || null, H = P ? P.heroM : heroMeasures(P), U = opts.U || makeLightUniforms(), alone = !P;
  const rng = makeRng(hashSeed('tree:alone')), rk = makeRng(hashSeed('rooks:alone'));
  const object = new THREE.Group(); object.name = 'tree-in-the-wall';
  const A = makeAcc(106496), CA = makeClothAcc();
  if (opts.wall !== false) heroWallInto(A, H);
  if (ctx && ctx.yield) await ctx.yield();
  // the tree: every limb a tube of pale wood; the trunk's top flattened to a walkway
  const limbs = P ? P.treeLimbs : await treeLimbs(rng, { zFork: H.tFork, reach: H.reach, r0: H.r0, r1: H.r1, sx: H.sx, tTable: H.tTable }, ctx && ctx.yield ? () => ctx.yield() : null);
  A.col(PAL.pale);
  for (let i = 0; i < limbs.length; i++) {
    const Lb = limbs[i];
    A.kind(KIND.PALE, 0, 0, 1);
    if (!Lb.gone) tubeInto(A, Lb.pts, Lb.rad, [14, 9, 6, 4][Lb.level], { flat: Lb.level === 0 ? FLAT : 0, sway: Lb.level === 0 ? [0, 0] : [Lb.sway * 0.2, Lb.sway] });
    if (i % 2 === 1 && ctx && ctx.yield) await ctx.yield();
  }
  const trunk = limbs[0], tt = trunkAt(trunk, H.tTable), deck = tt.y + tt.r * (1 - FLAT);
  A.kind(KIND.PALE, 0, 0, 1);
  for (const sb of limbs.stubs || []) tubeInto(A, sb.pts, sb.rad, 7, {});
  const breathe = async () => { if (ctx && ctx.yield) await ctx.yield(); };
  await breathe();
  // THE ROOT IN THE MASONRY: ten great roots leave the bole where it comes out of the wall and grip the wall's face in a
  // fan, each winding away along it and sinking into the stone before its end, the longer ones forked; none on the
  // door's side between the ledge and the door's head. ROUND THE BOLE THE WALL IS BROKEN: its blocks heaved out of
  // their courses and tipped, cracks running out between the roots, and below it the dark stain of the wet that
  // runs off the wood, with ivy rooted in it. (All by the tree's own measures: nothing here is dealt.)
  if (opts.wall !== false) {
    const ds = Math.sign(H.doorX) || 1, rb = trunk.rad[1], sill = H.r0 * (1 - FLAT), sd0 = H.reach + H.tFork * 0.37;
    const nearDoor = (x, y) => Math.hypot(Math.max(0, Math.abs(x - H.doorX) - H.doorWide / 2 - 1), Math.max(0, sill - 1.2 - y, y - (sill + H.doorTall + 1.6)));
    for (const [deg, k] of [[-34, 0], [-4, 1], [30, 2], [62, 3], [98, 4], [128, 5], [222, 6], [252, 7], [282, 8], [318, 9]]) {
      const th = (deg + 12 * (h1(k * 3.3 + sd0) - 0.5)) * DEG, dx = -ds * Math.cos(th), dy = Math.sin(th), len = 10 + 12 * h1(k * 6.1 + sd0), rr = 1.5 + 0.9 * h1(k * 4.7 + sd0), bend = (h1(k * 8.9 + 2) - 0.5) * 0.5, wv = 0.6 + 0.8 * h1(k * 2.9 + 4), ph = h1(k * 5.3 + 1) * TAU;
      const pts = [], rad = [];
      for (let i = 0; i <= 10; i++) { const f = i / 10, m = rb * 0.6 + (rb * 0.4 + len) * f, w = bend * len * f * f + wv * Math.sin(f * 6.5 + ph) * f; pts.push([dx * m - dy * w, dy * m + dx * w, lerp(2.4, -0.9, Math.pow(f, 0.7))]); rad.push(lerp(rr * 1.25, 0.32, Math.pow(f, 0.6))); }
      A.col(PAL.pale).kind(KIND.PALE, 0, 0, 1);
      tubeInto(A, pts, rad, 8, {});
      if (len > 15) {
        const i0 = 4, p0 = pts[i0], sg = h1(k * 7.7) < 0.5 ? 1 : -1, fl = len * 0.42, fp = [], fr = [];
        for (let i = 0; i <= 5; i++) { const f = i / 5; fp.push([p0[0] + (dx * 0.6 - dy * sg * 0.8) * fl * f, p0[1] + (dy * 0.6 + dx * sg * 0.8) * fl * f, lerp(p0[2], -0.6, Math.pow(f, 0.6))]); fr.push(lerp(rad[i0] * 0.62, 0.22, Math.pow(f, 0.7))); }
        tubeInto(A, fp, fr, 6, {});
      }
      if (k % 3 === 2) await breathe();
    }
    await breathe();
    // the heaved blocks: a ring of them round the bole, each tipped out of the face on its own lean
    for (let k = 0; k < 34; k++) {
      const th = (k + 0.5 * h1(k * 1.7 + sd0)) / 34 * TAU, m = rb + 0.4 + 2.6 * h1(k * 3.9 + sd0) ** 2, cx = Math.cos(th) * m, cy = Math.sin(th) * m;
      if (nearDoor(cx, cy) < 1.2 || (Math.abs(cy - sill + 0.35) < 1.5 && cx * ds > 0)) continue;
      const hu = 0.55 + 0.5 * h1(k * 5.3), hv = 0.3 + 0.22 * h1(k * 2.1), hw = 0.3 + 0.4 * h1(k * 8.3), out = 0.1 + 0.55 * h1(k * 6.7 + 2), tip = (0.1 + 0.3 * h1(k * 4.1)) * (h1(k * 9.9) < 0.5 ? 1 : -1), spin = (h1(k * 7.1) - 0.5) * 0.5;
      const cu = Math.cos(spin), su = Math.sin(spin), ct = Math.cos(tip), st = Math.sin(tip);
      const u = [cu * hu, su * hu, 0], v = [-su * ct * hv, cu * ct * hv, st * hv], w = [su * st * hw, -cu * st * hw, ct * hw];
      A.col(PAL.stone, 0.78 + 0.3 * h1(k * 1.9)).kind(KIND.MASON, 0, 0, 1);
      blockInto(A, [cx, cy, out], u, v, w);
    }
    await breathe();
    // the stain and the ivy: a sheet of the same masonry a hand's breadth proud of the face, darkened where the wet runs
    // down from the bole (a long streak that widens and fades by 50 m down) and round the bole itself, its ivy thick
    // under the bole and thinning away; at its own edges it is the face's colour and the face's ivy
    {
      const x0 = -28, x1 = 28, y0 = -56, y1 = 18, st2 = 2, base = mul3(PAL.stone, 0.92), dk = [0.2, 0.2, 0.19];
      const wAt = (x, y) => {
        const r = Math.hypot(x, y), edge = clamp(Math.min(x - x0, x1 - x, y - y0, y1 - y) / 6, 0, 1) * smoothstep(0.6, 4, nearDoor(x, y));
        const streak = y < 0 ? Math.exp(-(((x + 1.5 * Math.sin(y * 0.11)) / (4.5 + 0.14 * -y)) ** 2)) * (1 - smoothstep(26, 52, -y)) * (0.7 + 0.3 * Math.sin(x * 1.7 + y * 0.3)) : 0;
        const ring = Math.exp(-(((r - rb) / 3.2) ** 2)) * 0.55, ivy = (Math.exp(-(((r - rb - 3) / 5) ** 2)) * (y < 3 ? 1 : 0.35) + 0.5 * streak) * edge;
        return [clamp(Math.max(streak, ring), 0, 1) * edge, ivy];
      };
      const vert = (x, y) => { const [sw, iv] = wAt(x, y); A.col(mix3(base, mul3(dk, 0.92 * 0.5), sw * 0.85)).kind(KIND.MASON, 11.18, 0.3 + 0.55 * iv, 1); A.v(x, y, 0.12, 0, 0, 1, x, y); };
      for (let x = x0; x < x1; x += st2) { if ((x - x0) % 8 === 6) await breathe(); for (let y = y0; y < y1; y += st2) {
        const mx = x + st2 / 2, my = y + st2 / 2;
        if (Math.hypot(mx, my) < rb - 1.5 || nearDoor(mx, my) < 0.4 || (Math.abs(my - sill + 0.35) < 1.4 && mx * ds > -1 && mx * ds < Math.abs(H.doorX) + 4)) continue;
        vert(x, y); vert(x + st2, y); vert(x + st2, y + st2); vert(x, y); vert(x + st2, y + st2); vert(x, y + st2);
      } }
    }
    await breathe();
    // the cracks: eleven of them run out from the bole between the roots, each a dark jagged seam that thins to nothing
    A.col([0.016, 0.016, 0.02]).kind(KIND.PLAIN);
    for (let k = 0; k < 11; k++) {
      const th = (k + 0.25 + 0.5 * h1(k * 2.7 + sd0)) / 11 * TAU, len = 7 + 15 * h1(k * 6.3 + sd0), n = 7; let a = th, px = Math.cos(th) * (rb + 0.2), py = Math.sin(th) * (rb + 0.2);
      for (let i = 0; i < n; i++) {
        const f0 = i / n, f1 = (i + 1) / n, w0 = lerp(0.2, 0.02, f0), w1 = lerp(0.2, 0.02, f1); a += (h1(k * 11.3 + i * 3.1) - 0.5) * 0.9;
        const qx = px + Math.cos(a) * len / n, qy = py + Math.sin(a) * len / n, nx = -Math.sin(a), ny = Math.cos(a);
        if (nearDoor(qx, qy) < 1.5 || nearDoor(px, py) < 1.5) break;
        quadOut(A, [px - nx * w0, py - ny * w0, 0.17], [px + nx * w0, py + ny * w0, 0.17], [qx + nx * w1, qy + ny * w1, 0.17], [qx - nx * w1, qy - ny * w1, 0.17], 0, 0, 1);
        px = qx; py = qy;
      }
    }
  }
  // THE TREE'S SHADOW: its trunk in three lengths and its four greatest boughs in two lengths each stop the sun for the
  // wall, the roofs and the tree's own limbs behind them (the stone's shader reads them as round pieces)
  {
    const toW = P ? P.heroToWorld : (x, y, z) => [x, y, z], pieces = [], piece = (Lb, i, j) => pieces.push({ a: toW(Lb.pts[i][0], Lb.pts[i][1], Lb.pts[i][2]), ra: Lb.rad[i], b: toW(Lb.pts[j][0], Lb.pts[j][1], Lb.pts[j][2]), rb: Lb.rad[j] });
    const nT = trunk.pts.length - 1; piece(trunk, 1, 5); piece(trunk, 5, 10); piece(trunk, 10, nT);
    const boughs = limbs.filter((Lb) => Lb.level === 1 && Lb.parent === trunk && Lb.at === nT && !Lb.gone && Lb.pts.length >= 5).sort((a, b) => b.rad[0] * b.len - a.rad[0] * a.len).slice(0, 4);
    for (const Lb of boughs) { const m = Math.floor((Lb.pts.length - 1) / 2); piece(Lb, 0, m); piece(Lb, m, Lb.pts.length - 1); }
    setTreeShade(U, pieces);
  }
  if (ctx && ctx.yield) await ctx.yield();
  teaInto(A, CA, tt.x, deck, H.tTable, H.sx);
  if (ctx && ctx.yield) await ctx.yield();
  // perches for the rooks: places on the limbs, drawn; the world (or this hero alone) seats the birds
  const perches = [];
  for (let k = 0; k < (alone ? 60 : 0); k++) {
    const li = 1 + Math.floor(rk() * (limbs.length - 1)), f = rk.range(0.25, 1), yaw = rk.range(0, TAU), R = rk.range(9, 22), Hh = rk.range(1.5, 7), period = rk.range(11, 26), phase = rk(), share = rk.range(0.5, 0.82);
    const Lb = limbs[li], i = Math.min(Lb.pts.length - 1, Math.round(f * (Lb.pts.length - 1))), p = Lb.pts[i];
    if (Lb.level > 2 || Lb.gone) continue;
    perches.push({ p: [p[0], p[1] + Lb.rad[i] + 0.02, p[2]], yaw, R, H: Hh, period, phase, share });
  }
  const geo = A.toGeometry();
  await breathe();
  const mesh = new THREE.Mesh(geo, opts.mat || makeStoneMaterial(U)); mesh.name = 'tree-wall'; object.add(mesh);
  await breathe();
  const cloth = new THREE.Mesh(CA.toGeometry(), opts.clothMat || makeClothMaterial(U)); cloth.name = 'tea-cloth'; object.add(cloth);
  let birds = null;
  if (alone) {
    birds = makeBirds(perches.map((q) => ({ home: q.p, kind: 0, R: q.R, H: q.H, yaw: q.yaw, period: q.period, phase: q.phase, share: q.share, size: 1.7, tint: [0.035, 0.035, 0.045] })), U);
    object.add(birds.mesh);
  }
  return {
    object, radius: 70, height: 70, center: new THREE.Vector3(0, 6, H.tTable * 0.7), ground: false,
    anchors: { table: new THREE.Vector3(tt.x, deck + 0.8 * TEA_SCALE, H.tTable), door: new THREE.Vector3(H.doorX, H.r0 * (1 - FLAT) + 4, 0), perches, limbs, deck, measures: H },
    U, triangles: A.triangles() + CA.count() / 3,
    update(dt, time) { if (alone) U.uTime.value = time; },
    dispose() {},
  };
}

// ---------------------------------------------------------------- THE MAKERS OF THE ROOFSCAPE (the world assembles the castle with them by rule)
// the solids of a tower: its own shaft and the smaller towers that stand on it (the mesh and every test of nearness
// but the fliers' read this one list; the fliers' test, roundThrough, reads the head as built, towerBuilt, beside it)
// MENDING 2, R11 (its words brought to capInto's by mending 4, M8): THE SOLID OF A BROKEN HEAD IS A ROUND ABOUT THE
// SHAFT: a stump's the shaft's girth up to its highest tooth; a lead cap's 1.14 of the radius, up to its patch; a cut
// cone's the room the whole cone took. A stump and a lead cap stand inside that round; A CONE'S EAVE, CUT OR WHOLE,
// DOES NOT (its rafters stand on toward the point they met at; its slates begin 0.06 of the radius outside that
// girth and come inside it a twentieth of the cone's height up, as every whole cone's do: a wider solid for it would
// leave out a tower of the keep's second mass on seed 34 and move the flags' stream there, so it is as every
// cone's). The head AS BUILT is towerBuilt's, which the fliers' test reads
const headGirth = (hd, k0) => (hd && hd.kind === 2 ? Math.max(k0, 1.14) : k0);
export function towerSolids(t) {
  const hd = t.cap === 1 ? t.head : null, k0 = t.round && t.cap !== 4 ? 1.1 : 1.3;
  const out = [{ x: t.x, z: t.z, r: t.r * headGirth(hd, k0), y0: t.base, y1: t.top + (hd && hd.kind === 0 ? stumpHigh(t.r, hd) : hd && hd.kind === 2 ? 0.65 : capRoom(t.cap, t.r)) }];
  for (const s of t.subs || []) if (s.on < 0.6) {
    const rr = s.k * t.r, d = t.r * 0.92, hs = s.cap === 1 ? s.head : null;
    out.push({ x: t.x + Math.sin(s.a) * d, z: t.z - Math.cos(s.a) * d, r: rr * headGirth(hs, 1.1), y0: t.top - s.down - 3, y1: t.top + s.up + (hs && hs.kind === 0 ? stumpHigh(rr, hs) : hs && hs.kind === 2 ? 0.65 : rr * 2.2), sub: s });
  }
  return out;
}
// how high a crown stands over its shaft's top: a cone 2.1 radii, corbelled turrets under a low cone 1.5, a saddle
// roof 1.3, merlons or a broken rim 3 m
const capRoom = (cap, r) => (cap === 1 ? r * 2.1 : cap === 4 ? r * 1.5 : cap === 3 ? r * 1.3 : 3);
// a broken top: the shaft's last storeys as a ragged shell with an inside, open to the sky
export function ruinInto(A, cx, cz, r, y0, y1, sides, rag, thick = 0.9) {
  const ri = Math.max(0.3, r - thick);
  for (let i = 0; i < sides; i++) {
    const t0 = i / sides * TAU, t1 = (i + 1) / sides * TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1), ya = y1 + rag(t0), yb = y1 + rag(t1), u0 = t0 * r, u1 = t1 * r;
    const o0 = [cx + r * s0, cz - r * c0], o1 = [cx + r * s1, cz - r * c1], i0 = [cx + ri * s0, cz - ri * c0], i1 = [cx + ri * s1, cz - ri * c1];
    // the outside
    A.v(o0[0], y0, o0[1], s0, 0, -c0, u0, y0); A.v(o1[0], yb, o1[1], s1, 0, -c1, u1, yb); A.v(o1[0], y0, o1[1], s1, 0, -c1, u1, y0);
    A.v(o0[0], y0, o0[1], s0, 0, -c0, u0, y0); A.v(o0[0], ya, o0[1], s0, 0, -c0, u0, ya); A.v(o1[0], yb, o1[1], s1, 0, -c1, u1, yb);
    // the inside (it faces the middle)
    A.v(i0[0], y0, i0[1], -s0, 0, c0, u0, y0); A.v(i1[0], y0, i1[1], -s1, 0, c1, u1, y0); A.v(i1[0], yb, i1[1], -s1, 0, c1, u1, yb);
    A.v(i0[0], y0, i0[1], -s0, 0, c0, u0, y0); A.v(i1[0], yb, i1[1], -s1, 0, c1, u1, yb); A.v(i0[0], ya, i0[1], -s0, 0, c0, u0, ya);
    // the broken rim between them
    quadOut(A, [o0[0], ya, o0[1]], [o1[0], yb, o1[1]], [i1[0], yb, i1[1]], [i0[0], ya, i0[1]], 0, 1, 0);
  }
  for (let i = 0; i < sides; i++) { const t0 = i / sides * TAU, t1 = (i + 1) / sides * TAU; triOut(A, [cx, y0, cz], [cx + ri * Math.sin(t0), y0, cz - ri * Math.cos(t0)], [cx + ri * Math.sin(t1), y0, cz - ri * Math.cos(t1)], 0, 1, 0); }
}
// MENDING 2, S2: A BROKEN HEAD IS A RUIN, NEVER ONE SLANTED PLANE ACROSS THE DRUM, by one law for every broken head
// (a tower's broken top, a keep tower's stump): AN UNEVEN RING OF STANDING TEETH of the wall's own thickness. Every
// length of the shell between two of its corners stands to its own height and is level on top (masonry breaks
// along its beds), with an upright broken end where two neighbours differ; the heights go round the ring by two
// and three swells and each length's own hash (no single slope), the highest standing at the head's full height.
// Inside, the wall is in the shaft's shade and THE DARK OF THE SHAFT lies under it; on a near head A FALLEN STONE
// OR TWO lie on the lowest teeth, within the wall's thickness and under the highest tooth.
// MENDING 3, M4: THE RING FOLLOWS ITS SHAFT'S OWN PLAN: on a round shaft the lengths stand on the drum's own
// corners (teethInto); on a square one on the box's four walls, the same heights taken along the square's round
// (teethSquareInto: until then a round ring of 1.12 of the radius stood on the box, its teeth 0.23 of the radius
// outside the faces' middles and its dark floor in the air). The teeth's foot is the wall's top; the inside wall
// and the dark lie inside the shaft's stone and never under a smaller tower's corbelled foot.
// (ruinTeeth: how far under the highest tooth each of n lengths stands, 0 to 1)
const ruinTeeth = (n, sd) => {
  const p1 = h1(sd + 3) * TAU, p2 = h1(sd * 1.7 + 11) * TAU, q = []; let lo = 1;
  for (let i = 0; i < n; i++) { const th = (i + 0.5) / n * TAU, v = clamp(0.45 + 0.27 * Math.sin(2 * th + p1) + 0.18 * Math.sin(3 * th + p2) + 0.6 * (h1(sd * 2.3 + i * 5.7 + n) - 0.5), 0, 1); q.push(v); lo = Math.min(lo, v); }
  return q.map((v) => v - lo);
};
// (MENDING 3, M4: yLow, where it is given: the foot of the stone that holds the head (a smaller tower's drum over
// its corbelled foot): the inside wall and the dark of the shaft go no lower than it)
export function teethInto(A, cx, cz, r, y0, tops, thick, stones = false, yLow = -1e9) {
  const n = tops.length, ri = Math.max(0.3, r - thick), c = A.c, k = A.k, dim = mul3(c, 0.42), yd = Math.min(y0, Math.max(y0 - Math.min(3, r * 0.5), yLow));
  for (let i = 0; i < n; i++) {
    const t0 = i / n * TAU, t1 = (i + 1) / n * TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1), y = tops[i], yn = tops[(i + 1) % n], u0 = t0 * r, u1 = t1 * r;
    const o0 = [cx + r * s0, cz - r * c0], o1 = [cx + r * s1, cz - r * c1], i0 = [cx + ri * s0, cz - ri * c0], i1 = [cx + ri * s1, cz - ri * c1];
    A.c = c;
    A.v(o0[0], y0, o0[1], s0, 0, -c0, u0, y0); A.v(o1[0], y, o1[1], s1, 0, -c1, u1, y); A.v(o1[0], y0, o1[1], s1, 0, -c1, u1, y0);
    A.v(o0[0], y0, o0[1], s0, 0, -c0, u0, y0); A.v(o0[0], y, o0[1], s0, 0, -c0, u0, y); A.v(o1[0], y, o1[1], s1, 0, -c1, u1, y);
    quadOut(A, [o0[0], y, o0[1]], [o1[0], y, o1[1]], [i1[0], y, i1[1]], [i0[0], y, i0[1]], 0, 1, 0);
    // (the upright broken end between this length and the next: it faces the lower of the two)
    if (Math.abs(y - yn) > 0.02) { const sg = y > yn ? 1 : -1; quadOut(A, [o1[0], Math.min(y, yn), o1[1]], [o1[0], Math.max(y, yn), o1[1]], [i1[0], Math.max(y, yn), i1[1]], [i1[0], Math.min(y, yn), i1[1]], sg * c1, 0, sg * s1); }
    // (the inside: it faces the middle, in the shaft's shade, down to the dark)
    A.c = dim;
    A.v(i0[0], yd, i0[1], -s0, 0, c0, u0, yd); A.v(i1[0], yd, i1[1], -s1, 0, c1, u1, yd); A.v(i1[0], y, i1[1], -s1, 0, c1, u1, y);
    A.v(i0[0], yd, i0[1], -s0, 0, c0, u0, yd); A.v(i1[0], y, i1[1], -s1, 0, c1, u1, y); A.v(i0[0], y, i0[1], -s0, 0, c0, u0, y);
  }
  if (stones) {
    // (the fallen stones: squared blocks of the wall's own stone, each lying aslant on a low tooth)
    const hi = Math.max(...tops), ord = tops.map((y, i) => i).sort((a, b) => tops[a] - tops[b]), sz = Math.min(thick, 1.1) * 0.5, rm = (r + ri) / 2 * Math.cos(Math.PI / n);
    for (const [j, f] of [[0, 1], [2, 0.8]]) {
      const i = ord[j], th = (i + 0.5) / n * TAU, sn = Math.sin(th), cs = -Math.cos(th), s2 = sz * f, tl = 0.3 + 0.25 * j;
      if (tops[i] + s2 * 1.3 > hi) continue;
      A.c = mul3(c, 1.08);
      blockInto(A, [cx + sn * rm, tops[i] + s2 * 0.52, cz + cs * rm], [-cs * s2 * 0.9, 0, sn * s2 * 0.9], [sn * Math.cos(tl) * s2 * 0.55, -Math.sin(tl) * s2 * 0.55, cs * Math.cos(tl) * s2 * 0.55], [sn * Math.sin(tl) * s2 * 0.42, Math.cos(tl) * s2 * 0.42, cs * Math.sin(tl) * s2 * 0.42]);
    }
  }
  // (the dark of the shaft)
  A.col([0.016, 0.014, 0.014]).kind(KIND.PLAIN);
  for (let i = 0; i < n; i++) { const t0 = i / n * TAU, t1 = (i + 1) / n * TAU; triOut(A, [cx, yd, cz], [cx + ri * Math.sin(t0), yd, cz - ri * Math.cos(t0)], [cx + ri * Math.sin(t1), yd, cz - ri * Math.cos(t1)], 0, 1, 0); }
  A.c = c; A.k = k;
}
// MENDING 3, M4: A BROKEN HEAD FOLLOWS ITS SHAFT'S OWN PLAN. THE SQUARE'S ROUND: n lengths about a square, each of
// its four walls holding a whole number of them (16: four a wall; 10: three, two, three, two; 8: two a wall), from
// the corner (-1, 1) of the square's own frame round by (1, 1). at(b, hb): where the place b (0 to n, whole at the
// lengths' ends) lies on the square of half-breadth hb, in the frame's own (across, along); face(i): the wall the
// length i stands on (0 to 3: its outward side (0, 1), (1, 0), (0, -1), (-1, 0))
const squareRound = (n) => {
  const kb = [0, 1, 2, 3, 4].map((j) => Math.round(j * n / 4)), C = [[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]];
  const face = (i) => (i < kb[1] ? 0 : i < kb[2] ? 1 : i < kb[3] ? 2 : 3);
  const at = (b, hb) => { const bb = ((b % n) + n) % n, j = face(Math.floor(bb)), f = (bb - kb[j]) / (kb[j + 1] - kb[j]); return [(C[j][0] + (C[j + 1][0] - C[j][0]) * f) * hb, (C[j][1] + (C[j + 1][1] - C[j][1]) * f) * hb]; };
  return { face, at };
};
const SQ_OUT = [[0, 1], [1, 0], [0, -1], [-1, 0]];
// THE RING OF STANDING TEETH ON A SQUARE SHAFT (a box of half-breadth hq turned by yaw): the same lengths, heights
// and thickness as the round ring's, each length standing ON ONE OF THE BOX'S FOUR WALLS, its outer face the wall's
// own face carried up; the inside wall and the dark of the shaft a smaller square inside the shaft's stone
export function teethSquareInto(A, cx, cz, yaw, hq, y0, tops, thick, stones = false) {
  const n = tops.length, hi = Math.max(0.3, hq - thick), c = A.c, k = A.k, dim = mul3(c, 0.42), yd = y0 - Math.min(3, hq * 0.5), F = frameOf(cx, cz, yaw), R = squareRound(n), cs = Math.cos(yaw), sn = Math.sin(yaw);
  const W = (b, hb, y) => { const q = R.at(b, hb); return F(q[0], y, q[1]); }, out = (j) => [SQ_OUT[j][0] * cs + SQ_OUT[j][1] * sn, SQ_OUT[j][0] * sn - SQ_OUT[j][1] * cs];
  for (let i = 0; i < n; i++) {
    const y = tops[i], yn = tops[(i + 1) % n], j = R.face(i), jn = R.face((i + 1) % n), [nx, nz] = out(j);
    A.c = c;
    quadOut(A, W(i, hq, y0), W(i + 1, hq, y0), W(i + 1, hq, y), W(i, hq, y), nx, 0, nz);
    quadOut(A, W(i, hq, y), W(i + 1, hq, y), W(i + 1, hi, y), W(i, hi, y), 0, 1, 0);
    // (the upright broken end between this length and the next, along the wall or across the corner: it faces the lower)
    if (Math.abs(y - yn) > 0.02) { const sg = y > yn ? 1 : -1, [mx, mz] = out(jn), tx = -nz - mz, tz = nx + mx; quadOut(A, W(i + 1, hq, Math.min(y, yn)), W(i + 1, hq, Math.max(y, yn)), W(i + 1, hi, Math.max(y, yn)), W(i + 1, hi, Math.min(y, yn)), sg * tx, 0, sg * tz); }
    // (the inside: it faces the middle, in the shaft's shade, down to the dark)
    A.c = dim;
    quadOut(A, W(i, hi, yd), W(i + 1, hi, yd), W(i + 1, hi, y), W(i, hi, y), -nx, 0, -nz);
  }
  if (stones) {
    // (the fallen stones, as the round ring's: each lying aslant on a low tooth, within the wall's thickness)
    const top = Math.max(...tops), ord = tops.map((y, i) => i).sort((a, b) => tops[a] - tops[b]), sz = Math.min(thick, 1.1) * 0.5;
    for (const [j, f] of [[0, 1], [2, 0.8]]) {
      const i = ord[j], [nx, nz] = out(R.face(i)), s2 = sz * f, tl = 0.3 + 0.25 * j, m = W(i + 0.5, (hq + hi) / 2, tops[i] + s2 * 0.52);
      if (tops[i] + s2 * 1.3 > top) continue;
      A.c = mul3(c, 1.08);
      blockInto(A, m, [-nz * s2 * 0.9, 0, nx * s2 * 0.9], [nx * Math.cos(tl) * s2 * 0.55, -Math.sin(tl) * s2 * 0.55, nz * Math.cos(tl) * s2 * 0.55], [nx * Math.sin(tl) * s2 * 0.42, Math.cos(tl) * s2 * 0.42, nz * Math.sin(tl) * s2 * 0.42]);
    }
  }
  // (the dark of the shaft)
  A.col([0.016, 0.014, 0.014]).kind(KIND.PLAIN);
  quadOut(A, F(-hi, yd, hi), F(hi, yd, hi), F(hi, yd, -hi), F(-hi, yd, -hi), 0, 1, 0);
  A.c = c; A.k = k;
}
// the head of a shaft: 0 a flat lead roof behind merlons on a corbel table (machicolated), 1 a worn cone of slate,
// 2 broken, 3 a saddle roof of slate between two stone gables (square towers), 4 four corbelled turrets at its
// quarters under a low cone or pyramid of slate
function capInto(A, x, z, r, top, cap, sides, o) {
  const { stone, slate, sd, lod, round, yaw } = o;
  if (cap === 3) {
    const hw = r * 0.89 + 0.25, wall = mul3(stone, 0.95);
    A.col(stone, 0.9).kind(KIND.MASON, 0, 0, 1); boxInto(A, x, z, yaw, hw, hw, top - 1.1, top, {});
    A.col(slate).kind(KIND.SLATE); gableInto(A, x, z, yaw, hw, hw, top, top + r * 1.1, 0.4, { c: wall, k: [KIND.MASON, 0, 0, 1] });
    return;
  }
  if (cap === 4) {
    const rc = r * 0.89;
    A.col(stone, 0.92).kind(KIND.MASON, 0, 0, 1);
    if (round) drumInto(A, x, z, r, r * 1.08, top - 1.2, top, sides); else boxInto(A, x, z, yaw, rc + 0.3, rc + 0.3, top - 1.2, top, {});
    for (let i = 0; i < 4; i++) {
      const a = yaw + Math.PI / 4 + i * Math.PI / 2, bx = x + Math.sin(a) * r, bz = z - Math.cos(a) * r, rr = r * 0.22;
      A.col(stone, 0.96).kind(KIND.MASON, 0, 0, 1);
      drumInto(A, bx, bz, rr * 0.3, rr, top - r * 0.55, top - r * 0.25, 6); drumInto(A, bx, bz, rr, rr, top - r * 0.25, top + r * 0.55, 6);
      A.col(slate).kind(KIND.SLATE); coneInto(A, bx, bz, rr * 1.2, top + r * 0.55, top + r, 6);
    }
    A.col(slate).kind(KIND.SLATE);
    if (round) coneInto(A, x, z, r * 1.12, top, top + r * (0.9 + 0.3 * h1(sd)), sides); else hipInto(A, x, z, yaw, rc + 0.4, rc + 0.4, top, top + r * 0.9, 1);
    return;
  }
  if (cap === 1) {
    A.col(stone, 0.9).kind(KIND.MASON, 0, 0, 1); drumInto(A, x, z, r, r * 1.1, top - 1.2, top, sides);
    const hc = r * (1.5 + 0.5 * h1(sd)), hd = o.head;
    if (!hd) { A.col(slate).kind(KIND.SLATE); coneInto(A, x, z, r * 1.16, top, top + hc, sides); return; }
    // MENDING 1, M5: A BROKEN OR UNCAPPED HEAD (o.head: the plan's). MENDING 2, R11: the plan's own solid for it
    // (towerSolids) is a round about the shaft: a stump's the shaft's girth (1.1 of the radius) up to its highest
    // tooth; a lead cap's 1.14 of the radius; a cut cone's the room the whole cone took. MENDING 3, T: a stump and
    // a lead cap stand inside that round; A CONE'S EAVE, CUT OR WHOLE, DOES NOT: its slates begin at 1.16 of the
    // radius, 0.06 of the radius outside the round, and come inside it a twentieth of the cone's height up. The
    // fliers' test since mending 3 asks the head as built (towerBuilt); every other test reads the round
    if (hd.kind === 0) {
      // (a stump: the cone is gone; the shaft's last course stands on as a broken shell of masonry, open to the
      // sky, 0.5 to 0.9 of its radius high at its highest tooth, ivy on it. MENDING 2, S2: a ring of standing
      // teeth, the lowest an eighth as high as the highest, by the broken heads' one law)
      const hS = stumpHigh(r, hd), tops = ruinTeeth(sides, sd + 31 * hd.ph).map((q) => top + hS * (1 - 0.88 * q));
      // (MENDING 3, M4: the course's own top, a tenth of the radius broad round the teeth's foot, is laid: the teeth
      // stand on stone, and nothing of the shaft's dark is seen between the course's edge and their foot)
      for (let i = 0; i < sides; i++) { const t0 = i / sides * TAU, t1 = (i + 1) / sides * TAU, s0 = Math.sin(t0), c0 = Math.cos(t0), s1 = Math.sin(t1), c1 = Math.cos(t1); quadOut(A, [x + r * 1.1 * s0, top, z - r * 1.1 * c0], [x + r * 1.1 * s1, top, z - r * 1.1 * c1], [x + r * s1, top, z - r * c1], [x + r * s0, top, z - r * c0], 0, 1, 0); }
      A.col(stone, 0.86).kind(KIND.MASON, 0, 0.3 + 0.3 * hd.a, 1); teethInto(A, x, z, r, top, tops, Math.max(0.5, r * 0.14), lod < 2, o.foot);
      return;
    }
    if (hd.kind === 1) {
      // (the cone's top third is gone: its slates end in a broken edge, the hole dark, and the bare rafters stand
      // on from the edge toward the point they met at, each broken at its own length)
      const yc = top + hc * (0.6 + 0.12 * hd.a), rc = r * 1.16 * (1 - (yc - top) / hc), nR = 7;
      A.col(slate).kind(KIND.SLATE); drumInto(A, x, z, r * 1.16, rc, top, yc, sides);
      A.col([0.016, 0.014, 0.014]).kind(KIND.PLAIN); drumInto(A, x, z, rc * 0.98, rc * 0.98, yc - 0.3, yc - 0.28, sides, { top: true });
      A.col([0.075, 0.06, 0.048]).kind(KIND.PLAIN);
      for (let i = 0; i < nR; i++) {
        const a = (i + hd.ph) / nR * TAU, f = 0.25 + 0.75 * h1(sd * 1.3 + i * 4.7 + hd.ph * 9), sn = Math.sin(a), cs = -Math.cos(a), ye = lerp(yc, top + hc, f), re = rc * (1 - f);
        tubeInto(A, [[x + sn * rc, yc - 0.2, z + cs * rc], [x + sn * re, ye, z + cs * re]], [0.034 * r, 0.024 * r], 3);
      }
      return;
    }
    // (a flat cap of patched lead: a low roll of lead on the head's own course, a patch of newer lead lapped on it)
    A.col(PAL.lead, 0.8).kind(KIND.FLAGS); drumInto(A, x, z, r * 1.14, r * 0.96, top, top + 0.55, sides, { top: true });
    { const a = hd.ph * TAU, px = x + Math.sin(a) * r * 0.3, pz = z - Math.cos(a) * r * 0.3; A.col(PAL.lead, 1.15).kind(KIND.FLAGS); boxInto(A, px, pz, a + hd.a, r * 0.42, r * 0.3, top + 0.5, top + 0.62, { top: true }); }
    return;
  }
  if (cap === 2) {
    // (MENDING 2, S2: the ring of standing teeth: the highest at the head's top, the lowest 0.15 of the break's
    // depth and more over the shaft's end)
    // (MENDING 3, M4: on a smaller tower the break goes no deeper than 0.85 of its own drum over the corbelled foot)
    const dp = subDeep(r, sd, o.foot === undefined ? Infinity : top - o.foot), tops = ruinTeeth(sides, sd).map((q) => top - dp * 0.85 * q);
    A.col(stone, 0.95).kind(KIND.MASON, 0, o.ivy * 0.6, 1);
    // (MENDING 3, M4: the ring follows the shaft's own plan: on a round shaft the drum's own corners; on a square
    // one the box's four walls (half-breadth 0.89 r), the same heights taken along the square's round; the inside
    // wall and the dark lie inside the shaft's stone, and on a smaller tower never under its corbelled foot)
    if (round) teethInto(A, x, z, r, top - dp, tops, ruinThick(r), lod < 2, o.foot); else teethSquareInto(A, x, z, yaw, r * 0.89, top - dp, tops, ruinThick(r), lod < 2);
    return;
  }
  A.col(stone, 0.92).kind(KIND.MASON, 0, 0, 1);
  if (round) {
    drumInto(A, x, z, r, r * 1.1, top - 1.4, top, sides); drumInto(A, x, z, r * 1.1, r * 1.1, top, top + 1.1, sides);
    A.col(PAL.lead).kind(KIND.FLAGS); drumInto(A, x, z, r * 1.1 - 0.5, r * 1.1 - 0.5, top + 0.2, top + 0.35, sides, { top: true });
    if (lod === 0) { A.col(stone, 0.92).kind(KIND.MASON, 0, 0, 1); const n = Math.max(5, Math.floor(TAU * r * 1.1 / 3.1)); for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU; boxInto(A, x + Math.sin(a) * (r * 1.1 - 0.4), z - Math.cos(a) * (r * 1.1 - 0.4), a + Math.PI / 2, 0.4, 0.8, top + 1.1, top + 2.5, { top: true }); } }
  } else {
    const hw = r * 0.89 + 0.5;
    boxInto(A, x, z, yaw, hw, hw, top - 1.2, top + 1.1, {});
    A.col(PAL.lead).kind(KIND.FLAGS); boxInto(A, x, z, yaw, hw - 0.5, hw - 0.5, top + 0.2, top + 0.35, { top: true });
    if (lod === 0) { A.col(stone, 0.92).kind(KIND.MASON, 0, 0, 1); const F = frameOf(x, z, yaw), e = hw - 0.45; for (const [a, b] of [[[-e, -e], [e, -e]], [[e, -e], [e, e]], [[e, e], [-e, e]], [[-e, e], [-e, -e]]]) { const pa = F(a[0], 0, a[1]), pb = F(b[0], 0, b[1]); merlonsInto(A, pa[0], pa[2], pb[0], pb[2], top + 1.1, 1.4, 1.5, 0.8, 1.4); } }
  }
}
const h1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// (a broken head has thickness and keeps its crown: a great tower's shell is a sixth of its radius thick, and its break
// goes no deeper than a small tower's would and a quarter of what its radius has over 9 m)
const ruinDeep = (r, sd) => Math.min(r, 9) * (0.8 + 0.8 * h1(sd + 4)) + Math.max(0, r - 9) * 0.25;
const ruinThick = (r) => Math.max(Math.min(1.2, r * 0.22), r * 0.16);
// (MENDING 3, M4: the break's depth on a smaller tower whose drum stands `room` high over its corbelled foot: the
// teeth's foot and the dark of the shaft stay in the drum, never under the foot)
const subDeep = (r, sd, room) => Math.min(ruinDeep(r, sd), 0.85 * room);
// (MENDING 2, R11: a stump's height over its shaft's top at its highest tooth)
const stumpHigh = (r, hd) => r * (0.5 + 0.4 * hd.a);
// WHERE A POLE STANDS ON A TOWER'S HEAD (the head as capInto lays it, near): a flat head's lead roof at its middle; a cone's
// tip; a broken head's rim at its highest place, in the middle of the shell's thickness. Returns [x, y, z] of the pole's foot.
export function headStand(t) {
  if (t.cap === 1) return [t.x, t.top + t.r * (1.5 + 0.5 * h1(t.sd)), t.z];
  if (t.cap === 3) return [t.x, t.top + t.r * 1.1 + 0.1, t.z];
  if (t.cap === 4) return [t.x, t.top + t.r * (t.round ? 0.9 + 0.3 * h1(t.sd) : 0.9), t.z];
  if (t.cap === 2) {
    // (MENDING 2, S2: the highest tooth of the ring as the tower's own fineness lays it, at its middle)
    // (MENDING 3, M4: on a square shaft the highest length of the square's round, at its middle, in the middle of the wall's thickness)
    const n = [16, 10, 8][towerLod(t)], q = ruinTeeth(n, t.sd), bi = q.indexOf(0);
    if (!t.round) { const hq = t.r * 0.89, m = squareRound(n).at(bi + 0.5, hq - Math.min(ruinThick(t.r), hq - 0.3) / 2); return frameOf(t.x, t.z, t.yaw)(m[0], t.top, m[1]); }
    const R = t.r, rad = (R - Math.min(ruinThick(t.r), R - 0.3) / 2) * Math.cos(Math.PI / n), th = (bi + 0.5) / n * TAU;
    return [t.x + Math.sin(th) * rad, t.top, t.z - Math.cos(th) * rad];
  }
  return [t.x, t.top + 0.35, t.z];
}
// how finely a tower is laid, BY ITS PART ALONE (0 fine: every tower of a place and of the inner ward; 1 the middle
// ward's; 2 the far heaps'). Every cone stands plumb on its tower (nothing of the castle leans but the finger), and a
// pole on it stands on that tip
export const towerLod = (t) => (t.part === 'far' ? 2 : t.part === 'mid' ? 1 : 0);
// a tower with the smaller towers that stand on it. lod 0 near (merlons, 16 sides), 1 middle, 2 far. dens scales its windows.
export function towerInto(A, t, lod = 0, dens = 1) {
  const sides = [16, 10, 8][lod], stone = mul3(mix3(PAL.stone, t.tone > 1 ? PAL.stoneWarm : PAL.stoneDark, Math.abs(t.tone - 1) * 3), t.tone), slate = mix3(PAL.slate, PAL.slateBlue, h1(t.sd + 9));
  const win = t.sd + clamp(t.win * dens, 0.02, 0.9), o = { stone, slate, sd: t.sd, lod, round: t.round, yaw: t.yaw, ivy: t.ivy, head: t.head || null };
  A.col(stone).kind(KIND.MASON, win, t.ivy, 1);
  // THE SHAFT HAS A BATTER: its foot stands a tenth wider than its head and leans in over its lowest third (a square
  // one by three parts in a hundred); two string courses of dressed stone stand out round a fine tower's shaft
  const yS = t.top - (t.cap === 2 ? ruinDeep(t.r, t.sd) : 1.2), yb = Math.min(yS - 2, t.base + Math.max(12, (yS - t.base) * 0.32)), hq = t.r * 0.89;
  if (t.round) { drumInto(A, t.x, t.z, t.r * 1.1, t.r * 1.02, t.base, yb, sides); drumInto(A, t.x, t.z, t.r * 1.02, t.r, yb, yS, sides); }
  else { boxInto(A, t.x, t.z, t.yaw, hq * 1.03, hq * 1.03, t.base, yb, { batter: 0.03 }); boxInto(A, t.x, t.z, t.yaw, hq, hq, yb, yS, {}); }
  if (lod === 0 && yS - yb > 14) {
    A.col(stone, 1.12).kind(KIND.MASON, 0, 0, 1);
    for (const f of [0.38, 0.74]) { const y = lerp(yb, yS, f); if (t.round) drumInto(A, t.x, t.z, t.r * 1.02 + 0.28, t.r * 1.02 + 0.28, y, y + 0.55, sides, { top: true }); else boxInto(A, t.x, t.z, t.yaw, hq + 0.28, hq + 0.28, y, y + 0.55, { top: true }); }
    A.col(stone).kind(KIND.MASON, win, t.ivy, 1);
  }
  if (t.stair) {
    // the spiral stair turret: a band of slits climbing round it
    A.col([1, 0.62, 0.24], 0.9).kind(KIND.GLOW);
    for (let k = 0; k < 14; k++) { const a = k * 0.9 + t.yaw, y = t.top - 4 - k * 2.6, rr = t.r * (1 + 0.07 * clamp((t.top - y) / Math.max(1, t.top - t.base), 0, 1)) + 0.03; boxInto(A, t.x + Math.sin(a) * rr, t.z - Math.cos(a) * rr, a, 0.16, 0.03, y, y + 1.3, {}); }
  }
  if (lod === 2) {
    // a far tower's lit rooms: six tall windows on its shaft by its own seed, each lit and put out with the hour's
    // share like every window (the far ward lies 700 m and more beyond the castle's places: a far wall's own
    // lancets are too small to be seen from any of them).
    // MENDING 4, M7: ON A BROKEN TOWER A PANE'S HEAD STAYS UNDER THE SHAFT'S END: its six windows stand between the
    // shaft's half height and 5.2 m under the end of the whole shaft (the windows are 5 m tall), none in the broken
    // head's teeth or in the air between them; a tower with a whole head keeps its windows where they were
    A.col([1, 0.6, 0.24], 0.85);
    const paneHi = t.cap === 2 ? Math.min(t.top - 8, yS - 5.2) : t.top - 8, paneLo = t.cap === 2 ? Math.min(t.base + (t.top - t.base) * 0.5, paneHi) : t.base + (t.top - t.base) * 0.5;
    for (let k = 0; k < 6; k++) {
      const f = h1(t.sd * 1.9 + k * 5.7), y = lerp(paneLo, paneHi, f), a = t.round ? h1(t.sd + k * 3.1) * TAU : t.yaw + Math.floor(h1(t.sd + k * 3.1) * 4) * Math.PI / 2;
      const off = t.round ? 0 : (h1(t.sd + k * 7.3) - 0.5) * t.r * 1.1, rr = (t.round ? t.r * lerp(1.07, 1, clamp((y - t.base) / Math.max(1, t.top - 1.2 - t.base), 0, 1)) : t.r * 0.89) + 0.2;
      const cx = t.x + Math.sin(a) * rr + Math.cos(a) * off, cz = t.z - Math.cos(a) * rr + Math.sin(a) * off, ux = Math.cos(a) * 1.3, uz = Math.sin(a) * 1.3;
      A.kind(KIND.PANE, h1(t.sd * 1.3 + k * 2.9), 0, 1);
      quadOut(A, [cx - ux, y, cz - uz], [cx + ux, y, cz + uz], [cx + ux, y + 5, cz + uz], [cx - ux, y + 5, cz - uz], Math.sin(a), 0, -Math.cos(a));
    }
  }
  capInto(A, t.x, t.z, t.r, t.top, t.cap, sides, o);
  const sol = towerSolids(t);
  for (let i = 1; i < sol.length; i++) {
    const q = sol[i], s = q.sub, rr = s.k * t.r, ss = Math.max(6, sides - 4), yt = t.top + s.up;
    A.col(stone, 0.96).kind(KIND.MASON, lod < 2 ? win + 3 : 0, t.ivy * 0.5, 1);
    drumInto(A, q.x, q.z, rr * 0.25, rr, t.top - s.down - 3, t.top - s.down, ss);
    drumInto(A, q.x, q.z, rr, rr, t.top - s.down, yt - (s.cap === 2 ? subDeep(rr, t.sd + i * 7, s.up + s.down) : 1.2), ss);
    capInto(A, q.x, q.z, rr, yt, s.cap, ss, { ...o, round: true, sd: t.sd + i * 7, lod: Math.max(1, lod), head: s.head || null, foot: t.top - s.down });
  }
}
const toneOf = (tone) => mul3(mix3(PAL.stone, tone > 1 ? PAL.stoneWarm : PAL.stoneDark, clamp(Math.abs(tone - 1) * 3, 0, 1)), tone);
// a roof's colour: the named masses and every roof of the gulf are slate (the gulf is the place of blue shade: no red
// roof lies in it); of the country's other roofs one in six is of tile, one in sixteen of green copper
const roofCol = (m) => { const rk = m.part || m.gulf ? 1 : h1(m.sd * 1.7 + 11); return rk < 0.17 ? mix3(PAL.tile, PAL.tileDark, m.blue) : rk < 0.23 ? PAL.verdigris : mix3(PAL.slate, PAL.slateBlue, m.blue); };
// a range: its walls from the base to the eaves and its roof (0 gabled, 1 hipped, 2 flat leads behind a parapet).
// lod 0 near (overhangs, gutters that hold the rain, merlons), 1 middle, 2 far. dens scales its windows.
const winOf = (m, dens) => m.sd + clamp(m.win * dens * (m.zone === 0 && !m.part && m.ridge < 52 ? 1.4 : 1), 0.02, 0.9);
// MENDING 3, M3: THE WALLS OF A MEMBER THAT KEEPS A BLIND BAND (m.blind, from the plan: the wall a lean-to stands
// against; each entry the two ends of a run on the wall's face and the height the band reaches). The four walls are
// the box's own, corner for corner. The face that holds the band is laid in pieces, every cut on a line between two
// of the WINDOWS' OWN BAYS (the shader's: 4.6 m along the wall, 6.4 m up it, set off by the member's own number), so
// that no window is cut by a piece's edge: the pieces the band touches, from the wall's foot to the first line
// between two rows of bays at or over the band's head, are laid with no windows (the same stone, the same courses,
// the same ivy and shade); every other piece keeps the wall's own. Every piece of the face ends on the same lines
// (no corner of one in the middle of another's side).
// MENDING 4, M6: THE TWO WALLS THAT MEET THE BANDED FACE AT ITS ENDS ARE CUT TO ITS CORNER: where the face is laid in
// two heights its end corners at the band's head stand on the neighbour walls' edges, so each neighbour is laid as
// three triangles that meet at that one corner (one more than its two; its far edge keeps its two corners, so
// that no corner is left in the middle of the fourth wall's edge): every corner meets a corner
function blindWallsInto(A, m, wallK) {
  const c = Math.cos(m.yaw), s = Math.sin(m.yaw), f = frameOf(m.x, m.z, m.yaw), sd = Math.floor(wallK[1]);
  const cor = [[1, -1], [1, 1], [-1, 1], [-1, -1]].map(([sx, sz]) => f(sx * m.hw, 0, sz * m.hl));
  const walls = [[0, 1, c, s], [3, 2, -c, -s], [2, 1, s, -c], [3, 0, -s, c]].map(([i, j, nx, nz]) => {
    const E0 = cor[i], E1 = cor[j], ax = nz, az = -nx, u0 = E0[0] * ax + E0[2] * az, u1 = E1[0] * ax + E1[2] * az, lo = Math.min(u0, u1), hi = Math.max(u0, u1);
    const at = (u, y) => (u === u0 ? [E0[0], y, E0[2]] : u === u1 ? [E1[0], y, E1[2]] : [E0[0] + (E1[0] - E0[0]) * (u - u0) / (u1 - u0), y, E0[2] + (E1[2] - E0[2]) * (u - u0) / (u1 - u0)]);
    const off = (q) => Math.abs((q[0] - E0[0]) * nx + (q[1] - E0[2]) * nz);
    let yT = m.base; const iv = [];
    for (const b of m.blind) if (off(b.a) < 0.05 && off(b.b) < 0.05) {
      const ua = b.a[0] * ax + b.a[1] * az, ub = b.b[0] * ax + b.b[1] * az;
      const a0 = Math.max(lo, (Math.floor(Math.min(ua, ub) / 4.6 + sd * 0.37) - sd * 0.37) * 4.6), a1 = Math.min(hi, (Math.ceil(Math.max(ua, ub) / 4.6 + sd * 0.37) - sd * 0.37) * 4.6);
      if (a1 - a0 > 0.01) { iv.push([a0, a1]); yT = Math.max(yT, (Math.ceil(b.y / 6.4 + sd * 0.11) - sd * 0.11) * 6.4); }
    }
    return { i, j, nx, nz, u0, u1, lo, hi, at, iv, yT: Math.min(yT, m.eave) };
  });
  // (the height at which a banded face is cut, by the corner of the box at either of its ends)
  const cut = [null, null, null, null];
  for (const w of walls) if (w.iv.length && w.yT < m.eave - 0.01) { cut[w.i] = w.yT; cut[w.j] = w.yT; }
  for (const { i, j, nx, nz, u0, u1, lo, hi, at, iv, yT } of walls) {
    if (!iv.length) {
      const ya = cut[i], yb = cut[j], b0 = at(u0, m.base), b1 = at(u1, m.base), e1 = at(u1, m.eave), e0 = at(u0, m.eave);
      A.k = wallK;
      if (ya === null && yb === null) quadOut(A, b0, b1, e1, e0, nx, 0, nz);
      else if (ya === null) { const v = at(u1, yb); triOut(A, v, e1, e0, nx, 0, nz); triOut(A, v, e0, b0, nx, 0, nz); triOut(A, v, b0, b1, nx, 0, nz); }
      else if (yb === null) { const v = at(u0, ya); triOut(A, v, b0, b1, nx, 0, nz); triOut(A, v, b1, e1, nx, 0, nz); triOut(A, v, e1, e0, nx, 0, nz); }
      else { const v0 = at(u0, ya), v1 = at(u1, yb); triOut(A, b0, b1, v1, nx, 0, nz); triOut(A, b0, v1, v0, nx, 0, nz); triOut(A, v0, v1, e1, nx, 0, nz); triOut(A, v0, e1, e0, nx, 0, nz); }
      continue;
    }
    iv.sort((p, q) => p[0] - q[0]);
    const runs = []; for (const v of iv) { const l = runs[runs.length - 1]; if (l && v[0] <= l[1] + 0.01) l[1] = Math.max(l[1], v[1]); else runs.push([v[0], v[1]]); }
    const two = yT < m.eave - 0.01, bare = [KIND.MASON, 0, wallK[2], wallK[3]];
    const piece = (a, b, blind) => {
      if (b - a < 0.01) return;
      A.k = blind ? bare : wallK; quadOut(A, at(a, m.base), at(b, m.base), at(b, two ? yT : m.eave), at(a, two ? yT : m.eave), nx, 0, nz);
      if (two) { A.k = wallK; quadOut(A, at(a, yT), at(b, yT), at(b, m.eave), at(a, m.eave), nx, 0, nz); }
    };
    let u = lo; for (const [a, b] of runs) { piece(u, a, false); piece(a, b, true); u = b; }
    piece(u, hi, false);
  }
  A.k = wallK;
}
export function rangeInto(A, m, lod = 0, dens = 1, key = null) {
  // (roofs of more than one kind: slate; on one roof in six, old tile gone brown and red; on one in sixteen, lead gone green)
  const stone = toneOf(m.tone), slate = mul3(roofCol(m), 0.85 + 0.3 * h1(m.sd));
  // (the low town under the cliff keeps more windows than the castle over it)
  const win = winOf(m, dens), ivy = m.ivy ?? (h1(m.sd + 5) < 0.3 ? 0.24 + 0.24 * h1(m.sd + 6) : 0), wallK = [KIND.MASON, win, lod < 2 ? ivy : 0, m.shade ?? 1];
  A.col(stone); A.k = wallK;
  if (m.blind) blindWallsInto(A, m, wallK); else boxInto(A, m.x, m.z, m.yaw, m.hw, m.hl, m.base, m.eave, {});
  // stepped buttresses where the plan gives them (the cliff's faces, the keep's front, the lane's ranges)
  // (ROUND 7: each stage under its weathered head; and, on a wall that stands open to the sky, the shadow each
  // stage lays on the wall by the hour's light)
  if (m.butts && lod === 0) {
    A.col(stone, 0.9); for (const b of m.butts) { A.kind(KIND.MASON, 0, b.ivy ?? ivy * 0.5, 1); buttInto(A, b); }
    A.col(stone);
    if (key && (m.shade ?? 1) >= 1) { const K = [KIND.MASON, win, 3 + ivy, 1]; for (const b of m.butts) buttShade(A, b, key, K); }
    A.k = wallK;
  }
  const F = frameOf(m.x, m.z, m.yaw);
  if (m.roof === 2) {
    // leads behind a parapet: the lid lies 1.1 m under the wall's head; the rain stands on it
    A.col(PAL.lead, 0.9).kind(KIND.FLAGS); boxInto(A, m.x, m.z, m.yaw, m.hw - 0.6, m.hl - 0.6, m.eave - 1.2, m.eave - 1.1, { top: true });
    // (ROUND 7: A CORBEL TABLE under the battlements of the keep's masses and the cliff's blocks: a band of stone
    // standing 0.55 m out all round, 1.6 m tall, its head 1.7 m under the wall's; the stone's shader lays its corbels
    // and the dark gaps between them: the member's dress 1, aK.y the height of its foot)
    if (lod === 0 && (m.part === 'keep' || m.part === 'massB')) { A.col(stone, 0.97).kind(KIND.MASON, m.eave - 3.3, 1, m.shade ?? 1); boxInto(A, m.x, m.z, m.yaw, m.hw + 0.55, m.hl + 0.55, m.eave - 3.3, m.eave - 1.7, { top: true }); }
    A.col(stone, 0.9).kind(KIND.MASON, 0, 0, 1);
    for (const sx of [-1, 1]) { boxInto(A, F(sx * (m.hw - 0.3), 0, 0)[0], F(sx * (m.hw - 0.3), 0, 0)[2], m.yaw, 0.3, m.hl, m.eave - 1.1, m.eave, { top: true }); boxInto(A, F(0, 0, sx * (m.hl - 0.3))[0], F(0, 0, sx * (m.hl - 0.3))[2], m.yaw, m.hw - 0.6, 0.3, m.eave - 1.1, m.eave, { top: true }); }
    if (lod === 0) {
      const e = [[-m.hw + 0.4, -m.hl + 0.4], [m.hw - 0.4, -m.hl + 0.4], [m.hw - 0.4, m.hl - 0.4], [-m.hw + 0.4, m.hl - 0.4]], big = m.hw > 20 ? 1.6 : 1;
      for (let i = 0; i < 4; i++) { const a = F(e[i][0], 0, e[i][1]), b = F(e[(i + 1) % 4][0], 0, e[(i + 1) % 4][1]); merlonsInto(A, a[0], a[2], b[0], b[2], m.eave, 1.5 * big, 1.5 * big, 0.8, 1.4 * big); }
    }
    return;
  }
  A.col(slate).kind(KIND.SLATE);
  const oh = lod === 0 ? 0.6 : 0;
  if (m.roof === 0) gableInto(A, m.x, m.z, m.yaw, m.hw, m.hl, m.eave, m.ridge, oh, { c: stone, k: wallK });
  else hipInto(A, m.x, m.z, m.yaw, m.hw + oh, m.hl + oh, m.eave, m.ridge, 0.8);
  if (lod === 0) {
    // the gutters: a lead trough along each eave, full of the sky; and the ridge's own course of stone
    const k = (m.ridge - m.eave) / m.hw, ye = m.eave - oh * k, zl = m.hl + (m.roof === 0 ? oh : 0);
    for (const sx of [-1, 1]) {
      const x0 = sx * (m.hw + oh), x1 = sx * (m.hw + oh + 0.45);
      A.col(PAL.lead, 0.8).kind(KIND.WATER); quadOut(A, F(x0, ye - 0.04, -zl), F(x1, ye - 0.04, -zl), F(x1, ye - 0.04, zl), F(x0, ye - 0.04, zl), 0, 1, 0);
      A.col(PAL.lead, 0.7).kind(KIND.PLAIN); quadOut(A, F(x1, ye - 0.3, -zl), F(x1, ye - 0.3, zl), F(x1, ye + 0.04, zl), F(x1, ye + 0.04, -zl), sx * Math.cos(m.yaw), 0, sx * Math.sin(m.yaw));
    }
    const zr = m.roof === 0 ? zl : Math.max(0, m.hl + oh - (m.hw + oh) * 0.8);
    A.col(stone, 0.8).kind(KIND.PLAIN); boxInto(A, m.x, m.z, m.yaw, 0.22, zr, m.ridge - 0.12, m.ridge + 0.16, { top: true });
  }
}
// what a roof's own height is at a place of its frame (lx across, lz along): for the things that stand on it
export function roofY(m, lx, lz = 0) {
  if (m.roof === 2) return m.eave - 1.1;
  const y = m.ridge - (m.ridge - m.eave) * clamp(Math.abs(lx) / m.hw, 0, 1.2);
  if (m.roof === 1) { const zr = Math.max(0, m.hl - m.hw * 0.8), over = Math.abs(lz) - zr; if (over > 0) return Math.min(y, m.ridge - (m.ridge - m.eave) * clamp(over / Math.max(0.01, m.hl - zr), 0, 1.2)); }
  return y;
}
// the BUILT roof's own height at a place of a range's frame, as rangeInto lays it (a near range's eaves overhang 0.6 m, so
// its hipped ends lie a little higher than roofY says), and the top of what stands along its ridge: the ridge's stone
// course (near ranges, the ridge's true length: a hipped ridge is shorter than its range) or the roof itself past its end
export function roofTop(m, lx, lz = 0) { return roofTopOf(m.roof, m.zone, m.hw, m.hl, m.eave, m.ridge, lx, lz); }
// (the same by a range's own numbers: its roof's kind, its zone, half its breadth and length, its eaves and its ridge)
function roofTopOf(roof, zone, hw, hl, eave, ridge, lx, lz) {
  if (roof === 2) return eave - 1.1;
  if (roof === 0) return ridge - (ridge - eave) * Math.abs(lx) / hw;
  const oh = zone === 0 ? 0.6 : 0, HW = hw + oh, HL = hl + oh, zr = Math.max(0, HL - HW * 0.8), ys = ridge - (ridge - eave) * Math.abs(lx) / HW, over = Math.abs(lz) - zr;
  return over > 0 ? Math.min(ys, ridge - (ridge - eave) * over / Math.max(0.01, HL - zr)) : ys;
}
// IS A THING IN A RANGE (its box under its built roof) OR IN A ROOF'S STACK: the one test of each, by the range's or the
// stack's own numbers. inSolid reads them out of the range or the stack itself; the readers of rounds read them out of
// the plan's rows of the same numbers (solidCells). y to y1: the thing's own height; pad: the air asked.
function rangeHolds(x, y, z, y1, pad, mx, mz, cs, sn, hw, hl, base, roof, eave, ridge, zone) {
  if (y1 <= base - pad || y >= (roof === 2 ? eave : ridge) + pad) return false;
  const dx = x - mx, dz = z - mz, lx = dx * cs + dz * sn, lz = dx * sn - dz * cs;
  return Math.abs(lx) < hw + pad && Math.abs(lz) < hl + pad && y < (roof === 2 ? eave : roofTopOf(roof, zone, hw, hl, eave, ridge, clamp(lx, -hw, hw), clamp(lz, -hl, hl))) + pad * 1.5;
}
function stackHolds(x, y, z, y1, pad, sx, sz, cs, sn, hw, hl, sy0, sy1) {
  const dx = x - sx, dz = z - sz, lx = dx * cs + dz * sn, lz = dx * sn - dz * cs;
  return Math.abs(lx) < hw + 0.12 + pad && Math.abs(lz) < hl + 0.12 + pad && y1 > sy0 - pad && y < sy1 + 0.5 + pad;
}
export const ridgeLen = (m) => (m.roof === 1 ? Math.max(0, m.hl + (m.zone === 0 ? 0.6 : 0) - (m.hw + (m.zone === 0 ? 0.6 : 0)) * 0.8) : m.hl + (m.zone === 0 ? 0.6 : 0));
// is a place inside a solid of the roofscape: a tower or a tower on it, the finger tower, a chimney stack, or a range
// (under its built roof) other than the one named? list: the solids worth reading (solidsNear makes it once for a ridge)
export function inSolid(P, list, x, y, z, y1 = y, pad = 0) {
  // (y to y1: the thing's own height, foot to head; it is inside a solid whose height that span enters. pad: air asked
  // round every solid, in metres: the place is "inside" a solid it is nearer to than that)
  for (const q of list.towers) { const dx = x - q.x, dz = z - q.z, rq = q.r + pad; if (y1 > q.y0 - pad && y < q.y1 + pad && dx * dx + dz * dz < rq * rq) return 'tower'; }
  // (a stack's and a range's heading is turned into its cosine and sine once, when it is first read)
  for (const c of list.stacks) { if (c.cs === undefined) { c.cs = Math.cos(c.yaw); c.sn = Math.sin(c.yaw); } if (stackHolds(x, y, z, y1, pad, c.x, c.z, c.cs, c.sn, c.hw, c.hl, c.y0, c.y1)) return 'stack'; }
  // (a range's own heights first: a place over its ridge or under its foot is not in it, whatever its plan)
  // (with air asked, a roof is read where the place stands nearest over it: within its plan, and a little higher by its slope)
  for (const m of list.ranges) { if (m.cs === undefined) { m.cs = Math.cos(m.yaw); m.sn = Math.sin(m.yaw); } if (rangeHolds(x, y, z, y1, pad, m.x, m.z, m.cs, m.sn, m.hw, m.hl, m.base, m.roof, m.eave, m.ridge, m.zone)) return 'range'; }
  if (list.finger) { const F = P.finger, c = fingerMid(F, y); if (y < F.top + pad && Math.hypot(x - c[0], z - c[1]) < fingerR(F, y) + 0.5 + pad) return 'tower'; }
  return null;
}
// the solids that stand within reach metres of a place (plan), but for the range named
export function solidsNear(P, x, z, reach, own = null) {
  const out = { towers: [], stacks: [], ranges: [], finger: Math.hypot(P.finger.x - x, P.finger.z - z) < reach + 40 };
  // (every nearness here is a first sieve, read by squares: the true tests are inSolid's)
  // (the towers as one list, made again whenever a tower has come or gone)
  if (!P.TW || P.TWn !== P.towers.length) { P.TW = [...P.towers]; P.TWn = P.towers.length; }
  const tw = P.TW;
  for (const t of tw) { const dx = t.x - x, dz = t.z - z, rr = reach + t.r * 2.3; if (dx * dx + dz * dz < rr * rr) for (const q of towerSolids(t)) out.towers.push(q); }
  // (the stacks and the ranges by the plan's 64 m cells: a range stands in every cell its footprint's circle touches, a
  // roof's stack in its own; the stacks on the fists' heads are few and are read one by one)
  const rc = reach + 4, SC = solidCells(P), stamp = ++_stamp, x1 = Math.floor((x + rc) / 64), z0 = Math.floor((z - rc) / 64), z1 = Math.floor((z + rc) / 64);
  for (let gx = Math.floor((x - rc) / 64); gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
    const cell = SC.cells.get((gx + 512) * 1024 + gz + 512); if (!cell) continue;
    for (const k of cell.stacks) { const dx = SC.SX[k * 4] - x, dz = SC.SX[k * 4 + 1] - z; if (dx * dx + dz * dz < rc * rc) out.stacks.push(SC.S[k]); }
    for (const k of cell.ranges) { if (SC.st[k] === stamp) continue; SC.st[k] = stamp; const dx = SC.RX[k * 5] - x, dz = SC.RX[k * 5 + 1] - z, rr = reach + SC.RX[k * 5 + 2]; if (dx * dx + dz * dz < rr * rr) { const m = SC.R[k]; if (m !== own && dx * dx + dz * dz < (reach + m.hw + m.hl) ** 2) out.ranges.push(m); } }
  }
  for (const c of P.SCF) { const dx = c.x - x, dz = c.z - z; if (dx * dx + dz * dz < rc * rc) out.stacks.push(c); }
  return out;
}

// NO TWO TOWERS STAND IN ONE ANOTHER: where two (each with the smaller towers on it) would stand within 3 m of one
// another in plan, the one of the lesser part is left out, after its draws. The keep's towers, the fists, the
// field's corner towers, the cliff's and the field's turrets, the gate's and the outer wall's towers stand; then the
// lesser towers, the great ones, those of the middle ward, the far ones; within a part, the earlier dealt
function towersApart(P) {
  const rank = { keep: 0, fist: 1, quad: 2, massB: 3, field: 4, gate: 5, wall: 6, lesser: 7, great: 8, mid: 9, far: 10 }, towers = P.towers;
  const reach = (t) => Math.max(...towerSolids(t).map((q) => Math.hypot(q.x - t.x, q.z - t.z) + q.r));
  const order = towers.map((t, i) => i).sort((a, b) => rank[towers[a].part] - rank[towers[b].part] || a - b), stood = [], keep = new Set();
  for (const i of order) { const t = towers[i], r = reach(t); if (stood.some((o) => Math.hypot(t.x - o.t.x, t.z - o.t.z) < r + o.r + 3)) continue; stood.push({ t, r }); keep.add(t); }
  for (let i = towers.length - 1; i >= 0; i--) if (!keep.has(towers[i])) towers.splice(i, 1);
  P.fists = P.fists.filter((t) => keep.has(t));
}
// the casters of the great shadows, BY PLACE: the finger tower; the keep's three masses; the cliff's blocks; the rim's
// ranges and the slot's; the lane's two sides; the cats' hall; the field's near range (to either hand of its gatehouse,
// and the gatehouse) and its side ranges; then, to the number NC, the towers of the places and of the inner ward that
// are tallest and broadest (the field's turrets and corner towers count three times over, since their shadows lie
// across the flags; the keep's twice)
function planCasters(P) {
  const towers = P.towers, F = P.finger, cand = [], L = P.lane;
  const box = (m, score, top = m.eave) => cand.push({ x: m.x, z: m.z, yaw: m.yaw, hw: m.hw, hl: m.hl, top, score });
  const whole = (list, score) => { const a = list[0], b = list[list.length - 1], wa = P.toWT(a.x, a.z)[0] - a.hl, wb = P.toWT(b.x, b.z)[0] + b.hl, t = P.toWT(a.x, a.z)[1], c = P.fromWT((wa + wb) / 2, t); cand.push({ x: c[0], z: c[1], yaw: a.yaw, hw: a.hw, hl: (wb - wa) / 2, top: Math.min(...list.map((m) => m.eave)), score }); };
  for (const t of towers) {
    if (t.part === 'far' || t.part === 'mid') continue;
    const k = t.part === 'field' || t.part === 'quad' ? 3 : t.part === 'keep' ? 2 : 1;
    cand.push({ x: t.x, z: t.z, yaw: t.yaw || 0, hw: t.r * (t.round ? 0.97 : 0.89), hl: t.r * 0.89, round: !!t.round, top: t.cap === 2 ? t.top - 4 : t.top, score: (t.top - 50) * t.r * k });
  }
  P.keep.blocks.forEach((m, i) => box(m, 1e5 - i));
  for (const m of P.massB) box(m, 5e4);
  for (const m of P.rim) box(m, 4e4);
  box(P.slot, 4.5e4); box(P.cats.hall, 2e4, (P.cats.hall.eave + P.cats.hall.ridge) / 2);
  const nr = P.nearRange; whole(nr.slice(0, 2), 1.5e4); whole(nr.slice(2, 3), 1.4e4); whole(nr.slice(3), 1.5e4);
  for (const m of P.quadRanges.slice(nr.length)) box(m, 1.5e4);
  for (const sd of [-1, 1]) { const c = P.laneAt((L.u0 + L.u1) / 2, sd * (L.half + L.deep / 2)), ms = L.ranges.filter((m) => m.side === sd); cand.push({ x: c[0], z: c[1], yaw: L.az, hw: L.deep / 2, hl: (L.u0 - L.u1) / 2, top: Math.min(...ms.map((m) => m.eave)), score: 3e4 }); }
  cand.push({ x: F.x, z: F.z, yaw: 0, hw: F.rTop, hl: F.rTop, round: true, top: F.top - 10, score: 1e6 });
  cand.sort((a, b) => b.score - a.score);
  P.casters = cand.slice(0, NC);
}

// ---------------------------------------------------------------- THE DETAILS OF A VISIT (plain numbers): chimneys and their
// smoke, dormers, the mud dwellings and their mound. Every draw of a thing is taken before any test of it.
// do two upright boxes meet: plan rectangles each with its own heading (x, z, yaw, hw across, hl along) and heights y0 to y1
export function boxesMeet(a, b) {
  if (a.y0 >= b.y1 || b.y0 >= a.y1) return false;
  // (a quick no: the two are farther apart than their breadths and lengths together)
  const dx = b.x - a.x, dz = b.z - a.z, rs = a.hw + a.hl + b.hw + b.hl;
  if (dx * dx + dz * dz > rs * rs) return false;
  // (the four axes of the two rectangles: across is (cos yaw, sin yaw), along is (sin yaw, -cos yaw))
  const ca = Math.cos(a.yaw), sa = Math.sin(a.yaw), cb = Math.cos(b.yaw), sb = Math.sin(b.yaw);
  for (const [ux, uz] of [[ca, sa], [sa, -ca], [cb, sb], [sb, -cb]]) {
    const pa = a.hw * Math.abs(ca * ux + sa * uz) + a.hl * Math.abs(sa * ux - ca * uz), pb = b.hw * Math.abs(cb * ux + sb * uz) + b.hl * Math.abs(sb * ux - cb * uz);
    if (Math.abs(dx * ux + dz * uz) >= pa + pb) return false;
  }
  return true;
}
async function planDetails(P) {
  // (every range's heading as its cosine and sine, its head and its footprint's reach, once, now that all are laid: the
  // readers of solids find them there)
  for (const m of P.ranges) { m.cs = Math.cos(m.yaw); m.sn = Math.sin(m.yaw); m.topY = m.roof === 2 ? m.eave : m.ridge; m.rad = Math.hypot(m.hw, m.hl); }
  const { R_ } = P, dens = P.density, _n = {};
  // the wind blows one way over the whole place: out of the burning quarter (and a drawn little to either side)
  const sm = R_.smoke, windAz = P.sunAz + Math.PI + sm.range(-0.6, 0.6), wind = dirOf(windAz);
  P.wind = wind; P.windAz = windAz;
  const plumes = [], chimneys = [], dormers = [], huts = [];
  // a plume stands where its stack stands (of: the stack it rises from; it goes with it)
  const addPlume = (x, y, z, rise, drift, size, ph, of = null) => { plumes.push({ x, y, z, rise, drift, r0: 0.5 * size, r1: 3.4 * size, ph, of }); };
  // ---- chimney stacks on the near roofs (fork 'chimneys'): six drawn for every near range, the first n stand
  const ch = R_.chimneys, dr = R_.dormers, near = P.ranges.filter((m) => m.zone === 0), stackBoxes = [], dormerBoxes = []; let work = 0;
  for (const m of near) {
    if (++work % 5 === 0) await P.Y();
    const F = frameOf(m.x, m.z, m.yaw), n = m.chim ? Math.min(6, Math.max(1, Math.round(m.chim * dens))) : 0;
    for (let i = 0; i < 6; i++) {
      const jz = ch.range(-0.3, 0.3), side = ch.chance(0.5) ? 1 : -1, off = ch.range(0, 0.35), hw = ch.range(0.55, 0.95), hl = ch.range(0.9, 2.4), h = ch.range(2.4, 4.4), pots = ch.int(2, 4), smokeDraw = ch(), rise = ch.range(9, 16), drift = ch.range(10, 20), ph = ch();
      if (i >= n) continue;
      const lz = (m.hl - 2) * ((i + 0.5 + jz) / n * 2 - 1), lx = side * off * m.hw, p = F(lx, 0, lz), y1 = m.ridge + h;
      // (THE FOOT: under the slates at every corner: the least roof height of the stack's four corners, less 0.4 m)
      const y0 = Math.min(roofY(m, lx - hw, lz - hl), roofY(m, lx + hw, lz - hl), roofY(m, lx - hw, lz + hl), roofY(m, lx + hw, lz + hl)) - 0.4;
      // (a stack and a dormer never stand in one place: the later dealt of the two is left out, after its draws)
      const box = { x: p[0], z: p[2], yaw: m.yaw, hw: hw + 0.12, hl: hl + 0.12, y0, y1: y1 + 1.05 };
      if (dormerBoxes.some((q) => boxesMeet(box, q))) continue;
      stackBoxes.push(box);
      const c = { x: p[0], z: p[2], yaw: m.yaw, hw, hl, y0, y1, pots, tone: m.tone, sd: m.sd + i, m, g: m.g };
      chimneys.push(c);
      // (A STACK SMOKES BY ITS OWN CHANCE, the same the castle over: 45 in a hundred at the middle density, on a
      // roof of the inner ward, of the field, of the middle ward and on a fist alike)
      if (smokeDraw < 0.45 * dens) addPlume(p[0], y1 + 0.7, p[2], rise, drift, 1, ph, c);
    }
    // dormers on the gabled roofs (fork 'dormers'): four drawn for every near range
    const nd = m.roof === 0 && m.hw >= 6 && m.ridge - m.eave >= 4 ? Math.min(4, Math.round(m.hl / 9 * dens)) : 0;
    for (let i = 0; i < 4; i++) {
      const jz = dr.range(-0.25, 0.25), side = dr.chance(0.5) ? 1 : -1, order = dr(), wide = dr.range(0.9, 1.3);
      if (i >= nd) continue;
      // (the dormer's own box on the roof: from where its ridge meets the slates to its face, a little wider than its window)
      const lz = (m.hl - 2.5) * ((i + 0.5 + jz) / nd * 2 - 1), rise = m.ridge - m.eave, xin = m.hw * clamp(0.7 - 2.5 / Math.max(0.01, rise), 0, 1), xout = m.hw * 0.7 + 0.25, yb = roofY(m, m.hw * 0.7);
      const c = F(side * (xin + xout) / 2, 0, lz), box = { x: c[0], z: c[2], yaw: m.yaw, hw: (xout - xin) / 2, hl: wide + 0.2, y0: yb - 0.3, y1: yb + 2.5 };
      if (stackBoxes.some((q) => boxesMeet(box, q))) continue;
      dormerBoxes.push(box);
      dormers.push({ m, lz, side, order, wide });
    }
  }
  // ---- THE FISTS' STACKS (fork 'fistsmoke'): every fist carries one tall stack, half its radius from its middle, on the
  // first of its three drawn bearings that keeps clear of the smaller towers on it; it smokes by the one chance. On a flat or
  // a coned head it stands on the head; in a broken head it stands inside the shell on what is left of the shaft and
  // rises over the rim. A fist with no such bearing has neither stack nor smoke (and no plume stands without its stack)
  const fk = R_.fistsmoke;
  for (const t of P.fists) {
    const as = [fk.range(0, TAU), fk.range(0, TAU), fk.range(0, TAU)], rise = fk.range(24, 38), drift = fk.range(26, 44), ph = fk(), up = fk.range(4.5, 6.5), smokeDraw = fk();
    const subs = towerSolids(t).slice(1), a = as.find((b) => subs.every((q) => Math.hypot(t.x + Math.sin(b) * t.r * 0.5 - q.x, t.z - Math.cos(b) * t.r * 0.5 - q.z) > q.r + 2.2));
    if (a === undefined) continue;
    const x = t.x + Math.sin(a) * t.r * 0.5, z = t.z - Math.cos(a) * t.r * 0.5, y1 = t.top + (t.cap === 1 ? t.r * 1.14 : t.cap === 3 || t.cap === 4 ? t.r * 0.65 : 0) + up;
    // (where a roof's stack or dormer stands in that place already, the fist's stack is left out, after its draws)
    const y0 = t.top - (t.cap === 2 ? ruinDeep(t.r, t.sd) + 1 : 1), box = { x, z, yaw: a, hw: 1.12, hl: 1.52, y0, y1: y1 + 1.05 };
    if (stackBoxes.some((q) => boxesMeet(box, q)) || dormerBoxes.some((q) => boxesMeet(box, q))) continue;
    stackBoxes.push(box);
    const c = { x, z, yaw: a, hw: 1, hl: 1.4, y0, y1, pots: 3, tone: t.tone, sd: t.sd, onFist: true, t, g: 5 };
    chimneys.push(c);
    if (smokeDraw < 0.45 * dens) addPlume(x, y1 + 0.7, z, rise, drift, 2.6, ph, c);
  }
  // the middle ward's stacks (fork 'midsmoke'): three roofs in four of it carry one great stack, and it smokes by
  // the one chance: tall slow plumes over the roofs that go on to the horizon
  const ms = R_.midsmoke;
  for (const m of P.ranges) {
    const smokeDraw = ms(), rise = ms.range(24, 44), drift = ms.range(30, 60), ph = ms(), f = ms.range(-0.6, 0.6), standDraw = ms();
    if (++work % 15 === 0) await P.Y();
    if (m.zone !== 1 || m.part || standDraw > 0.75) continue;
    const p = frameOf(m.x, m.z, m.yaw)(0, 0, f * m.hl);
    // (its foot under the slates at every corner, and not in a dormer's place, like every stack's)
    const y0 = Math.min(m.ridge - 1, Math.min(roofY(m, -1.2, f * m.hl - 1.8), roofY(m, 1.2, f * m.hl - 1.8), roofY(m, -1.2, f * m.hl + 1.8), roofY(m, 1.2, f * m.hl + 1.8)) - 0.4);
    if (dormerBoxes.some((q) => boxesMeet({ x: p[0], z: p[2], yaw: m.yaw, hw: 1.32, hl: 1.92, y0, y1: m.ridge + 7.05 }, q))) continue;
    const c = { x: p[0], z: p[2], yaw: m.yaw, hw: 1.2, hl: 1.8, y0, y1: m.ridge + 6, pots: 0, tone: m.tone, sd: m.sd, m, g: 6 };
    chimneys.push(c);
    if (smokeDraw < 0.45 * dens) addPlume(p[0], m.ridge + 6.5, p[2], rise, drift, 2.6, ph, c);
  }
  await P.Y();
  // ---- THE DWELLINGS ARE A HEAP (fork 'huts'; their fires fork 'fires', their smoke fork 'hutsmoke'): 96 clumps of
  // clay houses on the mound against the outer wall, 226 m to either side of the gate, each clump's first house 4 to
  // 50 m out from the wall's foot (half of them within 16 m): one heap along the foot, thinning outward. A clump grows from one house: every other house of it stands against the side of one dealt
  // before it, a quarter of the two sunk in one another, turned 20 to 70 degrees out of that neighbour's heading
  // (no two neighbours are square to each other; none stands alone); three in ten climb their neighbour's back and
  // stand over its roof. Three sizes: great, middling, small. The clumps leave crooked yards and lanes between them,
  // and the road to the gate; in a yard of each of the first 24 clumps a cooking fire burns; every clump has its
  // lengths of fence and its stack of wood
  const hr = R_.huts, hs = R_.hutsmoke, fi = R_.fires, yd = R_.yards, O = P.outer, a0 = O.a0, yards = [];
  // the dwellings' lanes: the ground within their stretch of the wall, 1 at the wall's foot falling to nought 118 m out
  P.lanes = (x, z) => { const o = -P.inside(x, z) - M.WALL_THICK / 2, al = (Math.atan2(x - O.cx, -(z - O.cz)) - a0) * O.R; return o < 0 || Math.abs(al) > 232 ? 0 : Math.round(clamp(1 - o / 118, 0, 1) * 50) / 50; };
  // the mound: 21 m at the wall's foot falling to the plain 115 m out
  P.moundY = (x, z) => { const o = -P.inside(x, z) - M.WALL_THICK / 2, k = 1 - smoothstep(0, 115, o); return 21 * k * Math.sqrt(Math.max(k, 0)) + 2.2 * P.noise.n2(x * 0.05, z * 0.05) * k; };
  P.fires = [];
  const SIZES = [[2.7, 3.5], [1.9, 2.5], [1.2, 1.7]];
  for (let ic = 0; ic < 96; ic++) {
    await P.Y();
    // (the clumps are dealt outward from the gate, by turns to either hand of the road)
    const al = (ic % 2 ? 1 : -1) * (14 + Math.floor(ic / 2) * 4.5 + hr.range(-3, 3)), od = hr(), o = 4 + 46 * od * od, nH = 6 + Math.round(hr.range(4, 10) * (1 - o / 130)), yaw0 = hr.range(0, TAU), tone0 = hr.range(0.8, 1.1);
    const th = a0 + al / O.R, rho = O.R + M.WALL_THICK / 2 + o, cx = O.cx + Math.sin(th) * rho, cz = O.cz - Math.cos(th) * rho, clump = [];
    for (let k = 0; k < 16; k++) {
      const pick = hr(), side = hr.range(0, TAU), turn = hr.range(0.35, 1.2) * (hr.chance(0.5) ? 1 : -1), szD = hr(), sz = SIZES[k === 0 || szD < 0.25 ? 0 : szD < 0.6 ? 1 : 2], hw = hr.range(sz[0], sz[1]), hl = hw * hr.range(1, 1.5), h = hr.range(2.3, 3.4) + hw * 0.35, climb = hr() < 0.3, tone = tone0 * hr.range(0.9, 1.1), roof = hr(), order = hr();
      const smokeDraw = hs(), rise = hs.range(6, 10), drift = hs.range(6, 12), ph = hs();
      if (k >= nH) continue;
      let x = cx, z = cz, yaw = yaw0, par = null;
      if (clump.length) { par = clump[Math.min(clump.length - 1, Math.floor(pick * clump.length))]; const d = (Math.max(par.hw, par.hl) + Math.max(hw, hl)) * 0.75; x = par.x + Math.sin(side) * d; z = par.z - Math.cos(side) * d; yaw = par.yaw + turn; }
      // (a house keeps off the road, out of the wall and its towers' feet, and on the mound's own side of the wall)
      const out = -P.inside(x, z) - M.WALL_THICK / 2, r = Math.max(hw, hl);
      if (P.road(x, z) < 5 + r || out < r * 0.6 || P.towers.some((t) => (t.part === 'gate' || t.part === 'wall') && Math.hypot(x - t.x, z - t.z) < t.r * 1.3 + r)) continue;
      const g = P.moundY(x, z), y1 = climb && par ? Math.max(g + h, par.y1 + h * 0.55) : g + h;
      const hut = { x, z, yaw, hw, hl, y0: g - 1.5, y1, tone, roof, order, th };
      clump.push(hut); huts.push(hut);
      if (smokeDraw < 0.16 * dens) addPlume(x, y1 + 0.4, z, rise, drift, 0.7, ph);
    }
    // its cooking fire: in the yard beside its first house, on the side away from the wall
    const fa = fi.range(-0.9, 0.9), fd = fi.range(1.5, 3), fph = fi(), frise = fi.range(7, 12), fdrift = fi.range(8, 14);
    if (clump.length && P.fires.length < NF) {
      const h0 = clump[0], d = Math.max(h0.hw, h0.hl) + fd, a = th + fa, x = h0.x + Math.sin(a) * d, z = h0.z - Math.cos(a) * d;
      if (P.road(x, z) > 6 && !huts.some((q) => Math.hypot(x - q.x, z - q.z) < Math.max(q.hw, q.hl) * 0.9)) { P.fires.push({ x, y: P.moundY(x, z) + 0.25, z, ph: fph }); addPlume(x, P.moundY(x, z) + 0.9, z, frise, fdrift, 0.9, fph); }
    }
    // its yard (fork 'yards'): two lengths of wattle fence on the side away from the wall and a stack of cut wood
    // against a house; one that would stand in a house or on the road is left out, after its draws
    for (let k = 0; k < 3; k++) {
      const a = th + yd.range(-1.2, 1.2), d = yd.range(1.2, 3.2), len = yd.range(1.6, 3.4), turn = yd.range(-0.5, 0.5), of = yd.int(0, 3);
      if (!clump.length) continue;
      const h0 = clump[Math.min(clump.length - 1, of)], wood = k === 2, dd = Math.max(h0.hw, h0.hl) + (wood ? 0.55 : d), x = h0.x + Math.sin(a) * dd, z = h0.z - Math.cos(a) * dd;
      if (P.road(x, z) < 4 + len / 2 || -P.inside(x, z) - M.WALL_THICK / 2 < 1.5 || huts.some((q) => Math.hypot(x - q.x, z - q.z) < Math.max(q.hw, q.hl) * 1.05 + (wood ? 0.3 : len * 0.4))) continue;
      yards.push({ x, z, y: P.moundY(x, z), yaw: a + Math.PI / 2 + turn, len: wood ? len * 0.6 : len, wood });
    }
  }
  await P.Y();
  // ---- THE FIELD'S NEAR RANGE AND ITS SIDE RANGES (fork 'fielddress') carry what a castle roof has, beside their
  // turrets: three tall stacks behind the ridge of each length, each smoking by the one chance of every stack;
  // great dormers on the slope that looks on the field. Each is drawn whole, then stood or left out
  {
    const fsd = R_.fielddress, q = P.quad, turrets = P.towers.filter((t) => t.part === 'field' || t.part === 'quad'), NS = 3, fc = P.fromWT(q.mid, (q.t0 + q.t1) / 2);
    const inTurret = (x, z, pad) => turrets.some((t) => Math.hypot(x - t.x, z - t.z) < t.r * 1.45 + pad);
    const dress = (m, lz0, lz1) => {
      // (the slope of a range that looks on the field: the one whose eaves stand nearer the field's middle)
      const F = frameOf(m.x, m.z, m.yaw), dOf = (lx) => { const c = F(lx, 0, 0); return Math.hypot(c[0] - fc[0], c[2] - fc[1]); }, side = dOf(1) < dOf(-1) ? 1 : -1;
      for (let k = 0; k < NS; k++) {
        const f = (k + fsd.range(0.15, 0.85)) / NS, hw = fsd.range(0.8, 1.2), hl = fsd.range(1.4, 2.6), h = fsd.range(5, 9), off = fsd.range(0.1, 0.5), pots = fsd.int(2, 4), smokeDraw = fsd(), rise = fsd.range(12, 20), drift = fsd.range(12, 22), ph = fsd();
        const lz = lerp(lz0, lz1, f), lx = -side * off * m.hw, c = F(lx, 0, lz), y1 = m.ridge + h;
        const y0 = Math.min(roofY(m, lx - hw, lz - hl), roofY(m, lx + hw, lz - hl), roofY(m, lx - hw, lz + hl), roofY(m, lx + hw, lz + hl)) - 0.4;
        const box = { x: c[0], z: c[2], yaw: m.yaw, hw: hw + 0.12, hl: hl + 0.12, y0, y1: y1 + 1.05 };
        if (inTurret(c[0], c[2], 2) || dormerBoxes.some((o) => boxesMeet(box, o)) || stackBoxes.some((o) => boxesMeet(box, o))) continue;
        stackBoxes.push(box);
        const st = { x: c[0], z: c[2], yaw: m.yaw, hw, hl, y0, y1, pots, tone: m.tone, sd: m.sd + k, m, g: m.g };
        chimneys.push(st);
        if (smokeDraw < 0.45 * dens) addPlume(c[0], y1 + 0.7, c[2], rise, drift, 1.2, ph, st);
      }
      const nd = Math.max(1, Math.floor((lz1 - lz0) / 9)), BIG = 1.8, rise = m.ridge - m.eave;
      for (let k = 0; k < nd; k++) {
        const jz = fsd.range(-0.25, 0.25), order = fsd(), wide = fsd.range(1.9, 2.5);
        const lz = lerp(lz0, lz1, (k + 0.5 + jz) / nd), xin = m.hw * clamp(0.7 - 2.5 * BIG / Math.max(0.01, rise), 0, 1), xout = m.hw * 0.7 + 0.25, yb = roofY(m, m.hw * 0.7);
        const c = F(side * (xin + xout) / 2, 0, lz), box = { x: c[0], z: c[2], yaw: m.yaw, hw: (xout - xin) / 2, hl: wide + 0.2, y0: yb - 0.3, y1: yb + 2.5 * BIG };
        if (rise < 4 || inTurret(c[0], c[2], wide + 1) || stackBoxes.some((o) => boxesMeet(box, o)) || dormerBoxes.some((o) => boxesMeet(box, o))) continue;
        dormerBoxes.push(box);
        dormers.push({ m, lz, side, order, wide, big: BIG });
      }
    };
    for (const m of P.quadRanges) dress(m, -m.hl + 3, m.hl - 3);
  }
  P.plumes = plumes; P.chimneys = chimneys; P.dormers = dormers; P.huts = huts; P.yards = yards;
  for (const c of chimneys) if (c.cs === undefined) { c.cs = Math.cos(c.yaw); c.sn = Math.sin(c.yaw); }
}

// a bird's loop at a share q of its round (the same arithmetic as the birds' shader)
export function loopPoint(b, q, out = [0, 0, 0]) {
  const a = q * TAU, cy = Math.cos(b.yaw), sy = Math.sin(b.yaw), R = b.R, hh = Math.sin(a * 0.5) ** 2;
  // (a rook's round is a circle through its perch; an owl's is a long leaf: straight out of the wall and straight back in)
  const f = R * 0.5 * (1 - Math.cos(a)), s = R * 0.5 * Math.sin(a) * (b.kind === 2 ? hh : 1);
  out[0] = b.home[0] + sy * f + cy * s; out[1] = b.home[1] + b.H * hh; out[2] = b.home[2] - cy * f + sy * s;
  return out;
}
// the line's points in a plan grid of 16 m cells, made once for a line: any point within 15 m of a place stands in the
// place's own cell or one of the eight round it
function lineGrid(P) {
  if (P.LNG && P.LNG.LN === P.LN) return P.LNG;
  const LN = P.LN, n = P.LN_N, S = 16; let x0 = 1e30, z0 = 1e30, x1 = -1e30, z1 = -1e30;
  for (let i = 0; i < n; i++) { const x = LN[i * 3], z = LN[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  const nx = Math.floor((x1 - x0) / S) + 1, nz = Math.floor((z1 - z0) / S) + 1, start = new Int32Array(nx * nz + 1), cell = new Int32Array(n), items = new Int32Array(n);
  for (let i = 0; i < n; i++) { cell[i] = Math.floor((LN[i * 3] - x0) / S) + nx * Math.floor((LN[i * 3 + 2] - z0) / S); start[cell[i] + 1]++; }
  for (let c = 0; c < nx * nz; c++) start[c + 1] += start[c];
  const fill = start.slice(0, nx * nz);
  for (let i = 0; i < n; i++) items[fill[cell[i]]++] = i * 3;
  return (P.LNG = { LN, S, x0, z0, nx, nz, start, items });
}
// the least distance from a place to the line where that is under 15 m, read from the grid; 15 where it is 15 or more
function lineNear15(P, x, y, z) {
  const G = lineGrid(P), LN = G.LN, S = G.S, gx = G.nx, gz = G.nz, st = G.start, it = G.items, cx = Math.floor((x - G.x0) / S), cz = Math.floor((z - G.z0) / S); let b2 = 225;
  for (let j = Math.max(0, cz - 1); j <= Math.min(gz - 1, cz + 1); j++) for (let i = Math.max(0, cx - 1); i <= Math.min(gx - 1, cx + 1); i++) {
    const c = i + gx * j;
    for (let k = st[c]; k < st[c + 1]; k++) { const q = it[k], dx = LN[q] - x, dy = LN[q + 1] - y, dz = LN[q + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b2) b2 = d; }
  }
  return Math.sqrt(b2);
}
// a distance no greater than the true one from a place to the line: read from the line's every eighth point and its
// last (16 m apart along it), less 8.5 m
function lineCoarse(P) {
  let C = P.LNC;
  if (!C || C.LN !== P.LN) {
    const LN = P.LN, n = P.LN_N, c = [];
    for (let i = 0; i < n; i += 8) c.push(LN[i * 3], LN[i * 3 + 1], LN[i * 3 + 2]);
    c.push(LN[(n - 1) * 3], LN[(n - 1) * 3 + 1], LN[(n - 1) * 3 + 2]);
    C = P.LNC = { LN, c: new Float64Array(c) };
  }
  return C.c;
}
function lineLow(P, x, y, z) {
  const c = lineCoarse(P); let b2 = 1e30;
  for (let i = 0; i < c.length; i += 3) { const dx = c[i] - x, dy = c[i + 1] - y, dz = c[i + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b2) b2 = d; }
  return Math.sqrt(b2) - 8.5;
}
// how near a bird's whole motion comes to the line (every phase of its round: every bird flies whole rounds). stop: the asker's bar: the reading may end at the first place nearer than it, and the answer is then
// only "under the bar" (a plan asks no more than that; left out, the least distance itself is given; whole: no
// short answer for a far bird: the reading itself, which gives 15 for 15 m and more)
export function birdNear(P, b, stop = -1e9, whole = false) {
  const p = [0, 0, 0], h = b.home, s6 = b.size * 0.6; let best = 1e9;
  // (first the whole reach of its motion as one ball about its home: most birds are far from the line and need no more.
  // An asker with a bar is answered sooner still, by the line's every eighth point: no point of the line is further
  // than 8 m from one of those, so a ball that keeps 8.5 m more from them than it must is far, and is given as that)
  const reach = b.R + Math.abs(b.H) + b.size;
  if (stop > -1e8) { const lo = lineLow(P, h[0], h[1], h[2]) - reach; if (lo > 8 && lo > stop) return lo; }
  else if (!whole) { const far = lineNear(P, h[0], h[1], h[2]) - reach; if (far > 8) return far; }
  // (only the line's points within 15 m of a place of the motion are read, from the grid; a motion that keeps 15 m or
  // more from the line is given as 15)
  const G = lineGrid(P), LN = P.LN, S = G.S, gx = G.nx, gz = G.nz, st = G.start, it = G.items;
  const at = (q) => {
    let b2 = 225; const cx = Math.floor((q[0] - G.x0) / S), cz = Math.floor((q[2] - G.z0) / S);
    for (let z = Math.max(0, cz - 1); z <= Math.min(gz - 1, cz + 1); z++) for (let x = Math.max(0, cx - 1); x <= Math.min(gx - 1, cx + 1); x++) {
      const c = x + gx * z;
      for (let k = st[c]; k < st[c + 1]; k++) { const i = it[k], dx = LN[i] - q[0], dy = LN[i + 1] - q[1], dz = LN[i + 2] - q[2], d = dx * dx + dy * dy + dz * dz; if (d < b2) b2 = d; }
    }
    return Math.sqrt(b2);
  };
  // (OF A RING, ONLY THE STEPS THAT CAN BE WITHIN 15 m OF THE LINE IN PLAN ARE READ: those within 23.6 m of one of the
  // line's every eighth point, no point of the line being further than 8 m from one of those; every other step is 15 m
  // and more from the line and counts as 15, as a reading of it would give)
  const ring = b.kind !== 2 && b.R > 0, rr = b.R * 0.5, mx = h[0] + Math.sin(b.yaw) * rr, mz = h[2] - Math.cos(b.yaw) * rr, C = lineCoarse(P);
  // (a reading ends at the first place whose distance, less the bird, is under its bar)
  const read = (n, bar) => {
    rimBegin(n);
    if (ring) for (let i = 0; i < C.length; i += 3) { const dx = C[i] - mx, dz = C[i + 2] - mz, dd = dx * dx + dz * dz, lo = rr - 23.6, hi = rr + 23.6; if (dd < hi * hi && (lo <= 0 || dd > lo * lo)) markRim(rr, b.yaw, dx, dz, 23.6); }
    const cnt = rimEnd(!ring); let m = cnt < n ? 15 : 1e9;
    for (let j = 0; j < cnt; j++) { loopPoint(b, _idx[j] / n, p); const d = at(p); if (d < m) { m = d; if (m - s6 < bar) return m; } }
    return m;
  };
  // (first at every 6 m: between two such readings the round can come 3 m nearer at most, so a round that keeps 12 m
  // there needs no finer reading and is given as it was read; any other is read at every 1.5 m)
  const way = Math.PI * Math.hypot(b.R, b.H);
  best = read(Math.min(4000, Math.max(12, Math.ceil(way / 6))), 12);
  if (best - s6 < 12) best = read(Math.min(4000, Math.max(20, Math.ceil(way / 1.5))), stop);
  return best - s6;
}
// MENDING 3, M5: A TOWER BY ITS HEAD AS BUILT, FOR THE FLIERS' TEST ALONE. A tower's solid (towerSolids: what the
// towers' own placing, the rags, the line and every other test read; it stays as it is, so that no tower moves) is
// a round shaft: 1.1 of the radius (1.3 for a square shaft or four turrets), a lead cap's 1.14. Stone and slate
// that capInto and towerInto lay OUTSIDE that round are given here, each as a round or a square of its own, with 0.2 m
// more than is laid: a cone's eave (1.16 of the radius, whole or cut) to where the cone comes inside the solid; a
// near flat head's merlons at their corners; a square shaft's parapet, saddle roof with its eaves, or hipped roof
// at their corners; a near shaft's string courses. sq: [cosine, sine, half breadth] of a square (r: its corners')
function headBuilt(x, z, r, top, cap, hd, round, yaw, lod, sd, k0, out) {
  const g = 0.2, sq = (h, y0, y1) => out.push({ x, z, r: h * Math.SQRT2 + g, y0: y0 - g, y1: y1 + g, sq: [Math.cos(yaw), Math.sin(yaw), h + g] }), rd = (rr, y0, y1) => { if (rr > r * k0) out.push({ x, z, r: rr + g, y0: y0 - g, y1: y1 + g }); };
  if (cap === 1) { const hc = r * (1.5 + 0.5 * h1(sd)); if (!hd || hd.kind === 1) rd(r * 1.16, top, top + hc * (1 - Math.min(1, k0 / 1.16))); }
  else if (cap === 0) { if (round) { if (lod === 0) rd(Math.hypot(r * 1.1, 0.8), top + 1.1, top + 2.5); } else sq(r * 0.89 + 0.5, top - 1.2, top + (lod === 0 ? 2.5 : 1.1)); }
  else if (cap === 3) sq(r * 0.89 + 0.65, top - 1.1, top + r * 1.1);
  else if (cap === 4 && !round) sq(r * 0.89 + 0.4, top - 1.2, top + r * 0.9);
}
function towerBuilt(t) {
  const out = [], lod = towerLod(t), sol = towerSolids(t), k0 = sol[0].r / t.r;
  headBuilt(t.x, t.z, t.r, t.top, t.cap, t.cap === 1 ? t.head : null, t.round, t.yaw, lod, t.sd, k0, out);
  // (the string courses of a near shaft, as towerInto lays them)
  { const yS = t.top - (t.cap === 2 ? ruinDeep(t.r, t.sd) : 1.2), yb = Math.min(yS - 2, t.base + Math.max(12, (yS - t.base) * 0.32)), hq = t.r * 0.89;
    if (lod === 0 && yS - yb > 14) for (const f of [0.38, 0.74]) { const y = lerp(yb, yS, f); if (t.round) { if (t.r * 1.02 + 0.28 > t.r * k0) out.push({ x: t.x, z: t.z, r: t.r * 1.02 + 0.48, y0: y - 0.2, y1: y + 0.75 }); } else if ((hq + 0.28) * Math.SQRT2 > t.r * k0) out.push({ x: t.x, z: t.z, r: (hq + 0.28) * Math.SQRT2 + 0.2, y0: y - 0.2, y1: y + 0.75, sq: [Math.cos(t.yaw), Math.sin(t.yaw), hq + 0.48] }); } }
  for (let i = 1; i < sol.length; i++) { const q = sol[i], s = q.sub, rr = s.k * t.r; headBuilt(q.x, q.z, rr, t.top + s.up, s.cap, s.cap === 1 ? s.head : null, true, t.yaw, Math.max(1, lod), t.sd + i * 7, q.r / rr, out); }
  return out;
}
// every tower's solids in one list (shafts, the smaller towers on them, the smaller towers on the finger), made once
// for a plan. (MENDING 3, M5: the cells the fliers' test reads hold, beside these, every tower's head as built)
function towerList(P) {
  if (P.TS) return P.TS;
  const F = P.finger, out = [], built = [];
  for (const t of P.towers) { for (const q of towerSolids(t)) out.push(q); for (const q of towerBuilt(t)) built.push(q); }
  for (const t of F.turrets) { if (!t.on) continue; const c = fingerMid(F, t.y), rr = fingerR(F, t.y) + t.r * 0.32; out.push({ x: c[0] + Math.sin(t.th) * rr, z: c[1] - Math.cos(t.th) * rr, r: t.r * 1.25, y0: t.y - t.r * 1.8, y1: t.y + t.h + t.r * 2.6 }); }
  // (the tall stacks that stand on the fists' heads, pots and all, where the finger's rooks wheel)
  for (const c of P.chimneys) if (c.onFist && !c.gone) out.push({ x: c.x, z: c.z, r: Math.hypot(c.hw, c.hl), y0: c.y0, y1: c.y1 + 1.2 });
  // (and the same solids by 64 m cells of the plan, each in its middle's cell, with the greatest radius among them: a
  // reader takes the cells its own reach and that radius cover)
  const cells = new Map(); let rmax = 0;
  for (const q of out.concat(built)) { const k = (Math.floor(q.x / 64) + 512) * 1024 + Math.floor(q.z / 64) + 512, l = cells.get(k); if (l) l.push(q); else cells.set(k, [q]); if (q.r > rmax) rmax = q.r; }
  P.TSC = { cells, rmax };
  return (P.TS = out);
}
// DOES A FLIER'S ROUND PASS THROUGH A TOWER: any shaft or smaller tower with its head, or a stack on a fist, and half
// a metre of air round it, or the finger tower's own wall as it is built with half a metre, read at every metre of the
// round or less (a shaft is round: between two readings a metre apart that keep half a metre from it the round does not enter it). One that does is left out, after its draws. (The kinds that fly by the finger tower keep further from its shaft by
// tests of their own; the owls, which sit on its sills, by theirs alone.)
const _fw = {}, _rp = [0, 0, 0], _mark = new Uint8Array(4096), _idx = new Int32Array(4096);
let _rimN = 0, _rimAll = false, _rimCount = 0, _a0 = 0, _a1 = 0;
// A RING'S RIM AND A PLACE: a round that is a circle in plan (its middle half its breadth out of its home, the way it
// heads) is read at n steps, step i at the share i / n of the turn. rimArc gives the steps that can come within rho
// metres (plan) of a place dx, dz from the ring's middle: none (0), the arc _a0 to _a1 with a step more to either side
// (1; it lies between -n - 1 and n + 1), or every step (2). No other step of the rim is within rho of the place.
function rimArc(r, yaw, dx, dz, rho, n) {
  const d = Math.hypot(dx, dz);
  if (d < 1e-6 || r < 1e-6) return 2;
  const c = (d * d + r * r - rho * rho) / (2 * d * r);
  if (c >= 1) return 0;
  if (c <= -1) return 2;
  const half = Math.acos(c), sy = Math.sin(yaw), cy = Math.cos(yaw), mid = Math.atan2(dx * cy + dz * sy, -(dx * sy - dz * cy));
  _a0 = Math.floor((mid - half) / TAU * n) - 1; _a1 = Math.ceil((mid + half) / TAU * n) + 1;
  return _a1 - _a0 >= n ? 2 : 1;
}
// (for a reader of many places at once: rimBegin names n, markRim marks a place's steps, rimEnd lists the marked steps
// in _idx and gives their number; a round that is no ring is read whole: rimEnd(true) lists every step)
function rimBegin(n) { _rimN = n; _rimAll = false; _rimCount = 0; }
function markRim(r, yaw, dx, dz, rho) {
  if (_rimAll) return;
  const n = _rimN, a = rimArc(r, yaw, dx, dz, rho, n);
  if (a === 0) return;
  if (a === 2) { _rimAll = true; return; }
  for (let i = _a0; i <= _a1; i++) { const k = ((i % n) + n) % n; if (!_mark[k]) { _mark[k] = 1; _idx[_rimCount++] = k; } }
}
function rimEnd(all = false) {
  for (let j = 0; j < _rimCount; j++) _mark[_idx[j]] = 0;
  if (all || _rimAll) { const n = _rimN; for (let k = 0; k < n; k++) _idx[k] = k; _rimCount = n; }
  return _rimCount;
}
// A ROUND'S STEPS THAT CAN BE UNDER A HEIGHT: a round rises out of its home by H times the square of the half angle's
// sine (the loop's own arithmetic), so the steps whose height, less off, is under top are the first lo and the last lo
// of n, two more counted in; -1: none is; a round that dips (H under 0), or one whose low steps are half of it, is
// given whole (n)
function stepsUnder(n, y, H, off, top) {
  if (!(H > 0)) return n;
  const q = (top + 0.01 + off - y) / H;
  if (q >= 1) return n; if (q <= 0) return -1;
  const lo = Math.floor(Math.asin(Math.sqrt(q)) / Math.PI * n) + 2;
  return lo * 2 >= n ? n : lo;
}
// THE STEPS OF A ROUND AT WHICH ONE SOLID COULD BE MET: those that can come within rho metres of its middle x, z in plan
// (of a ring; a round that is no ring is taken whole) and under its head top (the flier's body reaching off under its
// middle). They are listed in _idx and their number is given: at no other step of the round is the flier in that solid.
function stepsBy(b, ring, r, cx, cz, n, x, z, rho, top, off) {
  const lo = stepsUnder(n, b.home[1], b.H, off, top); if (lo < 0) return 0;
  let a0 = 0, a1 = n - 1, c = 0;
  if (ring) { const a = rimArc(r, b.yaw, x - cx, z - cz, rho, n); if (a === 0) return 0; if (a === 1) { a0 = _a0; a1 = _a1; } }
  if (lo >= n) { for (let i = a0; i <= a1; i++) _idx[c++] = ((i % n) + n) % n; return c; }
  // (the low steps stand round -n, 0 and n of the arc's own count)
  for (let j = -1; j <= 1; j++) { const s = Math.max(a0, j * n - lo), e = Math.min(a1, j * n + lo); for (let i = s; i <= e; i++) _idx[c++] = ((i % n) + n) % n; }
  return c;
}
// a round's place at a step, worked out once a round (a stamp says whose the kept places are); given as its row in _pp
const _pp = new Float64Array(4096 * 3), _ps = new Int32Array(4096); let _pstamp = 0;
function stepPoint(b, k, n) {
  const o = k * 3;
  if (_ps[k] !== _pstamp) { _ps[k] = _pstamp; loopPoint(b, k / n, _rp); _pp[o] = _rp[0]; _pp[o + 1] = _rp[1]; _pp[o + 2] = _rp[2]; }
  return o;
}
export function roundThrough(P, b) {
  if (b.share >= 1) return false;
  const F = P.finger, r = Math.abs(b.R) * 0.5, cx = b.home[0] + Math.sin(b.yaw) * r, cz = b.home[2] - Math.cos(b.yaw) * r, y0 = b.home[1] + Math.min(0, b.H) - 1, y1 = b.home[1] + Math.max(0, b.H) + 1;
  // (the solids that could be met: those of the cells the round's own circle covers, sieved by squares)
  towerList(P);
  const ring = b.kind !== 2 && b.R > 0;
  const G = P.TSC, reach = r + G.rmax + 1.5, cx1 = Math.floor((cx + reach) / 64), cz0 = Math.floor((cz - reach) / 64), cz1 = Math.floor((cz + reach) / 64); let near = null;
  for (let gx = Math.floor((cx - reach) / 64); gx <= cx1; gx++) for (let gz = cz0; gz <= cz1; gz++) {
    const l = G.cells.get((gx + 512) * 1024 + gz + 512); if (!l) continue;
    // (a round that is a circle in plan meets only what its rim can reach: a solid well inside the ring is not read)
    for (const q of l) { const dx = q.x - cx, dz = q.z - cz, rq = r + q.r + 1.5, dd = dx * dx + dz * dz; if (dd < rq * rq && q.y1 > y0 && q.y0 < y1 && (!ring || Math.sqrt(dd) > r - q.r - 1.5)) (near || (near = [])).push(q); }
  }
  const byFinger = b.kind !== 2 && Math.hypot(F.x - cx, F.z - cz) < r + F.rBase + 4;
  if (!near && !byFinger) return false;
  // (the finger's wall is nowhere further from its foot's middle than its widest storey and the whole of its lean)
  const fr = Math.max(F.rBase, F.rRing, F.rTop) * 1.02 + Math.abs(F.lean) * Math.max(0, (F.top - F.ringY - 12) / 25) + 0.5, fr2 = fr * fr;
  const n = Math.min(4000, Math.max(12, Math.ceil(Math.PI * Math.hypot(b.R, b.H) / ROUND_STEP)));
  // (EACH SOLID IS READ AT ITS OWN STEPS OF THE ROUND: those that can come to it in plan and are not over its head)
  _pstamp++;
  if (near) for (const q of near) {
    const cnt = stepsBy(b, ring, r, cx, cz, n, q.x, q.z, q.r + 0.7, q.y1 + 0.5, 0), rq = q.r + 0.5;
    for (let j = 0; j < cnt; j++) {
      const o = stepPoint(b, _idx[j], n), dx = _pp[o] - q.x, dz = _pp[o + 2] - q.z, y = _pp[o + 1];
      // (MENDING 3, M5: a square of a head as built is read as a square, with the same half metre)
      if (dx * dx + dz * dz < rq * rq && y > q.y0 - 0.5 && y < q.y1 + 0.5 && (!q.sq || (Math.abs(dx * q.sq[0] + dz * q.sq[1]) < q.sq[2] + 0.5 && Math.abs(dx * q.sq[1] - dz * q.sq[0]) < q.sq[2] + 0.5))) return true;
    }
  }
  if (byFinger) {
    const cnt = stepsBy(b, ring, r, cx, cz, n, F.x, F.z, fr + 0.2, F.top + 4, 0);
    for (let j = 0; j < cnt; j++) {
      const o = stepPoint(b, _idx[j], n), x = _pp[o], y = _pp[o + 1], z = _pp[o + 2];
      if (y < F.top + 4 && (x - F.x) * (x - F.x) + (z - F.z) * (z - F.z) < fr2) {
        // (the broken head stands only as high as its rim at the place's own bearing: over the rim is air)
        const W = fingerWall(F, Math.min(y, F.top - 0.01), _fw), dx = x - W.x, dz = z - W.z;
        if (Math.hypot(dx, dz) < W.r + 0.5 && (!W.shell || y < fingerRim(F, Math.atan2(dx, -dz)) + 0.5)) return true;
      }
    }
  }
  return false;
}
// the roofs, the cliff, the keep, the lane's ranges and bridge and the roofs' stacks by 64 m cells of the plan (made once
// for a plan, after the stacks are dealt): a range stands in every cell its footprint's circle touches
// (a cell holds numbers: each range's and stack's place in the plan's own lists; what a first sieve reads of them
// stands in rows of plain numbers beside: a range's middle, reach, foot and top, a stack's middle, foot and head)
function solidCells(P) {
  if (P.SC) return P.SC;
  const R = P.ranges, S = P.chimneys.filter((c) => !c.gone && !c.onFist), RX = new Float64Array(R.length * 5), SX = new Float64Array(S.length * 4);
  // (RN, SN: what the one test of a range and of a stack reads: a range's cosine, sine, half breadth, half length, roof's
  // kind, eaves, ridge and zone; a stack's cosine, sine, half breadth and half length. idx: each range's row)
  const RN = new Float64Array(R.length * 8), SN = new Float64Array(S.length * 4), idx = new Map();
  const cells = new Map(), put = (k, kind, o) => { let c = cells.get(k); if (!c) cells.set(k, (c = { ranges: [], stacks: [] })); c[kind].push(o); };
  for (let i = 0; i < R.length; i++) {
    const m = R[i], r = Math.hypot(m.hw, m.hl), x1 = Math.floor((m.x + r) / 64), z0 = Math.floor((m.z - r) / 64), z1 = Math.floor((m.z + r) / 64);
    m.topY = m.roof === 2 ? m.eave : m.ridge; m.rad = r;
    RX[i * 5] = m.x; RX[i * 5 + 1] = m.z; RX[i * 5 + 2] = r; RX[i * 5 + 3] = m.base; RX[i * 5 + 4] = m.topY;
    RN[i * 8] = Math.cos(m.yaw); RN[i * 8 + 1] = Math.sin(m.yaw); RN[i * 8 + 2] = m.hw; RN[i * 8 + 3] = m.hl; RN[i * 8 + 4] = m.roof; RN[i * 8 + 5] = m.eave; RN[i * 8 + 6] = m.ridge; RN[i * 8 + 7] = m.zone;
    idx.set(m, i);
    for (let gx = Math.floor((m.x - r) / 64); gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) put((gx + 512) * 1024 + gz + 512, 'ranges', i);
  }
  for (let i = 0; i < S.length; i++) { const c = S[i]; SX[i * 4] = c.x; SX[i * 4 + 1] = c.z; SX[i * 4 + 2] = c.y0; SX[i * 4 + 3] = c.y1; SN[i * 4] = Math.cos(c.yaw); SN[i * 4 + 1] = Math.sin(c.yaw); SN[i * 4 + 2] = c.hw; SN[i * 4 + 3] = c.hl; put((Math.floor(c.x / 64) + 512) * 1024 + Math.floor(c.z / 64) + 512, 'stacks', i); }
  P.SCF = P.chimneys.filter((c) => c.onFist && !c.gone);
  return (P.SC = { cells, R, S, RX, SX, RN, SN, idx, st: new Int32Array(R.length) });
}
// DOES A FLIER'S ROUND PASS THROUGH A ROOF, A WALL OR A ROOF'S STACK: read at every metre of the round or less by the
// part's own tests of a range and of a stack (the ones inSolid is made of), the flier's body half a metre above and below its middle, WITH 0.55 m OF AIR ASKED ROUND EVERY
// ROOF, WALL AND STACK (more than half a step: no place of the round between two readings is inside one). own: the range it sits on (its own roof
// is read at its middle alone: it sits on that ridge). With roundThrough (towers, the fists' stacks, the finger) this
// is every range, tower and stack of the place as a body (MENDING 4: not every drawn face of it: what stands out of
// those bodies or beside them, a rook's own range's dormers among it, is roundFaces', further on). (The solids
// read are those the round's own circle can reach, by the plan's cells.)
const _rk = [], _sk = [];
const ROUND_STEP = 1, ROUND_AIR = 0.55;
let _stamp = 0;
export function roundInRoof(P, b, own = null) {
  if (b.share >= 1) return false;
  const SC = solidCells(P), RX = SC.RX, SX = SC.SX, RN = SC.RN, SN = SC.SN, st = SC.st, h = b.home, r = Math.abs(b.R) * 0.5, cx = h[0] + Math.sin(b.yaw) * r, cz = h[2] - Math.cos(b.yaw) * r, reach = r + 1.5;
  const y0 = h[1] + Math.min(0, b.H) - 0.5, y1 = h[1] + Math.max(0, b.H) + 0.5;
  // (the roofs and stacks gathered are kept as their rows' numbers; ownK: its own range's row, -1 with none)
  const rs = _rk, ss = _sk, ring = b.kind !== 2 && b.R > 0, ownK = own === null ? -1 : SC.idx.get(own); rs.length = 0; ss.length = 0; _stamp++;
  // (a stack stands in its middle's cell alone and is taken to within 3 m more than the round's reach: the cells read
  // are those of that wider square)
  const sweep = reach + 3, x1 = Math.floor((cx + sweep) / 64), z0 = Math.floor((cz - sweep) / 64), z1 = Math.floor((cz + sweep) / 64);
  for (let gx = Math.floor((cx - sweep) / 64); gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
    const c = SC.cells.get((gx + 512) * 1024 + gz + 512); if (!c) continue;
    const cr = c.ranges, cs = c.stacks;
    // (a round that is a circle in plan meets only what its rim can reach: a roof or a stack well inside the ring is not
    // read; nor one whose head, with the air asked over it, the whole round is over, or whose foot it is under)
    for (let i = 0; i < cr.length; i++) {
      const k = cr[i]; if (st[k] === _stamp) continue; st[k] = _stamp;
      const o = k * 5; if (RX[o + 4] + ROUND_AIR * 1.5 <= y0 || RX[o + 3] - ROUND_AIR >= y1) continue;
      const dx = RX[o] - cx, dz = RX[o + 1] - cz, rad = RX[o + 2], rr = reach + rad, dd = dx * dx + dz * dz;
      if (dd < rr * rr && (!ring || Math.sqrt(dd) + rad > r - 1.5) && k !== ownK) rs.push(k);
    }
    for (let i = 0; i < cs.length; i++) {
      const o = cs[i] * 4, dx = SX[o] - cx, dz = SX[o + 1] - cz, rr = reach + 3, dd = dx * dx + dz * dz;
      if (dd < rr * rr && SX[o + 3] + 0.5 + ROUND_AIR > y0 && SX[o + 2] - ROUND_AIR < y1 && (!ring || Math.sqrt(dd) + 3 > r - 1.5)) ss.push(cs[i]);
    }
  }
  // (its own roof is read only where the round's middle can come under that roof's top: a rook on its ridge's stone,
  // whose round never dips under its seat, has no place of its own roof to enter)
  const ownIn = ownK >= 0 && RX[ownK * 5 + 4] > h[1] + Math.min(0, b.H);
  if (!rs.length && !ss.length && !ownIn) return false;
  const n = Math.min(4000, Math.max(12, Math.ceil(Math.PI * Math.hypot(b.R, b.H) / ROUND_STEP)));
  // (EACH ROOF, WALL AND STACK IS READ AT ITS OWN STEPS OF THE ROUND: those that can come to it in plan and are not over
  // its head with the air asked; the home itself, step 0, is the seat and is read by the seat's own test)
  _pstamp++;
  for (let a = 0; a < rs.length; a++) {
    const o = rs[a] * 5, e = rs[a] * 8;
    const cnt = stepsBy(b, ring, r, cx, cz, n, RX[o], RX[o + 1], RX[o + 2] + ROUND_AIR + 0.3, RX[o + 4] + ROUND_AIR * 1.5, 0.5); if (!cnt) continue;
    for (let j = 0; j < cnt; j++) {
      const k = _idx[j]; if (k === 0) continue;
      const q = stepPoint(b, k, n), y = _pp[q + 1];
      if (rangeHolds(_pp[q], y - 0.5, _pp[q + 2], y + 0.5, ROUND_AIR, RX[o], RX[o + 1], RN[e], RN[e + 1], RN[e + 2], RN[e + 3], RX[o + 3], RN[e + 4], RN[e + 5], RN[e + 6], RN[e + 7])) return true;
    }
  }
  for (let a = 0; a < ss.length; a++) {
    const o = ss[a] * 4;
    const cnt = stepsBy(b, ring, r, cx, cz, n, SX[o], SX[o + 1], 4.8 + ROUND_AIR, SX[o + 3] + 0.5 + ROUND_AIR, 0.5); if (!cnt) continue;
    for (let j = 0; j < cnt; j++) {
      const k = _idx[j]; if (k === 0) continue;
      const q = stepPoint(b, k, n), y = _pp[q + 1];
      if (stackHolds(_pp[q], y - 0.5, _pp[q + 2], y + 0.5, ROUND_AIR, SX[o], SX[o + 1], SN[o], SN[o + 1], SN[o + 2], SN[o + 3], SX[o + 2], SX[o + 3])) return true;
    }
  }
  if (ownIn) {
    const o = ownK * 5, e = ownK * 8, cnt = stepsBy(b, ring, r, cx, cz, n, RX[o], RX[o + 1], RX[o + 2] + 0.2, RX[o + 4], 0);
    for (let j = 0; j < cnt; j++) {
      const k = _idx[j]; if (k === 0) continue;
      const q = stepPoint(b, k, n), y = _pp[q + 1];
      if (rangeHolds(_pp[q], y, _pp[q + 2], y, 0, RX[o], RX[o + 1], RN[e], RN[e + 1], RN[e + 2], RN[e + 3], RX[o + 3], RN[e + 4], RN[e + 5], RN[e + 6], RN[e + 7])) return true;
    }
  }
  return false;
}
// A ROUND IS CLEAR when it passes through no solid of the place
// MENDING 3, M5: DOES A FLIER'S ROUND PASS THROUGH A THING OF THE YARD: each thing's round solids as the plan gives
// them (sol: a middle, a reach and a height over the flags) and a tree's crown as its ball (every bough and plate is
// built inside it), with 0.75 m of air round each, read at every metre of the round or less. WHAT THAT HOLDS (mending
// 4, M8): between two readings a metre apart that keep 0.75 m, a ROOK's round comes no nearer than 0.6 m to a solid
// of 0.16 m radius and more (0.56 m to the thinnest there could be); an OWL's readings are up to 1.2 m apart, and
// for it the sums promise 0.45 m and no more. COUNTED AGAIN IN MENDING 5 for the ways that now fly, on seeds 1 to
// 300, every flown round read every 0.05 m against these same solids (the distance to a solid's own surface): the
// least is 0.818 m (a rook of the flags by a well); a round of the flock on a seed where it never lifts: 0.753 m.
// (Mending 3 named 0.649 m by its own count of its own fliers; by this count mending 3's fliers come to 0.766 m.)
// False until the yard is planned
const YARD_AIR = 0.75;
export function roundInYard(P, b) {
  if (b.share >= 1 || !P.yard) return false;
  let L = P.yardSol; if (!L || L.of !== P.yard) { L = []; L.of = P.yard; for (const o of P.yard) { for (const q of o.sol) L.push({ x: q[0], z: q[1], r: q[2], y0: o.y, y1: o.y + q[3], ball: false }); if (o.ball) L.push({ x: o.ball[0], z: o.ball[2], r: o.ball[3], y0: o.ball[1] - o.ball[3], y1: o.ball[1] + o.ball[3], yc: o.ball[1], ball: true }); } P.yardSol = L; }
  const r = Math.abs(b.R) * 0.5, cx = b.home[0] + Math.sin(b.yaw) * r, cz = b.home[2] - Math.cos(b.yaw) * r, y0 = b.home[1] + Math.min(0, b.H), y1 = b.home[1] + Math.max(0, b.H), ring = b.kind !== 2 && b.R > 0;
  let near = null;
  for (const q of L) { const d = Math.hypot(q.x - cx, q.z - cz); if (d < r + q.r + 2 && q.y1 + 1 > y0 && q.y0 - 1 < y1 && (!ring || d > r - q.r - 2)) (near || (near = [])).push(q); }
  if (!near) return false;
  const n = Math.min(4000, Math.max(12, Math.ceil(Math.PI * Math.hypot(b.R, b.H) / ROUND_STEP)));
  for (let i = 1; i < n; i++) {
    loopPoint(b, i / n, _rp);
    for (const q of near) { const dx = _rp[0] - q.x, dz = _rp[2] - q.z, rq = q.r + YARD_AIR;
      if (q.ball) { const dy = _rp[1] - q.yc; if (dx * dx + dy * dy + dz * dz < rq * rq) return true; }
      else if (dx * dx + dz * dz < rq * rq && _rp[1] > q.y0 - YARD_AIR && _rp[1] < q.y1 + YARD_AIR) return true; }
  }
  return false;
}
export function roundClear(P, b, own = null) { if (roundThrough(P, b)) return false; return !roundInRoof(P, b, own); }
// MENDING 4: NO FLIER THROUGH A DRAWN FACE. The law: a flier's middle crosses no drawn face 1.5 m and more from its
// perch or sill (SEAT_FREE), at any place of its round; nearer than that it is leaving or taking its seat. What
// roundClear reads (towers, ranges under their roofs, stacks) stands as it was; roundFaces asks, AFTER THE DRAWS, the
// things roundClear does not read, each as it is planned and built: the tree's own limbs (M1); every dormer (M2);
// the finger's great front and the fins at its foot (M3); every near range's overhang, gutters, ridge course,
// merlons and corbel table, the forecourt's and the back court's walls with their dress and parapets, the slot
// bridge's piers, the lane's court, the tower's round, the outer wall, the cats' walk, the ground's two sheets (M4);
// every buttress of every near range (M5); the keep's dress on its front and its wall of windows (mending 5, M3).
// A flier that roundClear lets fly and roundFaces does not takes another of its dealt ways, or SITS where it would
// have flown from (a wheeling rook of the finger, which has no seat, is left out); none is added and no stream
// draws a draw more or fewer. MENDING 5: a way MADE for a bird beyond its dealt ways (the tree's rooks alone have
// them) is its own dealt round at another heading, no steeper and no tighter than it was dealt; an owl whose seat
// stands in or through a solid is left out (seatInSolids). A ROOK OF THE FLOCK whose round would cross is made a
// sitter on EVERY seed, also where its flock never lifts (kept from mending 4: no round is left on a bird, flown
// or not, that crosses a face). MENDING 6: the solids an owl's seat is asked against hold the front's three
// openings too (openSolids); and A ROOK MADE TO SIT (on a quad's ridge, a roof, the parapet, the tree) IS ASKED
// WHETHER ITS SEAT IS CLEAR: one whose drawn body at rest is sunk in what is drawn about its seat does not sit
// there but is LEFT OUT, after its draws (seatSunk, asked in roofPlan after the line's say).
const SEAT_FREE = 1.5;
// M1: THE TREE'S LIMBS AS PLANNED: every limb, branch, twig and snag that is drawn, each length of it a round of its
// thicker end's radius about its axis, with TREE_AIR more; in the hero's own frame, by 4 m cells. A round is read
// at every TREE_STEP of its way (less than twice the air: between two readings that keep the air it enters no limb).
// MENDING 5, M4: THE AIR HOLDS THE WOOD'S SWAY. The wood gives in the wind (the stone shader moves a place of it by
// its give times (sin, 0.6 sin, cos) of three clocks: at the most TREE_SWAY times its give, in any direction); a
// length's give is the greater of its two ends' as buildHero lays it (a fifth of the limb's own at its root, the
// whole at its end; the trunk and the snags none), and that much more air is asked round it
const TREE_STEP = 0.2, TREE_AIR = 0.12, TREE_SWAY = Math.hypot(1, 0.6, 1);
function limbCells(P) {
  if (P.LC && P.LC.of === P.treeLimbs) return P.LC;
  const S = 4, cells = new Map(), sg = []; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
  for (const Lb of [...P.treeLimbs, ...(P.treeLimbs.stubs || [])]) {
    if (Lb.gone) continue;
    const give = Lb.level > 0 ? (Lb.sway || 0) * TREE_SWAY : 0, np = Lb.pts.length;
    for (let i = 0; i < np - 1; i++) {
      const a = Lb.pts[i], b = Lb.pts[i + 1], r = Math.max(Lb.rad[i], Lb.rad[i + 1]) + TREE_AIR + give * lerp(0.2, 1, (i + 1) / (np - 1)), k = sg.length / 7; sg.push(a[0], a[1], a[2], b[0], b[1], b[2], r);
      const ax = Math.min(a[0], b[0]) - r, bx = Math.max(a[0], b[0]) + r, ay = Math.min(a[1], b[1]) - r, by = Math.max(a[1], b[1]) + r, az = Math.min(a[2], b[2]) - r, bz = Math.max(a[2], b[2]) + r;
      x0 = Math.min(x0, ax); x1 = Math.max(x1, bx); y0 = Math.min(y0, ay); y1 = Math.max(y1, by); z0 = Math.min(z0, az); z1 = Math.max(z1, bz);
      for (let gx = Math.floor(ax / S); gx <= Math.floor(bx / S); gx++) for (let gy = Math.floor(ay / S); gy <= Math.floor(by / S); gy++) for (let gz = Math.floor(az / S); gz <= Math.floor(bz / S); gz++) {
        const key = ((gx + 512) * 1024 + gy + 512) * 1024 + gz + 512, l = cells.get(key); if (l) l.push(k); else cells.set(key, [k]); }
    }
  }
  return (P.LC = { of: P.treeLimbs, S, cells, sg: new Float64Array(sg), box: [x0, y0, z0, x1, y1, z1] });
}
export function roundInTree(P, b) {
  if (b.share >= 1 || !P.treeLimbs || !P.root) return false;
  const G = limbCells(P), B = G.box, sg = G.sg, S = G.S, T = P.T, h = b.home, rr = Math.abs(b.R) * 0.5 + Math.abs(b.H);
  // (the hero's frame: z out of the wall, x across it, y up from the trunk's axis at the root)
  const loc = (x, y, z, o) => { const dx = x - P.root[0], dz = z - P.root[1]; o[0] = dx * T[1] - dz * T[0]; o[1] = y - M.TREE_Y; o[2] = dx * T[0] + dz * T[1]; return o; };
  const c = loc(h[0] + Math.sin(b.yaw) * Math.abs(b.R) * 0.5, h[1] + b.H * 0.5, h[2] - Math.cos(b.yaw) * Math.abs(b.R) * 0.5, [0, 0, 0]);
  if (c[0] + rr < B[0] || c[0] - rr > B[3] || c[1] + rr < B[1] || c[1] - rr > B[4] || c[2] + rr < B[2] || c[2] - rr > B[5]) return false;
  const n = Math.min(8000, Math.max(12, Math.ceil(Math.PI * Math.hypot(b.R, b.H) / TREE_STEP))), q = [0, 0, 0], free = (SEAT_FREE - TREE_STEP / 2) ** 2;
  for (let i = 1; i < n; i++) {
    loopPoint(b, i / n, _rp);
    const ex = _rp[0] - h[0], ey = _rp[1] - h[1], ez = _rp[2] - h[2]; if (ex * ex + ey * ey + ez * ez < free) continue;
    loc(_rp[0], _rp[1], _rp[2], q); if (q[0] < B[0] || q[0] > B[3] || q[1] < B[1] || q[1] > B[4] || q[2] < B[2] || q[2] > B[5]) continue;
    const l = G.cells.get(((Math.floor(q[0] / S) + 512) * 1024 + Math.floor(q[1] / S) + 512) * 1024 + Math.floor(q[2] / S) + 512); if (!l) continue;
    for (let j = 0; j < l.length; j++) {
      const o = l[j] * 7, ax = sg[o], ay = sg[o + 1], az = sg[o + 2], vx = sg[o + 3] - ax, vy = sg[o + 4] - ay, vz = sg[o + 5] - az, wx = q[0] - ax, wy = q[1] - ay, wz = q[2] - az;
      const t = clamp((wx * vx + wy * vy + wz * vz) / Math.max(1e-9, vx * vx + vy * vy + vz * vz), 0, 1), dx = wx - vx * t, dy = wy - vy * t, dz = wz - vz * t;
      if (dx * dx + dy * dy + dz * dz < sg[o + 6] * sg[o + 6]) return true;
    }
  }
  return false;
}
// THE DRAWN THINGS roundClear DOES NOT READ, EACH AS A CONVEX SOLID OF ITS OWN FRAME (a row of 11 numbers: its
// middle x, z, its heading's cosine and sine, half its breadth and half its length, its foot and its head, and a
// roof's fall across (kx) and along past zr (kz): within it |lx| <= hx, |lz| <= hz, y0 <= y <= y1 - kx |lx| and
// y <= y1 - kz (|lz| - zr)). M2: every dormer, a gabled box from where its roof meets the range's own to its
// front. M4: every near range as rangeInto lays it: a pitched roof with its 0.6 m of overhang, its gutters, its
// ridge's course; a flat roof's merlons as a band along each edge, the corbel table of the keep's and the cliff's
// blocks. M5: every buttress stage of every near range. Mending 5, M3: the keep's dress (keepSolids). By 64 m cells
// of the plan, each in its middle's cell
// (a solid that is no such house, a stone of an arch or a round of many sides, has faces of its own beside: rows of
// four numbers, a, b, c, d, in the world's own frame: within it a x + b y + c z <= d; the row names the first and
// how many)
const FS_N = 13, FACE_STEP = 0.25, FACE_AIR = 0.03;
function faceSolids(P) {
  if (P.FS) return P.FS;
  const rows = [], X = [], add = (x, z, yaw, hx, hz, y0, y1, kx = 0, kz = 0, zr = 0, more = null) => { rows.push(x, z, Math.cos(yaw), Math.sin(yaw), hx, hz, y0, y1, kx, kz, zr, X.length, more ? more.length / 4 : 0); if (more) for (const v of more) X.push(v); };
  for (const m of P.ranges) {
    if (m.zone !== 0 || m.part === 'bridge' || m.part === 'sbridge') continue;
    const F = frameOf(m.x, m.z, m.yaw), at = (lx, lz, hx, hz, y0, y1, kx, kz, zr) => { const p = F(lx, 0, lz); add(p[0], p[2], m.yaw, hx, hz, y0, y1, kx, kz, zr); };
    for (const b of m.butts || []) add(b.x, b.z, b.yaw, b.hw, b.hl, b.y0, b.y1);
    if (m.roof === 2) {
      const h = 1.5 * (m.hw > 20 ? 1.6 : 1);
      for (const sx of [-1, 1]) { at(sx * (m.hw - 0.4), 0, 0.4, m.hl - 0.4, m.eave, m.eave + h); at(0, sx * (m.hl - 0.4), m.hw - 0.4, 0.4, m.eave, m.eave + h); }
      if (m.part === 'keep' || m.part === 'massB') at(0, 0, m.hw + 0.55, m.hl + 0.55, m.eave - 3.3, m.eave - 1.7);
      continue;
    }
    const oh = 0.6, rise = m.ridge - m.eave, k = rise / m.hw, ye = m.eave - oh * k, zl = m.hl + (m.roof === 0 ? oh : 0), zr = Math.max(0, m.hl + oh - (m.hw + oh) * 0.8);
    if (m.roof === 0) at(0, 0, m.hw + oh, zl, ye - 0.05, m.ridge, k, 0, 0);
    else at(0, 0, m.hw + oh, m.hl + oh, m.eave - 0.05, m.ridge, rise / (m.hw + oh), rise / Math.max(0.01, m.hl + oh - zr), zr);
    for (const sx of [-1, 1]) at(sx * (m.hw + oh + 0.225), 0, 0.225, zl, ye - 0.3, ye + 0.04);
    at(0, 0, 0.22, m.roof === 0 ? zl : zr, m.ridge - 0.12, m.ridge + 0.16);
  }
  // (d0, d1: where the dormers' rows begin and end: mending 6's seat law asks a dormer by its drawn triangles instead)
  const d0 = rows.length;
  for (const d of P.dormers) {
    const m = d.m, big = d.big || 1, xf = m.hw * 0.7, yb = roofY(m, xf), yt = yb + 1.7 * big, yr = yt + 0.8 * big, xr = m.hw * clamp((m.ridge - yr) / Math.max(0.01, m.ridge - m.eave), 0, 1), hz = d.wide + 0.2;
    const p = frameOf(m.x, m.z, m.yaw)(d.side * (xr + xf + 0.25) / 2, 0, d.lz);
    add(p[0], p[2], m.yaw, (xf + 0.25 - xr) / 2, hz, yb - 0.3, yr, 0, (yr - yt) / hz, 0);
  }
  const d1 = rows.length;
  frontSolids(P, add); courtSolids(P, add); wallSolids(P, add); keepSolids(P, add);
  // (a solid whose reach is 48 m and more, a court, the round, a great range's roof, is no cell's: each is asked of every round)
  const cells = new Map(), R = new Float64Array(rows), big = []; let rmax = 0;
  for (let i = 0; i < R.length; i += FS_N) {
    const r = Math.hypot(R[i + 4], R[i + 5]); if (r >= 48) { big.push(i); continue; }
    const k = (Math.floor(R[i] / 64) + 512) * 1024 + Math.floor(R[i + 1] / 64) + 512, l = cells.get(k); if (l) l.push(i); else cells.set(k, [i]); if (r > rmax) rmax = r;
  }
  return (P.FS = { R, X: new Float64Array(X), cells, rmax, big, d0, d1 });
}
// M4: THE GREAT WALLS AS courtsInto AND laneInto BUILD THEM (their own sums): the forecourt's block with the dress of
// its three faces (plinth, string, every buttress in its two stages) and its parapets (wall and merlons as one band);
// the back court's two blocks, its dressed face and parapets; the piers of the slot's bridge; the lane's court; the
// tower's round, a block of M.ROUND_N sides with a pier at every third length and the string under its edge, and
// the apron that joins it to the lane; the field's parapet, merlon by merlon
function courtSolids(P, add) {
  const q = P.quad, L = P.lane, F = P.finger;
  const bx = (wa, wb, ta, tb, y0, y1) => { const m = P.fromWT((wa + wb) / 2, (ta + tb) / 2); add(m[0], m[1], P.hA, Math.abs(tb - ta) / 2, Math.abs(wb - wa) / 2, y0, y1); };
  const dress = (wa, ta, wb, tb, ow, ot, y0, y) => {
    const len = Math.hypot(wb - wa, tb - ta), n = Math.max(2, Math.round(len / 13)), aw = (wb - wa) / len, at = (tb - ta) / len, yp = y0 + (y - y0) * 0.2, ym = y - 15;
    const run = (f0, f1, d0, d1, ya, yb) => bx(wa + aw * f0 + ow * d0, wa + aw * f1 + ow * d1, ta + at * f0 + ot * d0, ta + at * f1 + ot * d1, ya, yb);
    run(0, len, 0, 1.1, y0, yp); run(0, len, 0, 0.35, y - 2.6, y - 2.0);
    for (let k = 0; k <= n; k++) {
      const f = len * (k + (k > 0 && k < n ? (h1(k * 7.7 + len * 0.37 + wa * 0.11) - 0.5) * 0.6 : 0)) / n, h = 1.15 * (0.75 + 0.6 * h1(k * 3.1 + len * 0.7));
      run(f - h, f + h, 0, 2.0, y0, ym); run(f - h * 0.8, f + h * 0.8, 0, 1.1, ym, y - 2.6);
    }
  };
  const parapet = (w0, t0, w1, t1, y) => { const a = P.fromWT(w0, t0), b = P.fromWT(w1, t1); add((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], -(b[1] - a[1])), 0.45, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, y - 0.3, y + 2.0); };
  { const tf = q.t1 + M.NEAR_DEEP, w0 = q.mid - M.FORE_HALF, w1 = q.mid + M.FORE_HALF, t1 = tf + M.FORE_DEEP, y = M.QUAD_Y;
    bx(w0, w1, tf, t1, 20, y);
    dress(w0, tf + 6, w0, t1, -1, 0, 20, y); dress(w1, tf + 6, w1, t1, 1, 0, 20, y); dress(w0, t1, w1, t1, 0, 1, 20, y);
    parapet(w0 + 0.45, tf, w0 + 0.45, t1, y); parapet(w1 - 0.45, tf, w1 - 0.45, t1, y); parapet(w0, t1 - 0.45, w1, t1 - 0.45, y); }
  { const y = M.COURT_Y;
    bx(M.KEEP_W1, M.SLOT_W0, 0, M.COURT_T1, -24, y); bx(M.SLOT_W0, M.SLOT_W1, 0, M.SLOT_T0, -24, y);
    dress(M.KEEP_W1 + 12, M.COURT_T1, M.SLOT_W0, M.COURT_T1, 0, 1, -24, y);
    parapet(M.KEEP_W1 + 12, M.COURT_T1 - 0.45, M.SLOT_W0, M.COURT_T1 - 0.45, y); parapet(M.SLOT_W1 - 0.45, 0.5, M.SLOT_W1 - 0.45, M.SLOT_T0 - 0.5, y); }
  { const B = P.sbridge, w0 = M.SBRIDGE_W0, w1 = M.SBRIDGE_W1, y0 = M.COURT_Y, ys = M.SBRIDGE_SPRING, yf = B.eave - 6.5;
    for (const [ta, tb] of [[0, 3.6], [M.SLOT_T0 / 2 - 1.9, M.SLOT_T0 / 2 + 1.9], [M.SLOT_T0 - 3.6, M.SLOT_T0]]) {
      const m = P.fromWT((w0 + w1) / 2, (ta + tb) / 2), ht = (tb - ta) / 2, hw = (w1 - w0) / 2;
      add(m[0], m[1], P.hA, ht, hw + 0.7, y0, yf); add(m[0], m[1], P.hA, ht + 0.7, hw + 1.4, y0, y0 + 2.6); add(m[0], m[1], P.hA, ht + 0.35, hw + 1.0, ys - 0.5, ys + 0.3);
    } }
  { const y = L.y, ua = L.u0 + 4, ub = L.u1 - 4, mid = P.laneAt((ua + ub) / 2, 0); add(mid[0], mid[1], L.az, L.half, Math.abs(ua - ub) / 2, y - 44, y); }
  { const y = L.y, R = M.ROUND_R, NR = M.ROUND_N, NA = M.APRON_N, a0 = L.az + Math.PI, more = [];
    for (let k = 0; k < NR; k++) {
      const a = a0 + k / NR * TAU, b = a0 + (k + 1) / NR * TAU, am = a0 + (k + 0.5) / NR * TAU, ax = F.x + Math.sin(a) * R, az = F.z - Math.cos(a) * R, bxx = F.x + Math.sin(b) * R, bz = F.z - Math.cos(b) * R, nx = Math.sin(am), nz = -Math.cos(am);
      more.push(nx, 0, nz, nx * ax + nz * az);
      if (k < NA || k >= NR - NA) continue;
      if (k % 3 === 0) add(ax + nx * 0.5, az + nz * 0.5, am, 1.4, 1.2, y - 44, y - 2.4);
      add((ax + bxx) / 2, (az + bz) / 2, am, 0.3, Math.hypot(bxx - ax, bz - az) / 2, y - 2.4, y - 1.8);
    }
    add(F.x, F.z, 0, R, R, y - 44, y, 0, 0, 0, more);
    // (the apron between the lane's end and the round: a block of four sides, its two flanks the walls laneInto's
    // floor ends on; its other two sides lie within the round and against the lane)
    const half = L.half + L.deep + 4, ua = L.u1 - 4, rim = (k) => { const a = a0 + k / NR * TAU; return [F.x + Math.sin(a) * R, F.z - Math.cos(a) * R]; };
    const q = [P.laneAt(ua, half), rim(-NA), rim(NA), P.laneAt(ua, -half)], mx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, mz = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, ap = []; let rad = 0;
    for (let e = 0; e < 4; e++) {
      const a = q[e], b = q[(e + 1) % 4]; let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz); nx /= l; nz /= l;
      if (nx * (mx - a[0]) + nz * (mz - a[1]) > 0) { nx = -nx; nz = -nz; }
      ap.push(nx, 0, nz, nx * a[0] + nz * a[1]); rad = Math.max(rad, Math.abs(a[0] - mx), Math.abs(a[1] - mz));
    }
    add(mx, mz, 0, rad, rad, y - 44, y, 0, 0, 0, ap); }
  // (the field's parapet, merlon by merlon as fieldEdgeInto lays them: a broken one its stump, or nothing)
  for (const it of fieldParapet(P)) {
    const r = it.r, top = !it.broken ? r.y + 1.7 : it.hsh > 0.05 ? r.y + 0.3 + 5 * it.hsh : null;
    if (top !== null) add(it.x, it.z, r.w ? P.hA : P.hA + Math.PI / 2, 0.4, 0.75, r.y - 0.2, top);
  }
}
// M4: THE OUTER WALL AS outerWallInto BUILDS IT, length by length (its body, the course under its walk, the breast
// wall and merlons of either edge as one band, its two buttresses in their two stages), AND THE CATS' WALK: each
// length a wall whose head slopes with the cats' way, and the gatehouse at either end
function wallSolids(P, add) {
  const O = P.outer, seg = 36, hw = M.WALL_THICK / 2, Y = M.WALL_WALK;
  for (let i = -31; i < 31; i++) {
    const th = O.a0 + (i + 0.5) * seg / O.R, x = O.cx + Math.sin(th) * O.R, z = O.cz - Math.cos(th) * O.R, yaw = th + Math.PI / 2;
    add(x, z, yaw, hw, seg / 2 + 0.2, -6, Y - 0.7); add(x, z, yaw, hw + 0.3, seg / 2 + 0.2, Y - 0.7, Y);
    for (const sd of [-1, 1]) {
      const ra = O.R + sd * (hw - 0.4), pa = [O.cx + Math.sin(th - seg / 2 / O.R) * ra, O.cz - Math.cos(th - seg / 2 / O.R) * ra], pb = [O.cx + Math.sin(th + seg / 2 / O.R) * ra, O.cz - Math.cos(th + seg / 2 / O.R) * ra];
      add((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, yaw, 0.4, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) / 2, Y - 0.02, Y + 2.6);
    }
    for (const f of [-0.25, 0.25]) {
      const tb = th + f * seg / O.R, rb = O.R + hw + 1.5, top = 22 + 9 * h1(i * 3 + f * 8 + 5);
      add(O.cx + Math.sin(tb) * rb, O.cz - Math.cos(tb) * rb, tb, 1.5, 1.6, -6, top); add(O.cx + Math.sin(tb) * (rb + 2.4), O.cz - Math.cos(tb) * (rb + 2.4), tb, 1.3, 1.2, -6, top * 0.55);
    }
  }
  const pts = P.cats.pts, cw = P.cats.wide / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], yaw = Math.atan2(b[0] - a[0], -(b[2] - a[2])), e = Math.hypot(b[0] - a[0], b[2] - a[2]) / 2 + 0.6, mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2;
    const k = (b[1] - a[1]) / (2 * e), l = Math.hypot(1, k), c = Math.cos(yaw), sn = Math.sin(yaw);
    // (its head: y <= the middle's height + k times the place along it)
    add(mx, mz, yaw, cw, e, 20, Math.max(a[1], b[1]), 0, 0, 0, [-k * sn / l, 1 / l, k * c / l, ((a[1] + b[1]) / 2 - k * sn * mx + k * c * mz) / l]);
  }
  for (const [p, q] of [[pts[0], pts[1]], [pts[pts.length - 1], pts[pts.length - 2]]]) { const yaw = Math.atan2(q[0] - p[0], -(q[2] - p[2])), g = frameOf(p[0], p[2], yaw)(0, 0, -2.2); add(g[0], g[2], yaw, cw + 0.2, 2.4, 20, p[1] + 1.3); }
}
// MENDING 5, M3: THE KEEP'S DRESS AS keepDressInto AND keepGlassInto LAY IT (their own sums), which no list held (a
// round of the flock crossed a garderobe turret's corner). On the front: the door's steps, jambs, lintel and
// lantern; the string over each blind arcade; each garderobe turret (its shaft up to its weathering's head, as a
// buttress is asked, and its two corbels); the ledge and every corbel under it; the skins of ivy, arcade and
// doorway as slabs from the wall to their faces. On the second mass: the wall of windows, its skin of piers, bands
// and heads as one slab to the piers' faces (the lancets' openings with it), and every sill
function keepSolids(P, add) {
  const K = P.keep, Lg = K.ledge, g = K.glass, I = K.ivy, yq = M.QUAD_Y, tF = Lg.t;
  // (a block from the wall's face at t out to d0..d1 before it, between two places along the wall)
  const bx = (wa, wb, t, d0, d1, y0, y1) => { const m = P.fromWT((wa + wb) / 2, t + (d0 + d1) / 2); add(m[0], m[1], P.hA, (d1 - d0) / 2, (wb - wa) / 2, y0, y1); };
  for (const bay of K.bays || []) {
    const wm = (bay.a + bay.b) / 2;
    if (bay.use === 1) {
      const hd = Math.min(4.2, (bay.b - bay.a) / 2 - 0.3), yL = yq + 2.4;
      for (let j = 1; j <= 8; j++) bx(wm - hd, wm + hd, tF, 0, 2.4 + (8 - j) * 0.55, j === 1 ? yq - 0.1 : yq + (j - 1) * 0.3, yq + j * 0.3);
      bx(wm - 1.3, wm + 1.3, tF, 0, 0.07, yL, yL + 4.7);
      for (const sx of [-1, 1]) bx(wm + sx * 1.62 - 0.32, wm + sx * 1.62 + 0.32, tF, 0, 0.5, yL, yL + 3.1);
      bx(wm - 2.5, wm + 2.5, tF, 0, 0.45, yL + 4.9, yL + 5.5);
      bx(wm + 2.67, wm + 2.73, tF, 0, 0.8, yL + 3.2, yL + 3.48); bx(wm + 2.5, wm + 2.9, tF, 0.55, 0.95, yL + 2.6, yL + 3.2);
      continue;
    }
    if (bay.use === 3) { bx(bay.a - 1.5, bay.b + 1.5, tF, 0, 0.14, yq, yq + 15 + 9 * h1(wm * 0.37)); continue; }
    const wa = Math.ceil(bay.a / 3.5) * 3.5, wb = Math.floor(bay.b / 3.5) * 3.5;
    if (wb - wa >= 3.4) { bx(wa, wb, tF, 0, 0.08, yq, yq + 7.3); bx(bay.a - 0.5, bay.b + 0.5, tF, 0, 0.32, yq + 7.3, yq + 7.8); }
    if (bay.use === 2) {
      const y0 = Lg.y + 3.2;
      bx(wm - 1.25, wm + 1.25, tF, 0, 1.72, y0, K.base - 0.3);
      for (const sx of [-1, 1]) bx(wm + sx * 0.8 - 0.25, wm + sx * 0.8 + 0.25, tF, 0, 1.3, y0 - 1.4, y0);
    }
  }
  bx(Lg.w0, Lg.w1, tF, 0, 1.5, Lg.y - 0.1, Lg.y + 0.5);
  for (let w = Lg.w0 + 2; w < Lg.w1; w += 4) bx(w - 0.35, w + 0.35, tF, 0, 0.9, Lg.y - 1.2, Lg.y - 0.1);
  bx(I.w0, I.w1, tF, 0, 0.1, I.y0, I.y1);
  const n = g.n, bw = (g.w1 - g.w0) / n, D = 0.9, ww = 1.3, ym = (g.y0 + g.y1) / 2;
  bx(g.w0 - (bw - ww) / 2, g.w1 + (bw - ww) / 2, g.t, 0, D, g.y0 - 5, g.y1 + 4);
  for (let i = 0; i < n; i++) for (const ya of [g.y0, ym + 2.2]) { const w = g.w0 + bw * (i + 0.5); bx(w - ww / 2 - 0.2, w + ww / 2 + 0.2, g.t, 0, D + 0.32, ya - 0.34, ya); }
}
// M3: THE FINGER'S GREAT FRONT AS fingerInto BUILDS IT (its own sums): each pier's three stages, the broken stump over
// it in its three lifts, the twelve stones of the great arch (each a stone of four sides in the front's own plane,
// from the arch's back to its face), the stone at its point; and the six fins round the tower's foot with their feet
function frontSolids(P, add) {
  const F = P.finger, half = 2 / 44 * TAU, up = F.az + Math.PI, r0 = Math.cos(up), r1 = Math.sin(up), at = frameOf(F.x, F.z, up);
  const y0a = F.ringY - 10, y1a = F.ringY + 12, ra = F.rRing, cw = Math.cos(half) * ra, hw = Math.sin(half) * ra;
  const yf = P.lane.y, gx = hw + 5.2, gh = gx - 1.7, ysG = y1a + 16, RG = 2 * gh, front = cw + 2.6, backG = 21.5, bk = backG + 1.5, yS = ysG + 2;
  const box = (lx, lz0, lz1, hx, ya, yb) => { const p = at(lx, 0, (lz0 + lz1) / 2); add(p[0], p[2], up, hx, (lz1 - lz0) / 2, ya, yb); };
  for (const sx of [-1, 1]) {
    const hs = (k) => h1(k * 3.3 + sx * 1.7 + F.top0), hStump = F.front.stumps[sx < 0 ? 0 : 1], z0 = backG + 1, z1 = front - 0.9;
    box(sx * gx, backG, front + 2.0, 2.5, yf - 0.6, yf + 5.75); box(sx * gx, backG, front + 0.8, 2.1, yf + 5.75, y0a + 8); box(sx * gx, backG, front, 1.7, y0a + 8, yS);
    box(sx * gx, z0, z1, 1.2, yS, yS + hStump * 0.7); box(sx * gx, z0, lerp(z0, z1, 0.45 + 0.2 * hs(10)), 1.2, yS + hStump * 0.7, yS + hStump * (0.8 + 0.1 * hs(11)));
    box(sx * (gx + 0.5 * (hs(12) < 0.5 ? -1 : 1)), z0, z0 + 1.8, 0.7, yS + hStump * 0.7, yS + hStump);
    const arcG = (th, rad) => [sx * (rad * Math.cos(th) - gh), ysG + rad * Math.sin(th)];
    for (let k = 0; k < 6; k++) {
      const dep = 2.0 + 1.0 * h1(k * 5.1 + sx * 2.3 + F.top0), t0 = k / 6 * Math.PI / 3, t1 = (k + 1) / 6 * Math.PI / 3, q = [arcG(t0, RG), arcG(t1, RG), arcG(t1, RG + dep), arcG(t0, RG + dep)];
      const mx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, my = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, more = []; let xa = 1e9, xb = -1e9, ya = 1e9, yb = -1e9;
      for (let e = 0; e < 4; e++) {
        const a = q[e], b = q[(e + 1) % 4]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny); nx /= l; ny /= l;
        if (nx * (mx - a[0]) + ny * (my - a[1]) > 0) { nx = -nx; ny = -ny; }
        more.push(nx * r0, ny, nx * r1, nx * a[0] + ny * a[1] + nx * (F.x * r0 + F.z * r1));
        xa = Math.min(xa, a[0]); xb = Math.max(xb, a[0]); ya = Math.min(ya, a[1]); yb = Math.max(yb, a[1]);
      }
      const p = at((xa + xb) / 2, 0, (bk + front) / 2); add(p[0], p[2], up, (xb - xa) / 2, (front - bk) / 2, ya, yb, 0, 0, 0, more);
    }
  }
  { const ya = ysG + RG * Math.sin(Math.PI / 3); box(0, front - 1.4, front + 0.4, 1.1, ya - 0.8, ya + 2.9); }
  for (let k = 0; k < 6; k++) {
    const a = up + (k + 0.5) / 6 * TAU, drawn = 46 + 58 * h1(k * 5 + F.top0), rr = fingerR(F, drawn * 0.5) + 1.5, top = drawn < yf + 3 ? Math.min(drawn, yf - 0.6) : drawn, x = F.x + Math.sin(a) * rr, z = F.z - Math.cos(a) * rr;
    add(x, z, a, 3.2, 6.5, F.base, top); if (top > yf) add(x, z, a, 3.8, 7.1, yf - 0.6, yf + 1.5);
  }
}
// MENDING 6, M1: THE FRONT'S THREE OPENINGS AS fingerInto LAYS THEM (its own sums): each one's surround of worn
// stone, the sill slab under it, its leaf (walled up, boarded or dark) and a shuttered one's two battens. A LIST
// THAT STANDS FOR A DRAWN THING HOLDS ALL OF IT: these are the rows of solids the SEAT is asked against beside
// faceSolids' (seatInSolids). They are kept apart from faceSolids so that no round is asked anything new: the
// rounds are as they were, to the bird
function openSolids(P) {
  if (P.FO) return P.FO;
  const F = P.finger, up = F.az + Math.PI, y1a = F.ringY + 12, rows = [];
  const add = (x, z, yaw, hx, hz, y0, y1) => rows.push(x, z, Math.cos(yaw), Math.sin(yaw), hx, hz, y0, y1, 0, 0, 0, 0, 0);
  for (const o of F.front.open) {
    const ya = y1a + o.sill, yb = ya + o.h, W = fingerWall(F, (ya + yb) / 2), rr = Math.max(fingerWall(F, ya).r, W.r) + 0.12, th = up + o.x / rr, sn = Math.sin(th), cs = Math.cos(th), x = W.x + sn * rr, z = W.z - cs * rr;
    add(x, z, th, o.half + 0.45, 0.2, ya - 0.5, yb + 0.6); add(x + sn * 0.2, z - cs * 0.2, th, o.half + 0.7, 0.35, ya - 0.85, ya - 0.5); add(x + sn * 0.16, z - cs * 0.16, th, o.half, 0.1, ya, yb);
    if (o.state === 1) for (const f of [0.22, 0.74]) add(x + sn * 0.24, z - cs * 0.24, th, o.half, 0.05, lerp(ya, yb, f), lerp(ya, yb, f) + 0.22);
  }
  return (P.FO = new Float64Array(rows));
}
// DOES A FLIER'S ROUND CROSS A FACE OF ONE OF THEM, 1.5 m and more from its seat: the round is walked as the straight
// pieces between its places at every FACE_STEP of its way (the measure's own walk); each piece is cut against the
// solid's faces, FACE_AIR wider all round: where it goes in or comes out is a crossing
const _fn = [];
export function roundInSolids(P, b) {
  if (b.share >= 1) return false;
  const G = faceSolids(P), R = G.R, X = G.X, h = b.home, r = Math.abs(b.R) * 0.5, cx = h[0] + Math.sin(b.yaw) * r, cz = h[2] - Math.cos(b.yaw) * r, ring = b.kind !== 2 && b.R > 0;
  const yl = h[1] + Math.min(0, b.H) - 0.1, yh = h[1] + Math.max(0, b.H) + 0.1, reach = r + G.rmax + 1, near = _fn; near.length = 0;
  const x1 = Math.floor((cx + reach) / 64), z0 = Math.floor((cz - reach) / 64), z1 = Math.floor((cz + reach) / 64);
  for (let gx = Math.floor((cx - reach) / 64); gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
    const l = G.cells.get((gx + 512) * 1024 + gz + 512); if (!l) continue;
    for (let j = 0; j < l.length; j++) { const i = l[j]; if (R[i + 7] <= yl || R[i + 6] >= yh) continue; const rad = Math.hypot(R[i + 4], R[i + 5]), d = Math.hypot(R[i] - cx, R[i + 1] - cz); if (d < r + rad + 1 && (!ring || d + rad > r - 1)) near.push(i); }
  }
  for (let j = 0; j < G.big.length; j++) { const i = G.big[j]; if (R[i + 7] <= yl || R[i + 6] >= yh) continue; const rad = Math.hypot(R[i + 4], R[i + 5]), d = Math.hypot(R[i] - cx, R[i + 1] - cz); if (d < r + rad + 1 && (!ring || d + rad > r - 1)) near.push(i); }
  if (!near.length) return false;
  const n = Math.min(4000, Math.max(16, Math.ceil(Math.PI * Math.hypot(b.R, b.H) / FACE_STEP))), A = FACE_AIR, free2 = SEAT_FREE * SEAT_FREE;
  _pstamp++;
  // (each face as a plane: the piece's two ends over it by f0 and f1; tin: where it comes inside, tout: where it leaves)
  let tin = 0, tout = 1, miss = false;
  const cut = (f0, f1) => { if (f0 > 0) { if (f1 > 0) miss = true; else { const t = f0 / (f0 - f1); if (t > tin) tin = t; } } else if (f1 > 0) { const t = f0 / (f0 - f1); if (t < tout) tout = t; } };
  for (let a = 0; a < near.length; a++) {
    const i = near[a], sx = R[i], sz = R[i + 1], cs = R[i + 2], sn = R[i + 3], hx = R[i + 4] + A, hz = R[i + 5] + A, y0 = R[i + 6] - A, y1 = R[i + 7] + A, kx = R[i + 8], kz = R[i + 9], dz1 = y1 + kz * R[i + 10];
    const cnt = stepsBy(b, ring, r, cx, cz, n, sx, sz, Math.hypot(hx, hz) + 0.6, y1 + 0.3, 0);
    for (let j = 0; j < cnt; j++) {
      const k = _idx[j], o0 = stepPoint(b, k, n), ax = _pp[o0] - sx, ay = _pp[o0 + 1], az = _pp[o0 + 2] - sz, o1 = stepPoint(b, (k + 1) % n, n), bx = _pp[o1] - sx, by = _pp[o1 + 1], bz = _pp[o1 + 2] - sz;
      const u0 = ax * cs + az * sn, w0 = ax * sn - az * cs, u1 = bx * cs + bz * sn, w1 = bx * sn - bz * cs;
      tin = 0; tout = 1; miss = false;
      cut(u0 - hx, u1 - hx); if (!miss) cut(-u0 - hx, -u1 - hx); if (!miss) cut(w0 - hz, w1 - hz); if (!miss) cut(-w0 - hz, -w1 - hz); if (!miss) cut(y0 - ay, y0 - by); if (!miss) cut(ay - y1, by - y1);
      if (!miss && kx > 0) { cut(ay + kx * u0 - y1, by + kx * u1 - y1); if (!miss) cut(ay - kx * u0 - y1, by - kx * u1 - y1); }
      if (!miss && kz > 0) { cut(ay + kz * w0 - dz1, by + kz * w1 - dz1); if (!miss) cut(ay - kz * w0 - dz1, by - kz * w1 - dz1); }
      for (let e = R[i + 11], e1 = e + R[i + 12] * 4; e < e1 && !miss; e += 4) cut(X[e] * _pp[o0] + X[e + 1] * ay + X[e + 2] * _pp[o0 + 2] - X[e + 3] - A, X[e] * _pp[o1] + X[e + 1] * by + X[e + 2] * _pp[o1 + 2] - X[e + 3] - A);
      if (miss || tin > tout) continue;
      for (let e = 0; e < 2; e++) { const t = e ? tout : tin; if (t <= 0 || t >= 1) continue; const ex = _pp[o0] + (_pp[o1] - _pp[o0]) * t - h[0], ey = ay + (by - ay) * t - h[1], ez = _pp[o0 + 2] + (_pp[o1 + 2] - _pp[o0 + 2]) * t - h[2]; if (ex * ex + ey * ey + ez * ez >= free2) return true; }
    }
  }
  return false;
}
// M4: THE GROUND AS floorInto LAYS IT, ITS TWO SHEETS: the fine ground in 24 m squares, and the wide sheet under it
// in 180 m squares, 2.5 m lower at its corners, laid wherever a square of it is not whole within the fine ground's
// inner part (so the wide sheet lies under the castle's own edges too, and where the ground hollows it stands over
// the fine). Each square is two flat pieces, parted from its least corner to its greatest; a sheet's height at a
// place is read by its own squares, the corners' heights kept as they are asked for
function groundSheets(P) {
  if (P.GY) return P.GY;
  if (!P.floorY) planFloor(P);
  const [x0, x1, z0, z1] = P.box, c = 24, ax = Math.floor((x0 - 264) / c) * c, az = Math.floor((z0 - 264) / c) * c, bx = Math.ceil((x1 + 264) / c) * c, bz = Math.ceil((z1 + 264) / c) * c;
  return (P.GY = [{ ox: ax, oz: az, cell: c, drop: 0, nodes: new Map(), hole: null }, { ox: Math.round((x0 + x1) / 2) - 3240, oz: Math.round((z0 + z1) / 2) - 3240, cell: 180, drop: 2.5, nodes: new Map(), hole: [ax + 180, bx - 180, az + 180, bz - 180] }]);
}
function sheetNode(P, S, a, c) { const k = (a + 512) * 4096 + c + 512; let y = S.nodes.get(k); if (y === undefined) S.nodes.set(k, (y = Math.fround(P.floorY(S.ox + a * S.cell, S.oz + c * S.cell) - S.drop))); return y; }
// (a sheet's height at a place; -1e9 where that square of the sheet is not laid)
function sheetAt(P, S, x, z) {
  const u = (x - S.ox) / S.cell, v = (z - S.oz) / S.cell, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, H = S.hole;
  if (H && S.ox + i * S.cell >= H[0] && S.ox + (i + 1) * S.cell <= H[1] && S.oz + j * S.cell >= H[2] && S.oz + (j + 1) * S.cell <= H[3]) return -1e9;
  const ya = sheetNode(P, S, i, j), yc = sheetNode(P, S, i + 1, j + 1);
  if (fu >= fv) { const yb = sheetNode(P, S, i + 1, j); return ya + (yb - ya) * fu + (yc - yb) * fv; }
  const yd = sheetNode(P, S, i, j + 1); return ya + (yc - yd) * fu + (yd - ya) * fv;
}
// DOES A FLIER'S ROUND GO THROUGH THE GROUND, 1.5 m and more from its seat: walked as roundInSolids walks it; every
// piece is read at its two ends and wherever it passes from one flat piece of a sheet to the next (between two such
// places the sheet under it is one flat piece: it is read at their middle's square), and a change of side is a crossing
const _gn = [0, 0, 0, 0, 0];
export function roundInGround(P, b) {
  if (b.share >= 1) return false;
  const h = b.home, r = Math.abs(b.R) * 0.5, cx = h[0] + Math.sin(b.yaw) * r, cz = h[2] - Math.cos(b.yaw) * r, low = h[1] + Math.min(0, b.H);
  const n = Math.min(4000, Math.max(16, Math.ceil(Math.PI * Math.hypot(b.R, b.H) / FACE_STEP))), free2 = SEAT_FREE * SEAT_FREE, ts = _gn; let walked = false;
  for (const S of groundSheets(P)) {
    // (the sheet's highest corner under the round's own square: a round that stays over it is not walked)
    const c = S.cell, i1 = Math.floor((cx + r - S.ox) / c) + 1, j0 = Math.floor((cz - r - S.oz) / c), j1 = Math.floor((cz + r - S.oz) / c) + 1; let top = -1e9;
    for (let i = Math.floor((cx - r - S.ox) / c); i <= i1; i++) for (let j = j0; j <= j1; j++) { const y = sheetNode(P, S, i, j); if (y > top) top = y; }
    if (low > top + 0.1) continue;
    if (!walked) { _pstamp++; walked = true; }
    for (let k = 0; k < n; k++) {
      const o0 = stepPoint(b, k, n), ax = _pp[o0], ay = _pp[o0 + 1], az = _pp[o0 + 2], o1 = stepPoint(b, (k + 1) % n, n), bx = _pp[o1], by = _pp[o1 + 1], bz = _pp[o1 + 2];
      if (ay > top + 0.1 && by > top + 0.1) continue;
      const u0 = (ax - S.ox) / c, u1 = (bx - S.ox) / c, v0 = (az - S.oz) / c, v1 = (bz - S.oz) / c; let m = 1; ts[0] = 0;
      for (let e = 0; e < 3; e++) { const p = e === 0 ? u0 : e === 1 ? v0 : u0 - v0, q = e === 0 ? u1 : e === 1 ? v1 : u1 - v1, fp = Math.floor(p), fq = Math.floor(q); if (fp !== fq) { const t = (Math.max(fp, fq) - p) / (q - p); if (t > 0 && t < 1) ts[m++] = t; } }
      ts[m++] = 1;
      for (let a = 1; a < m - 1; a++) for (let e = a + 1; e < m - 1; e++) if (ts[e] < ts[a]) { const t = ts[a]; ts[a] = ts[e]; ts[e] = t; }
      for (let a = 1; a < m; a++) {
        // (the flat piece between two such places: both ends are read by the square of their middle)
        const ta = ts[a - 1], tb = ts[a], tm = (ta + tb) / 2, mx = ax + (bx - ax) * tm, mz = az + (bz - az) * tm, g = sheetAt(P, S, mx, mz); if (g < -1e8) continue;
        const i = Math.floor((mx - S.ox) / c), j = Math.floor((mz - S.oz) / c), fu = (mx - S.ox) / c - i, fv = (mz - S.oz) / c - j, ya = sheetNode(P, S, i, j), yc = sheetNode(P, S, i + 1, j + 1), yb = sheetNode(P, S, i + 1, j), yd = sheetNode(P, S, i, j + 1);
        const gx = fu >= fv ? yb - ya : yc - yd, gz = fu >= fv ? yc - yb : yd - ya, at = (t) => ay + (by - ay) * t - (ya + gx * ((ax + (bx - ax) * t - S.ox) / c - i) + gz * ((az + (bz - az) * t - S.oz) / c - j)) - FACE_AIR;
        const d0 = at(ta), d1 = at(tb);
        if ((d0 > 0) !== (d1 > 0)) { const tc = ta + (tb - ta) * d0 / (d0 - d1), ex = ax + (bx - ax) * tc - h[0], ey = ay + (by - ay) * tc - h[1], ez = az + (bz - az) * tc - h[2]; if (ex * ex + ey * ey + ez * ez >= free2) return true; }
      }
    }
  }
  return false;
}
export function roundFaces(P, b, own = null) { return roundInTree(P, b) || roundInSolids(P, b) || roundInGround(P, b); }
// MENDING 5, M2: A SEAT INSIDE A DRAWN SOLID IS NO SEAT. A SITTING BIRD'S WHOLE BODY AS makeBirds DRAWS IT on its
// perch (stood up by 0.6 of a radian, lifted 0.22, bobbing 0.02, its wings folded; all times its size): from 0.06
// under its seat (the corners of its tail, at the bob's lowest) to 0.41 over it (its beak), and no further from the
// seat's upright than 0.39 (the tail's corners). The ball about a place SIT_UP of its size over the seat, of
// SIT_REACH of its size, holds the whole of it at any heading.
// seatInSolids: does such a ball stand in or through a solid of faceSolids or (mending 6, M1) of the front's three
// openings (openSolids): each face of the solid moved out by the ball's radius (at a solid's corner that is a
// little more than the ball's true reach: refused there too). With a radius under nought (mending 6, M2) it asks
// whether a place stands that deep inside a solid, by its sides and its head
export const SIT_UP = 0.175, SIT_REACH = 0.46;
export function seatInSolids(P, x, y, z, r, noDormers = false) {
  const G = faceSolids(P), X = G.X, reach = G.rmax + r, d0 = noDormers ? G.d0 : 0, d1 = noDormers ? G.d1 : 0;
  const holds = (R, i) => {
    if (y - r >= R[i + 7] || y + r <= R[i + 6]) return false;
    const dx = x - R[i], dz = z - R[i + 1], u = Math.abs(dx * R[i + 2] + dz * R[i + 3]), w = Math.abs(dx * R[i + 3] - dz * R[i + 2]), kx = R[i + 8], kz = R[i + 9];
    if (u >= R[i + 4] + r || w >= R[i + 5] + r) return false;
    if (kx > 0 && y + kx * u >= R[i + 7] + r * Math.hypot(1, kx)) return false;
    if (kz > 0 && y + kz * (w - R[i + 10]) >= R[i + 7] + r * Math.hypot(1, kz)) return false;
    for (let e = R[i + 11], e1 = e + R[i + 12] * 4; e < e1; e += 4) if (X[e] * x + X[e + 1] * y + X[e + 2] * z >= X[e + 3] + r) return false;
    return true;
  };
  const x1 = Math.floor((x + reach) / 64), z0 = Math.floor((z - reach) / 64), z1 = Math.floor((z + reach) / 64);
  for (let gx = Math.floor((x - reach) / 64); gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
    const l = G.cells.get((gx + 512) * 1024 + gz + 512); if (l) for (let j = 0; j < l.length; j++) if ((l[j] < d0 || l[j] >= d1) && holds(G.R, l[j])) return true;
  }
  for (let j = 0; j < G.big.length; j++) if ((G.big[j] < d0 || G.big[j] >= d1) && holds(G.R, G.big[j])) return true;
  // (mending 6, M1: and the front's three openings, whole)
  const O = openSolids(P); for (let i = 0; i < O.length; i += FS_N) if (holds(O, i)) return true;
  return false;
}
// ---------------------------------------------------------------- MENDING 6, M2: A BIRD MADE TO SIT IS ASKED WHETHER
// ITS SEAT IS CLEAR. Mendings 4 and 5 make a bird sit at its home when it has no clear way. Such a bird (and no
// other) is asked BY ITS OWN DRAWN BODY AT REST against what is drawn about its seat: if any of its body's 19
// corners stands more than SEAT_STONE (0.05 m) inside slate, stone, paving or timber of a building, or more than
// SEAT_WOOD (0.15 m) inside the dead tree's own wood at rest (twigs and forks stand about every seat there: the
// tree's own allowance), it is LEFT OUT, after its draws: it has no clear way and no clear seat. No bird moves.
// HOW DEEP A CORNER STANDS (seatSunk): (1) by the drawn triangles about the seat, laid here again by their makers'
// own sums (a dormer as dormersInto lays it; its own ridge's course and the near ranges' gutters, which are troughs
// open above, as rangeInto lays them; the tree's limbs as tubeInto): of the triangles it stands BEHIND, square
// behind (the foot of its perpendicular lies in the triangle) and no further than SEAT_REACH, with no other of
// them between it and that foot, the nearest: that far, stone and wood apart; BY THE NEAREST FACE as well: the
// nearest of those triangles, by its nearest place, shows the corner its back from further than the allowance
// (asked beside the first reading because a reader may measure so: it also takes a corner that stands beside a
// slate's open edge or a twig, under that face's own flat; on a roof it is not asked where the bird's own roof
// lies nearer under the corner than that face); and BURIED beyond that reach in a
// dormer: the first of the dormers' triangles straight over the corner shows it its back from more than
// SEAT_REACH, square to it; (2) in a solid of the lists (faceSolids, the front's openings), by its sides and its
// head, more than SEAT_STONE: the dormers' rows are passed by (a dormer's back stands open where its roof rises
// over the range's ridge: its row holds air there that the drawn dormer does not, and (1) asks the dormer as it
// is drawn); (3) under the ground's own sheets by more than SEAT_STONE, square to the sheet; (4) BURIED in a
// limb: more than SEAT_DEEP under the flats of its drawn sides by the limb's own round (its axis and radii), however
// deep: the triangles' reading (1) reaches SEAT_REACH into the wood and this one takes over well within that (the
// round is the limb's own sum, a few centimetres off the drawn tube where a limb bends: it is not asked at the bar).
// THE BODY AT REST: the 19 corners of makeBirds' 15 triangles as its shader lays a perched bird (its wings folded
// to 0.4 of their span at -1.25 of a radian, stood up 0.6 of a radian, lifted 0.22: the bob at its middle), in
// the bird's own frame (across, up, forward), to be multiplied by its size
const SEAT_STONE = 0.05, SEAT_WOOD = 0.15, SEAT_REACH = 0.8, SEAT_DEEP = 0.5;
const SEAT_CORNERS = (() => {
  const c = [[0, 0, 0.3, 0], [0, 0, -0.26, 0], [0, 0.07, 0.02, 0], [0, -0.06, 0.02, 0], [-0.075, 0, 0.02, 0], [0.075, 0, 0.02, 0], [0, 0.01, -0.2, 0], [0.1, 0, -0.46, 0], [-0.1, 0, -0.46, 0]], cs = Math.cos(0.6), sn = Math.sin(0.6);
  for (const s of [-1, 1]) c.push([s * 0.07, 0.01, 0.13, s], [s * 0.07, 0.01, -0.1, s], [s * 0.32, 0.01, -0.13, s], [s * 0.32, 0.01, 0.15, s], [s * 0.56, 0.01, -0.04, s]);
  return c.map(([x, y, z, w]) => { if (w) { const span = Math.abs(x) - 0.07; x = w * (0.07 + span * 0.4 * Math.cos(-1.25)); y += span * 0.4 * Math.sin(-1.25); } return [x, y * cs + z * sn + 0.22, z * cs - y * sn]; });
})();
// (the triangles about one seat: nine numbers each, its unit normal by its winding, 1 if it is the tree's wood)
let _sT = new Float64Array(9 * 512), _sN = new Float64Array(3 * 512), _sW = new Uint8Array(512), _sn = 0;
function seatTri(a, b, c, wood = 0) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz);
  if (l < 1e-12) return;
  if (_sn * 9 >= _sT.length) { const t = new Float64Array(_sT.length * 2), n = new Float64Array(_sN.length * 2), w = new Uint8Array(_sW.length * 2); t.set(_sT); n.set(_sN); w.set(_sW); _sT = t; _sN = n; _sW = w; }
  const o = _sn * 9; _sT[o] = a[0]; _sT[o + 1] = a[1]; _sT[o + 2] = a[2]; _sT[o + 3] = b[0]; _sT[o + 4] = b[1]; _sT[o + 5] = b[2]; _sT[o + 6] = c[0]; _sT[o + 7] = c[1]; _sT[o + 8] = c[2];
  _sN[_sn * 3] = nx / l; _sN[_sn * 3 + 1] = ny / l; _sN[_sn * 3 + 2] = nz / l; _sW[_sn++] = wood;
}
// (a triangle and a flat quad whose outside is toward (ox, oy, oz): the winding is found, as triOut and quadOut find it)
function seatTriOut(a, b, c, ox, oy, oz) {
  const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (nx * ox + ny * oy + nz * oz >= 0) seatTri(a, b, c); else seatTri(a, c, b);
}
function seatQuadOut(a, b, c, d, ox, oy, oz) {
  const nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]), ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]), nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
  if (nx * ox + ny * oy + nz * oz >= 0) { seatTri(a, b, c); seatTri(a, c, d); } else { seatTri(a, d, c); seatTri(a, c, b); }
}
// does the straight piece from a place to another pass through triangle o of the seat's, between its ends
function seatCut(px, py, pz, qx, qy, qz, o) {
  const T = _sT, ax = T[o], ay = T[o + 1], az = T[o + 2], e1x = T[o + 3] - ax, e1y = T[o + 4] - ay, e1z = T[o + 5] - az, e2x = T[o + 6] - ax, e2y = T[o + 7] - ay, e2z = T[o + 8] - az, dx = qx - px, dy = qy - py, dz = qz - pz;
  const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x, det = e1x * hx + e1y * hy + e1z * hz; if (Math.abs(det) < 1e-14) return false;
  const f = 1 / det, sx = px - ax, sy = py - ay, sz = pz - az, u = f * (sx * hx + sy * hy + sz * hz); if (u < 0 || u > 1) return false;
  const gx = sy * e1z - sz * e1y, gy = sz * e1x - sx * e1z, gz = sx * e1y - sy * e1x, v = f * (dx * gx + dy * gy + dz * gz); if (v < 0 || u + v > 1) return false;
  const t = f * (e2x * gx + e2y * gy + e2z * gz); return t > 1e-6 && t < 1 - 1e-6;
}
// the true distance from a place to triangle o of the seat's (to its nearest place)
function seatDist(x, y, z, o) {
  const T = _sT, ax = T[o], ay = T[o + 1], az = T[o + 2], e1x = T[o + 3] - ax, e1y = T[o + 4] - ay, e1z = T[o + 5] - az, e2x = T[o + 6] - ax, e2y = T[o + 7] - ay, e2z = T[o + 8] - az, wx = x - ax, wy = y - ay, wz = z - az;
  const d1 = e1x * wx + e1y * wy + e1z * wz, d2 = e2x * wx + e2y * wy + e2z * wz; if (d1 <= 0 && d2 <= 0) return Math.hypot(wx, wy, wz);
  const bx = wx - e1x, by = wy - e1y, bz = wz - e1z, d3 = e1x * bx + e1y * by + e1z * bz, d4 = e2x * bx + e2y * by + e2z * bz; if (d3 >= 0 && d4 <= d3) return Math.hypot(bx, by, bz);
  const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return Math.hypot(wx - v * e1x, wy - v * e1y, wz - v * e1z); }
  const cx = wx - e2x, cy = wy - e2y, cz = wz - e2z, d5 = e1x * cx + e1y * cy + e1z * cz, d6 = e2x * cx + e2y * cy + e2z * cz; if (d6 >= 0 && d5 <= d6) return Math.hypot(cx, cy, cz);
  const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return Math.hypot(wx - w * e2x, wy - w * e2y, wz - w * e2z); }
  const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return Math.hypot(bx - w * (e2x - e1x), by - w * (e2y - e1y), bz - w * (e2z - e1z)); }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return Math.hypot(wx - e1x * v - e2x * w, wy - e1y * v - e2y * w, wz - e1z * v - e2z * w);
}
// how deep a place stands behind the seat's triangles: _sd[0] in stone, _sd[1] in the tree's wood (nought: in none);
// and BY THE NEAREST FACE: _sr[0] (stone), _sr[1] (wood): how far the nearest of the seat's triangles is, by its
// nearest place and within SEAT_REACH, if that triangle shows the place its back (every one of them that is as
// near, to a hair); nought if it shows its face or none is that near
const _sd = [0, 0], _sr = [0, 0], _sc = [];
function seatDeep(x, y, z) {
  const T = _sT, N = _sN, c = _sc; c.length = 0; _sd[0] = 0; _sd[1] = 0; _sr[0] = 0; _sr[1] = 0;
  let rm = SEAT_REACH, ri = -1, rback = true;
  for (let i = 0; i < _sn; i++) {
    const o = i * 9, nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2], s = nx * (x - T[o]) + ny * (y - T[o + 1]) + nz * (z - T[o + 2]);
    if (Math.abs(s) <= rm + 1e-7) { const q = seatDist(x, y, z, o); if (q < rm - 1e-7) { rm = q; ri = i; rback = s < 0; } else if (q <= rm + 1e-7) { rback = rback && s < 0; if (ri < 0) ri = i; } }
    if (s >= -1e-6 || s < -SEAT_REACH) continue;
    const fx = x - s * nx, fy = y - s * ny, fz = z - s * nz, e1x = T[o + 3] - T[o], e1y = T[o + 4] - T[o + 1], e1z = T[o + 5] - T[o + 2], e2x = T[o + 6] - T[o], e2y = T[o + 7] - T[o + 1], e2z = T[o + 8] - T[o + 2], wx = fx - T[o], wy = fy - T[o + 1], wz = fz - T[o + 2];
    const d11 = e1x * e1x + e1y * e1y + e1z * e1z, d12 = e1x * e2x + e1y * e2y + e1z * e2z, d22 = e2x * e2x + e2y * e2y + e2z * e2z, w1 = wx * e1x + wy * e1y + wz * e1z, w2 = wx * e2x + wy * e2y + wz * e2z, den = d11 * d22 - d12 * d12; if (den < 1e-18) continue;
    const u = (d22 * w1 - d12 * w2) / den, v = (d11 * w2 - d12 * w1) / den; if (u < -1e-6 || v < -1e-6 || u + v > 1 + 1e-6) continue;
    c.push([-s, i, fx, fy, fz]);
  }
  c.sort((p, q) => p[0] - q[0]);
  for (let k = 0, got = 0; k < c.length && got !== 3; k++) {
    const [d, i, fx, fy, fz] = c[k], w = _sW[i]; if (got & (1 << w)) continue;
    let clear = true; for (let j = 0; j < _sn && clear; j++) if (j !== i && seatCut(x, y, z, fx, fy, fz, j * 9)) clear = false;
    if (clear) { _sd[w] = d; got |= 1 << w; }
  }
  if (ri >= 0 && rback) _sr[_sW[ri]] = rm;
}
// THE DRAWN THINGS ABOUT A SEAT, laid again as triangles by their makers' own sums; rr: how far from the seat is asked
// (a dormer as dormersInto lays it: its front and gable, its two cheeks, its two slates, its pane)
function seatDormers(P, h, rr) {
  for (const d of P.dormers) {
    const m = d.m, c = Math.cos(m.yaw), s = Math.sin(m.yaw), dx = h[0] - m.x, dz = h[2] - m.z, sx = d.side, X = sx * (dx * c + dz * s);
    if (Math.abs(dx * s - dz * c - d.lz) > d.wide + 0.2 + rr || X < -rr || X > m.hw * 0.7 + 0.25 + rr) continue;
    const F = (lx, y, lz) => [m.x + lx * c + lz * s, y, m.z + lx * s - lz * c], xf = sx * m.hw * 0.7, yb = roofY(m, xf), big = d.big || 1, yt = yb + 1.7 * big, yr = yt + 0.8 * big;
    if (h[1] - rr > yr || h[1] + rr < yb - 0.3) continue;
    const xAt = (y) => sx * m.hw * clamp((m.ridge - y) / Math.max(0.01, m.ridge - m.eave), 0, 1), xw = xAt(yt), xr = xAt(yr), z0 = d.lz - d.wide, z1 = d.lz + d.wide;
    seatQuadOut(F(xf, yb - 0.3, z0), F(xf, yb - 0.3, z1), F(xf, yt, z1), F(xf, yt, z0), sx * c, 0, sx * s);
    seatTriOut(F(xf, yt, z0), F(xf, yt, z1), F(xf, yr, d.lz), sx * c, 0, sx * s);
    seatTriOut(F(xf, yb - 0.3, z0), F(xf, yt, z0), F(xw, yt, z0), -s, 0, c); seatTriOut(F(xf, yb - 0.3, z1), F(xf, yt, z1), F(xw, yt, z1), s, 0, -c);
    seatQuadOut(F(xf + sx * 0.25, yt, z0 - 0.2), F(xf + sx * 0.25, yr, d.lz), F(xr, yr, d.lz), F(xw, yt, z0 - 0.2), -s, 1, c);
    seatQuadOut(F(xf + sx * 0.25, yt, z1 + 0.2), F(xf + sx * 0.25, yr, d.lz), F(xr, yr, d.lz), F(xw, yt, z1 + 0.2), s, 1, -c);
    seatQuadOut(F(xf + sx * 0.04, yb + 0.35 * big, z0 + 0.28 * big), F(xf + sx * 0.04, yb + 0.35 * big, z1 - 0.28 * big), F(xf + sx * 0.04, yt - 0.12, z1 - 0.28 * big), F(xf + sx * 0.04, yt - 0.12, z0 + 0.28 * big), sx * c, 0, sx * s);
  }
}
// (the ridge's own course of stone on a near range's pitched roof, as rangeInto lays it: a box with its lid)
function seatRidge(m) {
  if (m.zone !== 0 || m.roof === 2) return;
  const oh = 0.6, zl = m.hl + (m.roof === 0 ? oh : 0), hl = m.roof === 0 ? zl : Math.max(0, m.hl + oh - (m.hw + oh) * 0.8), c = Math.cos(m.yaw), s = Math.sin(m.yaw), q = [];
  for (let k = 0; k < 8; k++) { const lx = (k & 3) < 2 ? 0.22 : -0.22, lz = (k & 3) === 1 || (k & 3) === 2 ? hl : -hl; q.push([m.x + lx * c + lz * s, k < 4 ? m.ridge - 0.12 : m.ridge + 0.16, m.z + lx * s - lz * c]); }
  seatQuadOut(q[0], q[1], q[5], q[4], c, 0, s); seatQuadOut(q[3], q[2], q[6], q[7], -c, 0, -s); seatQuadOut(q[2], q[1], q[5], q[6], s, 0, -c); seatQuadOut(q[3], q[0], q[4], q[7], -s, 0, c); seatQuadOut(q[7], q[4], q[5], q[6], 0, 1, 0);
}
// (the two gutters of every near pitched range about the seat, as rangeInto lays them: the trough's water and its outer
// wall; a trough has no inner wall, no ends and no bed)
function seatGutters(P, h, rr) {
  for (const m of P.ranges) {
    if (m.zone !== 0 || m.roof === 2 || m.part === 'bridge' || m.part === 'sbridge') continue;
    const dx = h[0] - m.x, dz = h[2] - m.z, far = m.hw + m.hl + 2 + rr; if (Math.abs(dx) > far || Math.abs(dz) > far) continue;
    const c = Math.cos(m.yaw), s = Math.sin(m.yaw), lx = dx * c + dz * s, lz = dx * s - dz * c, oh = 0.6, ye = m.eave - oh * (m.ridge - m.eave) / m.hw, zl = m.hl + (m.roof === 0 ? oh : 0), xg = m.hw + oh;
    if (Math.abs(lz) > zl + rr || h[1] - rr > ye + 0.04 || h[1] + rr < ye - 0.3) continue;
    const F = (x, y, z) => [m.x + x * c + z * s, y, m.z + x * s - z * c];
    for (const sx of [-1, 1]) {
      if (Math.abs(lx - sx * (xg + 0.225)) > 0.225 + rr) continue;
      const x0 = sx * xg, x1 = sx * (xg + 0.45);
      seatQuadOut(F(x0, ye - 0.04, -zl), F(x1, ye - 0.04, -zl), F(x1, ye - 0.04, zl), F(x0, ye - 0.04, zl), 0, 1, 0);
      seatQuadOut(F(x1, ye - 0.3, -zl), F(x1, ye - 0.3, zl), F(x1, ye + 0.04, zl), F(x1, ye + 0.04, -zl), sx * c, 0, sx * s);
    }
  }
}
// (is a place BURIED under the first n of the seat's triangles (the dormers'): the first of them straight over it shows
// it its back, and lies more than SEAT_REACH over it, square to itself)
function seatUnder(x, y, z, n) {
  const T = _sT; let um = 1e9, ui = -1;
  for (let i = 0; i < n; i++) {
    const o = i * 9, e1x = T[o + 3] - T[o], e1z = T[o + 5] - T[o + 2], e2x = T[o + 6] - T[o], e2z = T[o + 8] - T[o + 2], det = e1x * e2z - e1z * e2x; if (Math.abs(det) < 1e-12) continue;
    const wx = x - T[o], wz = z - T[o + 2], u = (wx * e2z - wz * e2x) / det, v = (e1x * wz - e1z * wx) / det; if (u < 0 || v < 0 || u + v > 1) continue;
    const up = T[o + 1] + u * (T[o + 4] - T[o + 1]) + v * (T[o + 7] - T[o + 1]) - y; if (up > 0 && up < um) { um = up; ui = i; }
  }
  return ui >= 0 && _sN[ui * 3 + 1] > 0 && um * _sN[ui * 3 + 1] > SEAT_REACH;
}
// (how deep a place lies under the ground's two sheets as floorInto lays them, square to the sheet; nought over them)
function groundDeep(P, x, y, z) {
  let d = 0;
  for (const S of groundSheets(P)) {
    const g = sheetAt(P, S, x, z); if (g <= y) continue;
    const c = S.cell, i = Math.floor((x - S.ox) / c), j = Math.floor((z - S.oz) / c), fu = (x - S.ox) / c - i, fv = (z - S.oz) / c - j, ya = sheetNode(P, S, i, j), yc = sheetNode(P, S, i + 1, j + 1), yb = sheetNode(P, S, i + 1, j), yd = sheetNode(P, S, i, j + 1);
    d = Math.max(d, (g - y) / Math.hypot(1, (fu >= fv ? yb - ya : yc - yd) / c, (fu >= fv ? yc - yb : yd - ya) / c));
  }
  return d;
}
// (the dead tree's limbs about the seat, in the hero's own frame, as tubeInto lays them: rings of its sides, their
// frame carried along the limb from its root; q: the seat in that frame. _sl: each length laid, for the round's own
// reading: its two ends, their radii, and the share of a radius that lies under the flats of its drawn sides)
const _rings = new WeakMap(), _sl = [];
function limbRings(Lb) {
  let ring = _rings.get(Lb); if (ring) return ring;
  const pts = Lb.pts, n = pts.length; ring = [];
  let ux = 0, uy = 1, uz = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l, tz = (b[2] - a[2]) / l;
    if (i === 0 && Math.abs(ty) > 0.9) { ux = 1; uy = 0; }
    const d = ux * tx + uy * ty + uz * tz; ux -= tx * d; uy -= ty * d; uz -= tz * d; const m = Math.hypot(ux, uy, uz) || 1; ux /= m; uy /= m; uz /= m;
    ring.push([ux, uy, uz, ty * uz - tz * uy, tz * ux - tx * uz, tx * uy - ty * ux]);
  }
  _rings.set(Lb, ring); return ring;
}
function seatLimbs(P, q, rr) {
  _sl.length = 0;
  const lay = (Lb, sides, flat) => {
    const pts = Lb.pts, rad = Lb.rad, n = pts.length; let ring = null;
    const vert = (i, j) => { const a = j / sides * TAU, ca = Math.cos(a), sa = Math.sin(a), f = ring[i], r = rad[i], fl = flat && ca > 0 ? 1 - flat * ca : 1; return [pts[i][0] + (f[0] * ca * fl + f[3] * sa) * r, pts[i][1] + (f[1] * ca * fl + f[4] * sa) * r, pts[i][2] + (f[2] * ca * fl + f[5] * sa) * r]; };
    for (let i = 0; i < n - 1; i++) {
      const a = pts[i], b = pts[i + 1], vx = b[0] - a[0], vy = b[1] - a[1], vz = b[2] - a[2], wx = q[0] - a[0], wy = q[1] - a[1], wz = q[2] - a[2], t = clamp((wx * vx + wy * vy + wz * vz) / Math.max(1e-9, vx * vx + vy * vy + vz * vz), 0, 1), reach = rr + Math.max(rad[i], rad[i + 1]);
      if ((wx - vx * t) ** 2 + (wy - vy * t) ** 2 + (wz - vz * t) ** 2 > reach * reach) continue;
      if (!ring) ring = limbRings(Lb);
      _sl.push(a, b, rad[i], rad[i + 1], Math.cos(Math.PI / sides) * (1 - flat));
      for (let j = 0; j < sides; j++) { const p0 = vert(i, j), p2 = vert(i + 1, j + 1); seatTri(p0, vert(i, j + 1), p2, 1); seatTri(p0, p2, vert(i + 1, j), 1); }
    }
  };
  for (const Lb of P.treeLimbs) if (!Lb.gone) lay(Lb, [14, 9, 6, 4][Lb.level], Lb.level === 0 ? FLAT : 0);
  for (const sb of P.treeLimbs.stubs || []) lay(sb, 7, 0);
}
// IS A BIRD THAT WOULD BE MADE TO SIT SUNK IN WHAT IS DRAWN ABOUT ITS SEAT (the law above): its 19 corners at rest,
// each asked of the lists' solids, the ground and the seat's triangles (a rook of the tree: in the hero's own frame)
export function seatSunk(P, b) {
  const h = b.home, sz = b.size, cy = Math.cos(b.yaw), sy = Math.sin(b.yaw), rr = 0.65 * sz + SEAT_REACH, tree = b.on === 'tree', T = P.T, S = tree ? null : b.seat, sc = S ? Math.cos(S.yaw) : 0, ss = S ? Math.sin(S.yaw) : 0; let q = h, nd = 0; _sn = 0;
  if (tree) { const dx = h[0] - P.root[0], dz = h[2] - P.root[1]; q = [dx * T[1] - dz * T[0], h[1] - M.TREE_Y, dx * T[0] + dz * T[1]]; seatLimbs(P, q, rr); }
  else { seatDormers(P, h, rr); nd = _sn; if (b.seat) seatRidge(b.seat); seatGutters(P, h, rr); }
  for (const c of SEAT_CORNERS) {
    const ax = (-sy * c[0] + cy * c[2]) * sz, az = (cy * c[0] + sy * c[2]) * sz, x = h[0] + ax, y = h[1] + c[1] * sz, z = h[2] + az;
    if (seatInSolids(P, x, y, z, -SEAT_STONE, true) || groundDeep(P, x, y, z) > SEAT_STONE) return true;
    if (!_sn) continue;
    if (!tree) {
      seatDeep(x, y, z); if (_sd[0] > SEAT_STONE || (nd && seatUnder(x, y, z, nd))) return true;
      // (by the nearest face: unless the bird's own roof lies nearer under the corner than that face does)
      if (_sr[0] > SEAT_STONE && (!S || _sr[0] < y - roofTop(S, (x - S.x) * sc + (z - S.z) * ss, (x - S.x) * ss - (z - S.z) * sc))) return true;
      continue;
    }
    const lx = q[0] + ax * T[1] - az * T[0], ly = q[1] + c[1] * sz, lz = q[2] + ax * T[0] + az * T[1];
    seatDeep(lx, ly, lz); if (_sd[0] > SEAT_STONE || _sd[1] > SEAT_WOOD || _sr[1] > SEAT_WOOD) return true;
    for (let k = 0; k < _sl.length; k += 5) {
      const a = _sl[k], e = _sl[k + 1], vx = e[0] - a[0], vy = e[1] - a[1], vz = e[2] - a[2], wx = lx - a[0], wy = ly - a[1], wz = lz - a[2], t = (wx * vx + wy * vy + wz * vz) / Math.max(1e-9, vx * vx + vy * vy + vz * vz);
      if (t >= 0 && t <= 1 && lerp(_sl[k + 2], _sl[k + 3], t) * _sl[k + 4] - Math.hypot(wx - vx * t, wy - vy * t, wz - vz * t) > SEAT_DEEP) return true;
    }
  }
  return false;
}
// a plume's puff at a share a of its life: where its middle is (into out) and how far its smoke reaches from there
// AS IT IS DRAWN (the smoke shader's own sums): the puff's card at that age, the share of the card on which smoke
// is still drawn at its thinnest (the card's noise at its most), and the puff's wander to either side. Nought where
// no smoke is drawn at that age (the puff's first breath and its last)
export function plumePoint(p, a, wind, out) {
  out[0] = p.x + wind[0] * p.drift * a * a; out[1] = p.y + p.rise * (1 - (1 - a) * (1 - a)); out[2] = p.z + wind[1] * p.drift * a * a;
  const fade = 1 - a, den = (0.4 + 0.34 * smoothstep(20, 30, p.rise)) * fade * Math.sqrt(fade) * smoothstep(0, 0.05, a);
  if (den <= 0.004) return 0;
  // (drawn where body * body * den is 0.004 and more; body = 1 - smoothstep(0, 1, d + (n - 0.5) * 0.55), n from 0 to 1)
  const d = Math.min(Math.SQRT2, 0.5 - Math.sin(Math.asin(1 - 2 * (1 - Math.sqrt(0.004 / den))) / 3) + 0.275);
  return d * lerp(p.r0 * 0.8, p.r1 * 0.85, Math.pow(a, 0.75)) + 0.354 * p.r1 * a;
}
// the finger tower's middle at a height (above the ring's storey it leans the way of its bite) and its radius there
export const fingerMid = (F, y) => { const bd = dirOf(F.bite), k = F.lean * Math.max(0, (y - (F.ringY + 12)) / 25); return [F.x + bd[0] * k, F.z + bd[1] * k]; };
export const fingerR = (F, y) => (y <= F.ringY ? lerp(F.rBase, F.rRing, clamp((y - F.base) / (F.ringY - F.base), 0, 1)) : lerp(F.rRing, F.rTop, clamp((y - F.ringY) / (F.top - F.ringY), 0, 1)));
// the finger's storeys (the heights where one age of building stands on another) and its broken head's rim
const _fys = new WeakMap();
const fingerYs = (F) => { let ys = _fys.get(F); if (!ys) { ys = [F.base, 34, 84, F.ringY - 10, F.ringY + 12, 172, 200, 232, 262, 288, 322, 356, 392, F.top - 26]; _fys.set(F, ys); } return ys; };
const fingerRag = (F) => (th) => -11 * (1 + Math.cos(th - F.bite)) + 2.4 * Math.sin(th * 5 + F.bite) - 1.5 * (1 + Math.sin(th * 11 + 1));
// the rim's height at a bearing, as the head is built (24 lengths of shell, straight from corner to corner)
export function fingerRim(F, th) { const rag = fingerRag(F), a = (((th % TAU) + TAU) % TAU) * 24 / TAU, i = Math.floor(a); return F.top + lerp(rag(i / 24 * TAU), rag((i + 1) / 24 * TAU), a - i); }
// THE FINGER'S WALL AS IT IS BUILT at a height: every storey is one drum round its own foot's middle (the lean goes up in
// steps), and the broken head is one straight shell. x, z its middle, r its radius, lo to hi the storey, shell: the head
export function fingerWall(F, y, out = {}) {
  const Ys = fingerYs(F), n = Ys.length - 1;
  if (y >= Ys[n]) { const c = fingerMid(F, Ys[n]); out.x = c[0]; out.z = c[1]; out.r = fingerR(F, Ys[n]); out.lo = Ys[n]; out.hi = F.top; out.shell = true; out.last = false; return out; }
  let i = n - 1; while (i > 0 && y < Ys[i]) i--;
  const ya = Ys[i], yb = Ys[i + 1], c = fingerMid(F, ya), ra = fingerR(F, ya) * (i === 3 ? 1 : 1 + 0.02 * (i % 2));
  out.x = c[0]; out.z = c[1]; out.r = lerp(ra, fingerR(F, yb), (y - ya) / (yb - ya)); out.lo = ya; out.hi = yb; out.shell = false; out.last = i === n - 1; return out;
}
// IS AN OWL'S WINDOW WHOLE IN OPEN WALL: its slit and sill (0.8 m to either side, 1.4 m down, 1.5 m up, and 0.3 m of air)
// within one storey's wall and clear of the collars where storeys meet; in the broken head, a metre and more under the rim
// across its whole breadth; and clear of every smaller tower on the finger (its corbel and 3 m under it, its drum, its head)
export function owlWindowOpen(F, th, y) {
  const W = fingerWall(F, y), lo = y - 1.7, hi = y + 1.8;
  if (W.shell) { if (lo < W.lo) return false; for (const k of [-1, 0, 1]) if (hi + 1 > fingerRim(F, th + k * 0.9 / W.r)) return false; }
  else if (lo < W.lo + 2.2 || hi > W.hi - (W.last ? 0 : 0.4)) return false;
  const px = W.x + Math.sin(th) * W.r, pz = W.z - Math.cos(th) * W.r;
  for (const t of F.turrets) {
    if (!t.on) continue;
    const c = fingerMid(F, t.y), rr = fingerR(F, t.y) + t.r * 0.32, tx = c[0] + Math.sin(t.th) * rr, tz = c[1] - Math.cos(t.th) * rr;
    if (Math.hypot(px - tx, pz - tz) < t.r * 1.16 + 1.2 && hi > t.y - t.r * 1.8 - 3 && lo < t.y + t.h + (t.cap === 1 ? t.r * 2.1 : 3)) return false;
  }
  return true;
}

// ---------------------------------------------------------------- THE LIFE OF A VISIT (plain numbers): the tree's limbs and
// perches, the rooks, the owls, the cats, the rags and the washing, the weed tree, the bats' place, the pools
async function planLife(P) {
  const { R_, T } = P, dens = P.density, F = P.finger, birds = [], BLACK = [0.03, 0.03, 0.04];
  // ---- THE FIELD'S FEW POOLS (fork 'pools'): the flags are dry; in six of their low places a small sharp pool stands,
  // 10 to 24 m long and 6 to 14 m across, each anywhere on the field at its own heading, and holds the sky over it
  { const pl = R_.pools, q = P.quad, list = [];
    for (let k = 0; k < 6; k++) {
      const fw = pl.range(0.08, 0.92), ft = pl.range(0.1, 0.9), a = pl.range(5, 12), b = pl.range(3, 7), rot = pl.range(0, Math.PI), c = P.fromWT(lerp(q.w0, q.w1, fw), lerp(q.t0, q.t1, ft));
      list.push({ x: c[0], z: c[1], a, b, rot });
    }
    P.pools = list;
    const pc = list.map((o) => Math.cos(o.rot)), ps = list.map((o) => Math.sin(o.rot));
    // how deep in a pool a place lies: metres inside the nearest oval's edge (under nought: outside all)
    P.poolAt = (x, z) => { let f = -1e9; for (let i = 0; i < list.length; i++) { const o = list[i], dx = x - o.x, dz = z - o.z, c = pc[i], sn = ps[i]; f = Math.max(f, (1 - Math.hypot((dx * c + dz * sn) / o.a, (dz * c - dx * sn) / o.b)) * Math.min(o.a, o.b)); } return f; };
  }
  // ---- the tree's perches in the world (the tree was dealt in the plan's head; fork 'perch' the perches)
  const H = heroMeasures(P);
  await P.Y();
  const limbs = P.treeLimbs;
  // the hero's frame in the world: local z out of the wall (T), local x across it, y up from the trunk's axis
  P.heroYaw = Math.atan2(T[0], T[1]);
  P.heroToWorld = (lx, ly, lz) => [P.root[0] + lx * T[1] + lz * T[0], M.TREE_Y + ly, P.root[1] - lx * T[0] + lz * T[1]];
  const pk = R_.perch, perches = [], boughs = limbs.filter((l) => l.level === 1 || l.level === 2);
  for (let k = 0; k < 70; k++) {
    const li = Math.floor(pk() * boughs.length), f = pk.range(0.25, 1), yaws = [pk.range(0, TAU), pk.range(0, TAU), pk.range(0, TAU)], R = pk.range(6, 15), Hh = pk.range(1.5, 6), period = pk.range(11, 26), phase = pk(), share = pk.range(0.5, 0.82), size = pk.range(1.5, 2);
    const Lb = boughs[Math.min(boughs.length - 1, li)], i = Math.min(Lb.pts.length - 1, Math.round(f * (Lb.pts.length - 1))), p = Lb.pts[i];
    if (k % 2 === 1) await P.Y();
    if (k >= Math.round(54 * dens) || Lb.gone) continue;
    const home = P.heroToWorld(p[0], p[1] + Lb.rad[i] + 0.02, p[2]);
    // (three ways out are drawn for each perch: the bird takes the first whose loop passes through no solid; with
    // none, it is left out. MENDING 4, M1: and through no limb of the tree itself (roundFaces); a bird that a way
    // of its three would let fly by the solids, and none by the tree's own wood (its limbs with the air their sway
    // asks: mending 5, M4), takes its round at another heading, as said next, or SITS on its perch (MENDING 6: if
    // its seat is clear; one sunk in the wood about it is left out in roofPlan: seatSunk))
    // (MENDING 5, M1: A WAY MADE AFTER THE DRAWS KEEPS THE CLASS'S OWN SHAPE. For a bird whose three dealt ways all
    // meet the tree's wood, by its own dealt numbers and no new draw: ITS OWN DEALT ROUND, the same breadth and the
    // same height (6 to 15 m broad, 1.5 to 6 m high: at its steepest 45 degrees and less, its tightest turn 2.1 m
    // and more, as every dealt round), at each of its three dealt headings TURNED by a sixth of a turn to either
    // hand, then by a third, then by a half; each asked like any round. With none it sits. The climbing hoops of
    // mending 4 are gone)
    let could = null, flies = false;
    for (let w = 0; w < 18 && !flies; w++) {
      if (w >= 3 && !could) break;
      const yaw = yaws[w % 3] + [0, 1, 5, 2, 4, 3][Math.floor(w / 3)] / 6 * TAU, d = P.heroToWorld(p[0] + Math.sin(yaw), 0, p[2] - Math.cos(yaw));
      const b = { home, kind: 0, R, H: Hh, yaw: Math.atan2(d[0] - home[0], -(d[2] - home[2])), period, phase, share, size, tint: BLACK, on: 'tree' };
      if (!roundClear(P, b)) continue;
      if (!could) could = b;
      if (!roundFaces(P, b)) { if (b !== could) b.first = could; birds.push(slowRound(b)); perches.push(b); flies = true; }
    }
    if (could && !flies) { const b = { home, kind: 0, R: 0, H: 0, yaw: could.yaw, period, phase, share: 1, size, tint: BLACK, on: 'tree', first: could }; birds.push(b); perches.push(b); }
  }
  P.heroM = H; P.perches = perches;
  await P.Y();
  // ---- the rooks that boil round the finger tower (fork 'rooks'): always on the wing, in wheeling parties. 78 parties
  // are drawn, ten rooks in each; a party has one loop (its place, breadth, height, heading and time), and each of its
  // rooks has its own place within some 5 m of the party's and its own step along the loop. They wheel over the head
  // of the lit arch, the same all round the tower: a party's place is 22 m and more over the ring's height (its
  // lowest rook 13 m over it; the arch's storey ends 12 m over it), up to 28 m over the tower's broken head
  const rk = R_.rooks, nBoil = Math.round(60 * dens);
  for (let k = 0; k < 78; k++) {
    const a = rk.range(0, TAU), rad = rk.range(34, 98), y = rk.range(F.ringY + 22, F.top0 + 28), R = rk.range(24, 72), Hh = rk.range(-6, 14), turn = rk.range(-0.8, 0.8), flip = rk.chance(0.5) ? 1 : -1, period = rk.range(8, 18), phase = rk();
    const each = []; for (let j = 0; j < 10; j++) each.push([rk.range(-5, 5), rk.range(-3, 3), rk.range(-5, 5), rk.range(-0.05, 0.05), rk.range(1.5, 2.1)]);
    await P.Y();
    if (k >= nBoil) continue;
    for (const [dx, dy, dz, dph, size] of each) {
      const ph = phase + dph + 1, b = { home: [F.x + Math.sin(a) * rad + dx, y + dy, F.z - Math.cos(a) * rad + dz], kind: 0, R, H: Hh, yaw: a + flip * Math.PI / 2 + turn, period, phase: ph - Math.floor(ph), share: 0, size, tint: BLACK, on: 'finger' };
      // (a loop never passes through the tower itself)
      let clear = true; const p = [0, 0, 0];
      for (let i = 0; i < 20 && clear; i++) { loopPoint(b, i / 20, p); const cc = fingerMid(F, p[1]); if (Math.hypot(p[0] - cc[0], p[2] - cc[1]) < fingerR(F, p[1]) + 3 && p[1] < F.top + 4) clear = false; }
      // (MENDING 4: nor through a face roundClear does not read; a wheeling rook has no seat to keep: it is left out)
      if (clear && roundClear(P, b) && !roundFaces(P, b)) birds.push(slowRound(b));
    }
  }
  await P.Y();
  // ---- the rooks of the quadrangle's roofs (fork 'quadrooks'): on the ridges round the field of flagstones, the near
  // range's and the side ranges' by one law; most sit (and lift together on a rare visit), a share fly out and land
  // again on the clock
  // (the solids worth reading for a ridge's seats are gathered once a ridge)
  const _ss = new Map(), seatSolids = (m) => { let l = _ss.get(m); if (!l) { l = solidsNear(P, m.x, m.z, m.hl + 1, m); _ss.set(m, l); } return l; };
  // (the ridges round the field: the near range in its lengths and the two side ranges; a seat is drawn anywhere
  // along the whole of their length)
  const qk = R_.quadrooks, nQuad = Math.round(800 * dens), ridges = P.quadRanges, rlen = ridges.map((m) => m.hl * 2), rtot = rlen.reduce((x, y) => x + y, 0), qc = P.fromWT((P.quad.w0 + P.quad.w1) / 2, (P.quad.t0 + P.quad.t1) / 2);
  for (let k = 0; k < 1040; k++) {
    const rd = qk() * rtot, f = qk.range(-0.96, 0.96), R = qk.range(40, 110), Hh = qk.range(10, 36), turns = [qk.range(-0.9, 0.9), qk.range(-0.9, 0.9), qk.range(-0.9, 0.9)], period = qk.range(7, 14), phase = qk(), flier = qk() < 0.18, share = qk.range(0.6, 0.85), size = qk.range(1.5, 2.1);
    if (k % 3 === 2) await P.Y();
    if (k >= nQuad) continue;
    let ri = 0, acc = rlen[0]; while (ri < ridges.length - 1 && rd > acc) acc += rlen[++ri];
    const m = ridges[ri], p = frameOf(m.x, m.z, m.yaw)(0, 0, f * m.hl);
    // (THE SEAT: on the ridge's stone, within the ridge's true length: a place drawn past a hipped ridge's end is no
    // seat. No place of its own roof is higher than its seat and its round never dips under it, so its own roof is
    // never entered. A seat inside a tower, a stack or another range, or within 1.2 m of one (a rook does not leave
    // its perch through the corner of a stack beside it), is dropped, after its draws)
    if (Math.abs(f * m.hl) > ridgeLen(m)) continue;
    const sy = m.ridge + 0.22;
    if (inSolid(P, seatSolids(m), p[0], sy - 0.1, p[2], sy + 0.15, 1.2)) continue;
    // (THREE ROUNDS ARE DRAWN FOR EVERY ROOK, each its own way out over the field, the third half as high again: it
    // flies the first that passes through no solid of the place; with none it is left out, after its draws. None is
    // left out for its pace: a round that would be too fast is flown slower)
    // (ONE LAW FOR EVERY RANGE OF THE FIELD, the near range and the two side ranges alike: a rook that is no flier
    // belongs to the flock that lifts on a rare visit, by the first of its three rounds that is clear; one of the
    // flock with no clear round keeps its ridge when the others lift, and sits. The true clearance alone says which
    // of them the line leaves out)
    // (MENDING 3, M5: alt: the round's own later ways out and its sitting, kept until the yard's things are known
    // (the yard is planned after the birds): a round that would pass through one of them is asked again there)
    // (MENDING 4: a round is asked about the faces roundClear does not read as well (roundFaces: its own range's
    // dormers above all); a flier that a way of its three would let fly by the solids and none by the faces keeps
    // its ridge and SITS, as one of the flock does (MENDING 6: if its seat is clear; one sunk in a dormer's roof
    // or in other stone is left out in roofPlan: seatSunk))
    let flown = false, could = null;
    const mk = (j) => ({ home: [p[0], sy, p[2]], kind: flier ? 0 : 1, R: flier ? R * 0.4 : R, H: (flier ? Hh * 0.3 : Hh) * (j === 2 ? 1.5 : 1), yaw: Math.atan2(qc[0] - p[0], -(qc[1] - p[2])) + turns[j], period, phase, share, size, tint: BLACK, on: 'quad', seat: m });
    const sit = () => ({ home: [p[0], sy, p[2]], kind: 0, R: 0, H: 0, yaw: turns[0] * 3.5, period, phase, share: 1, size, tint: BLACK, on: 'quad', seat: m });
    for (let j = 0; j < 3 && !flown; j++) {
      const b = mk(j);
      if (!roundClear(P, b, m)) continue;
      if (!could) { could = b; b.law = { mk, j, own: m, sit: flier ? null : sit }; }
      if (!roundFaces(P, b, m)) { if (b !== could) b.first = could; b.alt = { mk, j, own: m, sit: flier ? null : sit }; birds.push(slowRound(b)); flown = true; }
    }
    if (!flown && (!flier || could)) { const st = sit(); if (could) st.first = could; birds.push(st); }
  }
  await P.Y();
  // ---- rooks on the ridges of the inner ward (fork 'roofrooks'): every pitched roof of the country's inner ward may
  // bear them, each seat on a roof drawn by one chance; three rounds are drawn for each, the third twice as high,
  // each leaving its ridge square to it on a drawn side, within a radian
  const ro = R_.roofrooks, nRoof = Math.round(600 * dens), nearR = P.ranges.filter((m) => m.zone === 0 && m.roof !== 2 && !m.part);
  for (let k = 0; k < 780; k++) {
    const ri = Math.floor(ro() * nearR.length), f = ro.range(-0.95, 0.95), R = ro.range(10, 26), Hh = ro.range(2, 8), yaws = [ro.range(0, TAU), ro.range(0, TAU), ro.range(0, TAU)], period = ro.range(10, 24), phase = ro(), share = ro.range(0.45, 0.8), size = ro.range(1.5, 2);
    if (k % 8 === 7) await P.Y();
    if (k >= nRoof || !nearR.length) continue;
    const m = nearR[Math.min(nearR.length - 1, ri)], p = frameOf(m.x, m.z, m.yaw)(0, 0, f * m.hl);
    if (Math.abs(f * m.hl) > ridgeLen(m)) continue;
    const sy = m.ridge + 0.38;
    if (inSolid(P, seatSolids(m), p[0], sy - 0.26, p[2], sy + 0.15, 1.2)) continue;
    const mk = (j) => ({ home: [p[0], sy, p[2]], kind: 0, R, H: Hh * (j === 2 ? 2 : 1), yaw: m.yaw + (yaws[j] < Math.PI ? 0.5 : -0.5) * Math.PI + ((yaws[j] % Math.PI) / Math.PI - 0.5) * 2, period, phase, share, size, tint: BLACK, on: 'roof', seat: m });
    // (MENDING 4: as the quad's: a rook the solids would let fly and the faces do not, by any of its three ways, sits)
    let flown = false, could = null;
    for (let j = 0; j < 3 && !flown; j++) {
      const b = mk(j);
      if (!roundClear(P, b, m)) continue;
      if (!could) { could = b; b.law = { mk, j, own: m, sit: null }; }
      if (!roundFaces(P, b, m)) { if (b !== could) b.first = could; b.alt = { mk, j, own: m, sit: null }; birds.push(slowRound(b)); flown = true; }
    }
    if (could && !flown) birds.push({ home: [p[0], sy, p[2]], kind: 0, R: 0, H: 0, yaw: mk(0).yaw, period, phase, share: 1, size, tint: BLACK, on: 'roof', seat: m, first: could });
  }
  // ---- the owls (fork 'owls'): each has a window of the finger tower's upper storeys, at any bearing round the shaft
  // (one law all round, as the tower's own windows and the wheeling parties are dealt); it sits on the sill, flies a
  // long leaf-shaped round out over the roofs (straight out of the wall and straight back in) and turns round on its
  // sill, over and over on the world's clock. Three rounds are drawn for each, the second and the third shorter: it
  // flies the first that is clear
  const ow = R_.owls, nOwl = Math.round(36 * dens); P.owlWindows = [];
  for (let k = 0; k < 47; k++) {
    const th = ow.range(0, TAU), y = ow.range(F.ringY + 26, F.top0 - 14), outs = [ow.range(-0.15, 0.15), ow.range(-0.15, 0.15), ow.range(-0.15, 0.15)], R = ow.range(36, 80), Hh = ow.range(-4, 12), period = ow.range(26, 44), phase = ow(), share = ow.range(0.35, 0.6), size = ow.range(2.4, 3.2);
    if (k % 8 === 7) await P.Y();
    if (k >= nOwl) continue;
    // (THE WINDOW: on the wall as it is built at that height; whole in open wall under the rim and clear of the smaller
    // towers, or it is left out with its owl, after its draws)
    if (!owlWindowOpen(F, th, y)) continue;
    const W = fingerWall(F, y), r = W.r + 0.3, home = [W.x + Math.sin(th) * r, y - 1.05, W.z - Math.cos(th) * r], p = [0, 0, 0];
    // (MENDING 4: an owl the solids would let fly and the faces do not (roundFaces), by any of its three rounds,
    // keeps its window and SITS on its sill, facing out of it (a sitter's own kind, its heading a quarter turn back
    // so that it looks the way an owl leaves): no window is lost)
    // (MENDING 5, M2: A SEAT INSIDE STONE IS NO SEAT: where the front's piers, stumps and arch stones stand through
    // the shaft's face, a sill lies in the stone or hard beside it. An owl whose whole body's ball about its sill
    // stands in or through a solid (seatInSolids) is LEFT OUT, whether it would sit or fly (one that flew from such
    // a sill came out of the stone, and turned in it between flights); its window stays as it was built: no stone
    // moves. MENDING 6, M1: the solids hold the front's three openings too, each with its surround, its sill slab
    // and its boards (openSolids): an owl whose ball stands in or through them is left out like the others)
    const noSeat = seatInSolids(P, home[0], home[1] + SIT_UP * size, home[2], SIT_REACH * size);
    let flown = false, could = null;
    for (let j = 0; j < 3 && !flown; j++) {
      const b = { home, kind: 2, R: R * [1, 0.75, 0.55][j], H: Hh, yaw: th + outs[j], period, phase, share, size, tint: [0.62, 0.52, 0.38], on: 'owl', th };
      // (its round never passes through a solid, and is a metre and more off the tower's own wall once it has left the sill)
      let clear = true;
      for (let i = 4; i < 37 && clear; i++) { loopPoint(b, i / 40, p); const cc = fingerMid(F, p[1]); if (Math.hypot(p[0] - cc[0], p[2] - cc[1]) < fingerR(F, p[1]) + 1 && p[1] < F.top + 4) clear = false; }
      if (!clear || !roundClear(P, b)) continue;
      if (!could) could = b;
      if (!roundFaces(P, b)) { if (b !== could) b.first = could; if (!noSeat) birds.push(slowRound(b)); P.owlWindows.push({ th, y }); flown = true; }
    }
    if (could && !flown) { if (!noSeat) birds.push({ home, kind: 0, R: 0, H: 0, yaw: th + outs[0] - Math.PI / 2, period, phase, share: 1, size, tint: [0.62, 0.52, 0.38], on: 'owl', th, first: could }); P.owlWindows.push({ th, y }); }
  }
  P.birds = birds;
  await P.Y();
  await planCloth(P);
}
// the cats, the rags of flag, the washing, the weed tree, the weeds, the parliament of rooks, the bats' place
async function planCloth(P) {
  const { R_ } = P, dens = P.density;
  // ---- the cats (fork 'cats'): a tide along their walk; each has its place in the stream and its own small ways
  const cr = R_.cats, pts = P.cats.pts, cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  P.cats.cum = cum; P.cats.len = cum[cum.length - 1]; P.cats.list = [];
  // (260 at the middle density: about five cats to every two metres of the walk, so that each is seen as a cat with
  // stone between it and the next, and the tide is still unbroken from arch to arch)
  const nCat = Math.round(260 * dens);
  for (let k = 0; k < 340; k++) {
    const s = cr(), lat = cr.range(-1, 1), pace = cr.range(0.9, 1.1), ph = cr(), size = cr.range(0.85, 1.15), grey = cr();
    if (k < nCat) P.cats.list.push({ s, lat: lat * 0.95, pace, ph, size, grey });
  }
  await P.Y();
  // ---- rags of flag (fork 'flags'): on the field's corner towers, on six in ten of the lesser towers that have a
  // flat head, on half of the great ones and of the gate's and the wall's that have no cone
  const fr = R_.flags; P.flags = [];
  for (const t of P.towers) {
    const draw = fr(), pole = fr.range(5, 8), len = fr.range(3, 4.6), tall = fr.range(1.6, 2.3);
    const on = (t.part === 'quad' && t.r > 6) || (t.part === 'lesser' && t.cap === 0 && !t.stair && draw < 0.6) || ((t.part === 'great' || t.part === 'wall' || t.part === 'gate') && t.cap !== 1 && draw < 0.5);
    if (!on) continue;
    // (THE POLE STANDS ON WHAT ITS TOWER HAS: the lead roof, the cone's tip or the broken rim's highest place, its foot a
    // little way in; the rag, with its sag and its give in the wind, keeps clear of every solid: the towers on its own
    // tower, every other tower, the ranges, the stacks. A rag that would not is left out, after its draws)
    const st = headStand(t), f = { x: st[0], z: st[2], y: t.cap === 0 ? t.top + 1.2 : st[1] + 0.6, pole, len, tall, r: t.r, t };
    const near = solidsNear(P, f.x, f.z, len + 2), top = f.y + pole, wd = P.wind, sd = [-wd[1], wd[0]];
    // (its own tower's shaft is read as it is built: up to the merlons' heads, the cone's tip or the rim's highest place)
    near.towers = near.towers.filter((q) => !(q.x === t.x && q.z === t.z && !q.sub));
    let clear = !inSolid(P, near, f.x, f.y, f.z, top + 0.3);
    near.towers.push({ x: t.x, z: t.z, r: t.round ? t.r * 1.1 : (t.r * 0.89 + 0.5) * Math.SQRT2, y0: t.base, y1: t.cap === 0 ? t.top + 2.5 : st[1] });
    for (let i = 0; i <= 8 && clear; i++) for (const v of [0, 1]) for (const g of [-1, 0, 1]) {
      const u = i / 8, k = u * len, x = f.x + wd[0] * k + sd[0] * g, z = f.z + wd[1] * k + sd[1] * g, y = top - v * tall - 0.35 * u * u * len;
      if (inSolid(P, near, x, y - 0.3, z, y + 0.3)) { clear = false; break; }
    }
    if (clear) P.flags.push(f);
  }
  await P.Y();
  // ---- the washing (fork 'cloth'): the line across the lane from wall to wall, sheets and shirts hung along it
  const cl = R_.cloth, w = P.wash;
  for (let k = 0; k < 8; k++) { const wide = cl.range(0.8, 1.6), fall = cl.range(1, 2.1), tone = cl.range(0.75, 1), tint = cl(); w.things.push({ f: (k + 0.5) / 8, wide, fall, tone, tint }); }
  // ---- the weed tree in a crack of the field of flagstones (fork 'weed'): A THING OF THE FIELD. It stands by the
  // field's own middle: within 12 m of it along the field's axis and 10 to 13 m to a drawn side of that axis
  const wd = R_.weed, side = wd.chance(0.5) ? 1 : -1, off = wd.range(10, 13), along = wd.range(-12, 12), wh = wd.range(3.6, 4.8), qd = P.quad;
  { const c = P.fromWT(qd.mid + side * off, (qd.t0 + qd.t1) / 2 + along); P.weed = { x: c[0], z: c[1], y: M.QUAD_Y, h: wh, sd: wd.int(1, 999) }; }
  // ---- more weeds in the joints of the field (fork 'fieldweeds'): fourteen small ones drawn anywhere on the flags; one
  // stands if it is 2 m and more from the weed tree and from every weed before it
  const fwd = R_.fieldweeds; P.weeds = [];
  for (let k = 0; k < 14; k++) {
    const fx = fwd.range(0.06, 0.94), ft = fwd.range(0.08, 0.92), h = fwd.range(1.6, 3.4), sd = fwd.int(1, 999);
    const c = P.fromWT(lerp(qd.w0, qd.w1, fx), lerp(qd.t0, qd.t1, ft));
    if ([P.weed, ...P.weeds].every((o) => Math.hypot(c[0] - o.x, c[1] - o.z) >= 2)) P.weeds.push({ x: c[0], z: c[1], y: M.QUAD_Y, h, sd });
  }
  // ---- THE OLD THINGS OF STONE (fork 'oldstone'): what such floors keep. Seven are drawn for the field (a well
  // head, then urns, sundials' stumps and mounting blocks by turns) and four for the forecourt; one stands if it
  // is 12 m and more inside its floor's edge (the forecourt: 7 m, and its whole foot off the worn way that lies on
  // the flags out of the gatehouse's arch, WAY_HALF to either hand of the arch's middle and WAY_LONG out), 2.5 m
  // outside every pool, 4 m from every weed and every lamp's post, off the towers' feet, and 16 m from every one
  // dealt before it. kind: 0 a well head, 1 a broken urn on its pedestal, 2 a mounting block, 3 a sundial's stump
  // (r: its foot's reach, h: its height). The rooks stand off them and fly round them
  { const os = R_.oldstone, KINDS = [0, 1, 3, 2, 1, 3, 2, 3, 1, 2, 1], REACH = [1.9, 0.75, 1.25, 0.85], HIGH = [2.7, 1.9, 1.0, 1.25], tf = qd.t1 + M.NEAR_DEEP;
    P.stones = [];
    for (let k = 0; k < 11; k++) {
      const fx = os.range(0, 1), ft = os.range(0, 1), yaw = os.range(0, TAU), size = os.range(0.9, 1.15), sd = os.int(1, 999), fore = k >= 7, kind = KINDS[k];
      const w = fore ? qd.mid + (fx * 2 - 1) * (M.FORE_HALF - 7) : lerp(qd.w0 + 12, qd.w1 - 12, fx), t = fore ? tf + lerp(7, M.FORE_DEEP - 7, ft) : lerp(qd.t0 + 12, qd.t1 - 12, ft), c = P.fromWT(w, t), r = REACH[kind] * size;
      if (fore ? (Math.abs(w - qd.mid) < WAY_HALF + r && t - tf < WAY_LONG + r) || P.lamps.some((q) => Math.hypot(c[0] - q.x, c[1] - q.z) < 4) : P.poolAt(c[0], c[1]) > -2.5 - r || [P.weed, ...P.weeds].some((o) => Math.hypot(c[0] - o.x, c[1] - o.z) < 4)) continue;
      if (P.towers.some((q) => Math.hypot(c[0] - q.x, c[1] - q.z) < q.r * 1.45 + r + 1.5) || P.stones.some((o) => Math.hypot(c[0] - o.x, c[1] - o.z) < 16)) continue;
      P.stones.push({ x: c[0], z: c[1], y: M.QUAD_Y, kind, yaw, size, sd, r, h: HIGH[kind] * size, fore });
    }
  }
  // ---- ROUND 7, A2: THE GREAT YARD'S THINGS (fork 'r7yard'; every draw of every thing is taken before any test).
  // The field of flagstones is the keep's great yard and the forecourt its outer yard; what such yards keep stands
  // on them, each at its own drawn place, the same on every visit of a seed:
  //  THE CLOISTER WALK: a lean-to arcade along the foot of the field's tall side range (the plan's w0 side: the one
  //   range of the field's two sides whose wall stands high enough over the flags to carry a lean-to: mending 2),
  //   from near the keep's end: 52 to 78 m of it, stone piers 5.2 m apart to the eaves 6 m up, a pointed arch from
  //   pier to pier, a roof of slate leaning on the wall 9.2 m up and never nearer than 0.4 m under that wall's own
  //   eave, three lanterns hung under it;
  //  THE WELL HOUSE: a round kerb on a step under a four-posted roof of slate 8.4 m high, its windlass on two posts
  //   and the great wheel that turned it standing beside (it stands still), a stone trough by it; left of the
  //   field's middle before the keep, at the first of six drawn places that lies 8 m outside every pool, clear of
  //   the weeds and 11 m and more from every old stone;
  //  A GREAT GNARLED TREE, 22 to 27 m, in leaf, right of the field's middle before the keep, by the same law;
  //  THE KEEP'S STEPS (planKeep dealt the door's bay): named here so that the rooks stand off them;
  //  on the forecourt: A GREAT OLD TREE, 15 to 18 m (until mending 1 a dead one), 8 to 13.5 m to the right of the worn way (the first of
  //   six drawn places clear of the old stones and the lamps); A STACK OF TIMBER along one side's parapet (the side
  //   drawn), A BROKEN CART with its shafts down on the other side of the worn way (the first of six drawn places
  //   clear), one wheel off and lying by it, and A STONE TROUGH against the gatehouse's wall beside the arch.
  // Each thing: its place, its foot's reach r and its height h, and sol, the round solids the rooks stand off and
  // fly round (as they do the old stones) and the line's true clearance is asked about (a tree's crown: its ball).
  // No person, no beast.
  { const yr = R_.r7yard, tf = qd.t1 + M.NEAR_DEEP, yq = M.QUAD_Y, yard = [];
    const clAt = yr(), clLen = yr.range(52, 78), wellYaw = yr.range(0, TAU), treeSd = yr.int(1, 999), treeH = yr.range(22, 27), side = yr.chance(0.5) ? 1 : -1, timT = yr.range(26, 50), timYaw = yr.range(-0.05, 0.05), cartYaw = yr.range(0, TAU), deadSd = yr.int(1, 999), deadH = yr.range(15, 18), wells = [], trees = [], carts = [], deads = [];
    for (let k = 0; k < 6; k++) { wells.push([yr(), yr()]); trees.push([yr(), yr()]); carts.push([yr(), yr()]); deads.push([yr(), yr()]); }
    const clearF = (c, r) => P.poolAt(c[0], c[1]) < -r - 1 && [P.weed, ...P.weeds].every((o) => Math.hypot(c[0] - o.x, c[1] - o.z) >= r + 3) && P.stones.every((o) => Math.hypot(c[0] - o.x, c[1] - o.z) >= r + o.r + 4) && yard.every((o) => o.sol.every((q) => Math.hypot(c[0] - q[0], c[1] - q[1]) >= r + q[2] + 4));
    const clearFore = (c, r) => P.stones.every((o) => Math.hypot(c[0] - o.x, c[1] - o.z) >= r + o.r + 2) && P.lamps.every((q) => Math.hypot(c[0] - q.x, c[1] - q.z) >= r + 2) && yard.every((o) => Math.hypot(c[0] - o.x, c[1] - o.z) >= r + o.r + 2);
    // (a tree: its trunk's round solid and its crown's ball, 0.42 of its height in radius about a point 0.62 of its
    // height up; every limb is built inside that ball)
    const tree = (c, H, sd, live, fore) => ({ kind: 'tree', x: c[0], z: c[1], y: yq, r: 3, h: H, sd, live, fore, sol: [[c[0], c[1], 3, H * 0.45]], ball: [c[0], yq + H * 0.62, c[1], H * 0.42] });
    // MENDING 2, R1 AND R2: THE CLOISTER LEANS ON THE FIELD'S TALL SIDE RANGE (the plan's w0 side: its eave stands 17 to
    // 23 m over the flags; the low range across the field, where the walk stood until now, has its eave 4.3 to 6.7 m
    // over them and turrets through it). THE LEAN-TO'S HEAD IS ITS WALL'S: the roof's upper edge lies 0.4 m and more
    // under the eave of the range it leans on (top: its height over the flags, 9.2 m where the wall allows it; ks:
    // its share of 9.2 m; piers, arches and lanterns stand in the same share). A BAY THAT A TOWER, AN OLD STONE OR A
    // GREAT WEED CROSSES IS LEFT OUT WITH ITS LANTERN AND GLOW, after the draws (the yard's own law): a bay with the
    // 0.7 m its roof overhangs at a run's end, against every tower's own solid at the walk's height and 0.3 m of
    // air; the walk is the runs of bays that stand (wf: the wall's face; inw: the way from it into the field)
    { const PIT = 5.2, nb = Math.round(clLen / PIT), len = nb * PIT, tA = lerp(qd.t0 + 20, qd.t1 - 14 - len, clAt * 0.4), wf = qd.w0, inw = 1, wc = wf + inw * 3.1, c = P.fromWT(wc, tA + len / 2), sol = [], lamps = [0.18, 0.5, 0.82].map((f) => tA + (Math.floor(f * nb) + 0.5) * PIT);
      const mr = P.quadRanges[P.nearRange.length + (inw > 0 ? 0 : 1)], top = Math.min(9.2, mr.eave - 0.4 - yq), ks = top / 9.2, bays = [], wLo = Math.min(wf, wf + inw * 6.35), wHi = Math.max(wf, wf + inw * 6.35);
      const sols = []; for (const tw of P.towers) for (const sv of towerSolids(tw)) if (sv.y0 < yq + top + 0.5 && sv.y1 > yq - 0.1) { const wt = P.toWT(sv.x, sv.z); sols.push([wt[0], wt[1], sv.r + 0.3]); }
      for (const o of [...P.stones, P.weed, ...P.weeds]) if (o) { const wt = P.toWT(o.x, o.z); sols.push([wt[0], wt[1], (o.r || 2) + 0.3]); }
      for (let i = 0; i < nb; i++) { const t0 = tA + i * PIT - 0.7, t1 = t0 + PIT + 1.4; bays.push(!sols.some((v) => Math.hypot(Math.max(wLo - v[0], 0, v[0] - wHi), Math.max(t0 - v[1], 0, v[1] - t1)) < v[2])); }
      // (a lantern hangs 3.1 m in the walk's share under the roof, never less than 0.4 m: lampY is its head over the flags)
      const lampY = 6 * ks + 0.25 + 0.563 * (top - 6 * ks - 0.25) - 0.11 - Math.max(0.4, 3.1 * ks), kept = lamps.filter((t) => bays[Math.floor((t - tA) / PIT)]);
      for (let i = 0; i < nb; i++) if (bays[i]) { const p = P.fromWT(wc, tA + (i + 0.5) * PIT); sol.push([p[0], p[1], 3.9, top + 0.1]); }
      if (sol.length) {
        yard.push({ kind: 'cloister', x: c[0], z: c[1], y: yq, r: Math.hypot(3.2, len / 2 + 0.7), h: top + 0.1, tA, nb, pitch: PIT, deep: 5.6, lamps: kept, sol, bays, top, ks, lampY, wf, inw });
        // (MENDING 3, M3: THE WALL KEEPS NO WINDOW IN THE BAND THE LEAN-TO'S ROOF CROSSES: along every run of the walk
        // (with the 0.7 m its roof overhangs at each end), from the wall's foot to the roof's upper edge and a course
        // (0.5 m) over it, the member the walk leans on is blind: mr.blind, read by the range's own maker. No draw)
        mr.blind = cloisterRuns({ nb, bays }).map(([b0, b1]) => ({ a: P.fromWT(wf, tA + b0 * PIT - 0.7), b: P.fromWT(wf, tA + b1 * PIT + 0.7), y: yq + top + 0.5 }));
        for (const t of kept) { const p = P.fromWT(wf + inw * 2.8, t); P.glows.push({ x: p[0], y: yq + lampY - 0.375, z: p[1], k: 0.9 }); }
      } }
    { const door = (P.keep.bays || []).find((b) => b.use === 1);
      if (door) { const c = P.fromWT((door.a + door.b) / 2, qd.t0 + 3.4); yard.push({ kind: 'steps', x: c[0], z: c[1], y: yq, r: 5.4, h: 3, sol: [[c[0], c[1], 5.4, 3]] }); } }
    for (const [fw, ft] of wells) { const c = P.fromWT(lerp(qd.mid - 46, qd.mid - 17, fw), lerp(qd.t0 + 28, qd.t0 + 64, ft)); if (!clearF(c, 7)) continue; yard.push({ kind: 'well', x: c[0], z: c[1], y: yq, r: 7, h: 8.4, s: 1.6, yaw: wellYaw, sol: [[c[0], c[1], 7, 8.4]] }); break; }
    for (const [fw, ft] of trees) { const c = P.fromWT(lerp(qd.mid + 15, qd.mid + 42, fw), lerp(qd.t0 + 32, qd.t0 + 68, ft)); if (!clearF(c, 3)) continue; yard.push(tree(c, treeH, treeSd, true, false)); break; }
    // (MENDING 1, M3: the forecourt's great tree is a LIVING one, dark and old, by the make of the tree before the
    // keep: the place's one great dead tree is the tree in the wall. It is dealt as it was: the same fork, the same
    // draws in the same order, the same place, height, trunk and crown's ball; no other draw of the yard moves)
    for (const [fw, ft] of deads) { const c = P.fromWT(qd.mid + lerp(8, 13.5, fw), tf + lerp(20, 50, ft)); if (!clearFore(c, 3)) continue; yard.push(tree(c, deadH, deadSd, true, true)); break; }
    { const c = P.fromWT(qd.mid + side * (M.FORE_HALF - 3.4), tf + timT); if (clearFore(c, 3.4)) yard.push({ kind: 'timber', x: c[0], z: c[1], y: yq, r: 3.4, h: 1.5, yaw: timYaw, fore: true, sol: [[c[0], c[1], 3.4, 1.5]] }); }
    for (const [fw, ft] of carts) { const c = P.fromWT(qd.mid - side * lerp(8.5, 16, fw), tf + lerp(22, 54, ft)); if (!clearFore(c, 3.6)) continue; yard.push({ kind: 'cart', x: c[0], z: c[1], y: yq, r: 3.6, h: 2, yaw: cartYaw, fore: true, sol: [[c[0], c[1], 3.6, 2]] }); break; }
    { const c = P.fromWT(qd.mid + side * (ARCH_HALF + 3.6), tf + 0.75); if (clearFore(c, 1.3)) yard.push({ kind: 'trough', x: c[0], z: c[1], y: yq, r: 1.3, h: 0.7, fore: true, sol: [[c[0], c[1], 1.3, 0.7]] }); }
    P.yard = yard;
  }
  // MENDING 3, M5: THE FLIERS AND THE YARD'S THINGS AS THEY ARE DRAWN (the great trees' crowns and trunks, the well
  // house, the cloister, the keep's steps, the timber, the cart, the trough). The birds dealt before the yard were
  // asked about towers, roofs and stacks alone: each flier's round is asked now, after every draw, about the yard's
  // things (roundInYard). One that would pass through a thing flies, BY THE LAW IT WAS DEALT BY, the next of its
  // three drawn ways out that is clear of everything; with none, one of the flock keeps its ridge and sits, any other
  // is left out. No draw is taken; the birds keep their order
  { const keep = [];
    for (let b of P.birds) {
      const a = b.alt; if (a) delete b.alt;
      // (MENDING 4: a bird whose FIRST round, the one the old law would have flown, passes through a thing of the
      // yard: what that law did with it here is done still, so that none is added: where it took a later way, that
      // way is its first round from here on; where it sat, the bird sits; where it left the bird out, it is left out)
      const f = b.first;
      if (f && roundInYard(P, f)) {
        const fa = f.law; let c3 = null;
        if (fa) for (let j = fa.j + 1; j < 3 && !c3; j++) { const c = fa.mk(j); if (roundClear(P, c, fa.own) && !roundInYard(P, c)) c3 = c; }
        if (c3) b.first = c3;
        else if (fa && fa.sit) { if (b.share < 1) b = fa.sit(); else b.first = null; keep.push(b); continue; }
        else { if (P.perches) { const i = P.perches.indexOf(b); if (i >= 0) P.perches.splice(i, 1); } continue; }
      }
      if (b.share >= 1 || !roundInYard(P, b)) { keep.push(b); continue; }
      let nb = null, was = null;
      if (a) {
        for (let j = a.j + 1; j < 3 && !nb; j++) { const c = a.mk(j); if (roundClear(P, c, a.own) && !roundInYard(P, c)) { if (!was) was = c; if (!roundFaces(P, c, a.own)) nb = slowRound(c); } }
        // (MENDING 4: one that a later way would have let fly by the old law and no way does by the faces keeps its seat;
        // MENDING 6: a rook of a roof, the quad, the parapet or the tree so made to sit, if its seat is clear: seatSunk)
        if (!nb && a.sit) nb = a.sit(); else if (!nb && was) nb = { home: b.home, kind: 0, R: 0, H: 0, yaw: b.yaw, period: b.period, phase: b.phase, share: 1, size: b.size, tint: b.tint, on: b.on, seat: b.seat };
        if (nb && (b.first || (was && was !== nb))) nb.first = b.first || was;
      }
      if (nb) keep.push(nb); else if (P.perches) { const i = P.perches.indexOf(b); if (i >= 0) P.perches.splice(i, 1); }
    }
    P.birds = keep; }
  // ---- THE PARLIAMENT OF ROOKS (fork 'parliament'): twenty gatherings on the flags, six of them at the rim of a pool
  // and fourteen anywhere on the flags (each takes the first of its five drawn places that lies well inside the
  // field, or its first); the rooks stand in parties of six about each, 150 parties at the middle density. Four
  // parties in ten have the habit of lifting: each of those rises together on a round of its own on the world's
  // clock (every 26 to 60 s, from the party's own drawn phase), flies one low loop over the flags and settles
  // where it stood, over and over, whether anyone is there or not, on the wing for a fifth to a half of its round
  // (so that at any moment some of the parliament are in the air over the rest); the others stand. THE STANDING PLACE: 3.8 m and more inside the field's edge, between 2 m
  // inside a pool's edge and 5 m outside it (a gathering of the open flags: anywhere outside the pools), off the
  // weeds and the turrets' feet. A LIFTER'S LOOP (three are drawn, it flies the first that will do) keeps over the
  // field, off the weeds, out of every solid and at a rook's pace. A rook that would not is left out, after its draws.
  {
    const pa = R_.parliament, gath = [], nParty = Math.round(150 * dens), BLACK = [0.03, 0.03, 0.04], wds = [P.weed, ...P.weeds], p = [0, 0, 0], NG = 20, NPL = P.pools.length;
    // (ROUND 7: the old stones and the round solids of the yard's things)
    const SOL = [...P.stones]; for (const o of P.yard) if (!o.fore) { for (const q of o.sol) SOL.push({ x: q[0], z: q[1], y: o.y, r: q[2], h: q[3] }); if (o.ball) SOL.push({ x: o.ball[0], z: o.ball[2], y: o.y, r: o.ball[3], h: o.ball[1] + o.ball[3] - o.y }); }
    // (MENDING 3, M5: and the edge's fallen stones and foot bushes and the buttresses that stand on the field, as
    // they are drawn: a rook stands off them and flies round them as it does the old stones. No draw is taken)
    for (const o of fieldEdgeSolids(P)) SOL.push(o);
    const onField = (x, z, pad) => { const wt = P.toWT(x, z); return wt[0] > qd.w0 + pad && wt[0] < qd.w1 - pad && wt[1] > qd.t0 + pad && wt[1] < qd.t1 - pad; };
    // (the towers whose feet stand on the field or at its edge, at the flags' height)
    const yF = M.QUAD_Y + 0.03, TS = towerList(P).filter((q) => q.y0 < yF + 1 && q.y1 > yF && onField(q.x, q.z, -q.r - 1));
    for (let g = 0; g < NG; g++) {
      const spread = pa.range(4, 9), cands = [];
      for (let j = 0; j < 5; j++) {
        const pi = pa.int(0, NPL - 1), th = pa.range(0, TAU), out = pa.range(0.5, 4), fx = pa.range(0.1, 0.9), ft = pa.range(0.1, 0.9);
        if (g < 6) { const o = P.pools[pi], c = Math.cos(o.rot), sn = Math.sin(o.rot), k = 1 + out / Math.min(o.a, o.b), lx = Math.cos(th) * o.a * k, lz = Math.sin(th) * o.b * k; cands.push([o.x + lx * c - lz * sn, o.z + lx * sn + lz * c]); }
        else cands.push(P.fromWT(lerp(qd.w0, qd.w1, fx), lerp(qd.t0, qd.t1, ft)));
      }
      const c = cands.find((q) => onField(q[0], q[1], 10)) || cands[0];
      gath.push({ x: c[0], z: c[1], spread, rim: g < 6 });
    }
    await P.Y();
    for (let k = 0; k < 390; k++) {
      if (k % 6 === 5) await P.Y();
      const g = gath[pa.int(0, NG - 1)], ox = pa.gauss() * g.spread, oz = pa.gauss() * g.spread, lifts = pa() < 0.4, yaws = [pa.range(0, TAU), pa.range(0, TAU), pa.range(0, TAU)], R = pa.range(8, 22), Hh = pa.range(2.5, 7), period = pa.range(26, 60), phase = pa(), share = 0.5 + 0.3 * (pa.range(0.84, 0.94) - 0.84) / 0.1, mem = [];
      for (let j = 0; j < 6; j++) mem.push([pa.gauss() * 2.4, pa.gauss() * 2.4, pa.range(-0.012, 0.012), pa.range(2, 2.8), pa.range(-0.3, 0.3), pa.range(0, TAU)]);
      if (k >= nParty) continue;
      for (const [dx, dz, dph, size, dyaw, face] of mem) {
        const x = g.x + ox + dx, z = g.z + oz + dz, y = M.QUAD_Y + 0.03, deep = P.poolAt(x, z);
        if (!onField(x, z, 3.8) || (g.rim ? deep > 2 || deep < -5 : deep > -0.6) || wds.some((w) => Math.hypot(x - w.x, z - w.z) < 1.5) || TS.some((q) => Math.hypot(x - q.x, z - q.z) < q.r + 0.8) || SOL.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 0.7)) continue;
        const ph = phase + dph;
        if (!lifts) { P.birds.push({ home: [x, y, z], kind: 0, R: 0, H: 0, yaw: face, period, phase: ph - Math.floor(ph), share: 1, size, tint: BLACK, on: 'field' }); continue; }
        // (MENDING 4: a lifter whose loop the field's own law would let fly and a face does not (roundFaces), by any
        // of its three, STANDS where it would have lifted from)
        let could = null, flown = false;
        for (let j = 0; j < 3; j++) {
          const b = { home: [x, y, z], kind: 0, R, H: Hh, yaw: yaws[j] + dyaw, period, phase: ph - Math.floor(ph), share, size, tint: BLACK, on: 'field' };
          let ok = roundClear(P, b);
          const n = Math.ceil(Math.PI * Math.hypot(R, Hh) / 1.5);
          // (the loop is a ring in plan: one whose whole ring lies inside the field's edge needs no reading of the
          // edge, and only the weeds its rim can reach are read)
          const rr = R * 0.5, mx = x + Math.sin(b.yaw) * rr, mz = z - Math.cos(b.yaw) * rr, mw = P.toWT(mx, mz);
          const within = mw[0] - rr > qd.w0 + 1.01 && mw[0] + rr < qd.w1 - 1.01 && mw[1] - rr > qd.t0 + 1.01 && mw[1] + rr < qd.t1 - 1.01;
          const wn = wds.filter((w) => Math.abs(Math.hypot(mx - w.x, mz - w.z) - rr) < w.h * 0.55 + 1.01);
          const sn = SOL.filter((o) => Math.abs(Math.hypot(mx - o.x, mz - o.z) - rr) < o.r + 1.01);
          if (!within || wn.length || sn.length) for (let i = 1; i < n && ok; i++) { loopPoint(b, i / n, p); if ((!within && !onField(p[0], p[2], 1)) || wn.some((w) => Math.hypot(p[0] - w.x, p[2] - w.z) < w.h * 0.55 + 1 && p[1] < w.y + w.h * 1.2 + 1) || sn.some((o) => Math.hypot(p[0] - o.x, p[2] - o.z) < o.r + 1 && p[1] < o.y + o.h + 1)) ok = false; }
          if (!ok) continue;
          if (!could) could = b;
          if (!roundFaces(P, b)) { if (b !== could) b.first = could; P.birds.push(slowRound(b)); flown = true; break; }
        }
        if (could && !flown) P.birds.push({ home: [x, y, z], kind: 0, R: 0, H: 0, yaw: face, period, phase: ph - Math.floor(ph), share: 1, size, tint: BLACK, on: 'field', first: could });
      }
    }
  }
  await P.Y();
  // ---- THE ROOKS OF THE PARAPET AND OF THE KEEP'S LEDGE (fork 'ledge'): 150 are drawn on the merlons of the field's
  // near range and side ranges (one stands if its merlon is whole), 120 in a row along the ledge that crosses the
  // keep's front (one stands if it is clear of the front's buttresses). Three in ten of the parapet's fly a round out
  // over the flags and come back on their own clocks, if the round passes through no solid; the others sit, and so
  // does the whole row of the ledge (the ledge's rooks are a row that sits and shifts)
  {
    const lg = R_.ledge, BLACK = [0.03, 0.03, 0.04], par = fieldParapet(P).filter((q) => !q.broken), qc = P.fromWT(qd.mid, (qd.t0 + qd.t1) / 2), K = P.keep, Lg = K.ledge;
    // (a round leaves its wall straight out over the flags, within a quarter of a radian of the wall's own outward
    // heading: the ring touches the wall's line at the seat and nowhere comes more than a metre behind it, so it
    // never crosses the roof that rises behind a parapet)
    const seat = (x, y, z, flies, turn, R, Hh, period, phase, share, size, face, on, own, out) => {
      const still = { home: [x, y, z], kind: 0, R: 0, H: 0, yaw: face, period, phase, share: 1, size, tint: BLACK, on };
      if (!flies) { P.birds.push(still); return; }
      const b = { home: [x, y, z], kind: 0, R, H: Hh, yaw: out + turn * 0.3, period, phase, share, size, tint: BLACK, on };
      // (MENDING 4: one the old law would have let fly and a face does not keeps its seat; MENDING 6: on the parapet,
      // if its seat is clear: seatSunk; the ledge's rooks are not asked)
      const ok = roundClear(P, b, own) && !roundInYard(P, b), meets = ok && roundFaces(P, b, own);
      if (meets) still.first = b;
      P.birds.push(ok && !meets ? slowRound(b) : still);
    };
    for (let k = 0; k < 270; k++) {
      const u = lg(), flies = lg() < 0.3, turn = lg.range(-0.8, 0.8), R = lg.range(14, 40), Hh = lg.range(3, 10), period = lg.range(18, 40), phase = lg(), share = lg.range(0.7, 0.9), size = lg.range(1.6, 2.1), face = lg.range(0, TAU);
      if (k % 10 === 9) await P.Y();
      if (k < 150) {
        if (k >= Math.round(150 * dens) || !par.length) continue;
        const q = par[Math.min(par.length - 1, Math.floor(u * par.length))];
        if (q.taken) continue; q.taken = true;
        const ax = Math.cos(q.m.yaw), az = Math.sin(q.m.yaw), sg = (qc[0] - q.x) * ax + (qc[1] - q.z) * az > 0 ? 1 : -1;
        seat(q.x, q.y + 1.72, q.z, flies, turn, R, Hh, period, phase, share, size, face, 'parapet', q.m, Math.atan2(sg * ax, -sg * az));
      } else {
        if (k - 150 >= Math.round(120 * dens)) continue;
        const w = lerp(Lg.w0, Lg.w1, u), c = P.fromWT(w, Lg.t + 0.75);
        if (K.blocks[0].butts.some((b) => Math.hypot(c[0] - b.x, c[1] - b.z) < 3.2)) continue;
        seat(c[0], Lg.y + 0.52, c[1], false, turn, R, Hh, period, phase, share, size, face, 'ledge', null, Math.atan2(P.T[0], -P.T[1]));
      }
    }
  }
  await P.Y();
  // ---- the bats (fork 'bats'): a stream that circles a place in the gulf's air before the rim's gap, where the low
  // sun comes in: 110 to 190 m along the cliff past the root, 88 to 124 m out, about the tree's height
  const bt = R_.bats, bw = bt.range(110, 190), btt = bt.range(88, 124), bdy = bt.range(-6, 10);
  { const c = P.fromWT(bw, btt); P.bats = { x: c[0], z: c[1], y: M.TREE_Y + bdy, radius: 16, reach: 30 }; }
}

// chimney stacks with their pots
export function chimneysInto(A, list) {
  for (const c of list) {
    A.col(toneOf(c.tone), 0.98 + 0.25 * h1(c.sd)).kind(KIND.MASON, 0, 0, 1);
    boxInto(A, c.x, c.z, c.yaw, c.hw, c.hl, c.y0, c.y1, {});
    A.col(PAL.stoneDark, 0.8).kind(KIND.PLAIN); boxInto(A, c.x, c.z, c.yaw, c.hw + 0.12, c.hl + 0.12, c.y1, c.y1 + 0.18, { top: true });
    const F = frameOf(c.x, c.z, c.yaw);
    A.col([0.3, 0.16, 0.11], 0.8 + 0.3 * h1(c.sd * 3.1));
    for (let k = 0; k < c.pots; k++) { const p = F(0, 0, c.pots === 1 ? 0 : lerp(-c.hl * 0.6, c.hl * 0.6, k / (c.pots - 1))); drumInto(A, p[0], p[2], 0.24, 0.17, c.y1 + 0.18, c.y1 + 1.05, 4); }
  }
}
// dormers: a small gabled window standing out of a roof's slope, its pane lit in its turn
export function dormersInto(A, list) {
  for (const d of list) {
    const m = d.m, F = frameOf(m.x, m.z, m.yaw), c = Math.cos(m.yaw), s = Math.sin(m.yaw), sx = d.side, xf = sx * m.hw * 0.7, yb = roofY(m, xf), big = d.big || 1, yt = yb + 1.7 * big, yr = yt + 0.8 * big;
    const xAt = (y) => sx * m.hw * clamp((m.ridge - y) / Math.max(0.01, m.ridge - m.eave), 0, 1), xw = xAt(yt), xr = xAt(yr), z0 = d.lz - d.wide, z1 = d.lz + d.wide;
    A.col(toneOf(m.tone), 1.05).kind(KIND.MASON, 0, 0, 1);
    quadOut(A, F(xf, yb - 0.3, z0), F(xf, yb - 0.3, z1), F(xf, yt, z1), F(xf, yt, z0), sx * c, 0, sx * s);
    triOut(A, F(xf, yt, z0), F(xf, yt, z1), F(xf, yr, d.lz), sx * c, 0, sx * s);
    triOut(A, F(xf, yb - 0.3, z0), F(xf, yt, z0), F(xw, yt, z0), -s, 0, c); triOut(A, F(xf, yb - 0.3, z1), F(xf, yt, z1), F(xw, yt, z1), s, 0, -c);
    A.col(roofCol(m)).kind(KIND.SLATE);
    quadOut(A, F(xf + sx * 0.25, yt, z0 - 0.2), F(xf + sx * 0.25, yr, d.lz), F(xr, yr, d.lz), F(xw, yt, z0 - 0.2), -s, 1, c);
    quadOut(A, F(xf + sx * 0.25, yt, z1 + 0.2), F(xf + sx * 0.25, yr, d.lz), F(xr, yr, d.lz), F(xw, yt, z1 + 0.2), s, 1, -c);
    A.col(PAL.window).kind(KIND.PANE, d.order, 0, 1);
    quadOut(A, F(xf + sx * 0.04, yb + 0.35 * big, z0 + 0.28 * big), F(xf + sx * 0.04, yb + 0.35 * big, z1 - 0.28 * big), F(xf + sx * 0.04, yt - 0.12, z1 - 0.28 * big), F(xf + sx * 0.04, yt - 0.12, z0 + 0.28 * big), sx * c, 0, sx * s);
  }
}
// THE CLAY DWELLINGS, of mud, low, against the wall's foot: a round house is a beehive of clay (its wall leans in
// from a broad foot sunk in the ground to its shoulder; a shallow dome of the same clay closes it, smooth all
// round, sooty toward its crown); a long one has a low rounded roof over leaning walls; a doorway in a frame of
// dark wood shows its fire; the walls are dark at their foot, where they meet the trodden ground (the stone's
// shader darkens a wall's lowest metre: aK.y carries the ground's height under the house).
// MENDING 2, S3: THEY ARE HUTS, NOT PALE LUMPS, by this maker's own law and with no triangle more: THE CLAY IS A
// SHADE DARKER THAN THE TRODDEN GROUND it was dug from (three quarters of the mud's own colour, where it was more
// than half as pale again); THE ROOF IS OLD THATCH, dark and grey-brown, one in four black with soot, and ITS EAVE
// STANDS OUT over the wall's head all round (a seventh of the house's radius; 0.4 m on a long house), a dark line
// of thatch over the paler wall; THE DOORWAY'S DARK is 1.1 to 1.5 m broad, by the house's size
export function hutsInto(A, list) {
  for (const h of list) {
    const clay = mul3(mix3(PAL.mud, PAL.mudDark, 0.5 * h1(h.x * 0.37 + h.z * 0.11)), 0.75 * h.tone), F = frameOf(h.x, h.z, h.yaw), c = Math.cos(h.yaw), s = Math.sin(h.yaw);
    // (the roof by the house's own place: old thatch; one in four is black with soot)
    const mk = h1(h.x * 0.91 + h.z * 0.53), roof = mul3([0.082, 0.066, 0.046], ((mk < 0.25 ? 0.5 : 0.8) + 0.4 * h1(h.x * 0.23 + h.z * 0.77)) * h.tone), r = (h.hw + h.hl) / 2;
    const g = h.y0 + 1.5, foot = clamp((g + 4) / 80, 0.01, 0.45), top = Math.min(g + 1.6, h.y1 - 0.9);
    let fb, ft;
    // (the walls take the lanes' lantern light: aK.z)
    A.col(clay).kind(KIND.MUD, foot, 1, 1);
    if (h.roof < 0.72) {
      // A ROUND CLAY HOUSE (eight lengths of wall, one of them square to its doorway)
      const yw = h.y1 - 0.5, yd = yw + 0.3 * r, tu = h.yaw + Math.PI / 8, rAt = (y) => r * lerp(1.3, 0.98, clamp((y - h.y0) / (yw - h.y0), 0, 1)) * Math.cos(Math.PI / 8);
      drumInto(A, h.x, h.z, r * 1.3, r * 0.98, h.y0, yw, 8, { turn: tu });
      A.col(roof).kind(KIND.MUD, 0.49, 0, 1);
      drumInto(A, h.x, h.z, r * 1.12, r * 0.6, yw - 0.24, yd, 8, { turn: tu });
      A.col(roof, 0.8); crownInto(A, h.x, h.z, r * 0.6, yd, yw + 0.46 * r + 0.1, 8, tu);
      fb = rAt(g - 0.1); ft = rAt(top + 0.22);
    } else {
      // a long clay house: leaning walls, a low rounded roof of clay over them, clay gables under it
      const y1 = h.y1 - 0.4, yh = y1 + 0.2 + 0.3 * h.hw, ym = y1 + (yh - y1) * 0.72, bw = h.hw * 0.9, bl = h.hl * 0.9, e = 0.4;
      boxInto(A, h.x, h.z, h.yaw, h.hw, h.hl, h.y0, y1, { batter: 0.1 });
      A.col(roof).kind(KIND.MUD, 0.49, 0, 1);
      for (const sx of [-1, 1]) {
        quadOut(A, F(sx * (bw + e), y1 - 0.3, -bl - e), F(sx * bw * 0.5, ym, -bl - e), F(sx * bw * 0.5, ym, bl + e), F(sx * (bw + e), y1 - 0.3, bl + e), sx * c, 1, sx * s);
        quadOut(A, F(sx * bw * 0.5, ym, -bl - e), F(0, yh, -bl - e), F(0, yh, bl + e), F(sx * bw * 0.5, ym, bl + e), sx * c, 1, sx * s);
      }
      A.col(clay).kind(KIND.MUD, foot, 1, 1);
      for (const sz of [-1, 1]) {
        triOut(A, F(-bw, y1, sz * bl), F(bw, y1, sz * bl), F(bw * 0.5, ym, sz * bl), sz * s, 0, -sz * c); triOut(A, F(-bw, y1, sz * bl), F(bw * 0.5, ym, sz * bl), F(-bw * 0.5, ym, sz * bl), sz * s, 0, -sz * c);
        triOut(A, F(-bw * 0.5, ym, sz * bl), F(bw * 0.5, ym, sz * bl), F(0, yh, sz * bl), sz * s, 0, -sz * c);
      }
      const hAt = (y) => h.hl * (1 - 0.1 * clamp((y - h.y0) / (y1 - h.y0), 0, 1));
      fb = hAt(g - 0.1); ft = hAt(top + 0.22);
    }
    // the doorway looks on its lane (local z): a frame of dark wood laid to the wall's own lean, and the room behind it
    const dw = Math.min(0.75, Math.max(0.55, r * 0.42)); A.col([0.03, 0.025, 0.02]).kind(KIND.PLAIN); quadOut(A, F(-dw, g - 0.1, fb + 0.03), F(dw, g - 0.1, fb + 0.03), F(dw, top + 0.22, ft + 0.03), F(-dw, top + 0.22, ft + 0.03), s, 0, -c);
    A.col([1, 0.5, 0.18], 0.8).kind(KIND.PANE, h.order, 0, 1);
    quadOut(A, F(-0.38, g, fb + 0.06), F(0.38, g, fb + 0.06), F(0.38, top, ft + 0.06), F(-0.38, top, ft + 0.06), s, 0, -c);
  }
}
// THE DWELLINGS' YARDS: lengths of wattle fence and stacks of cut wood, each where the plan put it
export function yardsInto(A, list) {
  for (const q of list) {
    if (q.wood) {
      A.col([0.12, 0.092, 0.06], 0.8 + 0.4 * h1(q.x * 0.7)).kind(KIND.MUD, 0.49, 1, 1); boxInto(A, q.x, q.z, q.yaw, 0.42, q.len / 2, q.y - 0.3, q.y + 0.55, { top: true });
      A.col([0.15, 0.115, 0.075]); boxInto(A, q.x, q.z, q.yaw, 0.27, q.len / 2 - 0.12, q.y + 0.55, q.y + 0.9, { top: true });
    } else {
      A.col([0.085, 0.066, 0.045], 0.85 + 0.3 * h1(q.z * 0.7)).kind(KIND.MUD, 0.49, 1, 1); boxInto(A, q.x, q.z, q.yaw, 0.05, q.len / 2, q.y - 0.3, q.y + 0.85, { top: true });
      const F = frameOf(q.x, q.z, q.yaw), p = F(0, 0, q.len / 2); boxInto(A, p[0], p[2], q.yaw, 0.07, 0.07, q.y - 0.3, q.y + 1.15, { top: true });
    }
  }
}
// the dwellings' cooking fires: a heap of embers in a ring of stones (their glow on the ground and the walls about
// them is the stone shader's, by setFires)
export function firesInto(A, list) {
  for (const f of list) {
    A.col([1, 0.42, 0.1], 1.5).kind(KIND.GLOW); boxInto(A, f.x, f.z, f.ph * TAU, 0.34, 0.3, f.y - 0.3, f.y + 0.12, { top: true });
    A.col([1, 0.7, 0.25], 2.2); boxInto(A, f.x, f.z, f.ph * TAU + 0.7, 0.14, 0.16, f.y + 0.12, f.y + 0.42, { top: true });
    A.col([0.09, 0.08, 0.075]).kind(KIND.PLAIN);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + f.ph * 3; boxInto(A, f.x + Math.sin(a) * 0.62, f.z - Math.cos(a) * 0.62, a, 0.17, 0.2, f.y - 0.3, f.y + 0.02 + 0.1 * h1(k + f.ph * 9), { top: true }); }
  }
}
// the ground: the mound and the plain outside the outer wall, the courts between the ranges inside it
export function planFloor(P) {
  P.floorY = (x, z) => {
    if (P.inside(x, z) < 0) return P.moundY(x, z);
    const reg = P.regionOf(x, z, 40), y = P.hill(x, z) - 24;
    return reg === 2 || reg === 3 || reg === 6 || reg === 7 || reg === 8 || reg === 9 ? Math.min(y, 58) : reg === 5 || reg === 10 ? Math.min(y, M.LANE_Y - 8) : y;
  };
}
export async function floorInto(A, P) {
  const [x0, x1, z0, z1] = P.box;
  const grid = async (ax, bx, az, bz, cell, drop, hole) => {
    const nx = Math.ceil((bx - ax) / cell), nz = Math.ceil((bz - az) / cell), Yv = new Float32Array((nx + 1) * (nz + 1));
    for (let j = 0; j <= nz; j++) { for (let i = 0; i <= nx; i++) Yv[j * (nx + 1) + i] = P.floorY(ax + i * cell, az + j * cell) - drop; if (j % 3 === 2) await P.Y(); }
    for (let j = 0; j < nz; j++) { if (j % 4 === 3) await P.Y(); for (let i = 0; i < nx; i++) {
      const xa = ax + i * cell, za = az + j * cell, xb = xa + cell, zb = za + cell;
      if (hole && xa >= hole[0] && xb <= hole[1] && za >= hole[2] && zb <= hole[3]) continue;
      const mx = (xa + xb) / 2, mz = (za + zb) / 2, outside = P.inside(mx, mz) < 0;
      // (the trodden ground carries how near the wall's foot it lies within the dwellings' stretch of the wall: their lanes)
      if (outside) A.col(PAL.mud, 0.95).kind(KIND.MUD, 1, P.lanes(mx, mz), 1); else A.col(PAL.flags, 0.8).kind(KIND.FLAGS, 0, 0, 0.6);
      const k = j * (nx + 1) + i;
      quadOut(A, [xa, Yv[k], za], [xb, Yv[k + 1], za], [xb, Yv[k + nx + 2], zb], [xa, Yv[k + nx + 1], zb], 0, 1, 0);
    } }
  };
  // THE GROUND: fine ground is laid over the castle's own box and 264 m beyond it on every side (the plan's box: the
  // wall's frame, not the line's), and a wide sheet under it 3240 m from the box's middle to every side, so the plain
  // lies under the entry's straight continued back for 2.5 km and more
  const pad = 264, cell = 24, nx0 = Math.floor((x0 - pad) / cell) * cell, nz0 = Math.floor((z0 - pad) / cell) * cell, nx1 = Math.ceil((x1 + pad) / cell) * cell, nz1 = Math.ceil((z1 + pad) / cell) * cell;
  await grid(nx0, nx1, nz0, nz1, cell, 0, null);
  const cx = Math.round((x0 + x1) / 2), cz = Math.round((z0 + z1) / 2);
  await grid(cx - 3240, cx + 3240, cz - 3240, cz + 3240, 180, 2.5, [nx0 + 180, nx1 - 180, nz0 + 180, nz1 - 180]);
}

// the finger tower: a huge shaft built storey on storey in different ages, dark ivy over it, its head broken off; the window arch that holds the
// ring stands in the storey at the ring's height, lit from within; the owls' windows are dark slits in the storeys above
export function fingerInto(A, P) {
  const F = P.finger, S = 44, OPEN = 2, half = OPEN / S * TAU, up = F.az + Math.PI, stone = mul3(PAL.stone, 0.8), bd = dirOf(F.bite);
  const y0a = F.ringY - 10, y1a = F.ringY + 12, Ys = fingerYs(F);
  const mid = (y) => { const k = F.lean * Math.max(0, (y - y1a) / 25); return [F.x + bd[0] * k, F.z + bd[1] * k]; };
  for (let i = 0; i < Ys.length - 1; i++) {
    const ya = Ys[i], yb = Ys[i + 1], c = mid(ya), ra = fingerR(F, ya) * (i === 3 ? 1 : 1 + 0.02 * (i % 2)), rb = fingerR(F, yb);
    if (i === 3) continue;
    // (MENDING 1, M2: THE TOWER IS THE OWLS': every storey's own windows are dark at every hour, the stone's dress 5)
    A.col(stone, (0.9 + 0.2 * h1(i + F.top0)) * (i >= 10 ? 0.7 : i >= 4 ? 0.8 : 1)).kind(KIND.MASON, 3 + i + 0.2, 5 + 0.3 + 0.2 * h1(i * 3 + F.top0) + (i >= 5 ? 0.06 : 0), 1);
    drumInto(A, c[0], c[1], ra, rb, ya, yb, S);
    // a collar of worn stone where one age of building stands on another
    A.col(stone, 0.8).kind(KIND.MASON, 0, 0.3, 1); drumInto(A, c[0], c[1], ra + 1.1, ra + 0.1, ya - 0.4, ya + 2.2, S);
  }
  // the storey of the arch: the wall left open for two of its 44 panels (16.4 degrees) to either side of the lane's
  // bearing; the chamber's own wall stands 4.2 m inside the shaft's face
  const ra = F.rRing, cw = Math.cos(half) * ra, hw = Math.sin(half) * ra, ri = ra - 4.2;
  A.col(stone, 0.95).kind(KIND.MASON, 0, 0.3, 1);
  for (let i = OPEN; i < S - OPEN; i++) {
    const t0 = up + i / S * TAU, t1 = up + (i + 1) / S * TAU, s0 = Math.sin(t0), c0 = Math.cos(t0), s1 = Math.sin(t1), c1 = Math.cos(t1), u0 = i / S * TAU * ra, u1 = (i + 1) / S * TAU * ra;
    A.v(F.x + ra * s0, y0a, F.z - ra * c0, s0, 0, -c0, u0, y0a); A.v(F.x + ra * s1, y1a, F.z - ra * c1, s1, 0, -c1, u1, y1a); A.v(F.x + ra * s1, y0a, F.z - ra * c1, s1, 0, -c1, u1, y0a);
    A.v(F.x + ra * s0, y0a, F.z - ra * c0, s0, 0, -c0, u0, y0a); A.v(F.x + ra * s0, y1a, F.z - ra * c0, s0, 0, -c0, u0, y1a); A.v(F.x + ra * s1, y1a, F.z - ra * c1, s1, 0, -c1, u1, y1a);
  }
  // the chamber behind the arch: its walls, floor and vault glow dimly (the lamp-lit inside of the tower, darker
  // than the ring that stands before it)
  const d = dirOf(up), r = [Math.cos(up), Math.sin(up)], at = (lx, y, lz) => [F.x + d[0] * lz + r[0] * lx, y, F.z + d[1] * lz + r[1] * lx];
  A.kind(KIND.GLOW);
  for (let i = 0; i < S; i++) {
    const t0 = i / S * TAU, t1 = (i + 1) / S * TAU, s0 = Math.sin(t0), c0 = Math.cos(t0), s1 = Math.sin(t1), c1 = Math.cos(t1);
    // (every fourth panel is a pier in its own shadow)
    A.col([1, 0.38, 0.09], i % 4 === 0 ? 0.035 : 0.11 + 0.035 * h1(i * 3 + F.top0));
    A.v(F.x + ri * s0, y0a, F.z - ri * c0, -s0, 0, c0, 0, 0); A.v(F.x + ri * s1, y0a, F.z - ri * c1, -s1, 0, c1, 0, 0); A.v(F.x + ri * s1, y1a, F.z - ri * c1, -s1, 0, c1, 0, 0);
    A.v(F.x + ri * s0, y0a, F.z - ri * c0, -s0, 0, c0, 0, 0); A.v(F.x + ri * s1, y1a, F.z - ri * c1, -s1, 0, c1, 0, 0); A.v(F.x + ri * s0, y1a, F.z - ri * c0, -s0, 0, c0, 0, 0);
  }
  for (let i = 0; i < S; i++) {
    const t0 = i / S * TAU, t1 = (i + 1) / S * TAU, pa = [F.x + ri * Math.sin(t0), F.z - ri * Math.cos(t0)], pb = [F.x + ri * Math.sin(t1), F.z - ri * Math.cos(t1)];
    A.col([1, 0.4, 0.1], 0.16); triOut(A, [F.x, y0a + 0.3, F.z], [pa[0], y0a + 0.3, pa[1]], [pb[0], y0a + 0.3, pb[1]], 0, 1, 0);
    A.col([1, 0.36, 0.09], 0.05); triOut(A, [F.x, y1a - 0.2, F.z], [pa[0], y1a - 0.2, pa[1]], [pb[0], y1a - 0.2, pb[1]], 0, -1, 0);
  }
  // THE ARCH IS SET IN THE TOWER'S OWN STONE: the wall's face over the pointed head; a deep recess, its two piers of
  // dressed masonry standing 0.6 m out of the face and running back through the wall's whole thickness to the
  // chamber (their inner sides are the reveals, which take the ring's own light); round the head a band of sixteen
  // voussoirs, each its own stone, with the vault of the reveal behind them and a keystone at the point; a sill of
  // dressed stone standing out on five corbels
  A.col(stone, 0.95).kind(KIND.MASON, 0, 0.3, 1);
  const arcAt = (sx, th, rad) => at(sx * (rad * Math.cos(th) - hw), y1a - 9 + rad * Math.sin(th) * 9 / (2 * hw * Math.sin(Math.PI / 3)), 0), R0 = 2 * hw, NV = 8, out = cw + 0.6, back = ri * Math.cos(half) - 0.8;
  const onPlane = (p, lz) => [p[0] + d[0] * lz, p[1], p[2] + d[1] * lz];
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) triOut(A, at(sx * hw, y1a, cw), onPlane(arcAt(sx, k / 5 * Math.PI / 3, R0), cw), onPlane(arcAt(sx, (k + 1) / 5 * Math.PI / 3, R0), cw), d[0], 0, d[1]);
  const dressed = mul3(PAL.stone, 0.98);
  for (const sx of [-1, 1]) {
    // (the pier: from the sill to the arch's spring)
    A.col(dressed, 1.02).kind(KIND.MASON, 0, 0, 1);
    { const p = at(sx * (hw + 0.6), 0, (out + back) / 2); boxInto(A, p[0], p[2], up, 0.9, (out - back) / 2, y0a, y1a - 9, {}); }
    for (let k = 0; k < NV; k++) {
      const t0 = k / NV * Math.PI / 3, t1 = (k + 1) / NV * Math.PI / 3, i0 = arcAt(sx, t0, R0 - 0.3), i1 = arcAt(sx, t1, R0 - 0.3), o0 = arcAt(sx, t0, R0 + 1.5), o1 = arcAt(sx, t1, R0 + 1.5), tm = (t0 + t1) / 2;
      A.col(dressed, k % 2 ? 0.9 : 1.1).kind(KIND.MASON, 0, 0, 1);
      // (its face, the vault of the reveal under it, its back toward the wall)
      quadOut(A, onPlane(i0, out), onPlane(i1, out), onPlane(o1, out), onPlane(o0, out), d[0], 0, d[1]);
      quadOut(A, onPlane(i0, out), onPlane(i1, out), onPlane(i1, back), onPlane(i0, back), sx * r[0] * Math.cos(tm), -Math.sin(tm), sx * r[1] * Math.cos(tm));
      quadOut(A, onPlane(o0, out), onPlane(o1, out), onPlane(o1, cw - 0.2), onPlane(o0, cw - 0.2), -sx * r[0] * Math.cos(tm), Math.sin(tm), -sx * r[1] * Math.cos(tm));
    }
  }
  // (the keystone, and the sill on its corbels)
  A.col(dressed, 1.16).kind(KIND.MASON, 0, 0, 1);
  { const p = at(0, 0, out - 0.5); boxInto(A, p[0], p[2], up, 0.7, 0.75, y1a - 1.1, y1a + 1.7, { top: true }); }
  // (the storey under the arch is 0.8 m the wider: the sill stands 1 m out of that wall at its middle, and the
  // corbels run back into it)
  { const p = at(0, 0, cw + 0.7); A.col(dressed, 1.12); boxInto(A, p[0], p[2], up, hw + 1.9, 2.2, y0a - 1.1, y0a + 0.35, { top: true }); }
  A.col(dressed, 0.9);
  for (let k = -2; k <= 2; k++) { const p = at(k * (hw + 1.2) / 2, 0, cw + 1.2); boxInto(A, p[0], p[2], up, 0.5, 1.65, y0a - 2.6, y0a - 1.1, {}); }
  // THE TOWER'S FOOT ON ITS ROUND: a plinth of darker stone stands out round the shaft where it meets the paving, a
  // weathered course leaning back from it to the wall, a string of dressed stone a man's height over that; and the
  // paving against the foot is a ring of older, darker flags
  { const yf = P.lane.y, rf = fingerR(F, yf);
    A.col(stone, 0.72).kind(KIND.MASON, 0, 0.35, 1); drumInto(A, F.x, F.z, rf + 2.1, rf + 1.9, yf - 0.6, yf + 1.5, S, { top: true });
    A.col(stone, 0.84).kind(KIND.MASON, 0, 0.2, 1); drumInto(A, F.x, F.z, rf + 1.5, rf + 0.3, yf + 1.5, yf + 3.3, S);
    A.col(stone, 1.1).kind(KIND.MASON, 0, 0, 1); drumInto(A, F.x, F.z, rf + 0.55, rf + 0.55, yf + 5.2, yf + 5.75, S, { top: true });
    A.col(PAL.flags, 0.6).kind(KIND.FLAGS, up, 4, 1);
    for (let i = 0; i < S; i++) { const t0 = i / S * TAU, t1 = (i + 1) / S * TAU, pt = (t, rr) => [F.x + Math.sin(t) * rr, yf + 0.04, F.z - Math.cos(t) * rr]; quadOut(A, pt(t0, rf + 2), pt(t1, rf + 2), pt(t1, rf + 5.5), pt(t0, rf + 5.5), 0, 1, 0); } }
  // the head: broken, bitten deepest on one side
  const ct = mid(F.top - 26);
  A.col(stone, 0.7).kind(KIND.MASON, 0, 0.5, 1);
  ruinInto(A, ct[0], ct[1], fingerR(F, F.top - 26), F.top - 26, F.top, 24, fingerRag(F), 1.7);
  // the smaller towers on it: each on its corbel, with its own windows and its own head
  for (const t of F.turrets) {
    if (!t.on) continue;
    const c = mid(t.y), rr = fingerR(F, t.y) + t.r * 0.32, x = c[0] + Math.sin(t.th) * rr, z = c[1] - Math.cos(t.th) * rr, st = mul3(PAL.stone, 0.85 + 0.3 * h1(t.sd));
    A.col(st, 0.85).kind(KIND.MASON, 0, 0.2 * h1(t.sd + 4), 1); drumInto(A, x, z, t.r * 0.3, t.r * 1.06, t.y - t.r * 1.8, t.y, 10);
    A.col(st).kind(KIND.MASON, t.sd + 0.34, 5 + 0.5 * h1(t.sd + 5), 1); drumInto(A, x, z, t.r, t.r, t.y, t.y + t.h, 10);
    capInto(A, x, z, t.r, t.y + t.h, t.cap, 10, { stone: st, slate: PAL.slate, sd: t.sd, lod: 0, round: true, yaw: 0, ivy: 0.3 });
  }
  // six stone fins round its foot, each to its own height, standing out of the shaft (one whose head would stand
  // less than 3 m over the round's paving ends under it; one that stands over it has a foot of the plinth's stone)
  for (let k = 0; k < 6; k++) {
    const a = up + (k + 0.5) / 6 * TAU, drawn = 46 + 58 * h1(k * 5 + F.top0), rr = fingerR(F, drawn * 0.5) + 1.5, yf = P.lane.y, top = drawn < yf + 3 ? Math.min(drawn, yf - 0.6) : drawn;
    A.col(stone, 0.85 + 0.2 * h1(k + 2)).kind(KIND.MASON, 0, 0.5 * h1(k + 9), 1);
    boxInto(A, F.x + Math.sin(a) * rr, F.z - Math.cos(a) * rr, a, 3.2, 6.5, F.base, top, { top: true });
    if (top > yf) { A.col(stone, 0.72).kind(KIND.MASON, 0, 0.35, 1); boxInto(A, F.x + Math.sin(a) * rr, F.z - Math.cos(a) * rr, a, 3.8, 7.1, yf - 0.6, yf + 1.5, { top: true }); }
  }
  // the owls' windows: dark slits with a paler sill. MENDING 1, M2: THE TOWER IS THE OWLS', ITS LAMPS FEW AND LOW: no
  // window of the tower's upper two thirds is lit at any hour. In its lowest third (from the round's paving to a
  // third of the way up to its broken head) three in ten of the owls' windows keep a lamp (by the window's own
  // place), DIM, each lit and put out with the hour's standing share at its own place in the order of lighting,
  // none among the first three tenths (none by day or at dawn). Nothing of it reads the eye or the metres flown.
  // MENDING 2, G1: AT MOST THREE LOW DIM LAMPS IN THE WHOLE TOWER on any seed, the front's lamp behind its boards
  // among them: of the windows the law above lights, those with the lowest numbers of their own are kept (three,
  // or two where the front keeps its lamp); the rest are dark, after every draw
  const yLow = P.lane.y + (F.top - P.lane.y) / 3, owlN = (w) => h1(w.th * 7.3 + w.y * 0.37);
  const owlLit = P.owlWindows.filter((w) => w.y + 1.5 < yLow && owlN(w) < 0.3).sort((a, b) => owlN(a) - owlN(b)).slice(0, 3 - (F.front.open.some((o) => o.lamp) ? 1 : 0));
  for (const w of P.owlWindows) {
    const W = fingerWall(F, w.y), rr = W.r + 0.06, lit = owlLit.includes(w);
    if (lit) A.col([1, 0.55, 0.2], 0.14).kind(KIND.PANE, 0.3 + 0.6 * h1(w.th * 3.1 + w.y), 0, 1); else A.col([0.02, 0.02, 0.03]).kind(KIND.PLAIN);
    boxInto(A, W.x + Math.sin(w.th) * rr, W.z - Math.cos(w.th) * rr, w.th, 0.55, 0.08, w.y - 1.1, w.y + 1.5, {});
    A.col(PAL.stoneWarm, 0.9).kind(KIND.PLAIN); boxInto(A, W.x + Math.sin(w.th) * rr, W.z - Math.cos(w.th) * rr, w.th, 0.8, 0.3, w.y - 1.4, w.y - 1.1, { top: true });
  }
  // THE HIGH WINDOWS (the plan's F.lights, round 7's fork 'r7tower', its draws as they were): tall lancets of the
  // storeys over the old height. MENDING 1, M2: they stand in the upper two thirds: EMPTY AND DARK at every hour, in
  // a surround of the tower's own worn stone (no lamp is kept up there: the owls')
  for (const w of F.lights) {
    if (!w.on) continue;
    const W = fingerWall(F, w.y), rr = W.r + 0.1, sn = Math.sin(w.th), cs = Math.cos(w.th), x = W.x + sn * rr, z = W.z - cs * rr, ya = w.y - w.tall / 2, yb = w.y + w.tall / 2;
    A.col(stone, 0.78 + 0.1 * w.warm).kind(KIND.MASON, 0, 0.2, 1); boxInto(A, x, z, w.th, 2.0, 0.16, ya - 0.6, yb + 0.7, { top: true });
    A.col([0.02, 0.02, 0.03]).kind(KIND.PLAIN);
    boxInto(A, x + sn * 0.14, z - cs * 0.14, w.th, 1.5, 0.1, ya, yb - 1.6, {}); boxInto(A, x + sn * 0.14, z - cs * 0.14, w.th, 0.85, 0.1, yb - 1.6, yb, {});
  }
  // THE ARCH'S GREAT FRONT (round 7, B3: the tower's recess given its scale, the ring's own recess as it was): to
  // either hand of the old arch a great pier stands out of the shaft from the round's paving, in three stages with
  // set-offs; from pier to pier a great pointed arch of twelve voussoirs springs 16 m over the old arch's head, its
  // crown 35 m over it. The whole front is 30.6 m broad at its foot (29 m at the arch's springing): it stands across
  // the end of the lane's own axis, where the lane opens on the tower's round, and the ring's light lies on its
  // reveals.
  // MENDING 1, M1: A GREAT BROKEN GATE OF THE TOWER, NOT A CHURCH'S FRONT. The piers and the arch are BARE OLD MASONRY
  // OF THE TOWER'S OWN STONE, stage by stage a little darker or paler, patched with the black ivy, no fresh
  // dressing; each voussoir its own depth, so that the arch's back is ragged; no pale keystone. The pinnacles are
  // gone: over each pier A BROKEN STUMP, the two of unequal height (the plan's F.front.stumps), its head stepping
  // down in three broken lifts. Over the old arch THREE OPENINGS, NO TWO ALIKE (the plan's F.front.open: place,
  // sill, breadth and height each its own; the tall one never in the middle), each DARK: walled up with other
  // stone, shuttered with old boards, or empty; at most one keeps a dim lamp behind its boards by the hour's
  // standing share. THE RING IS THE ONE LIGHT AT THE TOWER'S FOOT.
  // THE PASSAGE (rule S), as round 7 has it: the line goes in between the piers, 10.8 m of clear way to either hand
  // of it and 28 m and more under the great arch's lowest stone (no stone of the front stands nearer than before:
  // the stumps stand inside the place of the old pinnacles' shafts, the openings on the shaft's own face)
  {
    const yf = P.lane.y, gx = hw + 5.2, gh = gx - 1.7, ysG = y1a + 16, RG = 2 * gh, front = cw + 2.6, backG = 21.5, FR = F.front;
    const pier = (sx, lz0, lz1, hwp, ya, yb, o) => { const p = at(sx * gx, 0, (lz0 + lz1) / 2); boxInto(A, p[0], p[2], up, hwp, (lz1 - lz0) / 2, ya, yb, o); };
    for (const sx of [-1, 1]) {
      const hs = (k) => h1(k * 3.3 + sx * 1.7 + F.top0), hStump = FR.stumps[sx < 0 ? 0 : 1], z0 = backG + 1, z1 = front - 0.9, yS = ysG + 2;
      A.col(stone, 0.7 + 0.08 * hs(1)).kind(KIND.MASON, 0, 0.34 + 0.1 * hs(2), 1); pier(sx, backG, front + 2.0, 2.5, yf - 0.6, yf + 5.75, { top: true });
      A.col(stone, 0.86 + 0.14 * hs(3)).kind(KIND.MASON, 0, 0.3 + 0.16 * hs(4), 1); pier(sx, backG, front + 0.8, 2.1, yf + 5.75, y0a + 8, { top: true });
      A.col(stone, 0.92 + 0.16 * hs(5)).kind(KIND.MASON, 0, 0.26 + 0.2 * hs(6), 1); pier(sx, backG, front, 1.7, y0a + 8, yS, { top: true });
      // (the stump: its shaft whole for seven tenths of its height, then two broken lifts, each a part of the shaft's
      // own square, the last a tooth of masonry at the back)
      A.col(stone, 0.84 + 0.14 * hs(7)).kind(KIND.MASON, 0, 0.3 + 0.22 * hs(8), 1); pier(sx, z0, z1, 1.2, yS, yS + hStump * 0.7, { top: true });
      A.col(stone, 0.78 + 0.12 * hs(9)).kind(KIND.MASON, 0, 0.4, 1); pier(sx, z0, lerp(z0, z1, 0.45 + 0.2 * hs(10)), 1.2, yS + hStump * 0.7, yS + hStump * (0.8 + 0.1 * hs(11)), { top: true });
      { const p = at(sx * (gx + 0.5 * (hs(12) < 0.5 ? -1 : 1)), 0, z0 + 0.9); boxInto(A, p[0], p[2], up, 0.7, 0.9, yS + hStump * 0.7, yS + hStump, { top: true }); }
    }
    // (THE GATE'S RECESS: the shaft's own wall between the piers and under the great arch stands in the arch's shade:
    // a skin a hand's breadth off the wall, the tower's own stone with its ivy, which takes four tenths of the
    // sky's light and all of the ring's; its head follows the arch's back, behind the voussoirs)
    { const NSK = 10, yb0 = y1a + 2.3, head = (x) => ysG + Math.sqrt(Math.max(0, (RG + 1.2) * (RG + 1.2) - (Math.abs(x) + gh) * (Math.abs(x) + gh)));
      const on = (x, y) => { const W = fingerWall(F, y), rr = W.r + 0.1, th = up + x / rr; return [W.x + Math.sin(th) * rr, y, W.z - Math.cos(th) * rr]; };
      A.col(stone, 0.72).kind(KIND.MASON, 0, 0.36, 0.4);
      for (let j = 0; j < NSK; j++) { const xa = -gh + 2 * gh * j / NSK, xb = -gh + 2 * gh * (j + 1) / NSK; quadOut(A, on(xa, yb0), on(xb, yb0), on(xb, head(xb)), on(xa, head(xa)), d[0], 0, d[1]); } }
    const arcG = (sx, th, rad) => [sx * (rad * Math.cos(th) - gh), ysG + rad * Math.sin(th)], P3 = (q, lz) => at(q[0], q[1], lz), NG = 6, bk = backG + 1.5;
    for (const sx of [-1, 1]) for (let k = 0; k < NG; k++) {
      const hv = h1(k * 5.1 + sx * 2.3 + F.top0), dep = 2.0 + 1.0 * hv;
      const t0 = k / NG * Math.PI / 3, t1 = (k + 1) / NG * Math.PI / 3, tm = (t0 + t1) / 2, i0 = arcG(sx, t0, RG), i1 = arcG(sx, t1, RG), o0 = arcG(sx, t0, RG + dep), o1 = arcG(sx, t1, RG + dep);
      A.col(stone, (k % 2 ? 0.84 : 0.98) + 0.1 * hv).kind(KIND.MASON, 0, 0.22 + 0.24 * h1(k * 7.7 + sx), 1);
      // (its face, its under side toward the opening, its back toward the sky, and the end it shows where its
      // neighbour is the shallower)
      quadOut(A, P3(i0, front), P3(i1, front), P3(o1, front), P3(o0, front), d[0], 0, d[1]);
      { const kk = A.k; A.k = [kk[0], kk[1], kk[2], 0.5]; quadOut(A, P3(i0, front), P3(i1, front), P3(i1, bk), P3(i0, bk), -sx * r[0] * Math.cos(tm), -Math.sin(tm), -sx * r[1] * Math.cos(tm)); A.k = kk; }
      quadOut(A, P3(o0, front), P3(o1, front), P3(o1, bk), P3(o0, bk), sx * r[0] * Math.cos(tm), Math.sin(tm), sx * r[1] * Math.cos(tm));
      for (const [tt, sg] of [[t0, -1], [t1, 1]]) { const ia = arcG(sx, tt, RG + 1.9), oa = arcG(sx, tt, RG + dep); quadOut(A, P3(ia, front), P3(oa, front), P3(oa, bk), P3(ia, bk), -sg * sx * r[0] * Math.sin(tt), sg * Math.cos(tt), -sg * sx * r[1] * Math.sin(tt)); }
    }
    { const ya = ysG + RG * Math.sin(Math.PI / 3), p = at(0, 0, front - 0.5); A.col(stone, 0.86).kind(KIND.MASON, 0, 0.3, 1); boxInto(A, p[0], p[2], up, 1.1, 0.9, ya - 0.8, ya + 2.9, { top: true }); }
    // (the three openings over the old arch: each on the shaft's own face at its own bearing; its surround the tower's
    // own worn stone, a sill slab under it)
    for (const o of FR.open) {
      const ya = y1a + o.sill, yb = ya + o.h, W = fingerWall(F, (ya + yb) / 2), rr = Math.max(fingerWall(F, ya).r, W.r) + 0.12, th = up + o.x / rr, sn = Math.sin(th), cs = Math.cos(th), x = W.x + sn * rr, z = W.z - cs * rr;
      A.col(stone, 0.8 + 0.16 * h1(o.sd)).kind(KIND.MASON, 0, 0.16 + 0.26 * h1(o.sd + 1), 1); boxInto(A, x, z, th, o.half + 0.45, 0.2, ya - 0.5, yb + 0.6, { top: true });
      A.col(stone, 0.74).kind(KIND.MASON, 0, 0, 1); boxInto(A, x + sn * 0.2, z - cs * 0.2, th, o.half + 0.7, 0.35, ya - 0.85, ya - 0.5, { top: true });
      if (o.lamp) A.col([1, 0.55, 0.2], 0.1).kind(KIND.PANE, o.order, 0, 1);
      else if (o.state === 0) A.col(stone, 0.58 + 0.1 * h1(o.sd + 2)).kind(KIND.MASON, 0, 0, 0.55);
      else if (o.state === 1) A.col([0.075, 0.06, 0.045]).kind(KIND.PLAIN);
      else A.col([0.014, 0.014, 0.02]).kind(KIND.PLAIN);
      boxInto(A, x + sn * 0.16, z - cs * 0.16, th, o.half, 0.1, ya, yb, {});
      // (a shuttered one: two battens across its boards)
      if (o.state === 1) { A.col([0.11, 0.09, 0.07]).kind(KIND.PLAIN); for (const f of [0.22, 0.74]) boxInto(A, x + sn * 0.24, z - cs * 0.24, th, o.half, 0.05, lerp(ya, yb, f), lerp(ya, yb, f) + 0.22, {}); }
    }
  }
}

// the outer wall: a great arc of masonry through the gate, worn buttresses of uneven height down its outer face, and
// the gate's own dark arch where the road comes to it (its 62 lengths are numbered -31 to 30 from the gate, every
// one dressed alike: the caller may lay them a few at a time, from i0 up to i1). THE WALL'S HEAD: a course of
// dressed stone stands out under the walk on both faces; the walk is paved from face to face, its flags laid to
// the length's own heading (their rows run along the walk), a sill of dressed stone across it where two lengths
// meet; on either edge a breast wall 1 m high bears the merlons, so that an embrasure is a gap over a wall and
// never a gap in the floor
export function outerWallInto(A, P, i0 = -31, i1 = 31) {
  const O = P.outer, a0 = O.a0, seg = 36, n = 31, stone = mul3(PAL.stoneDark, 1.05), hw = M.WALL_THICK / 2;
  for (let i = Math.max(-n, i0); i < Math.min(n, i1); i++) {
    const th = a0 + (i + 0.5) * seg / O.R, x = O.cx + Math.sin(th) * O.R, z = O.cz - Math.cos(th) * O.R, yaw = th + Math.PI / 2;
    A.col(stone, 0.92 + 0.16 * h1(i + 40)).kind(KIND.MASON, 0, 0.35 * h1(i + 77), 1);
    boxInto(A, x, z, yaw, hw, seg / 2 + 0.2, -6, M.WALL_WALK - 0.7, {});
    A.col(stone, 1.1).kind(KIND.MASON, 0, 0, 1); boxInto(A, x, z, yaw, hw + 0.3, seg / 2 + 0.2, M.WALL_WALK - 0.7, M.WALL_WALK - 0.02, {});
    { const F = frameOf(x, z, yaw), e = seg / 2 + 0.2, y = M.WALL_WALK;
      A.col(PAL.flags, 0.85).kind(KIND.FLAGS, yaw - Math.PI / 2, 0, 1); quadOut(A, F(-hw - 0.3, y - 0.02, -e), F(hw + 0.3, y - 0.02, -e), F(hw + 0.3, y - 0.02, e), F(-hw - 0.3, y - 0.02, e), 0, 1, 0);
      A.col(stone, 1.16).kind(KIND.PLAIN); quadOut(A, F(-hw + 0.8, y + 0.01, seg / 2 - 0.35), F(hw - 0.8, y + 0.01, seg / 2 - 0.35), F(hw - 0.8, y + 0.01, seg / 2 + 0.2), F(-hw + 0.8, y + 0.01, seg / 2 + 0.2), 0, 1, 0); }
    A.col(stone, 0.95).kind(KIND.MASON, 0, 0, 1);
    for (const sd of [-1, 1]) {
      const ra = O.R + sd * (hw - 0.4), pa = [O.cx + Math.sin(th - seg / 2 / O.R) * ra, O.cz - Math.cos(th - seg / 2 / O.R) * ra], pb = [O.cx + Math.sin(th + seg / 2 / O.R) * ra, O.cz - Math.cos(th + seg / 2 / O.R) * ra];
      boxInto(A, (pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, yaw, 0.4, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) / 2, M.WALL_WALK - 0.02, M.WALL_WALK + 1, { top: true });
      merlonsInto(A, pa[0], pa[1], pb[0], pb[1], M.WALL_WALK + 1, 1.6, 1.6, 0.8, 1.4);
    }
    // two buttresses to a length of wall, each worn to its own height
    for (const f of [-0.25, 0.25]) {
      const tb = th + f * seg / O.R, rb = O.R + hw + 1.5, top = 22 + 9 * h1(i * 3 + f * 8 + 5);
      A.col(stone, 0.85 + 0.2 * h1(i + f + 3)).kind(KIND.MASON, 0, 0.3 * h1(i * 7 + f), 1);
      boxInto(A, O.cx + Math.sin(tb) * rb, O.cz - Math.cos(tb) * rb, tb, 1.5, 1.6, -6, top, { top: true });
      boxInto(A, O.cx + Math.sin(tb) * (rb + 2.4), O.cz - Math.cos(tb) * (rb + 2.4), tb, 1.3, 1.2, -6, top * 0.55, { top: true });
    }
  }
  // the gate: a dark pointed arch through the wall where the two lengths numbered -1 and 0 meet, jambs of paler stone
  if (i0 <= -1 && i1 >= 1) {
    const yaw = a0 + Math.PI / 2;
    A.col([0.012, 0.012, 0.016]).kind(KIND.PLAIN);
    for (const [hl, ya, yb] of [[4.2, 8, 27], [3.1, 27, 28.5], [1.7, 28.5, 29.7]]) boxInto(A, O.gx, O.gz, yaw, hw + 0.12, hl, ya, yb, {});
    A.col(PAL.stoneWarm, 0.95).kind(KIND.PLAIN);
    for (const sx of [-1, 1]) for (const out of [-1, 1]) {
      const th = a0 + sx * 4.8 / O.R, rr = O.R + out * (hw + 0.25);
      boxInto(A, O.cx + Math.sin(th) * rr, O.cz - Math.cos(th) * rr, yaw, 0.3, 0.55, 8, 27.4, { top: true });
    }
  }
}
// the field of flagstones and the weed tree's trunk in its crack
export function quadFloorInto(A, P) {
  const q = P.quad, c = (w, t) => { const p = P.fromWT(w, t); return [p[0], q.y, p[1]]; };
  A.col(PAL.flags).kind(KIND.FLAGS, P.hA - Math.PI / 2, 1, 1);
  const nw = 8, nt = 6;
  for (let i = 0; i < nw; i++) for (let j = 0; j < nt; j++) quadOut(A, c(lerp(q.w0, q.w1, i / nw), lerp(q.t0, q.t1, j / nt)), c(lerp(q.w0, q.w1, (i + 1) / nw), lerp(q.t0, q.t1, j / nt)), c(lerp(q.w0, q.w1, (i + 1) / nw), lerp(q.t0, q.t1, (j + 1) / nt)), c(lerp(q.w0, q.w1, i / nw), lerp(q.t0, q.t1, (j + 1) / nt)), 0, 1, 0);
}
// THE OLD THINGS OF STONE on the field and the forecourt, each as the plan dealt it, AND THE SHADOW each lays on its
// floor by the hour's own light (key: the way to the light). The floor under such a shadow is the same floor with
// no sun on it (the stone's shader reads the quarter over the floor's number); the weeds' shadows are laid with them
// THE SHADOWS OF THE THINGS THAT STAND ON THE DRY FLOORS, laid by the hour's own light (key: the way to the light):
// what is given back lays one
function makeShade(A, P, key) {
  const q = P.quad, kl = Math.hypot(key[0], key[2]) || 1, dx = -key[0] / kl, dz = -key[2] / kl, run = kl / Math.max(0.07, key[1]), tf = q.t1 + M.NEAR_DEEP;
  const inFloor = (x, z, fore) => { const wt = P.toWT(x, z); return fore ? Math.abs(wt[0] - q.mid) < M.FORE_HALF - 1 && wt[1] > tf + 0.2 && wt[1] < tf + M.FORE_DEEP - 1 : wt[0] > q.w0 + 0.5 && wt[0] < q.w1 - 0.5 && wt[1] > q.t0 + 0.5 && wt[1] < q.t1 - 0.5; };
  // (the shadow of an upright box, hw across and hl along its heading, from ya to yb over the floor: a strip on the
  // floor from under its foot to where its head's shadow falls, as broad as the box is seen from the light, cut
  // short at the floor's edge)
  const shade = (x, z, yaw, hw, hl, ya, yb, fore) => {
    const c = Math.cos(yaw), sn = Math.sin(yaw), ea = Math.abs(hw * (c * dx + sn * dz)) + Math.abs(hl * (sn * dx - c * dz)), ep = Math.abs(hw * (-c * dz + sn * dx)) + Math.abs(hl * (-sn * dz - c * dx));
    const a = ya * run - ea, at = (d, e) => [x + dx * d - dz * e, q.y + 0.03, z + dz * d + dx * e];
    const on = (d) => { const p1 = at(d, ep), p2 = at(d, -ep); return inFloor(p1[0], p1[2], fore) && inFloor(p2[0], p2[2], fore); };
    let b = yb * run + ea;
    for (let k = 0; k < 10 && !on(b); k++) b = a + (b - a) * 0.8;
    if (b - a < 0.3 || !on(b)) return;
    // (MENDING 3, M1: THE SHADOW GIVES BACK THE COLOUR AND THE KIND IT FOUND: it is laid in the floor's own flags, and
    // what its maker lays next is that maker's stuff again, wood or stone, never paving)
    const c0 = A.c, k0 = A.k;
    A.col(PAL.flags, fore ? 0.85 : 1).kind(KIND.FLAGS, P.hA - Math.PI / 2, fore ? 3.25 : 1.25, 1);
    // (on the forecourt the shadow's floor carries the forecourt's own uv, as the floor under it does)
    if (fore) foreQuad(A, P, at(a, -ep), at(a, ep), at(b, ep), at(b, -ep)); else quadOut(A, at(a, -ep), at(a, ep), at(b, ep), at(b, -ep), 0, 1, 0);
    A.c = c0; A.k = k0;
  };
  return shade;
}
export function oldStonesInto(A, P, key) {
  const shade = makeShade(A, P, key);
  for (const o of P.stones) {
    const F = frameOf(o.x, o.z, o.yaw), y = o.y, s = o.size, st = mul3(mix3(PAL.stoneWarm, PAL.stone, h1(o.sd * 0.37)), 0.9 + 0.2 * h1(o.sd * 0.71)), f = o.fore;
    const stone = (k = 1) => A.col(st, k).kind(KIND.MASON, 0, 0, 1);
    if (o.kind === 0) {
      // A WELL HEAD: a round kerb on a broad step, its mouth dark; two stone posts and the lintel that bore the rope
      stone(0.85); drumInto(A, o.x, o.z, 1.8 * s, 1.75 * s, y - 0.1, y + 0.18, 12, { top: true });
      stone(1); drumInto(A, o.x, o.z, 1.32 * s, 1.26 * s, y + 0.18, y + 0.95 * s, 12, { top: true });
      A.col([0.012, 0.012, 0.016]).kind(KIND.PLAIN); drumInto(A, o.x, o.z, 0.92 * s, 0.92 * s, y + 0.95 * s, y + 0.95 * s + 0.012, 12, { top: true });
      stone(0.92);
      for (const sx of [-1, 1]) { const p = F(sx * 1.08 * s, 0, 0); boxInto(A, p[0], p[2], o.yaw, 0.2 * s, 0.2 * s, y + 0.95 * s, y + 2.5 * s, {}); shade(p[0], p[2], o.yaw, 0.2 * s, 0.2 * s, 0.95 * s, 2.5 * s, f); }
      stone(1.05); boxInto(A, o.x, o.z, o.yaw, 1.36 * s, 0.17 * s, y + 2.5 * s, y + 2.7 * s, { top: true });
      shade(o.x, o.z, o.yaw, 1.36 * s, 0.17 * s, 2.5 * s, 2.7 * s, f); shade(o.x, o.z, 0, 1.2 * s, 1.2 * s, 0, 0.95 * s, f);
    } else if (o.kind === 1) {
      // A BROKEN URN ON ITS PEDESTAL: a base step, a square pedestal under its cap, the urn's foot and bowl and what
      // is left of its neck (a broken rim; its hollow dark)
      stone(0.85); boxInto(A, o.x, o.z, o.yaw, 0.62 * s, 0.62 * s, y - 0.1, y + 0.2 * s, { top: true });
      stone(1); boxInto(A, o.x, o.z, o.yaw, 0.42 * s, 0.42 * s, y + 0.2 * s, y + 0.92 * s, {});
      stone(1.1); boxInto(A, o.x, o.z, o.yaw, 0.5 * s, 0.5 * s, y + 0.92 * s, y + 1.02 * s, { top: true });
      stone(0.95); drumInto(A, o.x, o.z, 0.2 * s, 0.13 * s, y + 1.02 * s, y + 1.16 * s, 8); drumInto(A, o.x, o.z, 0.13 * s, 0.42 * s, y + 1.16 * s, y + 1.5 * s, 8);
      const ph = h1(o.sd * 1.3) * TAU;
      drumInto(A, o.x, o.z, 0.42 * s, 0.33 * s, y + 1.5 * s, y + 1.9 * s, 8, { rag: (th) => -0.17 * s * (1 + Math.sin(th + ph)) - 0.05 * s * (1 + Math.sin(th * 3 + ph)) });
      A.col([0.012, 0.012, 0.016]).kind(KIND.PLAIN); drumInto(A, o.x, o.z, 0.4 * s, 0.4 * s, y + 1.5 * s, y + 1.5 * s + 0.012, 8, { top: true });
      shade(o.x, o.z, o.yaw, 0.46 * s, 0.46 * s, 0, 1.02 * s, f); shade(o.x, o.z, 0, 0.33 * s, 0.33 * s, 1.1 * s, 1.75 * s, f);
    } else if (o.kind === 2) {
      // A MOUNTING BLOCK: three worn steps of one stone each
      for (let k = 0; k < 3; k++) {
        const p = F(0, 0, 0.3 * k * s), hl = (0.9 - 0.3 * k) * s;
        stone(0.9 + 0.08 * k); boxInto(A, p[0], p[2], o.yaw, 0.55 * s, hl, y + (k ? 0.33 * k * s : -0.1), y + 0.33 * (k + 1) * s, { top: true });
        shade(p[0], p[2], o.yaw, 0.55 * s, hl, 0, 0.33 * (k + 1) * s, f);
      }
    } else {
      // A SUNDIAL'S STUMP: two eight-sided steps, a baluster shaft and its cap; the plate is gone
      stone(0.85); drumInto(A, o.x, o.z, 0.85 * s, 0.82 * s, y - 0.1, y + 0.22 * s, 8, { top: true });
      stone(0.95); drumInto(A, o.x, o.z, 0.56 * s, 0.54 * s, y + 0.22 * s, y + 0.4 * s, 8, { top: true });
      stone(1.05); drumInto(A, o.x, o.z, 0.24 * s, 0.17 * s, y + 0.4 * s, y + 1.12 * s, 8); drumInto(A, o.x, o.z, 0.3 * s, 0.3 * s, y + 1.12 * s, y + 1.25 * s, 8, { top: true });
      shade(o.x, o.z, 0, 0.7 * s, 0.7 * s, 0, 0.3 * s, f); shade(o.x, o.z, 0, 0.24 * s, 0.24 * s, 0.4 * s, 1.25 * s, f);
    }
  }
  // (a weed's shadow: its stem's and its crown's)
  for (const w of [P.weed, ...P.weeds]) if (w) { shade(w.x, w.z, 0, 0.07 * w.h, 0.07 * w.h, 0, 0.5 * w.h, false); shade(w.x, w.z, 0, 0.33 * w.h, 0.33 * w.h, 0.45 * w.h, 1.05 * w.h, false); }
}
// ROUND 7: a wheel of wood: eight felloes round a nave and two spokes through it. c: its middle; (nx, nz): its axle's
// heading in plan; r: its radius
function wheelInto(A, c, nx, nz, r, th = 0.06) {
  const ax = -nz, az = nx, hc = r * Math.sin(Math.PI / 8) * 1.03, rm = r * Math.cos(Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const am = (k + 0.5) / 8 * TAU, ca = Math.cos(am), sa = Math.sin(am);
    blockInto(A, [c[0] + ax * ca * rm, c[1] + sa * rm, c[2] + az * ca * rm], [-ax * sa * hc, ca * hc, -az * sa * hc], [ax * ca * th, sa * th, az * ca * th], [nx * th * 0.8, 0, nz * th * 0.8]);
  }
  for (let k = 0; k < 2; k++) { const a = k * Math.PI / 2 + 0.3, ca = Math.cos(a), sa = Math.sin(a); blockInto(A, c, [ax * ca * r * 0.96, sa * r * 0.96, az * ca * r * 0.96], [-ax * sa * 0.035, ca * 0.035, -az * sa * 0.035], [nx * 0.035, 0, nz * 0.035]); }
  blockInto(A, c, [ax * 0.13, 0, az * 0.13], [0, 0.13, 0], [nx * 0.12, 0, nz * 0.12]);
}
// a trough of one stone, full to its brim: the water holds the sky
function troughInto(A, x, z, yaw, hw, hl, y, st) {
  A.col(st, 0.95).kind(KIND.MASON, 0, 0, 1); boxInto(A, x, z, yaw, hw, hl, y - 0.05, y + 0.62, { top: true });
  const G = frameOf(x, z, yaw);
  A.col(PAL.lead, 0.8).kind(KIND.WATER); quadOut(A, G(-hw + 0.13, y + 0.63, -hl + 0.13), G(hw - 0.13, y + 0.63, -hl + 0.13), G(hw - 0.13, y + 0.63, hl - 0.13), G(-hw + 0.13, y + 0.63, hl - 0.13), 0, 1, 0);
}
// ROUND 7, A2: THE GREAT YARD'S THINGS, each as the plan dealt it, the shadow each lays on its floor by the hour's own
// light, AND THE LONG SHADOWS OF THE MERLONS: of the field's parapet across the flags (each merlon by its own place
// and height, a broken one's stump by its own) and of the forecourt's own parapet across its floor (the low wall's
// and each merlon's). No draws: every measure is the plan's
export function yardInto(A, CA, P, key) {
  const q = P.quad, yq = M.QUAD_Y, tf = q.t1 + M.NEAR_DEEP, shade = makeShade(A, P, key), wood = [0.21, 0.165, 0.115], iron = [0.07, 0.065, 0.06], warm = mul3(mix3(PAL.stoneWarm, PAL.stone, 0.5), 0.95);
  const c3 = (w, t, y) => { const p = P.fromWT(w, t); return [p[0], y, p[1]]; };
  for (const o of P.yard) {
    if (o.kind === 'cloister') {
      // THE CLOISTER WALK along the foot of the field's tall side range (the plan's: o.wf its wall's face, o.inw the
      // way from the wall into the field): square piers of stone to the eaves, a pointed arch from pier to pier under
      // a spandrel wall, a course of dressed stone under the eaves, a roof of slate leaning on the range's wall, the
      // walk's floor and the wall behind in the roof's own shadow by the hour's light, lanterns hung under the roof.
      // MENDING 2, R1 AND R2: every height is the plan's share (o.ks) of the height typed for a wall of 9.6 m and
      // more, so that the roof's upper edge lies under the eave of the range it leans on; the walk is built run by
      // run (o.bays: the bays that stand), each run with its own end piers, its own roof and its own two gables
      const wf = o.wf, inw = o.inw, st = mul3(PAL.stone, 0.92), m = P.quadRanges[P.nearRange.length + (inw > 0 ? 0 : 1)], ks = o.ks, ye = yq + 6.0 * ks, yr = yq + o.top, eh = 6.0 * ks + 0.25;
      const wp = wf + inw * o.deep, wo = wp + inw * 0.75, half = o.pitch / 2 - 0.5, ix = inw * P.W[0], iz = inw * P.W[1];
      const runs = cloisterRuns(o), sn = key[0] * ix + key[2] * iz, iv = m.ivy ?? (h1(m.sd + 5) < 0.3 ? 0.24 + 0.24 * h1(m.sd + 6) : 0);
      for (const [b0, b1] of runs) {
        const tA = o.tA + b0 * o.pitch, tB = o.tA + b1 * o.pitch;
        for (let i = b0; i <= b1; i++) {
          const p = P.fromWT(wp, o.tA + i * o.pitch);
          A.col(st, 0.9 + 0.14 * h1(i * 3.7 + o.tA)).kind(KIND.MASON, 0, 0, 1); boxInto(A, p[0], p[1], P.hA, 0.5, 0.5, yq - 0.1, ye, {});
          shade(p[0], p[1], P.hA, 0.5, 0.5, 0, 6.0 * ks, false);
        }
        A.col(st, 1.0).kind(KIND.MASON, 0, 0, 1);
        for (let i = b0; i < b1; i++) {
          const tm = o.tA + (i + 0.5) * o.pitch, NA = 6, prof = (k) => { const v = -half + 2 * half * k / NA; return [v, yq + (3.3 + 2.1 * (1 - Math.pow(Math.abs(v) / half, 1.7))) * ks]; };
          for (let k = 0; k < NA; k++) { const a = prof(k), b = prof(k + 1); quadOut(A, c3(wp + inw * 0.3, tm + a[0], a[1]), c3(wp + inw * 0.3, tm + b[0], b[1]), c3(wp + inw * 0.3, tm + b[0], ye), c3(wp + inw * 0.3, tm + a[0], ye), ix, 0, iz); }
        }
        { const p = P.fromWT(wp + inw * 0.3, (tA + tB) / 2); A.col(st, 1.12).kind(KIND.MASON, 0, 0, 1); boxInto(A, p[0], p[1], P.hA + Math.PI / 2, 0.4, (tB - tA) / 2 + 0.6, ye - 0.05, ye + 0.3, { top: true }); }
        A.col(mul3(mix3(PAL.slate, PAL.slateBlue, 0.4), 0.95)).kind(KIND.SLATE);
        quadOut(A, c3(wo, tA - 0.7, ye + 0.25), c3(wo, tB + 0.7, ye + 0.25), c3(wf + inw * 0.05, tB + 0.7, yr), c3(wf + inw * 0.05, tA - 0.7, yr), ix * 0.4, 1, iz * 0.4);
        A.col(st, 0.8).kind(KIND.MASON, 0, 0, 1);
        for (const [t, sg] of [[tA - 0.7, -1], [tB + 0.7, 1]]) triOut(A, c3(wf + inw * 0.05, t, ye + 0.25), c3(wo, t, ye + 0.25), c3(wf + inw * 0.05, t, yr), sg * P.T[0], 0, sg * P.T[1]);
        // (where the hour's light comes in under the eaves it lies on the floor as far in as the eaves' own shadow; the
        // floor beyond and the wall over that line stand in the roof's shadow: the floor's own flags and the wall's own
        // stone, its dress 3)
        if (sn > 0.05) {
          const d = eh * sn / Math.max(0.05, key[1]), yS = yq + clamp(eh - (o.deep + 0.7) * key[1] / sn, 0, eh);
          if (d < o.deep + 0.4) { A.col(PAL.flags, 1).kind(KIND.FLAGS, P.hA - Math.PI / 2, 1.25, 1); quadOut(A, c3(wf + inw * 0.1, tA - 0.5, yq + 0.03), c3(wf + inw * 0.1, tB + 0.5, yq + 0.03), c3(wo - inw * d, tB + 0.5, yq + 0.03), c3(wo - inw * d, tA - 0.5, yq + 0.03), 0, 1, 0); }
          // (MENDING 3, M3: the wall behind the walk is plain stone: no window in it, as the wall itself keeps none there)
          A.col(toneOf(m.tone)).kind(KIND.MASON, 0, 3 + iv, m.shade ?? 1);
          quadOut(A, c3(wf + inw * 0.06, tA - 0.7, yS), c3(wf + inw * 0.06, tB + 0.7, yS), c3(wf + inw * 0.06, tB + 0.7, yr), c3(wf + inw * 0.06, tA - 0.7, yr), ix, 0, iz);
        }
      }
      // (a lantern: its rod from the roof's underside, its glass 0.75 m tall under the rod; o.lampY: the glass's head)
      for (const t of o.lamps) {
        const p = P.fromWT(wf + inw * 2.8, t);
        A.col(iron).kind(KIND.PLAIN); boxInto(A, p[0], p[1], P.hA, 0.03, 0.03, yq + o.lampY, yq + o.lampY + Math.max(0.4, 3.1 * ks), {});
        A.col([1, 0.62, 0.24], 0.95).kind(KIND.GLOW); boxInto(A, p[0], p[1], P.hA, 0.28, 0.28, yq + o.lampY - 0.75, yq + o.lampY, { top: true });
      }
    } else if (o.kind === 'well') {
      // THE WELL HOUSE (o.s: its scale): a round kerb on a step, a four-posted roof of slate over it, the windlass on
      // two posts, its axle out to the great wheel on its trestle, a stone trough beside
      const s = o.s || 1, F = frameOf(o.x, o.z, o.yaw), c = Math.cos(o.yaw), sn = Math.sin(o.yaw);
      A.col(warm, 0.85).kind(KIND.MASON, 0, 0, 1); drumInto(A, o.x, o.z, 2.1 * s, 2.05 * s, yq - 0.1, yq + 0.2 * s, 10, { top: true });
      A.col(warm, 1).kind(KIND.MASON, 0, 0, 1); drumInto(A, o.x, o.z, 1.5 * s, 1.45 * s, yq + 0.2 * s, yq + 1.05 * s, 10, { top: true });
      A.col([0.012, 0.012, 0.016]).kind(KIND.PLAIN); drumInto(A, o.x, o.z, 1.08 * s, 1.08 * s, yq + 1.05 * s, yq + 1.05 * s + 0.012, 10, { top: true });
      A.col(wood).kind(KIND.PLAIN);
      // (MENDING 2, R8: THE ROOF RESTS ON ITS POSTS: a hip rafter runs under each of the roof's four hips from its
      // corner to near its point, and each post, which stands under a hip, rises into its rafter: hipY is the hip's
      // height at a reach from the middle; the post's head and the rafter's back lie 0.12 of the scale under it)
      const hipY = (rho) => yq + (3.4 + 1.8 * (1 - rho / 3.25)) * s, sl = Math.hypot(3.25, 1.8), cph = 3.25 / sl, sph = 1.8 / sl;
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, dx = Math.sin(a), dz = -Math.cos(a), px = o.x + dx * 2.35 * s, pz = o.z + dz * 2.35 * s, pt = hipY(2.35) - 0.12 * s;
        boxInto(A, px, pz, a + Math.PI / 4, 0.13 * s, 0.13 * s, yq, pt, {}); shade(px, pz, 0, 0.13 * s, 0.13 * s, 0, pt - yq, false);
        const hl = 1.475 * s; blockInto(A, [o.x + dx * 1.675 * s, hipY(1.675) - 0.12 * s, o.z + dz * 1.675 * s], [dx * hl, -hl * 1.8 / 3.25, dz * hl], [dx * sph * 0.07 * s, cph * 0.07 * s, dz * sph * 0.07 * s], [-dz * 0.06 * s, 0, dx * 0.06 * s]);
      }
      A.col(mul3(mix3(PAL.slate, PAL.slateBlue, 0.3), 1.0)).kind(KIND.SLATE); coneInto(A, o.x, o.z, 3.25 * s, yq + 3.4 * s, yq + 5.2 * s, 4);
      shade(o.x, o.z, Math.PI / 4, 2.25 * s, 2.25 * s, 3.4 * s, 4.4 * s, false); shade(o.x, o.z, 0, 1.5 * s, 1.5 * s, 0, 1.05 * s, false);
      A.col(wood, 0.85).kind(KIND.PLAIN);
      for (const lx of [-1.62, 1.62]) { const p = F(lx * s, 0, 0); boxInto(A, p[0], p[2], o.yaw, 0.09 * s, 0.09 * s, yq + 0.2 * s, yq + 1.85 * s, {}); }
      blockInto(A, [o.x, yq + 1.75 * s, o.z], [c * 1.5 * s, 0, sn * 1.5 * s], [0, 0.13 * s, 0], [sn * 0.13 * s, 0, -c * 0.13 * s]);
      blockInto(A, [o.x + c * 2.25 * s, yq + 1.75 * s, o.z + sn * 2.25 * s], [c * 0.8 * s, 0, sn * 0.8 * s], [0, 0.05 * s, 0], [sn * 0.05 * s, 0, -c * 0.05 * s]);
      for (const lz of [-1, 1]) { const p = F(2.72 * s, yq + 0.87 * s, lz * 0.4 * s); blockInto(A, p, [-sn * lz * 0.4 * s, 0.9 * s, c * lz * 0.4 * s], [c * 0.05 * s, 0, sn * 0.05 * s], [sn * 0.05 * s, 0, -c * 0.05 * s]); }
      const wc = F(2.98 * s, yq + 1.75 * s, 0);
      A.col(wood, 0.75); wheelInto(A, wc, c, sn, 1.3 * s, 0.06 * s);
      shade(wc[0], wc[2], o.yaw, 0.1 * s, 1.3 * s, 0.45 * s, 3.05 * s, false);
      const tr = F(0, 0, 3.0 * s); troughInto(A, tr[0], tr[2], o.yaw, 1.2 * s, 0.42 * s, yq, warm); shade(tr[0], tr[2], o.yaw, 1.2 * s, 0.42 * s, 0, 0.62, false);
    } else if (o.kind === 'tree') {
      // A GREAT OLD TREE: a thick leaning trunk with a flare of roots, five crooked boughs, three branches on each
      // and two twigs on each of those. MENDING 1, M3: BOTH TREES OF THE YARD ARE LIVING, DARK AND OLD, BY ONE MAKE (an
      // old yew or cedar: heavy in the crown, near black in its shade, no bright green): the leaf is laid in broad
      // flat PLATES, one at every bough's end, at every branch's end and at the two crooks of every bough, and four
      // greater ones low about the trunk's head (0.15 to 0.19 of the tree's height in breadth): thirty-four to a
      // tree, each its own breadth (3.0 to 4.8 m at a tree of 21 m), a third as thick as broad, its rim ragged
      // (every corner at its own reach) and drooping, its top a low dome of two rings, its belly hanging, so that
      // the plates stand into one another and the crown is one heavy dark mass with a ragged rim; near black green (one plate in
      // six an older, greyer green), its under side near black. Every limb and every plate keeps inside the
      // crown's ball (o.ball: the plan's, which the line's clearance is asked about); each limb and each plate lays
      // its own long shadow on the floor. (o.live false: bare and grey: no tree of the yard is dealt so now)
      const sd = o.sd, H = o.h, s = H / 21, R1 = (k) => h1(sd * 0.37 + k * 1.618), B = o.ball, f = !!o.fore, bark = o.live ? [0.05, 0.043, 0.039] : [0.165, 0.15, 0.135];
      const inB = (p, pad = 0) => { const dx = p[0] - B[0], dy = p[1] - B[1], dz = p[2] - B[2], d = Math.hypot(dx, dy, dz), m = B[3] * 0.96 - pad; return d <= m ? p : [B[0] + dx / d * m, B[1] + dy / d * m, B[2] + dz / d * m]; };
      const lean = [1.8 * s * (R1(1) - 0.5), 1.8 * s * (R1(2) - 0.5)], tk = [[o.x, yq - 0.3, o.z], [o.x + lean[0] * 0.25, yq + H * 0.14, o.z + lean[1] * 0.25], [o.x + lean[0] * 0.7, yq + H * 0.28, o.z + lean[1] * 0.6], [o.x + lean[0], yq + H * 0.4, o.z + lean[1]]];
      const leaves = (tp, n, big = 0) => {
        const rb = big || (3.0 + 1.8 * R1(n)) * s, cc = inB([tp[0], tp[1] + 0.05 * rb, tp[2]], rb * 1.17), old = R1(n + 30) < 0.17, tw = R1(n + 20) * TAU, NS8 = 8;
        const g = mul3(old ? [0.03, 0.036, 0.026] : [0.014, 0.027, 0.016], 0.75 + 0.5 * R1(n + 10)), reach = (i) => 0.78 + 0.37 * h1(n * 3.1 + (i % NS8) * 7.7 + sd);
        const ring = (i, k, y) => { const t = tw + i / NS8 * TAU, r = rb * k * reach(i); return [cc[0] + Math.sin(t) * r, cc[1] + y * rb, cc[2] - Math.cos(t) * r]; };
        const top = [cc[0], cc[1] + 0.3 * rb, cc[2]], bot = [cc[0], cc[1] - 0.36 * rb, cc[2]];
        for (let i = 0; i < NS8; i++) {
          const tm2 = tw + (i + 0.5) / NS8 * TAU, sn = Math.sin(tm2), cs = -Math.cos(tm2), e0 = ring(i, 1, -0.1 - 0.08 * h1(n + i * 1.3)), e1 = ring(i + 1, 1, -0.1 - 0.08 * h1(n + (i + 1) % NS8 * 1.3)), m0 = ring(i, 0.55, 0.2), m1 = ring(i + 1, 0.55, 0.2);
          A.col(g, 0.9 + 0.35 * h1(i * 5.1 + n * 0.7)).kind(KIND.PLAIN); triOut(A, m0, m1, top, sn * 0.2, 1, cs * 0.2);
          A.col(g, 0.75 + 0.4 * h1(i * 3.9 + n * 1.3)); quadOut(A, e0, e1, m1, m0, sn * 0.5, 1, cs * 0.5);
          A.col(g, 0.3 + 0.12 * h1(i * 2.7 + n)); triOut(A, e0, e1, bot, sn * 0.2, -1, cs * 0.2);
        }
        shade(cc[0], cc[2], 0, rb * 0.72, rb * 0.72, cc[1] - 0.36 * rb - yq, cc[1] + 0.3 * rb - yq, f);
      };
      A.col(bark).kind(KIND.PLAIN); tubeInto(A, tk, [1.25 * s, 1.0 * s, 0.86 * s, 0.74 * s], 7);
      A.col(bark, 0.85); drumInto(A, o.x, o.z, 2.1 * s, 1.2 * s, yq - 0.2, yq + 1.6 * s, 7);
      shade(o.x + lean[0] * 0.5, o.z + lean[1] * 0.5, 0, 0.9 * s, 0.9 * s, 0, H * 0.4, f);
      // (the lowest tier: four great plates low about the trunk's head, the sweep of an old tree's lowest boughs)
      if (o.live) for (let k = 0; k < 4; k++) { const a = R1(200) * TAU + k * TAU / 4 + (R1(201 + k) - 0.5) * 0.8, d = H * (0.07 + 0.05 * R1(210 + k)); leaves([tk[3][0] + Math.sin(a) * d, yq + H * (0.38 + 0.08 * R1(220 + k)), tk[3][2] - Math.cos(a) * d], 230 + k, H * (0.15 + 0.04 * R1(240 + k))); }
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * TAU + R1(10 + k) * 0.9, e = 0.3 + 0.75 * R1(20 + k), len = H * (0.34 + 0.2 * R1(30 + k)), from = k < 3 ? tk[3] : tk[2], kink = (R1(40 + k) - 0.5) * 2.4 * s;
        const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)], sdw = [Math.cos(a), 0, Math.sin(a)];
        const p1 = inB([from[0] + dir[0] * len * 0.4 + sdw[0] * kink, from[1] + dir[1] * len * 0.4 + 0.8 * s, from[2] + dir[2] * len * 0.4 + sdw[2] * kink]);
        const p2 = inB([from[0] + dir[0] * len * 0.75 - sdw[0] * kink * 0.5, from[1] + dir[1] * len * 0.75 + 1.4 * s, from[2] + dir[2] * len * 0.75 - sdw[2] * kink * 0.5]);
        const p3 = inB([from[0] + dir[0] * len, from[1] + dir[1] * len + 0.9 * s, from[2] + dir[2] * len]);
        A.col(bark, 0.88 + 0.24 * R1(70 + k)).kind(KIND.PLAIN);
        tubeInto(A, [from, p1, p2, p3], [0.52 * s, 0.38 * s, 0.24 * s, 0.1 * s], 5);
        shade((from[0] + p3[0]) / 2, (from[2] + p3[2]) / 2, a, 0.32 * s, Math.hypot(p3[0] - from[0], p3[2] - from[2]) * 0.5, Math.min(from[1], p3[1]) - yq, Math.max(from[1], p3[1]) - yq + 0.4, f);
        for (let j = 0; j < 3; j++) {
          const b = a + (j - 1) * (0.7 + 0.5 * R1(50 + k * 3 + j)) + (j === 1 ? 0.3 : 0), tl = len * (0.36 + 0.14 * R1(55 + k * 3 + j)), f0 = j === 0 ? p1 : j === 1 ? p3 : p2, up = 0.25 + 0.6 * R1(60 + k * 3 + j);
          const tp = inB([f0[0] + Math.sin(b) * tl, f0[1] + tl * up, f0[2] - Math.cos(b) * tl]), tm = inB([lerp(f0[0], tp[0], 0.5) + Math.cos(b) * 0.4 * s, lerp(f0[1], tp[1], 0.5) + 0.5 * s, lerp(f0[2], tp[2], 0.5) + Math.sin(b) * 0.4 * s]);
          A.col(bark, 0.88 + 0.24 * R1(70 + k)).kind(KIND.PLAIN);
          tubeInto(A, [f0, tm, tp], [0.17 * s, 0.1 * s, 0.035 * s], 4);
          for (let i = 0; i < 2; i++) {
            const c2 = b + (i ? 1 : -1) * (0.7 + 0.5 * R1(80 + k * 6 + j * 2 + i)), l2 = tl * 0.5, g0 = i ? tm : [lerp(tm[0], tp[0], 0.5), lerp(tm[1], tp[1], 0.5), lerp(tm[2], tp[2], 0.5)];
            tubeInto(A, [g0, inB([g0[0] + Math.sin(c2) * l2, g0[1] + l2 * (0.3 + 0.5 * R1(90 + k * 6 + j * 2 + i)), g0[2] - Math.cos(c2) * l2])], [0.06 * s, 0.015 * s], 3);
          }
          if (o.live) leaves(tp, 100 + k * 3 + j);
        }
        if (o.live) { leaves(p3, 150 + k); leaves(p1, 160 + k); leaves(p2, 170 + k); }
      }
    } else if (o.kind === 'timber') {
      // A STACK OF TIMBER: nine squared balks in three layers on two bearers, no two of a length
      const yawT = P.hA + Math.PI / 2 + o.yaw, F = frameOf(o.x, o.z, yawT);
      A.col(wood, 0.7).kind(KIND.PLAIN); for (const lz of [-2.1, 2.1]) { const p = F(0, 0, lz); boxInto(A, p[0], p[2], yawT, 1.0, 0.12, yq, yq + 0.2, { top: true }); }
      let k = 0;
      for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++, k++) {
        const lx = (i - (3 - row) / 2) * 0.44 + (h1(k * 3.1 + o.x) - 0.5) * 0.06, lz = (h1(k * 5.3 + o.z) - 0.5) * 0.9, p = F(lx, 0, lz), ln = 2.7 + 0.5 * h1(k * 7.7 + 1);
        A.col(mul3([0.3, 0.235, 0.16], 0.75 + 0.5 * h1(k * 1.9 + 3))).kind(KIND.PLAIN); boxInto(A, p[0], p[2], yawT + (h1(k * 9.1) - 0.5) * 0.05, 0.18, ln, yq + 0.2 + row * 0.37, yq + 0.55 + row * 0.37, { top: true });
      }
      shade(o.x, o.z, yawT, 0.9, 3.1, 0, 1.3, true);
    } else if (o.kind === 'cart') {
      // A BROKEN CART, its shafts down on the flags: the bed pitched forward on its axle, one wheel still on, the
      // other off and lying by it, the bare axle end propped on a stone
      const c = Math.cos(o.yaw), sn = Math.sin(o.yaw), G = frameOf(o.x, o.z, o.yaw), f = [sn, 0, -c], ac = [c, 0, sn], pt = 0.2, cp = Math.cos(pt), sp = Math.sin(pt);
      const L3 = [f[0] * cp, -sp, f[2] * cp], T3 = [f[0] * sp, cp, f[2] * sp], bc = G(0, yq + 1.0, 0.25);
      A.col(wood, 0.9).kind(KIND.PLAIN);
      blockInto(A, G(0, yq + 0.75, 0), [ac[0] * 1.05, 0, ac[2] * 1.05], [0, 0.05, 0], [f[0] * 0.05, 0, f[2] * 0.05]);
      blockInto(A, bc, [L3[0] * 1.5, L3[1] * 1.5, L3[2] * 1.5], [T3[0] * 0.05, T3[1] * 0.05, T3[2] * 0.05], [ac[0] * 0.78, 0, ac[2] * 0.78]);
      A.col(wood, 1.1);
      for (const sx of [-1, 1]) blockInto(A, [bc[0] + ac[0] * 0.78 * sx + T3[0] * 0.3, bc[1] + T3[1] * 0.3, bc[2] + ac[2] * 0.78 * sx + T3[2] * 0.3], [L3[0] * 1.5, L3[1] * 1.5, L3[2] * 1.5], [T3[0] * 0.26, T3[1] * 0.26, T3[2] * 0.26], [ac[0] * 0.03, 0, ac[2] * 0.03]);
      A.col(wood, 0.8);
      for (const sx of [-1, 1]) {
        const a0 = [bc[0] + L3[0] * 1.5 + ac[0] * 0.5 * sx, bc[1] + L3[1] * 1.5, bc[2] + L3[2] * 1.5 + ac[2] * 0.5 * sx], e = G(0.5 * sx, yq + 0.06, 3.5), u = [(e[0] - a0[0]) / 2, (e[1] - a0[1]) / 2, (e[2] - a0[2]) / 2];
        blockInto(A, [(a0[0] + e[0]) / 2, (a0[1] + e[1]) / 2, (a0[2] + e[2]) / 2], u, [0, 0.045, 0], [ac[0] * 0.045, 0, ac[2] * 0.045]);
      }
      A.col(wood, 0.72); wheelInto(A, G(-1.0, yq + 0.75, 0), c, sn, 0.75);
      { const p = G(2.1, 0, -0.7); drumInto(A, p[0], p[2], 0.75, 0.75, yq, yq + 0.1, 10, { top: true }); A.col(wood, 0.5); drumInto(A, p[0], p[2], 0.16, 0.16, yq + 0.1, yq + 0.2, 6, { top: true }); }
      { const p = G(1.0, 0, 0); A.col(warm, 0.9).kind(KIND.MASON, 0, 0, 1); boxInto(A, p[0], p[2], o.yaw + 0.4, 0.24, 0.2, yq, yq + 0.7, { top: true }); }
      shade(o.x, o.z, o.yaw, 0.85, 1.6, 0.55, 1.45, true); shade(G(-1.0, 0, 0)[0], G(-1.0, 0, 0)[2], o.yaw, 0.08, 0.75, 0, 1.5, true);
    } else if (o.kind === 'trough') { troughInto(A, o.x, o.z, P.hA, 0.42, 1.2, yq, warm); shade(o.x, o.z, P.hA, 0.42, 1.2, 0, 0.62, true); }
  }
  // the merlons of the field's parapet: each lays its own bar on the flags
  for (const it of fieldParapet(P)) {
    const r = it.r, top = it.broken ? (it.hsh > 0.05 ? r.y + 0.3 + 5 * it.hsh : 0) : r.y + 1.7;
    if (top) shade(it.x, it.z, r.w ? P.hA : P.hA + Math.PI / 2, 0.4, 0.75, r.y - 0.6 - yq, top - yq, false);
  }
  // the forecourt's own parapet: its low wall's shadow, a band along its foot by the light's slant, and every merlon's bar
  { const w0 = q.mid - M.FORE_HALF, w1 = q.mid + M.FORE_HALF, t1 = tf + M.FORE_DEEP, kl = Math.hypot(key[0], key[2]) || 1, run = kl / Math.max(0.07, key[1]);
    const sw = -(key[0] * P.W[0] + key[2] * P.W[1]) / kl * 0.9 * run, stt = -(key[0] * P.T[0] + key[2] * P.T[1]) / kl * 0.9 * run;
    const cl = (w, t) => c3(clamp(w, w0 + 0.9, w1 - 0.9), clamp(t, tf + 0.1, t1 - 0.9), yq + 0.03);
    for (const [wa, ta, wb, tb, inw, int] of [[w0 + 0.9, tf, w0 + 0.9, t1, 1, 0], [w1 - 0.9, tf, w1 - 0.9, t1, -1, 0], [w0, t1 - 0.9, w1, t1 - 0.9, 0, -1]]) {
      if (sw * inw + stt * int > 0.3) { A.col(PAL.flags, 0.85).kind(KIND.FLAGS, P.hA - Math.PI / 2, 3.25, 1); foreQuad(A, P, cl(wa, ta), cl(wb, tb), cl(wb + sw, tb + stt), cl(wa + sw, ta + stt)); }
      const a = P.fromWT(wa - 0.45 * inw, ta - 0.45 * int), b = P.fromWT(wb - 0.45 * inw, tb - 0.45 * int), len = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(b[0] - a[0], -(b[1] - a[1])), n = Math.max(1, Math.floor(len / 2.9));
      for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; shade(lerp(a[0], b[0], f), lerp(a[1], b[1], f), yaw, 0.45, 0.75, 0.8, 2.0, true); }
    } }
}
// THE FIELD'S PARAPET (no draws: every merlon by its place along its own wall and the seed's number): the range on the
// field's near side and the two side ranges carry a battlemented parapet at their eaves on the field's side, a merlon
// every 2.9 m; one in seven is broken (a stump, or gone). The list is made once and kept: the rooks of the parapet
// are seated on it and the edges are built by it
export function fieldParapet(P) {
  if (P.parapet) return P.parapet;
  const q = P.quad, runs = [], sd = P.seed * 0.713, items = [], sides = P.quadRanges.slice(P.nearRange.length);
  for (const m of P.nearRange) if (m.w1 > q.w0 && m.w0 < q.w1) runs.push({ a: Math.max(m.w0, q.w0), b: Math.min(m.w1, q.w1), c: q.t1 + 0.45, w: true, inw: -1, y: m.eave, m });
  runs.push({ a: q.t0, b: q.t1, c: q.w0 - 0.45, w: false, inw: 1, y: sides[0].eave, m: sides[0] }, { a: q.t0 + 13, b: q.t1, c: q.w1 + 0.45, w: false, inw: -1, y: sides[1].eave, m: sides[1] });
  let k = 0;
  for (const r of runs) {
    const n = Math.max(1, Math.floor((r.b - r.a) / 2.9));
    for (let i = 0; i < n; i++, k++) {
      const al = lerp(r.a, r.b, (i + 0.5) / n), hsh = h1(k * 3.17 + sd), c = r.w ? P.fromWT(al, r.c) : P.fromWT(r.c, al);
      items.push({ x: c[0], z: c[1], y: r.y, al, r, k, hsh, broken: hsh < 0.14, m: r.m, taken: false });
    }
  }
  return (P.parapet = items);
}
// the cloister's runs: [its first bay, one past its last] for every stretch of bays that stand
export function cloisterRuns(o) { const runs = []; for (let i = 0; i < o.nb; i++) if (o.bays[i]) { if (i > 0 && o.bays[i - 1]) runs[runs.length - 1][1] = i + 1; else runs.push([i, i + 1]); } return runs; }
// MENDING 3, M5: THE EDGE'S FALLEN STONES AND FOOT BUSHES AS THEY ARE DRAWN, for the rooks of the flags: each by
// fieldEdgeInto's own law (the same places, sizes and leavings out; nothing is dealt), as a round solid on the
// flags: a fallen merlon stone 0.96 m about its middle and 1.3 m high (its three half measures 0.75, 0.45 and
// 0.4 m, tipped); a foot bush its cone's foot and 0.2 m, with its second cone where it has one, as high as it
// stands. AND THE BUTTRESSES THAT STAND ON THE FIELD (the keep's front's): each stage a round about its plan
export function fieldEdgeSolids(P) {
  const q = P.quad, sd = P.seed * 0.713, out = [];
  const at = (r, al, off) => (r.w ? P.fromWT(al, r.c + off * r.inw) : P.fromWT(r.c + off * r.inw, al));
  const cl = (P.yard || []).find((o) => o.kind === 'cloister'), clM = cl ? P.quadRanges[P.nearRange.length + (cl.inw > 0 ? 0 : 1)] : null, spans = cl ? cloisterRuns(cl).map(([a, b]) => [cl.tA + a * cl.pitch - 0.7, cl.tA + b * cl.pitch + 0.7]) : [];
  const roofed = (r, al, reach) => !r.w && r.m === clM && spans.some(([a, b]) => al > a - reach && al < b + reach);
  const footWeed = (r, al, k) => {
    const rr = 0.35 + 0.6 * h1(k * 4.9), al2 = al + (h1(k * 1.1) - 0.5) * 2.5; if (roofed(r, al2, rr * 1.4 + 0.2)) return;
    const g = at(r, al2, 0.7 + 2.2 * h1(k * 3.3) ** 2), hh = 0.5 + 1.4 * h1(k * 6.7) ** 2, two = h1(k * 8.1) < 0.4;
    out.push({ x: g[0], z: g[1], y: q.y, r: two ? rr * 1.55 + 0.25 : rr + 0.2, h: two ? hh * 1.5 : hh });
  };
  for (const it of fieldParapet(P)) {
    const r = it.r, k = it.k;
    if (it.broken) { const fa = it.al + (h1(k * 5.9) - 0.5) * 2, f = at(r, fa, 2.4 + 4 * h1(k * 7.3)); if (!roofed(r, fa, 0.9)) out.push({ x: f[0], z: f[1], y: q.y, r: 0.96, h: 1.3 }); }
    if (h1(k * 9.7 + sd) < 0.55) footWeed(r, it.al, k);
  }
  { const r = { w: true, c: q.t0 + 0.2, inw: 1 }, n = Math.floor((q.w1 - q.w0) / 2.9), door = (P.keep.bays || []).find((b) => b.use === 1);
    for (let i = 0; i < n; i++) { const k = 5000 + i, w = lerp(q.w0, q.w1, (i + 0.5) / n); if (door && w > door.a - 1.5 && w < door.b + 1.5) continue; if (h1(k * 9.7 + sd) < 0.4) footWeed(r, w, k); } }
  for (const m of P.ranges) for (const b of m.butts || []) {
    if (b.y1 <= q.y || b.y0 > q.y + 9) continue;
    const rad = Math.hypot(b.hw, b.hl), wt = P.toWT(b.x, b.z);
    if (wt[0] > q.w0 - rad && wt[0] < q.w1 + rad && wt[1] > q.t0 - rad && wt[1] < q.t1 + rad) out.push({ x: b.x, z: b.z, y: q.y, r: rad, h: b.y1 - q.y });
  }
  return out;
}
// THE FIELD'S EDGES: the parapet's merlons; under a broken one its stone lies tipped on the flags; weeds and small
// bushes are rooted along the foot of every wall (the keep's front too) and in the parapet's own gaps; a dark arch
// stands in the gatehouse's face on the field. Each by its place along its wall: none is dealt. MENDING 2, R3: NO
// FALLEN STONE AND NO FOOT WEED LIES UNDER THE CLOISTER'S ROOF: along every run of the walk (its start less 0.7 m to
// its end plus 0.7 m, and the thing's own reach) the side range's fallen stones and foot weeds are left out, as the
// keep's foot weeds are where its steps stand
export function fieldEdgeInto(A, P) {
  const q = P.quad, sd = P.seed * 0.713, stone = mul3(PAL.stone, 0.9);
  const at = (r, al, off) => (r.w ? P.fromWT(al, r.c + off * r.inw) : P.fromWT(r.c + off * r.inw, al));
  const cl = (P.yard || []).find((o) => o.kind === 'cloister'), clM = cl ? P.quadRanges[P.nearRange.length + (cl.inw > 0 ? 0 : 1)] : null, spans = cl ? cloisterRuns(cl).map(([a, b]) => [cl.tA + a * cl.pitch - 0.7, cl.tA + b * cl.pitch + 0.7]) : [];
  const roofed = (r, al, reach) => !r.w && r.m === clM && spans.some(([a, b]) => al > a - reach && al < b + reach);
  const footWeed = (r, al, k) => {
    const rr = 0.35 + 0.6 * h1(k * 4.9), al2 = al + (h1(k * 1.1) - 0.5) * 2.5; if (roofed(r, al2, rr * 1.4 + 0.2)) return;
    const g = at(r, al2, 0.7 + 2.2 * h1(k * 3.3) ** 2), hh = 0.5 + 1.4 * h1(k * 6.7) ** 2;
    A.col([0.085 + 0.06 * h1(k), 0.11 + 0.05 * h1(k + 2), 0.04]).kind(KIND.PLAIN);
    coneInto(A, g[0], g[1], rr, q.y, q.y + hh, 5, [0.3 * (h1(k * 1.7) - 0.5), 0.3 * (h1(k * 2.7) - 0.5)]);
    if (h1(k * 8.1) < 0.4) coneInto(A, g[0] + rr * 0.8, g[1] + rr * 0.5, rr * 0.6, q.y, q.y + hh * 1.5, 4, [0.2, 0.1]);
  };
  for (const it of fieldParapet(P)) {
    const r = it.r, k = it.k, hsh = it.hsh, yaw = r.w ? P.hA : P.hA + Math.PI / 2;
    A.col(stone, 0.85 + 0.25 * h1(k * 1.3 + sd)).kind(KIND.MASON, 0, 0, 1);
    if (!it.broken) boxInto(A, it.x, it.z, yaw, 0.4, 0.75, r.y - 0.2, r.y + 1.7, { top: true });
    else {
      if (hsh > 0.05) boxInto(A, it.x, it.z, yaw, 0.4, 0.75, r.y - 0.2, r.y + 0.3 + 5 * hsh, { top: true });
      // its stone on the flags, 2 to 6 m out from the wall's foot, tipped
      const fa = it.al + (h1(k * 5.9) - 0.5) * 2, f = at(r, fa, 2.4 + 4 * h1(k * 7.3)), sp = h1(k * 4.3) * TAU, tp = 0.25 + 0.5 * h1(k * 8.7), cs = Math.cos(sp), sn = Math.sin(sp), ct = Math.cos(tp), st = Math.sin(tp);
      if (!roofed(r, fa, 0.9)) blockInto(A, [f[0], q.y + 0.36, f[1]], [cs * 0.75, 0, sn * 0.75], [-sn * st * 0.45, ct * 0.45, cs * st * 0.45], [sn * ct * 0.4, st * 0.4, -cs * ct * 0.4]);
    }
    // weeds: in the parapet's gap beside this merlon, and at the wall's foot under it
    if (h1(k * 6.1 + sd) < 0.3) { const g = at(r, it.al + 1.45, 0); A.col([0.1, 0.12, 0.045]).kind(KIND.PLAIN); coneInto(A, g[0], g[1], 0.3, r.y - 0.2, r.y + 0.4 + 0.7 * h1(k * 2.9), 4, [0.1, 0.1]); }
    if (h1(k * 9.7 + sd) < 0.55) footWeed(r, it.al, k);
  }
  // the keep's foot: weeds between its buttresses
  { const r = { w: true, c: q.t0 + 0.2, inw: 1 }, n = Math.floor((q.w1 - q.w0) / 2.9);
    // (ROUND 7: none where the keep's steps stand)
    const door = (P.keep.bays || []).find((b) => b.use === 1);
    for (let i = 0; i < n; i++) { const k = 5000 + i, w = lerp(q.w0, q.w1, (i + 0.5) / n); if (door && w > door.a - 1.5 && w < door.b + 1.5) continue; if (h1(k * 9.7 + sd) < 0.4) footWeed(r, w, k); } }
  // the gatehouse's arch on the field: dark, pointed, ARCH_HALF to either hand of the field's axis
  { const t = q.t1 - 0.06, w = q.mid, c = (dw, y) => { const p = P.fromWT(w + dw, t); return [p[0], y, p[1]]; }, ox = -P.T[0], oz = -P.T[1];
    A.col([0.012, 0.012, 0.016]).kind(KIND.PLAIN);
    quadOut(A, c(-ARCH_HALF, q.y), c(ARCH_HALF, q.y), c(ARCH_HALF, q.y + 2.6), c(-ARCH_HALF, q.y + 2.6), ox, 0, oz);
    triOut(A, c(-ARCH_HALF, q.y + 2.6), c(ARCH_HALF, q.y + 2.6), c(0, q.y + 4.1), ox, 0, oz);
    A.col(PAL.stoneWarm, 1.0).kind(KIND.PLAIN);
    for (const sx of [-1, 1]) { const p = P.fromWT(w + sx * (ARCH_HALF + 0.3), q.t1 - 0.2); boxInto(A, p[0], p[1], P.hA, 0.3, 0.3, q.y, q.y + 2.7, { top: true }); } }
}
// THE LANE'S COURT, ITS LANTERNS AND ITS BRIDGE: the paved court between the two ranges on its own end walls (its uv is
// its own measure: metres along the lane, nought at its mouth, and metres to the right of its axis); a lantern on a
// post every 14 m on alternate hands; lanterns on brackets, a brazier, a balcony; the covered bridge: a pointed arch over the whole breadth of the lane, springing
// at BRIDGE_SPRING and BRIDGE_CROWN high at its crown, a gallery of windows over it under its own slate roof
export function laneInto(A, P) {
  const L = P.lane, y = L.y, ua = L.u0 + 4, ub = L.u1 - 4, h = L.half, at = (u, v, yy) => { const c = P.laneAt(u, v); return [c[0], yy, c[1]]; };
  const stone = mul3(PAL.stone, 0.9), mid = P.laneAt((ua + ub) / 2, 0);
  A.col(stone).kind(KIND.MASON, 0, 0.2, 0.6); boxInto(A, mid[0], mid[1], L.az, h, (ua - ub) / 2, y - 44, y - 0.02, {});
  A.col(PAL.flags, 0.85).kind(KIND.FLAGS, L.az - Math.PI / 2, 2, 0.8);
  const n = 12, up = (p, q, r) => (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]) >= 0;
  for (let i = 0; i < n; i++) {
    const u0 = lerp(ua, ub, i / n), u1 = lerp(ua, ub, (i + 1) / n);
    const c = [[at(u0, -h, y), L.u0 - u0, -h], [at(u0, h, y), L.u0 - u0, h], [at(u1, h, y), L.u0 - u1, h], [at(u1, -h, y), L.u0 - u1, -h]];
    const order = up(c[0][0], c[1][0], c[2][0]) ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    for (const k of order) A.v(c[k][0][0], y, c[k][0][2], 0, 1, 0, c[k][1], c[k][2]);
  }
  for (const q of L.lamps) {
    const c = P.laneAt(L.u0 - q.a, q.v);
    A.col([0.1, 0.09, 0.08]).kind(KIND.PLAIN); boxInto(A, c[0], c[1], L.az, 0.1, 0.1, y, y + 3.4, {});
    A.col([1, 0.62, 0.24], 0.9).kind(KIND.GLOW); boxInto(A, c[0], c[1], L.az, 0.28, 0.28, y + 3.4, y + 4.15, { top: true });
  }
  // the brazier in the court: an iron basket on three legs, its embers glowing (it stands in a lantern's pool of light)
  { const q = L.brazier, c = P.laneAt(L.u0 - q.a, q.v);
    A.col([0.06, 0.055, 0.05]).kind(KIND.PLAIN);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.4; boxInto(A, c[0] + Math.sin(a) * 0.42, c[1] - Math.cos(a) * 0.42, a, 0.04, 0.04, y, y + 0.75, {}); }
    drumInto(A, c[0], c[1], 0.38, 0.55, y + 0.7, y + 1.15, 8);
    A.col([1, 0.45, 0.12], 1.6).kind(KIND.GLOW); drumInto(A, c[0], c[1], 0.3, 0.46, y + 0.95, y + 1.2, 8, { top: true });
    A.col([1, 0.7, 0.25], 2.2); boxInto(A, c[0], c[1], 0.6, 0.16, 0.18, y + 1.2, y + 1.42, { top: true }); }
  // the lanterns on brackets: an iron arm 0.9 m out of the wall, the lantern hung under its end
  for (const q of L.brackets) {
    const c = P.laneAt(L.u0 - q.a, q.side * (h - 0.45)), e = P.laneAt(L.u0 - q.a, q.side * (h - 0.9)), yy = y + q.up;
    A.col([0.07, 0.065, 0.06]).kind(KIND.PLAIN); boxInto(A, c[0], c[1], L.az, 0.47, 0.05, yy, yy + 0.09, { top: true }); boxInto(A, e[0], e[1], L.az, 0.035, 0.035, yy - 0.3, yy, {});
    // (MENDING 2, S1: the arm's stay: an iron strut from the wall 0.7 m under the arm up to the arm 0.8 m out)
    { const ix = -q.side * L.right[0], iz = -q.side * L.right[1], w0 = P.laneAt(L.u0 - q.a, q.side * (h - 0.4)), l = Math.hypot(0.4, 0.35);
      blockInto(A, [w0[0], yy - 0.35, w0[1]], [ix * 0.4, 0.35, iz * 0.4], [-ix * 0.35 / l * 0.03, 0.4 / l * 0.03, -iz * 0.35 / l * 0.03], [L.dir[0] * 0.03, 0, L.dir[1] * 0.03]); }
    A.col([1, 0.62, 0.24], 0.95).kind(KIND.GLOW); boxInto(A, e[0], e[1], L.az, 0.2, 0.2, yy - 0.85, yy - 0.3, { top: true });
  }
  // the balcony: a slab on two corbels, an iron rail, a lit door behind it
  { const b = L.balcony, sd = b.side, yb = y + b.up, cm = P.laneAt(L.u0 - b.a, sd * (h - 0.65)), ld2 = L.dir;
    A.col(stone, 1.05).kind(KIND.MASON, 0, 0, 0.7); boxInto(A, cm[0], cm[1], L.az, 0.65, b.wide, yb - 0.25, yb, { top: true });
    for (const f of [-0.7, 0.7]) { const c = P.laneAt(L.u0 - b.a + f * b.wide, sd * (h - 0.35)); boxInto(A, c[0], c[1], L.az, 0.35, 0.22, yb - 1.1, yb - 0.25, {}); }
    A.col([0.06, 0.055, 0.05]).kind(KIND.PLAIN);
    { const c = P.laneAt(L.u0 - b.a, sd * (h - 1.25)); boxInto(A, c[0], c[1], L.az, 0.035, b.wide, yb + 0.95, yb + 1.03, { top: true }); }
    for (let i = 0; i <= 8; i++) { const c = P.laneAt(L.u0 - b.a + (i / 4 - 1) * b.wide, sd * (h - 1.25)); boxInto(A, c[0], c[1], L.az, 0.025, 0.025, yb, yb + 0.95, {}); }
    for (const f of [-1, 1]) { const c = P.laneAt(L.u0 - b.a + f * b.wide, sd * (h - 0.65)); boxInto(A, c[0], c[1], L.az, 0.6, 0.03, yb + 0.95, yb + 1.03, { top: true }); }
    const da = P.laneAt(L.u0 - b.a + 0.6, sd * (h - 0.05)), db = P.laneAt(L.u0 - b.a - 0.6, sd * (h - 0.05));
    const nx = (P.laneAt(0, 0)[0] - P.laneAt(0, sd)[0]), nz = (P.laneAt(0, 0)[1] - P.laneAt(0, sd)[1]);
    // (MENDING 3, M6: A DOOR BEHIND WHICH A LAMP BURNS IS LIT AT EVERY HOUR, as the fixed lanterns are: its pane's
    // place in the order of lighting is -1, under every hour's share and the slow rounds at the share's edge (the
    // place 0.02 it had went dark by day for some 17 s of every 101 s); its leaded glass and its flicker stay)
    A.col([1, 0.6, 0.24], 0.9).kind(KIND.PANE, -1, 0, 1);
    quadOut(A, [da[0], yb, da[1]], [db[0], yb, db[1]], [db[0], yb + 2.3, db[1]], [da[0], yb + 2.3, da[1]], nx, 0, nz); }
  // ROUND 7, B2: THE HANGING GALLERIES, each on its corbel table under its pent roof, its small windows in a row
  for (const j of L.jetties || []) {
    const sd = j.side, m = j.m, st = toneOf(m.tone), um = (j.ua + j.ub) / 2, hl2 = Math.abs(j.ua - j.ub) / 2, y0 = y + j.up, y1 = y0 + j.tall, sh = m.shade ?? 1, vo = sd * (h - j.out), nx = -sd * L.right[0], nz = -sd * L.right[1];
    { const c = P.laneAt(um, sd * (h - j.out / 2)); A.col(st, 1.05).kind(KIND.MASON, 0, 0, sh); boxInto(A, c[0], c[1], L.az, j.out / 2, hl2, y0, y1, {}); }
    // (MENDING 2, R10: THE CORBEL TABLE STOPS 1.6 M SHORT OF A FLYING ARCH whose rib would stand in it or pass a
    // hand under it: where an arch crosses the gallery's span and its back, at the table's face, stands over the
    // table's foot or within 0.3 m under it, the table is two lengths with the arch between them)
    { const segs = [[j.ua - 0.2, j.ub + 0.2]];
      for (const ar of L.arches || []) {
        const u = L.u0 - ar.a, hh2 = h + 0.2, back = ar.spring + ar.rise * (1 - Math.pow((h - j.out + 0.3) / hh2, 1.7)) + 1.3, g = ar.thick / 2 + 1.6;
        if (back < y0 - 1.5 - 0.3) continue;
        for (let i = segs.length - 1; i >= 0; i--) { const [a, b] = segs[i]; if (u + g <= b || u - g >= a) continue; segs.splice(i, 1); if (a - (u + g) > 0.6) segs.push([a, u + g]); if ((u - g) - b > 0.6) segs.push([u - g, b]); }
      }
      for (const [a, b] of segs) {
        const c = P.laneAt((a + b) / 2, sd * (h - (j.out - 0.3) / 2)); A.col(st, 0.95).kind(KIND.MASON, y0 - 1.5, 1, sh); boxInto(A, c[0], c[1], L.az, (j.out - 0.3) / 2, (a - b) / 2, y0 - 1.5, y0, {});
        A.col(st, 0.6).kind(KIND.MASON, 0, 0, sh); quadOut(A, at(a, sd * h, y0 - 1.5), at(b, sd * h, y0 - 1.5), at(b, sd * (h - j.out + 0.3), y0 - 1.5), at(a, sd * (h - j.out + 0.3), y0 - 1.5), 0, -1, 0);
      } }
    A.col(mul3(mix3(PAL.slate, PAL.slateBlue, m.blue), 0.9)).kind(KIND.SLATE);
    quadOut(A, at(j.ua + 0.2, sd * (h - j.out - 0.25), y1 - 0.05), at(j.ub - 0.2, sd * (h - j.out - 0.25), y1 - 0.05), at(j.ub - 0.2, sd * (h - 0.02), y1 + 1.5), at(j.ua + 0.2, sd * (h - 0.02), y1 + 1.5), nx * 0.5, 1, nz * 0.5);
    A.col(st, 0.8).kind(KIND.PLAIN);
    for (const [u, e] of [[j.ua + 0.2, -1], [j.ub - 0.2, 1]]) triOut(A, at(u, sd * (h - j.out - 0.25), y1 - 0.05), at(u, sd * (h - 0.02), y1 - 0.05), at(u, sd * (h - 0.02), y1 + 1.5), -e * L.dir[0], 0, -e * L.dir[1]);
    // (the row of windows: a skin a hand's breadth off the gallery's front, the gallery's own stone, its dress 4:
    // the stone's shader lays a lancet in every 2.8 m of it, each back in its reveal, lit in its own turn)
    A.col(st, 1.05).kind(KIND.MASON, y0, 4, sh);
    quadOut(A, at(j.ua, vo - sd * 0.08, y0 + 0.02), at(j.ub, vo - sd * 0.08, y0 + 0.02), at(j.ub, vo - sd * 0.08, y1 - 0.02), at(j.ua, vo - sd * 0.08, y1 - 0.02), nx, 0, nz);
  }
  // THE LIT ORIELS: a bay of stone on two corbels under a weathered head, a lit window in its front and its two sides
  for (const o of L.oriels || []) {
    const sd = o.side, u = L.u0 - o.a, y0 = y + o.up, y1 = y0 + 4.4, c = P.laneAt(u, sd * (h - 0.55)), nx = -sd * L.right[0], nz = -sd * L.right[1], vf = sd * (h - 1.1);
    A.col(stone, 1.08).kind(KIND.MASON, 0, 0, 0.8); buttInto(A, { x: c[0], z: c[1], yaw: L.az, hw: 0.55, hl: 1.3, y0, y1: y1 + 0.9, fall: 0.9, out: -sd });
    // (MENDING 2, S1: THE BAY STANDS ON A CORBELLED FOOT, seen from down the lane: three courses of stone stepping
    // out of the wall under the whole bay, the lowest 0.35 m out and 1.2 m long, the highest as broad as the bay
    // less a hand, 1.6 m in all; where the two small corbels stood)
    for (const [ya, yb, out, hl, tn] of [[1.6, 0.95, 0.35, 0.6, 0.76], [0.95, 0.45, 0.65, 0.95, 0.84], [0.45, 0, 0.95, 1.25, 0.94]]) {
      const p = P.laneAt(u, sd * (h - out / 2)); A.col(stone, tn).kind(KIND.MASON, 0, 0, 0.8); boxInto(A, p[0], p[1], L.az, out / 2, hl, y0 - ya, y0 - yb, {});
      A.col(stone, tn * 0.6); quadOut(A, at(u + hl, sd * h, y0 - ya), at(u - hl, sd * h, y0 - ya), at(u - hl, sd * (h - out), y0 - ya), at(u + hl, sd * (h - out), y0 - ya), 0, -1, 0);
    }
    A.col(mix3([1, 0.5, 0.16], [1, 0.76, 0.44], o.warm), 0.32).kind(KIND.PANE, 0, 0, 1);
    quadOut(A, at(u + 0.9, vf - sd * 0.03, y0 + 1.0), at(u - 0.9, vf - sd * 0.03, y0 + 1.0), at(u - 0.9, vf - sd * 0.03, y0 + 3.7), at(u + 0.9, vf - sd * 0.03, y0 + 3.7), nx, 0, nz);
    for (const e of [-1, 1]) quadOut(A, at(u + e * 1.33, sd * (h - 0.15), y0 + 1.0), at(u + e * 1.33, sd * (h - 0.95), y0 + 1.0), at(u + e * 1.33, sd * (h - 0.95), y0 + 3.7), at(u + e * 1.33, sd * (h - 0.15), y0 + 3.7), -e * L.dir[0], 0, -e * L.dir[1]);
    // (a stone mullion and a transom before the front's pane, a sill standing out under it)
    A.col(stone, 1.12).kind(KIND.MASON, 0, 0, 0.8);
    { const p = P.laneAt(u, vf - sd * 0.08); boxInto(A, p[0], p[1], L.az, 0.06, 0.07, y0 + 1.0, y0 + 3.7, {}); boxInto(A, p[0], p[1], L.az, 0.06, 0.9, y0 + 2.5, y0 + 2.64, {}); }
    { const p = P.laneAt(u, vf - sd * 0.12); boxInto(A, p[0], p[1], L.az, 0.14, 1.05, y0 + 0.84, y0 + 1.0, { top: true }); }
  }
  // THE FLYING ARCHES: a pointed rib of stone from wall to wall, 1.3 m deep, its soffit in the lane's own shade
  for (const ar of L.arches || []) {
    const u = L.u0 - ar.a, hh2 = h + 0.2, NA = 10, t2 = ar.thick / 2, dpt = 1.3, ld2 = L.dir;
    const prof = (k) => { const v = -hh2 + 2 * hh2 * k / NA; return [v, ar.spring + ar.rise * (1 - Math.pow(Math.abs(v) / hh2, 1.7))]; };
    for (let k = 0; k < NA; k++) {
      const p0 = prof(k), p1 = prof(k + 1);
      A.col(stone, 0.86).kind(KIND.MASON, 0, 0, 0.7); quadOut(A, at(u + t2, p0[0], p0[1]), at(u + t2, p1[0], p1[1]), at(u - t2, p1[0], p1[1]), at(u - t2, p0[0], p0[1]), 0, -1, 0);
      A.col(stone, 1.0).kind(KIND.MASON, 0, 0, 0.8); quadOut(A, at(u + t2, p0[0], p0[1] + dpt), at(u + t2, p1[0], p1[1] + dpt), at(u - t2, p1[0], p1[1] + dpt), at(u - t2, p0[0], p0[1] + dpt), 0, 1, 0);
      quadOut(A, at(u + t2, p0[0], p0[1]), at(u + t2, p1[0], p1[1]), at(u + t2, p1[0], p1[1] + dpt), at(u + t2, p0[0], p0[1] + dpt), -ld2[0], 0, -ld2[1]);
      quadOut(A, at(u - t2, p0[0], p0[1]), at(u - t2, p1[0], p1[1]), at(u - t2, p1[0], p1[1] + dpt), at(u - t2, p0[0], p0[1] + dpt), ld2[0], 0, ld2[1]);
    }
  }
  // the bridge
  const B = L.bridge, hb = M.BRIDGE_LONG / 2, hh = h + 0.3, ys = M.BRIDGE_SPRING, yc = M.BRIDGE_CROWN, N = 14, ld = L.dir, bs = toneOf(B.tone);
  const prof = (k) => { const v = -hh + 2 * hh * k / N; return [v, ys + (yc - ys) * (1 - Math.pow(Math.abs(v) / hh, 1.7))]; };
  const wallK = [KIND.MASON, B.sd + 0.8, 0, B.shade];
  for (let k = 0; k < N; k++) {
    const p0 = prof(k), p1 = prof(k + 1), ua2 = M.BRIDGE_AT + hb, ub2 = M.BRIDGE_AT - hb;
    A.col(bs, 0.9).kind(KIND.MASON, 0, 0, 0.8);
    quadOut(A, at(ua2, p0[0], p0[1]), at(ua2, p1[0], p1[1]), at(ub2, p1[0], p1[1]), at(ub2, p0[0], p0[1]), 0, -1, 0);
    A.col(bs); A.k = wallK;
    quadOut(A, at(ua2, p0[0], p0[1]), at(ua2, p1[0], p1[1]), at(ua2, p1[0], B.eave), at(ua2, p0[0], B.eave), -ld[0], 0, -ld[1]);
    quadOut(A, at(ub2, p0[0], p0[1]), at(ub2, p1[0], p1[1]), at(ub2, p1[0], B.eave), at(ub2, p0[0], B.eave), ld[0], 0, ld[1]);
  }
  bridgeRoofInto(A, B, mul3(mix3(PAL.slate, PAL.slateBlue, B.blue), 0.95), bs, wallK);
}
// THE PAVED PLACES AND THE SLOT'S BRIDGE (no draws: each by its place's own measures). The forecourt before the
// field's gatehouse stands on its own walls, a parapet round its three open sides. The back court lies behind the
// keep and runs on through the slot, a parapet on its gulf side and at the slot's far end. The slot's bridge stands
// on an abutment at either end and a pier under its middle: two pointed arches, a gallery of windows over them
// under its own slate roof. The lane's apron runs from the lane's court to the tower's round, as broad as the
// lane's whole ground; the round is one paved drum about the tower's foot. A lamp stands on its post (or hangs on
// its bracket) at every place of P.lamps
export function courtsInto(A, P) {
  const q = P.quad, L = P.lane, F = P.finger, stone = mul3(PAL.stone, 0.9), W = P.W, T = P.T;
  const c = (w, t, y) => { const p = P.fromWT(w, t); return [p[0], y, p[1]]; };
  // (a retaining wall is a wall like any other: its own windows by its own number, ivy, a plinth, buttresses, a string)
  const wall = (ivy = 0.2, sd = 0) => A.col(stone, 0.92).kind(KIND.MASON, sd, ivy, 0.8), flags = (shade, dry = 0) => A.col(PAL.flags, 0.85).kind(KIND.FLAGS, P.hA - Math.PI / 2, dry, shade);
  const bx = (wa, wb, ta, tb, y0, y1, o = {}) => { const m = P.fromWT((wa + wb) / 2, (ta + tb) / 2); boxInto(A, m[0], m[1], P.hA, Math.abs(tb - ta) / 2, Math.abs(wb - wa) / 2, y0, y1, o); };
  const slab = (w0, w1, t0, t1, y0, y, shade, sd = 0, dry = 0) => {
    wall(0.2, sd); bx(w0, w1, t0, t1, y0, y - 0.02);
    flags(shade, dry); quadOut(A, c(w0, t0, y), c(w1, t0, y), c(w1, t1, y), c(w0, t1, y), 0, 1, 0);
  };
  // the dress of one face of a retaining wall, from (wa, ta) to (wb, tb), (ow, ot) its way out: a plinth standing
  // out under its lowest fifth, a buttress every 13 m or so in two stages with a weathered head, and a string of
  // dressed stone under the parapet
  const dress = (wa, ta, wb, tb, ow, ot, y0, y) => {
    const len = Math.hypot(wb - wa, tb - ta), n = Math.max(2, Math.round(len / 13)), aw = (wb - wa) / len, at = (tb - ta) / len, yp = y0 + (y - y0) * 0.2, ym = y - 15;
    const run = (f0, f1, d0, d1, ya, yb, o) => bx(wa + aw * f0 + ow * d0, wa + aw * f1 + ow * d1, ta + at * f0 + ot * d0, ta + at * f1 + ot * d1, ya, yb, o);
    A.col(stone, 0.84).kind(KIND.MASON, 0, 0.1, 0.8); run(0, len, 0, 1.1, y0, yp, { top: true });
    A.col(stone, 1.06).kind(KIND.MASON, 0, 0, 1); run(0, len, 0, 0.35, y - 2.6, y - 2.0, { top: true });
    for (let k = 0; k <= n; k++) {
      // (ROUND 7: at unequal places, each its own breadth, by its place along its wall)
      const f = len * (k + (k > 0 && k < n ? (h1(k * 7.7 + len * 0.37 + wa * 0.11) - 0.5) * 0.6 : 0)) / n, h = 1.15 * (0.75 + 0.6 * h1(k * 3.1 + len * 0.7));
      A.col(stone, 0.9).kind(KIND.MASON, 0, 0.16, 0.8); run(f - h, f + h, 0, 2.0, y0, ym, { top: true });
      A.col(stone, 0.95); run(f - h * 0.8, f + h * 0.8, 0, 1.1, ym, y - 2.6, { top: true });
    }
  };
  // a parapet from one place to another: a low wall and its merlons
  const parapet = (w0, t0, w1, t1, y) => {
    const a = P.fromWT(w0, t0), b = P.fromWT(w1, t1), yaw = Math.atan2(b[0] - a[0], -(b[1] - a[1]));
    A.col(stone, 0.95).kind(KIND.MASON, 0, 0, 1);
    boxInto(A, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, yaw, 0.45, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, y - 0.3, y + 0.9, { top: true });
    merlonsInto(A, a[0], a[1], b[0], b[1], y + 0.9, 1.1, 1.5, 0.9, 1.4);
  };
  // ---- the forecourt
  { const tf = q.t1 + M.NEAR_DEEP, w0 = q.mid - M.FORE_HALF, w1 = q.mid + M.FORE_HALF, t1 = tf + M.FORE_DEEP;
    // (its walls; its floor, laid with the forecourt's own uv: the worn way out of the arch is read by it)
    wall(0.2, 23.45); bx(w0, w1, tf, t1, 20, M.QUAD_Y - 0.02);
    flags(1, 3); foreQuad(A, P, c(w0, tf, M.QUAD_Y), c(w1, tf, M.QUAD_Y), c(w1, t1, M.QUAD_Y), c(w0, t1, M.QUAD_Y));
    // THE GATEHOUSE'S ARCH ON THE FORECOURT, as on the field: dark, pointed, ARCH_HALF to either hand of the field's
    // axis, a pale jamb at either hand. The worn way runs out of it
    { const ta = tf + 0.06, y = M.QUAD_Y, ca = (dw, ya) => c(q.mid + dw, ta, ya);
      A.col([0.012, 0.012, 0.016]).kind(KIND.PLAIN);
      quadOut(A, ca(-ARCH_HALF, y), ca(ARCH_HALF, y), ca(ARCH_HALF, y + 2.6), ca(-ARCH_HALF, y + 2.6), T[0], 0, T[1]);
      triOut(A, ca(-ARCH_HALF, y + 2.6), ca(ARCH_HALF, y + 2.6), ca(0, y + 4.1), T[0], 0, T[1]);
      A.col(PAL.stoneWarm, 1.0).kind(KIND.PLAIN);
      for (const sx of [-1, 1]) { const p = P.fromWT(q.mid + sx * (ARCH_HALF + 0.3), tf + 0.2); boxInto(A, p[0], p[1], P.hA, 0.3, 0.3, y, y + 2.7, { top: true }); } }
    dress(w0, tf + 6, w0, t1, -1, 0, 20, M.QUAD_Y); dress(w1, tf + 6, w1, t1, 1, 0, 20, M.QUAD_Y); dress(w0, t1, w1, t1, 0, 1, 20, M.QUAD_Y);
    parapet(w0 + 0.45, tf, w0 + 0.45, t1, M.QUAD_Y); parapet(w1 - 0.45, tf, w1 - 0.45, t1, M.QUAD_Y); parapet(w0, t1 - 0.45, w1, t1 - 0.45, M.QUAD_Y); }
  // ---- the back court, and its run through the slot
  { const y = M.COURT_Y;
    slab(M.KEEP_W1, M.SLOT_W0, 0, M.COURT_T1, -24, y, 0.8, 31.4); slab(M.SLOT_W0, M.SLOT_W1, 0, M.SLOT_T0, -24, y, 0.8, 33.4);
    dress(M.KEEP_W1 + 12, M.COURT_T1, M.SLOT_W0, M.COURT_T1, 0, 1, -24, y);
    parapet(M.KEEP_W1 + 12, M.COURT_T1 - 0.45, M.SLOT_W0, M.COURT_T1 - 0.45, y); parapet(M.SLOT_W1 - 0.45, 0.5, M.SLOT_W1 - 0.45, M.SLOT_T0 - 0.5, y); }
  // ---- the slot's bridge
  { const B = P.sbridge, w0 = M.SBRIDGE_W0, w1 = M.SBRIDGE_W1, y0 = M.COURT_Y, ys = M.SBRIDGE_SPRING, yf = B.eave - 6.5, yc = yf - 1.4, bs = toneOf(B.tone), wallK = [KIND.MASON, B.sd + 0.8, 0, B.shade];
    const piers = [[0, 3.6], [M.SLOT_T0 / 2 - 1.9, M.SLOT_T0 / 2 + 1.9], [M.SLOT_T0 - 3.6, M.SLOT_T0]], N = 10;
    // (the abutments and the pier: from the paving to the gallery's floor, a foot standing out under each)
    for (const [ta, tb] of piers) {
      const m = P.fromWT((w0 + w1) / 2, (ta + tb) / 2);
      A.col(bs, 0.9).kind(KIND.MASON, 0, 0.12, B.shade); boxInto(A, m[0], m[1], P.hA, (tb - ta) / 2, (w1 - w0) / 2 + 0.7, y0, yf, {});
      A.col(bs, 0.8); boxInto(A, m[0], m[1], P.hA, (tb - ta) / 2 + 0.7, (w1 - w0) / 2 + 1.4, y0, y0 + 2.6, { top: true });
      A.col(bs, 1.05); boxInto(A, m[0], m[1], P.hA, (tb - ta) / 2 + 0.35, (w1 - w0) / 2 + 1.0, ys - 0.5, ys + 0.3, { top: true });
    }
    for (let sp = 0; sp < 2; sp++) {
      const ta = piers[sp][1], tb = piers[sp + 1][0], hh = (tb - ta) / 2, tm = (ta + tb) / 2;
      const prof = (k) => { const v = -hh + 2 * hh * k / N; return [tm + v, ys + (yc - ys) * (1 - Math.pow(Math.abs(v) / hh, 1.7))]; };
      for (let k = 0; k < N; k++) {
        const p0 = prof(k), p1 = prof(k + 1);
        A.col(bs, 0.9).kind(KIND.MASON, 0, 0, 0.8);
        quadOut(A, c(w0, p0[0], p0[1]), c(w0, p1[0], p1[1]), c(w1, p1[0], p1[1]), c(w1, p0[0], p0[1]), 0, -1, 0);
        A.col(bs); A.k = wallK;
        quadOut(A, c(w0, p0[0], p0[1]), c(w0, p1[0], p1[1]), c(w0, p1[0], B.eave), c(w0, p0[0], B.eave), -W[0], 0, -W[1]);
        quadOut(A, c(w1, p0[0], p0[1]), c(w1, p1[0], p1[1]), c(w1, p1[0], B.eave), c(w1, p0[0], B.eave), W[0], 0, W[1]);
      }
    }
    // (the gallery's wall over the abutments and the pier; the band of dressed stone under its floor)
    for (const [ta, tb] of piers) for (const [w, o] of [[w0, -1], [w1, 1]]) { A.col(bs); A.k = wallK; quadOut(A, c(w, ta, yf), c(w, tb, yf), c(w, tb, B.eave), c(w, ta, B.eave), o * W[0], 0, o * W[1]); }
    A.col(bs, 1.12).kind(KIND.MASON, 0, 0, 1); boxInto(A, B.x, B.z, P.hA, B.hl, B.hw + 0.3, yf - 0.45, yf, { top: true });
    bridgeRoofInto(A, B, mul3(mix3(PAL.slate, PAL.slateBlue, B.blue), 0.95), bs, wallK); }
  // ---- the lane's apron and the tower's round: one floor, the round's rim in M.ROUND_N lengths of which the
  // M.APRON_N to either hand of the lane's bearing are the apron's inner edge
  { const y = L.y, R = M.ROUND_R, NR = M.ROUND_N, NA = M.APRON_N, a0 = L.az + Math.PI, rim = (k) => { const a = a0 + k / NR * TAU; return [F.x + Math.sin(a) * R, y, F.z - Math.cos(a) * R]; };
    const half = L.half + L.deep + 4, ua = L.u1 - 4, edge = (k) => { const p = P.laneAt(ua, half * k / NA); return [p[0], y, p[1]]; }, low = (p) => [p[0], y - 44, p[2]];
    for (let k = 0; k < NR; k++) {
      const a = rim(k), b = rim(k + 1), am = a0 + (k + 0.5) / NR * TAU, apron = k < NA || k >= NR - NA;
      flags(1, 4); triOut(A, [F.x, y, F.z], a, b, 0, 1, 0);
      if (apron) { const j = k < NA ? k : k - NR, e0 = edge(-j), e1 = edge(-j - 1); quadOut(A, a, b, e1, e0, 0, 1, 0); }
      else {
        wall(0.3, 37.4); quadOut(A, low(a), low(b), b, a, Math.sin(am), 0, -Math.cos(am));
        // (a pier against the drum at every third length of its rim, and the string under its edge)
        if (k % 3 === 0) { A.col(stone, 0.9).kind(KIND.MASON, 0, 0.16, 0.8); boxInto(A, a[0] + Math.sin(am) * 0.5, a[2] - Math.cos(am) * 0.5, am, 1.4, 1.2, y - 44, y - 2.4, { top: true }); }
        A.col(stone, 1.06).kind(KIND.MASON, 0, 0, 1); boxInto(A, (a[0] + b[0]) / 2, (a[2] + b[2]) / 2, am, 0.3, Math.hypot(b[0] - a[0], b[2] - a[2]) / 2, y - 2.4, y - 1.8, { top: true });
      }
    }
    for (const sd of [-1, 1]) { const e = edge(sd * NA), r = rim(-sd * NA); wall(0.3); quadOut(A, low(e), low(r), r, e, sd * L.right[0], 0, sd * L.right[1]); } }
  // ---- the lamps: a lantern on an iron post 4 m over its paving, or hung under an iron arm out of its wall
  for (const q2 of P.lamps) {
    if (q2.post) {
      A.col([0.1, 0.09, 0.08]).kind(KIND.PLAIN); boxInto(A, q2.x, q2.z, P.hA, 0.1, 0.1, q2.y - 4, q2.y - 0.6, {});
      boxInto(A, q2.x, q2.z, P.hA, 0.3, 0.3, q2.y - 4, q2.y - 3.75, { top: true });
      A.col([1, 0.62, 0.24], 0.9).kind(KIND.GLOW); boxInto(A, q2.x, q2.z, P.hA, 0.3, 0.3, q2.y - 0.6, q2.y + 0.2, { top: true });
    } else {
      const ar = q2.arm, yaw = Math.atan2(ar[0], -ar[1]);
      A.col([0.07, 0.065, 0.06]).kind(KIND.PLAIN); boxInto(A, q2.x - ar[0] * 0.45, q2.z - ar[1] * 0.45, yaw, 0.05, 0.5, q2.y + 0.5, q2.y + 0.6, { top: true }); boxInto(A, q2.x, q2.z, yaw, 0.03, 0.03, q2.y + 0.3, q2.y + 0.5, {});
      A.col([1, 0.62, 0.24], 0.95).kind(KIND.GLOW); boxInto(A, q2.x, q2.z, yaw, 0.26, 0.26, q2.y - 0.4, q2.y + 0.3, { top: true });
    }
  }
}
// THE KEEP'S WALL OF WINDOWS: the second mass's face toward the field is 26 bays of tall windows in two tiers. A
// skin of dressed stone stands 0.9 m before the wall: a pier between every two bays, a band under the lower tier,
// between the tiers and over the upper; each window is the opening between two piers, a lancet 1.3 m wide under a pointed
// head, its pane set back on the wall behind (the piers' sides are its reveals), a stone mullion and a transom
// before the pane, a sill standing out under it with its shade on the band below. Of the 52 panes one in eleven has
// an early place in the order of lighting and the others the order's far end, so that a few are lit at any hour and
// the wall is never all alight; a lit pane is dim, each of its own warmth (a candle's red gold to a lamp's pale gold)
export function keepGlassInto(A, P) {
  const g = P.keep.glass, n = g.n, bw = (g.w1 - g.w0) / n, D = 0.9, ww = 1.3, ox = P.T[0], oz = P.T[1], ym = (g.y0 + g.y1) / 2, st = toneOf(0.98);
  const c = (w, y, d) => { const p = P.fromWT(w, g.t + d); return [p[0], y, p[1]]; };
  const box = (w0, w1, d0, d1, y0, y1, o) => { const p = P.fromWT((w0 + w1) / 2, g.t + (d0 + d1) / 2); boxInto(A, p[0], p[1], P.hA, (d1 - d0) / 2, (w1 - w0) / 2, y0, y1, o); };
  // (the piers, and the three bands a little behind their faces)
  for (let i = 0; i <= n; i++) { const w = g.w0 + bw * i; A.col(st, 0.96 + 0.08 * h1(i * 1.7 + g.y0)).kind(KIND.MASON, 0, 0, 1); box(w - (bw - ww) / 2, w + (bw - ww) / 2, 0, D, g.y0 - 5, g.y1 + 4, { top: true }); }
  A.col(st, 0.9).kind(KIND.MASON, 0, 0, 1);
  for (const [ya, yb] of [[g.y0 - 5, g.y0], [ym - 2.2, ym + 2.2], [g.y1, g.y1 + 4]]) box(g.w0, g.w1, 0, D - 0.06, ya, yb, { top: true });
  for (let i = 0; i < n; i++) for (let tier = 0; tier < 2; tier++) {
    const w = g.w0 + bw * (i + 0.5), ya = tier ? ym + 2.2 : g.y0, yb = tier ? g.y1 : ym - 2.2, yh = yb - 1.9, k = i * 2 + tier, hw = ww / 2;
    A.col(mix3([1, 0.45, 0.14], [1, 0.74, 0.42], h1(k * 5.3 + 1.7)), 0.26 + 0.2 * h1(k * 2.9 + 0.4)).kind(KIND.PANE, h1(k * 3.7 + g.y0) < 0.09 ? 0.02 + 0.3 * h1(k * 1.9) : 0.97, 0, 1);
    quadOut(A, c(w - hw, ya, 0.07), c(w + hw, ya, 0.07), c(w + hw, yb, 0.07), c(w - hw, yb, 0.07), ox, 0, oz);
    // (the pointed head: the skin's two corners over the opening, and their under sides back to the wall)
    A.col(st, 0.9).kind(KIND.MASON, 0, 0, 1);
    for (const sx of [-1, 1]) {
      triOut(A, c(w + sx * hw, yh, D - 0.06), c(w + sx * hw, yb, D - 0.06), c(w, yb, D - 0.06), ox, 0, oz);
      A.col(st, 0.6); quadOut(A, c(w + sx * hw, yh, D - 0.06), c(w, yb, D - 0.06), c(w, yb, 0.07), c(w + sx * hw, yh, 0.07), -sx * P.W[0], -1, -sx * P.W[1]); A.col(st, 0.9);
    }
    // (the mullion and the transom before the pane; the sill and its shade)
    A.col(st, 0.82).kind(KIND.PLAIN); box(w - 0.07, w + 0.07, 0.07, 0.36, ya, yb - 0.2, {}); box(w - hw, w + hw, 0.07, 0.3, lerp(ya, yh, 0.5) - 0.09, lerp(ya, yh, 0.5) + 0.09, { top: true });
    A.col(PAL.stoneWarm, 0.95).kind(KIND.PLAIN); box(w - hw - 0.2, w + hw + 0.2, 0, D + 0.32, ya - 0.34, ya, { top: true });
    A.col(st, 0.42).kind(KIND.PLAIN); quadOut(A, c(w - hw - 0.2, ya - 1.25, D - 0.04), c(w + hw + 0.2, ya - 1.25, D - 0.04), c(w + hw + 0.2, ya - 0.34, D - 0.04), c(w - hw - 0.2, ya - 0.34, D - 0.04), ox, 0, oz);
  }
}
// THE KEEP'S FRONT: the ledge that crosses it on corbels (the rooks' row sits on it), and the black ivy that comes down
// its end toward the gulf: a skin laid a hand's breadth off the wall, of the wall's own stone, its ivy thick in its
// middle and under the parapet and thinning to nothing at its edges (the stone shader gives the ivy its ragged edge)
export function keepDressInto(A, P, key = null) {
  const K = P.keep, Lg = K.ledge, st = toneOf(0.98), b0 = K.blocks[0];
  // ROUND 7: THE FRONT'S BAYS, each as the plan dealt it
  { const yq = M.QUAD_Y, tF = Lg.t, wall = toneOf(b0.tone), ox = P.T[0], oz = P.T[1], yawO = Math.atan2(oz, ox);
    const cF = (w, y, d) => { const p = P.fromWT(w, tF + d); return [p[0], y, p[1]]; };
    const bxF = (wa, wb, d0, d1, ya, yb, o) => { const p = P.fromWT((wa + wb) / 2, tF + (d0 + d1) / 2); boxInto(A, p[0], p[1], P.hA, (d1 - d0) / 2, (wb - wa) / 2, ya, yb, o); };
    for (const bay of K.bays || []) {
      const wm = (bay.a + bay.b) / 2;
      if (bay.use === 1) {
        // THE KEEP'S DOOR ON THE FIELD: eight worn steps of stone up to a landing 2.4 m over the flags; a dark pointed
        // doorway between pale jambs, a lintel course of dressed stone over its point
        const hd = Math.min(4.2, (bay.b - bay.a) / 2 - 0.3), yL = yq + 2.4;
        for (let j = 1; j <= 8; j++) { A.col(st, 0.86 + 0.03 * j).kind(KIND.MASON, 0, 0, 1); bxF(wm - hd, wm + hd, 0, 2.4 + (8 - j) * 0.55, j === 1 ? yq - 0.1 : yq + (j - 1) * 0.3, yq + j * 0.3, { top: true }); }
        A.col([0.012, 0.012, 0.016]).kind(KIND.PLAIN);
        quadOut(A, cF(wm - 1.3, yL, 0.07), cF(wm + 1.3, yL, 0.07), cF(wm + 1.3, yL + 3, 0.07), cF(wm - 1.3, yL + 3, 0.07), ox, 0, oz);
        triOut(A, cF(wm - 1.3, yL + 3, 0.07), cF(wm + 1.3, yL + 3, 0.07), cF(wm, yL + 4.7, 0.07), ox, 0, oz);
        A.col(PAL.stoneWarm, 1.0).kind(KIND.PLAIN);
        for (const sx of [-1, 1]) bxF(wm + sx * 1.62 - 0.32, wm + sx * 1.62 + 0.32, 0, 0.5, yL, yL + 3.1, { top: true });
        A.col(st, 1.1).kind(KIND.MASON, 0, 0, 1); bxF(wm - 2.5, wm + 2.5, 0, 0.45, yL + 4.9, yL + 5.5, { top: true });
        // (the lantern on its iron bracket beside the door: P.glows carries its light)
        A.col([0.07, 0.065, 0.06]).kind(KIND.PLAIN); bxF(wm + 2.67, wm + 2.73, 0, 0.8, yL + 3.4, yL + 3.48, { top: true }); bxF(wm + 2.67, wm + 2.73, 0.72, 0.78, yL + 3.2, yL + 3.4, {});
        A.col([1, 0.62, 0.24], 0.95).kind(KIND.GLOW); bxF(wm + 2.5, wm + 2.9, 0.55, 0.95, yL + 2.6, yL + 3.2, { top: true });
        continue;
      }
      if (bay.use === 3) {
        // IVY ROOTED AT THE FOOT: a skin a hand's breadth off the wall, thick at the flags and thinning as it climbs
        const nw = 8, ny = 6, top = yq + 15 + 9 * h1(wm * 0.37), tx = ox, tz = oz, flip = P.W[0] * P.T[1] - P.W[1] * P.T[0] < 0;
        const vert = (i, j) => {
          const fw = i / nw, fy = j / ny, p = P.fromWT(lerp(bay.a - 1.5, bay.b + 1.5, fw), tF + 0.14), y = lerp(yq, top, fy);
          const amt = 0.82 * Math.pow(Math.sin(Math.PI * fw), 0.5) * (1 - smoothstep(0.2, 1, fy)) * (0.72 + 0.28 * h1(i * 7.1 + j * 3.3 + wm));
          A.kind(KIND.MASON, 0, i === 0 || i === nw || j === ny ? 0 : amt, 1);
          A.v(p[0], y, p[1], tx, 0, tz, p[0] * tz - p[1] * tx, y);
        };
        A.col(wall);
        for (let i = 0; i < nw; i++) for (let j = 0; j < ny; j++) { const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i, j + 1]]; for (const k of flip ? [0, 2, 1, 3, 5, 4] : [0, 1, 2, 3, 4, 5]) vert(q[k][0], q[k][1]); }
        continue;
      }
      // A BLIND ARCADE along the bay's foot (whole arches alone: the stone's shader lays one every 3.5 m of the
      // wall's own measure), a string of dressed stone over it
      { const wa = Math.ceil(bay.a / 3.5) * 3.5, wb = Math.floor(bay.b / 3.5) * 3.5;
        if (wb - wa >= 3.4) {
          A.col(wall).kind(KIND.MASON, yq, 2, 1); quadOut(A, cF(wa, yq, 0.08), cF(wb, yq, 0.08), cF(wb, yq + 7.3, 0.08), cF(wa, yq + 7.3, 0.08), ox, 0, oz);
          A.col(st, 1.08).kind(KIND.MASON, 0, 0, 1); bxF(bay.a - 0.5, bay.b + 0.5, 0, 0.32, yq + 7.3, yq + 7.8, { top: true });
        } }
      if (bay.use === 2) {
        // A GARDEROBE TURRET high on the wall: a shaft of stone 2.5 m broad standing 1.7 m out on two corbels from over
        // the ledge to under the battlements, its head a weathering, a dark slit in its face; and its shadow on the wall
        const p = P.fromWT(wm, tF + 0.85), g = { x: p[0], z: p[1], yaw: yawO, hw: 0.85, hl: 1.25, y0: Lg.y + 3.2, y1: K.base - 0.3, fall: 1.5, out: 1, lim: [-12, 12] };
        A.col(st, 0.94).kind(KIND.MASON, 0, 0, 1); buttInto(A, g);
        A.col(st, 0.8); for (const sx of [-1, 1]) bxF(wm + sx * 0.8 - 0.25, wm + sx * 0.8 + 0.25, 0, 1.3, g.y0 - 1.4, g.y0, {});
        A.col([0.012, 0.012, 0.016]).kind(KIND.PLAIN); quadOut(A, cF(wm - 0.14, g.y0 + 3, 1.72), cF(wm + 0.14, g.y0 + 3, 1.72), cF(wm + 0.14, g.y0 + 4.5, 1.72), cF(wm - 0.14, g.y0 + 4.5, 1.72), ox, 0, oz);
        if (key) { A.col(wall); buttShade(A, g, key, [KIND.MASON, winOf(b0, P.density), 3, 1]); }
      }
    } }
  { const c = P.fromWT((Lg.w0 + Lg.w1) / 2, Lg.t + 0.75);
    A.col(st, 1.08).kind(KIND.MASON, 0, 0, 1); boxInto(A, c[0], c[1], P.hA, 0.75, (Lg.w1 - Lg.w0) / 2, Lg.y - 0.1, Lg.y + 0.5, { top: true });
    A.col(st, 0.8);
    for (let w = Lg.w0 + 2; w < Lg.w1; w += 4) { const p = P.fromWT(w, Lg.t + 0.45); boxInto(A, p[0], p[1], P.hA, 0.45, 0.35, Lg.y - 1.2, Lg.y - 0.1, {}); } }
  const I = K.ivy, nw = 10, ny = 7, tx = P.T[0], tz = P.T[1], t = K.ledge.t + 0.1;
  const vert = (i, j) => {
    const fw = i / nw, fy = j / ny, p = P.fromWT(lerp(I.w0, I.w1, fw), t), y = lerp(I.y0, I.y1, fy);
    const amt = 0.74 * Math.pow(Math.sin(Math.PI * fw), 0.6) * smoothstep(0, 0.45, fy) * (1 - 0.45 * smoothstep(0.8, 1, fy)) * (0.7 + 0.3 * h1(i * 7.1 + j * 3.3));
    A.kind(KIND.MASON, 0, i === 0 || i === nw || j === 0 ? 0 : amt, 1);
    A.v(p[0], y, p[1], tx, 0, tz, p[0] * tz - p[1] * tx, y);
  };
  A.col(toneOf(b0.tone));
  // (the winding by the frame's own hand: counter-clockwise seen from the field)
  const flip = P.W[0] * P.T[1] - P.W[1] * P.T[0] < 0;
  for (let i = 0; i < nw; i++) for (let j = 0; j < ny; j++) {
    const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i, j + 1]];
    for (const k of flip ? [0, 2, 1, 3, 5, 4] : [0, 1, 2, 3, 4, 5]) vert(q[k][0], q[k][1]);
  }
}
// the weed tree: a thin trunk out of a crack, a few boughs (into the stone), its leaves (into the cloth, to shake)
export function weedInto(A, CA, P, w = P.weed) {
  const sd = w.sd, x = w.x, z = w.z, y = w.y;
  A.col([0.2, 0.16, 0.12]).kind(KIND.PLAIN);
  const lean = [0.5 * (h1(sd) - 0.5), 0.5 * (h1(sd + 1) - 0.5)], top = [x + lean[0], y + w.h * 0.62, z + lean[1]];
  tubeInto(A, [[x, y - 0.2, z], [x + lean[0] * 0.4, y + w.h * 0.3, z + lean[1] * 0.4], top], [0.13, 0.1, 0.07], 6);
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * TAU + h1(sd + k) * 0.8, e = 0.5 + 0.7 * h1(sd + k * 3), len = w.h * (0.3 + 0.25 * h1(sd + k * 5)), f = 0.55 + 0.45 * h1(sd + k * 7);
    const from = [lerp(x, top[0], f), lerp(y, top[1], f), lerp(z, top[2], f)], tip = [from[0] + Math.sin(a) * Math.cos(e) * len, from[1] + Math.sin(e) * len, from[2] - Math.cos(a) * Math.cos(e) * len];
    tubeInto(A, [from, [lerp(from[0], tip[0], 0.5), lerp(from[1], tip[1], 0.5) + 0.1 * len, lerp(from[2], tip[2], 0.5)], tip], [0.05, 0.035, 0.015], 4);
    for (let j = 0; j < 9; j++) {
      const g = 0.3 + 0.7 * h1(sd + k * 11 + j), c = [lerp(from[0], tip[0], g), lerp(from[1], tip[1], g) + 0.08, lerp(from[2], tip[2], g)], b = h1(sd + k * 13 + j * 3) * TAU, sz = 0.22 + 0.16 * h1(sd + j + k), dx = Math.sin(b) * sz, dz = -Math.cos(b) * sz, tilt = (h1(sd + j * 5 + k) - 0.5) * sz;
      CA.c = mul3([0.2, 0.34, 0.1], 0.7 + 0.7 * h1(sd + j * 17 + k));
      CA.quad([c[0] - dx, c[1] - tilt, c[2] - dz], [c[0] - dz * 0.6, c[1] - sz * 0.5, c[2] + dx * 0.6], [c[0] + dx, c[1] + tilt, c[2] + dz], [c[0] + dz * 0.6, c[1] + sz * 0.5, c[2] - dx * 0.6], 0.4, 0.8, 1, 0.8, [0.09, 0.03, 0.07]);
    }
  }
}

// the rags of flag on their poles and the washing on its line (poles and rope into the stone, cloth into the cloth)
export function clothThingsInto(A, CA, P) {
  const wind = P.wind, side = [-wind[1], wind[0]];
  for (const f of P.flags) {
    const sd = f.x * 0.13 + f.z * 0.07, top = f.y + f.pole;
    A.col([0.16, 0.13, 0.11]).kind(KIND.PLAIN);
    tubeInto(A, [[f.x, f.y - 1, f.z], [f.x, f.y + f.pole * 0.5, f.z], [f.x + 0.05, top + 0.3, f.z]], [0.11, 0.09, 0.06], 5);
    // a rag: fixed to the pole, its far end torn; it stands out down the wind and sags
    const nu = 7, nv = 3;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const pt = (u, v) => { const len = f.len * (0.72 + 0.28 * h1(sd + Math.round(v * nv) * 3.1)), k = u * len; return [f.x + wind[0] * k + side[0] * 0.25 * Math.sin(u * 5 + v * 2), top - v * f.tall - 0.35 * u * u * len, f.z + wind[1] * k + side[1] * 0.25 * Math.sin(u * 5 + v * 2)]; };
      const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
      CA.c = mul3(PAL.flag, 0.75 + 0.5 * h1(sd + i * 7 + j));
      CA.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), u0, u1, u1, u0, [side[0] * 0.7, 0.22, side[1] * 0.7]);
    }
  }
  // the washing: a rope across the lane from wall to wall, sagging; sheets and shirts on it
  const w = P.wash, a = w.a, b = w.b, rope = [], at = (f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f) - 1.1 * Math.sin(Math.PI * f), lerp(a[2], b[2], f)];
  for (let i = 0; i <= 8; i++) rope.push(at(i / 8));
  A.col([0.5, 0.45, 0.36]).kind(KIND.PLAIN); tubeInto(A, rope, rope.map(() => 0.035), 4);
  const dl = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1;
  for (const t of w.things) {
    const fa = t.f - t.wide / dl / 2, fb = t.f + t.wide / dl / 2;
    CA.c = t.tint < 0.55 ? mul3([0.5, 0.49, 0.47], t.tone) : t.tint < 0.75 ? mul3([0.3, 0.34, 0.44], t.tone) : t.tint < 0.9 ? mul3([0.44, 0.21, 0.17], t.tone) : mul3([0.42, 0.37, 0.21], t.tone);
    CA.sheet(at(fa), at(fb), t.fall, 3, 3, [wind[0] * 0.45, 0.1, wind[1] * 0.45]);
  }
}
// the cats' wall: a parapet walk from an arch they pour out of to an arch they pour into
export function catWallInto(A, P) {
  const pts = P.cats.pts, hw = P.cats.wide / 2, stone = mul3(PAL.stone, 0.95);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], yaw = Math.atan2(b[0] - a[0], -(b[2] - a[2])), len = Math.hypot(b[0] - a[0], b[2] - a[2]), F = frameOf((a[0] + b[0]) / 2, (a[2] + b[2]) / 2, yaw), c = Math.cos(yaw), s = Math.sin(yaw), e = len / 2 + 0.6;
    A.col(stone).kind(KIND.MASON, 0, 0.2, 1);
    // the walk's sides down to the roofs, its top sloping with the cats' way
    quadOut(A, F(hw, 20, -e), F(hw, 20, e), F(hw, b[1], e), F(hw, a[1], -e), c, 0, s);
    quadOut(A, F(-hw, 20, -e), F(-hw, 20, e), F(-hw, b[1], e), F(-hw, a[1], -e), -c, 0, -s);
    A.col(PAL.flags, 0.95).kind(KIND.PLAIN); quadOut(A, F(-hw, a[1], -e), F(hw, a[1], -e), F(hw, b[1], e), F(-hw, b[1], e), 0, 1, 0);
  }
  // the two arches: a small gatehouse at either end, dark inside
  for (const [p, q] of [[pts[0], pts[1]], [pts[pts.length - 1], pts[pts.length - 2]]]) {
    const yaw = Math.atan2(q[0] - p[0], -(q[2] - p[2])), F = frameOf(p[0], p[2], yaw), g = F(0, 0, -2.2), s = Math.sin(yaw), c = Math.cos(yaw);
    // (low: its head 1.3 m over the walk)
    A.col(stone, 0.9).kind(KIND.MASON, 0, 0.3, 1); boxInto(A, g[0], g[2], yaw, hw + 0.2, 2.4, 20, p[1] + 1.3, { top: true });
    A.col([0.015, 0.015, 0.02]).kind(KIND.PLAIN); quadOut(A, F(-0.8, p[1], 0.23), F(0.8, p[1], 0.23), F(0.8, p[1] + 0.95, 0.23), F(-0.8, p[1] + 0.95, 0.23), s, 0, -c);
  }
}

// ---------------------------------------------------------------- the cats: a white tide along their wall (one draw; each
// cat's place in the stream, its bound and its turn of the head run in the vertex shader on the clock)
export function makeCats(P, U) {
  const base = [], part = [];
  const box = (x0, x1, y0, y1, z0, z1, k) => {
    const c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    for (const f of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2], [0, 1, 5, 4]]) { for (const i of [f[0], f[1], f[2], f[0], f[2], f[3]]) { base.push(...c[i]); part.push(k); } }
  };
  // (z forward; part: 0 body, 1 head, 2 tail, 3 fore legs, 4 hind legs)
  box(-0.075, 0.075, 0.14, 0.3, -0.24, 0.2, 0); box(-0.06, 0.06, 0.24, 0.37, 0.18, 0.32, 1); box(-0.02, 0.02, 0.26, 0.31, -0.5, -0.22, 2);
  box(-0.06, 0.06, 0, 0.15, 0.1, 0.16, 3); box(-0.06, 0.06, 0, 0.15, -0.2, -0.14, 4);
  // ears
  for (const s of [-1, 1]) { base.push(s * 0.055, 0.37, 0.22, s * 0.02, 0.37, 0.25, s * 0.04, 0.44, 0.23); part.push(1, 1, 1); }
  const list = P.cats.list, n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(base, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  const a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 2);
  list.forEach((c, i) => { a1.set([c.s, c.lat, c.pace, c.ph], i * 4); a2.set([c.size, c.grey], i * 2); });
  g.setAttribute('aCat', new THREE.InstancedBufferAttribute(a1, 4)); g.setAttribute('aCat2', new THREE.InstancedBufferAttribute(a2, 2));
  g.instanceCount = n;
  const NP = P.cats.pts.length, uniforms = { ...U, uPts: { value: P.cats.pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])) }, uCum: { value: P.cats.cum.slice() }, uLen: { value: P.cats.len }, uHalf: { value: P.cats.wide / 2 - 0.3 } };
  const mat = new THREE.ShaderMaterial({ uniforms,
    vertexShader: /* glsl */`
attribute float aPart; attribute vec4 aCat; attribute vec2 aCat2;
uniform float uTime, uLen, uHalf; uniform vec3 uPts[${NP}]; uniform float uCum[${NP}];
varying vec3 vW; varying vec3 vCol;
void main(){
  // its place in the stream: the whole tide moves at one pace (3.3 m/s), each cat a little faster or slower for a while
  float s = mod(aCat.x*uLen+uTime*3.3+sin(uTime*.31+aCat.w*40.)*1.6*aCat.z, uLen);
  vec3 a = uPts[0], b = uPts[1]; float c0 = 0., c1 = uCum[1];
  for (int i = 1; i < ${NP - 1}; i++) { if (s > uCum[i]) { a = uPts[i]; b = uPts[i+1]; c0 = uCum[i]; c1 = uCum[i+1]; } }
  vec3 fwd = normalize(b-a), rt = normalize(cross(fwd, vec3(0., 1., 0.))), up = cross(rt, fwd);
  vec3 pos = mix(a, b, clamp((s-c0)/max(c1-c0, 1e-3), 0., 1.))+rt*(aCat.y*uHalf+.25*sin(uTime*.7+aCat.w*90.));
  // the bound: both ends rise and fall in turn, the back arches, the tail streams
  float ph = uTime*8.5*aCat.z+aCat.w*6.2832, hop = max(sin(ph), 0.), size = aCat2.x;
  vec3 lp = position;
  float fore = step(.05, lp.z);
  lp.y += hop*.11+(fore*2.-1.)*sin(ph+.5)*.04;
  if (aPart > 2.5) { float sw = (aPart < 3.5 ? 1. : -1.)*sin(ph)*.13; lp.z += sw*(1.-lp.y/.15); }
  if (aPart > 1.5 && aPart < 2.5) lp.y += (-lp.z-.22)*(.5+.3*sin(ph*.5+aCat.w*9.));
  float show = smoothstep(0., 2.2, s)*(1.-smoothstep(uLen-2.2, uLen, s));
  vec3 wp = pos+(rt*lp.x+up*lp.y+fwd*lp.z)*size*1.25*show;
  vW = wp;
  float g = step(aCat2.y, .07);
  vCol = mix(vec3(.68, .67, .64), vec3(.34, .34, .36), g)*(aPart > 2.5 ? .85 : 1.);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`,
    fragmentShader: /* glsl */`
varying vec3 vW; varying vec3 vCol;
${GLSL_COMMON}
${GLSL_LIGHT}
void main(){
  vec3 N = cross(dFdx(vW), dFdy(vW)), V = normalize(cameraPosition-vW); N /= max(length(N), 1e-12);
  if (dot(N, V) < 0.) N = -N;
  // (in a great shadow the mass that throws it hides half the sky too)
  float sh = shadowAt(vW+vec3(0., .5, 0.));
  vec3 amb = mix(uGndCol, uSkyCol, N.y*.5+.5)*mix(.62, 1.25, sh);
  vec3 col = vCol*(uSunCol*max(dot(N, uSunDir), 0.)*sh+amb);
  gl_FragColor = vec4(fogged(col, vW), 1.);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'cats';
  return { mesh, uniforms, count: n, triangles: n * (base.length / 9) };
}

// ---------------------------------------------------------------- smoke: every plume a string of puffs that rise, widen and
// bend down the wind (one draw; the puffs' ages run on the clock, each plume from its own phase)
export function makeSmoke(plumes, U, wind, puffs = 9) {
  const n = plumes.length * puffs, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  const a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 4);
  plumes.forEach((p, i) => { for (let k = 0; k < puffs; k++) { a1.set([p.x, p.y, p.z, p.ph + k / puffs], (i * puffs + k) * 4); a2.set([p.rise, p.drift, p.r0, p.r1], (i * puffs + k) * 4); } });
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(a1, 4)); g.setAttribute('aGo', new THREE.InstancedBufferAttribute(a2, 4));
  g.instanceCount = n;
  const uniforms = { ...U, uWind: { value: new THREE.Vector2(wind[0], wind[1]) } };
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
attribute vec4 aBase; attribute vec4 aGo; uniform float uTime; uniform vec2 uWind;
varying vec2 vP; varying vec3 vW; varying float vAge; varying float vSeed; varying float vTall;
void main(){
  // a puff lives 8 to 11 s (longer for the tall plumes): it climbs fast, then slows and goes with the wind
  float life = 8.+aGo.x*.12, age = fract(uTime/life+aBase.w);
  vec3 c = aBase.xyz+vec3(0., aGo.x*(1.-(1.-age)*(1.-age)), 0.)+vec3(uWind.x, 0., uWind.y)*aGo.y*age*age;
  c.xz += vec2(sin(age*7.+aBase.w*30.), cos(age*6.+aBase.w*50.))*.25*aGo.w*age;
  float r = mix(aGo.z*.8, aGo.w*.85, pow(age, .75));
  vec4 mv = viewMatrix*vec4(c, 1.); mv.xy += position.xy*r;
  vP = position.xy; vW = c; vAge = age; vSeed = aBase.w; vTall = smoothstep(20., 30., aGo.x);
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
varying vec2 vP; varying vec3 vW; varying float vAge; varying float vSeed; varying float vTall;
${GLSL_COMMON}
${GLSL_LIGHT}
void main(){
  float d = length(vP), n = vn(vP*2.3+vSeed*37.+vAge*1.5)*.6+vn(vP*5.1-vSeed*11.)*.4;
  // (a column that thins as it climbs and goes with the wind: thick at the pot, a breath at its end; soft at its edges)
  float body = 1.-smoothstep(0., 1., d+(n-.5)*.55), fade = 1.-vAge;
  // (the great stacks' smoke, which climbs 20 m and more, is the thicker)
  float a = body*body*smoothstep(0., .05, vAge)*fade*sqrt(fade)*(.4+.34*vTall);
  if (a < .004) discard;
  // lit from the sun's side: the puff's edge toward the sun is warm, its heart the sky's shade
  vec3 V = normalize(cameraPosition-vW);
  vec3 sv = (viewMatrix*vec4(uSunDir, 0.)).xyz;
  float side = clamp(dot(vP, sv.xy)*.6+.5, 0., 1.), thru = pow(max(dot(-V, uSunDir), 0.), 4.);
  vec3 col = mix(uSkyCol*.42+uGndCol*.25, uSunCol*.22, side*(.5+.5*n))+uSunCol*.14*thru*(1.-d*.6);
  gl_FragColor = vec4(fogged(col, vW), a);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'smoke'; mesh.renderOrder = 3;
  return { mesh, uniforms, count: n, triangles: n * 2 };
}
