// Insects: butterflies, moths, dragonflies, bees (instanced meshes) and fireflies (glow sprites).
import * as THREE from 'three';
import { Geo, col, v3, rngOf, creatureMaterial, instancedGeo, creatureMesh, triCount, applyLight, sphereOfPoints, wingReach, hingeReach, pathLine, lineDist } from './common.js';

// Where small things live. In order of priority:
//   positions: [[x,y,z]|Vector3,...]            explicit anchors (cycled if fewer than count)
//   path (+ uFrom, uTo, clear, spread, lift)     scattered beside the camera path: lateral distance clear..spread, height path.y + lift[0..1]
//   center + radius                              a disc around a point
//   heightAt + altitude [lo, hi]                 (with path or center) sit above the ground instead of relative to the path
export function scatterAnchors(opts, rng, count, D = {}) {
  const out = new Float32Array(count * 3), pts = opts.positions, alt = opts.altitude || D.altitude || [0.5, 3], lift = opts.lift || D.lift || [-4, 3];
  const spread = opts.spread ?? D.spread ?? 14, clear = opts.clear ?? D.clear ?? 2.5, hAt = opts.heightAt, p = new THREE.Vector3(), t = new THREE.Vector3();
  const c = v3(opts.center, new THREE.Vector3(0, 2, 0)), rad = opts.radius ?? D.radius ?? 12, cl = opts.cluster ?? D.cluster ?? 0;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (pts && pts.length) { const q = pts[i % pts.length], j = i >= pts.length || opts.jitter ? (opts.jitter ?? 1) : 0; x = (q.x ?? q[0]) + rng.gauss() * j; y = (q.y ?? q[1]) + rng.gauss() * j * 0.5; z = (q.z ?? q[2]) + rng.gauss() * j; }
    else {
      if (cl > 0 && i % cl !== 0) { x = cx + rng.gauss() * 1.2; z = cz + rng.gauss() * 1.2; y = cy + rng.gauss() * 0.5; }
      else if (opts.path) {
        const u = rng.range(opts.uFrom ?? 0.02, opts.uTo ?? 0.98), d = u * opts.path.length; opts.path.posAtDist(d, p); opts.path.tangentAtDist(d, t);
        const s = rng.sign() * rng.range(clear, spread); x = p.x - t.z * s; z = p.z + t.x * s; y = hAt ? hAt(x, z) + rng.range(alt[0], alt[1]) : p.y + rng.range(lift[0], lift[1]);
      } else { const a = rng() * 6.283, r = Math.sqrt(rng()) * rad; x = c.x + Math.cos(a) * r; z = c.z + Math.sin(a) * r; y = hAt ? hAt(x, z) + rng.range(alt[0], alt[1]) : c.y + rng.range(alt[0], alt[1]) - alt[0]; }
      cx = x; cy = y; cz = z;
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
  }
  return out;
}

