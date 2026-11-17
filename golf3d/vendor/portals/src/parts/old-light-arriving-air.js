// OLD LIGHT ARRIVING, the air: the few airships (plainly made: sewn cloth, a slung gondola, a line), the fliers gliding down to the landing
// lawn, the lamp floats flown from the rafted boats, the quay's pennant masts. Unmirrored frame, under the world group.
import * as THREE from 'three';
import { LIGHT_GLSL, TOWN_LIT_GLSL, KNOLL_R, BOWL, bowlXZ, groundH, QUAY_Z, DEG } from './old-light-arriving-common.js';
import { makeCraft, makeSprites, makeLines, LAMP_GLSL, FLAME, assertWound, BOATS } from './old-light-arriving-life.js';
import { makeFloats, makePennants, FLOAT_SWING } from './old-light-arriving-bowl.js';

// ---- airships. One geometry, 80 m long (scaled 0.9 to 1.35): an envelope of sixteen gores, four plain fins, a gondola with a row of
// windows slung beneath. Nose toward -Z, origin at the hull's middle.
const HALF = 40, GIRTH = 9.4, GOND_Y = 0.35 - 3.1 * 6;      // the gondola's floor (its window wall is the houses' wall, which counts floors from 0.35)
const hullR = (t) => GIRTH * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(t, 0.78)), 0), 0.62);      // t: 0 the nose .. 1 the tail; fullest forward of the middle
function shipGeometry() {
  const P = [], N = [], C = [], K = [], I = [], CLOTH = [0.2, 0.21, 0.25], NS = 26, NA = 16;
  for (let i = 0; i <= NS; i++) { const t = i / NS, z = -HALF + 2 * HALF * t, r = hullR(t), dr = (hullR(Math.min(t + 0.01, 1)) - hullR(Math.max(t - 0.01, 0))) / (0.02 * 2 * HALF);
    for (let j = 0; j <= NA; j++) { const a = j / NA * 2 * Math.PI, cx = Math.cos(a), sy = Math.sin(a), l = Math.hypot(1, dr); P.push(r * cx, r * sy, z); N.push(cx / l, sy / l, -dr / l); C.push(...CLOTH); K.push(6); } }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }      // (wound with the gores' outward normals)
  const quad = (pts, n, col, part) => { const b = P.length / 3; for (const p of pts) { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(col[0], col[1], col[2]); K.push(part); } I.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  // four plain fins at the tail
  for (let f = 0; f < 4; f++) { const a = f * Math.PI / 2 + Math.PI / 4, cx = Math.cos(a), sy = Math.sin(a), r0 = hullR(0.8) * 0.8, r1 = hullR(0.8) + 7.5, z0 = HALF * 0.52, z1 = HALF * 0.93;
    quad([[r0 * cx, r0 * sy, z0], [r1 * cx, r1 * sy, z0 + 7], [r1 * cx, r1 * sy, z1], [r0 * 0.4 * cx, r0 * 0.4 * sy, z1]], [sy, -cx, 0], [0.17, 0.18, 0.22], 0); }      // (a fin's stored normal is the side its two triangles face)
  // the gondola: a timber floor and roof, a wall of wide lit openings, a rail
  const bx = (x0, x1, y0, y1, z0, z1, col, part) => { quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], col, part); quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], col, part);
    quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], col, part); quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], col, part);
    quad([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], col, part); quad([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], col, part); };
  const TIMBER = [0.085, 0.07, 0.065];
  bx(-2.4, 2.4, GOND_Y - 0.7, GOND_Y, -12.5, 11.5, TIMBER, 0); bx(-2.1, 2.1, GOND_Y, GOND_Y + 3.1, -11.5, 10.5, [0.5, 0.5, 0.5], 5); bx(-2.6, 2.6, GOND_Y + 3.1, GOND_Y + 3.4, -12.6, 11.6, TIMBER, 0);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(K, 1)); g.setIndex(I);
  assertWound(P, N, I, 'an airship');      // (the builders' one test: no triangle wound against the normal it stores)
  return g;
}
// where a point of an airship is. Moored (s.y = 1): m.xy the mast's head on the map, s.z its height, m.z the heading it lies to (its
// nose rides 8 m downwind of the mast's head and it swings a little on its line, on the world's clock from its own seeded phase). It
// LIES AT ITS MAST for the whole flight. Far off (s.y = 0): it HANGS STILL in the evening's air (m.xy its place on the map, m.z the
// heading it lies to, s.z its height), rising and falling a little on the clock from its own dealt phase (m.w). s.w, for both: the
// tint of its timber, as every craft of the country carries one. No airship goes anywhere, and none reads the flight.
export const SHIP_GLSL = /* glsl */`
vec3 boatPoint(vec3 p, vec4 m, vec4 s){
  p *= s.x; float hd; vec3 c;
  if (s.y > .5) { hd = m.z + .06*sin(uTime*.19 + m.w) + .025*sin(uTime*.47 + m.w*1.7); p.z += ${HALF}.*s.x + 8.; c = vec3(m.x, s.z + 3. + .6*sin(uTime*.23 + m.w), m.y); }
  else { c = vec3(m.x, s.z + 2.*sin(uTime*.13 + m.w), m.y); hd = m.z; }
  float ch = cos(hd), sh = sin(hd);
  return c + vec3(p.x*ch + p.z*sh, p.y, -p.x*sh + p.z*ch);
}`;
// the same in the layout's own arithmetic, for the clearance test: the hull's middle
const shipMid = (b) => { const m = b.m, s = b.s;
  if (s[1] > 0.5) { const hd = m[2], q = HALF * s[0] + 8; return [m[0] + q * Math.sin(hd), s[2] + 3, m[1] + q * Math.cos(hd)]; }
  return [m[0], s[2], m[1]]; };

