// What Happened Here: the central device. ONE STORY LIST (makeStory) lays down every mark on a field of new snow: a
// bird's line of arrow prints (the line the camera rides, at the bird's own speed), a fox's thread that closes on it,
// a hare that crosses and means nothing, and the single marks (roost hole, feeding patch, sit hollow, belly trough,
// crater, wing print). Nothing alive is ever drawn. buildField() turns the list into one pitched page: a snow disc whose
// relief, shadows, sparkle and spindrift are one GLSL chunk, one InstancedMesh of print stamps reading a baked atlas
// (depth, slope, cover), the wing-print quad, clods, sedge, hedge, birches, dome and diamond dust, all lit by the same
// sun uniforms in the group's local space. The world file pitches the whole group under a level camera from u.
import * as THREE from 'three';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export const LEN = 362;            // metres of path (ten times life size: 36 m of field)
export const WING_S = 288;         // the wing print's centre along the trail
export const HEDGE_S = LEN - 6.6;  // the hedge stands 6 m short of the path end (the carry lands its gap on the ring) and 0.6 m in front of it
// glyph cells of the atlas (4 x 4)
export const G = { walk: 0, run: 1, paw: 2, hind: 3, fore: 4, roost: 5, pit: 6, hollow: 7, trough: 8, crater: 9, seam: 10, blob: 11, feather: 12, dint: 13, scuff: 14, drag: 15 };

// ---- the story. variant 0 THE STALK, 1 HEAD ON, 2 TWO HOURS ON ONE PAGE (they never met). side: +1 fox on the left.
export function makeStory(rng, { variant = 0, rare = false, side = 1 } = {}) {
  const r = rng.fork ? rng.fork('story') : rng;
  // heading th(s) from -Z, positive turns left; integrated every half metre from s = -80 to LEN + 80
  const A = variant === 1 ? 0 : r.range(0.05, 0.085) * (r.chance(0.5) ? 1 : -1), lam = r.range(205, 250);
  const heading = (s) => variant === 1
    ? -1.08 * side * sstep(146, 262, s)
    : A * Math.sin(6.2832 * s / lam) * sstep(0, 40, s) * (1 - sstep(196, 258, s));
  const N0 = 160, N = (LEN + 160) * 2, tx = new Float32Array(N + 1), tz = new Float32Array(N + 1), tt = new Float32Array(N + 1);
  { let x = 0, z = 80; for (let i = 0; i <= N; i++) { const s = (i - N0) * 0.5, th = heading(s + 0.25); tt[i] = heading(s); tx[i] = x; tz[i] = z; x += -Math.sin(th) * 0.5; z += -Math.cos(th) * 0.5; } }
  { const ox = tx[N0], oz = tz[N0]; for (let i = 0; i <= N; i++) { tx[i] -= ox; tz[i] -= oz; } }
  // field point at arc length s, d metres to the left of the line: [x, z, heading]
  const at = (s, d = 0) => { const f = Math.min(N - 1e-3, Math.max(0, s * 2 + N0)), i = Math.floor(f), k = f - i, th = lerp(tt[i], tt[i + 1], k); return [lerp(tx[i], tx[i + 1], k) - Math.cos(th) * d, lerp(tz[i], tz[i + 1], k) + Math.sin(th) * d, th]; };
  const pts = []; for (let i = 0; i <= 40; i++) { const p = at(i * LEN / 40); pts.push([p[0], 3, p[1]]); }

  const prints = [];    // x, z, rot, w, l, depth, glyph, age
  const put = (x, z, rot, w, l, depth, glyph, age = 0) => { prints.push(x, z, rot, w, l, depth, glyph, age); };
  const putSD = (s, d, drot, w, l, depth, glyph, age = 0) => { const p = at(s, d); put(p[0], p[1], p[2] + drot, w, l, depth, glyph, age); return p; };
  const line = (x0, z0, x1, z1, step, fn) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.floor(L / step)), rot = Math.atan2(-(x1 - x0), -(z1 - z0)); for (let i = 0; i <= n; i++) fn(lerp(x0, x1, i / n), lerp(z0, z1, i / n), rot, i, n); };

  // feeding patches (the bird stopped): s ranges, vary per seed
  const f0 = 99 + r.range(-3, 3), feeds = [[f0, f0 + 10]];
  if (variant === 2) feeds.push([190 + r.range(-4, 4), 0]), feeds[1][1] = feeds[1][0] + 9;
  const runS = variant === 2 ? 1e9 : 146, endS = WING_S - 1;
  const inFeed = (s) => feeds.some((f) => s > f[0] && s < f[1]);

  // BIRD: roost hole, then the stitched walk, the trampled patch, the walk on, and the run
  { const p = at(9); put(p[0], p[1], p[2] + 0.2, 2.6, 3.6, 0.5, G.roost, 0); }
  // the last three prints of the run come closer together and deeper: the bird gathering itself (g0, g0 + 1.4, endS)
  let s = 10.9, k = 0, last = null; const g0 = endS - 2.8;
  while (s < endS + 0.01) {
    const run = s >= runS, prev = s, gk = run ? clamp01((s - g0) / 2.8 + 0.001) * (s >= g0 - 0.01 ? 1 : 0) : 0;
    if (inFeed(s)) { last = null; s += 1.4; continue; }
    const sd = (k & 1 ? 1 : -1), p = run
      ? putSD(s, sd * lerp(0.2, 0.13, gk) + r.range(-0.05, 0.05), -sd * 0.05, 1.5, 1.5, s >= g0 - 0.01 ? lerp(0.36, 0.48, gk) : 0.3, G.run)
      : putSD(s, sd * 0.12, -sd * 0.14, 1.1, 1.1, 0.16, G.walk);
    if (!run && last) { { const dx = p[0] - last[0], dz = p[1] - last[1]; const dl = Math.hypot(dx, dz) || 1, c = 0.5 + 0.1 / dl; put(last[0] + dx * c, last[1] + dz * c, Math.atan2(-dx, -dz), 0.26, Math.max(0.3, dl - 0.72), 0.045, G.seam, 0.35); } }   // from the toe of one print to the heel of the next: the seam never lies over a print
    last = run ? null : p; k++;
    s += run ? Math.min(3.4, 1.6 + (s - runS) * 0.9) : 1.4;
    if (!run && s >= runS) s = runS;
    if (run) { if (prev >= g0 - 0.01) s = prev + 1.4; else if (s > g0 - 1.7) s = g0; }      // the last print lies under the wings
  }
  const sedge = [];
  for (const f of feeds) {
    const c = (f[0] + f[1]) / 2, half = (f[1] - f[0]) / 2;
    for (let i = 0; i < 46; i++) { const a = r.range(0, 6.2832), q = Math.sqrt(r()), p = at(c + Math.cos(a) * q * half, Math.sin(a) * q * 1.5); put(p[0], p[1], p[2] + r.range(-1.6, 1.6), 1.1, 1.1, 0.18, G.walk, i % 3 ? 0 : 0.2); }   // trodden over and over: a third are older
    for (let i = 0; i < 16; i++) { const p = at(c + r.range(-half, half), r.range(-1.4, 1.4)); put(p[0], p[1], r.range(0, 6.28), 0.5, 0.5, 0.2, G.pit); }
    { const p = at(c, 0); put(p[0], p[1], p[2], 3.6, f[1] - f[0] + 1.5, 0.05, G.scuff); }
    for (let i = 0; i < 3; i++) { const p = at(c + (i - 1) * half * 0.62 + r.range(-0.6, 0.6), (i === 1 ? -1 : 1) * r.range(0.5, 1.1)); sedge.push([p[0], p[1], r.range(0.5, 0.8)]); }
  }

  // HARE: clusters of four crossing both lines at 70 degrees and leaving; it means nothing
  // (a cluster reaches from 2.9 m behind its origin to 1.15 m ahead of it and the clusters are 9 m apart: the bird's seam runs
  // through the middle of the gap between two of them, on every seed, so the hare never treads on the bird's own prints)
  const HARE_OFF = (9 + 2.9 - 1.15) / 2;
  { const c = at(66 + r.range(-5, 5)), a = c[2] + 1.22 * side, dx = -Math.sin(a), dz = -Math.cos(a), lx = -Math.cos(a), lz = Math.sin(a);
    for (let i = -12; i < 18; i++) { const x = c[0] + dx * (i * 9 + HARE_OFF), z = c[1] + dz * (i * 9 + HARE_OFF), j = r.range(-0.15, 0.15);
      put(x + lx * 0.5, z + lz * 0.5, a - 0.1, 0.8, 1.9, 0.15, G.hind); put(x - lx * 0.5 + dx * 0.2, z - lz * 0.5 + dz * 0.2, a + 0.1, 0.8, 1.9, 0.15, G.hind);
      put(x - dx * 1.7 + lx * j, z - dz * 1.7 + lz * j, a, 0.6, 0.6, 0.12, G.fore); put(x - dx * 2.6 - lx * (j + 0.12), z - dz * 2.6 - lz * (j + 0.12), a, 0.6, 0.6, 0.12, G.fore); } }

  // FOX
  const paw = (x, z, rot, depth, age, i) => { const sd = (i & 1 ? 1 : -1) * 0.1; put(x - Math.cos(rot) * sd, z + Math.sin(rot) * sd, rot, 1.0, 1.0, depth, G.paw, age); };
  const clods = [], feathers = [];
  let crater = null, wingMode = 0, hedge2 = null, foxThread = null, foxLat = null, foxS0 = 0, foxS1 = 0;   // where the fox's line lies (for the snow: no swell band over it)
  const fc = (feeds[0][0] + feeds[0][1]) / 2;
  if (variant === 2) {
    const sx = 236 + r.range(-8, 8), a = at(sx, -150 * side), b = at(sx + r.range(-14, 14), 170 * side);
    line(a[0], a[1], b[0], b[1], 3.2, (x, z, rot, i) => paw(x, z, rot, 0.15, 0.5, i));       // hours old, half filled (the brief's 0.5)
    foxThread = [a[0], a[1], b[0], b[1]];
  } else {
    let g0 = 147, d0 = 8.4;
    if (variant === 0) {
      const a = at(fc - 165, 112 * side), h = at(fc + 9, 8.6 * side);
      line(a[0], a[1], h[0], h[1], 3.2, (x, z, rot, i, n) => { if (i < n) paw(x, z, rot, 0.14, 0.5, i); });
      put(h[0], h[1], h[2] - 0.5 * side, 3.4, 3.4, 0.3, G.hollow); foxThread = [a[0], a[1], h[0], h[1]];
      for (let i = 0; i < 7; i++) { const q = r.range(0, 6.28), p = [h[0] + Math.cos(q) * r.range(1.5, 2.2), h[1] + Math.sin(q) * r.range(1.5, 2.2)]; put(p[0], p[1], r.range(0, 6.28), 1.0, 1.0, 0.2, G.paw); }
      for (let s2 = fc + 12, i = 0; s2 < 137.5; s2 += 1.2, i++) { const p = at(s2, lerp(8.2, 7.0, (s2 - fc - 12) / (137.5 - fc - 12)) * side); paw(p[0], p[1], p[2] + 0.14 * side * -1, 0.24, 0, i); }
      { const p = at(140.5, 7.0 * side); put(p[0], p[1], p[2], 3.0, 6.0, 0.36, G.trough); for (const o of [-0.42, 0.42]) { const q = at(142.6, 7.0 * side + o); put(q[0], q[1], q[2], 0.95, 0.95, 0.26, G.paw); } }
    } else {
      const o = at(146, 6 * side), a = [o[0], o[1] - 300], b = [o[0], o[1] - 50], c = [o[0], o[1] - 27];
      line(a[0], a[1], b[0], b[1], 3.2, (x, z, rot, i) => paw(x, z, rot, 0.14, 0.3, i));
      // it came out of the hedge that closes the field dead ahead; from far off its prints are one blue thread (age 4)
      hedge2 = { x: 0, z: a[1] - 2, rot: 0 }; foxThread = [a[0], a[1], o[0], o[1] - 20];
      put(a[0], (a[1] + b[1]) / 2, 0, 1.3, b[1] - a[1], 0, G.seam, 4);
      line(b[0], b[1], c[0], c[1], 1.2, (x, z, rot, i) => paw(x, z, rot, 0.24, 0, i));
      put(o[0], o[1] - 24, 3.1416, 3.0, 6.0, 0.36, G.trough); for (const q of [-0.42, 0.42]) put(o[0] + q, o[1] - 21.9, 3.1416, 0.95, 0.95, 0.26, G.paw); g0 = 172; d0 = 6.5;
    }
    // the gallop: bunches of four that run wide, then cut in across the ripples (a wedge that narrows to nothing); the
    // last of them, at s 262, is the deep take-off. After it the snow is unmarked for 30 m: the leap
    const d1 = rare ? 2.6 : 4.0, dAt = (s2) => lerp(d0, d1, sstep(186, 270, s2)), nb = variant === 0 ? 12 : 10, gstep = (262 - g0) / nb;
    for (let b = 0; b <= nb; b++) { const s2 = g0 + b * gstep, off = b === nb, turn = -Math.atan2(dAt(s2 + 2) - dAt(s2 - 2), 4) * side;
      for (let j = 0; j < 4; j++) { const p = at(s2 + [0, 0.9, 2.0, 3.0][j] * (off ? 0.62 : 1), (dAt(s2) + [-0.26, 0.2, -0.2, 0.26][j] * (off ? 1.5 : 1)) * side); put(p[0], p[1], p[2] + turn, off ? 1.5 : 1.4, off ? 1.5 : 1.4, off ? 0.42 : 0.32, G.paw); } }
    foxLat = variant === 0 ? (s2) => (s2 < 143 ? lerp(8.2, 7.0, clamp01((s2 - fc - 12) / (137.5 - fc - 12))) : s2 < 147 ? lerp(7.0, 8.4, (s2 - 143) / 4) : dAt(s2)) : dAt;
    foxS0 = variant === 0 ? fc + 9 : 172; foxS1 = 266;
    // then the crater, 4 m across (on the trail's end when the fox did not miss), and its fan of clods
    const cs = rare ? WING_S - 0.2 : WING_S + 5.2, cp = at(cs, rare ? 0 : 2 * side); crater = [cp[0], cp[1], cp[2]];
    put(cp[0], cp[1], cp[2], 10.3, 10.3, 1.0, G.crater);
    for (let i = 0; i < 60; i++) { const q = cp[2] + r.range(-0.9, 0.9) * (rare ? 0.55 : 1) + (rare ? 0.75 : -0.25) * side, dist = 3.6 + 7.5 * Math.pow(r(), 1.6); clods.push([cp[0] - Math.sin(q) * dist, cp[1] - Math.cos(q) * dist, r.range(0.2, 0.7) * (1.2 - dist / 14), r.range(0, 6.28)]); }
    // it walks away to the far side at 35 degrees, spindrift already filling the prints; we do not follow
    // (it holds near 35 degrees until it is well off the line, and reaches the hedge some twenty metres to the side of the gap as a far thread)
    { const s0 = cs + (rare ? 2.6 : 3.0), dc = rare ? 0 : 2, sl0 = rare ? 0.2 : 0.7; let i = 0;
      for (let s2 = s0; s2 < HEDGE_S - 2; i++) {
        const x = s2 - s0, k = Math.exp(-x * sl0 / 32), slope = sl0 * k, p = at(s2, (dc - 32 * (1 - k)) * side), rot = p[2] - Math.atan(slope) * side;
        paw(p[0], p[1], rot, i < 7 ? 0.24 : 0.14, Math.min(0.6, x * 0.03), i);      // spindrift is already filling them: half gone within twenty metres, and none fresh at the hedge end
        // what it carried dragged beside it: two shallow grooves a toe wide, wavering, broken where the load lifted
        if (rare && i < 18) for (const o of [0.6, 1.05]) { const oo = (o + r.range(-0.16, 0.16)) * side, lift = r() < 0.3; if (!lift) put(p[0] - Math.cos(rot) * oo, p[1] + Math.sin(rot) * oo, rot + r.range(-0.16, 0.16), 1.1, r.range(1.6, 2.7), 0.085, G.drag, 0.75); }
        s2 += (rare ? 2.5 : 3.2) / Math.sqrt(1 + slope * slope);
      } }
    // three barred feathers (each with its thin shadow, age 5), one of them lying in the wing print
    if (rare) { wingMode = 1; for (let i = 0; i < 3; i++) { const p = at(WING_S + [-0.5, 3.0, -2.3][i], [3.5, -1.9, -2.6][i] * side), fr = r.range(0, 6.28); feathers.push([p[0], p[1], fr]);
      put(p[0], p[1], fr, 0.85, 2.5, 0, G.feather, 5); put(p[0], p[1], fr, 0.85, 2.5, 0, G.feather, 2); } }
  }
  const wp = wingMode ? at(WING_S - 0.2, 2.3 * side) : at(WING_S, 0), hp = at(HEDGE_S, 0);
  if (!rare) { const dp = at(WING_S - 0.25, 0); put(dp[0], dp[1], dp[2], 3.0, 3.0, 0.62, G.dint); }
  // shadows of raised things are stamps too (age 3): the vertex shader stretches them down-sun by height / tan(elev)
  for (const c of clods) put(c[0], c[1], 0, c[2] * 0.9, c[2] * 0.42, 0, G.blob, 3);
  for (const t of sedge) put(t[0], t[1], 0, 0.5, t[2] * 0.4, 0, G.blob, 3);
  return { variant, rare, side, at, pts, prints: new Float32Array(prints), count: prints.length / 8, feeds, patches: feeds.map((f) => { const p = at((f[0] + f[1]) / 2, 0); return [p[0], p[1], p[2], (f[1] - f[0]) / 2]; }), runS, endS, sedge, clods, crater, feathers,
    wing: { x: wp[0], z: wp[1], rot: wp[2], mode: wingMode }, hedge: { x: hp[0], z: hp[1], rot: hp[2] }, hedge2, fc,
    fox: { thread: foxThread, lat: foxLat, s0: foxS0, s1: foxS1 } };
}

