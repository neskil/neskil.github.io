// THE THOUSAND LAGOONS. The Lencois Maranhenses after the rains, flown as one black skimmer in a line of two
// hundred. The dunes are staggered so that every one is crossed obliquely, its slip face falling away to a lagoon,
// never met square-on, and the sun is always 54 to 134 degrees off the nose: in over lagoon 1 behind a rank of
// skimmers, between white sandbars and down to bill-in-the-water; a climb across the sunlit right horn of dune 1 with
// lagoons opening on every side; a swooping right turn onto lagoon 2 (a second skim, egrets crossing our bows) and a
// zoom over dune 2's left horn; down its back past the half-buried trunks with the buriti grove sliding by on the
// right; a climbing right turn onto the tall dune's left shoulder and a long ride ALONG ITS BRINK, plume streaming
// across us, lagoon 3 falling away on the right; a left turn over the 42 m summit to THE REVEAL, the dive among the
// falling line, and a long skim across lagoon 4 that lifts into the half-ring portal between two horn tips, its
// mirror image closing the ring.
// The hero part (src/parts/thousand-lagoons.js) is the whole sand-and-water sheet with its skimmer line, wakes
// and plumes; this file adds the sky and far dune rings, the mount (our own bill, red then black, along the bottom
// centre of every frame, its lower mandible dropping forty degrees as we skim, and two black wingtips beating at the
// frame's edges), terns, egrets / wood storks, a scarlet ibis skein, tetra shoals, sedge, the buriti grove standing in
// its dark pool with the palms' reflections, the buried trunks, blown sand and the veil of streamers at each crest,
// the squall curtain, the portal's mirror, the rare slab avalanche and a painted water plane under any portal camera
// (the engine clips the real one away). Everything is self-lit with the hero's sun uniforms; the two three.js lights
// exist only for companions. Nothing here is made by hands: no hut, no boats, no smoke.
// Our own cut is a knot of foam and spray where the opened lower mandible meets the water, its furrow laid back behind the bill (makeCut);
// streamers of sand peel off every authored brink in uneven groups of tapering wisps that curl downwind
// (makeStreamers); the grove is the subject of the middle of the flight (egrets striking in its dark water, terns
// plunging over it); the route dips to 7 m over the megarippled flats before it; parties of waders stand in the
// shallows of the pool margins beside the line, water or blue shadow behind them; the rare slab leaves a dark scarp
// under the brink.
// Looks (seed / ctx.vary.hour): afternoon | noon | clearing squall | full moon; season july | june (flood) |
// september (shrunk pools, more sand in the air); cast: terns or ibis skein, egrets or wood storks, 120-260
// skimmers by ctx.vary.density. Rare (ctx.vary.rare): a 120 m slab of the tall slip face lets go beneath us as we ride its brink.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath, makeRng } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, GLSL_BOWL, GLSL_SQUALL, SQUALL } from '../parts/thousand-lagoons.js';

const V3 = THREE.Vector3, TAU = Math.PI * 2;
const ZS = 630, ZE = -345, XS = -270;            // path runs from lagoon 1 (far left of the gate's axis: the dunes are staggered) to the gate
const DUR = 47, HI_RISE = 46;                     // the soar above the tall brink (metres over the summit pass)

const LOOKS = {
  // clean tropical blue paling to a milk-white horizon, small trade cumulus; the key is warm-white and the grade neutral (no yellow)
  afternoon: { sky: { preset: 'day', zenith: '#4a8bdc', horizon: '#d3e0ee', horizonPow: 9, scatter: 0.14, scatterColor: '#fff1e0', sunSize: 1.3, sunIntensity: 10, clouds: { coverage: 0.16, softness: 0.3, lit: '#ffffff' }, clouds2: false },
    fog: '#cfdbe9', dens: 0.00034, clouds: 30, cloudSize: [60, 140], exposure: 1.2, bloom: 0.22, sat: 1.1, contrast: 1.28, portal: '#c9fff1', veil: '#eef1f4' },
  noon: { sky: { preset: 'day', zenith: '#4486dc', horizon: '#d2e1f0', horizonPow: 9, scatter: 0.05, sunSize: 1.2, sunIntensity: 12, clouds: { coverage: 0.14, softness: 0.3 }, clouds2: false },
    fog: '#d3e1ef', dens: 0.00034, clouds: 24, cloudSize: [60, 140], exposure: 1.1, bloom: 0.26, sat: 1.12, contrast: 1.22, portal: '#d6fff4', veil: '#f0f3f5' },
  // the clearing squall: the same blue sky and cumulus, with the slate rain curtain (makeSquall) trailing across the dunes ahead-right
  squall: { sky: { preset: 'day', zenith: '#4484d6', horizon: '#c0cfe1', horizonPow: 7, scatter: 0.12, scatterColor: '#fff1e0', sunSize: 1.3, sunIntensity: 10,
      clouds: { coverage: 0.24, softness: 0.3, lit: '#ffffff', shade: '#7486a6', wind: [-0.004, 0.014] }, clouds2: false },
    fog: '#b9c8dc', dens: 0.0004, clouds: 22, cloudSize: [70, 170], exposure: 1.2, bloom: 0.22, sat: 1.1, contrast: 1.28, portal: '#d9fff0', veil: '#e6eaf0' },
  moon: { sky: { preset: 'night', zenith: '#050a1c', horizon: '#1c2a47', stars: 0.8, milkyWay: 0.5 },
    fog: '#141f38', dens: 0.00045, clouds: 8, cloudSize: [130, 280], exposure: 1.05, bloom: 0.55, sat: 1.0, contrast: 1.05, portal: '#bfe8ff', veil: '#2c3a56' },
};

// ---------------------------------------------------------------- shader commons
const LIGHT_GLSL = /* glsl */`
uniform vec3 uSun,uSunCol,uFill;
vec3 tlLit(vec3 alb, vec3 n, float sh){
  float ndl=max(dot(n,uSun),0.);
  return alb*(uFill*(0.62+0.3*n.y)+uSunCol*(1.-exp(-ndl*3.))*sh+uSunCol*0.2*max(-n.y,0.));
}`;
const NOISE_GLSL = /* glsl */`
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }`;
const FOGF_GLSL = /* glsl */`
#include <fog_pars_fragment>
float tlFog(){
  #ifdef FOG_EXP2
    return 1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    return 0.;
  #endif
}`;
function shader(U, vertexShader, fragmentShader, extra = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader, fragmentShader, fog: true, ...extra });
}
function instanced(base, attrs, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const n in base.attributes) g.setAttribute(n, base.attributes[n]);
  for (const n in attrs) g.setAttribute(n, new THREE.InstancedBufferAttribute(attrs[n][0], attrs[n][1]));
  g.instanceCount = count; return g;
}
function meshOf(geo, mat, name, order = 0) {
  const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; m.renderOrder = order; return m;
}
const QUAD = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };

// ---------------------------------------------------------------- the route
// One skimmer's afternoon: a roller-coaster of skims and high crossings. The sun stands 68 degrees left of upwind and
// no leg heads more than 14 degrees left of upwind, so it is always outside the frame and the land ahead is side lit.
// The hero staggers its authored dunes to the right as we go upwind, and every one is crossed obliquely:
//   A  in over lagoon 1 heading 14 degrees left of upwind, 26 m of bill-down skim between the sandbars, a climb across
//      dune 1's sunlit right horn (47 degrees off square) and down its back;
//   B  a swooping right turn onto lagoon 2: a skim toward dune 2's left horn and a zoom over it (70 degrees off square);
//   C  a left bend down dune 2's back, the palms on our right, and a climbing right turn onto the tall dune's left
//      shoulder: along its brink, a few metres above it, then THE SOAR: a zoom climb to a hundred metres over the
//      ridge (the high view: the dune sea as a pattern of pools), and a left turn down over the summit: THE REVEAL;
//   D  one long straight dive down its back among the falling line, flat out onto lagoon 4, 80 m of skim, up 3 m and
//      level through the gate.
// The plan is straights and arcs (heading in degrees right of upwind); the profile is height over the water by z
// (z falls all the way), eased between keys. The line is sampled every 3 m of ground, smoothed, and lifted until it
// clears sand by 2.5 m and water by 0.5 m everywhere.
const easeKeys = (K, z) => {            // K sorted by falling z: [z, value]; cosine ease between neighbours
  if (z >= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (z >= K[i][0]) { const t = (K[i - 1][0] - z) / (K[i - 1][0] - K[i][0]); return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * (t * t * (3 - 2 * t)); }
  return K[K.length - 1][1];
};
async function planPath(ctx, hero, amp) {
  const hA = hero.heightAt, W = hero.anchors.waterLevel, A = hero.anchors, cr = A.crests, zc = cr[2].position.z;
  const z1 = cr[0].position.z, z2 = cr[1].position.z;
  const k = clamp((Math.abs(amp) - 8) / 5, 0, 1), RAD = Math.PI / 180, thA = -14, th2 = 35 + 2 * k, thD = 3;
  // the tall dune's brink, from its left shoulder to near the summit (hero-local crest points), ridden 4.5 m to windward (the face falls away beyond the brink and takes a third of the frame, not half)
  const BR = []; for (let t = -0.92; t <= -0.02; t += 0.01) { const c = A.crestLine(2, t); BR.push([c.x, c.z]); }
  const trace = (iLeave, zA, probe) => {
    const X = [XS], Z = [ZS]; let x = XS, z = ZS, th = thA * RAD;
    const put = (nx, nz) => { let d = Math.hypot(nx - x, nz - z); while (d >= 0.5) { const f = 0.5 / d; x += (nx - x) * f; z += (nz - z) * f; X.push(x); Z.push(z); d -= 0.5; } };
    const go = (len) => { for (let d = 0; d < len - 1e-6; d += 0.5) { const st = Math.min(0.5, len - d); x += Math.sin(th) * st; z -= Math.cos(th) * st; X.push(x); Z.push(z); } };
    const turn = (to, R) => { const tot = to * RAD - th, n = Math.max(1, Math.ceil(Math.abs(tot) * R / 0.5)), dth = tot / n, st = Math.abs(tot) * R / n;
      for (let i = 0; i < n; i++) { th += dth * 0.5; x += Math.sin(th) * st; z -= Math.cos(th) * st; th += dth * 0.5; X.push(x); Z.push(z); } th = to * RAD; };
    go((z - zA) / Math.cos(th)); turn(th2, 55); if (probe) return { x, z };
    go(119); turn(thD, 80); go(Math.max(10, (z - 130) / Math.cos(th)));
    // a long easy curve onto the brink at the shoulder, then along it
    const OFF = 4.5, i0 = 8, q = BR[i0], qn = BR[i0 + 3], ql = Math.hypot(qn[0] - q[0], qn[1] - q[1]) || 1, tx = (qn[0] - q[0]) / ql, tz = (qn[1] - q[1]) / ql;
    const off = (i) => { const a = BR[Math.max(0, i - 2)], b = BR[Math.min(BR.length - 1, i + 2)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [BR[i][0] + (b[1] - a[1]) / l * OFF, BR[i][1] - (b[0] - a[0]) / l * OFF]; };
    const p3 = off(i0), L = 0.4 * Math.hypot(p3[0] - x, p3[1] - z), p0 = [x, z], p1 = [x + Math.sin(th) * L, z - Math.cos(th) * L], p2 = [p3[0] - tx * L, p3[1] - tz * L];
    for (let k = 1; k <= 60; k++) { const t = k / 60, m = 1 - t; put(m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]); }
    for (let i = i0 + 1; i <= iLeave; i++) { const o = off(i); put(o[0], o[1]); }
    const n = X.length; th = Math.atan2(X[n - 1] - X[n - 9], -(Z[n - 1] - Z[n - 9]));
    turn(0, 55);
    const xe = x; go(Math.max(0, z - ZE)); return { X, Z, xe };
  };
  // where we leave the brink is what brings the last leg onto the gate's axis: the furthest point whose turn ends left of it
  // leg B is laid through one point of dune 2's left horn, where its brink stands some 11 m over the water: the dune is
  // seeded (its horn tip wanders 40 m), and a line that met the very tip, or missed it, would look up the horn end-on
  const P2 = A.crestLine(1, -0.76), perp = (q) => (P2.x - q.x) * Math.cos(th2 * RAD) + (P2.z - q.z) * Math.sin(th2 * RAD);
  const e0 = perp(trace(0, 442, true)), e1 = perp(trace(0, 452, true)), zA = clamp(442 - e0 * 10 / ((e1 - e0) || 1e-3), 424, 486);
  let iLeave = 30, tr = trace(iLeave, zA);
  for (let i = BR.length - 1; i > 30; i -= 1) { const t2 = trace(i, zA); if (t2.xe <= 0) { iLeave = i; tr = t2; break; } if ((i & 7) === 0) await ctx.yield(); }
  { const dx = -tr.xe, n = tr.X.length; let k0 = 0; for (let i = 0; i < n; i++) if (tr.Z[i] > 40) k0 = i; for (let i = k0; i < n; i++) tr.X[i] += dx * Math.min(1, (i - k0) / 160); }   // the last metre or two of miss, eased in along the ride
  await ctx.yield();
  const TX = tr.X, TZ = tr.Z, TN = TX.length;
  const xAt = (z) => { if (z >= TZ[0]) return TX[0] + (z - TZ[0]) * Math.tan(thA * RAD) * -1; if (z <= TZ[TN - 1]) return TX[TN - 1]; let a = 0, b = TN - 1; while (b - a > 1) { const m = (a + b) >> 1; if (TZ[m] > z) a = m; else b = m; } return lerp(TX[a], TX[b], (TZ[a] - z) / Math.max(1e-6, TZ[a] - TZ[b])); };
  await ctx.yield();
  // where the track crosses the brinks of dune 1, dune 2 and the tall dune, and the water of lagoon 2 between them
  const top = (za, zb) => { let zt = za, ht = -1; for (let z = za; z <= zb; z += 1) { const h = hA(xAt(z), z); if (h > ht) { ht = h; zt = z; } } return [zt, ht]; };
  const [zB1, hB1] = top(z1 - 15, z1 + 90), [zB2, hB2] = top(z2 - 15, z2 + 80), [zCross, hB3] = top(zc - 20, zc + 40);
  await ctx.yield();
  let wA = zB1, wB = zB2;                                   // lagoon 2 along the track: from wA down to wB the water is at least 0.3 m deep
  { let run = 0, best = 0, start = 0; for (let z = zB1 - 20; z > zB2; z -= 1) { if (W - hA(xAt(z), z) > 0.3) { if (!run) start = z; run++; if (run > best) { best = run; wA = start; wB = z; } } else run = 0; } }
  const touch = wA - wB > 40;                               // room for a skim and the zoom climb after it
  const s0 = Math.min(wA - 5, 401), s1 = Math.max(wB + 12, s0 - 36);       // the skim on lagoon 2, straight out of the banked turn
  const yTop = hB3 + 10.5 - W, SK0 = -205, SK1 = -280;
  const b1 = hB1 - W, hp = (z) => Math.max(hA(xAt(z), z), W) - W;   // each climb tops its brink before the foot of the face, so the lagoons beyond show early
  // the brink beside the line (it lies to our left as we ride along the tall dune's shoulder)
  const hb = (z) => { let m = 0; const x = xAt(z); for (let d = -9; d <= 9; d += 1.5) m = Math.max(m, hA(x - 0.4 * d, z - 0.9 * d)); return m - W; };
  const YK = [[ZS, 0.55], [ZS - 37, 0.55], [zB1 + 24, b1 + 6], [zB1 + 2, b1 + 10.5], [zB1 - 16, b1 + 14], [470, 25]];
  if (touch) YK.push([s0, 0.55], [s1, 0.55], [zB2 + 14, hB2 + 4.5 - W]); else YK.push([(wA + wB) / 2, 10]);
  // over dune 2's horn and down its back beside the palms, then up onto the tall dune's left shoulder: from there the
  // line runs along the brink, a few metres above it, to the summit
  YK.push([zB2 - 3, hB2 + (touch ? 7.5 : 10.5) - W], [zB2 - 30, hp(zB2 - 30) + 8], [zB2 - 60, hp(zB2 - 60) + 8], [zB2 - 90, hp(zB2 - 90) + 8.5], [197, 7.0], [169, 13.6], [140, 14.5], [100, 20], [72, hb(72) + 8.5], [63, hb(63) + 9], [0, yTop + HI_RISE], [-10, yTop + HI_RISE - 1], [zCross - 4, yTop + 15], [zCross - 30, yTop + 3], [SK0, 0.55], [SK1, 0.55], [-303, 3.5]);
  // every 3 m of ground (the trace has a point every half metre)
  const n = Math.floor((TN - 1) / 6) + 1, px = new Float32Array(n), pz = new Float32Array(n), y = new Float32Array(n), lo = new Float32Array(n), t = new Float32Array(n);
  for (let i = 0; i < n; i++) { px[i] = TX[i * 6]; pz[i] = TZ[i * 6]; }
  px[n - 1] = 0; pz[n - 1] = ZE;
  for (let pass = 0; pass < 6; pass++) for (const q of [px, pz]) {          // round the joints between arcs and straights
    for (let i = 0; i < n; i++) t[i] = i < 6 || i > n - 22 ? q[i] : 0.25 * q[i - 1] + 0.5 * q[i] + 0.25 * q[i + 1];
    q.set(t);
  }
  const S = (x, z) => { const h = hA(x, z); return h > W ? h + 2.7 : W + 0.55; };
  await ctx.yield();
  for (let i = 0; i < n; i++) t[i] = S(px[i], pz[i]);
  await ctx.yield();
  const hold = new Uint8Array(n);                           // on the skims the line is pinned to the water, not smoothed off it
  for (let i = 0; i < n; i++) {
    const z = pz[i]; let m = t[i];
    for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) m = Math.max(m, t[j]);
    lo[i] = m; y[i] = Math.max(m, W + easeKeys(YK, z));
    if ((z <= ZS - 18 && z >= ZS - 34) || (touch && z <= s0 - 3 && z >= s1 + 3) || (z <= SK0 - 4 && z >= SK1 + 4)) hold[i] = 1;
    if (z < SK1) lo[i] = Math.min(lo[i], y[i]);
  }
  await ctx.yield();
  for (let pass = 0; pass < 10; pass++) {
    for (let i = 0; i < n; i++) t[i] = 0.25 * y[Math.max(0, i - 1)] + 0.5 * y[i] + 0.25 * y[Math.min(n - 1, i + 1)];
    for (let i = 0; i < n; i++) y[i] = hold[i] ? Math.max(lo[i], W + 0.55) : Math.max(t[i], lo[i]);
  }
  const pts = [], EVERY = 3;
  for (let i = 0; i < n; i += EVERY) pts.push(new V3(px[i], y[i], pz[i]));
  const last = pts[pts.length - 1]; if (last.z > ZE + 0.5) pts.push(new V3(0, W + 3.5, ZE)); else last.set(0, W + 3.5, ZE);
  // the entry: we come in 3.6 m up (a camera looking through a portal sees the rank of skimmers ahead from above, dark
  // on the turquoise with their wakes) and settle onto the water within twenty metres
  pts[0].y = W + 3.6; pts[1].y = Math.max(pts[1].y, W + 2.3); pts[2].y = Math.max(pts[2].y, W + 0.64);
  pts.splice(1, 0, new V3(lerp(pts[0].x, pts[1].x, 0.5), W + 3.21, lerp(pts[0].z, pts[1].z, 0.5)));
  let path = null; const v = new V3(), need = new Float32Array(pts.length);
  for (let it = 0; it < 7; it++) {
    path = makePath(pts, { samples: 620 }); need.fill(0); let bad = 0, q = 0;
    await ctx.yield();
    for (let d = 0; d <= path.length; d += 1.25) {
      path.posAtDist(d, v); const h = hA(v.x, v.z), miss = (h > W ? h + 2.5 : W + 0.5) - v.y;
      while (q < pts.length - 2 && Math.hypot(pts[q + 1].x - v.x, pts[q + 1].z - v.z) < Math.hypot(pts[q].x - v.x, pts[q].z - v.z)) q++;
      if (miss > 0) { bad++; need[q] = Math.max(need[q], miss + 0.12); if (q + 1 < pts.length) need[q + 1] = Math.max(need[q + 1], miss + 0.12); }
    }
    await ctx.yield();
    if (!bad) break;
    for (let i = 0; i < pts.length - 6; i++) pts[i].y += need[i];
  }
  await ctx.yield();
  const uAtZ = (z) => { let a = 0, b = 1; for (let i = 0; i < 22; i++) { const m = (a + b) / 2; if (path.pointAt(m, v).z > z) a = m; else b = m; } return (a + b) / 2; };
  return { path, xAt, uAtZ, zCross, zB: [zB1, zB2, zCross], skims: [[ZS - 14, ZS - 37], touch ? [s0, s1] : null, [SK0, SK1]] };
}

