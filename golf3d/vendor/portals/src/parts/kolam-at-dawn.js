// Kolam at Dawn: hero set piece, "the falling line".
//
// A thread of rice flour falls from 60 m overhead and draws a kolam on a wet doorstep built 200 times
// life size. One number drives everything: LAND, the arc length (metres) of line laid so far.
//
// WHAT IS IN IT (6 draw calls and 74k triangles; 8 and 87k in the festival look; build about 300 ms on the
// shared test machine; no lights; 2 data textures; update() only writes uniforms)
//   flour    the 13 dot mounds and the ridge (a 2,400 ring ribbon over the knot K), one mesh. The vertex
//            shader raises the ridge only where s < LAND, tapers the last 6 m, slumps it at sparrow bites.
//            Either side of the ridge lies a thin apron of loose grains with a crumbled, ragged outer edge.
//   rope     the heavy grains in the air: a view-facing ribbon from the burst up and forward along the
//            line still to be drawn, to the pouring point 60 m up, where it dissolves.
//   veil     the fine dust: a streaked, see-through curtain over the newest 200 m of ridge.
//   grains   instanced sprites: falling grains, the rolling collar of the burst, skittering grains,
//            and gold motes that hang over the knot when the sun arrives.
//   ground   (opts.ground, default true) a plate of wet granite, a dark slate that leans warm (or damp earth),
//            that mirrors the sky (grey-blue overhead, the rose and the wide peach band to the east, deep blue toward
//            the house), the veil, the rope and the ridge, the falling line as one pale streak that runs from its foot
//            toward the eye (uFoot), and the house's lime-washed step as pale and ochre upright bands (uStep, uLime,
//            uOchre; uStep.w 0 = no house, the default) and the lamps (uLamps: long wavering warm streaks). It carries the
//            kaavi, hand-painted bands of
//            red ochre in a square round the knot with a row of flour dots, and thin streaks of dawn mist that
//            light up when the sun reaches them; takes the contact shade and the sun shadows from a 512 square
//            distance texture of the knot. Shadows are cast only by line already laid.
//   glint    the gold bangle glint high in the haze (setGlint / setProgress u 0.19-0.215), above the pouring point
//            or where setGlintAt puts it; its narrow streak in the film lies under it as the eye sees it (uGlintAt).
//   festival (look 1) coloured powder floods the cells, marigolds on the rim dots, a pumpkin flower.
//
// LOOKS (opts.look, default: ctx.vary.hour day -> 1, golden -> 2, dawn/night -> 0, any -> by seed)
//   0 'loop'      white single-loop knot on blue wet granite
//   1 'festival'  the same knot, cells flooded with rose, turmeric and leaf-green powder, flowers
//   2 'yard'      dark umber-olive damp earth swept in arcs, a lotus of eight petal strokes 190 m across
//   opts.rare (default ctx.vary.rare): a gust (toward -x) bends the veil and the rope up to 30 m downwind; the turn
//   round one rim dot, by choice on the west, house side, is left open and its flour lies fanned out in streaks
//   over the ground beside the gap (uGust, uGap). uVeilK (1..2) brightens the veil for the first view.
//   Every seed turns back different crossings, starts the line elsewhere and runs it the other way.
//
// PROGRESS (nothing runs on wall-clock time except ambient shimmer)
//   hero.setProgress(u)   the brief's timing from the world's u: LAND = L * (frac + (1 - frac) u / 0.74),
//                         frac (hero.frac, about 0.22) chosen so a closed line ends house side; sunrise
//                         edge sweeping +x to -x over u 0.66-0.80, glint at 0.20, festival fills.
//   hero.setLand(metres)  set LAND directly (after setProgress) to keep the burst exactly 30 m ahead of
//                         the camera; hero.landAt(u) gives the default. hero.setSun(k, edgeX), setGlint(k),
//                         hero.setBite(i, s, r) (12 slots: sparrow pecks, r metres of ridge removed).
//   hero.pointAt(s, out)  -> Vector3 on the line (y 0); hero.L its length; hero.landing(out) the burst.
//   If setProgress is never called (the set-piece viewer) the piece plays itself on a 40 s loop.
//
// ANCHORS (local space; +x along the street toward the sun, +z the street, -z the house)
//   entry        (-30, 8, 185) heading -z: the rope and veil stand on this axis at u 0
//   portalSeat   { position (0, 34, -270), facing (0, 0, 1) }: the door slot, 14 m ring
//   flyThrough   ordered [x,y,z] points of the whole route: entry, the chase cut from K (y 8, smoothed),
//                the teardrop climb, the straight descent, the low pass, the exit. Clear of the hero by 6 m.
//   chase        the chase part alone; dots [13 x Vector3]; center; gap (rare: the open loop) or null.
//                The chase points follow THIS seed's knot, so join them to the fixed climb points yourself.
//                (The world src/worlds/kolam-at-dawn.js plans its own route from pointAt / landAt: a pursuit of the landing point.)
//   viewpoints   lookDown (-60,104,235), lowPass (8,9,-75), under (the rope passes over the route here)
//
// OPTS  palette (7 hex strings, the brief's by default), look, rare, ground (false: bring your own and
//       read hero.uniforms + hero.distTex), detail (default ctx.quality.detail, thins grains only).
//
// LIGHT  none of three's lights are used: every shader has its own sky light (uSkyTop / uSkyLow / uHouse)
//        and the sunrise (uSun 0..1, uSunEdgeX, direction (0.99, 0.06, 0.12)) in hero.uniforms, and applies
//        scene fog (FogExp2 or linear). Wants a dark house to -z, a pale street to +z, blue haze.
//        The sun's edge on the ground is a soft band 26 m wide, slightly aslant (x + 0.14 z = uSunEdgeX).
//        uShadowLen (ridge, dot) is the length of the sun shadows in metres (14.5, 14: lit ground is left between
//        neighbouring loops; at the brief's 48 m they merge into one field and the knot is no longer drawn twice).
//        Sunrise on the ground multiplies what is there: lit ground is the same stone or earth lifted and a little
//        warmed, a shadow is a darker, slightly cooler tone of it; the sunward flank of every ridge and mound
//        turns peach-gold and throws a little of that back on the ground beside it; gold sparks follow uGold.
//        uLamps (11 x vec4: position, brightness) and uLampCol belong to whoever places lamps (default: none lit);
//        lampLight(P, n) in GLSL_COMMON is their light. uKaavi, uRose: the ochre of the bands,
//        the rose of the sky. uStep = (z of the riser, its height, band width, strength), uFoot = (x, z of the burst,
//        strength) drive the two mirror images in the wet ground; after sunrise the lit step and door stand in it warm.
//        The flour is kept under 0.8 before sunrise; nothing but the glint (4.5) and gold motes (2.6) blooms.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const SP = 40, RAD = SP * 0.35355339, NPT = 2400;
const EDIR = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const DEF_PALETTE = ['#1B2942', '#3E5C8A', '#A9B9D6', '#F4F2EA', '#E7B48B', '#D8A23F', '#C3352D'];

// ---------------------------------------------------------------------------------------------------
// K: the knot. Mirror curve of the 13-dot diamond; crossings are turned back until it is one loop.
function traceKnot(rng) {
  const dots = [], id = new Map();
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) <= 2) { id.set(i + ',' + j, dots.length); dots.push([i, j]); }
  const nb = (d, e) => { const v = id.get((dots[d][0] + EDIR[e][0]) + ',' + (dots[d][1] + EDIR[e][1])); return v === undefined ? -1 : v; };
  const wall = dots.map((_, d) => [0, 1, 2, 3].map((e) => nb(d, e) < 0));
  const next = (st) => {
    const [d, q, cw] = st;
    if (!cw) { const e = (q + 1) & 3; if (wall[d][e]) return [d, e, false, true]; const e2 = (e + 2) & 3; return [nb(d, e), (e2 + 3) & 3, true, false]; }
    const e = q; if (wall[d][e]) return [d, (q + 3) & 3, true, true]; return [nb(d, e), (e + 2) & 3, false, false];
  };
  const trace = () => {
    const seen = new Int16Array(dots.length * 4).fill(-1), loops = [];
    for (let k = 0; k < seen.length; k++) {
      if (seen[k] >= 0) continue;
      const loop = []; let st = [k >> 2, k & 3, false, false];
      for (let guard = 0; guard < 400; guard++) {
        if (seen[st[0] * 4 + st[1]] >= 0) break;
        seen[st[0] * 4 + st[1]] = loops.length; loop.push(st); st = next(st);
      }
      loops.push(loop);
    }
    return { seen, loops };
  };
  let tr = trace(), turned = 0;
  for (let guard = 0; guard < 24 && tr.loops.length > 1; guard++) {
    const cand = [];
    for (let d = 0; d < dots.length; d++) for (let e = 0; e < 2; e++) {
      if (wall[d][e]) continue;
      if (tr.seen[d * 4 + ((e + 3) & 3)] !== tr.seen[d * 4 + e]) cand.push([d, e]);
    }
    if (!cand.length) break;
    const [d, e] = cand[Math.floor(rng() * cand.length) % cand.length];
    wall[d][e] = true; wall[nb(d, e)][(e + 2) & 3] = true; turned++;
    tr = trace();
  }
  // the longest loop is the line (there is only one when the merge succeeded)
  let loop = tr.loops[0]; for (const l of tr.loops) if (l.length > loop.length) loop = l;
  const pts = [], T = (d, q) => { const a = Math.PI * 0.25 + q * Math.PI * 0.5; return [dots[d][0] * SP + Math.cos(a) * RAD, dots[d][1] * SP + Math.sin(a) * RAD, a]; };
  for (let k = 0; k < loop.length; k++) {
    const st = loop[k], nx = next(st), a = T(st[0], st[1]);
    if (nx[3]) { // turn round the dot: a quarter arc
      const cx = dots[st[0]][0] * SP, cz = dots[st[0]][1] * SP, sgn = st[2] ? -1 : 1;
      for (let m = 0; m < 22; m++) { const ang = a[2] + sgn * (m / 22) * Math.PI * 0.5; pts.push([cx + Math.cos(ang) * RAD, cz + Math.sin(ang) * RAD]); }
    } else { const b = T(nx[0], nx[1]); for (let m = 0; m < 28; m++) pts.push([lerp(a[0], b[0], m / 28), lerp(a[1], b[1], m / 28)]); }
  }
  return { dots: dots.map((d) => [d[0] * SP, d[1] * SP]), strokes: [{ pts, closed: true }], turned, loops: tr.loops.length };
}

// The yard look: a lotus. Eight petal strokes pulled out from the ring round the centre dot and back, four
// long ones over the dots on the axes and four shorter ones over the diagonal dots; the rope lifts between
// them. The street-side petals come first, the last one lies toward the house.
function traceLotus(rng) {
  const dots = [];
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) <= 2) dots.push([i * SP, j * SP]);
  const petal = (k, flip) => {            // k * 45 degrees from +x; out along one edge, back along the other
    const long = (k & 1) === 0, tip = long ? 93 : 79, PHI = (long ? 21.5 : 16.5) * Math.PI / 180, ang = k * Math.PI / 4, N = 22, pts = [];
    const edge = (t, sgn) => { const r = lerp(9, tip, t), phi = PHI * (1 - Math.pow(t, 2.2)) * sgn; return [Math.cos(ang + phi) * r, Math.sin(ang + phi) * r]; };
    for (let i = 0; i <= N; i++) pts.push(edge(i / N, flip ? -1 : 1));
    for (let i = N - 1; i >= 0; i--) pts.push(edge(i / N, flip ? 1 : -1));
    return { pts, closed: false };
  };
  // NW is laid when we arrive, N is being laid (back along its west edge); the line then runs straight on through
  // the centre and out to the house-side tip, back, and out to the north-east
  const fixed = [petal(3, rng() < 0.5), petal(2, true), petal(6, true), petal(1, false)];
  const rest = [0, 4, 5, 7];
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)) % (i + 1); const t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
  const li = rest.findIndex((k) => k === 5 || k === 7); rest.push(rest.splice(li, 1)[0]);     // a house-side petal closes the drawing
  const strokes = fixed.concat(rest.map((k) => petal(k, rng() < 0.5)));
  const len = (st) => { let l = 0; for (let i = 1; i < st.pts.length; i++) l += Math.hypot(st.pts[i][0] - st.pts[i - 1][0], st.pts[i][1] - st.pts[i - 1][1]); return l; };
  const total = strokes.reduce((a, st) => a + len(st), 0);
  return { dots, strokes, turned: 0, loops: 1, frac: (len(strokes[0]) + len(strokes[1]) * 0.66) / total };
}