// ---- the snow chunk: relief, raking light, blue shadow, sparkle and spindrift, shared by the disc and every stamp.
// Everything is in the group's local space (snow at y 0); uCam is the camera in that space.
export const SNOW_GLSL = /* glsl */`
uniform vec3 uSun, uSunCol, uShade, uShadeDeep, uHaze, uCam, uCrest;
uniform vec2 uSunH, uWind;         // uWind: the way the wind blows over the page (unit x, z)
uniform vec4 uHedge;                 // the hedge frame in the page: x, z, cos, sin
uniform sampler2D uBirch;
uniform float uSinE, uTanE, uTime, uSparkle, uDrift, uMoon;
uniform vec4 uSeam; uniform float uSeamK, uSeamQ, uLevel;   // the trail under the lens (point, heading), how far it bends away ahead, and how level the page lies (1 at the entry)
uniform vec4 uFoxA, uFoxB; uniform vec2 uFoxK;              // the fox's line: its arriving thread and the stretch beside the trail (each x0, z0, x1, z1)
uniform vec3 uCalm;                   // the clean sheet of new powder that took the wing print: x, z, radius
uniform vec4 uPatch[2];                // the trodden pans at the feeding patches: x, z, half length, heading
uniform vec3 uDawn, uGap; uniform vec2 uDawnH;   // first light: its colour times how far it has come (keyed to u), where on the horizon it stands, and the light in the gap
float hash21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float segD(vec2 p, vec4 s){ vec2 d = s.zw - s.xy; vec2 r = p - s.xy; return length(r - d * clamp(dot(r, d) / max(dot(d, d), 1e-3), 0., 1.)); }   // how far p lies from a stretch of line
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
// wind relief (wind along +x, crests square to it and four times longer than they are wide): 7 m swells and 2.2 m
// ripples that ride them; ripL is what casts shadow, ripF the fine sastrugi (0.8 m) that only models the light
vec2 wr(vec2 p){ return vec2(uWind.x * p.x + uWind.y * p.y, -uWind.y * p.x + uWind.x * p.y); }      // x along the wind, y along the crests
// one layer of sastrugi: cells cs metres in wind space (x downwind), rows offset like bricks, each holding at most one
// short crescent: a sharp lip, a steep face turned upwind (from the sun), a back that falls away in a curve, horns swept
// downwind, dying to nothing at both ends. Nothing here can stretch into a band: a crescent never leaves its cell.
// k: where the lip stands in its cell, how far the horns sweep back (base, and per crescent), how long the back runs on.
// A long cell, a deep sweep and a long back make a tongue: a V nose turned upwind and a tail that tapers away downwind.
float sasL(vec2 w, vec2 cs, float seed, float dens, vec4 k){
  vec2 q = w / cs; float row = floor(q.x);
  q.y += hash21(vec2(row, seed)) + .35 * vnoise(vec2(q.x * .7, q.y * .5 + seed));
  vec2 ci = vec2(row, floor(q.y)), f = q - ci;
  float h1 = hash21(ci + seed), h2 = hash21(ci * 1.7 + seed + 9.1);
  float h3 = hash21(ci * 2.3 - seed);
  float sz = .55 + .45 * hash21(ci * 3.1 + seed + 2.7);                 // no two are one size
  float y = clamp((f.y * 2. - 1.) / sz, -1., 1.), env = 1. - y * y; env *= env * (1. - smoothstep(dens - .06, dens + .06, h1));
  float ys = y + (h3 - .5) * .9;                                       // no two crescents bow alike
  float t = (f.x - (k.x + .3 * h2 * (1. - k.x) + (k.y + k.z * h3) * ys * ys * sz)) / sz;
  float prof = t < 0. ? smoothstep(-.1, 0., t) : .72 * exp(-t / .07) + .28 * exp(-t / k.w);   // a sharp lip, then a long low back
  return prof * (1. - smoothstep(.8, 1., f.x)) * env * (.45 + .55 * h2);
}
float ripL(vec2 p, vec3 amp){
  vec2 w = wr(p);
  w += (vec2(vnoise(w / 7.3 + 2.1), vnoise(w / 6.1 - 4.7)) - .5) * 1.1;   // the lanes are not ruled
  // the wind combs the snow in streaks that run downwind; between them it lies in wide clean sheets
  float m = .7 * vnoise(vec2(w.x / 31., w.y / 6.5) + 7.3) + .3 * vnoise(vec2(w.x / 9., w.y / 3.) - 1.9);
  float dens = smoothstep(.33, .57, m) * (.3 + .9 * smoothstep(.3, .62, vnoise(w / 58. + 1.7)));   // whole fields of them, then a clean sheet
  float s = max(1.2 * (1. - uMoon) * sasL(w + 5.1, vec2(5.6, 2.1), 5.3, dens * .62, vec4(.06, .22, .5, .5)), sasL(w, vec2(1.5, 2.7), 3.7, dens * .5, vec4(.3, .1, .22, .3)));   // tongues, and crescents between them
  s = max(s, .6 * sasL(w + 11.3, vec2(.8, 1.4), 17.1, dens * .55, vec4(.25, .1, .3, .3)));                      // and their small kin
  return amp.x * .03 * s;
}
// the swells the ripples ride: broad, crests square to the wind. They only lay soft shadow bands and turn the light
float swell(vec2 w){ return vnoise(vec2(w.x / 8.5, w.y / 21.) + 5.1) + .35 * vnoise(vec2(w.x / 3.9, w.y / 9.) - 8.3); }
// the drifts: a few long wind-laid ridges beside the trail (the story places them; never on the line, a patch or the
// wings). In wind space (x downwind, toward the light's side): a knife crest that wanders like a river, a short steep
// nose turned upwind (from the light) and a low back that fades away downwind; it tapers to nothing at both ends.
// x: height in metres, y: how near the crest on its lit back (0..1). uDr: x, z, half length, height.
uniform vec4 uDr[6];
vec2 driftHM(vec2 p){
  vec2 o = vec2(0.);
  for (int i = 0; i < 6; i++) {
    vec2 r = wr(p - uDr[i].xy); float W = uDr[i].z, y = r.y / W;
    if (abs(y) < 1. && abs(r.x) < W) {
      float ph = uDr[i].x * .37 + uDr[i].y * .23, env = 1. - y * y; env *= env;
      float t = (r.x - W * (.16 * sin(y * 3.1 + ph) + .07 * sin(y * 7.3 + ph * 2.1) + .22 * y * y - .1)) / W;
      float q = clamp(1. - t / .46, 0., 1.); q *= q;
      float h = uDr[i].w * env * (t < 0. ? smoothstep(-.09, 0., t) : q);
      if (h > o.x) o = vec2(h, env * q * smoothstep(-.05, .012, t));    // (eased across the crest: a step here drew a stair-stepped edge)
    }
  }
  return o;
}
float ripF(vec2 p, vec3 amp){
  vec2 w = wr(p);
  float m = vnoise(vec2(w.x / 3.1, w.y / 6.) - 2.2);
  float ph = w.x / .46 + 2.2 * vnoise(vec2(w.x / 2.6, w.y / 3.4) + 4.7) + .3 * vnoise(vec2(w.x / .5, w.y / 1.1)), ci = floor(ph), t = ph - ci;
  float b = vnoise(vec2(w.x / 9., w.y / 14.) - 3.1);
  float seg = smoothstep(.5, .78, vnoise(vec2(ci * 5.31, w.y / .8 + ci * 2.7)));     // each fine ridge runs a metre and dies
  return amp.z * (.0036 * min(t / .2, (1. - t) / .8) * smoothstep(.4, .8, m) * seg + .0024 * vnoise(vec2(w.x / .15, w.y / .6) - 8.1)) + amp.y * .009 * b * b;
}
float hedgeRaw(float X){ return 13. + 8. * vnoise(vec2(X * .05, 3.)) + 2.5 * vnoise(vec2(X * .4, 9.)) + 2. * vnoise(vec2(X * 1.9, 5.)); }
float hedgeTop(float X){ return hedgeRaw(X) * (1. - .8 * smoothstep(150., 256., abs(X))); }   // it dwindles into the field at both ends
// the long shadows of the only tall things on the page: the hedge (with the gap's shaft of light) and the two birches
// x: shadow, y: the pool of light that comes through the gap and lies on the snow in front of it
vec2 farShade(vec2 p){
  vec2 r = p - uHedge.xy, ex = vec2(uHedge.z, -uHedge.w), ez = vec2(uHedge.w, uHedge.z);
  float px = dot(r, ex), pz = dot(r, ez), sx = dot(uSunH, ex), sz = dot(uSunH, ez);
  float sze = sz < 0. ? min(sz, -.75) : max(sz, .75);                   // an artist's sun for the tall things: their shadows lie out across the field, never along the hedge foot
  float isz = 1. / sze;
  float t = -pz * isz, ok = step(0., t) * (1. - smoothstep(26., 60., t));        // it dies out before it can lie over the story
  float X = px + sx * t, Y = t * uTanE * 4.5, top = hedgeTop(X), pen = .5 + .09 * t;
  float lace = .62 + .38 * smoothstep(.25, .6, vnoise(vec2(X * .8, Y * .5)) + (.5 - Y / max(top, 1.)) * .9);   // the top of a bare hedge lets the sun through
  float s = (1. - smoothstep(top * .7 - pen, top + pen, Y)) * lace * smoothstep(6.6 - pen * .4, 9. + pen * .4, abs(X)) * (1. - smoothstep(240., 258., abs(X)));
  float tb = -(pz - .8) * isz, Xb = px + sx * tb, Yb = tb * uTanE * 4.5, lod = log2(1. + max(tb, 0.) * .12);
  float b1 = texture2D(uBirch, vec2((Xb + 14.) / -36. + .5, Yb / 72.), lod).a * step(Yb, 72.) * step(abs(Xb + 14.), 18.);
  float b2 = texture2D(uBirch, vec2((Xb - 14.) / 36. + .5, Yb / 66.2), lod).a * step(Yb, 66.2) * step(abs(Xb - 14.), 18.);
  s = max(s, min(max(b1, b2) * 2.2, 1.) * step(0., tb));
  float pool = exp(-px * px / 60.) * exp(-abs(pz - 5.) / 16.) * step(0., pz);
  return vec2(s * ok, pool);
}
// spindrift: short curling wisps that hug the snow, let through in gusts, scrolled by time
float drift(vec2 p){
  vec2 w = wr(p); float tm = uTime * 6.;
  float gust = .45 + .55 * smoothstep(.46, .76, vnoise(vec2((w.x - uTime * 4.2) / 17., w.y / 6.5)));   // it comes in gusts: a few threads, then clean snow
  vec2 c = vec2(vnoise(vec2((w.x - tm) / 4.5, w.y / 2.2) + 3.), vnoise(vec2((w.x - tm) / 3.7 + 11., w.y / 2.6)));   // the wisps curl
  vec2 q = vec2((w.x - tm) / 1.15 + c.y * 2.2, w.y / .5 + c.x * 6.);
  float body = smoothstep(.58, .8, .62 * vnoise(q) + .38 * vnoise(q * vec2(1.9, 2.3) + vec2(17.3, 4.1)));   // a wisp: a few metres long, half a metre wide, tapering at both ends
  float fib = .5 + .5 * vnoise(vec2(q.x * 1.6 + 5., q.y * 1.9));         // combed into fibres along the wind
  return body * fib * gust * 1.6 * uDrift;
}
// the wind crust: between the fields of ripples the sheet is glazed in plates some metres across (7 m along the wind,
// 3 m across it) with a broken edge. w: wind space. Above zero inside a plate.
float crustM(vec2 w){ return vnoise(w / vec2(7., 3.2) + 21.3) + .2 * (vnoise(w / vec2(1.6, .8) + 3.1) - .5) + .06 * (vnoise(w / .33) - .5) - .56; }
float crustP(vec2 p, float ew){ return smoothstep(0., ew, crustM(wr(p))); }
// how trodden the snow is at p (0..1): an oval pan round each feeding patch with a broken edge
float pan(vec2 p, float grow){
  float k = 0.;
  for (int i = 0; i < 2; i++) { vec2 r = p - uPatch[i].xy; float cr = cos(uPatch[i].w), sr = sin(uPatch[i].w);
    vec2 q = vec2(r.x * cr - r.y * sr, r.x * sr + r.y * cr) / (vec2(2.9, uPatch[i].z + 1.6) * grow);     // x across the trail, y along it
    k = max(k, 1. - smoothstep(.55, 1.05, length(q) + (vnoise(p * .9 + 3.3) - .5) * .5)); }
  return k;
}
// THE AIR OF THE PAGE: one law for everything that lies or stands in it (the snow, and the dead plants beside the trail).
// airVeil: ws = the place in wind space, V = the unit ray from the place to the lens, cup = 1 at the bottom of a print.
  // the far page lies under running snow: a ray that grazes the field goes a long way through the hand of spindrift
  // above it, so the snow near us is crisp and the far snow a band that holds the light (and, later, the dawn)
vec3 airVeil(vec3 col, vec2 ws, vec3 V, float cup){
  float gz = max(abs(V.y), .035), run = .25 + 1.1 * vnoise(vec2((ws.x - uTime * 6.) / 11., ws.y / 2.8)) * (.45 + vnoise(vec2((ws.x - uTime * 9.) / 5.2, ws.y / 2.1)));   // it runs in gusts, downwind
  float veil = (1. - exp(-.011 / (gz * gz) * run * uDrift)) * mix(.3, .8, uMoon) * (1. - .5 * cup);
  veil *= mix(.5, 1., smoothstep(.03, .16, gz));                       // the far field keeps its own light and shadow under it
  return mix(col, uSunCol * .4 + uShade * .62 + uDawn * .55, veil);
}
// airHaze: the haze of distance, and the far rim of the field going into it. p = the place, dist = metres from the lens.
vec3 airHaze(vec3 col, vec2 p, float dist){
  float hz = 1. - exp(-dist / 900.);
  hz = max(hz, smoothstep(380., 690., length(p - vec2(0., -180.))));
  return mix(col, uHaze, hz);
}
// p: local xz. fw: pixel footprint in metres (fwidth taken by the caller). bend: extra slope (dh/dx, dh/dz) from a print.
// cup: 0 on open snow, up to 1 at the bottom of a print (shadow there is deeper blue). shIn: shadow cast inside a print.
float gWindForm = 0.;   // set to 1 by a stamp that is the wind's work, not a print: its slopes are shaded as a ripple's are (no gold wall, no dark wall)
vec3 snowShade(vec2 p, vec2 fw, vec2 bend, float cup, float shIn, vec3 V, float dist){
  float wallK = min(dot(bend, bend) * 3., 1.) * (1. - gWindForm);                         // on the wall of a print the light is gold, not cream
  float foot = max(fw.x, fw.y * .25), fmax = max(fw.x, fw.y);
  vec3 amp = vec3(1. - smoothstep(.3, .65, foot), 1. - smoothstep(.9, 1.9, foot), 1. - smoothstep(.09, .26, foot));
  float ck = 1. - smoothstep(.55, 1., length(p - uCalm.xy) / uCalm.z + (vnoise(p * .4 - 6.1) - .5) * .3);
  float pk = pan(p, 1.), ax0 = amp.x; amp.x *= (1. - pk) * (1. - .85 * ck);                     // trodden snow carries no ripples
  float e = .05, hL = ripL(p, amp), h0 = hL + ripF(p, amp);
  vec2 g = vec2(ripL(p + vec2(e, 0.), amp) + ripF(p + vec2(e, 0.), amp) - h0, ripL(p + vec2(0., e), amp) + ripF(p + vec2(0., e), amp) - h0) / e;
  // grain: the crust is not glass. A sixth of a metre of tooth near the lens, gone where it would crawl
  float ga = 1. - smoothstep(.006, .022, fmax);
  vec2 gr = vec2(vnoise(p * 23.), vnoise(p * 23. + 31.7)) - .5;
  g += gr * .042 * ga * (1. - .6 * cup);
  // a plate of crust stands a finger (0.015 m) proud of the powder round it: its broken edge is a lip that takes the light
  // on the sun's side and lays a hair of shadow on the other. Gone where a pixel is wider than a third of a metre.
  float cfd = (1. - smoothstep(.08, .3, fmax)) * (1. - pk) * (1. - ck) * (1. - cup), cew = .036 + 1.5 * fmax;
  float plate = crustP(p, cew);
  g += vec2(crustP(p + vec2(e, 0.), cew) - plate, crustP(p + vec2(0., e), cew) - plate) * (.015 / e) * cfd * (1. - uMoon);
  plate *= cfd;
  // under the moon a plate is glitter only: the moon's shine on the snow is already 3.2 times the sun's, and a plate that
  // took it again stood out as a milky pane with a drawn edge. No lip, no tint, no shine of its own there.
  float glaze = plate * (1. - uMoon);
  // the pan: pressed a hand lower with a soft broken edge, and lumpy underfoot (no two steps pressed alike)
  float pl = 1. - smoothstep(.05, .4, fmax);
  g += vec2(pan(p + vec2(.3, 0.), 1.) - pk, pan(p + vec2(0., .3), 1.) - pk) * (-.05 / .3) * pl;
  g += (vec2(vnoise(p * 3.1 + 7.), vnoise(p * 3.1 - 5.3)) - .5) * min(.75 * uSinE, .12) * pk * pl * (1. - cup);
  vec2 dr0 = driftHM(p); float dk = (1. - smoothstep(1.5, 5., fmax)) * (1. - pan(p, 2.2)) * (1. - .9 * ck);
  g += bend;
  vec3 n = normalize(vec3(-g.x, 1., -g.y));
  float ndl = dot(n, uSun);
  // cast shadow of the crests: is the snow 0.6 m or 1.5 m toward the sun higher than the sun's ray?
  float s1 = ripL(p + uSunH * .26, amp) - hL - .26 * uTanE, s2 = ripL(p + uSunH * .5, amp) - hL - .5 * uTanE;
  float s0 = ripL(p + uSunH * .1, amp) - hL - .1 * uTanE;
  float sh = max(max(smoothstep(-.003, .009, s1), smoothstep(-.006, .016, s2)), smoothstep(-.002, .005, s0));   // feather-edged: the far end of a shadow is the softest
  sh = max(sh, 1. - smoothstep(-.02, .03, ndl));
  float mean = .13 * (1. - .43 * smoothstep(.07, .123, uTanE));      // what the unresolved far field averages to
  sh = mix(mean, sh, ax0) * mix(mix(.8, .85, uLevel), .34, uMoon);   // on the pitched page ripple shadow stays a tint (the prints are the darkest marks); in the level entry view it is the long blue shadow of first sun
  // the swells: is the swell 2.5 m or 6 m toward the moon or sun higher than its ray? Broad soft bands that shorten as it climbs
  vec2 ws = wr(p), wsu = wr(uSunH); float sw0 = swell(ws), swA = swell(ws + wsu * 2.5) - sw0, swB = swell(ws + wsu * 6.) - sw0;
  float swf = (1. - smoothstep(2.5, 7., fmax)) * (1. - pan(p, 2.6)) * (1. - ck);
  // ...nor over the trail ahead (uSeam: the trail's point and heading under the lens, uSeamQ: how it bends away; uSeamK: off once the trail has ended),
  // nor within 3 m of the fox's line: its arriving thread (uFoxA) and the stretch where it runs beside the trail (uFoxB)
  { vec2 sr = p - uSeam.xy; float sa = dot(sr, uSeam.zw), sb = clamp(sa, 0., 110.), sc = abs(sr.x * uSeam.w - sr.y * uSeam.z - uSeamQ * sb * sb);
    swf *= 1. - uSeamK * (1. - smoothstep(3.5 + .05 * sb, 8. + .1 * sb, sc)) * smoothstep(-8., 0., sa) * (1. - smoothstep(70., 110., sa));
    swf *= (1. - uFoxK.x * (1. - smoothstep(3., 6.5, segD(p, uFoxA)))) * (1. - uFoxK.y * (1. - smoothstep(3., 6.5, segD(p, uFoxB)))); }   // no swell lays its shadow or turns the light over a feeding patch or the wings
  float band = max(smoothstep(0., .25, swA * 1.5 - 2.5 * uTanE), smoothstep(0., .4, swB * 1.5 - 6. * uTanE)) * swf;
  float turn = clamp(-swA * .9 / 2.5 / max(uSinE, .05), -.4, .3) * swf;      // the side of a swell that faces the light is the brighter
  sh = max(sh, band * mix(mix(.5, .8, uLevel), .34, uMoon));           // a swell's shadow is a tint (a long blue band in the level entry view) and never lies over a feeding patch
  // and each lays one long shadow away from the light, soft at its far end, that shortens as the light climbs
  float dn = (vnoise(p * .55 + 4.4) - .5) * .12;                  // the shadow's edge follows the snow it lies on
  float dsw = .04 + fmax * .9;                                    // the edge is as soft as a pixel is wide on the snow: no stepped edge far off
  float dsh = max(max(smoothstep(-dsw, .12 + dsw, driftHM(p + uSunH * 1.2).x - dr0.x - 1.2 * uTanE + dn * .3), smoothstep(-dsw, .22 + dsw, driftHM(p + uSunH * 3.2).x - dr0.x - 3.2 * uTanE + dn * .6)),
    max(smoothstep(-dsw, .38 + dsw, driftHM(p + uSunH * 6.8).x - dr0.x - 6.8 * uTanE + dn), smoothstep(-dsw, .55 + dsw, driftHM(p + uSunH * 12.5).x - dr0.x - 12.5 * uTanE + dn))) * dk;
  sh = max(sh, dsh * mix(.62, .74, uMoon));
  sh = max(sh, pk * .03 * (1. - cup));                                 // trodden snow is a shade duller than the sheet round it
  float dfade = (1. - smoothstep(.5, 2.5, fmax)) * (1. - .55 * ck), dr = drift(p) * dfade;
  float drS = min(drift(p + uSunH * .8) * dfade, 1.);                  // a thread runs a hand above the snow: its thin shadow runs beside it
  sh *= 1. - .5 * min(dr * 1.3, 1.);
  vec2 fs = farShade(p); float far = fs.x;
  // under the moon, seen from far across the field, the hedge's shadow is a ruled dark line under the mist: there the
  // blown snow lies over it in places and it is a broken, paler band; it gathers its weight as we come near
  far *= mix(1., .18 + .6 * vnoise(vec2(p.x * .045 + uTime * .05, p.y * .045 - uTime * .02) + 7.7), uMoon * smoothstep(60., 200., dist));
  sh = min(max(sh, far * .8) + far * sh * .2, 1.);
  sh = max(sh, shIn);                                                 // a print keeps its shadow under the veil
  float lit = min(max(ndl, 0.) / max(uSinE, .05), mix(2.4, 1.7, wallK));
  lit = max(lit, .56 * (1. - max(wallK, cup)));                         // a ripple's steep face is never as dark as a print
  lit *= 1. + turn * (1. - cup);
  lit *= 1. + .8 * dr0.y * dk * (1. - cup);                             // a drift's back climbs toward the light: brightest at the knife crest
  lit = min(lit, mix(2.4, 1.3, max(pk, gWindForm)));                    // trodden snow has no clean face to flash, nor has the loose snow the wind laid behind a stem
  vec3 sunC = mix(mix(uSunCol, uCrest * 1.06, smoothstep(1.2, 2.3, lit)), uSunCol * vec3(1.12, .9, .6), wallK * .85);
  // sky fill is bluest straight down the page and warms toward the horizon; in a cup it deepens
  vec3 shade = mix(uShade, uShadeDeep, cup) * (1. - .1 * cup) * (.9 + .2 * n.y - .1 * far);
  shade *= 1. + clamp(dot(n.xz, uSunH) * 2.6, -.3, .45) * (.35 + .65 * far) * (1. - cup);    // the sky is brighter on the sun's side: relief still shows in shadow
  vec3 col = shade * (1. - .75 * (1. - sh) * min(lit, 1.) * (1. - cup)) + sunC * lit * .46 * (1. - sh) * (1. - .6 * cup);
  col += uSunCol * vec3(1., .5, .32) * sh * (1. - sh) * .34 * (1. - cup) * (1. - uMoon);              // light bleeds warm through the edge of every shadow
  col += (uDawn + vec3(.12, .1, .08) * dot(uDawn, vec3(.4))) * clamp(dot(n.xz, uDawnH) * 3., 0., 1.) * .55 * (1. - cup) * (1. - wallK);        // first light on every face turned to it: silver from one side, peach from the other
  // the glitter road: snow seen toward the sun shines (it puts the warm side of the frame on the sun's side)
  float tow = max(dot(reflect(-V, n), uSun), 0.); tow *= tow; tow *= tow;
  col *= 1. - .3 * uMoon * smoothstep(.3, .85, V.y) * (1. - cup);       // under the moon the snow straight below the lens is the deep end of the page
  col *= mix(vec3(1.), vec3(.94, .96, 1.01), glaze);                   // glazed crust is a shade cooler than powder: it shows the sky
  { vec3 shine = uSunCol * (tow * tow * .3 + tow * .12) * (1. - sh) * (1. + 2.2 * uMoon);
    col += shine;                                                       // the snow shines toward the light, as it did
    // ...and a plate of crust 1.6 times more, but its own shine never lifts a pixel over 0.92 (under a ripple crest in
    // full light and under the bloom): looking up the glitter road a plate that took the whole 2.6 stood out as a white pane
    vec3 wp = col + shine * 1.6 * glaze; float m0 = max(col.r, max(col.g, col.b)), m1 = max(wp.r, max(wp.g, wp.b));
    col = wp * min(1., max(m0, .92) / max(m1, 1e-3)); }
  // the moon's road: under the moon the far snow shines back in a long broken column that shimmers
  vec2 vh = -V.xz / max(length(V.xz), 1e-3); float rd = max(dot(vh, uSunH), 0.); rd *= rd; rd *= rd; rd *= rd; rd *= rd; rd *= rd;
  col += uSunCol * uMoon * rd * (1. - smoothstep(.04, .2, V.y)) * (1. - sh) * (.5 + 1.3 * smoothstep(.4, .8, vnoise(vec2(ws.y * 1.7 + uTime * .4, ws.x * .3 - uTime * .25))));
  col *= mix(vec3(1.), vec3(.76, .82, .96), drS * (1. - sh) * (1. - .6 * cup) * (1. - .6 * uMoon));
  col += (uSunCol * .5 + uShade * .7) * min(dr, 1.2) * mix(.26, .17, uMoon) * (1. - .7 * cup) * (1. - .8 * far);
  float plume = dr0.y * dk * (.35 + .65 * vnoise(vec2((ws.x - uTime * 7.) / 2.6, ws.y / .7))) * (.5 + .5 * vnoise(vec2((ws.x - uTime * 11.) / 6., ws.y / 2.3) + 3.1));
  col += (uSunCol * .55 + uShade * .5 + uDawn * .4) * plume * .5 * uDrift * (1. - .7 * cup);     // snow smokes off every crest and streams down its back
  col += uGap * fs.y * .42 * (1. - .6 * cup);                // the light that comes through the gap
  col = airVeil(col, ws, V, cup);                                     // the air of the page (above): the far snow lies under running snow
  // sparkle: hashed quarter-metre cells, each a facet that rocks; a glint is a small disc, never a square
  float maz = max(dot(vh, uSunH), 0.); maz *= maz; maz *= maz; maz *= maz; float mroad = uMoon * maz * maz * maz * (1. - .6 * smoothstep(.5, .95, V.y)) * (1. - ck);   // (never over the sheet that took the wings)
  col += uSunCol * mroad * .26 * (1. - sh) * (1. - cup);                  // and the snow itself shines a little along it
  float cs = .25, cfade = (1. - smoothstep(cs * .12, cs * .3, fmax)) * (1. - sh) * uSparkle;
  if (cfade > .01) {
    vec2 ci = floor(p / cs), cf = fract(p / cs) - .5;
    float h1 = hash21(ci), h2 = hash21(ci + 71.7), h3 = hash21(ci - 19.3);
    float ph = h1 * 6.2832 + uTime * (1.2 + 1.6 * h2) + dot(V.xz, vec2(h2, h3) - .5) * 60.;
    float road = smoothstep(.3, .85, dot(vec3(-V.x, V.y, -V.z), uSun));                // the glitter road: the glints crowd toward the light
    // under the moon the glints gather into one road that runs from under the moon to the lens, and are few elsewhere
    float gth = mix(mix(.93, .8, road), .45, mroad) - .1 * plate, gst = (mix(mix(.34, .3, road), .04, mroad) + .22 * uMoon * (1. - mroad)) * (1. - .7 * plate);   // (a plate of crust glitters: more of its facets catch the light, and for longer)
    float gl = smoothstep(gth, 1., sin(ph)) * step(gst, h3);
    vec2 o = (vec2(h2, h1) - .5) * .5;
    float rad = max(.07 * (.55 + 1.1 * h1 * h1), 1.2 * fmax / cs), dd = length(cf - o);          // no two glints one size
    col += mix(uSunCol, uCrest, h2) * (2.2 + 6.5 * h1 * h1 * h1) * gl * (1. - smoothstep(rad * .5, rad, dd)) * cfade;
  }
  // the road far off, where a quarter-metre facet is smaller than a pixel: the same glints gathered into cells three pixels
  // wide, so the road is a column of separate sparks at any distance, never a pale sheet
  if (mroad > .02) {
    float c2 = .25 * exp2(ceil(log2(max(fmax * 12.8, 1.))));
    vec2 ci2 = floor(p / c2), cf2 = fract(p / c2) - .5;
    float k1 = hash21(ci2 + 13.1), k2 = hash21(ci2 - 47.7), k3 = hash21(ci2 + 91.3);
    float on = smoothstep(.5, 1., sin(k1 * 6.2832 + uTime * (1.5 + 2.5 * k2))) * step(1. - .85 * mroad, k3) * smoothstep(1., 2., fmax * 12.8);
    float dd2 = length(cf2 - (vec2(k2, k1) - .5) * .5);
    col += mix(uSunCol, uCrest, k2) * (2. + 5. * k1 * k1) * on * (1. - smoothstep(.15, .3, dd2)) * (1. - sh) * (1. - cup) * uSparkle;
  }
  return airHaze(col, p, dist);
}
`;