// P: { LU, RU, S, clear, ships (2 or 3), wind: [x, z] on the map }
const SHIP_KEEP = 7;
export function makeShips(P, group, stats = {}) {
  const R = P.S.ships, { LU, RU, clear, wind } = P, items = [], lamps = [], lines = [];
  const wl = Math.hypot(wind[0], wind[1]), hdWind = Math.atan2(-(-wind[0] / wl), -(-wind[1] / wl));      // lying to the wind: the nose upwind
  // the moored one: on the mast of the right knoll, trailing downwind of it and swinging on its line
  const mastTop = [KNOLL_R[0], groundH(KNOLL_R[0], KNOLL_R[2]) + 38, KNOLL_R[2]];      // (high enough that the gondola and the fins ride clear of the knoll's crowns: a ship, not a dome behind trees)
  items.push({ m: [mastTop[0], mastTop[2], hdWind, R() * 6.283], s: [R.range(0.9, 1.05), 1, mastTop[1], 0], lit: 1 });
  // the others hang still far off, to the left over the basin and to the right over the plain: each at a place dealt on a great
  // round (the round's middle, its radius, where on it), its nose lying along the round one way or the other, with a size, a
  // height and a tint of its own. A far ship is a thing the world's text promises: if none of its tries stands far enough from the
  // road the build fails and says so.
  for (let i = 1; i < P.ships; i++) { let b = null;
    for (let tries = 0; tries < 30 && !b; tries++) {
      const side = i === 1 ? -1 : 1, cx = side * R.range(1100, 1500) + 100, cz = R.range(-1500, -800), r = R.range(380, 620), th = R() * 6.283, size = R.range(0.95, 1.35), high = R.range(130, 310), nose = R() < 0.5 ? -1 : 1, tint = R();
      const q = { m: [cx + r * Math.cos(th), cz + r * Math.sin(th), nose > 0 ? Math.PI - th : -th, th], s: [size, 0, high, tint], lit: 1 }, c = shipMid(q);
      if (clear.dist(c[0], c[1], c[2]) > 600 + HALF * size) b = q; }
    if (!b) throw new Error('old-light-arriving: far airship ' + i + ' found no place 600 m clear of the road in 30 tries');
    items.push(b); }
  // (the moored one swings and rides on its line with the clock: at every phase its whole length stays within a ball of
  // (HALF + 8) * its size * 1.1 round its middle, and that ball must stand SHIP_KEEP clear of the road. It is a named thing of the
  // design: if the road's rule would drop it the build fails and says so.)
  { const b = items[0], c = shipMid(b), gap = clear.dist(c[0], c[1], c[2]) - (HALF + 8) * b.s[0] * 1.1;
    if (gap < SHIP_KEEP) throw new Error('old-light-arriving: the moored airship swings within ' + gap.toFixed(1) + ' m of the road (its clearance is ' + SHIP_KEEP + ' m)');
    stats.ship = gap; }
  for (const b of items) {
    for (let z = -10; z <= 9.5; z += 3.25) for (const x of [-2.75, 2.75]) lamps.push({ p: [x, GOND_Y + 3.25, z], size: 0.2, bright: 3.5, ph: R() * 6.283, m: b.m, s: b.s });
    lamps.push({ p: [0, 0, -HALF - 0.5], size: 0.3, bright: 3.5, ph: R() * 6.283, m: b.m, s: b.s });
    // the sling lines from the gondola's corners and waist to the hull, and the line: to the mast's head, or trailing
    for (const z of [-11.5, -4, 3.5, 10.5]) for (const x of [-2.4, 2.4]) { const t = (z * 1.25 + HALF) / (2 * HALF), r = hullR(t); lines.push({ a: [x, GOND_Y + 3.3, z], b: [Math.sign(x) * r * 0.62, -r * 0.78, z * 1.25], w: 0.06, sag: 0, m: b.m, s: b.s }); }
    if (b.s[1] > 0.5) lines.push({ a: [0, 0, -HALF], b: [0, -3 / b.s[0], -HALF - 8 / b.s[0]], w: 0.09, sag: 0.8, m: b.m, s: b.s });
    else lines.push({ a: [0, -hullR(0.12), -HALF * 0.76], b: [0, -hullR(0.12) - 34, -HALF * 0.76 + 9], w: 0.05, sag: -2, m: b.m, s: b.s });
  }
  if (!items.length) return { count: 0, mastTop };
  group.add(makeCraft(LU, shipGeometry(), items, null, SHIP_GLSL).object);
  group.add(makeSprites(LU, RU, lamps, { pointGLSL: SHIP_GLSL }).object);
  group.add(makeLines(LU, RU, lines, { pointGLSL: SHIP_GLSL }).object);
  return { count: items.length, mastTop, moored: items[0].s[1] > 0.5, items };
}