// Resample the strokes to NPT points with s = i * ds, so every shader can find K(s) by index.
function buildCurve(shape, rng, noise, look, rare) {
  let frac = shape.frac || 0.22;
  const strokes = shape.strokes.map((st) => {
    let p = st.pts.slice();
    if (st.closed) {
      const coin = rng() < 0.5, n = p.length;
      // The landing point stands by the street-side tip when we arrive, with 17 to 29 percent of the line laid.
      // Of the two ways round and that range, take the start (which is also where the line closes) that lies
      // nearest the house, so that the last of the veil hangs between the look-down and the dark door.
      let pick = null;
      for (const rev of [coin, !coin]) {
        const q = rev ? p.slice().reverse() : p;
        let best = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.hypot(q[i][0] + 20, q[i][1] - 66); if (d < bd) { bd = d; best = i; } }
        for (let f = 0.17; f < 0.295; f += 0.02) {
          const start = ((best - Math.round(n * f)) % n + n) % n, cost = q[start][1] + 0.35 * Math.abs(q[start][0]) + 60 * Math.abs(f - 0.22);
          if (!pick || cost < pick.cost - 1e-6) pick = { cost, q, start, f };
        }
      }
      frac = pick.f; p = pick.q.map((_, i) => pick.q[(pick.start + i) % n]); p.push(p[0]);
    }
    const cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    return { p, cum, len: cum[cum.length - 1], closed: st.closed };
  });
  const closed = strokes.length === 1 && strokes[0].closed;
  const total = strokes.reduce((a, s) => a + s.len, 0);
  const ds = closed ? total / NPT : total / (NPT - strokes.length);
  const X = new Float32Array(NPT), Z = new Float32Array(NPT), W = new Float32Array(NPT), ID = new Float32Array(NPT);
  let k = 0;
  strokes.forEach((st, si) => {
    let n = closed ? NPT : Math.round(st.len / ds) + 1;
    if (!closed && si === strokes.length - 1) n = NPT - k;
    n = Math.min(n, NPT - k);
    let j = 0;
    for (let i = 0; i < n; i++) {
      const d = closed ? (i / n) * st.len : (i / Math.max(1, n - 1)) * st.len;
      while (j < st.cum.length - 2 && st.cum[j + 1] < d) j++;
      const f = clamp((d - st.cum[j]) / Math.max(1e-6, st.cum[j + 1] - st.cum[j]), 0, 1);
      let x = lerp(st.p[j][0], st.p[j + 1][0], f), z = lerp(st.p[j][1], st.p[j + 1][1], f);
      const wob = closed ? 0.9 : 0.5; // the hand is not a compass
      x += noise.n2(x * 0.021 + 7.3, z * 0.021) * wob; z += noise.n2(x * 0.021, z * 0.021 - 4.1) * wob;
      X[k] = x; Z[k] = z; ID[k] = si;
      W[k] = closed ? 1 : smoothstep(0, 5, Math.min(i, n - 1 - i));
      k++;
    }
  });
  const L = closed ? NPT * ds : (NPT - 1) * ds;
  let gap = null;
  if (rare) {
    // The loop the gust leaves open: the turn round a rim dot that the line reaches at about u 0.17, by choice one on
    // the downwind, house side of the knot, so that its spilled flour fans out over open stone below the look-down.
    const nom = frac * L + 205; let mid = nom, bc = 1e9;
    for (const d of shape.dots) {
      if (Math.abs(Math.abs(d[0]) + Math.abs(d[1]) - 2 * SP) > 1) continue;
      let i0 = -1, run = 0;
      for (let i = 1; i <= NPT; i++) {
        const inside = i < NPT && Math.hypot(X[i] - d[0], Z[i] - d[1]) < RAD + 2.2;
        if (inside) { if (!run) i0 = i; run++; continue; }
        if (run * ds > 50) {
          const sm = (i0 + run * 0.5) * ds, cost = Math.abs(sm - nom) / 60 + (d[0] > 1 ? 2 : 0) + (d[1] > 1 ? 1.5 : 0) + (sm < frac * L + 150 || sm > frac * L + 330 ? 50 : 0);
          if (cost < bc) { bc = cost; mid = sm; }
        }
        run = 0;
      }
    }
    const g0 = Math.round((mid - 25) / ds), g1 = Math.round((mid + 25) / ds);
    for (let i = g0 - 6; i <= g1 + 6; i++) { const ii = clamp(i, 0, NPT - 1); W[ii] = Math.min(W[ii], 1 - smoothstep(0, 6, Math.min(i - (g0 - 6), g1 + 6 - i))); }
    // the two loose ends: the hand stopped and started again, and left a small heap at each
    for (let j = 1; j <= 12; j++) { const b = 0.75 * Math.exp(-(((j - 4) / 3.2) ** 2)); for (const i of [g0 - 6 - j, g1 + 6 + j]) { const ii = clamp(i, 0, NPT - 1); W[ii] *= 1 + b; } }
    gap = { s0: g0 * ds, s1: g1 * ds };
  }
  return { X, Z, W, ID, ds, L, closed, gap, dots: shape.dots, look, frac };
}

// K as a nearest-lookup float texture (x, z, width, stroke id) and the 512 square distance texture:
// R distance to the line or a dot (m), G its s (-1 for a dot), B distance toward the sun (+x) to the first
// ridge or dot, A that caster's s. Rasterised in slices.
const TEX_N = 512, TEX_HALF = 128, D_CAP = 10;
async function makeTextures(K, ctx) {
  const kd = new Float32Array(NPT * 4);
  // (the stroke id carries a fraction, 0 at a stroke's two ends rising to 0.45 some 36 m in: the veil fades there)
  const endK = new Float32Array(NPT).fill(1);
  if (!K.closed) { let a = 0; for (let i = 1; i <= NPT; i++) if (i === NPT || K.ID[i] !== K.ID[a]) { for (let j = a; j < i; j++) endK[j] = smoothstep(0, 36, Math.min(j - a, i - 1 - j) * K.ds); a = i; } }
  for (let i = 0; i < NPT; i++) { kd[i * 4] = K.X[i]; kd[i * 4 + 1] = K.Z[i]; kd[i * 4 + 2] = K.W[i]; kd[i * 4 + 3] = K.ID[i] + 0.45 * endK[i]; }
  const kTex = new THREE.DataTexture(kd, NPT, 1, THREE.RGBAFormat, THREE.FloatType);
  kTex.minFilter = kTex.magFilter = THREE.NearestFilter; kTex.generateMipmaps = false; kTex.needsUpdate = true;
  const N = TEX_N, tx = (2 * TEX_HALF) / N, dist = new Float32Array(N * N).fill(D_CAP), sAt = new Float32Array(N * N).fill(-2);
  const stamp = (x, z, s, r0, reach) => {
    const cx = (x + TEX_HALF) / tx, cz = (z + TEX_HALF) / tx, R = Math.ceil(reach / tx);
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(N - 1, Math.ceil(cx + R)), z0 = Math.max(0, Math.floor(cz - R)), z1 = Math.min(N - 1, Math.ceil(cz + R));
    for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) {
      const d = Math.max(0, Math.hypot((ix + 0.5 - cx) * tx, (iz + 0.5 - cz) * tx) - r0), o = iz * N + ix;
      if (d < dist[o]) { dist[o] = d; sAt[o] = s; }
    }
  };
  for (let i = 0; i < NPT; i += 3) {
    if (K.W[i] > 0.5) stamp(K.X[i], K.Z[i], i * K.ds, 0, D_CAP);
    if (i % 150 === 0) await ctx.yield();
  }
  for (const d of K.dots) stamp(d[0], d[1], -1, 2.2, D_CAP);
  await ctx.yield();
  const half = new Uint16Array(N * N * 4), toH = THREE.DataUtils.toHalfFloat;
  for (let iz = 0; iz < N; iz++) {
    let lastX = -1, lastS = -2;
    for (let ix = N - 1; ix >= 0; ix--) {
      const o = iz * N + ix;
      if (dist[o] < 0.9) { lastX = ix; lastS = sAt[o]; }
      const o4 = o * 4;
      half[o4] = toH(dist[o]); half[o4 + 1] = toH(sAt[o]);
      half[o4 + 2] = toH(lastX < 0 ? 120 : Math.min(120, (lastX - ix) * tx)); half[o4 + 3] = toH(lastS);
    }
    if ((iz & 63) === 0) await ctx.yield();
  }
  const dTex = new THREE.DataTexture(half, N, N, THREE.RGBAFormat, THREE.HalfFloatType);
  dTex.minFilter = dTex.magFilter = THREE.LinearFilter; dTex.wrapS = dTex.wrapT = THREE.ClampToEdgeWrapping; dTex.generateMipmaps = false; dTex.needsUpdate = true;
  return { kTex, dTex };
}

// ---------------------------------------------------------------------------------------------------
// Shared GLSL: hashes, the sky light, the sunrise edge, K(s) lookups.
export const GLSL_COMMON = /* glsl */`
uniform float uTime, uLand, uHead, uL, uDs, uSun, uSunEdgeX, uClosed;
uniform vec3 uSunDir, uSunCol, uSkyTop, uSkyLow, uHouse, uFlour, uPeach;
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
float sunAt(vec3 wp){ float e = wp.x + .14 * wp.z - uSunEdgeX; return uSun * smoothstep(-13., 13., e); }
// light from the dawn sky on a surface with normal n: blue-violet from above, pale from the street (+z),
// near dark from the house (-z) and from below
vec3 skyLight(vec3 n){
  float up = clamp(n.y * .5 + .5, 0., 1.), st = clamp(n.z * .5 + .5, 0., 1.);
  vec3 side = mix(uHouse * 1.6, uSkyLow * .9, st);
  return mix(side * .55, uSkyLow * (1.12 + .2 * st) + uSkyTop * .6, up * up);
}
// the oil lamps on the step (xyz, w = how bright this instant): warm light that falls off within a few lamp widths
uniform vec3 uLampCol; uniform vec4 uLamps[11];
vec3 lampLight(vec3 P, vec3 n){
  float a = 0.;
  for (int i = 0; i < 11; i++) { vec3 d = uLamps[i].xyz - P; float r2 = dot(d, d) + 1e-3; a += uLamps[i].w * (.3 + .7 * max(dot(n, d) * inversesqrt(r2), 0.)) / (1. + r2 * .012); }
  return uLampCol * a;
}
`;
const GLSL_K = /* glsl */`
uniform sampler2D uKTex;
// K(s): xz position, z = width scale, w = stroke id. Manual lerp between nearest lookups.
vec4 Kat(float s){
  float f = s / uDs, i0 = floor(f), t = f - i0;
  float n = ${NPT}.;
  float a = mix(clamp(i0, 0., n - 1.), mod(i0, n), uClosed), b = mix(clamp(i0 + 1., 0., n - 1.), mod(i0 + 1., n), uClosed);
  vec4 A = texelFetch(uKTex, ivec2(int(a), 0), 0), B = texelFetch(uKTex, ivec2(int(b), 0), 0);
  if (abs(A.w - B.w) > .5) return A;
  return mix(A, B, t);
}
`;
const FOG_V = '\n#include <fog_vertex>\n', FOG_F = '\n#include <fog_fragment>\n';

function fogU() { return THREE.UniformsUtils.clone(THREE.UniformsLib.fog); }