// one set of uniforms for every material of the page; the world drives them from u (sun height) and time
export function makeUniforms(look) {
  const C = (h) => new THREE.Color(h);
  return {
    uSun: { value: new THREE.Vector3(1, 0.07, 0) }, uSunH: { value: new THREE.Vector2(1, 0) }, uSinE: { value: 0.07 }, uTanE: { value: 0.07 },
    uSunCol: { value: C(look.sun) }, uShade: { value: C(look.shade).multiplyScalar(look.shadeK) }, uShadeDeep: { value: C(look.deep).multiplyScalar(look.shadeK) },
    uCrest: { value: C(look.crest) }, uHaze: { value: C(look.haze).multiplyScalar(look.hazeK) }, uSkyTop: { value: C(look.sky).multiplyScalar(look.hazeK) },
    uCam: { value: new THREE.Vector3(0, 3, 0) }, uTime: { value: 0 }, uSparkle: { value: 1 }, uDrift: { value: 1 },
    uRes: { value: new THREE.Vector2(800, 450) }, uHedge: { value: new THREE.Vector4(0, -350, 1, 0) }, uWind: { value: new THREE.Vector2(0.921, -0.389) }, uBirch: { value: null }, uBelt: { value: C(look.belt || '#000000') }, uNight: { value: look.night || 0 }, uGlare: { value: look.glare ?? 1 }, uDark: { value: C(look.dark) }, uStreak: { value: 1 }, uLift: { value: 40 }, uRingDrop: { value: 0 },
    uMoon: { value: look.night ? 1 : 0 }, uDawn: { value: new THREE.Color(0, 0, 0) }, uDawnH: { value: new THREE.Vector2(1, 0) }, uCalm: { value: new THREE.Vector3(1e5, 1e5, 9) }, uPatch: { value: [new THREE.Vector4(1e5, 1e5, 5, 0), new THREE.Vector4(1e5, 1e5, 5, 0)] }, uGap: { value: new THREE.Color(1, 0.84, 0.62) }, uSeamK: { value: 1 }, uSeam: { value: new THREE.Vector4(0, 0, 0, -1) }, uSeamQ: { value: 0 }, uLevel: { value: 1 }, uFoxA: { value: new THREE.Vector4(1e5, 1e5, 1e5, 1e5) }, uFoxB: { value: new THREE.Vector4(1e5, 1e5, 1e5, 1e5) }, uFoxK: { value: new THREE.Vector2(0, 0) }, uDr: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(1e5, 1e5, 8, 0)) },
  };
}

// ---- the atlas: sixteen 256-pixel cells drawn on a canvas (red = depth, green = raised), then baked in JS to
// RGBA8: red depth (0.25 is the snow level), green and blue slope, alpha cover. Forward of a glyph is +v.
function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), k = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) { let acc = 0; const o = y * w; for (let x = -r; x <= r; x++) acc += src[o + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) { tmp[o + x] = acc * k; acc += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) { out[y * w + x] = acc * k; acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
  return out;
}
const red = (v) => `rgb(${Math.round(255 * clamp01(v))},0,0)`, green = (v) => `rgb(0,${Math.round(255 * clamp01(v))},0)`;
function stroke(g, pts, w, style) { g.strokeStyle = style; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); }
function ell(g, cx, cy, rx, ry, rot, style) { g.fillStyle = style; g.beginPath(); g.ellipse(cx, cy, rx, ry, rot, 0, 6.2832); g.fill(); }
function soft(g, cx, cy, rx, ry, v, inner = 0.3) { g.save(); g.translate(cx, cy); g.scale(rx, ry); const gr = g.createRadialGradient(0, 0, inner, 0, 0, 1); gr.addColorStop(0, red(v)); gr.addColorStop(1, 'rgb(0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 6.2832); g.fill(); g.restore(); }
function ragged(g, cx, cy, r0, amp, n, rng, style) { g.fillStyle = style; g.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * 6.2832, rr = r0 * (1 + amp * (rng() - 0.5) * 2); if (i) g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); }

// each glyph: [draw(g, rng), blur radius]. Canvas up is the animal's forward.
const GLYPHS = [];
GLYPHS[G.walk] = [(g) => {            // the arrow everybody knows: three toes forward, a short one back
  stroke(g, [128, 178, 128, 60], 25, red(1)); stroke(g, [128, 172, 68, 94], 23, red(1)); stroke(g, [128, 172, 188, 94], 23, red(1));
  stroke(g, [128, 180, 128, 208], 14, red(0.6)); ell(g, 128, 174, 19, 18, 0, red(1)); }, 4, 0.2];
GLYPHS[G.run] = [(g) => {             // running: deeper, toes spread wide, snow kicked back
  stroke(g, [128, 160, 128, 66], 27, red(1)); stroke(g, [128, 158, 60, 106], 25, red(1)); stroke(g, [128, 158, 196, 106], 25, red(1));
  ell(g, 128, 160, 23, 22, 0, red(1)); soft(g, 128, 198, 28, 30, 0.2, 0.1); }, 4, 0.2];
GLYPHS[G.paw] = [(g) => {             // round paw: pad and four toes
  ell(g, 128, 156, 40, 32, 0, red(0.85)); ell(g, 84, 110, 17, 23, -0.35, red(0.9)); ell(g, 172, 110, 17, 23, 0.35, red(0.9));
  ell(g, 111, 78, 16, 23, -0.1, red(1)); ell(g, 145, 78, 16, 23, 0.1, red(1)); }, 4, 0.3];
GLYPHS[G.hind] = [(g) => { ell(g, 128, 128, 62, 100, 0, red(0.8)); ell(g, 128, 70, 46, 40, 0, red(0.9)); }, 3, 0.45];
GLYPHS[G.fore] = [(g) => { ell(g, 128, 128, 50, 62, 0, red(0.95)); }, 3, 0.35];
GLYPHS[G.roost] = [(g, r) => {        // the hole the bird slept in: a ragged oval pit, a crumbled raised rim, and the trampled way out at the front
  for (let i = 0; i < 28; i++) { const a = i / 28 * 6.2832 + r() * 0.2; if (Math.abs(a - 4.712) < 0.6) continue; const d = 67 + r() * 9;
    chunk(g, 128 + Math.cos(a) * d * 0.86, 134 + Math.sin(a) * d, 5 + r() * 4.5, a + 1.5708, r, green(0.3 + r() * 0.45)); }
  g.save(); g.translate(128, 134); g.scale(0.86, 1); ragged(g, 0, 0, 64, 0.09, 20, r, red(0.5)); ragged(g, 0, 3, 48, 0.1, 16, r, red(0.3)); ragged(g, 0, 6, 30, 0.12, 12, r, red(0.2)); g.restore();
  stroke(g, [128, 86, 128, 36], 24, red(0.3));
  for (let i = 0; i < 12; i++) { const x = 108 + r() * 40, y = 16 + r() * 52, a = -1.57 + (r() - 0.5) * 1.3; stroke(g, [x, y, x + Math.cos(a) * 9, y + Math.sin(a) * 9], 5, red(0.3 + r() * 0.35)); } }, 3];
GLYPHS[G.pit] = [(g) => { ell(g, 128, 128, 34, 48, 0, red(0.9)); }, 4];
GLYPHS[G.hollow] = [(g, r) => { ragged(g, 128, 128, 78, 0.1, 22, r, red(0.55)); soft(g, 128, 138, 60, 56, 0.4, 0.2); ell(g, 128, 60, 26, 20, 0, red(0.3)); ell(g, 96, 66, 14, 18, 0, red(0.35)); ell(g, 160, 66, 14, 18, 0, red(0.35)); }, 4];
GLYPHS[G.seam] = [(g) => { stroke(g, [128, -20, 128, 276], 70, red(0.55)); stroke(g, [128, -20, 128, 276], 30, red(0.3)); }, 5];
GLYPHS[G.blob] = [(g) => { soft(g, 128, 128, 108, 122, 1, 0.45); }, 2, -1];
GLYPHS[G.feather] = [(g) => {         // a barred tail feather: depth 0.55 is the pale ground, 1 the dark bars (the shader reads tone from it)
  ell(g, 128, 122, 46, 102, 0, red(0.55)); stroke(g, [128, 216, 128, 250], 7, red(0.8));
  for (let i = 0; i < 7; i++) { const y = 44 + i * 25; stroke(g, [86, y + 15, 128, y, 170, y + 15], 10, red(0.45)); }
  g.globalCompositeOperation = 'source-atop'; ell(g, 128, 26, 40, 22, 0, red(1)); g.globalCompositeOperation = 'lighter'; }, 1, -1];
GLYPHS[G.scuff] = [(g, r) => { for (let i = 0; i < 90; i++) { const x = 40 + r() * 176, y = 30 + r() * 196, a = r() * 6.28; stroke(g, [x, y, x + Math.cos(a) * 9, y + Math.sin(a) * 9], 5, red(0.4 + r() * 0.6)); } }, 2];
GLYPHS[G.drag] = [(g) => { stroke(g, [124, 40, 120, 100, 134, 170, 128, 216], 46, red(0.8)); }, 7];

// an angular lump or slab: a few random corners round (x, y), stretched along angle a
function chunk(g, x, y, s, a, r, style) { const n = 4 + Math.floor(r() * 3), ca = Math.cos(a), sa = Math.sin(a), o = r() * 6.2832; g.fillStyle = style; g.beginPath();
  for (let i = 0; i < n; i++) { const q = o + (i + r() * 0.6) / n * 6.2832, rr = s * (0.6 + r() * 0.6), lx = Math.cos(q) * rr * 1.5, ly = Math.sin(q) * rr * 0.8; if (i) g.lineTo(x + lx * ca - ly * sa, y + lx * sa + ly * ca); else g.moveTo(x + lx * ca - ly * sa, y + lx * sa + ly * ca); }
  g.closePath(); g.fill(); }
GLYPHS[G.trough] = [(g) => {          // where it lay on its belly: a long soft-shouldered groove, deepest under the chest
  stroke(g, [128, 92, 124, 130, 131, 168, 127, 200], 54, red(0.3)); stroke(g, [128, 96, 125, 130, 130, 166, 127, 192], 40, red(0.3)); stroke(g, [128, 100, 126, 140, 129, 176], 22, red(0.25));
  stroke(g, [128, 204, 133, 238], 9, red(0.3)); }, 6];                 // the tail's line behind
GLYPHS[G.crater] = [(g, r) => {       // where it came down: a ragged bowl, a broken rim of slabs, and angular lumps thrown forward in rays
  for (let i = 0; i < 26; i++) { const a = -1.5708 + (r() - 0.5) * 3.5, n = 2 + Math.floor(r() * 4); let d = 58 + r() * 8;
    for (let j = 0; j < n; j++) { const sz = (5.4 - j * 0.8) * (0.6 + r() * 0.7); chunk(g, 128 + Math.cos(a) * d, 132 + Math.sin(a) * d * 0.95, sz, a, r, green(0.7 - j * 0.1)); d += sz * 2.6 + r() * 7; } }
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832 + r() * 0.25, d = 52 + r() * 6; if (r() < 0.3) continue; chunk(g, 128 + Math.cos(a) * d, 132 + Math.sin(a) * d * 0.94, 4.5 + r() * 3.5, a + 1.5708 + (r() - 0.5) * 0.8, r, green(0.3 + r() * 0.4)); }
  ragged(g, 128, 132, 46, 0.2, 19, r, red(0.55));
  ragged(g, 128, 130, 33, 0.24, 13, r, red(0.3));
  ragged(g, 130, 124, 15, 0.3, 9, r, red(0.2));
  for (let i = 0; i < 4; i++) ell(g, 106 + i * 15 + r() * 5, 150 + r() * 14 - (i === 1 || i === 2 ? 34 : 0), 6, 9, 0, red(0.3)); }, 2];
GLYPHS[G.dint] = [(g, r) => {         // both feet, the push-off: the deepest mark on the page, and the snow it kicked back
  for (const sx of [-1, 1]) { const x = 128 + sx * 19; ell(g, x, 112, 14, 27, sx * 0.14, red(0.7)); ell(g, x, 118, 9, 17, sx * 0.14, red(0.3));
    stroke(g, [x, 96, x + sx * 12, 70], 6, red(0.8)); stroke(g, [x, 96, x - sx * 1, 66], 6, red(0.8)); stroke(g, [x, 96, x - sx * 11, 74], 5, red(0.7)); }
  for (let i = 0; i < 18; i++) { const a = 1.5708 + (r() - 0.5) * 1.3, d = 46 + 70 * Math.pow(r(), 1.4), s = 3.6 * (1 - d / 170) * (0.5 + r()); chunk(g, 128 + Math.cos(a) * d * 0.9, 116 + Math.sin(a) * d, s, a, r, green(0.3 + r() * 0.4)); } }, 2];