// ---- fliers: single fliers on thin crescent wings 5 m across, a small dark pod, one lamp. Each has its own course (a curve from high over
// the bluff or the basin down to the landing lawn on the outer slope of the bowl's hill) and KEEPS ITS OWN ROUND ON THE WORLD'S
// CLOCK, whether or not anyone comes: it wheels aloft at the head of its course (ROUND.aloft of its period), comes down the course
// to the lawn (ROUND.down), stands there and turns about (ROUND.stand), and goes up the same course again (the remainder); and so
// again and again, from its own drawn phase. Its period is its course's length over its own drawn speed (9 to 13 m/s on the average
// while it comes down), made the nearest whole number of its own circles, so that every round is the same round and CLOSES ON
// ITSELF: its place, heading, wing and lamp at a round's end are those at its beginning (the build carries the law round every
// flier's round and across the wrap of its clock, and fails otherwise: flierRound). Aloft it never hangs: it wheels in its own
// circle, which closes as it comes down. NONE OVER THE BOWL: no place on a flier's course, with its circle there and its wing,
// lies inside the bowl's rim. Nothing here reads the flight.
const ROUND = { aloft: 0.22, down: 0.3, stand: 0.18 };
const FLIER_GLSL = /* glsl */`
attribute vec4 aP0, aP1, aP2, aP3;
vec3 flBez(float t){ float s = 1. - t; return s*s*s*aP0.xyz + 3.*s*s*t*aP1.xyz + 3.*s*t*t*aP2.xyz + t*t*t*aP3.xyz; }
// the flier's place and its frame (fwd, side, up)
vec3 flierAt(out vec3 fwd, out vec3 side, out vec3 up, out float t){
  float f = fract((uTime + aP1.w) / max(aP2.w, 1.));                                                  // where it is in its round (aP1.w: its phase in seconds; aP2.w: its period)
  t = clamp(smoothstep(${ROUND.aloft}, ${(ROUND.aloft + ROUND.down).toFixed(2)}, f) - smoothstep(${(ROUND.aloft + ROUND.down + ROUND.stand).toFixed(2)}, 1., f), 0., 1.);      // its place along its course: 0 aloft, 1 on the lawn
  float turn = 3.14159265 * smoothstep(${(ROUND.aloft + ROUND.down + ROUND.stand * 0.25).toFixed(3)}, ${(ROUND.aloft + ROUND.down + ROUND.stand * 0.75).toFixed(3)}, f);      // on the lawn it turns about, to go up the way it came
  vec3 c = flBez(t), al0 = normalize(flBez(min(t + .01, 1.)) - flBez(max(t - .01, 0.)) + vec3(0., 0., -1e-5));
  vec3 along = vec3(al0.x*cos(turn) - al0.z*sin(turn), al0.y*cos(turn), al0.x*sin(turn) + al0.z*cos(turn));
  // (its circle's frame is the COURSE'S OWN, al0: the turning about turns its heading where it stands on the lawn and nothing else, so
  // the frame is the same at the end of a round as at its beginning and the round closes on itself)
  vec3 a1 = normalize(cross(al0, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.)), a2 = normalize(vec3(al0.x, 0., al0.z) + vec3(0., 0., -1e-5));
  float air = (1. - t) * smoothstep(0., .12, 1. - t), rad = aP3.w * air, ph = uTime * 9. / max(aP3.w, 1.) + aP0.w;      // nine metres a second round its circle
  c += (a1*cos(ph) + a2*sin(ph)) * rad + vec3(0., .12*rad*sin(ph*.5 + aP0.w*1.9), 0.);
  vec3 round = normalize(-a1*sin(ph) + a2*cos(ph));                                               // the way it goes round the circle
  float wheel = smoothstep(0., 3., rad);
  fwd = normalize(mix(vec3(along.x, along.y * (1. - smoothstep(.93, 1., t)), along.z), round, wheel) + vec3(0., 0., -1e-5));      // level as it settles on the lawn
  side = normalize(cross(fwd, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.));
  float roll = -.5 * wheel;                                                                         // banked into its circle
  up = normalize(cross(side, fwd)); vec3 s2 = side*cos(roll) + up*sin(roll); up = cross(s2, fwd); side = s2;
  // as it settles it lies WITH THE SLOPE it lands on (the bowl's hill is a cone: its own normal at the landing place), so that its
  // wing, level with the grass, clears it at every turn of its turning about
  vec2 o = aP3.xz - vec2(${BOWL.c[0].toFixed(1)}, ${BOWL.c[1].toFixed(1)}); vec3 n = normalize(vec3(o.x, 0., o.y) * (${(BOWL.yRim / (BOWL.foot - BOWL.rim)).toFixed(3)} / max(length(o), 1.)) + vec3(0., 1., 0.));
  vec3 un = normalize(mix(up, n, smoothstep(.93, 1., t)));
  fwd = normalize(fwd - un*dot(fwd, un) + vec3(0., 0., -1e-5)); side = normalize(cross(fwd, un) + vec3(1e-5, 0., 0.)); up = cross(side, fwd);
  return c;
}`;
// THE WINGS' LAW IN THE SCRIPT'S TONGUE (flierPose): flierAt above, line for line and number for number, for the build's own
// questions of a flier (where its wing's tips are drawn on the lawn; whether its round closes on itself). F: { c: its course's four
// points, amp, period, phase, ph0 } as the wings are handed them; time: the clock; o: where the answer is written (p: its middle,
// f, s, u: its frame, wheel). lawn: if given, the flier is asked standing on the lawn at that angle of its turning about.
const RN = { d0: ROUND.aloft, d1: Number((ROUND.aloft + ROUND.down).toFixed(2)), u0: Number((ROUND.aloft + ROUND.down + ROUND.stand).toFixed(2)), t0: Number((ROUND.aloft + ROUND.down + ROUND.stand * 0.25).toFixed(3)), t1: Number((ROUND.aloft + ROUND.down + ROUND.stand * 0.75).toFixed(3)) };
const SLOPE = Number((BOWL.yRim / (BOWL.foot - BOWL.rim)).toFixed(3)), QB = [new Float64Array(3), new Float64Array(3), new Float64Array(3)];
const ss = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
const bezTo = (c, t, q) => { const s = 1 - t, k0 = s * s * s, k1 = 3 * s * s * t, k2 = 3 * s * t * t, k3 = t * t * t; for (let k = 0; k < 3; k++) q[k] = k0 * c[0][k] + k1 * c[1][k] + k2 * c[2][k] + k3 * c[3][k]; };
export function flierPose(F, time, o, lawn) {
  const c = F.c, G = (time + F.phase) / Math.max(F.period, 1), f = G - Math.floor(G);
  let t = Math.min(Math.max(ss(RN.d0, RN.d1, f) - ss(RN.u0, 1, f), 0), 1), turn = Math.PI * ss(RN.t0, RN.t1, f); if (lawn !== undefined) { t = 1; turn = lawn; }
  bezTo(c, t, QB[0]); bezTo(c, Math.min(t + 0.01, 1), QB[1]); bezTo(c, Math.max(t - 0.01, 0), QB[2]);
  let ax = QB[1][0] - QB[2][0], ay = QB[1][1] - QB[2][1], az = QB[1][2] - QB[2][2] - 1e-5, l = Math.hypot(ax, ay, az); ax /= l; ay /= l; az /= l;      // al0
  const ct = Math.cos(turn), st = Math.sin(turn), lx = ax * ct - az * st, ly = ay * ct, lz = ax * st + az * ct;      // along
  let a1x = -az + 1e-5, a1z = ax; l = Math.hypot(a1x, a1z); a1x /= l; a1z /= l; let a2x = ax, a2z = az - 1e-5; l = Math.hypot(a2x, a2z); a2x /= l; a2z /= l;
  const air = (1 - t) * ss(0, 0.12, 1 - t), rad = F.amp * air, ph = time * 9 / Math.max(F.amp, 1) + F.ph0, cp = Math.cos(ph), sp = Math.sin(ph);
  o.px = QB[0][0] + (a1x * cp + a2x * sp) * rad; o.py = QB[0][1] + 0.12 * rad * Math.sin(ph * 0.5 + F.ph0 * 1.9); o.pz = QB[0][2] + (a1z * cp + a2z * sp) * rad;
  let rx = -a1x * sp + a2x * cp, rz = -a1z * sp + a2z * cp; l = Math.hypot(rx, rz); rx /= l; rz /= l;      // round
  const wheel = ss(0, 3, rad), lv = 1 - ss(0.93, 1, t);
  let fx = lx + (rx - lx) * wheel, fy = ly * lv * (1 - wheel), fz = lz + (rz - lz) * wheel - 1e-5; l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l;
  let sx = -fz + 1e-5, sy = 0, sz = fx; l = Math.hypot(sx, sz); sx /= l; sz /= l;
  let ux = -sz * fy, uy = sz * fx - sx * fz, uz = sx * fy; l = Math.hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l;
  { const roll = -0.5 * wheel, cr = Math.cos(roll), sr = Math.sin(roll), bx = sx * cr + ux * sr, by = uy * sr, bz = sz * cr + uz * sr;
    ux = by * fz - bz * fy; uy = bz * fx - bx * fz; uz = bx * fy - by * fx; sx = bx; sy = by; sz = bz; }
  const ox = c[3][0] - Number(BOWL.c[0].toFixed(1)), oz = c[3][2] - Number(BOWL.c[1].toFixed(1)), ol = Math.max(Math.hypot(ox, oz), 1);
  let nx = ox * SLOPE / ol, ny = 1, nz = oz * SLOPE / ol; l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
  const m = ss(0.93, 1, t); let vx = ux + (nx - ux) * m, vy = uy + (ny - uy) * m, vz = uz + (nz - uz) * m; l = Math.hypot(vx, vy, vz); vx /= l; vy /= l; vz /= l;      // un
  const d = fx * vx + fy * vy + fz * vz; fx -= vx * d; fy -= vy * d; fz -= vz * d + 1e-5; l = Math.hypot(fx, fy, fz); fx /= l; fy /= l; fz /= l;
  sx = fy * vz - fz * vy + 1e-5; sy = fz * vx - fx * vz; sz = fx * vy - fy * vx; l = Math.hypot(sx, sy, sz); sx /= l; sy /= l; sz /= l;
  o.fx = fx; o.fy = fy; o.fz = fz; o.sx = sx; o.sy = sy; o.sz = sz; o.ux = sy * fz - sz * fy; o.uy = sz * fx - sx * fz; o.uz = sx * fy - sy * fx; o.wheel = wheel;
  return o;
}
// THE LAND AND WHAT STANDS ON IT, for whatever flies. tops: [{ x, z, r, top }], every crown, roof, mast and hull the country and the
// air have laid (a thing r metres round on the map, top metres high). ground(x, z, r): the highest ground within r metres of a map
// point (asked every 4 m, each place once); top(x, z, r): the highest standing thing any part of which is within r.
// floats: the tethered lamp floats ([{ p: the tether's foot, len }], wind: the wind's direction on the map). A float is a ribbon
// that leans downwind and swings on the clock (the bowl part's floatAt: at the share s of its length it stands len s high, 0.17
// len s s downwind of its foot, and swings 0.11 len s s about that place at the most). ribbon(x, z, lo, hi): the least distance on
// the map from a point to any part of any float that is between the heights lo and hi, at every phase of its swing (far: floats
// farther than this are not asked, and far is returned when none is nearer).
export function makeOver(tops, floats = [], wind = [1, 0]) {
  const wl = Math.hypot(wind[0], wind[1]) || 1, wx = wind[0] / wl, wz = wind[1] / wl;
  const ribbon = (x, z, lo, hi, far = 1e9) => { let d = far;
    for (const f of floats) { const L = f.len; if (lo > f.p[1] + L + 1.5 || Math.hypot(f.p[0] + wx * L * 0.14 - x, f.p[2] + wz * L * 0.14 - z) - L * 0.42 > d) continue;
      for (let k = 0; k <= 24; k++) { const sh = k / 24, h = f.p[1] + L * sh; if (h < lo - L / 24 || h * 0.96 > hi + L / 24) continue;
        d = Math.min(d, Math.hypot(f.p[0] + wx * 0.17 * L * sh * sh - x, f.p[2] + wz * 0.17 * L * sh * sh - z) - 0.11 * L * sh * sh - (k === 24 ? 1.5 : 0.3)); } }
    return d; };
  const CELL = 4, X0 = -440, Z0 = -1010, NX = 270, NZ = 178, grid = new Float32Array(NX * NZ).fill(-1);
  const cell = (i, j) => { const x = X0 + (i + 0.5) * CELL, z = Z0 + (j + 0.5) * CELL; if (i < 0 || j < 0 || i >= NX || j >= NZ) return groundH(x, z);
    let g = grid[j * NX + i]; if (g < 0) { g = Math.max(groundH(x, z), 0); grid[j * NX + i] = g; } return g; };
  const BK = 32, buckets = new Map(), key = (i, j) => i * 4096 + j;
  for (const t of tops) for (let i = Math.floor((t.x - t.r) / BK); i <= Math.floor((t.x + t.r) / BK); i++) for (let j = Math.floor((t.z - t.r) / BK); j <= Math.floor((t.z + t.r) / BK); j++) { const k = key(i + 2048, j + 2048); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(t); }
  return {
    ground(x, z, r) { let h = groundH(x, z); const R2 = (r + CELL * 0.71) ** 2;
      for (let i = Math.floor((x - r - X0) / CELL); i <= Math.floor((x + r - X0) / CELL); i++) for (let j = Math.floor((z - r - Z0) / CELL); j <= Math.floor((z + r - Z0) / CELL); j++) {
        const dx = X0 + (i + 0.5) * CELL - x, dz = Z0 + (j + 0.5) * CELL - z; if (dx * dx + dz * dz <= R2) h = Math.max(h, cell(i, j)); }
      return h; },
    top(x, z, r) { let h = -1e9;
      for (let i = Math.floor((x - r) / BK); i <= Math.floor((x + r) / BK); i++) for (let j = Math.floor((z - r) / BK); j <= Math.floor((z + r) / BK); j++) { const list = buckets.get(key(i + 2048, j + 2048)); if (!list) continue;
        for (const t of list) if (t.top > h && Math.hypot(t.x - x, t.z - z) < r + t.r) h = t.top; }
      return h; },
    ribbon };
}
// P.over: the land and what stands on it (makeOver). FLIER_KEEP: a flier's clearance over both, with its circle and its wing.
// FLIER_REST: how high its middle stands over the grass where it has landed (its pod, 0.8 m under its middle along its own up, rests
// on the slope: the slope's fall is 36 degrees). FLIER_FOOT, FLIER_TIP: the landing's own rule (in makeFliers).
// A FLIER'S ROUND CLOSES ON ITSELF (flierRound): FLIER_FAST, the fastest its middle may go between two neighbouring phases of its
// round (m/s): its course's greatest speed (its drawn 9 to 13 m/s on the average while it comes down, half as much again at the
// middle of the coming down, and more where the curve's own measure runs fast) with its circle's nine and the circle's opening:
// the fastest a flier dealt on seeds 1 to 1,000 goes is 31.5 m/s. FLIER_SPIN, the fastest it may turn (rad/s): its heading, and its wing about its middle by any
// axis (its tips and its lamp, on arms of 2.6 m and less, go about its middle no faster than 2.7 FLIER_SPIN m/s; so over the
// ground no faster than FLIER_FAST + 2.7 FLIER_SPIN). The turning about on the lawn turns at up to 1.3 rad/s (the shortest round
// dealt on seeds 1 to 1,000 is 40.8 s) and the wheel aloft at up to 0.75. FLIER_PHASES: the phases of a round the law is carried through. FLIER_DRAWS: how often a
// course's circle is given a new phase before the course itself is drawn again.
const FLIER_KEEP = 4, FLIERS = 14, FLIER_TRIES = 1500, FLIER_STEPS = 240, FLIER_REST = 1, FLIER_FOOT = 0.15, FLIER_TIP = 0.5;
const FLIER_FAST = 36, FLIER_SPIN = 1.5, FLIER_PHASES = 2000, FLIER_DRAWS = 8;
// The law (flierPose) carried round a flier's whole round at FLIER_PHASES phases and ACROSS THE WRAP of its clock (just under the
// round's end and just over its beginning). Its period is a whole number of its circles, so every round is the same round (the
// height's small dip alone keeps half the circle's pace: for an odd number of circles two rounds are carried). Between two
// neighbouring phases its middle moves no farther than FLIER_FAST allows, its tips and its lamp move about its middle no farther
// than 2.7 FLIER_SPIN allows, and its heading turns no more than FLIER_SPIN allows; across the wrap the same, in the two
// millionths of a period between (with 0.1 mm and 0.0001 rad for the arithmetic).
// Returns what failed (or nothing) and writes the greatest found into m: fast (its middle), tipFast (a tip or the lamp over the
// ground), about (a tip or the lamp about the middle) in m/s; spin (rad/s); wrap (m).
const POSE = [{}, {}], PT = [new Float64Array(12), new Float64Array(12)];
const posePts = (o, q) => { q[0] = o.px; q[1] = o.py; q[2] = o.pz;
  for (let k = 0; k < 2; k++) { const g = k ? 2.5 : -2.5; q[3 + k * 3] = o.px + g * o.sx + 0.28 * o.ux - 0.65 * o.fx; q[4 + k * 3] = o.py + g * o.sy + 0.28 * o.uy - 0.65 * o.fy; q[5 + k * 3] = o.pz + g * o.sz + 0.28 * o.uz - 0.65 * o.fz; }      // the wing's own outermost points
  q[9] = o.px - 0.5 * o.ux + 0.95 * o.fx; q[10] = o.py - 0.5 * o.uy + 0.95 * o.fy; q[11] = o.pz - 0.5 * o.uz + 0.95 * o.fz; };      // its lamp
