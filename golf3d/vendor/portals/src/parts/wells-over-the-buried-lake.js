// The Wells Over the Buried Lake: the hero set piece and the makers of the city's lifting machines.
//
// THE HERO (buildHero) is the lake under the rock: a roof of living rock with a shape (a round chamber under the
// great well with a ring of piers at its rim, a nave between two wandering rows of great piers with natural bridges
// of rock across it, a round side cave off the nave where the world's plan has one, aisles of lesser piers, a dome
// over the landing, the shore's wall), needles hanging from it,
// dark clear water with a beach of pale stone round it, and through the roof the mouths of the city's wells, each
// a throat with thickness and the round of sky in it, letting down a soft shaft of daylight, a rope and a bucket to
// a pool of lit water. The rock and the shafts are drawn again upside down under the water's level: the still water's
// mirror. The lake's shore is one closed curve (makeLake); the world file draws the city's green edge with the same
// curve (the two outlines are one list).
//
// THE MAKERS build the things that stand above: well head, windmill with cloth sails, water wheel with scoops in its
// channel, pump beam, drill trestle, tank on legs, the aqueduct's solid arcade (bay and pier), weathercock, house, dome
// on its drum, awning, stair, washing, the pot chain of the great well; and the gardens' and yards' own things: a
// mounded vegetable bed, a fruit tree, a vine trellis, a tiled pool, a garden wall, jars, a dovecote, a market stall,
// a small well (kerb, post, pulley arm, rope and pail), a walker and a laden donkey for the road. Each returns its
// standing part and its moving parts as separate geometries; a moving part is drawn with liftMaterial at a MODE:
//   1 spin about the instance's own z axis      angle = phase + speed * clock * (wind share)
//   2 rock about the instance's own z axis      angle = amp * sin(phase + speed * clock)
//   3 spin about the instance's own y axis      angle = phase + speed * clock
//   4 vane about the instance's own y axis      angle = the wind's bearing (one for the whole city) + a small own swing
//   5 bucket on its rope                        down and up one line: with u = fract(clock / period + phase), drop = travel * (smoothstep(.16, .42, u) - smoothstep(.6, .86, u))
//                                               (by this law it rests at the well head 30% of its period and at the water 18%; the thread of water it sheds as it
//                                                rises is part of it)
//   6 the bucket's rope                         one prism from the pulley to the bucket, the same law; its thickness is its own
//   7 a rope of fixed length                    (6 and 7: where the rope's breadth would be under one picture element it is drawn one element
//                                                broad and paid back in strength: the one thing here sized by the eye, said in LIFT_VERT)
//   8 a pot on an endless chain                 a stadium loop of two straight strands and two half turns, s = mod(s0 + speed * clock, loop)
//                                               (its water is folded away from the top wheel's crown to the foot: up full, down empty; a full
//                                                pot spills a thread of water as it rises, its length by the pot's own place on the loop)
//   9 a walker on its road                      out and back along the instance's own z: z = -half * cos(pi * q), q = 2 * fract(clock * turns + phase); it turns about where it slows
// Every mover runs on the world's clock from a phase dealt to it; none reads the route, the eye or the metres flown
// (the rope's one-element floor above is a breadth, not a motion).
// POLISH ROUND 1: the hall's light (CAVE_FRAG, WATER_FRAG, BEAM_FRAG: dark rock with form, black-green water, soft
// beams of their wells' own breadth, each as strong as its well's mouth is broad (beamK), the moorings' lanterns by the lake's table's
// fourth channel, by the hour's standing state), old timber and coursed stone (MAT.timber,
// timberMat, mat 9 and 10 in LIFT_FRAG), the cut's face (cutFaces in buildHero), the rope's floor and the pots' spill.
// MOVE_LAW (exported) is the bucket's and the pot's arithmetic again in JS, for counting them against the route.
import * as THREE from 'three';

const TAU = Math.PI * 2, clampJ = (v, a, b) => Math.min(b, Math.max(a, v));
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// the palette (linear), from the design
export const COL = {
  plain: lin('#d9b77a'), rock: lin('#b98a4e'), garden: lin('#3f8f4a'), palm: lin('#7fbf5a'),
  white: lin('#f3ead8'), ochre: lin('#c98c4a'), timber: lin('#8a5a34'), timberDark: lin('#5e3b21'), cloth: lin('#cdb89a'),
  water: lin('#7fd6e8'), lake: lin('#0f2a2e'), shallows: lin('#1f5a5a'), lime: lin('#e9e2cf'), day: lin('#fff6d8'),
  red: lin('#d9483a'), stone: lin('#b9ad98'), stoneDark: lin('#7d7466'), clay: lin('#b5633a'), iron: lin('#3a3632'), rope: lin('#a58a5c'),
};
// material ids carried in the fourth colour channel
export const MAT = { solid: 0, cloth: 1, water: 2, glow: 3, wall: 4, daylit: 5, shaft: 6, rock: 7, wet: 8, stone: 9, fine: 10, timber: 11 };
// OLD TIMBER (MAT.timber) knows which way its baulk lies: the material's number carries, in its fraction, the baulk's
// bearing (16 steps of the half turn) and its rise (nine steps from plumb down to plumb up): timberMat(a, b) for a
// baulk from a to b; the shader lays the grain, the checks and the iron straps along it
export const timberMat = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; let be = Math.atan2(dz, dx), el = Math.atan2(dy, Math.hypot(dx, dz)); if (be < 0) { be += Math.PI; el = -el; } if (be >= Math.PI) { be -= Math.PI; el = -el; }
  const bi = Math.min(15, Math.floor(be / Math.PI * 16)), ei = Math.min(8, Math.max(0, Math.round((el / Math.PI + 0.5) * 8))); return 11 + ((bi * 16 + ei + 0.5) / 256 - 0.5) * 0.8; };

// ------------------------------------------------------------------ a small geometry builder (position, normal, colour + material id)
export class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; }
  get triangles() { return this.p.length / 9; }
  vert(x, y, z, nx, ny, nz, c, m) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(c[0], c[1], c[2], m); }
  tri(a, b, c, col, m = 0) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    this.vert(a[0], a[1], a[2], nx, ny, nz, col, m); this.vert(b[0], b[1], b[2], nx, ny, nz, col, m); this.vert(c[0], c[1], c[2], nx, ny, nz, col, m);
  }
  quad(a, b, c, d, col, m = 0) { this.tri(a, b, c, col, m); this.tri(a, c, d, col, m); }
  // a box about (cx, cy, cz) of full sizes (sx, sy, sz), turned by yaw about y; faces: which of the six to draw
  box(cx, cy, cz, sx, sy, sz, col, m = 0, yaw = 0, bottom = true, top = true) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, cs = Math.cos(yaw), sn = Math.sin(yaw);
    const P = (x, y, z) => [cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs];
    const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), P(-hx, hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), P(-hx, hy, hz)];
    this.quad(v[3], v[2], v[6], v[7], col, m); this.quad(v[1], v[0], v[4], v[5], col, m);
    this.quad(v[2], v[1], v[5], v[6], col, m); this.quad(v[0], v[3], v[7], v[4], col, m);
    if (top) this.quad(v[7], v[6], v[5], v[4], col, m);
    if (bottom) this.quad(v[0], v[1], v[2], v[3], col, m);
  }
  // a prism of n sides and half width r from a to b (r1: half width at b), smooth shaded, open ended unless cap is
  // asked: then its end at b is closed by a flat face (a pile's head, an arm's end)
  beam(a, b, r, col, m = 0, n = 4, r1 = r, cap = false) {
    const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], l = Math.hypot(ax, ay, az) || 1, dx = ax / l, dy = ay / l, dz = az / l;
    let ux = -dz, uy = 0, uz = dx; if (Math.abs(dy) > 0.99) { ux = 1; uz = 0; }
    const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
    const ring = (k) => { const t = (k + 0.5) / n * TAU, c = Math.cos(t), s = Math.sin(t); return [ux * c + vx * s, uy * c + vy * s, uz * c + vz * s]; };
    for (let k = 0; k < n; k++) {
      const e0 = ring(k), e1 = ring(k + 1), q = (e, p, rr) => [p[0] + e[0] * rr, p[1] + e[1] * rr, p[2] + e[2] * rr];
      const A = q(e0, a, r), B = q(e1, a, r), C = q(e1, b, r1), D = q(e0, b, r1);
      if (cap) this.tri(b, D, C, col, m);
      if (n <= 4) { this.quad(A, B, C, D, col, m); continue; }
      for (const [P, e] of [[A, e0], [B, e1], [C, e1], [A, e0], [C, e1], [D, e0]]) this.vert(P[0], P[1], P[2], e[0], e[1], e[2], col, m);
    }
  }
  // a flat ribbon of half width w from a to b, lying in the upright plane through it (an upright one: in the plane
  // of x): two triangles, seen from both sides (the lift's material draws both)
  strip(a, b, w, col, m = 0) {
    const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], l = Math.hypot(ax, ay, az) || 1, hl = Math.hypot(ax, az);
    let vx = -ax * ay, vy = hl * hl, vz = -az * ay; if (hl < 1e-4 * l) { vx = 1; vy = 0; vz = 0; }
    const vl = Math.hypot(vx, vy, vz) || 1; vx *= w / vl; vy *= w / vl; vz *= w / vl;
    this.quad([a[0] - vx, a[1] - vy, a[2] - vz], [a[0] + vx, a[1] + vy, a[2] + vz], [b[0] + vx, b[1] + vy, b[2] + vz], [b[0] - vx, b[1] - vy, b[2] - vz], col, m);
  }
  // an upright frustum from y0 (radius r0) to y1 (radius r1), n sides, smooth; inside: faces turned inward
  cyl(cx, y0, y1, cz, r0, r1, n, col, m = 0, inside = false, col1 = col) {
    const sl = (r0 - r1) / Math.max(y1 - y0, 1e-6), nl = Math.hypot(1, sl), sg = inside ? -1 : 1;
    for (let k = 0; k < n; k++) {
      const t0 = k / n * TAU, t1 = (k + 1) / n * TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      const A = [cx + c0 * r0, y0, cz + s0 * r0], B = [cx + c1 * r0, y0, cz + s1 * r0], C = [cx + c1 * r1, y1, cz + s1 * r1], D = [cx + c0 * r1, y1, cz + s0 * r1];
      const order = inside ? [[A, c0, s0, col], [C, c1, s1, col1], [B, c1, s1, col], [A, c0, s0, col], [D, c0, s0, col1], [C, c1, s1, col1]] : [[A, c0, s0, col], [B, c1, s1, col], [C, c1, s1, col1], [A, c0, s0, col], [C, c1, s1, col1], [D, c0, s0, col1]];
      for (const [P, c, s, cc] of order) this.vert(P[0], P[1], P[2], sg * c / nl, sg * sl / nl, sg * s / nl, cc, m);
    }
  }
  // a flat disc (or ring from r0 to r1) at height y, facing up (or down)
  disc(cx, y, cz, r1, n, col, m = 0, up = true, r0 = 0) {
    for (let k = 0; k < n; k++) {
      const t0 = k / n * TAU, t1 = (k + 1) / n * TAU, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      const A = [cx + c0 * r1, y, cz + s0 * r1], B = [cx + c1 * r1, y, cz + s1 * r1];
      if (r0 <= 0) { if (up) this.tri([cx, y, cz], B, A, col, m); else this.tri([cx, y, cz], A, B, col, m); continue; }
      const C = [cx + c1 * r0, y, cz + s1 * r0], D = [cx + c0 * r0, y, cz + s0 * r0];
      if (up) this.quad(B, A, D, C, col, m); else this.quad(A, B, C, D, col, m);
    }
  }
  // a wheel rim in the xy plane about the origin: n straight pieces of half width w at radius r, at depth z
  rim(r, n, w, z, col, m = 0, depth = w) {
    for (let k = 0; k < n; k++) { const t0 = k / n * TAU, t1 = (k + 1) / n * TAU; this.beamZ([Math.cos(t0) * r, Math.sin(t0) * r, z], [Math.cos(t1) * r, Math.sin(t1) * r, z], w, depth, col, m); }
  }
  // a flat bar from a to b lying in a plane of constant z: half width w in that plane, half depth d along z
  beamZ(a, b, w, d, col, m = 0) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, px = -dy / l * w, py = dx / l * w;
    const v = [[a[0] + px, a[1] + py], [b[0] + px, b[1] + py], [b[0] - px, b[1] - py], [a[0] - px, a[1] - py]];
    const F = (i, z) => [v[i][0], v[i][1], z];
    this.quad(F(0, a[2] + d), F(3, a[2] + d), F(2, b[2] + d), F(1, b[2] + d), col, m); this.quad(F(0, a[2] - d), F(1, b[2] - d), F(2, b[2] - d), F(3, a[2] - d), col, m);
    this.quad(F(0, a[2] - d), F(0, a[2] + d), F(1, b[2] + d), F(1, b[2] - d), col, m); this.quad(F(3, a[2] + d), F(3, a[2] - d), F(2, b[2] - d), F(2, b[2] + d), col, m);
  }
  // another builder's triangles, moved by a Matrix4
  add(g, mat) {
    const e = mat ? mat.elements : null;
    for (let i = 0; i < g.p.length; i += 3) {
      const x = g.p[i], y = g.p[i + 1], z = g.p[i + 2], nx = g.n[i], ny = g.n[i + 1], nz = g.n[i + 2];
      if (!e) { this.p.push(x, y, z); this.n.push(nx, ny, nz); continue; }
      this.p.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
      const mx = e[0] * nx + e[4] * ny + e[8] * nz, my = e[1] * nx + e[5] * ny + e[9] * nz, mz = e[2] * nx + e[6] * ny + e[10] * nz, l = Math.hypot(mx, my, mz) || 1;
      this.n.push(mx / l, my / l, mz / l);
    }
    for (let i = 0; i < g.c.length; i++) this.c.push(g.c[i]);
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 4));
    g.userData.triangles = this.triangles;
    return g;
  }
}

// ------------------------------------------------------------------ the lake's shore: one closed curve, the city's green edge above
// In the plane scaled by the half axes (ax across, az along), the shore is the unit circle swollen by four harmonics.
// rho(x, z) < 1 is inside; dist(x, z) is metres outside (+) or inside (-) to first order; edgeAt(th) a point of it.
export function makeLake(rng) {
  const ax = rng.range(125, 140), az = rng.range(244, 268), harm = [];
  for (const k of [2, 3, 4, 5]) harm.push([k, rng.range(0.02, 0.065) * (k === 2 ? 1 : 0.8), rng.range(0, TAU)]);
  // (the four harmonics written out, in their own order: the same sums to the last bit, with no loop to walk)
  const [[k0, a0, p0], [k1, a1, p1], [k2, a2, p2], [k3, a3, p3]] = harm;
  const swell = (th) => 1 + a0 * Math.cos(k0 * th + p0) + a1 * Math.cos(k1 * th + p1) + a2 * Math.cos(k2 * th + p2) + a3 * Math.cos(k3 * th + p3);
  const rho = (x, z) => Math.hypot(x / ax, z / az) / swell(Math.atan2(z / az, x / ax));
  const dist = (x, z) => { const r0 = rho(x, z), gx = (rho(x + 1, z) - rho(x - 1, z)) / 2, gz = (rho(x, z + 1) - rho(x, z - 1)) / 2; return (r0 - 1) / Math.max(Math.hypot(gx, gz), 1e-5); };
  // inside(x, z, m): is the place m metres or more inside the shore? The same answer as -dist(x, z) >= m, asked the
  // short way where it can be: the curve's measure cannot grow faster than `lip` a metre anywhere (1 / s * sqrt(1 +
  // (s' / s)^2) over the lesser half axis, the swell s at its least and its slope s' at its most), so the measured
  // distance, a quotient of two differences each no steeper than that, is never under (1 - rho) / (lip * sqrt 2).
  const sMin = 1 - (Math.abs(a0) + Math.abs(a1) + Math.abs(a2) + Math.abs(a3)), dsMax = k0 * Math.abs(a0) + k1 * Math.abs(a1) + k2 * Math.abs(a2) + k3 * Math.abs(a3);
  const lip = Math.SQRT2 * 1.001 / sMin * Math.hypot(1, dsMax / sMin) / Math.min(ax, az);
  const inside = (x, z, m) => { const r0 = rho(x, z); if (r0 >= 1 && m > 0) return false; if (1 - r0 >= m * lip) return true; return -dist(x, z) >= m; };
  const edgeAt = (th) => { const s = swell(th); return [ax * s * Math.cos(th), az * s * Math.sin(th)]; };
  let x0 = 0, x1 = 0, z0 = 0, z1 = 0;
  for (let i = 0; i < 360; i++) { const e = edgeAt(i / 360 * TAU); x0 = Math.min(x0, e[0]); x1 = Math.max(x1, e[0]); z0 = Math.min(z0, e[1]); z1 = Math.max(z1, e[1]); }
  const uniforms = { uLakeA: { value: new THREE.Vector2(ax, az) }, uLakeH: { value: harm.map((h) => new THREE.Vector3(h[0], h[1], h[2])) } };
  return { ax, az, harm, swell, rho, dist, inside, lip, edgeAt, bounds: [x0, z0, x1, z1], uniforms };
}
export const LAKE_GLSL = /* glsl */`
uniform vec2 uLakeA; uniform vec3 uLakeH[4];
float lakeRho(vec2 xz){ vec2 q = xz / uLakeA; float l = length(q); float th = l > 1e-5 ? atan(q.y, q.x) : 0.; float s = 1.;
  for (int i = 0; i < 4; i++) s += uLakeH[i].y * cos(uLakeH[i].x * th + uLakeH[i].z); return l / s; }
`;

// ------------------------------------------------------------------ light and haze shared by everything this world draws itself
// Two lights and two hazes, each BY PLACE (the height of the lit point, never the eye's place): above the rock the
// sun and the sky; under it the daylight let down the shafts and the cavern's own blue distance.
export function makeShared() {
  const v3 = (x, y, z) => ({ value: new THREE.Vector3(x, y, z) });
  return { uT: { value: 0 }, uWind: { value: 1 }, uVane: { value: 0 }, uLamp: { value: 0 }, uPx: { value: 450 },
    uSun: v3(0.4, 0.8, 0.4), uSunCol: v3(1.2, 1.1, 0.95), uSkyCol: v3(0.3, 0.4, 0.55), uGroundCol: v3(0.3, 0.24, 0.16),
    uFogCol: v3(0.8, 0.75, 0.65), uFogDen: { value: 0.0008 }, uCaveFog: v3(0.03, 0.09, 0.13), uCaveDen: { value: 0.0042 },
    uCaveAmb: v3(0.1, 0.14, 0.15), uCaveKey: v3(0.9, 0.86, 0.72), uWaterCol: v3(0.2, 0.66, 0.8),
    // the two great shafts (x, z, radius, the water's level under them) and the colour of the light the lit water throws up them
    uShaft: { value: [new THREE.Vector4(0, 0, 15, -46), new THREE.Vector4(0, 0, 9, -46)] }, uPoolCol: v3(0.3, 0.36, 0.14),
    // the bearing (a unit vector in plan, from the great well's axis) at which water runs down its wall
    uRun: v3(1, 0, 0),
    // the quay's three lamps (x, y, z, strength) and their colour
    uQLamp: { value: [new THREE.Vector4(0, -900, 0, 0), new THREE.Vector4(0, -900, 0, 0), new THREE.Vector4(0, -900, 0, 0)] }, uQLampCol: v3(1.5, 0.82, 0.3),
    // the ring on the quay (its middle: x, y, z; its light's strength) and the colour of its light
    uRingL: { value: new THREE.Vector4(0, -900, 0, 0) }, uRingCol: v3(1, 0.9, 0.66),
    // the lake's own light by place (the hero bakes it: see buildHero) and the box it lies in
    tLake: { value: null }, uLakeBox: { value: new THREE.Vector4(0, 0, 1, 1) } };
}
const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
const GLSL_PLACE = /* glsl */`
uniform vec3 uSun, uSunCol, uSkyCol, uGroundCol, uFogCol, uCaveFog, uCaveAmb, uCaveKey; uniform float uFogDen, uCaveDen;
float dayAt(float y){ return smoothstep(-22., -3., y); }
vec3 placeFog(vec3 col, vec3 w){ float day = dayAt(w.y), d = distance(cameraPosition, w), den = mix(uCaveDen, uFogDen, day);
  return mix(col, mix(uCaveFog, uFogCol, day), 1. - exp(-den * den * d * d)); }
`;
// the lamps under the rock (the quay's three: warm points, by place): the light one gives a lit point p with normal n;
// and THE RING'S OWN LIGHT (the hall's far light): what stands about the ring takes its light by its own distance
// from the ring's middle (a half at 16 m, a seventh at 40 m), more on a face turned to it: the landing's stone and
// boards, the piers and the roof about it
const GLSL_QLAMP = /* glsl */`
uniform vec4 uQLamp[3], uRingL; uniform vec3 uQLampCol, uRingCol;
vec3 qLamp(vec3 p, vec3 n){ vec3 s = vec3(0.);
  for (int i = 0; i < 3; i++) { vec3 lv = uQLamp[i].xyz - p; float d2 = dot(lv, lv); s += uQLampCol * uQLamp[i].w * (.4 + .6 * max(dot(n, lv) * inversesqrt(max(d2, 1e-4)), 0.)) / (1. + d2 / 10.); }
  { vec3 lv = uRingL.xyz - p; float d2 = dot(lv, lv); s += uRingCol * uRingL.w * (.35 + .65 * max(dot(n, lv) * inversesqrt(max(d2, 1e-4)), 0.)) / (1. + d2 / 260.); }
  return s; }
`;
export { GLSL_NOISE, GLSL_PLACE, GLSL_QLAMP };