export async function bakeAtlas(ctx) {
  const r = ctx.rng.fork('atlas'), W = 1024, C = 256, data = new Uint8Array(W * W * 4);
  const cv = document.createElement('canvas'); cv.width = cv.height = C; const g = cv.getContext('2d', { willReadFrequently: true });
  for (let cell = 0; cell < 16; cell++) {
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, C, C); g.globalCompositeOperation = 'lighter';
    GLYPHS[cell][0](g, r);
    const px = g.getImageData(0, 0, C, C).data, raw = new Float32Array(C * C), mag = new Float32Array(C * C);
    for (let i = 0; i < C * C; i++) { raw[i] = px[i * 4] / 255 - 0.33 * px[i * 4 + 1] / 255; mag[i] = Math.min(1, Math.abs(raw[i]) * 4); }
    await ctx.yield();
    // a print is a bowl, not a plateau: a crisp wall (narrow blur) times a floor that goes on deepening toward the middle
    // of each pad and toe (wide blur), and a foot presses deepest at the front (FRONT cells: forward is canvas up)
    const rb = GLYPHS[cell][1], fr = GLYPHS[cell][2] || 0;      // fr < 0: a flat mask (a shadow, a feather), no bowl
    if (fr > 0) for (let y = 0; y < C; y++) { const k = 1 - fr * sstep(40, 216, y); for (let x = 0; x < C; x++) raw[y * C + x] *= k; }
    const pos = new Float32Array(C * C); for (let i = 0; i < C * C; i++) pos[i] = Math.max(0, raw[i]);
    const A0 = boxBlur(raw, C, C, Math.max(1, rb - 2)); await ctx.yield();
    const A = boxBlur(A0, C, C, Math.max(1, rb - 2));
    await ctx.yield();
    const B0 = boxBlur(pos, C, C, rb + 6); await ctx.yield();
    const B = boxBlur(B0, C, C, rb + 6), D = new Float32Array(C * C);
    await ctx.yield();
    for (let i = 0; i < C * C; i++) D[i] = A[i] > 0 && fr >= 0 ? A[i] * (0.36 + 0.64 * Math.min(1, B[i] * 1.2)) : A[i];
    const M0 = boxBlur(mag, C, C, rb + 3); await ctx.yield();
    const M = boxBlur(M0, C, C, rb + 3);
    await ctx.yield();
    const cx = (cell & 3) * C, cy = (cell >> 2) * C;
    for (let y = 0; y < C; y++) { if (y && (y & 63) === 0) await ctx.yield(); for (let x = 0; x < C; x++) {
      const i = y * C + x, xm = Math.max(0, x - 1), xp = Math.min(C - 1, x + 1), ym = Math.max(0, y - 1), yp = Math.min(C - 1, y + 1);
      const du = (D[y * C + xp] - D[y * C + xm]) * 256 / (xp - xm), dv = -(D[yp * C + x] - D[ym * C + x]) * 256 / (yp - ym);
      const edge = Math.min(1, Math.min(x, C - 1 - x, y, C - 1 - y) / 6), o = ((cy + C - 1 - y) * W + cx + x) * 4;
      const seam = cell === G.seam ? Math.min(1, Math.min(x, C - 1 - x) / 6) : edge;
      data[o] = Math.round(255 * clamp01(0.25 + 0.75 * D[i])); data[o + 1] = Math.round(255 * clamp01(0.5 + du / 96)); data[o + 2] = Math.round(255 * clamp01(0.5 + dv / 96));
      data[o + 3] = Math.round(255 * sstep(0.02, 0.3, M[i]) * seam);
    } }
    await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, W, W, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

// ---- the wing print. TWO wings on one 2048 x 1024 canvas (4.5 m by 2.25 m; body side at u 0, tip at u 1, forward up):
// red is the wing that was beaten deep and whole into the powder, green the other, pressed lighter, its feathers a
// little differently spread and the quill end of two or three primaries not registered. The shader lays red on one side of the
// body and green (mirrored) on the other, so the two wings are never copies. Each wing is a bowed fan: the arm arcs
// forward to the wrist, ten primaries splay from the hand as separate tapering grooves (open snow between them toward
// the tips, the outer ones lying ahead of the wrist), twelve secondaries hang back from the arm as a scalloped edge
// and fade toward the body until the inner third is only a brushing. Depth only: slopes are taken in the shader.
const chanR = (v) => `rgb(${Math.round(255 * clamp01(v))},0,0)`, chanG = (v) => `rgb(0,${Math.round(255 * clamp01(v))},0)`;
// one feather pressed into snow: a curved groove from (x, y) along ang (bending by bend), V-shaped across (three nested
// fills), tapering to a point, a shaft ridge down it and barb hatching at 20 degrees; depth d0 at the quill rising to d1.
// q0 > 0: only the outer part registered.
function groove(g, chan, mul, x, y, ang, bend, len, wid, d0, d1, q0 = 0) {
  const n = 12, cx = new Float32Array(n + 1), cy = new Float32Array(n + 1), nx = new Float32Array(n + 1), ny = new Float32Array(n + 1), hw = new Float32Array(n + 1);
  let px = x, py = y;
  for (let k = 0; k <= n; k++) { const q = k / n, a = ang + bend * q; cx[k] = px; cy[k] = py; nx[k] = -Math.sin(a); ny[k] = Math.cos(a);
    hw[k] = wid * 0.5 * Math.min(1, 0.3 + 2.4 * q) * Math.pow(Math.max(0, 1 - q * q * q), 0.75) * sstep(q0 - 0.02, q0 + 0.25, q + 1e-3);
    px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; }
  const gr = (k) => { const G = g.createLinearGradient(cx[0], cy[0], cx[n], cy[n]);
    if (q0 > 0) { G.addColorStop(0, chan(0)); G.addColorStop(q0, chan(0)); G.addColorStop(Math.min(0.98, q0 + 0.3), chan(d1 * k)); }
    else { G.addColorStop(0, chan(d0 * k)); G.addColorStop(0.5, chan(d1 * k)); }
    G.addColorStop(1, chan(d1 * k * 0.95)); return G; };
  g.globalCompositeOperation = 'lighten';
  for (const s of [[1, 0.5], [0.8, 1]]) {            // a trough: steep walls, a floor that lies in shadow
    g.fillStyle = gr(s[1]); g.beginPath(); g.moveTo(cx[0] + nx[0] * hw[0] * s[0], cy[0] + ny[0] * hw[0] * s[0]);
    for (let k = 1; k <= n; k++) g.lineTo(cx[k] + nx[k] * hw[k] * s[0], cy[k] + ny[k] * hw[k] * s[0]);
    for (let k = n; k >= 0; k--) g.lineTo(cx[k] - nx[k] * hw[k] * s[0], cy[k] - ny[k] * hw[k] * s[0]);
    g.closePath(); g.fill();
  }
  // the shaft stands as a fine ridge down the groove
  g.globalCompositeOperation = 'multiply'; g.strokeStyle = mul; g.lineWidth = 5; g.beginPath();
  const k0 = Math.ceil(q0 * n); g.moveTo(cx[k0], cy[k0]); for (let k = k0 + 1; k <= n; k++) g.lineTo(cx[k], cy[k]); g.stroke();
  // ...and the barbs leave it at 20 degrees either side, toward the tip: short ridges 6 px wide and 19 px apart, each
  // ending just inside the feather's own edge (wide enough to survive the slope taps of the shader)
  const hwAt = (dd) => { const f = Math.min(n - 1e-3, Math.max(0, dd / (len / n))), k = Math.floor(f); return lerp(hw[k], hw[k + 1], f - k); };
  g.lineWidth = 6; g.lineCap = 'butt'; g.beginPath();
  for (let d = q0 * len + 24; d < len * 0.96; d += 56) { const f = d / (len / n), k = Math.min(n - 1, Math.floor(f)), t = f - k, x0 = lerp(cx[k], cx[k + 1], t), y0 = lerp(cy[k], cy[k + 1], t), a = ang + bend * (d / len);
    let L = (hwAt(d) - 3) / 0.342; L = Math.min(L, (hwAt(d + L * 0.94) - 3) / 0.342); L = Math.min(L, (hwAt(d + L * 0.94) - 3) / 0.342);
    if (L > 13) for (const sg of [-1, 1]) { const b = a + sg * 0.349, cb = Math.cos(b), sb = Math.sin(b); g.moveTo(x0 + cb * 9, y0 + sb * 9); g.lineTo(x0 + cb * L, y0 + sb * L); } }
  g.stroke();
}
async function drawWing(ctx, g, r, chan, mul, light) {
  const K = light ? 0.8 : 1, ja = light ? 0.07 : 0.035;
  const R = [230, 640 + (light ? 14 : 0)], C = [540, light ? 512 : 492], Wr = [830 - (light ? 30 : 0), 600];
  const arm = (t) => [(1 - t) * (1 - t) * R[0] + 2 * t * (1 - t) * C[0] + t * t * Wr[0], (1 - t) * (1 - t) * R[1] + 2 * t * (1 - t) * C[1] + t * t * Wr[1]];
  g.globalCompositeOperation = 'lighten'; g.lineCap = 'round';                        // the arm: a shallow brushing that deepens outward
  for (let i = 0; i < 16; i++) { const a = arm(0.12 + i / 16 * 0.88), b = arm(0.12 + (i + 1) / 16 * 0.88); g.strokeStyle = chan(K * lerp(0.03, 0.3, i / 15)); g.lineWidth = lerp(30, 64, i / 15); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  await ctx.yield();
  for (let i = 0; i < 12; i++) {                                                         // secondaries, body outward
    const t = (i + 0.5) / 12, p = arm(0.06 + t * 0.9), f = Math.pow(t, 1.5);
    groove(g, chan, mul, p[0], p[1] + 14, lerp(1.78, 1.2, t) + r.range(-ja, ja), -0.1, lerp(210, 330, t) * r.range(0.93, 1.07), 100, K * lerp(0.02, 0.22, f), K * lerp(0.07, 0.62, f) * (light ? r.range(0.6, 1.1) : r.range(0.9, 1.05)));
    if (i % 4 === 3) await ctx.yield();
  }
  const half = light ? [2 + Math.floor(r() * 2), 5 + Math.floor(r() * 2), 8] : [];
  for (let i = 0; i < 10; i++) {                                                         // primaries, inner to outer: the fan
    const t = i / 9, ang = lerp(0.9, -0.5, Math.pow(t, 0.9)) + r.range(-ja, ja), len = lerp(430, 960, sstep(0, 0.8, t)) * (1 - 0.07 * sstep(0.8, 1, t)) * r.range(0.96, 1.04);
    const part = half.includes(i) ? r.range(0.2, 0.25) : 0;                     // (the quill end of two or three is lost; every primary is still a groove)
    groove(g, chan, mul, Wr[0] + t * 90, Wr[1] - t * 40, ang, -0.2 + r.range(-0.05, 0.05), len, lerp(112, 96, t), K * 0.3, K * lerp(0.8, 1, t) * (part ? 0.7 : 1) * (light ? r.range(0.75, 1.1) : 1), part);
    if (i % 3 === 2) await ctx.yield();
  }
}
export async function bakeWing(ctx) {
  const W = 2048, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const r = ctx.rng.fork('wing');
  await ctx.yield();
  await drawWing(ctx, g, r, chanR, 'rgb(205,255,255)', false);
  await ctx.yield();
  await drawWing(ctx, g, r, chanG, 'rgb(255,205,255)', true);
  await ctx.yield();
  g.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(cv); tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  return tex;
}

// ---- materials
// THE FAR PAGE RELAXES. The page under the lens is pitched exactly as the world says; beyond uCurlK.x metres ahead (along
// the trail's heading uCurl.zw from the point uCurl.xy under the lens) the field turns back through uCurlK.z radians on a
// radius of uCurlK.y, so the far field, the hedge and the sky stand in the top of the frame instead of above it. Every
// vertex of the page goes through curl(); what a fragment shades with (its place on the page) is the unturned point.
const CURL_GLSL = /* glsl */`
uniform mat4 uPage; uniform vec4 uCurl; uniform vec3 uCurlK; uniform vec3 uEye;
float gTh;
vec3 curl(vec3 l){
  vec2 T = uCurl.zw; float al = dot(l.xz - uCurl.xy, T), a = al - uCurlK.x; gTh = 0.;
  if (a <= 0. || uCurlK.z < 1e-4) return l;
  float R = uCurlK.y, th = min(a / R, uCurlK.z), s = sin(th), c = cos(th), rest = a - R * th;
  gTh = th;
  float al2 = uCurlK.x + R * s + rest * c + l.y * s, y2 = -R * (1. - c) - rest * s + l.y * c;
  return vec3(l.x + T.x * (al2 - al), y2, l.z + T.y * (al2 - al));
}
// the lens as the snow at the turned point lb sees it, in the page's own unturned axes: light, glitter and veil then know
// how low the gaze lies there (call curl first: it leaves the turn in gTh)
vec3 curlView(vec3 lb){
  vec3 v = (uEye - (uPage * vec4(lb, 1.)).xyz) * mat3(uPage);
  vec2 T = uCurl.zw; float al = dot(v.xz, T), s = sin(gTh), c = cos(gTh), al2 = al * c - v.y * s;
  return vec3(v.x + T.x * (al2 - al), al * s + v.y * c, v.z + T.y * (al2 - al));
}`;
// the snow is a strip of rows laid from the point under the lens along the trail's heading (position: x across, z ahead)
const DISC_VERT = /* glsl */`${CURL_GLSL} varying vec3 vL, vV; void main(){ vec2 T = uCurl.zw;
  vec3 l = vec3(uCurl.x + T.x * position.z - T.y * position.x, 0., uCurl.y + T.y * position.z + T.x * position.x);
  vL = l; vec3 lb = curl(l); vV = curlView(lb); gl_Position = projectionMatrix * viewMatrix * uPage * vec4(lb, 1.); }`;
const DISC_FRAG = /* glsl */`precision highp float; varying vec3 vL, vV;
${SNOW_GLSL}
void main(){
  vec2 p = vL.xz; vec2 fw = fwidth(p);
  vec3 d = vV; float dist = length(d) + 1e-4;
  gl_FragColor = vec4(snowShade(p, fw, vec2(0.), 0., 0., d / dist, dist), 1.);
}`;
// a stamp: per-instance aA = (x, z, rot, age), aB = (width, length, depth in metres, glyph). age 0..1 softens an old
// mark, 2 is a dark thing lying on the snow (a feather), 3 is the cast shadow of a raised thing (stretched down-sun).
const STAMP_VERT = /* glsl */`${CURL_GLSL}
attribute vec4 aA, aB;
uniform vec2 uRes, uSunH; uniform vec3 uCam; uniform float uTanE;
varying vec2 vUv, vP; varying vec4 vI, vAx; varying vec3 vS, vV;
void main(){
  float rot = aA.z, age = aA.w; vec2 size = aB.xy, c = aA.xy;
  vec2 fwd = vec2(-sin(rot), -cos(rot));
  if (age > 4.5) c -= uSunH * .17;                                       // a thin thing's shadow lies beside it
  if (age > 2.5 && age < 3.5) { fwd = -uSunH; size.y = aB.y / max(uTanE, .03); c += fwd * size.y * .42; }
  vec2 rt = vec2(-fwd.y, fwd.x);
  float dist = length(vec3(c.x, 0., c.y) - uCam);
  float pm = dist * 2. / (projectionMatrix[1][1] * uRes.y);                 // metres per pixel at that distance
  float graze = clamp(abs(uCam.y) / max(dist, .1), .02, 1.);
  float kx = max(1., 2.5 * pm / size.x), ky = min(max(1., 1.5 * pm / (size.y * graze)), 30.);
  vec2 q = position.xy * size * vec2(kx, ky);
  vec2 p = c + rt * q.x + fwd * q.y;
  vUv = uv; vP = p; vAx = vec4(rt, fwd); vS = vec3(size, 1. / (kx * ky));
  vI = vec4(aB.z, aB.w, age, smoothstep(1.15, 2.2, max(kx, ky)));
  // where the page turns a flat stamp would cut under the round of the snow: it rides a hand higher there
  float lift = .13 * smoothstep(0., 1.5, dot(p - uCurl.xy, uCurl.zw) - uCurlK.x) * step(1e-4, uCurlK.z);
  vec3 lb = curl(vec3(p.x, .02 + lift, p.y)); vV = curlView(lb);
  gl_Position = projectionMatrix * viewMatrix * uPage * vec4(lb, 1.);
}`;
const STAMP_FRAG = /* glsl */`precision highp float;
uniform sampler2D uTex; uniform vec2 uSlopeK; uniform vec3 uDark; uniform vec4 uWing; uniform float uPlant;   // uPlant 1: the wind's work round a plant (not a print: it is not kept as a blue dash from far off)
varying vec2 vUv, vP; varying vec4 vI, vAx; varying vec3 vS, vV;
${SNOW_GLSL}
#ifdef WING
// depth of the wing print at quad uv: the deep wing (red) on the seed's side, the lighter one (green) on the other
float gD(vec2 uv, float bias){
  float side = step(.5, uv.x); vec2 w = vec2(abs(uv.x - .5) * 2., uv.y);
  // smeared (the fox did not miss): the print dragged a hand's width and blurred, never redrawn
  vec4 t = texture2D(uTex, clamp(w + vec2(.02, -.05) * uWing.y * (.4 + .6 * w.x), .002, .998), bias + 1.3 * uWing.y);
  // ...and its feathers pulled into streaks toward the body, where the crater is
  t = max(t, max(texture2D(uTex, clamp(w + vec2(.06, -.03) * uWing.y, .002, .998), bias + 1.3) * .8, texture2D(uTex, clamp(w + vec2(.13, -.05) * uWing.y, .002, .998), bias + 2.) * .55) * uWing.y);
  float d = mix(t.r, t.g, abs(side - uWing.z));
  d *= 1. - uWing.y * .45 * (1. - smoothstep(.05, .5, w.x));
  return d * mix(1., step(.5, mix(1. - uv.x, uv.x, uWing.z)), uWing.x);
}
#else
vec4 atl(vec2 uv){ float g = floor(vI.y + .5); vec2 cell = vec2(mod(g, 4.), floor(g / 4.)); return texture2D(uTex, (cell + clamp(uv, .012, .988)) * .25); }
float gD(vec2 uv, float bias){ return (atl(uv).r - .25) / .75; }
#endif
void main(){
  vec2 fw = fwidth(vP);
  float age = vI.z, soften = age < 1.5 ? 1. - .7 * age : 1.;
  float isFlat = step(4.5, age), isThread = step(3.5, age) * (1. - isFlat), isShadow = step(2.5, age) * (1. - step(3.5, age)) + isFlat, isDark = step(1.5, age) * (1. - step(2.5, age)), mark = 1. - step(1.5, age);
  vec2 rt = vAx.xy, fwd = vAx.zw;
  // crumble: the edge of a mark in wind-packed snow is never a clean curve (gone where it would crawl)
  float cr = (1. - smoothstep(.012, .05, max(fw.x, fw.y))) * mark;
  vec2 jit = (vec2(vnoise(vP * 13.), vnoise(vP * 13. + 23.1)) - .5) * .05 + (vec2(vnoise(vP * 41.), vnoise(vP * 41. - 9.3)) - .5) * .02;
  vec2 uv = vUv + vec2(dot(jit, rt), dot(jit, fwd)) * cr / vS.xy;
#ifdef WING
  float press = .62 + .7 * vnoise(vP * .75 + 4.1);                     // the powder did not take the wing evenly
  float D = gD(uv, 0.) * press;
  vec2 e = vec2(2.5 / 2048., 5. / 1024.);                              // five texels either way, from the next mip: eight bits of depth are not enough at one texel
  vec2 sl = vec2(gD(uv + vec2(e.x, 0.), 1.) - gD(uv - vec2(e.x, 0.), 1.), gD(uv + vec2(0., e.y), 1.) - gD(uv - vec2(0., e.y), 1.)) * press / (2. * e);
  float cover = smoothstep(.004, .045, gD(uv, 2.6));
#else
  float press = 1.;
  vec4 t = atl(uv);
  float D = (t.r - .25) / .75, cover = t.a;
  vec2 sl = (t.gb - .5) * 2. * uSlopeK;                                // dD/du, dD/dv
#endif
  float depthM = vI.x * soften, msz = min(vS.x, vS.y);
  sl *= smoothstep(.0, .06, abs(D));                                   // the skirt of a mark takes no light: no halo round a print
  vec2 bend = -(rt * sl.x / vS.x + fwd * sl.y / vS.y) * depthM;        // dh/dx, dh/dz of the print in field space
  vec2 sq = vec2(dot(uSunH, rt), dot(uSunH, fwd)) / vS.xy;             // one metre toward the sun, in uv
#ifdef WING
  // the grooves' own cast shadow: three taps toward the sun; in shadow if the snow there is higher than the sun's ray
  float reach = uTanE * 2.5;     // an artist's sun inside a print: its shadow reaches two fifths as far, so the far wall is lit
  float Ds = gD(uv + sq * .07, 0.) * press;                            // the snow 7 cm toward the sun
  float shIn = smoothstep(0., .03, (D - Ds) * depthM - .07 * reach);
  shIn = max(shIn, smoothstep(0., .04, (D - gD(uv + sq * .2, 0.) * press) * depthM - .2 * reach));
  shIn = max(shIn, smoothstep(0., .05, (D - gD(uv + sq * .6, 0.) * press) * depthM - .6 * reach));
  shIn = max(shIn, smoothstep(.16, .5, D * min(depthM * 4., 1.)) * (1. - smoothstep(.02, .2, Ds - D)));
  float small = 0.;
#else
  // a print is a hollow under raking light. An artist's sun: the wall that hides the sun lays a shadow whose length is a
  // share of the print (longer in a deeper mark), graded out across the floor; the far slope stands in the light
  float L = .44 * clamp(depthM / .2, .8, 2.) * (.07 / max(uTanE, .03));   // ...and it shortens as the light climbs (as now at 4 degrees)
  float Ds = gD(uv + sq * .06 * msz, 0.), D2 = gD(uv + sq * .15 * msz, 0.), D3 = gD(uv + sq * .32 * msz, 0.);
  float shIn = smoothstep(-.04, .22, D - Ds - .06 / L);
  shIn = max(shIn, smoothstep(-.06, .3, D - D2 - .15 / L));
  shIn = max(shIn, smoothstep(-.08, .36, D - D3 - .32 / L));
  shIn = max(shIn, smoothstep(.72, 1., D) * (1. - smoothstep(.02, .2, Ds - D)));
  // a print too small on screen to model is one dark hollow (the far threads keep their weight)
  float small = smoothstep(.04, .11, min(fw.x, fw.y) / msz) * (1. - uPlant);   // (a print's rule: the wind's work round a plant never gains weight with distance)
  shIn = max(shIn, small * smoothstep(.1, .4, D));
#endif
  float cup = clamp(D * 1.15, 0., 1.) * soften, mask = clamp(D, 0., 1.);
  shIn = mix(shIn * (1. - .45 * age * mark), mask, isShadow); bend *= mark; cup *= mark;
  float ripW = mix(mix(.8, .85, uLevel), .34, uMoon);                 // the weight of a ripple's shadow (as in snowShade)
  shIn = mix(shIn, mix(shIn * ripW, ripW, isShadow), uPlant);   // a plant's shadow lies across the ripples and is as deep as theirs at most (the ripple shadow's own weight in snowShade), never a print's (its shape is its cover alone), and so is the shadow inside the wind's work round it: a scour and a drift tail are ripple-sized forms
  vec3 d = vV; float dist = length(d) + 1e-4; vec3 V = d / dist;
  float far0 = vI.w * (1. - isShadow);
  // the sun-side wall falls into the deepest blue: the dark of a print gathers under the wall that hides the sun
  float wallS = clamp((D - Ds) * 2.2, 0., 1.) * mark * (1. - uPlant);   // (a print's rule: beside a drift tail it drew a navy line)
  gWindForm = uPlant;
  vec3 col = snowShade(vP, fw, bend, min(cup * mix(.12, 1., max(shIn, small)) + wallS * .5, 1.), shIn, V, dist);
  col *= 1. - .2 * wallS * cup;
  col *= mix(vec3(1.), vec3(.95, .8, .58), cup * (1. - shIn) * mark * (1. - uPlant));   // what light reaches the floor of a hollow is the gold of the far slope, never white (a print's rule: the wind's scour round a plant is lit as the snow is)
  cover *= mix(1., smoothstep(.015, .07, abs(D)), mark);               // the flat skirt of a stamp is not drawn: prints that overlap join, they do not cut each other
  float a = mix(cover, mix(mask, smoothstep(.1, .4, D), isDark) * .92, max(isShadow, isDark));
  // the far wall and its lip catch the sun: a gold crescent on the down-sun side of every cup, and nowhere else
  float faces = smoothstep(.0, .06, -dot(bend, uSunH));               // only a wall that rises away from the sun
  float rim = smoothstep(.04, .28, Ds - D) * smoothstep(.02, .1, D) * (1. - smoothstep(.25, .6, D)) * faces * mark * soften * (1. - far0) * (1. - small) * (1. - uPlant);   // (a print's crescent: the wind's scour round a plant has none)
  col = mix(col, (uSunCol * vec3(1.1, .8, .42) + uDawn * vec3(.9, .8, .6)) * .95, rim * .8 * exp(-dist / 900.));   // gold, not white: the colour stays in the highlight
  // spindrift pours into a cup over its windward lip in gusts
  vec2 wq = vec2(dot(uWind, rt), dot(uWind, fwd)) / vS.xy;
  float lee = clamp(D - gD(uv - wq * .25, 0.) * press, 0., 1.) * (1. - smoothstep(.1, .6, D)) * mark * (1. - far0);
  vec2 ww = wr(vP);
  col += (uSunCol * .5 + uShade * .7) * lee * smoothstep(.55, .9, vnoise(vec2(ww.x * .9 - uTime * 5., ww.y * 3.))) * .35 * uDrift;
  col = mix(col, mix(mix(uDark * 1.6 + uSunCol * .2 + uShade * .1, uDark, smoothstep(.6, .82, D)), uHaze, 1. - exp(-dist / 900.)), isDark * .94);
  // far: a print too small to draw becomes a flat blue dash of the right average tone
  vec3 flatC = mix(col, mix(uShade, uHaze, 1. - exp(-dist / 900.)), .7);
  col = mix(col, flatC, far0); a = mix(a, .55 * sqrt(vS.z) * (1. - uPlant * (1. - isShadow)), far0);
  col = mix(col, flatC, isThread); a = mix(a, cover * .55 * smoothstep(.12, .5, max(fw.x, fw.y)), isThread);   // a far line of prints: one blue thread, gone when the prints themselves can be seen
  // the wind's work round a plant and the plant's shadow fade with the plant: by true area over drawn area where the
  // quad was widened to stay a pixel, and out where a pixel is wider than a quarter to a half of the stamp
  a *= mix(1., vS.z * (1. - smoothstep(.25, .5, max(fw.x, fw.y) / vS.x)), uPlant);
  gl_FragColor = vec4(col, a);
}`;

function stampMaterial(U, tex, wing) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uTex: { value: tex }, uSlopeK: { value: wing ? new THREE.Vector2(205, 51.2) : new THREE.Vector2(96, 96) }, uWing: { value: new THREE.Vector4(0, 0, 0, 0) }, uPlant: { value: 0 } },
    defines: wing ? { WING: 1 } : {}, vertexShader: STAMP_VERT, fragmentShader: STAMP_FRAG,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
}
function stampMesh(U, tex, list, count, wing) {
  const q = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
  geo.index = q.index; geo.setAttribute('position', q.attributes.position); geo.setAttribute('uv', q.attributes.uv);
  const a = new Float32Array(count * 4), b = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { a[i * 4] = list[i * 8]; a[i * 4 + 1] = list[i * 8 + 1]; a[i * 4 + 2] = list[i * 8 + 2]; a[i * 4 + 3] = list[i * 8 + 7]; b[i * 4] = list[i * 8 + 3]; b[i * 4 + 1] = list[i * 8 + 4]; b[i * 4 + 2] = list[i * 8 + 5]; b[i * 4 + 3] = list[i * 8 + 6]; }
  geo.setAttribute('aA', new THREE.InstancedBufferAttribute(a, 4)); geo.setAttribute('aB', new THREE.InstancedBufferAttribute(b, 4)); geo.instanceCount = count;
  const m = new THREE.Mesh(geo, stampMaterial(U, tex, wing)); m.frustumCulled = false; return m;
}