export function flierRound(F, m = {}) {
  const N = Math.round(F.period * 9 / (2 * Math.PI * F.amp)), n = FLIER_PHASES * (N % 2 ? 2 : 1), dt = F.period / FLIER_PHASES; let bad = '';
  const step = (a, b, h, slack) => { const o0 = POSE[a], o1 = POSE[b], p = PT[a], q = PT[b]; posePts(o1, q); let tip = 0, about = 0;
    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], mid = Math.hypot(dx, dy, dz);
    for (let k = 3; k < 12; k += 3) { const ex = q[k] - p[k], ey = q[k + 1] - p[k + 1], ez = q[k + 2] - p[k + 2]; tip = Math.max(tip, Math.hypot(ex, ey, ez)); about = Math.max(about, Math.hypot(ex - dx, ey - dy, ez - dz)); }
    const turn = Math.acos(Math.min(Math.max(o0.fx * o1.fx + o0.fy * o1.fy + o0.fz * o1.fz, -1), 1));
    if (slack) m.wrap = Math.max(m.wrap ?? 0, mid, tip); else { m.fast = Math.max(m.fast ?? 0, mid / h); m.tipFast = Math.max(m.tipFast ?? 0, tip / h); m.about = Math.max(m.about ?? 0, about / h); m.spin = Math.max(m.spin ?? 0, turn / h); }
    return mid > FLIER_FAST * h + slack ? 'its middle' : about > 2.7 * FLIER_SPIN * h + slack ? 'a wing tip or its lamp' : turn > FLIER_SPIN * h + slack ? 'its heading' : ''; };
  { const e = F.period * 1e-6; posePts(flierPose(F, -F.phase - e, POSE[0]), PT[0]); flierPose(F, -F.phase + e, POSE[1]); bad = step(0, 1, 2 * e, 1e-4); if (bad) return bad + ' across the wrap'; }
  posePts(flierPose(F, -F.phase, POSE[0]), PT[0]);
  for (let k = 1; k <= n; k++) { flierPose(F, -F.phase + k * dt, POSE[k & 1]); bad = step((k - 1) & 1, k & 1, dt, 0); if (bad) return bad; }
  return '';
}
export async function makeFliers(P, group, stats = {}) {
  const R = P.S.fliers, { LU, RU, clear, over } = P, pause = P.yieldFn || (async () => {}), n = FLIERS, A = [new Float32Array(n * 4), new Float32Array(n * 4), new Float32Array(n * 4), new Float32Array(n * 4)];
  const smooth = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
  const bez = (c, t) => { const s = 1 - t; return [0, 1, 2].map((k) => s * s * s * c[0][k] + 3 * s * s * t * c[1][k] + 3 * s * t * t * c[2][k] + t * t * t * c[3][k]); };
  let got = 0, work = 0;      // (work: a try the road turns away is light, one asked of the land along its whole course is heavy; the build rests by the work done)
  for (let i = 0; i < n * FLIER_TRIES && got < n; i++) {
    if (work >= 6) { await pause(); work = 0; }
    work++;
    const ang = (180 + (R() < 0.5 ? -1 : 1) * R.range(9, 62)) * DEG, r = R.range(150, 181), l = Math.sin(ang) * r, a = Math.cos(ang) * r, e = bowlXZ(l, a), ey = groundH(e[0], e[1]) + FLIER_REST;
    const out = bowlXZ(l * 1.6, a * 1.6), p0 = [R.range(-260, 460), R.range(74, 150), R.range(-560, -330)], hd = R.range(-0.9, 0.9), amp = R.range(12, 22);      // amp: the radius of its circle
    const c = [p0, [p0[0] + Math.sin(hd) * 160, p0[1] - 12, p0[2] - Math.cos(hd) * 160], [out[0], ey + 26, out[1]], [e[0], ey, e[1]]];
    let lawn = null;
    // (THE LANDING'S OWN RULE: where it comes to rest it lies with the slope, as the wings' shader lays it; there its pod's foot is
    // within FLIER_FOOT of the grass under it, neither sunk nor hung, and each wing tip, asked WHERE IT IS DRAWN (the wing's own
    // outermost points, 2.5 m out, 0.28 m up and swept 0.65 m back, by the law's own script form) is FLIER_TIP or more over the
    // grass under that tip at every angle of its turning about, every 5 degrees of the half turn. So it never lands across the
    // cut of a terrace path.)
    { const F0 = { c, amp: 0, period: 1, phase: 0, ph0: 0 }, o = flierPose(F0, 0, POSE[0], 0), foot = o.py - 0.8 * o.uy - groundH(o.px - 0.8 * o.ux, o.pz - 0.8 * o.uz); let tip = 1e9;
      for (let j = 0; j <= 36; j++) { flierPose(F0, 0, o, j / 36 * Math.PI); posePts(o, PT[0]); tip = Math.min(tip, PT[0][4] - groundH(PT[0][3], PT[0][5]), PT[0][7] - groundH(PT[0][6], PT[0][8])); }
      if (Math.abs(foot) > FLIER_FOOT || tip < FLIER_TIP) continue;
      lawn = [Math.abs(foot), tip]; }
    // (the road's rule for a flier: its WHOLE course, with its circle's radius there and its wing, stays 25 m from the road and
    // outside the bowl's rim; so at every phase of its round, and of its circle, on the clock, it is clear of both)
    let ok = true, gap = 1e9, len = 0, last = c[0]; for (let k = 0; k <= 60 && ok; k++) { const t = k / 60, q = bez(c, t), g = clear.dist(q[0], q[1], q[2]) - amp - 3, air = (1 - t) * smooth(0, 0.12, 1 - t);
      gap = Math.min(gap, g); len += Math.hypot(q[0] - last[0], q[1] - last[1], q[2] - last[2]); last = q;
      ok = g > 25 && q[1] > groundH(q[0], q[2]) + (k < 57 ? 9 : 0.3) && Math.hypot(q[0] - BOWL.c[0], q[2] - BOWL.c[1]) - amp * air - 3 > BOWL.rim; }
    if (!ok) continue;
    work += 3;
    // (THE LAND'S RULE AND THE RULE OF WHAT STANDS ON IT, the same way, asked of the course WHOLE: its 240 stretches, each
    // covered entire by one round on the map (the wider of its two ends' circles, the wing, and half the stretch's own length)
    // and by the lower of its two ends. On every stretch the lowest the flier can be, with its circle's dip and its banked wing,
    // is FLIER_KEEP metres over the highest ground within FLIER_KEEP metres of that round, and over every crown, roof, mast and
    // hull any part of which is within FLIER_KEEP metres of it (so the clearance holds beside a thing as it does over it); and
    // the round passes FLIER_KEEP metres on the map from every part of a float's ribbon and globe that is at the flier's height
    // (FLIER_KEEP over and under), wherever the float has swung. Only as it comes down onto the slope where it lands, the last
    // twentieth of its course, is the ground's rule the landing's own: its middle no lower than 0.3 m over the grass under it
    // (it comes to rest FLIER_REST over it, lying with the slope); nothing stands within FLIER_KEEP metres of its round there.)
    // (the stretches are asked from the landing back: where most courses fail, they fail soonest)
    let land = 1e9, tops = 1e9, rib = 1e9, pq = null, pt = 1, prad = 0, plow = 0, phigh = 0;
    for (let k = FLIER_STEPS; k >= 0 && ok; k--) { const t = k / FLIER_STEPS, q = bez(c, t), rad = amp * (1 - t) * smooth(0, 0.12, 1 - t), dip = 0.12 * rad + 1.5, low = q[1] - dip, high = q[1] + dip;
      if (pq) { const mx = (q[0] + pq[0]) / 2, mz = (q[2] + pq[2]) / 2, reach = Math.max(rad, prad) + 3 + Math.hypot(q[0] - pq[0], q[2] - pq[2]) / 2, lo = Math.min(low, plow), aloft = pt < 0.95;
        const a = aloft ? lo - over.ground(mx, mz, reach + FLIER_KEEP) : FLIER_KEEP + Math.min(q[1] - groundH(q[0], q[2]), pq[1] - groundH(pq[0], pq[2])) - 0.3, b = lo - over.top(mx, mz, reach + FLIER_KEEP), f = over.ribbon(mx, mz, lo - FLIER_KEEP, Math.max(high, phigh) + FLIER_KEEP, reach + 2 * FLIER_KEEP) - reach;
        if (aloft) land = Math.min(land, a); tops = Math.min(tops, b); rib = Math.min(rib, f); ok = a >= FLIER_KEEP && b >= FLIER_KEEP && f >= FLIER_KEEP; }
      pq = q; pt = t; prad = rad; plow = low; phigh = high; }
    if (!ok) continue;
    // ITS ROUND: its period is its course's length over its own drawn speed, made the nearest WHOLE NUMBER OF ITS CIRCLES (a circle
    // is 2 pi amp / 9 seconds), so that its circle is where it was when its round begins again and every round is the same round;
    // and where in it the clock finds it. Then its circle's own phase, drawn until the round closes on itself (flierRound: no
    // part of it leaps and its heading never snaps, at any phase or across the wrap); a course whose circle finds no such phase in
    // FLIER_DRAWS draws is drawn again. (What is asked is what the wings are handed: the numbers as their arrays hold them.)
    const turnS = 2 * Math.PI * amp / 9, period = Math.max(1, Math.round(len / (ROUND.down * R.range(9, 13)) / turnS)) * turnS, phase = R() * period;
    const F = { c: c.map((q) => q.map(Math.fround)), amp: Math.fround(amp), period: Math.fround(period), phase: Math.fround(phase), ph0: 0 }; let sound = false;
    await pause(); work = 0;      // (the build rests before and after each carrying round: each is a few thousand places of the law)
    for (let j = 0; j < FLIER_DRAWS && !sound; j++) { F.ph0 = Math.fround(R() * 6.283); sound = !flierRound(F); await pause(); }
    if (!sound) { stats.flierRounds = (stats.flierRounds ?? 0) + 1; continue; }
    stats.fliers = Math.min(stats.fliers ?? 1e9, gap); stats.flierLand = Math.min(stats.flierLand ?? 1e9, land); stats.flierTop = Math.min(stats.flierTop ?? 1e9, tops); stats.flierFloat = Math.min(stats.flierFloat ?? 1e9, rib); stats.flierTries = i + 1;
    stats.flierFoot = Math.max(stats.flierFoot ?? 0, lawn[0]); stats.flierTip = Math.min(stats.flierTip ?? 1e9, lawn[1]);
    A[0].set([...c[0], F.ph0], got * 4); A[1].set([...c[1], phase], got * 4); A[2].set([...c[2], period], got * 4); A[3].set([...c[3], amp], got * 4); got++;
  }
  if (got < n) throw new Error('old-light-arriving: only ' + got + ' of the ' + n + ' fliers found a course clear of the road, the bowl, the land and what stands on it in ' + n * FLIER_TRIES + ' tries');
  // EVERY FLIER DEALT, ASKED ONCE MORE AS IT IS HANDED TO THE WINGS (the arrays' own numbers): its round closes on itself, or the
  // build fails. stats.flierRound: the greatest speed of a middle and of a tip or lamp (m/s), the greatest turning of a heading
  // (rad/s) and the greatest step across the wrap (m) over the fliers dealt.
  { const m = {}; for (let k = 0; k < got; k++) { const F = { c: [0, 1, 2, 3].map((j) => [A[j][k * 4], A[j][k * 4 + 1], A[j][k * 4 + 2]]), ph0: A[0][k * 4 + 3], phase: A[1][k * 4 + 3], period: A[2][k * 4 + 3], amp: A[3][k * 4 + 3] }, bad = flierRound(F, m);
      if (bad) throw new Error('old-light-arriving: a flier\'s round does not close on itself: ' + bad + ' moves between two neighbouring phases farther than it flies');
      await pause(); }
    stats.flierRound = m; }
  const U = { ...LU, uRes: RU.uRes };
  const inst = (g) => { for (let k = 0; k < 4; k++) g.setAttribute('aP' + k, new THREE.InstancedBufferAttribute(A[k], 4)); g.instanceCount = got; return g; };
  // the wing (a crescent with a little dihedral) and the pod
  const P3 = [], K = [], I = [], NW = 8;
  for (let j = 0; j <= NW; j++) { const x = -2.5 + 5 * j / NW, e = (x / 2.5) ** 2; P3.push(x, 0.28 * Math.abs(x / 2.5), -0.75 + 1.4 * e, x, 0.28 * Math.abs(x / 2.5), -0.1 + 0.75 * e); K.push(0, 0); }
  for (let j = 0; j < NW; j++) { const a = j * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  { const b = P3.length / 3; for (const q of [[0, -0.45, -1.0], [0.3, -0.5, 0], [0, -0.2, 0], [-0.3, -0.5, 0], [0, -0.8, 0], [0, -0.5, 0.9]]) { P3.push(...q); K.push(1); } for (const f of [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]]) I.push(b + f[0], b + f[1], b + f[2]); }
  const wg = new THREE.InstancedBufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(P3, 3)); wg.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); wg.setIndex(I);
  const wings = new THREE.Mesh(inst(wg), new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aK; varying vec3 vW, vN; varying float vK, vT; ${LIGHT_GLSL} ${FLIER_GLSL}
      void main(){ vec3 f, s, u; float t; vec3 c = flierAt(f, s, u, t); vec3 p = c + s*position.x + u*position.y - f*position.z;
        vec4 w = modelMatrix*vec4(p, 1.); vW = olaW(w.xyz); vN = olaW(mat3(modelMatrix)*u); vK = aK; vT = t; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`varying vec3 vW, vN; varying float vK, vT; ${LIGHT_GLSL} ${TOWN_LIT_GLSL}
      void main(){ vec3 n = normalize(vN); float lit = (1. - smoothstep(.9, 1., vT)) * olaTownLit(vW);      // the star's light by the flier's own place: the lawn lies in the bowl's hill's own shade, the air low over the town's river side in the town's hill's
        vec3 c = mix(vec3(.46,.47,.52), vec3(.06,.06,.07), vK) * (olaLight(n, lit) + olaLight(-n, lit)*.4);      // (pale cloth: a wing is read against the dark country by the far side's pearl on it)
        gl_FragColor = vec4(olaFog(c, length(vW - olaW(cameraPosition))), 1.); }` }));
  wings.frustumCulled = false;
  const lq = new THREE.PlaneGeometry(2, 2), lg = new THREE.InstancedBufferGeometry(); lg.index = lq.index; lg.setAttribute('position', lq.getAttribute('position'));
  const lamps = new THREE.Mesh(inst(lg), new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: /* glsl */`uniform vec2 uRes; varying vec2 vQ; varying float vB, vF; ${LIGHT_GLSL} ${FLIER_GLSL}
      void main(){ vec3 f, s, u; float t; vec3 c = flierAt(f, s, u, t) - u*.5 + f*.95; vec4 mv = viewMatrix*modelMatrix*vec4(c, 1.);
        float px = max(-mv.z * 2. / (projectionMatrix[1][1] * max(uRes.y, 1.)), 1e-5), rad = olaLeast(${(0.16 * FLAME).toFixed(3)}, px).x; vB = 3.5 * olaLeast(${(0.16 * FLAME).toFixed(3)}, px).y; vF = exp(-mv.z*mv.z*uFogDen*uFogDen*.5);      // (the one law of every flame: its light cut by exactly the area added)
        vQ = position.xy*3.; mv.xy += position.xy * rad * 3.; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`varying vec2 vQ; varying float vB, vF; ${LAMP_GLSL}
      void main(){ float r2 = dot(vQ, vQ); gl_FragColor = vec4(lampLight(r2, vB, .1, 0.) * (1. - smoothstep(5., 9., r2)) * vF, 1.); }` }));
  lamps.frustumCulled = false; lamps.renderOrder = 3;
  group.add(wings, lamps);
  return { count: got, uniforms: U };
}

// ---- the air's whole cast. P: { LU, RU, S: { ships, fliers, tethers, quay }, clear, ships, wind }; C: the country (its rafted boats,
// its mesh of standing things, its lamps and blades)
export async function makeAir(P, C) {
  const { LU, RU, S, clear, wind } = P, group = new THREE.Group(), TIMBER = [0.075, 0.065, 0.06];
  const stats = {}, ships = makeShips(P, group, stats);
  // the mooring mast on the right knoll
  { const x = KNOLL_R[0], z = KNOLL_R[2], y = groundH(x, z); C.sb.pole([x, y - 1, z], [x, ships.mastTop[1], z], 0.22, TIMBER, 1); C.lamps.push({ p: [x, ships.mastTop[1] + 0.5, z], size: 0.3, bright: 3.5, ph: S.ships() * 6.283, wet: false }); }
  // lamp floats flown from the ranks of rafted boats on the basin: ribbons of three set lengths (44, 60 and 76 m), tethered at the stern,
  // so they ride in three level ranks over the water. A boat whose ribbon would bring its globe near the route flies none.
  const R = S.tethers, floats = [];
  for (const b of C.rafted) { if (floats.length >= 60) break; if (R() > 0.62) continue;
    const ch = Math.cos(b.m[2]), sh = Math.sin(b.m[2]), k = b.s[0], x = b.m[0] + 15 * sh * k, z = b.m[1] + 15 * ch * k;
    const len = 44 + 16 * Math.floor(R() * 3) + R.range(-0.8, 0.8), ph = R() * 6.283;
    const gap = clear.dist(x + wind[0] * len * 0.17, 2 + len, z + wind[1] * len * 0.17) - len * FLOAT_SWING; if (gap < 8) continue;      // (its globe, at every phase of its swing on the clock: 8 m)
    floats.push({ p: [x, 2.2, z], len, ph }); stats.floats = Math.min(stats.floats ?? 1e9, gap); }
  // THE FLIERS ARE DEALT LAST OF ALL THAT STANDS OR FLIES (fly, below, which the world calls when the bowl's hill is dressed): their
  // courses are asked of the land and of everything that stands on it or is flown over it by then. THE LIST HOLDS: every tree's
  // crown; every roof and hall; EVERY CRAFT AT ANCHOR, of whatever kind and wherever it lies (on the basin the barges rafted in
  // ranks off the landing stages, every barge lying out on the broad water and the sails by each rank and by each raft; and the
  // craft of the lower river and the great barge at the quay, though no flier's course runs south of the quay line): each a round
  // of half its own length on the map, as high as its mast's top with half a metre (12 m for a barge, 9.4 m for a sail, 24 m for
  // the great barge, by its own scale); each float's ribbon and globe with its swing; the moored airship with the room it swings
  // in and its mast; and, handed in by the world (hill, hillFloats, in the world's frame), what stands on the bowl's rim and
  // outer slope where they land: its shrubs and small trees, its path and stair lamps, its sitters, the rim's masts with their
  // cloth, and the bowl's own floats. (counts.anchored: how many craft the list holds.)
  const anchored = ['barge', 'sail', 'great'].flatMap((kind) => (kind === 'barge' ? C.boats.barges : kind === 'sail' ? C.boats.sails : C.boats.great).filter((b) => b.s[1] > 0.5)
    .map((b) => ({ x: b.m[0], z: b.m[1], r: BOATS[kind].len * 0.5 * b.s[0], top: BOATS[kind].top * b.s[0] + 0.5 })));
  const tops = [...C.trees.tops, ...C.sites.map((o) => ({ x: o.x, z: o.z, r: o.hw * 1.3, top: o.y + o.top + 1.6 })), ...anchored];
  { const b = ships.items[0], c = shipMid(b); tops.push({ x: c[0], z: c[2], r: (HALF + 8) * b.s[0] * 1.1, top: c[1] + GIRTH * b.s[0] + 2 }, { x: KNOLL_R[0], z: KNOLL_R[2], r: 1, top: ships.mastTop[1] + 1 }); }
  const counts = { ships: ships.count, fliers: 0, floats: floats.length, quayMasts: 0, anchored: anchored.length }, out = { group, fliers: null, stats, counts };
  out.fly = async (hill = [], hillFloats = []) => { out.fliers = await makeFliers({ ...P, over: makeOver([...tops, ...hill], [...floats, ...hillFloats], wind) }, group, stats); counts.fliers = out.fliers.count; return out.fliers; };
  if (floats.length) group.add(makeFloats(LU, RU, floats, wind).object);
  // pennant masts along the quay at the bluff's foot. THE ROAD'S RULE: a mast with its pennant stands 60 m or more from the road's
  // line (at every height of the mast): a 24 m mast flying 13 m of cloth is passed at more than its own height and its pennant's
  // length together, with half as much again for the wind.
  const Q = S.quay, pennants = [], MAST_KEEP = 60;
  for (let x = -296 + Q() * 12; x < 114; x += 34) { const z = QUAY_Z - 5, y = groundH(x, z), top = y + 24, len = Q.range(9, 13), ph = Q() * 6.283;
    let ok = true; for (let h = 0; h <= 24 && ok; h += 4) ok = clear.dist(x, y + h, z) > MAST_KEEP; if (!ok) continue;
    C.sb.pole([x, y - 0.3, z], [x, top, z], 0.13, TIMBER, 0); C.lamps.push({ p: [x, top + 0.35, z], size: 0.3, bright: 3.5, ph, wet: true }); pennants.push({ p: [x, top - 0.7, z], len, ph }); }
  // (no mast stands on the crest by the road's crossing: the bench the road crosses over is nearer the road than the masts'
  // clearance, so the rule leaves no ground for one there; the crest keeps its halls, its grove, its lamps and its watchers)
  if (pennants.length) group.add(makePennants(LU, pennants, wind).object);
  counts.quayMasts = pennants.length;
  return out;
}