// ---------------------------------------------------------------------------------------------------
// The flour: ridge ribbon over K plus the 13 dot mounds, one mesh.
async function makeFlour(K, U, ctx, noise) {
  // columns across the ridge: [apron 1, apron .45, core 1, .75, .5, .25, 0, ...mirrored]. The apron is a thin spill
  // of loose flour whose outline wanders; the fragment shader crumbles it into clumps and stray grains.
  const COLS = [[-1, 1, 1], [-1, 1, 0.45], [-1, 1, 0], [-1, 0.75, 0], [-1, 0.5, 0], [-1, 0.25, 0], [1, 0, 0], [1, 0.25, 0], [1, 0.5, 0], [1, 0.75, 0], [1, 1, 0], [1, 1, 0.45], [1, 1, 1]];
  const M = COLS.length - 1, rings = K.closed ? NPT + 1 : NPT, nv = rings * (M + 1);
  const dotSeg = 28, dotRing = 10, nDotV = K.dots.length * (dotSeg * dotRing + 1);
  const pos = new Float32Array((nv + nDotV) * 3), aS = new Float32Array(nv + nDotV), aC = new Float32Array((nv + nDotV) * 3), aT = new Float32Array(nv + nDotV);
  const idx = [];
  for (let r = 0; r < rings; r++) {
    const i = r % NPT, ip = K.closed ? (i + 1) % NPT : Math.min(i + 1, NPT - 1), im = K.closed ? (i + NPT - 1) % NPT : Math.max(i - 1, 0);
    let tx = K.X[ip] - K.X[im], tz = K.Z[ip] - K.Z[im];
    if (K.ID[ip] !== K.ID[i]) { tx = K.X[i] - K.X[im]; tz = K.Z[i] - K.Z[im]; } else if (K.ID[im] !== K.ID[i]) { tx = K.X[ip] - K.X[i]; tz = K.Z[ip] - K.Z[i]; }
    const tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl, s = r * K.ds, sw = (i * K.ds);
    // crumble: width, height and a sideways wander that change along the line (periodic in i)
    const hw = (1.4 + 0.3 * noise.n2(sw * 0.11, 3.7) + 0.16 * noise.n2(sw * 0.33, 9.1) + 0.1 * noise.n2(sw * 0.9, 1.3)) * K.W[i];
    const hh = (1.6 + 0.28 * noise.n2(sw * 0.07, 21.3) + 0.14 * noise.n2(sw * 0.3, 5.5) + 0.1 * noise.n2(sw * 0.85, 8.8)) * K.W[i];
    const lean = 0.35 * noise.n2(sw * 0.05, 40.2);
    for (let m = 0; m <= M; m++) {
      const sd = COLS[m][0], tc = COLS[m][1], ta = COLS[m][2], t = sd * tc, o = (r * (M + 1) + m) * 3;
      const edge = 1 + 0.2 * noise.n2(sw * 0.3 + 13.1, t * 1.3) + 0.1 * noise.n2(sw * 1.1 + 3.1, sd * 4.7);
      const c = Math.cos(tc * Math.PI * 0.5), yc = 0.17 + (hh - 0.17) * Math.pow(Math.max(c, 0), 0.72) * (1 + 0.07 * noise.n2(sw * 0.42, t * 1.5 + 11) + 0.05 * noise.n2(sw * 1.3, t * 4.1 + 2));
      const spill = (0.9 + 1.7 * Math.max(0, 0.25 + noise.n2(sw * 0.16, sd * 9.3)) + 0.9 * Math.max(0, noise.n2(sw * 0.75, sd * 3.7))) * K.W[i];
      const off = t * hw * edge * (1 + 0.25 * (1 - c)) + lean * c + sd * ta * spill;
      pos[o] = K.X[i] + nx * off; pos[o + 1] = ta > 0.99 ? -0.1 : (ta > 0 ? 0.11 : yc) * Math.min(1, K.W[i] * 3) - (K.W[i] < 0.02 ? 0.3 : 0); pos[o + 2] = K.Z[i] + nz * off;
      aS[r * (M + 1) + m] = s; aT[r * (M + 1) + m] = ta; aC[o] = K.X[i]; aC[o + 1] = -0.4; aC[o + 2] = K.Z[i];
    }
    if (r < rings - 1 && K.ID[i] === K.ID[(r + 1) % NPT]) for (let m = 0; m < M; m++) { const a = r * (M + 1) + m, b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }   // no bridge where the rope lifts
    if ((r & 255) === 0) await ctx.yield();
  }
  let v = nv;
  K.dots.forEach((d, di) => {
    const base = v, ph = di * 2.39;
    pos[v * 3] = d[0]; pos[v * 3 + 1] = 2.4 + 0.2 * Math.sin(ph * 3.1); pos[v * 3 + 2] = d[1]; aS[v] = -1000; aC[v * 3] = d[0]; aC[v * 3 + 1] = 0; aC[v * 3 + 2] = d[1]; v++;
    for (let r = 1; r <= dotRing; r++) for (let k = 0; k < dotSeg; k++) {
      const rho = r / dotRing, ang = (k / dotSeg) * Math.PI * 2;
      const lump = 1 + 0.16 * noise.n2(Math.cos(ang) * 1.6 + ph, Math.sin(ang) * 1.6 + rho * 2.2) + 0.05 * noise.n2(Math.cos(ang) * 3.3 + ph, Math.sin(ang) * 3.3 + rho * 3);
      const rr = 2.55 * rho * (r === dotRing ? 1.12 : 1) * lump;
      const y = r === dotRing ? -0.12 : (2.4 + 0.2 * Math.sin(ph * 3.1)) * Math.pow(Math.cos(rho * Math.PI * 0.5), 0.8) * (0.92 + 0.12 * lump) + 0.25 * Math.exp(-rho * rho * 60);
      pos[v * 3] = d[0] + Math.cos(ang) * rr; pos[v * 3 + 1] = y; pos[v * 3 + 2] = d[1] + Math.sin(ang) * rr;
      aS[v] = -1000; aC[v * 3] = d[0]; aC[v * 3 + 1] = 0; aC[v * 3 + 2] = d[1]; v++;
    }
    for (let k = 0; k < dotSeg; k++) idx.push(base, base + 1 + ((k + 1) % dotSeg), base + 1 + k);
    for (let r = 0; r < dotRing - 1; r++) for (let k = 0; k < dotSeg; k++) {
      const a = base + 1 + r * dotSeg + k, b = base + 1 + r * dotSeg + ((k + 1) % dotSeg), c = a + dotSeg, e = b + dotSeg;
      idx.push(a, b, c, b, e, c);
    }
  });
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  geo.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
  geo.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
  geo.setIndex(idx); geo.computeVertexNormals();
  await ctx.yield();
  const mat = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      uniform vec2 uBites[12];
      attribute float aS, aT; attribute vec3 aC;
      varying vec3 vW, vN; varying float vFresh, vH, vT;
      void main(){
        float g = aS < -1. ? 1. : smoothstep(0., 6., uLand - aS);
        float fresh = aS < -1. ? 0. : (1. - smoothstep(0., 40., uLand - aS)) * g;
        float bite = 0.;
        for (int i = 0; i < 12; i++) { float r = max(uBites[i].y, .01); bite = max(bite, (1. - smoothstep(r * .45, r, abs(aS - uBites[i].x))) * step(.02, uBites[i].y)); }
        g *= 1. - .93 * bite;
        vec3 p = mix(aC, position, g);
        p.y = mix(aC.y, position.y * (1. + .12 * fresh), g);     // fresh flour stands a little prouder, then settles
        vec3 n = normalize(mix(vec3(0., 1., 0.), normal, clamp(g * 1.4, 0., 1.)));
        vec4 wp = modelMatrix * vec4(p, 1.);
        vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vFresh = fresh; vH = p.y; vT = aT * step(.5, g) + (1. - step(.5, g)) * 2.;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      uniform vec3 uGoldCol;
      varying vec3 vW, vN; varying float vFresh, vH, vT;
      void main(){
        float dist = length(cameraPosition - vW), near = 1. - smoothstep(35., 170., dist);
        vec2 q = vW.xz + vW.y * .7; float close = 1. - smoothstep(12., 60., dist), midd = 1. - smoothstep(30., 260., dist);
        // the apron crumbles: clumps near the ridge, single grains further out (far away it is a soft pale fringe)
        if (vT > 1.5) discard;
        float crumb = vnoise(q * 1.3) * mix(.5, .34, close) + vnoise(q * 3.7) * .3 + vnoise(q * 9.) * (.2 * (close + .4) + .14 * close);
        if (vT > .02 && crumb < mix(.34, .8, vT) + .12 * (1. - midd) + close * (.05 + .3 * vT)) discard;      // from close by the fringe is grains, not shapes
        float g1 = vnoise(q * 5.5), g2 = vnoise(q * 5.5 + 31.7), h1 = vnoise(q * 16.), h2 = vnoise(q * 16. + 11.3), g3 = vnoise(q * 1.1);
        float c1 = vnoise(q * 1.9 + 7.), c2 = vnoise(q * 1.9 + 23.);                         // clumps: loose flour is lumpy at half a metre
        vec3 n = normalize(vN + (vec3(c1, .5, c2) - .5) * .55 * midd + (vec3(g1, .5, g2) - .5) * .6 * near + (vec3(h1, .5, h2) - .5) * .7 * close + vec3(0., 1e-3, 0.));
        vec2 sq = q * 11.; float spark = step(.955, hash21(floor(sq) + 5.1)) * (1. - smoothstep(.12, .3, length(fract(sq) - .5))) * close;
        vec3 light = skyLight(n); light = mix(light, vec3(dot(light, vec3(.3, .5, .2))), .45) * 1.12;      // flour is white: it takes the sky's brightness more than its blue
        // sunrise: the flank that faces the sun glows peach-gold, the crest stays white, the far flank goes blue-grey
        vec3 sh = normalize(vec3(uSunDir.x, 0., uSunDir.z));
        float sun = sunAt(vW), face = dot(normalize(vN), sh) * .75 + dot(n, sh) * .25, nl = smoothstep(-.22, .22, face), lee = smoothstep(.06, .42, -face);
        vec3 gold = mix(uSunCol, uPeach, .45) * 1.5 + uGoldCol * .2;
        light = mix(light, light * vec3(1.14, 1., .8), sun * .7);                                         // the whole ridge warms a little
        light = mix(light, light * vec3(.42, .54, .84), sun * lee * .92);
        light = mix(light, gold * (.78 + .22 * nl) + light * .14, sun * nl);
        float ao = .56 + .44 * smoothstep(-.1, 1.1, vH);
        float pit = smoothstep(.3, .62, c1 * .6 + g1 * .4);                                  // shaded hollows between the clumps
        vec3 col = uFlour * light * ao * (.84 + .1 * g1 * near + .1 * h1 * close + .08 * g3) * (1. - .2 * (1. - pit) * midd);
        col += uFlour * spark * (.14 + sun * uSunCol * 1.2 * nl);                               // single bright grains
        col += uFlour * vFresh * .07;
        gl_FragColor = vec4(col, 1.);
        ${FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'kolam-flour';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------
// The rope (heavy grains, 25 m/s) and the veil (fine dust, 8 m/s), both hung from K in the vertex shader.
// The pouring point is at s = uHead, 60 m up; what was poured at s is tau = (uHead - s) / 30 seconds old.
function makeRopeAndVeil(U) {
  const grid = (nx, ny) => {
    const g = new THREE.PlaneGeometry(1, 1, nx, ny); g.translate(0.5, 0.5, 0); return g; // position.xy in 0..1
  };
  const common = { fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide };
  const rope = new THREE.Mesh(grid(140, 2), new THREE.ShaderMaterial({
    ...common, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      ${GLSL_K}
      uniform float uGust, uRope; uniform vec3 uGustDir;
      varying vec3 vW; varying vec2 vQ; varying float vMask;
      vec3 ropeAt(float a){
        float s = uHead - 72. + a * 72.; vec4 k = Kat(s);
        vec3 p = vec3(k.x, 60. * a, k.y);
        p.xz += vec2(sin(a * 9. + uTime * 2.1), cos(a * 7. - uTime * 1.7)) * .9 * a;   // the hand trembles
        p += uGustDir * uGust * (20. * pow(max(1. - a, 0.), .8) + 3. * sin(a * 11. - uTime * 5.) * (1. - a));   // a gust carries the falling grains downwind
        return p;
      }
      void main(){
        float a = position.x, c = position.y * 2. - 1.;
        float s = uHead - 72. + a * 72.; vec4 k = Kat(s);
        vec3 p = ropeAt(a), t = ropeAt(a + .01) - ropeAt(a - .01);
        vec4 wp = modelMatrix * vec4(p, 1.);
        vec3 tw = mat3(modelMatrix) * t, toCam = cameraPosition - wp.xyz;
        vec3 side = cross(tw, toCam); side = side / max(length(side), 1e-4);
        float halfW = mix(1.7, .9, a) * (1. + .25 * sin(a * 31. - uTime * 9.)) * uRope;
        halfW = max(halfW, length(toCam) * .0016 * step(.01, uRope));
        wp.xyz += side * c * halfW;
        vMask = step(0., s) * step(s, uL) * max(step(.5, k.z), uClosed);     // over the loop the gust leaves open the grains still fall: they are blown away
        vW = wp.xyz; vQ = vec2(a, c);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      varying vec3 vW; varying vec2 vQ; varying float vMask;
      void main(){
        float a = vQ.x, c = vQ.y;
        float fall = a * 46. + uTime * 16.;                                   // grain bunches running down
        float cw = c + (vnoise(vec2(a * 19., uTime * 1.1)) - .5) * .7 * smoothstep(.2, .8, a), core = max(1. - cw * cw, 0.) * (1. - smoothstep(.5, 1., abs(c)));      // toward its top the stream wanders and frays
        float streak = vnoise(vec2(c * 5., fall * .35)) * .6 + vnoise(vec2(c * 13. + 3., fall)) * .4;
        float grains = smoothstep(.35, .65, vnoise(vec2(c * 9., fall * 2.4)));
        float alpha = core * (.42 + .75 * streak) * mix(1., grains, .3 + .5 * abs(c));
        float loose = smoothstep(.28, .8, a);                                 // and breaks up into single bunches of grains before it is lost in the haze
        alpha *= mix(1., smoothstep(.42, .7, vnoise(vec2(c * 6., fall * 1.5)) * .6 + streak * .4) * 1.15, loose) * (1. - .45 * loose);
        alpha *= (1. - smoothstep(.5, .96, a + (streak - .5) * .3)) * smoothstep(0., .03, a) * vMask;
        alpha *= smoothstep(28., 62., distance(cameraPosition, vW));       // never a pale band across the lens
        if (alpha < .004) discard;
        float sun = sunAt(vW);
        vec3 col = uFlour * (skyLight(vec3(0., .5, .6)) * (1.05 + .25 * streak) + uSunCol * sun * 1.3);
        gl_FragColor = vec4(col, clamp(alpha, 0., .96));
        ${FOG_F}
      }`,
  }));
  const veil = new THREE.Mesh(grid(240, 8), new THREE.ShaderMaterial({
    ...common, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      ${GLSL_K}
      uniform float uGust; uniform vec3 uGustDir;
      varying vec3 vW; varying vec4 vQ; varying float vMask;
      void main(){
        float a = position.x, b = position.y;
        float s = uHead - a * 272., tau = a * 272. / 30.;
        vec4 k = Kat(s);
        float top = clamp(60. - 8. * tau, 0., 60.), bot = max(60. - 25. * tau, 0.);
        float y = mix(bot, top, b);
        vec3 p = vec3(k.x, y, k.y);
        float age = clamp(tau / 7.5, 0., 1.), hang = clamp(y / 60., 0., 1.);
        // the dust billows more the longer it has hung
        p.xz += vec2(vnoise(vec2(s * .04, y * .05 - uTime * .25)), vnoise(vec2(s * .04 + 9., y * .05 + uTime * .2))) * 7. * age - 3.5 * age;
        float fallen = clamp(1. - hang, 0., 1.);
        p += uGustDir * uGust * (30. * pow(fallen, .75) + 5. * sin(s * .08 + y * .11 - uTime * 3.5) * fallen);   // the rare gust: the curtain streams downwind
        vMask = step(0., s) * step(s, uL) * max(step(.5, k.z) * smoothstep(0., .44, fract(k.w)), uClosed);      // a stroke's first and last metres of curtain thin away: no upright edge
        vec4 wp = modelMatrix * vec4(p, 1.);
        vW = wp.xyz; vQ = vec4(s, y, tau, b);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      uniform float uVeilK; uniform vec2 uVeilT;
      varying vec3 vW; varying vec4 vQ; varying float vMask;
      void main(){
        float s = vQ.x, y = vQ.y, tau = vQ.z, b = vQ.w;
        float fallY = y + uTime * 8.;
        float streak = vnoise(vec2(s * .9, fallY * .06)) * .55 + vnoise(vec2(s * 2.7 + 5., fallY * .16)) * .45;
        float cloud = vnoise(vec2(s * .06 + uTime * .05, fallY * .035));
        float dens = smoothstep(.36, .95, streak * .7 + cloud * .5);
        // its edges wander: the rope side, the top and the newest end are frayed by slow billows, never straight
        float wn = vnoise(vec2(s * .13 + 7., y * .07 - uTime * .3)), wn2 = vnoise(vec2(s * .045, uTime * .17 + 3.)), bb = b + (wn - .5) * .36;
        float edge = smoothstep(.02, .36, bb) * (1. - smoothstep(.6, .98, bb));
        vec2 vg = vec2(s * 2.6, fallY * 2.6); float grain = step(.8, hash21(floor(vg))) * (1. - smoothstep(.18, .42, length(fract(vg) - .5)));   // single grains at the frayed edges
        float alpha = mix(grain * .55, dens * .62 + grain * .42 * (1. - dens), edge) * (.2 + .8 * edge);      // a see-through fall: thin streaks with single grains between them
        alpha *= (1. - smoothstep(uVeilT.x, uVeilT.y, tau)) * smoothstep(.12, 1.3 + 1.3 * vnoise(vec2(y * .09, s * .05 + uTime * .4)), tau) * (1. - smoothstep(22., 54., y + (wn2 - .5) * 24. + (wn - .5) * 12.)) * vMask;      // its newest end and its top dissolve: no fan with an edge beside the rope
        vec3 vv = cameraPosition - vW; float vd = length(vv);
        vec3 fn = cross(dFdx(vW), dFdy(vW)); float facing = abs(dot(fn / max(length(fn), 1e-6), vv / max(vd, 1e-4)));
        // no hard pane where the curtain turns edge-on, and no sheet at the lens: within some twenty metres the
        // fall is only its single grains (the sprites), so it never lies over the picture as a smear
        alpha = min(alpha * .5 * uVeilK * smoothstep(.02, .4, facing) * smoothstep(26., 120., vd), .72);
        if (alpha < .004) discard;
        float sun = sunAt(vW);
        vec3 col = uFlour * skyLight(vec3(0., .4, .7)) * (.8 + .35 * streak) * (.85 + .15 * uVeilK);
        col += uSunCol * sun * (.45 + 1.6 * grain * streak);                                // gold sparks in the first sun
        gl_FragColor = vec4(col, alpha);
        ${FOG_F}
      }`,
  }));
  rope.frustumCulled = veil.frustumCulled = false; rope.renderOrder = 6; veil.renderOrder = 5;
  rope.name = 'kolam-rope'; veil.name = 'kolam-veil';
  return { rope, veil };
}

// ---------------------------------------------------------------------------------------------------
// Grains: one instanced mesh of camera-facing sprites. aKind 0 falling grain, 1 burst collar puff,
// 2 skittering grain, 3 gold mote. Everything follows uHead / uLand; uTime only adds flutter and roll.
function makeGrains(U, rng, detail) {
  const n0 = Math.round(5200 * detail), n1 = 260, n2 = Math.round(520 * detail), n3 = Math.round(900 * detail), n = n0 + n1 + n2 + n3;
  const seed = new Float32Array(n * 4), kind = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    seed[i * 4] = rng(); seed[i * 4 + 1] = rng(); seed[i * 4 + 2] = rng(); seed[i * 4 + 3] = rng();
    kind[i] = i < n0 ? 0 : i < n0 + n1 ? 1 : i < n0 + n1 + n2 ? 2 : 3;
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  geo.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 1));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      ${GLSL_K}
      uniform float uGust, uPxK, uGold; uniform vec3 uGustDir, uGoldCol;
      attribute vec4 aSeed; attribute float aKind;
      varying vec2 vC; varying vec4 vCol; varying float vSoft;
      void main(){
        vec3 p = vec3(0.); float size = .3, alpha = 1., soft = 0., gold = 0.;
        if (aKind < .5) {                                  // falling: poured at sp, age tau
          float off = mod(uHead - aSeed.x * 272., 272.), sp = uHead - off, tau = off / 30.;
          float v = mix(8., 25., aSeed.y * aSeed.y);       // most of it is slow dust
          float y = 60. - v * tau; vec4 k = Kat(sp);
          float spread = .7 + (25. - v) * .16 * tau;
          vec2 j = (aSeed.zw - .5) * 2. * spread + vec2(sin(uTime * 1.3 + aSeed.z * 40.), cos(uTime * 1.1 + aSeed.w * 40.)) * .5 * tau;
          p = vec3(k.x + j.x, y, k.y + j.y) + uGustDir * uGust * 30. * pow(clamp(1. - y / 60., 0., 1.), .75) * (.55 + .9 * aSeed.z);
          size = mix(.07, .17, aSeed.w) * (1. + .6 * step(.9, aSeed.y)) * (1. + 1.3 * uGust);
          alpha = step(0.3, y) * step(0., sp) * step(sp, uL) * max(step(.5, k.z), uClosed) * (1. - smoothstep(46., 60., y)) * (.55 + .45 * aSeed.z);
        } else if (aKind < 1.5) {                           // the rolling collar round the burst
          vec4 k = Kat(uLand - 1.5), k2 = Kat(uLand - 3.);
          float th = aSeed.x * 6.2832, roll = uTime * (2.5 + aSeed.y * 2.) + aSeed.z * 6.2832, life = fract(roll / 6.2832);
          float rad = 1.2 + 5.2 * pow(life, .8) + .8 * sin(roll);
          p = vec3(k.x + cos(th) * rad, .5 + (1.2 + 5. * aSeed.w * aSeed.w) * sin(life * 3.1416) * (1. - .5 * life), k.y + sin(th) * rad);   // a mound of dust: high at the heart, low and wide at the rim
          p.xz += (k2.xy - k.xy) * life * 1.5;             // it trails behind the landing point
          size = mix(1.2, 3.2, aSeed.z) * (.5 + .9 * life); soft = 1.;
          alpha = .19 * sin(life * 3.1416) * step(uLand, uL - .5) * max(step(.5, k.z), uClosed);
          alpha *= smoothstep(26., 62., distance(cameraPosition, p));   // no soft puffs against the lens
        } else if (aKind < 2.5) {                           // grains thrown out of the burst, bouncing, then left lying
          float off = mod(uLand - aSeed.x * 46., 46.), se = uLand - off, t = off / 30.;
          vec4 k = Kat(se); float th = aSeed.y * 6.2832, reach = (2. + 6.5 * aSeed.z) * (1. - exp(-3.5 * t));
          p = vec3(k.x + cos(th) * reach, .12 + abs(sin(t * 11. + aSeed.w * 3.)) * 1.7 * exp(-3. * t), k.y + sin(th) * reach) + uGustDir * uGust * t * 34. * (.4 + aSeed.z);
          size = mix(.07, .16, aSeed.w);
          alpha = step(0., se) * step(.5, k.z) * (1. - smoothstep(1.2, 1.53, t));
        } else {                                            // gold motes over the finished knot
          float th = aSeed.x * 6.2832, rad = sqrt(aSeed.y) * 88.;
          float y = mod(aSeed.z * 46. - uTime * (.5 + aSeed.w), 46.) + 1.;
          p = vec3(cos(th) * rad + sin(uTime * .3 + aSeed.z * 30.) * 2., y, sin(th) * rad + cos(uTime * .27 + aSeed.w * 30.) * 2.);
          size = mix(.2, .42, aSeed.w); gold = 1.;
          alpha = .7 * uGold * smoothstep(1., 4., y) * (1. - smoothstep(30., 47., y)) * (.4 + .6 * sin(uTime * (2. + aSeed.x * 3.) + aSeed.y * 50.));
        }
        vec4 wp = modelMatrix * vec4(p, 1.);
        float sun = sunAt(wp.xyz);
        vec4 mvPosition = viewMatrix * wp;
        float px = -mvPosition.z * uPxK;                   // world size of 1.6 pixels at this depth
        float sz = min(max(size, px * (1. - soft)), mix(px * 5., size, soft));
        alpha *= smoothstep(2., 9., -mvPosition.z);
        alpha *= clamp(size / max(sz, 1e-4), .16, 1.);
        mvPosition.xy += position.xy * sz * step(.004, alpha);
        gl_Position = projectionMatrix * mvPosition;
        vec3 col = uFlour * skyLight(vec3(0., .6, .5)) * (.85 + .3 * aSeed.w);
        col = mix(col + uSunCol * sun * (.35 + 1.5 * step(.86, aSeed.z) * (1. - soft)), uGoldCol * 2.6, gold);
        vCol = vec4(col, alpha * mix(1., sun, gold)); vC = position.xy; vSoft = soft;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      varying vec2 vC; varying vec4 vCol; varying float vSoft;
      void main(){
        float r2 = dot(vC, vC);
        float a = mix(1. - smoothstep(.45, 1., r2), exp(-r2 * 3.2) * (1. - smoothstep(.7, 1., r2)), vSoft) * vCol.a;
        if (a < .004) discard;
        gl_FragColor = vec4(vCol.rgb, a);
        ${FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.name = 'kolam-grains';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------
// The ground: wet granite flags (or damp swept earth) that mirror the sky, the veil, the rope and the ridge,
// with contact shade, stray grains and the long sun shadows from the distance texture.
function makeGround(U, size) {
  const geo = new THREE.PlaneGeometry(size, size, 1, 1); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      varying vec3 vW;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      uniform sampler2D uDTex;
      uniform vec3 uStoneA, uStoneB, uMoss, uGoldCol, uCellCol[3];
      uniform vec4 uCells[17], uPourer;
      uniform vec2 uBites[12];
      uniform float uEarth, uFest, uGlint, uGold; uniform vec2 uShadowLen, uGapDot, uGapK, uVeilT; uniform vec4 uGap, uGapEnds; uniform vec3 uGustDir, uKaavi, uRose;
      uniform vec4 uFoot, uStep; uniform vec3 uLime, uOchre, uGlintAt; uniform float uDawn;
      varying vec3 vW;
      // the sky as the wet ground mirrors it: blue overhead, pale up the street, the dark house, and to the east
      // the rose and the wide peach band, which is what the stone shows most of
      vec3 skyRefl(vec3 R){
        float h = clamp(R.y, 0., 1.), street = clamp(R.z * .5 + .5, 0., 1.), east = R.x / max(length(R.xz), 1e-3);
        vec3 top = mix(uSkyTop, vec3(dot(uSkyTop, vec3(.3, .5, .2))) * vec3(.96, 1., 1.1), mix(.45, .15, uEarth)) * .9;        // overhead the film shows a grey-blue, not the sky's full ultramarine
        vec3 low = mix(uSkyLow, mix(uSkyLow, uSkyTop, .66) * .86, uEarth);                                  // the damp yard is a darker mirror: it shows the sky's blue, not the pale of the horizon
        vec3 c = mix(low, top, pow(h, .45));
        c = mix(c, uSkyLow * 1.08, (1. - h) * (1. - h) * street * .7 * (1. - .7 * uEarth));
        c = mix(c, uHouse * 1.5 + uSkyLow * .11 + uSkyTop * .2 * uEarth, smoothstep(0., .7, -R.z) * (1. - smoothstep(.1, .6, h)) * .86);      // the house: dark at its foot, haze above
        float e = smoothstep(-.35 - .25 * uDawn, .85 - .1 * uDawn, east);
        float sunG = uSun * (1. - smoothstep(60., 250., uSunEdgeX));        // the mirrored band brightens as the sun's edge comes onto the knot, not before: the first warm ground is the edge itself
        c = mix(c, uRose, e * smoothstep(.1, .4, h) * (1. - smoothstep(.4, .85, h)) * (.28 + .16 * sunG));
        c = mix(c, uPeach * (1.05 + .4 * sunG + .25 * uDawn), e * e * (1. - smoothstep(.06, .55 + .3 * uDawn, h)) * (.55 + .3 * sunG + uEarth * (.12 * sunG - .17 * (1. - sunG)) + .2 * uDawn));     // (the damp earth is a dark mirror until the sun's edge is on it: before that it shows little of the band)   // (uDawn: the band has grown; the film toward the street shows more of it)
        return c;
      }
      void main(){
        vec3 P = vW, toCam = cameraPosition - P; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-4);
        float near = 1. - smoothstep(30., 150., dist), mid = 1. - smoothstep(150., 600., dist);
        // flags and joints
        vec2 fp = P.xz / 120. + .5, fid = floor(fp), fl = abs(fract(fp) - .5) * 120.;
        float jd = 60. - max(fl.x, fl.y), wob = (vnoise(P.xz * .35) - .5) * .7;
        float joint = (1. - smoothstep(.55, 1.25, jd + wob)) * (1. - uEarth), fv = mix(hash21(fid), .35, uEarth);
        float n1 = vnoise(P.xz * .03 + fv * 20.), n2 = vnoise(P.xz * .37 + 5.), n3 = vnoise(P.xz * 2.6);
        // (the yard's earth is one even tone: only a slow drift of it and a fine grain, no patches)
        vec3 alb = mix(uStoneA, uStoneB, clamp(mix(n1 * .55 + n2 * .4 * mid + fv * .35 - .1, .34 + (n1 - .5) * .22 + (n2 - .5) * .12 * mid, uEarth), 0., 1.)) * mix(.72 + .56 * n3 * near, .9 + .2 * n3 * near, uEarth);
        alb *= 1. + (1. - uEarth) * (.3 * (vnoise(P.xz * .12 + 31.) - .5) + .34 * smoothstep(.6, .85, vnoise(P.xz * vec2(.05, .09) + fv * 9.)) * mid);   // granite: cloudy grain and paler veins
        // broom (or finger) arcs of fine silt, two families
        float r1 = length(P.xz - vec2(-310., 430.)), r2 = length(P.xz - vec2(390., 280.));
        float fam = smoothstep(.4, .6, vnoise(P.xz * .009 + 3.));
        float arcs = mix(vnoise(vec2(r1 * .33, 2.)) * .6 + vnoise(vec2(r1 * 1.3, 7.)) * .4 * near, vnoise(vec2(r2 * .33, 4.)) * .6 + vnoise(vec2(r2 * 1.3, 1.)) * .4 * near, fam);
        float sweep = smoothstep(.45, .8, arcs) * (.4 + .6 * vnoise(P.xz * .05 + 11.)), silt = sweep * (1. - smoothstep(70., 280., dist));
        alb *= 1. + silt * .85 * (1. - uEarth);                 // stone: pale silt left by the broom
        // earth: swept with four fingers in long arcs. Fine dark grooves in sets of four, crisp from near and gone
        // before they could shimmer; the earth between them is left plain
        float rq = (fam > .5 ? r2 : r1) * .19 + (vnoise(P.xz * .028 + 5.) - .5) * 1.1, gph = fract(rq), gfr = fract(gph * 8.) - .5;
        float gcut = step(gph, .5) * (1. - smoothstep(.3, 1.1, fwidth(rq) * 8.)) * uEarth, groove = (1. - smoothstep(.2, .62, abs(gfr) * 2.)) * gcut;
        alb *= 1. - .24 * groove;
        alb *= 1. + uEarth * (.1 * (vnoise(P.xz * .9 + 3.) - .5) * near + .2 * smoothstep(.62, .82, vnoise(P.xz * 4.3)) * (1. - smoothstep(12., 70., dist)));   // a few crumbs
        // where the sun has reached it the earth shows how it was swept and where it is still damp: broad arcs left
        // by the hand, darker patches that have not begun to dry (before sunrise it is one even dark mirror)
        float sunE = sunAt(P) * uEarth, damp = smoothstep(.42, .7, vnoise(P.xz * .017 + 50.) * .7 + vnoise(P.xz * .06 + 8.) * .3);
        alb *= 1. + sunE * ((arcs - .5) * .85 + .26 * (smoothstep(.2, .8, fract(rq * .5)) - .5) - .42 * damp);
        // on the stone the film has begun to dry where the sun is: paler, matt islands of dry granite among the wet
        float dryN = vnoise(P.xz * .031 + 90.) * .6 + vnoise(P.xz * .11 + 14.) * .28 + vnoise(P.xz * .43) * .12 + .12 * (arcs - .5);
        float dry = sunAt(P) * (1. - uEarth) * smoothstep(.5, .58, dryN) * (1. - joint);
        alb *= 1. + dry * (.2 + .25 * silt);
        // the kaavi: bands of red ochre painted by hand round the drawing, a broad one between two thin ones, with
        // a row of flour dots along the broad band
        float kq = max(abs(P.x), abs(P.z)) + (vnoise(P.xz * .045 + 9.) - .5) * 2.2 + (vnoise(P.xz * .4) - .5) * .5, kal = abs(P.x) > abs(P.z) ? P.z : P.x;
        float kband = smoothstep(108.5, 109.3, kq) * (1. - smoothstep(117.2, 118., kq)) + smoothstep(103.4, 103.9, kq) * (1. - smoothstep(105.3, 105.8, kq)) + smoothstep(121., 121.5, kq) * (1. - smoothstep(122.9, 123.4, kq));
        float brush = vnoise(vec2(kal * .07, kq * 2.2)) * .6 + vnoise(vec2(kal * .5, kq * 5.)) * .4;
        float kaavi = kband * (.66 + .34 * smoothstep(.2, .5, brush));
        alb = mix(alb, uKaavi * (.7 + .6 * brush) * (.85 + .3 * n3 * near), kaavi);
        float kdot = (1. - smoothstep(.95, 1.4, length(vec2(mod(kal + 4.5, 9.) - 4.5, kq - 113.3)))) * step(abs(kal), 110.);
        alb = mix(alb, uMoss * (.6 + .8 * n3), joint);
        vec2 fq = P.xz * 9.; float fleck = step(.975, hash21(floor(fq))) * (1. - smoothstep(.1, .22, length(fract(fq) - .5))) * (1. - smoothstep(12., 70., dist)) * (1. - joint);
        // the line: distance, s, sun-side caster
        vec2 uv = (P.xz + ${TEX_HALF}.) / ${2 * TEX_HALF}.;
        float inb = step(abs(uv.x - .5), .498) * step(abs(uv.y - .5), .498);
        vec4 d0 = textureLod(uDTex, clamp(uv, 0., 1.), 0.);
        float dr = mix(${D_CAP}., d0.r, inb), ls = d0.g;
        float bitten = 0., cb = 0.;
        for (int i = 0; i < 12; i++) { float on = step(.02, uBites[i].y);
          bitten = max(bitten, on * step(abs(ls - uBites[i].x), uBites[i].y * .8)); cb = max(cb, on * step(abs(d0.a - uBites[i].x), uBites[i].y * .8)); }
        float drawn = max(step(ls, -.5) * step(-1.5, ls), smoothstep(0., 6., uLand - ls) * step(-.5, ls) * (1. - bitten)) * inb;
        float contact = drawn * (1. - smoothstep(0., 5.5, dr));
        // what a laid ridge or a dot shades when the sun is on it
        float cdrawn = max(step(d0.a, -.5) * step(-1.5, d0.a), step(d0.a, uLand) * step(-.5, d0.a) * (1. - cb)) * inb;
        float len = mix(uShadowLen.x, uShadowLen.y, step(d0.a, -.5));
        float shadow = cdrawn * (1. - smoothstep(len * mix(.55, .45, uEarth), len, d0.b)) * smoothstep(.3, 1.3, d0.b + dr);      // crisp at the ridge, soft at its far end
        // rare: where the gust tore the line open, a fan of spilled flour lies downwind of the gap
        vec2 gd = P.xz - uGap.xy, gdir = normalize(uGustDir.xz + vec2(1e-4, 0.)); float al = dot(gd, gdir), ac = dot(gd, vec2(-gdir.y, gdir.x)), fw = 11. + max(al, 0.) * .42;
        float fan = uGap.z * smoothstep(-12., 4., al) * (1. - smoothstep(30., 84., al)) * exp(-ac * ac / (fw * fw)) * smoothstep(6., 13., length(P.xz - uGapDot));   // the dot the line went round stays clear in dark stone
        vec2 sg = P.xz * 5.3 + vnoise(P.xz * 2.) * 2.; float stray = step(1. - mix(.34, .17, uEarth) * exp(-dr * .4) * drawn - .6 * fan, hash21(floor(sg) + 3.)) * (1. - smoothstep(.14, .32, length(fract(sg) - .5))) * (1. - smoothstep(20., 110., dist));
        // festival: coloured powder floods the cells outward from their centres once the line has passed
        // (each is a low mound of powder: thick and bright at its heart, thinning to a ragged, grainy edge)
        float fill = 0., fh = 0.; vec3 fcol = vec3(0.); vec2 fdd = vec2(0.);
        if (uFest > .5) {
          float fn = (vnoise(P.xz * .33) - .5) * 3., fe = fn * .7 + (vnoise(P.xz * 1.3) - .5) * 2.6 + (vnoise(P.xz * 5.5) - .5) * 1.1;
          for (int i = 0; i < 17; i++) {
            vec4 c = uCells[i]; vec2 dd = P.xz - c.xy; float m = abs(dd.x) + abs(dd.y), rr = length(dd);
            float dia = step(9.5, c.w), edge = mix(min(13.6 - rr, (19.2 - m) * .707), (19.2 - m) * .707, dia) + fe;     // metres inside the cell's edge
            float prog = clamp((uHead - 132. - c.z) / 150., 0., 1.);
            float f = smoothstep(0., 2.2, edge) * (1. - smoothstep(prog * 21. - 2.5, prog * 21., rr + fn)) * step(.001, prog);
            int ci = int(mod(c.w, 3.) + .5);
            if (f > fill) { fill = f; fh = clamp(edge / 7.5, 0., 1.); fdd = dd / max(rr, .5); fcol = ci == 0 ? uCellCol[0] : (ci == 1 ? uCellCol[1] : uCellCol[2]); }
          }
          fill *= smoothstep(1.9, 3.3, dr) * inb * smoothstep(.25, .6, vnoise(P.xz * 4.3 + 7.) * .7 + vnoise(P.xz * 11. + 2.) * .3 + fh * 1.7);
          fcol = mix(fcol, vec3(dot(fcol, vec3(.3, .5, .2))), .24);
        }
        // wet film
        float pn2 = vnoise(P.xz * .017 + 70.) * .68 + vnoise(P.xz * .07 + 20.) * .32 + .1 * exp(-dr * .2) * drawn;
        float pud = smoothstep(.6, .63, pn2) * (1. - joint) * (1. - uEarth);                // flat puddles standing on the film (the earth is evenly wet: no puddles)
        float rim = (smoothstep(.57, .6, pn2) - smoothstep(.6, .64, pn2)) * (1. - joint) * mid * (1. - uEarth);
        float wv = vnoise(P.xz * .022 + 40.), wet = mix(.8 * (.7 + .3 * wv), .87 + .08 * wv, uEarth) * (1. - .7 * joint);
        wet = mix(wet, 1., pud) * (1. - fill * .95) * (1. - .4 * kaavi) * (1. - kdot) * (1. - .55 * dry * (1. - pud)); alb *= 1. - .3 * pud;
        float close = 1. - smoothstep(10., 55., dist), m1 = vnoise(P.xz * 9.), m2 = vnoise(P.xz * 9. + 23.);
        alb *= 1. + (m1 - .5) * mix(.5, .3, uEarth) * close;
        vec2 ad = (fam > .5 ? (P.xz - vec2(390., 280.)) / max(r2, 1.) : (P.xz - vec2(-310., 430.)) / max(r1, 1.)) * gfr * groove * .24;   // each groove tilts the sheen a little
        vec3 n = normalize(vec3((n3 - .5) * .05 * near + (m1 - .5) * .09 * close + ad.x, 1., (vnoise(P.xz * 2.6 + 9.) - .5) * .05 * near + (m2 - .5) * .09 * close + ad.y));
        vec3 R = reflect(-V, n); R.y = abs(R.y);
        float cosv = clamp(dot(V, n), 0., 1.), F = min(mix(mix(.085, .2, uEarth), 1., pow(1. - cosv, mix(3.7, 3., uEarth))), mix(.7, .8, uEarth)) * wet;   // the damp earth is a dark mirror, evenly wet
        F *= 1. - sunE * (1. - shadow) * (.74 - .62 * damp) * (.8 + .4 * arcs);                                                            // sunlit earth is earth-coloured, not a sheet of sky; its damp patches still shine a little
        vec3 refl = skyRefl(R) * (1. + .1 * pud) + uSkyLow * .16 * rim;
        // the pourer: a soft dark shape sliding over the stone ahead of the line
        vec2 pd = P.xz - uPourer.xy; float pn = vnoise(P.xz * .03 + uTime * .1);
        refl *= 1. - .6 * uPourer.z * exp(-dot(pd, pd) / (1500. + 900. * pn));
        // mirror of the veil, rope, ridge and dots: march the reflected ray over the distance texture
        float rl = max(length(R.xz), 1e-4), slope = R.y / rl; vec2 rd = R.xz / rl;
        float mir = 0., t = 1.4;
        for (int i = 0; i < 9; i++) {
          vec2 q = P.xz + rd * t; vec2 quv = (q + ${TEX_HALF}.) / ${2 * TEX_HALF}.;
          float qin = step(abs(quv.x - .5), .498) * step(abs(quv.y - .5), .498);
          vec4 d = textureLod(uDTex, clamp(quv, 0., 1.), 0.);
          float h = t * slope, tau = (uHead - d.g) / 30., live = step(-.5, d.g);
          float top = clamp(60. - 8. * tau, 0., 60.), bot = max(60. - 25. * tau, 0.);
          float inLine = 1. - smoothstep(.8, 2. + t * .08, d.r);
          float veil = live * step(0., tau) * smoothstep(bot - 3., bot, h) * (1. - smoothstep(top - 5., top + .01, h)) * .62 * (1. - smoothstep(uVeilT.x, uVeilT.y, tau));
          float rope = live * step(0., tau) * step(tau, 2.4) * (1. - smoothstep(1., 4.5, abs(h - bot))) * .85;
          float ridge = max(step(d.g, -.5) * step(-1.5, d.g) * (1. - smoothstep(1.6, 2.6, h)), live * smoothstep(0., 6., uLand - d.g) * (1. - smoothstep(1., 1.9, h)));
          mir = max(mir, inLine * qin * max(max(veil, rope), ridge * .8));
          t *= 1.55;
        }
        mir *= 1. - smoothstep(.34, .66, cosv);                                                        // looking steeply down there is no curtain in the film, only sky
        refl = mix(refl, uFlour * (skyLight(vec3(0., .5, .6)) * .8 + uSunCol * sunAt(P) * .5), mir * .85);
        // the falling line itself: a pale streak of reflection that runs from the foot of the fall toward us
        { vec2 Df = uFoot.xy - P.xz; float dhf = max(length(Df), 1.), latf = rd.x * Df.y - rd.y * Df.x, hf = dhf * slope, wf = 2.6 + dhf * .02 + hf * .13;
          float wav = (vnoise(vec2(P.x * .21 + P.z * .13, P.z * .19 - uTime * .22)) - .5) * (1.2 + dhf * .03), lw2 = (latf + wav) * (latf + wav) / (wf * wf);
          float colm = step(0., dot(rd, Df)) * (exp(-lw2) + .3 * exp(-lw2 / 12.)) * (1. - smoothstep(34., 74., hf)) * smoothstep(3., 16., dhf);
          colm *= .68 + .32 * vnoise(vec2(latf * .7 + 3., hf * .22 + uTime * 1.6));
          refl = mix(refl, uFlour * (skyLight(vec3(0., .5, .6)) * 1.12 + uSunCol * sunAt(P) * .5), min(colm * uFoot.z * .95, .95)); }
        // the house: its lime-washed step stands in the wet stone as pale and ochre upright bands, drawn out toward us
        // and wavering with the film (uStep: the riser's z, its height, the width of a band, how strongly)
        { float rz = min(R.z, -1e-3), ts = (uStep.x - P.z) / rz; vec3 hs = P + R * ts;
          hs.x += (vnoise(vec2(P.x * .09 + 5., P.z * .07 - uTime * .12)) - .5) * (1.5 + ts * .05) + (vnoise(vec2(P.x * .5, P.z * .4 + uTime * .3)) - .5) * ts * .012;
          float ph = hs.x / uStep.z + .5, bi = floor(ph), wj = (hash21(vec2(bi, 3.)) - .5) * .3, tri = abs(fract((ph + wj) * .5) - .5) * 2., bth = mix(.5, .76, hash21(vec2(floor(ph * .5), 9.)));
          float band = smoothstep(bth - .06, bth + .06, tri), sof = 1. + ts * .012;
          float mR = step(R.z, -.02) * step(uStep.x, P.z) * smoothstep(-.6 * sof, .8 * sof, hs.y) * (1. - smoothstep(uStep.y - 2.2 * sof, uStep.y + .6 * sof, hs.y));
          float sunS = sunAt(hs);
          vec3 lw = mix(uLime * 1.12, uOchre * .9, band) * (skyLight(vec3(0., .15, 1.)) + uSunCol * sunS * .95) * (.55 + .45 * smoothstep(0., 9., hs.y));
          lw = mix(lw, uSkyLow * .5, smoothstep(360., 1150., dist + ts));
          // the film is not glass: every white band runs on toward us as a pale streak, breaking up as it thins
          float tl = max(hs.y - uStep.y, 0.) / (uStep.y * 2.4), brk = vnoise(vec2(hs.x * .33, P.z * .06 - uTime * .25)) * .6 + vnoise(vec2(hs.x * .9 + 4., P.z * .17 + uTime * .2)) * .4;
          float tail = step(R.z, -.02) * step(uStep.x, P.z) * step(uStep.y, hs.y) * (1. - band) * exp(-tl * .9) * (1. - smoothstep(.9, 2.2, tl)) * smoothstep(.15 + .4 * tl, .45 + .4 * tl, brk + .3) * (1. - smoothstep(300., 900., dist + ts));
          refl = mix(refl, lw * (1. + .25 * step(mR, tail)), min(max(mR * .95, tail * .9), 1.) * uStep.w);
          // above it the sunlit door: a warm upright glow in the wet once the sun is on the house
          float td = (uStep.x - 70. - P.z) / rz; vec3 hd = P + R * td;
          float mD = step(R.z, -.02) * step(uStep.x, P.z) * smoothstep(uStep.y + 2., uStep.y + 9., hd.y) * (1. - smoothstep(60., 190., hd.y)) * (1. - smoothstep(92., 112., abs(hd.x))) * smoothstep(7., 12., abs(hd.x));
          refl += uSunCol * vec3(.5, .3, .16) * sunAt(hd) * mD * uStep.w * .5; }
        // light: the blue hour (the stone keeps its own colour under it), then the lamps, then the sun
        vec3 up = vec3(0., 1., 0.), sl0 = skyLight(up);
        vec3 slf = mix(sl0, vec3(dot(sl0, vec3(.3, .5, .2))), .45) * 1.1; sl0 = mix(sl0, vec3(dot(sl0, vec3(.3, .5, .2))), .46 + .16 * uEarth);
        float sun = sunAt(P);
        vec3 dif = alb * sl0 * (1. - .5 * contact) * mix(1., mix(.58, 1., sun), uEarth);              // damp earth is dark until the sun is on it
        vec3 flourLit = uFlour * slf * .95;
        vec3 powder = fcol * sl0 * (.24 + .62 * fh + .62 * fh * fh) * (.82 + .3 * n3 + .3 * (m1 - .5) * close) * (1. - .35 * contact) * (.84 + .32 * vnoise(P.xz * 1.3 + 11.));
        powder *= 1. + (.5 * fdd.x - .16 * fdd.y) * (1. - fh * fh) * smoothstep(0., .2, fh);                               // a heap: its slope toward the pale east is lighter, the other darker
        powder *= 1. + .4 * sun * fdd.x * (1. - fh);                                                    // the mound's sunward slope
        dif = mix(dif, powder, fill);
        dif = mix(dif, flourLit, max(stray, kdot) * (1. - fill));
        float splay = 1. / (1. + max(al, 0.) * .035);
        float fst = smoothstep(.38, .7, vnoise(vec2(ac * .8 * splay, al * .04 + 3.)) * .58 + vnoise(vec2(ac * 2.3 * splay + 5., al * .1)) * .26 + vnoise(P.xz * 1.7) * .16);      // thrown out in streaks that splay downwind
        float dust = min(sqrt(fan) * (.07 + 1.45 * fst) + fan * .6 * smoothstep(.58, .72, vnoise(P.xz * .45 + 17.)), 1.) * step(.002, fan);   // and in clumps
        vec2 e0 = P.xz - uGapEnds.xy, e1 = P.xz - uGapEnds.zw; float hw = (vnoise(P.xz * .9 + 5.) - .5) * 1.4;
        float heap = max(uGapK.x * (1. - smoothstep(1.4, 4.4, length(e0) + hw)), uGapK.y * (1. - smoothstep(1.4, 4.4, length(e1) + hw)));          // each loose end finishes in a small heap
        dust = max(dust, heap);
        dif = mix(dif, flourLit * (1. + .22 * heap), dust);
        vec3 col = dif * (1. - F * .85 * (1. - dust)) + refl * F * (1. - dust);
        col += uSkyLow * fleck * .22;                                                                   // mica takes the sky before it takes the sun
        // the lamps on the step stand in the wet stone as long wavering streaks
        float lampS = 0.;
        for (int i = 0; i < 11; i++) {
          vec3 Lp = uLamps[i].xyz; vec2 D = Lp.xz - P.xz; float dh = max(length(D), 1.), lat = rd.x * D.y - rd.y * D.x, sl = Lp.y / dh, w = .9 + dh * .016, sg = .04 + .4 * sl;
          lampS += uLamps[i].w * step(0., dot(rd, D)) * exp(-lat * lat / (w * w)) * exp(-(slope - sl) * (slope - sl) / (sg * sg)) * (1. - smoothstep(.45, .7, sl));
        }
        col += uLampCol * lampS * 1.5 * wet * max(F, .3) * (1. - dust) * (.75 + .5 * m1);
        // sunrise. Lit ground is the same stone (or earth) lifted and a little warmed; what a ridge or a dot shades is a
        // darker, cooler tone of it; the lit flank of each ridge throws a little of its peach back on the ground.
        float lightK = 1. - shadow, bright = max(max(fill, dust), max(stray, kdot));
        vec3 liftC = mix(mix(vec3(1.62, 1.45, 1.25), vec3(1.3, 1.13, .78), uEarth), vec3(1.3, 1.17, 1.), bright), shadeC = mix(vec3(.86, .85, .92), vec3(.74, .82, 1.06), uEarth);     // (on the earth: a warm olive-brown in the sun, long blue shadows)
        col *= mix(vec3(1.), mix(shadeC, liftC, lightK), sun);
        float bounce = drawn * exp(-max(dr - 1.2, 0.) * .4) * smoothstep(dr + .6, dr + 3.6, d0.b);
        col += mix(uSunCol, uPeach, .5) * sun * lightK * (.24 * bounce + .012 + .012 * n1);
        vec3 sdir = normalize(uSunDir + vec3(0., .1, 0.));
        col += uSunCol * sun * lightK * (fleck * .9 + F * (.22 * smoothstep(-.2, .9, R.x) + 1.5 * pow(max(dot(R, sdir), 0.), 40.)));        // mica flashes, and the sun's own path in the film
        vec2 sq = P.xz * .7 + 13.; float sph = hash21(floor(sq)), sparkle = step(.968, sph) * (1. - smoothstep(.1, .25, length(fract(sq) - .5))) * (.5 + .5 * sin(uTime * (2. + 3. * sph) + sph * 60.));
        col += uGoldCol * 1.7 * sparkle * uGold * sun * lightK * (1. - joint) * (1. - smoothstep(120., 420., dist));                         // gold sparks in the lit stone
        float edgeD = (P.x + .14 * P.z - uSunEdgeX) / 17.;
        col += (uSunCol * .5 + uGoldCol * .5) * uSun * exp(-edgeD * edgeD) * (.085 + .1 * fleck + .05 * n3 * near) * lightK;   // the sun's edge: a soft glowing band
        // dawn mist streaming low over the wet ground with the wind: soft streaks, none over the knot; seen from
        // above it thins to nothing; where the sun has reached, it lights up
        vec2 mq = vec2(dot(P.xz, uGustDir.xz), dot(P.xz, vec2(-uGustDir.z, uGustDir.x))) * vec2(.016, .07) - vec2(uTime * .22, uTime * .02);
        float mist = smoothstep(.54, .74, vnoise(mq) * .45 + vnoise(mq * 2.9 + 7. + vec2(uTime * .25, -uTime * .1)) * .55) * smoothstep(80., 150., length(P.xz)) * (1. - smoothstep(450., 850., dist)) * (1. - .45 * smoothstep(.8, 1., uLand / uL)) * (1. - .78 * smoothstep(.22, .62, V.y)) * (1. - .8 * uEarth);
        col = mix(col, mix(uSkyLow * .82, uSunCol * 1.15 + uPeach * .35, sun * .85), mist * (.3 + .22 * sun));
        // gold glint streak in the stone
        // (it lies where the film shows the glint to this eye: on the line from us to the point under it, narrow, drawn out toward us)
        vec2 gc = mix(cameraPosition.xz, uGlintAt.xz, clamp(cameraPosition.y / max(cameraPosition.y + uGlintAt.y, 1.), 0., 1.));
        vec2 gv = P.xz - gc, gdv = uGlintAt.xz - cameraPosition.xz; gdv /= max(length(gdv), 1e-3);
        float along = dot(gv, gdv), gp2 = max(dot(gv, gv) - along * along, 0.), gw = .8 + length(P.xz - cameraPosition.xz) * .012;
        col += uGoldCol * uGlint * 2.2 * exp(-gp2 / (gw * gw)) * exp(-along * along / 1500.) * smoothstep(8., 40., length(P.xz - cameraPosition.xz)) * wet;
        gl_FragColor = vec4(col, 1.);
        ${FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'kolam-ground'; mesh.renderOrder = -0.5;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------
// Festival look: marigold heads on the eight rim dots, a pumpkin flower on the centre dot, and the broad
// falls of coloured powder over each cell while it fills.
async function makeFestival(K, U, cells, cellCols, rng, pal, ctx) {
  const P = [], C = [], A = [], I = [];
  const petal = (cx, cy, cz, yaw, lift, len, wid, curl, col, tipCol) => {
    const base = P.length / 3, NS = 5, cy0 = Math.cos(yaw), sy0 = Math.sin(yaw);
    for (let k = 0; k <= NS; k++) {
      const t = k / NS, w = wid * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.18)) * (1 - 0.75 * t * t * t);
      const ang = lift - curl * t, r = len * t * Math.cos(ang * 0.5 + 0.2), y = len * t * Math.sin(lift) - curl * len * 0.35 * t * t;
      for (let m = -1; m <= 1; m++) {
        const px = r, pz = m * w, py = y + (m === 0 ? 0 : wid * 0.22);
        P.push(cx + px * cy0 - pz * sy0, cy + py, cz + px * sy0 + pz * cy0);
        const sh = (0.72 + 0.28 * t) * (m === 0 ? 0.82 : 1);
        C.push(lerp(col.r, tipCol.r, t * t) * sh, lerp(col.g, tipCol.g, t * t) * sh, lerp(col.b, tipCol.b, t * t) * sh);
        A.push(t, yaw * 7.3 + cx);
      }
      if (k < NS) { const a = base + k * 3; I.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5); }
    }
  };
  const gold = new THREE.Color(pal[5]), orange = new THREE.Color('#e0701c'), deep = new THREE.Color('#8f300a'), yel = new THREE.Color('#f0c63a'), grn = new THREE.Color('#5d7d2c');
  // one small marigold petal: broad, blunt and frilled at the tip, cupped along its length, the tip curled over
  const domes = [];
  const frill = (cx, cy, cz, yaw, lift, len, wid, col, tipCol) => {
    const base = P.length / 3, NS = 4, cy0 = Math.cos(yaw), sy0 = Math.sin(yaw), cl = Math.cos(lift), sl = Math.sin(lift);
    for (let k = 0; k <= NS; k++) {
      const t = k / NS, w = wid * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 0.62 + 0.12))) * (k === NS ? 0.72 : 1);
      const along = len * t, droop = 0.55 * len * t * t * t;                       // the outer third curls over
      for (let m = -1; m <= 1; m++) {
        const notch = k === NS ? (m === 0 ? -0.1 * len : 0.03 * len) : 0;          // a nicked tip
        const px = (along + notch) * cl - droop * sl * 0.4, py = (along + notch) * sl - droop * cl + (m === 0 ? -0.12 * wid : 0.1 * wid) * (1 - 0.5 * t), pz = m * w;
        P.push(cx + px * cy0 - pz * sy0, cy + py, cz + px * sy0 + pz * cy0);
        const sh = (0.42 + 0.58 * t) * (m === 0 ? 0.86 : 1);
        C.push(lerp(col.r, tipCol.r, t * t) * sh, lerp(col.g, tipCol.g, t * t) * sh, lerp(col.b, tipCol.b, t * t) * sh);
        A.push(t, yaw * 7.3 + cx);
      }
      if (k < NS) { const a = base + k * 3; I.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5); }
    }
  };
  for (const d of K.dots) {
    const ring = Math.round((Math.abs(d[0]) + Math.abs(d[1])) / SP);
    if (ring === 2) {            // marigold: a dense dome of small ruffled petals, 10 m across, deep orange skirt to a gold heart
      const tint = rng() < 0.5 ? gold : orange, yaw0 = rng() * 6.28, v0 = P.length / 3;
      for (let tier = 0; tier < 9; tier++) {
        const f = tier / 8, n = Math.round(27 - 19 * f), lift = 0.04 + 1.36 * Math.pow(f, 0.85), len = 4.9 - 3.5 * f, rise = 1.7 + 2.5 * Math.sin(f * 1.5);
        const base = deep.clone().lerp(orange, 0.25 + 0.5 * f), tip = tint.clone().lerp(yel, 0.15 + 0.6 * f * f);
        for (let k = 0; k < n; k++) {
          const sh = 0.82 + 0.3 * rng();
          frill(d[0], rise, d[1], yaw0 + (k + (tier & 1) * 0.5 + (rng() - 0.5) * 0.35) / n * 6.2832, lift + (rng() - 0.5) * 0.16, len * (0.86 + 0.28 * rng()), 0.62 + 0.22 * (1 - f), base.clone().multiplyScalar(sh), tip.clone().multiplyScalar(sh));
        }
      }
      domes.push([v0, P.length / 3, d[0], 1.2, d[1]]);
      await ctx.yield();
    } else if (ring === 0) {     // pumpkin flower: five broad pointed petals and a green star under them
      const yaw0 = rng() * 6.28;
      for (let k = 0; k < 5; k++) { petal(d[0], 2.3, d[1], yaw0 + k * 1.2566, 0.42, 8.2, 3.3, 0.75, gold, yel); petal(d[0], 2.2, d[1], yaw0 + (k + 0.5) * 1.2566, 0.1, 5.2, 0.8, 0.3, grn, grn); }
      for (let k = 0; k < 9; k++) petal(d[0], 2.6, d[1], k * 0.698, 1.25, 2.6, 0.45, 0.2, orange, yel);
    }
  }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  geo.setAttribute('aT', new THREE.Float32BufferAttribute(A, 2)); geo.setIndex(I); geo.computeVertexNormals();
  { // the marigolds are shaded as soft domes: each petal's normal leans toward the dome's own
    const nr = geo.getAttribute('normal').array;
    for (const [v0, v1, cx, cy, cz] of domes) for (let i = v0; i < v1; i++) {
      let nx = nr[i * 3], ny = nr[i * 3 + 1], nz = nr[i * 3 + 2]; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const rx = P[i * 3] - cx, ry = P[i * 3 + 1] - cy, rz = P[i * 3 + 2] - cz, rl = Math.hypot(rx, ry, rz) || 1;
      nx = nx * 0.4 + (rx / rl) * 0.6; ny = ny * 0.4 + (ry / rl) * 0.6; nz = nz * 0.4 + (rz / rl) * 0.6; const l = Math.hypot(nx, ny, nz) || 1;
      nr[i * 3] = nx / l; nr[i * 3 + 1] = ny / l; nr[i * 3 + 2] = nz / l;
    }
  }
  const flowers = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      attribute vec3 color; attribute vec2 aT; varying vec3 vW, vN, vC;
      void main(){
        vec3 p = position; p.y += sin(uTime * 2.3 + aT.y + aT.x * 4.) * .16 * aT.x * aT.x;     // petal tips shiver
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * normal; vC = color;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      varying vec3 vW, vN, vC;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-3, 0.)); if (n.y < 0.) n = -n;
        float sun = sunAt(vW);
        float rib = vnoise(vW.xz * 2.3 + vW.y * 1.7) * .6 + vnoise(vW.xz * 7. + vW.y * 5.) * .4;
        vec3 col = vC * (.62 + .6 * rib) * (skyLight(n) * 1.15 + uSunCol * sun * (max(dot(n, uSunDir), 0.) * 1.4 + .35));
        gl_FragColor = vec4(col, 1.); ${FOG_F}
      }`,
  }));
  flowers.name = 'kolam-festival-flowers'; flowers.frustumCulled = false;
  // the coloured falls: three crossed streak sheets over each cell
  const fp = [], fc = [], fq = [], fi = [];
  cells.forEach((c, ci) => {
    const col = cellCols[Math.round(c.w) % 3];
    for (let k = 0; k < 3; k++) {
      const a = k * 1.047 + ci, dx = Math.cos(a) * 7.5, dz = Math.sin(a) * 7.5, b = fp.length / 3;
      for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { fp.push(c.x + dx * u, v * 58, c.y + dz * u); fc.push(col.r, col.g, col.b); fq.push(u, v, c.z, ci * 3.7 + k); }
      fi.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  });
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fgeo.setAttribute('color', new THREE.Float32BufferAttribute(fc, 3));
  fgeo.setAttribute('aQ', new THREE.Float32BufferAttribute(fq, 4)); fgeo.setIndex(fi);
  const falls = new THREE.Mesh(fgeo, new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      attribute vec3 color; attribute vec4 aQ; varying vec3 vC, vW; varying vec4 vQ; varying float vProg;
      void main(){
        vProg = clamp((uHead - 132. - aQ.z) / 150., 0., 1.);
        vec3 p = position; p.xz += vec2(sin(uTime * .9 + aQ.w), cos(uTime * .7 + aQ.w)) * 2.5 * aQ.y;
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vC = color; vQ = aQ;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition; ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      varying vec3 vC, vW; varying vec4 vQ; varying float vProg;
      void main(){
        float on = smoothstep(0., .08, vProg) * (1. - smoothstep(.8, 1., vProg));
        float fall = vQ.y * 58. + uTime * 11.;
        float st = vnoise(vec2(vQ.x * 6. + vQ.w, fall * .07)) * .6 + vnoise(vec2(vQ.x * 17. + vQ.w, fall * .2)) * .4;
        float a = on * (1. - vQ.x * vQ.x) * smoothstep(.3, .8, st) * (1. - smoothstep(.55, 1., vQ.y)) * .5;
        // a fall is a thin sheet of powder: seen from the side it is a streaked curtain; looked down on, from above the
        // knot, it thins to a haze over its cell (it must not stand up the picture as a solid stripe across ridge and
        // stone), and in the sun it pales
        float sun = sunAt(vW), down = smoothstep(.12, .4, normalize(cameraPosition - vec3(vW.x, 0., vW.z) + vec3(0., 1e-3, 0.)).y);     // (how steeply we look down on the foot of the fall, so the whole height of the sheet thins together)
        a *= (1. - .92 * down) * (1. - .3 * sun);
        if (a < .004) discard;
        gl_FragColor = vec4(mix(vC, vec3(dot(vC, vec3(.3, .5, .2))), .25 * sun) * (skyLight(vec3(0., .6, .5)) * .9 + uSunCol * sun * .5), a * .8); ${FOG_F}
      }`,
  }));
  falls.name = 'kolam-festival-falls'; falls.frustumCulled = false; falls.renderOrder = 4;
  return { flowers, falls };
}