const FOG = /* glsl */`vec3 hazed(vec3 c, float dist){ return mix(c, uHaze, 1. - exp(-dist / 900.)); }`;
const PLAIN_VERT = /* glsl */`${CURL_GLSL} uniform mat4 uLocal; varying vec2 vUv; varying vec3 vL; void main(){ vUv = uv; vL = (uPage * vec4(curl((uLocal * vec4(position, 1.)).xyz), 1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vL, 1.); }`;
// the hedge: one strip, 520 m by 26 m, reading the blackthorn tile at its own proportions (never stretched to the
// skyline: the top is cut by a ragged mask, stem by stem), a hazier second row standing behind it, the sun's side of
// every stem rimed gold, and one gap whose edges are loose twigs that arch over it. uOpt: x 1 = has the gap, y = which
// stretch of hedge (an offset along it), z 1 = dwindles at its ends. uFrame: cos, sin of its turn in the page.
const HEDGE_FRAG = /* glsl */`precision highp float; varying vec2 vUv; varying vec3 vL; uniform vec3 uDark; uniform vec3 uEye; uniform sampler2D uTex; uniform vec4 uOpt, uFrame;
${SNOW_GLSL}${FOG}
void main(){
  float X = (vUv.x - .5) * 520., Y = vUv.y * 26., Xn = X + uOpt.y;
  float top = hedgeRaw(Xn) * (1. - .8 * smoothstep(150., 256., abs(X)) * uOpt.z);
  float v1 = Y / (24. * clamp(top / 19., .7, 1.2)), v2 = Y / (26. * clamp(top / 19., .7, 1.2));
  vec2 uv1 = vec2(Xn / 96., min(v1, 1.) * .985 + .006);
  vec4 t = texture2D(uTex, uv1);
  vec4 t2 = texture2D(uTex, vec2(Xn / 112. + .37, min(v2, 1.) * .985 + .006));
  vec2 ex = vec2(uFrame.x, -uFrame.y), ez = vec2(uFrame.y, uFrame.x);
  float sx = dot(uSunH, ex), front = max(dot(uSunH, ez), 0.);
  float aS = texture2D(uTex, uv1 + vec2(sx > 0. ? .0011 : -.0011, .003)).a;
  float edge = clamp((t.a - aS) * 2.2, 0., 1.);                        // the side of each stem that faces the sun
  // the skyline: each stem ends at its own height
  float cut1 = top * (.8 + .34 * vnoise(vec2(Xn * .45, 2.))), cut2 = top * (1.04 + .16 * vnoise(vec2(Xn * .21, 8.)));
  float th1 = smoothstep(cut1 - 3., cut1, Y), th2 = smoothstep(cut2 - 3., cut2, Y);                          // only the stoutest stems reach the top: a ragged hedge top, not spires
  float a1 = t.a * smoothstep(th1 * .9, th1 * .9 + .3, t.a + .001) * (1. - th1 * th1 * th1), a2 = t2.a * smoothstep(th2 * .9, th2 * .9 + .3, t2.a + .001) * (1. - th2 * th2 * th2) * .7;
  float body = (1. - smoothstep(.2, .62, v1 + (vnoise(vec2(Xn * .3, Y * .5)) - .5) * .4)) * .96;          // the dark heart of the thicket
  // the gap: the thicket stops, its loose twigs go on and arch over the opening
  float e = abs(X) - 8.3 + (vnoise(vec2(Y * .5, X * .3)) - .5) * 3.2 + 3.4 * smoothstep(6., 15., Y) * vnoise(vec2(Y * .35 + 7., X > 0. ? 3. : 11.));
  float gB = mix(1., smoothstep(.6, 3., e), uOpt.x), gT = mix(1., smoothstep(-1.8, .5, e + (t.a - .5) * 2.4), uOpt.x);
  float ends = 1. - smoothstep(240., 258., abs(X));
  float af = max(a1 * gT, body * gB) * ends, ab = a2 * gB * ends;
  float a = af + ab * (1. - af);
  // the foot: snow lies banked against the stems in hummocks (no ruled line where the dark meets the field)...
  float bank = .5 + 1.9 * vnoise(vec2(Xn * .09, 1.3)) + 1.1 * vnoise(vec2(Xn * .37, 6.1)) + .5 * vnoise(vec2(Xn * 1.3, 2.2));
  a *= smoothstep(bank - .25, bank + .9, Y + .5 * t.a);
  if (a < .01) discard;
  vec3 wood = uDark * (.8 + .5 * v1 + .4 * front) + uShade * .05 + uSunCol * (.03 + .16 * front) * v1;
  vec3 frost = uSunCol * (.3 * abs(sx) + .6 * front) + uShade * .34;
  vec3 c1 = mix(wood, frost, t.r * (.08 + .7 * v1 * v1));
  c1 += uSunCol * vec3(1.05, .86, .58) * edge * (.25 + .75 * smoothstep(.1, .8, v1)) * .8 * (1. - body * .8);
  vec3 c2 = mix(mix(uDark * 1.3, uShade, .22), uHaze, .5);            // the row behind stands in haze
  vec3 col = mix(c2, c1, af / max(a, 1e-3));
  // ...and cold ground mist stands in front of it, two metres deep, thicker in places, drifting: the foot melts into the field, the hedge above it is the dark of the picture
  // (under the moon the mist stands deeper, three to six metres: it is what lifts the wood, which no key reaches there, off black)
  float mistN = vnoise(vec2(Xn * .045 + uTime * .05, 4.4));
  float mist = exp(-max(Y - bank, 0.) / mix(1.5 + 1.0 * mistN, 3.2 + 2.6 * mistN, uMoon)) * (.5 + .5 * vnoise(vec2(Xn * .13 - uTime * .09, Y * .3 + 2.)));
  col = mix(col, uSunCol * .4 + uShade * .62 + uDawn * .55, min(mist * .95, .9));
  gl_FragColor = vec4(hazed(col, distance(vL, uEye) * .55), a);        // the only dark in the picture keeps its weight from across the field
}`;
const BIRCH_FRAG = /* glsl */`precision highp float; varying vec2 vUv; varying vec3 vL; uniform vec3 uDark; uniform vec3 uEye; uniform sampler2D uTex; uniform float uFlip;
${SNOW_GLSL}${FOG}
void main(){
  vec4 t = texture2D(uTex, vUv, -.6); float a = min(t.a * 1.5, 1.);
  a *= smoothstep(0., .14, vUv.x) * (1. - smoothstep(.86, 1., vUv.x)) * (1. - smoothstep(.9, 1., vUv.y));   // the crown is a card: its haze of fine twigs dies away toward the card's sides and top, so no edge of it stands in the sky
  if (a < .03) discard;
  float sx = dot(uSunH, vec2(uHedge.z, -uHedge.w)), front = max(dot(uSunH, vec2(uHedge.w, uHedge.z)), 0.);
  float rnd = (t.g * 2. - 1.) * uFlip;                                 // -1 at the stem's left edge, +1 at its right
  float sxe = sx < 0. ? min(sx, -.6) : max(sx, .6);                     // an artist's sun: the stem is round whatever the hour
  float lit = clamp(.4 + .9 * rnd * sxe + .25 * front, 0., 1.); lit = lit * lit * (3. - 2. * lit);   // a round stem: a lit edge, a core shadow, a shaded edge
  float bark = smoothstep(.25, .8, t.r);
  vec3 alb = mix(uDark * 1.15 + vec3(.01), vec3(.74, .72, .7), bark);
  vec3 col = alb * (uShade * (.55 + .3 * bark) * (1. - .45 * (1. - lit) * (1. - rnd * rnd)) + uSunCol * vec3(1.05, .9, .7) * lit * (.6 * bark + .3));
  col += mix(uSunCol, uCrest, .6) * .17 * (1. - bark) * (.3 + .7 * vUv.y) * (abs(sx) * .6 + front);          // rime on the fine twigs
  col = mix(col, uHaze, .5 * exp(-vUv.y * 72. / 2.4));
  gl_FragColor = vec4(hazed(col, distance(vL, uEye)), a);
}`;
const DOME_VERT = /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
// the sky, one function for the dome and for the mist curtain that stands in the gap (so the curtain cannot be told from it)
const SKY_GLSL = /* glsl */`uniform vec3 uSkyTop, uBelt; uniform float uNight, uGlare;
vec3 skyCol(vec3 d){
  float y = max(d.y, 0.), hl = length(d.xz);
  vec2 hd = d.xz / max(hl, 1e-3);
  float toSun = dot(hd, uSunH), away = 1. - smoothstep(-.85, .1, toSun);
  vec3 col = mix(uHaze, uSkyTop, smoothstep(0., .64, y));
  col += uSunCol * (.06 + .13 * toSun) * exp(-y * 6.);                 // the sun's side of the horizon is the gold side
  float by = (y - .12) / .075;
  col += uBelt * exp(-by * by) * away;                                 // the far side carries the rose belt...
  col *= 1. - .16 * exp(-y * 20.) * away;                              // ...over the blue-grey shadow of the earth
  float ci = smoothstep(.45, .85, vnoise(vec2(d.x * 4. + d.z * 2.3, y * 36.))) * exp(-y * 8.) * smoothstep(.012, .07, y);
  col += uSunCol * ci * (.035 + .03 * toSun);                          // a breath of ice haze low down, nothing more
  col = mix(col, uSunCol * .4 + uShade * .62 + uDawn * .55, .75 * exp(-y * 34.));   // blown snow stands a hand high along the whole horizon: the field has no ruled edge
  float s = max(dot(d, uSun), 0.), s2 = s * s, s8 = s2 * s2 * s2 * s2;
  // first light: a peach line on the horizon under a rose breath, widest toward where the sun will come up
  float dw = smoothstep(-.6, .9, dot(hd, uDawnH)), dl = dot(uDawn, vec3(.3, .5, .2));
  col += uDawn * dw * exp(-y * 9.) + uDawn * vec3(.75, .42, 1.25) * dw * .34 * exp(-y * 3.2);
  col += uDawn * ci * dw * .5;                                        // the ice haze low down takes it first
  // the disc: a sun is plain; the moon (uMoon) carries its seas and a soft limb
  vec3 mr = (d - uSun) * 26.; float seas = .58 + .5 * vnoise(mr.xy * 2.1 + mr.z + 3.7) * vnoise(mr.yx * .9 - 1.3) * 2.;
  col += uSunCol * ((.1 * (1. - uMoon) * s2 * s2 + mix(.22, .06, uMoon) * s8 + .5 * s8 * s8 * s8 * s8) * uGlare + 5. * smoothstep(.9994, .9998, s) * mix(1., seas * .8, uMoon));
  float hq = (s - .927) / .012;
  col += uSunCol * vec3(1., .8, .62) * exp(-hq * hq) * .09 * (1. - uMoon);            // diamond dust: the 22 degree halo and a sun pillar
  col += uSunCol * exp(-(1. - toSun) * 900.) * exp(-y * 5.) * .3 * step(0., toSun);
  if (uNight > .01) {
    vec2 c = d.xz / (1. + y) * 70.; vec2 ci2 = floor(c), cf = fract(c) - .5;
    float h = hash21(ci2), h2 = hash21(ci2 + 13.1);
    float star = step(.93, h) * (1. - smoothstep(.04, .1 + .12 * h2 * h2, length(cf - (vec2(h2, fract(h * 37.)) - .5) * .5)));
    col += vec3(.75, .84, 1.) * star * uNight * (1. - min(dl * dw * 2.4 * exp(-y * 2.), .9)) * (.5 + 1.6 * h2) * smoothstep(.04, .3, d.y) * (.75 + .25 * sin(uTime * (1. + 3. * h2) + h * 40.));
  }
  return col;
}`;
const DOME_FRAG = /* glsl */`precision highp float; varying vec3 vD;
${SNOW_GLSL}${SKY_GLSL}
void main(){ gl_FragColor = vec4(skyCol(vD / max(length(vD), 1e-4)), 1.); }`;
// the mist in the gap: a sky-coloured curtain standing in front of the exit ring while the page is pitched and levelling,
// so the ring itself never shows over the snow's horizon (only its faint outer glow rises in the gap over the last five metres
// before level); it lifts from the ground up (uLift, metres) once the page is level
const CURTAIN_VERT = /* glsl */`${CURL_GLSL} uniform mat4 uLocal; varying vec3 vG, vL0; varying vec2 vUv; void main(){ vUv = uv; vL0 = (uLocal * vec4(position, 1.)).xyz; vec3 lb = curl(vL0); vG = -curlView(lb); gl_Position = projectionMatrix * viewMatrix * uPage * vec4(lb, 1.); }`;
const CURTAIN_FRAG = /* glsl */`precision highp float; varying vec3 vG, vL0; varying vec2 vUv; uniform float uLift, uRingDrop; uniform vec3 uDark;
${SNOW_GLSL}${SKY_GLSL}
void main(){
  float Y = vUv.y * 26., X = (vUv.x - .5) * 18.;
  // where the ray through this point of the gap comes down on the snow beyond the hedge (the lens stands at vL0 - vG in the page's own axes)
  float eh = max(vL0.y - vG.y, .2), sg = eh / max(-vG.y, eh * .03); vec2 pg = vL0.xz + vG.xz * (sg - 1.), fwg = fwidth(pg);
  if (Y + (vnoise(vec2(X * .35, uTime * .25)) - .5) * 5. + 2.6 < uLift) discard;
  vec3 d = vG / max(length(vG), 1e-4);
  float gl = exp(-(X * X / 30. + (Y - 4.5) * (Y - 4.5) / 70.));
  float wisp = mix(1., .5 + .9 * vnoise(vec2(X * .22 - uTime * .12, Y * .55 + uTime * .05)) * vnoise(vec2(X * .6 + uTime * .2, Y * .2 - 3.)) * 2., uMoon);   // under the moon the mist is banded and drifts
  // through the gap: the sky beyond down to its horizon and the far snow under it, with the mist standing in front
  vec3 mistC = uSunCol * .4 + uShade * .62 + uDawn * .55;
  vec3 beyond = mix(skyCol(vec3(d.x, max(d.y, 0.), d.z)), mistC, 1. - smoothstep(-.012, .004, d.y));
  // under the moon the gap is an opening, not a pane: below the horizon it shows the very snow that lies beyond the hedge, shaded as the field is,
  // so the card has no foot and no sides to see
  beyond = mix(beyond, mix(snowShade(pg, fwg, vec2(0.), 0., 0., -d, length(vG) * sg), skyCol(vec3(d.x, max(d.y, 0.), d.z)), smoothstep(-.003, -.001, d.y)), uMoon);
  // (under the moon) a far line of trees on that horizon: there is country beyond the hedge, and the gap is a gate to it
  float tl = .006 + .016 * vnoise(vec2(d.x * 46. + d.z * 9., 4.)) + .008 * vnoise(vec2(d.x * 190., 7.));
  beyond = mix(beyond, mix(uDark, uHaze, .55), uMoon * (1. - smoothstep(tl - .004, tl + .002, d.y)) * smoothstep(-.006, .001, d.y) * .8 * (1. - smoothstep(4.5, 8.5, abs(X))));          // (no copy of it below the horizon: this is snow, not water)
  // the curtain is a card: at its sides and its foot it takes the tone of the hedge-foot mist beside it, so no edge of it shows
  float sf = 1. - smoothstep(4.4, 8.8, abs(X) + (vnoise(vec2(Y * .4, X * .2 + uTime * .06)) - .5) * 2.4), ft = smoothstep(-.5, 4.5, Y + (vnoise(vec2(X * .5 - uTime * .1, 3.3)) - .5) * 3.);
  float mh = exp(-max(Y - 2.5, 0.) / 6.) * (.8 + .2 * vnoise(vec2(X * .13 - uTime * .09, Y * .3 + 2.))) * 1.06;                        // the hedge beside it: dark stems in haze, mist at the foot
  vec3 side = mix(mix(mix(uDark * 1.3, uShade, .22), uHaze, .5), mistC, min(mh, .97));
  float kb = mix(mix(sf * mix(.45, 1., ft), 1., smoothstep(11., 19., Y)), 1., uMoon);   // above the hedge it is sky again (under the moon nothing stands at its sides: the opening shows what lies beyond, to its edge)
  vec3 col = mix(side, beyond, kb) + uGap * mix(.62 * gl + .2 * exp(-Y / 5.), .62 * gl * (.5 + .5 * wisp) + .24 * exp(-Y / 4.) * wisp, uMoon) * sf * mix(mix(.3, 1., ft), (1. - smoothstep(7., 9., abs(X))) * smoothstep(0., 5., Y), uMoon);   // (under the moon the light in the gap dies away to nothing at the card's sides and at its foot)
  // the ring's own glow reaches past the card on either side (the engine draws it round the ring; the card hides the part behind
  // itself, which left the card as a darker pane in a sheet of faint light): toward its sides the card carries the same breath
  // of light, so no edge of it shows. Under the moon. The copy is centred on the ring where it really stands behind the card:
  // at the gaze's height when the page is level, and uRingDrop metres lower while the page is pitched: far under the snow for
  // nearly all the flight, rising through the snow line with the ring's own glow over the last five metres before level
  float rr = max(length(vec2(X, Y - eh + uRingDrop)) - 6., 0.) / 6.;
  col += vec3(.62, .75, 1.) * (.4 * exp(-rr * 7.) + .048 * exp(-rr * 2.2)) * smoothstep(4.5, 9., abs(X)) * uMoon;
  gl_FragColor = vec4(col, 1.);      // the mist in the gap holds the light: the eye goes there
}`;
const CLOD_VERT = /* glsl */`${CURL_GLSL} varying vec3 vN, vL; void main(){ vN = normal; vL = position; gl_Position = projectionMatrix * viewMatrix * uPage * vec4(curl(position), 1.); }`;
const CLOD_FRAG = /* glsl */`precision highp float; varying vec3 vN, vL;
${SNOW_GLSL}${FOG}
void main(){
  vec3 fx = dFdx(vL), fy = dFdy(vL), c = cross(fx, fy); float cl = length(c);
  vec3 n = cl > 1e-9 ? c / cl : vN / max(length(vN), 1e-4);            // a broken lump of crust: facets, not a pebble
  if (dot(n, uCam - vL) < 0.) n = -n;
  float lit = clamp(dot(n, uSun) * 2.6 + .1, 0., 2.3);
  gl_FragColor = vec4(hazed(mix(uShade, uShadeDeep, .5 - .5 * n.y) * (.7 + .3 * n.y) + mix(uSunCol, uCrest, .4) * lit * .5, distance(vL, uCam)), 1.);
}`;
const SEDGE_VERT = /* glsl */`${CURL_GLSL} attribute vec3 aLean; attribute vec2 aT; uniform float uTime; varying float vT; varying vec3 vL;
void main(){ float t = aT.x; vec3 p = position + aLean * t * t + vec3(1., 0., .3) * t * t * (.05 * sin(uTime * 11. + aT.y) + .03 * sin(uTime * 4.3 + aT.y * 1.7) + .04);
  vT = t; vL = p; gl_Position = projectionMatrix * viewMatrix * uPage * vec4(curl(p), 1.); }`;