const INSECT_PRE = /* glsl */`
uniform vec4 uRoam, uFlapI; uniform float uSelf, uBounce; uniform vec3 uColA[8]; uniform vec3 uColB[8];
vec3 hop(float i, float seed){ vec3 h = h31(i * 1.37 + seed); return (h - .5) * 2.; }
`;
const INSECT_TRAJ = /* glsl */`
vec3 traj(float q){
  vec3 h = h31(iB.z);
#if MOTION == 1
  // dart and hover: hold a point, then streak to the next one
  float t = q * uRoam.z * (.7 + .6 * h.x) + h.y * 10., i = floor(t), f = fract(t);
  float k = smoothstep(.62, 1., f);
  vec3 a = hop(i, iB.z), b = hop(i + 1., iB.z), z = hop(i - 1., iB.z);
  vec3 o = mix(a, b, k) * vec3(uRoam.x, uRoam.y, uRoam.x);
  o += vec3(sin(q * 2.3 + h.x * 9.), sin(q * 3.1 + h.y * 9.), cos(q * 2.7 + h.z * 9.)) * .04 * uRoam.x;
  vec2 d0 = (a - z).xz, d1 = (b - a).xz;
  float y0 = atan(d0.x, d0.y), y1 = atan(d1.x, d1.y), dy = mod(y1 - y0 + 3.14159, 6.28318) - 3.14159;
  gYaw = y0 + dy * smoothstep(.45, .66, f);
  return iA.xyz + o;
#else
  float t = q * uRoam.z * (.6 + .8 * h.x);
  vec3 o = vec3(sin(t + h.y * 6.283) + .5 * sin(t * 2.3 + h.z * 9.), .6 * sin(t * 1.7 + h.x * 20.) + .4 * sin(t * 3.1 + h.y * 7.), cos(t * .9 + h.z * 6.283) + .5 * sin(t * 1.9 + h.x * 5.));
  o *= vec3(uRoam.x, uRoam.y, uRoam.x) * .62;
  o += uRoam.w * vec3(sin(q * 11. * (.7 + h.z) + h.x * 30.), sin(q * 13. * (.7 + h.x) + h.y * 30.), cos(q * 9. * (.7 + h.y) + h.z * 30.));
  float fb = (q * uFlapI.x * (.8 + .4 * h11(iB.z)) + iA.w) * 6.2832;
  o.y += uBounce * (.5 - .5 * cos(fb + 1.2));
  return iA.xyz + o;
#endif
}
`;
const INSECT_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float side = aAnim.y, hs = h11(iB.z);
  if(abs(side) > .5){
    float t = (uTime * uFlapI.x * (.8 + .4 * hs) + iA.w) * 6.2832 - aAnim.z;
    float gl = 0.;
    if(uFlapI.w > .01){ float th = 1. - 2. * uFlapI.w; gl = smoothstep(th - .15, th + .15, sin(uTime * (1.1 + .9 * hs) + iB.z * 37.)); }
    float ang = mix(uFlapI.z + uFlapI.y * sin(t), .35, gl);
    float d = aAnim.x, sx = p.x - side * d;
    p.x = sx + side * d * cos(ang); p.y += d * sin(ang);
    n.xy = rot2(-side * ang) * n.xy;
    gThin = 1.;
  }
#ifdef PAINT
  int v = int(iB.y + .5);
  vColor = mix(mix(uColA[v], uColB[v], color.g), vec3(.8, .9, 1.), color.b) * color.r * iTint;