// The gold glint of a bangle high in the haze, above the pouring point.
function makeGlint(U) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U,
    vertexShader: /* glsl */`
      uniform vec4 uPourer; uniform float uGlint; varying vec2 vC;
      uniform vec3 uGlintAt;
      void main(){ vC = position.xy; vec4 mv = viewMatrix * modelMatrix * vec4(uGlintAt, 1.);
        mv.xy += position.xy * min(5. + 5. * uGlint, -mv.z * .06) * step(.003, uGlint); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGoldCol; uniform float uGlint; varying vec2 vC;
      void main(){ float r2 = dot(vC, vC); float star = exp(-r2 * 9.) * 1.6 + exp(-abs(vC.y) * 26.) * exp(-abs(vC.x) * 2.6) + exp(-abs(vC.x) * 26.) * exp(-abs(vC.y) * 4.) * .6;
        gl_FragColor = vec4(uGoldCol * star * uGlint * 4.5 * (1. - smoothstep(.6, 1., r2)), 1.); }`,
  }));
  m.frustumCulled = false; m.renderOrder = 8; m.name = 'kolam-glint';
  return m;
}

// ---------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('kolam-hero') : ctx.rng, noise = ctx.noise;
  const vary = ctx.vary || {}, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).slice();
  const seedLook = Math.floor(rng() * 3) % 3;
  let look = opts.look ?? (vary.hour === 'day' ? 1 : vary.hour === 'golden' ? 2 : (vary.hour === 'dawn' || vary.hour === 'night') ? 0 : seedLook);
  if (typeof look === 'string') look = Math.max(0, ['loop', 'festival', 'yard'].indexOf(look));
  const rare = opts.rare ?? !!vary.rare;

  const shape = look === 2 ? traceLotus(rng) : traceKnot(rng);
  const K = buildCurve(shape, rng, noise, look, rare && look !== 2), L = K.L;
  await ctx.yield();
  const { kTex, dTex } = await makeTextures(K, ctx);
  await ctx.yield();

  const col = (h) => new THREE.Color(h), mix = (a, b, t) => col(a).lerp(col(b), t);
  const tw = (rng() - 0.5) * 0.12;                                   // a small seeded shift of the blues
  const skyTop = mix(pal[1], '#5a4fa0', 0.18 + tw), skyLow = col(pal[2]), house = col(pal[0]).multiplyScalar(0.42);
  // wet granite: a dark slate that leans a little warm, so that what colours it is the sky it mirrors
  let stoneA = mix(pal[0], '#2c2723', 0.5).multiplyScalar(1.02), stoneB = mix(pal[1], '#625a50', 0.55).multiplyScalar(0.86), moss = col('#22401f');
  if (look === 2) { stoneA = col('#3a2f20'); stoneB = col('#5a4a2e'); moss = col('#3a3a1c'); }
  const cellCols = [mix('#d6557c', pal[6], 0.25), col(pal[5]), col('#5f9a3c')];
  // the cells of the knot: 13 round the dots, 4 diamonds between them; each fills once the line has gone by
  const cells = [], rot = Math.floor(rng() * 3) % 3;
  const ready = (x, z) => { let m = 0; for (let i = 0; i < NPT; i += 4) if (Math.abs(K.X[i] - x) + Math.abs(K.Z[i] - z) < 30) m = Math.max(m, i * K.ds); return m; };
  for (const d of K.dots) { const ring = Math.round((Math.abs(d[0]) + Math.abs(d[1])) / SP); cells.push(new THREE.Vector4(d[0], d[1], ready(d[0], d[1]), (ring + rot) % 3)); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cells.push(new THREE.Vector4(sx * 20, sz * 20, ready(sx * 20, sz * 20), 12 + (rot + 2) % 3));
  await ctx.yield();

  const bites = []; for (let i = 0; i < 12; i++) bites.push(new THREE.Vector2(0, 0));
  const U = {
    uTime: { value: 0 }, uLand: { value: 0 }, uHead: { value: 72 }, uL: { value: L }, uDs: { value: K.ds }, uClosed: { value: K.closed ? 1 : 0 },
    uSun: { value: 0 }, uSunEdgeX: { value: 300 }, uSunDir: { value: new THREE.Vector3(0.99, 0.06, 0.12).normalize() },
    uSunCol: { value: col(pal[4]).multiplyScalar(1.0) }, uPeach: { value: col(pal[4]) }, uGoldCol: { value: col(pal[5]) },
    uSkyTop: { value: skyTop }, uSkyLow: { value: skyLow }, uHouse: { value: house }, uFlour: { value: col(pal[3]).multiplyScalar(0.86) },
    uStoneA: { value: stoneA }, uStoneB: { value: stoneB }, uMoss: { value: moss },
    uKTex: { value: kTex }, uDTex: { value: dTex }, uBites: { value: bites },
    uVeilK: { value: 1 }, uVeilT: { value: look === 2 ? new THREE.Vector2(1.7, 3.9) : new THREE.Vector2(4.2, 8.2) }, uGust: { value: 0 }, uGustDir: { value: new THREE.Vector3(-0.97, 0, -0.243) }, uRope: { value: 1 }, uGlint: { value: 0 }, uGold: { value: 0 },
    uPourer: { value: new THREE.Vector4(0, 0, 1, 0) }, uShadowLen: { value: look === 2 ? new THREE.Vector2(19, 16) : new THREE.Vector2(14.5, 14) }, uPxK: { value: 0.004 }, uGap: { value: new THREE.Vector4(0, 0, 0, 0) },
    uKaavi: { value: col('#8f3320') }, uRose: { value: col('#d48a92') }, uGapDot: { value: new THREE.Vector2(1e4, 1e4) }, uGapEnds: { value: new THREE.Vector4(1e4, 1e4, 1e4, 1e4) }, uGapK: { value: new THREE.Vector2(0, 0) },
    uLampCol: { value: col('#ff9a3c') }, uLamps: { value: Array.from({ length: 11 }, () => new THREE.Vector4(0, 30, -1e4, 0)) },
    uDawn: { value: 0 }, uGlintAt: { value: new THREE.Vector3(0, 66, 0) }, uFoot: { value: new THREE.Vector4(0, 0, 1, 0) }, uStep: { value: new THREE.Vector4(-200, 24, 20, 0) }, uLime: { value: col('#b6bac2') }, uOchre: { value: col('#743f36') },
    uEarth: { value: look === 2 ? 1 : 0 }, uFest: { value: look === 1 ? 1 : 0 }, uCells: { value: cells }, uCellCol: { value: cellCols },
  };

  const object = new THREE.Group(); object.name = 'kolam-at-dawn-hero';
  const flour = await makeFlour(K, U, ctx, noise); object.add(flour);
  await ctx.yield();
  const { rope, veil } = makeRopeAndVeil(U); object.add(veil, rope);
  await ctx.yield();
  const grains = makeGrains(U, rng, detail); object.add(grains);
  await ctx.yield();
  const glint = makeGlint(U); object.add(glint);
  let ground = null;
  if (opts.ground !== false) { ground = makeGround(U, opts.groundSize || 2400); object.add(ground); }
  await ctx.yield();
  const fest = await makeFestival(K, U, cells, cellCols, rng, pal, ctx);
  fest.flowers.visible = fest.falls.visible = look === 1; object.add(fest.flowers, fest.falls);
  await ctx.yield();

  // K on the CPU
  const pointAt = (s, out = new THREE.Vector3()) => {
    let f = s / K.ds; f = K.closed ? ((f % NPT) + NPT) % NPT : clamp(f, 0, NPT - 1);
    const i = Math.floor(f), j = K.closed ? (i + 1) % NPT : Math.min(i + 1, NPT - 1), t = K.ID[i] === K.ID[j] ? f - i : 0;
    return out.set(lerp(K.X[i], K.X[j], t), 0, lerp(K.Z[i], K.Z[j], t));
  };
  const landAt = (u) => L * (K.frac + (1 - K.frac) * (u / 0.74));
  let land = landAt(0), driven = false, landSet = false, glintFixed = false;
  const tmp = new THREE.Vector3(), size = new THREE.Vector2();
  const applyLand = (v) => {
    land = v; U.uHead.value = v + 72; U.uLand.value = Math.min(v, K.closed ? L + 10 : L);      // a closed line runs on over its own beginning: no stump at the join
    pointAt(Math.min(v + 72, L), tmp);
    const over = smoothstep(L - 20, L + 60, v);
    U.uPourer.value.set(tmp.x + 14, tmp.z + 26, 1 - over, 0); if (!glintFixed) U.uGlintAt.value.set(tmp.x + 14, 66, tmp.z + 26);
    U.uRope.value = 1 - 0.85 * smoothstep(L - 110, L - 10, v);
    pointAt(Math.min(v, L), tmp); U.uFoot.value.set(tmp.x, tmp.z, 1 - smoothstep(L - 60, L - 5, v), 0);
    U.uGust.value = K.gap ? smoothstep(K.gap.s0 - 105, K.gap.s0 - 25, v) * (1 - smoothstep(K.gap.s1 + 60, K.gap.s1 + 175, v)) : 0;
    if (K.gap) { U.uGap.value.z = smoothstep(K.gap.s0 - 30, K.gap.s1 + 20, v); U.uGapK.value.set(smoothstep(K.gap.s0 - 2, K.gap.s0 + 10, v), smoothstep(K.gap.s1 + 2, K.gap.s1 + 14, v)); }
  };
  const setSun = (k, edgeX) => { U.uSun.value = k; if (edgeX !== undefined) U.uSunEdgeX.value = edgeX; };
  const setGlint = (k) => { U.uGlint.value = k; };
  const progress = (u) => {
    applyLand(landAt(u));
    // the edge comes in fast, crosses the knot slowly (x +110 to -110) and runs on
    const e = u < 0.675 ? lerp(290, 110, clamp((u - 0.66) / 0.015, 0, 1)) : u < 0.765 ? lerp(110, -110, (u - 0.675) / 0.09) : lerp(-110, -320, clamp((u - 0.765) / 0.03, 0, 1));
    setSun(smoothstep(0.655, 0.675, u), e);
    setGlint(smoothstep(0.188, 0.196, u) * (1 - smoothstep(0.2, 0.222, u)));
    U.uGold.value = smoothstep(0.67, 0.74, u) * (1 - 0.75 * smoothstep(0.86, 0.98, u));
  };
  if (K.gap) {
    pointAt((K.gap.s0 + K.gap.s1) / 2, tmp); U.uGap.value.set(tmp.x, tmp.z, 0, 0);
    pointAt(K.gap.s0, tmp); U.uGapEnds.value.x = tmp.x; U.uGapEnds.value.y = tmp.z; pointAt(K.gap.s1, tmp); U.uGapEnds.value.z = tmp.x; U.uGapEnds.value.w = tmp.z;
    let bd = 1e9; for (const d of K.dots) { const q = Math.hypot(d[0] - tmp.x, d[1] - tmp.z); if (q < bd) { bd = q; U.uGapDot.value.set(d[0], d[1]); } }
  }
  progress(0);

  // The chase route: K itself from 30 m behind the landing point at u 0.05, for 300 m, lifted to y 8 and
  // smoothed with a 44 m running mean so that no turn is tight; the camera swings wide of the burst.
  const chase = [], sA = landAt(0.05) - 30, a = new THREE.Vector3(), HW = 22;
  for (let s = sA; s <= sA + 300.01; s += 25) {
    let x = 0, z = 0, n = 0;
    for (let o = -HW; o <= HW; o += 2) { pointAt(Math.min(s + o, L - 0.01), a); x += a.x; z += a.z; n++; }
    chase.push([x / n, 8, z / n]);
  }
  const under = pointAt(landAt(0.28) + 24, new THREE.Vector3()); under.y = 20;   // the rope is 20 m up here at u 0.28
  const flyThrough = [[-30, 8, 185], [-30, 8, 150], ...chase,
    [55, 30, 180], [30, 62, 240], [-25, 90, 262], [-60, 104, 235], [-35, 63, 112], [-10, 22, -10], [8, 9, -75], [4, 20, -150], [0, 34, -210], [0, 34, -270]];
  const anchors = {
    entry: new THREE.Vector3(-30, 8, 185), entryHeading: new THREE.Vector3(0, 0, -1),
    portalSeat: { position: new THREE.Vector3(0, 34, -270), facing: new THREE.Vector3(0, 0, 1) },
    flyThrough, chase, center: new THREE.Vector3(0, 0, 0),
    dots: K.dots.map((d) => new THREE.Vector3(d[0], 0, d[1])),
    gap: K.gap ? { s0: K.gap.s0, s1: K.gap.s1, at: pointAt((K.gap.s0 + K.gap.s1) / 2) } : null,
    viewpoints: { lookDown: new THREE.Vector3(-60, 104, 235), lowPass: new THREE.Vector3(8, 9, -75), under },
  };

  return {
    object, radius: 80, height: 44, center: new THREE.Vector3(0, 6, 0), anchors, ground: false, groundY: 0,
    look, lookName: ['loop', 'festival', 'yard'][look], rare: !!K.gap, L, frac: K.frac, uniforms: U, distTex: dTex, kTex,
    curve: { X: K.X, Z: K.Z, W: K.W, ds: K.ds, L, closed: K.closed, count: NPT },
    info: { turnedBack: shape.turned, loops: shape.loops, strokes: shape.strokes.length },
    pointAt, landAt,
    landing(out = new THREE.Vector3()) { return pointAt(Math.min(land, L), out); },
    setProgress(u) { driven = true; landSet = false; progress(u); },
    setLand(v) { landSet = true; applyLand(v); },
    setSun, setGlint,
    setGlintAt(x, y, z) { glintFixed = true; U.uGlintAt.value.set(x, y, z); },       // the world may stand the glint where its camera sees it
    setBite(i, s, r) { if (i >= 0 && i < 12) bites[i].set(s, r); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) {                 // nobody drives it (the set-piece viewer): play the whole piece on a 40 s loop
        const u = (0.05 + time * 0.0225) % 0.96;
        progress(u);
        if (u > 0.8 && !landSet) { const k = smoothstep(0.8, 0.9, u); bites[0].set(L * 0.31, 7 * k); bites[1].set(L * 0.64, 6 * k); } else if (!landSet) { bites[0].set(0, 0); bites[1].set(0, 0); }
      }
      if (camera) {
        let h = 900; if (ctx.renderer && ctx.renderer.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(size).y || 900;
        U.uPxK.value = (0.85 * 2) / (Math.max(0.2, camera.projectionMatrix.elements[5]) * h);
      }
    },
    dispose() { kTex.dispose(); dTex.dispose(); },
  };
}