// the light dry straw stands in (t: 0 at the snow, 1 at a blade's tip): the feeding patch's sedge is lit by it, and the dead plants beside the trail by no more than it
const STRAW_GLSL = /* glsl */`vec3 strawLight(float t){ return uShade * 1.2 + uSunCol * (.35 + .75 * t) + uDawn * .5 + uSunCol * vec3(.55, .42, .2) * uMoon * (.4 + .6 * t); }`;
const SEDGE_FRAG = /* glsl */`precision highp float; varying float vT; varying vec3 vL; uniform vec3 uStraw;
${SNOW_GLSL}${FOG}${STRAW_GLSL}
void main(){ gl_FragColor = vec4(hazed(uStraw * strawLight(vT), distance(vL, uCam)), 1.); }   // under the moon dry straw is pale in the moon's own light (no light of its own): still the one warm note on the page`;
const DUST_VERT = /* glsl */`${CURL_GLSL} attribute vec3 aSeed; uniform vec3 uCam; uniform vec2 uRes; uniform float uTime; varying float vTw;
void main(){
  vec3 p = position + vec3(1.5, -.12, .2) * uTime;
  p.xz = mod(p.xz - uCam.xz + 40., 80.) - 40. + uCam.xz; p.y = mod(p.y, 16.) + .1;
  vec4 mv = viewMatrix * uPage * vec4(curl(p), 1.);
  float tw = sin(uTime * (2. + 5. * aSeed.x) + aSeed.y * 40. + dot(p, vec3(.7, 1.3, .5)) * 2.);
  vTw = smoothstep(.55, 1., tw) * smoothstep(1.5, 5., -mv.z) * (1. - smoothstep(30., 40., -mv.z));
  gl_PointSize = clamp(uRes.y * (.006 + .008 * aSeed.z) * (6. / max(-mv.z, 2.)), 1.5, 9.);
  gl_Position = projectionMatrix * mv;
}`;
// spindrift streamers: soft streaks just above the snow, crossing with the wind at 6 m/s (so a held frame lives)
const STREAK_VERT = /* glsl */`${CURL_GLSL} attribute vec3 aPos, aSeed; uniform vec3 uCam; uniform vec2 uWind; uniform float uTime; varying vec2 vQ; varying float vA, vC;
void main(){
  vec3 p = aPos + vec3(uWind.x, 0., uWind.y) * 6. * uTime * (.75 + .5 * aSeed.x);
  p.xz = mod(p.xz - uCam.xz + 40., 80.) - 40. + uCam.xz;
  p.y = .1 + aSeed.y * aSeed.y * .8 + .06 * sin(uTime * 2. + aSeed.z * 20.);
  vec4 mv = viewMatrix * uPage * vec4(curl(p), 1.);
  vec2 w = (viewMatrix * modelMatrix * vec4(uWind.x, 0., uWind.y, 0.)).xy; float wl = length(w); w = wl > 1e-3 ? w / wl : vec2(1., 0.);
  float len = (1.1 + 1.5 * aSeed.z) * max(wl, .3), wid = .5 + .6 * aSeed.x;
  mv.xy += w * position.x * len + vec2(-w.y, w.x) * position.y * wid;
  vQ = position.xy * 2.; vC = aSeed.x * 2. - 1.;
  vA = smoothstep(1.5, 4.5, -mv.z) * (1. - smoothstep(28., 40., -mv.z)) * (.55 + .45 * sin(uTime * 1.3 + aSeed.y * 30.));
  gl_Position = projectionMatrix * mv;
}`;
const STREAK_FRAG = /* glsl */`precision highp float; varying vec2 vQ; varying float vA, vC; uniform vec3 uSunCol, uShade; uniform float uDrift, uStreak;
void main(){ float y = vQ.y * 1.4 - vC * (vQ.x * vQ.x - .35) * 1.3 - .25 * sin(vQ.x * 5. + vC * 9.);      // a wisp curls: no straight threads
  float a = (1. - vQ.x * vQ.x) * max(1. - y * y, 0.) * (1. - vQ.y * vQ.y); a *= a;
  gl_FragColor = vec4(uSunCol * 1.05 + uShade * .5, a * vA * .3 * uDrift * uStreak); }`;
const DUST_FRAG = /* glsl */`precision highp float; varying float vTw; uniform vec3 uSunCol;
void main(){ vec2 c = gl_PointCoord - .5; float r = length(c) * 2.; float star = max(1. - r, 0.) ; star = star * star + .6 * max(1. - 9. * abs(c.x * c.y) - r * .6, 0.);
  gl_FragColor = vec4(uSunCol * 3.5 * star * vTw, 1.); }`;

// the hedge texture: one 96 m by 24 m tile of bare blackthorn, 2048 x 512, wrapping in x. Alpha is cover, red is rime
// (frost on the upper side of every twig). Angular zigzag stems, dense and dark below, lace against the sky above.
async function hedgeTexture(ctx, rng) {
  const W = 2048, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 150; i++) {                              // the dark heart of the thicket
    const x = rng() * W, y = H - rng() * rng() * H * 0.62, rx = 30 + rng() * 50, ry = 16 + rng() * 34;
    for (const dx of [-W, 0, W]) { const gr = g.createRadialGradient(x + dx, y, 0, x + dx, y, rx); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate(0, y); g.scale(1, ry / rx); g.translate(0, -y); g.fillStyle = gr; g.fillRect(x + dx - rx, y - rx, rx * 2, rx * 2); g.restore(); }
    if (i % 25 === 24) await ctx.yield();
  }
  await ctx.yield();
  // blackthorn: stout stems that run STRAIGHT between forks and kink only there, each fork an angular elbow, every twig
  // set with short thorns square to it. Buckets by weight: 0 butt of a stem, 1 its upper run, 2 boughs, 3 twigs, 4 thorns
  const WID = [8.5, 5.4, 3.2, 2.0, 1.3];
  let segs = [[], [], [], [], []];
  const push = (d, x0, y0, x1, y1) => { const s = segs[d]; s.push(x0, y0, x1, y1); if (x0 < 150) s.push(x0 + W, y0, x1 + W, y1); else if (x0 > W - 150) s.push(x0 - W, y0, x1 - W, y1); };
  const grow = (x, y, a, len, d) => {
    const n = d === 0 ? 4 : d === 1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const L = len / n * rng.range(0.7, 1.3), nx = x + Math.sin(a) * L, ny = y - Math.cos(a) * L; push(d === 0 ? (i < 2 ? 0 : 1) : d + 1, x, y, nx, ny);
      if (d >= 1) { const m = 1 + Math.floor(rng() * 2.4); for (let k = 0; k < m; k++) { const f = rng(), tx = lerp(x, nx, f), ty = lerp(y, ny, f), ta = a + (rng() < 0.5 ? 1 : -1) * rng.range(1.25, 1.6), tl = rng.range(5, 12); push(4, tx, ty, tx + Math.sin(ta) * tl, ty - Math.cos(ta) * tl); } }
      const sg = rng() < 0.5 ? 1 : -1;
      if (d < 3 && (i > 0 || d > 0) && rng() < (d === 0 ? 0.97 : 0.86)) grow(nx, ny, a + rng.range(0.65, 1.2) * sg, len * rng.range(0.45, 0.66), d + 1);
      if (d < 2 && rng() < 0.7) grow(nx, ny, a - rng.range(0.5, 1.05) * sg, len * rng.range(0.3, 0.5), d + 1);
      a += rng.range(-0.34, 0.34) * (d === 0 ? 0.7 : 1) - a * (d < 2 ? 0.12 : 0);            // the kink is at the fork, and only there
      x = nx; y = ny;
    }
  };
  const flush = () => {
    for (let d = 0; d < 5; d++) { const s = segs[d]; if (!s.length) continue;
      g.strokeStyle = 'rgba(0,0,0,0.97)'; g.lineWidth = WID[d]; g.beginPath(); for (let i = 0; i < s.length; i += 4) { g.moveTo(s[i], s[i + 1]); g.lineTo(s[i + 2], s[i + 3]); } g.stroke(); }
    for (let d = 0; d < 4; d++) { const s = segs[d]; if (!s.length) continue;                 // rime rides the top of each twig
      g.strokeStyle = d < 2 ? 'rgba(255,0,0,0.55)' : 'rgba(255,0,0,0.9)'; g.lineWidth = Math.max(1, WID[d] * 0.4); const o = WID[d] * 0.3;
      g.beginPath(); for (let i = 0; i < s.length; i += 4) { g.moveTo(s[i], s[i + 1] - o); g.lineTo(s[i + 2], s[i + 3] - o); } g.stroke(); }
    segs = [[], [], [], [], []];
  };
  const NS = 150;
  for (let i = 0; i < NS; i++) {
    const tall = 0.4 + 0.6 * Math.pow(rng(), 0.8);
    grow((i + rng()) / NS * W, H + 4, rng.range(-0.8, 0.8), H * tall * rng.range(0.92, 1.12), 0);
    if (i % 5 === 4) { flush(); await ctx.yield(); }
  }
  flush(); await ctx.yield();
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = THREE.RepeatWrapping; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  return tex;
}
// a bare silver birch on 1024 x 2048 (36 m by 72 m): alpha cover, red = white bark (0 on twigs and bark marks),
// green = where across the stem we are (0 left edge, 1 right edge) so the shader can round it toward the sun
async function birchTexture(ctx, rng) {
  const W = 1024, H = 2048, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  let tw = [[], [], []];
  const TWID = [3.4, 2.2, 1.6];
  const flush = () => { for (let d = 0; d < 3; d++) { const s = tw[d]; if (!s.length) continue; g.strokeStyle = 'rgba(0,128,0,0.95)'; g.lineWidth = TWID[d]; g.beginPath(); for (let i = 0; i < s.length; i += 4) { g.moveTo(s[i], s[i + 1]); g.lineTo(s[i + 2], s[i + 3]); } g.stroke(); } tw = [[], [], []]; };
  // a round white stem from (x0,y0) to (x1,y1), widths w0 to w1: eight nested strokes stepping across it
  const stem = (x0, y0, x1, y1, w0, w1) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L, sgn = px < 0 ? -1 : 1;
    for (let k = 0; k < 6; k++) { const f = 1 - k / 6, o = (k / 6) * 0.5 * sgn; g.strokeStyle = `rgb(${w0 > 5 ? 235 : 150},${Math.round(40 + 215 * k / 5)},0)`;
      g.lineWidth = Math.max(1.2, (w0 + w1) * 0.5 * f); g.beginPath(); g.moveTo(x0 + px * o * w0, y0 + py * o * w0); g.lineTo(x1 + px * o * w1, y1 + py * o * w1); g.stroke(); } };
  // pendulous twigs: they set out along the limb and hang
  const twig = (x, y, a, len, d) => { const n = 5; for (let i = 0; i < n; i++) { a += rng.range(-0.18, 0.18); a += (Math.PI - Math.abs(a)) * 0.13 * Math.sign(a || 1) * (d > 0 ? 1 : 0.55);
      const nx = x + Math.sin(a) * len / n, ny = y - Math.cos(a) * len / n; tw[Math.min(2, d)].push(x, y, nx, ny);
      if (d < 2 && rng() < 0.8) twig(nx, ny, a + rng.range(0.25, 0.7) * (rng() < 0.5 ? 1 : -1), len * rng.range(0.45, 0.75), d + 1); x = nx; y = ny; } };
  const limb = (x, y, a, len, w) => { const n = 7; for (let i = 0; i < n; i++) { a *= 0.86; a += rng.range(-0.1, 0.1); const nx = x + Math.sin(a) * len / n, ny = y - Math.cos(a) * len / n, w1 = w * (1 - (i + 1) / n * 0.8);
      stem(x, y, nx, ny, w * (1 - i / n * 0.8), w1);
      if (i > 1 && rng() < 0.75) twig(nx, ny, (rng() < 0.5 ? 1 : -1) * rng.range(2.5, 2.95), rng.range(150, 300), 1);        // the long strands a birch lets hang
      if (i > 0) { twig(nx, ny, a + rng.range(0.35, 0.9) * (rng() < 0.5 ? 1 : -1), len * rng.range(0.42, 0.75), 0); if (rng() < 0.7) twig(nx, ny, a + rng.range(0.35, 0.9) * Math.sign(a || 1), len * rng.range(0.3, 0.5), 0); }
      x = nx; y = ny; } twig(x, y, a, len * 0.4, 0); };
  let x = 512, y = H + 6, a = rng.range(-0.05, 0.05); const NT = 30, seg = (H - 150) / NT, pts = [];
  for (let i = 0; i < NT; i++) { a += rng.range(-0.035, 0.035) - a * 0.1; const nx = x + Math.sin(a) * seg, ny = y - seg, w = lerp(44, 4, Math.pow(i / (NT - 1), 0.8)); pts.push([x, y, nx, ny, w, lerp(44, 4, Math.pow((i + 1) / (NT - 1), 0.8))]);
    if (i > 3) { const side = (i & 1 ? 1 : -1) * (rng() < 0.85 ? 1 : -1); limb(nx, ny, side * rng.range(0.42, 0.85) * (i < 7 ? 1.5 : 1), lerp(470, 130, (i - 4) / (NT - 5)) * rng.range(0.75, 1.1), w * 0.5); if (i % 3 === 0) flush(); await ctx.yield(); }
    x = nx; y = ny; }
  twig(x, y, 0.1, 150, 0); flush(); await ctx.yield();
  for (const p of pts) stem(p[0], p[1], p[2], p[3], p[4], p[5]);                    // the trunk over its own twigs
  await ctx.yield();
  g.globalCompositeOperation = 'source-atop';                                       // bark: dark lenticels, black fissures near the foot
  for (let i = 0; i < 150; i++) { const k = Math.floor(rng() * rng() * NT * 0.9), p = pts[k], yy = lerp(p[1], p[3], rng()), xx = lerp(p[0], p[2], rng()) + rng.range(-0.5, 0.5) * p[4], l = p[4] * rng.range(0.06, 0.3);
    g.strokeStyle = 'rgba(30,128,0,0.75)'; g.lineWidth = k < 3 ? rng.range(2.5, 6) : rng.range(1.2, 2.6); g.beginPath(); g.moveTo(xx - l, yy); g.lineTo(xx + l, yy + rng.range(-2, 2)); g.stroke(); }
  g.globalCompositeOperation = 'source-over';
  await ctx.yield();
  const tex = new THREE.CanvasTexture(cv); tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4; return tex;
}

// ---- the dead plants that stand through the snow beside the trail, and what the wind does to a thing that stands in snow.
// A stand is a TUSSOCK: a tight clump of many upright stems with seed heads, 0.5 to 1.4 m across at its foot, dark at the
// foot, with a plain outline against the snow. Its marks are stamps like any other (one more instanced draw reading a
// small atlas of its own, in the atlas's format: red depth with 0.25 the snow level, green and blue slope, alpha cover),
// but nothing here is a print: no animal made them.
// Cells 0 and 1: the wind's work round a tussock, forward (+v) downwind: a horseshoe scour hollow round its windward
// side, horns swept back, and a round-backed drift tail to leeward that tapers to nothing. Cell 4: its cast shadow.
const SHADOW_K = 0.55;   // a plant's shadow is drawn 0.55 of its true length (the patch's taller tufts are drawn at 0.4 of theirs: a 0.45 m stem then throws what a 0.6 m tuft throws)
const PLANT_AT = 0.3, PLANT_ASPECT = 2;        // where along the wind stamp the tussock stands; the stamp is twice as long as wide
const FOOT_K = 0.26;                           // the tussock's radius in units of its wind stamp's width: the scour ring (0.31) lies just outside the foot and the stamp's edge (0.5) outside the ring
const lineD = (x, y, x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, t = clamp01(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy || 1)); return Math.hypot(x - x0 - dx * t, y - y0 - dy * t); };
async function bakePlantAtlas(ctx) {
  const C = 24, W = 96, data = new Uint8Array(W * W * 4), D = new Float32Array(C * C);   // soft forms: 24 pixels a cell hold them (the scour ring is 6 pixels wide between its feet), read with a linear filter
  // x: across, in units of the stamp's width (-0.5..0.5); y: downwind of the tussock's middle in the same unit
  const wind = (bendK, tailL, scourK) => (u, v) => {
    const y = (v - PLANT_AT) * PLANT_ASPECT, x = (u - 0.5) - bendK * y * y, rr = Math.hypot(x, y) + 1e-4;
    const rq = (rr - 0.31) / 0.06, ring = Math.exp(-rq * rq) * clamp01(0.55 - 0.75 * y / rr);          // the scour: deepest to windward, horns swept round both sides of the foot
    const wt = FOOT_K * 0.9 * (1 - 0.8 * clamp01(y / tailL)) + 0.012, tent = Math.max(0, 1 - Math.abs(x) / wt);
    const tail = sstep(0, 1, tent) * sstep(FOOT_K * 0.6, FOOT_K * 1.3, y) * (1 - sstep(tailL * 0.55, tailL, y));   // the tail: a round-backed ridge of loose snow that begins in the tussock's lee, as wide as its foot, and tapers
    return 0.6 * scourK * ring - 0.2 * tail;                           // (the back stands a fifth of a depth unit proud; the red channel, whose floor is -1/3, holds it whole)
  };
  // the shadow of a clump: one soft shape as wide as the clump at its foot, narrowing a little and paling to half toward
  // its far end (the sun's disc is half a degree wide), where the tips of the tallest stems fray it
  const shadow = (u, v) => {
    const hw = 0.45 * (1 - 0.4 * sstep(0.3, 1, v)), end = 0.84 + 0.09 * Math.sin(u * 40);
    return 0.9 * sstep(0, 0.4, 1 - Math.abs(u - 0.5) / hw) * (1 - sstep(end - 0.14, end, v)) * sstep(0.02, 0.1, v) * (1 - 0.5 * sstep(0.3, 1, v));
  };
  for (let o = 0; o < data.length; o += 4) { data[o] = 64; data[o + 1] = 128; data[o + 2] = 128; }   // the cells nothing is drawn in lie at the snow's level, flat, with no cover
  const cells = [[0, wind(0.03, 1.3, 1)], [1, wind(-0.04, 1.05, 0.8)], [4, shadow]];
  for (const [cell, f] of cells) {
    const cx = (cell & 3) * C, cy = (cell >> 2) * C;
    for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) D[j * C + i] = f((i + 0.5) / C, (j + 0.5) / C);
    for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
      const im = Math.max(0, i - 1), ip = Math.min(C - 1, i + 1), jm = Math.max(0, j - 1), jp = Math.min(C - 1, j + 1), d = D[j * C + i];
      const du = (D[j * C + ip] - D[j * C + im]) * C / (ip - im), dv = (D[jp * C + i] - D[jm * C + i]) * C / (jp - jm);
      const edge = Math.min(1, Math.min(i, C - 1 - i, j, C - 1 - j) / 2), o = ((cy + j) * W + cx + i) * 4;
      data[o] = Math.round(255 * clamp01(0.25 + 0.75 * d)); data[o + 1] = Math.round(255 * clamp01(0.5 + du / 96)); data[o + 2] = Math.round(255 * clamp01(0.5 + dv / 96));
      data[o + 3] = Math.round(255 * sstep(0.02, 0.3, Math.min(1, Math.abs(d) * 4)) * edge);
    }
  }
  const tex = new THREE.DataTexture(data, W, W, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return tex;
}

// a stem, a blade or a seed head: a ribbon of the model tussock of its kind (the attributes are described where the model
// is grown, in buildPlants), set in its stand by the vertex shader: turned, scaled to the stand's radius and height, leant
// out and downwind and quivering with the square of its height, exactly as the patch's sedge. vN: where in its stand the
// stem is rooted (the unit circle is the foot's rim): the side of the clump that faces the light is lit, the other is in
// the clump's own shade. vR: 1 on the stand's windward rim (rime).
const PLANT_VERT = /* glsl */`${CURL_GLSL} attribute vec4 aRoot, aAx, aT, aCol, iA, iB; uniform float uTime; uniform vec2 uWind; varying float vT, vR; varying vec3 vL, vC, vV; varying vec2 vN;
void main(){ float ca = cos(iB.x), sa = sin(iB.x), h = iA.w, t = aT.x, ph = aT.y + iB.w;
  vec2 n = vec2(aRoot.x * ca - aRoot.y * sa, aRoot.x * sa + aRoot.y * ca), ax = vec2(aAx.x * ca - aAx.y * sa, aAx.x * sa + aAx.y * ca);
  vec2 lo = (vec2(aAx.z * ca - aAx.w * sa, aAx.z * sa + aAx.w * ca) + uWind * aT.z) * h;
  vec3 p = vec3(iA.x + n.x * iA.z + ax.x * aRoot.w, aRoot.z * h, iA.y + n.y * iA.z + ax.y * aRoot.w);
  p += vec3(lo.x, -.2 * length(lo), lo.y) * t * t + vec3(1., 0., .3) * t * t * (h / .65 * aCol.w) * (.05 * sin(uTime * 11. + ph) + .03 * sin(uTime * 4.3 + ph * 1.7) + .04);   // (it quivers in proportion to its height: the patch's tufts stand 0.65 m on average)
  vT = t; vR = smoothstep(.35, .8, -dot(n, uWind)); vC = aCol.rgb * iB.y; vN = n; vL = p; vec3 lb = curl(p); vV = curlView(lb); gl_Position = projectionMatrix * viewMatrix * uPage * vec4(lb, 1.);
  if (aT.w >= iB.z) gl_Position = vec4(2., 2., 2., 1.); }`;                 // the stems beyond this stand's share of the model are not drawn (all four corners in one point outside the picture)
// LIGHT: the light the patch's sedge stands in (strawLight), and never more: the side of the clump turned from the light
// keeps 0.3 of it (the sky's share of that law by day), the foot is dark where the stems stand matted (0.4 at the snow),
// and under the moon dry straw gives up most of its colour (0.65 toward its own grey: moonlight shows tone, little hue):
// a dark plant whose side toward the moon is a cool lit edge. Rime: the windward rim is greyed toward the straw's own grey,
// never over it. AIR: the page's own (airVeil at the foot's place, airHaze): a far stand sinks as the far snow does.
const PLANT_FRAG = /* glsl */`precision highp float; varying float vT, vR; varying vec3 vL, vC, vV; varying vec2 vN;
${SNOW_GLSL}${STRAW_GLSL}
void main(){
  float side = smoothstep(-.2, .6, dot(normalize(vec3(vN.x, .5, vN.y)), uSun));
  float g = dot(vC, vec3(.3, .5, .2));
  vec3 alb = mix(vC, vec3(g), max(.65 * uMoon, .5 * vR));
  float t = clamp(vT, 0., 1.);                                          // (a varying carried past a thin ribbon's edge stays in range)
  vec3 col = max(alb, 0.) * strawLight(t) * mix(.3, 1., side) * mix(.4, 1., smoothstep(0., .55, t));
  float dist = length(vV) + 1e-4;
  col = airVeil(col, wr(vL.xz), vV / dist, 0.);
  gl_FragColor = vec4(max(airHaze(col, vL.xz, dist), 0.), 1.); }`;