// ---------------------------------------------------------------- the gaze
// From the pull-up to the reveal the eye is tipped down along the heading (looking into each turn), further down the
// higher we are, so the horizon rides in the upper third and lagoons fill the rest.
//  - coming up under the tall dune's horn the turn would swing the nose onto its slip face: the eye is held 13 degrees
//    upwind of the heading there, on the lagoons beyond the horn, until we are on the brink (a second, later bump of 11
//    degrees keeps the face under a third of the frame as the brink ride begins);
//  - THE HIGH VIEW: half way along the brink we soar thirty metres above it, and the eye swings to a fixed bearing,
//    north-east across the summit ridge, and tips well down: the dune sea as a pattern of pools to the horizon;
//  - over the summit it drops onto lagoon 4 and the gate.
const HI_BEARING = 66, HI_PITCH = 20;
function makePois(path, uC, W) {
  const _g = new V3(), _g2 = new V3(), _gt = new V3(), c = uC[2], RAD = Math.PI / 180;
  const gaze = (time, u) => {
    path.pointAt(u, _g); path.pointAt(Math.min(1, u + 0.035), _g2);
    let hx = _g2.x - _g.x, hz = _g2.z - _g.z; const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
    const hi = smoothstep(c - 0.155, c - 0.105, u) * (1 - smoothstep(c - 0.05, c - 0.004, u));
    let yl = 0.23 * smoothstep(c - 0.25, c - 0.2, u) * (1 - smoothstep(c - 0.17, c - 0.1, u)) + 0.2 * smoothstep(c - 0.205, c - 0.175, u) * (1 - smoothstep(c - 0.14, c - 0.09, u));
    yl = lerp(yl, Math.atan2(hx, -hz) - HI_BEARING * RAD, hi);
    const cy = Math.cos(yl), sy = Math.sin(yl), hx2 = hx * cy + hz * sy; hz = -hx * sy + hz * cy; hx = hx2;
    const th = lerp(lerp(clamp(7 + 0.2 * (_g.y - W), 7, 16), 5, smoothstep(c - 0.04, c + 0.01, u)), HI_PITCH, hi) * RAD;
    return _gt.set(_g.x + hx * 100, _g.y - Math.tan(th) * 100, _g.z + hz * 100);
  };
  // THE ENTRY. For the first twenty metres the route sinks to the water and then zooms up over dune 1's horn, and a gaze
  // that only looks down the route would show sky. This first window holds the eye two and a half degrees below level, on
  // the lagoon, the rank and the dune (it solves for the target that gives that, given the look-ahead it is blended with),
  // and hands over to the gaze below as we climb.
  const _e0 = new V3(), _e1 = new V3(), _et = new V3(), EW = 1.6, AHEAD = 24;
  const entry = (time, u) => {
    path.pointAt(u, _e0); path.posAtDist(Math.min(path.length, u * path.length + AHEAD), _e1);
    _e1.sub(_e0); const al = _e1.length() || 1; _e1.multiplyScalar(1 / al);
    path.pointAt(Math.min(1, u + 0.035), _et); let hx = _et.x - _e0.x, hz = _et.z - _e0.z; const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
    const k = smoothstep(0.03, 0.07, u), pd = lerp(2.5, clamp(7 + 0.2 * (_e0.y - W), 7, 16), k) * RAD, cp = Math.cos(pd), sp = Math.sin(pd);
    const w = Math.max(0.2, EW * smoothstep(0, 0.04, u) * (1 - k));
    return _et.set(_e0.x + ((hx * cp - (1 - w) * _e1.x) / w) * 100, _e0.y + ((-sp - (1 - w) * _e1.y) / w) * 100, _e0.z + ((hz * cp - (1 - w) * _e1.z) / w) * 100);
  };
  return [
    { at: entry, from: -1, to: 0.07, weight: EW, fade: 0.0373832 },
    { at: gaze, from: 0.02, to: c + 0.05, weight: 0.85, fade: 0.085 },
    { at: new V3(0, W + 3, ZE), from: c - 0.04, to: 0.97, weight: 0.6, fade: 0.1 },
    { at: new V3(0, W + 4, -430), from: c + 0.004, to: 0.86, weight: 0.7, fade: 0.16 },   // over the top: the gaze drops at once onto the dune sea
  ];
}

// ---------------------------------------------------------------- far rings: scalloped dunes and pools to the haze
// Beyond the hero sheet: a sand floor (gridded, so it can follow the hero's far bowl), about 500 low crescents
// and the pool each one cups. Ahead of the tall crest the dunes are low and the pools long, so from 70 m up the
// land reads as white scales with a blue slip face and a turquoise pool apiece, out to the haze.
async function buildRings(ctx, rng, U, hero, detail) {
  const P = [], C = [], I = [], B = hero.anchors.bounds, W = hero.anchors.waterLevel;
  const NX = 6, NZ = 6, tanL = Math.tan(32 * Math.PI / 180);
  const rows = Math.round(24 * (0.6 + 0.4 * detail));
  for (let r = 0; r < rows; r++) {
    const z0 = 1000 - r * (3900 / rows);
    for (let x0 = -2750 + (r % 2) * 120; x0 < 2750; x0 += 232) {
      const cx = x0 + rng.range(-46, 46), cz = z0 + rng.range(-52, 52);
      if (cx > B.x0 + 60 && cx < B.x1 - 60 && cz > B.z0 + 70 && cz < B.z1 + 60) continue;
      const dist = Math.hypot(cx, cz + 200); if (dist > 2700) continue;
      const far = cz < -430 || Math.hypot(cx, cz) > 1500 || (cx > 560 && cz < 260), big = rng.chance(0.15);      // (east of the sheet too: that is where the high view looks)
      const Wd = rng.range(100, 150), H = far ? (big ? rng.range(12, 16) : rng.range(6, 10.5)) : (big ? rng.range(27, 36) : rng.range(15, 25)), bow = Wd * rng.range(0.5, 0.68);
      const base = P.length / 3, zf = H / tanL;
      // crescent: lateral columns, rows = foot of the slip face, brink, three steps down the back
      for (let i = 0; i <= NX; i++) {
        const a = i / NX * 2 - 1, aa = Math.abs(a), hc = H * Math.pow(1 - Math.pow(aa, 2.4), 0.9), zc = cz + bow * aa * aa;
        const prof = [[zc + hc / tanL, 0], [zc + 0.4, hc * 0.985], [zc, hc], [zc - hc * 0.9, hc * 0.72], [zc - hc * 2.2, hc * 0.36], [zc - hc * 4.2 - 5, 0]];
        for (let k = 0; k < NZ; k++) { P.push(cx + a * Wd, W - 0.3 + prof[k][1], prof[k][0]); C.push(0, k < 2 ? 0 : 0.5, 0); }
      }
      for (let i = 0; i < NX; i++) for (let k = 0; k < NZ - 1; k++) { const p = base + i * NZ + k, q = p + NZ; I.push(p, q, p + 1, p + 1, q, q + 1); }
      // its lagoon, cupped at the foot of the slip face: mint rim, turquoise body, teal heart
      const lb = P.length / 3, lx = Wd * (far ? rng.range(0.82, 1.15) : rng.range(0.6, 0.85)), lz = far ? rng.range(62, 96) : rng.range(34, 56), lc = cz + zf + lz * 0.72, deep = rng.range(0.5, 1), SG = 14;
      const wob = rng.range(0, TAU), em = 0.2 * Math.max(0, Math.sin(wob * 5.3));       // some pools run to emerald
      P.push(cx, W - 0.2, lc); C.push(em, 0, 1 + deep);
      for (let s = 0; s < SG; s++) { const an = s / SG * TAU, rr = 0.62 * (1 + 0.1 * Math.sin(an * 3 + wob)); P.push(cx + Math.cos(an) * lx * rr, W - 0.2, lc + Math.sin(an) * lz * rr); C.push(em, 0, 1 + deep * 0.55); }
      for (let s = 0; s < SG; s++) { const an = s / SG * TAU, rr = 1 + 0.13 * Math.sin(an * 3 + wob) + 0.07 * Math.sin(an * 5 - wob); P.push(cx + Math.cos(an) * lx * rr, W - 0.2, lc + Math.sin(an) * lz * rr); C.push(em, 0, 1); }
      for (let s = 0; s < SG; s++) { const n = (s + 1) % SG; I.push(lb, lb + 1 + n, lb + 1 + s, lb + 1 + s, lb + 1 + n, lb + 1 + SG + s, lb + 1 + n, lb + 1 + SG + n, lb + 1 + SG + s); }
    }
    await ctx.yield();      // a row of crescents per slice
  }
  // the skyline: two ranks of great star-dune ridges, pale blue in the haze, so the horizon is never an empty line
  for (let i = 0; i < 46; i++) {
    const rank = i % 2, a = -2.15 + 4.3 * ((i >> 1) + 0.5 * rank + rng.range(-0.3, 0.3)) / 23, dist = (rank ? 2080 : 1640) + rng.range(-110, 110);
    const cx = Math.sin(a) * dist, cz = -200 - Math.cos(a) * dist; if (cz > 700) continue;
    const Wd = rng.range(300, 520), H = rng.range(34, 58) * (rank ? 1.25 : 1), bow = Wd * rng.range(0.25, 0.5), base = P.length / 3;
    for (let i2 = 0; i2 <= NX; i2++) {
      const aa = i2 / NX * 2 - 1, ab = Math.abs(aa), hc = H * Math.pow(1 - Math.pow(ab, 2.2), 0.9) * (1 + 0.1 * Math.sin(aa * 4 + i)), zc = cz + bow * ab * ab;
      const prof = [[zc + hc / tanL, 0], [zc + 0.4, hc * 0.985], [zc, hc], [zc - hc * 0.9, hc * 0.72], [zc - hc * 2.2, hc * 0.36], [zc - hc * 4.2 - 5, 0]];
      for (let k = 0; k < NZ; k++) { P.push(cx + aa * Wd, W - 0.3 + prof[k][1], prof[k][0]); C.push(0, k < 2 ? 0 : 0.5, 0); }
    }
    for (let i2 = 0; i2 < NX; i2++) for (let k = 0; k < NZ - 1; k++) { const p = base + i2 * NZ + k, q = p + NZ; I.push(p, q, p + 1, p + 1, q, q + 1); }
  }
  await ctx.yield();
  // the sand floor everything stands on
  { const fb = P.length / 3, GN = 56, fy = W - 0.36;
    for (let k = 0; k <= GN; k++) for (let i = 0; i <= GN; i++) { P.push(-3400 + 6800 * i / GN, fy, 1500 - 5100 * k / GN); C.push(0.5, 0.5, 0); }
    for (let k = 0; k < GN; k++) for (let i = 0; i < GN; i++) { const a = fb + k * (GN + 1) + i, b = a + 1, c = a + GN + 1, d = c + 1; I.push(a, c, b, b, c, d); } }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  await ctx.yield();
  g.setAttribute('aK', new THREE.Float32BufferAttribute(C, 3));
  await ctx.yield();
  g.setIndex(I);
  await ctx.yield();
  g.computeVertexNormals();
  await ctx.yield();
  { const na = g.attributes.normal.array; for (let i = 0; i < na.length; i += 3) if (na[i + 1] < 0) { na[i] = -na[i]; na[i + 1] = -na[i + 1]; na[i + 2] = -na[i + 2]; } }
  const SH = hero.sheetUniforms;
  const m = shader({ ...U, uBounds: hero.uniforms.uBounds, uWater: hero.uniforms.uWater, uBowl: hero.uniforms.uBowl, uCloud: SH.uCloud, uNight: SH.uNight, uZen: SH.uZen, uSq: SH.uSq }, /* glsl */`
    attribute vec3 aK; varying vec3 vK; varying vec3 vN; varying vec3 vW;
    ${GLSL_BOWL}
    #include <fog_pars_vertex>
    void main(){ vK=aK; vN=normal; vec3 p=position; p.y+=bowlY(p.xz); vW=p; vec4 mvPosition=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    uniform vec3 uSand,uTurq,uTeal,uMint,uHor,uZen; uniform vec4 uBounds,uNight; uniform float uTime,uCloud;
    varying vec3 vK; varying vec3 vN; varying vec3 vW;
    ${LIGHT_GLSL}
    ${NOISE_GLSL}
    ${FOGF_GLSL}
    ${GLSL_SQUALL}
    float fbm3(vec2 p){ return vn(p)*.5+vn(p*2.03+17.)*.3+vn(p*4.1+41.)*.2; }
    void main(){
      vec3 n=normalize(vN+vec3(0.,1e-4,0.)); vec2 xz=vW.xz;
      // under the hero sheet the floor and pools are never wanted (a portal camera's near plane can cut the sheet open above them)
      if((vK.x>0.25||vK.z>0.5)&&xz.x>uBounds.x+25.&&xz.x<uBounds.y-25.&&xz.y>uBounds.z+25.&&xz.y<uBounds.w-25.) discard;
      float slip=(1.-smoothstep(0.05,0.3,vK.y))*step(vK.z,0.5);
      float cs=1.-uCloud*smoothstep(.60,.72,fbm3(vec2(xz.x*0.0052+xz.y*0.0016,xz.y*0.0058-uTime*0.052)));
      // under the squall the rain takes most of the sun and the sand is wet: a shade darker and bluer
      float sq=sqK(xz); vec3 wetSq=mix(vec3(1.),vec3(0.80,0.845,0.91),sq);
      cs*=1.-0.62*sq;
      float ndl=max(dot(n,uSun),0.);
      float sh=cs*(1.-slip*(1.-smoothstep(0.16,0.42,ndl))*(1.-step(0.2,uNight.x)));          // slip faces turned from the sun stand in their own blue shadow (the moon silvers them)
      float sunT=(1.-exp(-ndl*5.4))*sh, shade=1.-sunT;
      vec3 col=uSand*(0.95+0.05*vn(xz*0.03))*(uFill*mix(0.26,0.96,shade)*(0.7+0.3*n.y)*mix(vec3(1.),vec3(0.97,1.06,1.24),shade)+uSunCol*sunT*0.84);
      float fk=1.;
      if(vK.z>0.5){
        float d=vK.z-1.;
        vec3 wc=mix(uMint,uTurq,smoothstep(0.05,0.26,d)); wc=mix(wc,uTeal,smoothstep(0.36,0.9,d));
        wc=mix(wc,wc*vec3(0.70,1.10,0.76)+vec3(0.,0.015,0.),smoothstep(0.05,0.15,vK.x)*0.85*(1.-uNight.x*3.));
        col=wc*mix(vec3(0.44,0.57,0.76),vec3(1.04),cs);
        col=mix(col,uSand*vec3(0.50,0.64,0.86)*(uFill*0.5+uSunCol*0.5*cs),(1.-smoothstep(0.025,0.075,d))*0.85*(1.-uNight.x*3.));      // the shoreline: a dark wet rim round every pool
        col=mix(col,mix(uHor,uZen,0.4),uNight.x*uNight.z+0.05);
        col+=uSunCol*step(0.93,vn(xz*0.35+uTime*vec2(.9,1.7)))*0.3*cs*smoothstep(0.1,0.3,d);
        fk=0.42;
      }
      #ifdef USE_FOG
        // where the rings meet the hero sheet both dissolve into plain lit sand, so no seam shows
        vec2 o=max(max(uBounds.x-xz.x,xz.x-uBounds.y),0.)*vec2(1.,0.)+vec2(0.,max(max(uBounds.z-xz.y,xz.y-uBounds.w),0.));
        float sF=(1.-exp(-max(uSun.y,0.)*5.4))*cs;
        col=mix(col,uSand*0.95*(uFill*mix(0.26,0.96,1.-sF)*mix(vec3(1.),vec3(0.97,1.06,1.24),1.-sF)+uSunCol*sF*0.84),1.-smoothstep(0.,70.,length(o)))*wetSq;
        float ff=max(tlFog()*fk,smoothstep(2250.,2700.,length(xz+vec2(0.,200.))));
        col=mix(col,fogColor,ff);
      #endif
      gl_FragColor=vec4(col,1.);
    }`, { side: THREE.DoubleSide });
  return meshOf(g, m, 'far-dune-rings');
}