const LIFT_VERT = /* glsl */`
attribute vec4 aCol;
#ifdef USE_INSTANCING
attribute vec4 aMove;
#endif
uniform float uT, uWind, uVane, uPx;
varying vec3 vCol; varying float vMat; varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN; varying float vSeed; varying float vA;
mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
void main(){
  vec3 p = position, n = normal;
  #ifdef USE_INSTANCING
  mat4 im = instanceMatrix; vec4 mv = aMove;
  #else
  mat4 im = mat4(1.); vec4 mv = vec4(0.);
  #endif
  #if MODE == 1
  float a = mv.y + mv.x * uT * mix(1., uWind, mv.z); p.xy = rot2(a) * p.xy; n.xy = rot2(a) * n.xy;
  #elif MODE == 2
  float a = mv.z * sin(mv.y + mv.x * uT); p.xy = rot2(a) * p.xy; n.xy = rot2(a) * n.xy;
  #elif MODE == 3
  float a = mv.y + mv.x * uT; p.xz = rot2(a) * p.xz; n.xz = rot2(a) * n.xz;
  #elif MODE == 4
  float a = uVane + mv.z * sin(mv.y + mv.x * uT); p.xz = rot2(a) * p.xz; n.xz = rot2(a) * n.xz;
  #elif MODE == 5
  float u = fract(uT / mv.x + mv.y), s = smoothstep(.16, .42, u) - smoothstep(.6, .86, u);
  if (aCol.a > 1.5 && aCol.a < 2.5) {
    // the thread of water a rising bucket sheds: no longer than the bucket's height over the water, none going down
    float S = length(im[1].xyz); bool up = u > .6 && u < .9;
    p.y = -.62 - (up ? min(-(p.y + .62), max(mv.z * (1. - s) - .25, 0.) / S) : 0.); if (!up) p.xz = vec2(0.);
  }
  float a = mv.w * (1. - smoothstep(0., .012, s)); p.xy = rot2(a) * p.xy; n.xy = rot2(a) * n.xy; p.y -= mv.z * s / length(im[1].xyz);
  #elif MODE == 6
  float u = fract(uT / mv.x + mv.y), s = smoothstep(.16, .42, u) - smoothstep(.6, .86, u); p.y *= mv.z * s + mv.w;
  #elif MODE == 7
  p.y *= mv.z;
  #elif MODE == 8
  float H = mv.z, r = mv.w, loop = 2. * H + 6.2831853 * r, s = mod(mv.y + mv.x * uT, loop), a = 0.; vec2 c = vec2(-r, -H + s);
  // a pot comes up full and goes down empty: its water is folded away from the top wheel's crown to the foot
  if (aCol.a > 1.5 && aCol.a < 2.5 && s > H + 1.5707963 * r) p = vec3(0.);
  // (the thread it spills: from its lip down, by the pot's own length, while it rises clear of the water and under the top wheel)
  if (aCol.a > 1.5 && aCol.a < 2.5 && position.y < .19) { if (s < 1.5 || s > H - .5) p = vec3(0.); else p.y = .18 - min(.18 - p.y, min(s - 1.1, 1.1 + 1.3 * fract(mv.y * .731))); }
  if (s >= H && s < H + 3.14159265 * r) { float th = (s - H) / r; c = vec2(-r * cos(th), r * sin(th)); a = -th; }
  else if (s >= H + 3.14159265 * r && s < 2. * H + 3.14159265 * r) { c = vec2(r, -(s - H - 3.14159265 * r)); a = -3.14159265; }
  else if (s >= 2. * H + 3.14159265 * r) { float th = (s - 2. * H - 3.14159265 * r) / r; c = vec2(r * cos(th), -H - r * sin(th)); a = -3.14159265 - th; }
  p.xy = rot2(a) * p.xy + c; n.xy = rot2(a) * n.xy;
  #elif MODE == 9
  // a walker on its road (its instance's z): out and back on the world's clock (mv.x turns of the road a second from
  // the phase mv.y; mv.z the road's half length), slowing to turn about at either end; a small bob in its step (mv.w)
  float q = fract(uT * mv.x + mv.y) * 2., c9 = clamp(sin(3.14159265 * q) * 14., -1., 1.), a = (1. - c9) * 1.5707963;
  p.xz = rot2(a) * p.xz; n.xz = rot2(a) * n.xz; p.y += abs(sin(uT * 3.3 + mv.y * 40.)) * mv.w * abs(c9); p.z -= mv.z * cos(3.14159265 * q);
  #endif
  // A ROPE IS SEEN (the bucket's rope and a chain's strand): where its breadth (0.09 m) would be under ONE PICTURE
  // ELEMENT at its distance it is drawn one element broad and PAID BACK IN STRENGTH (vA: its true breadth over its
  // drawn one, the share of itself it is drawn with; laid ONCE, from one side: liftMaterial): the allowed floor for
  // a thin thing, and the one thing in this shader's vertices that reads the eye (uPx: the picture's height in
  // elements, set each frame; the fragments' pxg below is the other reader of the picture's grain)
  #if MODE == 6 || MODE == 7
  { vec4 axc = projectionMatrix * viewMatrix * modelMatrix * im * vec4(0., p.y, 0., 1.);
    float broad = max(1., max(axc.w, .3) / (projectionMatrix[1][1] * max(uPx, 1.)) / .045); p.xz *= broad; vA = 1. / broad; }
  #else
  vA = 1.;
  #endif
  vec3 sc = vec3(length(im[0].xyz), length(im[1].xyz), length(im[2].xyz));
  vL = position * sc; vLN = normal; vSeed = fract(dot(im[3].xz, vec2(.1371, .7313)));
  vec4 w = modelMatrix * im * vec4(p, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(im) * (n / max(sc * sc, vec3(1e-6))));
  vCol = aCol.rgb; vMat = aCol.a;
  #ifdef USE_INSTANCING_COLOR
  vCol *= instanceColor;
  #endif
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const LIFT_FRAG = /* glsl */`
uniform float uT, uLamp; uniform vec3 uWaterCol, uPoolCol, uRun; uniform vec4 uShaft[2], uLakeBox; uniform sampler2D tLake;
varying vec3 vCol; varying float vMat; varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN; varying float vSeed; varying float vA;
${GLSL_NOISE}
${GLSL_PLACE}
${GLSL_QLAMP}
void main(){
  vec3 n = normalize(vN); if (dot(n, cameraPosition - vW) < 0.) n = -n;
  vec3 alb = vCol; float mat = floor(vMat + .5);
  // (pxg: the picture's own grain at the lit point: the metres of the rock one picture element spans there, the
  //  larger of its two spans, across the picture and down it, each by itself: it does not turn with the frame. IT
  //  READS THE EYE, and these ask it, each in its own way: THE JOINTS OF DRESSED STONE (mat 9, the piers' and the
  //  gate's; mat 10, the fine stone at the great well's mouth) do not fade to a mean: they are a plain dark line
  //  read from near (0.38 of the tone at 6 cm an element or less; 0.3 at 5 cm) and weaken to a faint line (0.2
  //  from 25 cm an element; 0.1 from 20 cm) that stays at any distance beyond; OLD TIMBER (mat 11) loses its
  //  marks to the plain timber, not to their mean: the fine grain by 10 cm an element, the coarse grain, checks
  //  and bolts by 50 cm, the far tone, the straps and their stain by 1.4 m; A SEAM OF THE GREAT WELL'S WALL fades
  //  to its field's own mean (below). One more mark in this shader is filtered, by its own change to an element
  //  and not by pxg: A WINDOW'S BARS (mat 4, below))
  float pxg = max(max(length(dFdx(vW)), length(dFdy(vW))), 1e-4);
  if (mat == 4.) {
    // a house wall in its own metres (bays of 2.6 m, storeys of 3.1 m): in a bay a window with its two shutter leaves
    // folded back and a sill, or on the ground floor a deep arched doorway with its door standing half open; plaster
    // stained under the sills and down from the roof, darker and damp at its foot; on some bays a vine
    vec3 ln = abs(vLN);
    if (ln.y < .5) {
      float u = (ln.x > .5 ? vL.z : vL.x) + 40., v = vL.y;
      vec2 cell = vec2(floor(u / 2.6), floor(v / 3.1)), f = vec2(u - cell.x * 2.6, v - cell.y * 3.1);
      // (the bay's own number: whole numbers only go into the hash, so every pixel of a bay reads the same draw)
      float fx = step(.5, ln.x), r = h21(cell + floor(vSeed * 91.) + fx * 7.), ax = abs(f.x - 1.3);
      vec3 paint = vSeed < .33 ? vec3(.07, .23, .42) : (vSeed < .66 ? vec3(.42, .17, .07) : vec3(.1, .3, .22));
      float isDoor = step(cell.y, .5) * step(.2, r) * step(r, .45), isWin = step(.45, r) * step(r, .93);
      float inY = step(1.2, f.y) * step(f.y, 2.3);
      float hole = isWin * step(ax, .36) * inY, leaf = isWin * step(.36, ax) * step(ax, .7) * inY, sill = isWin * step(ax, .52) * step(1.07, f.y) * step(f.y, 1.2);
      float streak = isWin * step(ax, .44) * step(f.y, 1.07) * smoothstep(.1, 1.07, f.y) * (.4 + .6 * vn(vec2(u * 9., v)));
      float head = 1.65 + sqrt(max(.3025 - ax * ax, 0.)), door = isDoor * step(ax, .55) * step(f.y, head), jamb = isDoor * step(ax, .68) * step(f.y, head + .13) * (1. - door);
      alb *= 1. - .22 * smoothstep(.5, .85, vn(vec2(u * 2.1, v * .15 + vSeed * 7.)));
      alb *= 1. - .2 * streak;
      alb *= mix(.6, 1., smoothstep(.1, 1., v + .25 * vn(vec2(u * 1.5, 2.))));
      float vine = step(.8, h21(vec2(cell.x, floor(vSeed * 37.) + fx * 3.))) * smoothstep(0., .8, 1.6 + 3.2 * h21(vec2(cell.x, 5.)) - v + .7 * vn(vec2(u * 2.5, v * 2.5))) * smoothstep(.36, .5, vn(vec2(u * 1.7, v * 1.7)));
      alb = mix(alb, vec3(.09, .24, .07) * (.7 + .6 * vn(vec2(u * 11., v * 11.))), vine * .9);
      // (the leaves are plain painted boards; the opening is dark, with three plain upright bars, 4.4 cm broad, that
      //  sink into the dark as a pixel grows wider than 3 cm of the wall: their strength is 3 cm over the pixel's span)
      alb = mix(alb, paint * (.82 + .18 * smoothstep(.36, .7, ax)), leaf * .92);
      float bar = max(step(abs(ax - .16), .022), step(ax, .022)) * clamp(.03 / max(fwidth(u), 1e-4), 0., 1.);
      alb = mix(alb, vCol * 1.08, sill); alb = mix(alb, mix(vec3(.025, .03, .04), vec3(.13, .12, .11), bar), hole);
      alb = mix(alb, vCol * .7, jamb * .8);
      alb = mix(alb, f.x < 1.42 ? paint * .42 : vec3(.02, .022, .03) + .05 * smoothstep(.5, 0., f.y), door);
    }
    alb *= .93 + .14 * vn(vW.xz * .9 + vW.y * .7);
  }
  if (mat == 9.) {
    // dressed stone under old whitewash: courses of half a metre breaking joint, rain's streaks, a darker foot
    if (abs(vLN.y) < .7) {
      float u = vW.x + vW.z, y = vW.y, c = floor(y / .5), uu = u / 1.05 + .5 * mod(c, 2.);
      float joint = max(smoothstep(.43, .5, abs(fract(y / .5) - .5)), smoothstep(.46, .5, abs(fract(uu) - .5)));
      // (read from near, each stone is of its own tone and its joints are a plain dark line: the joints at their old strength where the picture cannot hold more)
      alb *= (.86 + .22 * h21(vec2(floor(uu), c))) * (1. - mix(.2, .38, smoothstep(.25, .06, pxg)) * joint) * (1. - .25 * smoothstep(.5, .85, vn(vec2(u * 1.7, y * .12 + 3.))));
      alb *= mix(.7, 1., smoothstep(0., 1.6, y));
    }
  }
  if (mat == 10.) {
    // dressed stone under old whitewash, FINE AND UNEVEN (the piers about the great well's mouth): courses of 0.18 to
    // 0.5 m, no two alike, each of stones of its own length, the joints faint: a smooth pale face, nothing banded
    if (abs(vLN.y) < .7) {
      float u = vW.x + vW.z, y = vW.y, yy = y / .27 + .9 * vn(vec2(y * 1.3, 4.)), c = floor(yy), uu = u / (.7 + .5 * h21(vec2(c, 9.))) + h21(vec2(c, 2.));
      float joint = max(smoothstep(.45, .5, abs(fract(yy) - .5)), smoothstep(.47, .5, abs(fract(uu) - .5)));
      // (READ FROM NEAR: each stone its own tone (0.86 to 1.04), the joints a soft dark line, a third as strong
      //  where the picture cannot hold them; rain's streaks down from the cap; the foot darker and damp)
      alb *= (.86 + .18 * h21(vec2(floor(uu), c))) * (1. - mix(.1, .3, smoothstep(.2, .05, pxg)) * joint) * (1. - .26 * smoothstep(.5, .85, vn(vec2(u * 1.7, y * .12 + 3.))));
      alb *= mix(.66, 1., smoothstep(0., 1.9, y + .5 * vn(vec2(u * .8, 1.))));
    }
  }
  if (mat == 11.) {
    // OLD TIMBER READ FROM NEAR (the head tower's baulks): its grain and its long checks run along the baulk, an iron
    // strap with its bolts binds it every 5.2 m, its foot and its weather side are stained. All in the baulk's own
    // metres (along it: al; across it: ac), the same from anywhere; each mark fades out to the plain timber (not
    // to its own mean) where the picture cannot hold it (pxg): the fine grain between 2.5 and 10 cm an element,
    // the coarse grain, the checks and the bolts between 12 and 50 cm, the far tone, the straps and their stain
    // between 0.45 and 1.4 m
    float tk = floor(((vMat - 11.) / .8 + .5) * 256.), tb = floor(tk / 16.), be = (tb + .5) / 16. * 3.14159265, el = ((tk - tb * 16.) / 8. - .5) * 3.14159265;
    vec3 ax = vec3(cos(be) * cos(el), sin(el), sin(be) * cos(el)), u1 = vec3(-sin(be), 0., cos(be)), u2 = cross(ax, u1);
    float al = dot(vW, ax); vec2 ac = vec2(dot(vW, u1), dot(vW, u2));
    float fine = smoothstep(.1, .025, pxg), mid = smoothstep(.5, .12, pxg), farK = smoothstep(1.4, .45, pxg);
    float g1 = vn(vec2(ac.x * 8. + ac.y * 6.3, al * .3)), g2 = vn(vec2(ac.x * 29. + ac.y * 21., al * .9));
    alb *= mix(1., .74 + .38 * g1, mid) * mix(1., .9 + .2 * g2, fine);
    alb *= 1. - .5 * mid * smoothstep(.07, 0., abs(vn(vec2(ac.x * 2.7 + ac.y * 3.3, al * .11) + 7.) - .5));
    alb *= mix(1., .8 + .4 * vn(vec2(al * .16, ac.x + ac.y)), farK);
    float sa = abs(fract(al / 5.2 + .31) - .5) * 5.2, strap = smoothstep(.16, .13, sa) * farK;
    float bolt = smoothstep(.06, .035, length(vec2(sa - .0, fract((ac.x + ac.y) * 2.2) - .5) * vec2(1., .45))) * mid;
    alb = mix(alb, vec3(.07, .064, .058) * (.8 + .5 * g1), strap * .9); alb = mix(alb, vec3(.2, .19, .17), bolt * strap);
    alb *= 1. - .16 * smoothstep(.16, .5, sa) * smoothstep(.9, .16, sa) * farK;
  }
  if (mat == 7. && vW.y < uShaft[0].w + 8.) {
    // the living rock of the landing (low over the water): mottled, cracked, bedded on what stands steep, dark and damp toward the water
    float m1 = vn(vW.xz * .55 + 3.), m2 = vn(vW.xz * 2.3 + vW.y * 1.7), cr = smoothstep(.06, 0., abs(vn(vW.xz * .8 + 11.) - .5));
    float bd = (1. - abs(n.y)) * smoothstep(.12, 0., abs(fract(vW.y * 1.7 + .5 * m1) - .5));
    alb *= (.62 + .5 * m1) * (.8 + .4 * m2) * (1. - .28 * cr) * (1. - .4 * bd);
    alb *= mix(.4, 1., smoothstep(.1, .9, vW.y - uShaft[0].w + .25 * m2));
  }
  float day = dayAt(vW.y), wet = mat == 8. ? 1. : 0.;
  // the nearer great shaft: its axis, its radius, the water's level under it. A great shaft's wall, and whatever hangs
  // or grows inside one above the roof, takes the shaft's own light (below).
  vec4 sh = distance(vW.xz, uShaft[0].xy) < distance(vW.xz, uShaft[1].xy) ? uShaft[0] : uShaft[1];
  vec2 so = vW.xz - sh.xy; float sr = length(so);
  float inShaft = mat == 6. ? 1. : step(sr, sh.z + 1.2) * step(vW.y, .5) * step(sh.w + 16., vW.y);
  if (mat == 6.) {
    // a great shaft's wall, in its own metres round (ua) and down (y): dressed courses for the first 5 m, then the
    // living rock: beds of uneven thickness, cracks, pits; pale lime runs, dark wet streaks, moss where damp meets light
    float ua = atan(so.y, so.x) * sh.z, y = vW.y;
    float rockK = smoothstep(-4.6, -5.4, y + .5 * vn(vec2(ua * .3, 1.)));
    float c = floor(y / .5), u = ua / 1.1 + .5 * mod(c, 2.);
    float joint = max(smoothstep(.42, .5, abs(fract(y / .5) - .5)), smoothstep(.45, .5, abs(fract(u) - .5)));
    float stone = .86 + .22 * h21(vec2(floor(u), c));
    float bed = smoothstep(.12, 0., abs(fract(y * .31 + .6 * vn(vec2(ua * .12, y * .1))) - .5));
    // (THE GREAT WELL'S WALL HAS NO THIN DARK LINE ON IT: its cracks are BROAD SOFT SEAMS of the rock, by the same
    //  field: three times as broad (0.66 m across at the middle of their run, where the lines were 0.21 m), a third
    //  as dark, soft from their middle to their edge, DRAWN WHEREVER THE FIELD LAYS THEM, by the lit point's place
    //  alone: the same from anywhere and at any size of picture. ONE FILTER READS THE EYE, and only this: where a
    //  seam's WHOLE breadth (0.66 m) would span under one and a half picture elements it fades to the field's own
    //  mean (0.082), and is at the mean from half an element (pxg): it takes away only what the picture cannot
    //  hold. The widest shaft's wall keeps its lines, as it was)
    float cf = abs(vn(vec2(ua * .45, y * .2) + 11.) - .5);
    float crack = sh.z >= 12. ? mix(.082, smoothstep(.05, 0., cf), smoothstep(.5, 1.5, .66 / pxg)) / 3. : 1. - smoothstep(0., .016, cf);
    float pit = .2 * vn(vec2(ua * 1.9, y * 1.9)) + .2 * vn(vec2(ua * .5, y * .7) + 5.);
    // (the widest shaft over the landing is seen from below: its beds and cracks are a little fainter marks)
    float soft = sh.z < 12. ? .55 : 1.;
    // (fl: THE GREAT WELL'S BELL, the flare that faces down over the water, by the wall's own face. On it the wall's
    //  dark bed lines and its seams are not drawn at all: seen from under it, across the whole vault, a line a hand
    //  broad is a thread over the picture; the bell is bedded in broad soft bands instead, below)
    float fl = sh.z >= 12. ? smoothstep(.2, .45, -n.y) : 0., mark = soft * (1. - fl);
    alb *= mix(stone * (1. - .3 * joint * soft), (.66 + 1.3 * pit) * (1. - .42 * bed * mark) * (1. - .34 * crack * mark), rockK);
    float lime = smoothstep(.55, .85, vn(vec2(ua * 1.6, y * .22))) * smoothstep(-1., -9., y);
    alb = mix(alb, vec3(.68, .66, .58), lime * .35);
    wet = .7 * smoothstep(.66, .84, vn(vec2(ua * 1.1 + 40., y * .07))) * smoothstep(-2., -14., y) * smoothstep(sh.w + 16., sh.w + 26., y);
    // where a runnel of the court spills over the rim the wall is wet all the way down
    if (distance(vW.xz, uShaft[0].xy) < uShaft[0].z + 3.) wet = max(wet, smoothstep(.986, .9985, dot(so / max(sr, 1e-3), uRun.xy)) * smoothstep(-.3, -2., y));
    float moss = smoothstep(.5, .75, vn(vec2(ua * .7 + 9., y * .45))) * smoothstep(-34., -6., y) * smoothstep(1., -3., y) * (.4 + .6 * wet + .3 * bed);
    alb = mix(alb, vec3(.16, .26, .08), clamp(moss, 0., .8) * soft * (1. - smoothstep(.2, .45, -n.y)));
    alb *= 1. - .5 * wet;
    // (THE GREAT WELL'S BELL is the hall's own rock seen from under it, bedded as the hall's piers are: BROAD SOFT
    //  BANDS, beds of 2 m each of its own tone (0.82 to 1.16), one bed's tone going over into the next across 1.2 m,
    //  the beds' level wandering by the rock's place (1.8 m over some 8 m) and by a finer grain (0.3 m): rings of
    //  strata round the bell with no line between them and no ledge's shade, nothing narrower than a metre)
    if (fl > 0.) { float sy = y * .5 + .9 * vn(vW.xz * .13 + 2.) + .15 * vn(vW.xz * .6 + 7.), b0 = floor(sy);
      alb *= mix(1., (.7 + .5 * mix(h21(vec2(b0, 3.7)), h21(vec2(b0 + 1., 3.7)), smoothstep(.2, .8, sy - b0))) * (.74 + .5 * vn(vW.xz * .11 + 5.)), fl); wet = max(wet, .5 * fl * smoothstep(.4, .7, vn(vW.xz * .23 + 9.))); }
  }
  if (mat == 8.) alb *= .7;
  vec3 hemi = mix(uGroundCol, uSkyCol, n.y * .5 + .5), lit = hemi + uSunCol * max(dot(n, uSun), 0.);
  if (mat == 1.) lit = hemi + uSunCol * (.5 * abs(dot(n, uSun)) + .3);
  // under the rock a thing takes the daylight that falls WHERE IT STANDS (the lake's table: full under a shaft, a
  // twentieth of it in the dark between) and the light of the quay's lamps
  vec4 lkT = texture2D(tLake, (vW.xz - uLakeBox.xy) * uLakeBox.zw); float fell = min(.05 + 1.6 * lkT.g, 1.);
  // (and the warm light of a mooring's lantern, where one hangs near, at every hour: the table's fourth channel; on
  //  what stands or floats by it up to its pile's head (3.5 m over the water), none from 6 m up: what hangs higher
  //  by it, a rope, a chain, is in the hall's dark)
  vec3 cave = uCaveAmb * (.65 + .35 * n.y) + uCaveKey * (.3 + .7 * max(n.y, 0.)) * fell + qLamp(vW, n) * (1. - day) + vec3(1.5, .82, .3) * lkT.a * .55 * (1. - smoothstep(3.5, 6., vW.y - uShaft[0].w));
  // (WHAT HANGS DOWN A WELL HANGS IN THAT WELL'S OWN SHAFT OF LIGHT: a bucket takes the shaft's day on it under the
  //  rock, whatever the table gives the place, and at night its own lamp's warm light. A ROPE hangs plumb in light
  //  that falls plumb: the day grazes it, so it takes a little of it only and stands as a line of tan hemp, darker
  //  than the lit air of its shaft's core and paler than the dark rock behind: read either way)
  #if MODE == 5
  cave += uCaveKey * (.6 + .5 * max(n.y, 0.)) + vec3(1.5, .82, .3) * uLamp * .12;
  #endif
  // (by night the moon's shaft is too faint to light it pale: the rope is A THIN DIM LINE, hemp in the hall's floor
  //  of light and a sixth of the moon's: darker than the moonlit air of its shaft's core, a little paler than the
  //  dark rock, never black. uLamp is the lamps' strength (4.5 by night), so the night is asked as min(uLamp, 1):
  //  the mix must not run past its end)
  #if MODE == 6 || MODE == 7
  cave = mix(cave + uCaveKey * .05, uCaveAmb * 1.1 + uCaveKey * .17, min(uLamp, 1.));
  #endif
  vec3 light = mix(cave, lit, day), glintCol = mix(uCaveKey * .6, uSkyCol, day);
  if (inShaft > .5) {
    // in a great shaft (by the lit point's own place): near the rim the blue of the round of sky; deeper, the same
    // daylight as the cavern's eye takes it (pale, never dark: a shaft's bore is brighter than the rock round its foot);
    // the lit water below throws its green-blue up the lower walls; and the sun reaches down the side away from it as
    // far as the rim's shadow lets it; and what faces DOWN over the water (a shaft's bell, flaring to the roof) takes
    // the day the bright pool under it gives back, by its height over the water (a half of it at 28 m).
    // THE GREAT WELL'S BELL (fl: its flare, the wall's own faces that look down) takes that day BY ITS HEIGHT OVER
    // ITS POOL, steeply, and on its lip only (below); its own shade is the hall's cool floor of light, not the
    // shaft's gold: a dark vault with a depth (by the lit point's height)
    float y = vW.y, sky = exp(min(y, 0.) / 15.), pool = .75 * exp(-max(y - sh.w, 0.) / 18.), hw = max(y - sh.w, 0.);
    float fl = (mat == 6. && sh.z >= 12.) ? smoothstep(.2, .45, -n.y) : 0.;
    vec2 inw = -so / max(sr, 1e-3); float sl = max(length(uSun.xz), 1e-3), reach = 2. * sh.z * max(dot(inw, uSun.xz / sl), 0.) * uSun.y / sl;
    float sunK = smoothstep(-1.5, .5, y + reach) * max(dot(n, uSun), 0.);
    // (THE BELL IS DARK WET ROCK WITH FORM: its shade the hall's cool floor of light and no more; the day its pool
    //  gives back is on its lip only (a third of it at the water, a half of that 3 m up); what gives it form is the
    //  pool's own green-blue from below, more on what leans to the pool's middle, and the wet's glint)
    light = mix(mix(uCaveKey * .6, uSkyCol * 1.25, sky) * (.62 + .38 * n.y), uCaveAmb * (.5 + .5 * max(dot(n.xz, -so / max(sr, 1e-3)), 0.)), fl) + uPoolCol * pool * (.6 - .4 * n.y) * (1. - .8 * fl) + uSunCol * sunK * .9 + uCaveAmb * .1
      + uCaveKey * max(-n.y, 0.) * mix(.9 * exp(-hw / 40.), .34 * exp(-hw / 4.5), fl);
    // (and THE WATER'S NET on it: the same two slow ridged fields as on the hall's rock, on the clock, green-blue, by
    //  the same height law: the bell hangs over the hall's brightest pool)
    { vec2 pw = vW.xz + y * vec2(.7, .5); float dn = max(-n.y, 0.) * exp(-max(y - sh.w, 0.) / 40.);
      float net = pow(clamp((1. - abs(2. * vn(pw * .42 + vec2(uT * .05, 0.)) - 1.)) * (1. - abs(2. * vn(mat2(.8, -.6, .6, .8) * pw * .71 - vec2(0., uT * .04)) - 1.)), 0., 1.), 3.);
      light += uPoolCol * dn * mix(.3 + 3. * net, .1 + 1.0 * net, fl); }
    // (the widest shaft, seen from under it: THE DAY IS SEEN IN IT: its wall is brighter the nearer the sky, by the
    //  lit point's own height: from 1.6 of its light 12 m over the water to 2.2 of it from 3 m under the ground up:
    //  seen from the dim hall the bore is the brightest stone in the picture)
    if (sh.z < 12.) light *= 1.6 + .6 * smoothstep(sh.w + 12., -3., y);
    glintCol = uSkyCol * sky + uPoolCol * pool;
  }
  // (A ROPE IN THE DAY, over the ground or in a great shaft's lit bore, stands against lit stone and lit dust: there it
  //  is the darker thing, the weathered hemp it was; under the rock it is the pale line against the dark)
  #if MODE == 6 || MODE == 7
  light *= mix(1., .55, max(day, inShaft * (1. - uLamp)));
  #endif
  vec3 col = alb * light;
  if (wet > 0.) {
    // wet stone and wet timber glint: more at a grazing look (the angle of the look, as on any wet thing)
    float ndv = max(dot(n, normalize(cameraPosition - vW)), 0.);
    col += glintCol * wet * (.06 + .5 * pow(clamp(1. - ndv, 0., 1.), 3.)) * (.6 + .8 * vn(vW.xz * 3. + vec2(vW.y * 2.5 + uT * .6, 0.)));
  }
  if (mat == 2.) {
    float sp = vn(vW.xz * 2.3 + vec2(0., uT * 1.7)) * vn(vW.xz * 5.1 - vec2(uT * 1.1, vW.y * 3. + uT * 2.));
    col = uWaterCol * light * .8 + mix(uCaveKey, uSunCol, day) * smoothstep(.3, .62, sp) * 1.3;
    // water that FALLS in the daylight (a wheel's sheet, a tank's lip: a steep face, over 1.5 m above the ground) is
    // white with air: bright streaks running down it, and the drops thrown beside it flash the same way
    float steep = 1. - smoothstep(.45, .8, abs(n.y)), fall = steep * step(1.5, vW.y) * day;
    float run = vn(vec2((vW.x + vW.z) * 5., vW.y * 1.4 + uT * 4.5)) * .6 + vn(vec2((vW.x - vW.z) * 11., vW.y * 3. + uT * 7.)) * .4;
    col = mix(col, (uSunCol * .45 + hemi * .35) * (.55 + .7 * run), fall * .8);
    // and the thread that falls down the great well, under the ground: pale with air too, by the light the shaft has there
    col = mix(col, vec3(.8, .86, .84) * light * (.4 + .8 * run), steep * step(vW.y, -1.) * .85);
  }
  if (mat == 3.) col = alb * (.3 * light + uLamp);
  if (mat == 5.) {
    // a well's throat: the stone lining in courses, lit by the round of sky over it
    float jt = step(abs(vLN.y), .5) * smoothstep(.4, .5, abs(fract(vL.y / .45) - .5));
    col = alb * (1. - .3 * jt) * mix(uCaveKey, vec3(dot(uCaveKey, vec3(.3, .6, .1))), .3) * 3.2;
  }
  gl_FragColor = vec4(placeFog(col, vW), clamp(vA, 0., 1.));
}`;
// one material per MODE; they share the uniforms object, so one clock and one light serve them all
export function liftMaterial(shared, mode = 0) {
  // (the ropes, modes 6 and 7, are laid over the picture by their share (see LIFT_VERT): drawn after the water and
  //  after the shafts of light: a rope hangs on its shaft's axis, where the lit air is brightest, and is not veiled by it)
  //  (A ROPE IS LAID ONCE (mending 2): it writes no depth, so drawn from both sides its far wall and its near wall
  //  were both laid and a thin rope's share was paid twice (1 - (1 - s)^2 for s); a rope is a closed round, so its
  //  walls that face the eye cover it exactly once: one side only, and the share is the s meant)
  const rope = mode === 6 || mode === 7;
  const m = new THREE.ShaderMaterial({ name: 'WellsLift' + mode, uniforms: shared, defines: { MODE: mode }, vertexShader: LIFT_VERT, fragmentShader: LIFT_FRAG, side: rope ? THREE.FrontSide : THREE.DoubleSide, transparent: rope, depthWrite: !rope });
  if (rope) m.userData.order = 4.5;
  return m;
}
// The bucket's and the pot's laws in JS, the same arithmetic as LIFT_VERT (for counting them against the route at any clock).
export const MOVE_LAW = {
  // the bucket's drop under its top place, in metres, at clock t
  // (it hangs at the well head for about a third of its period, goes down, lies in the water from .42 to .6 of the period and comes up)
  bucketDrop: (t, period, phase, travel) => { const u = (((t / period + phase) % 1) + 1) % 1, ss = (a, b, x) => { const q = Math.min(1, Math.max(0, (x - a) / (b - a))); return q * q * (3 - 2 * q); }; return travel * (ss(0.16, 0.42, u) - ss(0.6, 0.86, u)); },
  // a pot's place on its chain in the chain's own plane [x, y] (the top wheel's middle is the origin), at clock t
  pot: (t, speed, s0, H, r) => {
    const loop = 2 * H + TAU * r; let s = (s0 + speed * t) % loop; if (s < 0) s += loop;
    if (s < H) return [-r, -H + s];
    if (s < H + Math.PI * r) { const th = (s - H) / r; return [-r * Math.cos(th), r * Math.sin(th)]; }
    if (s < 2 * H + Math.PI * r) return [r, -(s - H - Math.PI * r)];
    const th = (s - 2 * H - Math.PI * r) / r; return [r * Math.cos(th), -H - r * Math.sin(th)];
  },
};
// an InstancedMesh from a list of { m: Matrix4, move: [a, b, c, d], tint: [r, g, b] }; the geometry is this mesh's alone
export function instanced(geometry, material, list, name) {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, list.length));
  mesh.count = list.length; mesh.name = name || 'wells';
  const mv = new Float32Array(Math.max(1, list.length) * 4); let tinted = false;
  for (let i = 0; i < list.length; i++) {
    const it = list[i]; mesh.setMatrixAt(i, it.m);
    if (it.move) mv.set(it.move, i * 4);
    if (it.tint) { if (!tinted) { tinted = true; for (let k = 0; k < i; k++) mesh.setColorAt(k, _white); } mesh.setColorAt(i, _c.setRGB(it.tint[0], it.tint[1], it.tint[2])); }
    else if (tinted) mesh.setColorAt(i, _white);
  }
  geometry.setAttribute('aMove', new THREE.InstancedBufferAttribute(mv, 4));
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false; if (material.userData && material.userData.order) mesh.renderOrder = material.userData.order;
  return mesh;
}
const _c = new THREE.Color(), _white = new THREE.Color(1, 1, 1);

// ------------------------------------------------------------------ the makers. Each returns { g: Geo (what stands), movers: [{ g, mode, at: [x, y, z], sweep }], ...measures }.
// A mover's Geo is in its own frame (its pivot at the origin); 'at' is that pivot in the thing's frame; 'sweep' the
// radius of the ball about the pivot that the mover never leaves.
const C = COL, tint = (c, k) => mulc(c, k), C_LIME = COL.lime;

// WELL HEAD: a stone ring about a dark bore, a gallows of two posts and a beam, a pulley, a trough with water. ONE
// MAKE, the same at every distance (the ring of eight, the posts of three sides, the pulley a flat wheel).
// The rope and the bucket are instances of their own (ropeGeo, bucketGeo).
export function wellHead({ r = 1.1 } = {}) {
  const g = new Geo(), n = 8, ro = r + 0.3, topY = 0.9, beamY = 3.1, post = r + 0.5;
  g.cyl(0, 0, topY, 0, ro + 0.06, ro, n, tint(C.stone, 0.8), 0, false, C.white);
  g.disc(0, topY, 0, ro, n, C.white, 0, true, r);
  g.cyl(0, 0.3, topY, 0, r, r, n, [0.03, 0.035, 0.04], 0, true, tint(C.stone, 0.6)); g.disc(0, 0.3, 0, r, n, [0.012, 0.016, 0.02], 0, true);
  g.beam([-post, 0, 0], [-post, beamY, 0], 0.13, C.timber, 0, 3); g.beam([post, 0, 0], [post, beamY, 0], 0.13, C.timber, 0, 3);
  g.beam([-post - 0.3, beamY, 0], [post + 0.3, beamY, 0], 0.13, C.timberDark, 0, 3);
  g.box(0, 0.3, ro + 0.4, 1.7, 0.6, 0.7, C.stone, 0, 0, false); g.quad([-0.72, 0.62, ro + 0.17], [-0.72, 0.62, ro + 0.63], [0.72, 0.62, ro + 0.63], [0.72, 0.62, ro + 0.17], C.water, MAT.water);
  // (the pulley hangs 0.56 m under the beam's middle: a flat wheel, a rim of six and two spokes, turning clear of the beam's under face)
  const w = new Geo(), ri = 0.26, rw = 0.37;
  for (let k = 0; k < 6; k++) { const a0 = k / 6 * TAU, a1 = (k + 1) / 6 * TAU; w.quad([Math.cos(a0) * ri, Math.sin(a0) * ri, 0], [Math.cos(a0) * rw, Math.sin(a0) * rw, 0], [Math.cos(a1) * rw, Math.sin(a1) * rw, 0], [Math.cos(a1) * ri, Math.sin(a1) * ri, 0], C.timberDark); }
  w.quad([-ri, -0.035, 0], [ri, -0.035, 0], [ri, 0.035, 0], [-ri, 0.035, 0], C.timber); w.quad([-0.035, -ri, 0], [0.035, -ri, 0], [0.035, ri, 0], [-0.035, ri, 0], C.timber);
  return { g, movers: [{ g: w, mode: 1, at: [0, beamY - 0.56, 0], sweep: 0.4 }], pulleyY: beamY - 0.56, topY, r, reach: post + 0.45, height: beamY + 0.15 };
}
// the bucket (its bail's top at the origin; it hangs 0.62 m) and its rope (a prism from y 0 down to y -1)
export function bucketGeo() {
  const g = new Geo();
  g.cyl(0, -0.62, -0.1, 0, 0.21, 0.3, 6, [0.2, 0.115, 0.055], MAT.wet, false, [0.36, 0.23, 0.12]); g.disc(0, -0.62, 0, 0.21, 6, [0.17, 0.1, 0.05], MAT.wet, false);
  g.cyl(0, -0.2, -0.14, 0, 0.29, 0.3, 6, C.iron, MAT.wet);
  g.tri([-0.29, -0.1, 0], [0.29, -0.1, 0], [0, 0, 0], C.iron);
  // the thread of water it sheds coming up (MODE 5 gives it its length; folded away going down)
  g.beam([0, -0.62, 0], [0, -3.4, 0], 0.05, C.water, MAT.water, 3, 0.024);
  return g;
}
// (PALE HEMP: a rope is the palest made thing under the rock)
export function ropeGeo() { const g = new Geo(); g.beam([0, 0, 0], [0, -1, 0], 0.055, [0.66, 0.56, 0.36], 0, 4); return g; }
// a clay pot of the endless chains (its middle at the origin, mouth up on the rising strand)
export function potGeo() {
  const g = new Geo();
  g.cyl(0, -0.3, 0.3, 0, 0.2, 0.33, 6, tint(C.clay, 0.5), 0, false, tint(C.clay, 0.72)); g.disc(0, -0.3, 0, 0.2, 6, tint(C.clay, 0.45), 0, false);
  g.disc(0, 0.2, 0, 0.3, 6, C.water, MAT.water, true);
  // THE WATER A FULL POT SPILLS as it rises: a thread from under its lip (MODE 8 gives it its length: each pot's own,
  // 1.1 to 2.4 m, never longer than the pot's height over the water; folded away over the top wheel and going down)
  g.beam([0.27, 0.18, 0], [0.27, -2.4, 0], 0.05, C.water, MAT.water, 3, 0.02);
  return g;
}

// WINDMILL: a slender tower (a timber trestle of four legs, or a whitewashed round tower) with a wheel of eight
// triangular cloth sails on spars, a painted tail vane behind, a pump rod down the middle. H is the hub's height,
// R the sails' radius. The sail wheel spins about its own z axis; the whole mill is turned into the wind by its instance.
// ONE MAKE, the same at every distance: the trestle's legs are prisms of three sides and its braces flat laths in
// its four faces; each sail is its spar and its cloth in three faces; the stay pole and the hub are drawn, and no
// stay rope and no sheet on any mill.
export function windmill({ H = 16, R = 5.2, stone = false, red = 0 } = {}) {
  const g = new Geo(), movers = [], hubZ = stone ? 1.5 : 1.2;
  if (stone) {
    g.cyl(0, 0, H - 1.2, 0, 1.4, 0.9, 8, tint(C.white, 0.9), MAT.solid, false, C.white); g.cyl(0, H - 1.2, H + 0.5, 0, 1.15, 0.2, 8, C.timber, 0, false, C.timberDark);
    g.box(0, 1.1, 1.5, 0.9, 2.2, 0.12, C.timberDark);
  } else {
    const b = Math.max(1.0, H * 0.072), t = 0.3;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) g.beam([sx * b, 0, sz * b], [sx * t, H - 0.6, sz * t], 0.11, C.timber, 0, 3, 0.08);
    const lv = 3, at = (k, sx, sz) => { const f = k / lv, w = b + (t - b) * f; return [sx * w, (H - 0.6) * f, sz * w]; };
    const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    for (let k = 0; k < lv; k++) for (let i = 0; i < 4; i++) {
      const a = corners[i], c = corners[(i + 1) % 4];
      g.strip(at(k, a[0], a[1]), at(k + 1, c[0], c[1]), 0.07, C.timberDark);
      if (k > 0) g.strip(at(k, a[0], a[1]), at(k, c[0], c[1]), 0.07, C.timberDark);
    }
    g.box(0, H - 0.45, 0, 1.1, 0.3, 1.1, C.timberDark); g.strip([0, 0, 0], [0, H - 0.6, 0], 0.05, C.iron);
  }
  // the head: an axle through the top, a tail boom with a painted fin
  g.beam([0, H, hubZ], [0, H + 0.25, -R * 0.75], 0.09, C.timberDark, 0, 3);
  g.tri([0, H + 0.2, -R * 0.4], [0, H + 0.3 + R * 0.3, -R * 0.82], [0, H + 0.1 - R * 0.14, -R * 0.82], C.red);
  const w = new Geo(), sails = 8;
  for (let i = 0; i < sails; i++) {
    const a0 = i / sails * TAU, a1 = (i + 0.64) / sails * TAU, c = Math.cos(a0), s = Math.sin(a0);
    w.beam([c * 0.2, s * 0.2, 0], [c * R, s * R, 0], 0.06, C.timber, 0, 3, 0.035);
    const cl = (red > 0 && i % red === 0) ? C.red : tint(C.cloth, 0.92 + 0.12 * ((i * 7) % 3) / 2);
    // THE SAIL HAS DEPTH: a jib of cloth laced to its spar, its free corner sheeted 0.1 R forward of the wheel's plane
    // (toward the stay pole's tip), its belly filled a little further: three faces, each taking the sun at its own angle
    const A = [c * R * 0.24, s * R * 0.24, 0.03], B = [c * R * 0.98, s * R * 0.98, 0.03], Cw = [Math.cos(a1) * R * 0.74, Math.sin(a1) * R * 0.74, R * 0.1];
    const Bp = [(A[0] + B[0] + Cw[0]) / 3, (A[1] + B[1] + Cw[1]) / 3, R * 0.1];
    w.tri(A, B, Bp, cl, MAT.cloth); w.tri(B, Cw, Bp, tint(cl, 0.84), MAT.cloth); w.tri(Cw, A, Bp, tint(cl, 0.93), MAT.cloth);
  }
  // (the stay pole: forward from the hub, 0.3 R, inside the round the sails sweep; and the hub, a short drum on the axle)
  w.beam([0, 0, 0], [0, 0, R * 0.3], 0.06, C.timberDark, 0, 3);
  { const from = w.p.length; w.cyl(0, -0.3, 0.3, 0, 0.26, 0.2, 5, C.timberDark); for (let i = from; i < w.p.length; i += 3) { const y = w.p[i + 1], z = w.p[i + 2]; w.p[i + 1] = -z; w.p[i + 2] = y; const ny = w.n[i + 1], nz = w.n[i + 2]; w.n[i + 1] = -nz; w.n[i + 2] = ny; } }
  movers.push({ g: w, mode: 1, at: [0, H, hubZ], sweep: R + 0.1 });
  return { g, movers, H, R, hubZ, reach: Math.max(R, stone ? 1.6 : Math.max(1.0, H * 0.072) * 1.5), height: H + R };
}

// WATER WHEEL (a noria): a great wheel of wet dark timber, two rims on spokes and, all round it, SCOOPS: deep boxes
// between the rims that dip into the channel it stands in, come up full on one side and tip over the top into the
// head trough, a bright sheet of water falling from them. It stands on two A frames; its channel is a stone cut
// with water in it (the cut's walls go 1.6 m down, so it stands in whatever ground is under it). R is its radius;
// it turns in its own xy plane, its top going toward +x (a negative speed), where the trough is.
export function waterWheel({ R = 9, scoops = 20 } = {}) {
  const g = new Geo(), hubY = R + 0.1, hw = Math.max(0.9, R * 0.12), movers = [], wetT = tint(C.timberDark, 0.75), wetL = tint(C.timber, 0.62);
  for (const sz of [-1, 1]) {
    const z = sz * (hw + 0.6), sp = R * 0.5;
    g.beam([-sp, 0.5, z], [0, hubY + 0.3, z], 0.24, C.timber, 0, 4, 0.16); g.beam([sp, 0.5, z], [0, hubY + 0.3, z], 0.24, C.timber, 0, 4, 0.16);
    g.beam([-sp * 0.55, hubY * 0.45, z], [sp * 0.55, hubY * 0.45, z], 0.13, C.timberDark, 0, 4);
    // (each foot on a stone plinth that stands in the channel's water)
    // (the plinths stand 0.3 m and more outside the rims' plane: the scoops' round passes them)
    g.box(-sp, -0.35, z + sz * 0.1, 1.2, 1.7, 0.8, C.stone, MAT.stone, 0, false); g.box(sp, -0.35, z + sz * 0.1, 1.2, 1.7, 0.8, C.stone, MAT.stone, 0, false);
  }
  g.beam([0, hubY, -hw - 1.0], [0, hubY, hw + 1.0], 0.26, C.timberDark, 0, 6);
  // the channel: a broad cut of water (1.5 m wider than the wheel either side), stone kerbs along it and across its
  // ends, going down into the ground
  const cl = R * 1.25, cw = hw + 1.5;
  for (const sz of [-1, 1]) g.box(0, -0.6, sz * (cw + 0.2), cl * 2 + 0.8, 2.0, 0.4, tint(C.stone, 0.85), MAT.stone, 0, false);
  for (const sx of [-1, 1]) g.box(sx * (cl + 0.2), -0.6, 0, 0.4, 2.0, cw * 2 + 0.8, tint(C.stone, 0.85), MAT.stone, 0, false);
  g.quad([-cl, 0.12, -cw], [-cl, 0.12, cw], [cl, 0.12, cw], [cl, 0.12, -cw], C.water, MAT.water);
  // THE HEAD TROUGH stands outside the wheel's whole round (its near lip 0.75 m beyond the scoops' sweep), half the
  // wheel's radius above the hub, on two posts; the water the scoops tip out past the top falls to it in a broad
  // bright sheet that arcs outside the round (two lengths: 62 to 45 degrees, 45 degrees to the trough's lip)
  const ty = hubY + R * 0.5, tx = Math.sqrt((R + 1.25) ** 2 - (R * 0.5) ** 2) + 0.4, sw = hw * 0.85;
  const s0 = [(R + 0.55) * Math.cos(1.082), hubY + (R + 0.55) * Math.sin(1.082)], s1 = [(R + 0.75) * 0.7071, hubY + (R + 0.75) * 0.7071], s2 = [tx - 0.2, ty + 0.27];
  g.box(tx + 0.9, ty, 0, 2.6, 0.5, hw * 2 + 0.3, wetL, MAT.wet); g.quad([tx - 0.4, ty + 0.27, -hw], [tx - 0.4, ty + 0.27, hw], [tx + 2.2, ty + 0.27, hw], [tx + 2.2, ty + 0.27, -hw], C.water, MAT.water);
  g.quad([s0[0], s0[1], -sw], [s0[0], s0[1], sw], [s1[0], s1[1], sw], [s1[0], s1[1], -sw], C.water, MAT.water);
  g.quad([s1[0], s1[1], -sw], [s1[0], s1[1], sw], [s2[0], s2[1], sw], [s2[0], s2[1], -sw], C.water, MAT.water);
  // (THE FALL HAS A BODY, seen from the wheel's face as well as from its side: the sheet's two cheeks, 0.5 m deep under
  //  its upper skin, in the planes of the scoops' two ends; and the lip's own fall from the trough's far end)
  for (const z of [-sw, sw]) {
    g.quad([s0[0], s0[1], z], [s1[0], s1[1], z], [s1[0] - 0.3, s1[1] - 0.45, z], [s0[0] - 0.12, s0[1] - 0.3, z], tint(C.water, 1.25), MAT.water);
    g.quad([s1[0], s1[1], z], [s2[0], s2[1], z], [s2[0] - 0.1, s2[1] - 0.5, z], [s1[0] - 0.3, s1[1] - 0.45, z], tint(C.water, 1.25), MAT.water);
  }
  g.beam([tx + 1.9, 0, -hw], [tx + 1.9, ty - 0.2, -hw], 0.15, C.timber, 0, 4); g.beam([tx + 1.9, 0, hw], [tx + 1.9, ty - 0.2, hw], 0.15, C.timber, 0, 4);
  // the spray where the scoops empty and where the sheet strikes the trough: small flecks of water thrown beside the
  // fall, each in the wheel's own plane and across it (their places by their number, the same on every wheel)
  for (let i = 0; i < 18; i++) {
    const h1 = Math.sin(i * 12.9898 + 1.3) * 43758.5453, u = h1 - Math.floor(h1), h2 = Math.sin(i * 78.233 + 0.7) * 12543.21, v = h2 - Math.floor(h2), t = i / 17 * 2;
    const a = t < 1 ? [s0[0] + (s1[0] - s0[0]) * t, s0[1] + (s1[1] - s0[1]) * t] : [s1[0] + (s2[0] - s1[0]) * (t - 1), s1[1] + (s2[1] - s1[1]) * (t - 1)];
    const x = a[0] + (u - 0.25) * 0.9, y = a[1] + (v - 0.15) * 0.9, z = ((u * 7.3) % 1 - 0.5) * 2 * (sw + 0.3), q = 0.06 + 0.07 * v;
    g.quad([x - q, y - q, z], [x + q, y - q, z], [x + q, y + q, z], [x - q, y + q, z], C.water, MAT.water);
    g.quad([x, y - q, z - q], [x, y - q, z + q], [x, y + q, z + q], [x, y + q, z - q], C.water, MAT.water);
  }
  const w = new Geo(), n = 16, Q = (a, r, z) => [Math.cos(a) * r, Math.sin(a) * r, z];
  for (const sz of [-1, 1]) {
    w.rim(R, n, 0.2, sz * hw, wetT, MAT.wet, 0.1); w.rim(R * 0.6, n, 0.1, sz * hw, wetT, MAT.wet, 0.07);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; w.beamZ([Math.cos(a) * 0.3, Math.sin(a) * 0.3, sz * hw], [Math.cos(a) * R, Math.sin(a) * R, sz * hw], 0.1, 0.08, wetL, MAT.wet); }
  }
  for (let i = 0; i < scoops; i++) {
    // a scoop: its floor (the outer board), its back (the board that trails), its two cheeks, open ahead; a paddle inside the rim
    const a0 = i / scoops * TAU, a1 = a0 + 0.62 * TAU / scoops, ri = R - 0.25, ro = R + 0.5;
    w.quad(Q(a0, ro, -hw), Q(a1, ro, -hw), Q(a1, ro, hw), Q(a0, ro, hw), wetT, MAT.wet);
    w.quad(Q(a1, ri, -hw), Q(a1, ro, -hw), Q(a1, ro, hw), Q(a1, ri, hw), wetL, MAT.wet);
    for (const sz of [-1, 1]) w.quad(Q(a0, ri, sz * hw), Q(a1, ri, sz * hw), Q(a1, ro, sz * hw), Q(a0, ro, sz * hw), wetT, MAT.wet);
    w.quad(Q(a0, R - 0.9, -hw), Q(a0, ri, -hw), Q(a0, ri, hw), Q(a0, R - 0.9, hw), wetL, MAT.wet);
  }
  movers.push({ g: w, mode: 1, at: [0, hubY, 0], sweep: R + 0.6 });
  return { g, movers, R, hubY, hw, cw, reach: Math.max(cl + 0.6, tx + 2.4), height: hubY + R + 0.8, trough: [tx + 2.2, ty + 0.27] };
}

// PUMP BEAM: a forked post with a long beam that nods on it, a stone at the short end, a rod at the long end over a small ring.
export function pumpBeam() {
  const g = new Geo(), H = 4.2, movers = [];
  g.beam([-0.7, 0, 0.35], [0, H, 0.2], 0.14, C.timber, 0, 4); g.beam([0.7, 0, 0.35], [0, H, 0.2], 0.14, C.timber, 0, 4);
  g.beam([-0.7, 0, -0.35], [0, H, -0.2], 0.14, C.timber, 0, 4); g.beam([0.7, 0, -0.35], [0, H, -0.2], 0.14, C.timber, 0, 4);
  g.cyl(3.5, 0, 0.7, 0, 0.85, 0.8, 8, tint(C.stone, 0.8), 0, false, C.white); g.disc(3.5, 0.7, 0, 0.8, 8, [0.03, 0.035, 0.04], 0, true);
  const b = new Geo();
  b.box(0.5, 0, 0, 6.6, 0.26, 0.26, C.timberDark); b.box(-2.5, -0.1, 0, 0.9, 0.8, 0.8, C.stoneDark);
  b.beam([3.5, 0, 0], [3.5, -3.3, 0], 0.045, C.iron, 0, 3);
  movers.push({ g: b, mode: 2, at: [0, H, 0], sweep: 4.9 });
  return { g, movers, H, reach: 4.6, height: H + 1.7 };
}

// DRILL TRESTLE: three legs meeting high over a boring, braced twice; the drill rod twists in it with a capstan bar.
export function drillTrestle({ H = 10 } = {}) {
  const g = new Geo(), b = H * 0.27, movers = [], foot = [], lv = (f) => foot.map((p) => [p[0] * (1 - f), H * f, p[2] * (1 - f)]);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; foot.push([Math.cos(a) * b, 0, Math.sin(a) * b]); }
  for (const p of foot) g.beam(p, [p[0] * 0.04, H, p[2] * 0.04], 0.13, C.timber, 0, 4, 0.09);
  for (const f of [0.3, 0.62]) { const q = lv(f); for (let i = 0; i < 3; i++) g.beam(q[i], q[(i + 1) % 3], 0.06, C.timberDark, 0, 3); }
  g.box(0, H + 0.1, 0, 0.6, 0.5, 0.6, C.timberDark); g.cyl(0, 0, 0.35, 0, 0.6, 0.5, 6, C.stone);
  const r = new Geo();
  r.beam([0, 0.3, 0], [0, H - 0.2, 0], 0.07, C.iron, 0, 5); r.box(0, 1.5, 0, 3.6, 0.14, 0.14, C.timber); r.cyl(0, H * 0.55, H * 0.55 + 0.5, 0, 0.3, 0.3, 6, C.rope);
  movers.push({ g: r, mode: 3, at: [0, 0, 0], sweep: 1.9, tall: H });
  return { g, movers, H, reach: b + 0.2, height: H + 0.4 };
}

// TANK ON LEGS: a staved timber vat with two iron hoops on four long braced legs; water stands in it and runs down
// one leg. ONE MAKE, the same at every distance (the vat a round of eight, the legs prisms of three sides, the
// braces flat laths).
export function tankOnLegs({ H = 8, r = 1.5 } = {}) {
  const g = new Geo(), b = r + 0.15, t = r * 0.72, corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]], n = 8;
  for (const [sx, sz] of corners) g.beam([sx * b, 0, sz * b], [sx * t, H, sz * t], 0.1, C.timber, 0, 3, 0.08);
  for (let i = 0; i < 4; i++) {
    const a = corners[i], c = corners[(i + 1) % 4], at = (f, q) => { const w = b + (t - b) * f; return [q[0] * w, H * f, q[1] * w]; };
    g.strip(at(0.08, a), at(0.52, c), 0.06, C.timberDark); g.strip(at(0.52, a), at(0.96, c), 0.06, C.timberDark);
  }
  g.box(0, H + 0.08, 0, r * 2.1, 0.16, r * 2.1, C.timberDark);
  g.cyl(0, H + 0.16, H + 2.5, 0, r * 0.94, r, n, tint(C.timber, 0.9), 0, false, C.timber);
  for (const y of [0.6, 1.9]) g.cyl(0, H + y, H + y + 0.12, 0, r * 0.97 + 0.03, r * 0.98 + 0.03, n, C.iron);
  g.disc(0, H + 2.38, 0, r * 0.97, n, C.water, MAT.water, true);
  // the staves' ends: a rim with breadth (0.86 r to r), where a stork can stand
  g.disc(0, H + 2.5, 0, r, n, C.timber, 0, true, r * 0.86);
  g.quad([b * 0.86, H + 2.45, b * 0.78], [b * 0.78, H + 2.45, b * 0.86], [b + 0.08, 0.1, b + 0.14], [b + 0.14, 0.1, b + 0.08], tint(C.water, 0.8), MAT.water);
  return { g, movers: [], H, r, rimR: r * 0.9055, reach: b * 1.42 + 0.2, height: H + 2.5 };
}

// AQUEDUCT: one bay of a SLENDER arcade (along x from -5.5 to 5.5, the channel's lip at y 0): the running water between
// two light parapets, a thin string course under it, the wall down to the arch on both faces, the arch's ring of
// stones proud of the wall, its soffit, and half an impost at each end. The arch is high and wide: 4.9 m in radius,
// its crown 1.5 m under the lip, springing at y -6.4; the pier (arcadePier: a unit box the world stretches from the
// ground to the springing) is 1.2 m wide and takes it.
export function arcadeBay() {
  const g = new Geo(), hz = 0.5, ra = 4.9, yc = -6.4, n = 10, wall = tint(C.white, 0.86), ring = tint(C.stone, 1.05), soff = tint(C.stone, 0.62), L2 = 5.5;
  for (const sz of [-1, 1]) g.box(0, -0.16, sz * 0.5, 2 * L2, 0.32, 0.14, tint(C.white, 0.92), MAT.stone, 0, false);
  g.quad([-L2, -0.13, -0.43], [-L2, -0.13, 0.43], [L2, -0.13, 0.43], [L2, -0.13, -0.43], C.water, MAT.water);
  g.box(0, -0.42, 0, 2 * L2, 0.2, hz * 2 + 0.2, tint(C.stone, 0.95), MAT.stone, 0, true, false);
  for (let k = 0; k < n; k++) {
    const a0 = Math.PI * (1 - k / n), a1 = Math.PI * (1 - (k + 1) / n), x0 = Math.cos(a0) * ra, y0 = yc + Math.sin(a0) * ra, x1 = Math.cos(a1) * ra, y1 = yc + Math.sin(a1) * ra, ro = ra + 0.36;
    const X0 = Math.cos(a0) * ro, Y0 = yc + Math.sin(a0) * ro, X1 = Math.cos(a1) * ro, Y1 = yc + Math.sin(a1) * ro;
    for (const sz of [-1, 1]) {
      const z = sz * hz, zr = sz * (hz + 0.06), F = (q) => { if (sz > 0) g.quad(q[0], q[1], q[2], q[3], q[4], MAT.stone); else g.quad(q[3], q[2], q[1], q[0], q[4], MAT.stone); };
      F([[x0, y0, z], [x1, y1, z], [x1, -0.52, z], [x0, -0.52, z], wall]);
      F([[x0, y0, zr], [x1, y1, zr], [X1, Y1, zr], [X0, Y0, zr], ring]);
    }
    g.quad([x0, y0, -hz], [x0, y0, hz], [x1, y1, hz], [x1, y1, -hz], soff, MAT.stone);
  }
  for (const sx of [-1, 1]) {
    const xa = sx * ra, xb = sx * L2;
    g.quad([Math.min(xa, xb), yc, hz], [Math.max(xa, xb), yc, hz], [Math.max(xa, xb), -0.52, hz], [Math.min(xa, xb), -0.52, hz], wall, MAT.stone);
    g.quad([Math.max(xa, xb), yc, -hz], [Math.min(xa, xb), yc, -hz], [Math.min(xa, xb), -0.52, -hz], [Math.max(xa, xb), -0.52, -hz], wall, MAT.stone);
    g.box(sx * 5.2, yc - 0.13, 0, 0.66, 0.26, hz * 2 + 0.24, tint(C.stone, 0.98), MAT.stone, 0, true, false);
  }
  return { g, movers: [], span: 2 * L2, spring: yc - 0.26, width: hz * 2, ra, crown: yc + ra };
}
export function arcadePier() { const g = new Geo(); g.box(0, 0.5, 0, 1.2, 1, 1.1, tint(C.white, 0.84), MAT.stone, 0, false, false); return g; }

// WEATHERCOCK: a thin mast; on it an arrow with a painted cock that turns with the city's wind.
export function weathercock() {
  const g = new Geo(), v = new Geo();
  g.beam([0, 0, 0], [0, 1.9, 0], 0.045, C.iron, 0, 3);
  v.beamZ([-0.75, 0, 0], [0.75, 0, 0], 0.03, 0.02, C.iron); v.tri([0.75, 0, 0], [0.5, 0.14, 0], [0.5, -0.14, 0], C.red);
  v.tri([-0.75, 0, 0], [-0.35, 0.34, 0], [-0.3, 0, 0], C.red); v.quad([-0.2, 0.05, 0], [0.2, 0.05, 0], [0.26, 0.42, 0], [-0.16, 0.36, 0], C.red); v.tri([0.2, 0.3, 0], [0.42, 0.52, 0], [0.12, 0.58, 0], C.red);
  return { g, movers: [{ g: v, mode: 4, at: [0, 1.85, 0], sweep: 0.8 }], height: 2.5, reach: 0.8 };
}

// HOUSE: a unit box (x, z from -0.5 to 0.5, y from 0 to 1) with a flat roof inside a parapet; the world scales it.
// Its walls carry MAT.wall: the shader draws doors, windows and a dado in the wall's own metres.
export function houseGeo() {
  const g = new Geo(), w = C.white, roof = tint(C.white, 0.78), i = 0.44, py = 0.9;
  const v = (x, y, z) => [x, y, z];
  g.quad(v(-0.5, 0, 0.5), v(0.5, 0, 0.5), v(0.5, 1, 0.5), v(-0.5, 1, 0.5), w, MAT.wall); g.quad(v(0.5, 0, -0.5), v(-0.5, 0, -0.5), v(-0.5, 1, -0.5), v(0.5, 1, -0.5), w, MAT.wall);
  g.quad(v(0.5, 0, 0.5), v(0.5, 0, -0.5), v(0.5, 1, -0.5), v(0.5, 1, 0.5), w, MAT.wall); g.quad(v(-0.5, 0, -0.5), v(-0.5, 0, 0.5), v(-0.5, 1, 0.5), v(-0.5, 1, -0.5), w, MAT.wall);
  // the parapet's top, its inner faces, the roof
  g.quad(v(-0.5, 1, 0.5), v(0.5, 1, 0.5), v(i, 1, i), v(-i, 1, i), w); g.quad(v(0.5, 1, -0.5), v(-0.5, 1, -0.5), v(-i, 1, -i), v(i, 1, -i), w);
  g.quad(v(0.5, 1, 0.5), v(0.5, 1, -0.5), v(i, 1, -i), v(i, 1, i), w); g.quad(v(-0.5, 1, -0.5), v(-0.5, 1, 0.5), v(-i, 1, i), v(-i, 1, -i), w);
  const sh = tint(C.white, 0.6);
  g.quad(v(-i, py, i), v(i, py, i), v(i, 1, i), v(-i, 1, i), sh); g.quad(v(i, py, -i), v(-i, py, -i), v(-i, 1, -i), v(i, 1, -i), sh);
  g.quad(v(i, py, i), v(i, py, -i), v(i, 1, -i), v(i, 1, i), sh); g.quad(v(-i, py, -i), v(-i, py, i), v(-i, 1, i), v(-i, 1, -i), sh);
  g.quad(v(-i, py, i), v(i, py, i), v(i, py, -i), v(-i, py, -i), roof);
  return g;
}
// a whitewashed dome ON ITS OWN DRUM for some roofs (radius 1, the drum's foot at the origin: the drum 0.45 high, the
// dome 0.8 over it, a small finial)
export function domeGeo() {
  const g = new Geo(), n = 10, rings = 3, d = 0.45;
  g.cyl(0, 0, d, 0, 1.0, 1.0, n, tint(C.white, 0.9), 0, false, C.white); g.cyl(0, d, d + 0.06, 0, 1.06, 1.06, n, tint(C.stone, 1.0));
  for (let k = 0; k < rings; k++) { const a0 = k / rings * Math.PI / 2, a1 = (k + 1) / rings * Math.PI / 2; g.cyl(0, d + 0.06 + Math.sin(a0) * 0.8, d + 0.06 + Math.sin(a1) * 0.8, 0, Math.cos(a0), Math.max(Math.cos(a1), 0.02), n, C.white); }
  g.beam([0, d + 0.84, 0], [0, d + 1.1, 0], 0.05, C.stone, 0, 3, 0.02);
  return g;
}
// an awning over a door (the wall at x 0, the cloth coming out along +x, 3 m wide along z): a rail on the wall, two
// poles at its outer corners, and the cloth, which stirs about the rail in the wind (MODE 2)
export function awningGeo() {
  const g = new Geo(), c = new Geo(), wdt = 1.5, out = 1.6, yw = 2.9, yo = 2.3, cl = [1, 1, 1];
  g.beam([0.04, yw, -wdt], [0.04, yw, wdt], 0.05, C.timberDark, 0, 3);
  for (const z of [-wdt + 0.1, wdt - 0.1]) g.beam([out - 0.06, 0, z], [out - 0.06, yo + 0.05, z], 0.05, C.timber, 0, 3);
  for (let k = 0; k < 4; k++) {
    const z0 = -wdt + k * wdt / 2, z1 = z0 + wdt / 2, col = tint(cl, k % 2 ? 0.74 : 1);
    c.quad([0, 0, z0], [0, 0, z1], [out, yo - yw, z1], [out, yo - yw, z0], col, MAT.cloth);
    c.quad([out, yo - yw, z0], [out, yo - yw, z1], [out + 0.03, yo - yw - 0.32, z1], [out + 0.03, yo - yw - 0.32, z0], col, MAT.cloth);
  }
  return { g, movers: [{ g: c, mode: 2, at: [0, yw, 0], sweep: 1.9 }] };
}
// an outside stair up to a roof terrace (a unit: 1 wide along x, rising from y 0 to y 1 along z from -0.5 to 0.5): eight solid steps
export function stairGeo() {
  const g = new Geo(), n = 8;
  for (let i = 0; i < n; i++) g.box(0, (i + 1) / n / 2, -0.5 + (i + 0.5) / n, 1, (i + 1) / n, 1 / n, tint(C.white, i % 2 ? 0.86 : 0.94), 0, 0, false);
  return g;
}
// a small plain figure at a rope or a crank: a robe, a head without a face, two arms held out to the work
// (walk: a walker on the road, its front to +z: one arm down, one up to the jar it carries on its head; a round of trodden shade under it)
export function personGeo({ walk = false } = {}) {
  const g = new Geo();
  g.cyl(0, 0, 1.28, 0, 0.27, 0.17, 5, C.white); g.cyl(0, 1.3, 1.56, 0, 0.115, 0.1, 5, tint(C.clay, 0.75)); g.disc(0, 1.56, 0, 0.1, 5, tint(C.cloth, 0.9), 0, true);
  if (!walk) { g.beam([0.14, 1.18, 0], [0.2, 1.0, 0.5], 0.05, C.white, 0, 3); g.beam([-0.14, 1.18, 0], [-0.2, 1.0, 0.5], 0.05, C.white, 0, 3); return g; }
  g.beam([0.16, 1.2, 0], [0.22, 0.7, 0.06], 0.05, C.white, 0, 3); g.beam([-0.16, 1.2, 0], [-0.17, 1.66, 0.02], 0.05, C.white, 0, 3);
  g.cyl(0, 1.57, 1.95, 0, 0.1, 0.2, 5, tint(C.clay, 0.62), 0, false, tint(C.clay, 0.8)); g.disc(0, 1.95, 0, 0.12, 5, tint(C.clay, 0.3), 0, true);
  g.disc(0, 0.03, 0, 0.55, 6, [0.16, 0.13, 0.1], 0, true);
  return g;
}
// A LADEN DONKEY (its head toward +z, its feet on y 0) UNDER WATER JARS, slung two a side, and a folded cloth over
// them. No face is drawn on anything; a dark round of trodden shade under it.
export function beastGeo() {
  const g = new Geo(), hide = [0.27, 0.24, 0.21], dk = tint(hide, 0.7), L = 0.7, Hh = 1.05, w = 0.27;
  g.box(0, Hh, 0, w * 2, 0.52, L * 2, hide);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) g.beam([sx * w * 0.7, Hh - 0.2, sz * L * 0.82], [sx * w * 0.7, 0, sz * L * 0.86], 0.07, dk, 0, 3, 0.05);
  // the neck and the head (a plain wedge), the tail
  const nk = [0, Hh + 0.42, L + 0.3];
  g.beam([0, Hh + 0.1, L - 0.1], nk, 0.13, hide, 0, 4, 0.1); g.beam(nk, [0, nk[1] - 0.22, nk[2] + 0.36], 0.11, hide, 0, 4, 0.06);
  g.beam([0, Hh + 0.1, -L], [0, Hh - 0.5, -L - 0.12], 0.03, dk, 0, 3);
  // the load
  for (const sx of [-1, 1]) for (const dz of [-0.3, 0.26]) g.cyl(sx * (w + 0.24), Hh - 0.3, Hh + 0.34, dz, 0.13, 0.22, 5, tint(C.clay, 0.62), 0, false, tint(C.clay, 0.8));
  g.box(0, Hh + 0.36, -0.05, 0.9, 0.2, 0.9, tint(C.cloth, 0.8), MAT.cloth);
  g.disc(0, 0.03, 0, L + 0.5, 7, [0.16, 0.13, 0.1], 0, true);
  return g;
}
// washing on a roof: two poles 3.4 m apart with a line between them (along z); the cloths hang from the line and
// swing about it together in the wind (MODE 2, the pivot on the line)
export function washGeo() {
  const g = new Geo(), c = new Geo(), H = 1.9;
  for (const z of [-1.7, 1.7]) g.beam([0, 0, z], [0, H + 0.1, z], 0.045, C.timberDark, 0, 3);
  g.beam([0, H, -1.7], [0, H, 1.7], 0.012, C.rope, 0, 3);
  const cols = [C.white, tint(C.red, 0.9), [0.16, 0.32, 0.5], C.cloth, tint(C.ochre, 1.1)];
  let z = -1.45;
  for (let k = 0; k < 5; k++) { const w = 0.42 + 0.16 * ((k * 7) % 3), l = 0.7 + 0.25 * ((k * 5) % 3); c.quad([0, 0, z], [0, 0, z + w], [0.02, -l, z + w], [0.02, -l, z], cols[k], MAT.cloth); z += w + 0.12; }
  return { g, movers: [{ g: c, mode: 2, at: [0, H, 0], sweep: 1.4 }] };
}
// a stork standing on a tank's rim: white, black at the wing's end, red legs and bill; it stands as it was dealt
export function storkGeo() {
  const g = new Geo(), wh = [0.9, 0.9, 0.86], bk = [0.05, 0.05, 0.06], rd = tint(C.red, 0.95);
  for (const x of [-0.07, 0.07]) g.beam([x, 0, 0], [x, 0.62, 0.02], 0.018, rd, 0, 3);
  g.beam([0, 0.72, -0.34], [0, 0.82, 0.2], 0.17, wh, 0, 5, 0.13); g.beam([0, 0.66, -0.52], [0, 0.74, -0.3], 0.1, bk, 0, 4, 0.15);
  g.beam([0, 0.84, 0.16], [0, 1.22, 0.3], 0.055, wh, 0, 4, 0.05); g.beam([0, 1.2, 0.28], [0, 1.24, 0.4], 0.07, wh, 0, 4, 0.05);
  g.beam([0, 1.22, 0.38], [0, 1.12, 0.72], 0.03, rd, 0, 3, 0.008);
  return g;
}
// a fern on a wet wall: seven narrow drooping blades out of one root (the wall is at z = 0, the blades come out along +z)
export function fernGeo(rng) {
  const g = new Geo();
  for (let k = 0; k < 7; k++) {
    const a = (k - 3) * 0.36 + rng.range(-0.12, 0.12), l = rng.range(0.5, 0.9), w = 0.065, dx = Math.sin(a), dz = Math.cos(a), col = tint([0.2, 0.42, 0.1], rng.range(0.8, 1.3));
    const p0 = [0, 0, 0], p1 = [dx * l * 0.5, 0.26 * l, dz * l * 0.5], p2 = [dx * l * 0.85, 0.08 * l, dz * l * 0.85], p3 = [dx * l, -0.34 * l, dz * l], sx = dz * w, sz = -dx * w;
    g.quad([p0[0] - sx * 0.3, p0[1], p0[2] - sz * 0.3], [p0[0] + sx * 0.3, p0[1], p0[2] + sz * 0.3], [p1[0] + sx, p1[1], p1[2] + sz], [p1[0] - sx, p1[1], p1[2] - sz], col);
    g.quad([p1[0] - sx, p1[1], p1[2] - sz], [p1[0] + sx, p1[1], p1[2] + sz], [p2[0] + sx * 0.8, p2[1], p2[2] + sz * 0.8], [p2[0] - sx * 0.8, p2[1], p2[2] - sz * 0.8], col);
    g.tri([p2[0] - sx * 0.8, p2[1], p2[2] - sz * 0.8], [p2[0] + sx * 0.8, p2[1], p2[2] + sz * 0.8], p3, col);
  }
  return g;
}
// a pale rock: a twenty-sided ball pushed about by a seeded stream, flattened, its foot sunk
export function rockGeo(rng) {
  const g = new Geo(), ico = new THREE.IcosahedronGeometry(1, 1), pa = ico.getAttribute('position'), push = new Map();
  const P = (i) => {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = Math.round(x * 50) + ',' + Math.round(y * 50) + ',' + Math.round(z * 50);
    if (!push.has(k)) push.set(k, rng.range(0.72, 1.18));
    const s = push.get(k); return [x * s, y * s * 0.62 + 0.3, z * s];
  };
  for (let i = 0; i < pa.count; i += 3) { const a = P(i), b = P(i + 1), c = P(i + 2), k = 0.82 + 0.3 * ((a[1] + b[1] + c[1]) / 3); g.tri(a, b, c, tint(mixc(C.lime, C.rock, 0.35), Math.min(1.1, Math.max(0.6, k)))); }
  ico.dispose();
  return g;
}
// a chain wheel for the head frame: a rim and four spokes in its own xy plane
export function chainWheel(r = 0.6) {
  const g = new Geo(); g.rim(r, 10, 0.07, 0, C.timberDark, 0, 0.1);
  g.beamZ([-r, 0, 0], [r, 0, 0], 0.05, 0.05, C.timber); g.beamZ([0, -r, 0], [0, r, 0], 0.05, 0.05, C.timber);
  return g;
}

// ------------------------------------------------------------------ the gardens and the town's small things (standing parts; unit sizes, the world scales and tints them)
// a ball of n-gon facets about c (an icosahedron, its corners pushed in and out a little by k): a crown, a loaf, a heap
function blob(g, c, r, col, k = 0.12, sy = 1, m = 0) {
  const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const P = V.map((v, i) => { const l = Math.hypot(v[0], v[1], v[2]), q = r * (1 + k * (((i * 7) % 5) / 2 - 1)) / l; return [c[0] + v[0] * q, c[1] + v[1] * q * sy, c[2] + v[2] * q]; });
  F.forEach((f, i) => g.tri(P[f[0]], P[f[1]], P[f[2]], tint(col, 0.82 + 0.09 * (i % 5)), m));
}
// a vegetable bed, 1 by 1 in plan and its heights in metres: five mounded rows along z, each a ridge of tilled earth
// with a line of leaf heads on its crest (the world tints each bed's crop: the leaf is near white here)
export function bedGeo(n = 5, heads = 5) {
  const g = new Geo(), earth = [0.2, 0.125, 0.07], w = 0.38 / n;
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) / n - 0.5;
    g.quad([x - w, 0, 0.48], [x, 0.2, 0.46], [x, 0.2, -0.46], [x - w, 0, -0.48], earth); g.quad([x, 0.2, 0.46], [x + w, 0, 0.48], [x + w, 0, -0.48], [x, 0.2, -0.46], tint(earth, 0.8));
    for (let k = 0; k < heads; k++) {
      const z = (k + 0.5) / heads * 0.9 - 0.45 + 0.012 * ((i * 7 + k * 3) % 5 - 2), s = 0.34 / n, sz = 0.07, y = 0.16, top = [x, 0.37 + 0.05 * ((i + k * 2) % 3), z], c = [0.5 + 0.09 * ((i + k) % 3), 0.8 + 0.07 * ((i * 3 + k) % 3), 0.4];
      const A = [x - s * 1.15, y, z - sz * 1.2], B = [x + s * 1.15, y, z - sz * 1.2], D = [x, y, z + sz * 1.5];
      g.tri(A, top, B, c); g.tri(B, top, D, tint(c, 0.85)); g.tri(D, top, A, tint(c, 0.7));
    }
  }
  return g;
}
// a fruit tree (its own metres, about 3.6 m tall): a leaning trunk, a round crown, fruit as points of colour
export function fruitTree(rng, fruit = [0.9, 0.42, 0.08]) {
  const g = new Geo(), bark = [0.2, 0.15, 0.1], lx = rng.range(-0.3, 0.3), lz = rng.range(-0.3, 0.3), top = [lx, 1.9, lz];
  g.beam([0, 0, 0], top, 0.13, bark, 0, 5, 0.08);
  blob(g, [lx, 2.7, lz], 1.2, [0.1, 0.25, 0.07], 0.2, 0.85); blob(g, [lx + rng.range(-0.6, 0.6), 3.2, lz + rng.range(-0.6, 0.6)], 0.85, [0.14, 0.32, 0.09], 0.2, 0.8);
  for (let k = 0; k < 7; k++) { const a = rng.range(0, TAU), el = rng.range(-0.35, 0.6), r = 1.2, c = [lx + Math.cos(a) * Math.cos(el) * r, 2.7 + Math.sin(el) * r * 0.85, lz + Math.sin(a) * Math.cos(el) * r], s = 0.16;
    const E = [[c[0] + s, c[1], c[2]], [c[0] - s * 0.5, c[1], c[2] + s * 0.87], [c[0] - s * 0.5, c[1], c[2] - s * 0.87]], up = [c[0], c[1] + s * 1.2, c[2]], dn = [c[0], c[1] - s * 1.2, c[2]];
    for (let e = 0; e < 3; e++) { g.tri(E[e], up, E[(e + 1) % 3], fruit); g.tri(E[(e + 1) % 3], dn, E[e], tint(fruit, 0.7)); } }
  return g;
}
// a vine trellis, 1 by 1 in plan and its heights in metres: four posts, a frame, the vine's leaf lying over it in
// uneven panels (each its own green), bunches hanging under
export function trellisGeo() {
  const g = new Geo(), tim = tint(C.timberDark, 0.9), H = 2.3;
  for (const [x, z] of [[-0.46, -0.46], [0.46, -0.46], [0.46, 0.46], [-0.46, 0.46]]) g.beam([x, 0, z], [x, H, z], 0.05, tim);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const x0 = -0.5 + i / 3, x1 = x0 + 1 / 3, z0 = -0.5 + j / 2, z1 = z0 + 0.5, y = H + 0.05 + 0.1 * ((i + j) % 2), c = [0.16 + 0.06 * ((i * 2 + j) % 3), 0.4 + 0.07 * ((i + j * 2) % 3), 0.1];
    g.quad([x0 + 0.02, y, z1 - 0.02], [x1 - 0.02, y + 0.06, z1 - 0.02], [x1 - 0.02, y, z0 + 0.02], [x0 + 0.02, y + 0.06, z0 + 0.02], c, MAT.cloth);
    g.tri([x0 + 0.1, y - 0.05, z0 + 0.2], [x0 + 0.2, y - 0.05, z0 + 0.25], [x0 + 0.15, y - 0.5, z0 + 0.22], [0.3, 0.1, 0.34], MAT.cloth);
  }
  return g;
}
// a small tiled pool, 1 by 1 in plan and its heights in metres: a kerb of glazed tile, bright moving water in it
export function poolGeo() {
  const g = new Geo(), tile = [0.45, 0.72, 0.78], pale = tint(C.white, 0.95);
  g.box(0, 0.16, 0, 1, 0.32, 1, pale, 0, 0, false, false);
  g.quad([-0.5, 0.32, 0.5], [0.5, 0.32, 0.5], [0.42, 0.32, 0.42], [-0.42, 0.32, 0.42], tile); g.quad([0.5, 0.32, 0.5], [0.5, 0.32, -0.5], [0.42, 0.32, -0.42], [0.42, 0.32, 0.42], tint(tile, 0.85));
  g.quad([0.5, 0.32, -0.5], [-0.5, 0.32, -0.5], [-0.42, 0.32, -0.42], [0.42, 0.32, -0.42], tile); g.quad([-0.5, 0.32, -0.5], [-0.5, 0.32, 0.5], [-0.42, 0.32, 0.42], [-0.42, 0.32, -0.42], tint(tile, 0.85));
  g.quad([-0.42, 0.24, 0.42], [0.42, 0.24, 0.42], [0.42, 0.24, -0.42], [-0.42, 0.24, -0.42], tint(C.water, 1.1), MAT.water);
  return g;
}
// a garden wall of mud brick, 1 long (x) and its height and thickness in metres, its top weathered pale
export function wallGeo() { const g = new Geo(); g.box(0, 0.65, 0, 1, 1.3, 0.42, tint(C.ochre, 0.8), 0, 0, false); g.box(0, 1.34, 0, 1, 0.1, 0.5, tint(C.white, 0.8), 0, 0, false); return g; }
// water jars and a basket standing together (their own metres): three jars of fired clay, one basket of reed
export function jarsGeo() {
  const g = new Geo(), jar = (x, z, k, col) => { g.cyl(x, 0, 0.55 * k, z, 0.2 * k, 0.42 * k, 6, col); g.cyl(x, 0.55 * k, 1.0 * k, z, 0.42 * k, 0.17 * k, 6, tint(col, 0.9)); };
  jar(0, 0, 1.1, C.clay); jar(0.8, 0.25, 0.85, tint(C.clay, 0.8)); jar(0.3, 0.8, 0.95, tint(C.clay, 1.15));
  g.cyl(-0.7, 0, 0.42, 0.45, 0.3, 0.42, 6, [0.5, 0.4, 0.2]); g.disc(-0.7, 0.36, 0.45, 0.4, 6, [0.72, 0.5, 0.14]);
  return g;
}
// a dovecote (its own metres, 4.2 m tall): a round whitewashed tower, one ring of four tall plain openings, a cap
export function dovecoteGeo() {
  const g = new Geo(), wh = tint(C.white, 0.95);
  g.cyl(0, 0, 3.2, 0, 1.0, 0.85, 8, tint(wh, 0.85), 0, false, wh); g.cyl(0, 3.2, 3.35, 0, 1.0, 1.0, 8, wh); g.cyl(0, 3.35, 4.2, 0, 0.9, 0.08, 8, tint(wh, 0.9));
  for (let k = 0; k < 4; k++) { const y = 1.75, a = (2 * k + 0.5) / 8 * TAU, r0 = 0.862, r1 = 0.824, c = Math.cos(a), s = Math.sin(a), px = -s * 0.17, pz = c * 0.17;
    g.quad([c * r0 - px, y, s * r0 - pz], [c * r0 + px, y, s * r0 + pz], [c * r1 + px, y + 0.85, s * r1 + pz], [c * r1 - px, y + 0.85, s * r1 - pz], [0.03, 0.03, 0.035]); }
  return g;
}
// a market stall (its own metres): four posts, a cloth roof pitched to the front (white here: the world tints it), a board with wares, two baskets
export function stallGeo() {
  const g = new Geo(), tim = tint(C.timberDark, 0.9);
  for (const [x, z, h] of [[-1.3, -0.9, 2.5], [1.3, -0.9, 2.5], [1.3, 0.9, 2.0], [-1.3, 0.9, 2.0]]) g.beam([x, 0, z], [x, h, z], 0.05, tim);
  g.quad([-1.5, 2.55, -1.05], [-1.5, 1.95, 1.2], [1.5, 1.95, 1.2], [1.5, 2.55, -1.05], [1, 1, 1], MAT.cloth);
  g.box(0, 0.85, 0.1, 2.4, 0.08, 1.1, tim, 0, 0, false); g.box(-0.6, 0.45, 0.1, 0.1, 0.8, 0.9, tim, 0, 0, false, false); g.box(0.6, 0.45, 0.1, 0.1, 0.8, 0.9, tim, 0, 0, false, false);
  blob(g, [-0.7, 1.05, 0.1], 0.3, [0.8, 0.35, 0.1], 0.2, 0.6); blob(g, [0.1, 1.02, 0.2], 0.27, [0.35, 0.5, 0.12], 0.2, 0.6); blob(g, [0.8, 1.04, 0.0], 0.28, [0.75, 0.6, 0.2], 0.2, 0.6);
  return g;
}
// a small well (its own metres): a kerb of whitewashed stone about a narrow dark bore, a post with a pulley arm, the
// rope and its pail at the kerb. ONE MAKE, the same at every distance (the kerb a round of six; the rope a flat cord).
export function smallWell() {
  const g = new Geo(), wh = tint(C.white, 0.9), tim = tint(C.timberDark, 0.9);
  g.cyl(0, 0, 0.6, 0, 0.66, 0.58, 6, tint(wh, 0.8), 0, false, wh); g.disc(0, 0.6, 0, 0.58, 6, wh, 0, true, 0.3); g.quad([-0.4, 0.45, -0.4], [-0.4, 0.45, 0.4], [0.4, 0.45, 0.4], [0.4, 0.45, -0.4], [0.02, 0.025, 0.03]);
  g.beam([0.52, 0, 0], [0.52, 2.3, 0], 0.07, tim, 0, 3); g.beam([0.6, 2.15, 0], [-0.1, 2.4, 0], 0.05, tim, 0, 3); g.strip([0, 2.35, 0], [0, 0.95, 0], 0.025, C.rope);
  g.cyl(0, 0.62, 0.95, 0, 0.13, 0.17, 4, tint(C.timber, 0.8));
  return g;
}
// what a small well shows under the rock: its bore's end in the roof, a point of daylight (a unit disc facing down)
export function boreSpot() { const g = new Geo(); g.disc(0, 0, 0, 1, 5, tint(C.day, 1), MAT.daylit, false); return g; }

// ------------------------------------------------------------------ the wells: one to a cell of a 9 m lattice (WELL.cell), as far as the lake reaches
// Each cell deals its well's place in the cell, its bore, its bucket's phase and its chance; a well stands where the
// lake is under it (thinning toward the shore) and where keep(well) allows (the world keeps its lanes with it).
// Every cell draws the same count, so a dropped well changes no other. Places are kept to the 8 bits the lake's
// shader reads them at, so the disc on the water lies under the mouth in the roof and under the well head above.
// WELLS DIFFER BY KIND, as the quarter of the city over them gives (kindAt(x, z), by place): 0 a narrow house well (a
// needle of light), 1 a yard well, 2 a broad public well, 3 a cistern's round mouth. Each kind has its own bore and its
// own share of cells that hold a well, so the shafts below stand thick in one quarter and few in another.
// (async: o.yield, if given, is awaited every row of cells, so no step of the build is long.)
// o.thin thins them all (the visit's density); o.boost(x, z) multiplies the share at a place; o.sure(x, z) is a place whose cell always holds its well.
export const WELL = { cell: 9, jitter: 2.8, rMax: 3.6, periodOf: (b) => 30 + 16 * ((b * 37) % 255) / 255,
  bore: [[0.3, 0.5], [0.62, 1.0], [1.5, 2.1], [2.6, 3.3]], share: [0.86, 0.62, 0.34, 0.2] };
export async function dealWells(lake, rng, o = {}) {
  const cell = WELL.cell, [bx0, bz0, bx1, bz1] = lake.bounds, x0 = Math.floor(bx0 / cell - 1) * cell, z0 = Math.floor(bz0 / cell - 1) * cell;
  const nx = Math.ceil((bx1 - x0) / cell) + 1, nz = Math.ceil((bz1 - z0) / cell) + 1, data = new Uint8Array(nx * nz * 4), wells = [];
  const set = (w, qx, qz, qr, qp) => { const k = (w.j * nx + w.i) * 4; data[k] = qx; data[k + 1] = qz; data[k + 2] = qr; data[k + 3] = qp; wells.push(w); };
  // (o.plant, [{ x, z, kind }]: wells the plan itself sets. Each takes the cell its place lies in: the cell makes its
  //  draws as ever, and its well stands at the planted place, moved into the cell's own range where it must be, of the
  //  planted kind, for sure; the roof's and the world's own tests still hold for it)
  const plant = new Map();
  for (const q of o.plant || []) { const i = Math.floor((q.x - x0) / cell), j = Math.floor((q.z - z0) / cell); if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
    const to8 = (v, c) => Math.min(255, Math.max(0, Math.round(((v - c) / (2 * WELL.jitter) + 0.5) * 255)));
    plant.set(j * nx + i, { qx: to8(q.x, x0 + (i + 0.5) * cell), qz: to8(q.z, z0 + (j + 0.5) * cell), kind: q.kind }); }
  for (let j = 0; j < nz; j++) { if (o.yield) await o.yield(); for (let i = 0; i < nx; i++) {
    let qx = Math.round(rng() * 255), qz = Math.round(rng() * 255); const ur = rng(), qp = Math.round(rng() * 254), ch = rng(), pl = plant.get(j * nx + i);
    if (pl) { qx = pl.qx; qz = pl.qz; }
    const x = x0 + (i + 0.5) * cell + (qx / 255 - 0.5) * 2 * WELL.jitter, z = z0 + (j + 0.5) * cell + (qz / 255 - 0.5) * 2 * WELL.jitter;
    const d = -lake.dist(x, z); if (d < 9) continue;
    let kind = o.kindAt ? o.kindAt(x, z) : 1; if (kind < 0) continue; if (pl) kind = pl.kind;
    const b = WELL.bore[kind], qr = Math.round((b[0] + (b[1] - b[0]) * ur) / WELL.rMax * 255), r = qr / 255 * WELL.rMax;
    const sure = !!pl || (o.sure && o.sure(x, z)), boost = o.boost ? o.boost(x, z) : 1;
    if (!sure && ch > WELL.share[kind] * boost * (0.45 + 0.55 * Math.min(1, (d - 9) / 40)) * (o.thin ?? 1)) continue;
    const w = { x, z, r, i, j, d, kind, phase: qp / 255, period: WELL.periodOf(qp), topY: 2.6, planted: pl ? 1 : 0 };
    if (o.keep && !o.keep(w)) continue;
    set(w, qx, qz, qr, w.bare ? 255 : qp);
  } }
  return { wells, grid: { x0, z0, cell, nx, nz, data } };
}

// THE ROCK'S OWN FORM (all by place). The roof over the water, in metres over the water's level, at (x, z). G gives
// the hall's plan: W the great well, o the nave's head, n along the nave to the quay, p across it (a = metres along the
// nave from its head, c = metres across), D its length, nave { half, bay, a0, a1 }, dome { a, r, h }, chamber { r, h }, cave, piers.
//  - the halls: about 13 m, heaving slowly;
//  - THE GREAT WELL'S CHAMBER (G.chamber): a round dome about the great well's axis, rising h from the chamber's rim
//    (r) to its middle (the bell of the great shaft opens through its crown);
//  - THE NAVE'S ROOF: between the two rows of piers the roof rises, most along the nave's middle, by 0.9 to 3.1 m as
//    the rock's own slow heave gives along its length (no rib repeats: the roof sags to each pier where it stands);
//  - the great dome over the landing (G.dome: a, r, h);
//  - A SIDE CAVE off the nave (G.cave: x, z, r, h, where the hall has one): a round rise of the roof to one hand of the nave;
//  - the shore: the roof comes down to the beach as a wall (the lake's shore is the city's edge above: ONE curve, makeLake).
// The great piers are rock columns of their own (pierGeo); the roof only sags to them.
// THE GREAT WELL'S UNEVEN LIP (lipIn): how far inside its round the first great shaft's bell's foot stands at a
// bearing (th, radians about the shaft's axis; L, three measures in metres: the mean and two waves' reach). The world
// sets the foot's 48 corners by it and the roof's shader (uLip) writes the same 48 corners and cuts the roof along
// the straight spans between them: one line, written twice.
export const lipIn = (th, L) => L ? L[0] + L[1] * Math.sin(5 * th + 1.3) + L[2] * Math.sin(11 * th + 4.1) : 0;
// THE ROOF'S LATTICE (roofLines): the lines the roof is drawn on, 4 m apart one way and 3.2 m the other, from 12 m
// outside the lake's box (fine: a box in x and z where the lines would stand three times as close one way and twice
// the other; no world gives one now. As its empty default is written, the one cell that begins within 3 m short of
// x 0 is still cut in three and the one that begins within 2.2 m short of z 0 in two: kept as it was).
export function roofLines(lake, fine = { x: [1, 0], z: [1, 0] }) {
  const [bx0, bz0, bx1, bz1] = lake.bounds;
  const lines = (lo, hi, step, f, sub) => { const out = []; for (let v = lo; v < hi + step; v += step) { out.push(v); if (v + step > f[0] && v < f[1]) for (let k = 1; k < sub; k++) out.push(v + step * k / sub); } return out; };
  return { xs: lines(bx0 - 12, bx1 + 12, 4, fine.x, 3), zs: lines(bz0 - 12, bz1 + 12, 3.2, fine.z, 2) };
}
// THE ROOF AS DRAWN (roofDrawn): the height over the water of the roof's own drawn sheet at a place: the plane of
// the lattice's triangle the place lies in (each cell is cut from its first corner to the opposite one), which
// differs from the smooth law roofH by up to some tenths of a metre between the lines. The world hangs the great
// well's bell's foot under it. kinks(x0, z0, x1, z1): the shares (0 to 1, the two ends with them) of a straight
// stretch at which the drawn sheet changes plane: between two of them it is one plane.
export function roofDrawn(lake, roofH, fine) {
  const { xs, zs } = roofLines(lake, fine), memo = new Map();
  const cell = (L, v) => { let lo = 0, hi = L.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (L[m] <= v) lo = m; else hi = m - 1; } return lo; };
  const node = (i, j) => { const k = i * 65536 + j; let h = memo.get(k); if (h === undefined) memo.set(k, h = Math.fround(Math.max(roofH(xs[i], zs[j]), -2.5))); return h; };
  const f = (x, z) => {
    const i = cell(xs, x), j = cell(zs, z), u = (x - xs[i]) / (xs[i + 1] - xs[i]), v = (z - zs[j]) / (zs[j + 1] - zs[j]), a = node(i, j), c = node(i + 1, j + 1);
    return v <= u ? a + u * (node(i + 1, j) - a) + v * (c - node(i + 1, j)) : a + u * (c - node(i, j + 1)) + v * (node(i, j + 1) - a);
  };
  f.kinks = (x0, z0, x1, z1) => {
    const ts = [0, 1], cross = (L, p0, p1) => { if (p0 === p1) return; const lo = Math.min(p0, p1), hi = Math.max(p0, p1); for (let m = cell(L, lo); m < L.length && L[m] <= hi; m++) if (L[m] >= lo) ts.push((L[m] - p0) / (p1 - p0)); };
    cross(xs, x0, x1); cross(zs, z0, z1); ts.sort((p, q) => p - q);
    // (and each cell's own cut, corner to corner, where the stretch crosses it)
    for (let q = ts.length - 1; q > 0; q--) {
      const tm = (ts[q - 1] + ts[q]) / 2, i = cell(xs, x0 + (x1 - x0) * tm), j = cell(zs, z0 + (z1 - z0) * tm);
      const w = (t) => (x0 + (x1 - x0) * t - xs[i]) / (xs[i + 1] - xs[i]) - (z0 + (z1 - z0) * t - zs[j]) / (zs[j + 1] - zs[j]), w0 = w(ts[q - 1]), w1 = w(ts[q]);
      if (w0 * w1 < 0) ts.splice(q, 0, ts[q - 1] + (ts[q] - ts[q - 1]) * w0 / (w0 - w1));
    }
    return ts;
  };
  // low(cx, cz, R): THE LOWEST THE DRAWN SHEET STANDS WITHIN R METRES OF A PLACE, and where: [height over the water,
  // x, z]. EXACT, no step: the sheet is flat triangles, so its lowest within a round lies at a lattice corner inside
  // the round, or on the round itself: where the round crosses a triangle's side, or where a triangle's own plane is
  // lowest on the round (the place on the round straight down its slope, if that place lies in that triangle). All
  // three are read for every triangle the round touches: no lower place can be missed.
  // (from, to: the share of the round's rows of cells to read, 0 to 1 the whole: a caller that hands back between reads takes the lowest of its parts)
  f.low = (cx, cz, R, from = 0, to = 1) => {
    let b = [1e9, cx, cz]; const take = (h, x, z) => { if (h < b[0]) b = [h, x, z]; }, R2 = R * R;
    const tri = (P, Q, S) => {
      const C = [P, Q, S];
      for (const p of C) if ((p[0] - cx) ** 2 + (p[1] - cz) ** 2 <= R2) take(p[2], p[0], p[1]);
      for (let e = 0; e < 3; e++) { const p = C[e], q = C[(e + 1) % 3], dx = q[0] - p[0], dz = q[1] - p[1], fx = p[0] - cx, fz = p[1] - cz;
        const A = dx * dx + dz * dz, B = 2 * (fx * dx + fz * dz), D = B * B - 4 * A * (fx * fx + fz * fz - R2); if (D < 0) continue;
        const sq = Math.sqrt(D); for (const t of [(-B - sq) / (2 * A), (-B + sq) / (2 * A)]) if (t >= 0 && t <= 1) take(p[2] + (q[2] - p[2]) * t, p[0] + dx * t, p[1] + dz * t); }
      const ux = Q[0] - P[0], uz = Q[1] - P[1], uh = Q[2] - P[2], vx = S[0] - P[0], vz = S[1] - P[1], vh = S[2] - P[2], det = ux * vz - uz * vx;
      const gx = (uh * vz - vh * uz) / det, gz = (ux * vh - vx * uh) / det, gl = Math.hypot(gx, gz); if (gl < 1e-12) return;
      const x = cx - R * gx / gl, z = cz - R * gz / gl, a = ((x - P[0]) * vz - (z - P[1]) * vx) / det, c = (ux * (z - P[1]) - uz * (x - P[0])) / det;
      if (a >= 0 && c >= 0 && a + c <= 1) take(P[2] + a * uh + c * vh, x, z);
    };
    const jA = cell(zs, cz - R), jN = cell(zs, cz + R) - jA + 1;
    for (let j = jA + Math.floor(jN * from); j < jA + Math.floor(jN * to); j++) for (let i = cell(xs, cx - R); i <= cell(xs, cx + R); i++) {
      // (a cell that lies wholly outside the round is not read)
      const nx = Math.min(Math.max(cx, xs[i]), xs[i + 1]), nz = Math.min(Math.max(cz, zs[j]), zs[j + 1]); if ((nx - cx) ** 2 + (nz - cz) ** 2 > R2) continue;
      const A = [xs[i], zs[j], node(i, j)], C = [xs[i + 1], zs[j + 1], node(i + 1, j + 1)];
      tri(A, [xs[i + 1], zs[j], node(i + 1, j)], C); tri(A, C, [xs[i], zs[j + 1], node(i, j + 1)]);
    }
    return b;
  };
  return f;
}
// THE REACH OF THE GREAT WELL'S LIP (P1): the metres from the great well's axis within which the roof's drawn sheet
// is read for its lowest place: THE ONE HEIGHT (H0; lipForm, below). ONE NUMBER, held here and nowhere else in the
// lip's law: 28, THE BELL'S OWN ROUND (27 m) AND ONE METRE: the one height is the lowest the roof's drawn under
// side stands along the bell's own cut. NO PLACE OF THE FOOT'S LINE STANDS OVER THE ONE HEIGHT, AND THE LINE IS NOT
// LEVEL: the corners' feet stand at the one height less their hang, or 1 m under their foot ring where that is
// lower (the least depth is 1.0 m on every seed: the lip is a rim one metre deep on the roof's low side, and deep
// on its high side only); between two corners the line waves down by up to 0.69 m and follows the roof down where
// the skin outside would stand lower, by up to 1.41 m; at its lowest place the line stands 1.2 to 2.4 m under the
// one height (the counter's count, 300 seeds). (It is not the reach of the great shaft's light: the light's law
// of cure 1 has its own two measures, 40 and 56 m, written in the roof's shader, untouched.)
export const REACH = 28;
// THE GREAT WELL'S LIP (P1; lipForm): THE ROOF'S OWN ROCK HANGING FROM THE CUT EDGE ALONG ITS 48 SPANS, EASING TO
// NOUGHT UNDER THE ROOF. A law of the place, made once at the build; it reads no eye, seed or clock.
// o: { cx, cz, r (the bell's round), L (LIP), n (48), footY (the bell's foot ring, a height a corner), YW, roof (the
//      roof as drawn, roofDrawn), noise, lineAt(m) -> [x, y, z] (the flown line), ms ([[m0, m1]]: its stretches near) }
// THE ONE HEIGHT (H0) is the lowest the roof's drawn sheet stands within REACH of the axis (roof.low: exact), the
//   same all round, and no place of the foot's line stands over it (the foot's line itself is not level: below): no
//   eye in the bell that stands higher than the one height can look down on any roof within the reach
//   (the roof further out than the reach may stand lower: this law says nothing of it).
//   ROUGH ROCK: each corner's foot hangs under H0 by its own slow waves of the bearing (hang: nought to 0.6 m, 3 and
//   7 round, weighed by LIP's own two wave measures: no draw), never over it but where the line asks (the hold), and
//   never within a metre (FACE) of its own foot ring: on the roof's low side the lip is a rim one metre deep. Between
//   two corners the foot's line has five places more, which leave the straight span downward only (nought to 0.8 m
//   by the law, 0.69 m as the waves fall) and stand 0.02 to 0.08 m outside it in plan; and where the roof outside the
//   bell stands lower than the foot, the foot's line goes down with it (by up to 1.41 m on 300 seeds), so that it
//   never stands over the lip's own skin (the foot's line, below).
// THE INNER FACE goes down from the bell's foot ring (the same 48 corners) to the foot's line: THE BELL'S ROCK, and
//   the only part of the lip that is. It ends there in one edge.
// THE UNDER SIDE goes out from the foot's line, level there and turning upward, to 1.9 m outside the span (a rounded
//   rim, 1.82 to 1.88 m broad); THE OUTER SIDE climbs from its rim to the roof's drawn sheet 4 m (OUT) outside the
//   corners, steep at the foot and easing level under the roof (the height's share 1 - (1 - t)^2 at the share t of
//   the way out), on 96 places round and four rings between; its top edge follows the sheet's own lines (a place at
//   every change of the sheet's plane, 0.05 m over it: in the rock, no gap); the rings between are moved by the
//   rock's own noise of the place (no smooth cone). Under side and outer side are kept under the sheet AT EVERY
//   PLACE OF THE SKIN; BETWEEN PLACES WITHIN 2 MM ON 300 SEEDS (the counter: one face on seed 168 passes 0.002 m
//   over the drawn sheet at 2 of 1,891 fine places); where the sheet stands lower than the foot, they go down with
//   it. They are THE ROOF'S ROCK, one skin: the part lays them in the roof's own mesh.
export async function lipForm(o) {
  const TAU = Math.PI * 2, n = o.n, L = o.L, FACE = 1.0, OUT = 4, UP = 0.05, DS = 0.47, DL = Math.sqrt(1 - DS * DS), roofAt = (x, z) => o.YW + o.roof(x, z);
  // (o.rest: the build's hand-back; the lip is made in short steps of its own: the roof's lowest in eight reads, then the hold's parts)
  const rest = o.rest || (async () => {}), C = []; let low = [1e9, o.cx, o.cz];
  for (let q = 0; q < 8; q++) { const b = o.roof.low(o.cx, o.cz, REACH, q / 8, (q + 1) / 8); if (b[0] < low[0]) low = b; await rest(); }
  const H0 = o.YW + low[0];
  for (let k = 0; k < n; k++) { const th = k / n * TAU, c = Math.cos(th), s = Math.sin(th), rr = o.r - lipIn(th, L); C.push([o.cx + c * rr, o.cz + s * rr, c, s, rr]); }
  const hang = (th) => 0.3 * (1 + (L[1] * Math.sin(3 * th + 0.7) + L[2] * Math.sin(7 * th + 2.9)) / (L[1] + L[2]));
  // (F0: the foot as the place gives it; F: as it stands after the hold. A foot never comes within a metre of its own foot ring)
  const F0 = C.map((q, k) => Math.min(H0 - hang(k / n * TAU), o.footY[k] - FACE)), F = F0.slice();
  // THE FOOT'S LINE (P1, the lip at the bell's round): M - 1 places between every two corners (PL: NP places round).
  // A place leaves the straight span between its two corners DOWNWARD ONLY (dn: nought at a corner and level with
  // it there (the square of the sine of the span's share: no cusp at a corner), nought to 0.8 m between by the law,
  // 0.69 m as the waves fall: a slow and a finer wave of the bearing, 13 and 61 round, the finer the stronger: it
  // goes once and more across a span; finer still, the line reads as a saw's teeth) and stands OUTWARD of it in
  // plan (w: 0.02 to 0.08 m, 17 and 41 round, the slower the stronger: the roof's rock begins outside the roof's
  // own cut everywhere, and the inner face over the line hardly leans and is hardly twisted: a face of the bell's
  // rock that leans out by more than its stored direction, or is twisted from its span, is taken by the bell's
  // shader for its back from under it or from along the span, and lit pale: so the plan's wave is held this
  // small). Both waves are weighed by LIP's own two wave measures: no draw, no eye, no clock.
  // AND THE FOOT'S LINE NEVER STANDS OVER THE LIP'S OWN SKIN (low): where the roof's drawn sheet outside the bell
  // stands lower than the foot (the reach is the bell's round and a metre; the skin goes out 4 m and keeps under
  // the sheet), the place of the foot's line goes down to the lowest the skin is let stand along its own bearing
  // (the under side's three rings at the place; the outer side's four at the two half spans' bearings beside it,
  // and 0.05 m more for the rock's own noise there), so that the under side never falls outward from the foot's line
  // and nothing of the skin is seen over the foot's edge from within the bell. By the roof's own form: no draw.
  // (x0, z0: the place on the straight span; cr, sr: outward there; x, z: the foot's line; yT: the roof's drawn
  //  sheet OUT outside the span, and UP: the outer side's top)
  const M = 6, NP = n * M, BR = 1.9, L12 = L[1] + L[2], PL = [], TS = [0.2, 0.45, 0.7, 0.88], n2 = 2 * n, H = M / 2, UR = [1 / 3, 2 / 3, 1], capU = UR.map(() => new Float64Array(NP)), SR = new Float64Array(n2);
  // (the lowest of the drawn sheet at a place and 0.9 m from it on four sides: to keep the sheet from coming down through the faces between two places; it holds within 2 mm on 300 seeds)
  const under = (x, z) => Math.min(roofAt(x, z), roofAt(x + 0.9, z), roofAt(x - 0.9, z), roofAt(x, z + 0.9), roofAt(x, z - 0.9));
  const wav = (th, a, pa, wa, b, pb, wb) => 0.5 + 0.5 * (wa * Math.sin(a * th + pa) + wb * Math.sin(b * th + pb)) / L12;
  for (let i = 0; i < NP; i++) { const k = Math.floor(i / M), t = (i % M) / M, A = C[k], B = C[(k + 1) % n], th = (k + t) / n * TAU, cu = A[2] + (B[2] - A[2]) * t, su = A[3] + (B[3] - A[3]) * t, lr = Math.hypot(cu, su), cr = cu / lr, sr = su / lr;
    const x0 = A[0] + (B[0] - A[0]) * t, z0 = A[1] + (B[1] - A[1]) * t, w = 0.02 + 0.06 * wav(th, 17, 4.3, L[1], 41, 2.2, L[2]), dn = 0.8 * Math.sin(Math.PI * t) ** 2 * wav(th, 13, 1.9, L[2], 61, 0.4, L[1]);
    PL.push({ k, t, x0, z0, cr, sr, w, dn, x: x0 + cr * w, z: z0 + sr * w, yT: roofAt(x0 + cu * OUT, z0 + su * OUT) + UP, low: 1e9 });
    for (let g = 0; g < UR.length; g++) { const rho = w + (BR - w) * UR[g]; capU[g][i] = under(x0 + cr * rho, z0 + sr * rho) - 0.42; }
    if (i % H === 0) { let v = 1e9; for (const tt of TS) { const rho = BR + (OUT - BR) * tt; v = Math.min(v, under(x0 + cu * rho, z0 + su * rho) - 0.17 - 0.3 * (1 - tt)); } SR[i / H] = v; }
    if (i % M === M - 1) await rest(); }
  for (let i = 0; i < NP; i++) { const m = Math.floor(i / H); PL[i].low = Math.min(capU[0][i], capU[1][i], capU[2][i], SR[m], i % H ? SR[(m + 1) % n2] : 1e9); }
  // (the foot's height at a place: the straight line between its two corners' feet as they stand, or the lowest its skin is let stand (low) where that is lower; less its own dn: the line stays rough where the roof's form brings it down)
  const footAt = (i) => { const p = PL[i % NP]; return Math.min(F[p.k] + (F[(p.k + 1) % n] - F[p.k]) * p.t, p.low) - p.dn; };
  // THE BELL'S ROCK IS THE INNER FACE AND NO MORE: from the bell's foot ring (its 48 corners, the bell's own places:
  // no place of the lip stands on the ring between them) down to the foot's line, where it ends in ONE EDGE: the
  // bell's rock has no under side (its faces lean out over their foot by 11.7 degrees at the most on 300 seeds).
  // 7 triangles a span, 21 places. ITS STORED DIRECTION IS EACH FACE'S OWN: the level part of the face's own
  // direction (to the bell's inside), and DS down (0.47: the bell's shader takes a face whole as its flare from 0.45
  // down). THE BELL'S SHADER TURNS A STORED DIRECTION WHERE THE ANGLE BETWEEN IT AND THE SIGHT TO THE EYE PASSES 90
  // DEGREES, and a face so turned while it is seen is taken for its back (lit as the shaft's pale bore): THAT ANGLE
  // IS THE TRUE MEASURE. From under a face (the hall, the mouth) it cannot pass 90 while the face is seen, as long
  // as the face leans out over its foot by less than the stored 28 degrees. From over it, a sight square to the
  // face in plan may be as steep as 62 degrees; TO THE SIDE THE LIMIT FALLS. COUNTED BY THE COUNTER on the form as
  // frozen (p1l): on 300 seeds, an eye every 0.5 m of the route, the greatest angle of a face that is seen is 89.13
  // degrees; at every flown frame of the 42 worst seeds 89.26 (seed 228, the lens in the plumb shaft): 0.74 OF A
  // DEGREE TO SPARE; within the windows as flown 87.27 (16 to 9 and 21 to 9), 88.36 (4 to 3), 86.33 (9 to 16 and
  // 9 to 20); the steepest sight of an inner face is 59.87 degrees (seed 172). No face is turned and seen on 300
  // seeds (the builder's count and the counter's). THE MARGIN IS THIN: A LATER CHANGE OF THE LINE OR OF A FACE'S
  // LEAN MUST COUNT THIS ANGLE AGAIN.
  const arris = (i) => { const p = PL[i % NP]; return [p.x, footAt(i), p.z]; };
  const bell = () => { const v = [], face = (k, a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let gx = uy * vz - uz * vy, gz = ux * vy - uy * vx; if (gx * (C[k][2] + C[(k + 1) % n][2]) + gz * (C[k][3] + C[(k + 1) % n][3]) > 0) { gx = -gx; gz = -gz; }
      const l = (Math.hypot(gx, gz) || 1) / DL; for (const q of [a, b, c]) v.push([q[0], q[1], q[2], gx / l, -DS, gz / l]); };
    for (let k = 0; k < n; k++) { const k1 = (k + 1) % n, A = [C[k][0], o.footY[k], C[k][1]], B = [C[k1][0], o.footY[k1], C[k1][1]], b = [];
      for (let j = 0; j <= M; j++) b.push(arris(k * M + j)); for (let j = 0; j < M; j++) face(k, j < M / 2 ? A : B, b[j], b[j + 1]); face(k, A, b[M / 2], B); } return v; };
  // THE UNDER SIDE AND THE OUTER SIDE ARE THE ROOF'S ROCK, ONE SKIN FROM THE FOOT'S LINE TO THE ROOF: the under side
  // goes out from the foot's line to BR (1.9 m outside the span: 1.82 to 1.88 m broad) on three strips of NP places,
  // LEVEL AT THE FOOT'S LINE AND TURNING UPWARD (the rise by the square of the share of the way out: a rounded rim),
  // and ends as steep as the outer side begins (rise: the outer side's first slope, 2 (D - rise) / (OUT - BR), met);
  // the outer side climbs from there to the sheet as built. All of it is kept under the sheet as drawn (under) at
  // every place of the skin; between places within 2 mm on 300 seeds.
  const outer = () => {
    const pos = [], tris = [], span = [], rings = [[]], rows = TS.map(() => []), topC = [], yR = new Float64Array(NP);
    const add = (x, y, z) => { pos.push(x, y, z); return pos.length / 3 - 1; }, tri = (k, a, b, c) => { tris.push(a, b, c); span.push(k); };
    for (let i = 0; i < NP; i++) { const p = PL[i]; rings[0].push(add(p.x, footAt(i), p.z)); }
    // (capU: a place's height under the sheet, read once with the foot's line: the under side's places do not move in plan with the hold)
    for (let g = 0; g < UR.length; g++) { const u = UR[g], R = []; rings.push(R);
      for (let i = 0; i < NP; i++) { const p = PL[i], ya = footAt(i), rho = p.w + (BR - p.w) * u, x = p.x0 + p.cr * rho, z = p.z0 + p.sr * rho, rise = (BR - p.w) * Math.max(p.yT - ya, 0) / (OUT - p.w);
        const y = Math.min(ya + rise * u * u, capU[g][i]); if (u === 1) yR[i] = y; R.push(add(x, y, z)); } }
    for (let i = 0; i < TS.length; i++) for (let m = 0; m < n2; m++) {
      const k = m >> 1, k1 = (k + 1) % n, h = (m & 1) / 2, A = C[k], B = C[k1], t = TS[i], rho = BR + (OUT - BR) * t, mix = (a, b) => a + (b - a) * h;
      let x = mix(A[0] + A[2] * rho, B[0] + B[2] * rho), z = mix(A[1] + A[3] * rho, B[1] + B[3] * rho), cr = mix(A[2], B[2]), sr = mix(A[3], B[3]); const lr = Math.hypot(cr, sr);
      const y0 = yR[m * H], deep = Math.max(PL[m * H].yT - y0, 0);
      // (the rock's own unevenness at the place: nought at the rim and at the top, less on a shallow lip)
      const w = Math.sin(Math.PI * t) * Math.min(1, deep / 3), dr = 0.42 * w * o.noise.n2(x * 0.21 + 5, z * 0.21 + 9), dy = 0.3 * w * o.noise.n2(x * 0.47 + 31, z * 0.47 + 17);
      x += cr / lr * dr; z += sr / lr * dr;
      // (kept under the sheet, and nearer under it the further out; where the sheet stands lower than the rim the skin goes down with it)
      rows[i].push(add(x, Math.min(y0 + deep * (1 - (1 - t) * (1 - t)) + dy, under(x, z) - 0.12 - 0.3 * (1 - t)), z));
    }
    for (let k = 0; k < n; k++) { const q = C[k], x = q[0] + q[2] * OUT, z = q[1] + q[3] * OUT; topC.push(add(x, roofAt(x, z) + UP, z)); }
    for (let k = 0; k < n; k++) {
      const k1 = (k + 1) % n, rim = rings[UR.length];
      // (the under side's three strips, a place at a time; then the rim's three places to a half span meet the first ring's one: four faces)
      for (let g = 0; g < UR.length; g++) for (let i = k * M; i < k * M + M; i++) { const i1 = (i + 1) % NP, a = rings[g], b = rings[g + 1]; tri(k, a[i], b[i], b[i1]); tri(k, a[i], b[i1], a[i1]); }
      for (const m of [2 * k, 2 * k + 1]) { const r = [0, 1, 2, 3].map((d) => rim[(m * H + d) % NP]), a = rows[0][m], b = rows[0][(m + 1) % n2]; tri(k, r[0], a, r[1]); tri(k, r[1], a, b); tri(k, r[1], b, r[2]); tri(k, r[2], b, r[3]); }
      for (let i = 0; i + 1 < TS.length; i++) for (const m of [2 * k, 2 * k + 1]) { const m1 = (m + 1) % n2, p = rows[i], q = rows[i + 1]; tri(k, p[m], q[m], q[m1]); tri(k, p[m], q[m1], p[m1]); }
      // (the top: the sheet's own lines along the straight stretch between the two top corners)
      const A = C[k], B = C[k1], x0 = A[0] + A[2] * OUT, z0 = A[1] + A[3] * OUT, x1 = B[0] + B[2] * OUT, z1 = B[1] + B[3] * OUT, ts = [0], q = [topC[k]];
      for (const t of o.roof.kinks(x0, z0, x1, z1)) if (t > ts[ts.length - 1] + 2e-3 && t < 1 - 2e-3) { const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; ts.push(t); q.push(add(x, roofAt(x, z) + UP, z)); }
      ts.push(1); q.push(topC[k1]);
      const b = [rows[3][2 * k], rows[3][2 * k + 1], rows[3][(2 * k + 2) % n2]]; let cur = 0;
      for (let i = 0; i + 1 < q.length; i++) { const tm = (ts[i] + ts[i + 1]) / 2, want = tm < 1 / 3 ? 0 : tm < 2 / 3 ? 1 : 2; while (cur < want) { tri(k, b[cur], q[i], b[cur + 1]); cur++; } tri(k, b[cur], q[i], q[i + 1]); }
      while (cur < 2) { tri(k, b[cur], q[q.length - 1], b[cur + 1]); cur++; }
    }
    return { pos, tris, span };
  };
  return lipForm2(o, { C, F0, F, H0, low, FACE, STOP: 0.65, OUT, BR, M, PL, footAt, bell, outer, rest });
}
// (the lip's second half: THE AIR TO THE FLOWN LINE and the hold; the outer side's stored directions; the ground)
// THE HOLD: no part of the lip's body (the inner face and the skin: under side, outer side, top strip: its own
//   triangles; the form has no foot of its own) stands nearer than 2.0 m
//   (AIR) to any place of the flown line: the line is read every 0.2 m along the stretches given, and, where that
//   reading finds under 2.15 m, again every 0.02 m and then 0.005 m for half a metre either side of the place of
//   least air (a finer reading cannot find over 0.1 m less than the first); where a span's body would stand
//   nearer, the FOOT'S HEIGHT at its two corners is raised by what lacks (and 2 mm), again until none lacks: the
//   two spans beside it lean back to the foot as the place gave it. By the line's own places: no eye, seed or clock.
async function lipForm2(o, f) {
  const { C, F0, F, OUT } = f, n = o.n, TAU = Math.PI * 2, AIR = 2.0;
  // (the metres from a place to a triangle [a, b, c]: to the nearest place of the triangle; written flat, no helper made a call)
  const dTri = (px, py, pz, t) => {
    const abx = t[3] - t[0], aby = t[4] - t[1], abz = t[5] - t[2], acx = t[6] - t[0], acy = t[7] - t[1], acz = t[8] - t[2];
    let x = px - t[0], y = py - t[1], z = pz - t[2];
    const d1 = abx * x + aby * y + abz * z, d2 = acx * x + acy * y + acz * z; if (d1 <= 0 && d2 <= 0) return Math.sqrt(x * x + y * y + z * z);
    x = px - t[3]; y = py - t[4]; z = pz - t[5];
    const d3 = abx * x + aby * y + abz * z, d4 = acx * x + acy * y + acz * z; if (d3 >= 0 && d4 <= d3) return Math.sqrt(x * x + y * y + z * z);
    x = px - t[6]; y = py - t[7]; z = pz - t[8];
    const d5 = abx * x + aby * y + abz * z, d6 = acx * x + acy * y + acz * z; if (d6 >= 0 && d5 <= d6) return Math.sqrt(x * x + y * y + z * z);
    const vc = d1 * d4 - d3 * d2, vb = d5 * d2 - d1 * d6, va = d3 * d6 - d5 * d4; let v, w;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) { v = d1 / (d1 - d3); w = 0; }
    else if (vb <= 0 && d2 >= 0 && d6 <= 0) { v = 0; w = d2 / (d2 - d6); }
    else if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { w = (d4 - d3) / (d4 - d3 + d5 - d6); v = 1 - w; }
    else { const dn = 1 / (va + vb + vc); v = vb * dn; w = vc * dn; }
    x = px - t[0] - abx * v - acx * w; y = py - t[1] - aby * v - acy * w; z = pz - t[2] - abz * v - acz * w; return Math.sqrt(x * x + y * y + z * z);
  };
  // (skin: the body as last made (the inner face's places, the skin's), made again only when a foot has been raised
  //  since (ver); pre: the skin made beforehand, in a step of its own. body: its triangles, a span's together, and
  //  the box that holds each span's: made only when a place of the line is to be read against it)
  let cur = null, ver = 0, made = -1, byV = -1, byC = null, pre = null;
  const skin = () => { if (made !== ver) { cur = { B: f.bell(), O: pre || f.outer() }; pre = null; made = ver; } return cur; };
  const body = () => { if (byV === ver) return byC; const by = Array.from({ length: n }, () => []), { B, O } = skin(); byV = ver; byC = by;
    for (let i = 0; i < B.length; i += 3) by[Math.floor(i / (3 * f.M + 3))].push([B[i][0], B[i][1], B[i][2], B[i + 1][0], B[i + 1][1], B[i + 1][2], B[i + 2][0], B[i + 2][1], B[i + 2][2]]);
    for (let i = 0; i < O.span.length; i++) { const a = O.tris[3 * i] * 3, b = O.tris[3 * i + 1] * 3, c = O.tris[3 * i + 2] * 3, p = O.pos; by[O.span[i]].push([p[a], p[a + 1], p[a + 2], p[b], p[b + 1], p[b + 2], p[c], p[c + 1], p[c + 2]]); }
    for (const T of by) { const b = T.box = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (const t of T) for (let e = 0; e < 9; e++) { const c = e % 3; if (t[e] < b[c]) b[c] = t[e]; if (t[e] > b[c + 3]) b[c + 3] = t[e]; } }
    return by; };
  // (a span's least air to the places given, and the line's metre of it: a place is read against its own span and
  //  two either side, and only against a span whose box it stands within LIM of: the air is exact wherever it is
  //  under LIM, and a span no place comes that near keeps "none")
  const LIM = 2.6, airOf = (pts) => { const a = new Array(n).fill(1e9), at = new Array(n).fill(0); if (!pts.length) return { a, at }; const by = body();
    for (const p of pts) { const kp = Math.floor(((Math.atan2(p[2] - o.cz, p[0] - o.cx) / TAU + 1) % 1) * n);
      for (let d = -2; d <= 2; d++) { const k = (kp + d + n) % n, T = by[k], b = T.box, ex = Math.max(b[0] - p[0], 0, p[0] - b[3]), ey = Math.max(b[1] - p[1], 0, p[1] - b[4]), ez = Math.max(b[2] - p[2], 0, p[2] - b[5]);
        if (ex * ex + ey * ey + ez * ez > LIM * LIM) continue;
        for (let i = 0; i < T.length; i++) { const q = dTri(p[0], p[1], p[2], T[i]); if (q < a[k]) { a[k] = q; at[k] = p[3]; } } } }
    return { a, at }; };
  // (NEAR: a place of the line further than 3.2 m from the lip's own room (from the innermost corner's round to the
  //  outer side's top, from the lowest foot up to 6 m over the highest of the old foot ring) cannot stand within
  //  2.0 m of the body, and is not read: the air the build knows is exact wherever it is under 3.2 m)
  pre = f.outer(); await f.rest();
  let lowY = 1e9; { const q = skin().O.pos; for (let i = 1; i < q.length; i += 3) if (q[i] < lowY) lowY = q[i]; }   // (the body's lowest: a place of its skin; the foot's line is its first ring)
  const NEAR = 3.2, pts = [], yLo = lowY - NEAR, yHi = Math.max(...o.footY) + 6 + NEAR, rLo = Math.min(...C.map((q) => q[4])) * Math.cos(Math.PI / n) - NEAR, rHi = o.r + OUT + NEAR, up = new Array(n).fill(0);
  const take = (m0, m1, st) => { for (let m = m0; m <= m1 + 1e-9; m += st) { const p = o.lineAt(m), d = Math.hypot(p[0] - o.cx, p[2] - o.cz); if (d > rLo && d < rHi && p[1] > yLo && p[1] < yHi) pts.push([p[0], p[1], p[2], m]); } };
  const hold = () => { let r = airOf(pts);
    for (let it = 0; it < 80; it++) { const add = new Array(n).fill(0); let any = false;
      for (let k = 0; k < n; k++) if (r.a[k] < AIR) { const d = AIR - r.a[k] + 0.002, k1 = (k + 1) % n; add[k] = Math.max(add[k], d); add[k1] = Math.max(add[k1], d); any = true; }
      // (a foot is never raised into its own foot ring: it stops 0.65 m (STOP) under it)
      if (!any) break; let moved = false; for (let k = 0; k < n; k++) { const v = Math.max(F[k], Math.min(F[k] + add[k], o.footY[k] - f.STOP)); if (v > F[k]) moved = true; up[k] += v - F[k]; F[k] = v; } if (!moved) break; ver++; r = airOf(pts); }
    return r; };
  const least = (r) => { let b = [1e9, 0, -1]; for (let k = 0; k < n; k++) if (r.a[k] < b[0]) b = [r.a[k], r.at[k], k]; return b; };
  for (const [m0, m1] of o.ms || []) take(m0, m1, 0.2);
  await f.rest();
  let r = hold(); const air0 = least(r);   // (air0: read every 0.2 m only)
  await f.rest();
  // (FINER WHERE IT IS NEAREST: only where the air read every 0.2 m stands under 2.15 m: a place between two read
  //  ones lies within 0.1 m of one of them, so a finer reading cannot find the air more than 0.1 m less)
  if (air0[0] < AIR + 0.15) for (const st of [0.02, 0.005]) { const b = least(r); take(b[1] - 0.5, b[1] + 0.5, st); r = hold(); await f.rest(); }
  // THE OUTER SIDE'S STORED DIRECTIONS: each place takes the mean of its own faces (out of the body and down), and A
  // FACE THAT STANDS STEEP IS STORED AS LOOKING DOWN BY A HALF AT THE LEAST (as the bell stores its flare's): the
  // lip's outer side looks away from the great shaft, and by the roof's own law a face that looks down within the
  // great well's reach takes the bell's law of light and no day of the mouth's; stored steeper, the same law would
  // lay the mouth's day on a face the mouth's day cannot reach. The stone (beds, runs, stains) is by that direction.
  const O = skin().O, nor = new Array(O.pos.length).fill(0), p = O.pos;   // (the body as last made, with the feet as they stand)
  for (let i = 0; i < O.span.length; i++) { const k = O.span[i], k1 = (k + 1) % n, a = O.tris[3 * i] * 3, b = O.tris[3 * i + 1] * 3, c = O.tris[3 * i + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (nx * (C[k][2] + C[k1][2]) - ny + nz * (C[k][3] + C[k1][3]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
    for (const v of [a, b, c]) { nor[v] += nx; nor[v + 1] += ny; nor[v + 2] += nz; } }
  for (let v = 0; v < nor.length; v += 3) { const l = Math.hypot(nor[v], nor[v + 1], nor[v + 2]) || 1; let nx = nor[v] / l, ny = nor[v + 1] / l, nz = nor[v + 2] / l;
    if (-ny < 0.5) { const h = Math.hypot(nx, nz) || 1, q = Math.sqrt(0.75) / h; nx *= q; nz *= q; ny = -0.5; } nor[v] = nx; nor[v + 1] = ny; nor[v + 2] = nz; }
  // THE LIP'S GROUND: is a place within the round of the outer side's top corners (the 48 corners, each OUT further
  // from the axis, the straight spans between them: the roof's shader's own span law), and pad more?
  const ground = (x, z, pad = 0) => { const ex = x - o.cx, ez = z - o.cz, th = Math.atan2(ez, ex), da = TAU / n, kf = Math.floor(((th / TAU + 1) % 1) * n) % n, ta = kf * da, tb = ta + da, ra = C[kf][4] + OUT, rb = C[(kf + 1) % n][4] + OUT, t0 = (th + TAU) % TAU;
    return Math.hypot(ex, ez) < ra * rb * Math.sin(da) / (ra * Math.sin(t0 - ta) + rb * Math.sin(tb - t0)) + pad; };
  await f.rest();
  const b = least(r);
  return { n, reach: REACH, H0: f.H0, low: f.low, F0, F: F.slice(), up, air: b[0], airAt: b[1], airSpan: b[2], air0: air0[0], places: pts.length, face: f.FACE, stop: f.STOP, OUT, BR: f.BR, M: f.M, corners: C, foot: f.PL.map((q, i) => [q.x, f.footAt(i), q.z]), footLaw: f.PL.map((q) => [q.dn, q.w, q.low]), bell: skin().B, outer: { pos: O.pos, nor, tris: O.tris }, ground, body };
}
export function makeRoof(lake, noise, G) {
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const O = G.o || G.W, nv = G.nave;
  const zone = (x, z) => { const ex = x - O.x, ez = z - O.z; return [ex * G.n[0] + ez * G.n[1], ex * G.p[0] + ez * G.p[1]]; };
  // (dIn: the metres inside the shore at the place, where the asker has them already)
  const f = (x, z, dIn) => {
    const [a, c] = zone(x, z), wx = x - G.W.x, wz = z - G.W.z;
    let h = 12.5 + 2.8 * noise.n2(x * 0.021 + 3.1, z * 0.021) + 1.2 * noise.n2(x * 0.07, z * 0.07 + 5.5);
    { const ch = G.chamber || { r: 64, h: 7 }, q = (wx * wx + wz * wz) / (ch.r * ch.r); if (q < 1) h += ch.h * (1 - q) * (1 - q); }
    const da = a - G.dome.a; h += G.dome.h * Math.exp(-1.5 * (da * da + c * c) / (G.dome.r * G.dome.r));
    if (G.cave) { const ex = x - G.cave.x, ez = z - G.cave.z, q = (ex * ex + ez * ez) / (G.cave.r * G.cave.r); if (q < 1) h += G.cave.h * (1 - q) * (1 - q); }
    if (nv) {
      const q = Math.abs(c) / (nv.half + 3);
      if (q < 1 && a > nv.a0 - 14 && a < nv.a1 + 14) {
        const along = ss(nv.a0 - 14, nv.a0 + 4, a) * (1 - ss(nv.a1 - 4, nv.a1 + 14, a)), cr = (1 - q * q) * (1 - q * q);
        h += along * cr * (2.0 + 1.1 * noise.n2(a / 16 + 7.3, 4.4));
      }
    }
    for (const p of G.piers) { const ex = x - p.x, ez = z - p.z, q2 = ex * ex + ez * ez, w = p.r * p.r * 5; if (q2 < w * 9) h -= 2.6 * Math.exp(-q2 / w); }
    // (the shore's wall: the roof comes down by the metres inside the shore. Far inside it cannot reach the hall's
    //  height: there the distance is not asked; lake.inside says how that is known)
    if (dIn === undefined) { const r0 = lake.rho(x, z); if (r0 < 1 && 2.2 + 1.25 * (1 - r0) / lake.lip >= h) return h; }
    const d = dIn === undefined ? -lake.dist(x, z) : dIn;
    if (d <= 0) return Math.min(h, 2.2 + d * 0.5);
    return Math.min(h, 2.2 + d * 1.25);
  };
  f.zone = zone; f.G = G;
  f.at = (a, c) => [O.x + a * G.n[0] + c * G.p[0], O.z + a * G.n[1] + c * G.p[1]];
  return f;
}
// A GREAT PIER: living rock from under the water up into the roof, flaring at its foot and wide into the roof, its
// girth uneven. In its own frame: the axis at the origin, y 0 the water, y 1 the roof at the axis (the world scales it);
// it goes on up to 1.8, inside the rock, so no lip of it shows where the roof lifts beside it.
export function pierGeo(rng, n = 14) {
  const g = new Geo(), ph = [rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU)], T = [-0.12, 0.08, 0.28, 0.5, 0.7, 0.86, 1.0, 1.1, 1.2, 1.3, 1.8], rings = T.length - 1;
  const prof = (t) => Math.min(3.2, 1 + 0.5 * Math.pow(1 - Math.min(1, Math.max(0, t)), 3) + 1.1 * Math.pow(Math.max(0, t), 3.4) - 0.14 * Math.sin(t * 7 + ph[0]));
  const at = (k, j) => { const th = k / n * TAU, t = T[j], r = prof(t) * (1 + 0.16 * Math.sin(3 * th + ph[1] + t * 2) + 0.09 * Math.sin(5 * th + ph[2] - t * 5)); return [Math.cos(th) * r, t, Math.sin(th) * r]; };
  for (let j = 0; j < rings; j++) for (let k = 0; k < n; k++) {
    const A = at(k, j), B = at(k + 1, j), C = at(k + 1, j + 1), D = at(k, j + 1);
    for (const P of [A, C, B, A, D, C]) { const l = Math.hypot(P[0], P[2]) || 1; g.vert(P[0], P[1], P[2], P[0] / l, 0, P[2] / l, C_LIME, MAT.rock); }
  }
  return g;
}

// a pier's greatest girth, in its own radii, at the share t of its height (0 the water, 1 the roof): its profile at
// its widest bearing (the world's test of a pier against the line asks it)
export const pierGirth = (t) => 1.25 * Math.min(3.2, 1.14 + 0.5 * Math.pow(1 - Math.min(1, Math.max(0, t)), 3) + 1.1 * Math.pow(Math.max(0, t), 3.4));
// the beach: metres over the water's level at a place 'out' metres outside the waterline (negative: under water)
export const beachY = (out) => out * 0.22;

const CAVE_VERT = /* glsl */`
attribute vec3 aLight;
varying vec3 vW; varying vec3 vN; varying vec3 vLight;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vLight = aLight; gl_Position = projectionMatrix * viewMatrix * w; }`;
// THE ROCK: the roof (with the cavern's wall, where it comes down to the shore), the great piers, the needles and the
// beach. Bedded limestone: beds of uneven tone on what stands steep, flowstone and drip stains down it, damp green low
// down, a dark wet band at the water line under a pale crust; a mottled ceiling, its seams broad and soft. THREE TONES, EACH BY THE
// PLACE OF THE LIT POINT: (1) THE HALL'S FLOOR OF LIGHT: no rock is black in its own shade: every face takes the
// hall's own cool light (uCaveAmb, a little more low over the water, which gives it back), enough that its beds,
// its cracks and its lime ring are read; (2) DAY where a shaft falls: pale gold, by the daylight the wells let down
// at the place (the lake's table, tLake: it lights what stands low about a shaft, the roof by a quarter of it), by
// a curve that leaves the least daylight out and levels off under a shaft (a twentieth of the table's light gives a
// hundredth, a half gives a quarter, the whole gives a half), so the rock between two shafts is the cool shade and
// not a dim yellow, and the rock under a shaft is not burnt white; (3) THE WATER'S LIGHT about every
// lit pool: THE NET OF RIPPLES the lit water throws up on piers and roof, green-blue, moving slowly on the clock
// (one law at every pool: by how near a lit pool lies, tLake's other channel), strongest low down.
// Every well's mouth is cut through the roof (the throat stands in it) and its lip catches the daylight; the two great
// shafts are cut out. aLight.y: 0 roof, 1 beach, 2 pier, 3 needle or arch (rock that hangs over the water); aLight.z: metres outside the waterline (beach);
// a pier's share of the roof's height at its axis (pier; 0 on a fallen block). NO ROCK STANDS IN A WELL: the piers, the
// bridges, the needles and the fallen blocks give way to every well's round as the roof does (the law is in main, below).
// The quay's lamps light the rock about them (three points, by place). With MIRROR the same rock is drawn again upside
// down under the water's level, at four to five tenths of its light, a little green-blue: what the still dark water
// shows of it (the water lets it through by the angle of the look): the piers stand mirrored.
const CAVE_FRAG = /* glsl */`
uniform sampler2D tWell, tLake; uniform vec4 uGrid, uLakeBox, uRing; uniform vec2 uGridN; uniform vec4 uBig[2]; uniform vec2 uBigCut; uniform vec3 uLime, uDay, uBounce, uPool, uLampCol; uniform vec4 uLip; uniform float uT, uYW, uLampK;
uniform vec3 uPoolCol; uniform float uCham;
varying vec3 vW; varying vec3 vN; varying vec3 vLight;
${GLSL_NOISE}
${GLSL_PLACE}
${GLSL_QLAMP}
float ridge(vec2 p){ return 1. - abs(2. * vn(p) - 1.); }
void main(){
  vec2 xz = vW.xz; float kind = vLight.y, wy = vW.y; vec3 n = normalize(vN);
  // (pxg: the picture's own grain at the lit point: the metres of the rock one picture element spans there, the
  //  larger of its two spans, across the picture and down it, each by itself: it does not turn with the frame; taken
  //  before anything is cut away. IT READS THE EYE, and in this shader one thing asks it: a roof seam too narrow
  //  for the picture to hold, below)
  float pxg = max(max(length(dFdx(vW)), length(dFdy(vW))), 1e-4);
  #ifdef MIRROR
  if (wy > uYW) discard;
  wy = 2. * uYW - wy; n.y = -n.y;
  #else
  if (abs(kind - 1.) > .5 && wy < uYW - .02) discard;
  #endif
  float mouth = 0., rim = 0., sky = 0., ringM = 0., rr = 1., gw = 0.; vec2 rq = vec2(1., 0.);
  if (kind < .5) {
    // (THE GREAT WELL'S LIP IS ROUGH ROCK: the roof's edge round the bell's foot is no circle and carries no dressed
    //  stone. The bell's foot itself is uneven (uLip: the world's three measures and, fourth, the bell's own round;
    //  lipIn above is the same law in the build: each of the foot's 48 corners stands 0 to 1.7 m inside that round,
    //  on two slow waves of the bearing), and THE ROOF'S CUT FOLLOWS THE FOOT'S OWN 48 STRAIGHT SPANS: the same
    //  corners, written here; at every bearing the roof ends 0.05 m short of the span the bearing's ray meets, with no
    //  raggedness of its own. The world hangs the foot 0.2 m and more under the roof as drawn all along every span
    //  and joins it to the roof by a face of the bell's own rock standing up through the roof's sheet, so the roof's
    //  edge lies over the bell's sheet: no strip of the roof shows under the bell and no way through opens between
    //  them; the unevenness is the foot's. The roof's face there is its own rock with the day on its lip.
    //  With no lip given (uLip.w 0) the cut is the plain round uBigCut.x)
    vec2 q0 = xz - uBig[0].xy; float l0 = length(q0), d0 = l0 - uBigCut.x;
    if (uLip.w > 0.) { float th0 = atan(q0.y, q0.x + 1e-6), da = 6.2831853 / 48., ta = floor(th0 / da) * da, tb = ta + da;
      float ra = uLip.w - uLip.x - uLip.y * sin(5. * ta + 1.3) - uLip.z * sin(11. * ta + 4.1), rb = uLip.w - uLip.x - uLip.y * sin(5. * tb + 1.3) - uLip.z * sin(11. * tb + 4.1);
      d0 = l0 - ra * rb * sin(da) / (ra * sin(th0 - ta) + rb * sin(tb - th0)) + .05; }
    float d1 = distance(xz, uBig[1].xy) - uBigCut.y, cut = min(d0, d1);
    #ifdef MIRROR
    sky = max(sky, .5 * (1. - smoothstep(-5., 0., cut)));
    #else
    if (cut < 0.) discard;
    #endif
    // (gw: THE GREAT WELL'S REACH ON THE ROOF, cure 1 part B, below: by the face's own direction and its metres from
    //  the great well's axis; nought from 56 m out. Within it the great well's own lip takes no day of its mouth's.)
    gw = (1. - smoothstep(40., 56., l0)) * smoothstep(.2, .45, -n.y);
    rim = max(rim, .8 * (1. - smoothstep(0., 3.5, cut)) * (d0 < d1 ? 1. - gw : 1.));
    if (d1 >= 0. && d1 < 1.5 && d1 < d0) { ringM = 1.; rq = xz - uBig[1].xy; rr = uBigCut.y * .5; }
    vec2 g = (xz - uGrid.xy) / uGrid.z - .5, c0 = floor(g);
    for (int k = 0; k < 4; k++) {
      vec2 cell = c0 + vec2(float(k - (k / 2) * 2), float(k / 2));
      vec4 t = textureLod(tWell, (cell + .5) / uGridN, 0.); float r = t.b * 3.6;
      if (r > .01) { vec2 c = uGrid.xy + (cell + .5) * uGrid.z + (t.rg - .5) * 2. * uGrid.w; float d = distance(xz, c);
        mouth = max(mouth, step(d, r)); rim = max(rim, smoothstep(r * 2.2 + 2.4, r, d)); sky = max(sky, .5 * exp(-d * d / max(r * r * .6, .05)));
        if (d >= r && d < r + .4 + .22 * r) { ringM = 1.; rq = xz - c; rr = r; } }
    }
    #ifndef MIRROR
    if (mouth > .5) discard;
    #endif
  }
  // THE ROCK GIVES WAY TO THE WELL (a law of the place, by the lit point's own place): a well is a bore through the
  // rock, so nothing of the hall's standing, hanging or fallen rock (a pier, a bridge, a needle, a block) is drawn
  // inside any bore's round, from the water up, as it stands or mirrored: the cut the roof takes above, by the same
  // table of wells and the same four cells (a well of another cell lies 6.2 m and more off on one axis; no round here
  // is over 4.8 m). And none of it is drawn under a mouth's ring of dressed stones: what hangs from the roof gives way
  // to the ring's outer round too (a bridge; a needle is hung clear of every ring at the build, so none is cut), and so
  // does a pier from 0.86 of its height up (aLight.z, a pier's share of the roof's height at its axis: the shoulder
  // that spreads into the roof; easing in from 0.7; a fallen block has 0), so a pier's foot in the water is whole and
  // its shoulder is notched round the ring.
  // (kf: how far the kind stands from a whole number: 0 on the rock's skin, a quarter on a cut's face. Not fract(): a
  //  kind carried across a triangle may come out a hair under its whole number)
  float kf = abs(kind - floor(kind + .5));
  if (kind > 1.5 && kf < .1) {
    float wide = kind > 2.5 ? 1. : smoothstep(.7, .86, vLight.z);
    vec2 g = (xz - uGrid.xy) / uGrid.z - .5, c0 = floor(g);
    for (int k = 0; k < 4; k++) {
      vec2 cell = c0 + vec2(float(k - (k / 2) * 2), float(k / 2));
      vec4 t = textureLod(tWell, (cell + .5) / uGridN, 0.); float r = t.b * 3.6;
      if (r > .01 && distance(xz, uGrid.xy + (cell + .5) * uGrid.z + (t.rg - .5) * 2. * uGrid.w) < r + wide * (.4 + .22 * r)) discard;
    }
  }
  vec4 lk = texture2D(tLake, (xz - uLakeBox.xy) * uLakeBox.zw);
  // (a pier takes the daylight its own skin was given at build, bearing by bearing (aLight.x: the table's light 1.3
  //  radii out at sixteen bearings, and in the great well's chamber the shaft's own light on the side that faces
  //  it): a pier has a lit side and a shaded side; the roof, the beach and what hangs take the table's light)
  float light = (kind > 1.5 && kind < 2.5) ? max(vLight.x, 0.) : lk.g * 1.5, glow = lk.r;
  // (the rock about the ring's own place, at the far end beyond the last wells, takes less of the wells' daylight: the
  //  ring stands against a dark wall; by the lit point's metres from the ring, never the eye's)
  light *= 1. - .6 * (1. - smoothstep(8., 30., distance(xz, uRing.xy)));
  float hgt = wy - uYW, steep = 1. - abs(n.y), upr = smoothstep(.2, .55, steep);
  float isBeach = (kind > .5 && kind < 1.5) ? 1. : 0.;
  // the stone: on what stands steep, beds of uneven thickness and tone; on the ceiling, mottling and broad soft seams
  vec2 pw = kind > 1.5 ? vec2(xz.x + xz.y * .7, wy * 1.3) : xz + wy * vec2(.7, .5);
  float g1 = vn(pw * .31 + 2.), g2 = vn(pw * 1.7 + 7.), g3 = vn(pw * 6.1);
  float sy = wy * .5 + g1 * .9, bed = floor(sy), bf = fract(sy);
  float bedTone = .86 + .26 * h21(vec2(bed, 3.7)), bedLine = smoothstep(.07, 0., min(bf, 1. - bf)) * upr;
  // (THE HALL'S ROOF HAS NO THIN DARK LINE ON IT. What stands or hangs (a pier, a bridge, a needle) and the beach keep
  //  their cracks; on the roof the same two fields are BROAD SOFT SEAMS of the rock: three times as broad (1.26 m and
  //  0.39 m across at the middle of their run, where the lines were 0.42 m and 0.13 m), a third as dark (under five
  //  and three in a hundred at their middle), soft from their middle to their edge, DRAWN WHEREVER THE FIELD LAYS
  //  THEM, by the lit point's place alone: the same from anywhere and at any size of picture. ONE FILTER READS THE
  //  EYE, and only this: where a seam's WHOLE breadth (1.26 m; 0.39 m) would span under one and a half picture
  //  elements it fades to its field's own mean (0.246; 0.197), and is at the mean from half an element (pxg): it
  //  takes away only what the picture cannot hold)
  float c1 = abs(vn(pw * .5 + 11.) - .5), c2 = abs(vn(pw * 1.3 + 3.) - .5);
  float crack = kind < .5 ? (mix(.246, smoothstep(.15, 0., c1), smoothstep(.5, 1.5, 1.26 / pxg)) * .5 + mix(.197, smoothstep(.12, 0., c2), smoothstep(.5, 1.5, .39 / pxg)) * .3) / 3.
    : smoothstep(.05, 0., c1) * .5 + smoothstep(.04, 0., c2) * .3;
  vec3 alb = uLime * (.68 + .12 * g1 + .12 * g2 + .08 * g3) * mix(1., bedTone, upr) * (1. - .22 * bedLine) * (1. - .28 * crack);
  // a ledge under each bed's line: the rock just under a bedding line is darker (its own shade)
  alb *= 1. - .15 * upr * smoothstep(.75, 1., bf);
  // flowstone (pale, down the steep rock) and drip stains (dark)
  float ua = dot(xz, vec2(.83, .55));
  float flow = smoothstep(.56, .8, vn(vec2(ua * .9, wy * .07 + 3.))) * upr;
  alb = mix(alb, uLime * vec3(.82, .76, .62), flow * .5);
  alb *= 1. - .24 * smoothstep(.6, .85, vn(vec2(ua * .62 + 20., wy * .05))) * (.35 + .65 * vn(vec2(ua * .13 + 5., wy * .11))) * upr;
  // damp green low down; the water line: a dark wet band, a pale crust just over it
  alb = mix(alb, alb * vec3(.5, .68, .52), smoothstep(.5, .8, g1) * .45 * exp(-max(hgt, 0.) / 5.));
  // (dark and wet for its first metre and a half over the water; over that a ring of pale lime, the old waterline)
  // (only where the rock stands in the water: a pier, the shore's wall. A needle or an arch hangs over the water and has neither)
  if (isBeach < .5 && kind < 2.5) { alb *= 1. - .5 * smoothstep(1.5, .5, hgt + .25 * g2); alb = mix(alb, uLime * 1.05, .7 * smoothstep(.22, 0., abs(hgt - 1.7 - .25 * g2)) * upr); }
  // (how much of the light about a place a face takes: what faces down takes the water's giving back, what faces up
  //  (a pier's spreading foot, a fallen block's top) the day from above, what stands plumb the least)
  float lam = isBeach > .5 ? .7 + .3 * clamp(n.y, 0., 1.) : clamp(.55 + .5 * abs(n.y), 0., 1.) * (kind < .5 ? .5 : 1.);
  // (A CUT'S FACE IS THE ROCK IT CUTS: the same stone, beds and shade by the same fields of its place, and the light
  //  of its place by the rock's own law (a plumb face's share of it, less with height as on any standing rock): what
  //  it does not take is the gain of a face that leans to the light (below): it is no brighter than the rock beside it)
  float face = (kind > 1.5 && kf > .1) ? 1. : 0.;
  // the net of ripples the lit water throws up: two slow ridged fields crossing; only near a lit pool, strongest low down
  float net = pow(clamp(ridge(pw * .42 + vec2(uT * .05, 0.)) * ridge(mat2(.8, -.6, .6, .8) * pw * .71 - vec2(0., uT * .04)), 0., 1.), 3.);
  float low = exp(-max(hgt, 0.) / 7.), fall = mix(1., .5, smoothstep(2., 12., hgt));
  // (the three tones: the floor, cool; the day, pale gold, by the table's daylight through the curve dl; the water's
  //  net, green-blue: on what stands in the water by its height, on the roof over a pool fainter)
  // (THE HALL IS DARK ROCK: the day is on the rock only WHERE A SHAFT FALLS (ls: the table's daylight less the low
  //  light that lies everywhere between the wells: a patch about a shaft's foot and on what stands in it), and what
  //  gives the rock its form between the shafts is the hall's cool floor and THE LIGHT THE POOLS THROW UP: a steady
  //  green-blue from below on what stands near a lit pool and the moving net in it; at night THE LAMPS' WARM LIGHT
  //  about every bucket's lamp, by the same nearness (uLampK: nought by day). A MOORING'S LANTERN LIGHTS A POOL, NOT
  //  THE HALL (the table's fourth channel, lk.a): on the rock its warm light lies at the foot only, strongest at the
  //  water, a half of it 1 m up and none from 2 m up: over that, and on the roof, the rock is the hall's dark again)
  float ls = max(light - .16, 0.) * 1.2, dl = ls * ls / (ls + .15) / (1. + .75 * ls);
  // (THE ROCK'S FORM BY THE LIGHT ABOUT IT: the table's two lights (the wells' day, the pools' glow) are read again
  //  3 m off along each axis: the way they grow is the way the light comes from, and a face that leans toward it (the
  //  roof's sags, a pier's flank, a bridge's haunch) takes more of it, one that leans away less: by the lit point's
  //  place and its own face, never the eye's. And the roof's rock is of broad darker and paler reaches (20 m))
  vec2 uvL = (xz - uLakeBox.xy) * uLakeBox.zw; vec4 lx = texture2D(tLake, uvL + vec2(3. * uLakeBox.z, 0.)), lz = texture2D(tLake, uvL + vec2(0., 3. * uLakeBox.w));
  vec2 grad = vec2(lx.g * 1.5 + lx.r - lk.g * 1.5 - lk.r, lz.g * 1.5 + lz.r - lk.g * 1.5 - lk.r);
  float form = clamp(1. + 1.5 * dot(n.xz, grad / (length(grad) + .04)) * (isBeach > .5 ? 0. : 1.), .45, 1.9 - .9 * face);
  if (kind < .5) alb *= .78 + .44 * vn(xz * .05 + 3.);
  vec3 lit = uCaveAmb * (.62 + .45 * lam) * (1. + .3 * low) * mix(1., form, .35) + uBounce * dl * lam * fall * 2.8 * form
    + uPool * glow * form * (kind < .5 ? .1 + 1.0 * net : .05 + .5 * net + low * (.34 + 2.1 * net))
    + uLampCol * (uLampK * glow * (kind < .5 ? .34 : .26 + 1.1 * low) + lk.a * (kind < .5 ? 0. : 2.4 * (1. - smoothstep(0., 2., hgt))));
  lit += qLamp(vec3(vW.x, wy, vW.z), n);
  // CURE 1, PART B: ONE LAW OF LIGHT AT THE GREAT WELL'S FOOT. The bell is dark wet rock that takes what its pool
  // gives back by its height over the pool (LIFT_FRAG, fl); the roof one step beyond its foot took the lake table's
  // full daylight and the day on its lip besides: two faces that look down over the same pool were lit by two laws
  // that met on a line. So A FACE OF THE ROOF THAT LOOKS DOWN WITHIN THE GREAT WELL'S REACH TAKES THE DAY AS THE
  // BELL DOES. gw (above) is the reach: by the face's own direction (the bell's own measure of a face that looks
  // down) and its metres from the great well's axis: whole to 40 m, ending softly over the 16 m to 56 m, NOUGHT
  // from 56 m out (these are the table's own: the great shaft's direct daylight is laid within 56 m and ends over
  // the same 16 m, and its chamber's share at 56 m, 0.155, lies under the table's floor of light, so beyond the
  // reach the roof had no day of the great shaft's to lose WHERE NO SMALL WELL'S LIGHT LIES; under a small well's
  // patch out to about 81 m the chamber's share still adds to the table's day, and is rightly left). The reach
  // reads no eye, seed or clock.
  // SAID IN THE OPEN, TWO THINGS:
  // THE FLOOR CARRIES THE WATER'S MOVING NET: the floor the roof may not go under is the bell's law with the bell's
  // own net on the world's running clock (the same uniform, fields, scales and speeds as the bell's), so within the
  // reach the roof carries the net as the bell does and the net's lines run on from the bell to the roof.
  // HANGING ROCK WITHIN THE REACH (needles, arches) is not the roof's sheet, keeps the table's day and stands 1.07
  // to 1.64 times the roof at its root (live 0.75 to 1.11).
  // Within the reach:
  // - THE GREAT SHAFT'S OWN SHARE OF THE TABLE'S DAY IS EASED AWAY (g0: the two laws the table was laid by, the
  //   shaft's direct light and its chamber's, written again; its day by the same curve dl): a small well's OWN
  //   share (the table's day over the great shaft's) stays; its patch's light falls with the great shaft's share
  //   under it (seed 7's brightest patch in the reach: 0.3045 to 0.2637) and it stands out more (1.24 times the
  //   roof about it in live, 1.41 now); the great well's lip takes no day of its mouth's;
  // - in its place THE DAY ITS POOL GIVES BACK, BY THE FACE'S HEIGHT OVER THE POOL, on the bell's own law (a third
  //   of the shaft's light at the water, a half of that 3 m up);
  // - NOTHING IS MADE DARKER THAN THE BELL'S OWN LAW GIVES AT THAT HEIGHT (bell: its shade, its pool's green-blue,
  //   its lip's day and the water's net, for this face): the roof's light is never under the lesser of what it
  //   was and the bell's law.
  // Beyond the reach gw is nought and nothing here is done. The widest shaft, the piers, the beach and the water
  // are not touched (the roof's sheet alone: kind 0); a small well's own share is not taken away, but its patch
  // within the reach is dimmer and stands out more, as said above.
  if (gw > 0.) {
    float qg = distance(xz, uBig[0].xy), dg = max(qg - uBig[0].z, 0.), hw = max(hgt, 0.), dn = max(-n.y, 0.);
    float g0 = uBig[0].w * (1.3 / (1. + dg * dg / 81.) * (1. - smoothstep(40., 56., qg)) + (uCham > 0. ? .54 / (1. + dg * dg / 676.) * (1. - smoothstep(uCham, uCham + 16., qg)) : 0.));
    float lg = max(g0 * (1. - .6 * (1. - smoothstep(8., 30., distance(xz, uRing.xy)))) - .16, 0.) * 1.2, dg0 = lg * lg / (lg + .15) / (1. + .75 * lg);
    vec3 lipDay = uCaveKey * dn * .34 * exp(-hw / 4.5);
    vec3 bell = uCaveAmb * (.6 + .5 * max(dot(n.xz, (uBig[0].xy - xz) / max(qg, 1e-3)), 0.)) + uPoolCol * (.75 * exp(-hw / 18.) * (.6 - .4 * n.y) * .2 + dn * exp(-hw / 40.) * (.1 + net)) + lipDay;
    // (the floor: colour by colour the lesser of what the roof had and the bell's law; and, read as one light (LW:
    //  the eye's weights of the three colours), never under the lesser of the two, where the two colours cross)
    const vec3 LW = vec3(.2126, .7152, .0722);
    vec3 eased = max(lit - uBounce * (min(gw * dg0, dl) * lam * fall * 2.8 * form) + gw * lipDay, min(lit, bell));
    lit = eased * max(1., min(dot(lit, LW), dot(bell, LW)) / max(dot(eased, LW), 1e-5));
  }
  vec3 col = alb * lit;
  // a mouth's lip catches the daylight that falls through it
  if (kind < .5) col += (uLime * .35 + alb * .9) * uDay * rim * rim * .13;
  // THE RIM OF A WELL'S MOUTH: a ring of dressed stones round the opening (the well's own lining, where it comes
  // through the roof), lit by the daylight the lake's table gives at its place (the same table that lights the rock
  // about it: a broad well's ring is bright, a narrow one's dim, and the ring by the quay's ring stands in that
  // wall's dark); the widest shaft over the landing has one too (1.5 m broad, of greater stones, under its built
  // collar); THE GREAT WELL'S LIP HAS NONE: it is the roof's own rough rock (above)
  if (ringM > .5) { float ang = atan(rq.y, rq.x) / 6.2832, nSt = floor(6.2832 * (rr + .3) / .6 + .5), fa = fract(ang * nSt), jt = smoothstep(.09, 0., min(fa, 1. - fa));
    col = uLime * (.72 + .22 * h21(vec2(floor(ang * nSt), rr * 7.))) * (1. - .5 * jt) * (uCaveAmb * .5 + uDay * (.12 + .3 * light)); }
  if (isBeach > .5) {
    // the beach: pebbles, darker and wet toward the water, a slow lap at the waterline
    float peb = vn(xz * 3.1) * vn(xz * 7.7 + 3.), lap = .5 + .5 * sin(uT * .7 + xz.x * .05 + xz.y * .04);
    float wet = 1. - smoothstep(-.2 + .5 * lap, 1.2 + .5 * lap, vLight.z);
    col *= (.75 + .6 * peb) * mix(1., .5, wet);
  }
  #ifdef MIRROR
  col = mix(col, uDay * .8, sky); col *= vec3(.4, .5, .52);
  #endif
  gl_FragColor = vec4(placeFog(col, vW), 1.);
}`;
// THE WATER: BLACK-GREEN away from the pools, deep and clear, never one flat tone, the rock's dark in it. A deep blue-green, paler over the shallows by the shore and about every rock
// (the bed's stones show there), with slow reaches of lighter and darker water; a slow swell whose long ripples catch
// whatever light is about; a faint cool light on all of it from the lit pools (the lake lights itself). What it
// mirrors is drawn under it (the rock and the shafts of light, each drawn again upside down, dimmer), and the surface
// lets that through by the angle of the look: most of it at a grazing look, none looking straight down. Under every
// well a POOL: clear green-blue water lit by the day, soft at its edge, brightest at its middle (the daylight's own
// glint), a net of light dancing in it, THE BED'S PALE SAND and its stones seen through it, and the rings of that
// well's bucket (the bucket's own period and phase, from the wells' texture); in the great well's pool the rings
// spread from the round where its twelve chains of pots dip (12.5 m from its axis), on the clock; drips from the
// roof ring the dark water here and there, each on its own clock. THE RING'S LIGHT LIES ON THE WATER AS A PATH from
// the quay back along the nave's middle (by the metres from the ring: a third of it left at 130 m, an eighth at
// 250 m; as broad as the ring by the quay, 10 m to either hand at the nave's far end), in the net's moving lines;
// each lamp of the quay lies long on it toward the eye (a mirror's streak: by the angle of the look).
const WATER_FRAG = /* glsl */`
uniform sampler2D tWell, tLake; uniform vec4 uGrid, uLakeBox, uRing; uniform vec2 uGridN; uniform vec4 uBig[2]; uniform vec3 uLakeCol, uShallow, uSand, uDay, uLampCol, uBounce, uPool; uniform float uT, uLampK; uniform vec2 uSlant;
varying vec3 vW;
${LAKE_GLSL}
${GLSL_NOISE}
${GLSL_PLACE}
${GLSL_QLAMP}
float periodOf(float b){ return 30. + 16. * mod(b * 37., 255.) / 255.; }
float ridge(vec2 p){ return 1. - abs(2. * vn(p) - 1.); }
void main(){
  vec2 xz = vW.xz;
  float inD = (1. - lakeRho(xz)) * 190.;
  if (inD < -16.) discard;
  vec3 V = normalize(cameraPosition - vW);
  float fres = .2 + .8 * pow(1. - clamp(V.y, 0., 1.), 2.5);
  vec4 lk = texture2D(tLake, (xz - uLakeBox.xy) * uLakeBox.zw);
  // (ls: the day lies on the water only about a shaft's foot: the table's daylight less the low light between the wells)
  float glow = lk.r, light = lk.g * 1.5, pier = lk.b, ls = max(light - .16, 0.) * 1.2;
  float rip = vn(xz * .9 + uT * .12) - .5 + .5 * (vn(xz * 2.7 - uT * .2) - .5);
  float shal = max(smoothstep(26., 0., inD), pier);
  vec3 col = mix(uLakeCol, uShallow, shal * .8) * (.75 + .5 * vn(xz * .035 + 3.));
  // the bottom's stones in the shallows
  // (each stone at its own place in its cell, of its own size: no lattice shows)
  vec2 sp = xz * .8 + 1.7 * vec2(vn(xz * .33), vn(xz * .33 + 5.)), si = floor(sp);
  float st = smoothstep(.34, .1, length(fract(sp) - .5 - .3 * (vec2(h21(si + 1.3), h21(si + 4.7)) - .5)) / (.5 + .5 * h21(si + 7.1))) * h21(si);
  col += uShallow * st * .8 * max(smoothstep(9., 1., inD), pier * .9);
  vec2 g = (xz - uGrid.xy) / uGrid.z - .5, c0 = floor(g);
  float ring = 0., pool = 0., lamp = 0., contact = 0.;
  for (int k = 0; k < 4; k++) {
    vec2 cell = c0 + vec2(float(k - (k / 2) * 2), float(k / 2));
    vec4 t = textureLod(tWell, (cell + .5) / uGridN, 0.);
    float r = t.b * 3.6;
    if (r > .01) {
      vec2 c = uGrid.xy + (cell + .5) * uGrid.z + (t.rg - .5) * 2. * uGrid.w;
      vec2 q = xz - c - uSlant, q2 = xz - c; float d = length(q), d2 = length(q2);
      // the rings spread from where that well's bucket last touched the water (the bucket's law: it touches at .42 of its period)
      float pb = floor(t.a * 255. + .5), has = step(pb, 254.5), P = periodOf(pb), age = fract(uT / P + pb / 255. - .42) * P;
      float wave = sin((d2 - age * .8) * 6.) * exp(-age * .2) * smoothstep(age * .8 + .4, age * .8 - .6, d2) * smoothstep(5.6, 2.6, d2) * has;
      ring += wave;
      // where the bucket stands in the water (.42 to .6 of its period, by its own law) a dark line of contact lies round it
      float ub = fract(uT / P + pb / 255.), rb = .26 * clamp(r * 2.83, .85, 1.9);
      contact = max(contact, has * smoothstep(.36, .42, ub) * (1. - smoothstep(.6, .66, ub)) * smoothstep(rb + .3, rb, d2));
      float rp = r * 1.25 + .4;
      pool += exp(-d * d / (rp * rp)) * (1. + .12 * wave);
      lamp += has * exp(-d2 * d2 / 4.5);
    }
  }
  float big = 0.;
  for (int i = 0; i < 2; i++) { float db = distance(xz, uBig[i].xy), R = uBig[i].z; big += (smoothstep(R + 2.5, R - 3.5, db * (1. + .01 * rip)) + .22 * exp(-max(db - R, 0.) / 5.)) * uBig[i].w; }
  pool += big;
  // (the great well's pool: rings spreading both ways from the round where its chains of pots dip)
  { float db = distance(xz, uBig[0].xy), ph = abs(db - 12.5); ring += .55 * sin(ph * 2.6 - uT * 1.5 + 1.3 * vn(xz * .12)) * exp(-ph * .13) * smoothstep(34., 20., db) * uBig[0].w; }
  // drips from the roof ring the dark water: one cell in six, each on its own clock
  vec2 dc = floor(xz / 7.); float dh = h21(dc + 3.7);
  if (dh > .84) { vec2 dp = (dc + .2 + .6 * vec2(h21(dc + 1.1), h21(dc + 2.3))) * 7.; float P2 = 5. + 6. * h21(dc + 9.), age2 = fract(uT / P2 + dh * 13.) * P2, dd = distance(xz, dp);
    ring += .8 * sin((dd - age2 * .7) * 9.) * exp(-age2 * .5) * smoothstep(age2 * .7 + .3, age2 * .7 - .5, dd) * smoothstep(3.3, 1.2, dd); }
  vec2 nq = xz + 1.6 * (vec2(vn(xz * .19 + 4.), vn(xz * .19 + 9.)) - .5);
  float net = pow(clamp(ridge(nq * .55 + vec2(uT * .08, 0.)) * ridge(mat2(.8, -.6, .6, .8) * nq * .9 - vec2(0., uT * .07)), 0., 1.), 2.);
  float pl = clamp(pool, 0., 1.4);
  // (the pool: the lit water's own green-blue; the bed's pale sand in soft patches and its stones seen through it; the
  //  daylight's glint at its middle; the rings)
  float sand = .35 + .65 * smoothstep(.3, .7, vn(xz * .45 + 9.));
  // (BY NIGHT THE GREAT SHAFTS' FEET ARE HELD AT THE OLD LEVEL (mending 2): nb is the night (the hour's standing
  //  state, the lamps lit) at the foot of a great shaft, by the place (big: the great pools' own share of the pool
  //  here): there the pool's water and its glint keep the measures they had before the round, so the moonlit disc
  //  under the great well and under its chains of pots is rippled water and never a flat white)
  float nb = min(uLampK, 1.) * clamp(big, 0., 1.);
  col += uPool * pl * (mix(.7, .55, nb) + mix(1.4, 1.15, nb) * net + .3 * rip) + uSand * pl * (.5 * sand + .7 * st) + uDay * mix(pl * pl * pl * .55, pl * pl * pl * pl * .2, nb) + uDay * ring * (.02 + .16 * pl) + uLampCol * (lamp * uLampK + .8 * lk.a) * (.9 + 1.6 * net);
  // the lake lights itself: a faint cool light on all of it, more where lit pools lie near
  col += uCaveAmb * .04 + uPool * glow * glow * .14 + uLampCol * uLampK * glow * glow * .05;
  // the slow swell: long ripples that catch whatever light is about
  float sw1 = ridge(xz * vec2(.11, .31) + vec2(uT * .035, uT * .02) + .8 * vn(xz * .07)), sw2 = ridge(xz * vec2(.27, .09) - vec2(uT * .02, uT * .03) + 3.);
  float swell = pow(clamp(sw1 * sw2, 0., 1.), 3.) * fres;
  col += swell * (uCaveAmb * .22 + uBounce * ls * .25 + uPool * glow * .9 + uLampCol * uLampK * glow * .4);
  // the wells' daylight lying on the water about them: pale, between the day's gold and the pool's green-blue, on
  // the dark; brightest in the net's moving lines
  col += mix(uBounce, uPool, .5) * ls * (.03 + .3 * net + .5 * swell) * fres;
  col += (uCaveAmb * .55 + uBounce * .25) * fres * max(ring, 0.) * 1.2;
  // THE RING'S LIGHT ON THE WATER: a path from the quay back along the nave's middle, by the metres from the ring
  { vec2 q = xz - uRing.xy; float al = dot(q, uRing.zw), ac = abs(q.x * uRing.w - q.y * uRing.z);
    col += uRingCol * uRingL.w * 1.2 * smoothstep(3., 12., al) * exp(-max(al, 0.) / 120.) * exp(-ac * ac / (12. + max(al, 0.) * .4)) * (.4 + 1.05 * net + .7 * swell); }
  // each lamp of the quay: a round of light at its foot, and a streak lying long on the water toward the eye
  for (int i = 0; i < 3; i++) {
    vec2 q = xz - uQLamp[i].xz, s = cameraPosition.xz - uQLamp[i].xz; s /= max(length(s), 1e-3);
    float al = dot(q, s), ac = abs(q.x * s.y - q.y * s.x), d2 = dot(q, q);
    col += uQLampCol * uQLamp[i].w * ((.1 + .3 * net) / (1. + d2 / 14.) + (.3 + .7 * net + .5 * swell) * step(0., al) * exp(-max(al, 0.) / 24.) * exp(-ac * ac / (1.2 + max(al, 0.) * .2)) * fres);
  }
  col += vec3(.5, .6, .6) * uCaveAmb * 1.3 * smoothstep(1.2, 0., abs(inD - .4 - .5 * sin(uT * .7 + xz.x * .05 + xz.y * .04)));
  float alpha = mix(1. - .8 * fres, .85, clamp(pl, 0., 1.));
  alpha = max(alpha, clamp(abs(ring) * .6 + swell * .8, 0., .8));
  col *= 1. - .6 * contact;
  gl_FragColor = vec4(placeFog(col, vW), alpha);
}`;
// A SHAFT OF DAYLIGHT: lit air with no edge and no end, under every well (a narrow well's is thin and faint, a broad
// one's strong: BY ITS MOUTH'S BREADTH, beamK below; no least share) and under the two great shafts. The air under a well is lit most on the well's axis and
// less away from it (a bell curve across the shaft); the light SPREADS A LITTLE AS IT FALLS: under the mouth the curve
// is as wide as the mouth, at the water as wide as its pool (1.75 times the mouth's radius under a narrow well, 1.2
// times under the broadest), and it thins by the 0.7th power of that widening only (six to eight tenths of its
// strength left at the water): ONE BODY FROM THE MOUTH TO THE POOL,
// soft at its edges, standing from the water up to the highest edge of its mouth in the roof. Each fragment works out how much lit air its ray runs through between the roof and the water (the bell
// curve summed along the ray, in closed form) and glows by that: a standing volume, the same from outside and from
// within (the far walls of a prism wide enough to hold the whole curve are what is drawn, so the eye may pass through
// it). IT IS LIGHT IN AIR: a soft beam of its well's own breadth and its well's own strength, brighter at its middle, thinning down its length (the law is in the shader). Motes hang and sink in it, and down some wells a fine rain of drops falls: both are fields of the world's own
// metres and the clock, read where the ray passes nearest the axis (a well) or on the far wall (a great shaft).
// BY THE EYE'S DISTANCE, said outright: a shaft is dimmed by THE HALL'S OWN HAZE AND BY NOTHING ELSE (placeFog's
// share, with the same density, that hazes the rock: a ninth gone at 100 m, half gone at 238 m; a well's beam takes
// it at its lit point, exactly as a pier standing there would), and its motes and drops are filtered like any fine
// texture. NO BEAM IS DIMMED BY WHERE THE EYE STANDS: its strength is its well's, by the plan. The mirrored shaft under the water wavers with the surface and is dim.
// aMove: x the light's strength by the mouth's breadth (beamK; a great shaft: the lit air's thickness, 1/m), y the well's own seed, z 1 where drops fall, w 1 for a great shaft.
const BEAM_VERT = /* glsl */`
attribute vec4 aMove;
varying vec3 vW; varying vec4 vK; varying vec4 vA; varying vec3 vB;
void main(){ vK = aMove;
  vA = vec4(instanceMatrix[3].x, instanceMatrix[3].z, instanceMatrix[0].x, instanceMatrix[3].y); vB = vec3(instanceMatrix[1].x, instanceMatrix[1].z, instanceMatrix[1].y);
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const BEAM_FRAG = /* glsl */`
uniform vec3 uDay; uniform float uT, uBeam, uBeamG, uCaveDen, uFogDen;
varying vec3 vW; varying vec4 vK; varying vec4 vA; varying vec3 vB;
${GLSL_NOISE}
float erfa(float x){ float a = abs(x), d = 1. + a * (.278393 + a * (.230389 + a * (.000972 + a * .078108))); d *= d; d *= d; return sign(x) * (1. - 1. / d); }
void main(){
  vec3 O = cameraPosition, D = vW - O; float dist = length(D); D /= max(dist, 1e-4);
  #ifdef MIRROR
  // (what the water shows of a shaft wavers with the surface)
  D.xz += .03 * (vec2(vn(vW.xz * .6 + uT * .25), vn(vW.xz * .6 + 7. - uT * .2)) - .5); D = normalize(D);
  #endif
  // the ray in the shaft's own measure: ly its height from the water (0) to the roof (1); q its offset from the leaning axis
  float ly0 = (O.y - vA.w) / vB.z, lyd = D.y / vB.z;
  vec2 q0 = O.xz - vA.xy - vB.xy * ly0, qd = D.xz - vB.xy * lyd;
  float A = max(dot(qd, qd), 1e-6), B = dot(q0, qd), tc = -B / A, t0 = 0., t1 = 4000.;
  if (abs(lyd) > 1e-6) { float ta = -ly0 / lyd, tb = (1. - ly0) / lyd; t0 = max(t0, min(ta, tb)); t1 = min(t1, max(ta, tb)); }
  else if (ly0 < 0. || ly0 > 1.) discard;
  if (t1 <= t0) discard;
  float tn = clamp(tc, t0, t1), lyc = clamp(ly0 + lyd * tn, 0., 1.), wide = vK.w > .5 ? 1.25 - .45 * lyc : .85 + min(.9, 2.4 / vA.z) * (1. - lyc), sg = vA.z * .5 * wide;
  float b2 = max(dot(q0, q0) - B * B / A, 0.), sA = sqrt(A) / sg;
  // (the bell curve less its own value at the prism's wall, so the drawn prism has no edge at all)
  float len = max(exp(-b2 / (sg * sg)) - .018, 0.) * (.8862269 / sA) * (erfa(sA * (t1 - tc)) - erfa(sA * (t0 - tc)));
  // A BEAM, NOT A PANE: its MIDDLE is the same curve at four tenths of the breadth (a great shaft) or a half (a well), summed along the ray the same way,
  // and the beam glows by its two thicknesses, each as a share of a level look through the axis (1 there; no more
  // than 1.3 however long the ray runs in the lit air, so the eye inside a shaft is not blinded by it): a soft
  // skirt and a bright core, with no flat face. It THINS DOWN ITS LENGTH: brightest under the mouth, four tenths of
  // that at the water (a well); the great well's column is brightest under its bell's lip, thinner at the water,
  // and thin up in the open bore (the damp air under the rock holds the light; the bore's air is clear)
  // (A WELL'S BEAM IS LIGHT IN AIR, NEVER A LINE (mending 2; one law for every well's beam). ITS BREADTH IS ITS
  //  WELL'S OWN: the bell curve of the shaft's own half breadth (sg), and within it a brighter middle, the same
  //  curve at a half of that breadth (never narrowed to a line), so its brightness falls from its middle to its
  //  edge with no hard edge anywhere: at a level look through the axis the skirt gives 0.32 and the middle 0.42 of
  //  the beam's strength. ITS STRENGTH IS ITS WELL'S OWN, BY THE PLAN (vK.x, set once where the beams are made:
  //  the mouth's breadth as a share of the broadest mouth the deal makes), the same from wherever it is seen:
  //  NOTHING HERE DIMS A BEAM BY WHERE THE EYE STANDS (mending 3 struck the fade by the eye's distance that
  //  mending 2 had made). A frame holds few strong beams because few wells are broad. WHAT WAS SEEN in the
  //  builder's frames: soft pale shafts under the broad wells, veils under the rest; no beam read as a bright
  //  shaft across the hall, save one beside the lens.
  //  The pools on the water are the water's own and keep their brightness. The two great shafts keep
  //  their own law.)
  float sc = sg * (vK.w > .5 ? .4 : .5), sC = sqrt(A) / sc;
  float lenC = exp(-min(b2 / (sc * sc), 40.)) * (.8862269 / sC) * (erfa(sC * (t1 - tc)) - erfa(sC * (t0 - tc)));
  float th = min(max(len, 0.) / (sg * 1.7725), 1.3), thC = min(max(lenC, 0.) / (sc * 1.7725), 1.3);
  float glow = vK.w > .5 ? (.2 * th + .42 * thC) * (vK.x / .12) * mix(.5, 1., smoothstep(0., .42, lyc)) * mix(1., .3, smoothstep(.5, .8, lyc))
    : vK.x * (.32 * th + .42 * thC) * mix(.44, 1., pow(lyc, 1.2)) * pow(.85 / wide, .7);
  vec3 Pm = vK.w > .5 ? vW : O + D * tn; vec2 qc = q0 + qd * tn;
  // soft upright rays across the shaft, and dust sinking slowly through it
  float ray = .78 + .44 * vn(vec2(dot(qc, vec2(.8, .6)) / sg * 2.4 + vK.y * 50., uT * .03));
  float dust = .85 + .3 * vn(vec2(Pm.y * .5 - uT * .05 + vK.y * 31., (Pm.x + Pm.z) * .4 + vK.y * 17.));
  // motes: a round spark in one cell in five of a 0.4 m lattice, sinking and drifting slowly aside; and down some wells a fine rain, one drop
  // to a lane of 14 cm. Both are filtered like any fine texture: a mote fades out as its cell comes down from 6.7
  // pixels to 2, a drop as its lane comes down from 5 pixels to 1.7.
  vec2 mp = vec2((Pm.x + Pm.z) * 2.6 + vK.y * 40. + uT * .05, Pm.y * 2.6 + uT * .1), mc = floor(mp), mf = fract(mp) - .5 - .6 * (vec2(h21(mc), h21(mc + 7.3)) - .5);
  float mote = step(.78, h21(mc + 3.1)) * (1. - smoothstep(.02, .1, length(mf))) * (1. - smoothstep(.15, .5, max(fwidth(mp.x), fwidth(mp.y))));
  vec2 rp = vec2((Pm.x - Pm.z) * 7., Pm.y * .22); float hh = h21(vec2(floor(rp.x), floor(vK.y * 255.)));
  float drop = step(.5, vK.z) * step(.7, hh) * exp(-fract(rp.y + hh * 7. + uT * (.5 + .3 * hh)) * 24.) * (1. - smoothstep(.25, .5, abs(fract(rp.x) - .5))) * (1. - smoothstep(.2, .6, fwidth(rp.x)));
  // THE PLACE'S OWN FOG BETWEEN, AND NOTHING ELSE OF THE EYE'S: placeFog's own share, as every pier and rock face
  // under the roof takes it. A well's beam takes it AT ITS LIT POINT (Pm, on the ray where it passes nearest the
  // axis: tn metres from the eye), by the place's density at that point's height (the cave's under the rock); a
  // great shaft at its drawn wall, by the cave's density (its own law, as it stood).
  float fd = vK.w > .5 ? dist : tn, den = vK.w > .5 ? uCaveDen : mix(uCaveDen, uFogDen, smoothstep(-22., -3., Pm.y));
  float f = exp(-den * den * fd * fd);
  // (THE STRENGTH: a well's beam takes the hour's strength of the wells' beams, uBeam; a great shaft takes ITS OWN,
  //  uBeamG, the hour's strength the two great shafts had before mendings 2 and 3 raised the night's for the wells)
  vec3 col = uDay * (vK.w > .5 ? uBeamG : uBeam) * glow * (ray * dust + mote * (vK.w > .5 ? .5 : 1.5) + drop * .9);
  col *= f;
  #ifdef MIRROR
  col *= .5 * (.2 + .8 * pow(1. - clamp(abs(D.y), 0., 1.), 2.5));
  #endif
  gl_FragColor = vec4(col, 1.);
}`;
// the prism that holds a shaft of light: n sides round the bell curve (1 at the top, foot at the foot), with both ends
// (its far walls are drawn, and the eye looks out of it through its ends)
function columnGeo(N = 6, ends = false, foot = 1.25) {
  const p = [], n = [], k = 1.0 / Math.cos(Math.PI / N);
  const tri = (a, b, c) => { for (const v of [a, b, c]) { p.push(v[0], v[1], v[2]); n.push(0, 1, 0); } };
  for (let i = 0; i < N; i++) {
    const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, c0 = Math.cos(a0) * k, s0 = Math.sin(a0) * k, c1 = Math.cos(a1) * k, s1 = Math.sin(a1) * k;
    const b0 = [c0 * foot, 0, s0 * foot], b1 = [c1 * foot, 0, s1 * foot], u0 = [c0, 1, s0], u1 = [c1, 1, s1];
    tri(b0, u0, u1); tri(b0, u1, b1);
    if (ends) { tri([0, 0, 0], b0, b1); tri([0, 1, 0], u1, u0); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  return g;
}
// a well's throat (the world scales it: radius 1, y from 0 at the lining's foot under the roof to 1 at the sky): the
// stone lining seen from inside, darker at its foot and bright toward the top, the round of sky that closes it, and
// across that round the well head's own beam, dark against the day (the rope hangs from its middle)
export function throatGeo() {
  const g = new Geo(), n = 10;
  g.cyl(0, 0, 1, 0, 1, 1, n, tint(C.lime, 0.16), MAT.daylit, true, tint(C.lime, 0.46));
  g.quad([-1.1, 1, -1.1], [1.1, 1, -1.1], [1.1, 1, 1.1], [-1.1, 1, 1.1], tint(C.day, 0.8), MAT.daylit);
  g.box(0, 0.975, 0, 2.1, 0.03, 0.2, tint(C.timberDark, 0.5)); g.cyl(0, 0.93, 0.975, 0, 0.16, 0.16, 6, tint(C.timberDark, 0.4));
  return g;
}
// a pipe or a pump's shaft through the roof into the water: an upright of bronze gone green, wet, flanged at four joints
// (unit height and radius; the world scales it)
export function pipeGeo() {
  // (verdigris, pale enough to stand as a pipe against the lit rock and not as a black bar)
  const g = new Geo(), c = [0.46, 0.72, 0.6];
  g.cyl(0, 0, 1, 0, 1, 1, 8, tint(c, 1.0), MAT.wet, false, tint(c, 1.45));
  for (const t of [0.14, 0.38, 0.62, 0.86]) g.cyl(0, t, t + 0.007, 0, 1.7, 1.7, 8, tint(c, 1.6), MAT.wet, true);
  return g;
}

// the plan radius a well's shaft of light is drawn within at the water (its prism's corners)
export const beamReach = (r) => (r + 0.12) * 2 * 2.2 / Math.cos(Math.PI / 6);
// the strength of a well's shaft of light, by its mouth's radius r: its breadth over the broadest mouth's
export const beamK = (r) => Math.min(1, r / WELL.bore[3][1]);

// ------------------------------------------------------------------ THE HERO: the lake under the rock
// opts (all optional; alone, it deals a lake, a roof and wells of its own): lake, deal ({ wells, grid } of dealWells),
// YW (the water's level), quay ({ x, z }), roofH (makeRoof's function: the world makes it, so the route and the rock
// are one form), piers ([{ x, z, r }]), pipes ([[x, z, r]]), big ([[x, z, r, gain, top, cut, seed] x 2]: the great
// shaft and the quay's shaft: the round of sky's radius, its light's gain, the height its light begins at, the radius
// cut out of the roof (its bell's foot) and its own seed), lip ([mean, wave, wave, round]: the great shaft's uneven
// foot by lipIn and its bell's own round: with it the roof is cut along that foot's 48 straight spans, not by the
// radius), shared (the world's light), slant ([x, z] metres the
// daylight leans between roof and water), beam, lamp, day, bounce, pool, noise.
export async function buildHero(ctx, opts = {}) {
  const rng = opts.rng || ctx.rng.fork('wells-hero'), noise = opts.noise || ctx.noise;
  const lake = opts.lake || makeLake(rng), YW = opts.YW ?? 0, shared = opts.shared || makeShared();
  const far = lake.edgeAt(-Math.PI / 2), quay = opts.quay || { x: far[0] * 0.84, z: far[1] * 0.84 };
  const big = opts.big || [[0, 0, 15, 1, YW + 40, 20, rng()], [quay.x, quay.z, 9, 1, YW + 40, 12, rng()]], piers = opts.piers || [];
  let roofH = opts.roofH;
  if (!roofH) {
    const W = { x: big[0][0], z: big[0][1] }, ex = quay.x - W.x, ez = quay.z - W.z, D = Math.hypot(ex, ez) || 1, n = [ex / D, ez / D];
    roofH = makeRoof(lake, noise, { W, quay, n, p: [-n[1], n[0]], D, dome: { a: D - 44, r: 52, h: 12 }, piers });
  }
  const roofY = (x, z) => YW + roofH(x, z), cutOf = (b) => b[5] ?? b[2];
  const clearBig = (w, m) => Math.hypot(w.x - big[0][0], w.z - big[0][1]) > cutOf(big[0]) + m && Math.hypot(w.x - big[1][0], w.z - big[1][1]) > cutOf(big[1]) + m;
  const deal = opts.deal || await dealWells(lake, rng, { keep: (w) => clearBig(w, w.r + 3) && roofH(w.x, w.z) > 5 });
  const { wells, grid } = deal, slant = opts.slant || [0, 0];
  const group = new THREE.Group(); group.name = 'buried-lake';
  const tWell = new THREE.DataTexture(grid.data, grid.nx, grid.nz, THREE.RGBAFormat, THREE.UnsignedByteType);
  tWell.magFilter = tWell.minFilter = THREE.NearestFilter; tWell.generateMipmaps = false; tWell.needsUpdate = true;
  const V3 = (c) => ({ value: new THREE.Vector3(c[0], c[1], c[2]) });
  const U = { ...shared, ...lake.uniforms, tWell: { value: tWell }, uGrid: { value: new THREE.Vector4(grid.x0, grid.z0, grid.cell, WELL.jitter) }, uGridN: { value: new THREE.Vector2(grid.nx, grid.nz) },
    uBig: { value: big.map((b) => new THREE.Vector4(b[0], b[1], b[2], b[3])) }, uBigCut: { value: new THREE.Vector2(cutOf(big[0]), cutOf(big[1])) }, uLip: { value: new THREE.Vector4(...(opts.lip || [0, 0, 0, 0])) }, uYW: { value: YW }, uCham: { value: opts.chamber ? opts.chamber.r : 0 },
    uLime: V3(COL.lime), uDay: V3(opts.day || COL.day), uBounce: V3(opts.bounce || [0.5, 0.42, 0.27]), uPool: V3(opts.pool || [0.6, 0.66, 0.2]),
    uLakeCol: V3(opts.lakeCol || mulc(COL.lake, 0.8)), uShallow: V3(opts.shallow || mulc(COL.shallows, 0.42)), uSand: V3(opts.sand || [0.3, 0.27, 0.19]), uRing: { value: new THREE.Vector4(quay.x, quay.z, opts.back ? opts.back[0] : 0, opts.back ? opts.back[1] : 1) },
    uLampCol: { value: new THREE.Vector3(1.0, 0.62, 0.25) }, uLampK: { value: opts.lamp ?? 0 }, uSlant: { value: new THREE.Vector2(slant[0], slant[1]) }, uBeam: { value: opts.beam ?? 0.3 }, uBeamG: { value: opts.beamGreat ?? opts.beam ?? 0.3 } };
  // THE LAKE'S OWN LIGHT, BY PLACE, baked once in a table of 2.5 m (tLake; the rock and the water both read it):
  //  G: the daylight the wells let down near a place (each well by its bore, within 11 to 28 m; the two great shafts,
  //     within 56 m; and THE GREAT SHAFT'S DAYLIGHT THROUGH ITS OWN CHAMBER (opts.chamber: { r }): a shaft thirty
  //     metres across lights the whole round under its dome, falling off slowly from the shaft (to a half at 26 m
  //     from its edge) and ending in the 16 m beyond the chamber's rim, behind its ring of piers. The table holds
  //     six tenths of it: what the dome's roof and the water take, whichever way they face; a pier takes it by the
  //     bearing of its face, below);
  //  R: how near a LIT POOL lies (every well's, by its bore; a great shaft's): where the water's light throws its net
  //     of ripples on rock, and the faint light the lake gives itself;
  //  B: how near a pier stands (the bed shows pale through the shallows about every rock).
  const cellsOf = new Map(); for (const w of wells) cellsOf.set(w.j * grid.nx + w.i, w);
  const [bx0, bz0, bx1, bz1] = lake.bounds, ssJ = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const LK = { m: 2.5, x0: bx0 - 15, z0: bz0 - 15 }; LK.nx = Math.ceil((bx1 + 15 - LK.x0) / LK.m) + 1; LK.nz = Math.ceil((bz1 + 15 - LK.z0) / LK.m) + 1; LK.d = new Float32Array(LK.nx * LK.nz * 3);
  const splat = (x, z, R, ch, f, most) => {
    const i0 = Math.max(0, Math.ceil((x - R - LK.x0) / LK.m)), i1 = Math.min(LK.nx - 1, Math.floor((x + R - LK.x0) / LK.m)), j0 = Math.max(0, Math.ceil((z - R - LK.z0) / LK.m)), j1 = Math.min(LK.nz - 1, Math.floor((z + R - LK.z0) / LK.m)), R2 = R * R;
    for (let j = j0; j <= j1; j++) { const dz = LK.z0 + j * LK.m - z; for (let i = i0; i <= i1; i++) { const dx = LK.x0 + i * LK.m - x, d2 = dx * dx + dz * dz; if (d2 < R2) { const k = (j * LK.nx + i) * 3 + ch, v = f(d2); LK.d[k] = most ? Math.max(LK.d[k], v) : LK.d[k] + v; } } }
  };
  // (EVERY well's pool throws the water's light about it, by one law: its reach by its bore (3 m and 1.6 times
  //  the bore's radius, three times that at the most: THE POOLS' LIGHT STAYS BY THE POOLS, the rock between is dark), its strength by its bore too, a third at the least)
  const throwOf = (w) => clampJ(w.r / 1.4, 0.34, 1);
  { let n = 0; for (const w of wells) {
    // (a well's daylight reaches as far as its bore tells: 7 m and nine times its bore's radius, 24 m at the most; its
    //  strength is by its mouth's area and, eight tenths of a metre's worth, by its bore; it falls off within a few
    //  metres of the shaft: the hall between the wells is dark rock, and the day lies about each shaft's foot)
    const r2 = w.r * w.r, RW = Math.min(24, 7 + 9 * w.r), R2 = RW * RW; splat(w.x, w.z, RW, 1, (d2) => 1.6 * (r2 + 0.8 * w.r) / (d2 * 0.35 + 6 + r2) * (1 - d2 / R2));
    { const rp = 1.6 * w.r + 3, k = throwOf(w); splat(w.x + slant[0], w.z + slant[1], 3 * rp, 0, (d2) => k * Math.exp(-d2 / (rp * rp))); }
    if (++n % 120 === 0) await ctx.yield();
  } }
  for (const b of big) {
    splat(b[0], b[1], 56, 1, (d2) => { const q = Math.sqrt(d2), d = Math.max(0, q - b[2]); return 1.3 * b[3] / (1 + (d / 9) ** 2) * (1 - ssJ(40, 56, q)); });
    splat(b[0], b[1], b[2] + 28, 0, (d2) => Math.exp(-(Math.max(0, Math.sqrt(d2) - b[2]) ** 2) / 120));
  }
  const cham = opts.chamber, chamAt = (q) => cham ? 0.9 * big[0][3] / (1 + (Math.max(0, q - big[0][2]) / 26) ** 2) * (1 - ssJ(cham.r, cham.r + 16, q)) : 0;
  if (cham) splat(big[0][0], big[0][1], cham.r + 16, 1, (d2) => 0.6 * chamAt(Math.sqrt(d2)));
  for (const pr of piers) splat(pr.x, pr.z, pr.r * 1.25 + 8, 2, (d2) => 1 - ssJ(pr.r * 1.25, pr.r * 1.25 + 8, Math.sqrt(d2)), true);
  // (and about every other rock that stands in the water: opts.shoals, [{ x, z, r }])
  for (const pr of opts.shoals || []) splat(pr.x, pr.z, pr.r + 7, 2, (d2) => 1 - ssJ(pr.r, pr.r + 7, Math.sqrt(d2)), true);
  await ctx.yield();
  const lightAt = (x, z) => {
    const fx = clampJ((x - LK.x0) / LK.m, 0, LK.nx - 1.001), fz = clampJ((z - LK.z0) / LK.m, 0, LK.nz - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = (j * LK.nx + i) * 3 + 1, w = LK.nx * 3;
    return Math.min(1.5, (LK.d[k] * (1 - u) + LK.d[k + 3] * u) * (1 - v) + (LK.d[k + w] * (1 - u) + LK.d[k + w + 3] * u) * v);
  };
  // (the long loops below are each a small function of their own, called a row or a piece at a time: the engine
  //  compiles a small function soon and well, and this long one is never taken up for it)
  { const px = new Uint8Array(LK.nx * LK.nz * 4);
    const fill = () => { for (let k = 0; k < LK.nx * LK.nz; k++) { px[k * 4] = Math.min(255, LK.d[k * 3] * 255); px[k * 4 + 1] = Math.min(255, LK.d[k * 3 + 1] / 1.5 * 255); px[k * 4 + 2] = Math.min(255, LK.d[k * 3 + 2] * 255); px[k * 4 + 3] = 0; } };
    fill();
    // (A: how near A MOORING'S LANTERN hangs (opts.moor: [{ x, z }], the lit ones): its warm light on the water under it,
    //  on the rock about it and on what floats or stands by it; a bell curve of 4 m about each, BY THE HOUR'S OWN
    //  STANDING STATE (opts.lant, written into the table once, here): full at night, six tenths at golden and
    //  dawn, a quarter by day)
    const lant = opts.lant == null ? 1 : opts.lant;
    for (const q of opts.moor || []) { const i0 = Math.max(0, Math.ceil((q.x - 11 - LK.x0) / LK.m)), i1 = Math.min(LK.nx - 1, Math.floor((q.x + 11 - LK.x0) / LK.m)), j0 = Math.max(0, Math.ceil((q.z - 11 - LK.z0) / LK.m)), j1 = Math.min(LK.nz - 1, Math.floor((q.z + 11 - LK.z0) / LK.m));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d2 = (LK.x0 + i * LK.m - q.x) ** 2 + (LK.z0 + j * LK.m - q.z) ** 2, k = (j * LK.nx + i) * 4 + 3; px[k] = Math.min(255, px[k] + 255 * lant * Math.exp(-d2 / 16)); } }
    const tLake = new THREE.DataTexture(px, LK.nx, LK.nz, THREE.RGBAFormat, THREE.UnsignedByteType); tLake.magFilter = tLake.minFilter = THREE.LinearFilter; tLake.generateMipmaps = false; tLake.needsUpdate = true;
    U.tLake.value = tLake; U.uLakeBox.value.set(LK.x0 - LK.m / 2, LK.z0 - LK.m / 2, 1 / (LK.nx * LK.m), 1 / (LK.nz * LK.m)); }
  // the roof: a lattice of 4 m by 3.2 m over the whole lake and 11 m beyond its shore, the whole hall alike (its
  // lines: roofLines, above; opts.fine is given by no world now); its heights are taken once
  const { xs, zs } = roofLines(lake, opts.fine || undefined), nx = xs.length - 1, nz = zs.length - 1, n1 = nx + 1;
  const hgt = new Float32Array(n1 * (nz + 1)), dst = new Float32Array(n1 * (nz + 1)).fill(99);
  const rowH = (j) => {
    for (let i = 0; i <= nx; i++) {
      // (dst is asked only whether a place lies over 11 m or 17 m outside the shore: inside the curve it is under
      //  nought whatever it is, and the roof asks the distance itself where it needs it)
      const x = xs[i], z = zs[j], k = j * n1 + i;
      const r0 = lake.rho(x, z);
      if (r0 < 1) { dst[k] = -1; hgt[k] = Math.max(roofH(x, z), -2.5); continue; }
      if (r0 - 1 > 17 * lake.lip) continue;   // (over 17 m outside for sure: dst keeps its 99)
      const d = lake.dist(x, z); dst[k] = d;
      if (d <= 17) hgt[k] = Math.max(roofH(x, z, -d), -2.5);
    }
  };
  for (let j = 0; j <= nz; j++) { rowH(j); if (j % 8 === 7) await ctx.yield(); }
  const hAt = (i, j, own) => (i < 0 || j < 0 || i > nx || j > nz || dst[j * n1 + i] > 17) ? own : hgt[j * n1 + i];
  const idx = new Int32Array(n1 * (nz + 1)).fill(-1), pos = [], nor = [], lgt = [], tris = [];
  const rowV = (j) => {
    for (let i = 0; i <= nx; i++) {
      const k = j * n1 + i; if (dst[k] > 11) continue;
      const x = xs[i], z = zs[j], h = hgt[k];
      const ex = (hAt(i + 1, j, h) - hAt(i - 1, j, h)) / (xs[Math.min(nx, i + 1)] - xs[Math.max(0, i - 1)]), ez = (hAt(i, j + 1, h) - hAt(i, j - 1, h)) / (zs[Math.min(nz, j + 1)] - zs[Math.max(0, j - 1)]), l = Math.hypot(ex, 1, ez);
      idx[k] = pos.length / 3; pos.push(x, YW + h, z); nor.push(ex / l, -1 / l, ez / l); lgt.push(lightAt(x, z), 0, 0);
    }
  };
  for (let j = 0; j <= nz; j++) { rowV(j); if (j % 12 === 11) await ctx.yield(); }
  const rowT = (j) => { for (let i = 0; i < nx; i++) {
    const a = idx[j * n1 + i], b = idx[j * n1 + i + 1], c = idx[(j + 1) * n1 + i + 1], d = idx[(j + 1) * n1 + i];
    if (a < 0 || b < 0 || c < 0 || d < 0) continue;
    tris.push(a, b, c, a, c, d);
  } };
  for (let j = 0; j < nz; j++) rowT(j);
  // THE GREAT WELL'S LIP, ITS UNDER SIDE AND ITS OUTER SIDE (P1; opts.lipBody: the world's lipForm, where its law is
  // written): THE ROOF'S OWN ROCK, one skin from the foot's line to the sheet, laid in the roof's own mesh: the roof's shader and its law of light take it by its own place and stored
  // direction (within the great well's reach: the one law of cure 1), and the water's mirror carries it as it
  // carries the roof (the roof's mesh is drawn twice, below). The lake table's light by its own place, as the roof's
  // places take it. In a step of its own.
  await ctx.yield();
  if (opts.lipBody) { const O = opts.lipBody.outer, base = pos.length / 3;
    for (let v = 0; v < O.pos.length; v += 3) { pos.push(O.pos[v], O.pos[v + 1], O.pos[v + 2]); nor.push(O.nor[v], O.nor[v + 1], O.nor[v + 2]); lgt.push(lightAt(O.pos[v], O.pos[v + 2]), 0, 0); }
    for (const t of O.tris) tris.push(base + t);
    await ctx.yield(); }
  const caveMat = new THREE.ShaderMaterial({ name: 'WellsCave', uniforms: U, vertexShader: CAVE_VERT, fragmentShader: CAVE_FRAG, side: THREE.DoubleSide });
  const caveMir = new THREE.ShaderMaterial({ name: 'WellsCaveMirror', uniforms: U, defines: { MIRROR: 1 }, vertexShader: CAVE_VERT, fragmentShader: CAVE_FRAG, side: THREE.DoubleSide });
  const mk = (p, n, l, t) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('aLight', new THREE.Float32BufferAttribute(l, 3)); if (t) g.setIndex(t); return g; };
  // each rock mesh is drawn twice: as it stands, and upside down under the water's level (what the still water shows)
  const rock = (geo, name) => {
    const m = new THREE.Mesh(geo, caveMat); m.name = name; m.frustumCulled = false; group.add(m);
    const r = new THREE.Mesh(geo, caveMir); r.name = name + 'Mirror'; r.frustumCulled = false; r.scale.y = -1; r.position.y = 2 * YW; group.add(r);
  };
  rock(mk(pos, nor, lgt, tris), 'roof');
  await ctx.yield();
  // the great piers: living rock from under the water up into the roof; and NEEDLES of rock hanging from the roof,
  // over the whole lake by the roof's own rule (below). Each needle makes all its draws; it is hung only where the
  // roof is rock over open water, where its tip stays over the water, and where it is not within the lane's true
  // clearance of the line (opts.gap, the world's own test of a post against the route, less the needle's half width).
  {
    // (five shapes of the nave's piers and three, of fewer sides, of the aisles' and the chamber's ring's; each pier is one of its kind's, turned as its place gives)
    const p = [], n = [], l = [], shapes = [], plain = [], pieces = []; let np = 0;
    for (let k = 0; k < Math.min(5, piers.length); k++) { shapes.push(pierGeo(rng)); if (k % 2) await ctx.yield(); }
    for (let k = 0; k < Math.min(3, piers.length); k++) plain.push(pierGeo(rng, 10));
    await ctx.yield();
    for (const pr of piers) {
      if (np++ % 6 === 5) await ctx.yield();
      // (a pier's light is asked for at sixteen bearings round its girth, not at every vertex. The table's light is
      //  the light about a place, whichever way a face looks; the great shaft's light through its chamber comes from
      //  one side: over the table's six tenths of it a pier's face takes as much again and more looking straight at the
      //  shaft (1.75 of it in all), less as it turns away, and a quarter of it side on or looking away: a pier in the
      //  chamber's light is lit on its side to the shaft)
      const pg = pr.nave === 0 ? plain[np % plain.length] : shapes[np % shapes.length], hh = roofH(pr.x, pr.z), la = [];
      for (let k = 0; k < 16; k++) {
        const bx = Math.cos(k / 16 * TAU), bz = Math.sin(k / 16 * TAU), x = pr.x + bx * pr.r * 1.3, z = pr.z + bz * pr.r * 1.3, ex = big[0][0] - x, ez = big[0][1] - z, q = Math.hypot(ex, ez);
        la.push(Math.min(1.5, lightAt(x, z) + chamAt(q) * (1.5 * Math.max(0, (bx * ex + bz * ez) / Math.max(q, 1e-3)) - 0.35)));
      }
      const tw = (pr.x * 0.37 + pr.z * 0.61) % TAU, tc = Math.cos(tw), ts = Math.sin(tw);
      const i0 = p.length; pierInto(pr, pg, hh, la, tc, ts); pieces.push({ i0, i1: p.length, kind: 2, hh, pier: 1, la, x: pr.x, z: pr.z });
    }
    // THE NATURAL BRIDGES (opts.arches: [{ A, B, crown, spring, deep, ph, wide, lean, notch }], two piers of the nave
    // each): a thick mass of the living rock hanging from the roof between pier and pier, with an opening worn under
    // it. Its under side springs low on each pier (spring, metres over the water at the pier's axis) and is highest at
    // its crown (crown), which lies off the middle (lean: the share of the span at which it lies), so its two
    // haunches are unequal; it is wide (wide, its half breadth at the crown, more toward the piers), its top is in
    // the roof's own rock, its line wanders between the piers, every part of its skin is pushed in and out by the
    // rock's own noise (lumps hang under it), and where a block has fallen out of it (notch) its under side steps
    // up and it is narrower. Its section is a round of eight, smooth shaded: it has no edge.
    for (const A of opts.arches || []) { const i0 = p.length; archInto(A); pieces.push({ i0, i1: p.length, kind: 3, hh: 0 }); }
    // (and what the world hands it of loose rock lying in the water: opts.blocks, [{ p, n }], triangles in the world's
    //  own metres with their normals: drawn with the piers, each point lit by the table's daylight at its place)
    for (const B of opts.blocks || []) { const i0 = p.length; for (let i = 0; i < B.p.length; i += 3) { p.push(B.p[i], B.p[i + 1], B.p[i + 2]); n.push(B.n[i], B.n[i + 1], B.n[i + 2]); l.push(lightAt(B.p[i], B.p[i + 2]), 2, 0); } pieces.push({ i0, i1: p.length, kind: 2, hh: 0 }); }
    function archInto(A) {
      const N = 20, M = 8, dx = A.B.x - A.A.x, dz = A.B.z - A.A.z, len = Math.hypot(dx, dz) || 1, vx = -dz / len, vz = dx / len, s0 = A.lean ?? 0.5, wide = A.wide ?? 3, rings = [];
      for (let i = 0; i <= N; i++) {
        const s = i / N, e = s < s0 ? (s - s0) / s0 : (s - s0) / (1 - s0), e2 = e * e, off = 1.6 * Math.sin(A.ph + 3.1 * s) * (1 - e2), cx = A.A.x + dx * s + vx * off, cz = A.A.z + dz * s + vz * off;
        const gap = A.notch ? Math.min(1, 2.5 * Math.max(0, 1 - Math.abs(s - A.notch.s) / A.notch.len)) : 0;
        const yU = A.spring + (A.crown - A.spring) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(e), 2.4)), 0.8) + (A.notch ? A.notch.up * gap : 0), top = Math.max(roofH(cx, cz) + 1.2, yU + A.deep), mid = (yU + top) / 2, hh = (top - yU) / 2;
        const hw = wide * (1 + 0.7 * e2) * (1 - 0.3 * gap), lt = lightAt(cx, cz), ring = [];
        for (let k = 0; k < M; k++) {
          const t = (k + 0.5) / M * TAU, ct = Math.cos(t), st = Math.sin(t);
          const rough = 0.6 * noise.n2(cx * 0.27 + ct * 1.9 + 5, cz * 0.27 + st * 1.9) + 0.35 * noise.n2(cx * 0.8 + ct * 4.3 + 9, cz * 0.8 + st * 4.3);
          const w = hw * (1 + 0.28 * rough) * (st < 0 ? 0.8 : 1), y = mid + st * hh + (st < 0 ? 0.55 * rough * -st : 0), nl = Math.hypot(ct * hh, st * w) || 1;
          ring.push([cx + vx * ct * w, YW + y, cz + vz * ct * w, vx * ct * hh / nl, st * w / nl, vz * ct * hh / nl, lt]);
        }
        rings.push(ring);
      }
      for (let i = 0; i < N; i++) for (let k = 0; k < M; k++) {
        const a = rings[i][k], b = rings[i][(k + 1) % M], c = rings[i + 1][(k + 1) % M], d = rings[i + 1][k];
        for (const v of [a, b, c, a, c, d]) { p.push(v[0], v[1], v[2]); n.push(v[3], v[4], v[5]); l.push(v[6], 3, v[1] - YW); }
      }
    }
    // (a pier's DRAWN girth may be its own: pr.gx and pr.gz, shares of its plan radius along its own two axes before
    //  it is turned: the chamber's ring piers are so, each stouter or leaner and a little oval)
    function pierInto(pr, pg, hh, la, tc, ts) {
      const gx = pr.gx || 1, gz = pr.gz || 1;
      for (let i = 0; i < pg.p.length; i += 3) { const ax = pg.p[i] * gx, az = pg.p[i + 2] * gz, qx = ax * tc + az * ts, qz = -ax * ts + az * tc, x = pr.x + qx * pr.r, y = pg.p[i + 1] * hh, z = pr.z + qz * pr.r, nx = pg.n[i] / gx, nz = pg.n[i + 2] / gz, nl = Math.hypot(nx, nz) || 1; p.push(x, YW + y, z); n.push((nx * tc + nz * ts) / nl, 0, (-nx * ts + nz * tc) / nl); l.push(la[Math.round(Math.atan2(qz, qx) / TAU * 16 + 16) % 16], 2, pg.p[i + 1]); }
    }
    // THE CUT'S FACE (a law of the rock, for every cut alike). The rock that stands, hangs or lies (a pier, a bridge,
    // a fallen block) is a skin, and the shader takes away what of it lies inside a well's round (CAVE_FRAG: the bore's
    // own round; the ring's outer round on a bridge and on a pier's shoulder, eased in from 0.7 to 0.86 of the pier's
    // height). Where a round meets a piece, the round's own wall THROUGH THE PIECE'S SOLID is laid here as rock: at
    // every bearing of the round (24 to 72 of them, by its girth) the runs of height at which the round's wall lies
    // inside the piece are found on the piece's own triangles (a ray's parity: level through a pier or a block, plumb
    // through a bridge; every run's two ends found to a hundredth of a metre), neighbouring bearings' runs are joined
    // by faces, and where the wall leaves the piece between two bearings the last bearing inside it is found the same
    // way and the face carried to it. The wall is by the same round the shader cuts (the well's place and bore as the
    // wells' table holds them, to its last step), from the water up to the roof's own sheet; it faces the bore, takes
    // the rock's own stone and light (aLight.y: the piece's kind and a quarter, so the shader knows it for a face and
    // cuts nothing from it) and is mirrored with the rest. A bore that runs wholly inside a pier is seen from nowhere
    // and gets none. No stream is drawn. group.userData.cuts: [{ x, z, r, kind, y0, y1, tris }], for the builder's counts.
    async function cutFaces() {
      const WJ = WELL.jitter, cuts = [], ssF = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      for (const pc of pieces) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = -1e9; for (let i = pc.i0; i < pc.i1; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); y1 = Math.max(y1, p[i + 1]); } pc.b = [x0, x1, z0, z1, y1]; }
      await ctx.yield();
      let nw = 0;
      for (const w of wells) {
        if (++nw % 300 === 0) await ctx.yield();
        const k4 = (w.j * grid.nx + w.i) * 4, cx = grid.x0 + (w.i + 0.5) * grid.cell + (grid.data[k4] / 255 - 0.5) * 2 * WJ, cz = grid.z0 + (w.j + 0.5) * grid.cell + (grid.data[k4 + 1] / 255 - 0.5) * 2 * WJ, r = grid.data[k4 + 2] / 255 * 3.6, ring = 0.4 + 0.22 * r, rm = r + ring;
        if (r < 0.01) continue;
        for (const pc of pieces) {
          const b = pc.b; if (cx + rm < b[0] || cx - rm > b[1] || cz + rm < b[2] || cz - rm > b[3]) continue;
          await ctx.yield(); await cutOne(pc, cx, cz, r, ring, rm, cuts, ssF); await ctx.yield();   // (a hand-back before and after every cut, and within it)
        }
      }
      group.userData.cuts = cuts;
    }
    async function cutOne(pc, cx, cz, r, ring, rm, cuts, ssF) {
      // (the piece's triangles that can meet the round, laid by the ray's own axes: u, v across it, q along it)
      const lev = pc.kind === 2, T = [];
      for (let i = pc.i0; i < pc.i1; i += 9) {
        const xa = Math.min(p[i], p[i + 3], p[i + 6]), xb = Math.max(p[i], p[i + 3], p[i + 6]), za = Math.min(p[i + 2], p[i + 5], p[i + 8]), zb = Math.max(p[i + 2], p[i + 5], p[i + 8]);
        if (zb < cz - rm || za > cz + rm || xb < cx - rm || (!lev && xa > cx + rm)) continue;
        if (lev) T.push(p[i + 1], p[i + 2], p[i], p[i + 4], p[i + 5], p[i + 3], p[i + 7], p[i + 8], p[i + 6]); else T.push(p[i], p[i + 2], p[i + 1], p[i + 3], p[i + 5], p[i + 4], p[i + 6], p[i + 8], p[i + 7]);
      }
      if (!T.length) return;
      const rhoAt = (y) => pc.kind === 3 ? rm : r + (pc.pier ? ssF(0.7, 0.86, (y - YW) / pc.hh) : 0) * ring;
      const inside = (th, y) => {
        const ro = rhoAt(y), X = cx + ro * Math.cos(th), Z = cz + ro * Math.sin(th), pu = lev ? y : X, pv = Z, pq = lev ? X : y; let c = 0;
        for (let i = 0; i < T.length; i += 9) {
          const d1 = (T[i + 3] - T[i]) * (pv - T[i + 1]) - (T[i + 4] - T[i + 1]) * (pu - T[i]), d2 = (T[i + 6] - T[i + 3]) * (pv - T[i + 4]) - (T[i + 7] - T[i + 4]) * (pu - T[i + 3]), d3 = (T[i] - T[i + 6]) * (pv - T[i + 7]) - (T[i + 1] - T[i + 7]) * (pu - T[i + 6]);
          if ((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)) continue;
          const A = d1 + d2 + d3; if (A === 0) continue;
          if ((d2 * T[i + 2] + d3 * T[i + 5] + d1 * T[i + 8]) / A > pq) c++;
        }
        return (c & 1) === 1;
      };
      const yLo = YW - 0.3, topAt = (th) => Math.min(pc.b[4], YW + roofH(cx + rm * Math.cos(th), cz + rm * Math.sin(th)) + 0.3);
      // (a bearing's runs: sampled every 0.45 m, each end then halved ten times)
      const runs = (th) => { const yHi = topAt(th), R = []; let was = false, y0 = 0, prev = yLo;
        const edge = (a, bb, ina) => { for (let k = 0; k < 10; k++) { const m = (a + bb) / 2; if (inside(th, m) === ina) a = m; else bb = m; } return (a + bb) / 2; };
        for (let y = yLo; ; y += 0.45) { const yy = Math.min(y, yHi), is = inside(th, yy);
          if (is && !was) y0 = yy === yLo ? yLo : edge(prev, yy, false); else if (!is && was) R.push([y0, edge(prev, yy, true)]);
          was = is; prev = yy; if (yy >= yHi) { if (was) R.push([y0, yHi]); break; } }
        return R; };
      await cutLay(pc, cx, cz, r, rm, rhoAt, inside, runs, cuts);
    }
    async function cutLay(pc, cx, cz, r, rm, rhoAt, inside, runs, cuts) {
      const K = Math.min(72, Math.max(24, Math.round(20 * rm) + 8)), b = pc.b, kindF = pc.kind + 0.25;
      // (a pier's runs are parted at the heights between which its round widens, so the faces follow the widening)
      const lv = pc.pier ? [0.7, 0.75, 0.8, 0.86].map((t) => YW + t * pc.hh) : [];
      const part = (R) => { const o = []; for (const q of R) { let y = q[0], band = 0; for (const v of lv) { if (v > y && v < q[1]) { o.push([y, v, band]); y = v; } if (v <= y) band++; } o.push([y, q[1], band]); } return o; };
      const near = (th) => { const X = cx + rm * Math.cos(th), Z = cz + rm * Math.sin(th); return X > b[0] - rm && X < b[1] + rm && Z > b[2] - rm && Z < b[3] + rm; };
      let cols = [], th = []; for (let k = 0; k < K; k++) { th.push(k / K * TAU); cols.push(near(th[k]) ? part(runs(th[k])) : []); if (k % 12 === 11) await ctx.yield(); }
      if (!cols.some((c) => c.length)) return;
      // (where two neighbouring bearings' runs end more than 0.2 m apart in height (a pier's flare under the roof, a
      //  bridge's rough under side) a bearing is set between them, three times at the most: the faces' edges keep to
      //  the piece's own edge)
      for (let pass = 0; pass < 3; pass++) { const t2 = [], c2 = []; let add = 0; await ctx.yield();
        for (let k = 0; k < th.length; k++) { const A = cols[k], B = cols[(k + 1) % th.length], t0 = th[k], t1 = k + 1 < th.length ? th[k + 1] : TAU; t2.push(t0); c2.push(A);
          let rough = false; for (const a of A) for (const q of B) if (q[2] === a[2] && q[0] < a[1] && a[0] < q[1] && (Math.abs(q[0] - a[0]) > 0.2 || Math.abs(q[1] - a[1]) > 0.2)) rough = true;
          if (rough) { const m = (t0 + t1) / 2; t2.push(m); c2.push(part(runs(m))); add++; } }
        th = t2; cols = c2; if (!add) break; }
      const KN = th.length; await ctx.yield();
      const Q = [], bands = lv.length + 1, full = new Array(bands).fill(0), open = new Array(bands).fill(0);
      const quad = (t0, a, t1, bb) => Q.push([t0, a[0], a[1], t1, bb[0], bb[1], a[2]]);
      // (where a run has no fellow at the next bearing: the last bearing at which the wall is still in the piece at the
      //  run's middle height, found by halving; the face is carried to that bearing's own run)
      //  (the gap between the two bearings is first halved three times, the run followed through each half that still
      //   holds it: the face follows the piece's own edge by steps of an eighth of the gap, not at the middle height
      //   alone. IT DOES NOT KEEP TO THE EDGE EVERYWHERE: by the reader's measure of mending 1 slits of up to
      //   0.36 m are left open and flaps of up to 0.30 m stand proud far from the line, none over 0.18 m within 8 m of it)
      const close = (t0, a, t1, dep = 0) => { const ym = (a[0] + a[1]) / 2;
        if (!dep) open[a[2]]++;
        if (dep < 3) { const m = (t0 + t1) / 2, e = part(runs(m)).find((q) => q[2] === a[2] && q[0] < a[1] && a[0] < q[1]); if (e) { quad(t0, a, m, e); close(m, e, t1, dep + 1); } else close(t0, a, m, dep + 1); return; }
        let x0 = t0, x1 = t1; for (let k = 0; k < 7; k++) { const m = (x0 + x1) / 2; if (inside(m, ym)) x0 = m; else x1 = m; }
        if (Math.abs(x0 - t0) < 1e-4) return;
        const e = part(runs(x0)).find((q) => q[2] === a[2] && q[0] < ym && q[1] > ym); quad(t0, a, x0, e || [ym, ym, a[2]]); };
      for (let k = 0; k < KN; k++) { const A = cols[k], B = cols[(k + 1) % KN], t0 = th[k], t1 = k + 1 < KN ? th[k + 1] : TAU;
        for (const a of A) { let met = false; for (const q of B) if (q[2] === a[2] && q[0] < a[1] && a[0] < q[1]) { quad(t0, a, t1, q); met = true; } if (!met) close(t0, a, t1); }
        for (const q of B) if (!A.some((a) => q[2] === a[2] && a[0] < q[1] && q[0] < a[1])) close(t1, q, t0); }
      for (const c of cols) { const seen = new Set(c.map((q) => q[2])); for (const bd of seen) full[bd]++; }
      // (a face in a pier takes THE PIER'S OWN LIGHT at its bearing from the pier's axis, one of the sixteen its skin
      //  was given: the light of the rock beside it; a face in a block the table's at its place, as the block's skin
      //  does; a face in a bridge is lit by the shader from the table, as the bridge is)
      const at = (t, y) => { const ro = rhoAt(y), c = Math.cos(t), sn = Math.sin(t), x = cx + ro * c, z = cz + ro * sn; p.push(x, y, z); n.push(-c, 0, -sn);
        l.push(pc.pier ? pc.la[Math.round(Math.atan2(z - pc.z, x - pc.x) / TAU * 16 + 16) % 16] : lightAt(x, z), kindF, pc.pier ? (y - YW) / pc.hh : y - YW); };
      let tris = 0, y0 = 1e9, y1 = -1e9;
      for (const q of Q) {
        // (a bore's wall wholly inside a pier, all the way round at its height, is seen from nowhere: not laid)
        if (pc.pier && full[q[6]] === KN && open[q[6]] === 0) continue;
        at(q[0], q[1]); at(q[3], q[4]); at(q[3], q[5]); tris++; if (q[2] - q[1] > 1e-3) { at(q[0], q[1]); at(q[3], q[5]); at(q[0], q[2]); tris++; }
        y0 = Math.min(y0, q[1], q[4]); y1 = Math.max(y1, q[2], q[5]);
      }
      if (tris) cuts.push({ x: cx, z: cz, r, rm, kind: pc.kind, pier: pc.pier ? 1 : 0, hh: pc.hh, i0: pc.i0 / 3, i1: pc.i1 / 3, f1: p.length / 3, tris, y0, y1 });
    }
    await ctx.yield();
    if (roofH.at && roofH.G) {
      // NEEDLES HANG BY THE ROOF'S OWN RULE, OVER THE WHOLE LAKE: thick across the nave abreast of each of its piers (where the roof sags to the pier), and
      // elsewhere in clusters along the roof's cracks (a slow field of the rock's own places). Each makes all its draws;
      // it is hung only where the roof is rock over open water (not in a well's mouth), where its tip stays over the
      // water, and (the line's true clearance) where it would not hang within opts.clear of the route: opts.gap is the
      // world's own test of an upright post against the line, the needle's half width taken off.
      const G = roofH.G, clear = opts.clear ?? 2.6, needle = (x, z, len, rad, tw) => {
        const hr = roofH(x, z); if (hr < 3.4 || hr - len < 1.2 || !lake.inside(x, z, 6)) return;
        const ci = Math.floor((x - grid.x0) / grid.cell), cj = Math.floor((z - grid.z0) / grid.cell), up = 0.9 + 1.2 * rad, rr = rad * (len + up) / (len + 0.4);
        // (no needle hangs from a mouth's ring of dressed stones: it keeps the ring's outer round, and its own root's girth, off every well)
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const w = cellsOf.get((cj + dj) * grid.nx + ci + di); if (w && (w.x - x) ** 2 + (w.z - z) ** 2 < (w.r * 1.22 + 0.4 + rr + 0.05) ** 2) { group.userData.needlesWell = (group.userData.needlesWell || 0) + 1; return; } }
        for (const b of big) if (Math.hypot(x - b[0], z - b[1]) < cutOf(b) + rad + 0.5) return;
        if (opts.gap && opts.gap(x, z, YW + hr - len, YW + hr) - rad < clear) { group.userData.needlesOut = (group.userData.needlesOut || 0) + 1; return; }   // (counted: for the builder's own counts)
        // (P1: a needle whose root stands within the great well's lip's ground (from the cut edge to 4 m out, its own root's girth with it) is LEFT OUT, after its draws: it would stand in the lip's body. Counted)
        if (opts.lipBody && opts.lipBody.ground(x, z, rr)) { group.userData.needlesLip = (group.userData.needlesLip || 0) + 1; return; }
        const lt = lightAt(x, z), N = 5;
        group.userData.needles = (group.userData.needles || 0) + 1;   // (the count of needles hung: for the builder's own counts)
        for (let k = 0; k < N; k++) {
          const a0 = tw + k / N * TAU, a1 = tw + (k + 1) / N * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          // (the root is carried up into the rock, 0.9 m and its own girth over the roof at its axis, on the same cone:
          //  no root shows under a roof that slopes, and what hangs below the roof is as it was)
          p.push(x + c0 * rr, YW + hr + up, z + s0 * rr, x + c1 * rr, YW + hr + up, z + s1 * rr, x, YW + hr - len, z);
          n.push(c0, 0, s0, c1, 0, s1, (c0 + c1) / 2, 0, (s0 + s1) / 2); l.push(lt, 3, hr + up, lt, 3, hr + up, lt, 3, hr - len);
        }
      };
      await ctx.yield();
      { const nvv = G.nave || { half: 11, bay: 21, a0: 0, a1: G.D }, nb = Math.max(1, Math.floor((nvv.a1 - nvv.a0) / nvv.bay)), own = piers.filter((q) => q.nave);
        for (let k = 0; k < 260; k++) { const u = rng(), a = (own.length ? own[Math.floor(u * own.length)].a : nvv.a0 + Math.floor(u * (nb + 1)) * nvv.bay) + rng.range(-2.6, 2.6), c = rng.range(-nvv.half, nvv.half), len = 0.6 + 2.4 * rng() ** 2, rad = 0.06 + len * rng.range(0.1, 0.17), tw = rng.range(0, TAU), q = roofH.at(a, c); needle(q[0], q[1], len, rad, tw); } }
      await ctx.yield();
      const some = (k0, k1) => { for (let k = k0; k < k1; k++) {
        const x = rng.range(bx0, bx1), z = rng.range(bz0, bz1), len = 0.8 + 3.2 * rng() ** 2, rad = 0.07 + len * rng.range(0.09, 0.15), tw = rng.range(0, TAU);
        if (noise.n2(x * 0.045 + 7.7, z * 0.045 - 2.2) > 0.12) needle(x, z, len, rad, tw);
      } };
      for (let k = 0; k < 3400; k += 200) { some(k, k + 200); await ctx.yield(); }
    }
    await cutFaces();
    if (p.length) rock(mk(p, n, l, null), 'piers');
  }
  await ctx.yield();
  // the beach: a band round the whole shore from 6 m inside the waterline (under water) to 13 m outside (under the roof's edge)
  {
    const p = [], n = [], l = [], t = [], N = 300, rows = [-6, -1.5, 1.5, 6, 13];
    for (let k = 0; k <= N; k++) {
      const th = k / N * TAU, e = lake.edgeAt(th), e2 = lake.edgeAt(th + 0.01), tx = e2[0] - e[0], tz = e2[1] - e[1], tl = Math.hypot(tx, tz) || 1, ox = tz / tl, oz = -tx / tl;
      const sg = (e[0] * ox + e[1] * oz) > 0 ? 1 : -1;
      for (const out of rows) { const x = e[0] + sg * ox * out, z = e[1] + sg * oz * out, sl = 0.22; p.push(x, YW + beachY(out), z); n.push(-sg * ox * sl, 1, -sg * oz * sl); l.push(lightAt(x, z) * 0.8 + 0.25, 1, out); }
    }
    const R = rows.length; for (let k = 0; k < N; k++) for (let r = 0; r < R - 1; r++) { const a = k * R + r, b = (k + 1) * R + r; t.push(a, b, b + 1, a, b + 1, a + 1); }
    const beach = new THREE.Mesh(mk(p, n, l, t), caveMat); beach.name = 'beach'; beach.frustumCulled = false; group.add(beach);
  }
  await ctx.yield();
  return finishHero(ctx, { opts, group, U, lake, YW, wells, grid, big, quay, slant, roofY, roofH, shared, tWell });
}
async function finishHero(ctx, H) {
  const { opts, group, U, lake, YW, wells, big, quay, slant, roofY, roofH, shared, tWell } = H, [bx0, bz0, bx1, bz1] = lake.bounds;
  // the bed (black, far down: the mirrored rock and the mirrored shafts of light stand between it and the surface) and the water over it
  const bedG = new THREE.BufferGeometry(), bedY = YW - 64, x0 = bx0 - 20, x1 = bx1 + 20, z0 = bz0 - 20, z1 = bz1 + 20, yt = YW - 0.03;
  bedG.setAttribute('position', new THREE.Float32BufferAttribute([x0, bedY, z0, x0, bedY, z1, x1, bedY, z1, x1, bedY, z0, x0, yt, z0, x0, yt, z1, x1, yt, z1, x1, yt, z0], 3));
  bedG.setIndex([0, 1, 2, 0, 2, 3, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0]);
  const bed = new THREE.Mesh(bedG, new THREE.MeshBasicMaterial({ color: 0x010304, fog: false, side: THREE.DoubleSide })); bed.name = 'bed'; bed.frustumCulled = false; group.add(bed);
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute([bx0 - 20, YW, bz0 - 20, bx0 - 20, YW, bz1 + 20, bx1 + 20, YW, bz1 + 20, bx1 + 20, YW, bz0 - 20], 3)); wg.setIndex([0, 1, 2, 0, 2, 3]);
  const water = new THREE.Mesh(wg, new THREE.ShaderMaterial({ name: 'WellsWater', uniforms: U, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }', fragmentShader: WATER_FRAG }));
  water.name = 'water'; water.frustumCulled = false; water.renderOrder = 2; group.add(water);
  // each well's throat: the lining goes from under the roof's lowest edge round the mouth up to the round of sky
  const rimOf = (w) => { let lo = 1e9, hi = -1e9; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, y = roofH(w.x + Math.cos(a) * (w.r + 0.1), w.z + Math.sin(a) * (w.r + 0.1)); lo = Math.min(lo, y); hi = Math.max(hi, y); } return [lo, hi]; };
  // CURE 1, PART A (the throat's make is unchanged: one unit lining of ten flat sides, set by its instance):
  // - NO SLOT BETWEEN THE ROOF'S CUT AND THE THROAT (A2). The roof is cut by a round of the well's own radius r about
  //   its axis (CAVE_FRAG, from the wells' table); the throat's corners stood at r + 0.06 m, so the middle of each of
  //   its ten flat sides stood at 0.951 (r + 0.06) m: inside the cut for every well over 1.17 m of radius, by up to
  //   0.105 m: a slot. The throat's corners now stand at the greater of r + 0.06 m (as they stood) and
  //   (r + 0.01) / cos 18 degrees, so the middle of every side stands OUTSIDE the cut's round: the cut lies inside
  //   the throat's body all round. THE AIM IS 0.01 m OUTSIDE; AS COUNTED on 200 seeds the least stands a hair under
  //   the aim, 0.009985 m, by the rounding of single floats. No throat is narrower than it was; a well under 0.96 m
  //   of radius keeps its throat's BREADTH to the bit (its foot may still hang lower, by the next point: 10,498
  //   such feet are lower on 200 seeds); the broadest (3.3 m) is 0.12 m wider at its corners. The roof's cut is
  //   not moved.
  //   SAID IN THE OPEN: THE SLOT IS CLOSED BY A WIDER THROAT, NOT BY CUTTING THE ROOF TO IT. So A LEDGE OF THE
  //   ROOF'S OWN SHEET is left inside every throat, between the roof's round cut and the throat's flat sides:
  //   0.010 to 0.043 m broad at a side's middle and up to 0.18 m at a corner of the broadest wells. It is rock in
  //   the throat's own bore; by the counter's rays 13 single rays on 9 of 200 seeds meet its upper side from under
  //   (nothing behind the shell is seen by them).
  // - EVERY FOOT HANGS UNDER THE ROOF AS DRAWN (A1). The foot is LEVEL (one height: the lining is one drawn thing for
  //   all wells and is set by its instance alone) and stands at the lower of where it stood (0.3 m under the lowest
  //   of the roof's smooth law at eight places round the mouth) and 0.2 m under THE LOWEST OF THE ROOF'S DRAWN SHEET
  //   ALONG THE FOOT'S OWN TEN SPANS (roofDrawn, the lattice's own triangles, read at every corner and at every
  //   place on a span where the sheet changes plane: between two of them the sheet is one plane, so its lowest on a
  //   span is at one of them). A foot that already hung so far under the drawn sheet all along is not moved.
  //   (It is hung 0.201 m under: the one millimetre is for the rounding of the drawn heights to single floats,
  //   0.00001 m at these heights, so that the foot as drawn stands 0.2 m and more under the sheet as drawn.)
  // (cure 1 mending 1: THE FEET'S READING IS A STEP OF ITS OWN, between a hand-back before it and one after it:
  //  finishHero is an async function for that, and buildHero, its one caller, returns its promise. A hand-back
  //  draws nothing from any stream and changes no instance. The wells are read in runs of 120 with a hand-back
  //  between runs: read in one run the step was over 25 ms cold on the densest seeds.)
  await ctx.yield();
  const tl = [], roofLat = roofDrawn(lake, roofH), C10 = Math.cos(Math.PI / 10); let nFeet = 0;
  for (const w of wells) {
    if (w.lo === undefined) { const q = rimOf(w); w.lo = q[0]; w.hi = q[1]; }
    const tr = Math.max(w.r + 0.06, (w.r + 0.01) / C10); let low = 1e9;
    for (let k = 0; k < 10; k++) { const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU, x0 = w.x + Math.cos(a0) * tr, z0 = w.z + Math.sin(a0) * tr, x1 = w.x + Math.cos(a1) * tr, z1 = w.z + Math.sin(a1) * tr;
      for (const t of roofLat.kinks(x0, z0, x1, z1)) low = Math.min(low, roofLat(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)); }
    w.yLo = YW + Math.min(w.lo - 0.3, low - 0.201); w.yHi = YW + Math.max(w.hi, roofH(w.x, w.z)) + 2.6 + 0.5 * w.r;
    tl.push({ m: new THREE.Matrix4().makeScale(tr, w.yHi - w.yLo, tr).setPosition(w.x, w.yLo, w.z) });
    if (++nFeet % 120 === 0) await ctx.yield();
  }
  await ctx.yield();
  const throats = instanced(throatGeo().build(), liftMaterial(shared, 0), tl, 'throats'); group.add(throats);
  // the shafts of daylight: one to a well from its mouth in the roof to its pool on the water, and the two
  // great ones; each is drawn again upside down under the water's level (what the still water shows of it)
  const mat = (r, hh, y0, x, z) => new THREE.Matrix4().set(r, -slant[0], 0, x + slant[0], 0, hh, 0, y0, 0, -slant[1], r, z + slant[1], 0, 0, 0, 1);
  const small = [], smallM = [], great = [], greatM = [];
  // (a well's shaft stands from the water to the highest edge of its mouth in the roof: where the roof slopes, the
  //  part of it over the mouth's low edge is inside the rock and unseen; above the mouth the throat's own lit lining shows)
  // A BEAM'S STRENGTH IS ITS WELL'S OWN (beamK). THE AIR UNDER EVERY WELL IS LIT ALIKE, so a beam is as strong as
  // the metres of lit air a look crosses in it: by its mouth's breadth, as a share of the broadest mouth the deal
  // makes (WELL.bore's last, 3.3 m of radius: full strength; a well of half that breadth a half). As dealt: a
  // cistern's beam 0.79 to 1, a public well's 0.45 to 0.64, a yard well's 0.19 to 0.3, a house well's 0.09 to
  // 0.15. By the plan alone: the same wherever the eye stands. (The mouth's AREA was tried first, mending 3's
  // first look: a public well's beam 0.2 to 0.4, a yard well's under a tenth; frames with wells in view and no
  // beam under their lit mouths. Breadth is the truer: it is what "the metres of lit air" means.)
  for (const w of wells) {
    const sg = w.r + 0.12, move = [beamK(w.r), w.phase, (Math.round(w.phase * 255) * 7) % 10 < 3 ? 1 : 0, 0], hh = Math.max(w.lo, w.hi) + 0.25;
    small.push({ m: mat(sg * 2, hh, YW, w.x, w.z), move }); smallM.push({ m: mat(sg * 2, -hh, YW, w.x, w.z), move });
  }
  // (the lit air under the second great shaft, the widest well's over the landing, is a third as thick as the great
  //  well's: the landing under it is seen through it and is not veiled by it)
  big.forEach((b, i) => {
    const top = b[4] ?? roofY(b[0], b[1]), move = [(i ? 0.04 : 0.12) * b[3], b[6] ?? 0.5, 0, 1], hh = top - YW;
    great.push({ m: mat(b[2] * 0.8, hh, YW, b[0], b[1]), move }); greatM.push({ m: mat(b[2] * 0.8, -hh, YW, b[0], b[1]), move });
  });
  const beamMat = (name, side, mirror) => new THREE.ShaderMaterial({ name, uniforms: U, defines: mirror ? { MIRROR: 1 } : {}, vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side });
  // (a mirrored instance turns its faces over, so the mirrors take the other side)
  const beams = instanced(columnGeo(6, true, 2.2), beamMat('WellsBeam', THREE.BackSide, false), small, 'beams'); beams.renderOrder = 4;
  const beamsM = instanced(columnGeo(6, true, 2.2), beamMat('WellsBeamMirror', THREE.FrontSide, true), smallM, 'beamsMirror'); beamsM.renderOrder = 3;
  const greats = instanced(columnGeo(12, true), beamMat('WellsGreat', THREE.BackSide, false), great, 'great'); greats.renderOrder = 4;
  const greatsM = instanced(columnGeo(12, true), beamMat('WellsGreatMirror', THREE.FrontSide, true), greatM, 'greatMirror'); greatsM.renderOrder = 3;
  group.add(beams, beamsM, greats, greatsM);
  // the buckets and their ropes: one length from the pulley at the well head to the water, the bucket dipping 0.25 m.
  // A bucket is as large as its well's bore lets it be, whatever the eye's distance; a rope is as thick as a wrist
  // wherever the picture can hold that breadth, and one picture element broad, paid back in strength, where it cannot (LIFT_VERT).
  const bl = [], rl = [], tip = 0.9;
  for (const w of wells) {
    if (w.bare) continue;
    const S = Math.min(1.9, Math.max(0.85, w.r * 0.85 / 0.3)), travel = (w.topY - 0.9 - 0.62 * S) - (YW - 0.25);
    bl.push({ m: new THREE.Matrix4().makeRotationY(w.phase * 40).scale(new THREE.Vector3(S, S, S)).setPosition(w.x, w.topY - 0.9, w.z), move: [w.period, w.phase, travel, tip] });
    rl.push({ m: new THREE.Matrix4().makeTranslation(w.x, w.topY, w.z), move: [w.period, w.phase, travel, 0.9] });
    w.travel = travel; w.bucket = S;
  }
  // (and the buckets that go down a great shaft from a gallows on its rim: opts.hauls, [{ x, z, topY, period, phase, S }])
  for (const q of opts.hauls || []) {
    const travel = (q.topY - 0.9 - 0.62 * q.S) - (YW - 0.25);
    bl.push({ m: new THREE.Matrix4().makeRotationY(q.phase * 40).scale(new THREE.Vector3(q.S, q.S, q.S)).setPosition(q.x, q.topY - 0.9, q.z), move: [q.period, q.phase, travel, tip] });
    rl.push({ m: new THREE.Matrix4().makeTranslation(q.x, q.topY, q.z), move: [q.period, q.phase, travel, 0.9] });
  }
  const buckets = instanced(bucketGeo().build(), liftMaterial(shared, 5), bl, 'buckets'), ropes = instanced(ropeGeo().build(), liftMaterial(shared, 6), rl, 'ropes');
  group.add(buckets, ropes);
  // pipes and pump shafts: plain uprights of green bronze through the roof into the water
  const pl = (opts.pipes || []).map((p) => { const top = roofY(p[0], p[1]) + 0.6; return { m: new THREE.Matrix4().makeScale(p[2], top - (YW - 2), p[2]).setPosition(p[0], YW - 2, p[1]) }; });
  if (pl.length) group.add(instanced(pipeGeo().build(), liftMaterial(shared, 0), pl, 'pipes'));
  const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2;
  return { object: group, radius: Math.max(bx1 - bx0, bz1 - bz0) / 2, height: 30, center: new THREE.Vector3(cx, YW + 10, cz),
    anchors: { quay: new THREE.Vector3(quay.x, YW, quay.z), shaft: new THREE.Vector3(big[0][0], YW, big[0][1]) },
    uniforms: U, shared, lake, wells, roofY, roofH, YW, triangles: { roof: 0 },
    update(dt, time) { if (!opts.shared) shared.uT.value = time; }, dispose() { tWell.dispose(); U.tLake.value.dispose(); }, ground: false, groundY: YW };
}