// distances on the page, in metres, that everything new keeps: to the trail's line, to the rim of the nearest mark of the
// story (any print, hollow, trough, crater; not cast shadows or far threads, whose casters are marks themselves), and
// to the fox's line (its arriving thread, the stretch where it runs beside the trail, and the 30 m of its leap)
function pageRules(story) {
  const P = story.prints, np = story.count, fx = story.fox || {};
  // points sorted into square cells (10 m) of a grid over their own bounds (typed arrays: each cell heads a chain of its
  // points); a distance is looked up in the nine cells round the place; a thing with no point in them is at least 10 m
  // away, which is further than any rule here asks (the most is 8.2 m)
  const CELL = 10;
  const sorted = (pts) => { const n = pts.length / 3; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (let i = 0; i < n; i++) { const x = Math.floor(pts[i * 3] / CELL), z = Math.floor(pts[i * 3 + 1] / CELL); if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    if (!n) return { n: 0 }; const nx = x1 - x0 + 1, nz = z1 - z0 + 1, head = new Int32Array(nx * nz).fill(-1), next = new Int32Array(n);
    for (let i = 0; i < n; i++) { const c = Math.floor(pts[i * 3] / CELL) - x0 + (Math.floor(pts[i * 3 + 1] / CELL) - z0) * nx; next[i] = head[c]; head[c] = i; }
    return { n, pts, x0, z0, nx, nz, head, next }; };
  const nearest = (m, x, z) => { let best = CELL; if (!m.n) return best; const cx = Math.floor(x / CELL) - m.x0, cz = Math.floor(z / CELL) - m.z0, P3 = m.pts;
    for (let j = cz - 1; j <= cz + 1; j++) { if (j < 0 || j >= m.nz) continue; for (let i = cx - 1; i <= cx + 1; i++) { if (i < 0 || i >= m.nx) continue;
      for (let k = m.head[i + j * m.nx]; k >= 0; k = m.next[k]) { const ex = P3[k * 3] - x, ez = P3[k * 3 + 1] - z, d = Math.sqrt(ex * ex + ez * ez) - P3[k * 3 + 2]; if (d < best) best = d; } } }
    return best; };
  const tr = [], marks = [], foxLine = [];
  for (let q = -20; q <= LEN + 20; q += 1) { const t = story.at(q); tr.push(t[0], t[1], 0); }
  for (let i = 0; i < np; i++) { const o = i * 8; if (P[o + 7] <= 2.5) marks.push(P[o], P[o + 1], 0.5 * Math.max(P[o + 3], P[o + 4])); }   // (cast shadows and far threads are not marks: their casters are; a mark's rim: half its larger side)
  if (fx.lat) for (let q = fx.s0; q <= fx.s1 + 30; q += 1) { const t = story.at(q, fx.lat(Math.min(q, fx.s1)) * story.side); foxLine.push(t[0], t[1], 0); }
  const trG = sorted(new Float32Array(tr)), mkG = sorted(new Float32Array(marks)), fxG = sorted(new Float32Array(foxLine));
  const trailD = (x, z) => nearest(trG, x, z), markD = (x, z) => nearest(mkG, x, z);
  const foxD = (x, z) => Math.min(fx.thread ? lineD(x, z, fx.thread[0], fx.thread[1], fx.thread[2], fx.thread[3]) : CELL, nearest(fxG, x, z));
  return { trailD, markD, foxD };
}
// Where the dead plants stand, dealt from a stream of their own ('whh-plants'). Every rule is in metres of the page.
// THE STRETCH: from 6 m past the end of the first feeding patch (the field is carried 6 m with us there: the patch and its
// three tufts keep their own picture) to 24 m short of the wings (the 20 m the live drifts keep clear of the wings, and
// 4 m for the longest tail and shadow).
// EACH SIDE OF THE TRAIL IS WALKED ON ITS OWN: the first stand 2 to 10 m into the stretch, then one every 8 to 16 m of
// trail (the page under the lens shows some 35 m of trail from 7 m up: two to four stands a side are in the picture,
// and at the run's 22 m/s one passes on each side every half second), 3.6 to 29.6 m off the trail and nearer more often than
// further (3.6 + 26 q squared: half of them within 10 m). A stand whose drawn place is not free takes the nearest free
// ground by a fixed search with no further draw: further out in steps of 1.5 m to 30 m, then nearer, then the same 3 and
// 6 m on and back along the trail. So two stands on one side are never more than 16 + 12 m apart and neither side of
// the trail is bare for 60 m (rule d), whatever the seed deals.
// A stand: a tussock 0.25 to 0.7 m in radius, 0.36 to 0.48 m tall (under the least height the story can deal the patch's
// tufts, 0.5 m: those stay the tall ones), with up to three single plants as outliers 0.5 to 3 m beyond its rim.
// FAR STANDS: on each side one every 30 to 60 m of trail, 30 to 75 m off; phones keep a share of them (detail).
// FREE GROUND: no stem within 2.6 m of the trail's line (a run print is 1.5 m wide and lies up to 0.25 m off the line),
// within 1.6 m of the rim of any mark of the story or within 2 m of the fox's line; the middle and the end of its drift
// tail and of its longest shadow (the look's lowest light) keep 1.4 m, 1.6 m and 2 m from the same three; not in a
// drift; not beside a later feeding patch (the live drifts' own rule: 9 m before to 7 m after it, nearer than 16 m).
// kind 0 sedge, 1 grass heads, 2 dock.
export async function dealPlants(ctx, story, look, wind, drifts, detail, rules) {
  const r = ctx.core.makeRng(ctx.core.hashSeed('whh-plants:' + ctx.seed)), wx = wind[0], wz = wind[1];
  const { trailD, markD, foxD } = rules;
  // a plant stands "in a drift" where the drift's snow lies deeper than 0.05 m (a twentieth of the lowest drift's crest:
  // there the page is still the sheet). The drift's own form, as driftHM in the snow chunk draws it
  const inDrift = (x, z) => { for (const d of drifts) { const W = d[3], rx = (x - d[1]) * wx + (z - d[2]) * wz, y = (-(x - d[1]) * wz + (z - d[2]) * wx) / W; if (Math.abs(y) >= 1 || Math.abs(rx) >= W) continue;
    const ph = d[1] * 0.37 + d[2] * 0.23, env = (1 - y * y) * (1 - y * y), t = (rx - W * (0.16 * Math.sin(y * 3.1 + ph) + 0.07 * Math.sin(y * 7.3 + ph * 2.1) + 0.22 * y * y - 0.1)) / W, q = clamp01(1 - t / 0.46);
    if (d[4] * env * (t < 0 ? sstep(-0.09, 0, t) : q * q) > 0.05) return true; } return false; };
  const tanLow = Math.max(Math.tan(Math.min(look.e0, look.e1) * Math.PI / 180), 0.03), sx = -look.az[0], sz = -look.az[1];   // the longest shadow the look ever throws: its lowest light
  const sA = story.feeds[0][1] + 6, sB = WING_S - 24, out = [];
  // is the ground free for a clump of radius R and height h standing at (x, z)?
  const free = (x, z, R, h) => {
    if (trailD(x, z) < 2.6 + R || markD(x, z) < 1.6 + R || foxD(x, z) < 2 + R || inDrift(x, z)) return false;
    if (inDrift(x + R, z) || inDrift(x - R, z) || inDrift(x, z + R) || inDrift(x, z - R)) return false;
    const tl = R / FOOT_K * PLANT_ASPECT * (1 - PLANT_AT), sl = SHADOW_K * h / tanLow;      // the tail's reach downwind, the shadow's reach away from the light
    for (let k = 0.5; k <= 1; k += 0.5) { let ex = x + wx * tl * k, ez = z + wz * tl * k; if (trailD(ex, ez) < 1.4 + R || markD(ex, ez) < 1.6 || foxD(ex, ez) < 2) return false;
      ex = x + sx * sl * k; ez = z + sz * sl * k; if (trailD(ex, ez) < 1.4 + R || markD(ex, ez) < 1.6 || foxD(ex, ez) < 2) return false; }
    return true;
  };
  const later = (s, off) => { for (let i = 1; i < story.feeds.length; i++) if (s > story.feeds[i][0] - 9 && s < story.feeds[i][1] + 7 && off < 16) return true; return false; };
  const put = (s, side, off, R, h, kind, glyph) => { if (later(s, off)) return null; const c = story.at(s, side * off); if (!free(c[0], c[1], R, h)) return null; const o = { x: c[0], z: c[1], R, h, kind, glyph, s, off: side * off }; out.push(o); return o; };
  for (const side of [1, -1]) {
    for (let s = sA + r.range(2, 10); s < sB; s += r.range(8, 16)) {
      const q = r(), off0 = 3.6 + 26 * q * q, R = r.range(0.25, 0.7), h = r.range(0.36, 0.48), kind = Math.floor(r() * 3), glyph = Math.floor(r() * 2), nOut = Math.floor(r() * 4);
      const outs = []; for (let i = 0; i < 3; i++) outs.push([r.range(0, 6.2832), r.range(0.5, 3), r.range(0.1, 0.18), r.range(0.7, 0.95)]);   // (always drawn, so the stream is read alike whatever is kept)
      let st = null;
      for (const ds of [0, 3, -3, 6, -6]) { if (st || s + ds < sA || s + ds > sB) continue;
        for (let off = off0; off <= 30 && !st; off += 1.5) st = put(s + ds, side, off, R, h, kind, glyph);
        for (let off = off0 - 1.5; off >= 2.6 + R && !st; off -= 1.5) st = put(s + ds, side, off, R, h, kind, glyph); }
      if (!st) continue;
      for (let i = 0; i < nOut; i++) { const o = outs[i], d = st.R + o[1], x = st.x + Math.cos(o[0]) * d, z = st.z + Math.sin(o[0]) * d;       // single plants stand only round a stand
        if (free(x, z, o[2], st.h * o[3])) out.push({ x, z, R: o[2], h: st.h * o[3], kind: st.kind, glyph: st.glyph, s: st.s, off: st.off, single: true }); }
    }
    for (let s = sA + r.range(0, 40); s < sB; s += r.range(30, 60)) {
      const off = r.range(30, 75), R = r.range(0.45, 0.7), h = r.range(0.36, 0.48), kind = Math.floor(r() * 3), glyph = Math.floor(r() * 2), keep = r() < detail;
      if (keep) put(s, side, off, R, h, kind, glyph);
    }
  }
  return out;
}

// The plants themselves (six instanced draws: for each kind one model tussock, drawn for its stands and for its single plants) and their marks on the snow (one
// instanced draw): for each the wind's work round it and its cast shadow. Colours: the look's own straw, with rust and
// seed brown (dry dock, seed heads) brought to the straw's own saturation and brightness at most: no stem is more
// saturated or brighter than the patch's sedge. Stems of a stand: 55 at a radius of 0.25 m to 205 at 0.7 m
// (55 + 150 (R / 0.7) squared: 110 to 135 a square metre of foot, close enough that no snow shows through); a dock clump
// has 0.55 of that (each stem carries three whorls of seed); a single plant 0.3 of it.
// BUILT ONCE, INSTANCED: a model tussock of each kind is grown stem by stem in a unit foot from the stream
// 'whh-plantform'; a stand is the first n stems of its model (they are rooted at random, so any first n fill the foot
// evenly), turned by an angle of its own, set to its radius and height and toned 0.85 to 1.06 by the vertex shader.
async function buildPlants(ctx, group, U, mat, story, look, wind, drifts, detail, rules) {
  const list = await dealPlants(ctx, story, look, wind, drifts, detail, rules), r = ctx.core.makeRng(ctx.core.hashSeed('whh-plantform:' + ctx.seed));
  await ctx.yield();
  const wx = wind[0], wz = wind[1], NMAX = 205;
  // the three dry colours as linear numbers; rust and seed brown brought inside the straw's saturation and brightness
  const S = new THREE.Color(look.straw), sMax = Math.max(S.r, S.g, S.b), sSat = 1 - Math.min(S.r, S.g, S.b) / sMax;
  const inside = (hex) => { const c = new THREE.Color(hex), m = Math.max(c.r, c.g, c.b), sat = 1 - Math.min(c.r, c.g, c.b) / m, k = Math.min(1, sSat / Math.max(sat, 1e-3)), v = Math.min(1, sMax / m); return [(m - (m - c.r) * k) * v, (m - (m - c.g) * k) * v, (m - (m - c.b) * k) * v]; };
  const straw = [S.r, S.g, S.b], rust = inside('#A35A28'), brown = inside('#8E6236');
  const material = mat(PLANT_VERT, PLANT_FRAG, {}, { side: THREE.DoubleSide }), meshes = [];
  for (let kind = 0; kind < 3; kind++) {
    // THE MODEL. aRoot: a ribbon's root in the unit foot (x, y), this corner's height in units of the plant's height (z)
    // and its signed half width in metres (w). aAx: the direction of its width (x, y) and its outward lean in units of
    // the height (z, w). aT: how far up its plant this corner is (x), its phase (y), its lean downwind (z), which stem
    // it belongs to (w: the stand draws the stems below its own share). aCol: colour, and how freely this kind quivers.
    const ns = kind === 2 ? Math.round(NMAX * 0.55) : NMAX, mq = ns * (kind === 2 ? 4 : 2);
    const V = new Float32Array(mq * 64), idx = new Uint16Array(mq * 6), end = new Uint16Array(ns + 1); let nq = 0;     // sixteen numbers a corner: aRoot, aAx, aT, aCol
    // sedge: blades 10 cm wide at the snow (half width 0.05; the patch's are 8 cm) that lean out from the middle, one in seven with a dark spikelet; grass: thin
    // stems bent downwind, two in three with a seed head; dock: stiff rust stems (they quiver 0.6 as freely), each with three whorls of seed
    const w0 = kind === 0 ? 0.05 : kind === 1 ? 0.03 : 0.04, w1 = kind === 0 ? 0.016 : 0.02, out = kind === 0 ? 0.4 : kind === 1 ? 0.25 : 0.12, down = kind === 1 ? 0.3 : 0.1, headP = kind === 0 ? 0.15 : 0.66, free = kind === 2 ? 0.6 : 1;
    const A = kind === 2 ? rust : straw, B = kind === 0 ? rust : brown;
    // (one corner is written and copied to the other three, which differ from it in three numbers: height, side, how far up)
    const rib = (ux, uz, y0, up, ax, az, a0, a1, lox, loz, dn, t0, t1, ph, st, c0, c1, ct, k) => { const o = nq * 64;
      V[o] = ux; V[o + 1] = uz; V[o + 2] = y0; V[o + 3] = -a0; V[o + 4] = ax; V[o + 5] = az; V[o + 6] = lox; V[o + 7] = loz; V[o + 8] = t0; V[o + 9] = ph; V[o + 10] = dn; V[o + 11] = st;
      V[o + 12] = (c0[0] + (c1[0] - c0[0]) * ct) * k; V[o + 13] = (c0[1] + (c1[1] - c0[1]) * ct) * k; V[o + 14] = (c0[2] + (c1[2] - c0[2]) * ct) * k; V[o + 15] = free;
      V.copyWithin(o + 16, o, o + 16); V.copyWithin(o + 32, o, o + 32);
      V[o + 19] = a0; V[o + 34] = y0 + up; V[o + 35] = -a1; V[o + 40] = t1; V[o + 50] = y0 + up; V[o + 51] = a1; V[o + 56] = t1;
      const v0 = nq * 4, i = nq * 6; idx[i] = v0; idx[i + 1] = v0 + 1; idx[i + 2] = v0 + 2; idx[i + 3] = v0 + 1; idx[i + 4] = v0 + 3; idx[i + 5] = v0 + 2; nq++; };
    for (let i = 0; i < ns; i++) {
      const a = r.range(0, 6.2832), q = Math.sqrt(r()), ux = Math.cos(a) * q, uz = Math.sin(a) * q, bh = (1 - 0.4 * q * q) * r.range(0.7, 1), la = r.range(0, 6.2832), ph = r.range(0, 6.28), tone = r.range(0.5, 0.8), hue = r(), hd = r();
      const lo = (0.08 + out * q) * bh, lox = Math.cos(a) * lo, loz = Math.sin(a) * lo, ax = Math.cos(la), az = Math.sin(la), dn = down * bh, st = (i + 0.5) / ns;
      rib(ux, uz, 0, bh, ax, az, w0, w1, lox, loz, dn, 0, 1, ph, st, A, B, kind === 2 ? hue * 0.5 : 0.2 + 0.5 * hue, tone);
      if (kind === 2) for (let j = 0; j < 3; j++) { const t = 0.5 + 0.18 * j; rib(ux, uz, bh * t, bh * 0.12, ax, az, 0.09 - 0.015 * j, 0.075 - 0.015 * j, lox, loz, dn, t, t + 0.12, ph, st, rust, brown, hd, tone * 0.9); }
      else if (hd < headP) rib(ux, uz, bh * 0.8, bh * 0.2, ax, az, kind === 0 ? 0.03 : 0.05, kind === 0 ? 0.03 : 0.04, lox, loz, dn, 0.8, 1, ph, st, brown, rust, hue, tone * 0.8);
      end[i + 1] = nq;                                                    // how many ribbons the first i + 1 stems are
    }
    // THE STANDS of this kind, and its SINGLE PLANTS in a draw of their own that sends only the model's first stems (as
    // many as the largest single plant has: the formula above at its largest radius, 0.18 m). iA: where it stands (x, z),
    // its radius and its height. iB: its turn, its tone, its share of the model's stems, and the phase of its quiver
    // (from its place: no two stands nod together)
    const stemsOf = (R, single) => Math.min(ns, Math.max(6, Math.round((55 + 150 * (R / 0.7) * (R / 0.7)) * (kind === 2 ? 0.55 : 1) * (single ? 0.3 : 1))));
    const ib = new THREE.InterleavedBuffer(V.subarray(0, nq * 64), 16), rAttr = new THREE.InterleavedBufferAttribute(ib, 4, 0), xAttr = new THREE.InterleavedBufferAttribute(ib, 4, 4), tAttr = new THREE.InterleavedBufferAttribute(ib, 4, 8), cAttr = new THREE.InterleavedBufferAttribute(ib, 4, 12);
    const pAttr = new THREE.InterleavedBufferAttribute(ib, 3, 0), iAttr = new THREE.BufferAttribute(idx.subarray(0, nq * 6), 1);     // (three asks for a position: it reads aRoot's first three numbers; the corners are placed by the vertex shader)
    for (const single of [false, true]) {
      let ni = 0; for (const pl of list) if (pl.kind === kind && !!pl.single === single) ni++;
      const iA = new Float32Array(Math.max(ni, 1) * 4), iB = new Float32Array(Math.max(ni, 1) * 4); let k = 0;
      iA[0] = 1e5; iA[1] = 1e5; iA[2] = 1; iA[3] = 0.4;                  // (a deal with none of them: one far off with no stem)
      for (const pl of list) if (pl.kind === kind && !!pl.single === single) { const o = k++ * 4;
        iA[o] = pl.x; iA[o + 1] = pl.z; iA[o + 2] = pl.R; iA[o + 3] = pl.h; iB[o] = r.range(0, 6.2832); iB[o + 1] = r.range(0.85, 1.06); iB[o + 2] = stemsOf(pl.R, single) / ns; iB[o + 3] = pl.x * 1.7 + pl.z * 2.3; }
      const geo = new THREE.InstancedBufferGeometry(); geo.instanceCount = Math.max(ni, 1);
      geo.setAttribute('position', pAttr); geo.setAttribute('aRoot', rAttr); geo.setAttribute('aAx', xAttr); geo.setAttribute('aT', tAttr); geo.setAttribute('aCol', cAttr);
      geo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); geo.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); geo.setIndex(iAttr);
      if (single) geo.setDrawRange(0, end[stemsOf(0.18, true)] * 6);
      const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; group.add(mesh); meshes.push(mesh);
    }
  }
  // (build() hands back after the deal and after the models and the atlas together: pieces of a few milliseconds, none inside them)
  // the wind's work round each (age 0.25: wind-softened) and its shadow (age 3: the vertex shader lays it down-sun, h / tan(elev) long)
  const stamps = new Float32Array(Math.max(1, list.length) * 16), rot = Math.atan2(-wx, -wz);       // a stamp's forward is downwind
  if (!list.length) stamps.set([1e5, 1e5, 0, 1, 1, 0, 0, 0, 1e5, 1e5, 0, 1, 1, 0, 0, 0]);
  for (let k = 0; k < list.length; k++) { const pl = list[k], w = pl.R / FOOT_K, l = w * PLANT_ASPECT, o = l * (0.5 - PLANT_AT), s = k * 16;
    stamps[s] = pl.x + wx * o; stamps[s + 1] = pl.z + wz * o; stamps[s + 2] = rot; stamps[s + 3] = w; stamps[s + 4] = l; stamps[s + 5] = 0.3 * pl.h / 0.4; stamps[s + 6] = pl.glyph; stamps[s + 7] = 0.25;
    stamps[s + 8] = pl.x; stamps[s + 9] = pl.z; stamps[s + 11] = Math.max(2.3 * pl.R, 0.3); stamps[s + 12] = pl.h * SHADOW_K; stamps[s + 14] = 4; stamps[s + 15] = 3; }
  const tex = await bakePlantAtlas(ctx);
  const marks = stampMesh(U, tex, stamps, stamps.length / 8, false);
  marks.material.uniforms.uPlant.value = 1; marks.renderOrder = 1.9; group.add(marks);     // under the story's own marks
  return { list, meshes, marks };
}