// ---------------------------------------------------------------- birds: terns, egrets / wood storks, ibis
// One builder, two poses per vertex: `position` = standing (origin at the feet), `aAlt` = flying (origin at the
// body centre, forward -Z). aAnim = (side, span fraction, part: 0 body 1 wing, chord). Rings are
// [flyY, flyZ, radius, top colour, bottom colour, standY, standZ]; without stand values the body tilt is used.
const WH = [0.8, 0.8, 0.78], BK = [0.03, 0.03, 0.035];
const tiltS = (y, z) => { const c = Math.cos(0.61), s = Math.sin(0.61); return [y * c - z * s + 0.55, z * c + y * s + 0.05]; };
const BIRD_SPECS = {
  wader: (stork) => {
    const N = stork ? [0.12, 0.115, 0.11] : WH, B = stork ? [0.22, 0.19, 0.14] : [0.86, 0.6, 0.07], L = [0.05, 0.05, 0.05];
    const neck = stork
      ? [[0.03, -0.34, 0.04, N, N, 0.8, -0.14], [0.045, -0.47, 0.036, N, N, 0.92, -0.1], [0.055, -0.58, 0.036, N, N, 1.01, -0.13], [0.06, -0.66, 0.046, N, N, 1.06, -0.18], [0.05, -0.73, 0.03, B, B, 1.045, -0.25], [0.0, -0.95, 0.006, B, B, 0.95, -0.43]]
      : [[0.075, -0.3, 0.036, N, N, 0.8, -0.14], [0.118, -0.24, 0.034, N, N, 0.92, -0.09], [0.146, -0.3, 0.032, N, N, 1.02, -0.13], [0.152, -0.39, 0.04, N, N, 1.07, -0.17], [0.146, -0.45, 0.02, B, B, 1.06, -0.23], [0.135, -0.6, 0.003, B, B, 1.02, -0.38]];
    return { stands: true,
      body: [[0, 0.29, 0.012, WH, WH], [0, 0.2, 0.06, WH, WH], [0, 0.03, 0.1, WH, WH], [0, -0.12, 0.095, WH, WH], [0.01, -0.22, 0.06, WH, WH], ...neck],
      legs: [[-0.04, 0.14, 0.014, L, L, 0.5, 0.13], [-0.035, 0.45, 0.011, L, L, 0.26, 0.155], [-0.03, 0.74, 0.012, L, L, 0.0, 0.12], [-0.03, 0.82, 0.004, L, L, 0.0, 0.02]],
      wing: { root: 0.07, half: 0.74, y: 0.03, le: -0.17, sweep: 0.18, chord: [0.27, 0.31, 0.29, 0.23, 0.14, 0.03], col: (r, c) => (stork && (c > 0.6 || r > 0.8) ? BK : WH) },
      tail: [0.05, 0.1, 0, stork ? BK : WH] };
  },
  tern: () => {
    const G = [0.5, 0.53, 0.58], Y = [0.9, 0.7, 0.08], K = BK;
    return { stands: false,
      body: [[0, 0.2, 0.008, G, WH], [0, 0.11, 0.04, G, WH], [0, -0.02, 0.058, G, WH], [0.003, -0.13, 0.052, G, WH], [0.008, -0.2, 0.042, K, WH], [0.01, -0.245, 0.036, K, WH], [0.006, -0.28, 0.02, Y, Y], [-0.004, -0.37, 0.004, Y, Y]],
      wing: { root: 0.04, half: 0.46, y: 0.02, le: -0.1, sweep: 0.3, chord: [0.115, 0.13, 0.115, 0.09, 0.055, 0.01], col: (r, c) => (r > 0.62 ? [0.06, 0.06, 0.07] : c > 0.8 ? WH : G) },
      tail: [0.07, 0.16, 0.45, WH] };
  },
  ibis: () => {
    const R = [0.8, 0.055, 0.03], D = [0.5, 0.045, 0.03];
    return { stands: false,
      body: [[0, 0.24, 0.01, R, R], [0, 0.15, 0.05, R, R], [0, 0.02, 0.075, R, D], [0, -0.1, 0.07, R, D], [0.01, -0.18, 0.045, R, R], [0.03, -0.32, 0.026, R, R], [0.045, -0.43, 0.024, R, R], [0.05, -0.5, 0.032, R, R], [0.04, -0.55, 0.014, D, D], [-0.02, -0.72, 0.003, D, D]],
      legs: [[-0.03, 0.12, 0.01, D, D], [-0.025, 0.36, 0.008, D, D], [-0.02, 0.52, 0.004, D, D]],
      wing: { root: 0.055, half: 0.5, y: 0.025, le: -0.13, sweep: 0.2, chord: [0.2, 0.23, 0.21, 0.17, 0.1, 0.02], col: (r) => (r > 0.88 ? BK : R) },
      tail: [0.04, 0.08, 0, R] };
  },
};
function birdGeo(S) {
  const P = [], Q = [], N = [], C = [], A = [], I = [];
  const add = (st, fl, n, c, a0 = 0, a1 = 0, a2 = 0, a3 = 0) => { P.push(st[0], st[1], st[2]); Q.push(fl[0], fl[1], fl[2]); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2]); A.push(a0, a1, a2, a3); return P.length / 3 - 1; };
  const pose = (y, z) => (S.stands ? tiltS(y, z) : [y, z]);
  const tube = (rings, sides, x0) => {
    const start = P.length / 3, n = rings.length;
    const fl = rings.map((r) => [r[0], r[1]]), st = rings.map((r) => (r.length > 5 ? [r[5], r[6]] : pose(r[0], r[1])));
    const up = (pts, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], ty = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(ty, tz) || 1; return [tz / l, -ty / l]; };
    for (let i = 0; i < n; i++) {
      const uf = up(fl, i), us = up(st, i), r = rings[i][2];
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * TAU, cx = Math.sin(a), cy = Math.cos(a), x = x0 + cx * r * 0.85;
        add([x, st[i][0] + us[0] * cy * r, st[i][1] + us[1] * cy * r], [x, fl[i][0] + uf[0] * cy * r, fl[i][1] + uf[1] * cy * r], [cx, uf[0] * cy, uf[1] * cy], uf[0] * cy > 0.25 ? rings[i][3] : rings[i][4]);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) { const a = start + i * sides + s, b = start + i * sides + (s + 1) % sides, c = a + sides, d = b + sides; I.push(a, c, b, b, c, d); }
  };
  tube(S.body, 7, 0);
  if (S.legs) { tube(S.legs, 3, -0.035); tube(S.legs, 3, 0.035); }
  const W = S.wing, stn = [0, 0.22, 0.45, 0.68, 0.86, 1];
  for (const sd of [-1, 1]) {
    const rows = stn.map((r, i) => {
      const x = sd * (W.root + r * W.half), le = W.le + W.sweep * Math.pow(Math.max(0, r - 0.4), 1.6) - 0.05 * Math.sin(Math.min(1, r / 0.4) * 1.57), ch = W.chord[i];
      return [0, 0.45, 1].map((c) => {
        const t = pose(W.y - 0.02 - r * 0.07 - c * 0.07 * (1 - r), W.le + 0.04 + r * W.half * 0.62 + c * 0.03);
        return add([sd * (W.root * 0.9 + 0.012 - r * 0.03), t[0], t[1]], [x, W.y + (c === 0.45 ? 0.012 * (1 - r) : 0), le + ch * c], [0, 1, 0], W.col(r, c), sd, r, 1, c);
      });
    });
    for (let i = 0; i < rows.length - 1; i++) for (let k = 0; k < 2; k++) { const a = rows[i][k], b = rows[i + 1][k], c = rows[i + 1][k + 1], d = rows[i][k + 1]; I.push(a, b, c, a, c, d); }
  }
  { // tail fan
    const [w, len, fork, col] = S.tail, zt = S.body[0][1] - 0.03, T = (x, z) => { const t = pose(0.004, z); return add([x, t[0], t[1]], [x, 0.004, z], [0, 1, 0], col); };
    const t0 = T(0, zt), tl = T(-w, zt + len), tm = T(0, zt + len * (1 - fork)), tr = T(w, zt + len), ta = T(-w * 0.35, zt), tb = T(w * 0.35, zt);
    I.push(ta, tl, tm, ta, tm, t0, t0, tm, tb, tb, tm, tr);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAlt', new THREE.Float32BufferAttribute(Q, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
  return g;
}
const BIRD_VERT = /* glsl */`
attribute vec3 aAlt; attribute vec3 aCol; attribute vec4 aAnim; attribute vec4 iPos, iPose, iMisc;
uniform float uRoot,uHalf;
varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying float vPart;
#include <fog_pars_vertex>
void main(){
  float fly=iPose.x; vec3 p=aAlt, n=normal;
  if(aAnim.z>0.5){
    float r=aAnim.y, sd=aAnim.x, d=abs(aAlt.x)-uRoot, fold=iMisc.z;
    float th=iMisc.w+iPose.z*sin(iPose.y-r*1.3);
    float th2=th+(iPose.z*0.6*sin(iPose.y-1.2)-0.15-0.5*fold)*smoothstep(0.35,1.,r);
    float di=min(d,uHalf*0.45), dq=max(d-uHalf*0.45,0.);
    p.x=sd*(uRoot+(di*cos(th)+dq*cos(th2))*(1.-0.45*fold));
    p.y=aAlt.y+di*sin(th)+dq*sin(th2);
    p.z=aAlt.z+dq*fold*1.1+di*fold*0.25;
    float an=mix(th,th2,step(0.45,r)); n=vec3(-sd*sin(an),cos(an),0.);
  }
  p=mix(position,p,fly);
  float cp=cos(iPose.w), sp=sin(iPose.w); p.yz=vec2(p.y*cp-p.z*sp,p.z*cp+p.y*sp); n.yz=vec2(n.y*cp-n.z*sp,n.z*cp+n.y*sp);
  float cr=cos(iMisc.y), sr=sin(iMisc.y); p.xy=vec2(p.x*cr-p.y*sr,p.x*sr+p.y*cr); n.xy=vec2(n.x*cr-n.y*sr,n.x*sr+n.y*cr);
  float cy=cos(iPos.w), sy=sin(iPos.w); p.xz=vec2(p.x*cy+p.z*sy,p.z*cy-p.x*sy); n.xz=vec2(n.x*cy+n.z*sy,n.z*cy-n.x*sy);
  vec3 w=iPos.xyz+p*iMisc.x;
  vCol=aCol; vN=n; vPart=aAnim.z; vV=cameraPosition-w;
  vec4 mvPosition=viewMatrix*vec4(w,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying float vPart;
${LIGHT_GLSL}
#include <fog_pars_fragment>
void main(){
  vec3 n=normalize(vN+vec3(0.,1e-4,0.)), V=normalize(vV+vec3(0.,1e-4,0.));
  if(vPart>0.5&&dot(n,V)<0.) n=-n;
  float nv=max(dot(n,V),0.);
  vec3 col=vCol*(uFill*1.2*(0.7+0.3*n.y)+uSunCol*(1.-exp(-max(dot(n,uSun)*0.75+0.25,0.)*3.))+uSunCol*0.2*max(-n.y,0.));
  col=col*(0.85+0.15*nv)+vCol*uSunCol*0.22*pow(1.-nv,3.);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;
// a kind of bird: `count` instances posed from the CPU every frame (a few dozen at most)
function makeBirds(spec, count, U, name) {
  const base = birdGeo(spec), iPos = new Float32Array(count * 4), iPose = new Float32Array(count * 4), iMisc = new Float32Array(count * 4);
  const geo = instanced(base, { iPos: [iPos, 4], iPose: [iPose, 4], iMisc: [iMisc, 4] }, count);
  const mat = shader({ ...U, uRoot: { value: spec.wing.root }, uHalf: { value: spec.wing.half } }, BIRD_VERT, BIRD_FRAG, { side: THREE.DoubleSide });
  const mesh = meshOf(geo, mat, name);
  return { mesh, base, count, triangles: base.index.count / 3 * count,
    // x,y,z,yaw | fly,phase,amp,pitch | scale,roll,fold,bias
    set(i, x, y, z, yaw, fly, phase, amp, pitch, scale, roll = 0, fold = 0, bias = 0.1) {
      const k = i * 4; iPos[k] = x; iPos[k + 1] = y; iPos[k + 2] = z; iPos[k + 3] = yaw;
      iPose[k] = fly; iPose[k + 1] = phase % TAU; iPose[k + 2] = amp; iPose[k + 3] = pitch;
      iMisc[k] = scale; iMisc[k + 1] = roll; iMisc[k + 2] = fold; iMisc[k + 3] = bias;
    },
    commit() { for (const n of ['iPos', 'iPose', 'iMisc']) geo.attributes[n].needsUpdate = true; } };
}

// ---------------------------------------------------------------- splash sprites: crown (0), ring on the water (1), puff (2)
function makeSplashes(count, U) {
  const iS = new Float32Array(count * 4).fill(-1), iT = new Float32Array(count * 4);
  const geo = instanced(QUAD(), { iS: [iS, 4], iT: [iT, 4] }, count);
  const mat = shader(U, /* glsl */`
    attribute vec4 iS, iT; varying vec2 vUv; varying vec4 vP;
    #include <fog_pars_vertex>
    void main(){
      float age=iS.w, k=iT.y, life=k>1.5?2.6:1.15, f=clamp(age/life,0.,1.);
      vec3 c=vec3(iS.x,iT.w,iS.z); vec4 mvPosition;
      if(k>0.5&&k<1.5){ float r=iT.x*(0.5+2.6*f); mvPosition=viewMatrix*vec4(c+vec3(position.x*r,0.04,position.y*r),1.); }
      else if(k<0.5){ float wd=iT.x*(0.4+0.9*f), ht=iT.x*(0.2+1.7*sin(3.1416*min(f*1.2,1.)));
        mvPosition=viewMatrix*vec4(c,1.); mvPosition.xy+=vec2(position.x*wd,(position.y+1.)*0.5*ht); }
      else { float s=iT.x*(0.7+1.3*f); mvPosition=viewMatrix*vec4(c+vec3(0.,iT.x*(0.25+0.5*f),f*iT.x*2.),1.); mvPosition.xy+=position.xy*s*vec2(1.9,0.72); }
      vUv=position.xy; vP=vec4(age<0.?-1.:f,k,iT.z+iS.y,k>1.5?smoothstep(4.,10.,-mvPosition.z):1.);
      gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    varying vec2 vUv; varying vec4 vP;
    uniform vec3 uSunCol,uFill;
    ${NOISE_GLSL}
    #include <fog_pars_fragment>
    void main(){
      float f=vP.x, k=vP.y, a=0.; if(f<0.) discard;
      if(k>0.5&&k<1.5){ float r=length(vUv); a=smoothstep(.55,.8,r)*(1.-smoothstep(.86,1.,r))*(1.-f)*0.8; }
      else if(k<0.5){ float yy=vUv.y*.5+.5; float env=1.-smoothstep(.55,1.,abs(vUv.x)/(.3+.7*yy));
        float dr=smoothstep(.38,.62,vn(vUv*vec2(6.,9.)+vP.z*17.+vec2(0.,-f*5.)));
        a=env*(1.-yy*yy)*mix(1.,dr,smoothstep(.1,.6,yy))*(1.-f*f)*1.1; }
      else { float r2=dot(vUv,vUv), er=vn(vUv*vec2(2.6,3.4)+vP.z*9.)*0.6+vn(vUv*vec2(6.,8.)+vP.z*5.)*0.4;
        a=max(exp(-r2*3.2)-0.06,0.)*smoothstep(0.25,0.7,er+0.35*(1.-r2))*sin(3.1416*sqrt(clamp(f,0.,1.)))*0.6*vP.w; }
      vec3 col=vec3(0.95)*(uFill*0.6+uSunCol*(k>1.5?0.85:1.15));
      gl_FragColor=vec4(col,clamp(a,0.,1.));
      #include <fog_fragment>
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = meshOf(geo, mat, 'splashes', 4);
  return { mesh, count,
    set(i, x, y, z, age, size, kind, seed = 0) { const k = i * 4; iS[k] = x; iS[k + 1] = seed; iS[k + 2] = z; iS[k + 3] = age; iT[k] = size; iT[k + 1] = kind; iT[k + 2] = seed; iT[k + 3] = y; },
    commit() { geo.attributes.iS.needsUpdate = true; geo.attributes.iT.needsUpdate = true; } };
}

// ---------------------------------------------------------------- the mount: our own bill and wingtips
// We are one skimmer of the line. What shows of us, in every frame of whatever shape: the knife-thin bill, red then black,
// lying whole along the bottom centre (its base just clear of the frame's foot, the whole of it under a tenth of the frame's
// height), and the two black wingtips that flick in at the left and right edges at mid height on every beat. Skimming, the
// lower mandible drops 40 degrees: its tip comes down to the very foot of the frame, where it cuts the water (makeCut puts
// the foam and the spray exactly there). The bill is built in the camera's own space from the projection in use, so it sits
// in the same place on any screen; update() scales the rig about the eye, which changes nothing in the picture, until
// the opened tip rides in the water. uSkim 0..1 opens the bill; uBeat (phase, depth, fold) drives the wings.
function makeMount(U, red) {
  const group = new THREE.Group(); group.name = 'mount';
  const mu = { ...U, uSkim: { value: 0 }, uP: { value: new THREE.Vector3(0.936, 1.664, 0.6) }, uCamM: { value: new THREE.Matrix4() }, uBeat: { value: new V3(0, 1, 0) } };
  { // bill: two knife blades, hexagonal section; position = (section x, section y, t along), aB = (t, part, section y)
    const P = [], N = [], A = [], I = [];
    const blade = (part) => {
      const start = P.length / 3, SEG = 9;
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG, sec = [[0, 1, 0, 1], [1, 0.35, 0.92, 0.38], [0.8, -0.5, 0.95, -0.3], [0, -1, 0, -1], [-0.8, -0.5, -0.95, -0.3], [-1, 0.35, -0.92, 0.38]];
        for (const q of sec) { P.push(q[0], q[1], t); N.push(q[2], q[3], 0.05); A.push(t, part, q[1]); }
      }
      for (let i = 0; i < SEG; i++) for (let q = 0; q < 6; q++) { const a = start + i * 6 + q, b = start + i * 6 + (q + 1) % 6, c = a + 6, d = b + 6; I.push(a, c, b, b, c, d); }
    };
    blade(0); blade(1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
    const m = shader({ ...mu, uRed: { value: new V3(red.r, red.g, red.b) } }, /* glsl */`
      attribute vec3 aB; uniform float uSkim; uniform vec3 uP; uniform mat4 uCamM; varying vec3 vB; varying vec3 vN; varying vec3 vV;
      void main(){
        float t=aB.x, low=step(0.5,aB.y), zb=uP.z;
        // base at 0.93 of the way to the frame's foot; the upper mandible runs straight ahead, the lower a third longer
        vec3 base=vec3(0.,-0.93/uP.y-0.012*low,-1.)*zb;
        float len=mix(0.185,0.246,low)*zb, op=low*(0.035+0.663*uSkim), co=cos(op), so=sin(op);
        vec3 ax=vec3(0.,-so,-co), up=vec3(0.,co,-so);
        float k=pow(1.-t,0.75)*0.88+0.12;
        float hw=0.0125*zb*(0.25+0.75*k)*mix(1.,0.62,low), hh=mix(0.022,0.014,low)*zb*k;
        vec3 pv=base+ax*len*t+vec3(position.x*hw,0.,0.)+up*position.y*hh;
        vec3 nv=normalize(vec3(normal.x,0.,0.)+up*normal.y+vec3(0.,0.,0.05));
        vB=aB; vN=mat3(uCamM)*nv; vV=-(mat3(uCamM)*pv);
        gl_Position=projectionMatrix*vec4(pv,1.);
      }`, /* glsl */`
      uniform vec3 uRed; varying vec3 vB; varying vec3 vN; varying vec3 vV;
      ${LIGHT_GLSL}
      ${NOISE_GLSL}
      void main(){
        vec3 n=normalize(vN+vec3(0.,1e-4,0.)), V=normalize(vV+vec3(0.,1e-4,0.));
        float t=vB.x+0.03*(vn(vec2(vB.z*9.,vB.x*30.))-.5);
        vec3 alb=mix(uRed*(0.95+0.25*vB.z),vec3(0.03,0.028,0.035),smoothstep(0.42,0.52,t+0.06*vB.y));
        alb*=0.88+0.12*sin(vB.z*26.+vn(vec2(vB.x*40.,3.))*3.);          // growth ridges along the blade
        alb=mix(alb,alb*0.55,smoothstep(0.75,1.,abs(vB.z))*0.6);          // darker cutting edges
        float sp=pow(max(dot(reflect(-uSun,n),V),0.),36.)+0.25*pow(1.-max(dot(n,V),0.),4.);
        gl_FragColor=vec4(tlLit(alb,n,1.)+alb*uFill*0.25+uSunCol*sp*0.4,1.);
      }`, { side: THREE.DoubleSide, fog: false, depthFunc: THREE.AlwaysDepth });
    group.add(meshOf(g, m, 'bill', 8));
  }
  { // wingtips: three black primaries a side, drawn straight into the frame: the tip comes in from the edge at mid height on the
    // upstroke of each beat (five or six hundredths of the frame's width), rises a little and is gone again
    const P = [], A = [], I = [], SEG = 8;
    for (const sd of [-1, 1]) for (let f = 0; f < 3; f++) {
      const st = P.length / 3;
      for (let i = 0; i <= SEG; i++) { const a = i / SEG; P.push(a, -1, 0, a, 1, 0); A.push(sd, f, a, -1, sd, f, a, 1); }
      for (let i = 0; i < SEG; i++) { const q = st + i * 2; I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
    const m = shader(mu, /* glsl */`
      attribute vec4 aW; uniform vec3 uBeat,uP; varying vec4 vW; varying float vS;
      void main(){
        float sd=aW.x, f=aW.y, a=aW.z, b=aW.w;
        float s=pow(0.5+0.5*sin(uBeat.x-0.35*f),1.3)*uBeat.y*(1.-uBeat.z);          // how far in this feather's tip is
        float asp=uP.y/uP.x;                                                        // frame width over height
        // the tip, in frame units of height (x from the edge inward, y from mid height); the feather runs back out to its root
        vec2 tip=vec2(-0.14*s+0.035+0.034*f,0.03+0.15*s-0.036*f+0.1*uBeat.z);
        vec2 dir=normalize(vec2(1.,-0.36-0.1*f));
        vec2 q=tip+dir*a*0.36+vec2(dir.y,-dir.x)*b*0.019*sqrt(max(a,0.))*(1.+0.9*a);
        vW=aW; vS=s;
        gl_Position=vec4(sd*(1.-2.*(-q.x)/asp)*1.,2.*q.y,0.,1.);
      }`, /* glsl */`
      uniform vec3 uSunCol,uFill; varying vec4 vW; varying float vS;
      void main(){
        float e=abs(vW.w), edge=1.-smoothstep(0.5,1.,e);
        float shaft=1.-smoothstep(0.,0.14,e);
        vec3 col=vec3(0.03,0.03,0.038)*(uFill*1.5+uSunCol*0.7)+vec3(0.07,0.075,0.09)*uFill*shaft+vec3(0.07)*uSunCol*smoothstep(0.4,0.9,vW.w*vW.x)*0.6;
        gl_FragColor=vec4(col,clamp(edge*0.96*smoothstep(0.,0.06,vS),0.,1.));
      }`, { transparent: true, depthWrite: false, depthTest: false, fog: false, side: THREE.DoubleSide });
    group.add(meshOf(g, m, 'wingtips', 8));
  }
  return { group, uniforms: mu };
}

// ---------------------------------------------------------------- our own cut
// Where the tip of our lower mandible meets the lagoon, at the very foot of the frame (update() finds that point on the
// water every frame, whatever the frame's shape and the pitch of the gaze): a knot of churned foam, spray thrown up and
// aside in two low fans, and our silver furrow laid BACK from it, behind the mandible, over the water the bill has
// already cut: widest and brightest at the cut, opening, thinning and breaking into dashes within four metres (it
// streams away under and behind us; what a frame shows of it is the churn at the cut itself). Nothing is drawn on the
// water ahead of the bill. The wingmates fly ahead of abreast, so it is their furrows that give the silver lines
// converging in front. uCut 0..1 (the skim). Local space: origin at the cut, -Z ahead, y up.
function makeCut(U) {
  const group = new THREE.Group(); group.name = 'our-cut';
  const cu = { ...U, uCut: { value: 0 } }, AH = 0.4, BK = 3.7, LEN = AH + BK;
  { const P = [], A = [], I = [], SEG = 24;
    for (let i = 0; i <= SEG; i++) { const t = i / SEG; P.push(-1, 0, t, 1, 0, t); A.push(t, -1, t, 1); }
    for (let i = 0; i < SEG; i++) { const a = i * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(A, 2)); g.setIndex(I);
    const m = shader(cu, /* glsl */`
      attribute vec2 aK; uniform float uTime; varying vec3 vK;
      #include <fog_pars_vertex>
      void main(){
        float t=aK.x, z=${(-AH).toFixed(2)}+t*${LEN.toFixed(2)}, bk=clamp(z/${BK.toFixed(2)},0.,1.);
        float w=mix(0.012,0.052,smoothstep(${(-AH).toFixed(2)},-0.04,z))+0.12*pow(bk,0.7);
        vec3 p=vec3(aK.y*w+(0.03*sin(z*5.-uTime*8.)+0.016*sin(z*11.3-uTime*13.))*bk,0.,z);
        vK=vec3(aK,z); vec4 mvPosition=viewMatrix*modelMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      uniform vec3 uSunCol,uFill; uniform float uTime,uCut; varying vec3 vK;
      ${NOISE_GLSL}
      #include <fog_pars_fragment>
      void main(){
        float v=vK.y, e=abs(v), z=vK.z, bk=clamp(z/${BK.toFixed(2)},0.,1.), flow=z*2.6-uTime*13.;
        // one soft-shouldered stroke with a ragged edge, streaming back from the cut; churned along its length, thinning
        // and torn into dashes toward its tail
        float rag=0.55+0.4*vn(vec2(flow*1.2,sign(v)*5.+2.));
        float body=exp(-e*e*3.4)*(1.-smoothstep(rag,1.,e));
        float br=0.5+0.5*smoothstep(0.25,0.62,vn(vec2(flow,v*2.4+3.)))*(0.6+0.4*vn(vec2(flow*2.6,v*7.)));
        float dash=mix(1.,smoothstep(0.34,0.56,vn(vec2(flow*0.42,7.))),smoothstep(0.3,0.8,bk));
        // the knot at the cut: churned foam, never a solid white lump
        float churn=0.4+0.6*smoothstep(0.3,0.68,vn(vec2(flow*1.7,v*3.1+uTime*2.3)));
        float head=exp(-z*z*42.)*(1.-e*e*0.7)*0.8*churn;
        float a=clamp(body*br*dash*(1.-0.75*bk)*(0.55+0.45*churn)+head,0.,1.);
        float fade=smoothstep(${(-AH).toFixed(2)},${(-AH * 0.35).toFixed(2)},z)*(1.-smoothstep(0.8,1.,bk))*uCut;
        gl_FragColor=vec4((uFill*0.6+uSunCol*1.2)*0.95*(1.+0.5*head),clamp(a*fade*0.74,0.,1.));
        #include <fog_fragment>
      }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    group.add(meshOf(g, m, 'our-furrow', 3)); }
  { const n = 110, iA = new Float32Array(n * 4);
    // random, not a regular sequence: a sequence strings the drops into arcs
    const sr = makeRng('tl-cut-spray');
    for (let i = 0; i < n; i++) { iA[i * 4] = sr(); iA[i * 4 + 1] = sr(); iA[i * 4 + 2] = sr(); iA[i * 4 + 3] = sr() < 0.5 ? 1 : -1; }
    const m = shader(cu, /* glsl */`
      attribute vec4 iA; uniform float uTime,uCut; varying vec2 vUv; varying float vA;
      #include <fog_pars_vertex>
      void main(){
        // drops fly up, out to either side and a little ahead of the cut (two low fans); every fifth is a curl of water lying low
        float f=fract(uTime*(2.7+iA.y*1.7)+iA.x), T=0.3*f, curl=step(0.8,iA.z);
        vec3 c=vec3(iA.w*(0.02+(0.35+1.5*iA.z)*T),0.015+(0.5+1.0*iA.y)*T-4.9*T*T,-0.05-(0.5+1.6*iA.x)*T);
        c=mix(c,vec3(iA.w*(0.03+(0.3+0.8*iA.y)*T),0.012+(0.15+0.4*iA.x)*T-2.4*T*T,-0.02-(0.3+1.0*iA.y)*T),curl);
        vec4 mvPosition=viewMatrix*modelMatrix*vec4(c,1.);
        mvPosition.xy+=position.xy*mix((0.005+0.008*f)*(0.7+0.8*iA.x)*vec2(1.2,1.2),(0.012+0.03*f)*vec2(1.9,0.75),curl);
        vUv=position.xy; vA=uCut*(1.-f)*smoothstep(0.,0.1,f)*mix(1.,0.5,curl);
        gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      uniform vec3 uSunCol,uFill; varying vec2 vUv; varying float vA;
      #include <fog_pars_fragment>
      void main(){
        float a=max(1.-dot(vUv,vUv),0.);
        gl_FragColor=vec4((uFill*0.7+uSunCol*1.3)*0.95,clamp(a*a*vA*0.95,0.,1.));
        #include <fog_fragment>
      }`, { transparent: true, depthWrite: false });
    group.add(meshOf(instanced(QUAD(), { iA: [iA, 4] }, n), m, 'our-spray', 6)); }
  return { group, uniforms: cu };
}

// ---------------------------------------------------------------- streamers of blown sand peeling off the brinks
// Off every authored crest the wind tears the sand away in separate wisps, in uneven groups of one to three with bare
// brink between: each leaves the brink thin and bright, swells to a belly, lifts a little, then sags, curls to one side
// and tapers away over the slip face, with gusts running down it. No two the same length or heading. Sunlit white
// against the blue of the face below. Never thinner than a few pixels (they widen with distance), and gone within a
// few metres of the eye. uK scales them all.
function makeStreamers(rng, U, hero) {
  const A = hero.anchors, W = A.waterLevel, hA = hero.heightAt, R = [], S = [], D = [];
  for (let d = 0; d < 5; d++) {
    const tall = d === 2, lim = tall ? 0.93 : 0.84;
    // gusts tear the sand off in groups of one to three wisps with bare brink between the groups: no two the same length,
    // no two parallel
    for (let t = -lim + rng.range(0, 0.04); t <= lim;) {
      const grp = 1 + Math.floor(rng() * rng() * 3.4);
      for (let k = 0; k < grp && t <= lim; k++) {
        const c = A.crestLine(d, t), p = A.crestLine(d, t - 0.01), q = A.crestLine(d, t + 0.01);
        t += tall ? rng.range(0.005, 0.013) : rng.range(0.03, 0.07);
        if (c.y - W < 3.2) continue;
        // the lee side: square to the brink, on the downwind (+Z) side; the root sits on the true brink (the highest point across it)
        let tx = q.x - p.x, tz = q.z - p.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        let nx = tz, nz = -tx; if (nz < 0) { nx = -nx; nz = -nz; }
        let bx = c.x, bz = c.z, bh = hA(c.x, c.z);
        for (let j = -6; j <= 6; j += 0.5) { const h = hA(c.x + nx * j, c.z + nz * j); if (h > bh) { bh = h; bx = c.x + nx * j; bz = c.z + nz * j; } }
        const yaw = rng.range(-0.85, 0.7), cy = Math.cos(yaw), sy = Math.sin(yaw);
        let dx = nx * cy - nz * sy, dz = nx * sy + nz * cy + 0.12; const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
        const big = rng() < 0.3;
        R.push(bx, bh + 0.12, bz, rng());
        S.push((big ? rng.range(26, 44) : rng.range(9, 24)) * (tall ? 1 : 0.8), (big ? rng.range(2.4, 4.0) : rng.range(1.0, 2.2)), rng.range(0.8, 1.3), rng());
        D.push(dx, dz);
      }
      t += tall ? rng.range(0.016, 0.052) : rng.range(0.05, 0.14);
    }
  }
  const n = R.length / 4, P = [], I = [], SEG = 16;
  for (let i = 0; i <= SEG; i++) { const s = i / SEG; P.push(s, -1, 0, s, 1, 0); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setIndex(I);
  const su = { ...U, uK: { value: 1 }, uPx: hero.uniforms.uPx };
  const m = shader(su, /* glsl */`
    attribute vec4 iR, iS; attribute vec2 iD; uniform float uTime,uK,uPx; varying vec3 vS; varying vec3 vA;
    #include <fog_pars_vertex>
    vec3 centre(float s){
      float L=iS.x, h1=iR.w, h2=iS.w;
      // it leaves the brink straight, then the eddy behind the crest takes it: a slow curl to one side, a wander on top of
      // that, and a snaking that runs down it with the gusts
      float curl=(h1-.5)*0.9*L*s*s;
      float sway=((2.2+2.6*h2)*sin(s*(2.4+2.*h1)+uTime*0.8+h1*30.)+1.2*sin(s*7.3-uTime*1.9+h2*40.))*s*smoothstep(0.,0.35,s);
      float y=L*((0.09+0.1*h2)*s-(0.28+0.2*h1)*s*s)+0.6*sin(s*6.-uTime*2.3+h1*50.)*s;
      return iR.xyz+vec3(iD.x*s*L-iD.y*(sway+curl),y,iD.y*s*L+iD.x*(sway+curl));
    }
    void main(){
      float s=position.x, sd=position.y;
      vec3 c=centre(s), tg=normalize(centre(s+0.03)-c+vec3(0.,0.,1e-4));
      vec3 toC=cameraPosition-c; float dist=length(toC);
      vec3 side=normalize(cross(tg,toC)+vec3(0.,1e-4,0.));
      float far=smoothstep(60.,200.,dist);
      float belly=(0.12+1.2*smoothstep(0.,0.3,s))*(1.-0.62*smoothstep(0.42,1.,s));
      float w=max(iS.y*belly,dist*uPx*(2.5+5.0*belly)*(1.-0.6*far));
      float gust=0.7+0.3*sin(uTime*0.55*iS.z+iS.w*6.283)*sin(uTime*0.21+iR.w*20.);
      vS=vec3(s,sd,iR.w); vA=vec3(uK*gust*smoothstep(0.,0.03,s)*pow(1.-s,0.85)*smoothstep(4.,14.,dist)*mix(0.6,1.,smoothstep(12.,48.,dist))*(1.-far*step(0.3,iS.w))*(1.-0.3*far),iS.x,iS.z);
      vec4 mvPosition=viewMatrix*vec4(c+side*sd*w,1.); gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    uniform vec3 uSand,uSunCol,uFill; uniform float uTime; varying vec3 vS; varying vec3 vA;
    ${NOISE_GLSL}
    #include <fog_pars_fragment>
    void main(){
      float s=vS.x, v=vS.y, run=s*vA.y;
      float st=vn(vec2(run*0.3-uTime*vA.z*1.6,v*0.6+vS.z*9.))*0.6+vn(vec2(run*0.95-uTime*vA.z*3.4,v*1.5+vS.z*3.))*0.4;
      // a soft-edged wisp, off centre and wandering inside its ribbon, fraying into haze from a quarter of its length
      float vc=v-0.45*(vn(vec2(run*0.22+vS.z*17.,2.))-.5)*smoothstep(0.05,0.5,s);
      float across=exp(-vc*vc*mix(3.0,2.2,s));
      float fray=mix(1.,smoothstep(0.08,0.62,st),smoothstep(0.25,0.75,s));
      float a=vA.x*across*fray*(1.-smoothstep(0.75,1.,abs(v)));
      vec3 col=uSand*(uFill*0.5+uSunCol*1.0);
      gl_FragColor=vec4(col,clamp(a*1.25,0.,0.94));
      #include <fog_fragment>
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
  return { mesh: meshOf(instanced(base, { iR: [new Float32Array(R), 4], iS: [new Float32Array(S), 4], iD: [new Float32Array(D), 2] }, n), m, 'brink-streamers', 3.5), uniforms: su, count: n };
}

// ---------------------------------------------------------------- tetra shoals: silver fish strung along the skimmed line, with bed shadows
// The shoals lie along our own line through each lagoon (the bill is there to catch them): wherever the line runs
// within 1.25 m of water more than 0.4 m deep there is a shoal every twenty-odd metres (seeded centres, each some
// ten metres long) and a thin scatter of fish between, so the bill splits a shoal on every skim, wherever one lies.
// Each fish is a flat quad on the water that never draws thinner than two pixels, flashes far above white when it
// rolls, drops a dark shadow on the bed and darts aside from the bill.
async function makeFish(ctx, rng, U, hero, path, count) {
  const W = hero.anchors.waterLevel, hA = hero.heightAt, v = new V3(), tg = new V3(), spots = [];
  const gap = rng.range(21, 25), ph = rng.range(0, gap);
  for (let d = 2; d < path.length - 30; d += 0.5) {
    path.posAtDist(d, v); if (v.y - W > 1.25 || W - hA(v.x, v.z) < 0.4) continue;
    const off = ((d + ph) % gap) - gap * 0.5, shoal = Math.exp(-off * off / 14);
    const clump = 0.5 + 0.5 * Math.sin(d * 0.23 + 1.3) * Math.sin(d * 0.071 + 0.4);
    spots.push([d, Math.max(shoal, 0.12 + 0.2 * clump)]);
  }
  await ctx.yield();
  const n = Math.max(2, spots.length ? count : 1) * 2, iF = new Float32Array(n * 4), iG = new Float32Array(n * 4);
  for (let i = 0, k = 0; i < n / 2; i++) {
    let sp = null; for (let tries = 0; tries < 12 && spots.length; tries++) { const c = spots[rng.int(0, spots.length - 1)]; if (rng() < c[1]) { sp = c; break; } }
    const d = sp ? sp[0] + rng.range(-0.25, 0.25) : 0, lat = (rng.gauss ? rng.gauss() : rng.range(-1.5, 1.5)) * 0.9;
    path.posAtDist(Math.max(0, d), v); path.tangentAtDist(Math.max(0, d), tg);
    const hl = Math.hypot(tg.x, tg.z) || 1, x = sp ? v.x - tg.z / hl * lat : 0, z = sp ? v.z + tg.x / hl * lat : 9999;
    const a = rng(), b = rng(), ph = rng.range(0, 40), ha = rng.range(0, TAU), sz = rng.range(0.3, 0.42) * 0.6;
    for (let sh = 0; sh < 2; sh++, k++) { iF.set([x, z, a, b], k * 4); iG.set([ph, ha, 1 - sh, sz], k * 4); }
    if ((i & 255) === 255) await ctx.yield();      // a few hundred fish per slice
  }
  const fu = { ...U, uWater: hero.uniforms.uWater, uPx: hero.uniforms.uPx, uBill: { value: new V3(0, 0, 9999) } };
  const m = shader(fu, /* glsl */`
    attribute vec4 iF, iG; uniform float uTime,uWater,uPx; uniform vec3 uBill,uSun; varying vec2 vUv; varying vec3 vI;
    #include <fog_pars_vertex>
    void main(){
      float s1=iF.z, s2=iF.w, shd=1.-iG.z, t=uTime*0.5+iG.x;
      float ha=iG.y+0.9*sin(t*0.7+s1*20.);
      vec2 hd=vec2(cos(ha),sin(ha)), pp=vec2(-hd.y,hd.x);
      vec2 pos=iF.xy+vec2(sin(t*0.8+s2*30.),cos(t*0.63+s1*30.))*0.6+hd*0.5*sin(t*1.7+s1*9.);
      vec2 d=pos-uBill.xz; float dd=dot(d,d); pos+=d*1.6*exp(-dd/2.5);        // the shoal parts round the bill
      float L=iG.w*(1.+0.5*shd), wig=sin(uTime*13.+s1*50.+position.x*2.)*0.04*(0.3+0.7*step(position.x,0.));
      vec2 q=pos+hd*position.x*L*0.5+pp*(position.y*L*0.2+wig);
      q-=shd*uSun.xz/max(uSun.y,0.25)*0.3;
      float fl=pow(max(sin(uTime*2.9+s1*37.+s2*11.),0.),18.);
      vec4 mvPosition=viewMatrix*vec4(q.x,uWater+0.03-0.012*shd,q.y,1.);
      vUv=position.xy; vI=vec3(fl,shd,1.-smoothstep(16.,38.,-mvPosition.z));
      mvPosition.y+=position.y*(-mvPosition.z)*uPx*(1.1+0.6*shd);
      gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    uniform vec3 uSunCol,uFill; varying vec2 vUv; varying vec3 vI;
    #include <fog_pars_fragment>
    void main(){
      float x=vUv.x, y=abs(vUv.y);
      float w=x>-0.55?sqrt(max(1.-(x-0.22)*(x-0.22)/0.61,0.))*0.62:(-x-0.55)/0.45*0.7+0.08;
      float a=1.-smoothstep(w-0.28-0.3*vI.y,w,y);
      vec3 body=vec3(0.07,0.19,0.21)*(uFill*0.8+uSunCol)+uSunCol*vI.x*0.9*(1.-smoothstep(0.,0.4,y));
      vec3 col=mix(body,vec3(0.01,0.04,0.075)*uFill,vI.y);
      gl_FragColor=vec4(max(col,vec3(0.)),clamp(a*mix(0.8,0.45,vI.y)*vI.z,0.,1.));
      #include <fog_fragment>
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
  return { mesh: meshOf(instanced(QUAD(), { iF: [iF, 4], iG: [iG, 4] }, n), m, 'tetra-shoals', 1), uniforms: fu };
}

// ---------------------------------------------------------------- sedge and spikerush along the shores
async function makeSedge(ctx, rng, U, hero, plan, count) {
  const hA = hero.heightAt, W = hero.anchors.waterLevel, pts = [], cols = Math.ceil(count / 30);
  for (let c = 0; c < cols; c++) {
    const off = rng.sign() * (1.6 + 100 * Math.pow(rng(), 1.7)); let prev = null, pz = 0;
    for (let z = ZS + 16; z > ZE - 50; z -= 3) {
      const x = plan.xAt(z) + off, d = W - hA(x, z);
      if (prev !== null && (d > 0.04) !== (prev > 0.04)) {
        const zc = lerp(pz, z, (0.04 - prev) / ((d - prev) || 1e-3)), lee = d > prev, n = lee ? rng.int(5, 10) : rng.int(1, 4);
        for (let k = 0; k < n; k++) pts.push([x + rng.range(-2.6, 2.6), zc + rng.range(-1.2, 1.2) - (lee ? rng.range(0, 1.8) : -rng.range(0, 0.8))]);
      }
      prev = d; pz = z;
    }
    if ((c & 7) === 7) await ctx.yield();      // a few shore-crossing columns per slice
  }
  await ctx.yield();
  const iA = new Float32Array(pts.length * 4), iB = new Float32Array(pts.length * 4); let n = 0;
  for (const p of pts) {
    const h = hA(p[0], p[1]); if (h < W - 0.42 || h > W + 0.3 || Math.abs(p[0] - plan.xAt(p[1])) < 1.4) continue;
    iA[n * 4] = p[0]; iA[n * 4 + 1] = h - 0.03; iA[n * 4 + 2] = p[1]; iA[n * 4 + 3] = rng.range(0, TAU);
    iB[n * 4] = rng.range(0.7, 1.35) * (h < W ? 1.25 : 1); iB[n * 4 + 1] = rng(); iB[n * 4 + 2] = rng.range(0, TAU); iB[n * 4 + 3] = 0; n++;
  }
  // one tuft: 5 blades, each a tapered kinked strip
  const P = [], A = [], I = [];
  for (let b = 0; b < 5; b++) {
    const a = b * 1.2566 + 0.4 * Math.sin(b * 2.1), lean = 0.1 + 0.16 * ((b * 0.37) % 1), hgt = 0.34 + 0.2 * ((b * 0.61) % 1), s = P.length / 3;
    const dx = Math.cos(a), dz = Math.sin(a);
    for (const [t, w] of [[0, 1], [0.55, 0.7], [1, 0.05]]) {
      const r = 0.03 + lean * t * t * 1.6;
      P.push(dx * r, hgt * t, dz * r, dx * r, hgt * t, dz * r); A.push(t, -w, b, t, w, b);
    }
    I.push(s, s + 1, s + 2, s + 1, s + 3, s + 2, s + 2, s + 3, s + 4, s + 3, s + 5, s + 4);
  }
  const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setAttribute('aT', new THREE.Float32BufferAttribute(A, 3)); base.setIndex(I);
  const m = shader({ ...U, uPx: hero.uniforms.uPx }, /* glsl */`
    attribute vec3 aT; attribute vec4 iA, iB; uniform float uTime,uPx; varying vec3 vT; varying vec3 vN;
    #include <fog_pars_vertex>
    void main(){
      float c=cos(iA.w), s=sin(iA.w), t=aT.x; vec3 p=position*iB.x; p.xz=vec2(p.x*c-p.z*s,p.x*s+p.z*c);
      vec3 w=iA.xyz+p;
      float g=0.5+0.5*sin(uTime*1.9+w.x*0.35+w.z*0.5+iB.z)+0.35*sin(uTime*5.3+iB.z*3.+aT.z);
      w.z+=t*t*iB.x*(0.07+0.13*g); w.x+=t*t*iB.x*0.04*sin(uTime*2.7+iB.z);
      vec4 mvPosition=viewMatrix*vec4(w,1.);
      float hw=max(0.011*iB.x,-mvPosition.z*uPx*0.75);
      mvPosition.x+=aT.y*hw;
      vT=vec3(t,iB.y,g); vN=normalize(vec3(p.x,0.5,p.z)+vec3(0.,1e-3,0.));
      gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    varying vec3 vT; varying vec3 vN;
    ${LIGHT_GLSL}
    #include <fog_pars_fragment>
    void main(){
      vec3 alb=mix(vec3(0.035,0.085,0.03),mix(vec3(0.17,0.34,0.09),vec3(0.3,0.36,0.13),vT.y*vT.y),vT.x);
      vec3 col=tlLit(alb,normalize(vN),1.)+alb*uSunCol*0.35*vT.x;
      gl_FragColor=vec4(col*(0.55+0.45*vT.x),1.);
      #include <fog_fragment>
    }`, { side: THREE.DoubleSide });
  return { mesh: meshOf(instanced(base, { iA: [iA.subarray(0, n * 4), 4], iB: [iB.subarray(0, n * 4), 4] }, n), m, 'sedge'), count: n, base };
}

// ---------------------------------------------------------------- buriti palms (Mauritia flexuosa): pale ringed column, round crown of big fans, dead skirt
// Each fan is a near-full disc of narrow leaflets with a fold along each and a drooping tip, set at the end of a long
// petiole; twenty of them at every elevation and roll make a ball of foliage, shaded as a ball (sunlit side, deep
// green side, dark heart), over a skirt of hanging grey-brown dead fans. `fine` is the palm for the near half of the
// grove (about 1,500 triangles); the far half keeps fewer, coarser fans.
function palmGeo(rng, fine) {
  const P = [], N = [], C = [], A = [], I = [], H = 20.5;
  const v = (p, n, c, w, k) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2]); A.push(w, k); return P.length / 3 - 1; };
  // the trunk: a straight grey column, flared into a boss of stilt roots at the foot, faintly swollen two thirds of the way
  // up, narrowing under the crown; the fine palm has a ring every metre so the shader's leaf scars sit on a round column
  const G = [0.37, 0.35, 0.325], SD = fine ? 10 : 7, ys = [0, 0.35, 0.9, 1.8], rs = [0.86, 0.62, 0.46, 0.39];
  for (let y = fine ? 2.9 : 5; y < H - 0.5; y += fine ? 1.1 : 6) { ys.push(y); rs.push(0.35 + 0.035 * Math.sin(y / H * 3.6 - 0.6) - 0.05 * Math.pow(y / H, 3)); }
  ys.push(H); rs.push(0.29);
  for (let i = 0; i < ys.length; i++) for (let s = 0; s < SD; s++) { const a = s / SD * TAU, fl = i < 3 ? 1 + 0.22 * Math.sin(a * 5 + 1.3) * (1 - i / 3) : 1, sl = i < 3 ? 0.5 : 0;
    v([Math.cos(a) * rs[i] * fl, ys[i], Math.sin(a) * rs[i] * fl], [Math.cos(a), sl, Math.sin(a)], G, 0.12 * Math.pow(ys[i] / H, 2), 0); }
  for (let i = 0; i < ys.length - 1; i++) for (let s = 0; s < SD; s++) { const a = i * SD + s, b = i * SD + (s + 1) % SD; I.push(a, b, a + SD, b, b + SD, a + SD); }
  const fan = (el, az, roll, pet, len, col, tipc, droop, leaflets, spread, y0) => {
    const ce = Math.cos(el), d = [Math.cos(az) * ce, Math.sin(el), Math.sin(az) * ce], s0 = [-Math.sin(az), 0, Math.cos(az)];
    const n0 = [d[1] * s0[2] - d[2] * s0[1], d[2] * s0[0] - d[0] * s0[2], d[0] * s0[1] - d[1] * s0[0]];
    const cr = Math.cos(roll), sr = Math.sin(roll), s = [s0[0] * cr + n0[0] * sr, s0[1] * cr + n0[1] * sr, s0[2] * cr + n0[2] * sr], n = [n0[0] * cr - s0[0] * sr, n0[1] * cr - s0[1] * sr, n0[2] * cr - s0[2] * sr];
    if (n[1] < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; }
    const F = [d[0] * pet, y0 + d[1] * pet - droop * 0.25, d[2] * pet];
    const p0 = v([s[0] * 0.08, y0 - 0.2, s[2] * 0.08], n, G, 0.1, 1), p1 = v([-s[0] * 0.08, y0 - 0.2, -s[2] * 0.08], n, G, 0.1, 1), p2 = v([F[0] + s[0] * 0.06, F[1], F[2] + s[2] * 0.06], n, col, 0.35, 1), p3 = v([F[0] - s[0] * 0.06, F[1], F[2] - s[2] * 0.06], n, col, 0.35, 1);
    I.push(p0, p1, p2, p1, p3, p2);
    for (let k = 0; k < leaflets; k++) {
      const al = ((k + 0.5) / leaflets - 0.5) * 2 * spread, ca = Math.cos(al), sa = Math.sin(al), ab = Math.abs(al) / spread, L = len * (1 - 0.2 * ab) * rng.range(0.9, 1.08);
      const dir = [d[0] * ca + s[0] * sa, d[1] * ca + s[1] * sa, d[2] * ca + s[2] * sa], pp = [-d[0] * sa + s[0] * ca, -d[1] * sa + s[1] * ca, -d[2] * sa + s[2] * ca];
      // along the leaflet t, half width w, fold lift f (the midrib is a ridge), droop dy (falls with gravity, a little along the fan's normal)
      const at = (t, w, f, dy) => [F[0] + dir[0] * L * t + pp[0] * w + n[0] * (f - dy * 0.3), F[1] + dir[1] * L * t + pp[1] * w + n[1] * (f - dy * 0.3) - dy, F[2] + dir[2] * L * t + pp[2] * w + n[2] * (f - dy * 0.3)];
      const wl = (fine ? 0.115 : 0.2) * (0.8 + 0.2 * L / len), dr = droop * (0.55 + 0.45 * ab) * rng.range(0.8, 1.2);
      const nl = [n[0] + pp[0] * 0.5, n[1] + pp[1] * 0.5, n[2] + pp[2] * 0.5], nr = [n[0] - pp[0] * 0.5, n[1] - pp[1] * 0.5, n[2] - pp[2] * 0.5];
      const hub = v(at(0.03, 0, 0, 0), n, col, 0.35, 1), ml = v(at(0.45, wl, -0.04, dr * 0.14), nl, col, 0.65, 1), mr = v(at(0.45, -wl, -0.04, dr * 0.14), nr, col, 0.65, 1);
      if (fine) {
        const mm = v(at(0.5, 0, 0.05, dr * 0.14), n, tipc, 0.65, 1), ql = v(at(0.8, wl * 0.6, -0.02, dr * 0.52), nl, col, 0.9, 1), qr = v(at(0.8, -wl * 0.6, -0.02, dr * 0.52), nr, col, 0.9, 1), tip = v(at(1, 0, 0, dr), n, tipc, 1, 1);
        I.push(hub, ml, mm, hub, mm, mr, ml, ql, mm, mm, qr, mr, ql, tip, qr, ql, qr, mm);
      } else { const tip = v(at(1, 0, 0, dr), n, tipc, 1, 1); I.push(hub, ml, mr, ml, tip, mr); }
    }
  };
  const LEAF = [0.03, 0.15, 0.045], TIP = [0.085, 0.26, 0.065], DEAD = [0.2, 0.17, 0.135], DTIP = [0.31, 0.275, 0.225];
  const NF = fine ? 20 : 12, NL = fine ? 14 : 8, ND = fine ? 11 : 6;
  for (let f = 0; f < NF; f++) { const q = f / (NF - 1);
    fan(-0.55 + 2.0 * Math.pow(q, 0.85) + rng.range(-0.1, 0.1), f * 2.39996 + rng.range(-0.2, 0.2), rng.range(-0.7, 0.7), rng.range(1.7, 2.5) * (1 - 0.25 * q), rng.range(2.0, 2.5), LEAF, TIP, 1.15 - 0.75 * q, NL, 2.65, H); }
  // the skirt of dead fronds: a ring hanging from under the crown and a second, older one lower down, close against the trunk
  for (let f = 0; f < ND; f++) fan(-1.2 + rng.range(-0.14, 0.14), f * TAU / ND + rng.range(-0.3, 0.3), rng.range(-0.5, 0.5), rng.range(0.7, 1.3), rng.range(2.3, 3.2), DEAD, DTIP, 0.5, fine ? 7 : 5, 1.5, H - 0.4);
  for (let f = 0; f < (fine ? 8 : 4); f++) fan(-1.42 + rng.range(-0.07, 0.07), f * TAU / (fine ? 8 : 4) + rng.range(-0.3, 0.3) + 0.4, rng.range(-0.4, 0.4), rng.range(0.25, 0.5), rng.range(2.0, 3.0), DEAD, DTIP, 0.3, fine ? 6 : 4, 1.1, H - 1.5);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(A, 2)); g.setIndex(I);
  return g;
}
function makePalmMaterial(U) {
  return shader(U, /* glsl */`
    attribute vec3 aCol; attribute vec2 aW; attribute vec4 iA, iB; uniform float uTime;
    varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying vec3 vK; varying vec4 vBall;
    #include <fog_pars_vertex>
    void main(){
      float c=cos(iA.w), s=sin(iA.w); vec3 p=position*iB.x, n=normal; p.xz=vec2(p.x*c-p.z*s,p.x*s+p.z*c); n.xz=vec2(n.x*c-n.z*s,n.x*s+n.z*c);
      vec3 w=iA.xyz+p; float ph=iB.y+w.x*0.05;
      w.z+=aW.x*(0.35+0.3*sin(uTime*0.9+ph)+0.12*sin(uTime*2.3+ph*2.+position.y));
      w.y+=aW.x*aW.x*0.13*sin(uTime*6.5+position.x*2.6+position.z*3.1+ph);
      w.x+=aW.x*0.1*sin(uTime*1.3+ph*1.7);
      // the crown as a ball: direction and distance from its heart (the top of the trunk)
      vec3 b=position-vec3(0.,20.5,0.); float bl=length(b); b=b/max(bl,1e-3); b.xz=vec2(b.x*c-b.z*s,b.x*s+b.z*c);
      vBall=vec4(b,bl);
      vCol=aCol*mix(1.,iB.z,aW.y); vN=n; vV=cameraPosition-w; vK=vec3(aW.y,position.y,atan(position.z,position.x+1e-4));
      vec4 mvPosition=viewMatrix*vec4(w,1.); gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying vec3 vK; varying vec4 vBall;
    ${LIGHT_GLSL}
    ${NOISE_GLSL}
    #include <fog_pars_fragment>
    void main(){
      vec3 n=normalize(vN+vec3(0.,1e-4,0.)), V=normalize(vV+vec3(0.,1e-4,0.)); vec3 alb=vCol; vec3 col;
      if(vK.x>0.5){
        float back=step(dot(n,V),0.); if(back>0.5) n=-n;
        vec3 nb=normalize(mix(n,vBall.xyz,0.62)+vec3(0.,1e-4,0.));                       // each fan takes most of its light as part of the ball
        float ao=mix(0.34,1.,smoothstep(0.8,4.2,vBall.w))*(0.72+0.28*vBall.y);            // dark heart, darker underside
        float sp=pow(max(dot(reflect(-uSun,n),V),0.),18.)*0.5*(1.-back);
        float thru=back*max(dot(-n,uSun),0.);                                             // sun through the blade
        alb*=0.86+0.28*vn(vec2(vK.z*7.,vK.y*1.3));
        col=tlLit(alb,nb,1.)*ao+alb*vec3(1.15,1.25,0.6)*uSunCol*0.6*thru*ao+uSunCol*sp*0.2*ao;
      } else {
        // the trunk: a ringed leaf scar every third of a metre (a dark groove with a pale lip, fading before it can alias),
        // broader weathered bands, fibre streaks down the column, a dark wet foot; one side takes the sun, the other the sky
        float yy=vK.y+0.05*vn(vec2(vK.z*3.,vK.y*0.8)), rp=yy*18.5, fwr=fwidth(rp), rk=1.-smoothstep(0.9,2.6,fwr);
        float sc=sin(rp), groove=smoothstep(0.55,0.95,sc)*rk, lip=smoothstep(0.2,0.75,sin(rp-1.2))*rk;
        float band=vn(vec2(vK.z*0.7,yy*0.55))*0.6+vn(vec2(vK.z*2.1+7.,yy*1.9))*0.4;
        float fibre=vn(vec2(vK.z*9.,yy*0.35))*0.6+vn(vec2(vK.z*23.,yy*1.1))*0.4;
        alb*=(0.72+0.5*band)*(0.82+0.36*fibre)*(1.-0.5*groove+0.22*lip)*mix(0.42,1.,smoothstep(0.2,3.2,vK.y))*mix(1.,0.6,smoothstep(17.5,20.,vK.y));
        n=normalize(n+vec3(0.,0.55*cos(rp)*rk,0.)+vec3(fibre-.5,0.,band-.5)*0.3);
        col=tlLit(alb,n,1.)+alb*uSunCol*0.07*(1.-n.y);                                    // a little of the white sand's light comes back up onto the trunks
      }
      gl_FragColor=vec4(col,1.);
      #include <fog_fragment>
    }`, { side: THREE.DoubleSide });
}
function makePalms(rng, mat, geo, spots, name) {
  const n = Math.max(1, spots.length), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
  spots.forEach((s, i) => { iA.set([s.x, s.y, s.z, rng.range(0, TAU)], i * 4); iB.set([s.s, rng.range(0, TAU), rng.range(0.82, 1.15), 0], i * 4); });
  if (!spots.length) iA.set([0, -200, 0, 0], 0);
  return meshOf(instanced(geo, { iA: [iA, 4], iB: [iB, 4] }, n), mat, name);
}

// ---------------------------------------------------------------- the palms' reflections in the dark water
// A flat mirror shows a palm's image along the line from its foot toward whoever looks: the point y metres up the palm lies
// y / (eye height + y) of the way along it. So each palm gets one strip laid ON the water, from its foot toward the camera,
// and the fragment shader draws the trunk, the skirt and the crown into it, broken by the ripples. Lying on the water, it
// is hidden by sand, palms and birds like anything else, and it is only drawn where there is water under it.
function makePalmReflections(U, hero, spots) {
  const W = hero.anchors.waterLevel, wet = spots.filter((q) => q.g <= W + 0.05), n = Math.max(1, wet.length), iA = new Float32Array(n * 4), SEG = 14, P = [], I = [];
  wet.forEach((q, i) => iA.set([q.x, q.y + 20.5 * q.s - W, q.z, q.s], i * 4));
  if (!wet.length) iA.set([0, 20, 99999, 1], 0);
  for (let i = 0; i <= SEG; i++) { const t = i / SEG; P.push(-1, t, 0, 1, t, 0); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setIndex(I);
  const ru = { ...U, uWater: hero.uniforms.uWater, uMap: hero.uniforms.uMap, uRect: hero.uniforms.uRect, uCamW: { value: new V3() } };
  const m = shader(ru, /* glsl */`
    attribute vec4 iA; uniform float uWater,uTime; uniform vec3 uCamW; uniform sampler2D uMap; uniform vec4 uRect;
    varying vec4 vR; varying vec3 vQ;
    #include <fog_pars_vertex>
    void main(){
      float top=iA.y, hc=max(uCamW.y-uWater,0.6), yw=position.y*(top+4.6);
      vec2 b=iA.xz, D=uCamW.xz-b; float dl=max(length(D),1e-3); vec2 dn=D/dl, pp=vec2(-dn.y,dn.x);
      float fr=yw/(hc+yw);
      vec2 q=b+D*fr+pp*position.x*5.0*(1.-fr);
      float wet=smoothstep(0.03,0.25,uWater-textureLod(uMap,(q-uRect.xy)*uRect.zw,0.).r);
      vR=vec4(position.x*5.0,yw,top,wet*(1.-smoothstep(0.72,0.93,fr))*(1.-smoothstep(170.,320.,dl))*smoothstep(0.5,2.5,dl*(1.-fr)));
      vQ=vec3(q,fr);
      vec4 mvPosition=viewMatrix*vec4(q.x,uWater+0.035,q.y,1.); gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    uniform float uTime; uniform vec3 uSunCol,uFill,uTeal; varying vec4 vR; varying vec3 vQ;
    ${NOISE_GLSL}
    #include <fog_pars_fragment>
    void main(){
      float top=vR.z, yw=vR.y;
      // the ripples shake the image sideways, more the further it lies from the palm's foot, and tear it into bars
      float rip=vn(vec2(vQ.x*1.1+uTime*0.5,vQ.y*2.3-uTime*1.1))-.5, rip2=vn(vec2(vQ.x*3.7-uTime*0.7,vQ.y*6.1+uTime*1.6))-.5;
      float lx=vR.x+(rip*1.5+rip2*0.5)*(0.35+1.6*vQ.z);
      float trunk=(1.-smoothstep(0.3,0.75,abs(lx)))*step(yw,top);
      float skirt=(1.-smoothstep(0.5,1.5,abs(lx)*(1.+0.45*(top-yw))))*smoothstep(top-5.5,top-4.,yw)*(1.-smoothstep(top-1.,top+0.5,yw));
      vec2 c=vec2(lx,yw-top-0.4); float cr=length(c), an=atan(c.y,c.x+1e-4);
      float crown=1.-smoothstep(2.6,4.4,cr+0.9*vn(vec2(an*3.2,top*1.7)));
      float a=max(max(trunk*0.85,skirt*0.8),crown);
      vec3 col=mix(vec3(0.085,0.09,0.09),vec3(0.012,0.06,0.03),crown)*(uFill*0.9+uSunCol*0.35)+uTeal*0.06;
      float bars=0.55+0.45*smoothstep(0.3,0.62,vn(vec2(vQ.x*0.8,vQ.y*3.4-uTime*0.9)));
      gl_FragColor=vec4(col,clamp(a*bars*vR.w*0.74,0.,1.));
      #include <fog_fragment>
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
  return { mesh: meshOf(instanced(base, { iA: [iA, 4] }, n), m, 'palm-reflections', 0.6), uniforms: ru };
}

// ---------------------------------------------------------------- ground shadows: a soft bar from a to b, with a crown blob (kind 0) or a contact pool (kind 2); kind 4 is a line of footprints
function makeShadows(U, list) {
  const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
  list.forEach((s, i) => { iA.set([s.a[0], s.a[1], s.a[2], s.b[1]], i * 4); iB.set([s.b[0], s.b[2], s.w, s.kind], i * 4); iC.set([s.k ?? 0.5, s.len ?? 0, 0, 0], i * 4); });
  const m = shader(U, /* glsl */`
    attribute vec4 iA, iB, iC; varying vec3 vS; varying float vA; varying float vLen;
    #include <fog_pars_vertex>
    void main(){
      vec2 a=iA.xz, b=iB.xy, d=b-a; float L=max(length(d),1e-3); vec2 t=d/L, pp=vec2(-t.y,t.x);
      float u=position.y*.5+.5, ext=iB.w>2.5?0.:iB.z/L;
      float uu=mix(-ext,1.+ext,u);
      vec2 q=a+t*uu*L+pp*position.x*iB.z;
      vS=vec3(position.x,uu,iB.w); vA=iC.x; vLen=iC.y;
      vec4 mvPosition=viewMatrix*vec4(q.x,mix(iA.y,iA.w,clamp(uu,0.,1.))+0.07,q.y,1.); gl_Position=projectionMatrix*mvPosition;
      gl_Position.z-=0.0006*gl_Position.w;
      #include <fog_vertex>
    }`, /* glsl */`
    uniform vec3 uFill; varying vec3 vS; varying float vA; varying float vLen;
    #include <fog_pars_fragment>
    void main(){
      float x=abs(vS.x), u=vS.y, a=0.;
      if(vS.z<0.5){ float bar=(1.-smoothstep(0.05,0.16,x))*smoothstep(-0.02,0.03,u)*(1.-smoothstep(0.8,0.9,u));
        vec2 c=vec2(vS.x,(u-0.9)*5.5); a=max(bar*0.8,1.-smoothstep(0.35,1.,length(c))); }
      else if(vS.z<1.5){ a=(1.-smoothstep(0.35,1.,x))*smoothstep(-0.05,0.04,u)*(1.-smoothstep(0.85,1.05,u)); }
      else if(vS.z<2.5){ a=1.-smoothstep(0.2,1.,length(vec2(vS.x,(u-0.5)*2.))); }
      else if(vS.z<3.5){ a=1.-smoothstep(0.35,1.,x); }
      else { float al=u*vLen/0.75, sd=mod(floor(al),2.)*2.-1.; vec2 q=vec2((vS.x-sd*0.4)/0.42,(fract(al)-.5)/0.36); a=(1.-smoothstep(0.55,1.,length(q)))*step(0.,u)*step(u,1.); }       // kind 4: a line of footprints
      gl_FragColor=vec4(vec3(0.16,0.25,0.44)*uFill*0.55,clamp(a*vA,0.,1.));
      #include <fog_fragment>
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
  return meshOf(instanced(QUAD(), { iA: [iA, 4], iB: [iB, 4], iC: [iC, 4] }, n), m, 'ground-shadows', 0.5);
}

// ---------------------------------------------------------------- six dead palm trunks half buried on the back of dune 2
function makeTrunks(rng, U, hero, plan, zc, shadows, sunFlat) {
  const P = [], N = [], A = [], I = [], hA = hero.heightAt, SIDES = 10, RINGS = 14;
  for (let i = 0; i < 6; i++) {
    // a foreground subject on the back of dune 2: a loose file from 24 to 56 m upwind of its crest (zc), some eight metres
    // right of our line, the tall ones 5 to 7.5 m of bleached column leaning downwind (toward us), two broken off short
    const z = zc - 24 - i * 6.4 + rng.range(-1.5, 1.5), x = plan.xAt(z) + [6.5, 9.5, 7, 11, 6, 8.5][i] + rng.range(0, 1.5), y0 = hA(x, z) - 0.5;
    const stump = i === 1 || i === 4, L = (stump ? rng.range(2.0, 2.8) : rng.range(5.0, 7.4)) + 0.5, lean = stump ? rng.range(0.15, 0.3) : rng.range(0.32, 0.62), yaw = rng.range(0, 0.45), r0 = rng.range(0.27, 0.34), seed = rng.range(0, 30);
    const ax = [Math.sin(lean) * Math.sin(yaw), Math.cos(lean), Math.sin(lean) * Math.cos(yaw)];
    const sx = [Math.cos(yaw), 0, -Math.sin(yaw)], sz = [ax[1] * sx[2] - ax[2] * sx[1], ax[2] * sx[0] - ax[0] * sx[2], ax[0] * sx[1] - ax[1] * sx[0]];
    const start = P.length / 3, bend = rng.range(-0.25, 0.25);
    for (let k = 0; k <= RINGS; k++) {
      const t = Math.min(1, k / (RINGS - 1)), cap = k === RINGS, r = r0 * (1 - 0.16 * t + 0.07 * Math.sin(k * 1.9 + seed) + 0.045 * Math.sin(k * 4.3 + seed * 2)) * (cap ? 0.45 : 1);
      for (let s = 0; s < SIDES; s++) {
        const a = s / SIDES * TAU, ca = Math.cos(a), sa = Math.sin(a), jag = k >= RINGS - 1 ? 0.28 * Math.sin(s * 2.4 + seed) + 0.2 * Math.sin(s * 5.1 + seed * 2) - (cap ? 0.3 : 0) : 0;
        const d = t * L + jag, bx = bend * t * t * L * 0.3 + 0.05 * Math.sin(k * 2.7 + seed);
        P.push(x + ax[0] * d + (sx[0] * ca + sz[0] * sa) * r + bx, y0 + ax[1] * d + (sx[1] * ca + sz[1] * sa) * r, z + ax[2] * d + (sx[2] * ca + sz[2] * sa) * r);
        const f = cap ? -1 : 1; N.push((sx[0] * ca + sz[0] * sa) * f, (sx[1] * ca + sz[1] * sa) * f + (cap ? 0.6 : 0), (sx[2] * ca + sz[2] * sa) * f);
        A.push(d, a, seed, cap ? 1 : 0);
      }
    }
    for (let k = 0; k < RINGS; k++) for (let s = 0; s < SIDES; s++) { const a = start + k * SIDES + s, b = start + k * SIDES + (s + 1) % SIDES; I.push(a, b, a + SIDES, b, b + SIDES, a + SIDES); }
    const top = [x + ax[0] * L, z + ax[2] * L], hTop = ax[1] * L - 0.5, far = Math.min(60, hTop / Math.max(0.12, sunFlat.t));
    // the cast shadow, draped over the sand in short pieces (one long quad would hang in the air over the curve of the dune)
    const ex = top[0] - sunFlat.x * far, ez = top[1] - sunFlat.z * far, NS = Math.max(2, Math.ceil(far / 2.2));
    for (let q = 0; q < NS; q++) {
      const t0 = q / NS, t1 = (q + 1) / NS, ax0 = lerp(x, ex, t0), az0 = lerp(z, ez, t0), ax1 = lerp(x, ex, t1), az1 = lerp(z, ez, t1);
      shadows.push({ a: [ax0, hA(ax0, az0), az0], b: [ax1, hA(ax1, az1), az1], w: r0 * 1.5, kind: 3, k: 0.6 * (1 - 0.75 * t0) });
    }
    shadows.push({ a: [x - 0.9, hA(x, z), z + 0.15], b: [x + 0.9, hA(x, z), z + 0.15], w: 0.8, kind: 2, k: 0.5 });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
  const m = shader(U, /* glsl */`
    attribute vec4 aK; varying vec4 vK; varying vec3 vN; varying vec3 vV;
    #include <fog_pars_vertex>
    void main(){ vK=aK; vN=normal; vV=cameraPosition-position; vec4 mvPosition=viewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    varying vec4 vK; varying vec3 vN; varying vec3 vV;
    ${LIGHT_GLSL}
    ${NOISE_GLSL}
    #include <fog_pars_fragment>
    void main(){
      vec3 n=normalize(vN+vec3(0.,1e-4,0.)); float d=vK.x, a=vK.y, s=vK.z;
      float ring=sin(d*17.+vn(vec2(a*1.5,d*2.+s))*2.5);
      float fib=vn(vec2(a*9.+s,d*1.4))*0.6+vn(vec2(a*26.,d*4.+s))*0.4;
      float crack=smoothstep(0.78,0.9,vn(vec2(a*5.+s*3.,d*0.6)));
      n=normalize(n+vec3(0.,0.25*ring*ring*sign(ring),0.)*0.5+vec3(fib-.5)*0.25);
      vec3 alb=mix(vec3(0.43,0.43,0.42),vec3(0.3,0.285,0.265),vn(vec2(a*1.3+s,d*0.45)))*(0.66+0.34*smoothstep(-0.6,0.6,ring)+0.34*(fib-.5));
      alb=mix(alb,vec3(0.1,0.085,0.07),crack*0.75);
      alb=mix(alb,vec3(0.13,0.1,0.08),vK.w*0.85);                      // the hollow, rotted top
      alb*=mix(0.7,1.,smoothstep(0.5,1.2,d));                           // sand-scoured, damp foot
      gl_FragColor=vec4(tlLit(alb,n,1.),1.);
      #include <fog_fragment>
    }`, { side: THREE.DoubleSide });
  return meshOf(g, m, 'buried-trunks');
}

// ---------------------------------------------------------------- the portal's mirror image: the lower half of the ring, below the water
function makeMirror(U, W, color) {
  const P = [], A = [], I = [], RS = [0, 3.2, 6.1, 6.6, 7.0, 7.4, 8.2], SEG = 28;
  for (let i = 0; i <= SEG; i++) { const th = Math.PI + (i / SEG) * Math.PI; for (const r of RS) { P.push(Math.cos(th) * r, W + Math.sin(th) * r, ZE + 0.08); A.push(r, -Math.sin(th) * r); } }
  for (let i = 0; i < SEG; i++) for (let k = 0; k < RS.length - 1; k++) { const a = i * RS.length + k, b = a + RS.length; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(A, 2)); g.setIndex(I);
  const c = new THREE.Color(color);
  const m = shader({ ...U, uCol: { value: new V3(c.r, c.g, c.b) }, uShow: { value: 0 } }, /* glsl */`
    attribute vec2 aR; uniform float uTime; varying vec3 vR;
    void main(){
      vec3 p=position; float dep=aR.y;
      p.x+=dep*(0.035*sin(dep*2.1-uTime*2.6)+0.02*sin(dep*5.3+uTime*3.7+p.x));
      vec4 mv=viewMatrix*vec4(p,1.); vR=vec3(aR,-mv.z); gl_Position=projectionMatrix*mv;
    }`, /* glsl */`
    uniform vec3 uCol; uniform float uTime, uShow; varying vec3 vR;
    ${NOISE_GLSL}
    void main(){
      float r=vR.x, dep=vR.y;
      float ring=exp(-(r-7.)*(r-7.)*2.2), fill=(1.-smoothstep(5.5,6.9,r))*0.3;
      float br=0.5+0.5*sin(dep*6.5-uTime*3.2+vn(vec2(r*0.8,dep*1.2-uTime*0.6))*6.);
      float a=(ring*1.5+fill)*mix(1.,0.35+0.65*br,smoothstep(0.1,1.6,dep))*exp(-dep*0.09)*smoothstep(0.02,0.25,dep);
      a*=smoothstep(8.,20.,vR.z)*(1.-smoothstep(380.,470.,vR.z))*uShow;
      gl_FragColor=vec4(uCol*a*2.6,1.);
    }`, { transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
  return meshOf(g, m, 'portal-mirror', 3);
}

// ---------------------------------------------------------------- the clearing squall: a shower standing over its own ground, ahead-right
// A cloud bank a kilometre long over SQUALL (a place in the world, 0.9 to 1.8 km from the flight line): soft billowed
// heads white in the low sun, a flat slate base, and under it grey veils of rain trailing down to the dunes, slanting
// with the wind, in shafts of uneven length that thin out at either end. It is built of soft puffs and veils that stand
// in the world (the sheet and the far rings darken the wet sand under it: sqK), so it crosses the frame as we turn,
// grows as we near it and passes to the side. Never a patch fixed to the frame, never a hard edge.
function makeSquall(U, rng) {
  const group = new THREE.Group(); group.name = 'squall';
  const BASE = 190, C = 0.7071, at = (s, d) => [SQUALL.x + C * (s + d), SQUALL.z + C * (s - d)];      // s along the bank, d away from the flight line
  const su = { ...U };
  { // ---- rain: veils hanging from the base, each turned to face whoever looks; the far ones first
    const V = [];
    const veil = (s, d, w, alpha, slant, reach) => { const [x, z] = at(s, d); V.push([d, x, z, w, alpha, slant, rng(), reach]); };
    veil(10, 70, 660, 0.62, 80, -0.5); veil(-130, 0, 540, 0.5, 95, -0.4); veil(150, -55, 480, 0.5, 70, -0.4);
    for (let i = 0; i < 13; i++) { const s = -430 + 860 * (i + rng()) / 13, end = Math.abs(s) / 430; veil(s, rng.range(-95, 95), rng.range(90, 210), rng.range(0.38, 0.62), rng.range(60, 120), -0.25 + 0.75 * end * end + rng.range(0, 0.2)); }
    V.sort((p, q) => q[0] - p[0]);
    const n = V.length, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4);
    V.forEach((v, i) => { iP.set([v[1], v[2], v[3], v[4]], i * 4); iQ.set([v[5], v[6], BASE + 22, v[7]], i * 4); });
    const g = new THREE.PlaneGeometry(2, 2, 6, 8);
    const m = shader(su, /* glsl */`
      attribute vec4 iP, iQ; varying vec4 vR; varying vec2 vS;
      #include <fog_pars_vertex>
      void main(){
        float v=position.y*.5+.5, fall=1.-v;
        // the rain is carried downwind (+Z) as it falls, more the lower it gets
        vec3 c=vec3(iP.x+0.15*iQ.x*fall*fall,mix(-6.,iQ.z,v),iP.y+iQ.x*fall*(0.4+0.6*fall));
        vec3 toC=cameraPosition-c; vec3 rt=normalize(vec3(toC.z,0.,-toC.x)+vec3(1e-4,0.,0.));
        float hw=iP.z*0.5*(1.+0.2*fall);
        vec3 w=c+rt*position.x*hw;
        vR=vec4(position.x,v,position.x*hw,iP.w); vS=iQ.yw;
        vec4 mvPosition=viewMatrix*vec4(w,1.); gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      uniform float uTime; varying vec4 vR; varying vec2 vS;
      ${NOISE_GLSL}
      #include <fog_pars_fragment>
      void main(){
        float a=vR.x, v=vR.y, am=vR.z, sd=vS.x*31.;
        // shafts: broad columns of heavier and lighter rain, finer streaks inside them, all sliding down
        float c1=vn(vec2(am*0.021+sd,v*0.35+uTime*0.02)), c2=vn(vec2(am*0.075+sd*3.,v*0.9+uTime*0.07)), c3=vn(vec2(am*0.24+sd*7.,v*2.4+uTime*0.3));
        float streak=c1*0.5+c2*0.32+c3*0.18;
        // a frayed edge either side, and shafts of uneven length: some reach the dunes, some hang in the air
        float edge=1.-smoothstep(0.25,1.,abs(a)+0.55*(vn(vec2(v*2.1+sd,a*1.6+sd*2.))-.5)+0.25*(c2-.5));
        float reach=vS.y+0.9*(c1-.5)+0.35*(c2-.5);
        float hang=smoothstep(reach-0.22,reach+0.3,v);
        float dens=edge*hang*(0.3+0.95*smoothstep(0.22,0.72,streak))*smoothstep(-0.02,0.1,v)*(1.-smoothstep(0.94,1.,v));
        vec3 col=mix(vec3(0.135,0.18,0.275),vec3(0.25,0.31,0.43),0.6*smoothstep(0.45,0.85,c2)*v);
        gl_FragColor=vec4(col,clamp(dens*vR.w,0.,1.));
        #include <fog_fragment>
      }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    group.add(meshOf(instanced(g, { iP: [iP, 4], iQ: [iQ, 4] }, n), m, 'squall-rain', -0.6)); }
  { // ---- the cloud bank: a slab of flattened puffs for the base, a body, and heads piled into three towers
    const crown = (s) => 60 + 140 * Math.exp(-(((s - 70) / 150) ** 2)) + 90 * Math.exp(-(((s + 230) / 110) ** 2)) + 75 * Math.exp(-(((s - 310) / 90) ** 2));
    const P = [];
    const puff = (s, d, y, r, sq, kind) => { const [x, z] = at(s, d); P.push([d - y * 0.3, x, y, z, r, sq, rng(), kind]); };
    for (let i = 0; i < 26; i++) puff(-450 + 900 * (i + rng()) / 26, rng.range(-115, 115), BASE + rng.range(26, 44), rng.range(120, 165), 0.42, 0);
    for (let i = 0; i < 30; i++) { const s = -410 + 820 * (i + rng()) / 30; puff(s, rng.range(-95, 95), BASE + rng.range(50, 0.55 * crown(s) + 45), rng.range(92, 138), 0.82, 1); }
    for (let i = 0; i < 36; i++) { const s = -400 + 800 * (i + rng()) / 36, c = crown(s); puff(s, rng.range(-70, 70), BASE + c * rng.range(0.6, 1), rng.range(52, 96) * (0.75 + 0.25 * c / 200), 1, 2); }
    for (let i = 0; i < 8; i++) puff((i & 1 ? 1 : -1) * rng.range(440, 540), rng.range(-70, 70), BASE + rng.range(30, 60), rng.range(60, 100), 0.5, 0);
    P.sort((p, q) => q[0] - p[0]);
    const n = P.length, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4);
    P.forEach((v, i) => { iP.set([v[1], v[2], v[3], v[4]], i * 4); iQ.set([v[5], v[6], v[7], 0], i * 4); });
    const m = shader(su, /* glsl */`
      attribute vec4 iP, iQ; uniform float uTime; varying vec2 vUv; varying vec3 vQ; varying vec3 vRt; varying vec3 vUp; varying vec3 vFw;
      #include <fog_pars_vertex>
      void main(){
        vec3 c=iP.xyz; c.y+=5.*sin(uTime*0.13+iQ.y*40.)*step(0.5,iQ.z);                  // the heads heave slowly; the base lies still
        vec3 f=normalize(cameraPosition-c+vec3(0.,1e-3,0.));
        vec3 rt=normalize(vec3(f.z,0.,-f.x)+vec3(1e-4,0.,0.)), up=cross(f,rt);
        vec3 w=c+(rt*position.x+up*position.y*iQ.x)*iP.w;
        vUv=position.xy; vQ=vec3(iQ.yz,w.y); vRt=rt; vUp=up; vFw=f;
        vec4 mvPosition=viewMatrix*vec4(w,1.); gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      uniform vec3 uSun,uSunCol,uFill; uniform float uTime; varying vec2 vUv; varying vec3 vQ; varying vec3 vRt; varying vec3 vUp; varying vec3 vFw;
      ${NOISE_GLSL}
      #include <fog_pars_fragment>
      void main(){
        vec2 q=vUv; float r=length(q), sd=vQ.x*37.;
        // a billowed, soft-edged ball: its rim swells and hollows, and wanders slowly
        float n1=vn(q*2.1+sd+uTime*0.012), n2=vn(q*5.3+sd*3.-uTime*0.02);
        float a=1.-smoothstep(0.4,0.96,r+0.36*(n1-.5)+0.17*(n2-.5));
        float zz=sqrt(max(1.-min(r*r,1.),0.));
        vec3 n=normalize(vRt*q.x+vUp*q.y+vFw*zz*0.9+vec3(0.,1e-4,0.));
        float hk=clamp((vQ.z-${BASE.toFixed(1)})/150.,0.,1.), top=smoothstep(0.04,0.5,hk);
        float lit=smoothstep(-0.3,0.7,dot(n,uSun)+0.25*(n1-.5))*top*mix(0.3,1.,step(1.5,vQ.y)+0.6*step(0.5,vQ.y)*(1.-step(1.5,vQ.y)));
        // the base and every shaded flank are slate blue, darkest underneath; the sunward heads are white
        vec3 shade=mix(vec3(0.115,0.145,0.215),vec3(0.31,0.38,0.52),top*(0.55+0.45*n.y))*(0.9+0.2*n2);
        vec3 col=mix(shade,vec3(0.80,0.79,0.77)*(uSunCol*0.92+uFill*0.2),clamp(lit,0.,1.));
        a*=smoothstep(${(BASE - 22).toFixed(1)},${(BASE + 26).toFixed(1)},vQ.z)*0.94;      // the flat base
        gl_FragColor=vec4(col,clamp(a,0.,1.));
        #include <fog_fragment>
      }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    group.add(meshOf(instanced(QUAD(), { iP: [iP, 4], iQ: [iQ, 4] }, n), m, 'squall-cloud', -0.5)); }
  return group;
}

// ---------------------------------------------------------------- RARE: the slab avalanche on the tall slip face
// A draped patch 128 m wide: on the face, sheets of sand streaming down behind a lobed front under a dark scarp;
// on lagoon 3 beyond the foot, a milk-white bloom spreading with wavelets running ahead of it. uSlab 0..1.
function makeSlab(U, hero, xc, HW) {
  const hA = hero.heightAt, W = hero.anchors.waterLevel, c = hero.anchors.crests[2].position, tanL = Math.tan(32 * Math.PI / 180);
  const NXC = 42, NR = 19, FACE = 12, P = [], A = [], I = [], foot = [];
  for (let i = 0; i <= NXC; i++) {
    const xn = (i / NXC) * 2 - 1, x = xc + xn * HW; let zb = c.z, hb = -1e9;      // the part of the face we fly at across lagoon 3 and climb over
    for (let z = c.z - 16; z < c.z + 100; z += 1) { const h = hA(x, z); if (h > hb) { hb = h; zb = z; } }
    const run = Math.max(6, (hb - W) / tanL + 1.5); foot.push([x, zb + run, zb, run]);
    for (let k = 0; k <= NR; k++) {
      const t = k <= FACE ? k / FACE : 1 + ((k - FACE) / (NR - FACE)) * 0.55, z = zb + 0.7 + Math.min(t, 1) * run + Math.max(0, t - 1) * 64;
      P.push(x, Math.max(hA(x, z), W) + (t <= 1 ? 0.1 : 0.05), z); A.push(xn, t, hA(x, z) < W - 0.03 ? 1 : 0);
    }
  }
  for (let i = 0; i < NXC; i++) for (let k = 0; k < NR; k++) { const a = i * (NR + 1) + k, b = a + NR + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  const su = { ...U, uSlab: { value: 0 } };
  const m = shader(su, /* glsl */`
    attribute vec3 aS; varying vec3 vS; varying vec3 vW;
    #include <fog_pars_vertex>
    void main(){ vS=aS; vW=position; vec4 mvPosition=viewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition; gl_Position.z-=0.0005*gl_Position.w;
      #include <fog_vertex>
    }`, /* glsl */`
    uniform float uSlab,uTime; uniform vec3 uSand,uMint; varying vec3 vS; varying vec3 vW;
    ${LIGHT_GLSL}
    ${NOISE_GLSL}
    #include <fog_pars_fragment>
    void main(){
      float xn=vS.x, t=vS.y; vec2 xz=vW.xz; vec3 col; float a;
      float ex=1.-smoothstep(0.6,0.97,abs(xn)+0.16*(vn(vec2(xz.x*0.09,3.))-.5)+0.08*t);
      if(t<=1.){
        float f=uSlab*4., live=1.-smoothstep(0.86,1.,uSlab);
        float tt=t+0.17*(vn(vec2(xz.x*0.12,7.))-.5)+0.07*(vn(vec2(xz.x*0.45,2.))-.5);        // the lobed front
        float behind=(1.-smoothstep(f-0.04,f,tt))*smoothstep(0.08,0.16,t);
        // sheets of sand sliding: meandering lanes drawn out down the fall line, crossed by roll waves running down them
        float xw=xz.x+3.6*(vn(vec2(xz.x*0.05,t*2.5-uTime*0.25))-.5);
        float s1=vn(vec2(xw*0.8,t*1.3-uTime*0.9)), s2=vn(vec2(xw*2.8,t*2.6-uTime*1.9));
        float roll=0.5+0.5*sin(t*24.-uTime*5.+vn(vec2(xw*0.3,t*4.))*6.);
        float sheets=smoothstep(0.3,0.7,s1*0.58+s2*0.32+roll*0.10);
        float act=max(1.-smoothstep(0.7,3.0,f-tt),0.34);                  // the slide is a wave: behind it the face runs thin, then quiet
        col=uSand*(uFill*mix(0.5,0.94,sheets)+uSunCol*mix(0.03,0.12,sheets));        // sliding sand in the face's own shade: pale blue-white, not sunlit
        a=ex*behind*(0.22+0.56*sheets)*act*live;
        float lip=ex*(1.-smoothstep(0.,0.065,abs(tt-f+0.03)))*step(f,1.15)*live;
        col=mix(col,uSand*(uFill*1.0+uSunCol*0.42),lip); a=max(a,lip);
        // THE SCARP: the dark step the slab broke away from, a ragged crown a few metres under the brink with a clean upper
        // edge and a torn lower one, in its own deep shade, and a paler lip of loose sand still crumbling off its foot
        float sc0=0.045+0.04*vn(vec2(xz.x*0.19,1.))+0.015*vn(vec2(xz.x*0.9,5.)), sc1=sc0+0.09+0.09*vn(vec2(xz.x*0.33,4.))+0.03*vn(vec2(xz.x*1.7,2.));
        float scK=ex*smoothstep(0.,0.05,uSlab);
        float scarp=scK*smoothstep(sc0-0.007,sc0,t)*(1.-smoothstep(sc1-0.018,sc1,t));
        float crumb=scK*(1.-smoothstep(0.,0.07,abs(t-sc1-0.02)))*smoothstep(0.35,0.7,vn(vec2(xz.x*1.3,t*30.-uTime*1.5)))*live;
        col=mix(col,uSand*(uFill*1.05+uSunCol*0.3),crumb*0.8); a=max(a,crumb*0.8);
        col=mix(col,uSand*uFill*mix(vec3(0.13,0.17,0.26),vec3(0.24,0.3,0.42),smoothstep(sc0,sc1,t)),scarp); a=max(a,scarp*0.96);
      } else {
        float gr=smoothstep(0.06,0.7,uSlab), tw=(t-1.)/0.55;
        float edge=gr*1.15-0.2+0.3*(vn(vec2(xz.x*0.11,tw*3.+uTime*0.15))-.5)*gr;
        float milk=ex*(1.-smoothstep(edge-0.16,edge,tw))*smoothstep(0.,0.15,gr);
        float churn=vn(vec2(xz.x*0.5+uTime*0.3,tw*9.-uTime*0.8));
        col=mix(uMint*1.05,vec3(0.78,0.86,0.86),0.55+0.45*churn)*(uFill*0.95+uSunCol*0.24);
        a=milk*(0.75+0.2*churn)*smoothstep(0.5,0.95,vS.z);
        float wv=sin((tw-edge)*46.-uTime*5.);
        float wave=smoothstep(0.5,0.95,vS.z)*smoothstep(0.75,1.,wv)*smoothstep(edge,edge+0.06,tw)*(1.-smoothstep(edge+0.1,edge+0.55,tw))*gr*(1.-smoothstep(0.85,1.,abs(xn)))*0.5;
        if(wave>a){ col=vec3(0.9,0.95,0.97)*(uFill*0.6+uSunCol*0.7); a=wave; }
      }
      gl_FragColor=vec4(col,clamp(a,0.,1.));
      #include <fog_fragment>
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
  return { mesh: meshOf(g, m, 'slab-avalanche', 1), uniforms: su, foot };
}

// ---------------------------------------------------------------- the crest veil: blown sand streaming past the camera
// A box of soft sprites that wraps round the camera and rides the wind (+Z, into our face): long streamers lying
// along the wind and broad soft sheets, drawn over sky and ground alike. uVeil 0..1 is keyed to u at each crest.
function makeVeil(rng, U, count) {
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const sheet = i % 3 === 0;
    iA.set([rng(), rng(), rng(), rng()], i * 4);
    iB.set([sheet ? rng.range(5, 9) : rng.range(6, 13), sheet ? rng.range(2.4, 4.2) : rng.range(0.5, 1.3), rng.range(15, 24), sheet ? 1 : 0], i * 4);
  }
  const vu = { ...U, uVeil: { value: 0 }, uSheet: { value: 1 }, uCamW: { value: new V3() } };
  const m = shader(vu, /* glsl */`
    attribute vec4 iA, iB; uniform float uTime,uVeil; uniform vec3 uCamW; varying vec2 vUv; varying vec4 vI;
    void main(){
      const vec3 BOX=vec3(40.,17.,52.);
      vec3 f=fract(vec3(iA.x,iA.y,iA.z+uTime*iB.z/BOX.z)+uCamW/BOX*vec3(-1.,-1.,-1.));
      vec3 rel=(f-.5)*BOX; rel.z-=6.;
      rel.y+=1.2*sin(uTime*0.9+iA.w*30.+rel.z*0.12); rel.x+=1.5*sin(uTime*0.6+iA.w*17.+rel.z*0.09);
      vec3 c=uCamW+rel;
      vec3 toC=normalize(uCamW-c+vec3(1e-3,0.,0.));
      vec3 ax=normalize(vec3(0.12*sin(iA.w*40.),-0.07,1.)), sd=normalize(cross(ax,toC)+vec3(0.,1e-4,0.));
      vec3 w=c+ax*position.x*iB.x*0.5+sd*position.y*iB.y*0.5*(1.+0.6*iB.w);
      vec3 e=1.-smoothstep(vec3(0.34),vec3(0.5),abs(f-.5));
      float d=length(rel);
      vUv=position.xy; vI=vec4(uVeil*e.x*e.y*e.z*smoothstep(1.5,5.5,d),iA.w,smoothstep(-9.,11.,rel.x),iB.w);
      gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);
    }`, /* glsl */`
    uniform vec3 uSand,uSunCol,uFill; uniform float uSheet; varying vec2 vUv; varying vec4 vI;
    ${NOISE_GLSL}
    void main(){
      float along=1.-vUv.x*vUv.x, across=exp(-vUv.y*vUv.y*3.2);
      float st=0.45+0.9*vn(vec2(vUv.x*2.2+vI.y*31.,vUv.y*4.5+vI.y*7.));
      float a=along*along*across*st*mix(0.72,0.42*uSheet,vI.w)*vI.x;
      vec3 col=uSand*mix(uFill*0.42+uSunCol*1.02,uFill*0.9+uSunCol*0.22,vI.z*0.75);
      gl_FragColor=vec4(col,clamp(a,0.,1.));
    }`, { transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
  return { mesh: meshOf(instanced(QUAD(), { iA: [iA, 4], iB: [iB, 4] }, count), m, 'crest-veil', 4), uniforms: vu };
}

// ---------------------------------------------------------------- the lagoon under a portal camera
// Seen through the previous world's portal, the engine clips away everything nearer than the opening, and from
// half a metre up that is all the water below the first degree under the horizon: the lower half of the disc would
// be bare sky-dome. This bowl hangs under whichever camera draws us and paints the water plane where each ray
// meets it (colour, ripples, mirrored sky, glitter, fog with distance). Everything real is drawn over it.
function makeUnderlay(U, hero) {
  const P = [0, -0.55, 0], I = [], N = 40;
  for (let i = 0; i < N; i++) { const a = i / N * TAU; P.push(Math.cos(a), 0.004, Math.sin(a)); I.push(0, 1 + i, 1 + (i + 1) % N); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const SH = hero.sheetUniforms, uu = { ...U, uWater: hero.uniforms.uWater, uZen: SH.uZen, uNight: SH.uNight, uGlit: SH.uGlit, uCamW: { value: new V3() } };
  const m = shader(uu, /* glsl */`
    varying vec3 vDir;
    void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`, /* glsl */`
    uniform vec3 uCamW,uMint,uTurq,uTeal,uHor,uZen,uSand; uniform vec4 uNight; uniform float uTime,uWater,uGlit;
    varying vec3 vDir;
    ${LIGHT_GLSL}
    ${NOISE_GLSL}
    #include <fog_pars_fragment>
    void main(){
      vec3 d=normalize(vDir+vec3(0.,-1e-5,0.)); if(d.y>-0.0015) discard;
      float h=max(uCamW.y-uWater,0.25), t=h/(-d.y); vec2 xz=uCamW.xz+d.xz*t; vec3 V=-d;
      float wob=vn(xz*0.11)*5.+vn(xz*0.9)*1.3, fw=t*t/h*0.0026;                 // a pixel's footprint along the view
      vec3 body=mix(uTurq,uTeal,0.3)*1.04;
      float bedR=0.5+0.5*cos(dot(xz,vec2(-0.5,0.866))*3.1+wob);
      body=mix(body,uSand*uMint*1.7*(0.6+0.2*bedR),0.07*(1.-smoothstep(4.,30.,t)));
      float cat=smoothstep(.45,.75,vn(vec2(xz.x*0.035+3.,xz.y*0.02-uTime*0.11)));
      float amp=(0.03+0.075*cat)/(1.+t*0.01); vec2 g=vec2(0.); float q;
      q=dot(xz,vec2(0.29,0.96))*4.1-uTime*3.1+wob;       g+=vec2(0.29,0.96)*cos(q)*(1.-smoothstep(1.1,2.7,4.1*fw));
      q=dot(xz,vec2(-0.6,0.8))*7.3-uTime*4.2+wob*1.7;    g+=vec2(-0.6,0.8)*cos(q)*0.7*(1.-smoothstep(1.1,2.7,7.3*fw));
      q=dot(xz,vec2(-0.2,0.98))*1.3-uTime*1.6+wob*0.5;   g+=vec2(-0.2,0.98)*cos(q)*0.8*(1.-smoothstep(1.1,2.7,1.3*fw));
      q=dot(xz,vec2(0.12,0.99))*0.42-uTime*0.9+wob*0.3;  g+=vec2(0.12,0.99)*cos(q)*0.55*(1.-smoothstep(1.1,2.7,0.42*fw));
      vec3 n=normalize(vec3(-g.x*amp,1.,-g.y*amp));
      vec3 R=reflect(-V,n); R.y=abs(R.y)+0.015;
      vec3 sky=mix(uHor,uZen,uNight.y+(1.-uNight.y)*pow(clamp(R.y,0.,1.),0.4));
      float fr=uNight.x+(1.-uNight.x)*pow(1.-clamp(dot(V,n),0.,1.),5.);
      vec3 col=mix(body,sky,fr*uNight.z*(1.-uNight.w*smoothstep(40.,350.,t)));
      col*=1.-0.10*cat*(1.-fr);
      vec2 sl=uSun.xz/max(length(uSun.xz),1e-4); float toward=dot(d.xz/max(length(d.xz),1e-4),sl);
      float gs=mix(5.,0.35,smoothstep(8.,420.,t));
      float tk=vn(xz*gs+uTime*vec2(.9,2.3))*vn(xz*gs*1.7-uTime*vec2(1.7,.6)+5.);
      float nearK=1.-smoothstep(6.,16.,t), gn=mix(44.,11.,smoothstep(1.5,12.,t));
      vec2 gq=vec2(dot(xz,vec2(0.96,-0.29))*0.55,dot(xz,vec2(0.29,0.96))*1.5)*gn;
      float tkn=vn(gq+uTime*vec2(1.3,2.9))*vn(gq*1.7-uTime*vec2(2.1,.9)+5.);
      float tkk=mix(smoothstep(.5,.6,tk),smoothstep(.46,.56,tkn)*smoothstep(1.,4.5,t),nearK);
      float tg2=smoothstep(0.05,0.95,toward);
      col+=uSunCol*tkk*tg2*tg2*(0.3+0.7*cat)*3.*uGlit;
      #ifdef FOG_EXP2
        col=mix(col,fogColor,1.-exp(-fogDensity*fogDensity*t*t));
      #endif
      gl_FragColor=vec4(col,1.);
    }`, { depthWrite: false, side: THREE.DoubleSide });
  const mesh = meshOf(g, m, 'lagoon-underlay', -0.5); mesh.scale.setScalar(3000);
  return { mesh, uniforms: uu };
}

// ---------------------------------------------------------------- wading parties in the shallows beside the line
// Parties of up to seven stand feeding where a pool's margin lies beside our line. Each bird stands in a hand to a
// forearm of water (0.14 to 0.4 m), and only where, seen from the line all the way as we come up to it, water or a
// crest's baked shadow lies behind it: never lit sand. No tracks on the sand: nothing here walks.
async function flatParties(ctx, r, hero, plan, waders, shadows) {
  const hA = hero.heightAt, W = hero.anchors.waterLevel, shade = hero.anchors.shadeAt, path = plan.path, L = path.length, e = new V3(), tg = new V3();
  const wet = (x, z) => { const d = W - hA(x, z); return d > 0.14 && d < 0.4; };
  // what lies behind a bird at (x, z), seen from the line: from every point of the 84 m of route before we come abreast
  // of it that has it ahead and 12 to 80 m off, the ray over its back is followed to where it meets ground or water
  const behind = (x, z) => {
    const dN = plan.uAtZ(z) * L, yb = W + 0.75; let seen = 0;
    for (let d = Math.max(0, dN - 84); d <= dN - 6; d += 6) {
      path.posAtDist(d, e); path.tangentAtDist(d, tg);
      const dx = x - e.x, dz = z - e.z, D = Math.hypot(dx, dz); if (D < 12 || D > 80 || dx * tg.x + dz * tg.z < 0.25 * D) continue;
      const sl = (yb - e.y) / D; let ok = false; seen++;
      for (let q = 1.5; q < 150; q += q < 24 ? 1.5 : 5) {
        const px = x + dx / D * q, pz = z + dz / D * q, h = hA(px, pz);
        if (yb + sl * q <= Math.max(h, W)) { ok = h < W - 0.04 || shade(px, pz) < 0.45; break; }
      }
      if (!ok) return false;
    }
    return seen > 0;
  };
  // no home grounds: the whole line is walked from the first shore to the gate, six metres at a step, and a party is
  // seated at the first pool margin beside it (6 to 40 m off, nearest first, either side) that passes; the next party not
  // before a drawn 150 to 250 m further along the line
  for (let d = 30, next = 30; d < L - 60; d += 6) {
    await ctx.yield();
    if (d < next) continue;
    path.posAtDist(d, e); path.tangentAtDist(d, tg);
    const hl = Math.hypot(tg.x, tg.z) || 1, nx = tg.z / hl, nz = -tg.x / hl, ex = e.x, ez = e.z; let c = null;
    for (let off = 6; off <= 40 && !c; off += 3.4) for (const sd of [1, -1]) {
      const x = ex + nx * off * sd, z = ez + nz * off * sd;
      if (Math.abs(x - plan.xAt(z)) > 5.5 && wet(x, z) && behind(x, z)) { c = [x, z]; break; }
    }
    if (!c) continue;
    const here = [];
    for (let i = 0; i < 90 && here.length < 7; i++) {
      const a = r.range(0, TAU), dd = (i ? 1 : 0) * (1 + 9 * Math.sqrt(r())), x = c[0] + Math.cos(a) * dd, z = c[1] + Math.sin(a) * dd;
      if ((i & 15) === 15) await ctx.yield();
      if (!wet(x, z) || Math.abs(x - plan.xAt(z)) < 5.5 || here.some((q) => Math.hypot(q[0] - x, q[1] - z) < 1.3) || !behind(x, z)) continue;
      here.push([x, z]);
      waders.push({ x, z, y: Math.max(hA(x, z), W - 0.42), go: -1, v: 0, rise: 0, dx: 0, dz: -1, yaw: r.range(-3.1, 3.1), ph: r.range(0, TAU) });
    }
    next = d + r.range(150, 250);
  }
}

// ================================================================== THE WORLD
export default {
  id: 'thousand-lagoons',
  name: 'The Thousand Lagoons',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['air', 'water'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    // ---- the look of this visit
    const lookR = rng.fork('tl-look'), rH = lookR(), rS = lookR(), rC = lookR(), rW = lookR();
    const hourKey = vary.hour === 'night' ? 'moon' : vary.hour === 'day' ? 'noon' : vary.hour === 'golden' || vary.hour === 'dawn' ? 'afternoon'
      : rH < 0.42 ? 'afternoon' : rH < 0.62 ? 'noon' : rH < 0.82 ? 'squall' : 'moon';
    const season = rS < 0.5 ? 'july' : rS < 0.75 ? 'june' : 'september';
    const ibisCast = rC < 0.34 && hourKey !== 'moon', storks = rW > 0.6;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare, LK = LOOKS[hourKey], night = hourKey === 'moon';
    const scene = new THREE.Scene();
    const fogCol = new THREE.Color(LK.fog), veilCol = new THREE.Color(LK.veil), fogDens = LK.dens * (season === 'september' ? 1.1 : 1);
    scene.fog = new THREE.FogExp2(fogCol.clone(), fogDens);

    // ---- the hero: sand, lagoons, skimmer line, wakes, plumes
    const hero = await buildHero(ctx, { hour: hourKey, season, waterBias: season === 'july' ? 0.4 : season === 'june' ? 0.25 : 0.72, plumeStrength: 1.2, birdMinPx: 13, birds: Math.round(clamp(200 * density * (season === 'september' ? 0.8 : 1), 120, 260)), autoplay: false });
    scene.add(hero.object);
    const HU = hero.uniforms, SU = hero.sheetUniforms, T = { value: 0 };
    const U = { uSun: HU.uSun, uSunCol: HU.uSunCol, uFill: HU.uFill, uSand: HU.uSand, uTime: T, uMint: SU.uMint, uTurq: SU.uTurq, uTeal: SU.uTeal, uHor: SU.uHor };
    const A = hero.anchors, W = A.waterLevel, hA = hero.heightAt, sunDir = A.sunDir, cr = A.crests, G = A.grove;
    const sunL = Math.hypot(sunDir.x, sunDir.z) || 1, sunFlat = { x: sunDir.x / sunL, z: sunDir.z / sunL, t: Math.max(0.12, sunDir.y / sunL) };
    await ctx.yield();

    // ---- sky, light for companions, drifting trade cumulus
    const skyOpts = { rng, renderer: ctx.renderer, ground: LK.fog, ...LK.sky };
    const sEl = Math.asin(clamp(sunDir.y, -1, 1)) * 180 / Math.PI, sAz = Math.atan2(sunDir.x, -sunDir.z) * 180 / Math.PI;
    if (night) { skyOpts.bake = true; skyOpts.bodyOverrides = { 0: { elevation: sEl, azimuth: sAz, size: 2.3 } }; }
    else { skyOpts.sunElevation = sEl; skyOpts.sunAzimuth = sAz; }
    const sky = makeSky(skyOpts); scene.add(sky.object);
    await ctx.yield();
    // follow off: the rig's follow path calls camera.getWorldDirection(), which rebuilds a portal camera's matrices from its unset .matrix
    const rig = makeLightRig(sky, { bounce: 0.4, follow: false }); scene.add(rig.object);
    await ctx.yield();
    const clouds = makeCloudField({ rng, sky, count: LK.clouds, altitude: 340, altitudeJitter: 50, size: LK.cloudSize, height: 0.42, puffs: 22,
      center: [0, 0, -600], extent: [4200, 3600], wind: [-2.4, 0, 8.6] });
    scene.add(clouds.object);
    await ctx.yield();

    // ---- the route
    const plan = await planPath(ctx, hero, -rng.range(8, 13)), path = plan.path, uAtZ = plan.uAtZ;
    const uC = plan.zB.map(uAtZ);       // where the track crosses the three brinks
    await ctx.yield();

    // ---- far dune rings, sedge, fish
    scene.add(await buildRings(ctx, rng.fork('rings'), U, hero, detail));
    await ctx.yield();
    const sedge = await makeSedge(ctx, rng.fork('sedge'), U, hero, plan, Math.round((season === 'june' ? 4600 : season === 'september' ? 2600 : 3600) * detail * (0.8 + 0.2 * density)));
    scene.add(sedge.mesh);
    await ctx.yield();
    for (let i = 0; i < 6; i++) rng.range(-1.5, 1.5);      // (keeps the seed sequence of everything below as it was)
    const fish = await makeFish(ctx, rng.fork('fish'), U, hero, path, Math.round(3000 * detail));
    scene.add(fish.mesh);
    await ctx.yield();

    // ---- the buriti oasis, a few stragglers along the shore of lagoon 3, and their shadows
    const spots = [], shadows = [], pr = rng.fork('palms'), apart = (x, z, d) => !spots.some((s) => (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z) < d * d);
    // the wading parties in the shallows beside the line
    const flatBirds = []; await flatParties(ctx, makeRng('tl-flats:' + ctx.seed), hero, plan, flatBirds, shadows);
    await ctx.yield();
    for (let i = 0; i < 500 && spots.length < 57; i++) {
      const a = pr.range(0, TAU), r = Math.sqrt(pr()) * 1.2, x = G.x + Math.cos(a) * 62 * r, z = G.z + Math.sin(a) * 44 * r, h = hA(x, z);
      if (h < W - 3.3 || h > W + 1.2 || !apart(x, z, 4.6) || x - plan.xAt(z) < 17) continue;      // all of them on our right, clear of the line; most stand in the pool itself
      spots.push({ x, y: h - 0.3, z, s: pr.range(0.93, 1.2), g: Math.max(h, W) });
    }
    for (let i = 0; i < 400 && spots.length < 63; i++) {
      const z = pr.range(G.z - 70, G.z + 60), x = plan.xAt(z) + pr.range(16, 120), h = hA(x, z);
      if (h < W - 0.9 || h > W + 1.6 || !apart(x, z, 9)) continue;
      spots.push({ x, y: h - 0.3, z, s: pr.range(0.9, 1.2), g: Math.max(h, W) });
    }
    for (const s of spots) {
      const len = Math.min(78, 20 * s.s / sunFlat.t), bx = s.x - sunFlat.x * len, bz = s.z - sunFlat.z * len;
      shadows.push({ a: [s.x, s.g, s.z], b: [bx, Math.max(hA(bx, bz), W), bz], w: 4.4 * s.s, kind: 0, k: night ? 0.4 : 0.5 });
    }
    // the palms nearest our line are the fine ones (we pass within twenty metres of them, just above their crowns)
    for (const s of spots) s.d = Math.abs(s.x - plan.xAt(s.z));
    spots.sort((a, b) => a.d - b.d);
    const nFine = Math.min(spots.length, 24), palmMat = makePalmMaterial(U);
    await ctx.yield();
    const palmFine = palmGeo(pr, true);
    await ctx.yield();
    const palmFar = palmGeo(pr, false);
    await ctx.yield();
    scene.add(makePalms(pr, palmMat, palmFine, spots.slice(0, nFine), 'buriti-palms'));
    scene.add(makePalms(pr, palmMat, palmFar, spots.slice(nFine), 'buriti-palms-far'));
    const palmRefl = makePalmReflections(U, hero, spots); scene.add(palmRefl.mesh);
    await ctx.yield();
    scene.add(makeTrunks(rng.fork('trunks'), U, hero, plan, cr[1].position.z, shadows, sunFlat));
    scene.add(makeShadows(U, shadows));
    await ctx.yield();

    // ---- our mount, the portal's mirror, weather, the rare slab, sand in the air
    const mount = makeMount(U, new THREE.Color('#E8402A')); scene.add(mount.group);
    const cut = makeCut(U); scene.add(cut.group);
    await ctx.yield();
    const streamers = makeStreamers(makeRng('tl-streamers:' + ctx.seed), U, hero); scene.add(streamers.mesh);
    await ctx.yield();
    const mirror = makeMirror(U, W, LK.portal); scene.add(mirror);
    const squall = hourKey === 'squall' ? makeSquall(U, makeRng('tl-squall:' + ctx.seed)) : null; if (squall) scene.add(squall);
    const slab = rare ? makeSlab(U, hero, -112, 92) : null; if (slab) scene.add(slab.mesh);
    const plumeK = HU.uPlume.value;
    await ctx.yield();
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time: T, count: Math.round(1500 * detail * (season === 'september' ? 1.5 : 1)), box: [44, 14, 60],
      velocity: [0.5, -0.1, 10], velocityRandom: [1, 0.4, 3], turbulence: [0.8, 0.4, 0.6], colors: ['#ffffff', '#e6eef6', '#f7f3ea'], size: [0.015, 0.045],
      intensity: night ? 0.12 : 1.05, additive: 0.35, opacity: 0.6, twinkle: 0.7 });
    scene.add(dust.object);
    await ctx.yield();
    const underlay = makeUnderlay(U, hero); scene.add(underlay.mesh);
    const veilFx = makeVeil(rng.fork('veil'), U, Math.round(150 * (0.6 + 0.4 * detail))); scene.add(veilFx.mesh);
    await ctx.yield();

    // ---- terns: three plunges keyed to u (lagoons 1, 2 and 4), the rest hover and plunge on their own clocks
    const tr = rng.fork('terns'), terns = [], pools = A.lagoons, _a = new V3(), _b = new V3();
    // a keyed plunge strikes the water some six metres ahead-left (or right) of the line at the place we reach at uImp; if
    // sand or a bar lies there the strike point slides on down the line to the first water a third of a metre deep
    const keyed = (uImp, side, ahead = 5.5, lat = 3.4, sz = 1.1) => {
      const p = path.pointAt(uImp, _a), t = path.tangentAt(uImp, _b), hl = Math.hypot(t.x, t.z) || 1, tx = t.x / hl, tz = t.z / hl;
      for (let q = 0; q < 10 && W - hA(p.x + tx * ahead - tz * side * lat, p.z + tz * ahead + tx * side * lat) < 0.33; q++) ahead += 1.5;
      return { x: p.x + tx * ahead - tz * side * lat, z: p.z + tz * ahead + tx * side * lat, h0: Math.max(3.2, p.y - W - 1.3), P: 8, ph: tr.range(0, TAU), uImp, sz };
    };
    // the first one plunges ahead-left of us as we reach the far end of our skim on lagoon 1; the others on lagoon 2 and lagoon 4
    terns.push(keyed(uAtZ(plan.skims[0][1] + 3), -1), keyed(uAtZ(pools[1].position.z + 12), -1), keyed(uAtZ(-226), 1));
    // over the oasis pool five hover and plunge on their own clocks: the first over the deep water nearest our line
    // (they draw from a stream of their own, so the terns dealt before them in older versions keep their places on every seed)
    { const gr = makeRng('tl-grove-terns:' + ctx.seed), k = { x: G.x - 44, z: G.z, h0: 6.5, P: 8, ph: gr.range(0, TAU), uImp: -1, sz: 1.3 }; for (let q = 0; q < 14 && W - hA(k.x, k.z) < 0.8; q++) k.x += 2; terns.push(k);
      for (let i = 0; i < 40 && terns.length < 8; i++) { const a = gr.range(0, TAU), r = Math.sqrt(gr()) * 0.62, x = G.x + Math.cos(a) * 60 * r, z = G.z + Math.sin(a) * 42 * r, h0 = gr.range(5, 9), P = gr.range(6, 9.5), ph = gr.range(0, TAU);
        if (W - hA(x, z) > 0.8) terns.push({ x, z, h0, P, ph, uImp: -1, sz: 1.2 }); } }
    const nTern = terns.length + (ibisCast ? 0 : Math.round(clamp(22 * density, 12, 28)) - 3);
    for (let i = 0; i < 400 && terns.length < nTern; i++) {
      const L = pools[tr.int(0, pools.length - 1)], x = L.position.x + tr.range(-0.3, 0.3) * L.radii[0], z = L.position.z + tr.range(-0.6, 0.6) * L.radii[1];
      if (W - hA(x, z) < 0.3 || Math.abs(x - plan.xAt(z)) < 7) continue;
      terns.push({ x, z, h0: tr.range(4, 9), P: tr.range(7, 12), ph: tr.range(0, TAU), uImp: -1, sz: 1.1 });
    }
    const ternB = makeBirds(BIRD_SPECS.tern(), terns.length, U, 'terns'); scene.add(ternB.mesh);
    const splashBase = terns.length * 2, splash = makeSplashes(splashBase + 43, U); scene.add(splash.mesh);
    await ctx.yield();

    // ---- egrets (or wood storks): two lift off right of lagoon 2, six rise left over lagoon 4, the rest stand and strike
    const er = rng.fork('waders'), waders = [];
    const wade = (x, zFrom, zTo) => { const st = zTo > zFrom ? 0.5 : -0.5; for (let z = zFrom; (zTo - z) * st > 0; z += st) { const d = W - hA(x, z); if (d > 0.14 && d < 0.4) return z; } return null; };
    const stand = (x, z) => Math.max(hA(x, z), W - 0.42);
    const lifter = (x, z, go, dx, dz, v, rise, ph = er.range(0, TAU)) => { const l = Math.hypot(dx, dz); waders.push({ x, z, y: stand(x, z), go, v, rise, dx: dx / l, dz: dz / l, yaw: Math.atan2(-dx, -dz), ph }); };
    // lagoon 2: two stand in the shallows nine metres right of our line, where it comes down onto the water (the first place
    // along the line, from dune 1's brink on, where the bed nine metres to our right is a hand to a forearm deep and the lagoon
    // deepens beyond: the teal water is behind them). They spring when we are sixty metres short of them and go low down the
    // lagoon, closing on our line, so we overhaul them half way down the skim. uLift4 is the brief's own beat at lagoon 4.
    const uLift4 = 0.84;
    { const L = path.length, dEnd = uC[1] * L, phPair = [er.range(0, TAU), er.range(0, TAU)]; let spot = null;      // (the pair's two numbers are drawn whether or not a place is found)
      for (let d = uC[0] * L + 20; d < dEnd && !spot; d += 1) {
        path.posAtDist(d, _a); path.tangentAtDist(d, _b); const hl = Math.hypot(_b.x, _b.z) || 1, hx = _b.x / hl, hz = _b.z / hl;
        for (const off of [9, 10.5, 7.5, 12]) { const x = _a.x - hz * off, z = _a.z + hx * off, dep = W - hA(x, z);
          if (dep > 0.14 && dep < 0.4 && W - hA(x + hx * 9, z + hz * 9) > 0.45) { spot = { d, x, z }; break; } }
      }
      if (spot) {
        path.tangentAtDist(Math.min(L, spot.d + 28), _b); const hl = Math.hypot(_b.x, _b.z) || 1, cs = Math.cos(0.14), sn = Math.sin(0.14), hx = (_b.x * cs + _b.z * sn) / hl, hz = (_b.z * cs - _b.x * sn) / hl;
        for (let k = 0; k < 2; k++) {
          let x = spot.x - hz * k * 2.6 + hx * k * 1.2, z = spot.z + hx * k * 2.6 + hz * k * 1.2;
          for (let q = 0; q < 8 && !(W - hA(x, z) > 0.1 && W - hA(x, z) < 0.45); q++) { x += hz * 0.6; z -= hx * 0.6; }
          lifter(x, z, (spot.d - 60 + k * 4) / L, hx, hz, 11.5, (W + 1.1 + k * 0.45 - stand(x, z) - 0.55) / 0.8, phPair[k]);
        }
      } }
    // lagoon 4: six stand left of the line and are nearly 2 s into the air, some 18 m ahead and below us, when we reach uLift4
    // (from the shallows of the near shore they rise across our bows to the left, white on the teal below us)
    for (let k = 0; k < 6; k++) { const x = 9 - k * 2.2, z = wade(x, -160, -225) ?? -190; lifter(x, z + (k % 2) * 1.2, uLift4 - (2.6 - k * 0.13) / DUR, -0.8, -0.6, 7, 9.4 - k * 0.4); }
    const nStand = Math.round(14 * density);
    for (let i = 0, n = 0; i < 300 && n < nStand; i++) {
      const L = pools[er.int(0, pools.length - 1)], x = plan.xAt(L.position.z) + er.sign() * er.range(11, 50) + (L === pools[4] ? G.x - plan.xAt(L.position.z) : 0), z = wade(x, L.position.z + L.radii[1] + 14, L.position.z);
      if (z === null || waders.some((w) => (w.x - x) * (w.x - x) + (w.z - z) * (w.z - z) < 12)) continue;
      waders.push({ x, z: z - 0.3, y: stand(x, z - 0.3), go: -1, v: 0, rise: 0, dx: 0, dz: -1, yaw: er.range(-1.1, 1.1), ph: er.range(0, TAU) }); n++;
    }
    // three more stand in the shallows off the sandbars of lagoon 1, with the blue of dune 1's face behind them
    for (const [bx, bz] of [[-249, 596], [-257, 570], [-314, 585]]) { const z = wade(bx, bz + 9, bz - 9); if (z !== null) waders.push({ x: bx, z, y: stand(bx, z), go: -1, v: 0, rise: 0, dx: 0, dz: -1, yaw: er.range(-1.1, 1.1), ph: er.range(0, TAU) }); }
    // great egrets in the oasis pool, on the shelf of its near shore: from our side the dark teal water is behind every one
    for (let i = 0, n = 0; i < 80 && n < 8; i++) {
      const a = Math.PI + er.range(-1.25, 1.25), ca = Math.cos(a), sa = Math.sin(a); let hit = null;
      for (let r = 1.2; r > 0.3; r -= 0.01) { const x = G.x + ca * 60 * r, z = G.z + sa * 42 * r, d = W - hA(x, z); if (d > 0.2 && d < 0.5) { hit = [x, z]; break; } if (d > 0.5) break; }
      if (!hit || Math.abs(hit[0] - plan.xAt(hit[1])) < 6 || waders.some((w) => (w.x - hit[0]) * (w.x - hit[0]) + (w.z - hit[1]) * (w.z - hit[1]) < 9)) continue;
      waders.push({ x: hit[0], z: hit[1], y: stand(hit[0], hit[1]), go: -1, v: 0, rise: 0, dx: 0, dz: -1, yaw: er.range(-1.6, 0.4), ph: er.range(0, TAU), fast: 1 }); n++;
    }
    // the parties in the shallows beside the line
    for (const b of flatBirds) if (!waders.some((w) => (w.x - b.x) * (w.x - b.x) + (w.z - b.z) * (w.z - b.z) < 2.2)) waders.push(b);
    const waderB = makeBirds(BIRD_SPECS.wader(storks), Math.max(1, waders.length), U, 'waders'); scene.add(waderB.mesh);
    if (!waders.length) waderB.set(0, 0, -50, 0, 0, 0, 0, 0, 0, 0);

    // ---- a skein of scarlet ibis crossing high over the dive (cast variation: in place of the ambient terns)
    const ibisN = ibisCast ? Math.round(clamp(30 * density, 20, 38)) : 0, ibisB = ibisN ? makeBirds(BIRD_SPECS.ibis(), ibisN, U, 'ibis') : null;
    const uX = uC[2] + 0.03, iC = path.pointAt(uX).add(new V3(4, 5, -30)), iD = new V3(0.8, 0, -0.6);       // they cross our bows, close, as the dune sea opens
    if (ibisB) scene.add(ibisB.mesh);
    await ctx.yield();

    const uSlab0 = uC[2] - 0.235, uSlab1 = uC[2], ss = smoothstep, _p = new V3(), _t = new V3(), _h = new V3();
    const pois = makePois(path, uC, W);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    function update(dt, time, camera, u) {
      T.value = time;
      path.pointAt(u, _p); path.tangentAt(u, _t);
      // the camera really drawing us (a portal camera stands back from the entry): read its matrix, never .position
      const ce = camera.matrixWorld.elements, cx = ce[12], cy = ce[13], cz = ce[14], back = u < 0.003 ? Math.max(0, cz - _p.z) : 0;
      // the skimmer line: abreast of us while we skim; from the air it runs on ahead over the water we are about to cross,
      // every bill drawing a long silver wake; at the tall crest it pours over and lofts down the dive. At the entry it
      // is 25 m ahead, so wingmates and wakes sit on the axis, below eye level, when we are seen through a portal.
      const alt = _p.y - W, altK = clamp(alt, 0, 45);
      path.pointAt(Math.min(1, u + 0.02), _h); let hx = _h.x - _p.x, hz = _h.z - _p.z; const hl2 = Math.hypot(hx, hz);
      if (hl2 > 1e-3) { hx /= hl2; hz /= hl2; } else { hx = 0; hz = -1; }
      hero.setHeading(hx, hz);
      const leadAir = Math.min(alt * 2.6, 105) * ss(3, 9, alt) * ss(0.02, 0.04, u) * (1 - ss(uC[2] - 0.05, uC[2] + 0.01, u));
      const leadRev = (22 + 26 * (1 - ss(uC[2] + 0.02, uC[2] + 0.1, u))) * ss(uC[2] - 0.06, uC[2] - 0.005, u) * (1 - ss(0.8, 0.87, u));
      const thru = ss(0.5, 10, back), lead = Math.max(leadAir, leadRev) + 32 * (1 - ss(0, 0.03, u)), early = Math.max(thru, 1 - ss(0.012, 0.03, u)), loft = ss(uC[2] + 0.01, uC[2] + 0.09, u) * (1 - ss(0.77, 0.85, u));
      hero.setLine(_p.z, _p.x, lead, loft);
      hero.setWake(lerp(7.5 + altK * 0.75, 18, thru), 1 + Math.max(0, altK - 6) * 0.08, early); hero.setTilt(0.65 * early);   // seen through a portal the wakes are long silver strokes
      // THE SOAR: as we zoom up off the brink the flock strings out into a V skein far ahead and below us, black on the white ridge
      const skK = ss(uC[2] - 0.145, uC[2] - 0.105, u) * (1 - ss(uC[2] - 0.05, uC[2] - 0.012, u));
      hero.setBirdMinPx(lerp(13 + 23 * (1 - ss(0.008, 0.035, u)) + 7 * ss(0.86, 0.92, u) + 11 * skK, 54, thru), lerp(6, 9, thru));   // the rank ahead of us at the entry stays readable, and large in the disc of a portal
      underlay.mesh.position.set(cx, cy, cz); underlay.uniforms.uCamW.value.set(cx, cy, cz);
      underlay.mesh.scale.setScalar(back > 0.5 ? 3000 : 0.001);        // only a camera standing back from the entry needs it
      // the flock: whenever we are off the water the five nearest pairs fly round us at our own height; at the tall crest
      // seventeen pairs pour over with us and peel away down the dive. At the entry there is no flock: the line skims
      // some 25 m ahead of us, seen from above through a portal, and we settle in abreast of it.
      const hl = Math.hypot(_t.x, _t.z) || 1, slope = clamp(-_t.y / hl, -0.75, 0.75);
      const revK = ss(uC[2] - 0.014, uC[2] + 0.012, u) * (1 - ss(0.79, 0.855, u));
      const flockK = Math.max(ss(2.6, 7, alt) * ss(0.02, 0.04, u) * (1 - ss(0.79, 0.855, u)), revK);
      hero.setSkein(skK);
      // WINGMATES: on every skim the two nearest pairs close in beside us, each at the head of its own furrow (not while a
      // portal camera looks in: then the rank stays ahead on the axis)
      const overWater = ss(0.05, 0.3, W - hA(_p.x, _p.z));
      hero.setNear(overWater * (1 - ss(1.6, 3.2, alt)) * ss(0.002, 0.008, u));
      // THE ESCORT: along the tall brink two pairs of the flock hold station on our right, out over the slip face, dark
      // against the streamers; and the whole flock banks into every turn with us
      const escK = ss(uC[2] - 0.235, uC[2] - 0.2, u) * (1 - ss(uC[2] - 0.145, uC[2] - 0.105, u));
      path.tangentAtDist(Math.min(path.length, u * path.length + 24), _h);
      hero.setEscort(escK, 0.1, clamp((_t.z * _h.x - _t.x * _h.z) * 1.6, -0.5, 0.5));
      hero.setFlock(u > 0 ? cy : W + 1.5, flockK, lerp(lerp(slope, Math.max(slope, 0.25), revK), 0.52, skK), lerp(lerp(u > 0 ? 5 : 4, 17, revK), 17, skK), revK * ss(0.08, 0.2, -_t.y) * (1 - skK));
      hero.setPeel(0.6 * ss(uC[2] + 0.04, 0.84, u));
      // from the tall crest every plume in the dune sea is seen from 300 m and more: they are drawn denser there, and stronger while the reveal lasts
      { const rv = ss(uC[2] - 0.13, uC[2] - 0.09, u) * (1 - ss(0.84, 0.89, u)), bk = ss(uC[2] - 0.235, uC[2] - 0.2, u) * (1 - ss(uC[2] - 0.16, uC[2] - 0.12, u));       // (low along the brink the tall dune's own plume streams across us)
        hero.setPlume(plumeK * (1 + 0.15 * rv - 0.5 * bk), lerp(0.75, 1.3, rv)); }
      // blown sand: only where we pass within a few metres of a crest does the veil of streamers tear past; the air itself
      // barely thickens (the grove two hundred metres on stays sharp through it)
      let veil = 0; for (const c of uC) veil = Math.max(veil, ss(c - 0.034, c - 0.018, u) * (1 - ss(c - 0.006, c + 0.012, u)));
      veil *= 1 - ss(4, 9, _p.y - hA(_p.x, _p.z));
      scene.fog.density = fogDens + veil * 0.002 * Math.min(1.3, plumeK + 0.3); scene.fog.color.copy(fogCol).lerp(veilCol, veil * 0.4);
      const ride = ss(uC[2] - 0.235, uC[2] - 0.2, u) * (1 - ss(uC[2] - 0.17, uC[2] - 0.135, u));
      veil = Math.max(veil, 0.4 * ride);     // riding the tall brink: thin streamers tear past us (no sheets: the air stays clear and the brink sharp)
      veilFx.uniforms.uSheet.value = 1 - ride;
      veilFx.uniforms.uVeil.value = veil * Math.min(1.25, 0.55 + 0.6 * plumeK); veilFx.uniforms.uCamW.value.set(cx, cy, cz);
      palmRefl.uniforms.uCamW.value.set(cx, cy, cz);
      hero.update(dt, time, camera); sky.update(dt, time, camera); rig.update(dt, time, camera); clouds.update(dt, time, camera); dust.update(dt, time, camera);
      mirror.material.uniforms.uShow.value = ss(uC[2] - 0.004, uC[2] + 0.02, u);   // it is drawn without depth: never through the dunes

      // our mount: the bill lies whole along the bottom centre of whatever frame we have (built from the projection in the
      // shader); on a skim the lower mandible opens 40 degrees and the rig is scaled about the eye, which changes nothing in the
      // picture, until its tip rides in the water. Our cut (foam, spray, the furrow) is laid on the lagoon at exactly that point.
      const skim = ss(0.05, 0.3, W - hA(_p.x, _p.z)) * (1 - ss(0.72, 1.15, _p.y - W));
      const pe = camera.projectionMatrix.elements, P0 = Math.max(0.05, pe[0]), P5 = Math.max(0.2, pe[5]);
      const op = 0.035 + 0.663 * skim, ty = -(0.93 / P5 + 0.012) - 0.246 * Math.sin(op), tz = -(1 + 0.246 * Math.cos(op));   // the opened tip, in the camera's space, per unit of rig size
      const zb = lerp(0.6, clamp((cy - W + 0.02) / Math.max(0.15, -(ce[5] * ty + ce[9] * tz)), 0.45, 2.4), skim);
      mount.uniforms.uP.value.set(P0, P5, zb); mount.uniforms.uCamM.value.copy(camera.matrixWorld); mount.uniforms.uSkim.value = skim;
      // wingtips: 3.7 beats a second, shallower while the bill is in the water, half folded (out of the frame) down the dive
      mount.uniforms.uBeat.value.set((time * 23.5) % TAU, lerp(1, 0.82, skim), ss(0.1, 0.22, -_t.y));
      mount.group.visible = u > 0;                                     // seen through a portal (u exactly 0) the camera is not ours: no bill, no wings
      cut.uniforms.uCut.value = skim;
      cut.group.position.set(cx + (ce[4] * ty + ce[8] * tz) * zb, W + 0.04, cz + (ce[6] * ty + ce[10] * tz) * zb); cut.group.rotation.y = Math.atan2(-ce[8], -ce[10]) + Math.PI;
      cut.group.visible = u > 0;
      fish.uniforms.uBill.value.set(_p.x + _t.x * 2, W, _p.z + _t.z * 2);

      for (let i = 0; i < terns.length; i++) {
        const n = terns[i]; let c;
        if (n.uImp >= 0) { const u0 = n.uImp - 0.014; c = u < u0 ? 0.3 : u < n.uImp ? 0.62 + 0.1 * (u - u0) / 0.014 : 0.72 + (u - n.uImp) * DUR / n.P; if (c >= 1) c = 0.3; }
        else c = (time / n.P + n.ph) % 1;
        const wob = time * 0.9 + n.ph; let x = n.x + Math.sin(wob * 0.8) * 0.5, z = n.z + Math.cos(wob * 0.6) * 0.4, y = n.h0 + Math.sin(wob * 1.4) * 0.3, pitch = 0.32, fold = 0, amp = 0.5, sc = n.uImp >= 0 ? 1.8 : 1.5;
        if (c >= 0.62 && c < 0.72) { const d = (c - 0.62) / 0.1; x = lerp(x, n.x, d); z = lerp(z, n.z, d); y = lerp(y, 0.1, d * d); pitch = lerp(0.32, -1.3, ss(0, 0.35, d)); fold = 0.75 * ss(0.1, 0.5, d); amp = 0.5 * (1 - d); }
        else if (c >= 0.72 && c < 0.75) sc = 0;
        else if (c >= 0.75) { const r = (c - 0.75) / 0.25; x = lerp(n.x, x, r); z = lerp(n.z - 1.5 * Math.sin(r * Math.PI), z, r); y = lerp(0.1, y, ss(0, 1, r)); pitch = lerp(0.75, 0.32, r); amp = lerp(0.85, 0.5, r); }
        ternB.set(i, x, W + y, z, 0.25 * Math.sin(wob * 0.5), 1, time * TAU * 5.6 + n.ph * 7, amp, pitch, sc, 0.12 * Math.sin(wob), fold, 0.22);
        const age = c >= 0.72 ? (c - 0.72) * n.P : -1;
        const ssz = n.sz || 1.1; splash.set(i * 2, n.x, W, n.z, age, ssz, 0, i); splash.set(i * 2 + 1, n.x, W, n.z, age, ssz * 0.82, 1, i);
      }
      ternB.commit();

      const wsc = storks ? 1.45 : 1.25;
      for (let i = 0; i < waders.length; i++) {
        const e = waders[i], tau = e.go >= 0 ? (u - e.go) * DUR : -9;
        if (tau < 0) {
          const cro = ss(-0.5, 0, tau), strike = e.go < 0 ? Math.pow(Math.max(Math.sin(time * (e.fast ? 1.1 : 0.55) + e.ph), 0), 14) : 0;
          waderB.set(i, e.x, e.y - 0.1 * cro, e.z, e.yaw, 0, 0, 0, -0.5 * strike - 0.22 * cro + 0.03 * Math.sin(time * 0.8 + e.ph), wsc, 0, 0, 0.1);
        } else {
          const fly = ss(0, 0.45, tau), s = tau < 1.2 ? e.v / 2.4 * tau * tau : e.v * (tau - 0.6), h = 0.55 * fly + e.rise * (1 - Math.exp(-tau * 0.5));
          waderB.set(i, e.x + e.dx * s, e.y + h, e.z + e.dz * s, e.yaw, fly, tau * TAU * (3.1 - 0.5 * ss(0, 3, tau)) + 1.2, lerp(1.0, 0.72, ss(0, 3, tau)), 0.45 * Math.exp(-tau * 0.8) + 0.06, wsc, 0, 0, 0.12);
        }
      }
      waderB.commit();

      if (ibisB) {
        const s = (u - uX) * DUR * 13 + Math.sin(time * 0.3) * 2, yaw = Math.atan2(-iD.x, -iD.z);
        for (let j = 0; j < ibisN; j++) {
          const rank = (j + 1) >> 1, lat = (j & 1 ? 1 : -1) * rank * 2.3 + Math.sin(time * 0.7 + j) * 0.3, al = s - rank * 2.1 + Math.sin(time * 0.5 + j * 2.1) * 0.4;
          ibisB.set(j, iC.x + iD.x * al - iD.z * lat, iC.y + rank * 0.16 + Math.sin(time * 0.9 + j * 1.3) * 0.35, iC.z + iD.z * al + iD.x * lat, yaw, 1, time * TAU * 2.9 - rank * 0.5, 0.62, 0.05, 2.1, 0, 0, 0.12);
        }
        ibisB.commit();
      }

      if (slab) {
        const s = clamp((u - uSlab0) / (uSlab1 - uSlab0), 0, 1); slab.uniforms.uSlab.value = s;
        for (let k = 0; k < 43; k++) {       // a low ragged skirt of dust along the front, then along the foot
          const f = slab.foot[k], fr = Math.min(1, s * 4), age = s > 0.01 && s < 0.8 && Math.abs(k - 21) < 19 ? ((time / 2.6 + k * 0.371) % 1) * 2.6 : -1, pz = fr < 1 ? f[2] + 0.7 + fr * f[3] : f[1] - 1.5 + (k % 4) * 1.3;
          splash.set(splashBase + k, f[0], Math.max(hA(f[0], pz), W) + 0.3, pz, age, 1.1 + (k % 3) * 0.45, 2, k);
        }
      }
      splash.commit();
    }

    return {
      scene, path, duration: DUR,
      // lingers at the top of the soar (the high view), over the summit and down the dive (the reveal); a little quicker up the first climb
      pace: (u) => 1 + 0.1 * ss(0.05, 0.09, u) * (1 - ss(0.15, 0.2, u)) - 0.2 * ss(uC[2] - 0.13, uC[2] - 0.09, u) * (1 - ss(0.82, 0.88, u)) - 0.14 * ss(uC[2] - 0.12, uC[2] - 0.085, u) * (1 - ss(uC[2] - 0.04, uC[2], u)),
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 4200, lookAhead: 24, sway: 0.8, bank: 0.55 },
      pois,
      portal: { shape: 'arch', width: 14, height: 7, color: LK.portal, glow: 1, revealDistance: 420 },
      post: { exposure: LK.exposure, bloom: { strength: LK.bloom, radius: 0.6, threshold: night ? 0.93 : 1.04 },
        grade: { saturation: LK.sat, contrast: LK.contrast, tint: '#ffffff', shadowTint: '#000000', vignette: 0.24, grain: 0.018, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { hero.dispose(); sky.dispose(); },
    };
  },
};