#endif
  gEmit = vColor * uSelf * (abs(side) > .5 ? 1. : .3) + uGlowColor * aGlow;
}
`;
// packed colours: r brightness, g accent mask
const PK = (r, g = 0, b = 0) => new THREE.Color(r, g, b);
function wingPair(g, W, shape, hindLag) {
  const wing = (rim, lag, bright) => {
    const root = rim[0], ids = [], mids = [], n = rim.length;
    const r0 = g.v(root[0], root[1], root[2], PK(0.55));
    for (let i = 1; i < n; i++) { const q = rim[i], spot = shape.spots && i % 2 === 0 && i > 1 && i < n - 1; mids.push(g.v(root[0] + (q[0] - root[0]) * 0.66, q[1], root[2] + (q[2] - root[2]) * 0.66, PK(bright))); ids.push(g.v(q[0], q[1], q[2], spot ? PK(1, 1) : PK(shape.border ?? 0.1, shape.borderMix ?? 0))); }
    for (let i = 0; i < mids.length - 1; i++) { g.tri(r0, mids[i], mids[i + 1]); g.quad(mids[i], ids[i], ids[i + 1], mids[i + 1]); }
    return lag;
  };
  const s0 = g.n;
  wing(shape.fore.map(([x, z]) => [0.012 * W + x * W, 0.01 * W, z * W]), 0, 1);
  const s1 = g.n;
  wing(shape.hind.map(([x, z]) => [0.012 * W + x * W, 0.006 * W, z * W]), hindLag, 0.92);
  g.anim([s0, s1], (x) => [Math.max(0, x - 0.012 * W), 1, 0, 0]); g.anim([s1, g.n], (x) => [Math.max(0, x - 0.012 * W), 1, hindLag, 0]);
  g.mirror([s0, g.n]);
}
const WING_SHAPES = {
  butterfly: { spots: true, border: 0.08, fore: [[0, 0.06], [0.45, 0.5], [0.95, 0.72], [1.0, 0.42], [0.86, 0.12], [0.5, -0.04], [0, -0.04]], hind: [[0, -0.02], [0.55, -0.02], [0.8, -0.2], [0.74, -0.52], [0.42, -0.78], [0.2, -0.6], [0, -0.3]] },
  swallowtail: { spots: true, border: 0.06, fore: [[0, 0.06], [0.5, 0.56], [1.05, 0.8], [1.02, 0.4], [0.82, 0.08], [0.45, -0.05], [0, -0.04]], hind: [[0, -0.02], [0.55, -0.04], [0.76, -0.3], [0.6, -0.62], [0.5, -1.05], [0.36, -0.66], [0, -0.3]] },
  moth: { spots: false, border: 0.45, borderMix: 0.6, fore: [[0, 0.1], [0.5, 0.34], [1.0, 0.3], [0.95, -0.08], [0.6, -0.3], [0.25, -0.3], [0, -0.1]], hind: [[0, -0.05], [0.4, -0.2], [0.62, -0.42], [0.45, -0.66], [0.18, -0.6], [0, -0.35]] },
};
export function butterflyGeometry(S = {}) {
  const g = new Geo(), W = S.span ?? 0.11, shape = WING_SHAPES[S.shape] || WING_SHAPES.butterfly, cB = S.bodyColor ? PK(S.bodyBright ?? 0.12) : PK(0.1);
  g.loft([{ z: -0.6 * W, rx: 0, ry: 0 }, { z: -0.3 * W, rx: 0.035 * W, ry: 0.04 * W }, { z: 0.1 * W, rx: 0.055 * W, ry: 0.06 * W }, { z: 0.3 * W, rx: 0.045 * W, ry: 0.05 * W }, { z: 0.38 * W, rx: 0, ry: 0 }], { sides: 4, top: cB, belly: cB });
  if (S.shape === 'moth') g.paint([0, g.n], (x, y, z, c) => { c.r = 0.55; c.g = 0.5; });
  wingPair(g, W, shape, S.shape === 'moth' ? 0.2 : 0.45);
  return g.build();
}
export const BUTTERFLY_VARIETIES = [['#ff8a14', '#fff2d8'], ['#2a8cff', '#c8ecff'], ['#ffe04a', '#3a6cff'], ['#f6f2e8', '#ffcf4a'], ['#ff6aa8', '#ffe2f0'], ['#8ae04a', '#f4ffc0'], ['#b06aff', '#ffd0ff'], ['#ff4a3a', '#ffd84a']];
export const MOTH_VARIETIES = [['#efe6d2', '#9a8a6c'], ['#f6f3ea', '#cdbfa6'], ['#cbbba0', '#6e5c48'], ['#e6e0f0', '#9a90b4'], ['#dfe8d2', '#8a9a70']];

function makeInsects(base, opts, rng, D) {
  const count = Math.max(1, Math.floor(opts.count ?? D.count)), size = opts.size ?? D.size ?? 1;
  const anchors = scatterAnchors(opts, rng, count, D);
  const vars = (opts.varieties || D.varieties || [['#ffffff', '#ffffff']]).slice(0, 8), nv = vars.length, colA = [], colB = [];
  for (let i = 0; i < 8; i++) { const v = vars[i % nv]; colA.push(col(v[0])); colB.push(col(v[1])); }
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iT = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    iA.set([anchors[i * 3], anchors[i * 3 + 1], anchors[i * 3 + 2], rng()], i * 4);
    iB.set([size * rng.range(0.7, 1.3), rng.int(0, nv - 1), rng() * 100, 0], i * 4);
    const l = rng.range(0.85, 1.1); iT.set([l, l, l], i * 3);
  }
  const roam = opts.roam || D.roam, flap = opts.flap || D.flap, dart = D.motion === 1;
  const material = creatureMaterial({
    instanced: true, upright: dart, light: opts.light, bank: 0, eps: 0.08, level: dart ? undefined : (D.level ?? 0.5),
    pre: INSECT_PRE, traj: INSECT_TRAJ, deform: INSECT_DEFORM, defines: { MOTION: D.motion || 0, ...(D.paint ? { PAINT: 1 } : {}) },
    near: opts.nearFade || [0.5, 1.6], rim: opts.rim ?? D.rim ?? 0.3, spec: D.spec ?? 0.3, shine: D.shine ?? 30, trans: opts.translucency ?? D.trans ?? 1.2, vivid: opts.vivid ?? D.vivid ?? 0.6,
    glow: col(opts.glow ?? D.glow ?? '#000000'),
    uniforms: {
      uRoam: { value: new THREE.Vector4(roam[0], roam[1], roam[2], roam[3]) }, uFlapI: { value: new THREE.Vector4(flap[0], flap[1], flap[2], flap[3]) },
      uSelf: { value: opts.selfLit ?? D.self ?? 0 }, uBounce: { value: opts.bounce ?? D.bounce ?? 0 }, uColA: { value: colA }, uColB: { value: colB }, uThinAlpha: { value: D.thinAlpha ?? 1 },
    },
  });
  const pad = Math.hypot(roam[0], roam[1], roam[0]) * 1.3 + size, sphere = sphereOfPoints(anchors, 3, count, pad);
  const geometry = instancedGeo(base, count, iA, iB, iT), object = creatureMesh(geometry, material, 0, sphere), u = material.uniforms;
  // anchors may be moved after the deal, with no draw: setAnchor(i, x, y, z) moves one; setAnchors(arr) takes a whole array, or with no
  // argument the `anchors` array as the world has edited it. The instance buffer, the bounds and positionAt follow.
  const setAnchors = (a) => { if (a && a !== anchors) anchors.set(a); for (let i = 0; i < count; i++) { iA[i * 4] = anchors[i * 3]; iA[i * 4 + 1] = anchors[i * 3 + 1]; iA[i * 4 + 2] = anchors[i * 3 + 2]; } geometry.attributes.iA.needsUpdate = true; sphere.copy(sphereOfPoints(anchors, 3, count, pad)); };
  // reach: roam [x, y, z] = half-extents of the flight about the anchor, body = radius of the largest member (wings anywhere), radius = both
  let big = 0; for (let i = 0; i < count; i++) big = Math.max(big, iB[i * 4]);
  const rx = Math.abs(roam[0]), ry = Math.abs(roam[1]), rw = Math.abs(roam[3]), rm = dart ? [1.04 * rx, ry + 0.04 * rx, 1.04 * rx] : [0.93 * rx + rw, 0.62 * ry + rw + Math.abs(u.uBounce.value), 0.93 * rx + rw];
  // swept (since s1a) = the true radius of the largest member with its wings anywhere in their beat; body is an older, larger bound (it adds
  // the wing's arm to the whole distance) and stays as it was, since live worlds stand their insects off by it.
  const body = big * wingReach(base), swept = big * hingeReach(base), reach = { roam: rm, body, swept, radius: Math.hypot(rm[0], rm[1], rm[2]) + body };
  // keepClear { path, dist (2), from, to, step (0.5), length, up } (since s1a): KEEPING BY PLACE. After the deal and with no draw, an anchor
  // whose whole flight (the roam's diagonal and the swept body) would come within dist of the camera path is moved level, straight away
  // from the path's nearest point, to where it is clear (tried again up to 8 times, since the nearest point may change). An anchor
  // straight over or under the path has no level way out: with up it goes straight up, without it stays and is counted in short. The
  // kit knows no ground and no wall: a world with either looks at `anchors` afterwards. kept = { need, count: anchors moved, moved:
  // the largest move (m), short: what any anchor still lacks (0 = clear) }; null without keepClear, and the deal is then as before.
  let kept = null; const kc = opts.keepClear;
  if (kc && kc.path) {
    const line = pathLine(kc.path, { step: kc.step ?? 0.5, from: kc.from, to: kc.to, length: kc.length }), q = new THREE.Vector3();
    const need = Math.hypot(rm[0], rm[1], rm[2]) + swept + (kc.dist ?? 2) + (line.sag || 0); let n = 0, most = 0, short = 0;
    for (let i = 0; i < count; i++) {
      const x0 = anchors[i * 3], y0 = anchors[i * 3 + 1], z0 = anchors[i * 3 + 2]; let x = x0, y = y0, z = z0, d = lineDist(line, x, y, z, q);
      if (d >= need) continue;
      for (let p = 0; p < 8 && d < need; p++) {
        const vx = x - q.x, vz = z - q.z, l = Math.hypot(vx, vz);
        if (l < 1e-3) { if (!kc.up) break; y = q.y + need + 1e-3; } else { const t = Math.sqrt(Math.max(0, need * need - (y - q.y) * (y - q.y))) + 1e-3; x = q.x + vx / l * t; z = q.z + vz / l * t; }
        d = lineDist(line, x, y, z, q);
      }
      anchors[i * 3] = x; anchors[i * 3 + 1] = y; anchors[i * 3 + 2] = z; n++; most = Math.max(most, Math.hypot(x - x0, y - y0, z - z0)); short = Math.max(short, need - d);
    }
    if (n) setAnchors();
    kept = { need, count: n, moved: most, short: Math.max(0, short) };
  }
  return { object, material, uniforms: u, geometry, count, anchors, bounds: sphere, triangles: triCount(base) * count, reach, kept, setAnchors, setAnchor(i, x, y, z) { anchors[i * 3] = x; anchors[i * 3 + 1] = y; anchors[i * 3 + 2] = z; setAnchors(); },
    update(dt, time) { u.uTime.value = time; u.uQ.value = time; u.uPhase.value = time; }, setLight(light, over) { applyLight(u, light, over); },
    positionAt(time, pu, out = new THREE.Vector3()) { return out.set(anchors[0], anchors[1], anchors[2]); } };
}
// makeButterflies(opts): fluttering around anchors near the path. ~50 triangles each, 1 draw call.
export function makeButterflies(opts = {}) {
  const rng = rngOf(opts), span = opts.span ?? 0.11;
  return makeInsects(butterflyGeometry({ span, shape: opts.shape || 'butterfly' }), opts, rng, { count: 60, size: 1, paint: true, varieties: BUTTERFLY_VARIETIES, roam: [2.6, 1.0, 0.55, 0.03], flap: [5.5, 0.85, 0.5, 0.18], bounce: 0.12, self: 0.12, altitude: [0.6, 3.2], lift: [-4, 2.5], spread: 14, clear: 2.5 });
}
// makeMoths(opts): pale moths circling lights (positions) or drifting near the path at night; softly self-lit so they read in the dark.
export function makeMoths(opts = {}) {
  const rng = rngOf(opts), span = opts.span ?? 0.09;
  return makeInsects(butterflyGeometry({ span, shape: 'moth' }), opts, rng, { count: 70, size: 1, paint: true, varieties: MOTH_VARIETIES, roam: [1.3, 0.8, 1.5, 0.07], flap: [9, 0.75, 0.3, 0], bounce: 0.05, self: 0.5, vivid: 0.3, altitude: [1, 4], lift: [-3, 3], spread: 10, clear: 2 });
}

// ---------- dragonflies ----------
export function dragonflyGeometry(S = {}) {
  const g = new Geo(), L = S.len ?? 0.13;
  g.blob(0, 0.01 * L, 0.3 * L, 0.075 * L, 0.06 * L, 0.06 * L, PK(0.5, 1), null, 5, 3);
  g.loft([{ z: 0.26 * L, rx: 0.03 * L, ry: 0.03 * L }, { z: 0.16 * L, rx: 0.07 * L, ry: 0.075 * L }, { z: 0.0, rx: 0.06 * L, ry: 0.065 * L }, { z: -0.08 * L, rx: 0.03 * L, ry: 0.032 * L }], { sides: 5, top: PK(0.9), belly: PK(0.5) });
  const ab = [], rr = [], n = 7; for (let i = 0; i <= n; i++) { const t = i / n; ab.push([0, -0.03 * L * Math.sin(t * 2.4), (-0.08 - t * 0.62) * L]); rr.push(i === n ? 0 : 0.026 * L * (1 - 0.35 * t)); }
  const a0 = g.n; g.tube(ab, rr, 4, PK(1), PK(1));
  g.paint([a0, g.n], (x, y, z, c, i) => { const band = Math.floor(((i - a0) / 4)) % 2; c.setRGB(band ? 0.35 : 1, band ? 1 : 0, 0); });
  const w0 = g.n, wing = (z0, sweep, len, ch, ph) => {
    const le = [], te = [], cl = [], ct = [], m = 4;
    for (let i = 0; i <= m; i++) { const t = i / m, x = 0.03 * L + t * len * L, z = z0 * L + sweep * t * L, c = ch * L * (0.55 + 0.6 * Math.sin(Math.min(1, t * 1.1) * 2.6)); le.push([x, 0.07 * L, z + c * 0.4]); te.push([x, 0.07 * L, z - c * 0.6]); cl.push(PK(i === m - 1 ? 0.45 : 0.9, 0, 1)); ct.push(PK(0.8, 0, 1)); }
    const r = g.strip(le, te, cl, ct); g.anim(r, (x) => [Math.max(0, x - 0.03 * L), 1, ph, 0]);
  };
  wing(0.12, 0.05, 0.52, 0.1, 0); wing(0.02, -0.06, 0.5, 0.12, 2.6);
  g.mirror([w0, g.n]);
  return g.build();
}
export const DRAGONFLY_VARIETIES = [['#18d8c8', '#0a2a44'], ['#ff3a2a', '#40100a'], ['#3ae06a', '#103818'], ['#2a7cff', '#0a1840'], ['#ffc02a', '#402808']];
// makeDragonflies(opts): hover-and-dart flight, shimmering dithered wings. ~110 triangles each.
export function makeDragonflies(opts = {}) {
  const rng = rngOf(opts);
  return makeInsects(dragonflyGeometry({ len: opts.length ?? 0.13 }), opts, rng, { count: 24, size: 1, paint: true, motion: 1, varieties: DRAGONFLY_VARIETIES, roam: [2.4, 0.7, 0.75, 0], flap: [26, 0.42, 0.06, 0], self: 0.1, spec: 2.5, shine: 40, thinAlpha: 0.55, trans: 1.5, altitude: [0.4, 2.2], lift: [-4, 1.5], spread: 12, clear: 2 });
}

// ---------- bees ----------
export function beeGeometry(S = {}) {
  const g = new Geo(), L = S.len ?? 0.05, y = col(S.yellow ?? '#ffb81a'), k = col(S.black ?? '#1a1410'), wc = col(S.wing ?? '#dfe8f0');
  const zs = [-0.5, -0.42, -0.28, -0.14, 0.0, 0.1, 0.2, 0.32, 0.42, 0.5], rs = [0, 0.15, 0.24, 0.27, 0.24, 0.17, 0.2, 0.2, 0.14, 0], cs = [k, k, y, k, y, k, y, y, k, k];
  g.loft(zs.map((z, i) => ({ z: z * L, rx: rs[i] * L, ry: rs[i] * L * 0.95, top: cs[i], belly: cs[i] })), { sides: 6 });
  const w0 = g.n, r = g.fan([[0.06 * L, 0.2 * L, 0.2 * L], [0.5 * L, 0.22 * L, 0.1 * L], [0.62 * L, 0.22 * L, -0.15 * L], [0.4 * L, 0.2 * L, -0.3 * L], [0.1 * L, 0.2 * L, -0.02 * L]], wc);
  g.anim(r, (x) => [Math.max(0, x - 0.06 * L), 1, 0, 0]); g.mirror([w0, g.n]);
  return g.build();
}
// makeBees(opts): busy swarm around anchors (hives, flowers). cluster groups them. ~70 triangles each.
export function makeBees(opts = {}) {
  const rng = rngOf(opts);
  return makeInsects(beeGeometry({ len: opts.length ?? 0.05, yellow: opts.yellow, black: opts.black }), opts, rng, { count: 90, size: 1, motion: 0, roam: [1.1, 0.6, 2.4, 0.06], flap: [38, 0.7, 0.25, 0], self: 0.08, level: 0.4, spec: 0.6, thinAlpha: 0.5, trans: 1.2, vivid: 0.5, altitude: [0.4, 2], lift: [-3, 1.5], spread: 9, clear: 2, cluster: 9 });
}

// ---------- fireflies ----------
const FIREFLY_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec4 iA; attribute vec4 iB;
uniform float uTime, uSize, uMinPx; uniform vec4 uRoam, uBlink; uniform vec2 uNearF;
varying vec2 vP; varying float vI, vMix;
vec3 h31(float n){ return fract(sin(vec3(n*127.1, n*269.5+1.7, n*419.2+3.1))*43758.5453); }
void main(){
  vec3 h = h31(iB.z); float t = uTime * uRoam.z * (.5 + h.x);
  vec3 o = vec3(sin(t + h.y * 6.283) + .5 * sin(t * 2.1 + h.z * 9.), .7 * sin(t * 1.3 + h.x * 20.) + .3 * sin(t * 2.9 + h.y * 4.), cos(t * .8 + h.z * 6.283) + .5 * sin(t * 1.7 + h.x * 5.)) * vec3(uRoam.x, uRoam.y, uRoam.x) * .6;
  o += uRoam.w * vec3(sin(uTime * 5. * (.6 + h.z) + h.x * 30.), sin(uTime * 6. * (.6 + h.x) + h.y * 30.), 0.);
  float ph = uTime * uBlink.x * mix(.7 + .6 * h.y, 1., uBlink.z) * 6.2832 + mix(iA.w * 6.2832, dot(iA.xz, vec2(.05, .03)), uBlink.z);
  float b = max(pow(max(sin(ph), 0.), mix(1., 7., uBlink.y)), uBlink.w);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(iA.xyz + o, 1.);
  float dist = -mvPosition.z, want = uSize * iB.x, sz = max(want, dist * uMinPx);
  mvPosition.xy += position.xy * sz;
  gl_Position = projectionMatrix * mvPosition;
  vP = position.xy; vI = b * (want * want) / (sz * sz) * smoothstep(uNearF.x, uNearF.y, dist); vMix = iB.y;
  #include <fog_vertex>
}`;
const FIREFLY_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uColorA, uColorB; uniform float uCore, uHalo; varying vec2 vP; varying float vI, vMix;
void main(){
  float r2 = dot(vP, vP); if(r2 > 1.) discard;
  float core = exp(-r2 * 60.), halo = exp(-r2 * 5.) * (1. - r2);
  vec3 c = mix(uColorA, uColorB, vMix) * (core * uCore + halo * uHalo) * vI;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
    c *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
    c *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(c, 1.);
}`;
// makeFireflies(opts): drifting, blinking glow sprites (additive HDR). 2 triangles each, 1 draw call.
export function makeFireflies(opts = {}) {
  const rng = rngOf(opts), count = Math.max(1, Math.floor(opts.count ?? 350));
  const anchors = scatterAnchors(opts, rng, count, { altitude: [0.3, 4], lift: [-5, 4], spread: 26, clear: 1.5, radius: 25 });
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { iA.set([anchors[i * 3], anchors[i * 3 + 1], anchors[i * 3 + 2], rng()], i * 4); iB.set([rng.range(0.6, 1.5), rng() < (opts.mix ?? 0.25) ? rng() : 0, rng() * 100, 0], i * 4); }
  const g = new THREE.InstancedBufferGeometry(), quad = new THREE.PlaneGeometry(2, 2);
  g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = count;
  const roam = opts.roam || [2.2, 1.0, 0.35, 0.05];
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uSize: { value: opts.size ?? 0.16 }, uMinPx: { value: opts.minPixel ?? 0.0022 },
    uRoam: { value: new THREE.Vector4(roam[0], roam[1], roam[2], roam[3]) }, uBlink: { value: new THREE.Vector4(opts.blink ?? 0.32, opts.sharpness ?? 0.5, opts.sync ?? 0, opts.floor ?? 0.04) },
    uColorA: { value: col(opts.color ?? '#d8ff5a') }, uColorB: { value: col(opts.color2 ?? '#ffb040') }, uNearF: { value: new THREE.Vector2(...(opts.nearFade || [1.5, 4])) }, uCore: { value: opts.core ?? 9 }, uHalo: { value: opts.halo ?? 1.4 } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: FIREFLY_VERT, fragmentShader: FIREFLY_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sphere = sphereOfPoints(anchors, 3, count, Math.hypot(roam[0], roam[1], roam[0]) + 1); g.boundingSphere = sphere;
  const object = new THREE.Mesh(g, material); object.frustumCulled = true; object.renderOrder = 3;
  return { object, material, uniforms, geometry: g, count, anchors, bounds: sphere, triangles: count * 2, update(dt, time) { uniforms.uTime.value = time; }, setLight() {},
    positionAt(time, pu, out = new THREE.Vector3()) { return out.set(anchors[0], anchors[1], anchors[2]); } };
}