// ---- the page. story from makeStory; look = colours. Returns the group (matrixAutoUpdate false: the world pitches it),
// the shared uniforms, and update(time, camLocal, camWorld, renderer).
export async function buildField(ctx, story, look, opts = {}) {
  const detail = opts.detail ?? ctx.quality?.detail ?? 1, rng = ctx.rng.fork('field');
  const U = makeUniforms(look), group = new THREE.Group(); group.matrixAutoUpdate = false;
  const uEye = { value: new THREE.Vector3() };
  // the turn of the far page (see CURL_GLSL): shared by every material, driven from u by the world through setCurl
  U.uEye = uEye; U.uPage = { value: group.matrix }; U.uCurl = { value: new THREE.Vector4(0, 0, 0, -1) }; U.uCurlK = { value: new THREE.Vector3(1e4, 11, 0) };
  const mat = (vertexShader, fragmentShader, extra = {}, opts = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, uEye, ...extra }, vertexShader, fragmentShader, ...opts });

  // snow disc: flat, all relief in the shader
  // rows across the trail's heading: close together where the page can turn (the first seventy metres ahead), wide beyond
  const rows = [-900, -400, -150, -40, -8]; for (let a = 0; a < 70; a += 0.7) rows.push(a); for (let a = 70; a < 1500; a *= 1.22) rows.push(a);
  const dv = new Float32Array(rows.length * 9), di = [];
  rows.forEach((a, r) => { for (let c = 0; c < 3; c++) { dv[(r * 3 + c) * 3] = (c - 1) * 1500; dv[(r * 3 + c) * 3 + 2] = a; }
    if (r) for (let c = 0; c < 2; c++) { const p = (r - 1) * 3 + c, q = r * 3 + c; di.push(p, p + 1, q, p + 1, q + 1, q); } });
  const discGeo = new THREE.BufferGeometry(); discGeo.setAttribute('position', new THREE.BufferAttribute(dv, 3)); discGeo.setIndex(di);
  const disc = new THREE.Mesh(discGeo, mat(DISC_VERT, DISC_FRAG, {}, { side: THREE.DoubleSide })); disc.frustumCulled = false; group.add(disc);
  await ctx.yield();

  // prints: one instanced draw reading the atlas
  const atlas = await bakeAtlas(ctx);
  const stamps = stampMesh(U, atlas, story.prints, story.count, false); stamps.renderOrder = 2; group.add(stamps);
  await ctx.yield();

  // the wing print
  const wingTex = await bakeWing(ctx);
  U.uCalm.value.set(story.wing.x, story.wing.z, 10);
  const wl = new Float32Array([story.wing.x, story.wing.z, story.wing.rot, 9.6, 2.4, look.wingDepth ?? 0.26, 0, 0]);
  const wing = stampMesh(U, wingTex, wl, 1, true); wing.renderOrder = story.wing.mode ? 1.5 : 3; group.add(wing);   // smeared: the crater and the feathers lie over it
  wing.material.uniforms.uWing.value.set(story.wing.mode ? 1 : 0, story.wing.mode ? 1 : 0, story.side > 0 ? 0 : 1, 0);
  await ctx.yield();

  // clods thrown from the crater: sixty lumps in one draw (their shadows are stamps)
  if (story.clods.length) {
    const ico = new THREE.IcosahedronGeometry(1, 0), ip = ico.attributes.position, n = story.clods.length, pos = new Float32Array(n * ip.count * 3), nor = new Float32Array(n * ip.count * 3);
    for (let i = 0; i < n; i++) { const c = story.clods[i], ca = Math.cos(c[3]), sa = Math.sin(c[3]);
      for (let j = 0; j < ip.count; j++) { const k = 1 + 0.42 * Math.sin((ip.getX(j) * 3.1 + ip.getY(j) * 5.3 + ip.getZ(j) * 7.7) * 2.9 + i * 7.1), x = ip.getX(j) * c[2] * 0.42 * k, y = ip.getY(j) * c[2] * 0.3 * k, z = ip.getZ(j) * c[2] * 0.36 * k, o = (i * ip.count + j) * 3;
        pos[o] = c[0] + x * ca - z * sa; pos[o + 1] = c[2] * 0.2 + y; pos[o + 2] = c[1] + x * sa + z * ca; nor[o] = x * ca - z * sa; nor[o + 1] = y * 1.6; nor[o + 2] = x * sa + z * ca; } }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); cg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    const clods = new THREE.Mesh(cg, mat(CLOD_VERT, CLOD_FRAG)); clods.frustumCulled = false; group.add(clods);
  }

  // dead sedge at the feeding patch: the reason the bird stopped. Forty blades a tuft, quivering.
  { const nb = story.sedge.length * 40, pos = new Float32Array(nb * 12), lean = new Float32Array(nb * 12), aT = new Float32Array(nb * 8), idx = [];
    let b = 0;
    for (const t of story.sedge) for (let i = 0; i < 40; i++, b++) {
      const a = rng.range(0, 6.2832), rr = rng.range(0, 0.22), bx = t[0] + Math.cos(a) * rr, bz = t[1] + Math.sin(a) * rr, h = t[2] * rng.range(0.55, 1.1), la = rng.range(0, 6.2832), lm = rng.range(0.1, 0.45) * h, ph = rng.range(0, 6.28), w = 0.04;
      const px = Math.cos(la + 1.57) * w, pz = Math.sin(la + 1.57) * w;
      const v = [[bx - px, 0, bz - pz, 0], [bx + px, 0, bz + pz, 0], [bx - px * 0.3, h, bz - pz * 0.3, 1], [bx + px * 0.3, h, bz + pz * 0.3, 1]];
      for (let k = 0; k < 4; k++) { const o = (b * 4 + k) * 3; pos[o] = v[k][0]; pos[o + 1] = v[k][1]; pos[o + 2] = v[k][2]; lean[o] = Math.cos(la) * lm; lean[o + 1] = -lm * 0.2; lean[o + 2] = Math.sin(la) * lm; aT[(b * 4 + k) * 2] = v[k][3]; aT[(b * 4 + k) * 2 + 1] = ph; }
      idx.push(b * 4, b * 4 + 1, b * 4 + 2, b * 4 + 1, b * 4 + 3, b * 4 + 2);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('aLean', new THREE.BufferAttribute(lean, 3)); sg.setAttribute('aT', new THREE.BufferAttribute(aT, 2)); sg.setIndex(idx);
    const sedge = new THREE.Mesh(sg, mat(SEDGE_VERT, SEDGE_FRAG, { uStraw: { value: new THREE.Color(look.straw) } }, { side: THREE.DoubleSide })); sedge.frustumCulled = false; group.add(sedge); }
  await ctx.yield();

  // hedge and two bare birches at the far side: the destination
  const hg = new THREE.Group(); hg.position.set(story.hedge.x, 0, story.hedge.z); hg.rotation.y = story.hedge.rot; group.add(hg);
  const htex = await hedgeTexture(ctx, rng.fork('hedge'));
  const hedge = new THREE.Mesh(new THREE.PlaneGeometry(520, 26).translate(0, 13, 0), mat(PLAIN_VERT, HEDGE_FRAG, { uTex: { value: htex }, uOpt: { value: new THREE.Vector4(1, 0, 1, 0) }, uFrame: { value: new THREE.Vector4(Math.cos(story.hedge.rot), Math.sin(story.hedge.rot), 0, 0) }, uLocal: { value: new THREE.Matrix4() } }, { side: THREE.DoubleSide, transparent: true, depthWrite: false })); hedge.frustumCulled = false; hedge.renderOrder = 3.5; hg.add(hedge);
  hg.updateMatrix(); hedge.material.uniforms.uLocal.value.copy(hg.matrix);
  if (story.hedge2) { const h2 = new THREE.Mesh(hedge.geometry, mat(PLAIN_VERT, HEDGE_FRAG, { uTex: { value: htex }, uOpt: { value: new THREE.Vector4(0, 311, 0, 0) }, uFrame: { value: new THREE.Vector4(Math.cos(story.hedge2.rot), Math.sin(story.hedge2.rot), 0, 0) }, uLocal: { value: new THREE.Matrix4() } }, { side: THREE.DoubleSide, transparent: true, depthWrite: false }));
    h2.position.set(story.hedge2.x, 0, story.hedge2.z); h2.rotation.y = story.hedge2.rot; h2.scale.x = 1.7; h2.frustumCulled = false; h2.renderOrder = 3.4; group.add(h2); h2.updateMatrix(); h2.material.uniforms.uLocal.value.copy(h2.matrix); }
  await ctx.yield();
  const btex = await birchTexture(ctx, rng.fork('birch')); await ctx.yield();
  story.patches.forEach((pt, i) => { if (i < 2) U.uPatch.value[i].set(pt[0], pt[1], pt[3], pt[2]); });
  U.uBirch.value = btex; U.uHedge.value.set(story.hedge.x, story.hedge.z, Math.cos(story.hedge.rot), Math.sin(story.hedge.rot));
  for (const sgn of [-1, 1]) { const bmat = mat(PLAIN_VERT, BIRCH_FRAG, { uTex: { value: btex }, uFlip: { value: sgn }, uLocal: { value: new THREE.Matrix4() } }, { side: THREE.DoubleSide, transparent: true, depthWrite: false });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(36 * sgn, 72).translate(0, 36, 0), bmat); b.position.set(sgn * 14, 0, 0.8); b.scale.y = sgn > 0 ? 0.92 : 1; b.renderOrder = 4; b.frustumCulled = false; hg.add(b); b.updateMatrix(); bmat.uniforms.uLocal.value.multiplyMatrices(hg.matrix, b.matrix); }
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(18, 26).translate(0, 13, 0), mat(CURTAIN_VERT, CURTAIN_FRAG, { uLocal: { value: new THREE.Matrix4() } }, { side: THREE.DoubleSide }));
  curtain.position.set(0, 0, -0.25); curtain.frustumCulled = false; hg.add(curtain); hg.updateMatrix(); curtain.updateMatrix();
  curtain.material.uniforms.uLocal.value.multiplyMatrices(hg.matrix, curtain.matrix);
  await ctx.yield();

  // dome (in the group: the sky pitches with the page) and diamond dust
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1800, 24, 12), mat(DOME_VERT, DOME_FRAG, {}, { side: THREE.BackSide, depthWrite: false })); dome.renderOrder = -1; dome.frustumCulled = false; group.add(dome);
  await ctx.yield();
  const nd = Math.round(2500 * detail), dp = new Float32Array(nd * 3), ds = new Float32Array(nd * 3);
  for (let i = 0; i < nd; i++) { dp[i * 3] = rng() * 80; dp[i * 3 + 1] = rng() * 16; dp[i * 3 + 2] = rng() * 80; ds[i * 3] = rng(); ds[i * 3 + 1] = rng(); ds[i * 3 + 2] = rng(); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 3));
  const dust = new THREE.Points(dg, mat(DUST_VERT, DUST_FRAG, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); dust.frustumCulled = false; dust.renderOrder = 6; group.add(dust);

  await ctx.yield();
  { const ns = Math.round(520 * detail), q = new THREE.PlaneGeometry(1, 1), sg = new THREE.InstancedBufferGeometry(), ap = new Float32Array(ns * 3), as = new Float32Array(ns * 3);
    for (let i = 0; i < ns; i++) { ap[i * 3] = rng() * 80; ap[i * 3 + 1] = 0; ap[i * 3 + 2] = rng() * 80; as[i * 3] = rng(); as[i * 3 + 1] = rng(); as[i * 3 + 2] = rng(); }
    sg.index = q.index; sg.setAttribute('position', q.attributes.position); sg.setAttribute('aPos', new THREE.InstancedBufferAttribute(ap, 3)); sg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(as, 3)); sg.instanceCount = ns;
    const streaks = new THREE.Mesh(sg, mat(STREAK_VERT, STREAK_FRAG, {}, { transparent: true, depthWrite: false })); streaks.frustumCulled = false; streaks.renderOrder = 5; group.add(streaks); }

  await ctx.yield();
  // the drifts, laid by the wind before the story and placed by the seed: beside the trail (never on it), clear of the
  // roost, the feeding patches and the wings, on the side the hunter did not use. [s, x, z, half width, height]
  const drifts = [];
  if (opts.wind) U.uWind.value.set(opts.wind[0], opts.wind[1]);
  { const dr = rng.fork('drift'), v = story.variant, wx = U.uWind.value.x, wz = U.uWind.value.y, tr = [];
    for (let q = -30; q <= LEN + 30; q += 3) tr.push(story.at(q));
    const clear = (x, z) => { let m = 1e9; for (const t of tr) { const d = (t[0] - x) * (t[0] - x) + (t[1] - z) * (t[1] - z); if (d < m) m = d; } return Math.sqrt(m); };
    let s = 22 + dr.range(0, 8), sd = dr.chance(0.5) ? 1 : -1;
    while (s < LEN - 24 && drifts.length < 18) {
      let placed = false;
      for (let tries = 0; tries < 5 && !placed; tries++) {
        const W = dr.range(10, 19), H = dr.range(1.0, 1.5) * Math.sqrt(W / 14), off = dr.range(7, 26);
        const side = v === 0 ? -story.side : v === 1 && s > 138 ? story.side : sd, p = story.at(s, side * off);
        let ok = !(s > WING_S - 20 && s < WING_S + 22) && !(v === 1 && s > 138 && s < 268);
        for (const fd of story.feeds) if (s > fd[0] - 9 && s < fd[1] + 7 && off < 16) ok = false;
        // the ridge lies across the wind: its crest line from end to end (and its back, downwind) must stand clear of the trail
        for (let y = -1; y <= 1.01 && ok; y += 0.2) { const e = (1 - y * y) * (1 - y * y), need = 3.2 + 5 * e;
          if (clear(p[0] - wz * W * y, p[1] + wx * W * y) < need || clear(p[0] - wz * W * y + wx * W * 0.3, p[1] + wx * W * y + wz * W * 0.3) < need) ok = false; }
        if (ok) { drifts.push([s, p[0], p[1], W, H]); placed = true; sd = -sd; }
      }
      s += placed ? dr.range(11, 18) : 6;
    }
    drifts.sort((a, b) => a[0] - b[0]);
    if (v !== 2) drifts.length = 0; }       // where the story is told in two lines the field carries nothing but the story: no drift, no drift shadow
  await ctx.yield();
  // BY DAY the live deal keeps no drift. A few of the moon deal's own kind (the same lengths and heights) now stand in the
  // long middle, dealt from a stream of their own: one every 16 to 26 m of trail (half as close as under the moon), from 6 m
  // past the first patch to 24 m short of the wings (the plants' own stretch), 12 to 30 m off on the DOWN-SUN side of the
  // trail, so that its long shadow falls away from the line; no point of its crest, its back or its shadow (6 and 12 m out)
  // lies within the live rule's distance of the trail (3.2 to 8.2 m), or within 3 m of any mark or of the fox's line.
  const rules = pageRules(story);                                     // the distances everything new keeps, looked up once
  if (story.variant !== 2) { const dr = ctx.core.makeRng(ctx.core.hashSeed('whh-daydrifts:' + ctx.seed)), { trailD, markD, foxD } = rules, wx = U.uWind.value.x, wz = U.uWind.value.y, ax = look.az[0], az = look.az[1];
    for (let s = story.feeds[0][1] + 6 + dr.range(0, 10); s < WING_S - 24; s += dr.range(16, 26)) {
      const W = dr.range(10, 19), H = dr.range(1.0, 1.5) * Math.sqrt(W / 14), off = dr.range(12, 30), th = story.at(s)[2], sd = ax * -Math.cos(th) + az * Math.sin(th) > 0 ? -1 : 1, p = story.at(s, sd * off);
      let ok = true;
      for (let y = -1; y <= 1.01 && ok; y += 0.2) { const e = (1 - y * y) * (1 - y * y), need = 3.2 + 5 * e, cx = p[0] - wz * W * y, cz = p[1] + wx * W * y;
        for (const q of [[cx, cz, need], [cx + wx * W * 0.3, cz + wz * W * 0.3, need], [cx - ax * 6, cz - az * 6, 3], [cx - ax * 12, cz - az * 12, 3]]) if (trailD(q[0], q[1]) < q[2] || markD(q[0], q[1]) < 3 || foxD(q[0], q[1]) < 3) ok = false; }
      if (ok) drifts.push([s, p[0], p[1], W, H]);
    }
    await ctx.yield(); }
  // the dead plants of the place, from the patch to the wings (a stream of their own; the story, the field and the drifts are dealt before them, as they were)
  const plants = await buildPlants(ctx, group, U, mat, story, look, [U.uWind.value.x, U.uWind.value.y], drifts, detail, rules);
  await ctx.yield();
  // the corridors the swells keep clear of (see snowShade): the fox's arriving thread, and, for every 2 m of trail, how the
  // trail bends away over the next 40 m and where the fox's line runs beside it (a chord from 6 m behind to 36 m ahead)
  const fx = story.fox || {}, NC = Math.ceil(LEN / 2) + 2, cq = new Float32Array(NC), cf = new Float32Array(NC * 4);
  if (fx.thread) { U.uFoxA.value.set(fx.thread[0], fx.thread[1], fx.thread[2], fx.thread[3]); U.uFoxK.value.x = 1; }
  if (fx.lat) U.uFoxK.value.y = 1;
  for (let i = 0; i < NC; i++) { const s = i * 2, p0 = story.at(s), p1 = story.at(s + 40), tx = -Math.sin(p0[2]), tz = -Math.cos(p0[2]), qx = p1[0] - p0[0], qz = p1[1] - p0[1], al = qx * tx + qz * tz;
    cq[i] = (qx * tz - qz * tx) / Math.max(al * al, 100);
    if (fx.lat) { const sa = Math.min(fx.s1, Math.max(fx.s0, s - 6)), sb = Math.min(fx.s1, Math.max(fx.s0, s + 36)), a = story.at(sa, fx.lat(sa) * story.side), b = story.at(sb, fx.lat(sb) * story.side); cf[i * 4] = a[0]; cf[i * 4 + 1] = a[1]; cf[i * 4 + 2] = b[0]; cf[i * 4 + 3] = b[1]; } }
  const size = new THREE.Vector2(), domeAxis = new THREE.Vector3(); let base = null;
  return {
    group, U, stamps, wing, dome, drifts, plants,
    // the six drifts from just behind the lens onward (sCam: metres along the trail); the rest stand out of sight
    setDrifts(sCam) { let k = 0; for (let i = 0; i < drifts.length && k < 6; i++) { const d = drifts[i]; if (d[0] > sCam - 22) U.uDr.value[k++].set(d[1], d[2], d[3], d[4]); }
      for (; k < 6; k++) U.uDr.value[k].set(1e5, 1e5, 8, 0); },
    // sCam: metres along the trail under the lens. Uniforms only.
    setCorridor(sCam) { const f = Math.min(NC - 1.001, Math.max(0, sCam / 2)), i = Math.floor(f), k = f - i, o = i * 4; U.uSeamQ.value = lerp(cq[i], cq[i + 1], k);
      if (fx.lat) U.uFoxB.value.set(lerp(cf[o], cf[o + 4], k), lerp(cf[o + 1], cf[o + 5], k), lerp(cf[o + 2], cf[o + 6], k), lerp(cf[o + 3], cf[o + 7], k)); },
    // elev in radians, az: unit (x, z) pointing TOWARD the sun in the group's space
    setSun(elev, ax, az) { const c = Math.cos(elev); U.uSun.value.set(ax * c, Math.sin(elev), az * c); U.uSunH.value.set(ax, az); U.uSinE.value = Math.sin(elev); U.uTanE.value = Math.tan(elev); },
    // first light, k 0..1 (the world keys it to u): the sky fill, the deep shade, the haze and the zenith go from the
    // look's night colours toward its dawn colours, the dawn band comes up, the stars thin. Uniforms only.
    setDawn(k, dawn) {
      if (!base) base = { shade: U.uShade.value.clone(), deep: U.uShadeDeep.value.clone(), haze: U.uHaze.value.clone(), top: U.uSkyTop.value.clone(), sun: U.uSunCol.value.clone(), night: U.uNight.value };
      U.uShade.value.copy(base.shade).lerp(dawn.shade, k); U.uShadeDeep.value.copy(base.deep).lerp(dawn.deep, k);
      U.uHaze.value.copy(base.haze).lerp(dawn.haze, k); U.uSkyTop.value.copy(base.top).lerp(dawn.top, k); U.uSunCol.value.copy(base.sun).lerp(dawn.sun, k);
      U.uDawn.value.copy(dawn.col).multiplyScalar(k); U.uDawnH.value.set(dawn.dir[0], dawn.dir[1]);
      U.uGap.value.copy(dawn.gap0).lerp(dawn.gap1, k); U.uNight.value = base.night * (1 - 0.6 * k);
    },
    // the far page: o = the point of the page under the lens (x, z), t = the trail's heading there, from = metres ahead
    // where the turn begins, radius, angle (radians). The sky turns with the far field (axis: square to the heading).
    setCurl(ox, oz, tx, tz, from, radius, angle) { U.uCurl.value.set(ox, oz, tx, tz); U.uSeam.value.set(ox, oz, tx, tz); U.uCurlK.value.set(from, radius, angle); dome.quaternion.setFromAxisAngle(domeAxis.set(-tz, 0, tx), -angle); },
    update(time, camLocal, camWorld, renderer) {
      U.uTime.value = time; U.uCam.value.copy(camLocal); uEye.value.copy(camWorld); dome.position.copy(camLocal);
      renderer.getDrawingBufferSize(size); U.uRes.value.copy(size);
    },
  };
}
